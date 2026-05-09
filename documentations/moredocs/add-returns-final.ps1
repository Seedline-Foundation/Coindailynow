# Final fix for all remaining return statements
$file = "backend\src\api\ai-quality-validation.ts"
$lines = Get-Content $file

$inCatchBlock = $false
$inErrorJson = $false
$indent = ""
$modified = $false

for ($i = 0; $i < $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Detect catch block
    if ($line -match '^\s*}\s*catch\s*\(error\)\s*{') {
        $inCatchBlock = $true
    }
    
    # Detect end of error res.status().json()
    if ($inCatchBlock -and $line -match '^\s*}\);$') {
        # Check next line - if it's just closing brace of catch, add return
        if ($i + 1 -lt $lines.Count) {
            $nextLine = $lines[$i + 1]
            if ($nextLine -match '^\s*}$' -and $lines[$i] -notmatch 'return;') {
                # Get indentation
                if ($nextLine -match '^(\s*)') {
                    $indent = $matches[1]
                }
                # Insert return statement after current line
                $newLine = $lines[$i] + "`n" + $indent + "  return;"
                $lines[$i] = $newLine
                $modified = $true
            }
        }
        $inCatchBlock = $false
    }
}

if ($modified) {
    $lines | Set-Content $file
    Write-Host "✅ Added return statements to all catch blocks" -ForegroundColor Green
} else {
    Write-Host "⚠️  No modifications needed or pattern not found" -ForegroundColor Yellow
}
