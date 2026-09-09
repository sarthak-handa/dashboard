
        let database = [];
        let rawData = [];
        const loader = document.getElementById("loader");

        let state = {
            context: "forecast",
            viewMode: "monthly",
            searchQuery: "", // Added search state
            filters: { month: [], status: [] },
            selection: { pm: null, product: null, month: null },
            expandedRows: [],
            sort: { key: "billing", direction: "desc" },
            assemblySort: "default",
            dynamicPMMapping: {},
        };

        const charts = {};
        // --- SAP PROJECT-CODE LOOKUP TABLES ---
        // SAP returns only a numeric project code (item.Project). These maps
        // resolve it to the full project name, project manager, and line.
        const PROJECT_MAPPING = {
            2009: "2009-APL-6HI CRM",
            2011: "2011-APL-CGL",
            2012: "2012-APL-SPARES",
            2108: "2108-UTTAM-REVAMP",
            2119: "2119-PROMPT-SPM",
            2207: "2207-JTL-6HI CRM",
            2213: "2213-LODHIA-ARP",
            2215: "2215-GAURANG-4HI CRM",
            2217: "2217-JSW-CCL",
            2221: "2221-TPI REVAMP",
            2231: "2231-SHYAM-6HI CRM",
            2239: "2239-SHYAM-TRIMMING",
            2301: "2301-CIM-6HI CRM",
            2302: "2302-CIM-PICKLING",
            2304: "2304-CIM-ARP",
            2305: "2305-APL-CGL",
            2306: "2306-ALAF-REVAMP",
            2310: "2310-SURYA-4HI CRM",
            2401: "2401-AART-TRIMMER",
            2402: "2402-SURYA-TRIMMING",
            2403: "2403-GOPANI-4HI CRM",
            2404: "2404-GOPANI-4HI SPM",
            2405: "2405-JSPL-TRIMMING",
            2406: "2406-JSPL-TRIMMING",
            2407: "2407-APL-PICKLING",
            2409: "2409-PROMPT-6HI CRM",
            2412: "2412-HI TECH-SPARE",
            2414: "2414-UTTAM-6HI CRM",
            2415: "2415-UTTAM-TRIMMING",
            2417: "2417-HULAS-SPARE",
            2420: "2420-INDIA STEEL-CCL",
            2421: "2421-APL-CGL",
            2422: "2422-AECPL-CGL",
            2423: "2423-PROMPT-SPARE",
            2424: "2424-MMI-6HI CRM",
            2425: "2425-MMI-6HI CRM",
            2426: "2426-VIKAS-PICKLING",
            2427: "2427-PROMPT-6HI CRM",
            2428: "2428-BMWIL-CGL",
            2501: "2501-AL SHAKER-6HI CRM",
            2502: "2502-AL SHAKER-PICKLING",
            2503: "2503-AFRICAN STEEL-SPARE",
            2504: "2504-BMWIL-SPARES",
            2506: "2506-JSW-APL",
            2507: "2507-JSW-BAWAL-SPARE",
            2508: "2508-MMI-SPARE",
            2510: "2510-GAURANG-PICKLING",
            2511: "2511-GAURANG-6HI",
            2512: "2512-GAURANG-TRIMMING",
            2513: "2513-GAURANG-SLITTING",
            2514: "2514-GAURANG-CGL",
            2516: "2516-APL-5 TANK PICKLING",
            2517: "2517-APL-6 STAND",
            2518: "2518-APL-SPM",
            2519: "2519-APL-CGL",
            2520: "2520-APL-CCL",
            2521: "2521-BMWIL-6HI CRM",
            2522: "2522-APL-SPM",
            2523: "2523-JSW BAWAL",
            2527: "2527-AECPL-GI/GL LINE",
            2529: "2529-KHUSHBOO-CCL",
            2530: "2530-AL SHAKER-CGL",
            2533: "2533-BMWIL-4 TANK PICKLING",
            2534: "2534-BMWIL-TRIMMING",
            2535: "2535-JSW-JFE-POR SPARE",
            2536: "2536-JSW-PICKLING REVAMP",
            2537: "2537-APL-6 STAND",
            2538: "2538-APL-5 TANK PICKLING",
            2539: "2539-APOLLO-GI/GL LINE",
            2540: "2540-AS PRECISION-ELECTRICAL",
            2541: "2541-STELCO-ELECTRICAL",
            2542: "2542-STELCO-ELECTRICAL",
            2543: "2543-APOLLO-SPARE",
            2544: "2544-APL-REWINDING",
            2545: "2545-BMWIL-REVAMP",
            2546: "2546-APOLLO-SPARE",
            2547: "2547-APOLLO-SPARE",
            2548: "2548-APL-CRM",
            2601: "2601-BMWIL-6HI CRM",
            2602: "2602-BMWIL-SLITTING",
            2603: "2603-BMWIL-TRIMMING",
            2604: "2604-AL PROMPT-CGL",
            2605: "2605-PROMPT-CCL",
            2606: "2606-SHYAM-SPARE",
            2607: "2607-JSW-SPARE",
            2608: "2608-BMWIL-CRM (SPARE)",
            2610: "2610-BMWIL-CGL (SPARE)",
            2611: "2611-APL-CGL",
            2612: "2612-BMWIL-SLITTING (SPARE)",
            2613: "2613-BMWIL-PICKLING (SPARE)",
            2614: "2614-BMWIL-TRIMMING (SPARE)",
            2615: "2615-BMWIL-CRM (SPARE)",
            2617: "2617-APL-CGL",
            2618: "2618-APL-CGL",
            2622: "2622-ELEC-JSW",
            2624: "2624-VIKAS-6HI CRM",
            2626: "2626-JSW-CPL",
            2629: "2629-JSW-CPL",
            2630: "2630-JSW-6HI CRM",
            2631: "2631-JSW-SPM",
            2634: "2634-DYNA-TRIMMING",
            "2428FUR": "2428FUR-BMWIL-CGL",
        };

        const PM_MAPPING = {
            2009: "ADITYA SAINI",
            2011: "ADITYA SAINI",
            2012: "ADITYA SAINI",
            2108: "ADITYA SHARMA",
            2119: "ADITYA SAINI",
            2207: "ADITYA SHARMA",
            2213: "SACHIN",
            2215: "MAYANK",
            2217: "SAURABH",
            2221: "MAYANK",
            2231: "SAURABH",
            2239: "ADITYA SAINI",
            2301: "MAYANK",
            2302: "SACHIN",
            2304: "SACHIN",
            2305: "SAURABH",
            2306: "MAYANK",
            2310: "MAYANK",
            2401: "ADITYA SAINI",
            2402: "ADITYA SAINI",
            2403: "MAYANK",
            2404: "ADITYA SHARMA",
            2405: "SAURABH",
            2406: "SAURABH",
            2407: "SACHIN",
            2412: "MAYANK",
            2414: "ADITYA SHARMA",
            2415: "ADITYA SAINI",
            2417: "ADITYA SAINI",
            2420: "SAURABH",
            2421: "SAURABH",
            2423: "ADITYA SAINI",
            2424: "MAYANK",
            2425: "MAYANK",
            2426: "SACHIN",
            2427: "MAYANK",
            2428: "ADITYA SHARMA",
            2501: "MAYANK",
            2502: "ADITYA SAINI",
            2503: "ADITYA SAINI",
            2504: "ADITYA SHARMA",
            2506: "ADITYA SHARMA",
            2507: "ADITYA SAINI",
            2508: "SACHIN",
            2510: "KUSH",
            2511: "MAYANK",
            2512: "KUNAL",
            2513: "OM DEV",
            2514: "SAURABH",
            2516: "ADITYA SAINI",
            2517: "MAYANK",
            2518: "MAYANK",
            2519: "ADITYA SHARMA",
            2520: "SAURABH",
            2521: "MAYANK",
            2522: "ADITYA SAINI",
            2523: "SACHIN",
            2527: "SAURABH",
            2529: "TRIPURARI",
            2530: "SAURABH",
            2533: "ADITYA SAINI",
            2534: "KUNAL",
            2535: "MAYANK",
            2410: "YOGESH",
            2411: "MAYANK",
            2413: "ADITYA SAINI",
            2416: "ADITYA SAINI",
            2418: "ADITYA SAINI",
            2419: "ADITYA SAINI",
            2515: "OM DEV",
            2616: "SATYENDRA",
            2617: "SAURABH",
            2618: "TRIPURARI",
            2619: "ADITYA SHARMA",
            2626: "SUJAL",
            2536: "SHASHIKANT",
            2537: "MAYANK",
            2538: "ADITYA SAINI",
            2539: "TRIPURARI",
            2543: "SHASHIKANT",
            2544: "KUNAL",
            2545: "SHASHIKANT",
            2546: "SHASHIKANT",
            2547: "SHASHIKANT",
            2548: "MAYANK",
            2601: "MAYANK",
            2602: "OM DEV",
            2603: "KUNAL",
            2604: "ADITYA SHARMA",
            2605: "ADITYA SHARMA",
            2606: "ADITYA SAINI",
            2607: "TRIPURARI",
            2608: "MAYANK",
            2611: "SAURABH",
            2612: "OM DEV",
            2613: "ADITYA SAINI",
            2614: "KUNAL",
            2615: "MAYANK",
        };

        const LINE_MAPPING = {
            2009: "CRM",
            2011: "CGL",
            2012: "SPARE",
            2108: "REVAMP",
            2119: "SPM",
            2207: "CRM",
            2213: "ARP",
            2215: "CRM",
            2217: "CCL",
            2221: "REVAMP",
            2231: "CRM",
            2239: "TRIMMING",
            2301: "CRM",
            2302: "PICKLING",
            2304: "ARP",
            2305: "CGL",
            2306: "REVAMP",
            2310: "CRM",
            2401: "TRIMMING",
            2402: "TRIMMING",
            2403: "CRM",
            2404: "SPM",
            2405: "TRIMMING",
            2406: "TRIMMING",
            2407: "PICKLING",
            2409: "CRM",
            2412: "SPARE",
            2414: "CRM",
            2415: "TRIMMING",
            2417: "SPARE",
            2420: "CCL",
            2421: "CGL",
            2422: "CGL",
            2423: "SPARE",
            2424: "CRM",
            2425: "CRM",
            2426: "PICKLING",
            2427: "CRM",
            2428: "CGL",
            2501: "CRM",
            2502: "PICKLING",
            2503: "SPARE",
            2504: "SPARE",
            2506: "APL",
            2507: "SPARE",
            2508: "SPARE",
            2510: "PICKLING",
            2511: "CRM",
            2512: "TRIMMING",
            2513: "SLITTING",
            2514: "CGL",
            2516: "PICKLING",
            2517: "CRM",
            2518: "SPM",
            2519: "CGL",
            2520: "CCL",
            2521: "CRM",
            2522: "SPM",
            2523: "SPARE",
            2527: "CGL",
            2529: "CCL",
            2530: "CGL",
            2533: "PICKLING",
            2534: "TRIMMING",
            2535: "SPARE",
            2536: "REVAMP",
            2537: "CRM",
            2538: "PICKLING",
            2539: "CGL",
            2540: "ELECTRICAL",
            2541: "ELECTRICAL",
            2542: "ELECTRICAL",
            2622: "ELECTRICAL",
            2543: "SPARE",
            2544: "REWINDING",
            2545: "REVAMP",
            2546: "SPARE",
            2547: "SPARE",
            2548: "CRM",
            2601: "CRM",
            2602: "SLITTING",
            2603: "TRIMMING",
            2604: "CGL",
            2605: "CCL",
            2606: "SPARE",
            2607: "SPARE",
            2608: "SPARE",
            2610: "SPARE",
            2611: "CGL",
            2612: "SPARE",
            2613: "SPARE",
            2614: "SPARE",
            2615: "SPARE",
            2624: "CRM",
            2623: "SPM",
            2625: "REWINDING",
        };
        function getProjectName(p) {
            if (!p) return "Miscellaneous";
            p = String(p).trim();
            if (p.startsWith("26E") || p.startsWith("25E") || p.startsWith("26M")) {
                return "Miscellaneous";
            }
            const code = p.length >= 4 && /^\d{4}/.test(p) ? p.substring(0, 4) : p;
            if (state.context === "forecast") {
                return PROJECT_MAPPING[code] || PROJECT_MAPPING[p] || p;
            }
            if (state.dynamicProjectNameMapping && state.dynamicProjectNameMapping[p]) {
                return state.dynamicProjectNameMapping[p];
            }
            return PROJECT_MAPPING[code] || PROJECT_MAPPING[p] || p || "Miscellaneous";
        }
        function getPMName(p, wbs) {
            if (!p) return "";
            p = String(p).trim();
            if (p.startsWith("26E") || p.startsWith("25E") || p.startsWith("26M")) {
                return "";
            }
            const code = p.length >= 4 && /^\d{4}/.test(p) ? p.substring(0, 4) : p;
            if (wbs && state.dynamicPMMapping && state.dynamicPMMapping[`${code}_WBS_${wbs}`]) {
                return state.dynamicPMMapping[`${code}_WBS_${wbs}`];
            }
            if (wbs && state.dynamicPMMapping && state.dynamicPMMapping[`${p}_WBS_${wbs}`]) {
                return state.dynamicPMMapping[`${p}_WBS_${wbs}`];
            }
            if (state.dynamicPMMapping && state.dynamicPMMapping[code]) {
                return state.dynamicPMMapping[code];
            }
            if (state.dynamicPMMapping && state.dynamicPMMapping[p]) {
                return state.dynamicPMMapping[p];
            }
            return PM_MAPPING[code] || PM_MAPPING[p] || "";
        }
        function getLineName(p) {
            if (!p) return "";
            p = String(p).trim();
            if (p.startsWith("26E") || p.startsWith("25E") || p.startsWith("26M")) {
                return "";
            }
            const code = p.length >= 4 && /^\d{4}/.test(p) ? p.substring(0, 4) : p;
            return LINE_MAPPING[code] || LINE_MAPPING[p] || "";
        }

        function changeAssemblySort(mode) {
            state.assemblySort = mode;
            updateDashboard();
        }

        function handleSearch(val) {
            state.searchQuery = val.trim();
            updateDashboard();
        }

        // --- 1. DATA LOADING & PARSING ---
        async function loadDashboardData() {
            loader.classList.remove("hidden-loader");

            const monthSet = new Set();
            const MONTH_ORDER = [
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
                "Jan",
                "Feb",
                "Mar",
            ];

            try {
                rawData = [];
                let fiscalYear = new Date().getFullYear();
                let lastUpdated = new Date().toISOString();
                // -------------------------------------------------------------
                // FORECAST: Fetch from existing internal API
                // -------------------------------------------------------------
                if (state.context === "forecast") {
                    const res = await fetch(`${API_URL}/excel/forecast/dashboard?_t=${Date.now()}`, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });

                    if (res.status === 401) {
                        handleUnauthorized?.("Unauthorized");
                        return;
                    }
                    if (!res.ok) throw new Error("Forecast fetch failed");

                    const dbExcel = await res.json();

                    const now = new Date();
                    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    let fyEndYear = now.getMonth() <= 2 ? now.getFullYear() : now.getFullYear() + 1;
                    const fiscalEndDate = new Date(fyEndYear, 2, 31, 23, 59, 59);

                    rawData = (dbExcel.data || []).filter(item => {
                        if (!item.dispatchMonth) return false;
                        const d = new Date(item.dispatchMonth);
                        return !isNaN(d) && d >= startOfCurrentMonth && d <= fiscalEndDate;
                    });
                    fiscalYear = dbExcel.fiscalYear || fiscalYear;
                    lastUpdated = dbExcel.lastUpdated || lastUpdated;
                    document.getElementById("excelUpdateTimeDiv").style.display =
                        "block";
                    document.getElementById("excelUpdateTimeDiv2").style.display =
                        "none";
                }
                // -------------------------------------------------------------
                // ACTUALS: Fetch from Excel backend API
                // -------------------------------------------------------------
                else if (state.context.startsWith("actuals")) {
                    let apiUrl = `${API_URL}/excel/actuals/dashboard?_t=${Date.now()}`;

                    const res = await fetch(apiUrl, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    });
                    if (!res.ok) throw new Error("Excel actuals fetch failed");
                    const excelResponse = await res.json();
                    
                    const is2526 = state.context === "actuals-2526";
                    const startYear = is2526 ? 2025 : 2026;
                    const startFiscal = new Date(startYear, 3, 1); // April 1st
                    const endFiscal = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31st

                    rawData = (excelResponse.data || []).filter(item => {
                        if (!item.dispatchMonth) return false;
                        const d = new Date(item.dispatchMonth);
                        return !isNaN(d) && d >= startFiscal && d <= endFiscal;
                    });
                    
                    fiscalYear = excelResponse.fiscalYear || fiscalYear;
                    lastUpdated = excelResponse.lastUpdated || lastUpdated;

                    document.getElementById("excelUpdateTimeDiv2").style.display = "block";
                    document.getElementById("excelUpdateTimeDiv").style.display = "none";
                }
                // --- SHARED UI UPDATES ---
                document.getElementById("fy").innerText =
                    "FY " + String(fiscalYear).replace("FY", "").trim();
                const updatedDate = dateNtime(lastUpdated);
                document.getElementById("excelUpdateTime").innerText =
                    "(last updated at " + updatedDate + ")";
                document.getElementById("excelUpdateTime2").innerText =
                    "(last updated at " + updatedDate + ")";

                const formatDate = (iso) => {
                    if (!iso) return "";
                    const d = new Date(iso);
                    if (isNaN(d)) return "";
                    const pad = (n) => String(n).padStart(2, "0");
                    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
                };
                // Sanitize project codes for SAP data before populating database
                if (state.context.startsWith("actuals")) {
                    rawData.forEach(item => {
                        const wbsCode = String(item.WBSElementExternalID || item.wbs || item.WBS || "").trim();
                        let proj = String(item.project || "").trim();

                        if (wbsCode.length >= 4 && /^\d{4}$/.test(wbsCode.substring(0, 4))) {
                            item.project = wbsCode.substring(0, 4);
                        } else if (/^\d{4}/.test(proj)) {
                            item.project = proj.substring(0, 4);
                        }
                    });
                }

                // Populate global database
                database = rawData.map((item, index) => {
                    if (item.month) monthSet.add(item.month);
                    const rawVal = String(item.billing || 0).replace(/[^0-9.-]/g, "");
                    const val = parseFloat(rawVal) || 0;

                    let status = "Not Dispatched";
                    if (item.status) {
                        const s = item.status.toLowerCase();
                        if (s.includes("not disp")) status = "Not Dispatched";
                        else if (s.includes("disp")) status = "Dispatched";
                        else if (s.includes("hold")) status = "Hold";
                    }

                    const rawLine = (
                        item.line ||
                        item.manufacturing ||
                        item.boi_manufacturing ||
                        item["BOI /MANUFACTURING"] ||
                        ""
                    )
                        .toString()
                        .replace(/\s+/g, "")
                        .toUpperCase();

                    let source = "";
                    const colB = (item.columnB || item.source || "").trim().toUpperCase();

                    if (colB === "BOUGHT OUT" || ["BOI", "BOI-LL", "STRUCTURE"].includes(colB)) {
                        source = "Bought Out";
                    } else if (colB === "IN HOUSE" || ["UNIT-1", "UNIT-2", "UNIT-3", "ELECTRICAL", "2ND PO", "INHOUSE"].includes(colB)) {
                        source = "In House";
                    }

                    const wbsCode = item.WBSElementExternalID || item.wbs || item.WBS || "";

                    return {
                        id: index + 1,
                        name: getProjectName(item.project),
                        pm: getPMName(item.project, wbsCode) || item.pm,
                        wbs: wbsCode,
                        product: getLineName(item.project) || item.category,
                        month: item.month ? item.month.trim() : "",
                        status: status,
                        source: source,
                        val: val,
                        date: formatDate(item.dispatchMonth),
                        context: state.context,
                        assembly: item.assembly,
                        line: item.line,
                        year:
                            formatDate(item.dispatchMonth).split("-")[2] ||
                            new Date().getFullYear(),
                    };
                });

                const distinctMonths = [...monthSet].sort(
                    (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b),
                );

                let rangeText = "";
                if (distinctMonths.length > 0) {
                    const first = distinctMonths[0];
                    const last = distinctMonths[distinctMonths.length - 1];
                    rangeText =
                        distinctMonths.length === 1 ? `(${first})` : `(${first}-${last})`;
                }
                const monthRangeSpan = document.getElementById("monthRange");
                if (monthRangeSpan) {
                    monthRangeSpan.innerText = rangeText;
                }

                state.distinctMonths = distinctMonths;
                populateMonthFilter(distinctMonths);
                updateDashboard();
            } catch (err) {
                console.error("Data load failed:", err);
            } finally {
                loader.classList.add("hidden-loader");
            }
        }

        function updateUrlFromState() {
            const params = new URLSearchParams();
            if (state.context !== "forecast") params.set("context", state.context);
            if (state.viewMode !== "monthly") params.set("viewMode", state.viewMode);
            if (state.searchQuery) params.set("search", state.searchQuery);
            if (state.filters.status && state.filters.status.length > 0) params.set("status", state.filters.status.join(","));
            if (state.filters.month && state.filters.month.length > 0) params.set("months", state.filters.month.join(","));
            if (state.selection.pm) params.set("pm", state.selection.pm);
            if (state.selection.product) params.set("product", state.selection.product);

            const newUrl = "/" + (params.toString() ? "?" + params.toString() : "");
            window.history.replaceState(null, "", newUrl);
        }

        function loadStateFromUrl() {
            const params = new URLSearchParams(window.location.search);
            if (params.has("context")) state.context = params.get("context");
            if (params.has("viewMode")) state.viewMode = params.get("viewMode");
            if (params.has("search")) state.searchQuery = params.get("search");
            if (params.has("status")) state.filters.status = params.get("status").split(",");
            if (params.has("months")) state.filters.month = params.get("months").split(",");
            if (params.has("pm")) state.selection.pm = params.get("pm");
            if (params.has("product")) state.selection.product = params.get("product");

            if (state.searchQuery) {
                const searchInput = document.getElementById("assemblySearch");
                if (searchInput) searchInput.value = state.searchQuery;
            }
            if (state.viewMode) {
                const viewModeSelect = document.getElementById("lineChartViewMode");
                if (viewModeSelect) viewModeSelect.value = state.viewMode;
            }
            
            updateStatusBtnText();
            updateMonthBtnText();
        }

        async function init() {
            loadStateFromUrl();
            initCharts();
            populateStatusFilter();
            await loadDynamicMappings();
            loadDashboardData();
        }

        function switchDataContext(context) {
            if (state.context === context) return;
            state.context = context;

            // --- BUTTON STYLES ---
            const forBtn = document.getElementById("toggle-forecast");
            const actBtn = document.getElementById("toggle-revenue");
            const statusContainer = document.getElementById(
                "dispatch-status-container",
            );
            const searchContainer = document.getElementById(
                "forecastSearchContainer",
            );

            if (context === "forecast") {
                if (document.getElementById('pmConfigBtn')) document.getElementById('pmConfigBtn').style.display = 'none';
                statusContainer.style.display = "flex";
                if (searchContainer) searchContainer.style.display = "block";
                forBtn.className =
                    "px-4 py-1.5 text-xs font-bold rounded bg-yogi-red text-white shadow-sm";
                actBtn.className =
                    "px-4 py-1.5 text-xs font-bold rounded text-gray-500 hover:text-gray-800 flex items-center gap-1.5";

                const revBtnText = document.getElementById("revenue-button-text");
                const lastYear = state.lastRevenueYear || "actuals-2627";
                if (revBtnText) revBtnText.innerText = lastYear === "actuals-2526" ? "REVENUE (2025-26)" : "REVENUE (2026-27)";
            } else {
                if (document.getElementById('pmConfigBtn')) document.getElementById('pmConfigBtn').style.display = 'flex';
                statusContainer.style.display = "none";
                if (searchContainer) searchContainer.style.display = "block";

                state.searchQuery = "";
                if (document.getElementById("assemblySearch")) {
                    document.getElementById("assemblySearch").value = "";
                }

                forBtn.className =
                    "px-4 py-1.5 text-xs font-bold rounded text-gray-500 hover:text-gray-700";
                actBtn.className =
                    "px-4 py-1.5 text-xs font-bold rounded bg-yogi-red text-white shadow-sm flex items-center gap-1.5";

                const revBtnText = document.getElementById("revenue-button-text");
                if (revBtnText) {
                    revBtnText.innerText = context === "actuals-2526" ? "REVENUE (2025-26)" : "REVENUE (2026-27)";
                }

                const check2627 = document.getElementById("check-actuals-2627");
                const check2526 = document.getElementById("check-actuals-2526");
                if (check2627 && check2526) {
                    if (context === "actuals-2526") {
                        check2526.classList.remove("hidden");
                        check2627.classList.add("hidden");
                    } else {
                        check2627.classList.remove("hidden");
                        check2526.classList.add("hidden");
                    }
                }

                state.filters.status = null;
                document.getElementById("filter-status").value = "all";
            }

            // --- GRID LAYOUT ---
            const colBar = document.getElementById("col-bar");
            const colPie = document.getElementById("col-pie");
            const colLine = document.getElementById("col-line");

            colPie.classList.remove("lg:col-span-4", "lg:col-span-3");
            colLine.classList.remove("lg:col-span-4", "lg:col-span-5");

            if (context === "forecast") {
                colPie.classList.add("lg:col-span-4");
                colLine.classList.add("lg:col-span-4");
            } else {
                colPie.classList.add("lg:col-span-3");
                colLine.classList.add("lg:col-span-5");
            }

            setTimeout(() => {
                if (charts.bar) charts.bar.resize();
                if (charts.pie) charts.pie.resize();
                if (charts.line) charts.line.resize();
            }, 50);

            updateLabels(context);
            loadDashboardData();
        }

        function toggleRevenueDropdown() {
            const menu = document.getElementById("revenue-dropdown-menu");
            const chevron = document.getElementById("revenue-chevron");
            if (menu) menu.classList.toggle("hidden");
            if (chevron) chevron.classList.toggle("rotate-180");
        }

        function handleRevenueButtonClick(e) {
            if (e) e.stopPropagation();
            const isRevenueActive = state.context.startsWith("actuals");
            if (!isRevenueActive) {
                const yearToSelect = state.lastRevenueYear || "actuals-2627";
                switchDataContext(yearToSelect);
            } else {
                toggleRevenueDropdown();
            }
        }

        function selectRevenueYear(contextKey) {
            state.lastRevenueYear = contextKey;
            const menu = document.getElementById("revenue-dropdown-menu");
            if (menu) menu.classList.add("hidden");
            const chevron = document.getElementById("revenue-chevron");
            if (chevron) chevron.classList.remove("rotate-180");
            switchDataContext(contextKey);
        }

        window.addEventListener("click", (e) => {
            const container = document.getElementById("revenue-dropdown-container");
            if (container && !container.contains(e.target)) {
                const menu = document.getElementById("revenue-dropdown-menu");
                if (menu) menu.classList.add("hidden");
                const chevron = document.getElementById("revenue-chevron");
                if (chevron) chevron.classList.remove("rotate-180");
            }
        });

        function updateLabels(context) {
            const barTitle = document.querySelector("#col-bar h3");
            const pieTitle = document.querySelector("#col-pie h3");
            const lineTitle = document.querySelector("#col-line h3");

            const billingHead = document.querySelector("#billingHead p");
            const assemblyHead = document.querySelector("#assemblyHead p");
            const avgMonthlyHead = document.querySelector("#avgMonthlyHead p");

            const isQuarterly = state.viewMode === "quarterly";

            if (context === "forecast") {
                if (billingHead) billingHead.innerText = "FORECASTED BILLING VALUE";
                if (assemblyHead)
                    assemblyHead.innerText = "ASSEMBLIES TO BE DISPATCHED";
                if (avgMonthlyHead)
                    avgMonthlyHead.innerText = isQuarterly ? "AVERAGE QUARTERLY FORECAST" : "AVERAGE MONTHLY FORECAST";

                if (barTitle) barTitle.innerText = "FORECASTED BILLING ALLOCATION";
                if (pieTitle)
                    pieTitle.innerText = "FORECASTED BILLING BY PRODUCTION LINE";
                if (lineTitle) lineTitle.innerText = isQuarterly ? "FORECASTED QUARTERLY BILLING" : "FORECASTED MONTHLY BILLING";
            } else {
                if (billingHead) billingHead.innerText = "ACTUAL BILLING VALUE";
                if (assemblyHead) assemblyHead.innerText = "ASSEMBLIES DISPATCHED";
                if (avgMonthlyHead)
                    avgMonthlyHead.innerText = isQuarterly ? "AVERAGE QUARTERLY BILLING" : "AVERAGE MONTHLY BILLING";

                if (barTitle) barTitle.innerText = "REVENUE BY PROJECT MANAGER";
                if (pieTitle)
                    pieTitle.innerText = "ASSEMBLIES DISPATCHED DISTRIBUTION";
                if (lineTitle) lineTitle.innerText = isQuarterly ? "QUARTERLY REVENUE" : "MONTHLY REVENUE";
            }
        }

        // --- 3. FILTERING LOGIC ---
        function getData(mode = "highlight", excludeType = null) {
            return database.filter((row) => {
                // --- Text Search Logic ---
                if (state.searchQuery) {
                    const query = state.searchQuery.toLowerCase();
                    const projMatch =
                        row.name && String(row.name).toLowerCase().includes(query);
                    const asmMatch =
                        row.assembly &&
                        String(row.assembly).toLowerCase().includes(query);

                    if (!projMatch && !asmMatch) return false;
                }

                if (state.filters.status && state.filters.status.length > 0) {
                    const filterVals = state.filters.status;
                    let selectedSource = filterVals.find(x => ["Bought Out", "In House"].includes(x));
                    let selectedStatus = filterVals.find(x => ["Dispatched", "Not Dispatched"].includes(x));
                    
                    let passSource = true;
                    let passStatus = true;
                    
                    if (selectedSource) {
                        passSource = (row.source === selectedSource);
                    }
                    if (selectedStatus) {
                        passStatus = (row.status === selectedStatus);
                    }
                    
                    if (!passSource || !passStatus) return false;
                }

                if (state.filters.month.length > 0) {
                    if (state.viewMode === "quarterly") {
                        const rowQ = getQuarter(row.month);
                        const matches = state.filters.month.some(
                            (f) => f === rowQ || f === row.month || f === formatMonthWithYear(row.month, row.context)
                        );
                        if (!matches) return false;
                    } else {
                        const rowFormatted = formatMonthWithYear(row.month, row.context);
                        const matches = state.filters.month.some(
                            (f) => f === row.month || f === rowFormatted
                        );
                        if (!matches) return false;
                    }
                }

                if (mode === "highlight") {
                    if (state.selection.pm && excludeType !== "pm" && row.pm !== state.selection.pm)
                        return false;
                    if (
                        state.selection.product &&
                        excludeType !== "product" &&
                        row.product !== state.selection.product
                    )
                        return false;
                    if (state.selection.month && excludeType !== "month") {
                        if (state.viewMode === "quarterly") {
                            const rowQ = getQuarter(row.month);
                            if (rowQ !== state.selection.month && row.month !== state.selection.month)
                                return false;
                        } else {
                            const rowFormatted = formatMonthWithYear(row.month, row.context);
                            if (row.month !== state.selection.month && rowFormatted !== state.selection.month)
                                return false;
                        }
                    }
                }
                return true;
            });
        }

        function applySlicer(type, value) {
            state.filters[type] = value === "all" ? null : value;
            state.selection = { pm: null, product: null, month: null };
            updateDashboard();
        }

        function toggleViewMode(mode) {
            state.viewMode = mode;
            state.filters.month = [];
            state.selection.month = null;
            populateMonthOrQuarterFilter();
            updateLabels(state.context);
            updateDashboard();
        }

        function applyChartFilter(type, value) {
            state.selection[type] = state.selection[type] === value ? null : value;
            updateDashboard();
        }

        function resetAllFilters() {
            state.filters = { month: [], status: [] };
            state.selection = { pm: null, product: null, month: null };
            state.searchQuery = "";

            updateMonthBtnText();
            updateStatusBtnText();

            const searchInput = document.getElementById("assemblySearch");
            if (searchInput) searchInput.value = "";

            document
                .querySelectorAll("#monthDropdownList input")
                .forEach((cb) => (cb.checked = false));
            document
                .querySelectorAll("#statusDropdownList input")
                .forEach((cb) => (cb.checked = false));
            updateDashboard();
        }

        // --- 4. DASHBOARD UPDATES ---
        function updateDashboard() {
            const baseData = getData("base");
            const highlightData = getData("highlight");
            const hasSelection =
                state.selection.pm ||
                state.selection.product ||
                state.selection.month;
            const activeData = hasSelection ? highlightData : baseData;

            // Generate specialized datasets for PowerBI-like cross-filtering
            const activeDataPM = hasSelection ? getData("highlight", "pm") : baseData;
            const activeDataProd = hasSelection ? getData("highlight", "product") : baseData;
            const activeDataMonth = hasSelection ? getData("highlight", "month") : baseData;

            updateKPIs(activeData);
            updateVisuals(baseData, highlightData, hasSelection, activeDataPM, activeDataProd, activeDataMonth);
            renderTable(activeData);
            updateFilterChips();
            updateUrlFromState();
        }

        function updateKPIs(data) {
            const totalVal = data.reduce((sum, d) => sum + d.val, 0);
            const totalProj = new Set(data.map((d) => d.name)).size;
            const totalAssm = data.filter(
                (d) => d.assembly && d.assembly.trim() !== "",
            ).length;
            const distMonthCount = new Set(data.map((d) => d.month)).size;

            document.getElementById("kpi-projects").innerText = totalProj;
            document.getElementById("kpi-revenue").innerText =
                "₹ " +
                (totalVal / 10000000).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }) +
                " Cr";
            document.getElementById("kpi-assemblies").innerText = totalAssm;

            let divisor = distMonthCount > 0 ? distMonthCount : 1;
            if (state.viewMode === "quarterly") {
                divisor = divisor / 3;
            }
            const avg = totalVal / 10000000 / divisor;
            document.getElementById("kpi-avg").innerText =
                "₹ " +
                avg.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }) +
                " Cr";
        }

        function initCharts() {
            Chart.register(ChartDataLabels);
            const commonOpts = {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
            };

            const ctxBar = document.getElementById("barChart").getContext("2d");
            charts.bar = new Chart(ctxBar, {
                type: "bar",
                data: { labels: [], datasets: [] },
                plugins: [ChartDataLabels],
                options: {
                    ...commonOpts,
                    layout: { padding: { top: 20 } },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            anchor: "end",
                            align: "top",
                            color: "#666",
                            font: { weight: "bold", size: 10 },
                            formatter: (val) => val,
                        },
                    },
                    onClick: (e, els) => {
                        if (els.length)
                            applyChartFilter("pm", charts.bar.data.labels[els[0].index]);
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Value ( in ₹ Cr.)",
                                font: { weight: "bold" },
                            },
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                autoSkip: false,
                                maxRotation: 45,
                                minRotation: 20,
                                font: { size: 10, weight: "bold" },
                            },
                        },
                    },
                },
            });

            const ctxPie = document.getElementById("pieChart").getContext("2d");
            charts.pie = new Chart(ctxPie, {
                type: "doughnut",
                data: { labels: [], datasets: [] },
                plugins: [ChartDataLabels],
                options: {
                    ...commonOpts,
                    layout: { padding: 40 },
                    plugins: {
                        legend: { position: "right" },
                    },
                    onClick: (e, els) => {
                        if (els.length)
                            applyChartFilter(
                                "product",
                                charts.pie.data.labels[els[0].index],
                            );
                    },
                },
            });

            const ctxLine = document.getElementById("lineChart").getContext("2d");
            charts.line = new Chart(ctxLine, {
                type: "line",
                data: { labels: [], datasets: [] },
                plugins: [ChartDataLabels],
                options: {
                    ...commonOpts,
                    layout: { padding: { top: 20, right: 20 } },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            display: true,
                            align: "top",
                            offset: 5,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            borderRadius: 3,
                            padding: 4,
                            font: { size: 10, weight: "bold" },
                            formatter: (val) => val + " Cr",
                        },
                    },
                    scales: {
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: "Value ( in ₹ Cr.)",
                                font: { weight: "bold" },
                            },
                            grid: { color: "#f3f4f6" },
                        },
                        x: { grid: { display: false } },
                    },
                    onClick: (e, els) => {
                        if (els.length)
                            applyChartFilter(
                                "month",
                                charts.line.data.labels[els[0].index],
                            );
                    },
                },
            });
        }

        function interleavePieEntries(entries) {
            if (!entries || entries.length <= 2) return entries;
            const sorted = [...entries];
            const mid = Math.ceil(sorted.length / 2);
            const large = sorted.slice(0, mid);
            const small = sorted.slice(mid).reverse();

            const result = [];
            while (large.length || small.length) {
                if (large.length) result.push(large.shift());
                if (small.length) result.push(small.shift());
            }
            return result;
        }

        function updateVisuals(baseData, highlightData, hasSelection, activeDataPM, activeDataProd, activeDataMonth) {
            const colors = {
                red: "#a81818",
                pink: "#fca5a5",
                gray: "#e5e7eb",
                pieBase: [
                    "#B02A37",
                    "#2E4F6E",
                    "#8C1D2D",
                    "#E2A03F",
                    "#6C757D",
                    "#ADB5BD",
                    "#D4A373",
                    "#4A7C59",
                    "#C85A3D",
                    "#7B6888",
                    "#E5E0DA",
                ],
            };

            const groupBy = (data, key) => {
                const map = {};
                data.forEach((d) => {
                    map[d[key]] = (map[d[key]] || 0) + d.val;
                });
                return map;
            };

            const pmData = groupBy(activeDataPM, "pm");
            const pmHighlightSet = hasSelection
                ? new Set(highlightData.map((d) => d.pm))
                : null;
            const sortedPMs = Object.keys(pmData).sort(
                (a, b) => pmData[a] - pmData[b],
            );

            charts.bar.data.labels = sortedPMs;
            charts.bar.data.datasets = [
                {
                    data: sortedPMs.map((pm) => (pmData[pm] / 10000000).toFixed(2)),
                    backgroundColor: sortedPMs.map((pm) => {
                        if (!hasSelection) return colors.red;
                        return pmHighlightSet.has(pm) ? colors.red : colors.pink;
                    }),
                    borderRadius: 4,
                    barThickness: 25,
                },
            ];
            charts.bar.update();

            if (state.context === "forecast") {
                const prodData = groupBy(activeDataProd, "product");
                const prodHighlightSet = new Set(highlightData.map((d) => d.product));

                charts.pie.options.cutout = "60%";
                charts.pie.options.layout.padding = 40;
                charts.pie.options.plugins.legend = {
                    display: true,
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        font: { size: 9, weight: "bold", family: "'Inter', sans-serif" },
                        color: "#4B5563",
                        padding: 15
                    },
                };
                charts.pie.options.plugins.datalabels = {
                    display: 'auto',
                    color: "#4B5563",
                    anchor: "end",
                    align: "end",
                    offset: 8,
                    font: { weight: "bold", size: 10, family: "'Inter', sans-serif" },
                    formatter: (val) => (val / 10000000).toFixed(2)
                };

                charts.pie.data.labels = Object.keys(prodData);
                charts.pie.data.datasets = [
                    {
                        data: Object.values(prodData),
                        backgroundColor: Object.keys(prodData).map((p, i) =>
                            !hasSelection || prodHighlightSet.has(p)
                                ? colors.pieBase[i % colors.pieBase.length]
                                : colors.gray,
                        ),
                        borderColor: "#fff",
                        borderWidth: 2,
                    },
                ];
            } else {
                const pmCountMap = {};
                activeDataProd.forEach((d) => {
                    if (d.assembly && d.assembly.trim() !== "")
                        pmCountMap[d.pm] = (pmCountMap[d.pm] || 0) + 1;
                });

                const sortedEntries = Object.entries(pmCountMap).sort(
                    (a, b) => b[1] - a[1],
                );
                const interleavedEntries = interleavePieEntries(sortedEntries);
                const pmKeys = interleavedEntries.map((e) => e[0]);
                const pmValues = interleavedEntries.map((e) => e[1]);
                const totalAssm = pmValues.reduce((sum, v) => sum + v, 0);

                charts.pie.options.cutout = "0%";
                charts.pie.options.layout.padding = 60;
                charts.pie.options.plugins.legend.display = false;
                charts.pie.options.plugins.datalabels = {
                    display: (ctx) => {
                        const val = ctx.dataset.data[ctx.dataIndex];
                        return totalAssm > 0 && (val / totalAssm) >= 0.015 ? 'auto' : false;
                    },
                    color: "#333",
                    anchor: "end",
                    align: "end",
                    offset: 6,
                    font: { weight: "bold", size: 10, family: "'Inter', sans-serif" },
                    formatter: (val, ctx) =>
                        `${ctx.chart.data.labels[ctx.dataIndex]} ${val}`,
                };

                charts.pie.data.labels = pmKeys;
                charts.pie.data.datasets = [
                    {
                        data: pmValues,
                        backgroundColor: pmKeys.map(
                            (k, i) => colors.pieBase[i % colors.pieBase.length],
                        ),
                        borderColor: "#fff",
                        borderWidth: 1,
                    },
                ];
            }
            charts.pie.update();

            let labels = [];
            let dataVals = [];
            let pointBgColors = [];

            if (state.viewMode === "quarterly") {
                const getQuarter = (month) => {
                    if (["Apr", "May", "Jun"].includes(month)) return "Q1";
                    if (["Jul", "Aug", "Sep"].includes(month)) return "Q2";
                    if (["Oct", "Nov", "Dec"].includes(month)) return "Q3";
                    if (["Jan", "Feb", "Mar"].includes(month)) return "Q4";
                    return "Other";
                };

                const quarterData = {};
                const quarterHighlightSet = new Set();

                activeDataMonth.forEach(d => {
                    const q = getQuarter(d.month);
                    quarterData[q] = (quarterData[q] || 0) + d.val;
                });
                highlightData.forEach(d => {
                    quarterHighlightSet.add(getQuarter(d.month));
                });

                const QUARTER_ORDER = ["Q1", "Q2", "Q3", "Q4"];
                labels = Object.keys(quarterData).sort(
                    (a, b) => QUARTER_ORDER.indexOf(a) - QUARTER_ORDER.indexOf(b)
                );
                dataVals = labels.map(q => (quarterData[q] / 10000000).toFixed(2));
                pointBgColors = labels.map(q =>
                    !hasSelection || quarterHighlightSet.has(q) ? colors.red : "#fff"
                );
            } else {
                const monthData = groupBy(activeDataMonth, "month");
                const monthHighlightSet = new Set(highlightData.map((d) => d.month));
                const FISCAL_ORDER = [
                    "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Sept",
                    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
                ];
                const rawMonths = Object.keys(monthData).sort(
                    (a, b) => FISCAL_ORDER.indexOf(a) - FISCAL_ORDER.indexOf(b)
                );
                labels = rawMonths.map((m) => formatMonthWithYear(m));
                dataVals = rawMonths.map((m) => (monthData[m] / 10000000).toFixed(2));
                pointBgColors = rawMonths.map((m) => {
                    const fmtM = formatMonthWithYear(m);
                    return !hasSelection || monthHighlightSet.has(m) || monthHighlightSet.has(fmtM) ? colors.red : "#fff";
                });
            }

            charts.line.data.labels = labels;
            charts.line.data.datasets = [
                {
                    data: dataVals,
                    borderColor: colors.red,
                    backgroundColor: "rgba(168, 24, 24, 0.05)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: pointBgColors,
                },
            ];
            charts.line.update();
        }

        function renderTable(data) {
            const tbody = document.getElementById("table-body");
            const uniqueProjects = new Set(data.map((d) => d.name));

            document.getElementById("table-count").innerText =
                `${uniqueProjects.size} Projects`;

            tbody.innerHTML = "";

            if (data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-400">No projects match filters</td></tr>`;
                return;
            }

            const grouped = Object.values(
                data.reduce((acc, item) => {
                    if (!acc[item.name]) {
                        acc[item.name] = {
                            name: item.name,
                            pm: item.pm,
                            items: [],
                            totalVal: 0,
                        };
                    }

                    acc[item.name].totalVal += item.val || 0;
                    acc[item.name].items.push(item);
                    return acc;
                }, {}),
            );

            let result = grouped;
            window.currentTableData = result;

            if (state.sort.key === "billing") {
                result.sort((a, b) =>
                    state.sort.direction === "asc"
                        ? a.totalVal - b.totalVal
                        : b.totalVal - a.totalVal,
                );
            }

            result.forEach((row, idx) => {
                const rowId = `proj_${idx}`;
                const isExpanded = state.expandedRows.includes(rowId);

                const tr = document.createElement("tr");
                tr.className = `hover:bg-gray-50 transition group ${isExpanded ? "bg-gray-50" : "bg-white"
                    }`;

                tr.innerHTML = `
<td class="px-6 py-4">
<button onclick="toggleProjectExpansion('${rowId}')" class="w-6 h-6 flex items-center justify-center rounded border ${isExpanded
                        ? "bg-yogi-red border-yogi-red text-white"
                        : "border-gray-300 text-gray-500 hover:border-yogi-red hover:text-yogi-red"
                    } transition">

          ${isExpanded ? "−" : "+"}
</button>
</td>
<td class="px-6 py-4 font-medium text-gray-900">${row.name}</td>
<td class="px-6 py-4 text-gray-600">${row.pm}</td>
<td class="px-6 py-4 text-right font-bold text-gray-900">₹${row.totalVal.toLocaleString(
                        "en-IN",
                    )}</td>

    `;

                tbody.appendChild(tr);

                if (isExpanded) {
                    const childTr = document.createElement("tr");
                    childTr.className = "bg-gray-50/80";

                    let headerHtml = "",
                        itemsHtml = "";

                    let sortedItems = [...row.items];

                    const getDateVal = (d) => {
                        if (!d) return 999999;
                        const p = d.split("-");
                        return parseInt(p[2] + p[1]);
                    };

                    sortedItems.sort((a, b) => {
                        if (state.assemblySort === "default") {
                            const statA = a.status === "Dispatched" ? 0 : 1;
                            const statB = b.status === "Dispatched" ? 0 : 1;
                            if (statA !== statB) return statA - statB;

                            const dateA = getDateVal(a.date);
                            const dateB = getDateVal(b.date);
                            if (dateA !== dateB) return dateA - dateB;

                            if (b.val !== a.val) return b.val - a.val;
                            return (a.assembly || "").localeCompare(b.assembly || "");
                        } else if (state.assemblySort === "valDesc") return b.val - a.val;
                        else if (state.assemblySort === "dateAsc")
                            return getDateVal(a.date) - getDateVal(b.date);
                        else if (state.assemblySort === "nameAsc")
                            return (a.assembly || "").localeCompare(b.assembly || "");

                        return 0;
                    });

                    headerHtml = `
<div class="row items-end mb-2 border-b border-gray-200 pb-2">
<div class="col-4">
<h4 class="text-xs font-bold text-gray-400 uppercase">Assembly Breakdown</h4>
</div>
<div class="col-4 text-center">
<h4 class="text-xs font-bold text-gray-400 uppercase">Dispatch Track</h4>
</div>
<div class="col-4 flex justify-end items-center gap-2">
<span class="text-[10px] font-bold text-gray-400 uppercase">Sort By:</span>
<select onchange="changeAssemblySort(this.value)" class="text-xs border border-gray-300 rounded bg-white text-gray-700 focus:ring-1 focus:ring-yogi-red focus:border-yogi-red p-1 cursor-pointer" style="width:140px;">
<option value="default" ${state.assemblySort === "default" ? "selected" : ""
                        }>Default (Status > Date)</option>
<option value="valDesc" ${state.assemblySort === "valDesc" ? "selected" : ""
                        }>Billing (High-Low)</option>
<option value="dateAsc" ${state.assemblySort === "dateAsc" ? "selected" : ""
                        }>Date (Old-New)</option>
<option value="nameAsc" ${state.assemblySort === "nameAsc" ? "selected" : ""
                        }>Name (A-Z)</option>
</select>
</div>
</div>

        `;

                    itemsHtml = sortedItems
                        .map((i) => {
                            let bgStyle = "";
                            let badgeClasses = "px-3 py-1 rounded-full text-xs font-bold inline-block ";

                            if (i.status === "Dispatched") {
                                if (i.source === "Bought Out") {
                                    bgStyle = "background: linear-gradient(135deg, #3b82f6 50%, #22c55e 50%); color: white;";
                                } else if (i.source === "In House") {
                                    bgStyle = "background: linear-gradient(135deg, #f97316 50%, #22c55e 50%); color: white;";
                                } else {
                                    bgStyle = "background-color: #22c55e; color: white;";
                                }
                            } else {
                                if (i.source === "Bought Out") {
                                    bgStyle = "background-color: #3b82f6; color: white;";
                                } else if (i.source === "In House") {
                                    bgStyle = "background-color: #f97316; color: white;";
                                } else {
                                    bgStyle = "background-color: transparent; color: #6b7280;";
                                }
                            }

                            const statusBadge = `<span class="${badgeClasses}" style="${bgStyle}">${i.month} ${i.year}</span>`;

                            return `<div class="row d-flex flex justify-between items-center py-2 border-b border-gray-200 last:border-0 text-sm hover:bg-white transition-colors">
<span class="col-4 text-gray-600 pl-4 border-l-2 ${i.status === "Dispatched"
                                    ? "border-green-500"
                                    : "border-red-300"
                                }">

                ${i.assembly || "–"}
</span>
<span class="col-4 text-center text-gray-600 flex flex-col items-center justify-center">
                  ${statusBadge}
</span>
<span class="text-right col-4 font-medium text-gray-800">₹ ${i.val.toLocaleString(
                                    "en-IN",
                                )}</span></div>`;
                        })
                        .join("");

                    if (sortedItems.length === 0)
                        itemsHtml = `<div class="p-3 text-center text-gray-400 text-xs italic">No detailed assemblies available</div>`;

                    childTr.innerHTML = `<td colspan="6" class="p-0"><div class="expand-row px-6 py-4 border-t border-gray-200 shadow-inner bg-gray-100 mx-4 mb-4 rounded-b-lg"><div class="row mb-3"><button class="bg-yogi-red text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-800 transition" onclick="generateProjectPDF('${rowId}')"><i class="fa-solid fa-file-pdf mr-2"></i> Download PDF Report</button></div>${headerHtml}${itemsHtml}</div></td>`;

                    tbody.appendChild(childTr);
                }
            });
        }

        function toggleProjectExpansion(id) {
            const idx = state.expandedRows.indexOf(id);
            if (idx > -1) state.expandedRows.splice(idx, 1);
            else state.expandedRows.push(id);
            updateDashboard();
        }

        function updateFilterChips() {
            const container = document.getElementById("active-filters-container");
            container.innerHTML = "";
            let hasFilter = false;
            const allFilters = { ...state.filters, ...state.selection };
            const isQuarterly = state.viewMode === "quarterly";

            Object.entries(allFilters).forEach(([key, val]) => {
                if (val && (Array.isArray(val) ? val.length > 0 : true)) {
                    hasFilter = true;
                    const isSelection = key in state.selection;
                    const bgClass = isSelection
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800";
                    const displayKey = key === "month" ? (isQuarterly ? "QUARTER" : "MONTH") : key.toUpperCase();
                    const displayVal = Array.isArray(val)
                        ? (val.length === 1 ? val[0] : `${val.length} ${isQuarterly ? "Quarters" : "Months"}`)
                        : val;
                    const chip = document.createElement("div");
                    chip.className = `${bgClass} text-xs font-semibold px-2 py-1 rounded flex items-center gap-1`;
                    let closeAction = "";
                    if (isSelection) {
                        closeAction = `applyChartFilter('${key}', '${val}')`;
                    } else if (key === "month") {
                        closeAction = `state.filters.month = []; updateMonthBtnText(); document.querySelectorAll('#monthDropdownList input').forEach(cb => cb.checked = false); updateDashboard();`;
                    } else if (key === "status") {
                        closeAction = `state.filters.status = []; updateStatusBtnText(); document.querySelectorAll('#statusDropdownList input').forEach(cb => cb.checked = false); updateDashboard();`;
                    }
                    chip.innerHTML = `<span>${displayKey}: ${displayVal}</span><button onclick="${closeAction}" class="hover:text-red-600 font-bold">&times;</button>`;
                    container.appendChild(chip);
                }
            });
            container.classList.toggle("hidden", !hasFilter);
        }

        function toggleBillingSort() {
            state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
            document.getElementById("billingSortIcon").innerText =
                state.sort.direction === "asc" ? "▲" : "▼";
            updateDashboard();
        }

        function formatMonthWithYear(m, context = state.context) {
            if (!m) return "";
            let cleanM = String(m).trim();
            if (cleanM.includes("'")) return cleanM;

            let startYear = 2026;
            if (context === "actuals-2526") {
                startYear = 2025;
            } else if (context === "actuals-2627" || context === "forecast") {
                startYear = 2026;
            }

            const baseM = cleanM.replace(/[^a-zA-Z]/g, "");
            let displayM = baseM;
            if (displayM === "Sep") displayM = "Sept";

            const isNextYear = ["Jan", "Feb", "Mar"].includes(baseM);
            const yr = isNextYear ? startYear + 1 : startYear;
            const yrSuffix = "'" + String(yr).slice(-2);

            return `${displayM}${yrSuffix}`;
        }

        function getQuarter(month) {
            if (!month) return "";
            const m = String(month).trim();
            if (["Apr", "May", "Jun"].includes(m)) return "Q1";
            if (["Jul", "Aug", "Sep"].includes(m)) return "Q2";
            if (["Oct", "Nov", "Dec"].includes(m)) return "Q3";
            if (["Jan", "Feb", "Mar"].includes(m)) return "Q4";
            return m;
        }

        function getAvailableQuarters() {
            const now = new Date();
            const m = now.getMonth() + 1; // 1 (Jan) to 12 (Dec)

            if (state.context === "forecast") {
                // Forecast: Current & Future Quarters of current FY (past quarters are gone)
                if (m >= 4 && m <= 6) return ["Q1", "Q2", "Q3", "Q4"];
                if (m >= 7 && m <= 9) return ["Q2", "Q3", "Q4"];
                if (m >= 10 && m <= 12) return ["Q3", "Q4"];
                return ["Q4"];
            } else {
                // Actuals / Revenue: Past & Current Quarters
                if (state.context === "actuals-2526") {
                    return ["Q1", "Q2", "Q3", "Q4"];
                }
                if (m >= 4 && m <= 6) return ["Q1"];
                if (m >= 7 && m <= 9) return ["Q1", "Q2"];
                if (m >= 10 && m <= 12) return ["Q1", "Q2", "Q3"];
                return ["Q1", "Q2", "Q3", "Q4"];
            }
        }

        function updateMonthBtnText() {
            const isQuarterly = state.viewMode === "quarterly";
            const btnText = document.getElementById("monthBtnText");
            if (!btnText) return;
            if (state.filters.month.length === 0) {
                btnText.innerText = isQuarterly ? "All Quarters" : "All Months";
            } else if (state.filters.month.length === 1) {
                btnText.innerText = state.filters.month[0];
            } else {
                btnText.innerText = `${state.filters.month.length} Selected`;
            }
        }

        function populateMonthOrQuarterFilter(months) {
            if (months) state.distinctMonths = months;
            const list = document.getElementById("monthDropdownList");
            if (!list) return;
            list.innerHTML = "";

            const isQuarterly = state.viewMode === "quarterly";

            const labelEl = document.getElementById("dispatchMonthLabel");
            if (labelEl) {
                labelEl.innerText = isQuarterly ? "Dispatch Quarter" : "Dispatch Month";
            }

            updateMonthBtnText();

            if (isQuarterly) {
                const availableQuarters = getAvailableQuarters();
                if (availableQuarters.length === 0) {
                    list.innerHTML = `<div class="p-2 text-xs text-gray-500">No data</div>`;
                    return;
                }
                availableQuarters.forEach((q) => {
                    const item = document.createElement("div");
                    item.className =
                        "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = state.filters.month.includes(q);
                    checkbox.className =
                        "form-checkbox h-3 w-3 text-yogi-red rounded border-gray-300 focus:ring-yogi-red pointer-events-none";
                    const span = document.createElement("span");
                    span.className = "ml-2 text-xs text-gray-700 select-none font-bold";
                    span.innerText = q;
                    item.appendChild(checkbox);
                    item.appendChild(span);
                    item.onclick = (e) => {
                        e.stopPropagation();
                        toggleMonthFilter(q);
                        checkbox.checked = state.filters.month.includes(q);
                    };
                    list.appendChild(item);
                });
            } else {
                const monthList = state.distinctMonths || [];
                if (monthList.length === 0) {
                    list.innerHTML = `<div class="p-2 text-xs text-gray-500">No data</div>`;
                    return;
                }
                monthList.forEach((m) => {
                    const formattedM = formatMonthWithYear(m);
                    const item = document.createElement("div");
                    item.className =
                        "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = state.filters.month.includes(formattedM) || state.filters.month.includes(m);
                    checkbox.className =
                        "form-checkbox h-3 w-3 text-yogi-red rounded border-gray-300 focus:ring-yogi-red pointer-events-none";
                    const span = document.createElement("span");
                    span.className = "ml-2 text-xs text-gray-700 select-none";
                    span.innerText = formattedM;
                    item.appendChild(checkbox);
                    item.appendChild(span);
                    item.onclick = (e) => {
                        e.stopPropagation();
                        toggleMonthFilter(formattedM);
                        checkbox.checked = state.filters.month.includes(formattedM);
                    };
                    list.appendChild(item);
                });
            }
        }

        function populateMonthFilter(months) {
            populateMonthOrQuarterFilter(months);
        }

        function toggleMonthFilter(month) {
            const idx = state.filters.month.indexOf(month);
            if (idx > -1) state.filters.month.splice(idx, 1);
            else state.filters.month.push(month);
            updateMonthBtnText();
            updateDashboard();
        }

        function updateStatusBtnText() {
            const btnText = document.getElementById("statusBtnText");
            if (!btnText) return;
            if (state.filters.status.length === 0) {
                btnText.innerText = "All Statuses";
            } else if (state.filters.status.length === 1) {
                btnText.innerText = state.filters.status[0];
            } else {
                btnText.innerText = `${state.filters.status.length} Selected`;
            }
        }

        function populateStatusFilter() {
            const list = document.getElementById("statusDropdownList");
            if (!list) return;
            list.innerHTML = "";

            const statuses = ["Bought Out", "In House", "Dispatched", "Not Dispatched"];
            
            statuses.forEach((s) => {
                const item = document.createElement("div");
                item.className = "flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer";
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = state.filters.status.includes(s);
                checkbox.className = "form-checkbox h-3 w-3 text-yogi-red rounded border-gray-300 focus:ring-yogi-red pointer-events-none";
                const span = document.createElement("span");
                span.className = "ml-2 text-sm text-gray-700 pointer-events-none";
                span.innerText = s;
                item.appendChild(checkbox);
                item.appendChild(span);
                item.onclick = (e) => {
                    e.stopPropagation();
                    toggleStatusFilter(s);
                    // update all checkboxes to reflect mutual exclusivity
                    Array.from(list.querySelectorAll('input')).forEach(cb => {
                        cb.checked = state.filters.status.includes(cb.nextElementSibling.innerText);
                    });
                };
                list.appendChild(item);
            });
        }

        function toggleStatusFilter(status) {
            const isSource = ["Bought Out", "In House"].includes(status);
            const isDispatch = ["Dispatched", "Not Dispatched"].includes(status);

            const idx = state.filters.status.indexOf(status);
            if (idx > -1) {
                state.filters.status.splice(idx, 1);
            } else {
                if (isSource) {
                    state.filters.status = state.filters.status.filter(s => !["Bought Out", "In House"].includes(s));
                }
                if (isDispatch) {
                    state.filters.status = state.filters.status.filter(s => !["Dispatched", "Not Dispatched"].includes(s));
                }
                state.filters.status.push(status);
            }
            updateStatusBtnText();
            updateDashboard();
        }

        function toggleStatusDropdown() {
            document.getElementById("statusDropdownList").classList.toggle("hidden");
        }

        function toggleMonthDropdown() {
            document.getElementById("monthDropdownList").classList.toggle("hidden");
        }
        window.addEventListener("click", (e) => {
            const monthBtn = document.getElementById("monthDropdownBtn");
            const monthList = document.getElementById("monthDropdownList");
            if (monthBtn && monthList && !monthBtn.contains(e.target) && !monthList.contains(e.target))
                monthList.classList.add("hidden");

            const statusBtn = document.getElementById("statusDropdownBtn");
            const statusList = document.getElementById("statusDropdownList");
            if (statusBtn && statusList && !statusBtn.contains(e.target) && !statusList.contains(e.target))
                statusList.classList.add("hidden");
        });

        document.addEventListener("DOMContentLoaded", init);



        async function generateProjectPDF(rowId) {
            const { jsPDF } = window.jspdf;
            let project;
            if (String(rowId).startsWith("proj_")) {
                const idx = parseInt(rowId.split("_")[1]);
                project = window.currentTableData[idx];
            } else {
                project = window.currentTableData.find((p) => p.id === rowId);
            }

            if (!project) {
                alert("Error: Project data not found.");
                return;
            }

            const doc = new jsPDF();
            const brandRed = "#a81818";
            const logo = document.getElementById("pdfLogo");
            if (logo) doc.addImage(logo, "PNG", 14, 10, 40, 15);

            const isForecast = state.context === "forecast";
            const reportTitle = isForecast
                ? "Detailed Forecast Assembly Overview"
                : "Detailed Actual Assembly Overview";

            const fyText = document.getElementById("fy").innerText;

            doc.setFontSize(15);
            doc.setTextColor(brandRed);
            doc.text(reportTitle, 14, 34);

            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(fyText, 14, 40);

            const startY = 46;
            doc.setFillColor(245, 245, 245);
            doc.rect(14, startY, 182, 20, "F");

            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text("Project Name:", 18, startY + 8);
            doc.setFont("helvetica", "normal");
            doc.text(project.name, 18, startY + 14);

            doc.setFont("helvetica", "bold");
            doc.text("Project Manager:", 90, startY + 8);
            doc.setFont("helvetica", "normal");
            doc.text(project.pm, 90, startY + 14);

            doc.setFont("helvetica", "bold");
            doc.text("Total Billing Value:", 140, startY + 8);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Rs. ${project.totalVal.toLocaleString("en-IN")}`,
                140,
                startY + 14,
            );

            let tableHead, tableBody, columnStyles;

            if (isForecast) {
                tableHead = [
                    ["Assembly Name", "Dispatch Track", "Billing Value (INR)"],
                ];
                tableBody = project.items.map((item) => [
                    item.assembly,
                    `${item.month} ${item.year}`,
                    item.val.toLocaleString("en-IN"),
                ]);
                columnStyles = { 2: { halign: "right" } };
            } else {
                tableHead = [["Assembly Name"]];
                tableBody = project.items.map((item) => [item.assembly]);
                columnStyles = {};
            }

            doc.autoTable({
                startY: startY + 26,
                head: tableHead,
                body: tableBody,
                theme: "grid",
                headStyles: {
                    fillColor: brandRed,
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: columnStyles,
                styles: { fontSize: 9, cellPadding: 3 },
            });

            const prefix = isForecast ? "forecast" : "actual";
            const safeName = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            doc.save(`${prefix}_${safeName}_report.pdf`);
        }

        function generateRankedMonthPDF() {
            const { jsPDF } = window.jspdf;
            if (!window.currentTableData || window.currentTableData.length === 0) {
                alert("No data available to export.");
                return;
            }
            const doc = new jsPDF();
            const brandRed = "#a81818";
            const logo = document.getElementById("pdfLogo");
            if (logo) doc.addImage(logo, "PNG", 14, 10, 40, 15);

            const isForecast = state.context === "forecast";
            const reportTitle = isForecast
                ? "Project Forecast Report"
                : "Actual Revenue Report";
            const totalLabel = isForecast
                ? "TOTAL FORECAST"
                : "TOTAL ACTUAL REVENUE";

            const fyText = document.getElementById("fy").innerText;

            let dateRangeText = "Full Financial Year";
            if (state.filters.month && state.filters.month.length > 0) {
                const MONTH_ORDER = [
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                    "Jan",
                    "Feb",
                    "Mar",
                ];
                const selected = [...state.filters.month].sort(
                    (a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b),
                );

                if (selected.length === 1) {
                    dateRangeText = `Month: ${selected[0]}`;
                } else {
                    dateRangeText = `Period: ${selected[0]} to ${selected[selected.length - 1]
                        }`;
                }
            }

            doc.setFontSize(16);
            doc.setTextColor(brandRed);
            doc.text(reportTitle, 14, 35);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`${fyText}  |  ${dateRangeText}`, 14, 42);

            const rankedData = [...window.currentTableData].sort(
                (a, b) => b.totalVal - a.totalVal,
            );
            const totalBilling = rankedData.reduce((sum, p) => sum + p.totalVal, 0);

            const tableBody = rankedData.map((proj, index) => [
                index + 1,
                proj.name,
                proj.pm,
                proj.items.length,
                proj.totalVal.toLocaleString("en-IN"),
            ]);

            doc.autoTable({
                startY: 48,
                head: [["#", "Project Name", "Manager", "Items", "Billing (INR)"]],
                body: tableBody,
                theme: "grid",
                headStyles: {
                    fillColor: brandRed,
                    textColor: 255,
                    fontStyle: "bold",
                },
                columnStyles: {
                    0: { halign: "center" },
                    4: { halign: "right", fontStyle: "bold" },
                },
                foot: [
                    [
                        "",
                        totalLabel,
                        "",
                        "",
                        `Rs. ${totalBilling.toLocaleString("en-IN")}`,
                    ],
                ],
                footStyles: {
                    fillColor: [240, 240, 240],
                    textColor: 0,
                    fontStyle: "bold",
                    halign: "right",
                },
            });

            const fileName = isForecast
                ? `Forecast_Report_${dateRangeText.replace(/ /g, "_")}.pdf`
                : `Actual_Report_${dateRangeText.replace(/ /g, "_")}.pdf`;
            doc.save(fileName);
        }
        function dateNtime(isoDate) {
            return new Date(isoDate).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            });
        }
    