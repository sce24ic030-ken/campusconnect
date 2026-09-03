/* =====================================================
   CAMPUSCONNECT DASHBOARD JAVASCRIPT
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

const content = document.getElementById("content");

const pageTitle = document.getElementById("pageTitle");

const clock = document.getElementById("clock");

const modal = document.getElementById("modal");

const modalContent = document.getElementById("modalContent");

const modalClose = document.getElementById("modalClose");

const toast = document.getElementById("toast");

const notificationBtn =
    document.getElementById("notificationBtn");

const profileBtn =
    document.getElementById("profileBtn");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =====================================================
   TIMETABLE
   ===================================================== */

function timetableHTML() {

    return `

        <div class="section-head">

            <h2>
                🗓️ Today's Timetable
            </h2>

            <button
                class="gradient-btn"
                onclick="showToast('Full timetable opened')"
            >
                View Full
            </button>

        </div>


        <div class="table-container">

            <table class="timetable">

                <thead>

                    <tr>

                        <th>TIME</th>

                        <th>MONDAY</th>

                        <th>TUESDAY</th>

                        <th>WEDNESDAY</th>

                        <th>THURSDAY</th>

                        <th>FRIDAY</th>

                    </tr>

                </thead>


                <tbody>

                    <tr>

                        <td class="time-cell">
                            9:00 – 10:00
                        </td>

                        <td
                            class="subject-blue"
                            onclick="showToast('Web Technology selected')"
                        >
                            💻<br>
                            Web Technology
                        </td>

                        <td
                            class="subject-pink"
                            onclick="showToast('DBMS selected')"
                        >
                            🗄️<br>
                            DBMS
                        </td>

                        <td
                            class="subject-green"
                            onclick="showToast('Networking selected')"
                        >
                            🌐<br>
                            Networking
                        </td>

                        <td
                            class="subject-orange"
                            onclick="showToast('Programming selected')"
                        >
                            💻<br>
                            Programming
                        </td>

                        <td
                            class="subject-purple"
                            onclick="showToast('AI & ML selected')"
                        >
                            🤖<br>
                            AI & ML
                        </td>

                    </tr>


                    <tr>

                        <td class="time-cell">
                            10:00 – 11:00
                        </td>

                        <td class="subject-green">
                            📐<br>
                            Mathematics
                        </td>

                        <td class="subject-orange">
                            💻<br>
                            Programming
                        </td>

                        <td class="subject-blue">
                            💻<br>
                            Web Technology
                        </td>

                        <td class="subject-purple">
                            🤖<br>
                            AI & ML
                        </td>

                        <td class="subject-pink">
                            🗄️<br>
                            DBMS
                        </td>

                    </tr>


                    <tr>

                        <td class="time-cell">
                            11:00 – 11:30
                        </td>

                        <td
                            colspan="5"
                            class="break-cell"
                        >
                            ☕ BREAK TIME
                        </td>

                    </tr>


                    <tr>

                        <td class="time-cell">
                            11:30 – 12:30
                        </td>

                        <td class="subject-purple">
                            🤖<br>
                            AI & ML
                        </td>

                        <td class="subject-blue">
                            💻<br>
                            Web Technology
                        </td>

                        <td class="subject-orange">
                            💻<br>
                            Programming
                        </td>

                        <td class="subject-green">
                            🌐<br>
                            Networking
                        </td>

                        <td class="subject-blue">
                            💻<br>
                            Web Technology
                        </td>

                    </tr>


                    <tr>

                        <td class="time-cell">
                            12:30 – 1:30
                        </td>

                        <td class="subject-pink">
                            🗄️<br>
                            DBMS
                        </td>

                        <td class="subject-green">
                            🌐<br>
                            Networking
                        </td>

                        <td class="subject-purple">
                            🤖<br>
                            AI & ML
                        </td>

                        <td class="subject-blue">
                            💻<br>
                            Web Technology
                        </td>

                        <td class="subject-orange">
                            💻<br>
                            Programming
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>
    `;
}


/* =====================================================
   CAMPUS CARDS
   ===================================================== */

function campusCardsHTML() {

    return `

        <div
            class="campus-card"
            style="
                background-image:
                url('https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1000&q=85')
            "
        >

            <div class="campus-info">

                <strong>
                    📚 Central Library
                </strong>

                <small>
                    Books, journals & study spaces
                </small>

            </div>

        </div>


        <div
            class="campus-card"
            style="
                background-image:
                url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=85')
            "
        >

            <div class="campus-info">

                <strong>
                    🏟️ Sports Ground
                </strong>

                <small>
                    Stay active and healthy
                </small>

            </div>

        </div>


        <div
            class="campus-card"
            style="
                background-image:
                url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=85')
            "
        >

            <div class="campus-info">

                <strong>
                    🏫 Learning Centre
                </strong>

                <small>
                    Classes and collaboration
                </small>

            </div>

        </div>

    `;
}


