document.addEventListener("DOMContentLoaded", function () {

    const examContainer = document.getElementById("examContainer");

    if (!examContainer) {
        console.error("examContainer not found");
        return;
    }

    fetch("http://127.0.0.1:5000/api/exams/")
        .then(function (response) {

            if (!response.ok) {
                throw new Error("API Error: " + response.status);
            }

            return response.json();
        })

        .then(function (exams) {

            console.log("EXAMS FROM BACKEND:", exams);

            if (!exams || exams.length === 0) {

                examContainer.innerHTML = `
                    <div class="error">
                        No examinations available.
                    </div>
                `;

                return;
            }

            examContainer.innerHTML = exams.map(function (exam) {

                return `
                    <div class="exam-card">

                        <div class="exam-icon">
                            📝
                        </div>

                        <div class="exam-info">

                            <h3>${exam.subject}</h3>

                            <p>📅 ${exam.date}</p>

                            <p>⏰ ${exam.time}</p>

                            <p>📍 ${exam.venue}</p>

                        </div>

                        <div class="exam-status">
                            Upcoming
                        </div>

                    </div>
                `;

            }).join("");

        })

        .catch(function (error) {

            console.error("EXAM ERROR:", error);

            examContainer.innerHTML = `
                <div class="error">
                    ❌ Unable to load examinations.
                    <br><br>
                    Please make sure the Flask server is running.
                </div>
            `;

        });

});