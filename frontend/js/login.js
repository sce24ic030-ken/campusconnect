/* =========================================
   CAMPUSCONNECT LOGIN
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginMessage = document.getElementById("loginMessage");

    const forgotPassword = document.getElementById("forgotPassword");
    const forgotModal = document.getElementById("forgotModal");
    const closeForgotModal = document.getElementById("closeForgotModal");
    const forgotForm = document.getElementById("forgotForm");
    const forgotMessage = document.getElementById("forgotMessage");

    const demoLogin = document.getElementById("demoLogin");


    /* =========================================
       SHOW / HIDE PASSWORD
    ========================================== */

    if (togglePassword) {

        togglePassword.addEventListener("click", function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";
                togglePassword.textContent = "🙈";

            } else {

                passwordInput.type = "password";
                togglePassword.textContent = "👁️";

            }

        });

    }


    /* =========================================
       LOGIN
    ========================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();


            if (email === "" || password === "") {

                showMessage(
                    loginMessage,
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            /*
             * TEMPORARY FRONTEND LOGIN
             *
             * Later we will connect this to your
             * friend's backend.
             */

            showMessage(
                loginMessage,
                "Login successful! Opening CampusConnect...",
                "success"
            );


            localStorage.setItem(
                "campusconnect_user",
                JSON.stringify({
                    email: email,
                    loggedIn: true
                })
            );


            setTimeout(function () {

                window.location.href = "pages/dashboard.html";

            }, 900);

        });

    }


    /* =========================================
       DEMO LOGIN
    ========================================== */

    if (demoLogin) {

        demoLogin.addEventListener("click", function () {

            emailInput.value = "student@campusconnect.com";
            passwordInput.value = "123456";


            showMessage(
                loginMessage,
                "Demo account loaded. Signing you in...",
                "success"
            );


            localStorage.setItem(
                "campusconnect_user",
                JSON.stringify({
                    email: "student@campusconnect.com",
                    loggedIn: true
                })
            );


            setTimeout(function () {

                window.location.href = "pages/dashboard.html";

            }, 800);

        });

    }


    /* =========================================
       FORGOT PASSWORD MODAL
    ========================================== */

    if (forgotPassword) {

        forgotPassword.addEventListener("click", function (event) {

            event.preventDefault();

            forgotModal.classList.add("active");

        });

    }


    if (closeForgotModal) {

        closeForgotModal.addEventListener("click", function () {

            forgotModal.classList.remove("active");

        });

    }


    /* Close modal when clicking outside */

    if (forgotModal) {

        forgotModal.addEventListener("click", function (event) {

            if (event.target === forgotModal) {

                forgotModal.classList.remove("active");

            }

        });

    }


    /* =========================================
       FORGOT PASSWORD FORM
    ========================================== */

    if (forgotForm) {

        forgotForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const email =
                document.getElementById("forgotEmail").value.trim();


            if (email === "") {

                showMessage(
                    forgotMessage,
                    "Please enter your email address.",
                    "error"
                );

                return;
            }


            showMessage(
                forgotMessage,
                "Reset instructions have been sent to your email.",
                "success"
            );

        });

    }


    /* =========================================
       MESSAGE FUNCTION
    ========================================== */

    function showMessage(element, message, type) {

        if (!element) return;

        element.textContent = message;

        element.className =
            "form-message " + type;

    }

});