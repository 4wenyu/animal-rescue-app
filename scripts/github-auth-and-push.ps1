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

# Disable every credential helper so GCM cannot pop up and override.
# Do NOT set GIT_CURL_VERBOSE - any value turns on noisy curl logs, and
# PowerShell then treats those stderr lines as terminating errors under Stop.
$env:GIT_TERMINAL_PROMPT = "0"
Remove-Item Env:GIT_CURL_VERBOSE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_TRACE -ErrorAction SilentlyContinue
Remove-Item Env:GIT_TRACE_CURL -ErrorAction SilentlyContinue

function Invoke-GitAuth {
  param(
    [string]$AuthBasic,
    [string[]]$GitArgs
  )

  # Run via cmd redirect so PowerShell does not abort on git stderr.
  $log = [IO.Path]::GetTempFileName()
  $full = @(
    "-c", "credential.helper=",
    "-c", "http.https://github.com/.extraheader=AUTHORIZATION: basic $AuthBasic",
    "-c", "http.version=HTTP/1.1"
  ) + $GitArgs
  $quoted = ($full | ForEach-Object { '"' + ($_ -replace '"', '\"') + '"' }) -join " "
  cmd.exe /c "git $quoted > `"$log`" 2>&1" | Out-Null
  $exit = $LASTEXITCODE
  $text = ""
  if (Test-Path $log) {
    $text = Get-Content $log -Raw -ErrorAction SilentlyContinue
    if ($null -eq $text) { $text = "" }
    Remove-Item $log -Force -ErrorAction SilentlyContinue
  }
  return @{ Code = $exit; Text = $text }
}

$maxAttempts = 3
$code = 1
$errText = ""
for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  Write-Host ""
  Write-Host "Pushing (attempt $attempt/$maxAttempts, credential helper disabled)..." -ForegroundColor Cyan

  # Push via remote name "origin" so remote-tracking can update; URL-only
  # push leaves origin/main stale and status keeps saying "ahead N".
  $result = Invoke-GitAuth -AuthBasic $basic -GitArgs @("push", "origin", "HEAD:main")
  $code = $result.Code
  $errText = $result.Text
  if ($errText.Trim()) {
    Write-Host $errText.Trim()
  }
  if ($code -eq 0) { break }

  $isNetwork =
    $errText -match "Connection was reset|Recv failure|Failed to connect|Could not resolve|timed out|SSL_|TLS|Empty reply"
  if (-not $isNetwork -or $attempt -eq $maxAttempts) { break }

  Write-Host "Network blip - retrying in 2s..." -ForegroundColor Yellow
  Start-Sleep -Seconds 2
}

if ($code -eq 0) {
  # "Everything up-to-date" still leaves a stale origin/main if a prior
  # URL-only push already landed the tip. Fetch to sync the tracking ref.
  Write-Host "Syncing origin/main tracking ref..." -ForegroundColor Cyan
  $fetch = Invoke-GitAuth -AuthBasic $basic -GitArgs @("fetch", "origin", "main:refs/remotes/origin/main")
  if ($fetch.Text.Trim()) {
    Write-Host $fetch.Text.Trim()
  }
  if ($fetch.Code -ne 0) {
    # Fallback: if fetch fails but push said OK, point tracking at HEAD.
    git update-ref refs/remotes/origin/main HEAD
    Write-Host "(fetch failed; set origin/main = HEAD locally)" -ForegroundColor Yellow
  }
}

# Clear secrets from process memory as best-effort
$token = $null
$basic = $null
$secure = $null
[GC]::Collect()

if ($code -ne 0) {
  Write-Host ""
  if ($errText -match "Connection was reset|Recv failure|Failed to connect|Could not resolve|timed out|SSL_|TLS|Empty reply") {
    Write-Host "This looks like a NETWORK drop to GitHub, not a bad PAT." -ForegroundColor Yellow
    Write-Host "  1) Run the script again (often works on retry)"
    Write-Host "  2) Toggle VPN / corporate proxy / antivirus HTTPS scan off for a minute"
    Write-Host "  3) Or push over SSH: git remote set-url origin git@github.com:4wenyu/animal-rescue-app.git"
  }
  elseif ($errText -match "Authentication failed|Invalid username|403|401|Permission denied") {
    Write-Host "Auth failed. Check the PAT:" -ForegroundColor Yellow
    Write-Host "  1) Classic token with 'repo', or fine-grained Contents: Read and write on this repo"
    Write-Host "  2) Token belongs to 4wenyu (or a collaborator with write)"
    Write-Host "Create classic: https://github.com/settings/tokens"
  }
  else {
    Write-Host "Push failed (exit $code)." -ForegroundColor Yellow
    Write-Host "  - Network: retry / VPN off"
    Write-Host "  - Auth: recreate PAT with repo scope"
  }
  throw "git push failed (exit $code)"
}

$head = (git rev-parse --short HEAD).Trim()
$origin = (git rev-parse --short origin/main).Trim()
git status -sb
Write-Host ""
if ($head -eq $origin) {
  Write-Host "OK: local main ($head) matches origin/main." -ForegroundColor Green
}
else {
  Write-Host "WARNING: HEAD=$head but origin/main=$origin - tracking still out of sync." -ForegroundColor Yellow
  throw "tracking ref mismatch after push"
}
