param(
    [string]$ArtifactBaseName = "hello_world_mapper30"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$ToolsRoot = if ([string]::IsNullOrWhiteSpace($env:NES_DEV_TOOLS)) {
    "C:\CodexWorkspace\Tools\NES Development"
} else {
    $env:NES_DEV_TOOLS
}
$SharedScript = Join-Path $ToolsRoot "scripts\build_mapper30.ps1"

if (-not (Test-Path -LiteralPath $SharedScript -PathType Leaf)) {
    throw "Missing shared mapper-30 build script: $SharedScript"
}

& $SharedScript `
    -ProjectRoot $ProjectRoot `
    -ArtifactBaseName $ArtifactBaseName

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
