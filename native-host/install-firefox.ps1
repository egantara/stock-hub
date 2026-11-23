$ErrorActionPreference = 'Stop'
$hostName = 'com.stockhub.tokopedia'
$node = (Get-Command node -ErrorAction Stop).Source
$helper = (Resolve-Path (Join-Path $PSScriptRoot 'tokopedia-file-helper.js')).Path
$manifestDir = Join-Path $env:APPDATA 'Mozilla\NativeMessagingHosts'
New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
$manifestPath = Join-Path $manifestDir "$hostName.json"
$registryPath = "HKCU:\Software\Mozilla\NativeMessagingHosts\$hostName"
$manifest = [ordered]@{
  name = $hostName
  description = 'Stock-Hub Tokopedia report file reader'
  path = $node
  args = @($helper)
  type = 'stdio'
  allowed_extensions = @('stock-hub-sync@extension.local')
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $manifestPath
New-Item -Path $registryPath -Force | Out-Null
Set-ItemProperty -Path $registryPath -Name '(default)' -Value $manifestPath
Write-Host "Installed $hostName"
Write-Host "Node: $node"
Write-Host "Helper: $helper"
Write-Host "Manifest: $manifestPath"
Write-Host "Registry: $registryPath"
