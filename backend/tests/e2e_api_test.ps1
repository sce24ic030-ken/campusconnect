# CampusConnect backend - end to end API test
$ErrorActionPreference = "Continue"
$BASE = "http://127.0.0.1:5000"
$MYSQL = "C:\Users\acube\AppData\Local\Programs\mysql\mysql-8.0.46-winx64\bin\mysql.exe"

$script:pass = 0
$script:fail = 0

function Call($method, $path, $body = $null, $token = $null) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$BASE$path"; Method = $method; Headers = $headers; TimeoutSec = 20; UseBasicParsing = $true }
    if ($body -ne $null) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($body | ConvertTo-Json -Depth 6 -Compress)
    }
    try {
        $resp = Invoke-WebRequest @params
        return @{ Status = [int]$resp.StatusCode; Body = $resp.Content }
    } catch {
        $r = $_.Exception.Response
        if ($r) {
            $sr = New-Object System.IO.StreamReader($r.GetResponseStream())
            return @{ Status = [int]$r.StatusCode; Body = $sr.ReadToEnd() }
        }
        return @{ Status = 0; Body = $_.Exception.Message }
    }
}

function Check($name, $result, $expect = 200) {
    $ok = ($result.Status -eq $expect)
    if ($ok) { $script:pass++ } else { $script:fail++ }
    $tag = if ($ok) { "PASS" } else { "FAIL" }
    Write-Output ("[{0}] {1} -> {2} (expected {3})" -f $tag, $name, $result.Status, $expect)
    if (-not $ok) { Write-Output ("        " + $result.Body) }
}

function J($result) { return ($result.Body | ConvertFrom-Json) }

# ---------------- wait for server ----------------
$up = $false
for ($i = 0; $i -lt 30; $i++) {
    $h = Call "GET" "/"
    if ($h.Status -eq 200) { $up = $true; break }
    Start-Sleep -Milliseconds 500
}
if (-not $up) { Write-Output "SERVER NOT UP"; exit 1 }
Write-Output "=== SERVER UP ==="

$ticks = [DateTime]::UtcNow.Ticks
$stuEmail = "stu$ticks@campusconnect.com"
$admEmail = "adm$ticks@campusconnect.com"
$pwd = "secret123"

# ---------------- auth ----------------
Check "health" (Call "GET" "/")
Check "register student" (Call "POST" "/api/auth/register" @{ name = "Stu One"; email = $stuEmail; password = $pwd }) 201
Check "register duplicate email" (Call "POST" "/api/auth/register" @{ name = "Stu One"; email = $stuEmail; password = $pwd }) 409
$login = Call "POST" "/api/auth/login" @{ email = $stuEmail; password = $pwd }
Check "login student" $login
$stuToken = (J $login).token
Check "login bad password" (Call "POST" "/api/auth/login" @{ email = $stuEmail; password = "wrong" }) 401
Check "protected without token" (Call "GET" "/api/students/me") 401

# ---------------- student profile ----------------
Check "get my profile" (Call "GET" "/api/students/me" $null $stuToken)
$r = Call "PUT" "/api/students/me" @{ name = "Stu Updated"; phone = "9876543210"; course = "BCA"; semester = "5"; student_id = "BCA$ticks" } $stuToken
Check "update my profile" $r
Check "profile shows update" (Call "GET" "/api/students/me" $null $stuToken)

# ---------------- settings ----------------
Check "get settings" (Call "GET" "/api/settings" $null $stuToken)
Check "update settings" (Call "PUT" "/api/settings" @{ dark_mode = $true; language = "Hindi" } $stuToken)

# ---------------- courses ----------------
$courses = J (Call "GET" "/api/courses")
Check "list courses" (Call "GET" "/api/courses")
$courseId = $courses[0].id
Check "get one course" (Call "GET" "/api/courses/$courseId")
Check "course 404" (Call "GET" "/api/courses/999999") 404
Check "courses filter" (Call "GET" "/api/courses?program=BCA&semester=5")

