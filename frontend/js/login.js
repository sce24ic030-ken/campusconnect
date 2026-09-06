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

            if (response.ok) {
                // Save student information for dashboard
                if (data.student) {
                    localStorage.setItem(
                        "student",
                        JSON.stringify(data.student)
                    );

                    localStorage.setItem(
                        "student_id",
                        data.student.id
                    );

                    localStorage.setItem(
                        "student_name",
                        data.student.name
                    );
                }

                alert("Login successful! Welcome to CampusConnect.");

                // Open dashboard
                window.location.href = "dashboard.html";
            } else {
                alert(data.error || "Invalid email or password.");
            }

        } catch (error) {
            console.error("Login error:", error);

            alert(
                "Cannot connect to the backend. Please make sure Flask is running."
            );
        }
    });
}