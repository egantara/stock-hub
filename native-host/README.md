# Stock-Hub Tokopedia Native Helper

Install once in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\native-host\install-firefox.ps1
```

Restarting Windows does not require reinstalling. Firefox starts the helper automatically during Tokopedia Sync. The installer registers the manifest both in the standard AppData location and in the current-user Firefox registry key, which is required by Firefox on Windows.

Requirements:

- Node.js installed and available as `node` in PowerShell.
- Firefox extension ID: `stock-hub-sync@extension.local`.
- Extension reloaded after installation.

The installer writes the Native Messaging manifest as UTF-8 without a BOM, which is required by Firefox. The helper reads only the expected CSV from the current user's `Downloads` directory. It does not read cookies, browser profiles, or marketplace sessions.
