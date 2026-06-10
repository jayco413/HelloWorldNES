param(
    [string]$ImagePath = "build\hello_world_mapper30_prg.bin",

    [string]$BackupPath,

    [string]$VerifyPath
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$ToolsRoot = if ([string]::IsNullOrWhiteSpace($env:NES_DEV_TOOLS)) {
    "C:\CodexWorkspace\Tools\NES Development"
} else {
    $env:NES_DEV_TOOLS
}
$SharedScript = Join-Path $ToolsRoot "scripts\flash_mapper30.ps1"

if (-not (Test-Path -LiteralPath $SharedScript -PathType Leaf)) {
    throw "Missing shared mapper-30 flash script: $SharedScript"
}

& $SharedScript `
    -ProjectRoot $ProjectRoot `
    -ImagePath $ImagePath `
    -BackupPath $BackupPath `
    -VerifyPath $VerifyPath

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
