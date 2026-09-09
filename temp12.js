
        async function fetchDynamicPMMappingFromMongoDB() {
            return new Promise((resolve) => {
                try {
                    const stored = localStorage.getItem('dynamicPMMapping');
                    resolve(stored ? JSON.parse(stored) : {});
                } catch (e) {
                    resolve({});
                }
            });
        }

        async function saveDynamicPMMappingToMongoDB(config) {
            return new Promise((resolve) => {
                localStorage.setItem('dynamicPMMapping', JSON.stringify(config));
                resolve(true);
            });
        }

        async function fetchDynamicProjectNameMapping() {
            return new Promise((resolve) => {
                try {
                    const stored = localStorage.getItem('dynamicProjectNameMapping');
                    resolve(stored ? JSON.parse(stored) : {});
                } catch (e) {
                    resolve({});
                }
            });
        }

        async function saveDynamicProjectNameMapping(config) {
            return new Promise((resolve) => {
                localStorage.setItem('dynamicProjectNameMapping', JSON.stringify(config));
                resolve(true);
            });
        }

        async function loadDynamicMappings() {
            try {
                state.dynamicPMMapping = await fetchDynamicPMMappingFromMongoDB();
                state.dynamicProjectNameMapping = await fetchDynamicProjectNameMapping();
            } catch (e) {
                console.error("Failed to parse dynamic mappings", e);
            }
        }

        function openPmConfigModal() {
            document.getElementById('pmConfigModal').classList.remove('hidden');
            document.getElementById('pmConfigModal').classList.add('flex');
            document.getElementById('pmConfigSearch').value = '';
            renderPmConfigTable();
        }

        function closePmConfigModal() {
            document.getElementById('pmConfigModal').classList.add('hidden');
            document.getElementById('pmConfigModal').classList.remove('flex');
        }

        let pmConfigSortCol = 'code';
        let pmConfigSortAsc = true;
        let isGlobalWbsExpanded = false;

        function sortPmConfig(col) {
            if (pmConfigSortCol === col) {
                pmConfigSortAsc = !pmConfigSortAsc;
            } else {
                pmConfigSortCol = col;
                pmConfigSortAsc = true;
            }
            renderPmConfigTable();
        }

        function toggleAllWbsRows(e) {
            e.stopPropagation();
            isGlobalWbsExpanded = !isGlobalWbsExpanded;
            const globalIcon = document.getElementById('globalToggleIcon');
            if (globalIcon) {
                if (isGlobalWbsExpanded) {
                    globalIcon.classList.remove('fa-plus');
                    globalIcon.classList.add('fa-minus');
                } else {
                    globalIcon.classList.remove('fa-minus');
                    globalIcon.classList.add('fa-plus');
                }
            }
            renderPmConfigTable();
        }

        function renderPmConfigTable() {
            const tbody = document.getElementById('pmConfigTableBody');
            const searchVal = document.getElementById('pmConfigSearch').value.toLowerCase();

            ['code', 'name', 'manager'].forEach(col => {
                const icon = document.getElementById(`pmSortIcon-${col}`);
                if (icon) {
                    if (pmConfigSortCol === col) {
                        icon.innerHTML = pmConfigSortAsc ? '<i class="fa-solid fa-arrow-up"></i>' : '<i class="fa-solid fa-arrow-down"></i>';
                        icon.parentElement.classList.add('text-gray-800');
                        icon.parentElement.classList.remove('text-gray-500');
                    } else {
                        icon.innerHTML = '<i class="fa-solid fa-sort text-gray-300"></i>';
                        icon.parentElement.classList.add('text-gray-500');
                        icon.parentElement.classList.remove('text-gray-800');
                    }
                }
            });

            const projectWBSMap = {};

            rawData.forEach(r => {
                const code = String(r.project).trim();
                if (!code || code === "null" || code === "undefined" || code.startsWith("26E") || code.startsWith("25E") || code.startsWith("26M")) return;

                if (!projectWBSMap[code]) projectWBSMap[code] = new Set();

                const wbs = String(r.WBSElementExternalID || r.wbs || r.WBS || "").trim();
                if (wbs && wbs !== "null" && wbs !== "undefined") {
                    projectWBSMap[code].add(wbs);
                }
            });

            Object.keys(PROJECT_MAPPING).forEach(code => {
                if (!projectWBSMap[code]) projectWBSMap[code] = new Set();

                // Fallback: If a project exists but has NO WBS elements from the data yet,
                // we add its project code as the default WBS so it can still be expanded and configured.
                if (projectWBSMap[code].size === 0) {
                    projectWBSMap[code].add(code);
                }
            });

            let uniqueSapCodes = Object.keys(projectWBSMap);

            uniqueSapCodes.sort((a, b) => {
                let valA, valB;
                if (pmConfigSortCol === 'code') {
                    valA = a;
                    valB = b;
                } else if (pmConfigSortCol === 'name') {
                    valA = getProjectName(a) || '';
                    valB = getProjectName(b) || '';
                } else if (pmConfigSortCol === 'manager') {
                    valA = (state.dynamicPMMapping && state.dynamicPMMapping[a] !== undefined) ? state.dynamicPMMapping[a] : (PM_MAPPING[a] || "");
                    valB = (state.dynamicPMMapping && state.dynamicPMMapping[b] !== undefined) ? state.dynamicPMMapping[b] : (PM_MAPPING[b] || "");
                }
                if (valA < valB) return pmConfigSortAsc ? -1 : 1;
                if (valA > valB) return pmConfigSortAsc ? 1 : -1;
                return 0;
            });

            let html = '';
            uniqueSapCodes.forEach(code => {
                const projName = getProjectName(code);
                const wbsList = [...projectWBSMap[code]].sort();

                if (searchVal && !code.toLowerCase().includes(searchVal) && !projName.toLowerCase().includes(searchVal)) {
                    const wbsMatch = wbsList.some(w => w.toLowerCase().includes(searchVal));
                    if (!wbsMatch) return;
                }

                const currentPM = (state.dynamicPMMapping && state.dynamicPMMapping[code] !== undefined)
                    ? state.dynamicPMMapping[code]
                    : (PM_MAPPING[code] || "");

                const startExpanded = searchVal || isGlobalWbsExpanded ? true : false;
                const hiddenClass = startExpanded ? "" : "hidden";
                const iconClass = startExpanded ? "fa-minus" : "fa-plus";
                const wbsLabel = wbsList.length <= 1 ? "" : "All WBS";

                const ALLOWED_PMS = ["ADITYA SAINI", "ADITYA SHARMA", "SACHIN", "OM DEV", "SATYENDRA", "SHASHIKANT", "KUNAL", "TRIPURARI KUMAR", "SAURABH", "MAYANK"];

                let pmOptionsHtml = `<option value="">Select PM...</option>`;
                let foundCurrent = false;
                ALLOWED_PMS.forEach(pm => {
                    if (currentPM === pm) foundCurrent = true;
                    pmOptionsHtml += `<option value="${pm}" ${currentPM === pm ? "selected" : ""}>${pm}</option>`;
                });
                if (currentPM && !foundCurrent) {
                    pmOptionsHtml += `<option value="${currentPM}" selected>${currentPM}</option>`;
                }

                html += `
                    <tr class="hover:bg-gray-50/50 transition-colors group bg-gray-50/30 cursor-pointer" onclick="toggleWbsRows('${code}')">
                        <td class="px-4 py-3 font-semibold text-gray-900 border-l-4 border-yogi-red select-none">
                            <i id="icon-${code}" class="fa-solid ${iconClass} mr-2 text-gray-400 text-xs transition-transform w-3 text-center"></i>
                            ${code}
                        </td>
                        <td class="px-4 py-3 text-gray-400 italic text-xs select-none">${wbsLabel}</td>
                        <td class="px-4 py-3 font-medium text-gray-800 truncate max-w-[200px]" onclick="event.stopPropagation()">
                            <input type="text" class="project-name-input w-full px-3 py-1.5 text-sm border border-transparent hover:border-gray-300 focus:border-gray-300 rounded focus:ring-1 focus:ring-yogi-red bg-transparent focus:bg-white shadow-none focus:shadow-inner font-medium text-gray-800 transition-all truncate" data-sap-code="${code}" value="${projName}" placeholder="Enter Project Name...">
                        </td>
                        <td class="px-4 py-3" onclick="event.stopPropagation()">
                            <select class="pm-config-input w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-yogi-red focus:border-yogi-red bg-white shadow-inner font-semibold cursor-pointer" data-sap-code="${code}">
                                ${pmOptionsHtml}
                            </select>
                        </td>
                    </tr>
                `;

                wbsList.forEach(wbs => {
                    if (searchVal && !wbs.toLowerCase().includes(searchVal) && !code.toLowerCase().includes(searchVal) && !projName.toLowerCase().includes(searchVal)) {
                        return;
                    }
                    const overrideKey = `${code}_WBS_${wbs}`;
                    const wbsPM = (state.dynamicPMMapping && state.dynamicPMMapping[overrideKey] !== undefined)
                        ? state.dynamicPMMapping[overrideKey]
                        : "";

                    let wbsPmOptionsHtml = `<option value="">Inherit / None</option>`;
                    let foundWbsCurrent = false;
                    ALLOWED_PMS.forEach(pm => {
                        if (wbsPM === pm) foundWbsCurrent = true;
                        wbsPmOptionsHtml += `<option value="${pm}" ${wbsPM === pm ? "selected" : ""}>${pm}</option>`;
                    });
                    if (wbsPM && !foundWbsCurrent) {
                        wbsPmOptionsHtml += `<option value="${wbsPM}" selected>${wbsPM}</option>`;
                    }

                    html += `
                        <tr class="child-row-${code} hover:bg-gray-50/50 transition-colors group text-xs ${hiddenClass}">
                            <td class="px-4 py-2 border-l border-gray-200"></td>
                            <td class="px-4 py-2 text-gray-600 pl-4 font-mono select-none">
                                <i class="fa-solid fa-level-up fa-rotate-90 text-gray-300 mr-2"></i> ${wbs}
                            </td>
                            <td class="px-4 py-2 text-gray-400 italic select-none">WBS Element</td>
                            <td class="px-4 py-2 pl-8">
                                <select class="pm-config-input w-[90%] float-right px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-yogi-red focus:border-yogi-red bg-gray-50 hover:bg-white shadow-inner cursor-pointer" data-sap-code="${overrideKey}">
                                    ${wbsPmOptionsHtml}
                                </select>
                            </td>
                        </tr>
                    `;
                });
            });

            if (!html) {
                html = `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 italic">No matching projects found</td></tr>`;
            }

            tbody.innerHTML = html;
        }

        function toggleWbsRows(code) {
            const rows = document.querySelectorAll(`.child-row-${code}`);
            const icon = document.getElementById(`icon-${code}`);
            let isHidden = true;

            rows.forEach(row => {
                if (row.classList.contains('hidden')) {
                    row.classList.remove('hidden');
                    isHidden = false;
                } else {
                    row.classList.add('hidden');
                }
            });

            if (icon) {
                if (isHidden) {
                    icon.classList.remove('fa-minus');
                    icon.classList.add('fa-plus');
                } else {
                    icon.classList.remove('fa-plus');
                    icon.classList.add('fa-minus');
                }
            }
        }

        async function savePmConfig() {
            const pmInputs = document.querySelectorAll('.pm-config-input');
            const newPmMapping = { ...state.dynamicPMMapping };
            let hasChanges = false;

            pmInputs.forEach(input => {
                const code = input.getAttribute('data-sap-code');
                const val = input.value.trim();
                let staticVal = "";

                if (!code.includes("_WBS_")) {
                    staticVal = PM_MAPPING[code] || "";
                }

                if (val !== staticVal && val !== "") {
                    if (newPmMapping[code] !== val) {
                        newPmMapping[code] = val;
                        hasChanges = true;
                    }
                } else {
                    if (newPmMapping[code] !== undefined) {
                        delete newPmMapping[code];
                        hasChanges = true;
                    }
                }
            });

            const nameInputs = document.querySelectorAll('.project-name-input');
            const newNameMapping = { ...state.dynamicProjectNameMapping };

            nameInputs.forEach(input => {
                const code = input.getAttribute('data-sap-code');
                const val = input.value.trim();
                let staticVal = PROJECT_MAPPING[code] || "Miscellaneous";

                if (val !== staticVal && val !== "") {
                    if (newNameMapping[code] !== val) {
                        newNameMapping[code] = val;
                        hasChanges = true;
                    }
                } else {
                    if (newNameMapping[code] !== undefined) {
                        delete newNameMapping[code];
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                state.dynamicPMMapping = newPmMapping;
                state.dynamicProjectNameMapping = newNameMapping;
                await saveDynamicPMMappingToMongoDB(newPmMapping);
                await saveDynamicProjectNameMapping(newNameMapping);

                const ctx = state.context;
                state.context = "rebuilding"; // Force full rebuild
                switchDataContext(ctx);

                const btn = document.querySelector('button[onclick="savePmConfig()"]');
                const origHtml = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
                btn.classList.replace('bg-yogi-red', 'bg-green-600');
                btn.classList.replace('hover:bg-red-800', 'hover:bg-green-700');

                setTimeout(() => {
                    btn.innerHTML = origHtml;
                    btn.classList.replace('bg-green-600', 'bg-yogi-red');
                    btn.classList.replace('hover:bg-green-700', 'hover:bg-red-800');
                    closePmConfigModal();
                }, 1000);
            } else {
                closePmConfigModal();
            }
        }
    