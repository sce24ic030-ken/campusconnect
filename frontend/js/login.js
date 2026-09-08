// CampusConnect Login

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Login response:", data);

            if (!response.ok) {
                alert(data.error || data.message || "Invalid email or password.");
                return;
            }

            // Get student information
            const student = data.student || data;

            // Get student ID from any possible backend field
            const studentId =
                student.id ||
                student.student_id ||
                data.student_id;

            const studentName =
                student.name ||
                data.name ||
                "Student";

            if (!studentId) {
                console.error("Student ID missing from login response:", data);
                alert("Login worked, but Student ID was not received.");
                return;
            }

            // SAVE LOGIN INFORMATION
            localStorage.setItem(
                "student",
                JSON.stringify(student)
            );

            localStorage.setItem(
                "student_id",
                String(studentId)
            );

            localStorage.setItem(
                "student_name",
                studentName
            );

            console.log("✅ Student ID saved:", studentId);
            console.log("✅ Student name saved:", studentName);

            alert("Login successful! Welcome to CampusConnect.");

            // Open dashboard
            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("❌ Login error:", error);

            alert(
                "Cannot connect to the backend. Please make sure Flask is running."
            );
        }

    });

}