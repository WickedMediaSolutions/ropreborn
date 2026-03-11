$ErrorActionPreference = 'Stop'

$areaListPath = Join-Path $PSScriptRoot '..\area\area.lst'
$areaListPath = (Resolve-Path $areaListPath).Path
$areaDir = Split-Path $areaListPath -Parent

if (-not (Test-Path $areaListPath)) {
    Write-Error "area.lst not found at $areaListPath"
}

$files = Get-Content $areaListPath |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -and $_ -ne '$' } |
    ForEach-Object { Join-Path $areaDir $_ }

$ranges = @()
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Error "Area file listed but missing: $file"
    }

    $line = Select-String -Path $file -Pattern '^#AREA\s+\d+\s+\d+' | Select-Object -First 1
    if (-not $line) {
        continue
    }

    $parts = $line.Line -split '\s+'
    $ranges += [pscustomobject]@{
        File = $file
        Low  = [int]$parts[1]
        High = [int]$parts[2]
    }
}

$overlaps = @()
for ($i = 0; $i -lt $ranges.Count; $i++) {
    for ($j = $i + 1; $j -lt $ranges.Count; $j++) {
        $a = $ranges[$i]
        $b = $ranges[$j]
        if (($a.Low -le $b.High) -and ($b.Low -le $a.High)) {
            $overlaps += [pscustomobject]@{
                A = "$($a.File) [$($a.Low)-$($a.High)]"
                B = "$($b.File) [$($b.Low)-$($b.High)]"
            }
        }
    }
}

if ($overlaps.Count -gt 0) {
    Write-Host "Area range overlaps found:" -ForegroundColor Red
    $overlaps | Format-Table -AutoSize | Out-String | Write-Host
    exit 1
}

Write-Host "No loaded area range overlaps found."
exit 0
