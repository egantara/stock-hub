$ErrorActionPreference = 'Stop'
$hostName = 'com.stockhub.tokopedia'
$node = (Get-Command node -ErrorAction Stop).Source
$helper = (Resolve-Path (Join-Path $PSScriptRoot 'tokopedia-file-helper.js')).Path
$exePath = Join-Path $PSScriptRoot 'dist\tokopedia-file-helper.exe'
if (-not (Test-Path $exePath)) { throw "Executable belum dibuat. Jalankan: .\native-host\build-native-host.ps1" }
$manifestDir = Join-Path $env:APPDATA 'Mozilla\NativeMessagingHosts'
New-Item -ItemType Directory -Force -Path $manifestDir | Out-Null
$manifestPath = Join-Path $manifestDir "$hostName.json"
$registryPaths = @(
  "HKCU:\Software\Mozilla\NativeMessagingHosts\$hostName",
  "HKCU:\Software\WOW6432Node\Mozilla\NativeMessagingHosts\$hostName"
)
$manifest = [ordered]@{
  name = $hostName
  description = 'Stock-Hub Tokopedia report file reader'
  path = $exePath
  type = 'stdio'
  allowed_extensions = @('stock-hub-sync@extension.local')
}
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[IO.File]::WriteAllText($manifestPath, $manifestJson, [Text.UTF8Encoding]::new($false))
foreach ($registryPath in $registryPaths) {
  New-Item -Path $registryPath -Force | Out-Null
  Set-ItemProperty -Path $registryPath -Name '(default)' -Value $manifestPath
}
Write-Host "Installed $hostName"
Write-Host "Node: $node"
Write-Host "Helper: $helper"
Write-Host "Manifest: $manifestPath"
Write-Host "Registry: $($registryPaths -join ', ')"
Write-Host "Manifest first bytes: $(([IO.File]::ReadAllBytes($manifestPath)[0..3] | ForEach-Object { $_.ToString('X2') }) -join ' ')"
