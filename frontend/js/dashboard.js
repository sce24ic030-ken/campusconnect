// ==========================================
// CampusConnect - Dashboard Connection
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Get logged-in student information
    const studentData = localStorage.getItem("student");

    if (!studentData) {
        console.log("No logged-in student found.");
        return;
    }

    try {
        const student = JSON.parse(studentData);

        console.log("Logged-in student:", student);

        // Student name
        const studentName = student.name || "Student";

        // Make the name available to the dashboard
        localStorage.setItem("student_name", studentName);

        // Find common dashboard name elements
        const nameElements = document.querySelectorAll(
            "#studentName, #userName, .student-name, .user-name"
        );

        nameElements.forEach(function (element) {
            element.textContent = studentName;
        });

        // Update welcome heading if it exists
        const welcomeElements = document.querySelectorAll(
            ".welcome-name, #welcomeName"
        );

        welcomeElements.forEach(function (element) {
            element.textContent = studentName;
        });

    } catch (error) {
        console.error("Error reading student information:", error);
    }
});