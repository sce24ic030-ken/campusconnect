document.addEventListener("DOMContentLoaded", async function () {

    // Get logged-in student's ID
    const studentId =
        localStorage.getItem("student_id") ||
        localStorage.getItem("studentId");

    if (!studentId) {
        console.error("Student ID not found in localStorage.");
        return;
    }

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/academics/${studentId}`
        );

        if (!response.ok) {
            throw new Error("Academics API error: " + response.status);
        }

        const data = await response.json();

        console.log("✅ Academics data from backend:", data);

        // Find an existing academic information area
        let academicBox = document.getElementById("academicData");

        // Create one if it doesn't already exist
        if (!academicBox) {
            academicBox = document.createElement("div");
            academicBox.id = "academicData";

            academicBox.style.cssText = `
                margin: 30px;
                padding: 25px;
                border-radius: 20px;
                background: linear-gradient(135deg, #ffffff, #f3eaff);
                box-shadow: 0 8px 25px rgba(100, 50, 180, 0.15);
                font-family: Poppins, sans-serif;
            `;

            document.body.appendChild(academicBox);
        }

        academicBox.innerHTML = `
            <h2>📚 My Academic Details</h2>

            <div style="
                display:flex;
                gap:20px;
                flex-wrap:wrap;
                margin-top:20px;
            ">

                <div style="
                    padding:18px;
                    border-radius:15px;
                    background:#ffffff;
                    min-width:150px;
                ">
                    <b>CGPA</b>
                    <h2>${data.cgpa}</h2>
                </div>

                <div style="
                    padding:18px;
                    border-radius:15px;
                    background:#ffffff;
                    min-width:150px;
                ">
                    <b>Semester</b>
                    <h2>${data.semester}</h2>
                </div>

                <div style="
                    padding:18px;
                    border-radius:15px;
                    background:#ffffff;
                    min-width:150px;
                ">
                    <b>Total Credits</b>
                    <h2>${data.total_credits}</h2>
                </div>

            </div>
        `;

    } catch (error) {
        console.error("❌ Academics connection error:", error);
    }
});