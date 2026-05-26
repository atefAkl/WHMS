$content = Get-Content "C:\laragon\www\WHMS\resources\js\Pages\Contracts\Show.jsx" -Raw
$pattern = 'lang === "ar"\s*[\r\n]+\s*\?\s*"([^"]+)"\s*[\r\n]+\s*:\s*"([^"]+)"'
$found = [regex]::Matches($content, $pattern)
Write-Host "Multiline matches found: $($found.Count)"
$found | ForEach-Object { "$($_.Groups[1].Value) | $($_.Groups[2].Value)" } | Sort-Object -Unique
