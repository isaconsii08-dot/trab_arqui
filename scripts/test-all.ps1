# BiblioFlow - Suite Completa de Pruebas
# Unitarias + Integracion + Cobertura con progreso visual

$ROOT    = Split-Path $PSScriptRoot -Parent
$SERVICE = Join-Path $ROOT "services\patron-service"

# Caracteres de borde construidos en runtime (evita problemas de encoding en el fuente)
$TL = [char]0x2554  # corner top-left
$TR = [char]0x2557  # corner top-right
$BL = [char]0x255A  # corner bottom-left
$BR = [char]0x255D  # corner bottom-right
$H  = [char]0x2550  # horizontal double
$V  = [char]0x2551  # vertical double
$HL = [char]0x2501  # horizontal heavy (separator)

$BOX_W = 52
$SEP_W = 52

function box-line {
    param([string]$text, [int]$width = $BOX_W)
    $pad = $width - $text.Length - 2
    if ($pad -lt 0) { $pad = 0 }
    return "$V $text$(' ' * $pad)$V"
}

function print-header {
    $bar = ([string]$H) * $BOX_W
    Write-Host ""
    Write-Host "$TL$bar$TR" -ForegroundColor Cyan
    Write-Host (box-line "  Biblioflow - Suite Completa de Pruebas") -ForegroundColor Cyan
    Write-Host (box-line "  patron-service  |  Jest + ts-jest") -ForegroundColor Cyan
    Write-Host "$BL$bar$BR" -ForegroundColor Cyan
    Write-Host ""
}

function print-step {
    param([int]$num, [int]$total, [string]$title)
    $sep = ([string]$HL) * $SEP_W
    Write-Host ""
    Write-Host $sep -ForegroundColor DarkCyan
    Write-Host "  >> Paso $num / $total  --  $title" -ForegroundColor Yellow
    Write-Host $sep -ForegroundColor DarkCyan
}

function print-info { param([string]$msg) Write-Host "     $msg" -ForegroundColor Gray }
function print-ok   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function print-fail { param([string]$msg) Write-Host "  [!!] $msg" -ForegroundColor Red }

$script:jestExit = 0

function run-jest {
    param([string]$pattern = "", [switch]$coverage)
    Push-Location $SERVICE
    if ($coverage) {
        cmd /c "npx jest --config jest.config.js --coverage"
    } else {
        cmd /c "npx jest --config jest.config.js --no-coverage --testPathPattern $pattern --verbose"
    }
    $script:jestExit = $LASTEXITCODE  # variable de script, evita mezcla con pipeline
    Pop-Location
}

# ---------------------------------------------------------------------------
$startTime = Get-Date
print-header

# ---------------------------------------------------------------------------
# PASO 1 - PRUEBAS UNITARIAS
# ---------------------------------------------------------------------------
print-step -num 1 -total 3 -title "Pruebas Unitarias"
print-info "Dominio   : Email  |  CardNumber  |  Patron  |  Staff"
print-info "Aplicacion: RegisterPatronUseCase  |  AuthenticateUseCase"
print-info "Mapper    : PatronMapper.toDto"
print-info "Mocks     : IPatronRepository  |  IEventPublisher"
Write-Host ""

run-jest -pattern "unit"

Write-Host ""
if ($script:jestExit -eq 0) {
    print-ok "14 pruebas unitarias en verde"
} else {
    print-fail "Pruebas unitarias fallaron -- abortando"
    exit 1
}

# ---------------------------------------------------------------------------
# PASO 2 - PRUEBAS DE INTEGRACION
# ---------------------------------------------------------------------------
print-step -num 2 -total 3 -title "Pruebas de Integracion"
print-info "Stack     : NestJS TestingModule  +  supertest"
print-info "Endpoints : POST /auth/login  |  POST /patrons  |  GET /patrons"
print-info "Mocks     : IPatronRepository  |  IEventPublisher  |  PrismaService"
print-info "Guards    : JwtAuthGuard y RolesGuard desactivados (useValue)"
Write-Host ""

run-jest -pattern "integration"

Write-Host ""
if ($script:jestExit -eq 0) {
    print-ok "10 pruebas de integracion en verde"
} else {
    print-fail "Pruebas de integracion fallaron -- abortando"
    exit 1
}

# ---------------------------------------------------------------------------
# PASO 3 - COBERTURA
# ---------------------------------------------------------------------------
print-step -num 3 -total 3 -title "Reporte de Cobertura"
print-info "Capas     : domain  |  application  |  presentation"
print-info "Umbral    : >= 80% statements  |  >= 80% functions  |  >= 80% lines"
Write-Host ""

run-jest -coverage

Write-Host ""
if ($script:jestExit -ne 0) {
    print-fail "Cobertura por debajo del umbral -- revisa el reporte"
    exit 1
}

print-info "Reporte HTML --> services/patron-service/coverage/index.html"

# ---------------------------------------------------------------------------
# RESUMEN FINAL
# ---------------------------------------------------------------------------
$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 1)
$timeStr = "Tiempo total: ${elapsed}s"
$bar = ([string]$H) * $BOX_W

Write-Host ""
Write-Host "$TL$bar$TR" -ForegroundColor Green
Write-Host (box-line "  [OK] Todas las pruebas pasaron correctamente") -ForegroundColor Green
Write-Host (box-line "  24 tests en verde  |  Cobertura >= 80%") -ForegroundColor Green
Write-Host (box-line "  $timeStr") -ForegroundColor Green
Write-Host "$BL$bar$BR" -ForegroundColor Green
Write-Host ""
