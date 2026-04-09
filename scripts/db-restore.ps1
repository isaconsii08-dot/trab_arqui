$dbs = @(
    @{ Container = "bf-db-patron";      User = "patron_user";      DB = "patron_db" },
    @{ Container = "bf-db-catalog";     User = "catalog_user";     DB = "catalog_db" },
    @{ Container = "bf-db-holdings";    User = "holdings_user";    DB = "holdings_db" },
    @{ Container = "bf-db-circulation"; User = "circulation_user"; DB = "circulation_db" }
)

$src = "dumps"

if (-not (Test-Path $src)) {
    Write-Host "No se encontro la carpeta 'dumps/'. Copia los archivos .sql ahi primero."
    exit 1
}

Write-Host ""
Write-Host "Importando bases de datos..."
Write-Host ""

foreach ($db in $dbs) {
    $file = "$src\$($db.DB).sql"
    if (-not (Test-Path $file)) {
        Write-Host "  [SKIP] $($db.DB) — no se encontro $file"
        continue
    }
    Write-Host "  Importando $($db.DB)..."
    Get-Content $file | docker exec -i $db.Container psql -U $db.User $db.DB | Out-Null
    Write-Host "  -> ok"
}

Write-Host ""
Write-Host "Listo. Corre 'make dev' para iniciar los servicios."
Write-Host ""
