// Supabase Edge Function for Agora Token Generation
// Compatible with Deno runtime and Flutter applications

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Agora Token Generation Implementation
// Based on official Agora token generation algorithm

// Global declarations for Supabase Edge Runtime
declare const serve: (handler: (req: Request) => Response | Promise<Response>) => void
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

// Constants and utilities
const VERSION = "006"

// Agora Roles
const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2
}

const RtmRole = {
  Rtm_User: 1
}

// Privileges
const Privileges = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
  kRtmLogin: 1000
}

// CRC32 implementation for Deno
function crc32(data: string): number {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  let crc = 0xFFFFFFFF
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data.charCodeAt(i)) & 0xFF] ^ (crc >>> 8)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// HMAC-SHA256 implementation using Web Crypto API
async function hmacSha256(key: string, message: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(signature)
}

// ByteBuf implementation for packing data
class ByteBuf {
  private buffer: Uint8Array
  private position: number

  constructor() {
    this.buffer = new Uint8Array(1024)
    this.position = 0
  }

  pack(): Uint8Array {
    return this.buffer.slice(0, this.position)
  }

  putUint16(value: number): ByteBuf {
    const view = new DataView(this.buffer.buffer)
    view.setUint16(this.position, value, true) // little endian
    this.position += 2
    return this
  }

  putUint32(value: number): ByteBuf {
    const view = new DataView(this.buffer.buffer)
    view.setUint32(this.position, value, true) // little endian
    this.position += 4
    return this
  }

  putBytes(bytes: Uint8Array): ByteBuf {
    this.putUint16(bytes.length)
    this.buffer.set(bytes, this.position)
    this.position += bytes.length
    return this
  }

  putString(str: string): ByteBuf {
    const encoder = new TextEncoder()
    return this.putBytes(encoder.encode(str))
  }

  putTreeMapUInt32(map: Record<number, number>): ByteBuf {
    const keys = Object.keys(map).map(Number)
    this.putUint16(keys.length)

    for (const key of keys) {
      this.putUint16(key)
      this.putUint32(map[key])
    }
    return this
  }
}

// AccessToken class
class AccessToken {
  private appID: string
  private appCertificate: string
  private channelName: string
  private uid: string
  private messages: Record<number, number>
  private salt: number
  private ts: number

  constructor(appID: string, appCertificate: string, channelName: string, uid: string | number) {
    this.appID = appID
    this.appCertificate = appCertificate
    this.channelName = channelName
    this.messages = {}
    this.salt = Math.floor(Math.random() * 0xFFFFFFFF)
    this.ts = Math.floor(Date.now() / 1000) + 24 * 3600
    this.uid = uid === 0 ? "" : String(uid)
  }

  addPrivilege(privilege: number, expireTimestamp: number): void {
    this.messages[privilege] = expireTimestamp
  }

  async build(): Promise<string> {
    const messageBuffer = this.packMessage()

    const encoder = new TextEncoder()
    const toSign = new Uint8Array([
      ...encoder.encode(this.appID),
      ...encoder.encode(this.channelName),
      ...encoder.encode(this.uid),
      ...messageBuffer
    ])

    const signature = await hmacSha256(this.appCertificate, toSign)

    const crcChannel = crc32(this.channelName)
    const crcUid = crc32(this.uid)

    const content = this.packContent(signature, crcChannel, crcUid, messageBuffer)

    return VERSION + this.appID + btoa(String.fromCharCode(...content))
  }

  private packMessage(): Uint8Array {
    const buf = new ByteBuf()
    return buf
      .putUint32(this.salt)
      .putUint32(this.ts)
      .putTreeMapUInt32(this.messages)
      .pack()
  }

  private packContent(signature: Uint8Array, crcChannel: number, crcUid: number, messageBuffer: Uint8Array): Uint8Array {
    const buf = new ByteBuf()
    return buf
      .putBytes(signature)
      .putUint32(crcChannel)
      .putUint32(crcUid)
      .putBytes(messageBuffer)
      .pack()
  }
}

// RTC Token Builder
class RtcTokenBuilder {
  static async buildTokenWithUid(
    appID: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    role: number,
    privilegeExpiredTs: number
  ): Promise<string> {
    return this.buildTokenWithAccount(appID, appCertificate, channelName, uid, role, privilegeExpiredTs)
  }

  static async buildTokenWithAccount(
    appID: string,
    appCertificate: string,
    channelName: string,
    account: string | number,
    role: number,
    privilegeExpiredTs: number
  ): Promise<string> {
    const key = new AccessToken(appID, appCertificate, channelName, account)
    key.addPrivilege(Privileges.kJoinChannel, privilegeExpiredTs)

    if (role === RtcRole.PUBLISHER) {
      key.addPrivilege(Privileges.kPublishAudioStream, privilegeExpiredTs)
      key.addPrivilege(Privileges.kPublishVideoStream, privilegeExpiredTs)
      key.addPrivilege(Privileges.kPublishDataStream, privilegeExpiredTs)
    }

    return key.build()
  }
}

