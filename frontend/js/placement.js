// ========================================
// CAMPUSCONNECT - PLACEMENT PAGE
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Placement page loaded successfully");

    // Placement statistics
    const placementStats = {
        companies: 24,
        drives: 8,
        studentsPlaced: 156,
        highestPackage: "8.5 LPA"
    };

    console.log("Placement Statistics:", placementStats);

});


// ========================================
// GO BACK TO DASHBOARD
// ========================================

function goBack() {

    window.location.href = "../dashboard.html";

}


// ========================================
// SHOW COMPANY OPPORTUNITY
// ========================================

function showApply(company) {

    const modal = document.getElementById("applyModal");
    const modalText = document.getElementById("modalText");

    if (!modal || !modalText) {
        return;
    }

    modalText.innerHTML =
        "You selected <b>" +
        company +
        "</b>.<br><br>" +
        "Placement application details will be available here.";

    modal.style.display = "flex";

}


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

    const modal = document.getElementById("applyModal");

    if (modal) {
        modal.style.display = "none";
    }

}


// ========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ========================================

window.addEventListener("click", function (event) {

    const modal = document.getElementById("applyModal");

    if (event.target === modal) {
        closeModal();
    }

});


// ========================================
// ESC KEY CLOSES MODAL
// ========================================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeModal();
    }

});
// ========================================
// SHOW PLACEMENT MESSAGE
// ========================================

function showMessage(message) {
    alert(message);
}