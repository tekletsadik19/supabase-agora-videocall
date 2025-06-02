# PowerShell script to test Agora Token Generation Edge Function
# This script tests the REST API endpoints

$SUPABASE_URL = "https://oqzjoygeizegfqhbpcfa.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xempveWdlaXplZ2ZxaGJwY2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1OTI5MDAsImV4cCI6MjAzMTE2ODkwMH0.Ej8JgUgbEKKHhAXtKQJOuQhDUujqfbWersKJwPf6oQs"
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/generate-agora-token"

Write-Host "🧪 Testing Agora Token Generation Edge Function..." -ForegroundColor Green
Write-Host "📍 URL: $FUNCTION_URL" -ForegroundColor Blue
Write-Host ""

# Headers for the request
$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Test 1: RTC Token Generation
Write-Host "📹 Test 1: RTC Token Generation" -ForegroundColor Yellow
$body1 = @{
    channelName = "test-channel"
    uid = 12345
    role = 1
    expireTime = 3600
    tokenType = "rtc"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $body1
    Write-Host "✅ RTC Token generated successfully!" -ForegroundColor Green
    Write-Host "Token: $($response1.token.Substring(0, [Math]::Min(20, $response1.token.Length)))..." -ForegroundColor White
    Write-Host "Channel: $($response1.channelName)" -ForegroundColor White
    Write-Host "UID: $($response1.uid)" -ForegroundColor White
    Write-Host "Role: $($response1.role)" -ForegroundColor White
    Write-Host "Expire Time: $($response1.expireTime) seconds" -ForegroundColor White
} catch {
    Write-Host "❌ RTC Token generation failed:" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Combined Token Generation
Write-Host "🔄 Test 2: Combined Token Generation (RTC + RTM)" -ForegroundColor Yellow
$body2 = @{
    channelName = "test-channel-combined"
    uid = 67890
    role = 1
    expireTime = 7200
    tokenType = "both"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $body2
    Write-Host "✅ Combined tokens generated successfully!" -ForegroundColor Green
    Write-Host "RTC Token: $($response2.rtcToken.Substring(0, [Math]::Min(20, $response2.rtcToken.Length)))..." -ForegroundColor White
    Write-Host "RTM Token: $($response2.rtmToken.Substring(0, [Math]::Min(20, $response2.rtmToken.Length)))..." -ForegroundColor White
    Write-Host "Channel: $($response2.channelName)" -ForegroundColor White
    Write-Host "UID: $($response2.uid)" -ForegroundColor White
    Write-Host "Role: $($response2.role)" -ForegroundColor White
    Write-Host "Expire Time: $($response2.expireTime) seconds" -ForegroundColor White
} catch {
    Write-Host "❌ Combined token generation failed:" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: RTM Token Only
Write-Host "💬 Test 3: RTM Token Generation" -ForegroundColor Yellow
$body3 = @{
    channelName = "test-rtm-channel"
    uid = "user123"
    role = 1
    expireTime = 3600
    tokenType = "rtm"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $body3
    Write-Host "✅ RTM Token generated successfully!" -ForegroundColor Green
    Write-Host "Token: $($response3.token.Substring(0, [Math]::Min(20, $response3.token.Length)))..." -ForegroundColor White
    Write-Host "Channel: $($response3.channelName)" -ForegroundColor White
    Write-Host "UID: $($response3.uid)" -ForegroundColor White
    Write-Host "Role: $($response3.role)" -ForegroundColor White
    Write-Host "Expire Time: $($response3.expireTime) seconds" -ForegroundColor White
} catch {
    Write-Host "❌ RTM Token generation failed:" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 4: Error Handling - Invalid Parameters
Write-Host "⚠️  Test 4: Error Handling - Invalid Parameters" -ForegroundColor Yellow
$body4 = @{
    channelName = ""  # Invalid empty channel name
    uid = 12345
    role = 3  # Invalid role
    tokenType = "rtc"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $body4
    Write-Host "❌ Error handling failed - should have returned an error" -ForegroundColor Red
} catch {
    Write-Host "✅ Error handling works correctly!" -ForegroundColor Green
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor White
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $errorData = $responseBody | ConvertFrom-Json
        Write-Host "Error: $($errorData.error)" -ForegroundColor White
        Write-Host "Message: $($errorData.message)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🏁 Testing completed!" -ForegroundColor Green
