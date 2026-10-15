/* =========================================================
   CAMPUSCONNECT PROGRAMME SCOPE
   ---------------------------------------------------------
   Load AFTER js/api-base.js AND js/cc-session.js on every
   student page:

       <script src="../js/program-scope.js"></script>

   The student pages ship with hardcoded demo content for the
   BCA programme. This layer rewrites that content using the
   real catalogue rows for the signed-in student's programme
   (BCA | BBA | BCOM), so a B.Com student never sees BCA
   subjects, faculty, exams, attendance, results and so on.

   Sources
     GET /api/courses?program=<CODE>   (30 rows per programme,
                                        5 per semester)
     GET /api/faculty                  (department directory)
     GET /api/students/me              (profile page)

   Admins are left untouched, and if the catalogue cannot be
   fetched the page simply keeps its built-in data.
   ========================================================= */

(function (window, document) {
    "use strict";

    /* ---------------------------------------------------------
       session helpers
    --------------------------------------------------------- */

    function programCode() {
        try { return window.CC ? window.CC.program() : "BCA"; }
        catch (e) { return "BCA"; }
    }

    function programInfo() {
        try { return window.CC ? window.CC.programInfo() : null; }
        catch (e) { return null; }
    }

    function isAdmin() {
        try { return window.CC ? window.CC.isAdmin() : false; }
        catch (e) { return false; }
    }

    function currentUser() {
        try { return window.CC ? window.CC.user() : null; }
        catch (e) { return null; }
    }

    /* The student's own semester; the demo pages default to 5. */
    function currentSemester() {
        var n = null;
        try { n = window.CC ? window.CC.semester() : null; } catch (e) { n = null; }
        n = parseInt(n, 10);
        return (n >= 1 && n <= 6) ? n : 5;
    }

    function studentName() {
        var u = currentUser();
        return (u && u.name) || "Student";
    }

    /* course-code prefix used by each programme */
    function codePrefix() {
        return { BCA: "BCA", BBA: "BBA", BCOM: "COM" }[programCode()] || "";
    }

    /* ---------------------------------------------------------
       deterministic helpers (same student -> same numbers)
    --------------------------------------------------------- */

    function hash(str) {
        var h = 2166136261;
        str = String(str || "");
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 16777619) >>> 0;
        }
        return h >>> 0;
    }

    function pick(list, key) { return list[hash(key) % list.length]; }

    function between(key, lo, hi) {
        return lo + (hash(key) % (hi - lo + 1));
    }

    function ordinal(n) {
        var s = ["th", "st", "nd", "rd"];
        var v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function semesterLabel(n) { return "Semester " + n; }

    /* grading, shared by the results page and the profile CGPA so the two
       figures always agree */
    var GRADE_POINTS = { "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5 };

    function marksFor(code) { return between(code + "m", 62, 96); }

    function gradeFor(marks) {
        return marks >= 90 ? "O"
             : marks >= 80 ? "A+"
             : marks >= 70 ? "A"
             : marks >= 60 ? "B+"
             : marks >= 50 ? "B" : "C";
    }

    function cgpaFrom(list, upto) {
        var points = 0;
        var credits = 0;

        list.forEach(function (c) {
            if (c.semester > upto) { return; }
            points += GRADE_POINTS[gradeFor(marksFor(c.code))] * c.credits;
            credits += c.credits;
        });

        return credits ? Math.round((points / credits) * 100) / 100 : null;
    }

    /* average of the per-subject attendance the attendance page derives */
    function attendanceFrom(list, upto) {
        var rows = list.filter(function (c) { return c.semester <= upto; });
        if (!rows.length) { return null; }

        var total = 0;
        rows.forEach(function (c) { total += between(c.code + "p", 62, 96); });
        return Math.round(total / rows.length);
    }

    /* share of this semester's assignments already submitted, matching
       assignments.html's status cycle */
    function assignmentCompletion(list, semester) {
        var sem = coursesFor(list, semester);
        if (!sem.length) { return null; }

        var cycle = ["Pending", "Pending", "Submitted", "Submitted", "Pending"];
        var done = sem.filter(function (c, i) {
            return cycle[i % cycle.length] === "Submitted";
        }).length;

        return Math.round((done / sem.length) * 100);
    }

    function uniq(list) {
        var seen = {};
        var out = [];
        list.forEach(function (v) {
            if (v && !seen[v]) { seen[v] = 1; out.push(v); }
        });
        return out;
    }

    /* ---------------------------------------------------------
       icons
    --------------------------------------------------------- */

    function iconFor(name) {
        var n = String(name || "").toLowerCase();
        if (/lab|practical|workshop/.test(n)) { return "\uD83E\uDDEA"; }
        if (/database|sql|dbms|data management|data structure/.test(n)) { return "\uD83D\uDDC4\uFE0F"; }
        if (/web|html|javascript|internet|multimedia/.test(n)) { return "\uD83D\uDCBB"; }
        if (/network|communication system/.test(n)) { return "\uD83C\uDF10"; }
        if (/software|engineering|project|\bsdlc\b|system analysis/.test(n)) { return "\u2699\uFE0F"; }
        if (/math|statistic|quantitative|numerical|operation research/.test(n)) { return "\uD83D\uDCD0"; }
        if (/artificial intelligence|machine learning|data science|analytic|data mining/.test(n)) { return "\uD83E\uDD16"; }
        if (/account|audit|tax|finance|financial|banking|insurance|cost/.test(n)) { return "\uD83D\uDCB0"; }
        if (/econom/.test(n)) { return "\uD83D\uDCC8"; }
        if (/market|management|business|organis|organiz|entrepreneur|retail|human resource/.test(n)) { return "\uD83D\uDCCA"; }
        if (/law|legal|ethic|governance|corporate/.test(n)) { return "\u2696\uFE0F"; }
        if (/communic|english|language|soft skill|personality/.test(n)) { return "\uD83D\uDDE3\uFE0F"; }
        if (/environment|geograph|sustainab|tourism/.test(n)) { return "\uD83C\uDF31"; }
        if (/computer|programming|fundamental|algorithm|operating/.test(n)) { return "\uD83D\uDDA5\uFE0F"; }
        if (/cyber|security/.test(n)) { return "\uD83D\uDD10"; }
        return "\uD83D\uDCDA";
    }

    /* ---------------------------------------------------------
       catalogue
    --------------------------------------------------------- */

    var catalog = null;

    function cacheKey() { return "cc-scope-catalog-" + programCode(); }

    function loadCatalog() {
        if (catalog) { return Promise.resolve(catalog); }

        try {
            var raw = window.sessionStorage.getItem(cacheKey());
            if (raw) {
                var cached = JSON.parse(raw);
                if (cached && cached.length) {
                    catalog = cached;
                    return Promise.resolve(catalog);
                }
            }
        } catch (e) { /* private mode - refetch */ }

        var url = (window.CC_API_BASE || "") +
            "/api/courses?program=" + encodeURIComponent(programCode());

        return window.fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (rows) {
                var list = (rows || []).map(function (r) {
                    return {
                        id: r.id,
                        code: r.course_code,
                        name: r.course_name,
                        faculty: r.faculty_name || "",
                        credits: r.credits || 3,
                        department: r.department || "",
                        semester: parseInt(r.semester, 10),
                        description: r.description || ""
                    };
                }).filter(function (c) {
                    return c.code && c.semester >= 1 && c.semester <= 6;
                }).sort(function (a, b) {
                    return (a.semester - b.semester) || a.code.localeCompare(b.code);
                });

                catalog = list;
                try { window.sessionStorage.setItem(cacheKey(), JSON.stringify(list)); }
                catch (e) { /* quota */ }
                return catalog;
            });
    }

    function coursesFor(list, semester) {
        return list.filter(function (c) { return c.semester === semester; });
    }

    function facultyGroups(list) {
        var order = [];
        var map = {};

        list.forEach(function (c) {
            var name = String(c.faculty || "").trim();
            if (!name) { return; }
            if (!map[name]) {
                map[name] = { name: name, department: c.department, subjects: [] };
                order.push(name);
            }
            if (map[name].subjects.indexOf(c.name) === -1) {
                map[name].subjects.push(c.name);
            }
        });

        return order.map(function (n) { return map[n]; });
    }

    /* ---------------------------------------------------------
       dom helpers
    --------------------------------------------------------- */

    function byId(id) { return document.getElementById(id); }

    function call(name) {
        try {
            if (typeof window[name] === "function") { window[name](); }
        } catch (e) { /* a render helper must never break the page */ }
    }

    function replaceArray(binding, items) {
        try {
            binding.length = 0;
            for (var i = 0; i < items.length; i++) { binding.push(items[i]); }
        } catch (e) { /* binding missing - page keeps its own data */ }
    }

    /* rebuild a <select> keeping only its "all" option */
    function resetSelect(id) {
        var sel = byId(id);
        if (!sel) { return; }

        var keep = null;
        [].slice.call(sel.options).forEach(function (o) {
            if (o.value === "all") { keep = o; }
        });

        sel.innerHTML = "";
        if (keep) {
            sel.appendChild(keep);
        } else {
            var opt = document.createElement("option");
            opt.value = "all";
            opt.textContent = "All";
            sel.appendChild(opt);
        }
    }

    /* reset a filter to a known set of values. We fill the options
       ourselves instead of asking the page to repopulate, so a filter
       can never end up with duplicate entries. */
    function fillFilter(id, values) {
        var sel = byId(id);
        if (!sel) { return; }

        resetSelect(id);

        uniq(values).forEach(function (v) {
            var opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            sel.appendChild(opt);
        });

        sel.value = "all";
    }

    /* ---------------------------------------------------------
       page builders
    --------------------------------------------------------- */

    var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    /* ---- courses.html ---- */
    function buildCourses(list, ctx) {
        var prefix = codePrefix();

        /* Students cannot add or edit courses, so the page list is always
           rebuilt from the programme catalogue. Anything a previous account
           cached in localStorage is discarded. */
        var items = list.map(function (c, i) {
            return {
                id: c.id || (i + 1),
                code: c.code,
                name: c.name,
                faculty: c.faculty,
                credits: c.credits,
                department: c.department,
                semester: semesterLabel(c.semester),
                status: c.semester < ctx.semester ? "Completed" : "Active",
                icon: iconFor(c.name),
                description: c.description ||
                    (c.name + " \u2014 part of the " + ctx.info.full + " programme.")
            };
        });

        try { window.localStorage.removeItem("campusConnectCourses"); }
        catch (e) { /* storage blocked */ }

        try { if (typeof courses !== "undefined") { courses = items; } }
        catch (e) { /* binding missing */ }

        /* the "add course" example code, e.g. Example: BCA401 */
        [].slice.call(document.querySelectorAll('input[placeholder^="Example: "]'))
            .forEach(function (input) {
                input.placeholder = "Example: " + prefix + "401";
            });

        call("renderCourses");
        call("updateStats");
    }

    /* ---- faculty.html ---- */
    function buildFaculty(list, ctx) {
        var people = facultyGroups(list);

        var items = people.map(function (f, i) {
            var login = f.name.toLowerCase()
                .replace(/^dr\.?\s*/, "")
                .replace(/[^a-z ]/g, "")
                .trim().replace(/\s+/g, ".");

            return {
                id: "F" + (i + 1),
                name: f.name,
                dept: f.department || ctx.info.department,
                subject: f.subjects.join(", "),
                designation: pick(["Professor", "Associate Professor",
                                   "Assistant Professor"], f.name),
                email: (f.name.toLowerCase().indexOf("dr") === 0 ? "dr." : "") +
                       login + "@campusconnect.edu",
                phone: "+91 98" + between(f.name, 100, 999) + " " +
                       between(f.name + "p", 10000, 99999),
                office: "Room " + between(f.name + "o", 101, 410) + ", " +
                        (f.department || "Main") + " Block",
                hours: pick(["Mon\u2013Fri, 10:00\u201311:00 AM",
                             "Mon\u2013Fri, 2:00\u20133:00 PM",
                             "Tue & Thu, 11:00 AM\u201312:00 PM",
                             "Mon, Wed, Fri, 1:00\u20132:00 PM"], f.name),
                rating: (40 + between(f.name + "r", 4, 9)) / 10,
                status: pick(["available", "busy", "away"], f.name + "s")
            };
        });

        replaceArray(FACULTY, items);

        fillFilter("deptFilter", items.map(function (f) { return f.dept; }));
        call("renderOverview");
        call("renderFaculty");
        call("renderDepartments");
    }

    /* ---- exams.html ---- */
    function buildExams(list, ctx) {
        var sem = coursesFor(list, ctx.semester);
        var items = [];

        sem.forEach(function (c, i) {
            var day = 8 + (i * 4);
            var d = String(day > 28 ? 28 : day).padStart(2, "0");
            var practical = /lab|practical|project|workshop/.test(c.name.toLowerCase());

            items.push({
                id: "E" + (i + 1),
                subject: c.name,
                code: c.code,
                type: practical ? "Practical" : "Theory",
                date: d,
                month: "OCT",
                fullDate: d + " October 2026",
                time: practical ? "10:00 AM - 12:00 PM" : "10:00 AM - 1:00 PM",
                room: practical ? ("Lab " + (1 + (i % 3))) : ("Exam Hall " + (1 + (i % 3))),
                status: "upcoming",
                duration: practical ? "2 Hours" : "3 Hours"
            });
        });

        /* one completed internal from the previous semester, for history */
        var prev = coursesFor(list, Math.max(1, ctx.semester - 1));
        if (prev.length) {
            var p = prev[0];
            items.push({
                id: "E" + (items.length + 1),
                subject: p.name,
                code: p.code,
                type: "Internal",
                date: "25",
                month: "SEP",
                fullDate: "25 September 2026",
                time: "10:00 AM - 12:00 PM",
                room: "Seminar Hall",
                status: "completed",
                duration: "2 Hours"
            });
        }

        replaceArray(EXAMS, items);

        fillFilter("typeFilter", items.map(function (e) { return e.type; }));
        call("renderOverview");
        call("renderExams");
        call("renderSubjects");
    }

    /* ---- attendance.html ---- */
    function buildAttendance(list, ctx) {
        var sem = coursesFor(list, ctx.semester);

        var rows = sem.map(function (c, i) {
            var total = between(c.code + "t", 40, 48);
            var pct = between(c.code + "p", 62, 96);
            var attended = Math.round((total * pct) / 100);

            return {
                id: "A" + (i + 1),
                subject: c.name,
                code: c.code,
                faculty: c.faculty,
                attended: attended,
                total: total,
                status: pct >= 75 ? "good" : (pct >= 65 ? "warning" : "low")
            };
        });

        replaceArray(ATTENDANCE, rows);

        var records = sem.map(function (c, i) {
            return {
                date: (25 + i) + " Sep 2026",
                subject: c.name,
                faculty: c.faculty,
                status: pick(["Present", "Present", "Present", "Absent", "Late"],
                             c.code + "rec")
            };
        });

        replaceArray(RECENT_RECORDS, records);

        call("renderOverview");
        call("renderAttendance");
        call("renderRecentRecords");
    }

    /* ---- results.html ---- */
    function buildResults(list, ctx) {
        var rows = [];
        var semesters = [];

        for (var s = 1; s <= ctx.semester; s++) {
            semesters.push(semesterLabel(s));
        }

        list.forEach(function (c) {
            if (c.semester > ctx.semester) { return; }

            var marks = marksFor(c.code);
            var grade = gradeFor(marks);

            rows.push({
                semester: semesterLabel(c.semester),
                subject: c.name,
                code: c.code,
                marks: marks,
                max: 100,
                grade: grade,
                gradePoint: GRADE_POINTS[grade],
                credits: c.credits
            });
        });

        replaceArray(RESULTS, rows);
        replaceArray(SEMESTERS, semesters);

        fillFilter("semesterFilter", semesters);
        call("renderOverview");
        call("renderResults");
        call("renderPerformance");
    }

    /* ---- assignments.html ---- */
    function buildAssignments(list, ctx) {
        var sem = coursesFor(list, ctx.semester);
        var statuses = ["Pending", "Pending", "Submitted", "Submitted", "Pending"];

        var items = sem.map(function (c, i) {
            return {
                id: i + 1,
                subject: c.name,
                title: c.name + " " + pick(["Assignment", "Report", "Case Study",
                                            "Project", "Worksheet"], c.code),
                faculty: c.faculty,
                due: (20 + (i * 2)) + " Sept 2026",
                status: statuses[i % statuses.length],
                icon: iconFor(c.name)
            };
        });

        replaceArray(assignments, items);

        fillFilter("subjectFilter", items.map(function (a) { return a.subject; }));
        call("updateSummary");
        call("renderAssignments");
    }

    /* ---- timetable.html ---- */
    function buildTimetable(list, ctx) {
        var sem = coursesFor(list, ctx.semester);
        if (!sem.length) { return; }

        var times = ["09:00 AM", "11:00 AM", "02:00 PM", "03:30 PM"];
        var data = {};

        DAYS.forEach(function (day, d) {
            var slots = [];
            var count = d < 5 ? 3 : 2;

            for (var i = 0; i < count; i++) {
                var c = sem[(d * 3 + i) % sem.length];
                var isLab = /lab|practical|project/.test(c.name.toLowerCase());

                slots.push({
                    time: times[i % times.length],
                    subject: c.name,
                    faculty: c.faculty,
                    room: isLab ? ("Lab " + (1 + (i % 3)))
                                : ("Room " + (101 + ((d * 37 + i * 11) % 5) * 10)),
                    type: isLab ? "Lab" : "Class",
                    icon: iconFor(c.name)
                });
            }
            data[day] = slots;
        });

        if (typeof timetableData === "undefined") { return; }

        Object.keys(timetableData).forEach(function (k) { delete timetableData[k]; });
        Object.keys(data).forEach(function (k) { timetableData[k] = data[k]; });

        var subjects = [];
        Object.keys(data).forEach(function (day) {
            data[day].forEach(function (slot) { subjects.push(slot.subject); });
        });

        fillFilter("subjectFilter", subjects);
        call("renderTimetable");
        call("updateDayStats");
        call("updateWeeklyStats");
    }

    /* ---- placement.html ---- */
    var PLACEMENTS_FOR = {
        BBA: [
            { id: "P1", company: "Deloitte", role: "Business Analyst", type: "job",
              location: "Bengaluru", package: "\u20B96.5 LPA", deadline: "24 Oct 2026",
              status: "open", eligibility: "BBA / B.Com",
              skills: "Excel, Business Analysis, Communication",
              description: "Business analyst role covering process mapping, reporting and client requirements." },
            { id: "P2", company: "ICICI Bank", role: "Management Trainee", type: "job",
              location: "Mumbai", package: "\u20B95.8 LPA", deadline: "12 Oct 2026",
              status: "open", eligibility: "BBA / B.Com",
              skills: "Banking, Sales, Communication",
              description: "Branch and relationship-management track for fresh graduates." },
            { id: "P3", company: "Flipkart", role: "Operations Intern", type: "internship",
              location: "Bengaluru", package: "\u20B920,000 / month", deadline: "18 Oct 2026",
              status: "open", eligibility: "BBA / B.Com",
              skills: "Excel, Operations, Analytics",
              description: "Six-month operations internship across warehouse and last-mile teams." },
            { id: "P4", company: "HDFC Life", role: "Management Trainee", type: "job",
              location: "Chennai", package: "\u20B94.8 LPA", deadline: "12 Oct 2026",
              status: "closing", eligibility: "BBA / B.Com",
              skills: "Insurance, Sales, Customer Relations",
              description: "Sales and advisory role with structured on-the-job training." },
            { id: "P5", company: "KPMG", role: "Advisory Intern", type: "internship",
              location: "Hyderabad", package: "\u20B925,000 / month", deadline: "22 Oct 2026",
              status: "open", eligibility: "BBA / B.Com",
              skills: "Excel, Research, Business Analysis",
              description: "Internship with the risk and business advisory practice." },
            { id: "P6", company: "Zomato", role: "Marketing Associate", type: "job",
              location: "Gurugram", package: "\u20B95.4 LPA", deadline: "28 Oct 2026",
              status: "open", eligibility: "BBA / B.Com",
              skills: "Marketing, Communication, Analytics",
              description: "Growth and campaign execution for the consumer marketing team." }
        ]
    };

    var PLACEMENTS_BCOM = [
        { id: "P1", company: "KPMG", role: "Audit Associate", type: "job",
          location: "Bengaluru", package: "\u20B96.0 LPA", deadline: "20 Oct 2026",
          status: "open", eligibility: "B.Com / BBA",
          skills: "Accounting, Excel, Auditing",
          description: "Statutory audit engagements for mid-market clients." },
        { id: "P2", company: "Deloitte", role: "Tax Associate", type: "job",
          location: "Hyderabad", package: "\u20B96.2 LPA", deadline: "24 Oct 2026",
          status: "open", eligibility: "B.Com / BBA",
          skills: "Taxation, Accounting, Excel",
          description: "Direct and indirect tax compliance for corporate clients." },
        { id: "P3", company: "ICICI Bank", role: "Probationary Officer", type: "job",
          location: "Mumbai", package: "\u20B95.6 LPA", deadline: "15 Oct 2026",
          status: "open", eligibility: "B.Com / BBA",
          skills: "Banking, Accounting, Communication",
          description: "Banking operations and relationship-management training programme." },
        { id: "P4", company: "EY", role: "Assurance Intern", type: "internship",
          location: "Bengaluru", package: "\u20B922,000 / month", deadline: "19 Oct 2026",
          status: "open", eligibility: "B.Com / BBA",
          skills: "Accounting, Excel, Auditing",
          description: "Assurance internship supporting audit fieldwork." },
        { id: "P5", company: "Grant Thornton", role: "Accounts Executive", type: "job",
          location: "Chennai", package: "\u20B94.6 LPA", deadline: "10 Oct 2026",
          status: "closing", eligibility: "B.Com",
          skills: "Book-keeping, Tally, Excel",
          description: "Book-keeping and MIS reporting for client accounts." },
        { id: "P6", company: "PwC", role: "Finance Intern", type: "internship",
          location: "Gurugram", package: "\u20B925,000 / month", deadline: "26 Oct 2026",
          status: "open", eligibility: "B.Com / BBA",
          skills: "Finance, Excel, Analytics",
          description: "Finance transformation internship with the consulting team." }
    ];

    var DRIVES_BY_PROGRAM = {
        BBA: [
            { date: "07 OCT", company: "Deloitte", title: "Business Analyst Drive",
              details: "Aptitude and group discussion followed by HR interview." },
            { date: "14 OCT", company: "ICICI Bank", title: "Management Trainee Drive",
              details: "Online assessment, personal interview and document verification." },
            { date: "22 OCT", company: "KPMG", title: "Advisory Internship Drive",
              details: "Case discussion and panel interview for internship roles." }
        ],
        BCOM: [
            { date: "06 OCT", company: "KPMG", title: "Audit Associate Drive",
              details: "Accounting aptitude test followed by technical and HR rounds." },
            { date: "13 OCT", company: "Deloitte", title: "Tax Associate Drive",
              details: "Online assessment on taxation and accounting fundamentals." },
            { date: "21 OCT", company: "EY", title: "Assurance Internship Drive",
              details: "Group exercise and interview for the assurance practice." }
        ]
    };

    function buildPlacement(list, ctx) {
        var code = programCode();
        if (code === "BCA") { return; }   /* built-in list is already the BCA one */

        replaceArray(PLACEMENTS,
            code === "BCOM" ? PLACEMENTS_BCOM : PLACEMENTS_FOR.BBA);
        replaceArray(DRIVES, DRIVES_BY_PROGRAM[code] || []);

        call("renderOverview");
        call("renderPlacements");
        call("renderDrives");
    }

    /* ---- profile.html ---- */
    function buildProfile(list, ctx) {
        var info = ctx.info;
        var sem = ctx.semester;
        var name = ctx.name;
        var user = ctx.user || {};
        var chip = info.label + " \u2022 " + ordinal(sem) + " Semester";

        function text(selector, value) {
            var el = document.querySelector(selector);
            if (el && value) { el.textContent = value; }
        }

        text("#heroName", name);
        text("#infoName", name);

        var heroDesc = byId("heroDescription");
        if (heroDesc) {
            heroDesc.innerHTML = info.label + " student \u2022 " + ordinal(sem) +
                " Semester<br>CampusConnect Student Portal";
        }

        var tags = document.querySelectorAll(".hero-tags .hero-tag");
        if (tags[0]) { tags[0].textContent = "\uD83C\uDF93 " + info.label; }
        if (tags[1]) { tags[1].textContent = "\uD83D\uDCDA " + ordinal(sem) + " Semester"; }

        /* avatar initial + hero stat boxes (semester / CGPA) */
        var avatar = byId("heroAvatar");
        if (avatar) {
            avatar.textContent = name.trim().split(/\s+/).map(function (w) {
                return w.charAt(0);
            }).join("").slice(0, 2).toUpperCase() || "S";
        }

        var cgpa = (list && list.length) ? cgpaFrom(list, sem) : null;
        if (window.PS) { window.PS.cgpa = cgpa; }

        var statBoxes = document.querySelectorAll(".hero-stats .stat-box");
        if (statBoxes[0]) {
            var semStrong = statBoxes[0].querySelector("strong");
            if (semStrong) { semStrong.textContent = String(sem); }
        }
        if (statBoxes[1] && cgpa !== null) {
            var cgpaStrong = statBoxes[1].querySelector("strong");
            if (cgpaStrong) { cgpaStrong.textContent = cgpa.toFixed(2); }
        }

        document.querySelectorAll(".info-item").forEach(function (item) {
            var label = item.querySelector(".info-label");
            var value = item.querySelector(".info-value");
            if (!label || !value) { return; }
            var key = label.textContent.trim().toLowerCase();
            if (key === "full name") { value.textContent = name; }
            if (key === "student id" && user.student_id) { value.textContent = user.student_id; }
            if (key === "email" && user.email) { value.textContent = user.email; }
            if (key === "phone" && user.phone) { value.textContent = user.phone; }

            /* the student table has no dob / gender column - don't show demo
               values as if they were this student's real details */
            if (user.name && (key === "date of birth" || key === "gender")) {
                value.textContent = key === "gender"
                    ? (user.gender || "\u2014")
                    : (user.dob || "\u2014");
            }
        });

        document.querySelectorAll(".summary-card").forEach(function (card) {
            var title = card.querySelector(".summary-title");
            var num = card.querySelector(".summary-number");
            if (!title || !num) { return; }
            var key = title.textContent.trim().toUpperCase();

            if (key === "PROGRAM") {
                num.textContent = info.label;
                var small = card.querySelector(".summary-small");
                if (small) { small.textContent = info.full; }
                card.setAttribute("onclick", "showToast('" + chip + " \uD83C\uDF93')");
            }
            if (key === "SEMESTER") {
                num.textContent = String(sem);
                card.setAttribute("onclick",
                    "showToast('" + ordinal(sem) + " Semester \uD83D\uDCDA')");
            }
            if (key === "CGPA" && cgpa !== null) {
                num.textContent = cgpa.toFixed(2);
                card.setAttribute("onclick",
                    "showToast('Current CGPA: " + cgpa.toFixed(2) + " \u2B50')");
            }
        });

        /* progress cards: academic / attendance / assignments */
        var progressValues = {
            "academic progress": cgpa !== null ? Math.round(cgpa * 10) : null,
            "attendance": (list && list.length) ? attendanceFrom(list, sem) : null,
            "assignment completion": (list && list.length)
                ? assignmentCompletion(list, sem) : null
        };

        document.querySelectorAll(".progress-box").forEach(function (box) {
            var label = box.querySelector(".progress-head strong");
            var pctEl = box.querySelector(".progress-head span");
            var fill = box.querySelector(".progress-fill");
            if (!label || !pctEl) { return; }

            var v = progressValues[label.textContent.trim().toLowerCase()];
            if (v === null || v === undefined) { return; }

            pctEl.textContent = v + "%";
            if (fill) { fill.style.width = v + "%"; }
        });
    }

    /* ---------------------------------------------------------
       builder registry
    --------------------------------------------------------- */

    var BUILDERS = {
        "courses.html": buildCourses,
        "faculty.html": buildFaculty,
        "exams.html": buildExams,
        "attendance.html": buildAttendance,
        "results.html": buildResults,
        "assignments.html": buildAssignments,
        "timetable.html": buildTimetable,
        "placement.html": buildPlacement,
        "profile.html": buildProfile
    };

    /* ---------------------------------------------------------
       boot
    --------------------------------------------------------- */

    function pageName() {
        var parts = window.location.pathname.split("/");
        return parts[parts.length - 1] || "";
    }

    function refreshChip() {
        var info = programInfo();
        if (!info) { return; }

        var chip = document.querySelector(".profile-info span");
        if (chip) {
            chip.textContent = isAdmin()
                ? "CampusConnect"
                : info.label + " \u2022 " + ordinal(currentSemester()) + " Sem";
        }
        try { window.CC.applyTheme(); } catch (e) { /* ignore */ }
    }

    function context() {
        return {
            program: programCode(),
            info: programInfo(),
            semester: currentSemester(),
            name: studentName(),
            user: currentUser() || {}
        };
    }

    /* ---------------------------------------------------------
       profile: read the real record
    --------------------------------------------------------- */

    var PROFILE_STUDENT = null;

    function fetchStudent() {
        if (PROFILE_STUDENT) { return Promise.resolve(PROFILE_STUDENT); }

        var url = (window.CC_API_BASE || "") + "/api/students/me";
        var headers = {};
        try { headers.Authorization = "Bearer " + window.CC.token(); } catch (e) { /* ignore */ }

        return window.fetch(url, { headers: headers })
            .then(function (res) { return res.json(); })
            .then(function (body) {
                var d = (body && body.data) || {};
                PROFILE_STUDENT = (d.student && d.student) || d.user || d || {};
                return PROFILE_STUDENT;
            })
            .catch(function () { return {}; });
    }

    function buildProfileFrom(student, list) {
        var ctx = context();

        if (student && student.name) {
            if (!ctx.user) { ctx.user = {}; }
            ["name", "email", "phone", "student_id"].forEach(function (k) {
                if (student[k]) { ctx.user[k] = student[k]; }
            });
            if (student.studentId) { ctx.user.student_id = student.studentId; }
            ctx.name = ctx.user.name || ctx.name;
        }

        buildProfile(list || [], ctx);
    }

    /* ---------------------------------------------------------
       run
    --------------------------------------------------------- */

    /* small debug/verification surface: PS.ran tells tests the builder finished */
    function mark(state, err) {
        if (!window.PS) { return; }
        window.PS.ran = state;
        window.PS.error = err ? String(err) : null;
    }

    function runBuilder(builder, list) {
        try {
            builder(list, context());
            mark(pageName(), null);
        } catch (e) {
            mark(pageName(), e);
        }
        refreshChip();
    }

    function start() {
        refreshChip();

        var page = pageName();
        var builder = BUILDERS[page];
        if (!builder || isAdmin()) { mark(page, null); return; }

        if (page === "profile.html") {
            Promise.all([
                loadCatalog().catch(function () { return []; }),
                fetchStudent()
            ]).then(function (r) {
                try {
                    buildProfileFrom(r[1], r[0]);
                    mark(page, null);
                } catch (e) { mark(page, e); }
                refreshChip();
            });
            return;
        }

        loadCatalog()
            .then(function (list) {
                if (!list || !list.length) { mark(page, null); return; }
                runBuilder(builder, list);
            })
            .catch(function () { mark(page, null); });
    }

    /* Some pages bootstrap from window "load" (e.g. assignments.html), which
       fires after DOMContentLoaded - so we scope once early and once on load.
       Every builder is idempotent, so running twice is safe. */
    function schedule() {
        start();
        if (document.readyState !== "complete") {
            window.addEventListener("load", function () { start(); });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", schedule);
    } else {
        schedule();
    }

    window.PS = {
        program: programCode,
        info: programInfo,
        semester: currentSemester,
        catalog: loadCatalog,
        refreshChip: refreshChip
    };
}(window, document));
