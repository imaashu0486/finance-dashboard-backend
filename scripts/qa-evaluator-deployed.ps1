$base='https://finance-dashboard-backend-gg5d.onrender.com'
$result=[ordered]@{}

function Get-Status($errorObj) {
  if ($errorObj.Exception.Response) {
    return [int]$errorObj.Exception.Response.StatusCode
  }
  return -1
}

# Admin login
$token=$null
try {
  $admin = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@demo.com","password":"Admin@123"}'
  $token = $admin.data.accessToken
  $result.adminLogin = @{ ok = $admin.success; status = 200 }
} catch {
  $result.adminLogin = @{ ok = $false; status = (Get-Status $_) }
  $result | ConvertTo-Json -Depth 10
  exit 0
}

# Invalid bearer token -> 401
try {
  Invoke-WebRequest -Method Get -Uri "$base/api/auth/me" -Headers @{ Authorization = 'Bearer invalid.token.here' } -UseBasicParsing | Out-Null
  $result.invalidBearer = @{ ok = $false; status = 200 }
} catch {
  $sc = Get-Status $_
  $result.invalidBearer = @{ ok = ($sc -eq 401); status = $sc }
}

# Invalid ObjectId update
try {
  Invoke-WebRequest -Method Patch -Uri "$base/api/financial-records/not-a-valid-id" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"notes":"x"}' -UseBasicParsing | Out-Null
  $result.invalidObjectIdUpdate = @{ ok = $false; status = 200 }
} catch {
  $sc = Get-Status $_
  $result.invalidObjectIdUpdate = @{ ok = ($sc -eq 400 -or $sc -eq 404); status = $sc }
}

# Non-existent valid ObjectId delete
$fakeId = '507f1f77bcf86cd799439011'
try {
  Invoke-WebRequest -Method Delete -Uri "$base/api/financial-records/$fakeId" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } -UseBasicParsing | Out-Null
  $result.nonexistentDelete = @{ ok = $false; status = 200 }
} catch {
  $sc = Get-Status $_
  $result.nonexistentDelete = @{ ok = ($sc -eq 404); status = $sc }
}

# Create -> delete -> update deleted
$recordId = $null
try {
  $created = Invoke-RestMethod -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":99,"type":"expense","category":"QA","date":"2026-04-03","notes":"delete-update-check"}'
  $recordId = $created.data.record._id
  $result.createForDeleteUpdate = @{ ok = $created.success; status = 201 }
} catch {
  $result.createForDeleteUpdate = @{ ok = $false; status = (Get-Status $_) }
}

if ($recordId) {
  try {
    $deleted = Invoke-RestMethod -Method Delete -Uri "$base/api/financial-records/$recordId" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' }
    $result.deleteForDeleteUpdate = @{ ok = $deleted.success; status = 200 }
  } catch {
    $result.deleteForDeleteUpdate = @{ ok = $false; status = (Get-Status $_) }
  }

  try {
    Invoke-WebRequest -Method Patch -Uri "$base/api/financial-records/$recordId" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"notes":"should fail"}' -UseBasicParsing | Out-Null
    $result.updateDeletedRecord = @{ ok = $false; status = 200 }
  } catch {
    $sc = Get-Status $_
    $result.updateDeletedRecord = @{ ok = ($sc -eq 404); status = $sc }
  }
}

# Empty filter result
try {
  $filtered = Invoke-RestMethod -Method Get -Uri "$base/api/financial-records?page=1&limit=5&type=income&category=NoSuchCategoryXYZ&search=NoResultZZ" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' }
  $count = ($filtered.data.records | Measure-Object).Count
  $result.filterEmptyResult = @{ ok = ($filtered.success -and $count -eq 0); status = 200; count = $count }
} catch {
  $result.filterEmptyResult = @{ ok = $false; status = (Get-Status $_) }
}

# Wrong type validation
try {
  Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":100,"type":"other","category":"Bad","date":"2026-04-03"}' -UseBasicParsing | Out-Null
  $result.invalidTypeValidation = @{ ok = $false; status = 200 }
} catch {
  $sc = Get-Status $_
  $result.invalidTypeValidation = @{ ok = ($sc -eq 400); status = $sc }
}

# Response envelope consistency
try {
  $summary = Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' }
  $hasEnvelope = ($summary.PSObject.Properties.Name -contains 'success' -and $summary.PSObject.Properties.Name -contains 'message' -and $summary.PSObject.Properties.Name -contains 'data')
  $result.responseEnvelope = @{ ok = $hasEnvelope; status = 200 }
} catch {
  $result.responseEnvelope = @{ ok = $false; status = (Get-Status $_) }
}

# Basic performance: 10 summary calls
$times = @()
for ($i = 0; $i -lt 10; $i++) {
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    Invoke-RestMethod -Method Get -Uri "$base/api/dashboard/summary" -Headers @{ Authorization = "Bearer $token"; 'x-role'='admin' } | Out-Null
  } catch {
    # Keep measuring even if one call fails
  }
  $sw.Stop()
  $times += $sw.ElapsedMilliseconds
}
$avg = [math]::Round((($times | Measure-Object -Average).Average), 2)
$max = ($times | Measure-Object -Maximum).Maximum
$result.dashboardPerf = @{ ok = $true; calls = 10; avgMs = $avg; maxMs = $max }

$result | ConvertTo-Json -Depth 12
