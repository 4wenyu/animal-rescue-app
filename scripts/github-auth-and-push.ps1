# One-shot push to origin/main using an existing PAT.
# Bypasses Git Credential Manager (that second password popup was the bug).
# Run in YOUR terminal. Do not paste the PAT into Cursor chat.

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host ""
Write-Host "Paste PAT once (hidden). Use a classic token with 'repo', or fine-grained with Contents: Read and write on 4wenyu/animal-rescue-app." -ForegroundColor Cyan
Write-Host "If you typed your GitHub *account password* in the earlier popup, that fails - GitHub needs the PAT." -ForegroundColor Yellow
Write-Host ""

$secure = Read-Host -AsSecureString "GitHub PAT"
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Empty token - aborted."
}

# Basic auth: username x-access-token, password = PAT (GitHub standard)
$basic = [Convert]::ToBase64String(
  [Text.Encoding]::ASCII.GetBytes("x-access-token:$token")
)

# Disable every credential helper so GCM cannot pop up and override
$env:GIT_TERMINAL_PROMPT = "0"
Write-Host ""
Write-Host "Pushing (credential helper disabled)..." -ForegroundColor Cyan

git -c credential.helper= `
  -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $basic" `
  push https://github.com/4wenyu/animal-rescue-app.git HEAD:main

$code = $LASTEXITCODE
# Clear header from process env memory as best-effort
$token = $null
$basic = $null
$secure = $null
[GC]::Collect()

if ($code -ne 0) {
  Write-Host ""
  Write-Host "Still failing? Most likely:" -ForegroundColor Yellow
  Write-Host "  1) PAT expired or revoked - create a new classic token with 'repo' checked"
  Write-Host "  2) Fine-grained PAT missing this repo under Repository access"
  Write-Host "  3) Token belongs to a different GitHub user than 4wenyu"
  Write-Host "Create classic: https://github.com/settings/tokens (Generate new token - classic)"
  throw "git push failed (exit $code)"
}

git status -sb
Write-Host ""
Write-Host "Pushed. Local main should match origin/main." -ForegroundColor Green
