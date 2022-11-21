$repositoryRootDirectory = Join-Path -Path Get-Location -ChildPath '..'
$packageJson = Get-Content -Path (Join-Path -Path $repositoryRootDirectory -ChildPath 'package.json') | ConvertFrom-Json

if (!packageJson.version) {
  throw 'package.json does not contain a version'
}

$version = $packageJson.version
$appName = $packageJson.name
$dockerRepo = 'jeffvictorli'


Write-Host "Building [${appname}:latest] & [${appName}:${version}]"

docker build -t "${dockerRepo}/${appName}:latest" -t "${dockerRepo}/${appName}:${version}" -f "${repositoryRootDirectory}/Dockerfile" .
