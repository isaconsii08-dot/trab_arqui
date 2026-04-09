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

Write-Host ""
Write-Host "Estado de BiblioFlow:"
Write-Host ""

foreach ($svc in $services) {
    $match = netstat -ano | Select-String (":$($svc.Port) .*LISTENING")
    if ($match) {
        Write-Host "  [OK]  :$($svc.Port)  $($svc.Name)"
    } else {
        Write-Host "  [--]  :$($svc.Port)  $($svc.Name)"
    }
}

Write-Host ""
