# Agora Token Generation Edge Function - Deployment Guide

This guide will walk you through deploying the Agora token generation Edge Function to your Supabase project.

## Prerequisites

1. **Supabase CLI installed** - [Installation Guide](https://supabase.com/docs/guides/cli)
2. **Agora Account** - [Sign up at Agora.io](https://www.agora.io/)
3. **Agora App ID and Certificate** - From your Agora Console

## Step 1: Get Your Agora Credentials

1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project or select an existing one
3. Copy your **App ID** and **App Certificate**

## Step 2: Set Up Environment Variables

Set your Agora credentials as Supabase secrets:

```bash
# Set Agora App ID
supabase secrets set AGORA_APP_ID=your_actual_agora_app_id_here

# Set Agora App Certificate  
supabase secrets set AGORA_APP_CERTIFICATE=your_actual_agora_app_certificate_here
```

**Example:**
```bash
supabase secrets set AGORA_APP_ID=ca35e3b3acd1e2b6aae28a9d
supabase secrets set AGORA_APP_CERTIFICATE=5CFd2fd1755d40ecb72977518be15d3b
```

## Step 3: Link Your Supabase Project

If you haven't already linked your project:

```bash
# Link to your Supabase project
supabase link --project-ref oqzjoygeizegfqhbpcfa

# Login if needed
supabase login
```

## Step 4: Deploy the Function

Deploy the Agora token generation function:

```bash
# Deploy the function
supabase functions deploy generate-agora-token

# Verify deployment
supabase functions list
```

## Step 5: Test the Function

### Option 1: Using the Test Script

1. Update the `SUPABASE_ANON_KEY` in `test-agora-function.js` with your actual anon key
2. Run the test:

```bash
node test-agora-function.js
```

### Option 2: Using curl

```bash
# Test RTC token generation
curl -X POST 'https://oqzjoygeizegfqhbpcfa.supabase.co/functions/v1/generate-agora-token' \
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

### Option 3: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `generate-agora-token`
4. Use the test interface with this payload:

```json
{
  "channelName": "test-channel",
  "uid": 12345,
  "role": 1,
  "expireTime": 3600,
  "tokenType": "rtc"
}
```

## Step 6: Get Your Function URL

Your function will be available at:
```
https://oqzjoygeizegfqhbpcfa.supabase.co/functions/v1/generate-agora-token
```

## Troubleshooting

### Common Issues

1. **"Agora credentials not configured"**
   - Make sure you've set the secrets correctly
   - Verify with: `supabase secrets list`

2. **"Function not found"**
   - Ensure the function is deployed: `supabase functions list`
   - Check the function name is correct

3. **"Invalid JSON" errors**
   - Ensure your request body is valid JSON
   - Check Content-Type header is set to `application/json`

4. **CORS errors**
   - The function includes CORS headers
   - Make sure you're sending the Authorization header

### Verify Secrets

```bash
# List all secrets (values will be hidden)
supabase secrets list

# If you need to update a secret
supabase secrets set AGORA_APP_ID=new_value
```

### Check Function Logs

```bash
# View function logs
supabase functions logs generate-agora-token

# Follow logs in real-time
supabase functions logs generate-agora-token --follow
```

## Next Steps

1. **Integrate with Flutter** - Use the provided Flutter code examples in the README
2. **Add Authentication** - Consider adding user authentication for production
3. **Monitor Usage** - Set up monitoring and logging
4. **Rate Limiting** - Implement rate limiting for production use

## Security Notes

- ✅ App Certificate is securely stored as a Supabase secret
- ✅ Function includes CORS headers for web/mobile access
- ✅ Input validation prevents malformed requests
- ✅ Error handling doesn't expose sensitive information

## Support

If you encounter issues:

1. Check the function logs: `supabase functions logs generate-agora-token`
2. Verify your Agora credentials in the Agora Console
3. Test with the provided test script
4. Check the Supabase Dashboard for any error messages

## Function Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/functions/v1/generate-agora-token` | Generate Agora tokens |
| OPTIONS | `/functions/v1/generate-agora-token` | CORS preflight |

## Example Responses

### Successful RTC Token Response
```json
{
  "token": "006abc123def456...",
  "expireTime": 3600,
  "channelName": "test-channel",
  "uid": 12345,
  "role": 1,
  "timestamp": 1640995200000
}
```

### Error Response
```json
{
  "error": "Validation error",
  "message": "channelName is required and must be a string",
  "timestamp": 1640995200000
}
```