/* =====================================================
   DASHBOARD
   ===================================================== */

function dashboardPage() {

    return `

        <!-- HERO -->

        <div class="hero">

            <div class="hero-content">

                <h2>
                    Welcome back, Priya! 👋
                </h2>

                <p>
                    Stay organized, keep learning,
                    and make today productive.
                </p>

                <div
                    class="hero-date"
                    id="todayDate"
                ></div>

            </div>

        </div>


        <!-- STAT CARDS -->

        <div class="stats-grid">


            <div class="stat-card">

                <div class="stat-icon">
                    📚
                </div>

                <div>

                    <h3>
                        6
                    </h3>

                    <p>
                        Active Courses
                    </p>

                </div>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    📝
                </div>

                <div>

                    <h3>
                        4
                    </h3>

                    <p>
                        Pending Assignments
                    </p>

                </div>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    📈
                </div>

                <div>

                    <h3>
                        87%
                    </h3>

                    <p>
                        Attendance
                    </p>

                </div>

            </div>


            <div class="stat-card">

                <div class="stat-icon">
                    ⭐
                </div>

                <div>

                    <h3>
                        8.7
                    </h3>

                    <p>
                        Current CGPA
                    </p>

                </div>

            </div>


        </div>


        <!-- TIMETABLE -->

        ${timetableHTML()}


        <!-- QUICK ACTIONS -->

        <div class="section-head">

            <h2>
                ⚡ Quick Actions
            </h2>

        </div>


        <div class="quick-grid">


            <button
                class="quick-card"
                onclick="openPage('assignments')"
            >

                <div class="quick-icon">
                    📝
                </div>

                <strong>
                    Submit Assignment
                </strong>

            </button>


            <button
                class="quick-card"
                onclick="openPage('attendance')"
            >

                <div class="quick-icon">
                    📊
                </div>

                <strong>
                    Check Attendance
                </strong>

            </button>


            <button
                class="quick-card"
                onclick="openPage('campus')"
            >

                <div class="quick-icon">
                    📚
                </div>

                <strong>
                    Library
                </strong>

            </button>


            <button
                class="quick-card"
                onclick="showToast('No new campus notices')"
            >

                <div class="quick-icon">
                    📣
                </div>

                <strong>
                    Campus Notices
                </strong>

            </button>


        </div>


        <!-- CAMPUS -->

        <div class="section-head">

            <div>

                <h2>
                    🏫 Explore Campus
                </h2>

            </div>

            <span class="section-subtitle">
                Discover your campus
            </span>

        </div>


        <div class="campus-grid">

            ${campusCardsHTML()}

        </div>

    `;
}


/* =====================================================
   COURSES PAGE
   ===================================================== */

function coursesPage() {

    const courses = [

        ["Web Technology", "Professor Sharma", 92],

        ["Database Management System", "Professor Kumar", 85],

        ["Programming", "Professor Rao", 88],

        ["Artificial Intelligence & ML", "Professor Mehta", 79],

        ["Computer Networking", "Professor Patel", 90],

        ["Mathematics", "Professor Singh", 94]

    ];


    return `

        <div class="section-head">

            <h2>
                📚 My Courses
            </h2>

        </div>


        <div class="list-container">

            ${courses.map(course => `

                <div class="list-card">

                    <div>

                        <strong>
                            ${course[0]}
                        </strong>

                        <small>
                            Semester VI • ${course[1]}
                        </small>

                    </div>

                    <span class="badge">
                        ${course[2]}% Progress
                    </span>

                </div>

            `).join("")}

        </div>

    `;
}


/* =====================================================
   ASSIGNMENTS PAGE
   ===================================================== */

function assignmentsPage() {

    const assignments = [

        ["Responsive Web Design", "05 September 2026", "Pending", "pink"],

        ["SQL Query Optimization", "08 September 2026", "Pending", "pink"],

        ["Python Mini Project", "12 September 2026", "Upcoming", "orange"],

        ["AI Research Report", "15 September 2026", "Upcoming", "orange"],

        ["Networking Lab Record", "18 September 2026", "Upcoming", "green"]

    ];


    return `

        <div class="section-head">

            <h2>
                📝 Assignments
            </h2>

            <button
                class="gradient-btn"
                onclick="showToast('New assignment form opened')"
            >
                + Add Assignment
            </button>

        </div>


        <div class="list-container">

            ${assignments.map((item, index) => `

                <div class="list-card">

                    <div>

                        <strong>
                            ${item[0]}
                        </strong>

                        <small>
                            Due: ${item[1]}
                        </small>

                    </div>


                    <button
                        class="badge ${item[3]}"
                        onclick="assignmentAction('${item[0]}')"
                    >
                        ${item[2]}
                    </button>

                </div>

            `).join("")}

        </div>

    `;
}


