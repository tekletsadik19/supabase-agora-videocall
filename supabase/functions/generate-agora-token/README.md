# Agora Token Generation Edge Function

A secure Supabase Edge Function for generating Agora RTC and RTM tokens for Flutter video calling applications.

## Overview

This Edge Function provides server-side token generation for Agora applications, ensuring secure authentication for video calling, voice calling, and real-time messaging features. It's specifically designed to work with Flutter applications and follows Agora's security best practices.

## Features

- ✅ **RTC Token Generation** - For video/audio communication
- ✅ **RTM Token Generation** - For real-time messaging
- ✅ **Combined Token Generation** - Generate both tokens in a single request
- ✅ **Input Validation** - Comprehensive parameter validation
- ✅ **Error Handling** - Detailed error responses with proper HTTP status codes
- ✅ **CORS Support** - Full cross-origin support for Flutter apps
- ✅ **Security** - Credentials stored as Supabase secrets
- ✅ **TypeScript** - Full type safety and IntelliSense support

## API Specification

### Endpoint
```
POST /functions/v1/generate-agora-token
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <your-supabase-anon-key>
```

### Request Body

#### Basic RTC Token Request
```json
{
  "channelName": "my-video-channel",
  "uid": 12345,
  "role": 1,
  "expireTime": 3600,
  "tokenType": "rtc"
}
```

#### RTM Token Request
```json
{
  "channelName": "my-channel",
  "uid": "user123",
  "role": 1,
  "expireTime": 7200,
  "tokenType": "rtm"
}
```

#### Combined Token Request
```json
{
  "channelName": "my-channel",
  "uid": 12345,
  "role": 1,
  "expireTime": 3600,
  "tokenType": "both"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelName` | string | ✅ | The name of the Agora channel |
| `uid` | number/string | ✅ | User identifier (number for RTC, string for RTM) |
| `role` | number | ✅ | User role: `1` (publisher) or `2` (subscriber) |
| `expireTime` | number | ❌ | Token expiration time in seconds (default: 3600) |
| `tokenType` | string | ❌ | Token type: `"rtc"`, `"rtm"`, or `"both"` (default: "rtc") |

### Response Format

#### RTC Token Response
```json
{
  "token": "006abc123...",
  "expireTime": 3600,
  "channelName": "my-video-channel",
  "uid": 12345,
  "role": 1,
  "timestamp": 1640995200000
}
```

#### Combined Token Response
```json
{
  "rtcToken": "006abc123...",
  "rtmToken": "006def456...",
  "expireTime": 3600,
  "channelName": "my-channel",
  "uid": 12345,
  "role": 1,
  "timestamp": 1640995200000
}
```

#### Error Response
```json
{
  "error": "Validation error",
  "message": "channelName is required and must be a string",
  "timestamp": 1640995200000
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success - Token generated successfully |
| `400` | Bad Request - Invalid parameters or JSON |
| `405` | Method Not Allowed - Only POST requests accepted |
| `500` | Internal Server Error - Server configuration or token generation error |

## Environment Variables

The following environment variables must be configured in your Supabase project:

| Variable | Description | Example |
|----------|-------------|---------|
| `AGORA_APP_ID` | Your Agora App ID from Agora Console | `ca35e3b3acd1e2b6aae28a9d` |
| `AGORA_APP_CERTIFICATE` | Your Agora App Certificate from Agora Console | `5CFd2fd1755d40ecb72977518be15d3b` |

## Setup Instructions

### 1. Configure Environment Variables

Set up your Agora credentials as Supabase secrets:

```bash
# Using Supabase CLI
supabase secrets set AGORA_APP_ID=your_agora_app_id_here
supabase secrets set AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
```

### 2. Deploy the Function

```bash
# Deploy the function
supabase functions deploy generate-agora-token
```

### 3. Test the Function

```bash
# Test with curl
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/generate-agora-token' \
  -H 'Authorization: Bearer your-supabase-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "channelName": "test-channel",
    "uid": 12345,
    "role": 1,
    "expireTime": 3600,
    "tokenType": "rtc"
  }'
```

## Flutter Integration

### Installation

Add the HTTP package to your Flutter project:

```yaml
dependencies:
  http: ^1.1.0
```

### Usage Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AgoraTokenService {
  static const String _supabaseUrl = 'https://your-project-ref.supabase.co';
  static const String _supabaseAnonKey = 'your-supabase-anon-key';
  
  static Future<String> generateRTCToken({
    required String channelName,
    required int uid,
    required int role, // 1 for publisher, 2 for subscriber
    int expireTime = 3600,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_supabaseUrl/functions/v1/generate-agora-token'),
        headers: {
          'Authorization': 'Bearer $_supabaseAnonKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'channelName': channelName,
          'uid': uid,
          'role': role,
          'expireTime': expireTime,
          'tokenType': 'rtc',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['token'];
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Failed to generate token: ${error['message']}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<Map<String, String>> generateBothTokens({
    required String channelName,
    required int uid,
    required int role,
    int expireTime = 3600,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_supabaseUrl/functions/v1/generate-agora-token'),
        headers: {
          'Authorization': 'Bearer $_supabaseAnonKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'channelName': channelName,
          'uid': uid,
          'role': role,
          'expireTime': expireTime,
          'tokenType': 'both',
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'rtcToken': data['rtcToken'],
          'rtmToken': data['rtmToken'],
        };
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Failed to generate tokens: ${error['message']}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
```

### Usage in Flutter Widget

```dart
class VideoCallScreen extends StatefulWidget {
  @override
  _VideoCallScreenState createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> {
  String? _token;
  bool _isLoading = false;

  Future<void> _generateToken() async {
    setState(() => _isLoading = true);
    
    try {
      final token = await AgoraTokenService.generateRTCToken(
        channelName: 'my-video-channel',
        uid: 12345,
        role: 1, // Publisher
        expireTime: 3600,
      );
      
      setState(() {
        _token = token;
        _isLoading = false;
      });
      
      // Now use the token to join Agora channel
      // await _engine.joinChannel(token, 'my-video-channel', null, 12345);
      
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Video Call')),
      body: Center(
        child: _isLoading
            ? CircularProgressIndicator()
            : ElevatedButton(
                onPressed: _generateToken,
                child: Text('Generate Token & Join Call'),
              ),
      ),
    );
  }
}
```

## Security Considerations

1. **Never expose App Certificate**: The App Certificate should only be stored on the server
2. **Token Expiration**: Set appropriate expiration times for tokens
3. **Rate Limiting**: Consider implementing rate limiting for production use
4. **Authentication**: Add user authentication if needed for your use case
5. **HTTPS Only**: Always use HTTPS in production

## Troubleshooting

### Common Issues

1. **"Agora credentials not configured"**
   - Ensure `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set as Supabase secrets

2. **"Method not allowed"**
   - Ensure you're using POST method, not GET

3. **CORS errors**
   - The function includes proper CORS headers, but ensure your client is sending the correct headers

4. **Token generation failed**
   - Verify your Agora credentials are correct
   - Check that the uid format matches the token type (number for RTC, string for RTM)

### Testing with curl

```bash
# Test RTC token generation
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/generate-agora-token' \
  -H 'Authorization: Bearer your-supabase-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "channelName": "test-channel",
    "uid": 12345,
    "role": 1,
    "tokenType": "rtc"
  }'

# Test combined token generation
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/generate-agora-token' \
  -H 'Authorization: Bearer your-supabase-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "channelName": "test-channel",
    "uid": 12345,
    "role": 1,
    "tokenType": "both"
  }'
```

## License

This project is licensed under the MIT License.
