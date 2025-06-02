# Simple test for Agora token generation
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xempveWdlaXplZ2ZxaGJwY2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU1OTI5MDAsImV4cCI6MjAzMTE2ODkwMH0.Ej8JgUgbEKKHhAXtKQJOuQhDUujqfbWersKJwPf6oQs'
    'Content-Type' = 'application/json'
}

$body = @{
    channelName = "test-channel"
    uid = 12345
    role = 1
    expireTime = 3600
    tokenType = "rtc"
} | ConvertTo-Json

Write-Host "Testing Agora Token Generation..."
Write-Host "Request Body: $body"

try {
    $response = Invoke-RestMethod -Uri 'https://oqzjoygeizegfqhbpcfa.supabase.co/functions/v1/generate-agora-token' -Method POST -Headers $headers -Body $body
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}
