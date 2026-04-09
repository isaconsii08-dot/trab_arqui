$services = @(
    @{ Port = 3000; Name = "API Gateway";        Make = $null },
    @{ Port = 3001; Name = "Patron Service";     Make = "dev-patron" },
    @{ Port = 3002; Name = "Catalog Service";    Make = "dev-catalog" },
    @{ Port = 3003; Name = "Holdings Service";   Make = "dev-holdings" },
    @{ Port = 3004; Name = "Circulation Service"; Make = "dev-circulation" },
    @{ Port = 3005; Name = "Notification Service"; Make = "dev-notification" },
    @{ Port = 4000; Name = "Portal Socio";       Make = "dev-portal" },
    @{ Port = 4001; Name = "Staff Intranet";     Make = "dev-staff" }
)

$timeout = 120
$elapsed = 0

Write-Host ""
Write-Host "Esperando que arranquen todos los servicios..."
Write-Host ""

while ($elapsed -lt $timeout) {
    $ready = 0
    foreach ($svc in $services) {
        $match = netstat -ano | Select-String (":$($svc.Port) .*LISTENING")
        if ($match) { $ready++ }
    }

    if ($ready -eq $services.Count) { break }

    Write-Host "  $ready / $($services.Count) servicios activos... ($elapsed s)"
    Start-Sleep 3
    $elapsed += 3
}

Write-Host ""
Write-Host "Estado de BiblioFlow:"
Write-Host ""

$failed = @()

foreach ($svc in $services) {
    $match = netstat -ano | Select-String (":$($svc.Port) .*LISTENING")
    if ($match) {
        Write-Host "  [OK]  :$($svc.Port)  $($svc.Name)"
    } else {
        Write-Host "  [--]  :$($svc.Port)  $($svc.Name)  (no arranco)"
        if ($svc.Make) { $failed += $svc }
    }
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Reintentando servicios fallidos..."

    foreach ($svc in $failed) {
        Write-Host "  Abriendo $($svc.Name) en nueva ventana..."
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"cd '$PSScriptRoot\..' ; make $($svc.Make)`""
    }
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..."
Read-Host
