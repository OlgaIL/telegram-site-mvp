$Root = Split-Path -Parent $PSScriptRoot

Start-Process -FilePath "npm.cmd" -ArgumentList "run dev:api" -WorkingDirectory $Root
Start-Process -FilePath "npm.cmd" -ArgumentList "run dev:client" -WorkingDirectory $Root

Write-Host "Started API on http://localhost:3000"
Write-Host "Started client on http://localhost:3001"
Write-Host "Close the opened npm windows to stop the dev servers."
