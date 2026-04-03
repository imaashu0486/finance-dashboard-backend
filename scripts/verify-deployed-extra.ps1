Write-Host "Deprecated: use scripts/qa-evaluator-deployed.ps1 (or npm run test:deployed)."
& "$PSScriptRoot\qa-evaluator-deployed.ps1"
exit 0

$base='https://finance-dashboard-backend-gg5d.onrender.com'
$result=[ordered]@{}

function Get-Status($errorObj) {
  if ($errorObj.Exception.Response) {
    return [int]$errorObj.Exception.Response.StatusCode
  }
  return -1
}

try {
  Invoke-WebRequest -Uri "$base/" -UseBasicParsing | Out-Null
  $result.root404=@{ok=$false;status=200}
} catch {
  $sc=Get-Status $_
  $result.root404=@{ok=($sc -eq 404);status=$sc}
}

try {
  Invoke-WebRequest -Uri "$base/api" -UseBasicParsing | Out-Null
  $result.api404=@{ok=$false;status=200}
} catch {
  $sc=Get-Status $_
  $result.api404=@{ok=($sc -eq 404);status=$sc}
}

try {
  Invoke-WebRequest -Uri "$base/api/users" -UseBasicParsing | Out-Null
  $result.unauthUsers=@{ok=$false;status=200}
} catch {
  $sc=Get-Status $_
  $result.unauthUsers=@{ok=($sc -eq 401);status=$sc}
}

try {
  Invoke-WebRequest -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body '{"name":"A"}' -UseBasicParsing | Out-Null
  $result.registerValidation=@{ok=$false;status=200}
} catch {
  $sc=Get-Status $_
  $result.registerValidation=@{ok=($sc -eq 400);status=$sc}
}

try {
  Invoke-WebRequest -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@demo.com","password":"WrongPass999"}' -UseBasicParsing | Out-Null
  $result.loginInvalid=@{ok=$false;status=200}
} catch {
  $sc=Get-Status $_
  $result.loginInvalid=@{ok=($sc -eq 401);status=$sc}
}

$admin=$null
try {
  $admin=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@demo.com","password":"Admin@123"}'
  $result.adminLogin=@{ok=$admin.success;status=200}
} catch {
  $result.adminLogin=@{ok=$false;status=(Get-Status $_)}
}

if ($admin) {
  $token=$admin.data.accessToken

  try {
    $logoutAll=Invoke-RestMethod -Method Post -Uri "$base/api/auth/logout-all" -Headers @{ Authorization = "Bearer $token" }
    $result.logoutAll=@{ok=$logoutAll.success;status=200}
  } catch {
    $result.logoutAll=@{ok=$false;status=(Get-Status $_)}
  }

  $admin2=$null
  try {
    $admin2=Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body '{"email":"admin@demo.com","password":"Admin@123"}'
    $result.adminRelogin=@{ok=$admin2.success;status=200}
  } catch {
    $result.adminRelogin=@{ok=$false;status=(Get-Status $_)}
  }

  if ($admin2) {
    $token2=$admin2.data.accessToken
    $uid=[guid]::NewGuid().ToString('N').Substring(0,6)
    $inactiveEmail="inactive.$uid@example.com"
    $createdId=$null

    try {
      $created=Invoke-RestMethod -Method Post -Uri "$base/api/users" -Headers @{ Authorization = "Bearer $token2"; 'x-role'='admin' } -ContentType 'application/json' -Body ((@{name="Inactive $uid";email=$inactiveEmail;password='SecurePass123';role='viewer';status='active'} | ConvertTo-Json -Compress))
      $createdId=$created.data.user.id
      $result.userCreate=@{ok=$created.success;status=201}
    } catch {
      $result.userCreate=@{ok=$false;status=(Get-Status $_)}
    }

    if ($createdId) {
      try {
        $updated=Invoke-RestMethod -Method Patch -Uri "$base/api/users/$createdId" -Headers @{ Authorization = "Bearer $token2"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"status":"inactive"}'
        $result.userDeactivate=@{ok=$updated.success;status=200}
      } catch {
        $result.userDeactivate=@{ok=$false;status=(Get-Status $_)}
      }

      try {
        Invoke-WebRequest -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body ((@{email=$inactiveEmail;password='SecurePass123'} | ConvertTo-Json -Compress)) -UseBasicParsing | Out-Null
        $result.inactiveLoginBlocked=@{ok=$false;status=200}
      } catch {
        $sc=Get-Status $_
        $result.inactiveLoginBlocked=@{ok=($sc -eq 401);status=$sc}
      }
    }

    try {
      Invoke-WebRequest -Method Post -Uri "$base/api/financial-records" -Headers @{ Authorization = "Bearer $token2"; 'x-role'='admin' } -ContentType 'application/json' -Body '{"amount":-1,"type":"income","category":"Bad","date":"2026-04-03"}' -UseBasicParsing | Out-Null
      $result.recordValidation=@{ok=$false;status=200}
    } catch {
      $sc=Get-Status $_
      $result.recordValidation=@{ok=($sc -eq 400);status=$sc}
    }
  }
}

$result | ConvertTo-Json -Depth 8
