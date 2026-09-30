param(
    [Parameter(Mandatory = $true)]
    [string]$ManifestName
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$distributionDirectory = Join-Path $PWD 'dist'
$manifestPath = Join-Path $distributionDirectory $ManifestName
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

$testRoot = Join-Path ([IO.Path]::GetTempPath()) 'KatiesAmpInstallerTests'
$installDirectory = Join-Path $testRoot ([guid]::NewGuid().ToString('N'))
$resolvedTestRoot = [IO.Path]::GetFullPath($testRoot)
$resolvedInstallDirectory = [IO.Path]::GetFullPath($installDirectory)
if (-not $resolvedInstallDirectory.StartsWith($resolvedTestRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'The temporary install path escaped the installer test directory.'
}

New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null
$application = $null

try {
    $installer = Start-Process -FilePath $installerPath -ArgumentList '/S', "/D=$installDirectory" -PassThru -Wait -WindowStyle Hidden
    if ($installer.ExitCode -ne 0) {
        throw "The installer exited with code $($installer.ExitCode)."
    }

    $applicationPath = Join-Path $installDirectory 'KatiesAmp.exe'
    if (-not (Test-Path -LiteralPath $applicationPath)) {
        throw "The installer did not create $applicationPath"
    }

    $env:DISABLE_AUTO_UPDATES = '1'
    $application = Start-Process -FilePath $applicationPath -ArgumentList '--disable-gpu' -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 8
    if ($application.HasExited) {
        throw "The installed application exited with code $($application.ExitCode)."
    }
} finally {
    if ($application -and -not $application.HasExited) {
        Stop-Process -Id $application.Id -Force
    }

    $uninstallerPath = Join-Path $installDirectory 'Uninstall KatiesAmp.exe'
    if (Test-Path -LiteralPath $uninstallerPath) {
        $uninstaller = Start-Process -FilePath $uninstallerPath -ArgumentList '/S' -PassThru -Wait -WindowStyle Hidden
        if ($uninstaller.ExitCode -ne 0) {
            Write-Warning "The uninstaller exited with code $($uninstaller.ExitCode)."
        }
    }

    if (Test-Path -LiteralPath $installDirectory) {
        Remove-Item -LiteralPath $installDirectory -Recurse -Force
    }
}

Write-Host "Verified silent install, installed launch, and uninstall for $installerName."
