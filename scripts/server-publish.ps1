$repositoryRootDirectory = Join-Path -Path Get-Location -ChildPath '..'
try {
  $script:packageJson = Get-Content -Path (Join-Path -Path $repositoryRootDirectory -ChildPath 'package.json') | ConvertFrom-Json
} catch {
  throw 'package.json does not exist'
}

if (!$script:packageJson.version) {
  throw 'package.json does not contain a version'
}

$version = $script:packageJson.version
$appName = $script:packageJson.name
$dockerRepo = 'jeffvictorli'

Write-Host "Pushing [${appname}:latest] & [${appName}:${version}]"

docker push "${dockerRepo}/${appName}" --all-tags
