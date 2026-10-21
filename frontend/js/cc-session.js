/* =========================================================
   CAMPUSCONNECT SHARED SESSION + PROGRAMME LAYER
   ---------------------------------------------------------
   Load AFTER js/api-base.js on every signed-in page.

   Provides:
     CC.user()           signed-in user object (or null)
     CC.token()          JWT for the API
     CC.program()        canonical programme: BCA | BBA | BCOM
     CC.programInfo()    programme profile (label, colours, tagline)
     CC.semester()       the student's semester as a number (or null)
     CC.applyTheme()     applies the programme colour scheme
     CC.api(path, opts)  fetch wrapper that attaches the JWT
     CC.requireLogin()   sends guests to the sign-in page
     CC.logout()         clears the session and returns to sign-in
     CC.initTopbar()     fills the bell + avatar on the shared topbar
     CC.setTheme(mode)   light | dark | system - applies and remembers it
     CC.theme()          the remembered mode ("light" when never set)
     CC.setFontSize(v)   normal | large | small - applies and remembers it
     CC.applyAppearance() re-applies the saved theme + font size

   The topbar is populated automatically on load.

   Appearance (the Theme and Font size controls on the Settings page) is
   owned here: the dark stylesheet is injected once, <html data-theme>
   picks it, and the choice is kept in the campusConnectSettings JSON in
   localStorage, so it follows the student across every page and tab.
========================================================= */

