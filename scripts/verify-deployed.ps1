Write-Host "Deprecated: use scripts/qa-evaluator-deployed.ps1 (or npm run test:deployed)."
& "$PSScriptRoot\qa-evaluator-deployed.ps1"
exit 0

$base='https://finance-dashboard-backend-gg5d.onrender.com'
$summary = [ordered]@{}

try { $h = Invoke-RestMethod -Uri "$base/health" -Method Get; $summary.health = @{ status=200; success=$h.success } } catch { $summary.health = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
try { $d = Invoke-WebRequest -Uri "$base/api-docs" -UseBasicParsing; $summary.swagger = @{ status=[int]$d.StatusCode; success=([int]$d.StatusCode -eq 200) } } catch { $summary.swagger = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

$adminLogin = $null
try {
  $adminLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@qa.com","password":"SecurePass123"}'
  $summary.adminLogin = @{ status=200; success=$adminLogin.success }
} catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { -1 }
  $summary.adminLogin = @{ status=$status; success=$false; note='Provided admin credentials failed on deployed DB.' }
  $summary | ConvertTo-Json -Depth 10
  exit 0
}

$adminToken = $adminLogin.data.accessToken
$adminRefresh = $adminLogin.data.refreshToken
$freshToken = $adminToken
$freshRefresh = $adminRefresh

try { $me = Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -Headers @{ Authorization = "Bearer $adminToken" }; $summary.authMe = @{ status=200; success=$me.success } } catch { $summary.authMe = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
try {
  $refreshRes = Invoke-RestMethod -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ("{`"refreshToken`":`"$adminRefresh`"}")
  $summary.authRefresh = @{ status=200; success=$refreshRes.success }
  $freshToken = $refreshRes.data.accessToken
  $freshRefresh = $refreshRes.data.refreshToken
} catch { $summary.authRefresh = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

$uid = [guid]::NewGuid().ToString('N').Substring(0,6)
$analystEmail = "analyst.$uid@example.com"
$viewerEmail = "viewer.$uid@example.com"
$viewerId = $null

try {
  $analystCreate = Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body ("{`"name`":`"Analyst $uid`",`"email`":`"$analystEmail`",`"password`":`"SecurePass123`",`"role`":`"analyst`",`"status`":`"active`"}")
  $summary.userCreateAnalyst = @{ status=201; success=$analystCreate.success }
} catch { $summary.userCreateAnalyst = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

try {
  $viewerCreate = Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body ("{`"name`":`"Viewer $uid`",`"email`":`"$viewerEmail`",`"password`":`"SecurePass123`",`"role`":`"viewer`",`"status`":`"active`"}")
  $summary.userCreateViewer = @{ status=201; success=$viewerCreate.success }
  $viewerId = $viewerCreate.data.user.id
} catch { $summary.userCreateViewer = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

try { $users = Invoke-RestMethod -Method Get -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' }; $summary.userList = @{ status=200; success=$users.success; count=($users.data.users | Measure-Object).Count } } catch { $summary.userList = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
if ($viewerId) {
  try { $userUpdate = Invoke-RestMethod -Method Patch -Uri "$base/api/users/$viewerId" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"status":"inactive"}'; $summary.userUpdate = @{ status=200; success=$userUpdate.success } } catch { $summary.userUpdate = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
}

$analystToken = $null
$viewerToken = $null
try { $analystLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ("{`"email`":`"$analystEmail`",`"password`":`"SecurePass123`"}"); $analystToken = $analystLogin.data.accessToken; $summary.analystLogin = @{ status=200; success=$analystLogin.success } } catch { $summary.analystLogin = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
try { $viewerLogin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ("{`"email`":`"$viewerEmail`",`"password`":`"SecurePass123`"}"); $viewerToken = $viewerLogin.data.accessToken; $summary.viewerLogin = @{ status=200; success=$viewerLogin.success } } catch { $summary.viewerLogin = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

$incomeId = $null
try {
  $createIncome = Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":7500,"type":"income","category":"Salary","date":"2026-04-01","notes":"Render deploy test income"}'
  $incomeId = $createIncome.data.record._id
  $summary.recordCreateIncome = @{ status=201; success=$createIncome.success }
} catch { $summary.recordCreateIncome = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

try {
  $createExpense = Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":1800,"type":"expense","category":"Rent","date":"2026-04-02","notes":"Render deploy test expense"}'
  $summary.recordCreateExpense = @{ status=201; success=$createExpense.success }
} catch { $summary.recordCreateExpense = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }

try { $list = Invoke-RestMethod -Method Get -Uri "$base/api/financial-records?page=1&limit=10&type=income&category=Salary&startDate=2026-01-01&endDate=2026-12-31&search=deploy" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' }; $summary.recordListFiltered = @{ status=200; success=$list.success; count=($list.data.records | Measure-Object).Count } } catch { $summary.recordListFiltered = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
if ($incomeId) {
  try { $upd = Invoke-RestMethod -Method Patch -Uri "$base/api/financial-records/$incomeId" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"notes":"Updated from deployed verification"}'; $summary.recordUpdate = @{ status=200; success=$upd.success } } catch { $summary.recordUpdate = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
  try { $del = Invoke-RestMethod -Method Delete -Uri "$base/api/financial-records/$incomeId" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' }; $summary.recordDelete = @{ status=200; success=$del.success } } catch { $summary.recordDelete = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
}

try { Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":-10,"type":"income","category":"Invalid","date":"2026-04-02"}' -UseBasicParsing | Out-Null; $summary.recordValidation = @{ status=200; success=$false } } catch { $summary.recordValidation = @{ status=([int]$_.Exception.Response.StatusCode); success=([int]$_.Exception.Response.StatusCode -eq 400) } }

if ($analystToken) {
  try { Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' } -ContentType 'application/json' -Body '{"amount":20,"type":"expense","category":"Food","date":"2026-04-03","notes":"should fail"}' -UseBasicParsing | Out-Null; $summary.analystCreateRecordForbidden = @{ status=200; success=$false } } catch { $summary.analystCreateRecordForbidden = @{ status=([int]$_.Exception.Response.StatusCode); success=([int]$_.Exception.Response.StatusCode -eq 403) } }
}

$dashHeaders = if ($analystToken) { @{ Authorization = "Bearer $analystToken"; 'x-role'='analyst' } } else { @{ Authorization = "Bearer $freshToken"; 'x-role'='admin' } }
$dashPaths = @('/api/dashboard/total-income','/api/dashboard/total-expense','/api/dashboard/net-balance','/api/dashboard/category-wise','/api/dashboard/monthly-trends','/api/dashboard/last-transactions?limit=5','/api/dashboard/top-expense-categories?limit=3','/api/dashboard/summary')
$dash = @{}
foreach ($p in $dashPaths) {
  try { $r = Invoke-RestMethod -Method Get -Uri "$base$p" -Headers $dashHeaders; $dash[$p] = @{ status=200; success=$r.success } } catch { $dash[$p] = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
}
$summary.dashboard = $dash

if ($viewerToken) {
  try { Invoke-WebRequest -Method Get -Uri "$base/api/dashboard/summary" -Headers @{ Authorization = "Bearer $viewerToken"; 'x-role'='viewer' } -UseBasicParsing | Out-Null; $summary.viewerSummaryForbidden = @{ status=200; success=$false } } catch { $summary.viewerSummaryForbidden = @{ status=([int]$_.Exception.Response.StatusCode); success=([int]$_.Exception.Response.StatusCode -eq 403) } }
}

if ($freshRefresh) {
  try { $logout = Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout" -ContentType 'application/json' -Body ("{`"refreshToken`":`"$freshRefresh`"}"); $summary.authLogout = @{ status=200; success=$logout.success } } catch { $summary.authLogout = @{ status=([int]$_.Exception.Response.StatusCode); success=$false } }
  try { Invoke-WebRequest -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ("{`"refreshToken`":`"$freshRefresh`"}") -UseBasicParsing | Out-Null; $summary.refreshReuseBlocked = @{ status=200; success=$false } } catch { $summary.refreshReuseBlocked = @{ status=([int]$_.Exception.Response.StatusCode); success=([int]$_.Exception.Response.StatusCode -eq 401) } }
}

$summary | ConvertTo-Json -Depth 12
