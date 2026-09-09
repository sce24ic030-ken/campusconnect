// ========================================
// CAMPUSCONNECT - ASSIGNMENTS
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const assignmentList = document.getElementById("assignmentList");

    const totalAssignments =
        document.getElementById("totalAssignments");

    const pendingAssignments =
        document.getElementById("pendingAssignments");

    const submittedAssignments =
        document.getElementById("submittedAssignments");

    const overdueAssignments =
        document.getElementById("overdueAssignments");

    const subjectFilter =
        document.getElementById("subjectFilter");

    const statusFilter =
        document.getElementById("statusFilter");


    // ========================================
    // LOAD ASSIGNMENTS FROM BACKEND
    // ========================================

    async function loadAssignments() {

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/api/assignments/"
            );

            if (!response.ok) {
                throw new Error(
                    "Assignments API error: " + response.status
                );
            }

            const data = await response.json();

            console.log("Assignments received from backend:", data);

            // Handle different possible backend response formats
            let assignments = data;

            if (data.assignments) {
                assignments = data.assignments;
            }

            if (data.data) {
                assignments = data.data;
            }

            if (!Array.isArray(assignments)) {
                assignments = [];
            }

            displayAssignments(assignments);

        } catch (error) {

            console.error(
                "Error loading assignments:",
                error
            );

            /*
             * If backend is not running, show the assignments
             * already present in assignments.html.
             */

            loadExistingAssignments();

        }

    }


    // ========================================
    // DISPLAY BACKEND ASSIGNMENTS
    // ========================================

    function displayAssignments(assignments) {

        assignmentList.innerHTML = "";

        if (assignments.length === 0) {

            assignmentList.innerHTML = `
                <div style="
                    text-align:center;
                    padding:40px;
                    color:#64748b;
                    font-size:14px;
                ">
                    No assignments available.
                </div>
            `;

            updateStats([]);

            return;
        }


        assignments.forEach(function (assignment) {

            const title =
                assignment.title ||
                assignment.name ||
                "Untitled Assignment";

            const subject =
                assignment.subject ||
                assignment.course ||
                assignment.subject_name ||
                "Subject";

            const dueDate =
                assignment.due_date ||
                assignment.dueDate ||
                "Not specified";

            let status =
                assignment.status ||
                "Pending";

            status = formatStatus(status);


            const assignmentCard =
                document.createElement("div");

            assignmentCard.className = "assignment";

            assignmentCard.dataset.subject = subject;
            assignmentCard.dataset.status = status;


            assignmentCard.innerHTML = `

                <div class="assignment-left">

                    <div class="subject-icon">
                        📝
                    </div>

                    <div class="assignment-info">

                        <h3>
                            ${escapeHTML(title)}
                        </h3>

                        <p>
                            ${escapeHTML(subject)}
                        </p>

                    </div>

                </div>


                <div class="assignment-right">

                    <div class="due-date">

                        <div class="due-label">
                            Due Date
                        </div>

                        <div class="due-value">
                            ${escapeHTML(dueDate)}
                        </div>

                    </div>


                    <div class="status ${getStatusClass(status)}">

                        ${escapeHTML(status)}

                    </div>


                    <button
                        class="view-btn"
                        type="button"
                        onclick="viewAssignment('${escapeJS(title)}')"
                    >
                        View
                    </button>

                </div>

            `;


            assignmentList.appendChild(
                assignmentCard
            );

        });


        updateStats(assignments);

    }


    // ========================================
    // USE EXISTING HTML ASSIGNMENTS
    // ========================================

    function loadExistingAssignments() {

        const assignments =
            document.querySelectorAll(".assignment");

        updateStats(
            Array.from(assignments)
        );

        console.log(
            "Backend unavailable. Using assignments from HTML."
        );

    }


    // ========================================
    // UPDATE STATISTICS
    // ========================================

    function updateStats(assignments) {

        let total = assignments.length;

        let pending = 0;
        let submitted = 0;
        let overdue = 0;


        assignments.forEach(function (assignment) {

            let status;


            if (assignment.dataset) {

                status =
                    assignment.dataset.status;

            } else {

                status =
                    assignment.status;

            }


            status =
                formatStatus(status);


            if (status === "Pending") {
                pending++;
            }

            else if (status === "Submitted") {
                submitted++;
            }

            else if (status === "Overdue") {
                overdue++;
            }

        });


        totalAssignments.textContent =
            total;

        pendingAssignments.textContent =
            pending;

        submittedAssignments.textContent =
            submitted;

        overdueAssignments.textContent =
            overdue;

    }


    // ========================================
    // FORMAT STATUS
    // ========================================

    function formatStatus(status) {

        if (!status) {
            return "Pending";
        }

        const value =
            String(status)
                .trim()
                .toLowerCase();


        if (
            value === "submitted" ||
            value === "complete" ||
            value === "completed"
        ) {
            return "Submitted";
        }


        if (
            value === "overdue" ||
            value === "late"
        ) {
            return "Overdue";
        }


        return "Pending";

    }


    // ========================================
    // STATUS CSS CLASS
    // ========================================

    function getStatusClass(status) {

        if (status === "Submitted") {
            return "submitted";
        }

        if (status === "Overdue") {
            return "overdue";
        }

        return "pending";

    }


    // ========================================
    // FILTER ASSIGNMENTS
    // ========================================

    function filterAssignments() {

        const selectedSubject =
            subjectFilter.value;

        const selectedStatus =
            statusFilter.value;


        const assignments =
            document.querySelectorAll(
                ".assignment"
            );


        let visibleCount = 0;


        assignments.forEach(function (assignment) {

            const assignmentSubject =
                assignment.dataset.subject || "";

            const assignmentStatus =
                assignment.dataset.status || "";


            const subjectMatches =
                selectedSubject === "all" ||
                assignmentSubject === selectedSubject;


            const statusMatches =
                selectedStatus === "all" ||
                assignmentStatus === selectedStatus;


            if (
                subjectMatches &&
                statusMatches
            ) {

                assignment.style.display =
                    "flex";

                visibleCount++;

            } else {

                assignment.style.display =
                    "none";

            }

        });


        console.log(
            "Visible assignments:",
            visibleCount
        );

    }


    // ========================================
    // VIEW ASSIGNMENT
    // ========================================

    window.viewAssignment = function (name) {

        alert(
            "Assignment: " +
            name +
            "\n\n" +
            "Assignment details can be connected to the backend later."
        );

    };


    // ========================================
    // ESCAPE HTML
    // ========================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ========================================
    // ESCAPE JAVASCRIPT STRING
    // ========================================

    function escapeJS(value) {

        return String(value)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"');

    }


    // ========================================
    // FILTER EVENTS
    // ========================================

    subjectFilter.addEventListener(
        "change",
        filterAssignments
    );

    statusFilter.addEventListener(
        "change",
        filterAssignments
    );


    // ========================================
    // START
    // ========================================

    loadAssignments();

});