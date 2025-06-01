# PowerShell script to deploy Agora Token Generation Edge Function
# Run this script to deploy the function to your Supabase project

Write-Host "🚀 Deploying Agora Token Generation Edge Function..." -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
Write-Host "🔐 Checking Supabase authentication..." -ForegroundColor Blue
try {
    $loginStatus = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not logged in to Supabase. Please login first:" -ForegroundColor Red
        Write-Host "   supabase login" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Authenticated with Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Authentication check failed. Please login:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

# Check if project is linked
Write-Host "🔗 Checking project link..." -ForegroundColor Blue
if (Test-Path ".\.supabase\config.toml") {
    Write-Host "✅ Project is linked" -ForegroundColor Green
} else {
    Write-Host "❌ Project not linked. Please link your project first:" -ForegroundColor Red
    Write-Host "   supabase link --project-ref oqzjoygeizegfqhbpcfa" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying generate-agora-token function..." -ForegroundColor Blue
try {
    supabase functions deploy generate-agora-token
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Function deployment failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Function deployment failed" -ForegroundColor Red
    exit 1
}

# List functions to verify
Write-Host ""
Write-Host "📋 Current functions:" -ForegroundColor Blue
supabase functions list

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set your Agora credentials as secrets:" -ForegroundColor White
Write-Host "   supabase secrets set AGORA_APP_ID=your_app_id" -ForegroundColor Gray
Write-Host "   supabase secrets set AGORA_APP_CERTIFICATE=your_app_certificate" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the function:" -ForegroundColor White
Write-Host "   node test-agora-function.js" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Your function URL:" -ForegroundColor White
Write-Host "   https://oqzjoygeizegfqhbpcfa.supabase.co/functions/v1/generate-agora-token" -ForegroundColor Gray
