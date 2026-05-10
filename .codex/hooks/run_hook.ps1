param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ScriptName
)

$ErrorActionPreference = "Stop"

function Resolve-PythonCommand {
    if ($env:CODEX_HOOK_PYTHON) {
        return @($env:CODEX_HOOK_PYTHON)
    }

    if ($env:PYTHON) {
        return @($env:PYTHON)
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return @($python.Source)
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return @($py.Source, "-3")
    }

    $python3 = Get-Command python3 -ErrorAction SilentlyContinue
    if ($python3) {
        return @($python3.Source)
    }

    throw "Python 3 was not found. Install Python or set CODEX_HOOK_PYTHON to the Python executable path."
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
}

$scriptPath = Join-Path $repoRoot (Join-Path ".codex\hooks" $ScriptName)
if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Hook script not found: $scriptPath"
}

$pythonCommand = @(Resolve-PythonCommand)
$pythonExe = $pythonCommand[0]
$pythonArgs = @()
if ($pythonCommand.Count -gt 1) {
    $pythonArgs = $pythonCommand[1..($pythonCommand.Count - 1)]
}

& $pythonExe @pythonArgs $scriptPath
exit $LASTEXITCODE