/* =====================================================
   ATTENDANCE PAGE
   ===================================================== */

function attendancePage() {

    const subjects = [

        ["Web Technology", 92],

        ["Database Management System", 85],

        ["Programming", 88],

        ["Artificial Intelligence & ML", 79],

        ["Computer Networking", 90],

        ["Mathematics", 94]

    ];


    return `

        <div class="section-head">

            <h2>
                📊 Attendance
            </h2>

            <span class="section-subtitle">
                Overall Attendance: 87%
            </span>

        </div>


        <div class="list-container">

            ${subjects.map(subject => `

                <div class="list-card">

                    <div class="progress-container">

                        <div class="progress-header">

                            <strong>
                                ${subject[0]}
                            </strong>

                            <strong>
                                ${subject[1]}%
                            </strong>

                        </div>


                        <div class="progress-bar">

                            <div
                                class="progress-fill"
                                style="width:${subject[1]}%"
                            ></div>

                        </div>

                    </div>

                </div>

            `).join("")}

        </div>

    `;
}


/* =====================================================
   CAMPUS PAGE
   ===================================================== */

function campusPage() {

    return `

        <div class="section-head">

            <h2>
                🏫 Explore Campus
            </h2>

        </div>


        <div class="campus-grid">

            ${campusCardsHTML()}

        </div>


        <div class="section-head">

            <h2>
                📍 Campus Facilities
            </h2>

        </div>


        <div class="list-container">

            <div class="list-card">

                <div>

                    <strong>
                        📚 Digital Library
                    </strong>

                    <small>
                        Online books, journals and research material
                    </small>

                </div>

                <span class="badge green">
                    Open
                </span>

            </div>


            <div class="list-card">

                <div>

                    <strong>
                        🏥 Health Centre
                    </strong>

                    <small>
                        Student health and emergency support
                    </small>

                </div>

                <span class="badge green">
                    Available
                </span>

            </div>


            <div class="list-card">

                <div>

                    <strong>
                        🍽️ Cafeteria
                    </strong>

                    <small>
                        Food court and student refreshments
                    </small>

                </div>

                <span class="badge orange">
                    Open
                </span>

            </div>


            <div class="list-card">

                <div>

                    <strong>
                        💻 Computer Lab
                    </strong>

                    <small>
                        Programming and practical laboratory
                    </small>

                </div>

                <span class="badge green">
                    Available
                </span>

            </div>

        </div>

    `;
}


/* =====================================================
   SETTINGS PAGE
   ===================================================== */

function settingsPage() {

    return `

        <div class="section-head">

            <h2>
                ⚙️ Settings
            </h2>

        </div>


        <div class="list-container">


            <div class="setting-row">

                <div>

                    <strong>
                        Notifications
                    </strong>

                    <small>
                        Receive campus updates and reminders
                    </small>

                </div>

                <button
                    class="switch active"
                    onclick="toggleSwitch(this)"
                ></button>

            </div>


            <div class="setting-row">

                <div>

                    <strong>
                        Email Notifications
                    </strong>

                    <small>
                        Receive important updates by email
                    </small>

                </div>

                <button
                    class="switch active"
                    onclick="toggleSwitch(this)"
                ></button>

            </div>


            <div class="setting-row">

                <div>

                    <strong>
                        Dark Mode
                    </strong>

                    <small>
                        Change dashboard appearance
                    </small>

                </div>

                <button
                    class="switch"
                    onclick="toggleDarkMode(this)"
                ></button>

            </div>


            <div class="setting-row">

                <div>

                    <strong>
                        Student Profile
                    </strong>

                    <small>
                        Priya Bhavani • BCA • Semester VI
                    </small>

                </div>

                <button
                    class="gradient-btn"
                    onclick="openProfile()"
                >
                    Edit
                </button>

            </div>


        </div>

    `;
}


/* =====================================================
   ALL PAGES
   ===================================================== */

const pages = {

    dashboard: dashboardPage,

    courses: coursesPage,

    timetable: () => timetableHTML(),

    assignments: assignmentsPage,

    attendance: attendancePage,

    campus: campusPage,

    settings: settingsPage

};


/* =====================================================
   OPEN PAGE
   ===================================================== */