(function (window, document) {
    "use strict";

    /* ---------- programme profiles (distinct UI per programme) ---------- */

    var PROGRAMS = {
        BCA: {
            code: "BCA",
            label: "BCA",
            full: "Bachelor of Computer Applications",
            department: "Computer Applications",
            tagline: "Build, ship and debug the software behind everything.",
            accent: "#3b6ef6",
            accentDark: "#1f47b8",
            accentSoft: "#eaf0ff",
            gradient: "linear-gradient(135deg,#3b6ef6,#22d3ee)"
        },
        BBA: {
            code: "BBA",
            label: "BBA",
            full: "Bachelor of Business Administration",
            department: "Management Studies",
            tagline: "Lead teams, read markets and run the numbers.",
            accent: "#e08a00",
            accentDark: "#a35f00",
            accentSoft: "#fff4e0",
            gradient: "linear-gradient(135deg,#f59e0b,#ef4444)"
        },
        BCOM: {
            code: "BCOM",
            label: "B.Com",
            full: "Bachelor of Commerce",
            department: "Commerce",
            tagline: "Master accounting, tax and the language of business.",
            accent: "#0f9d63",
            accentDark: "#0a6b45",
            accentSoft: "#e6f8f0",
            gradient: "linear-gradient(135deg,#10b981,#0ea5e9)"
        }
    };

    var SESSION_KEYS = [
        "token",
        "campusconnect_user",
        "campusConnectLoggedIn",
        "campusConnectUser",
        "campusConnectUserEmail",
        "campusConnectRole",
        "campusConnectProgram",
        "campusConnectSemester"
    ];

    var LEGACY_LABELS = [
        "BCA - Bachelor of Computer Applications",
        "BBA - Bachelor of Business Administration",
        "B.Com - Bachelor of Commerce"
    ];

    /* ---------- storage ---------- */

    function readKey(key) {
        var value = null;
        try { value = window.localStorage.getItem(key); } catch (e) { value = null; }
        if (value === null || value === undefined) {
            try { value = window.sessionStorage.getItem(key); } catch (e) { value = null; }
        }
        return value;
    }

    /* ---------- session ---------- */

    function token() {
        return readKey("token") || "";
    }

    function user() {
        var raw = readKey("campusconnect_user");
        if (raw) {
            try {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") { return parsed; }
            } catch (e) { /* fall through to the legacy keys */ }
        }

        var name = readKey("campusConnectUser");
        if (!name) { return null; }

        return {
            name: name,
            email: readKey("campusConnectUserEmail") || "",
            role: readKey("campusConnectRole") || "student",
            course: readKey("campusConnectProgram") || "",
            semester: readKey("campusConnectSemester") || ""
        };
    }

    function isAdmin() {
        var u = user();
        return !!u && String(u.role || "").toLowerCase() === "admin";
    }

    function inPages() {
        return /\/pages\//i.test(window.location.pathname);
    }

    function homeFor(role) {
        if (String(role || "").toLowerCase() === "admin") {
            return inPages() ? "admin.html" : "pages/admin.html";
        }
        return inPages() ? "dashboard.html" : "pages/dashboard.html";
    }

    function requireLogin() {
        if (token()) { return true; }
        location.replace(inPages() ? "../index.html" : "index.html");
        return false;
    }

    function clearSession() {
        SESSION_KEYS.forEach(function (key) {
            try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
            try { window.sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
        });
    }

    function logout() {
        clearSession();
        location.href = inPages() ? "../index.html" : "index.html";
    }

    /* ---------- programme helpers ---------- */

    function normaliseProgram(value) {
        var v = String(value === null || value === undefined ? "" : value)
            .toUpperCase()
            .replace(/[^A-Z]/g, "");

        if (!v) { return ""; }
        if (v === "BCOM" || v === "COMMERCE" || v === "COM") { return "BCOM"; }
        if (v === "BBA" || v === "MANAGEMENT" || v === "MANAGEMENTSTUDIES") { return "BBA"; }
        if (v === "BCA" || v === "COMPUTERAPPLICATIONS" || v === "COMPUTERAPPLICATION") { return "BCA"; }
        return v;
    }

    function program() {
        var u = user() || {};
        var code = normaliseProgram(u.course || readKey("campusConnectProgram"));
        return PROGRAMS[code] ? code : "BCA";
    }

    function programInfo() {
        return PROGRAMS[program()];
    }

    function semester() {
        var u = user() || {};
        var raw = (u.semester !== undefined && u.semester !== null && u.semester !== "")
            ? u.semester
            : readKey("campusConnectSemester");

        var digits = String(raw === null || raw === undefined ? "" : raw).replace(/[^0-9]/g, "");
        if (!digits) { return null; }

        var n = parseInt(digits, 10);
        return isNaN(n) ? null : n;
    }

    function applyTheme(target) {
        var info = programInfo();
        var root = target || document.documentElement;

        var vars = {
            "--cc-accent": info.accent,
            "--cc-accent-dark": info.accentDark,
            "--cc-accent-soft": info.accentSoft,
            "--cc-gradient": info.gradient
        };

        Object.keys(vars).forEach(function (name) {
            try { root.style.setProperty(name, vars[name]); } catch (e) { /* ignore */ }
        });
        try { root.setAttribute("data-program", info.code); } catch (e) { /* ignore */ }

        return info;
    }

    /* ---------- api ---------- */

    function api(path, options) {
        options = options || {};

        var headers = { "Content-Type": "application/json" };
        var t = token();
        if (t) { headers.Authorization = "Bearer " + t; }

        if (options.headers) {
            Object.keys(options.headers).forEach(function (key) {
                headers[key] = options.headers[key];
            });
        }

        var url = window.ccApi ? window.ccApi(path) : path;

        return fetch(url, {
            method: options.method || "GET",
            headers: headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        }).then(function (response) {
            return response.json()
                .catch(function () { return {}; })
                .then(function (data) {
                    return { ok: response.ok, status: response.status, data: data };
                });
        });
    }

    /* ---------- small helpers ---------- */

    function initials(name) {
        var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) { return "S"; }
        if (parts.length === 1) { return parts[0].charAt(0).toUpperCase(); }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function escapeHtml(value) {
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function pageUrl(name) {
        return (inPages() ? "" : "pages/") + name;
    }

    /* ---------- role-aware navigation ---------- */

    /* Pages that only make sense for a student. Admins work from the
       admin console instead, so these are removed from their sidebar.
       Exams and Lost & Found are deliberately absent: admins manage both
       from the console, so the link must stay and stay highlighted. */
    var STUDENT_ONLY = [
        "dashboard.html",
        "timetable.html",
        "assignments.html",
        "attendance.html",
        "academics.html",
        "documents.html"
    ];

    /* Sections of the admin console. Keep in sync with
       frontend/pages/admin.html. */
    var ADMIN_SECTIONS = [
        { hash: "overview", icon: "\uD83D\uDCCA", label: "Overview" },
        { hash: "users", icon: "\uD83D\uDC65", label: "Students & Users" }
    ];

    function baseName(href) {
        return String(href || "")
            .split("#")[0]
            .split("?")[0]
            .split("/")
            .pop()
            .toLowerCase();
    }

    function decorateNavForAdmin() {
        var menu = document.querySelector(".menu");
        if (!menu) { return; }

        /* The console builds its own sidebar. */
        if (/admin\.html$/i.test(window.location.pathname)) { return; }

        Array.prototype.slice
            .call(menu.querySelectorAll("a.nav-item"))
            .forEach(function (link) {
                if (STUDENT_ONLY.indexOf(baseName(link.getAttribute("href"))) === -1) {
                    return;
                }

                var section = link.closest ? link.closest(".menu-section") : null;

                if (link.parentNode) { link.parentNode.removeChild(link); }

                /* Drop a section that is now empty. */
                if (section && section.parentNode &&
                    !section.querySelector("a.nav-item")) {
                    section.parentNode.removeChild(section);
                }
            });

        var group = document.createElement("div");
        group.className = "menu-section";
        group.setAttribute("data-cc-admin-nav", "1");

        var inner = '<div class="menu-title">ADMINISTRATION</div>';

        ADMIN_SECTIONS.forEach(function (item) {
            inner += '<a class="nav-item" href="' + pageUrl("admin.html") +
                "#" + item.hash + '">' +
                '<span class="nav-icon">' + item.icon + '</span>' +
                '<span class="nav-text">' + escapeHtml(item.label) + '</span>' +
                '</a>';
        });

        group.innerHTML = inner;
        menu.insertBefore(group, menu.firstChild);
    }

    /* The sidebar is taller than a phone screen, and every fresh page load
       resets its scroll position to the top. Without this the tab you just
       tapped sits off-screen, so the nav looks like it jumped back to the
       top. Nudge the active tab into view instead. Runs after the admin
       nav has been decorated, so it works on the console too, and again on
       window load for pages whose scripts add nav items later. */
    function revealActiveNav() {
        var active = document.querySelector(".nav-item.active");
        if (!active) { return; }

        var scroller = active.closest ? active.closest(".sidebar") : null;
        if (!scroller) { return; }

        /* Nothing to scroll when the whole sidebar already fits. */
        if (scroller.scrollHeight <= scroller.clientHeight + 2) { return; }

        var box = scroller.getBoundingClientRect();
        var link = active.getBoundingClientRect();

        /* Already comfortably in view — leave the scroll position alone so a
           manually scrolled sidebar is not yanked around. */
        if (link.top >= box.top + 6 && link.bottom <= box.bottom - 6) { return; }

        /* scrollIntoView is far less prone to overshoot/clamp bugs than manual
           arithmetic on sidebars that grow after this function first runs. */
        try {
            active.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch (e) {
            var maxScroll = scroller.scrollHeight - scroller.clientHeight;
            var target = scroller.scrollTop + (link.top - box.top) - Math.round(box.height / 3);
            scroller.scrollTop = Math.max(0, Math.min(target, maxScroll));
        }
    }

    /* ---------- topbar ---------- */

    var CSS = [
        ".cc-avatar-img{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}",
        ".cc-bell{position:relative;overflow:visible;cursor:pointer;user-select:none}",
        ".cc-bell::after{display:none !important}",
        ".cc-bell-icon{display:inline-block;font-size:20px;line-height:1}",
        ".cc-badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;padding:0 5px;",
        "border-radius:999px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;",
        "line-height:18px;text-align:center;box-shadow:0 0 0 2px #fff;pointer-events:none;z-index:2}",
        ".cc-notif-panel{position:fixed;width:330px;max-width:calc(100vw - 24px);",
        "background:#fff;color:#0f172a;border-radius:14px;box-shadow:0 18px 45px rgba(15,23,42,.18);",
        "border:1px solid #e6eaf2;z-index:9999;overflow:hidden;text-align:left;cursor:default}",
        ".cc-notif-head{display:flex;justify-content:space-between;align-items:center;gap:10px;",
        "padding:12px 14px;border-bottom:1px solid #eef1f6}",
        ".cc-notif-head strong{font-size:13px;color:#0f172a}",
        ".cc-notif-readall{border:0;background:var(--cc-accent-soft,#eaf0ff);color:var(--cc-accent-dark,#1f47b8);",
        "font-size:11px;font-weight:600;padding:6px 10px;border-radius:8px;cursor:pointer}",
        ".cc-notif-list{max-height:min(330px,60vh);overflow:auto}",
        ".cc-notif-item{padding:11px 14px;border-bottom:1px solid #f1f4f9}",
        ".cc-notif-item:last-child{border-bottom:0}",
        ".cc-notif-item.unread{background:var(--cc-accent-soft,#f5f8ff)}",
        ".cc-notif-item strong{display:block;font-size:12.5px;color:#0f172a;margin-bottom:3px}",
        ".cc-notif-item p{margin:0 0 3px;font-size:12px;color:#475569;line-height:1.45}",
        ".cc-notif-item small{font-size:10.5px;color:#94a3b8}",
        ".cc-notif-empty{padding:16px;text-align:center;font-size:12px;color:#94a3b8}"
    ].join("");

    var DARK_EXTRA = [
        '/* ---------- light chips: icon medallions, tags, pills ---------- */\n',
        '\n',
        'html[data-theme="dark"] .main-area [class*="-icon"],\n',
        'html[data-theme="dark"] .main-area [class$="-tag"],\n',
        'html[data-theme="dark"] .main-area [class$="-chip"],\n',
        'html[data-theme="dark"] .main-area [class*="-pill"],\n',
        'html[data-theme="dark"] .event-date,\n',
        'html[data-theme="dark"] .tip-box,\n',
        'html[data-theme="dark"] .close-btn,\n',
        'html[data-theme="dark"] .modal-cancel,\n',
        'html[data-theme="dark"] #ccContextBar{\n',
        '    background:rgba(255,255,255,.07)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .main-area [class*="-icon"] strong,\n',
        'html[data-theme="dark"] .main-area [class*="-icon"] span{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] #ccContextBar .cc-ctx-eyebrow{\n',
        '    color:#9db8ff!important;\n',
        '}\n',
        'html[data-theme="dark"] #ccContextBar .cc-ctx-tagline{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-ctx-pill{\n',
        '    background:rgba(255,255,255,.07)!important;\n',
        '    border-color:#4a5a8f!important;\n',
        '    color:#bdccff!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-ctx-pill.active{\n',
        '    background:var(--cc-accent,#3b6ef6)!important;\n',
        '    color:#fff!important;\n',
        '}\n',
        '\n',
        '/* ---------- value / meta text on dark surfaces ---------- */\n',
        '\n',
        'html[data-theme="dark"] .account-value,\n',
        'html[data-theme="dark"] .detail-value,\n',
        'html[data-theme="dark"] [class$="-value"]{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-sem-meta,\n',
        'html[data-theme="dark"] [class$="-meta"]{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        '\n',
        '/* ---------- purple accents lifted off the dark surface ---------- */\n',
        '\n',
        'html[data-theme="dark"] .class-time,\n',
        'html[data-theme="dark"] .view-link,\n',
        'html[data-theme="dark"] .feedback-action,\n',
        'html[data-theme="dark"] .drive-date,\n',
        'html[data-theme="dark"] [class$="-link"]{\n',
        '    color:#b3a6ff!important;\n',
        '}\n',
        '/* ---------- light list rows ---------- */\n',
        '\n',
        'html[data-theme="dark"] .info-item{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] .info-label{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        '/* ---------- remaining light rows ---------- */\n',
        '\n',
        'html[data-theme="dark"] .account-row{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] .progress{\n',
        '    background:rgba(255,255,255,.10)!important;\n',
        '}\n',
        '\n',
        '/* ---------- light action chips, tags and flat buttons ---------- */\n',
        '\n',
        'html[data-theme="dark"] .document-action,\n',
        'html[data-theme="dark"] .event-action,\n',
        'html[data-theme="dark"] .event-tag,\n',
        'html[data-theme="dark"] .exam-tag,\n',
        'html[data-theme="dark"] .placement-tag,\n',
        'html[data-theme="dark"] .reset-btn,\n',
        'html[data-theme="dark"] .admin-btn.ghost{\n',
        '    background:rgba(255,255,255,.07)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .document-action:hover,\n',
        'html[data-theme="dark"] .event-action:hover,\n',
        'html[data-theme="dark"] .quick-btn:hover,\n',
        'html[data-theme="dark"] .small-btn:hover,\n',
        'html[data-theme="dark"] .day-tab:hover,\n',
        'html[data-theme="dark"] .admin-btn.ghost:hover{\n',
        '    background:rgba(255,255,255,.13)!important;\n',
        '}\n',
        '\n',
        '/* ---------- red: logout / overdue ---------- */\n',
        '\n',
        'html[data-theme="dark"] .danger-btn,\n',
        'html[data-theme="dark"] .status-overdue{\n',
        '    background:rgba(255,99,132,.16)!important;\n',
        '    border-color:rgba(255,99,132,.34)!important;\n',
        '    color:#ff8fa8!important;\n',
        '}\n',
        'html[data-theme="dark"] .danger-btn:hover{\n',
        '    background:rgba(255,99,132,.26)!important;\n',
        '}\n',
        '\n',
        '/* ---------- amber: rating stars ---------- */\n',
        '\n',
        'html[data-theme="dark"] .rating-star{\n',
        '    background:rgba(255,255,255,.07)!important;\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        'html[data-theme="dark"] .rating-star.selected,\n',
        'html[data-theme="dark"] .rating-star:hover{\n',
        '    background:rgba(245,184,61,.20)!important;\n',
        '    color:#f7c95c!important;\n',
        '}\n',
        '\n',
        '/* ---------- role badges keep their meaning ---------- */\n',
        '\n',
        'html[data-theme="dark"] .admin-badge.student{\n',
        '    background:rgba(96,138,255,.20)!important;\n',
        '    color:#9db8ff!important;\n',
        '}\n',
        'html[data-theme="dark"] .admin-badge.faculty{\n',
        '    background:rgba(255,183,77,.18)!important;\n',
        '    color:#ffc266!important;\n',
        '}\n',
        'html[data-theme="dark"] .admin-badge.admin{\n',
        '    background:rgba(255,99,132,.18)!important;\n',
        '    color:#ff8fa8!important;\n',
        '}\n',
        'html[data-theme="dark"] .admin-table tbody tr:hover td{\n',
        '    background:rgba(255,255,255,.05)!important;\n',
        '}\n',
        '/* ---------- chatbot mic ---------- */\n',
        '\n',
        'html[data-theme="dark"] .chat-mic{\n',
        '    background:rgba(255,255,255,.09)!important;\n',
        '    color:#c3b0ff!important;\n',
        '}\n',
        'html[data-theme="dark"] .chat-mic.recording{\n',
        '    background:#e8484d!important;\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .chat-mic.working{\n',
        '    background:rgba(255,255,255,.09)!important;\n',
        '    color:#c3b0ff!important;\n',
        '}\n',
        '/* ---------- accent-soft surfaces ---------- */\n',
        '\n',
        'html[data-theme="dark"] .cc-notif-readall{\n',
        '    background:rgba(255,255,255,.09)!important;\n',
        '    color:#9db8ff!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-notif-item.unread{\n',
        '    background:rgba(120,150,255,.10)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-sem-head{\n',
        '    border-bottom-color:rgba(255,255,255,.14)!important;\n',
        '}\n',
        ""
    ].join("");

    var DARK_CSS = [
        '/* =========================================================\n',
        '   CAMPUSCONNECT DARK THEME  (html[data-theme="dark"])\n',
        '   The pages were authored with light surfaces and hardcoded\n',
        '   colours, so the theme is a layer of overrides. The sidebar,\n',
        '   heroes and brand gradients are already dark/deep and are\n',
        '   deliberately left alone.\n',
        '   ========================================================= */\n',
        '\n',
        'html[data-theme="dark"]{\n',
        '    color-scheme:dark;\n',
        '    --cc-bg:#0b0e1b;\n',
        '    --cc-surface:#161b30;\n',
        '    --cc-surface-2:#1e2440;\n',
        '    --cc-border:#2b3355;\n',
        '    --cc-text:#e9ecf8;\n',
        '    --cc-text-soft:#c3cbe4;\n',
        '    --cc-muted:#a3adc9;\n',
        '    background:var(--cc-bg);\n',
        '}\n',
        '\n',
        '/* ---------- shell ---------- */\n',
        'html[data-theme="dark"] body{\n',
        '    background:var(--cc-bg)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .main-area{\n',
        '    background:linear-gradient(180deg,#101427,#0a0d19)!important;\n',
        '}\n',
        'html[data-theme="dark"] .top-header{\n',
        '    background:rgba(17,21,40,.97)!important;\n',
        '    border-bottom-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] .page-heading h2,\n',
        'html[data-theme="dark"] .header-left h1,\n',
        'html[data-theme="dark"] h1,\n',
        'html[data-theme="dark"] h2,\n',
        'html[data-theme="dark"] h3,\n',
        'html[data-theme="dark"] h4,\n',
        'html[data-theme="dark"] h5,\n',
        'html[data-theme="dark"] h6{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .header-left p,\n',
        'html[data-theme="dark"] .page-heading p{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        'html[data-theme="dark"] .time-box{\n',
        '    color:var(--cc-text-soft)!important;\n',
        '}\n',
        'html[data-theme="dark"] .notification{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '    box-shadow:0 5px 18px rgba(0,0,0,.45)!important;\n',
        '}\n',
        'html[data-theme="dark"] .profile-info strong{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .profile-info span{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        '\n',
        '/* ---------- cards, panels, popovers ---------- */\n',
        'html[data-theme="dark"] .summary-card,\n',
        'html[data-theme="dark"] .stat-box,\n',
        'html[data-theme="dark"] .content-card,\n',
        'html[data-theme="dark"] .category-card,\n',
        'html[data-theme="dark"] .setting-row,\n',
        'html[data-theme="dark"] .setting-card,\n',
        'html[data-theme="dark"] .form-group,\n',
        'html[data-theme="dark"] .quick-btn,\n',
        'html[data-theme="dark"] .modal,\n',
        'html[data-theme="dark"] .modal-content,\n',
        'html[data-theme="dark"] .modal-box,\n',
        'html[data-theme="dark"] .toast,\n',
        'html[data-theme="dark"] .stat-card,\n',
        'html[data-theme="dark"] .card,\n',
        'html[data-theme="dark"] [class*="-card"],\n',
        'html[data-theme="dark"] [class*="panel"]{\n',
        '    background:var(--cc-surface)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        '/* Elevated / inset surfaces (search fields, chips, time box). */\n',
        'html[data-theme="dark"] .search-box,\n',
        'html[data-theme="dark"] .time-box,\n',
        'html[data-theme="dark"] .stat-box,\n',
        'html[data-theme="dark"] [class*="-box"]{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        '/* Brand gradients must survive the sweeps above. */\n',
        'html[data-theme="dark"] .logo-box{\n',
        '    background:linear-gradient(135deg,#24b8ff,#7144f5)!important;\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .nav-item.active{\n',
        '    background:linear-gradient(90deg,#22b9f5,#6942f4)!important;\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .heading-btn,\n',
        'html[data-theme="dark"] .modal-btn,\n',
        'html[data-theme="dark"] .save-btn,\n',
        'html[data-theme="dark"] .add-btn,\n',
        'html[data-theme="dark"] .primary-btn,\n',
        'html[data-theme="dark"] .send-btn{\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .profile-circle{\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .settings-hero,\n',
        'html[data-theme="dark"] .hero-content,\n',
        'html[data-theme="dark"] .hero,\n',
        'html[data-theme="dark"] .profile-hero{\n',
        '    color:#fff!important;\n',
        '}\n',
        'html[data-theme="dark"] .settings-hero h1,\n',
        'html[data-theme="dark"] .hero-content h1,\n',
        'html[data-theme="dark"] .hero h1,\n',
        'html[data-theme="dark"] .profile-hero h1{\n',
        '    color:#fff!important;\n',
        '}\n',
        '\n',
        '/* ---------- text ---------- */\n',
        'html[data-theme="dark"] strong,\n',
        'html[data-theme="dark"] b{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] p,\n',
        'html[data-theme="dark"] li,\n',
        'html[data-theme="dark"] dt,\n',
        'html[data-theme="dark"] dd,\n',
        'html[data-theme="dark"] label,\n',
        'html[data-theme="dark"] small{\n',
        '    color:var(--cc-text-soft)!important;\n',
        '}\n',
        'html[data-theme="dark"] .summary-title,\n',
        'html[data-theme="dark"] .summary-small,\n',
        'html[data-theme="dark"] .card-heading p,\n',
        'html[data-theme="dark"] .setting-info span,\n',
        'html[data-theme="dark"] .inline-hint,\n',
        'html[data-theme="dark"] .muted,\n',
        'html[data-theme="dark"] .subtitle{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        'html[data-theme="dark"] .summary-number,\n',
        'html[data-theme="dark"] .stat-number,\n',
        'html[data-theme="dark"] .stat-value{\n',
        '    color:#a8c6ff!important;\n',
        '}\n',
        '\n',
        '/* ---------- forms ---------- */\n',
        'html[data-theme="dark"] input:not([type="checkbox"]):not([type="radio"]),\n',
        'html[data-theme="dark"] select,\n',
        'html[data-theme="dark"] textarea{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] input::placeholder,\n',
        'html[data-theme="dark"] textarea::placeholder{\n',
        '    color:#7f89a9!important;\n',
        '}\n',
        'html[data-theme="dark"] option{\n',
        '    background:var(--cc-surface-2);\n',
        '    color:var(--cc-text);\n',
        '}\n',
        '\n',
        '/* ---------- tables ---------- */\n',
        'html[data-theme="dark"] table{\n',
        '    background:transparent!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] th{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] td{\n',
        '    color:var(--cc-text-soft)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] tbody tr:hover td{\n',
        '    background:rgba(255,255,255,.035)!important;\n',
        '}\n',
        '\n',
        '/* ---------- shared notification panel (cc-session) ---------- */\n',
        'html[data-theme="dark"] .cc-notif-panel{\n',
        '    background:var(--cc-surface)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    box-shadow:0 18px 45px rgba(0,0,0,.55)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-notif-head,\n',
        'html[data-theme="dark"] .cc-notif-item{\n',
        '    border-color:var(--cc-border)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-notif-head strong,\n',
        'html[data-theme="dark"] .cc-notif-item strong{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-notif-item p{\n',
        '    color:var(--cc-text-soft)!important;\n',
        '}\n',
        'html[data-theme="dark"] .cc-notif-item small,\n',
        'html[data-theme="dark"] .cc-notif-empty{\n',
        '    color:var(--cc-muted)!important;\n',
        '}\n',
        '\n',
        '/* ---------- chatbot ---------- */\n',
        'html[data-theme="dark"] .chatbot,\n',
'html[data-theme="dark"] .chatbot-panel,\n',
        'html[data-theme="dark"] .chat-header,\n',
        'html[data-theme="dark"] .chat-body,\n',
        'html[data-theme="dark"] .chat-footer{\n',
        '    background:var(--cc-surface)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .bot-message,\n',
        'html[data-theme="dark"] .chat-bubble.bot,\n',
        'html[data-theme="dark"] .chat-bubble.bot-message{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .chat-title,\n',
        'html[data-theme="dark"] .chat-title strong{\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        'html[data-theme="dark"] .chat-input{\n',
        '    background:var(--cc-surface-2)!important;\n',
        '    border-color:var(--cc-border)!important;\n',
        '    color:var(--cc-text)!important;\n',
        '}\n',
        ""
    ].join("") + DARK_EXTRA;

    function injectStyles() {
        if (document.getElementById("cc-session-style")) { return; }
        if (!document.head) { return; }

        var style = document.createElement("style");
        style.id = "cc-session-style";
        style.appendChild(document.createTextNode(CSS));
        document.head.appendChild(style);
    }

    /* ---------- appearance: theme + font size ---------- */

    var PREFS_KEY = "campusConnectSettings";
    var THEME_QUERY = window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;

    function readPrefs() {
        try {
            var raw = window.localStorage.getItem(PREFS_KEY);
            return raw ? (JSON.parse(raw) || {}) : {};
        } catch (e) {
            return {};
        }
    }

    function savePref(patch) {
        var prefs = readPrefs();
        if (patch.theme !== undefined) { prefs.theme = patch.theme; }
        if (patch.fontSize !== undefined) { prefs.fontSize = patch.fontSize; }
        try {
            window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch (e) { /* private mode: theme still applies for this page */ }
        return prefs;
    }

    /* light | dark | system -> light | dark */
    function resolveTheme(mode) {
        if (mode === "system") {
            return THEME_QUERY && THEME_QUERY.matches ? "dark" : "light";
        }
        return mode === "dark" ? "dark" : "light";
    }

    function themeMode() {
        return readPrefs().theme || "light";
    }

    /* Sets data-theme on <html>; the stylesheet keys off it. */
    function applyThemePreference(mode) {
        var wanted = mode === undefined ? themeMode() : mode;
        var resolved = resolveTheme(wanted);
        var root = document.documentElement;
        if (root) {
            root.setAttribute("data-theme", resolved);
            root.setAttribute("data-theme-mode", wanted);
        }
        return resolved;
    }

    function fontSizePx(value) {
        if (value === "large") { return "17px"; }
        if (value === "small") { return "14px"; }
        return "16px";
    }

    function applyFontSize(value) {
        var wanted = value === undefined
            ? (readPrefs().fontSize || "normal")
            : value;
        if (document.documentElement) {
            document.documentElement.style.fontSize = fontSizePx(wanted);
        }
        return wanted;
    }

    /* Public setters: apply now and remember for every other page. */
    function setTheme(mode) {
        applyThemePreference(mode);
        savePref({ theme: mode });
    }

    function setFontSize(value) {
        applyFontSize(value);
        savePref({ fontSize: value });
    }

    function injectDarkStyles() {
        if (document.getElementById("cc-dark-theme")) { return; }
        if (!document.head) { return; }

        var style = document.createElement("style");
        style.id = "cc-dark-theme";
        style.appendChild(document.createTextNode(DARK_CSS));
        document.head.appendChild(style);
    }

    /* Follow the OS setting, and changes made in another tab. */
    function wireAppearance() {
        if (THEME_QUERY) {
            var onScheme = function () {
                if (themeMode() === "system") { applyThemePreference("system"); }
            };
            if (THEME_QUERY.addEventListener) {
                THEME_QUERY.addEventListener("change", onScheme);
            } else if (THEME_QUERY.addListener) {
                THEME_QUERY.addListener(onScheme);
            }
        }

        window.addEventListener("storage", function (ev) {
            if (ev.key !== PREFS_KEY) { return; }
            applyThemePreference();
            applyFontSize();
        });
    }

    function applyAppearance() {
        injectDarkStyles();
        applyThemePreference();
        applyFontSize();
    }

    function unreadOf(row) {
        return row.is_read === 0 || row.is_read === false || row.is_read === "0";
    }

    function fillIdentity() {
        var mini = document.querySelector(".profile-mini");
        if (!mini) { return; }

        var u = user() || {};
        var info = programInfo();

        var circle = mini.querySelector(".profile-circle");
        if (circle) {
            if (u.profile_image) {
                circle.innerHTML = "";
                var img = document.createElement("img");
                img.src = u.profile_image;
                img.alt = u.name || "Profile";
                img.className = "cc-avatar-img";
                circle.appendChild(img);
            } else {
                circle.textContent = initials(u.name);
            }
        }

        var strong = mini.querySelector(".profile-info strong");
        if (strong) { strong.textContent = u.name || "Student"; }

        var spans = mini.querySelectorAll(".profile-info span");
        var spans = mini.querySelectorAll(".profile-info span");
        if (spans.length) {
            spans[0].textContent = isAdmin() ? "CampusConnect" : info.label;
            if (spans.length > 1) {
                spans[1].textContent = isAdmin() ? "Administrator" : "Student";
            }
        }
        mini.style.cursor = "pointer";
        if (!mini.getAttribute("data-cc-bound")) {
            mini.setAttribute("data-cc-bound", "1");
            mini.addEventListener("click", function () {
                window.location.href = pageUrl("profile.html");
            });
        }
    }

    function wireBell(box) {
        if (box.getAttribute("data-cc-bell")) { return; }
        box.setAttribute("data-cc-bell", "1");

        box.classList.add("cc-bell");
        box.innerHTML = '<span class="cc-bell-icon" aria-hidden="true">\uD83D\uDD14</span>'
            + '<span class="cc-badge" hidden>0</span>';

        var badge = box.querySelector(".cc-badge");

        var panel = document.createElement("div");
        panel.className = "cc-notif-panel";
        panel.hidden = true;
        panel.innerHTML = '<div class="cc-notif-head"><strong>Notifications</strong>'
            + '<button type="button" class="cc-notif-readall">Mark all read</button></div>'
            + '<div class="cc-notif-list"><p class="cc-notif-empty">Loading...</p></div>';
        box.appendChild(panel);

        var list = panel.querySelector(".cc-notif-list");

        function refresh() {
            api("/api/notifications").then(function (res) {
                var rows = (res.data && res.data.data) || [];

                var unread = rows.filter(unreadOf).length;
                if (unread > 0) {
                    badge.hidden = false;
                    badge.textContent = unread > 99 ? "99+" : String(unread);
                } else {
                    badge.hidden = true;
                }

                if (!rows.length) {
                    list.innerHTML = '<p class="cc-notif-empty">You are all caught up.</p>';
                    return;
                }

                list.innerHTML = rows.slice(0, 12).map(function (row) {
                    return '<div class="cc-notif-item' + (unreadOf(row) ? " unread" : "") + '">'
                        + '<strong>' + escapeHtml(row.title || "Notice") + '</strong>'
                        + '<p>' + escapeHtml(row.message || "") + '</p>'
                        + '<small>' + escapeHtml(row.created_at || "") + '</small>'
                        + '</div>';
                }).join("");

                placePanel();
            }).catch(function () {
                list.innerHTML = '<p class="cc-notif-empty">Could not load notifications.</p>';
            });
        }

        function placePanel() {
            if (panel.hidden) { return; }

            var rect = box.getBoundingClientRect();
            var width = panel.offsetWidth || 330;
            var height = panel.offsetHeight || 200;

            var left = rect.right - width;
            var maxLeft = window.innerWidth - width - 12;
            if (left > maxLeft) { left = maxLeft; }
            if (left < 12) { left = 12; }

            var top = rect.bottom + 12;
            if (top + height > window.innerHeight - 12) {
                top = Math.max(12, rect.top - height - 12);
            }

            panel.style.left = Math.round(left) + "px";
            panel.style.top = Math.round(top) + "px";
        }

        box.addEventListener("click", function (event) {
            var target = event.target;

            if (target && target.closest && target.closest(".cc-notif-panel")) {
                if (target.closest(".cc-notif-readall")) {
                    api("/api/notifications/read-all", { method: "PUT" }).then(function () {
                        refresh();
                    });
                }
                return;
            }

            panel.hidden = !panel.hidden;
            if (!panel.hidden) { refresh(); }
            placePanel();
        });

        document.addEventListener("click", function (event) {
            if (!box.contains(event.target)) { panel.hidden = true; }
        });

        window.addEventListener("resize", placePanel);
        window.addEventListener("scroll", placePanel, true);

        refresh();
    }

    function initTopbar() {
        fillIdentity();

        var box = document.querySelector(".notification");
        if (!box) { return; }

        if (token()) { wireBell(box); return; }

        // Signed-out / public pages: still replace the placeholder glyph so the
        // bell looks identical everywhere.
        if (!box.getAttribute("data-cc-bell")) {
            box.setAttribute("data-cc-bell", "1");
            box.classList.add("cc-bell");
            box.innerHTML = '<span class="cc-bell-icon" aria-hidden="true">\uD83D\uDD14</span>';
        }
    }

    /* ---------- expose ---------- */

    window.CC = {
        PROGRAMS: PROGRAMS,
        user: user,
        token: token,
        isAdmin: isAdmin,
        program: program,
        programInfo: programInfo,
        normaliseProgram: normaliseProgram,
        semester: semester,
        applyTheme: applyTheme,
        api: api,
        requireLogin: requireLogin,
        logout: logout,
        clearSession: clearSession,
        initials: initials,
        escapeHtml: escapeHtml,
        pageUrl: pageUrl,
        initTopbar: initTopbar,
        setTheme: setTheme,
        setFontSize: setFontSize,
        applyAppearance: applyAppearance,
        theme: function () { return themeMode(); }
    };

    /* Every page's Logout link is onclick="return confirmLogout()", but those
       page-local helpers only ask for confirmation - they never clear the
       session (and admin.html has no helper at all, which threw). Own the
       function here so one confirmation really signs the user out everywhere. */
    function wireLogout() {
        window.confirmLogout = function () {
            var ok = window.confirm("Are you sure you want to logout?");
            if (ok) { clearSession(); }
            return ok;
        };
    }

    function boot() {
        try { injectStyles(); } catch (e) { /* never break a page over styles */ }
        try { wireAppearance(); } catch (e) { /* never break a page over appearance */ }
        try { applyAppearance(); } catch (e) { /* never break a page over appearance */ }
        try { initTopbar(); } catch (e) { /* never break a page over the topbar */ }
        try { wireLogout(); } catch (e) { /* never break a page over logout */ }
        try {
            if (isAdmin()) { decorateNavForAdmin(); }
        } catch (e) { /* never break a page over the navigation */ }
        try { revealActiveNav(); } catch (e) { /* never break a page over the navigation */ }

        /* Scripts further down the page (program-scope.js and the page's own
           code) can add to the sidebar after boot, which changes its height.
           Re-run once everything has settled so the active tab still lands
           in view. */
        try {
            window.addEventListener("load", function () {
                try { revealActiveNav(); } catch (e) { /* never break the nav */ }
            });
            setTimeout(function () {
                try { revealActiveNav(); } catch (e) { /* never break the nav */ }
            }, 1200);
        } catch (e) { /* never break a page over the navigation */ }
    }

    /* Applied at load, before the browser paints, so dark mode does not flash
       light. boot() re-runs it in case <head> was not ready here. */
    try { applyAppearance(); } catch (e) { /* boot() retries */ }

    try { injectStyles(); } catch (e) { /* head may not exist yet; boot() retries */ }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})(window, document);
