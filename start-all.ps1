$root = $PSScriptRoot

$services = @(
    @{ name = "catalog-service";     path = "services\catalog-service" },
    @{ name = "patron-service";      path = "services\patron-service" },
    @{ name = "circulation-service"; path = "services\circulation-service" },
    @{ name = "holdings-service";    path = "services\holdings-service" },
    @{ name = "api-gateway";         path = "services\api-gateway" },
    @{ name = "patron-portal";       path = "apps\patron-portal" },
    @{ name = "staff-intranet";      path = "apps\staff-intranet" }
)

foreach ($svc in $services) {
    $fullPath = Join-Path $root $svc.path
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fullPath'; npm run dev" -WindowStyle Normal
    Write-Host "Started $($svc.name)"
    Start-Sleep -Milliseconds 500
}

Write-Host "`nTodos los servicios iniciados." -ForegroundColor Green
