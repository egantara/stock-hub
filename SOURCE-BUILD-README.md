# Stock-Hub Sync Firefox Add-on Source

## Purpose

This archive contains the complete source used to build the submitted Firefox add-on. It contains no credentials, cookies, marketplace session data, or compiled native-host binary.

## Requirements

- Windows 10/11
- Node.js 20 LTS or newer (Node.js 22 LTS recommended)
- npm included with Node.js
- PowerShell 5.1 or newer
- Internet access for `npm ci`

## Build an exact Firefox add-on copy

From the repository root:

```powershell
npm ci
node build-firefox.js
```

The build script copies the source files from `extension/` into `extension-firefox/` and generates the Firefox Manifest V2 file, including the Firefox extension ID and data-collection declaration. No source JavaScript is transpiled, concatenated, minified, or obfuscated.

The generated add-on is the complete `extension-firefox/` directory. To create an upload archive with standard ZIP paths:

```powershell
python -c "import os,zipfile; root='extension-firefox'; out='stock-hub-sync-firefox.zip'; z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED); [z.write(os.path.join(base,n),os.path.relpath(os.path.join(base,n),root).replace(os.sep,'/')) for base,dirs,files in os.walk(root) for n in files]; z.close()"
```

Upload `stock-hub-sync-firefox.zip` to Mozilla Add-ons Developer Hub.

## Native messaging helper (Windows only)

The add-on can use the Native Messaging helper to read exact completed download files. Build it separately:

```powershell
npm ci
.\native-host\build-native-host.ps1
.\native-host\install-firefox.ps1
```

The native helper build uses Node.js Single Executable Applications and the pinned `postject` dependency from `package-lock.json`. The produced `.exe` is machine-specific build output and is not part of this source submission.

## Source layout

- `extension/` - handwritten extension source
- `build-firefox.js` - Firefox build script
- `native-host/` - Native Messaging helper source and Windows build/install scripts
- `package.json` / `package-lock.json` - exact build dependencies
- `SOURCE-BUILD-README.md` - these instructions

## Runtime privacy

The extension stores Stock-Hub settings locally in Firefox storage. It does not collect analytics or telemetry. It does not transmit marketplace cookies or browser session storage. The native helper reads only the exact file requested by the extension.
