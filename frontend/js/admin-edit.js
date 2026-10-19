/* =========================================================
   admin-edit.js — shared admin CRUD engine for CampusConnect.

   Load AFTER js/cc-session.js on a content page, and nothing
   else is needed: when the signed-in user is an admin this file

     1. pulls the page's real records out of the API,
     2. injects an "+ Add ..." button into the page heading,
     3. stamps Edit / Delete onto every rendered card,
     4. supplies one modal form used for both create and update.

   Students get the same live data but no controls at all, so
   their pages stay read-only.

   Adding admin editing to another page means adding one entry
   to CONFIGS below plus one <script> tag on that page.
   ========================================================= */
(function () {
    "use strict";

    var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    var MONTH_FULL = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];

    var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var EVENT_CATEGORIES = ["Technical", "Cultural", "Workshop", "Sports",
                            "Career", "Seminar", "Other"];

    var SEMESTER_LABELS = ["1st Semester", "2nd Semester", "3rd Semester",
                           "4th Semester", "5th Semester", "6th Semester",
                           "7th Semester", "8th Semester"];

    var RESULT_STATUSES = ["Published", "Draft"];

    /* Kept in sync with the category list on complaints.html. */
    var COMPLAINT_CATEGORIES = ["Academic", "Infrastructure", "Technology",
                                "Facilities", "Administration", "Transport",
                                "Hostel", "Other"];

    var COMPLAINT_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

    var COMPLAINT_PRIORITIES = ["Low", "Medium", "High"];

    var CAMPUS_CATEGORIES = ["Academic", "Food", "Administration", "Student Life",
                             "Sports", "Health", "Security", "Events",
                             "Transport", "Other"];

    /* Demo cards carry their icon inline; API rows have only a category. */
    var CAMPUS_ICONS = {
        "Academic": "📚", "Food": "🍴", "Administration": "🏢",
        "Student Life": "🎭", "Sports": "⚽", "Health": "🏥",
        "Security": "🛡️", "Events": "🎤", "Transport": "🚌"
    };

    /* Matches the notification page's category filter + demo card styling. */
    var NOTIF_CATEGORIES = ["Academic", "Examination", "Campus",
                            "Placement", "Events", "General"];

    var NOTIF_ICONS = {
        "Academic": "🎓", "Examination": "📋", "Campus": "📚",
        "Placement": "💼", "Events": "🎉", "General": "🪪"
    };

    var NOTIF_COLORS = {
        "Academic": "blue", "Examination": "purple", "Campus": "blue",
        "Placement": "green", "Events": "orange", "General": "purple"
    };

    /* =========================================================
       PAGE REGISTRY
       ========================================================= */

    var CONFIGS = {

        /* -------------------------------------------------- */
        "faculty.html": {
            api: "/api/faculty",
            thing: "Faculty member",
            addLabel: "+ Add Faculty",
            array: "FACULTY",
            render: "renderFaculty",
            show: "showFacultyProfile",
            card: ".faculty-card",
            titleOf: function (f) { return f.name; },

            toItem: function (r) {
                return {
                    id: r.id,
                    name: r.name || "",
                    dept: r.department || "",
                    subject: r.subject || "",
                    designation: r.designation || "",
                    email: r.email || "",
                    phone: r.phone || "",
                    office: "",          /* not stored in the faculty table yet */
                    hours: "",
                    rating: 0,
                    status: "available"
                };
            },

            fields: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "department", label: "Department", type: "text", required: true },
                { name: "designation", label: "Designation", type: "text" },
                { name: "subject", label: "Subject", type: "text" },
                { name: "email", label: "Email", type: "email" },
                { name: "phone", label: "Phone", type: "text" }
            ],

            fromItem: function (f) {
                return {
                    name: f.name, department: f.dept, designation: f.designation,
                    subject: f.subject, email: f.email, phone: f.phone
                };
            },

            toPayload: function (v) { return v; },

            afterLoad: function () {
                /* The department filter is built from the data, so rebuild it. */
                var sel = document.getElementById("deptFilter");
                if (sel && typeof window.populateDeptFilter === "function") {
                    var all = sel.options[0];
                    sel.innerHTML = "";
                    if (all) { sel.appendChild(all); }
                    populateDeptFilter();
                }
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.renderDepartments === "function") { renderDepartments(); }
            }
        },

        /* -------------------------------------------------- */
        "events.html": {
            api: "/api/events",
            thing: "Event",
            addLabel: "+ Add Event",
            array: "EVENTS",
            render: "renderEvents",
            show: "showEventDetails",
            card: ".event-card",
            titleOf: function (e) { return e.title; },

            toItem: function (r) {
                var date = String(r.event_date || "").slice(0, 10);
                var parts = date.split("-");
                var day = parts.length === 3 ? Number(parts[2]) : "";
                var monthIndex = parts.length === 3 ? Number(parts[1]) - 1 : -1;

                return {
                    id: r.id,
                    title: r.title || "Untitled event",
                    date: parts.length === 3 ? String(day) : "--",
                    month: monthIndex >= 0 ? MONTH_SHORT[monthIndex].toUpperCase() : "TBD",
                    fullDate: parts.length === 3
                        ? day + " " + MONTH_FULL[monthIndex] + " " + parts[0]
                        : "Date to be announced",
                    category: r.category || "Other",
                    icon: "📅",
                    time: clockRange(r.start_time, r.end_time),
                    location: r.location || "TBA",
                    organizer: "Campus Team",
                    description: r.description || "",
                    registration: true,
                    _date: date,
                    _start: hm(r.start_time),
                    _end: hm(r.end_time)
                };
            },

            fields: [
                { name: "title", label: "Title", type: "text", required: true },
                { name: "event_date", label: "Date", type: "date", required: true },
                { name: "start_time", label: "Start time", type: "time" },
                { name: "end_time", label: "End time", type: "time" },
                { name: "location", label: "Location", type: "text" },
                { name: "category", label: "Category", type: "select", options: EVENT_CATEGORIES },
                { name: "description", label: "Description", type: "textarea" }
            ],

            fromItem: function (e) {
                return {
                    title: e.title,
                    event_date: e._date || "",
                    start_time: e._start || "",
                    end_time: e._end || "",
                    location: e.location,
                    category: e.category,
                    description: e.description
                };
            },

            toPayload: function (v) { return v; },

            afterLoad: function () {
                var sel = document.getElementById("categoryFilter");
                if (sel && typeof window.populateCategoryFilter === "function") {
                    var all = sel.options[0];
                    sel.innerHTML = "";
                    if (all) { sel.appendChild(all); }
                    populateCategoryFilter();
                }
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.renderCategories === "function") { renderCategories(); }
            }
        },

        /* -------------------------------------------------- */
        "placement.html": {
            api: "/api/placements",
            thing: "Placement opportunity",
            addLabel: "+ Add Opportunity",
            array: "PLACEMENTS",
            render: "renderPlacements",
            show: "showPlacement",
            card: ".placement-card",
            titleOf: function (p) { return p.company + " — " + p.role; },

            toItem: function (r) {
                var deadline = String(r.application_deadline || "").slice(0, 10);

                return {
                    id: r.id,
                    company: r.company_name || "",
                    role: r.job_role || "",
                    type: "job",                    /* the table has no type column */
                    location: r.location || "",
                    package: r.package || "",
                    deadline: deadline ? prettyDate(deadline) : "Open",
                    status: "open",
                    eligibility: r.eligibility || "",
                    skills: "",                     /* the table has no skills column */
                    description: r.description || "",
                    _deadline: deadline,
                    _link: r.application_link || ""
                };
            },

            fields: [
                { name: "company_name", label: "Company", type: "text", required: true },
                { name: "job_role", label: "Role", type: "text", required: true },
                { name: "location", label: "Location", type: "text" },
                { name: "package", label: "Package (e.g. ₹7.2 LPA)", type: "text" },
                { name: "application_deadline", label: "Apply by", type: "date" },
                { name: "eligibility", label: "Eligibility", type: "text" },
                { name: "application_link", label: "Apply link", type: "text" },
                { name: "description", label: "Description", type: "textarea" }
            ],

            fromItem: function (p) {
                return {
                    company_name: p.company,
                    job_role: p.role,
                    location: p.location,
                    package: p.package,
                    application_deadline: p._deadline || "",
                    eligibility: p.eligibility,
                    application_link: p._link || "",
                    description: p.description
                };
            },

            toPayload: function (v) { return v; },

            afterLoad: function () {
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.renderDrives === "function") { renderDrives(); }
            }
        },

        /* -------------------------------------------------- */
        "timetable.html": {
            api: "/api/timetable",
            thing: "Class",
            addLabel: "+ Add Class",
            dataVar: "timetableData",
            groupByDay: true,
            render: "renderTimetable",
            show: "openClassModal",
            card: ".class-item",
            titleOf: function (i) { return i.subject + " — " + i.time; },

            toItem: function (r) {
                var course = r.course_name || r.course_code || "Class";

                return {
                    id: r.id,
                    user_id: r.user_id,
                    day: r.day || "Monday",
                    time: clock12(r.start_time),
                    subject: course,
                    faculty: r.faculty_name || "",
                    room: r.room || "",
                    type: /lab/i.test(course) ? "Lab" : "Class",
                    icon: /lab/i.test(course) ? "🧪" : "📘",
                    _start: hm(r.start_time),
                    _end: hm(r.end_time),
                    _courseId: r.course_id || ""
                };
            },

            fields: [
                { name: "user_id", label: "Student", type: "users", required: true, createOnly: true },
                { name: "day", label: "Day", type: "select", options: DAYS, required: true },
                { name: "start_time", label: "Start time", type: "time", required: true },
                { name: "end_time", label: "End time", type: "time", required: true },
                { name: "course_id", label: "Course", type: "courses" },
                { name: "room", label: "Room", type: "text" },
                { name: "faculty_name", label: "Faculty", type: "text" }
            ],

            defaults: { day: "Monday", start_time: "09:00", end_time: "10:00" },

            fromItem: function (i) {
                return {
                    user_id: "",
                    day: i.day,
                    start_time: i._start || "",
                    end_time: i._end || "",
                    course_id: i._courseId || "",
                    room: i.room,
                    faculty_name: i.faculty
                };
            },

            toPayload: function (v, item) {
                var payload = {
                    day: v.day,
                    start_time: v.start_time,
                    end_time: v.end_time,
                    course_id: v.course_id ? Number(v.course_id) : null,
                    room: v.room,
                    faculty_name: v.faculty_name
                };
                /* Only creates pick an owner; entries belong to one student. */
                if (item === null && v.user_id) { payload.user_id = Number(v.user_id); }
                return payload;
            },

            afterLoad: function () {
                var sel = document.getElementById("subjectFilter");
                if (sel && typeof window.populateSubjects === "function") {
                    var all = sel.options[0];
                    sel.innerHTML = "";
                    if (all) { sel.appendChild(all); }
                    populateSubjects();
                }
                if (typeof window.updateWeeklyStats === "function") { updateWeeklyStats(); }
            }
        },

        /* -------------------------------------------------- */
        "results.html": {
            api: "/api/results",
            thing: "Result",
            addLabel: "+ Add Result",
            array: "RESULTS",
            render: "renderResults",
            show: "showResultDetails",
            card: ".result-card",
            titleOf: function (r) { return r.subject || "Untitled result"; },

            toItem: function (row) {
                var marks = row.marks !== null && row.marks !== undefined ? Number(row.marks) : 0;
                var maxm = row.max_marks !== null && row.max_marks !== undefined ? Number(row.max_marks) : 100;
                var pct = maxm > 0 ? Math.round((marks / maxm) * 100) : 0;
                var grade = (row.grade || "").trim();

                function fromPct(p) {
                    if (p >= 90) return "A+";
                    if (p >= 80) return "A";
                    if (p >= 70) return "B+";
                    if (p >= 60) return "B";
                    if (p >= 50) return "C";
                    if (p >= 40) return "D";
                    return "F";
                }

                var finalGrade = grade || fromPct(pct);
                var gp = GRADE_POINTS[finalGrade.toUpperCase()];
                if (gp === undefined) { gp = 0; }

                return {
                    id: row.id,
                    user_id: row.user_id,
                    student_name: row.student_name,
                    semester: semesterLabel(row.semester),
                    subject: row.subject || "",
                    code: row.course_code || "",
                    marks: marks,
                    max: maxm,
                    grade: finalGrade,
                    gradePoint: gp,
                    credits: 4,             /* the table has no credits column */
                    _status: row.result_status || "Published"
                };
            },

            fields: [
                { name: "user_id", label: "Student", type: "users", required: true, createOnly: true },
                { name: "semester", label: "Semester", type: "select", options: SEMESTER_LABELS, required: true },
                { name: "course_code", label: "Course Code", type: "text" },
                { name: "subject", label: "Subject", type: "text", required: true },
                { name: "marks", label: "Marks Obtained", type: "number", placeholder: "e.g. 88" },
                { name: "max_marks", label: "Maximum Marks", type: "number", placeholder: "e.g. 100" },
                { name: "grade", label: "Grade (optional)", type: "text", placeholder: "auto from marks if blank" },
                { name: "result_status", label: "Status", type: "select", options: RESULT_STATUSES }
            ],

            defaults: { semester: "1st Semester", max_marks: "100", result_status: "Published" },

            fromItem: function (i) {
                return {
                    user_id: "",
                    semester: i.semester,
                    course_code: i.code,
                    subject: i.subject,
                    marks: i.marks,
                    max_marks: i.max,
                    grade: i.grade,
                    result_status: i._status || "Published"
                };
            },

            toPayload: function (v, item) {
                var payload = {
                    semester: semesterNumber(v.semester),
                    course_code: v.course_code || null,
                    subject: v.subject,
                    marks: v.marks === "" ? null : Number(v.marks),
                    max_marks: v.max_marks === "" ? 100 : Number(v.max_marks),
                    grade: v.grade || null,
                    result_status: v.result_status || "Published"
                };
                if (item === null && v.user_id) { payload.user_id = Number(v.user_id); }
                return payload;
            },

            ownerLabel: function (item) {
                return item.student_name ? item.student_name : "";
            },

            afterLoad: function () {
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.renderPerformance === "function") { renderPerformance(); }
            }
        },

        /* -------------------------------------------------- */
        "complaints.html": {
            api: "/api/complaints",
            apiAdmin: "/api/complaints?all=1",
            thing: "Complaint",
            addLabel: "+ Raise Complaint",
            array: "COMPLAINTS",
            render: "renderComplaints",
            show: "showComplaintDetails",
            card: ".complaint-card",
            noAdd: true, /* students raise via the page's own form; admin edits/deletes */
            titleOf: function (c) { return c.title || "Untitled complaint"; },

            toItem: function (row) {
                return {
                    id: row.id,
                    user_id: row.user_id,
                    student_name: row.student_name,
                    title: row.subject || "",
                    description: row.description || "",
                    category: row.category || "Other",
                    location: row.location || "",
                    priority: row.priority || "Medium",
                    status: row.status || "Pending",
                    date: prettyDate(row.created_at),
                    response: row.response || ""
                };
            },

            ownerLabel: function (item) {
                return item.student_name ? "By: " + item.student_name : "";
            },

            fields: [
                { name: "category", label: "Category", type: "select", options: COMPLAINT_CATEGORIES },
                { name: "location", label: "Location", type: "text" },
                { name: "priority", label: "Priority", type: "select", options: COMPLAINT_PRIORITIES },
                { name: "status", label: "Status", type: "select", options: COMPLAINT_STATUSES },
                { name: "response", label: "Admin Response", type: "textarea" }
            ],

            fromItem: function (c) {
                return {
                    category: c.category,
                    location: c.location,
                    priority: c.priority,
                    status: c.status,
                    response: c.response
                };
            },

            toPayload: function (v, item) {
                var p = {};
                if (v.category !== undefined) { p.category = v.category; }
                if (v.location !== undefined) { p.location = v.location; }
                if (v.priority !== undefined) { p.priority = v.priority; }
                if (v.status !== undefined) { p.status = v.status; }
                if (v.response !== undefined) { p.response = v.response; }
                return p;
            },

            afterLoad: function () {
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.populateCategoryFilter === "function") {
                    var sel = document.getElementById("categoryFilter");
                    if (sel) {
                        var all = sel.options[0];
                        sel.innerHTML = "";
                        if (all) { sel.appendChild(all); }
                        populateCategoryFilter();
                    }
                }
                if (typeof window.renderCategories === "function") { renderCategories(); }
            }
        },

        /* -------------------------------------------------- */
        "campus.html": {
            api: "/api/campus",
            thing: "Campus facility",
            addLabel: "+ Add Facility",
            array: "CAMPUS",
            render: "renderCampus",
            show: "showCampusPlace",
            card: ".campus-card",
            titleOf: function (c) { return c.name; },

            toItem: function (row) {
                var cat = row.category || "Other";
                var status = String(row.status || "open").toLowerCase();
                if (status !== "open" && status !== "closed") { status = "open"; }

                return {
                    id: row.id,
                    name: row.name || "",
                    category: cat,
                    icon: CAMPUS_ICONS[cat] || "📍",
                    location: row.location || "",
                    description: row.description || "",
                    hours: "",              /* the table has no hours column */
                    status: status,
                    _contact: row.contact || ""
                };
            },

            fields: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "category", label: "Category", type: "select", options: CAMPUS_CATEGORIES },
                { name: "location", label: "Location", type: "text" },
                { name: "description", label: "Description", type: "textarea" },
                { name: "contact", label: "Contact", type: "text" }
            ],

            fromItem: function (c) {
                return {
                    name: c.name,
                    category: c.category,
                    location: c.location,
                    description: c.description,
                    contact: c._contact
                };
            },

            toPayload: function (v, item) { return v; },

            afterLoad: function () {
                if (typeof window.renderOverview === "function") { renderOverview(); }
                var sel = document.getElementById("categoryFilter");
                if (sel && typeof window.populateCategoryFilter === "function") {
                    var all = sel.options[0];
                    sel.innerHTML = "";
                    if (all) { sel.appendChild(all); }
                    populateCategoryFilter();
                }
            }
        },

        /* -------------------------------------------------- */
        "notifications.html": {
            api: "/api/notifications",
            thing: "Notification",
            addLabel: "+ Add Notification",
            array: "NOTIFICATIONS",
            render: "renderNotifications",
            show: "showNotification",
            card: ".notification-card",
            titleOf: function (n) { return n.title; },

            toItem: function (row) {
                var cat = row.type || "General";
                return {
                    id: row.id,
                    user_id: row.user_id,
                    student_name: row.student_name,
                    title: row.title || "",
                    text: row.message || "",
                    category: cat,
                    icon: NOTIF_ICONS[cat] || "🪪",
                    color: NOTIF_COLORS[cat] || "purple",
                    time: agoLabel(row.created_at),
                    date: prettyDate(row.created_at),
                    unread: !row.is_read
                };
            },

            ownerLabel: function (item) {
                if (item.user_id) {
                    return item.student_name ? "To: " + item.student_name : "To: student";
                }
                return "";
            },

            fields: [
                { name: "user_id", label: "Student", type: "users", required: true, createOnly: true },
                { name: "title", label: "Title", type: "text", required: true },
                { name: "message", label: "Message", type: "textarea", required: true },
                { name: "type", label: "Type", type: "select", options: NOTIF_CATEGORIES }
            ],

            fromItem: function (n) {
                return {
                    user_id: "",
                    title: n.title,
                    message: n.text,
                    type: n.category
                };
            },

            toPayload: function (v, item) {
                var payload = {
                    title: v.title,
                    message: v.message,
                    type: v.type || "General"
                };
                if (item === null && v.user_id) { payload.user_id = Number(v.user_id); }
                return payload;
            },

            afterLoad: function () {
                if (typeof window.renderOverview === "function") { renderOverview(); }
                if (typeof window.renderCategories === "function") { renderCategories(); }
            }
        }
    };

    /* =========================================================
       SMALL HELPERS
       ========================================================= */

    function esc(value) {
        if (window.CC && CC.escapeHtml) { return CC.escapeHtml(value); }
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /* Most routes answer {"success":true,"data":[...]}; /api/courses
       answers a bare array. Accept both. */
    function listOf(res) {
        var body = res && res.data;
        if (Array.isArray(body)) { return body; }
        if (body && Array.isArray(body.data)) { return body.data; }
        return null;
    }

    /* MySQL TIME arrives as "HH:MM:SS" or "HH:MM". */
    function hm(value) {
        if (!value) { return ""; }
        return String(value).slice(0, 5);
    }

    function clock12(value) {
        var t = hm(value);
        if (!t) { return "--:--"; }

        var bits = t.split(":");
        var hour = Number(bits[0]);
        var suffix = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        return hour + ":" + bits[1] + " " + suffix;
    }

    function clockRange(start, end) {
        if (!start && !end) { return "Time TBA"; }
        var from = start ? clock12(start) : "?";
        var to = end ? clock12(end) : "?";
        return from + " – " + to;
    }

    function prettyDate(isoDate) {
        var parts = String(isoDate || "").slice(0, 10).split("-");
        if (parts.length !== 3) { return isoDate || ""; }
        return Number(parts[2]) + " " + MONTH_SHORT[Number(parts[1]) - 1] + " " + parts[0];
    }

    /* Semesters are stored as ints; the pages show "1st Semester"-style
       labels. Accept both shapes. */
    function semesterLabel(value) {
        var n = Number(value);
        if (!n && n !== 0) { return String(value || ""); }
        return SEMESTER_LABELS[n - 1] || (n + "th Semester");
    }

    function semesterNumber(value) {
        var text = String(value || "");
        if (/^\d+$/.test(text)) { return Number(text); }
        var n = parseInt(text, 10);
        return n ? n : 1;
    }

    /* Same scale as backend/routes/results.py::_grade_points. */
    var GRADE_POINTS = { "A+": 10, "A": 9, "B+": 8, "B": 7, "C": 6, "D": 5, "F": 0 };

    /* "2 hours ago" / "3 days ago" for the notification cards. */
    function agoLabel(value) {
        if (!value) { return ""; }
        var then = new Date(String(value).replace(" ", "T"));
        var seconds = Math.floor((Date.now() - then.getTime()) / 1000);
        if (isNaN(seconds) || seconds < 0) { return prettyDate(value); }
        if (seconds < 60) { return "just now"; }
        if (seconds < 3600) { return Math.floor(seconds / 60) + " minutes ago"; }
        if (seconds < 86400) { return Math.floor(seconds / 3600) + " hours ago"; }
        if (seconds < 604800) { return Math.floor(seconds / 86400) + " days ago"; }
        return prettyDate(value);
    }

    function toast(message) {
        if (typeof window.showToast === "function") { showToast(message); }
        else { console.log("[admin-edit] " + message); }
    }

    function apiError(res) {
        if (res && res.data && (res.data.message || res.data.error)) {
            return res.data.message || res.data.error;
        }
        if (res && res.status === 403) { return "Administrator access required"; }
        if (res && res.status === 401) { return "Please sign in again"; }
        return "The CampusConnect backend rejected that request";
    }

    /* GET with retries: Render's instance sleeps between visits, so the
       first call can come back 502. Resolves to the list, or to null when
       the API is genuinely unavailable (the page then keeps its demo data). */
    function loadList(url, attempt) {
        attempt = attempt || 0;

        return CC.api(url).then(function (res) {
            if (res.ok && !(res.data && res.data.success === false)) {
                return listOf(res);
            }
            if (attempt < 2 && (res.status === 0 || res.status >= 500)) {
                return wait(1500 * (attempt + 1)).then(function () {
                    return loadList(url, attempt + 1);
                });
            }
            return null;
        }).catch(function () {
            if (attempt < 2) {
                return wait(1500 * (attempt + 1)).then(function () {
                    return loadList(url, attempt + 1);
                });
            }
            return null;
        });
    }

    function wait(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    /* The pages declare their data as top-level `const` (FACULTY, EVENTS,
       PLACEMENTS, timetableData). Those live in the global *lexical* scope,
       not on `window`, so a plain window[name] lookup would miss them.
       Indirect eval runs in global scope and can read them. */
    function globalRef(name) {
        if (window[name] !== undefined && window[name] !== null) { return window[name]; }
        try { return (0, eval)(name); } catch (e) { return undefined; }
    }

    /* =========================================================
       STYLES
       ========================================================= */

    function injectStyles() {
        if (document.getElementById("adminEditStyles")) { return; }

        var css = [
            '.ae-add{',
            '    padding:9px 16px;border:none;border-radius:9px;cursor:pointer;',
            '    background:#3b6ef6;color:#fff;font-weight:700;font-size:13px;',
            '    margin-left:10px;vertical-align:middle;',
            '}',
            '.ae-add:hover{background:#2f5bd8;}',

            '.ae-bar{',
            '    display:flex;gap:6px;align-items:center;justify-content:flex-end;',
            '    width:100%;margin-top:9px;position:relative;z-index:2;',
            '}',
            '.ae-owner{',
            '    margin-right:auto;font-size:11.5px;font-weight:700;letter-spacing:.2px;',
            '    color:#7b839d;background:#f1f4fd;border-radius:20px;padding:3px 10px;',
            '}',
            'html[data-theme="dark"] .ae-owner{background:#1b2340;color:#9aa3c2;}',
            /* Cards are flex rows, blocks or grids depending on the page —
               make room for the action row in every one of those layouts. */
            '.ae-card-host{position:relative;flex-wrap:wrap;}',
            '.ae-card-host > .ae-bar{grid-column:1 / -1;}',

            '.ae-btn{',
            '    padding:5px 11px;border:none;border-radius:7px;cursor:pointer;',
            '    font-size:11.5px;font-weight:700;letter-spacing:.2px;',
            '    color:#fff;box-shadow:0 2px 8px rgba(15,23,42,.18);',
            '}',
            '.ae-btn.edit{background:#3b6ef6;}',
            '.ae-btn.edit:hover{background:#2f5bd8;}',
            '.ae-btn.del{background:#d1435b;}',
            '.ae-btn.del:hover{background:#b13549;}',

            '.ae-overlay{',
            '    display:none;position:fixed;inset:0;z-index:1500;',
            '    background:rgba(10,14,32,.55);',
            '    align-items:center;justify-content:center;padding:16px;',
            '}',
            '.ae-overlay.open{display:flex;}',

            '.ae-modal{',
            '    background:#fff;color:#17203a;border-radius:16px;width:min(560px,94vw);',
            '    max-height:88vh;overflow:auto;padding:22px;',
            '    box-shadow:0 24px 60px rgba(8,12,28,.35);font-family:inherit;',
            '}',
            '.ae-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}',
            '.ae-head h3{margin:0;font-size:18px;}',
            '.ae-x{border:none;background:none;font-size:24px;line-height:1;cursor:pointer;color:inherit;}',
            '.ae-body{display:block;}',
            '.ae-body label{',
            '    display:block;font-size:11.5px;font-weight:700;letter-spacing:.4px;',
            '    text-transform:uppercase;color:#7b839d;margin:14px 0 5px;',
            '}',
            '.ae-body label b{color:#d1435b;}',
            '.ae-body input,.ae-body select,.ae-body textarea{',
            '    width:100%;padding:10px 11px;border:1px solid #dfe3f2;border-radius:9px;',
            '    font-size:14px;font-family:inherit;background:#fff;color:#17203a;box-sizing:border-box;',
            '}',
            '.ae-body textarea{resize:vertical;}',
            '.ae-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;}',
            '.ae-foot button{',
            '    padding:10px 16px;border-radius:9px;cursor:pointer;font-weight:700;font-size:13.5px;',
            '}',
            '.ae-cancel{background:#fff;border:1px solid #dfe3f2;color:#3a4160;}',
            '.ae-save{background:#3b6ef6;border:none;color:#fff;}',
            '.ae-save:hover{background:#2f5bd8;}',

            /* Dark theme: the same panel, inverted. */
            'html[data-theme="dark"] .ae-modal{',
            '    background:#131a33;color:#e8ecff;',
            '}',
            'html[data-theme="dark"] .ae-body input,',
            'html[data-theme="dark"] .ae-body select,',
            'html[data-theme="dark"] .ae-body textarea{',
            '    background:#0d1327;border-color:#273049;color:#e8ecff;',
            '}',
            'html[data-theme="dark"] .ae-body label{color:#9aa3c2;}',
            'html[data-theme="dark"] .ae-cancel{background:#0d1327;border-color:#273049;color:#c3cae6;}',
            'html[data-theme="dark"] .ae-add{box-shadow:0 2px 10px rgba(0,0,0,.35);}'
        ].join("\n");

        var style = document.createElement("style");
        style.id = "adminEditStyles";
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* =========================================================
       ENGINE
       ========================================================= */

    var capturing = false;

    function resolveItem(cfg, arg) {
        if (arg && typeof arg === "object") { return arg; }

        if (cfg.array) {
            var arr = globalRef(cfg.array) || [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].id === arg) { return arr[i]; }
            }
        }

        if (cfg.groupByDay) {
            var data = globalRef(cfg.dataVar) || {};
            var days = Object.keys(data);
            var hit = null;

            days.forEach(function (day) {
                (data[day] || []).forEach(function (entry) {
                    if (entry.id === arg) { hit = hit || entry; }
                });
            });

            return hit;
        }

        return null;
    }

    function findId(cfg, arg) {
        var item = resolveItem(cfg, arg);
        return item ? item.id : arg;
    }

    /* ---- data ---- */

    function fill(cfg, rows) {
        var items = rows.map(cfg.toItem);

        if (cfg.groupByDay) {
            var data = globalRef(cfg.dataVar);
            if (!data) { return; }
            DAYS.forEach(function (day) { data[day] = []; });
            items.forEach(function (item) {
                if (data[item.day]) { data[item.day].push(item); }
            });
            return;
        }

        var arr = globalRef(cfg.array);
        if (!arr) { return; }
        arr.length = 0;
        items.forEach(function (item) { arr.push(item); });
    }

    function renderPage(cfg) {
        var fn = globalRef(cfg.render);
        if (typeof fn === "function") { fn(); }
    }

    function reload(cfg) {
        /* Admins may read a wider list than students (e.g. every complaint),
           so the list URL is role-dependent. Writes always use cfg.api. */
        var url = (cfg._admin && cfg.apiAdmin) ? cfg.apiAdmin : cfg.api;

        return loadList(url).then(function (rows) {
            if (!rows || (rows.length === 0 && !cfg._admin)) {
                /* Nothing to show yet: admins get the honest empty list so
                   their Add button starts from the real state, while students
                   keep the built-in demo content the page has always had. */
                renderPage(cfg);
                return;
            }

            fill(cfg, rows);
            if (cfg.afterLoad) { cfg.afterLoad(); }
            renderPage(cfg);
        });
    }

    /* ---- card controls ---- */

    function inject(cfg) {
        var cards = document.querySelectorAll(cfg.card);
        if (!cards.length) { return; }

        Array.prototype.forEach.call(cards, function (card) {
            if (card.querySelector(".ae-bar")) { return; }
            if (typeof card.onclick !== "function") { return; }

            /* Each card's click handler closes over its own record, so run it
               once with the page's real handler swapped for a recorder. That
               hands us the id without touching the page's internals. */
            var arg = capture(card.onclick);
            if (arg === undefined || arg === null) { return; }

            /* A record that never came from the API (the page's own demo
               content) has no id, so there is nothing to save against. */
            if (typeof arg === "object" && (arg.id === undefined || arg.id === null)) { return; }

            addBar(cfg, card, arg);
        });
    }

    function capture(handler) {
        capture._value = null;
        capturing = true;
        try { handler(); } catch (e) { /* a card we cannot identify is skipped */ }
        capturing = false;
        return capture._value;
    }

    function addBar(cfg, card, arg) {
        var bar = document.createElement("div");
        bar.className = "ae-bar";

        /* Pages whose records belong to a student show who that is. */
        if (cfg.ownerLabel) {
            var item = resolveItem(cfg, arg);
            var who = item ? cfg.ownerLabel(item) : "";
            if (who) {
                var owner = document.createElement("span");
                owner.className = "ae-owner";
                owner.textContent = who;
                bar.appendChild(owner);
            }
        }

        var edit = document.createElement("button");
        edit.type = "button";
        edit.className = "ae-btn edit";
        edit.textContent = "Edit";
        edit.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            openForm(cfg, arg);
        });

        var del = document.createElement("button");
        del.type = "button";
        del.className = "ae-btn del";
        del.textContent = "Delete";
        del.addEventListener("click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            removeRecord(cfg, arg);
        });

        bar.appendChild(edit);
        bar.appendChild(del);
        card.appendChild(bar);

        card.classList.add("ae-card-host");
    }

    /* ---- hooks on the page's own functions ---- */

    function wrapShow(cfg) {
        var original = window[cfg.show];
        if (typeof original !== "function") { return; }

        window[cfg.show] = function (arg) {
            if (capturing) { capture._value = arg; return; }
            return original.apply(this, arguments);
        };
    }

    function wrapRender(cfg) {
        var original = window[cfg.render];
        if (typeof original !== "function") { return; }

        window[cfg.render] = function () {
            var result = original.apply(this, arguments);
            if (!capturing) { inject(cfg); }
            return result;
        };
    }

    /* ---- header button ---- */

    function addHeaderButton(cfg) {
        if (cfg.noAdd) { return; }

        var head = document.querySelector(cfg.heading || ".page-heading");
        if (!head || head.querySelector(".ae-add")) { return; }

        var button = document.createElement("button");
        button.type = "button";
        button.className = "ae-add";
        button.textContent = cfg.addLabel;
        button.addEventListener("click", function (e) {
            e.stopPropagation();
            openForm(cfg, null);
        });

        head.appendChild(button);
    }

    /* =========================================================
       MODAL FORM
       ========================================================= */

    function fieldHtml(field) {
        var id = "ae_" + field.name;
        var attr = 'id="' + id + '" data-ae-field="' + field.name + '"';
        var required = field.required ? ' data-ae-required="1"' : "";
        var star = field.required ? " <b>*</b>" : "";
        var ph = field.placeholder ? ' placeholder="' + esc(field.placeholder) + '"' : "";
        var input;

        switch (field.type) {
            case "textarea":
                input = "<textarea " + attr + " rows=\"3\">" + "</textarea>";
                break;

            case "select":
                input = "<select " + attr + ">" +
                    field.options.map(function (option) {
                        return '<option value="' + esc(option) + '">' + esc(option) + "</option>";
                    }).join("") +
                    "</select>";
                break;

            case "users":
            case "courses":
                input = "<select " + attr + ' data-ae-remote="' + field.type + '">' +
                    '<option value="">Loading…</option></select>';
                break;

            case "date":
            case "time":
            case "email":
            case "number":
                input = "<input type=\"" + field.type + "\" " + attr + required + ph + ">";
                break;

            default:
                input = "<input type=\"text\" " + attr + required + ph + ">";
        }

        return '<label for="' + id + '">' + esc(field.label) + star + "</label>" + input;
    }

    function buildModal(cfg) {
        var overlay = document.createElement("div");
        overlay.className = "ae-overlay";

        overlay.innerHTML =
            '<div class="ae-modal" role="dialog" aria-modal="true">' +
                '<div class="ae-head">' +
                    '<h3 data-ae-title>' + esc(cfg.thing) + "</h3>" +
                    '<button type="button" class="ae-x" data-ae-close aria-label="Close">&times;</button>' +
                "</div>" +
                '<div class="ae-body">' + cfg.fields.map(fieldHtml).join("") + "</div>" +
                '<div class="ae-foot">' +
                    '<button type="button" class="ae-cancel" data-ae-close>Cancel</button>' +
                    '<button type="button" class="ae-save" data-ae-save>Save</button>' +
                "</div>" +
            "</div>";

        document.body.appendChild(overlay);

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) { closeForm(cfg); }
        });

        Array.prototype.forEach.call(overlay.querySelectorAll("[data-ae-close]"), function (button) {
            button.addEventListener("click", function () { closeForm(cfg); });
        });

        overlay.querySelector("[data-ae-save]").addEventListener("click", function () {
            saveForm(cfg);
        });

        cfg._overlay = overlay;
    }

    function closeForm(cfg) {
        if (cfg._overlay) { cfg._overlay.classList.remove("open"); }
        cfg._item = null;
    }

    function inputs(cfg) {
        return Array.prototype.slice.call(
            cfg._overlay.querySelectorAll("[data-ae-field]")
        );
    }

    function fillRemote(select) {
        if (select.dataset.aeReady === "1") { return Promise.resolve(); }

        var url = select.dataset.aeRemote === "users" ? "/api/admin/users" : "/api/courses";

        return loadList(url).then(function (rows) {
            rows = rows || [];
            var options;

            if (select.dataset.aeRemote === "users") {
                options = rows.filter(function (u) { return u.role === "student"; })
                    .map(function (u) {
                        return { value: u.id, label: (u.name || u.email || ("#" + u.id)) };
                    });
            } else {
                options = rows.map(function (c) {
                    return {
                        value: c.id,
                        label: (c.course_code ? c.course_code + " — " : "") + (c.course_name || "")
                    };
                });
            }

            select.innerHTML = '<option value="">— none —</option>' +
                options.map(function (o) {
                    return '<option value="' + esc(o.value) + '">' + esc(o.label) + "</option>";
                }).join("");

            select.dataset.aeReady = "1";
        });
    }

    function openForm(cfg, arg) {
        if (!cfg._overlay) { buildModal(cfg); }

        var creating = arg === null || arg === undefined;
        var item = creating ? null : resolveItem(cfg, arg);

        if (!creating && !item) {
            toast("That record is no longer on the page — reloading");
            reload(cfg);
            return;
        }

        cfg._item = item;
        cfg._creating = creating;

        var values = creating ? (cfg.defaults || {}) : cfg.fromItem(item);

        cfg._overlay.querySelector("[data-ae-title]").textContent =
            (creating ? "Add " : "Edit ") + cfg.thing.toLowerCase();

        inputs(cfg).forEach(function (el) {
            var name = el.dataset.aeField;
            var field = fieldNamed(cfg, name);

            if (field && field.createOnly && !creating) {
                el.disabled = true;
                el.value = "";
            } else {
                el.disabled = false;
                el.value = values[name] === undefined || values[name] === null
                    ? ""
                    : String(values[name]);
            }

            if (el.dataset.aeRemote) {
                fillRemote(el).then(function () {
                    if (values[name] !== undefined && values[name] !== null && values[name] !== "") {
                        el.value = String(values[name]);
                    }
                });
            }
        });

        cfg._overlay.classList.add("open");
    }

    function fieldNamed(cfg, name) {
        for (var i = 0; i < cfg.fields.length; i++) {
            if (cfg.fields[i].name === name) { return cfg.fields[i]; }
        }
        return null;
    }

    function saveForm(cfg) {
        if (!cfg._overlay) { return; }

        var values = {};
        var missing = null;

        inputs(cfg).forEach(function (el) {
            var name = el.dataset.aeField;
            values[name] = (el.value || "").trim();

            var field = fieldNamed(cfg, name);
            if (!field || !field.required) { return; }

            /* createOnly fields are disabled while editing — skip them there. */
            if (field.createOnly && !cfg._creating) { return; }

            if (!values[name] && !missing) { missing = field.label; }
        });

        if (missing) {
            toast(missing + " is required");
            return;
        }

        var creating = cfg._creating;
        var payload = cfg.toPayload(values, creating ? null : cfg._item);
        var url = cfg.api;
        var method = "POST";

        if (!creating) {
            url = cfg.api + "/" + encodeURIComponent(findId(cfg, cfg._item));
            method = "PUT";
        }

        CC.api(url, { method: method, body: payload }).then(function (res) {
            if (!res.ok || (res.data && res.data.success === false)) {
                toast(apiError(res));
                return;
            }
            closeForm(cfg);
            /* The server often knows more than we do (e.g. the auto grade). */
            toast((res.data && res.data.message) ||
                  (creating ? cfg.thing + " added" : cfg.thing + " updated"));
            reload(cfg);
        }).catch(function () {
            toast("Cannot reach the CampusConnect backend");
        });
    }

    function removeRecord(cfg, arg) {
        var item = resolveItem(cfg, arg);
        if (!item) { return; }

        var label = cfg.titleOf(item);

        if (!window.confirm('Delete "' + label + '"?\nThis cannot be undone.')) { return; }

        CC.api(cfg.api + "/" + encodeURIComponent(item.id), { method: "DELETE" })
            .then(function (res) {
                if (!res.ok || (res.data && res.data.success === false)) {
                    toast(apiError(res));
                    return;
                }
                toast("Deleted " + label);
                reload(cfg);
            })
            .catch(function () {
                toast("Cannot reach the CampusConnect backend");
            });
    }

    /* =========================================================
       BOOT
       ========================================================= */

    function mount(cfg, admin) {
        cfg._admin = !!admin;

        /* Controls are admin-only; students simply get the live data. */
        if (cfg._admin) {
            injectStyles();
            buildModal(cfg);
            wrapShow(cfg);
            wrapRender(cfg);
            addHeaderButton(cfg);
        }

        reload(cfg);
    }

    function boot() {
        try {
            if (!window.CC || !CC.token || !CC.token()) { return; }

            var name = location.pathname.split("/").pop();
            var cfg = CONFIGS[name];
            if (!cfg) { return; }

            mount(cfg, !!(CC.isAdmin && CC.isAdmin()));
        } catch (e) {
            console.warn("[admin-edit] not applied:", e);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
