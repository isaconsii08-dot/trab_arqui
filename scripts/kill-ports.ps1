$ports = @(3000, 3001, 3002, 3003, 3004, 3005, 4000, 4001)

Write-Host "Liberando puertos..."

foreach ($p in $ports) {
    $match = netstat -ano | Select-String (":$p .*LISTENING")
    if ($match) {
        $id = ($match[0].ToString().Trim() -split '\s+')[-1]
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        Write-Host "  Puerto $p liberado (PID $id)"
    }
}

Write-Host "Puertos listos"
