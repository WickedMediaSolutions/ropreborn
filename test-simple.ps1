$tcpClient = New-Object System.Net.Sockets.TcpClient
try {
    $tcpClient.Connect("127.0.0.1", 4000)
    Write-Host "Connected successfully"
    
    $stream = $tcpClient.GetStream()
    $tcpClient.ReceiveTimeout = 3000
    
    # Try reading with a longer timeout
    $data = New-Object byte[] 1024
    try {
        $bytesRead = $stream.Read($data, 0, 1024)
        Write-Host "Bytes read: $bytesRead"
        if ($bytesRead -gt 0) {
            $text = [System.Text.Encoding]::UTF8.GetString($data, 0, $bytesRead)
            Write-Host "Received: '$text'"
        } else {
            Write-Host "Connection received but no data (0 bytes)"
        }
    } catch {
        Write-Host "Read error: $_"
    }
    
    $stream.Close()
} catch {
    Write-Host "Connection error: $_"
} finally {
    $tcpClient.Close()
}
