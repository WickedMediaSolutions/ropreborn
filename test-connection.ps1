$tcpClient = New-Object System.Net.Sockets.TcpClient
$tcpClient.Connect("127.0.0.1", 4000)
$stream = $tcpClient.GetStream()
$reader = New-Object System.IO.StreamReader($stream)

$tcpClient.ReceiveTimeout = 1000
$data = New-Object byte[] 1024
try {
    $bytesRead = $stream.Read($data, 0, 1024)
    $response = [System.Text.Encoding]::UTF8.GetString($data, 0, $bytesRead)
    Write-Host "Raw bytes received: $bytesRead"
    Write-Host "Response: '$response'"
    Write-Host "Response (hex): $(($data[0..($bytesRead-1)] | ForEach-Object { $_.ToString('X2') }) -join ' ')"
} catch {
    Write-Host "Error: $_"
}

$tcpClient.Close()
