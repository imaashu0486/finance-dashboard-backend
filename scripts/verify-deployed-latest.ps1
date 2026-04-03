Write-Host "Deprecated: use scripts/qa-evaluator-deployed.ps1 (or npm run test:deployed)."
& "$PSScriptRoot\qa-evaluator-deployed.ps1"
exit 0

$base='https://finance-dashboard-backend-gg5d.onrender.com'
$result=[ordered]@{}

function Get-Err($e){
  if($e.Exception.Response){ return [int]$e.Exception.Response.StatusCode }
  return -1
}

# Public
try { $h=Invoke-RestMethod -Method Get -Uri "$base/health"; $result.health=@{status=200;ok=$h.success} } catch { $result.health=@{status=(Get-Err $_);ok=$false} }
try { $s=Invoke-WebRequest -Method Get -Uri "$base/api-docs" -UseBasicParsing; $result.swagger=@{status=[int]$s.StatusCode;ok=([int]$s.StatusCode -eq 200)} } catch { $result.swagger=@{status=(Get-Err $_);ok=$false} }

# Register
$uid=[guid]::NewGuid().ToString('N').Substring(0,8)
$regEmail="register.$uid@example.com"
$regBody=@{name="Register $uid";email=$regEmail;password='Register@123'} | ConvertTo-Json -Compress
try {
  $reg=Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body $regBody
  $result.register=@{status=201;ok=$reg.success;role=$reg.data.user.role}
} catch { $result.register=@{status=(Get-Err $_);ok=$false} }
try {
  Invoke-WebRequest -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body $regBody -UseBasicParsing | Out-Null
  $result.registerDuplicate=@{status=200;ok=$false}
} catch {
  $sc=Get-Err $_
  $result.registerDuplicate=@{status=$sc;ok=($sc -eq 409)}
}

# Seeded demo logins
$adminToken=$null; $adminRefresh=$null; $analystToken=$null; $viewerToken=$null
try {
  $a=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@demo.com","password":"Admin@123"}'
  $adminToken=$a.data.accessToken; $adminRefresh=$a.data.refreshToken
  $result.adminDemoLogin=@{status=200;ok=$a.success}
} catch { $result.adminDemoLogin=@{status=(Get-Err $_);ok=$false} }
try {
  $an=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"analyst@demo.com","password":"Analyst@123"}'
  $analystToken=$an.data.accessToken
  $result.analystDemoLogin=@{status=200;ok=$an.success}
} catch { $result.analystDemoLogin=@{status=(Get-Err $_);ok=$false} }
try {
  $v=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"viewer@demo.com","password":"Viewer@123"}'
  $viewerToken=$v.data.accessToken
  $result.viewerDemoLogin=@{status=200;ok=$v.success}
} catch { $result.viewerDemoLogin=@{status=(Get-Err $_);ok=$false} }

# Registered user login
try {
  $rl=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ((@{email=$regEmail;password='Register@123'}|ConvertTo-Json -Compress))
  $result.registeredUserLogin=@{status=200;ok=$rl.success;role=$rl.data.user.role}
} catch { $result.registeredUserLogin=@{status=(Get-Err $_);ok=$false} }

