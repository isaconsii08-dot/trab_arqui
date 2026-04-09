$dbs = @(
    @{ Container = "bf-db-patron";      User = "patron_user";      DB = "patron_db" },
    @{ Container = "bf-db-catalog";     User = "catalog_user";     DB = "catalog_db" },
    @{ Container = "bf-db-holdings";    User = "holdings_user";    DB = "holdings_db" },
    @{ Container = "bf-db-circulation"; User = "circulation_user"; DB = "circulation_db" }
)

$out = "dumps"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

Write-Host ""
Write-Host "Exportando bases de datos..."
Write-Host ""

foreach ($db in $dbs) {
    $file = "$out\$($db.DB).sql"
    Write-Host "  Exportando $($db.DB)..."
    docker exec $db.Container pg_dump -U $db.User $db.DB | Out-File -FilePath $file -Encoding utf8
    Write-Host "  -> $file"
}

Write-Host ""
Write-Host "Listo. Comparte la carpeta dumps/ con tu companero."
Write-Host ""
