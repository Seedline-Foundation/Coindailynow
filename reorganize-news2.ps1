# Merge user/ directory
$userSrc = "frontend/src/app/user"
$userDst = "apps/news/src/app/user"
if ((Test-Path $userSrc) -and (Test-Path $userDst)) {
    Get-ChildItem -Path $userSrc -Directory | ForEach-Object {
        $subSrc = $_.FullName
        $subDst = Join-Path $userDst $_.Name
        if (-not (Test-Path $subDst)) {
            Write-Host "Copying user/$($_.Name)..."
            Copy-Item -Path $subSrc -Destination $subDst -Recurse -Force
        } else {
            Write-Host "Skipping user/$($_.Name) (already exists)"
        }
    }
}
Write-Host "Done merging user/ directory"
