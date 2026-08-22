let projectChoices;

// Read the session token from storage rather than relying on each page to
// declare a global `token`. Two pages (the forecast dashboards) never did, so
// every fetch below threw a ReferenceError that was swallowed by the
// surrounding try/catch — the Attendance modal opened but the project picker
// silently never appeared.
const authToken = () => localStorage.getItem("token");

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const clockElement = document.getElementById("liveClock");
    if (clockElement) clockElement.textContent = timeString;
}
setInterval(updateClock, 1000);

async function checkCurrentStatus() {
    const btn = document.getElementById("attendanceBtn");
    const projectSelect = document.getElementById("projectSelect");
    const punchInDisplay = document.getElementById("punchInTimeDisplay");

    try {
        const res = await fetch(`${API_URL}/attendance/status`, {
            headers: { Authorization: `Bearer ${authToken()}` },
        });
        const result = await res.json();

        if (res.ok && result.active) {
            isPunchedIn = true;
            btn.innerText = "Punch Out";
            btn.className = "btn btn-danger btn-lg";

            // Prefill and lock the project
            projectSelect.value = result.data.project;
            projectSelect.disabled = true;
            btn.disabled = false;

            // FIX: Restore the Punch In time display from the database result
            const time = new Date(result.data.punchIn).toLocaleTimeString();
            punchInDisplay.innerHTML = `<strong>Punch In:</strong> ${time}`;

            if (projectChoices) {
                // This maps the ID from the database to the name in the dropdown
                projectChoices.setChoiceByValue(result.data.project);
                projectChoices.disable();
            }
        } else {
            projectChoices.enable();
            checkLockout();
        }
    } catch (err) {
        console.error("Status check failed", err);
        checkLockout();
    }
}

function startLockdown(lockUntil) {
    const btn = document.getElementById("attendanceBtn");

    // Disable both
    if (projectChoices) projectChoices.disable();
    btn.disabled = true;

    const timer = setInterval(() => {
        const now = Date.now();
        const timeLeft = lockUntil - now;

        if (timeLeft <= 0) {
            clearInterval(timer);
            btn.disabled = false;

            // --- RE-ENABLE SEARCHABLE SELECTOR ---
            if (projectChoices) {
                projectChoices.enable();
                projectChoices.setChoiceByValue(""); // Reset to placeholder
            }

            btn.innerText = "Punch In";
            btn.className = "btn btn-success btn-lg";
            localStorage.removeItem("attendanceLock");

            document.getElementById("punchInTimeDisplay").innerText =
                "Punch In: --:--";
            document.getElementById("punchOutTimeDisplay").innerText =
                "Punch Out: --:--";
        } else {
            const seconds = Math.ceil(timeLeft / 1000);
            btn.innerText = `Locked (${seconds}s)`;
        }
    }, 1000);
}

// Check for existing lock on page load/modal open
function checkLockout() {
    const lockUntil = localStorage.getItem("attendanceLock");
    if (lockUntil && Date.now() < lockUntil) {
        startLockdown(parseInt(lockUntil));
    }
}

// 2. Load Projects into Dropdown (Call this when modal opens)
// const attendanceModal = document.getElementById("attendanceModal");
// if (attendanceModal) {
//   attendanceModal.addEventListener("show.bs.modal", checkCurrentStatus);
//   attendanceModal.addEventListener("show.bs.modal", checkLockout);
//   attendanceModal.addEventListener("show.bs.modal", async () => {
//     const projectSelect = document.getElementById("projectSelect");

//     // Destroy previous instance if it exists to avoid duplication
//     if (projectChoices) projectChoices.destroy();

//     try {
//       const res = await fetch(`${API_URL}/projects/list`, {
//         headers: { Authorization: `Bearer ${authToken()}` },
//       });
//       const data = await res.json();

//       // Map projects for Choices.js
//       const projectOptions = data.projects.map((p) => ({
//         value: p._id,
//         label: p.projectNo,
//         selected: false,
//         disabled: false,
//       }));

//       // Initialize Choices.js with search enabled
//       projectChoices = new Choices(projectSelect, {
//         searchEnabled: true,
//         itemSelectText: "",
//         choices: [
//           // {
//           //   value: "",
//           //   label: "-- Choose Project --",
//           //   selected: true,
//           //   disabled: false,
//           // },
//           ...projectOptions,
//         ],
//       });