function openPage(pageName) {

    if (!pages[pageName]) {
        pageName = "dashboard";
    }


    /* Update active navigation */

    document.querySelectorAll(".nav-item").forEach(item => {

        item.classList.remove("active");

        if (item.dataset.page === pageName) {

            item.classList.add("active");

        }

    });


    /* Update title */

    const titles = {

        dashboard: "Dashboard",

        courses: "My Courses",

        timetable: "Timetable",

        assignments: "Assignments",

        attendance: "Attendance",

        campus: "Campus",

        settings: "Settings"

    };


    pageTitle.textContent =
        titles[pageName];


    /* Render page */

    content.innerHTML =
        pages[pageName]();


    /* Update date */

    updateDate();


    /* Scroll */

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =====================================================
   NAVIGATION BUTTONS
   ===================================================== */

document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        const page =
            button.dataset.page;

        openPage(page);

    });

});


/* =====================================================
   DATE
   ===================================================== */

function updateDate() {

    const dateElement =
        document.getElementById("todayDate");


    if (!dateElement) {
        return;
    }


    const now =
        new Date();


    dateElement.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


/* =====================================================
   LIVE CLOCK
   ===================================================== */

function updateClock() {

    const now =
        new Date();


    clock.textContent =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

}


setInterval(updateClock, 1000);

updateClock();


/* =====================================================
   MODAL
   ===================================================== */

function openModal(html) {

    modalContent.innerHTML =
        html;

    modal.classList.remove("hidden");

}


function closeModal() {

    modal.classList.add("hidden");

}


modalClose.addEventListener(
    "click",
    closeModal
);


modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {

            closeModal();

        }

    }
);


/* =====================================================
   NOTIFICATIONS
   ===================================================== */

notificationBtn.addEventListener(
    "click",
    function() {

        openModal(`

            <h2>
                🔔 Notifications
            </h2>


            <p>
                👋 Welcome back to CampusConnect!
            </p>


            <p>
                📚 Your next class is
                <strong>
                    Web Technology
                </strong>.
            </p>


            <p>
                📝 You have
                <strong>
                    4 pending assignments
                </strong>.
            </p>


            <p>
                📊 Your current attendance is
                <strong>
                    87%
                </strong>.
            </p>

        `);

    }
);


/* =====================================================
   PROFILE
   ===================================================== */

profileBtn.addEventListener(
    "click",
    openProfile
);


function openProfile() {

    openModal(`

        <h2>
            👤 Student Profile
        </h2>


        <p>
            <strong>
                Priya Bhavani
            </strong>
        </p>


        <p>
            Course:
            <strong>
                BCA
            </strong>
        </p>


        <p>
            Semester:
            <strong>
                VI
            </strong>
        </p>


        <p>
            Student ID:
            <strong>
                BCA2026
            </strong>
        </p>


        <p>
            Current CGPA:
            <strong>
                8.7
            </strong>
        </p>


        <br>


        <button
            class="gradient-btn"
            onclick="showToast('Profile saved successfully'); closeModal()"
        >
            Save Profile
        </button>

    `);

}


/* =====================================================
   TOAST
   ===================================================== */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add("show");


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            2300
        );

}


/* =====================================================
   ASSIGNMENT ACTION
   ===================================================== */

function assignmentAction(name) {

    openModal(`

        <h2>
            📝 ${name}
        </h2>

        <p>
            You can submit your assignment
            from this section.
        </p>

        <br>

        <button
            class="gradient-btn"
            onclick="showToast('Assignment submission started'); closeModal()"
        >
            Submit Assignment
        </button>

    `);

}


/* =====================================================
   SWITCH
   ===================================================== */

function toggleSwitch(element) {

    element.classList.toggle("active");


    if (
        element.classList.contains("active")
    ) {

        showToast("Setting enabled");

    } else {

        showToast("Setting disabled");

    }

}


/* =====================================================
   DARK MODE
   ===================================================== */

function toggleDarkMode(element) {

    element.classList.toggle("active");

    document.body.classList.toggle("dark");


    if (
        document.body.classList.contains("dark")
    ) {

        showToast("Dark mode enabled");

    } else {

        showToast("Light mode enabled");

    }

}


/* =====================================================
   LOGOUT
   ===================================================== */

logoutBtn.addEventListener(
    "click",
    function() {

        const confirmed =
            confirm(
                "Do you want to logout?"
            );


        if (confirmed) {

            showToast(
                "Logged out successfully"
            );

        }

    }
);


/* =====================================================
   KEYBOARD ESCAPE
   ===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


/* =====================================================
   INITIAL LOAD
   ===================================================== */

openPage("dashboard");

updateDate();

updateClock();