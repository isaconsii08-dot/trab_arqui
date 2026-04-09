$services = @(
    @{ Port = 3000; Name = "API Gateway" },
    @{ Port = 3001; Name = "Patron Service" },
    @{ Port = 3002; Name = "Catalog Service" },
    @{ Port = 3003; Name = "Holdings Service" },
    @{ Port = 3004; Name = "Circulation Service" },
    @{ Port = 3005; Name = "Notification Service" },
    @{ Port = 4000; Name = "Portal Socio" },
    @{ Port = 4001; Name = "Staff Intranet" }
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

foreach ($svc in $services) {
    $match = netstat -ano | Select-String (":$($svc.Port) .*LISTENING")
    if ($match) {
        Write-Host "  [OK]  :$($svc.Port)  $($svc.Name)"
    } else {
        Write-Host "  [--]  :$($svc.Port)  $($svc.Name)  (no arranco en $timeout s)"
    }
}

Write-Host ""
Write-Host "Presiona Enter para cerrar..."
Read-Host
