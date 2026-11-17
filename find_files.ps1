$types = Get-ChildItem -Recurse -Filter 'types.ts'
$tsxFiles = Get-ChildItem -Recurse -Filter '*MatchDay*.tsx'

Write-Host "=== TYPES FILES ==="
if ($types) {
    $types.FullName | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No types.ts files found"
}

Write-Host ""
Write-Host "=== TSX FILES ==="
if ($tsxFiles) {
    $tsxFiles.FullName | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No MatchDayView files found"
}
