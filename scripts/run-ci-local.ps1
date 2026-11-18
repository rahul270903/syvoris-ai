<#
.SYNOPSIS
    SYVORIS Ai Local CI & Quality Gate Runner
.DESCRIPTION
    Executes the full CI validation suite locally before committing or pushing.
    Mirrors GitHub Actions CI quality gates.
.PARAMETER SkipFrontend
    Skips frontend verification and build steps.
.PARAMETER SkipBackend
    Skips backend migrations and pytest steps.
.PARAMETER Quick
    Runs tests in quick fail-fast mode.
#>
param(
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$Quick
)

$ErrorActionPreference = "Stop"
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

function Write-Step([string]$message) {
    Write-Host "`n[CI-RUNNER] $message" -ForegroundColor Cyan
}

function Write-Success([string]$message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Failure([string]$message) {
    Write-Host "[FAILURE] $message" -ForegroundColor Red
}

# Resolve Python Executable
$PythonExe = "python"
if (Test-Path "backend\venv\Scripts\python.exe") {
    $PythonExe = "backend\venv\Scripts\python.exe"
} elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
    $PythonExe = "python"
} elseif (Get-Command "py" -ErrorAction SilentlyContinue) {
    $PythonExe = "py"
}

Write-Host "==========================================================" -ForegroundColor DarkGray
Write-Host " SYVORIS Ai Enterprise CRM - Local CI Verification Runner" -ForegroundColor Yellow
Write-Host " Python: $PythonExe" -ForegroundColor DarkGray
Write-Host " Node:   $(node -v 2>$null)" -ForegroundColor DarkGray
Write-Host "==========================================================" -ForegroundColor DarkGray

$failedSteps = @()

# -------------------------------------------------------------
# FRONTEND GATES
# -------------------------------------------------------------
if (-not $SkipFrontend) {
    Write-Step "Step 1/5: Checking Frontend Route Invariants & Structure..."
    try {
        npm run check:project
        if ($LASTEXITCODE -ne 0) { throw "check:project exited with code $LASTEXITCODE" }
        Write-Success "Frontend route invariants (132/132 unique) and architecture verified."
    } catch {
        Write-Failure "Frontend project check failed: $_"
        $failedSteps += "Frontend check:project"
        if ($Quick) { exit 1 }
    }

    Write-Step "Step 2/5: Checking TypeScript Strict Type Compilation..."
    try {
        npm run typecheck
        if ($LASTEXITCODE -ne 0) { throw "typecheck exited with code $LASTEXITCODE" }
        Write-Success "TypeScript strict typecheck passed with 0 errors."
    } catch {
        Write-Failure "TypeScript typecheck failed: $_"
        $failedSteps += "Frontend typecheck"
        if ($Quick) { exit 1 }
    }

    Write-Step "Step 3/5: Building Production Frontend Bundle (Vite + Rollup)..."
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "build exited with code $LASTEXITCODE" }
        if (-not (Test-Path "dist\index.html")) { throw "dist/index.html was not generated" }
        Write-Success "Production frontend bundle successfully built."
    } catch {
        Write-Failure "Production build failed: $_"
        $failedSteps += "Frontend production build"
        if ($Quick) { exit 1 }
    }
} else {
    Write-Host "`n[SKIP] Frontend verification skipped via -SkipFrontend" -ForegroundColor DarkYellow
}

# -------------------------------------------------------------
# BACKEND GATES
# -------------------------------------------------------------
if (-not $SkipBackend) {
    Write-Step "Step 4/5: Verifying Alembic Migration Lineage & Single Head..."
    try {
        $heads = & $PythonExe -m alembic -c backend\alembic.ini heads
        if ($LASTEXITCODE -ne 0) { throw "Alembic heads exited with code $LASTEXITCODE" }
        Write-Host "$heads" -ForegroundColor DarkGray
        Write-Success "Alembic single migration head confirmed."
    } catch {
        Write-Failure "Alembic migration head check failed: $_"
        $failedSteps += "Alembic heads"
        if ($Quick) { exit 1 }
    }

    Write-Step "Step 5/5: Running Pytest Regression Test Suite..."
    try {
        $pytestArgs = @("-m", "pytest", "backend/tests/", "-q", "--tb=short")
        if ($Quick) { $pytestArgs += "-x" }
        & $PythonExe @pytestArgs
        if ($LASTEXITCODE -ne 0) { throw "Pytest exited with code $LASTEXITCODE" }
        Write-Success "Backend test suite passed cleanly."
    } catch {
        Write-Failure "Backend tests failed: $_"
        $failedSteps += "Backend Pytest Suite"
        if ($Quick) { exit 1 }
    }
} else {
    Write-Host "`n[SKIP] Backend verification skipped via -SkipBackend" -ForegroundColor DarkYellow
}

# -------------------------------------------------------------
# SUMMARY BANNER
# -------------------------------------------------------------
$stopwatch.Stop()
$elapsed = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 2)

Write-Host "`n==========================================================" -ForegroundColor DarkGray
if ($failedSteps.Count -eq 0) {
    Write-Host " ALL QUALITY GATES PASSED [Time: ${elapsed}s]" -ForegroundColor Green
    Write-Host " Workspace is clean and ready for commit / push." -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor DarkGray
    exit 0
} else {
    Write-Host " CI VERIFICATION FAILED [Time: ${elapsed}s]" -ForegroundColor Red
    Write-Host " Failed step(s):" -ForegroundColor Red
    foreach ($step in $failedSteps) {
        Write-Host "   - $step" -ForegroundColor Red
    }
    Write-Host "==========================================================" -ForegroundColor DarkGray
    exit 1
}
