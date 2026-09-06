document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".nav-item").forEach(function (button) {

        button.addEventListener("click", function () {

            const page = this.getAttribute("data-page");

            if (page === "assignments") {

                setTimeout(async function () {

                    try {

                        const response = await fetch(
                            "http://127.0.0.1:5000/api/assignments/"
                        );

                        if (!response.ok) {
                            throw new Error(
                                "Assignments API error: " + response.status
                            );
                        }

                        const assignments = await response.json();

                        console.log(
                            "✅ Assignments from backend:",
                            assignments
                        );

                        const content =
                            document.getElementById("content");

                        if (!content) {
                            console.error("Content section not found.");
                            return;
                        }

                        const listContainer =
                            content.querySelector(".list-container");

                        if (!listContainer) {
                            console.error(
                                "Assignments list not found."
                            );
                            return;
                        }

                        listContainer.innerHTML =
                            assignments.map(function (assignment) {

                                let badgeClass = "green";

                                if (assignment.status === "Pending") {
                                    badgeClass = "pink";
                                } else if (
                                    assignment.status === "Upcoming"
                                ) {
                                    badgeClass = "orange";
                                }

                                return `
                                    <div class="list-card">

                                        <div>
                                            <strong>
                                                ${assignment.title}
                                            </strong>

                                            <small>
                                                Due: ${assignment.due_date}
                                            </small>
                                        </div>

                                        <button
                                            class="badge ${badgeClass}"
                                            onclick="assignmentAction('${assignment.title}')"
                                        >
                                            ${assignment.status}
                                        </button>

                                    </div>
                                `;

                            }).join("");

                    } catch (error) {

                        console.error(
                            "❌ Assignments connection error:",
                            error
                        );

                    }

                }, 100);

            }

        });

    });

});