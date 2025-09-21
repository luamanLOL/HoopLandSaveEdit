document.addEventListener('DOMContentLoaded', () => {
    let saveData = null, foundPlayers = [], selectedPlayerObject = null, selectedLeagueIndex = 0;
    const fileUploadScreen = document.getElementById('file-upload-screen'), mainEditorScreen = document.getElementById('main-editor-screen'), modificationScreen = document.getElementById('modification-screen');
    const fileDropZone = document.getElementById('file-drop-zone'), selectFileBtn = document.getElementById('select-file-btn'), fileInput = document.getElementById('file-input'), loadingIndicator = document.getElementById('loading-indicator');
    const notificationToast = document.getElementById('notification-toast'), leagueSelect = document.getElementById('league-select'), playerSearchInput = document.getElementById('player-search');
    const searchBtn = document.getElementById('search-btn'), resultsOutput = document.getElementById('results-output'), backToSearchBtn = document.getElementById('back-to-search-btn'), saveFileBtn = document.getElementById('save-file-btn');
    const attributeEditorModal = document.getElementById('attribute-editor-modal'), skillsEditorModal = document.getElementById('skills-editor-modal'), contractEditorModal = document.getElementById('contract-editor-modal'), tendenciesEditorModal = document.getElementById('tendencies-editor-modal');
    const inspectorBarsContainer = document.getElementById('inspector-bars'), generalModsContainer = document.getElementById('general-mods-container'), economyModsContainer = document.getElementById('economy-mods-container');
    const playerContractBtn = document.getElementById('player-contract-btn'), playerTendenciesBtn = document.getElementById('player-tendencies-btn');
    const ATTRIBUTE_CATEGORIES = { Finishing: { LAY: "Layup", DNK: "Dunking", INS: "Inside Shooting" }, Shooting: { MID: "Mid Range", TPT: "Three Point", FTS: "Free Throw" }, Creating: { DRB: "Dribbling", PAS: "Passing", ORE: "Offensive Rebounding" }, Defense: { DRE: "Defensive Rebounding", STL: "Stealing", BLK: "Blocking" }, Physicals: { STR: "Strength", SPD: "Speed", STM: "Stamina" } };
    const SKILL_CATEGORIES = { Finishing: { HIG: "Highlight Reel", CRA: "Crafty", SOF: "Soft Touch", TEA: "Tear Dropper", BUL: "Bully", DUN: "Dunk Artist" }, Shooting: { SPO: "Sparkplug", CLU: "Clutch Gene", TWO: "Spot Up", VOL: "Volume Shooter", LIM: "Limitless", HOT: "Unfazed" }, Creating: { DIM: "Dimer", CHE: "Chef", UNF: "Cleanup Crew", SNA: "Step Dancer", FOO: "Foot Surgeon", BAL: "Hot Potato" }, Defense: { CLA: "Clamps", LOC: "Locked In", MAG: "Magnet", CLE: "Two Way", STE: "Ball Hawk", SPA: "Snatcher" } };

    /**
     * Hides all screens and shows the specified screen.
     * @param {HTMLElement} screenToShow The screen element to show.
     */
    function showScreen(screenToShow) { [fileUploadScreen, mainEditorScreen, modificationScreen].forEach(s => s.classList.add('hidden')); screenToShow.classList.remove('hidden'); }

    /**
     * Handles the click event for the select file button.
     */
    selectFileBtn.addEventListener('click', () => fileInput.click());

    /**
     * Handles the change event for the file input.
     * @param {Event} e The event object.
     */
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    /**
     * Adds event listeners for drag and drop functionality.
     */
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => fileDropZone.addEventListener(eventName, preventDefaults, false));

    /**
     * Prevents default event handling and propagation.
     * @param {Event} e The event object.
     */
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    /**
     * Handles the dragenter event for the file drop zone.
     */
    fileDropZone.addEventListener('dragenter', () => fileDropZone.classList.add('border-orange-400'));

    /**
     * Handles the dragleave event for the file drop zone.
     */
    fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('border-orange-400'));

    /**
     * Handles the drop event for the file drop zone.
     * @param {DragEvent} e The drag event object.
     */
    fileDropZone.addEventListener('drop', (e) => { fileDropZone.classList.remove('border-orange-400'); handleFile(e.dataTransfer.files[0]); });

    /**
     * Handles the click event for the search button.
     */
    searchBtn.addEventListener('click', performSearch);

    /**
     * Handles the click event for the back to search button.
     */
    backToSearchBtn.addEventListener('click', () => showScreen(mainEditorScreen));

    /**
     * Handles the click event for the save file button.
     */
    saveFileBtn.addEventListener('click', downloadSaveFile);

    /**
     * Handles the uploaded save file.
     * @param {File} file The file to handle.
     */
    function handleFile(file) {
        if (!file) return;
        fileDropZone.style.display = 'none';
        loadingIndicator.style.display = 'flex';
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const fileContent = event.target.result.trim();
                saveData = JSON.parse(fileContent);
                showToast('File processed successfully!');
                showScreen(mainEditorScreen);
            } catch (error) {
                showToast('Error: Could not parse save file. Is it corrupted?', 'error');
                fileDropZone.style.display = 'block';
                loadingIndicator.style.display = 'none';
            }
        };
        reader.onerror = () => {
            showToast('Error: Could not read the file.', 'error');
            fileDropZone.style.display = 'block';
            loadingIndicator.style.display = 'none';
        };
        reader.readAsText(file);
    }

    /**
     * Searches for a player by first name in the loaded save data.
     */
    function performSearch() {
        if (!saveData) { showToast('No save data loaded.', 'error'); return; }
        selectedLeagueIndex = parseInt(leagueSelect.value);
        const searchTerm = playerSearchInput.value.trim().toLowerCase();
        if (!searchTerm) { showToast('Please enter a first name to search.', 'error'); return; }
        resultsOutput.innerHTML = `<p class="text-slate-400">Searching...</p>`;
        foundPlayers = [];
        try {
            const league = saveData.seasonLeagues[selectedLeagueIndex];
            const allTeams = [...(league.teams || []), ...(league.starTeams || [])];
            for (const team of allTeams) {
                for (const player of (team.roster || [])) {
                    if (player.fn && player.fn.toLowerCase() === searchTerm) {
                        foundPlayers.push({ teamName: team.name || 'N/A', playerInfo: player });
                    }
                }
            }
            displayResults();
        } catch (e) { resultsOutput.textContent = 'An error occurred while searching.'; console.error(e); }
    }

    /**
     * Displays the search results.
     */
    function displayResults() {
        resultsOutput.innerHTML = '';
        if (foundPlayers.length === 0) {
            resultsOutput.textContent = `No players found with the first name "${playerSearchInput.value}".`;
        } else if (foundPlayers.length === 1) {
            selectPlayer(foundPlayers[0].playerInfo);
        } else {
            resultsOutput.innerHTML = `<p class="text-slate-300 mb-4">Found ${foundPlayers.length} players. Please select one:</p>`;
            foundPlayers.forEach((p, index) => {
                const btn = document.createElement('button');
                btn.className = 'player-select-btn';
                btn.dataset.playerIndex = index;
                btn.textContent = `${p.playerInfo.fn} ${p.playerInfo.ln || ''} (Team: ${p.teamName})`;
                resultsOutput.appendChild(btn);
            });
        }
    }

    /**
     * Handles the click event for the results output.
     * @param {Event} e The event object.
     */
    resultsOutput.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.player-select-btn')) {
            const playerIndex = parseInt(e.target.dataset.playerIndex);
            selectPlayer(foundPlayers[playerIndex].playerInfo);
        }
    });

    /**
     * Selects a player and shows the modification screen.
     * @param {object} playerObject The player object to edit.
     */
    function selectPlayer(playerObject) {
        selectedPlayerObject = playerObject;
        populateEditors();
        showScreen(modificationScreen);
    }

    /**
     * Populates the editor fields with the selected player's data.
     */
    function populateEditors() {
        if (!selectedPlayerObject) return;
        document.getElementById('modification-title').textContent = `EDITING: ${selectedPlayerObject.fn || ''} ${selectedPlayerObject.ln || ''}`;
        inspectorBarsContainer.innerHTML = '';
        inspectorBarsContainer.appendChild(createAttributeInspectorBar());
        inspectorBarsContainer.appendChild(createSkillsInspectorBar());
        populateGeneralMods();
        populateEconomyMods();
    }

    /**
     * Creates a table row with a label and an input element.
     * @param {string} label The label text.
     * @param {HTMLElement} input The input element.
     * @returns {HTMLElement} The created row element.
     */
    function createRow(label, input) { const row = document.createElement('label'); row.className = 'flex items-center justify-between'; row.innerHTML = `<span class="font-semibold text-slate-300">${label}</span>`; row.appendChild(input); return row; };

    /**
     * Populates the general player information modification fields.
     */
    function populateGeneralMods() {
        generalModsContainer.innerHTML = '';
        const createInput = (mod, type, value, widthClass = 'w-40') => { const i = document.createElement('input'); i.type = type; i.className = `mod-input ${widthClass}`; i.dataset.mod = mod; i.value = value; return i; };
        const createSelect = (mod, options, selectedVal) => { const s = document.createElement('select'); s.className = 'mod-select'; s.dataset.mod = mod; s.innerHTML = options; s.value = selectedVal; return s; };

        generalModsContainer.appendChild(createRow('First Name', createInput('fn', 'text', selectedPlayerObject.fn || '')));
        generalModsContainer.appendChild(createRow('Last Name', createInput('ln', 'text', selectedPlayerObject.ln || '')));
        generalModsContainer.appendChild(createRow('Age', createInput('age', 'number', selectedPlayerObject.age || '', 'w-24')));
        const heightOpts = Array.from({length: 49}, (_, i) => 48 + i).map(inch => `<option value="${inch}">${Math.floor(inch/12)}' ${inch%12}"</option>`).join('');
        generalModsContainer.appendChild(createRow('Height', createSelect('ht', heightOpts, selectedPlayerObject.ht)));
        generalModsContainer.appendChild(createRow('Weight (lbs)', createInput('wt', 'number', selectedPlayerObject.wt || '', 'w-24')));
        const posOpts = Object.entries({1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C'}).map(([val, name]) => `<option value="${val}">${name}</option>`).join('');
        generalModsContainer.appendChild(createRow('Position', createSelect('pos', posOpts, selectedPlayerObject.pos)));
        const potOpts = [1,2,3,4,5].map(s => `<option value="${s*2}">${'★'.repeat(s)}</option>`).join('');
        generalModsContainer.appendChild(createRow('Potential', createSelect('pot', potOpts, selectedPlayerObject.pot)));
        generalModsContainer.appendChild(createRow('Build Name', createInput('arc', 'text', selectedPlayerObject.arc || '')));
    }

    /**
     * Populates the game economy modification fields.
     */
    function populateEconomyMods() {
        economyModsContainer.innerHTML = '';
        const career = saveData.seasonLeagues[selectedLeagueIndex]?.career;
        if (!career) return;

        const coinsContainer = document.createElement('div');
        const coinsInput = document.createElement('input'); coinsInput.type = 'number'; coinsInput.className = 'mod-input w-40'; coinsInput.dataset.mod = 'coins'; coinsInput.value = career.coins || 0;
        coinsContainer.appendChild(createRow('Coins', coinsInput));
        const coinsNote = document.createElement('p'); coinsNote.className = 'text-xs text-slate-400 text-right mt-1'; coinsNote.textContent = 'Recommended: under 1,000,000';
        coinsContainer.appendChild(coinsNote);
        economyModsContainer.appendChild(coinsContainer);

        const fansInput = document.createElement('input'); fansInput.type = 'number'; fansInput.className = 'mod-input w-40'; fansInput.dataset.mod = 'fans'; fansInput.value = career.fans || 0;
        economyModsContainer.appendChild(createRow('Fans', fansInput));
    }

    /**
     * Applies the general player information modifications to the save data.
     */
    function applyGeneralMods() {
        if (!selectedPlayerObject) return;
        generalModsContainer.querySelectorAll('[data-mod]').forEach(input => {
            const modType = input.dataset.mod; let value = input.value;
            if (input.type === 'number' || input.tagName === 'SELECT') value = parseInt(value);
            if (value || value === 0) selectedPlayerObject[modType] = value;
        });
    }

    /**
     * Applies the game economy modifications to the save data.
     */
    function applyEconomyMods() {
        const career = saveData.seasonLeagues[selectedLeagueIndex]?.career;
        if (!career) return;
        economyModsContainer.querySelectorAll('[data-mod]').forEach(input => {
            const modType = input.dataset.mod;
            const value = parseInt(input.value);
            if (!isNaN(value)) career[modType] = value;
        });
    }

    /**
     * Downloads the modified save data as a JSON file.
     */
    function downloadSaveFile() {
        if (!saveData) { showToast('No data to save!', 'error'); return; }
        applyGeneralMods();
        applyEconomyMods();
        try {
            const dataStr = JSON.stringify(saveData);
            const dataBlob = new Blob([dataStr], {type: "application/octet-stream"});
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a'); a.href = url;
            a.download = "modded_save_by_SaveXF";
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('File saved successfully!');
        } catch (e) { showToast('Failed to save file.', 'error'); console.error(e); }
    }

    let toastTimeout;
    /**
     * Shows a toast notification.
     * @param {string} message The message to display.
     * @param {string} [type='success'] The type of toast (e.g., 'success', 'error').
     */
    function showToast(message, type = 'success') {
        if (toastTimeout) clearTimeout(toastTimeout);
        notificationToast.textContent = message;
        notificationToast.className = 'show';
        if (type === 'error') notificationToast.classList.add('error');
        toastTimeout = setTimeout(() => { notificationToast.classList.remove('show'); }, 3000);
    }

    /**
     * Creates the attribute inspector bar.
     * @returns {HTMLElement} The attribute inspector bar element.
     */
    function createAttributeInspectorBar() {
        const bar = document.createElement('div');
        bar.className = 'inspector-bar';
        bar.innerHTML = `<h3 class="text-lg font-bold">ATTRIBUTES</h3><div class="summary-bar-container"></div><button class="pixel-btn pixel-btn-subtle clickable">Edit</button>`;
        const summaryContainer = bar.querySelector('.summary-bar-container');
        if (selectedPlayerObject && selectedPlayerObject.attributes) {
            const allAttrs = Object.values(ATTRIBUTE_CATEGORIES).flatMap(cat => Object.keys(cat));
            allAttrs.forEach(attrKey => {
                const [currentVal, potentialVal] = selectedPlayerObject.attributes[attrKey] || [0, 0];
                const barDiv = document.createElement('div'); barDiv.className = 'summary-bar';
                const fillDiv = document.createElement('div'); fillDiv.className = 'summary-bar-fill';
                fillDiv.style.height = `${(currentVal / 20) * 100}%`;
                fillDiv.style.backgroundColor = getAttributeColor(attrKey);
                barDiv.style.setProperty('--potential-left', `${(potentialVal / 20) * 100}%`);
                barDiv.appendChild(fillDiv);
                summaryContainer.appendChild(barDiv);
            });
        }
        bar.querySelector('button').onclick = () => { populateAttributeEditor(); attributeEditorModal.classList.remove('hidden'); };
        return bar;
    }

    /**
     * Creates the skills and badges inspector bar.
     * @returns {HTMLElement} The skills and badges inspector bar element.
     */
    function createSkillsInspectorBar() {
        const bar = document.createElement('div');
        bar.className = 'inspector-bar';
        bar.innerHTML = `<h3 class="text-lg font-bold">SKILLS & BADGES</h3><p class="text-slate-300 text-lg">${(selectedPlayerObject.skills || []).filter(s => s.equipped).length} / 24 Equipped</p><button class="pixel-btn pixel-btn-subtle clickable">Edit</button>`;
        bar.querySelector('button').onclick = () => { populateSkillsEditor(); skillsEditorModal.classList.remove('hidden'); };
        return bar;
    }

    /**
     * Gets the color for a given attribute.
     * @param {string} attrKey The attribute key.
     * @returns {string} The color hex code.
     */
    function getAttributeColor(attrKey) {
        if (Object.keys(ATTRIBUTE_CATEGORIES.Finishing).includes(attrKey)) return '#F97316';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Shooting).includes(attrKey)) return '#F59E0B';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Creating).includes(attrKey)) return '#84CC16';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Defense).includes(attrKey)) return '#EF4444';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Physicals).includes(attrKey)) return '#3B82F6';
        return '#9CA3AF';
    }

    /**
     * Populates the attribute editor modal with the player's attributes.
     */
    function populateAttributeEditor() {
        attributeEditorModal.innerHTML = `<div class="modal-content max-w-5xl"><h3 class="pixel-header text-center">EDIT ATTRIBUTES</h3><div id="attribute-categories" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 text-lg"></div><div class="flex justify-between mt-6"><button id="attr-max-all" class="pixel-btn clickable">Max All</button><div><button id="attr-cancel" class="pixel-btn pixel-btn-subtle clickable mr-2">Cancel</button><button id="attr-apply" class="pixel-btn pixel-btn-success clickable">Apply</button></div></div></div>`;
        const container = attributeEditorModal.querySelector('#attribute-categories');
        for (const [category, attrs] of Object.entries(ATTRIBUTE_CATEGORIES)) {
            const catDiv = document.createElement('div'); catDiv.className = 'space-y-3 bg-slate-800 p-3'; catDiv.innerHTML = `<h4 class="text-lg font-bold mb-2" style="color: ${getAttributeColor(Object.keys(attrs)[0])}">${category}</h4>`;
            for (const [attrKey, attrName] of Object.entries(attrs)) {
                const [currentVal, potentialVal] = selectedPlayerObject.attributes[attrKey] || [0, 0];
                const itemDiv = document.createElement('div'); const label = document.createElement('label'); label.className = 'flex items-center justify-between font-semibold'; label.innerHTML = `<span>${attrName}</span>`;
                const inputsContainer = document.createElement('div'); inputsContainer.className = 'flex items-center gap-2';
                const currentInput = document.createElement('input'); currentInput.type = 'number'; currentInput.className = 'mod-input'; currentInput.dataset.attr = attrKey; currentInput.dataset.type = 'current'; currentInput.min = 1; currentInput.max = 20; currentInput.value = currentVal;
                const potentialInput = document.createElement('input'); potentialInput.type = 'number'; potentialInput.className = 'mod-input'; potentialInput.dataset.attr = attrKey; potentialInput.dataset.type = 'potential'; potentialInput.min = 1; potentialInput.max = 20; potentialInput.value = potentialVal;
                const progressBar = document.createElement('div'); progressBar.className = 'attr-progress-bar mt-1'; const progressPotential = document.createElement('div'); progressPotential.className = 'attr-progress-potential'; const progressFill = document.createElement('div'); progressFill.className = 'attr-progress-fill';
                const updateBars = () => { let current = parseInt(currentInput.value) || 0; let potential = parseInt(potentialInput.value) || 0; if (current > potential) { current = potential; currentInput.value = potential; } progressPotential.style.width = `${(potential / 20) * 100}%`; progressFill.style.width = `${(current / 20) * 100}%`; progressPotential.style.backgroundColor = getAttributeColor(attrKey); progressFill.style.backgroundColor = getAttributeColor(attrKey); };
                updateBars(); progressBar.appendChild(progressPotential); progressBar.appendChild(progressFill); inputsContainer.appendChild(currentInput); inputsContainer.appendChild(potentialInput); label.appendChild(inputsContainer); itemDiv.appendChild(label); itemDiv.appendChild(progressBar); catDiv.appendChild(itemDiv);
                currentInput.addEventListener('input', updateBars); potentialInput.addEventListener('input', updateBars);
            }
            container.appendChild(catDiv);
        }
        attributeEditorModal.querySelector('#attr-cancel').onclick = () => attributeEditorModal.classList.add('hidden');
        attributeEditorModal.querySelector('#attr-max-all').onclick = () => { attributeEditorModal.querySelectorAll('input[type="number"]').forEach(input => { input.value = 20; input.dispatchEvent(new Event('input')); }); };
        attributeEditorModal.querySelector('#attr-apply').onclick = () => {
            attributeEditorModal.querySelectorAll('input[type="number"]').forEach(input => {
                const attrKey = input.dataset.attr; const type = input.dataset.type; const value = parseInt(input.value);
                if (type === 'current') selectedPlayerObject.attributes[attrKey][0] = value;
                else selectedPlayerObject.attributes[attrKey][1] = value;
            });
            attributeEditorModal.classList.add('hidden');
            populateEditors(); showToast('Attributes applied!');
        };
    }

    /**
     * Populates the skills editor modal with the player's skills.
     */
    function populateSkillsEditor() {
        skillsEditorModal.innerHTML = `<div class="modal-content"><h3 class="pixel-header text-center">EDIT SKILLS & BADGES</h3><div id="skill-categories" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 text-lg"></div><div class="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4"><div class="flex gap-2 flex-wrap justify-center"><button id="skill-select-all" class="pixel-btn clickable">Select All</button><div class="flex items-center gap-1 bg-slate-700 p-1"><span class="text-lg px-2">Set All:</span><button data-level="1" class="set-level-btn pixel-btn pixel-btn-subtle text-lg clickable">1</button><button data-level="2" class="set-level-btn pixel-btn pixel-btn-subtle text-lg clickable">2</button><button data-level="3" class="set-level-btn pixel-btn pixel-btn-subtle text-lg clickable">3</button></div></div><div><button id="skill-cancel" class="pixel-btn pixel-btn-subtle clickable mr-2">Cancel</button><button id="skill-apply" class="pixel-btn pixel-btn-success clickable">Apply</button></div></div></div>`;
        const container = skillsEditorModal.querySelector('#skill-categories');
        const playerSkillsMap = new Map((selectedPlayerObject.skills || []).map(s => [s.id, s]));
        for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
            const catDiv = document.createElement('div'); catDiv.innerHTML = `<h4 class="text-2xl font-bold mb-3" style="color:${getAttributeColor(Object.keys(ATTRIBUTE_CATEGORIES).find(c => c.startsWith(category.slice(0,2)))) || '#fff'}">${category}</h4>`; const skillList = document.createElement('div'); skillList.className = 'space-y-3';
            for (const [skillId, skillName] of Object.entries(skills)) {
                const currentSkill = playerSkillsMap.get(skillId); const isChecked = currentSkill ? currentSkill.equipped : false; const currentLevel = currentSkill ? currentSkill.level : 1;
                const itemDiv = document.createElement('div'); itemDiv.dataset.skillItem = skillId; const controlRow = document.createElement('div'); controlRow.className = 'flex items-center justify-start gap-2';
                const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'mod-checkbox flex-shrink-0 w-5 h-5'; checkbox.value = skillId; checkbox.checked = isChecked;
                const nameSpan = document.createElement('span'); nameSpan.className = 'flex-grow font-semibold'; nameSpan.textContent = skillName;
                const select = document.createElement('select'); select.className = 'level-select flex-shrink-0'; select.innerHTML = `<option value="1" ${currentLevel === 1 ? 'selected' : ''}>Lvl 1</option><option value="2" ${currentLevel === 2 ? 'selected' : ''}>Lvl 2</option><option value="3" ${currentLevel === 3 ? 'selected' : ''}>Lvl 3</option>`;
                controlRow.appendChild(checkbox); controlRow.appendChild(nameSpan); controlRow.appendChild(select);
                itemDiv.appendChild(controlRow); skillList.appendChild(itemDiv);
            }
            catDiv.appendChild(skillList); container.appendChild(catDiv);
        }
        skillsEditorModal.querySelector('#skill-cancel').onclick = () => skillsEditorModal.classList.add('hidden');
        skillsEditorModal.querySelector('#skill-select-all').onclick = () => { const allCheckboxes = skillsEditorModal.querySelectorAll('input[type="checkbox"]'); const allSelected = [...allCheckboxes].every(cb => cb.checked); allCheckboxes.forEach(cb => cb.checked = !allSelected); };
        skillsEditorModal.querySelectorAll('.set-level-btn').forEach(button => { button.addEventListener('click', (e) => { const levelToSet = e.target.dataset.level; skillsEditorModal.querySelectorAll('.level-select').forEach(sel => sel.value = levelToSet); }); });
        skillsEditorModal.querySelector('#skill-apply').onclick = () => {
            const newSkills = [];
            skillsEditorModal.querySelectorAll('[data-skill-item]').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const select = item.querySelector('select.level-select');
                newSkills.push({ id: checkbox.value, xp: 0, level: parseInt(select.value), equipped: checkbox.checked });
            });
            selectedPlayerObject.skills = newSkills;
            skillsEditorModal.classList.add('hidden');
            populateEditors(); showToast('Skills applied!');
        };
    }

    /**
     * Handles the click event for the player contract button.
     */
    playerContractBtn.addEventListener('click', () => {
        if (!selectedPlayerObject) return;
        contractEditorModal.innerHTML = `
            <div class="modal-content max-w-lg">
                <h3 class="pixel-header text-center">Edit Contract</h3>
                <div class="space-y-4 text-xl">
                    <label class="flex items-center justify-between"><span>Years (yrs)</span><input type="number" id="contract-yrs" class="mod-input" value="${selectedPlayerObject.contract.yrs}"></label>
                    <label class="flex items-center justify-between"><span>Salary (sal)</span><input type="number" id="contract-sal" class="mod-input" value="${selectedPlayerObject.contract.sal}"></label>
                    <p class="text-sm text-slate-400 text-right -mt-2">Note: 1 = $1M</p>
                    <label class="flex items-center justify-between"><span>No Trade Clause</span><select id="contract-noTrd" class="mod-select"><option value="true" ${selectedPlayerObject.contract.noTrd ? 'selected' : ''}>Yes</option><option value="false" ${!selectedPlayerObject.contract.noTrd ? 'selected' : ''}>No</option></select></label>
                </div>
                <div class="flex justify-end mt-6">
                    <button class="pixel-btn pixel-btn-subtle clickable mr-2">Cancel</button>
                    <button class="pixel-btn pixel-btn-success clickable">Apply</button>
                </div>
            </div>`;
        contractEditorModal.classList.remove('hidden');
        contractEditorModal.querySelector('.pixel-btn-subtle').onclick = () => contractEditorModal.classList.add('hidden');
        contractEditorModal.querySelector('.pixel-btn-success').onclick = () => {
            selectedPlayerObject.contract.yrs = parseInt(document.getElementById('contract-yrs').value);
            selectedPlayerObject.contract.sal = parseInt(document.getElementById('contract-sal').value);
            selectedPlayerObject.contract.noTrd = document.getElementById('contract-noTrd').value === 'true';
            contractEditorModal.classList.add('hidden');
            showToast('Contract updated!');
        };
    });

    /**
     * Handles the click event for the player tendencies button.
     */
    playerTendenciesBtn.addEventListener('click', () => {
        if (!selectedPlayerObject) return;
        let tendenciesHTML = '';
        for (const [key, value] of Object.entries(selectedPlayerObject.tendencies)) {
            tendenciesHTML += `
                <label class="flex items-center justify-between">
                    <span class="font-semibold capitalize">${key}</span>
                    <select class="mod-select tendency-select" data-key="${key}">
                        <option value="5" ${value >= 0 ? 'selected' : ''}>Good</option>
                        <option value="-5" ${value < 0 ? 'selected' : ''}>Bad</option>
                    </select>
                </label>`;
        }
        tendenciesEditorModal.innerHTML = `
            <div class="modal-content max-w-2xl">
                <h3 class="pixel-header text-center">Edit Tendencies</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xl">${tendenciesHTML}</div>
                <div class="flex justify-between mt-6">
                    <button class="pixel-btn clickable">All Good</button>
                    <div>
                        <button class="pixel-btn pixel-btn-subtle clickable mr-2">Cancel</button>
                        <button class="pixel-btn pixel-btn-success clickable">Apply</button>
                    </div>
                </div>
            </div>`;
        tendenciesEditorModal.classList.remove('hidden');
        tendenciesEditorModal.querySelector('.pixel-btn-subtle').onclick = () => tendenciesEditorModal.classList.add('hidden');
        tendenciesEditorModal.querySelector('.pixel-btn.clickable').onclick = () => {
            tendenciesEditorModal.querySelectorAll('.tendency-select').forEach(sel => sel.value = '5');
        };
        tendenciesEditorModal.querySelector('.pixel-btn-success').onclick = () => {
            tendenciesEditorModal.querySelectorAll('.tendency-select').forEach(sel => {
                selectedPlayerObject.tendencies[sel.dataset.key] = parseInt(sel.value);
            });
            tendenciesEditorModal.classList.add('hidden');
            showToast('Tendencies updated!');
        };
    });
});
