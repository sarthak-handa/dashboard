# Dashboard Environment & Setup Context
**Target Goal:** Make the deployment of the new `forecastdashboard.html` 100% plug-and-play for both the local testing environment and the live production environment (`ydprojects.ydagchmi.com`), with zero backend modifications needed on the live server.

## 1. Environment Architecture

### Live Production (`ydprojects.ydagchmi.com`)
* **Backend:** Node.js/Express (`excelRoutes.js`) is already running smoothly with a new, working SAP ID and password.
* **Forecast API:** `${API_URL}/excel/forecast/dashboard`
* **Actuals/Revenue API:** `${API_URL}/excel/actuals/sap`
* **Dependency:** The frontend relies on a pre-existing `assets/` folder (CSS, JS, images). Specifically, `assets/js/config.js` defines the `API_URL` variable.

### Local Development / Testing (`localhost`)
* **Constraint:** **DO NOT hit the live SAP endpoint during testing.** Doing so previously resulted in the SAP user ID getting blocked.
* **Backend:** We use a local mock server (`dev-server.js`) that intercepts API calls.
* **Forecast API:** Intercepted to serve from `temp_forecast.json`.
* **Actuals/Revenue API:** Intercepted on `/excel/actuals/dashboard` to serve data from an offline Excel file (`Book1.xlsx`).

---

## 2. Frontend Implementations (in `frontend/forecastdashboard.html`)

We have heavily refactored the frontend HTML to be as robust and standalone as possible:

1. **Smart API Switching (CRITICAL):**
   The `fetch` logic for actuals/revenue data is now environment-aware.
   * If `window.location.hostname` is `localhost` or `127.0.0.1`, it automatically calls `/excel/actuals/dashboard` (the offline Excel mock).
   * Otherwise, it defaults to `/excel/actuals/sap` (the live production backend).
   * **Result:** You can push this HTML to production without changing a single line of code, and it will perfectly connect to the live SAP backend.

2. **Zero Vercel Links:**
   All links or references to `yddashboard.vercel.app` have been strictly purged from the file to prevent cross-origin issues or accidental connections to the old testing platform.

3. **Embedded Mappings:**
   The contents of `mappings.js` (`PROJECT_MAPPING`, `PM_MAPPING`, `LINE_MAPPING`) have been embedded directly into the HTML to remove an external dependency. There are currently 5 completely unmapped projects (1803, 2100, 2123, 2609, 2616) that need to be defined in `PROJECT_MAPPING` if they appear in the data.

4. **Global Scripts Restored:**
   The footer of the HTML correctly includes the original site-wide scripts (`assets/js/config.js`, `socket.io`, `main.js`, `attendance.js`) so that global navigation, authentication, and the `API_URL` variable function exactly as they do on the rest of the live site.

5. **UI / Filter Enhancements:**
   * **Month Parsing Bug Fix:** Fixed a locale bug where JavaScript parsed September as "Sept" instead of "Sep", causing charts to break.
   * **Empty State Fix:** Updated the KPI element IDs in the `renderTable` function (`kpi-revenue`, `kpi-assemblies`, etc.) so that selecting an empty date range (like 2026-27 initially was) zeroes out the UI cleanly instead of crashing JavaScript.
   * **Quick Filters:** Added interactive pill buttons (Bought Out, In House, Dispatched, Not Dispatched) for the Detailed Assemblies table.
   * **Context-Aware UI:** The Quick Filter buttons and the Source/Status color-coding in the assembly rows are **only visible/active in the Forecast tab**. When switching to the Revenue tab, these elements are hidden and row colors fallback to a neutral gray, because the Revenue SAP data does not contain Source/Dispatch fields.

---

## 3. Instructions for the Claude 3.5 Sonnet Agent

**To the Claude Agent continuing this work:**
1. **Triple-Check Dependencies:** Ensure that `frontend/forecastdashboard.html` retains its `<script src="assets/js/config.js">` tag and does NOT hardcode `const API_URL = "";`, as this will conflict with the live site's global configuration.
2. **Preserve Smart Switching:** Do not alter the environment-aware `if` statement for `endpointPath` inside the `switchDataContext`/`getData` fetch block. It is critical for the user's SAP account safety.
3. **Backend is Off-Limits:** Do not instruct the user to modify `excelRoutes.js` or `sapDashboard.js` for this deployment. The live backend is currently perfectly stable.
4. **Final Deployment Step:** The only action required to deploy these changes to the live server (`ydprojects.ydagchmi.com`) is to replace the live `originalforecastDashboard.html` with the refactored `frontend/forecastdashboard.html`.
