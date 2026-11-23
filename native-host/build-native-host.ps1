$ErrorActionPreference = 'Stop'
$node = (Get-Command node -ErrorAction Stop).Source
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dist = Join-Path $PSScriptRoot 'dist'
$config = Join-Path $PSScriptRoot 'sea-config.json'
$blob = Join-Path $dist 'tokopedia-file-helper.blob'
$exe = Join-Path $dist 'tokopedia-file-helper.exe'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Remove-Item $blob -Force -ErrorAction SilentlyContinue
Remove-Item $exe -Force -ErrorAction SilentlyContinue
& $node --experimental-sea-config $config
if (-not (Test-Path $blob)) { throw "SEA blob tidak dibuat: $blob" }
Copy-Item $node $exe
$postject = Join-Path $root 'node_modules\postject\dist\cli.js'
if (-not (Test-Path $postject)) { throw "postject tidak ditemukan. Jalankan: npm install --save-dev postject" }
& $node $postject $exe NODE_SEA_BLOB $blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --overwrite
if ($LASTEXITCODE -ne 0) { throw "Embedding SEA blob gagal dengan exit code $LASTEXITCODE" }
Remove-Item $blob -Force
Write-Host "Built: $exe"
