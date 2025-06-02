// Test script for Agora Token Generation Edge Function
// Run this after deploying the function to test it

const SUPABASE_URL = 'https://oqzjoygeizegfqhbpcfa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xempveWdlaXplZ2ZxaGJwY2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1OTI5MDAsImV4cCI6MjAzMTE2ODkwMH0.Ej8JgUgbEKKHhAXtKQJOuQhDUujqfbWersKJwPf6oQs' // Your actual anon key

async function testAgoraTokenGeneration() {
  console.log('🧪 Testing Agora Token Generation Edge Function...\n')

  // Test 1: RTC Token Generation
  console.log('📹 Test 1: RTC Token Generation')
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName: 'test-channel',
        uid: 12345,
        role: 1, // Publisher
        expireTime: 3600,
        tokenType: 'rtc'
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ RTC Token generated successfully!')
      console.log('Token:', data.token?.substring(0, 20) + '...')
      console.log('Channel:', data.channelName)
      console.log('UID:', data.uid)
      console.log('Role:', data.role)
      console.log('Expire Time:', data.expireTime, 'seconds\n')
    } else {
      console.log('❌ RTC Token generation failed:')
      console.log('Error:', data.error)
      console.log('Message:', data.message, '\n')
    }
  } catch (error) {
    console.log('❌ Network error:', error.message, '\n')
  }

  // Test 2: Combined Token Generation
  console.log('🔄 Test 2: Combined Token Generation (RTC + RTM)')
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName: 'test-channel-combined',
        uid: 67890,
        role: 1, // Publisher
        expireTime: 7200,
        tokenType: 'both'
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Combined tokens generated successfully!')
      console.log('RTC Token:', data.rtcToken?.substring(0, 20) + '...')
      console.log('RTM Token:', data.rtmToken?.substring(0, 20) + '...')
      console.log('Channel:', data.channelName)
      console.log('UID:', data.uid)
      console.log('Role:', data.role)
      console.log('Expire Time:', data.expireTime, 'seconds\n')
    } else {
      console.log('❌ Combined token generation failed:')
      console.log('Error:', data.error)
      console.log('Message:', data.message, '\n')
    }
  } catch (error) {
    console.log('❌ Network error:', error.message, '\n')
  }

  // Test 3: Error Handling - Invalid Parameters
  console.log('⚠️  Test 3: Error Handling - Invalid Parameters')
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-agora-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName: '', // Invalid empty channel name
        uid: 12345,
        role: 3, // Invalid role
        tokenType: 'rtc'
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.log('✅ Error handling works correctly!')
      console.log('Status:', response.status)
      console.log('Error:', data.error)
      console.log('Message:', data.message, '\n')
    } else {
      console.log('❌ Error handling failed - should have returned an error\n')
    }
  } catch (error) {
    console.log('❌ Network error:', error.message, '\n')
  }

  console.log('🏁 Testing completed!')
}

// Run the tests
testAgoraTokenGeneration()
