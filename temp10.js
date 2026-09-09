
        // --- Standalone Configuration & Shared Logic ---
        const API_URL = "";

        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = "login.html";
        }

        function handleUnauthorized(message) {
            console.warn("Unauthorized: " + message);
            logout();
        }

        document.addEventListener("DOMContentLoaded", () => {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user && user.name) {
                        const nameEl = document.getElementById("engineerNameDisplay");
                        if (nameEl) nameEl.textContent = user.name;
                    }
                } catch (e) { }
            }
        });
    