// RTM Token Builder
class RtmTokenBuilder {
  static async buildToken(
    appID: string,
    appCertificate: string,
    account: string,
    _role: number,
    privilegeExpiredTs: number
  ): Promise<string> {
    const key = new AccessToken(appID, appCertificate, account, "")
    key.addPrivilege(Privileges.kRtmLogin, privilegeExpiredTs)
    return key.build()
  }
}

interface TokenRequest {
  channelName: string
  uid: number | string
  role: number // 1 = publisher, 2 = subscriber
  expireTime?: number // Optional, defaults to 3600 seconds
  tokenType?: 'rtc' | 'rtm' | 'both' // Optional, defaults to 'rtc'
}

interface TokenResponse {
  token?: string
  rtcToken?: string
  rtmToken?: string
  expireTime: number
  channelName: string
  uid: number | string
  role: number
  timestamp: number
}

interface ErrorResponse {
  error: string
  message: string
  timestamp: number
}

/**
 * Validates the incoming request parameters
 */
function validateRequest(data: any): { isValid: boolean; error?: string } {
  if (!data.channelName || typeof data.channelName !== 'string') {
    return { isValid: false, error: 'channelName is required and must be a string' }
  }

  if (data.uid === undefined || data.uid === null) {
    return { isValid: false, error: 'uid is required' }
  }

  if (typeof data.uid !== 'number' && typeof data.uid !== 'string') {
    return { isValid: false, error: 'uid must be a number or string' }
  }

  if (!data.role || (data.role !== 1 && data.role !== 2)) {
    return { isValid: false, error: 'role is required and must be 1 (publisher) or 2 (subscriber)' }
  }

  if (data.expireTime && (typeof data.expireTime !== 'number' || data.expireTime <= 0)) {
    return { isValid: false, error: 'expireTime must be a positive number' }
  }

  if (data.tokenType && !['rtc', 'rtm', 'both'].includes(data.tokenType)) {
    return { isValid: false, error: 'tokenType must be "rtc", "rtm", or "both"' }
  }

  return { isValid: true }
}

/**
 * Generates RTC token for video/audio communication
 */
async function generateRTCToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number | string,
  role: number,
  expireTime: number
): Promise<string> {
  const currentTime = Math.floor(Date.now() / 1000)
  const privilegeExpireTime = currentTime + expireTime

  const rtcRole = role === 1 ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER

  if (typeof uid === 'string') {
    return await RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpireTime
    )
  } else {
    return await RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpireTime
    )
  }
}

/**
 * Generates RTM token for real-time messaging
 */
async function generateRTMToken(
  appId: string,
  appCertificate: string,
  uid: number | string,
  expireTime: number
): Promise<string> {
  const currentTime = Math.floor(Date.now() / 1000)
  const privilegeExpireTime = currentTime + expireTime

  return await RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    uid.toString(),
    RtmRole.Rtm_User,
    privilegeExpireTime
  )
}

/**
 * Main handler function for the Edge Function
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
          message: 'Only POST requests are allowed',
          timestamp: Date.now()
        } as ErrorResponse),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID')
    const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE')

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('Missing Agora credentials in environment variables')
      return new Response(
        JSON.stringify({
          error: 'Server configuration error',
          message: 'Agora credentials not configured',
          timestamp: Date.now()
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let requestData: TokenRequest
    try {
      requestData = await req.json()
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON',
          timestamp: Date.now()
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate request
    const validation = validateRequest(requestData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          message: validation.error!,
          timestamp: Date.now()
        } as ErrorResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set default values
    const expireTime = requestData.expireTime || 3600 // Default 1 hour
    const tokenType = requestData.tokenType || 'rtc'

    // Generate tokens based on type
    const response: TokenResponse = {
      expireTime,
      channelName: requestData.channelName,
      uid: requestData.uid,
      role: requestData.role,
      timestamp: Date.now()
    }

    try {
      if (tokenType === 'rtc' || tokenType === 'both') {
        const rtcToken = await generateRTCToken(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          requestData.channelName,
          requestData.uid,
          requestData.role,
          expireTime
        )

        if (tokenType === 'rtc') {
          response.token = rtcToken
        } else {
          response.rtcToken = rtcToken
        }
      }

      if (tokenType === 'rtm' || tokenType === 'both') {
        const rtmToken = await generateRTMToken(
          AGORA_APP_ID,
          AGORA_APP_CERTIFICATE,
          requestData.uid,
          expireTime
        )

        if (tokenType === 'rtm') {
          response.token = rtmToken
        } else {
          response.rtmToken = rtmToken
        }
      }

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (tokenError) {
      console.error('Token generation error:', tokenError)
      return new Response(
        JSON.stringify({
          error: 'Token generation failed',
          message: 'Failed to generate Agora token',
          timestamp: Date.now()
        } as ErrorResponse),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: Date.now()
      } as ErrorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
