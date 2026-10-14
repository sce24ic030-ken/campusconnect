/* =============================================================
   CAMPUSCONNECT AI — SHARED CHAT BRAIN
   Powers the EXISTING chat widget ( #chatBody / #chatInput /
   .quick-buttons ) on every page: dashboard, all module pages,
   and pages without a widget (index/register) get a copy of the
   standard widget injected.

   Reply strategy:
     1. Backend LLM  POST /api/chatbot/message  (NVIDIA NIM,
        gpt-oss-20b) with live student data + current page.
     2. Built-in project guide (offline fallback) so chat always
        works with the same personality and full app knowledge.
   ============================================================= */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* ---------------------------------------------------------
       1. PAGE / MODULE MAP (the whole project in one place)
    --------------------------------------------------------- */

    var MODULES = {
        dashboard: {
            name: "Dashboard",
            file: "dashboard.html",
            about: "Your home hub: a welcome banner, three stat cards (overall attendance %, total classes, upcoming events), today's timetable, upcoming events, campus photos, and me in the right panel.",
            howto: "Just glance at the cards — they link straight to Attendance, Timetable and Events when you click them.",
            words: ["dashboard", "home page", "main page", "main dashboard", "overview"]
        },
        courses: {
            name: "Courses",
            file: "courses.html",
            about: "The course catalog for your program — course code, name, semester and credits, with search and filters.",
            howto: "1️⃣ Open Courses from the left sidebar.\n2️⃣ Use the search box or semester filter.\n3️⃣ Click a course to see its details.",
            words: ["course", "courses", "subject", "subjects", "syllabus", "catalog"]
        },
        timetable: {
            name: "Timetable",
            file: "timetable.html",
            about: "Your week-wise class schedule — day, time, subject, room and faculty, filterable by day.",
            howto: "1️⃣ Open Timetable from the left sidebar.\n2️⃣ Pick a day to see its classes.\n3️⃣ Each row shows time, subject, room and faculty.",
            words: ["timetable", "schedule", "class timing", "classes today", "free period"]
        },
        assignments: {
            name: "Assignments",
            file: "assignments.html",
            about: "Every assignment with its due date and status (Pending / Submitted), plus the submit action.",
            howto: "1️⃣ Open Assignments from the left sidebar.\n2️⃣ Sort by due date so nothing sneaks up on you.\n3️⃣ Open an assignment and click Submit before the deadline.",
            words: ["assignment", "assignments", "homework", "submission", "submit", "due date"]
        },
        attendance: {
            name: "Attendance",
            file: "attendance.html",
            about: "Subject-wise attendance records with your overall percentage, plus guidance on the required attendance.",
            howto: "1️⃣ Open Attendance from the left sidebar.\n2️⃣ Check the overall % card first.\n3️⃣ Scan the subject rows for anything below the required percentage.",
            words: ["attendance", "present", "absent", "attendance percentage", "attendance required", "low attendance"]
        },
        academics: {
            name: "Academics",
            file: "academics.html",
            about: "Your academic snapshot — performance summary across subjects with quick links into results, attendance and courses.",
            howto: "1️⃣ Open Academics from the left sidebar.\n2️⃣ Review the summary cards.\n3️⃣ Jump into Results or Attendance for the details.",
            words: ["academics", "academic", "performance", "semester performance", "cgpa overview"]
        },
        faculty: {
            name: "Faculty",
            file: "faculty.html",
            about: "The Faculty Directory — name, department, designation, subject and contact for every professor, filterable by department.",
            howto: "1️⃣ Open Faculty from the left sidebar.\n2️⃣ Filter by department.\n3️⃣ Click a card to see the faculty member's details.",
            words: ["faculty", "professor", "teacher", "staff", "department", "hod"]
        },
        placement: {
            name: "Placement",
            file: "placement.html",
            about: "Campus placement drives — companies, roles, packages and application deadlines, and the apply flow.",
            howto: "1️⃣ Open Placement from the left sidebar.\n2️⃣ Browse open drives and check the package + deadline.\n3️⃣ Click Apply — your application shows up under My Applications.",
            words: ["placement", "placements", "job", "jobs", "internship", "intern", "company", "career", "package", "drive"]
        },
        results: {
            name: "Results",
            file: "results.html",
            about: "Your exam results — marks, grades, semester-wise performance and CGPA.",
            howto: "1️⃣ Open Results from the left sidebar.\n2️⃣ Pick a semester or exam.\n3️⃣ Each row shows subject, marks, grade and status.",
            words: ["result", "results", "marksheet", "marks", "grade", "grades", "cgpa", "result date"]
        },
        documents: {
            name: "Documents",
            file: "documents.html",
            about: "Your document vault — certificates, IDs and study material you can store and retrieve in one place.",
            howto: "1️⃣ Open Documents from the left sidebar.\n2️⃣ Upload a file with its category.\n3️⃣ Re-download it any time from the list.",
            words: ["document", "documents", "certificate", "file", "files", "upload", "notes", "library", "book", "books"]
        },
        complaints: {
            name: "Complaints",
            file: "complaints.html",
            about: "Raise a complaint (category, location, description) and track its status as the administration responds.",
            howto: "1️⃣ Open Complaints from the left sidebar.\n2️⃣ Click New Complaint and fill category, location and details.\n3️⃣ Track progress — status moves Pending → In Progress → Resolved.",
            words: ["complaint", "complaints", "grievance", "issue", "problem", "hostel complaint", "report a problem"]
        },
        feedback: {
            name: "Feedback",
            file: "feedback.html",
            about: "Share feedback about academics, facilities and campus services — the admin views an aggregated summary.",
            howto: "1️⃣ Open Feedback from the left sidebar.\n2️⃣ Give a rating and write your message.\n3️⃣ Submit — that's it, thank you!",
            words: ["feedback", "review", "rating", "suggest", "suggestion"]
        },
        lost_found: {
            name: "Lost & Found",
            file: "lost_found.html",
            about: "Report lost or found items and browse open reports from other students.",
            howto: "1️⃣ Open Lost & Found from the left sidebar.\n2️⃣ Filter by Open / Resolved.\n3️⃣ Lost something? Click Report Item and describe it.",
            words: ["lost", "found", "missing", "lost and found", "lost & found", "lost item"]
        },
        campus: {
            name: "Campus",
            file: "campus.html",
            about: "The campus facilities directory — buildings, labs, library, admin office and their locations.",
            howto: "1️⃣ Open Campus from the left sidebar.\n2️⃣ Browse by category.\n3️⃣ Click a place for its location and what it handles.",
            words: ["campus", "facility", "facilities", "building", "library location", "lab", "canteen", "hostel", "ground", "auditorium", "map"]
        },
        events: {
            name: "Events",
            file: "events.html",
            about: "College events — tech talks, fests, workshops and career sessions with dates and venues.",
            howto: "1️⃣ Open Events from the left sidebar.\n2️⃣ Check upcoming dates.\n3️⃣ Click an event for venue and description.",
            words: ["event", "events", "fest", "workshop", "seminar", "tech talk", "cultural"]
        },
        exams: {
            name: "Exams",
            file: "exams.html",
            about: "Your exam schedule — subject, date, time and venue for each exam.",
            howto: "1️⃣ Open Exams from the left sidebar.\n2️⃣ Note dates and start times.\n3️⃣ Open an exam row for venue and syllabus hints.",
            words: ["exam", "exams", "test", "schedule of exam", "viva", "hall ticket"]
        },
        notifications: {
            name: "Notifications",
            file: "notifications.html",
            about: "Announcements and notices — attendance alerts, result declarations, event reminders. Unread counts feed the dashboard.",
            howto: "1️⃣ Open Notifications from the left sidebar.\n2️⃣ Click a notice to mark it read.\n3️⃣ The bell in the header shows unread count.",
            words: ["notification", "notifications", "announcement", "announcements", "notice", "alert", "bell"]
        },
        profile: {
            name: "Profile",
            file: "profile.html",
            about: "Your profile — name, course, semester, student ID, contact details and profile photo.",
            howto: "1️⃣ Open Profile from the left sidebar.\n2️⃣ Click Edit to update your details.\n3️⃣ Save — the dashboard header reflects it.",
            words: ["profile", "my details", "my account", "student id", "edit profile", "photo"]
        },
        settings: {
            name: "Settings",
            file: "settings.html",
            about: "Account settings — password change, preferences and logout.",
            howto: "1️⃣ Open Settings from the left sidebar.\n2️⃣ Change password or toggle preferences.\n3️⃣ Use Logout when you are done.",
            words: ["settings", "setting", "password", "change password", "preferences", "theme", "logout", "log out", "sign out"]
        },
        index: {
            name: "Home",
            file: "index.html",
            about: "The CampusConnect landing page — features overview, screenshots and the entry point to login.",
            howto: "Click Login / Register at the top to enter the portal.",
            words: ["landing page", "home", "website"]
        },
        register: {
            name: "Login",
            file: "register.html",
            about: "The sign-in gate — Register (email + password) and Login tabs, plus a one-click demo account.",
            howto: "1️⃣ Choose the Register or Login tab.\n2️⃣ Fill your details (or use Demo login).\n3️⃣ You land on the Dashboard.",
            words: ["login", "log in", "signin", "sign in", "register", "signup", "sign up", "demo account", "create account"]
        }
    };

    var PROJECT_IDEA =
        "🎓 *CampusConnect — AI College Companion* is a BCA final-year project: " +
        "one web portal that replaces the scattered college apps students juggle every day.\n\n" +
        "• *For students* — attendance, timetable, assignments, exams, results, courses, " +
        "faculty directory, placements, documents, complaints, feedback, lost & found, " +
        "events, campus info and notifications, all in one dashboard.\n" +
        "• *AI companion* — me! A chat guide on every page, powered by an NVIDIA GPT-OSS model " +
        "through the Flask backend, with a built-in guide fallback.\n" +
        "• *Roles* — Student (default), Faculty and Admin; admins manage users, courses, " +
        "events, placements, notifications and complaints from the API.\n" +
        "• *Tech* — HTML/CSS/JS frontend, Flask + MySQL backend, JWT auth, REST APIs.";

    /* ---------------------------------------------------------
       2. DOM WIDGET DISCOVERY (reuse what exists)
    --------------------------------------------------------- */

    var body = document.getElementById("chatBody");
    var input = document.getElementById("chatInput");
    var quickBox = document.querySelector(".quick-buttons");

    if (!body) {
        injectWidget();
        body = document.getElementById("chatBody");
        input = document.getElementById("chatInput");
        quickBox = document.querySelector(".quick-buttons");
    }

    var busy = false;

    /* ---------------------------------------------------------
       3. SMALL HELPERS
    --------------------------------------------------------- */

    function currentPage() {
        var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
        if (file === "" || file === "/") { file = "index.html"; }
        return file.replace(/\.html$/, "");
    }

    function inPagesDir() {
        return /\/pages\//.test(location.pathname);
    }

    function pathFor(key) {
        var mod = MODULES[key];
        if (!mod) { return null; }
        var prefix = "";
        if (key === "index" || key === "register" || key === "dashboard") {
            prefix = inPagesDir() ? "../" : "";
        } else {
            prefix = inPagesDir() ? "" : "pages/";
        }
        return prefix + mod.file;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /* minimal **bold** + line breaks support */
    function renderText(s) {
        return escapeHtml(s)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n/g, "<br>");
    }

    function appendUser(text) {
        var div = document.createElement("div");
        div.className = "user-message";
        div.textContent = text;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    function appendBot(text) {
        var div = document.createElement("div");
        div.className = "bot-message";
        div.innerHTML = renderText(text);
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    /* Append raw HTML as a bot bubble (page-provided messages keep markup). */
    function appendHtmlBot(html) {
        var div = document.createElement("div");
        div.className = "bot-message";
        div.innerHTML = html;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        return div;
    }

    /* A throwaway node so page code that expects a return value never breaks. */
    function detachedNode() {
        return document.createElement("div");
    }

    var typingEl = null;

    function showTyping() {
        if (typingEl) { return; }
        typingEl = document.createElement("div");
        typingEl.className = "bot-message cc-typing";
        typingEl.innerHTML =
            '<span class="cc-dot"></span><span class="cc-dot"></span><span class="cc-dot"></span>';
        body.appendChild(typingEl);
        body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
        if (typingEl && typingEl.parentNode) {
            typingEl.parentNode.removeChild(typingEl);
        }
        typingEl = null;
    }

    /* chips = the quick-buttons strip, reused as follow-up suggestions */
    function setChips(chips) {
        if (!quickBox || !chips || !chips.length) { return; }
        quickBox.innerHTML = "";
        chips.slice(0, 4).forEach(function (c) {
            var b = document.createElement("button");
            b.className = "quick-btn";
            b.type = "button";
            if (c.nav) {
                b.onclick = function () { goTo(c.nav, c.label); };
            } else {
                b.onclick = function () { sendText(c.ask); };
            }
            b.textContent = c.label;
            quickBox.appendChild(b);
        });
    }

    function goTo(key, label) {
        var path = pathFor(key);
        if (!path) { return; }
        appendBot("Taking you to **" + (label || MODULES[key].name) + "** … 🚀");
        setTimeout(function () { location.href = path; }, 500);
    }

    /* ---------------------------------------------------------
       4. BACKEND LLM (NVIDIA NIM via Flask) + FALLBACK
    --------------------------------------------------------- */

    var offlineUntil = 0;

    function apiBase() {
        var custom = null;
        try { custom = localStorage.getItem("cc_api_base"); } catch (e) { /* ignore */ }
        if (custom) { return custom.replace(/\/+$/, ""); }
        if (location.port === "5000") { return ""; }          /* served by Flask */
        return "http://127.0.0.1:5000";
    }

    function postTo(base, message) {
        var token = null;
        try { token = localStorage.getItem("token"); } catch (e) { /* ignore */ }

        var headers = { "Content-Type": "application/json" };
        if (token) { headers["Authorization"] = "Bearer " + token; }

        var ctrl = ("AbortController" in window) ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 60000);

        return fetch(base + "/api/chatbot/message", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ message: message, page: currentPage() }),
            signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) {
            clearTimeout(timer);
            return r.json();
        }).then(function (j) {
            if (j && j.success && j.data && j.data.reply) {
                return { ok: true, reply: j.data.reply, intent: j.data.intent || "" };
            }
            return { ok: false, network: false };          /* server answered, no reply */
        }).catch(function () {
            clearTimeout(timer);
            return { ok: false, network: true };           /* server unreachable */
        });
    }

    function askBackend(message) {
        if (Date.now() < offlineUntil) {
            return Promise.resolve(null);
        }

        var base = apiBase();

        return postTo(base, message).then(function (res) {
            if (res.ok) { return { reply: res.reply, intent: res.intent }; }

            /* server unreachable -> try same-origin once, then rest a bit */
            if (res.network && base !== "") {
                return postTo("", message).then(function (res2) {
                    if (res2.ok) { return { reply: res2.reply, intent: res2.intent }; }
                    if (res2.network) { offlineUntil = Date.now() + 90000; }
                    return null;
                });
            }
            if (res.network) { offlineUntil = Date.now() + 90000; }
            return null;
        }).catch(function () {
            return null;
        });
    }

    /* ---------------------------------------------------------
       5. LOCAL PROJECT GUIDE (offline brain — same personality)
    --------------------------------------------------------- */

    function matchModule(text) {
        var t = " " + text.toLowerCase().replace(/[?!.]/g, " ") + " ";
        var keys = Object.keys(MODULES);
        for (var i = 0; i < keys.length; i++) {
            var words = MODULES[keys[i]].words;
            for (var w = 0; w < words.length; w++) {
                if (t.indexOf(" " + words[w]) !== -1 || t.indexOf(words[w] + " ") !== -1) {
                    return keys[i];
                }
            }
        }
        return null;
    }

    function has(text, words) {
        var t = text.toLowerCase();
        for (var i = 0; i < words.length; i++) {
            if (t.indexOf(words[i]) !== -1) { return true; }
        }
        return false;
    }

    function chipFor(key) {
        return { label: "Open " + MODULES[key].name + " →", nav: key };
    }

    function localReply(raw) {
        var text = (raw || "").trim();
        var t = text.toLowerCase();

        /* --- navigation commands --------------------------- */
        var navVerb = /\b(take me to|go to|open|navigate to|switch to|jump to|show me|head to|link me)\b/.test(t);
        var mod = matchModule(text);

        if (mod && navVerb) {
            var m = MODULES[mod];
            return {
                text: "Sure! Opening **" + m.name + "** for you. 🚀\n\n" + m.howto,
                chips: [
                    { label: "What is this page?", ask: "What is the " + m.name + " page for?" },
                    { label: "What can you do?", ask: "What can you do?" },
                    { label: "Back to Dashboard", nav: "dashboard" }
                ]
            };
        }

        /* --- greetings ------------------------------------- */
        if (/^(hi|hello|hey|yo|good (morning|afternoon|evening)|namaste|hola)\b/.test(t) || t === "hii" || t === "helo") {
            return {
                text: "Hey! 👋 I'm **CampusConnect AI**, your AI College Companion.\n\nI know this whole portal inside out — ask me what a page does, how to do something, or say **\"take me to Placement\"** and I'll walk you there. What can I help with?",
                chips: [
                    { label: "Guide me through the app", ask: "Guide me through the app" },
                    { label: "About this project", ask: "What is this project?" },
                    { label: "Open Dashboard", nav: "dashboard" }
                ]
            };
        }

        if (has(t, ["thank", "thanks", "thx"])) {
            return {
                text: "Anytime! 😊 That's what I'm here for. Anything else you'd like to explore in CampusConnect?",
                chips: [{ label: "What can you do?", ask: "What can you do?" }, { label: "Open Dashboard", nav: "dashboard" }]
            };
        }

        if (/\b(bye|goodbye|see you|good night)\b/.test(t)) {
            return {
                text: "Goodbye! 👋 Study well, and I'll be right here in the corner whenever you need me.",
                chips: [{ label: "Open Dashboard", nav: "dashboard" }]
            };
        }

        /* --- who am I -------------------------------------- */
        if (has(t, ["who are you", "your name", "what are you", "are you a bot", "are you human", "are you ai"])) {
            return {
                text: "I'm **CampusConnect AI** 🤖✨ — the AI College Companion built into this portal.\n\n• I guide you through every page of the app\n• When the backend server is running, I answer using live data (attendance, assignments, exams) via an NVIDIA GPT-OSS model\n• Offline, I fall back to my built-in guide so I can still help",
                chips: [{ label: "About the project", ask: "What is this project?" }, { label: "What can you do?", ask: "What can you do?" }]
            };
        }

        /* --- project idea ---------------------------------- */
        if (has(t, ["what is this project", "about this project", "campusconnect", "about this app", "what is this app",
                    "what is this website", "project idea", "synopsis", "about the project", "what is campus connect"])) {
            return {
                text: PROJECT_IDEA,
                chips: [
                    { label: "Tech stack?", ask: "What technology is used?" },
                    { label: "Guide me through it", ask: "Guide me through the app" },
                    { label: "Open Dashboard", nav: "dashboard" }
                ]
            };
        }

        if (has(t, ["technology", "tech stack", "which technology", "made with", "built with", "backend",
                    "frontend", "framework", "database", "nvidia", "which ai", "what ai", "model", "api"])) {
            return {
                text: "🛠️ **Tech stack of CampusConnect:**\n\n• *Frontend* — HTML, CSS and vanilla JavaScript (dashboard + 18 module pages)\n• *Backend* — Python Flask with REST APIs and JWT auth\n• *Database* — MySQL (users, courses, attendance, assignments, exams, placements, complaints …)\n• *AI* — NVIDIA NIM hosted **gpt-oss-20b** answering through `/api/chatbot/message`, with a rule-based fallback",
                chips: [{ label: "About the project", ask: "What is this project?" }, { label: "Roles?", ask: "Who can use this app?" }]
            };
        }

        if (has(t, ["who can use", "roles", "admin", "faculty role", "student role", "user role"])) {
            return {
                text: "👥 **Three roles exist in CampusConnect:**\n\n• *Student* (default) — everything you see in this portal\n• *Faculty* — listed in the Faculty directory\n• *Admin* — manages users & roles, courses, events, placements, broadcasts notifications and resolves complaints (via the admin API)\n\nNew sign-ups always start as students.",
                chips: [{ label: "How do I log in?", ask: "How do I log in?" }, { label: "Open Faculty", nav: "faculty" }]
            };
        }

        /* --- account / auth -------------------------------- */
        if (has(t, ["log in", "login", "sign in", "signin", "register", "sign up", "create account", "demo account", "password"])) {
            return {
                text: "🔐 **Signing in is simple:**\n\n1️⃣ Open the **Login** page (`register.html` from the home screen)\n2️⃣ Switch between the *Register* and *Login* tabs\n3️⃣ Enter email + password — or click **Demo login** to explore instantly\n4️⃣ You land straight on your **Dashboard**\n\nPassword change and other account options live under **Settings**.",
                chips: [{ label: "Open Settings", nav: "settings" }, { label: "Open Profile", nav: "profile" }]
            };
        }

        /* --- how to use / guide me -------------------------- */
        if (has(t, ["guide me", "how do i use", "how to use", "walk me", "tour", "start", "beginner", "what should i do first"])) {
            return {
                text: "🧭 **Your 60-second tour:**\n\n1️⃣ **Dashboard** — start here; the three cards summarize attendance, classes and events\n2️⃣ **Timetable & Attendance** — know your day and your percentages\n3️⃣ **Assignments & Exams** — nothing due, nothing surprised\n4️⃣ **Results & Academics** — track performance and CGPA\n5️⃣ **Placement** — browse drives and apply before deadlines\n6️⃣ **Campus, Events, Lost & Found** — college life beyond academics\n\nThe left sidebar groups everything into Main Menu, Career, Campus and Account.",
                chips: [
                    { label: "Open Dashboard", nav: "dashboard" },
                    { label: "Open Placement", nav: "placement" },
                    { label: "What can you do?", ask: "What can you do?" }
                ]
            };
        }

        if (has(t, ["what can you do", "your features", "help", "commands", "abilities", "what do you know"])) {
            return {
                text: "🤖 **I can help you with:**\n\n• *Explain* any page — Courses, Attendance, Timetable, Assignments, Exams, Results, Faculty, Placement, Complaints, Feedback, Lost & Found, Events, Campus …\n• *Navigate* — say **\"open my timetable\"** and I'll take you there\n• *Guide* — step-by-step how to do things in the portal\n• *Live data* — when the backend is running: your attendance %, pending assignments, upcoming exams\n• *Project questions* — architecture, roles, tech stack",
                chips: [
                    { label: "Take me to Attendance", nav: "attendance" },
                    { label: "About this project", ask: "What is this project?" },
                    { label: "How are you built?", ask: "What technology is used?" }
                ]
            };
        }

        /* --- personal live data (honest offline answers) ----- */
        if (has(t, ["my attendance", "attendance %", "attendance percentage", "how much attendance", "attendance of mine"])) {
            return {
                text: "📊 Your live attendance percentage is calculated from the records stored in the college database.\n\n• With the backend running, I can tell you the exact number and subject-wise breakdown\n• Either way, the **Attendance** page shows your overall % card and every subject row",
                chips: [chipFor("attendance"), { label: "Required attendance?", ask: "What attendance is required?" }]
            };
        }

        if (has(t, ["my assignment", "pending assignment", "due assignment", "assignment due"])) {
            return {
                text: "📝 Pending assignments are listed on the **Assignments** page with due dates and status.\n\n• Sort by due date to see what's urgent\n• Open one and press Submit before the deadline\n• The dashboard also shows a pending-assignments count",
                chips: [chipFor("assignments"), { label: "Open Dashboard", nav: "dashboard" }]
            };
        }

        if (has(t, ["my exam", "upcoming exam", "when is the exam", "exam date"])) {
            return {
                text: "📋 Exam dates live on the **Exams** page — subject, date, start time and venue for each paper.\n\n• Check it before every exam week\n• Results appear later on the **Results** page",
                chips: [chipFor("exams"), chipFor("results")]
            };
        }

        if (has(t, ["my result", "my cgpa", "my marks", "when will result come", "result date"])) {
            return {
                text: "📈 Your marks, grades and CGPA are on the **Results** page, semester by semester.\n\n• Academics gives the performance summary\n• Results has the detailed subject-wise marks",
                chips: [chipFor("results"), chipFor("academics")]
            };
        }

        if (has(t, ["my profile", "who am i", "my details", "my name", "my student id"])) {
            var email = null;
            try {
                var u = JSON.parse(localStorage.getItem("campusconnect_user") || "null");
                if (u && u.email) { email = u.email; }
            } catch (e) { /* ignore */ }
            return {
                text: "👤 Your profile holds name, course, semester, student ID and contact details."
                    + (email ? " I can see you signed in as **" + email + "**." : "")
                    + "\n\nOpen the **Profile** page to view or edit everything.",
                chips: [chipFor("profile"), chipFor("settings")]
            };
        }

        if (has(t, ["my timetable", "my classes", "class today", "what class", "free classes"])) {
            return {
                text: "🗓️ The **Timetable** page shows your week — day, time, subject, room and faculty.\n\n• Pick a day to see its classes\n• The dashboard shows today's three classes at a glance\n• Live \"what's my next class\" answers need the backend running",
                chips: [chipFor("timetable"), chipFor("dashboard")]
            };
        }

        if (has(t, ["fee", "fees", "payment", "scholarship", "tuition"])) {
            return {
                text: "💰 Fee and scholarship matters are handled by the accounts office.\n\n• If something looks wrong, raise it on the **Complaints** page — the admin sees it immediately\n• Keep receipts in your **Documents** vault",
                chips: [chipFor("complaints"), chipFor("documents")]
            };
        }

        if (has(t, ["attendance required", "required attendance", "75%", "minimum attendance"])) {
            return {
                text: "🎯 Most colleges require **75%** overall to sit for exams — your college's exact rule is shown on the **Attendance** page.\n\n• Stay above the line subject-wise, not just overall\n• Track the subject rows and fix early",
                chips: [chipFor("attendance")]
            };
        }

        /* --- chatbot about itself --------------------------- */
        if (has(t, ["are you working", "backend", "server", "offline", "why slow", "nvidia key"])) {
            return {
                text: "⚙️ **How I answer:**\n\n1️⃣ Your message goes to the Flask backend (`/api/chatbot/message`)\n2️⃣ There, NVIDIA's **gpt-oss-20b** model replies with your live student data attached\n3️⃣ If the backend isn't reachable, my built-in project guide answers instantly\n\nSo I keep working either way — try \"about this project\" to test me!",
                chips: [{ label: "About this project", ask: "What is this project?" }, { label: "What can you do?", ask: "What can you do?" }]
            };
        }

        /* --- generic module answer (no nav verb) ------------ */
        if (mod) {
            var m2 = MODULES[mod];
            return {
                text: "📖 **" + m2.name + "** — " + m2.about + "\n\n**How to use it:**\n" + m2.howto,
                chips: [chipFor(mod), { label: "What can you do?", ask: "What can you do?" }]
            };
        }

        /* --- fallback --------------------------------------- */
        return {
            text: "🤔 I want to get that right — I'm best at anything inside CampusConnect.\n\nTry asking me to:\n• **Explain a page** — \"what is the Placement page?\"\n• **Take you somewhere** — \"open my timetable\"\n• **Understand the app** — \"what is this project?\"",
            chips: [
                { label: "About this project", ask: "What is this project?" },
                { label: "Guide me", ask: "Guide me through the app" },
                { label: "Open Dashboard", nav: "dashboard" }
            ]
        };
    }

    /* ---------------------------------------------------------
       6. RESPOND PIPELINE (backend first, guide fallback)
    --------------------------------------------------------- */

    function respond(userText) {
        /* Navigation is instant — never wait on the LLM to walk the user. */
        var navKey = navIntent(userText);
        if (navKey) {
            busy = false;
            goTo(navKey, MODULES[navKey].name);
            return;
        }

        showTyping();

        askBackend(userText).then(function (res) {
            var local = localReply(userText);
            hideTyping();
            /* Prefer the live NVIDIA answer; otherwise use the richer local guide
               (the backend's rule fallback is intentionally minimal). */
            var useBackend = res && res.reply && res.intent === "llm";
            appendBot(useBackend ? res.reply : local.text);
            setChips(local.chips);
            busy = false;
        }).catch(function () {
            var local = localReply(userText);
            hideTyping();
            appendBot(local.text);
            setChips(local.chips);
            busy = false;
        });
    }

    /* A clear navigation command ("take me to attendance", "open my timetable"). */
    function navIntent(text) {
        var t = " " + String(text || "").toLowerCase().replace(/[?!.]/g, " ") + " ";
        var navVerb = /\b(take me to|go to|navigate to|switch to|jump to|head to|link me|show me|open)\b/.test(t);
        if (!navVerb) { return null; }
        return matchModule(text);
    }

    function sendText(text) {
        text = (text || "").trim();
        if (!text || busy) { return; }
        busy = true;
        appendUser(text);
        if (input) { input.value = ""; }
        respond(text);
    }

    /* ---------------------------------------------------------
       7. OVERRIDE THE PAGE'S CANNED HANDLERS
       (inline onclick/onkeydown resolve these globals at runtime)
    --------------------------------------------------------- */

    window.sendChat = function () {
        if (!input) { return; }
        sendText(input.value);
    };

    window.quickChat = function (text) {
        if (input) { input.value = text; }
        window.sendChat();
    };

    window.handleChatKey = function (event) {
        if (event && event.key === "Enter") { window.sendChat(); }
    };

    if (window.campusMessage) {
        window.campusMessage = function (place) {
            sendText("Tell me about the " + place);
        };
    }

    /* ---------------------------------------------------------
       8. WELCOME + CONTEXTUAL CHIPS
    --------------------------------------------------------- */

    function welcomeChips() {
        var key = currentPage();
        var mod = MODULES[key];
        var chips = [];

        if (mod && key !== "index" && key !== "register") {
            chips.push({ label: "What is this page?", ask: "What is the " + mod.name + " page for?" });
        }
        chips.push({ label: "Guide me through the app", ask: "Guide me through the app" });
        chips.push({ label: "About this project", ask: "What is this project?" });
        if (key !== "dashboard") {
            chips.push({ label: "Open Dashboard →", nav: "dashboard" });
        }
        return chips;
    }

    function greet() {
        if (!body) { return; }
        var key = currentPage();
        var mod = MODULES[key];
        var where = mod ? "the **" + mod.name + "** page" : "**CampusConnect**";

        body.innerHTML = "";
        appendBot(
            "👋 Hi! I'm your **AI College Companion**.\n\n" +
            "You're on " + where + " — ask me anything about this page, " +
            "any other section, or the project itself. Say **\"take me to …\"** and I'll walk you there. 😊"
        );
        setChips(welcomeChips());
    }

    greet();

    /* ---------------------------------------------------------
       8b. TAKE OWNERSHIP OF THE PAGE'S CANNED CHAT HELPERS
       Every module page defines its own addMessage() and fires an
       automatic "welcome" stat ~1.2s after load. Left alone, that
       lands as a second, off-voice message under the companion's
       greeting. We drop those unsolicited load-time messages and
       route any later (user-triggered) ones through the companion
       bubble, so the panel always speaks in one voice.
    --------------------------------------------------------- */

    var pageAddMessage = window.addMessage;
    var suppressUntil = Date.now() + 2500;   /* page auto-greetings fire ~1200ms */

    window.addMessage = function (cls, html) {
        cls = String(cls || "");

        /* typing placeholders: the companion has its own indicator */
        if (cls.indexOf("typing") !== -1) {
            return detachedNode();
        }

        if (cls.indexOf("bot-message") !== -1) {
            if (Date.now() < suppressUntil) {
                /* unsolicited page greeting on load — companion already greeted */
                return detachedNode();
            }
            return appendHtmlBot(html);
        }

        if (typeof pageAddMessage === "function") {
            return pageAddMessage(cls, html);
        }
        return detachedNode();
    };

    /* typing indicator animation (only if the page doesn't have one) */
    if (!document.getElementById("ccTypingStyle")) {
        var st = document.createElement("style");
        st.id = "ccTypingStyle";
        st.textContent =
            ".cc-typing .cc-dot{display:inline-block;width:7px;height:7px;margin-right:4px;" +
            "border-radius:50%;background:#9aa4c0;animation:ccBlink 1.2s infinite;}" +
            ".cc-typing .cc-dot:nth-child(2){animation-delay:.2s}" +
            ".cc-typing .cc-dot:nth-child(3){animation-delay:.4s}" +
            "@keyframes ccBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}" +
            "40%{opacity:1;transform:translateY(-3px)}}";
        document.head.appendChild(st);
    }

    /* ---------------------------------------------------------
       8c. CORNER WIDGET OPEN / CLOSE (EVERY PAGE)
       A few pages ship their own .chatbot panel instead of the
       standard #chatbotPanel markup (dashboard, academics). Give
       them the same open/close behaviour as every other page.
    --------------------------------------------------------- */

    function ccPanel() {
        return document.getElementById("chatbotPanel") ||
               document.querySelector(".chatbot");
    }

    if (typeof window.openChatPanel !== "function") {
        window.openChatPanel = function () {
            var p = ccPanel();
            if (p) { p.classList.add("open"); }
        };
    }

    if (typeof window.closeChatPanel !== "function") {
        window.closeChatPanel = function () {
            var p = ccPanel();
            if (p) { p.classList.remove("open"); }
        };
    }

    /* ---------------------------------------------------------
       9. INJECT THE STANDARD WIDGET WHERE NONE EXISTS
          (index.html / register.html — same markup as pages)
    --------------------------------------------------------- */

    function injectWidget() {
        if (document.getElementById("chatbotPanel")) { return; }

        var style = document.createElement("style");
        style.textContent =
            ".chat-bubble{position:fixed;right:26px;bottom:26px;width:60px;height:60px;border:none;" +
            "border-radius:50%;background:linear-gradient(135deg,#6436d8,#7b4bea);color:#fff;font-size:26px;" +
            "cursor:pointer;box-shadow:0 10px 26px rgba(100,54,216,.45);z-index:9998;transition:.25s}" +
            ".chat-bubble:hover{transform:scale(1.08)}" +
            ".chatbot-panel{position:fixed;right:26px;bottom:100px;width:350px;max-width:calc(100vw - 40px);" +
            "height:480px;max-height:calc(100vh - 140px);background:#fff;border-radius:16px;overflow:hidden;" +
            "display:none;flex-direction:column;box-shadow:0 24px 60px rgba(23,33,95,.28);z-index:9999}" +
            ".chatbot-panel.open{display:flex}" +
            ".chat-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px;" +
            "background:linear-gradient(135deg,#26358c,#7b4bea);color:#fff}" +
            ".chat-header-left{display:flex;align-items:center;gap:10px}" +
            ".robot-icon{font-size:22px}" +
            ".chat-title strong{display:block;font-size:14px}" +
            ".chat-title span{font-size:11px;opacity:.85;display:flex;align-items:center;gap:5px}" +
            ".online-dot{width:7px;height:7px;border-radius:50%;background:#3ddc84;display:inline-block}" +
            ".close-chat{background:rgba(255,255,255,.18);border:none;color:#fff;font-size:20px;width:30px;" +
            "height:30px;border-radius:50%;cursor:pointer;line-height:1}" +
            ".chat-body{flex:1;overflow-y:auto;padding:14px;background:#f4f7fc;display:flex;flex-direction:column;gap:10px}" +
            ".bot-message,.user-message{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13.5px;" +
            "line-height:1.5;white-space:normal}" +
            ".bot-message{background:#fff;color:#34405e;border:1px solid #e5e9f2;align-self:flex-start;" +
            "border-bottom-left-radius:4px}" +
            ".user-message{background:linear-gradient(135deg,#6436d8,#7b4bea);color:#fff;align-self:flex-end;" +
            "border-bottom-right-radius:4px}" +
            ".quick-buttons{display:flex;flex-wrap:wrap;gap:7px;padding:10px 12px;background:#fff;border-top:1px solid #e5e9f2}" +
            ".quick-btn{border:1px solid #d9def0;background:#f4f7fc;color:#26358c;font-size:12px;padding:6px 10px;" +
            "border-radius:999px;cursor:pointer;transition:.2s}" +
            ".quick-btn:hover{background:#26358c;color:#fff;border-color:#26358c}" +
            ".chat-footer{display:flex;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid #e5e9f2}" +
            ".chat-input{flex:1;border:1px solid #d9def0;border-radius:999px;padding:9px 14px;font-size:13px;outline:none}" +
            ".chat-input:focus{border-color:#7b4bea}" +
            ".send-btn{width:40px;height:40px;border:none;border-radius:50%;background:linear-gradient(135deg,#6436d8,#7b4bea);" +
            "color:#fff;font-size:16px;cursor:pointer}";
        document.head.appendChild(style);

        var wrap = document.createElement("div");
        wrap.innerHTML =
            '<button class="chat-bubble" id="chatBubble" onclick="openChatPanel()" ' +
            'aria-label="Open AI College Companion">🤖</button>' +
            '<div class="chatbot-panel" id="chatbotPanel">' +
            '  <div class="chat-header"><div class="chat-header-left">' +
            '    <div class="robot-icon">🤖</div>' +
            '    <div class="chat-title"><strong>AI College Companion</strong>' +
            '    <span><i class="online-dot"></i> Online • Ready to help</span></div></div>' +
            '    <button class="close-chat" onclick="closeChatPanel()">×</button></div>' +
            '  <div class="chat-body" id="chatBody"></div>' +
            '  <div class="quick-buttons"></div>' +
            '  <div class="chat-footer">' +
            '    <input id="chatInput" class="chat-input" type="text" placeholder="Ask your companion..."' +
            '     onkeydown="handleChatKey(event)">' +
            '    <button class="send-btn" onclick="sendChat()">➤</button>' +
            '  </div></div>';
        while (wrap.firstChild) {
            document.body.appendChild(wrap.firstChild);
        }

        if (typeof window.openChatPanel !== "function") {
            window.openChatPanel = function () {
                document.getElementById("chatbotPanel").classList.add("open");
            };
        }
        if (typeof window.closeChatPanel !== "function") {
            window.closeChatPanel = function () {
                document.getElementById("chatbotPanel").classList.remove("open");
            };
        }
    }

    /* ---------------------------------------------------------
       10. VOICE INPUT — tap the mic and speak your question
       Injects a microphone button into the chat footer on every
       page. Uses the browser Web Speech API; the button is only
       added when the browser can actually do speech recognition
       (Chrome / Edge / Android — not Firefox).
    --------------------------------------------------------- */

    function setupVoiceInput() {
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { return; }

        var footer = document.querySelector(".chat-footer");
        var inputEl = document.getElementById("chatInput");
        if (!footer || !inputEl || document.getElementById("chatMic")) { return; }

        if (!document.getElementById("ccVoiceStyle")) {
            var vs = document.createElement("style");
            vs.id = "ccVoiceStyle";
            vs.textContent =
                ".chat-mic{flex-shrink:0;width:38px;height:38px;border:none;border-radius:12px;cursor:pointer;" +
                "font-size:15px;line-height:1;color:#6543e8;background:#efeaff;transition:.2s;padding:0}" +
                ".chat-mic:hover{background:#e2d9ff}" +
                ".chat-mic.recording{color:#fff;background:#e8484d;animation:ccPulse 1.1s infinite}" +
                "@keyframes ccPulse{0%{box-shadow:0 0 0 0 rgba(232,72,77,.55)}" +
                "70%{box-shadow:0 0 0 9px rgba(232,72,77,0)}100%{box-shadow:0 0 0 0 rgba(232,72,77,0)}}";
            document.head.appendChild(vs);
        }

        var mic = document.createElement("button");
        mic.type = "button";
        mic.id = "chatMic";
        mic.className = "chat-mic";
        mic.setAttribute("aria-label", "Voice input");
        mic.title = "Speak your question";
        mic.textContent = "🎤";

        /* match the send button's size + shape so the row looks uniform */
        var sendBtn = footer.querySelector(".send-btn");
        if (sendBtn) {
            var sbcs = getComputedStyle(sendBtn);
            if (sbcs.height && sbcs.height !== "auto") {
                mic.style.height = sbcs.height;
                mic.style.width = sbcs.height;
            }
            if (sbcs.borderRadius) { mic.style.borderRadius = sbcs.borderRadius; }
        }

        var recog = new SR();
        recog.lang = "en-IN";
        recog.interimResults = true;
        recog.continuous = false;
        recog.maxAlternatives = 1;

        var listening = false;
        var errored = false;

        function setListening(on) {
            listening = on;
            mic.classList.toggle("recording", on);
            mic.textContent = on ? "🔴" : "🎤";
            mic.title = on ? "Listening… tap to stop" : "Speak your question";
        }

        recog.onstart = function () { errored = false; setListening(true); };
        recog.onresult = function (event) {
            var text = "";
            for (var i = 0; i < event.results.length; i++) {
                text += event.results[i][0].transcript;
            }
            inputEl.value = text.trim();
        };
        recog.onerror = function (event) {
            errored = true;
            setListening(false);
            var err = event && event.error;
            if (err === "not-allowed" || err === "service-not-allowed") {
                appendBot("🎤 I couldn't reach your microphone. Please allow microphone " +
                          "access for this page, then tap the mic again.");
            }
        };
        recog.onend = function () {
            setListening(false);
            var text = (inputEl.value || "").trim();
            /* hands-free: once you stop talking, send what was heard */
            if (!errored && text) { window.sendChat(); }
            errored = false;
        };

        mic.addEventListener("click", function () {
            if (listening) { try { recog.stop(); } catch (e) { /* ignore */ } return; }
            try { recog.start(); } catch (e) { /* already running */ }
        });

        if (sendBtn) { footer.insertBefore(mic, sendBtn); }
        else { footer.appendChild(mic); }
    }

    setupVoiceInput();
});
