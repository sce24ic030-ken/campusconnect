document.addEventListener("DOMContentLoaded", async function () {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/events/"
        );

        if (!response.ok) {
            throw new Error("Events API error: " + response.status);
        }

        const events = await response.json();

        console.log("✅ Events from backend:", events);

        const eventGrid = document.getElementById("eventGrid");

        if (eventGrid) {

            eventGrid.innerHTML = events.map(function (event) {

                let category = "Technical";
                let icon = "💻";

                if (event.title.toLowerCase().includes("sports")) {
                    category = "Sports";
                    icon = "🏆";
                }
                else if (event.title.toLowerCase().includes("cultural")) {
                    category = "Cultural";
                    icon = "🎭";
                }
                else if (event.title.toLowerCase().includes("freshers")) {
                    category = "Academic";
                    icon = "🎓";
                }

                const dateParts = event.date.split(" ");

                const day = dateParts[0];
                const month = dateParts[1]
                    ? dateParts[1].substring(0, 3).toUpperCase()
                    : "";

                return `
                    <article class="event-card"
                             data-category="${category.toLowerCase()}"
                             data-name="${event.title}">

                        <div class="event-top">

                            ${icon}

                            <div class="event-date">
                                <strong>${day}</strong>
                                <span>${month}</span>
                            </div>

                        </div>

                        <div class="event-body">

                            <div class="event-category">
                                ${category}
                            </div>

                            <h3>${event.title}</h3>

                            <p>
                                College event for students.
                                Join and participate in the program.
                            </p>

                            <div class="event-meta">

                                <span>
                                    ⏰ ${event.time}
                                </span>

                                <span>
                                    📍 ${event.venue}
                                </span>

                            </div>

                            <button
                                class="register-btn"
                                onclick="registerEvent('${event.title}')">
                                Register
                            </button>

                        </div>

                    </article>
                `;

            }).join("");

            console.log("✅ Events page updated with backend data.");
        }

    } catch (error) {

        console.error(
            "❌ Events connection error:",
            error
        );

    }

});