//       await checkCurrentStatus();
//     } catch (err) {
//       console.error("Searchable dropdown failed", err);
//     }
//   });
// }
let projectsLoaded = false;

const attendanceModal = document.getElementById("attendanceModal");

if (attendanceModal) {
    // Check Status and Lockout every time modal opens
    attendanceModal.addEventListener("show.bs.modal", () => {
        checkCurrentStatus();
        checkLockout();
    });

    // Only fetch and initialize Choices.js if not already done
    attendanceModal.addEventListener("show.bs.modal", async () => {
        // If we already loaded the projects, don't fetch again.
        // Just update the status (handled above).
        if (projectsLoaded && projectChoices) {
            return;
        }

        const projectSelect = document.getElementById("projectSelect");

        // Clean up if it exists partially
        if (projectChoices) {
            projectChoices.destroy();
            projectChoices = null;
        }

        try {
            const res = await fetch(`${API_URL}/projects/list`, {
                headers: { Authorization: `Bearer ${authToken()}` },
            });
            const data = await res.json();
            projectSelect.innerHTML =
                '<option value="">-- Choose Project --</option>';
            const projectOptions = data.projects.map((p) => ({
                value: p._id,
                label: `${p.projectNo}`,
                selected: false,
                disabled: false,
            }));
            projectChoices = new Choices(projectSelect, {
                searchEnabled: true,
                itemSelectText: "",
                shouldSort: false,
                choices: projectOptions,
            });
            projectsLoaded = true;
            await checkCurrentStatus();
        } catch (err) {
            console.error("Searchable dropdown failed", err);
        }
    });
}

let isPunchedIn = false; // You should ideally fetch this state from the server on page load

