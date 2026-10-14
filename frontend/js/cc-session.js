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

   The topbar is populated automatically on load.
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

    function logout() {
        SESSION_KEYS.forEach(function (key) {
            try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
            try { window.sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
        });
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

    function injectStyles() {
        if (document.getElementById("cc-session-style")) { return; }
        if (!document.head) { return; }

        var style = document.createElement("style");
        style.id = "cc-session-style";
        style.appendChild(document.createTextNode(CSS));
        document.head.appendChild(style);
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
        if (spans.length) {
            spans[0].textContent = info.label;
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
        initials: initials,
        escapeHtml: escapeHtml,
        pageUrl: pageUrl,
        initTopbar: initTopbar
    };

    function boot() {
        try { injectStyles(); } catch (e) { /* never break a page over styles */ }
        try { initTopbar(); } catch (e) { /* never break a page over the topbar */ }
    }

    try { injectStyles(); } catch (e) { /* head may not exist yet; boot() retries */ }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})(window, document);
