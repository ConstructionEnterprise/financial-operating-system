# Wires TiDB credentials into the environment (never written to disk here)
# and hands the setup task off to Claude Code.
#
# Usage (run from the repo root, in PowerShell):
#   1. Regenerate your TiDB password in the console first (the old one
#      was captured in a screenshot, so treat it as burned).
#   2. Place this script and fos-db-setup-task.md in the repo root
#      (...\financial-operating-system-master\financial-operating-system-master).
#   3. If needed: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   4. .\run-fos-setup.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Error "Claude Code CLI ('claude') not found on PATH. Install it first."
    exit 1
}

if (-not (Test-Path ".\package.json")) {
    Write-Error "Run this from the root of the financial-operating-system repo."
    exit 1
}

if (-not (Test-Path ".\fos-db-setup-task.md")) {
    Write-Error "fos-db-setup-task.md not found in this folder. Place it alongside this script."
    exit 1
}

$TIDB_HOST = Read-Host "TiDB HOST (e.g. gateway01.us-east-1.prod.aws.tidbcloud.com)"
$TIDB_USER = Read-Host "TiDB USERNAME (e.g. 3xQgHJBc33CCXZL.root)"
$securePassword = Read-Host "TiDB PASSWORD (input hidden, regenerated password)" -AsSecureString
$TIDB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

$env:TIDB_HOST = $TIDB_HOST
$env:TIDB_USER = $TIDB_USER
$env:TIDB_PASSWORD = $TIDB_PASSWORD

Write-Host ""
Write-Host "Handing off to Claude Code with fos-db-setup-task.md ..."
Write-Host ""

Get-Content .\fos-db-setup-task.md | claude --print --permission-mode acceptEdits

# Clear credentials from this session once Claude Code exits
Remove-Item Env:\TIDB_HOST -ErrorAction SilentlyContinue
Remove-Item Env:\TIDB_USER -ErrorAction SilentlyContinue
Remove-Item Env:\TIDB_PASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done. Check the output above for the dev server URL."
Write-Host "Remember: rotate the TiDB password again if it was ever pasted"
Write-Host "into a terminal you don't fully trust."