# ---------------- attendance ----------------
$today = (Get-Date).ToString("yyyy-MM-dd")
$a = Call "POST" "/api/attendance" @{ course_id = $courseId; attendance_date = $today; status = "Present" } $stuToken
Check "create attendance" $a 201
$attId = (J $a).data.id
Check "attendance bad status" (Call "POST" "/api/attendance" @{ attendance_date = $today; status = "Nope" } $stuToken) 400
Check "attendance bad date" (Call "POST" "/api/attendance" @{ attendance_date = "13-10-2026" } $stuToken) 400
Check "list attendance" (Call "GET" "/api/attendance" $null $stuToken)
Check "attendance summary" (Call "GET" "/api/attendance/summary" $null $stuToken)
Check "get attendance" (Call "GET" "/api/attendance/$attId" $null $stuToken)
Check "update attendance" (Call "PUT" "/api/attendance/$attId" @{ status = "Late" } $stuToken)
Check "delete attendance" (Call "DELETE" "/api/attendance/$attId" $null $stuToken)
Check "attendance 404" (Call "GET" "/api/attendance/$attId" $null $stuToken) 404

# ---------------- timetable ----------------
$t = Call "POST" "/api/timetable" @{ course_id = $courseId; day = "Monday"; start_time = "09:00"; end_time = "10:00"; room = "A101"; faculty_name = "Dr X" } $stuToken
Check "create timetable" $t 201
$ttId = (J $t).data.id
Check "timetable bad day" (Call "POST" "/api/timetable" @{ day = "Funday"; start_time = "09:00"; end_time = "10:00" } $stuToken) 400
Check "timetable end before start" (Call "POST" "/api/timetable" @{ day = "Tuesday"; start_time = "10:00"; end_time = "09:00" } $stuToken) 400
Check "list timetable" (Call "GET" "/api/timetable" $null $stuToken)
Check "get timetable entry" (Call "GET" "/api/timetable/$ttId" $null $stuToken)
Check "update timetable" (Call "PUT" "/api/timetable/$ttId" @{ room = "B202" } $stuToken)
Check "delete timetable" (Call "DELETE" "/api/timetable/$ttId" $null $stuToken)

# ---------------- assignments ----------------
$asg = Call "POST" "/api/assignments" @{ course_id = $courseId; title = "DBMS Assignment"; description = "Normalize"; due_date = $today } $stuToken
Check "create assignment" $asg 201
$asgId = (J $asg).data.id
Check "list assignments" (Call "GET" "/api/assignments" $null $stuToken)
Check "get assignment" (Call "GET" "/api/assignments/$asgId" $null $stuToken)
Check "update assignment" (Call "PUT" "/api/assignments/$asgId" @{ description = "Updated desc" } $stuToken)
Check "submit assignment" (Call "POST" "/api/assignments/$asgId/submit" @{ submission_file = "dbms.pdf" } $stuToken)
Check "delete assignment" (Call "DELETE" "/api/assignments/$asgId" $null $stuToken)

# ---------------- exams ----------------
$ex = Call "POST" "/api/exams" @{ course_id = $courseId; exam_name = "Mid Term"; exam_date = $today; start_time = "10:00"; end_time = "12:00"; room = "Hall 1"; exam_type = "Internal" } $stuToken
Check "create exam" $ex 201
$exId = (J $ex).data.id
Check "list exams upcoming" (Call "GET" "/api/exams?upcoming=1" $null $stuToken)
Check "get exam" (Call "GET" "/api/exams/$exId" $null $stuToken)
Check "update exam" (Call "PUT" "/api/exams/$exId" @{ room = "Hall 2" } $stuToken)
Check "delete exam" (Call "DELETE" "/api/exams/$exId" $null $stuToken)

# ---------------- results (student view) ----------------
Check "list my results" (Call "GET" "/api/results" $null $stuToken)
Check "results summary" (Call "GET" "/api/results/summary" $null $stuToken)

# ---------------- lost & found ----------------
$lf = Call "POST" "/api/lost-found" @{ item_name = "Black Wallet"; item_type = "Lost"; location = "Library"; item_date = $today; contact = "9999" } $stuToken
Check "create lost&found" $lf 201
$lfId = (J $lf).data.id
Check "list lost&found" (Call "GET" "/api/lost-found")
Check "list lost&found filter" (Call "GET" "/api/lost-found?item_type=Lost&status=Open")
Check "get lost&found" (Call "GET" "/api/lost-found/$lfId")
Check "update lost&found" (Call "PUT" "/api/lost-found/$lfId" @{ status = "Claimed" } $stuToken)
Check "delete lost&found" (Call "DELETE" "/api/lost-found/$lfId" $null $stuToken)