if($adminToken){
  try { $me=Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -Headers @{Authorization="Bearer $adminToken"}; $result.authMe=@{status=200;ok=$me.success} } catch { $result.authMe=@{status=(Get-Err $_);ok=$false} }

  $freshToken=$adminToken; $freshRefresh=$adminRefresh
  try {
    $rf=Invoke-RestMethod -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ((@{refreshToken=$adminRefresh}|ConvertTo-Json -Compress))
    $freshToken=$rf.data.accessToken; $freshRefresh=$rf.data.refreshToken
    $result.authRefresh=@{status=200;ok=$rf.success}
  } catch { $result.authRefresh=@{status=(Get-Err $_);ok=$false} }

  try { $ul=Invoke-RestMethod -Method Get -Uri "$base/api/users" -Headers @{Authorization="Bearer $freshToken"; 'x-role'='admin'}; $result.userListAdmin=@{status=200;ok=$ul.success} } catch { $result.userListAdmin=@{status=(Get-Err $_);ok=$false} }

  if($analystToken){
    try { Invoke-WebRequest -Method Post -Uri "$base/api/users" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'} -ContentType 'application/json' -Body '{"name":"No","email":"analyst.denied@example.com","password":"SecurePass123","role":"viewer","status":"active"}' -UseBasicParsing | Out-Null; $result.analystCreateUserForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.analystCreateUserForbidden=@{status=$sc;ok=($sc -eq 403)} }
  }

  $recordId=$null
  try { $rc=Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{Authorization="Bearer $freshToken"; 'x-role'='admin'} -ContentType 'application/json' -Body '{"amount":1200,"type":"income","category":"Salary","date":"2026-04-01","notes":"latest deploy check"}'; $recordId=$rc.data.record._id; $result.recordCreate=@{status=201;ok=$rc.success} } catch { $result.recordCreate=@{status=(Get-Err $_);ok=$false} }
  try { $rls=Invoke-RestMethod -Method Get -Uri "$base/api/financial-records?page=1&limit=5&search=latest%20deploy%20check" -Headers @{Authorization="Bearer $freshToken"; 'x-role'='admin'}; $result.recordList=@{status=200;ok=$rls.success} } catch { $result.recordList=@{status=(Get-Err $_);ok=$false} }
  if($recordId){ try { $rd=Invoke-RestMethod -Method Delete -Uri "$base/api/financial-records/$recordId" -Headers @{Authorization="Bearer $freshToken"; 'x-role'='admin'}; $result.recordDelete=@{status=200;ok=$rd.success} } catch { $result.recordDelete=@{status=(Get-Err $_);ok=$false} } }

  if($analystToken){ try { Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'} -ContentType 'application/json' -Body '{"amount":20,"type":"expense","category":"Food","date":"2026-04-01"}' -UseBasicParsing | Out-Null; $result.analystCreateRecordForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.analystCreateRecordForbidden=@{status=$sc;ok=($sc -eq 403)} } }
  if($viewerToken){ try { Invoke-WebRequest -Method Get -Uri "$base/api/financial-records?page=1&limit=5" -Headers @{Authorization="Bearer $viewerToken"; 'x-role'='viewer'} -UseBasicParsing | Out-Null; $result.viewerReadRecordsForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.viewerReadRecordsForbidden=@{status=$sc;ok=($sc -eq 403)} } }

  if($analystToken){
    $dashPaths=@('/api/dashboard/total-income','/api/dashboard/total-expense','/api/dashboard/net-balance','/api/dashboard/category-wise','/api/dashboard/monthly-trends','/api/dashboard/last-transactions?limit=5','/api/dashboard/top-expense-categories?limit=3','/api/dashboard/summary')
    $dash=[ordered]@{}
    foreach($p in $dashPaths){
      try { $d=Invoke-RestMethod -Method Get -Uri "$base$p" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'}; $dash[$p]=@{status=200;ok=$d.success} } catch { $dash[$p]=@{status=(Get-Err $_);ok=$false} }
    }
    $result.dashboardAnalyst=$dash
  }
  if($viewerToken){ try { $vs=Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{Authorization="Bearer $viewerToken"; 'x-role'='viewer'}; $result.viewerSummaryAccess=@{status=200;ok=$vs.success} } catch { $result.viewerSummaryAccess=@{status=(Get-Err $_);ok=$false} } }

  if($freshRefresh){
    try { $lo=Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout" -ContentType 'application/json' -Body ((@{refreshToken=$freshRefresh}|ConvertTo-Json -Compress)); $result.authLogout=@{status=200;ok=$lo.success} } catch { $result.authLogout=@{status=(Get-Err $_);ok=$false} }
    try { Invoke-WebRequest -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ((@{refreshToken=$freshRefresh}|ConvertTo-Json -Compress)) -UseBasicParsing | Out-Null; $result.refreshReuseBlocked=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.refreshReuseBlocked=@{status=$sc;ok=($sc -eq 401)} }
  }
}

$result | ConvertTo-Json -Depth 14
