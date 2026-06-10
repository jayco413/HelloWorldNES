param(
    [switch]$SkipBuild,

    [string]$RomName = "hello_world.nes"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$ToolsRoot = if ([string]::IsNullOrWhiteSpace($env:NES_DEV_TOOLS)) {
    "C:\CodexWorkspace\Tools\NES Development"
} else {
    $env:NES_DEV_TOOLS
}
$SharedScript = Join-Path $ToolsRoot "scripts\test.ps1"

if (-not (Test-Path -LiteralPath $SharedScript -PathType Leaf)) {
    throw "Missing shared NES test script: $SharedScript"
}

& $SharedScript `
    -ProjectRoot $ProjectRoot `
    -RomName $RomName `
    -SkipBuild:$SkipBuild

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