# ---------------- complaints ----------------
$cp = Call "POST" "/api/complaints" @{ subject = "Fan broken"; description = "Room 12 fan not working" } $stuToken
Check "create complaint" $cp 201
$cpId = (J $cp).data.id
Check "list complaints" (Call "GET" "/api/complaints" $null $stuToken)
Check "get complaint" (Call "GET" "/api/complaints/$cpId" $null $stuToken)

# ---------------- feedback ----------------
Check "create feedback" (Call "POST" "/api/feedback" @{ rating = 5; message = "Great app" } $stuToken) 201
Check "feedback bad rating" (Call "POST" "/api/feedback" @{ rating = 9 } $stuToken) 400
Check "list my feedback" (Call "GET" "/api/feedback" $null $stuToken)

# ---------------- library / documents ----------------
$doc = Call "POST" "/api/library/documents" @{ document_name = "Marksheet"; document_type = "PDF"; file_path = "uploads/demo.pdf" } $stuToken
Check "create document" $doc 201
$docId = (J $doc).data.id
Check "list documents" (Call "GET" "/api/library/documents" $null $stuToken)
Check "get document" (Call "GET" "/api/library/documents/$docId" $null $stuToken)
Check "delete document" (Call "DELETE" "/api/library/documents/$docId" $null $stuToken)

# ---------------- chatbot ----------------
Check "chatbot greeting" (Call "POST" "/api/chatbot/message" @{ message = "hello" } $stuToken)
Check "chatbot courses" (Call "POST" "/api/chatbot/message" @{ message = "show me courses" } $stuToken)
Check "chatbot attendance" (Call "POST" "/api/chatbot/message" @{ message = "what is my attendance" } $stuToken)
Check "chatbot fallback" (Call "POST" "/api/chatbot/message" @{ message = "asdfghjkl" } $stuToken)
Check "chatbot history" (Call "GET" "/api/chatbot/history" $null $stuToken)

# ---------------- academics overview ----------------
Check "academics overview" (Call "GET" "/api/academics/overview" $null $stuToken)

# ---------------- admin flows ----------------
Check "admin create student2" (Call "POST" "/api/auth/register" @{ name = "Adm Two"; email = $admEmail; password = $pwd }) 201
& $MYSQL -u root -e "UPDATE campusconnect.users SET role='admin' WHERE email='$admEmail';" 2>&1 | Out-Null
$admLogin = Call "POST" "/api/auth/login" @{ email = $admEmail; password = $pwd }
Check "login admin" $admLogin
$admToken = (J $admLogin).token

Check "admin stats" (Call "GET" "/api/admin/stats" $null $admToken)
Check "admin list users" (Call "GET" "/api/admin/users" $null $admToken)
Check "admin stats forbidden for student" (Call "GET" "/api/admin/stats" $null $stuToken) 403
Check "event create denied for student" (Call "POST" "/api/events" @{ title = "X" } $stuToken) 403

# events (admin)
$ev = Call "POST" "/api/events" @{ title = "Tech Fest"; event_date = $today; location = "Auditorium"; category = "Cultural" } $admToken
Check "admin create event" $ev 201
$evId = (J $ev).data.id
Check "public list events" (Call "GET" "/api/events")
Check "public get event" (Call "GET" "/api/events/$evId")
Check "admin update event" (Call "PUT" "/api/events/$evId" @{ location = "Main Hall" } $admToken)

# faculty (admin)
$fa = Call "POST" "/api/faculty" @{ name = "Dr Smith"; department = "MCA"; designation = "Professor"; email = "smith@college.edu"; subject = "AI" } $admToken
Check "admin create faculty" $fa 201
$faId = (J $fa).data.id
Check "public list faculty" (Call "GET" "/api/faculty")
Check "public get faculty" (Call "GET" "/api/faculty/$faId")
Check "admin update faculty" (Call "PUT" "/api/faculty/$faId" @{ designation = "HOD" } $admToken)

