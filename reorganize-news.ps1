# Reorganize: Copy public pages from frontend/ to apps/news/
$frontendApp = "frontend/src/app"
$newsApp = "apps/news/src/app"

$publicDirs = @("about","amp","blog","crypto-basics","disclaimer","events","insights","jobs","membership","news-aggregator","offline","paid-services","privacy","regulation","scam-watch","terms","tools")

foreach ($dir in $publicDirs) {
    $src = Join-Path $frontendApp $dir
    $dst = Join-Path $newsApp $dir
    if (Test-Path $src) {
        if (-not (Test-Path $dst)) {
            Write-Host "Copying $dir..."
            Copy-Item -Path $src -Destination $dst -Recurse -Force
        } else {
            Write-Host "Skipping $dir (already exists)"
        }
    }
}

Write-Host "Done copying directories"

# Merge user/ directory - copy missing subdirectories from frontend/ to apps/news/
$userSrc = Join-Path $frontendApp "user"
$userDst = Join-Path $newsApp "user"
if (Test-Path $userSrc -and Test-Path $userDst) {
    Get-ChildItem -Path $userSrc -Directory | ForEach-Object {
        $subSrc = $_.FullName
        $subDst = Join-Path $userDst $_.Name
        if (-not (Test-Path $subDst)) {
            Write-Host "Copying user/$($_.Name)..."
            Copy-Item -Path $subSrc -Destination $subDst -Recurse -Force
        }
    }
}

Write-Host "Done merging user/ directory"
