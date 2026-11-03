# ChristianConnect — Local Database Setup Script
# Run this ONCE after PostgreSQL is installed to create the DB and run migrations.

$ErrorActionPreference = "Stop"

# Find psql on PATH (PostgreSQL installer adds it)
$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
    # Try default install locations
    $candidates = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $psql = $c; break }
    }
}

if (-not $psql) {
    Write-Error "psql not found. Make sure PostgreSQL is installed and restart your terminal."
    exit 1
}

$psqlExe = if ($psql -is [string]) { $psql } else { $psql.Source }
Write-Host "Found psql at: $psqlExe" -ForegroundColor Green

# Create the database (ignore error if it already exists)
Write-Host "`nCreating database 'christianconnect'..." -ForegroundColor Cyan
& $psqlExe -U postgres -c "CREATE DATABASE christianconnect;" 2>&1 | ForEach-Object {
    if ($_ -match "already exists") { Write-Host "Database already exists, skipping." -ForegroundColor Yellow }
    else { Write-Host $_ }
}

Write-Host "`nRunning Prisma migrations..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
npx prisma migrate dev --name init --skip-seed

Write-Host "`nGenerating Prisma client..." -ForegroundColor Cyan
npx prisma generate

Write-Host "`n✅ Database setup complete! You can now run 'npm run dev' to start the backend." -ForegroundColor Green