# campus (admin)
$ca = Call "POST" "/api/campus" @{ name = "Central Library"; category = "Library"; location = "Block A" } $admToken
Check "admin create campus" $ca 201
$caId = (J $ca).data.id
Check "public list campus" (Call "GET" "/api/campus")
Check "public get campus" (Call "GET" "/api/campus/$caId")
Check "admin update campus" (Call "PUT" "/api/campus/$caId" @{ location = "Block B" } $admToken)

# placements (admin)
$pl = Call "POST" "/api/placements" @{ company_name = "Acme Corp"; job_role = "Developer"; eligibility = "BCA"; package = "6 LPA"; location = "Pune"; application_deadline = $today } $admToken
Check "admin create placement" $pl 201
$plId = (J $pl).data.id
Check "public list placements" (Call "GET" "/api/placements")
Check "public get placement" (Call "GET" "/api/placements/$plId")
Check "admin update placement" (Call "PUT" "/api/placements/$plId" @{ package = "7 LPA" } $admToken)

# applications
$ap = Call "POST" "/api/applications" @{ placement_id = $plId; cover_note = "I am interested" } $stuToken
Check "student apply" $ap 201
$apId = (J $ap).data.id
Check "student apply duplicate" (Call "POST" "/api/applications" @{ placement_id = $plId } $stuToken) 409
Check "list my applications" (Call "GET" "/api/applications" $null $stuToken)
Check "get application" (Call "GET" "/api/applications/$apId" $null $stuToken)
Check "admin update application" (Call "PUT" "/api/applications/$apId" @{ status = "Shortlisted" } $admToken)

# results (admin create)
$res = Call "POST" "/api/results" @{ user_id = ((J (Call "GET" "/api/students/me" $null $stuToken)).data.id); subject = "DBMS"; semester = "5"; marks = 85; max_marks = 100 } $admToken
Check "admin create result" $res 201
$resId = (J $res).data.id
Check "student results summary after" (Call "GET" "/api/results/summary" $null $stuToken)
Check "student get result" (Call "GET" "/api/results/$resId" $null $stuToken)

# notifications
$nt = Call "POST" "/api/notifications" @{ user_id = ((J (Call "GET" "/api/students/me" $null $stuToken)).data.id); title = "Welcome"; message = "Hi there" } $admToken
Check "admin create notification" $nt 201
$ntId = (J $nt).data.id
Check "student list notifications" (Call "GET" "/api/notifications" $null $stuToken)
Check "student unread count" (Call "GET" "/api/notifications/unread-count" $null $stuToken)
Check "student mark read" (Call "PUT" "/api/notifications/$ntId/read" $null $stuToken)
Check "student read-all" (Call "PUT" "/api/notifications/read-all" $null $stuToken)
Check "admin broadcast" (Call "POST" "/api/notifications/broadcast" @{ title = "Exam notice"; message = "Exams soon" } $admToken) 201

# complaints admin response
Check "admin respond complaint" (Call "PUT" "/api/complaints/$cpId" @{ status = "Resolved"; response = "Fixed" } $admToken)
Check "admin feedback summary" (Call "GET" "/api/feedback/summary" $null $admToken)
Check "admin delete complaint" (Call "DELETE" "/api/complaints/$cpId" $null $admToken)

# cleanup admin records
Check "student withdraw application" (Call "DELETE" "/api/applications/$apId" $null $stuToken)
Check "admin delete event" (Call "DELETE" "/api/events/$evId" $null $admToken)
Check "admin delete faculty" (Call "DELETE" "/api/faculty/$faId" $null $admToken)
Check "admin delete campus" (Call "DELETE" "/api/campus/$caId" $null $admToken)
Check "admin delete placement" (Call "DELETE" "/api/placements/$plId" $null $admToken)
Check "admin delete result" (Call "DELETE" "/api/results/$resId" $null $admToken)
Check "clear chat history" (Call "DELETE" "/api/chatbot/history" $null $stuToken)

Write-Output ""
Write-Output "====================================="
Write-Output ("RESULT: PASS={0} FAIL={1}" -f $script:pass, $script:fail)
Write-Output "====================================="
