param(
    [Parameter(Mandatory = $true)]
    [string]$ManifestName
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$distributionDirectory = Join-Path $PWD 'dist'
$applicationPath = Join-Path $distributionDirectory 'win-unpacked\KatiesAmp.exe'
$manifestPath = Join-Path $distributionDirectory $ManifestName

if (-not (Test-Path -LiteralPath $applicationPath)) {
    throw "Packaged application not found at $applicationPath"
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Update manifest not found at $manifestPath"
}

$manifestPathEntry = Select-String -LiteralPath $manifestPath -Pattern '^path:\s*(.+)$' |
    Select-Object -First 1
if (-not $manifestPathEntry) {
    throw "$ManifestName does not identify an installer."
}

$installerName = $manifestPathEntry.Matches[0].Groups[1].Value.Trim("'", '"')
$installerPath = Join-Path $distributionDirectory $installerName
if (-not (Test-Path -LiteralPath $installerPath)) {
    throw "Windows x64 installer not found at $installerPath"
}

$env:DISABLE_AUTO_UPDATES = '1'
$application = Start-Process -FilePath $applicationPath -ArgumentList '--disable-gpu' -PassThru -WindowStyle Hidden

try {
    Start-Sleep -Seconds 8
    if ($application.HasExited) {
        throw "Packaged application exited during its smoke test with code $($application.ExitCode)."
    }
} finally {
    if (-not $application.HasExited) {
        Stop-Process -Id $application.Id -Force
    }
}

Write-Host "Verified $installerName, $ManifestName, and packaged application startup."
