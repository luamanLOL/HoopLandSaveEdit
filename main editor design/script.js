document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const inspectorBarsContainer = document.getElementById('inspector-bars');
    const generalModsContainer = document.getElementById('general-mods-container');
    const attributeEditorModal = document.getElementById('attribute-editor-modal');
    const skillsEditorModal = document.getElementById('skills-editor-modal');
    const attributeCategoriesContainer = document.getElementById('attribute-categories');
    const skillCategoriesContainer = document.getElementById('skill-categories');
    const attrMaxAllBtn = document.getElementById('attr-max-all');
    const attrCancelBtn = document.getElementById('attr-cancel');
    const attrApplyBtn = document.getElementById('attr-apply');
    const skillSelectAllBtn = document.getElementById('skill-select-all');
    const skillCancelBtn = document.getElementById('skill-cancel');
    const skillApplyBtn = document.getElementById('skill-apply');
    const applyAllButton = document.getElementById('apply-all-button');
    const notificationToast = document.getElementById('notification-toast');

    // New button references
    const playerContractBtn = document.getElementById('player-contract-btn');
    const playerTendenciesBtn = document.getElementById('player-tendencies-btn');
    const playerStatsBtn = document.getElementById('player-stats-btn');
    const leagueTeamAttributesBtn = document.getElementById('league-team-attributes-btn');
    const awardsBtn = document.getElementById('awards-btn');
    const coinsBtn = document.getElementById('coins-btn');
    const fansBtn = document.getElementById('fans-btn');
    const coachModdingBtn = document.getElementById('coach-modding-btn');
    const createPlayerBtn = document.getElementById('create-player-btn');


    // --- Mock Data ---
    let mockPlayer = {
        fn: "Test", ln: "Player", age: 22, ht: 82, wt: 220, pos: 3, pot: 10, arc: "Reaper",
        attributes: { "LAY": [10,15], "DNK": [9,18], "INS": [8,12], "MID": [12,16], "TPT": [14,20], "FTS": [15,15], "DRB": [11,19], "PAS": [13,13], "ORE": [5,10], "DRE": [7,9], "STL": [9,18], "BLK": [6,11], "STR": [10,14], "SPD": [16,17], "STM": [18,20] },
        skills: [ { id: "HIG", xp: 0, level: 1, equipped: true }, { id: "SPO", xp: 0, level: 2, equipped: true }, { id: "CLA", xp: 0, level: 3, equipped: true } ]
    };

    // --- Data Definitions ---
    const ATTRIBUTE_CATEGORIES = {
        Finishing: { LAY: "Layup", DNK: "Dunking", INS: "Inside Shooting" },
        Shooting: { MID: "Mid Range", TPT: "Three Point", FTS: "Free Throw" },
        Creating: { DRB: "Dribbling", PAS: "Passing", ORE: "Offensive Rebounding" },
        Defense: { DRE: "Defensive Rebounding", STL: "Stealing", BLK: "Blocking" },
        Physicals: { STR: "Strength", SPD: "Speed", STM: "Stamina" }
    };
    const SKILL_CATEGORIES = {
        Finishing: { HIG: "Highlight Reel", CRA: "Crafty", SOF: "Soft Touch", TEA: "Tear Dropper", BUL: "Bully", DUN: "Dunk Artist" },
        Shooting: { SPO: "Sparkplug", CLU: "Clutch Gene", TWO: "Spot Up", VOL: "Volume Shooter", LIM: "Limitless", HOT: "Unfazed" },
        Creating: { DIM: "Dimer", CHE: "Chef", UNF: "Cleanup Crew", SNA: "Step Dancer", FOO: "Foot Surgeon", BAL: "Hot Potato" },
        Defense: { CLA: "Clamps", LOC: "Locked In", MAG: "Magnet", CLE: "Two Way", STE: "Ball Hawk", SPA: "Snatcher" }
    };
    const SKILL_DESCRIPTIONS = {
        HIG: "Decreased stamina used for dunks.", CRA: "Increased accuracy on reverse and contact layups and ability to lay it up mid-dunk.", SOF: "Increased hookshot accuracy.", TEA: "Increased floater accuracy.", BUL: "Increased chance of opponent falling when backing down.", DUN: "Increased dunk success and ability to perform acrobatic dunks.",
        SPO: "Start off hot when coming off the bench for the first time.", CLU: "Increased accuracy in clutch situations.", TWO: "Increased jumpshot accuracy after receiving a pass.", VOL: "Decreased stamina used for jumpshots.", LIM: "Increased accuracy from shots deeper than 25 feet.", HOT: "Increased accuracy on contested mid-range shots.",
        DIM: "Increased teammate shot accuracy after a pass.", CHE: "Catch on fire if teammate catches fire after an assist.", UNF: "Increased shot accuracy after an offensive rebound.", SNA: "Increased shot accuracy after a step back, side step, or jump stop.", FOO: "Increased time opponent stays on the floor after an ankle breaker.", BAL: "If on fire, the ball will stay hot after a pass.",
        CLA: "Increased shot contest strength.", LOC: "Locked In", MAG: "Magnet", CLE: "Two Way", STE: "Ball Hawk", SPA: "Snatcher" }
    ;

    // --- UI Population ---
    function populateEditors() {
        inspectorBarsContainer.innerHTML = '';
        inspectorBarsContainer.appendChild(createAttributeInspectorBar());
        inspectorBarsContainer.appendChild(createSkillsInspectorBar());
        populateGeneralMods();
    }

    function createAttributeInspectorBar() {
        const bar = document.createElement('div');
        bar.className = 'inspector-bar';
        const title = document.createElement('h3');
        title.className = 'text-lg font-bold';
        title.textContent = 'ATTRIBUTES';
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-bar-container';
        const allAttrs = Object.values(ATTRIBUTE_CATEGORIES).flatMap(cat => Object.keys(cat));
        allAttrs.forEach(attrKey => {
            const [currentVal, potentialVal] = mockPlayer.attributes[attrKey] || [0, 0];
            const barDiv = document.createElement('div');
            barDiv.className = 'summary-bar';
            const fillDiv = document.createElement('div');
            fillDiv.className = 'summary-bar-fill';
            fillDiv.style.height = `${(currentVal / 20) * 100}%`;
            fillDiv.style.backgroundColor = getAttributeColor(attrKey);
            barDiv.style.setProperty('--potential-left', `${(potentialVal / 20) * 100}%`);
            barDiv.appendChild(fillDiv);
            summaryContainer.appendChild(barDiv);
        });
        const editButton = document.createElement('button');
        editButton.className = 'text-base bg-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-500 clickable';
        editButton.textContent = 'Edit';
        editButton.onclick = () => {
            populateAttributeEditor();
            attributeEditorModal.classList.remove('hidden');
        };
        bar.appendChild(title);
        bar.appendChild(summaryContainer);
        bar.appendChild(editButton);
        return bar;
    }

    function createSkillsInspectorBar() {
        const bar = document.createElement('div');
        bar.className = 'inspector-bar';
        bar.innerHTML = `
            <h3 class="text-lg font-bold">SKILLS & BADGES</h3>
            <p class="text-gray-300 text-sm">${(mockPlayer.skills || []).filter(s => s.equipped).length} / 24 Equipped</p>
            <button class="text-base bg-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-500 clickable">Edit</button>
        `;
        bar.querySelector('button').addEventListener('click', () => {
            populateSkillsEditor();
            skillsEditorModal.classList.remove('hidden');
        });
        return bar;
    }

    function getAttributeColor(attrKey) {
        if (Object.keys(ATTRIBUTE_CATEGORIES.Finishing).includes(attrKey)) return '#60A5FA';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Shooting).includes(attrKey)) return '#4ADE80';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Creating).includes(attrKey)) return '#FACC15';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Defense).includes(attrKey)) return '#F87171';
        if (Object.keys(ATTRIBUTE_CATEGORIES.Physicals).includes(attrKey)) return '#C084FC';
        return '#9CA3AF';
    }

    // --- Modal Control & Population ---
    attrCancelBtn.addEventListener('click', () => attributeEditorModal.classList.add('hidden'));
    skillCancelBtn.addEventListener('click', () => skillsEditorModal.classList.add('hidden'));
    
    function populateAttributeEditor() {
        attributeCategoriesContainer.innerHTML = '';
        for (const [category, attrs] of Object.entries(ATTRIBUTE_CATEGORIES)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'space-y-3 bg-gray-800 p-3 rounded-lg';
            catDiv.innerHTML = `<h4 class="text-lg font-bold mb-2 text-blue-400">${category}</h4>`;
            for (const [attrKey, attrName] of Object.entries(attrs)) {
                const [currentVal, potentialVal] = mockPlayer.attributes[attrKey] || [0, 0];
                const itemDiv = document.createElement('div');
                const label = document.createElement('label');
                label.className = 'flex items-center justify-between text-base font-semibold';
                label.innerHTML = `<span>${attrName}</span>`;
                const inputsContainer = document.createElement('div');
                inputsContainer.className = 'flex items-center gap-2';
                const currentInput = document.createElement('input');
                currentInput.type = 'number'; currentInput.className = 'mod-input';
                currentInput.dataset.attr = attrKey; currentInput.dataset.type = 'current';
                currentInput.min = 1; currentInput.max = 20; currentInput.value = currentVal;
                const potentialInput = document.createElement('input');
                potentialInput.type = 'number'; potentialInput.className = 'mod-input';
                potentialInput.dataset.attr = attrKey; potentialInput.dataset.type = 'potential';
                potentialInput.min = 1; potentialInput.max = 20; potentialInput.value = potentialVal;
                const progressBar = document.createElement('div');
                progressBar.className = 'attr-progress-bar mt-1';
                const progressPotential = document.createElement('div');
                progressPotential.className = 'attr-progress-potential';
                const progressFill = document.createElement('div');
                progressFill.className = 'attr-progress-fill';
                const updateBars = () => {
                    let current = parseInt(currentInput.value) || 0;
                    let potential = parseInt(potentialInput.value) || 0;
                    if (current > potential) { current = potential; currentInput.value = potential; }
                    progressPotential.style.width = `${(potential / 20) * 100}%`;
                    progressFill.style.width = `${(current / 20) * 100}%`;
                    progressPotential.style.backgroundColor = getAttributeColor(attrKey);
                    progressFill.style.backgroundColor = getAttributeColor(attrKey);
                };
                updateBars();
                progressBar.appendChild(progressPotential);
                progressBar.appendChild(progressFill);
                inputsContainer.appendChild(currentInput);
                inputsContainer.appendChild(potentialInput);
                label.appendChild(inputsContainer);
                itemDiv.appendChild(label);
                itemDiv.appendChild(progressBar);
                catDiv.appendChild(itemDiv);
                currentInput.addEventListener('input', updateBars);
                potentialInput.addEventListener('input', updateBars);
            }
            attributeCategoriesContainer.appendChild(catDiv);
        }
    }

    function populateSkillsEditor() {
        skillCategoriesContainer.innerHTML = '';
        const playerSkillsMap = new Map((mockPlayer.skills || []).map(s => [s.id, s]));
        for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
            const catDiv = document.createElement('div');
            catDiv.innerHTML = `<h4 class="text-xl font-bold mb-3 text-blue-400">${category}</h4>`;
            const skillList = document.createElement('div');
            skillList.className = 'space-y-3';
            for (const [skillId, skillName] of Object.entries(skills)) {
                const currentSkill = playerSkillsMap.get(skillId);
                const isChecked = currentSkill ? currentSkill.equipped : false;
                const currentLevel = currentSkill ? currentSkill.level : 1;
                const itemDiv = document.createElement('div');
                itemDiv.dataset.skillItem = skillId; // Add a specific data attribute
                const controlRow = document.createElement('div');
                controlRow.className = 'flex items-center justify-start gap-2';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.className = 'mod-checkbox flex-shrink-0';
                checkbox.value = skillId; checkbox.checked = isChecked;
                const nameSpan = document.createElement('span');
                nameSpan.className = 'flex-grow font-semibold'; nameSpan.textContent = skillName;
                const select = document.createElement('select');
                select.className = 'level-select flex-shrink-0';
                select.innerHTML = `<option value="1" ${currentLevel === 1 ? 'selected' : ''}>Lvl 1</option><option value="2" ${currentLevel === 2 ? 'selected' : ''}>Lvl 2</option><option value="3" ${currentLevel === 3 ? 'selected' : ''}>Lvl 3</option>`;
                controlRow.appendChild(checkbox); controlRow.appendChild(nameSpan); controlRow.appendChild(select);
                const descP = document.createElement('p');
                descP.className = 'text-xs text-gray-400 pl-7 -mt-1';
                descP.textContent = SKILL_DESCRIPTIONS[skillId] || "No description available.";
                itemDiv.appendChild(controlRow); itemDiv.appendChild(descP);
                skillList.appendChild(itemDiv);
            }
            catDiv.appendChild(skillList);
            skillCategoriesContainer.appendChild(catDiv);
        }
    }

    function populateGeneralMods() {
        generalModsContainer.innerHTML = '';
        const createRow = (label, input) => {
            const row = document.createElement('label');
            row.className = 'flex items-center justify-between';
            row.innerHTML = `<span class="font-semibold">${label}</span>`;
            row.appendChild(input);
            return row;
        };
        
        const fnInput = document.createElement('input');
        fnInput.type = 'text'; fnInput.className = 'mod-input w-40'; fnInput.dataset.mod = 'firstName';
        fnInput.value = mockPlayer.fn || '';
        generalModsContainer.appendChild(createRow('First Name', fnInput));

        const lnInput = document.createElement('input');
        lnInput.type = 'text'; lnInput.className = 'mod-input w-40'; lnInput.dataset.mod = 'lastName';
        lnInput.value = mockPlayer.ln || '';
        generalModsContainer.appendChild(createRow('Last Name', lnInput));

        const ageInput = document.createElement('input');
        ageInput.type = 'number'; ageInput.className = 'mod-input'; ageInput.dataset.mod = 'age';
        ageInput.value = mockPlayer.age || '';
        generalModsContainer.appendChild(createRow('Age', ageInput));

        const heightSelect = document.createElement('select');
        heightSelect.className = 'mod-select'; heightSelect.dataset.mod = 'height';
        heightSelect.innerHTML = '<option value="">--</option>';
        // Restored full height range for modding
        for (let ft = 1; ft <= 12; ft++) {
            for (let inch = 0; inch < 12; inch++) {
                if (ft === 12 && inch > 0) break;
                const totalInches = ft * 12 + inch;
                const selected = totalInches === mockPlayer.ht ? 'selected' : '';
                heightSelect.innerHTML += `<option value="${totalInches}" ${selected}>${ft}' ${inch}"</option>`;
            }
        }
        generalModsContainer.appendChild(createRow('Height', heightSelect));
        
        const weightInput = document.createElement('input');
        weightInput.type = 'number'; weightInput.className = 'mod-input'; weightInput.dataset.mod = 'weight';
        weightInput.value = mockPlayer.wt || '';
        generalModsContainer.appendChild(createRow('Weight (lbs)', weightInput));

        const posSelect = document.createElement('select');
        posSelect.className = 'mod-select'; posSelect.dataset.mod = 'position';
        posSelect.innerHTML = '<option value="">--</option>' + Object.entries({1: 'PG', 2: 'SG', 3: 'SF', 4: 'PF', 5: 'C'}).map(([val, name]) => `<option value="${val}" ${mockPlayer.pos == val ? 'selected' : ''}>${name}</option>`).join('');
        generalModsContainer.appendChild(createRow('Position', posSelect));

        const potSelect = document.createElement('select');
        potSelect.className = 'mod-select'; potSelect.dataset.mod = 'potential';
        // Reverted to 5-star system
        potSelect.innerHTML = '<option value="">--</option>' + [1,2,3,4,5].map(s => `<option value="${s*2}" ${mockPlayer.pot == s*2 ? 'selected' : ''}>${'★'.repeat(s)}</option>`).join('');
        generalModsContainer.appendChild(createRow('Potential', potSelect));

        const buildInput = document.createElement('input');
        buildInput.type = 'text'; buildInput.className = 'mod-input w-40'; buildInput.dataset.mod = 'buildName';
        buildInput.value = mockPlayer.arc || '';
        generalModsContainer.appendChild(createRow('Build Name', buildInput));
    }

    // --- Notification Toast Logic ---
    let toastTimeout;
    function showToast(message, duration = 3000) {
        if (toastTimeout) clearTimeout(toastTimeout);
        notificationToast.textContent = message;
        notificationToast.classList.add('show');
        toastTimeout = setTimeout(() => {
            notificationToast.classList.remove('show');
        }, duration);
    }

    // --- Button Logic ---
    attrMaxAllBtn.addEventListener('click', () => {
        attributeCategoriesContainer.querySelectorAll('input[type="number"]').forEach(input => {
            input.value = 20;
            input.dispatchEvent(new Event('input'));
        });
    });
    skillSelectAllBtn.addEventListener('click', () => {
        const allCheckboxes = skillCategoriesContainer.querySelectorAll('input[type="checkbox"]');
        const allSelected = [...allCheckboxes].every(cb => cb.checked);
        allCheckboxes.forEach(cb => cb.checked = !allSelected);
    });
    skillsEditorModal.querySelectorAll('.set-level-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const levelToSet = e.target.dataset.level;
            const allSelects = skillCategoriesContainer.querySelectorAll('.level-select');
            allSelects.forEach(sel => sel.value = levelToSet);
        });
    });
    
    attrApplyBtn.addEventListener('click', () => {
        const inputs = attributeCategoriesContainer.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            if (input.value) {
                const attrKey = input.dataset.attr;
                const type = input.dataset.type;
                const value = parseInt(input.value);
                if (mockPlayer.attributes && mockPlayer.attributes[attrKey]) {
                    if (type === 'current') mockPlayer.attributes[attrKey][0] = value;
                    if (type === 'potential') mockPlayer.attributes[attrKey][1] = value;
                }
            }
        });
        attributeEditorModal.classList.add('hidden');
        populateEditors();
        showToast('Attribute changes applied!');
    });
    
    skillApplyBtn.addEventListener('click', () => {
        const newSkills = [];
        // Correctly select only the skill item divs
        skillCategoriesContainer.querySelectorAll('[data-skill-item]').forEach(itemDiv => {
            const checkbox = itemDiv.querySelector('input[type="checkbox"]');
            const select = itemDiv.querySelector('select.level-select');
            if (checkbox && select) { // Ensure both elements exist
                newSkills.push({
                    id: checkbox.value,
                    xp: 0, // Assuming xp is always reset or 0
                    level: parseInt(select.value),
                    equipped: checkbox.checked
                });
            }
        });
        mockPlayer.skills = newSkills;
        skillsEditorModal.classList.add('hidden');
        populateEditors();
        showToast('Skill/Badge changes applied!');
    });
    
    applyAllButton.addEventListener('click', () => {
        const inputs = generalModsContainer.querySelectorAll('[data-mod]');
        inputs.forEach(input => {
            if(input.value) {
                const modType = input.dataset.mod;
                let value = input.value;
                if (input.type === 'number' || input.tagName === 'SELECT') {
                    value = parseInt(value);
                }
                if (modType === 'firstName') mockPlayer.fn = value;
                if (modType === 'lastName') mockPlayer.ln = value;
                if (modType === 'age') mockPlayer.age = value;
                if (modType === 'height') mockPlayer.ht = value;
                if (modType === 'weight') mockPlayer.wt = value;
                if (modType === 'position') mockPlayer.pos = value;
                if (modType === 'potential') mockPlayer.pot = value;
                if (modType === 'buildName') mockPlayer.arc = value;
            }
        });
        populateEditors(); // Refresh the inspector bar with new info
        showToast('All changes have been applied!');
    });

    // Event listeners for new buttons (show "Coming Soon" toast)
    playerContractBtn.addEventListener('click', () => showToast('Player Contract editor coming soon!'));
    playerTendenciesBtn.addEventListener('click', () => showToast('Player Tendencies editor coming soon!'));
    playerStatsBtn.addEventListener('click', () => showToast('Player Stats & Goals editor coming soon!'));
    leagueTeamAttributesBtn.addEventListener('click', () => showToast('League/Team Attributes editor coming soon!'));
    awardsBtn.addEventListener('click', () => showToast('Awards editor coming soon!'));
    coinsBtn.addEventListener('click', () => showToast('Coins editor coming soon!'));
    fansBtn.addEventListener('click', () => showToast('Fans editor coming soon!'));
    coachModdingBtn.addEventListener('click', () => showToast('Coach Modding editor coming soon!'));
    createPlayerBtn.addEventListener('click', () => showToast('Create New Player functionality coming soon!'));


    // Initial population
    populateEditors();
});
