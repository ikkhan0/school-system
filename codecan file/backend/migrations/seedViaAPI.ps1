# PowerShell script to seed the database via API calls
# This uses the working API endpoints instead of direct database insertion

$baseUrl = "http://localhost:5000/api"

Write-Host "🌱 Seeding Database via API..." -ForegroundColor Green
Write-Host ""

# Step 1: Create Super Admin
Write-Host "👤 Step 1: Creating Super Admin..." -ForegroundColor Cyan
$superAdminBody = @{
    name = "Super Administrator"
    email = "admin@isoft.com"
    password = "admin123"
    secret_key = $env:SUPER_ADMIN_SECRET
} | ConvertTo-Json

try {
    $superAdminResponse = Invoke-RestMethod -Uri "$baseUrl/super-admin/register" -Method Post -Body $superAdminBody -ContentType "application/json"
    $superAdminToken = $superAdminResponse.token
    Write-Host "   ✅ Super Admin created" -ForegroundColor Green
    Write-Host "      Email: admin@isoft.com"
    Write-Host "      Password: admin123"
    Write-Host ""
} catch {
    Write-Host "   ⚠️  Super Admin might already exist or error occurred" -ForegroundColor Yellow
    Write-Host "   Trying to login instead..." -ForegroundColor Yellow
    
    $loginBody = @{
        email = "admin@isoft.com"
        password = "admin123"
    } | ConvertTo-Json
    
    try {
        $superAdminResponse = Invoke-RestMethod -Uri "$baseUrl/super-admin/login" -Method Post -Body $loginBody -ContentType "application/json"
        $superAdminToken = $superAdminResponse.token
        Write-Host "   ✅ Logged in as existing Super Admin" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   ❌ Failed to create or login Super Admin" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Create School 1 (I-Soft College Jhang)
Write-Host "🏫 Step 2: Creating School 1 (I-Soft College Jhang)..." -ForegroundColor Cyan
$school1Body = @{
    school_name = "I-Soft College Jhang"
    contact_info = @{
        email = "info@isoftjhang.edu.pk"
        phone = "+923001234567"
        address = "Main Road, Jhang"
        city = "Jhang"
        country = "Pakistan"
    }
    subscription_plan = "Premium"
    features_enabled = @("core", "fees", "exams", "attendance", "reports", "sms", "transport")
    admin_username = "admin"
    admin_password = "admin123"
    admin_name = "Admin I-Soft Jhang"
    admin_email = "admin@isoftjhang.edu.pk"
} | ConvertTo-Json -Depth 3

$headers = @{
    "Authorization" = "Bearer $superAdminToken"
    "Content-Type" = "application/json"
}

try {
    $school1Response = Invoke-RestMethod -Uri "$baseUrl/super-admin/tenants" -Method Post -Body $school1Body -Headers $headers -ContentType "application/json"
    Write-Host "   ✅ School 1 created" -ForegroundColor Green
    Write-Host "      Tenant ID: $($school1Response.tenant.tenant_id)"
    Write-Host "      Name: $($school1Response.tenant.school_name)"
    Write-Host "      Admin Username: admin"
    Write-Host "      Admin Password: admin123"
    Write-Host ""
} catch {
    Write-Host "   ⚠️  Error creating School 1: $_" -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Create School 2 (Green Valley School)
Write-Host "🏫 Step 3: Creating School 2 (Green Valley School)..." -ForegroundColor Cyan
$school2Body = @{
    school_name = "Green Valley School"
    contact_info = @{
        email = "info@greenvalley.edu.pk"
        phone = "+923009876543"
        address = "Garden Town, Lahore"
        city = "Lahore"
        country = "Pakistan"
    }
    subscription_plan = "Basic"
    features_enabled = @("core", "fees", "exams", "attendance")
    admin_username = "greenadmin"
    admin_password = "admin123"
    admin_name = "Admin Green Valley"
    admin_email = "admin@greenvalley.edu.pk"
} | ConvertTo-Json -Depth 3

try {
    $school2Response = Invoke-RestMethod -Uri "$baseUrl/super-admin/tenants" -Method Post -Body $school2Body -Headers $headers -ContentType "application/json"
    Write-Host "   ✅ School 2 created" -ForegroundColor Green
    Write-Host "      Tenant ID: $($school2Response.tenant.tenant_id)"
    Write-Host "      Name: $($school2Response.tenant.school_name)"
    Write-Host "      Admin Username: greenadmin"
    Write-Host "      Admin Password: admin123"
    Write-Host ""
} catch {
    Write-Host "   ⚠️  Error creating School 2: $_" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "=" * 70 -ForegroundColor Green
Write-Host "✅ DATABASE SEEDING COMPLETED!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""
Write-Host "🔐 LOGIN CREDENTIALS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 SUPER ADMIN (Full System Access):" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000/super-admin/login"
Write-Host "   Email: admin@isoft.com"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "📌 SCHOOL 1 ADMIN (I-Soft College Jhang):" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000/login"
Write-Host "   Username: admin"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "📌 SCHOOL 2 ADMIN (Green Valley School):" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:3000/login"
Write-Host "   Username: greenadmin"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Green
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "   1. Test Super Admin login"
Write-Host "   2. Test School Admin logins"
Write-Host "   3. Verify tenant isolation"
Write-Host "   4. Add test students via UI"
Write-Host ""
