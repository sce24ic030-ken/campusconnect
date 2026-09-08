document.addEventListener("DOMContentLoaded", function () {

    try {

        const nameElements =
            document.querySelectorAll(
                "#studentName, #username, .student-name, .user-name"
            );

        let studentName =
            localStorage.getItem("studentName") ||
            localStorage.getItem("username");

        const studentData =
            localStorage.getItem("student");

        if (studentData) {

            try {

                const student =
                    JSON.parse(studentData);

                if (student && student.name) {
                    studentName = student.name;
                }

            } catch (error) {

                console.log(
                    "Student data could not be read."
                );

            }

        }

        if (!studentName) {
            studentName = "Student";
        }

        nameElements.forEach(function (element) {

            element.textContent = studentName;

        });


        // Update welcome heading if it exists
        const welcomeElements =
            document.querySelectorAll(
                ".welcome-name, #welcomeName"
            );

        welcomeElements.forEach(function (element) {

            element.textContent = studentName;

        });

    } catch (error) {

        console.error(
            "Error reading student information:",
            error
        );

    }

});