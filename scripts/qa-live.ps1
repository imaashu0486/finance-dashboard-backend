$base='http://localhost:5000'
$health = Invoke-RestMethod -Method Get -Uri "$base/health"

Set-Location "c:\Zorvyn\Financial Dashboard System"
node -e "require('dotenv').config(); const mongoose=require('./node_modules/mongoose'); const User=require('./src/models/User'); (async()=>{ await mongoose.connect(process.env.MONGODB_URI); const users=[{name:'Admin QA2',email:'admin.qa2@example.com',password:'SecurePass123',role:'admin',status:'active'},{name:'Analyst QA2',email:'analyst.qa2@example.com',password:'SecurePass123',role:'analyst',status:'active'},{name:'Viewer QA2',email:'viewer.qa2@example.com',password:'SecurePass123',role:'viewer',status:'active'}]; for (const u of users){ const ex=await User.findOne({email:u.email}); if(!ex){ await User.create(u);} } await mongoose.disconnect(); })().catch(async e=>{ console.error(e.message); try{await mongoose.disconnect();}catch{} process.exit(1); });" | Out-Null

$adminLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin.qa2@example.com","password":"SecurePass123"}'
$analystLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"analyst.qa2@example.com","password":"SecurePass123"}'
$viewerLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"viewer.qa2@example.com","password":"SecurePass123"}'

$adminToken = $adminLogin.data.accessToken
$analystToken = $analystLogin.data.accessToken
$viewerToken = $viewerLogin.data.accessToken

$usersList = Invoke-RestMethod -Method Get -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' }

$uniq = [guid]::NewGuid().ToString('N').Substring(0,6)
$createdUser = Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body ("{`"name`":`"Temp User $uniq`",`"email`":`"temp.$uniq@example.com`",`"password`":`"SecurePass123`",`"role`":`"viewer`",`"status`":`"active`"}")
$createdUserId = $createdUser.data.user.id
$updatedUser = Invoke-RestMethod -Method Patch -Uri "$base/api/users/$createdUserId" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"status":"inactive"}'
$analystUserCreateErr = $null
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' } -ContentType 'application/json' -Body '{"name":"Denied","email":"denied@example.com","password":"SecurePass123","role":"viewer","status":"active"}' | Out-Null
} catch {
  $analystUserCreateErr = $_.ErrorDetails.Message
}

$r1 = Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":9000,"type":"income","category":"Salary","date":"2026-04-01","notes":"April Salary"}'
$r2 = Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":2200,"type":"expense","category":"Rent","date":"2026-04-03","notes":"April Rent"}'
$recordId = $r1.data.record._id
$recordsList = Invoke-RestMethod -Method Get -Uri "$base/api/financial-records?page=1&limit=10&type=income&category=Salary&startDate=2026-01-01&endDate=2026-12-31&search=Salary" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' }
$recordUpdate = Invoke-RestMethod -Method Patch -Uri "$base/api/financial-records/$recordId" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"notes":"Updated Salary"}'
$recordDelete = Invoke-RestMethod -Method Delete -Uri "$base/api/financial-records/$recordId" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' }
$invalidRecordErr = $null
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $adminToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":-1,"type":"income","category":"Bad","date":"2026-04-03"}' | Out-Null
} catch {
  $invalidRecordErr = $_.ErrorDetails.Message
}
$analystCreateErr = $null
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' } -ContentType 'application/json' -Body '{"amount":10,"type":"expense","category":"Food","date":"2026-04-03","notes":"Denied"}' | Out-Null
} catch {
  $analystCreateErr = $_.ErrorDetails.Message
}

$di = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/total-income" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$de = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/total-expense" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$dn = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/net-balance" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$dc = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/category-wise" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$dm = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/monthly-trends" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$dl = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/last-transactions?limit=5" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$dt = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/top-expense-categories?limit=3" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$ds = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' }
$viewerSummaryErr = $null
try {
  Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{ Authorization = "Bearer $viewerToken"; 'x-role'='viewer' } | Out-Null
} catch {
  $viewerSummaryErr = $_.ErrorDetails.Message
}

[PSCustomObject]@{
  health = $health.success
  auth = @{ admin=$adminLogin.success; analyst=$analystLogin.success; viewer=$viewerLogin.success }
  users = @{ list=$usersList.success; create=$createdUser.success; update=$updatedUser.success; analystForbidden=$analystUserCreateErr }
  financialRecords = @{ create1=$r1.success; create2=$r2.success; list=$recordsList.success; update=$recordUpdate.success; delete=$recordDelete.success; invalidValidation=$invalidRecordErr; analystForbidden=$analystCreateErr }
  dashboard = @{ totalIncome=$di.success; totalExpense=$de.success; netBalance=$dn.success; categoryWise=$dc.success; monthlyTrends=$dm.success; lastTransactions=$dl.success; topExpenseCategories=$dt.success; summary=$ds.success; viewerForbidden=$viewerSummaryErr }
} | ConvertTo-Json -Depth 8
