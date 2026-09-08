// CampusConnect Attendance

document.addEventListener("DOMContentLoaded", async function () {

    const studentId =
        localStorage.getItem("student_id") ||
        localStorage.getItem("studentId");

    if (!studentId) {
        console.error("Student ID not found.");
        return;
    }

    try {

        const response = await fetch(
            `http://127.0.0.1:5000/api/attendance/student/${studentId}`
        );

        if (!response.ok) {
            throw new Error("Attendance API error: " + response.status);
        }

        const data = await response.json();

        console.log("✅ Attendance data:", data);

        // Find the attendance section
        const attendanceSection =
            document.querySelector('[data-page="attendance"]');

        // Create a display box
        let attendanceBox = document.getElementById("liveAttendance");

        if (!attendanceBox) {

            attendanceBox = document.createElement("div");

            attendanceBox.id = "liveAttendance";

            attendanceBox.style.cssText = `
                margin: 25px;
                padding: 25px;
                border-radius: 20px;
                background: linear-gradient(135deg, #ffffff, #eef3ff);
                box-shadow: 0 8px 25px rgba(50, 80, 180, 0.15);
                font-family: Arial, sans-serif;
            `;

            document.body.appendChild(attendanceBox);
        }

        // Handle single attendance record
        if (!Array.isArray(data)) {

            attendanceBox.innerHTML = `
                <h2>📅 My Attendance</h2>

                <div style="
                    margin-top:20px;
                    padding:20px;
                    border-radius:15px;
                    background:white;
                ">

                    <h3>Course ID: ${data.course_id}</h3>

                    <p>
                        <strong>Date:</strong>
                        ${data.attendance_date}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${data.status}
                    </p>

                </div>
            `;

        } else {

            attendanceBox.innerHTML = `
                <h2>📅 My Attendance</h2>

                ${data.map(record => `
                    <div style="
                        margin-top:15px;
                        padding:18px;
                        border-radius:15px;
                        background:white;
                    ">

                        <h3>Course ID: ${record.course_id}</h3>

                        <p>
                            <strong>Date:</strong>
                            ${record.attendance_date}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${record.status}
                        </p>

                    </div>
                `).join("")}
            `;
        }

    } catch (error) {

        console.error("❌ Attendance connection error:", error);

    }

});