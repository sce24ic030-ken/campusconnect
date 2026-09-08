// ========================================
// CAMPUSCONNECT - PLACEMENT PAGE
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    console.log("Placement page loaded successfully");

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

    const opportunities = {

        "Software Development": {
            icon: "💻",
            title: "Software Development",
            package: "5–8 LPA",
            eligibility: "BCA / MCA",
            location: "Bengaluru",
            deadline: "20 September 2026",
            description:
                "Opportunities for students interested in software development, programming and technology."
        },

        "Data & Analytics": {
            icon: "📊",
            title: "Data & Analytics",
            package: "4–7 LPA",
            eligibility: "BCA / BSc",
            location: "Hyderabad",
            deadline: "25 September 2026",
            description:
                "Build your career in data analysis, business intelligence and analytics."
        },

        "Cloud & IT Services": {
            icon: "☁️",
            title: "Cloud & IT Services",
            package: "4–6 LPA",
            eligibility: "BCA / MCA",
            location: "Chennai",
            deadline: "30 September 2026",
            description:
                "Explore opportunities in cloud computing, IT infrastructure and support."
        }

    };

    const data = opportunities[company];

    if (!data) {
        alert("Opportunity details are not available.");
        return;
    }

    let modal = document.getElementById("placementModal");

    // Create modal if it does not exist
    if (!modal) {

        modal = document.createElement("div");

        modal.id = "placementModal";

        modal.innerHTML = `
            <div class="placement-modal-box">

                <button class="placement-close" onclick="closePlacementModal()">
                    ×
                </button>

                <div class="placement-modal-icon" id="placementModalIcon"></div>

                <h2 id="placementModalTitle"></h2>

                <p id="placementModalDescription"></p>

                <div class="placement-modal-details">

                    <div>
                        <strong>💰 Package</strong>
                        <span id="placementModalPackage"></span>
                    </div>

                    <div>
                        <strong>🎓 Eligibility</strong>
                        <span id="placementModalEligibility"></span>
                    </div>

                    <div>
                        <strong>📍 Location</strong>
                        <span id="placementModalLocation"></span>
                    </div>

                    <div>
                        <strong>📅 Application Deadline</strong>
                        <span id="placementModalDeadline"></span>
                    </div>

                </div>

                <button class="placement-apply-now"
                        onclick="applyNow()">
                    Apply Now →
                </button>

            </div>
        `;

        document.body.appendChild(modal);

        // Modal CSS
        const style = document.createElement("style");

        style.textContent = `
            #placementModal {
                position: fixed;
                inset: 0;
                background: rgba(20, 20, 40, 0.65);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 9999;
            }

            .placement-modal-box {
                width: 100%;
                max-width: 520px;
                background: white;
                border-radius: 24px;
                padding: 30px;
                position: relative;
                box-shadow: 0 25px 70px rgba(0,0,0,0.25);
                animation: placementModalOpen 0.25s ease;
            }

            @keyframes placementModalOpen {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.97);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .placement-close {
                position: absolute;
                right: 18px;
                top: 15px;
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 50%;
                background: #f1f3ff;
                color: #667eea;
                font-size: 25px;
                cursor: pointer;
            }

            .placement-modal-icon {
                width: 65px;
                height: 65px;
                border-radius: 18px;
                background: #eef1ff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                margin-bottom: 18px;
            }

            .placement-modal-box h2 {
                color: #20243a;
                font-size: 24px;
                margin-bottom: 10px;
            }

            .placement-modal-box p {
                color: #777;
                font-size: 13px;
                line-height: 1.7;
                margin-bottom: 22px;
            }

            .placement-modal-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 22px;
            }

            .placement-modal-details div {
                background: #f7f8fc;
                border-radius: 12px;
                padding: 13px;
            }

            .placement-modal-details strong {
                display: block;
                font-size: 11px;
                color: #667eea;
                margin-bottom: 5px;
            }

            .placement-modal-details span {
                display: block;
                font-size: 12px;
                color: #444;
                font-weight: 600;
            }

            .placement-apply-now {
                width: 100%;
                border: none;
                padding: 14px;
                border-radius: 12px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                font-family: inherit;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
            }

            .placement-apply-now:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102,126,234,0.3);
            }

            @media (max-width: 600px) {
                .placement-modal-details {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Fill modal information
    document.getElementById("placementModalIcon").textContent =
        data.icon;

    document.getElementById("placementModalTitle").textContent =
        data.title;

    document.getElementById("placementModalDescription").textContent =
        data.description;

    document.getElementById("placementModalPackage").textContent =
        data.package;

    document.getElementById("placementModalEligibility").textContent =
        data.eligibility;

    document.getElementById("placementModalLocation").textContent =
        data.location;

    document.getElementById("placementModalDeadline").textContent =
        data.deadline;

    modal.style.display = "flex";
}


// ========================================
// CLOSE PLACEMENT MODAL
// ========================================

function closePlacementModal() {

    const modal = document.getElementById("placementModal");

    if (modal) {
        modal.style.display = "none";
    }
}


// ========================================
// APPLY NOW
// ========================================

function applyNow() {

    alert(
        "Application feature is ready.\n\n" +
        "Your application will be submitted once the backend is connected."
    );
}


// ========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ========================================

window.addEventListener("click", function (event) {

    const modal = document.getElementById("placementModal");

    if (event.target === modal) {
        closePlacementModal();
    }

});


// ========================================
// ESC KEY CLOSES MODAL
// ========================================

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closePlacementModal();
    }

});


// ========================================
// OLD MESSAGE FUNCTION
// ========================================

function showMessage(message) {
    alert(message);
}