$content = Get-Content "server.js" -Encoding UTF8 -Raw
$searchText = "app.use((err, req, res, next) => {"
$replacement = @"
// Sentry error handler (must be before other error handlers)
app.use(getSentryErrorHandler())

app.use((err, req, res, next) => {
"@
$newContent = $content.Replace($searchText, $replacement)
Set-Content "server.js" -Value $newContent -Encoding UTF8 -NoNewline
Write-Host "✅ Sentry error handler added to server.js"
