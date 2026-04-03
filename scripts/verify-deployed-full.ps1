$base='https://finance-dashboard-backend-gg5d.onrender.com'
$result=[ordered]@{}

function Get-Err($e){
  if($e.Exception.Response){ return [int]$e.Exception.Response.StatusCode }
  return -1
}

# Public endpoints
try { $h=Invoke-RestMethod -Method Get -Uri "$base/health"; $result.health=@{status=200;ok=$h.success} } catch { $result.health=@{status=(Get-Err $_);ok=$false} }
try { $s=Invoke-WebRequest -Method Get -Uri "$base/api-docs" -UseBasicParsing; $result.swagger=@{status=[int]$s.StatusCode;ok=([int]$s.StatusCode -eq 200)} } catch { $result.swagger=@{status=(Get-Err $_);ok=$false} }

# Unauthorized guard checks
try { Invoke-WebRequest -Method Get -Uri "$base/api/users" -UseBasicParsing | Out-Null; $result.unauthUsers=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.unauthUsers=@{status=$sc;ok=($sc -eq 401)} }
try { Invoke-WebRequest -Method Get -Uri "$base/api/financial-records" -UseBasicParsing | Out-Null; $result.unauthRecords=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.unauthRecords=@{status=$sc;ok=($sc -eq 401)} }
try { Invoke-WebRequest -Method Get -Uri "$base/api/dashboard/summary" -UseBasicParsing | Out-Null; $result.unauthDashboard=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.unauthDashboard=@{status=$sc;ok=($sc -eq 401)} }

# Admin login
$adminToken=$null; $adminRefresh=$null
try {
  $adminLogin=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@qa.com","password":"SecurePass123"}'
  $adminToken=$adminLogin.data.accessToken; $adminRefresh=$adminLogin.data.refreshToken
  $result.adminLogin=@{status=200;ok=$adminLogin.success}
} catch {
  $result.adminLogin=@{status=(Get-Err $_);ok=$false}
  $result | ConvertTo-Json -Depth 14
  exit 0
}

# Auth me, refresh
try { $me=Invoke-RestMethod -Method Get -Uri "$base/api/auth/me" -Headers @{Authorization="Bearer $adminToken"}; $result.authMe=@{status=200;ok=$me.success} } catch { $result.authMe=@{status=(Get-Err $_);ok=$false} }
$newAccess=$adminToken; $newRefresh=$adminRefresh
try {
  $rf=Invoke-RestMethod -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ((@{refreshToken=$adminRefresh}|ConvertTo-Json -Compress))
  $newAccess=$rf.data.accessToken; $newRefresh=$rf.data.refreshToken
  $result.authRefresh=@{status=200;ok=$rf.success}
} catch { $result.authRefresh=@{status=(Get-Err $_);ok=$false} }

