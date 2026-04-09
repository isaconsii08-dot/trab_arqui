Write-Host "Creando archivos de entorno..."

Get-ChildItem -Path 'services', 'apps' -Directory | ForEach-Object {
    $dir = $_.FullName
    $ex  = Join-Path $dir '.env.example'
    $dst = if ($_.Parent.Name -eq 'apps') { Join-Path $dir '.env.local' } else { Join-Path $dir '.env' }

    if ((Test-Path $ex) -and -not (Test-Path $dst)) {
        Copy-Item $ex $dst
        Write-Host "  ok $($dst -replace [regex]::Escape((Get-Location).Path + '\'), '')"
    }
}

Write-Host "Revisa los archivos .env generados y ajusta los valores si es necesario."