// Ask the browser for the user's current location. Resolves with either a
// { latitude, longitude, accuracy, placeName } object on success, or an
// { error, message } object describing why it failed. placeName is
// best-effort via OpenStreetMap Nominatim reverse geocoding.
//
// Why this matters on phones: iOS Safari AND Chrome (and Android Chrome)
// block the Geolocation API on NON-secure origins. `http://localhost` on a
// PC counts as secure — which is why it works there — but a phone opening
// the site over a LAN IP / plain http:// is NOT a secure context, so the
// browser refuses to even prompt. That's the usual reason it works on the
// PC but silently fails on the iPhone.
function getCurrentLocation() {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            return resolve({
                error: "unsupported",
                message: "This browser does not support location.",
            });
        }

        if (!window.isSecureContext) {
            return resolve({
                error: "insecure",
                message:
                    "Location is blocked because this page is not opened over HTTPS. " +
                    "Open the site using its https:// web address (not an http:// IP) and try again.",
            });
        }

        // Reverse geocoding is best-effort and MUST NOT block the punch. Without
        // a timeout a hung request (common on mobile networks / iOS content
        // blockers) would leave getCurrentLocation() pending forever and the
        // coordinates would never be sent. We abort after 4s and keep the coords.
        const reverseGeocode = async (loc) => {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 4000);
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}&zoom=18&addressdetails=1`;
                const r = await fetch(url, {
                    headers: { Accept: "application/json" },
                    signal: ctrl.signal,
                });
                clearTimeout(timer);
                if (r.ok) {
                    const j = await r.json();
                    if (j && j.display_name) loc.placeName = j.display_name;
                }
            } catch (e) {
                console.warn("Reverse geocoding skipped (timeout/failed):", e.message);
            }
            return loc;
        };

        const onSuccess = async (pos) => {
            resolve(
                await reverseGeocode({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    placeName: "",
                }),
            );
        };

        const reason = (code) =>
            code === 1
                ? "Location permission was denied. Allow location for this site in your browser settings."
                : code === 2
                    ? "Your location is currently unavailable. Make sure Location Services are on for the browser."
                    : code === 3
                        ? "Getting your location timed out. Move to an open area and try again."
                        : "Could not get your location.";

        // Attempt 1: high accuracy (GPS). Phones often time out indoors, so on
        // any failure we retry with low accuracy + a longer timeout, which uses
        // wifi/cell positioning and is much more likely to succeed.
        navigator.geolocation.getCurrentPosition(
            onSuccess,
            (err1) => {
                console.warn("High-accuracy geolocation failed:", err1.code, err1.message);
                navigator.geolocation.getCurrentPosition(
                    onSuccess,
                    (err2) => {
                        console.warn("Low-accuracy geolocation failed:", err2.code, err2.message);
                        resolve({ error: "failed", code: err2.code, message: reason(err2.code) });
                    },
                    { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 },
                );
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    });
}

// Help box shown only when location capture fails — most failures on phones
// are the iOS system-level Location Services toggle, not the per-site setting.
function iosLocationHint() {
    return `
    <div class="border rounded p-2 mt-2 text-start small"
         style="background:#fff8e1; border-color:#ffe08a !important;">
      <strong>On a phone?</strong> Turn on location for your browser:
      <ol class="mb-0 ps-3 mt-1">
        <li>Settings → Privacy &amp; Security → <b>Location Services</b> → ON</li>
        <li>Scroll to <b>Safari Websites</b> (or <b>Chrome</b>) → <b>While Using the App</b></li>
        <li>Reload this page and tap <b>Allow</b> when prompted</li>
      </ol>
    </div>`;
}

// Show a small live location line inside the attendance modal so users can
// see what was captured (or why it failed) without opening dev tools.
function setLocStatus(html) {
    let el = document.getElementById("locationStatus");
    if (!el) {
        const status = document.getElementById("attendanceStatus");
        if (!status) return;
        el = document.createElement("p");
        el.id = "locationStatus";
        el.className = "small mt-2 mb-0";
        status.appendChild(el);
    }
    el.innerHTML = html;
}

async function handleAttendance() {
    const projectSelect = document.getElementById("projectSelect");
    const projectId = projectSelect.value;
    const btn = document.getElementById("attendanceBtn");

    if (!isPunchedIn && !projectId) {
        Swal.fire("Wait!", "Please select a project first.", "warning");
        return;
    }

    // Capture location before posting; non-blocking if it fails.
    setLocStatus('<span class="text-muted">📍 Getting your location…</span>');
    const locResult = await getCurrentLocation();
    const location =
        locResult && locResult.latitude != null ? locResult : null;
    if (location) {
        setLocStatus(
            `<span class="text-success">📍 Location captured (±${Math.round(
                location.accuracy || 0,
            )}m)</span>`,
        );
    } else {
        setLocStatus(
            `<span class="text-danger">📍 ${(locResult && locResult.message) || "Location unavailable"}</span>` +
            iosLocationHint(),
        );
    }
    if (!location) {
        const proceed = await Swal.fire({
            icon: "warning",
            title: "Location not available",
            html:
                `${(locResult && locResult.message) || "Your current location could not be captured."}` +
                `<br><br>Punch will still be recorded without it. Continue?`,
            showCancelButton: true,
            confirmButtonText: "Yes, continue",
            cancelButtonText: "Cancel",
        });
        if (!proceed.isConfirmed) return;
    }

    try {
        const response = await fetch(`${API_URL}/attendance/toggle-punch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken()}`,
            },
            body: JSON.stringify({ projectId, location }),
        });

        const result = await response.json();

        if (response.ok) {
            if (result.action === "in") {
                isPunchedIn = true;
                btn.innerText = "Punch Out";
                btn.className = "btn btn-danger btn-lg";

                if (projectChoices) projectChoices.disable();
                document.getElementById("punchInTimeDisplay").innerHTML =
                    `<strong>Punch In:</strong> ${new Date(
                        result.data.punchIn,
                    ).toLocaleTimeString()}`;
            } else {
                isPunchedIn = false;

                // --- ENABLE SEARCHABLE SELECTOR ---
                // Note: We keep it disabled during the 10s lockdown via startLockdown
                const lockUntil = Date.now() + 10 * 1000;
                localStorage.setItem("attendanceLock", lockUntil);
                startLockdown(lockUntil);

                document.getElementById("punchOutTimeDisplay").innerHTML =
                    `<strong>Punch Out:</strong> ${new Date(
                        result.data.punchOut,
                    ).toLocaleTimeString()}`;

                Swal.fire(
                    "Success",
                    "Punched out! System locked for 10 seconds.",
                    "success",
                );
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}