# Create role users
$uid=[guid]::NewGuid().ToString('N').Substring(0,6)
$analystEmail="analyst.$uid@example.com"; $viewerEmail="viewer.$uid@example.com"
$analystId=$null; $viewerId=$null
try {
  $a=Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body ((@{name="Analyst $uid";email=$analystEmail;password='SecurePass123';role='analyst';status='active'}|ConvertTo-Json -Compress))
  $analystId=$a.data.user.id; $result.userCreateAnalyst=@{status=201;ok=$a.success}
} catch { $result.userCreateAnalyst=@{status=(Get-Err $_);ok=$false} }
try {
  $v=Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body ((@{name="Viewer $uid";email=$viewerEmail;password='SecurePass123';role='viewer';status='active'}|ConvertTo-Json -Compress))
  $viewerId=$v.data.user.id; $result.userCreateViewer=@{status=201;ok=$v.success}
} catch { $result.userCreateViewer=@{status=(Get-Err $_);ok=$false} }
try { $ul=Invoke-RestMethod -Method Get -Uri "$base/api/users" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'}; $result.userListAdmin=@{status=200;ok=$ul.success} } catch { $result.userListAdmin=@{status=(Get-Err $_);ok=$false} }

# Logins for created users
$analystToken=$null; $viewerToken=$null
try { $al=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ((@{email=$analystEmail;password='SecurePass123'}|ConvertTo-Json -Compress)); $analystToken=$al.data.accessToken; $result.analystLogin=@{status=200;ok=$al.success} } catch { $result.analystLogin=@{status=(Get-Err $_);ok=$false} }
try { $vl=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ((@{email=$viewerEmail;password='SecurePass123'}|ConvertTo-Json -Compress)); $viewerToken=$vl.data.accessToken; $result.viewerLogin=@{status=200;ok=$vl.success} } catch { $result.viewerLogin=@{status=(Get-Err $_);ok=$false} }

# Role permission checks on users
if($analystToken){
  try { Invoke-WebRequest -Method Post -Uri "$base/api/users" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'} -ContentType 'application/json' -Body '{"name":"No","email":"no@example.com","password":"SecurePass123","role":"viewer","status":"active"}' -UseBasicParsing | Out-Null; $result.analystCreateUserForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.analystCreateUserForbidden=@{status=$sc;ok=($sc -eq 403)} }
}
if($viewerToken){
  try { Invoke-WebRequest -Method Patch -Uri "$base/api/users/$viewerId" -Headers @{Authorization="Bearer $viewerToken"; 'x-role'='viewer'} -ContentType 'application/json' -Body '{"status":"inactive"}' -UseBasicParsing | Out-Null; $result.viewerUpdateUserForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.viewerUpdateUserForbidden=@{status=$sc;ok=($sc -eq 403)} }
}

# Financial record CRUD and validation
$recordId=$null
try { $r1=Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body '{"amount":5400,"type":"income","category":"Salary","date":"2026-04-01","notes":"verify deployed income"}'; $recordId=$r1.data.record._id; $result.recordCreate=@{status=201;ok=$r1.success} } catch { $result.recordCreate=@{status=(Get-Err $_);ok=$false} }
try { $rl=Invoke-RestMethod -Method Get -Uri "$base/api/financial-records?page=1&limit=10&search=verify%20deployed" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'}; $result.recordList=@{status=200;ok=$rl.success} } catch { $result.recordList=@{status=(Get-Err $_);ok=$false} }
if($recordId){ try { $ru=Invoke-RestMethod -Method Patch -Uri "$base/api/financial-records/$recordId" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body '{"notes":"updated verify note"}'; $result.recordUpdate=@{status=200;ok=$ru.success} } catch { $result.recordUpdate=@{status=(Get-Err $_);ok=$false} } }
try { Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body '{"amount":-7,"type":"income","category":"x","date":"2026-04-01"}' -UseBasicParsing | Out-Null; $result.recordInvalidPayload=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.recordInvalidPayload=@{status=$sc;ok=($sc -eq 400)} }
if($analystToken){ try { Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'} -ContentType 'application/json' -Body '{"amount":20,"type":"expense","category":"Food","date":"2026-04-01"}' -UseBasicParsing | Out-Null; $result.analystCreateRecordForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.analystCreateRecordForbidden=@{status=$sc;ok=($sc -eq 403)} } }
if($viewerToken){ try { Invoke-WebRequest -Method Get -Uri "$base/api/financial-records?page=1&limit=5" -Headers @{Authorization="Bearer $viewerToken"; 'x-role'='viewer'} -UseBasicParsing | Out-Null; $result.viewerReadRecordsForbidden=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.viewerReadRecordsForbidden=@{status=$sc;ok=($sc -eq 403)} } }
if($recordId){ try { $rd=Invoke-RestMethod -Method Delete -Uri "$base/api/financial-records/$recordId" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'}; $result.recordDelete=@{status=200;ok=$rd.success} } catch { $result.recordDelete=@{status=(Get-Err $_);ok=$false} } }

# Dashboard endpoints
$dash=[ordered]@{}
$dashPaths=@('/api/dashboard/total-income','/api/dashboard/total-expense','/api/dashboard/net-balance','/api/dashboard/category-wise','/api/dashboard/monthly-trends','/api/dashboard/last-transactions?limit=5','/api/dashboard/top-expense-categories?limit=3','/api/dashboard/summary')
if($analystToken){
  foreach($p in $dashPaths){
    try { $d=Invoke-RestMethod -Method Get -Uri "$base$p" -Headers @{Authorization="Bearer $analystToken"; 'x-role'='analyst'}; $dash[$p]=@{status=200;ok=$d.success} } catch { $dash[$p]=@{status=(Get-Err $_);ok=$false} }
  }
}
$result.dashboardAnalyst=$dash
if($viewerToken){
  try { $viewerSummary=Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{Authorization="Bearer $viewerToken"; 'x-role'='viewer'}; $result.viewerSummaryAccess=@{status=200;ok=$viewerSummary.success} } catch { $result.viewerSummaryAccess=@{status=(Get-Err $_);ok=$false} }
}

# Logout and reuse detection
if($newRefresh){
  try { $lo=Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout" -ContentType 'application/json' -Body ((@{refreshToken=$newRefresh}|ConvertTo-Json -Compress)); $result.authLogout=@{status=200;ok=$lo.success} } catch { $result.authLogout=@{status=(Get-Err $_);ok=$false} }
  try { Invoke-WebRequest -Method Post -Uri "$base/api/auth/refresh-token" -ContentType 'application/json' -Body ((@{refreshToken=$newRefresh}|ConvertTo-Json -Compress)) -UseBasicParsing | Out-Null; $result.refreshReuseBlocked=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.refreshReuseBlocked=@{status=$sc;ok=($sc -eq 401)} }
}

# Deactivate temp viewer to validate inactive login rejection
if($viewerId){
  try { $deac=Invoke-RestMethod -Method Patch -Uri "$base/api/users/$viewerId" -Headers @{Authorization="Bearer $newAccess"; 'x-role'='admin'} -ContentType 'application/json' -Body '{"status":"inactive"}'; $result.userDeactivateViewer=@{status=200;ok=$deac.success} } catch { $result.userDeactivateViewer=@{status=(Get-Err $_);ok=$false} }
  try { Invoke-WebRequest -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ((@{email=$viewerEmail;password='SecurePass123'}|ConvertTo-Json -Compress)) -UseBasicParsing | Out-Null; $result.inactiveViewerLoginBlocked=@{status=200;ok=$false} } catch { $sc=Get-Err $_; $result.inactiveViewerLoginBlocked=@{status=$sc;ok=($sc -eq 401)} }
}

$result | ConvertTo-Json -Depth 14
