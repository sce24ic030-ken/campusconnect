/* =====================================================
   CAMPUSCONNECT DASHBOARD
===================================================== */

document.addEventListener("DOMContentLoaded", function () {


    /* =================================================
       ELEMENTS
    ================================================= */

    const sidebar =
        document.getElementById("sidebar");

    const mobileMenu =
        document.getElementById("mobileMenu");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationPopup =
        document.getElementById("notificationPopup");

    const chatLauncher =
        document.getElementById("chatLauncher");

    const chatQuickAction =
        document.getElementById("chatQuickAction");

    const chatbot =
        document.getElementById("chatbot");

    const chatClose =
        document.getElementById("chatClose");

    const chatSend =
        document.getElementById("chatSend");

    const chatInput =
        document.getElementById("chatInput");

    const chatMessages =
        document.getElementById("chatMessages");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const profileButton =
        document.getElementById("profileButton");

    const modal =
        document.getElementById("dashboardModal");

    const modalClose =
        document.getElementById("modalClose");

    const modalOkay =
        document.getElementById("modalOkay");

    const viewAllBtn =
        document.getElementById("viewAllBtn");


    /* =================================================
       CURRENT DATE
    ================================================= */

    const todayDate =
        document.getElementById("todayDate");

    const now = new Date();

    const dateText =
        now.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    if (todayDate) {
        todayDate.textContent = dateText;
    }


    /* =================================================
       CURRENT TIME
    ================================================= */

    function updateTime() {

        const currentTime =
            document.getElementById("currentTime");

        if (!currentTime) return;

        const now =
            new Date();

        currentTime.textContent =
            now.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );
    }

    updateTime();

    setInterval(updateTime, 1000);


    /* =================================================
       SIDEBAR MOBILE MENU
    ================================================= */

    if (mobileMenu) {

        mobileMenu.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "mobile-open"
                );

            }
        );

    }


    /* =================================================
       PAGE NAVIGATION
    ================================================= */

    const navItems =
        document.querySelectorAll(
            "[data-page]"
        );


    navItems.forEach(function (item) {

        item.addEventListener(
            "click",
            function () {

                const page =
                    item.getAttribute(
                        "data-page"
                    );

                if (!page) return;


                /*
                 * Dashboard stays on dashboard.
                 */

                if (page === "dashboard") {

                    window.location.href =
                        "dashboard.html";

                    return;
                }


                /*
                 * Future pages.
                 *
                 * We will create these one by one.
                 */

                const pageFiles = {

                    timetable:
                        "timetable.html",

                    assignments:
                        "assignments.html",

                    attendance:
                        "attendance.html",

                    academics:
                        "academics.html",

                    faculty:
                        "faculty.html",

                    placement:
                        "placement.html",

                    results:
                        "results.html",

                    documents:
                        "documents.html",

                    complaints:
                        "complaints.html",

                    feedback:
                        "feedback.html",

                    "lost-found":
                        "lost-found.html",

                    campus:
                        "campus.html",

                    events:
                        "events.html",

                    exams:
                        "exams.html",

                    notifications:
                        "notifications.html",

                    profile:
                        "profile.html",

                    settings:
                        "settings.html"

                };


                if (pageFiles[page]) {

                    window.location.href =
                        pageFiles[page];

                }

            }
        );

    });


    /* =================================================
       NOTIFICATION POPUP
    ================================================= */

    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                notificationPopup.classList.toggle(
                    "show"
                );

            }
        );

    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                notificationPopup &&
                !notificationPopup.contains(event.target) &&
                !notificationBtn.contains(event.target)
            ) {

                notificationPopup.classList.remove(
                    "show"
                );

            }

        }
    );


    /* =================================================
       CHATBOT OPEN
    ================================================= */

    function openChatbot() {

        chatbot.classList.add("open");

        chatLauncher.style.display =
            "none";

        setTimeout(function () {

            chatInput.focus();

        }, 200);

    }


    /* =================================================
       CHATBOT CLOSE
    ================================================= */

    function closeChatbot() {

        chatbot.classList.remove("open");

        chatLauncher.style.display =
            "block";

    }


    if (chatLauncher) {

        chatLauncher.addEventListener(
            "click",
            openChatbot
        );

    }


    if (chatQuickAction) {

        chatQuickAction.addEventListener(
            "click",
            openChatbot
        );

    }


    if (chatClose) {

        chatClose.addEventListener(
            "click",
            closeChatbot
        );

    }


    /* =================================================
       CHAT MESSAGE
    ================================================= */

    function addMessage(
        message,
        type
    ) {

        const messageDiv =
            document.createElement("div");

        messageDiv.className =
            "chat-message " + type;

        messageDiv.textContent =
            message;

        chatMessages.appendChild(
            messageDiv
        );


        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }


    /* =================================================
       AI RESPONSE
    ================================================= */

    function getAIResponse(message) {

        const text =
            message.toLowerCase();


        if (
            text.includes("timetable") ||
            text.includes("schedule") ||
            text.includes("class")
        ) {

            return "Your next classes are Web Technology at 9:00 AM, Database Management at 10:00 AM, Computer Networks at 12:00 PM and Software Engineering at 2:00 PM.";

        }


        if (
            text.includes("attendance")
        ) {

            return "Your current overall attendance is 87%. Keep attending your classes regularly to maintain a good percentage.";

        }


        if (
            text.includes("assignment")
        ) {

            return "You currently have 4 pending assignments. The Web Technology Project is due tomorrow.";

        }


        if (
            text.includes("cgpa") ||
            text.includes("marks") ||
            text.includes("result")
        ) {

            return "Your current CGPA shown on the dashboard is 8.6. Keep up the good academic performance!";

        }


        if (
            text.includes("placement") ||
            text.includes("job") ||
            text.includes("company")
        ) {

            return "You can check the Placement module for company opportunities, eligibility information and application details.";

        }


        if (
            text.includes("hello") ||
            text.includes("hi") ||
            text.includes("hey")
        ) {

            return "Hello! 👋 I'm your AI College Companion. How can I help you today?";

        }


        if (
            text.includes("thank")
        ) {

            return "You're welcome! 😊 I'm always here to help.";

        }


        return "I can help you with timetable, attendance, assignments, academics, results, placements and campus information. Try asking me about one of these.";

    }


    /* =================================================
       SEND MESSAGE
    ================================================= */

    function sendChatMessage() {

        const message =
            chatInput.value.trim();


        if (message === "") {
            return;
        }


        addMessage(
            message,
            "user"
        );


        chatInput.value = "";


        /*
         * Temporary AI response.
         *
         * Later this will connect to your
         * friend's backend / AI API.
         */

        setTimeout(
            function () {

                const response =
                    getAIResponse(message);

                addMessage(
                    response,
                    "bot"
                );

            },
            500
        );

    }


    if (chatSend) {

        chatSend.addEventListener(
            "click",
            sendChatMessage
        );

    }


    if (chatInput) {

        chatInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendChatMessage();

                }

            }
        );

    }


    /* =================================================
       CHAT SUGGESTIONS
    ================================================= */

    const suggestions =
        document.querySelectorAll(
            ".chat-suggestion"
        );


    suggestions.forEach(
        function (suggestion) {

            suggestion.addEventListener(
                "click",
                function () {

                    chatInput.value =
                        suggestion.textContent.trim();

                    sendChatMessage();

                }
            );

        }
    );


    /* =================================================
       PROFILE
    ================================================= */

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function () {

                showModal(
                    "Student Profile",
                    "Your profile module will contain your personal information, course details, contact information and academic details."
                );

            }
        );

    }


    /* =================================================
       VIEW ALL
    ================================================= */

    if (viewAllBtn) {

        viewAllBtn.addEventListener(
            "click",
            function () {

                showModal(
                    "CampusConnect",
                    "All your important academic activities will be available through the modules in the sidebar."
                );

            }
        );

    }


    /* =================================================
       MODAL
    ================================================= */

    function showModal(
        title,
        message
    ) {

        const modalTitle =
            document.getElementById(
                "modalTitle"
            );

        const modalText =
            document.getElementById(
                "modalText"
            );

        modalTitle.textContent =
            title;

        modalText.textContent =
            message;

        modal.classList.add(
            "show"
        );

    }


    function closeModal() {

        modal.classList.remove(
            "show"
        );

    }


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeModal
        );

    }


    if (modalOkay) {

        modalOkay.addEventListener(
            "click",
            closeModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    closeModal();

                }

            }
        );

    }


    /* =================================================
       LOGOUT
    ================================================= */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            function () {

                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (confirmLogout) {

                    localStorage.removeItem(
                        "campusconnect_user"
                    );

                    window.location.href =
                        "../index.html";

                }

            }
        );

    }


    /* =================================================
       FINISH
    ================================================= */

    console.log(
        "CampusConnect Dashboard loaded successfully."
    );

});