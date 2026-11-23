$ErrorActionPreference = 'Stop'
$hostName = 'com.stockhub.tokopedia'
$node = (Get-Command node -ErrorAction Stop).Source
$helper = (Resolve-Path (Join-Path $PSScriptRoot 'tokopedia-file-helper.js')).Path
$manifestDir = Join-Path $env:APPDATA 'Mozilla\NativeMessagingHosts'
New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
$manifest = [ordered]@{
  name = $hostName
  description = 'Stock-Hub Tokopedia report file reader'
  path = $node
  type = 'stdio'
  allowed_extensions = @('stock-hub-sync@extension.local')
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $manifestDir "$hostName.json")
$helper | Out-Null
Write-Host "Installed $hostName"
Write-Host "Node: $node"
Write-Host "Helper: $helper"
Write-Host "Manifest: $(Join-Path $manifestDir "$hostName.json")"
