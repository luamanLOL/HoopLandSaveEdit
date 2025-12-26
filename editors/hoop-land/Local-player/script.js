const ATTRIBUTE_CONFIG = {
    finishing: { name: 'Finishing', keys: ['LAY', 'DNK', 'INS'], color: '#3b82f6', abbr: ['LAY', 'DNK', 'INS'] },
    shooting:  { name: 'Shooting', keys: ['MID', 'TPT', 'FTS'], color: '#4ade80', abbr: ['MID', '3PT', 'FTS'] },
    creating:  { name: 'Creating', keys: ['DRB', 'PAS', 'ORE'], color: '#fbbf24', abbr: ['DRB', 'PAS', 'ORE'] },
    defense:   { name: 'Defense', keys: ['DRE', 'STL', 'BLK'], color: '#f87171', abbr: ['DRE', 'STL', 'BLK'] },
    physicals: { name: 'Physicals', keys: ['SPD', 'STR', 'STM'], color: '#f472b6', abbr: ['SPD', 'STR', 'STM'] }
};

const SKILLS_CONFIG = {
    finishing: [
        { id: 'highlight_reel', name: 'Highlight Reel', desc: 'Decreased stamina used for dunks' },
        { id: 'crafty', name: 'Crafty', desc: 'Increased accuracy on reverse/contact layups' },
        { id: 'soft_touch', name: 'Soft Touch', desc: 'Increased hookshot accuracy' },
        { id: 'tear_dropper', name: 'Tear Dropper', desc: 'Increased floater accuracy' },
        { id: 'bully', name: 'Bully', desc: 'Increased chance of opponent falling when backing down' },
        { id: 'dunk_artist', name: 'Dunk Artist', desc: 'Increased dunk success & acrobatic dunks' }
    ],
    shooting: [
        { id: 'spark_plug', name: 'Spark Plug', desc: 'Start off hot when coming off the bench' },
        { id: 'clutch_gene', name: 'Clutch Gene', desc: 'Increased accuracy in clutch situations' },
        { id: 'spot_up', name: 'Spot Up', desc: 'Increased jumpshot accuracy after receiving a pass' },
        { id: 'volume_shooter', name: 'Volume Shooter', desc: 'Decreased stamina used for jumpshots' },
        { id: 'limitless', name: 'Limitless', desc: 'Increased accuracy from shots deeper than 25 feet' },
        { id: 'unfazed', name: 'Unfazed', desc: 'Increased accuracy on contested mid range shots' }
    ],
    creating: [
        { id: 'dimer', name: 'Dimer', desc: 'Increased teammate shot accuracy after a pass' },
        { id: 'chef', name: 'Chef', desc: 'Catch on fire if teammate catches fire after an assist' },
        { id: 'cleanup_crew', name: 'Cleanup Crew', desc: 'Increased shot accuracy after an offensive rebound' },
        { id: 'step_dancer', name: 'Step Dancer', desc: 'Increased accuracy after step back/side step' },
        { id: 'foot_surgeon', name: 'Foot Surgeon', desc: 'Increased ankle breaker stun duration' },
        { id: 'hot_potato', name: 'Hot Potato', desc: 'If on fire, the ball will stay hot after a pass' }
    ],
    defense: [
        { id: 'clamps', name: 'Clamps', desc: 'Increased shot contest strength' },
        { id: 'locked_in', name: 'Locked In', desc: 'Increased defensive ability in clutch situations' },
        { id: 'magnet', name: 'Magnet', desc: 'Increased ability to secure contested rebounds' },
        { id: 'two_way', name: 'Two Way', desc: 'Can catch fire from defensive plays' },
        { id: 'ball_hawk', name: 'Ball Hawk', desc: 'Increased interception chance on pass deflection' },
        { id: 'snatcher', name: 'Snatcher', desc: 'Increased chance of catching block attempts' }
    ]
};

const TENDENCY_MAP = {
    block: "Block Attempt",
    cross: "Crossover",
    defReb: "Defensive Rebound",
    dunk: "Dunk vs Layup",
    fades: "Fadeaway",
    floater: "Floater",
    hook: "Hook Shot",
    lob: "Throw Alley-Oop",
    offReb: "Offensive Rebound",
    pass: "Pass vs Shoot",
    post: "Post Up",
    pumpFake: "Pump Fake",
    runPlay: "Run Play",
    spin: "Spin Move",
    stealOffBall: "Steal (Off-Ball)",
    stealOnBall: "Steal (On-Ball)",
    step: "Step Back",
    takeCharge: "Take Charge",
    threePoint: "3PT vs 2PT",
    twoPoint: "Mid-Range vs Paint"
};

const TENDENCY_VALUES = {
    "-5": "Weakest",
    "-3": "Weak",
    "-1": "Slightly Weak",
    "0": "Neutral",
    "1": "Slightly Good",
    "3": "Good",
    "5": "Strongest"
};

const POSITION_MAP = {
    0: "PG", 1: "G", 2: "SG", 3: "GF", 4: "SF", 5: "F", 6: "PF", 7: "FC", 8: "C"
};

const appState = {
    fullSaveData: null, // Store full data
    currentLeague: null,
    allPlayers: [],
    currentPlayer: null,
};

// --- Helper Functions ---

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show';
    if (type === 'error') toast.style.backgroundColor = '#ef4444';
    else toast.style.backgroundColor = 'var(--color-main-accent)';
    setTimeout(() => toast.className = toast.className.replace('show', ''), 3000);
}

function setupInputListeners() {
    document.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('change', (e) => {
            if (!appState.currentPlayer) return;
            const key = e.target.id;
            let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
            
            // I'm converting the input to a number if it's supposed to be one.
            if (e.target.type === 'number' || (e.target.tagName === 'SELECT' && !isNaN(parseFloat(val)))) {
                val = parseFloat(val);
            }

            // Some of the IDs in the HTML don't match the data structure perfectly, so I'm handling those exceptions here.
            if (key === 'first-name') {
                appState.currentPlayer.fn = e.target.value;
                // I want the header to update instantly when you type the name.
                const fullName = `${appState.currentPlayer.fn} ${appState.currentPlayer.ln}`;
                document.getElementById('player-name-card').textContent = fullName;
            }
            else if (key === 'last-name') {
                appState.currentPlayer.ln = e.target.value;
                // I want the header to update instantly when you type the name.
                const fullName = `${appState.currentPlayer.fn} ${appState.currentPlayer.ln}`;
                document.getElementById('player-name-card').textContent = fullName;
            }
            else if (key === 'weight') appState.currentPlayer.wt = val;
            else if (key === 'experience') appState.currentPlayer.yrs = val;
            else if (key === 'regression-age') appState.currentPlayer.regressionAge = parseInt(val);
            else if (key === 'archetype') appState.currentPlayer.arc = e.target.value; // Keeping this as a string because archetypes are text.
            // Added a listener for the new tag field I put in.
            else if (key === 'player-tag') appState.currentPlayer.tag = parseInt(val);
            else if (key === 'position') appState.currentPlayer.pos = parseInt(val);
            else if (key === 'height') appState.currentPlayer.ht = parseInt(val);
            else if (key === 'contract_salary') {
                 if(!appState.currentPlayer.contract) appState.currentPlayer.contract = {};
                 appState.currentPlayer.contract.sal = val;
            }
            else if (key === 'contract_years') {
                 if(!appState.currentPlayer.contract) appState.currentPlayer.contract = {};
                 appState.currentPlayer.contract.yrs = parseInt(val);
            }
            else if (key === 'contract_ntc') {
                 if(!appState.currentPlayer.contract) appState.currentPlayer.contract = {};
                 appState.currentPlayer.contract.noTrd = e.target.checked ? 1 : 0;
            }
            else if (key.startsWith('stat_')) {
                const statKey = key.replace('stat_', '');
                if (!appState.currentPlayer.seasonStats) appState.currentPlayer.seasonStats = {};
                appState.currentPlayer.seasonStats[statKey] = val;
            }
            else if (key in appState.currentPlayer) {
                appState.currentPlayer[key] = val;
            }
        });
    });
}

async function handleBackNavigation() {
    if (appState.fullSaveData) {
        console.log("Saving changes to DB...");
        try {
            await saveToDB(appState.fullSaveData); 
            console.log("Save successful.");
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save data!");
            return;
        }
    }

    // Navigate
    document.body.classList.remove('loaded');
    document.body.classList.add('fading-out');
    setTimeout(() => {
        window.location.href = '../index.html?state=restore'; 
    }, 300);
}

async function loadSaveFile() {
    try {
        const storedData = await loadFromDB();
        if (storedData) {
            console.log("Loading data from IndexedDB...");
            processLoadedData(storedData);
        } else {
            console.log("Loading data from file...");
            fetchSaveFile();
        }
    } catch (e) {
        console.error("Error loading from DB:", e);
        fetchSaveFile();
    }
}

function fetchSaveFile() {
    fetch('../../../../resources/hoop-land-save.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            processLoadedData(data);
        })
        .catch(error => {
            console.error("Error loading save file:", error);
            showToast('Could not load save file.', 'error');
        });
}

function processLoadedData(data) {
    appState.fullSaveData = data;
    
    const storedIndex = localStorage.getItem('activeLeagueIndex');
    const leagueIdx = storedIndex ? parseInt(storedIndex, 10) : 0;
    appState.currentLeague = data.seasonLeagues[leagueIdx] || data.seasonLeagues[0];

    let allPlayers = [];
    
    // Helper to push ACTUAL REFERENCES
    const addPlayersFromTeam = (team) => {
        if (team && team.roster) {
            team.roster.forEach(p => {
                // DIRECTLY MODIFY the real object to add helpers
                // This keeps 'p' pointing to the same memory as fullSaveData
                p.teamId = team.id;
                p.teamAbbr = team.name || 'FA';
                p.teamName = team.name;
                allPlayers.push(p); 
            });
        }
    };

    if (appState.currentLeague.teams) {
        appState.currentLeague.teams.forEach(addPlayersFromTeam);
    }
    if (appState.currentLeague.starTeams) {
        appState.currentLeague.starTeams.forEach(addPlayersFromTeam);
    }
    
    appState.allPlayers = allPlayers;
    
    // -- Local Player Identification --
    // (This logic stays the same, but now 'localPlayer' is the REAL object)
    if (appState.currentLeague.season && appState.currentLeague.season.playerId !== undefined) {
        const localPlayerId = appState.currentLeague.season.playerId;
        const localPlayer = appState.allPlayers.find(p => p.id === localPlayerId);
        
        if (localPlayer) {
            appState.currentPlayer = localPlayer;
            populateForm(appState.currentPlayer);
        } else if (appState.allPlayers.length > 0) {
             appState.currentPlayer = appState.allPlayers[0];
             populateForm(appState.currentPlayer);
             showToast('Local player not found. Loaded first player.', 'error');
        }
    } else if (appState.allPlayers.length > 0) {
        appState.currentPlayer = appState.allPlayers[0];
        populateForm(appState.currentPlayer);
    }
}

function generateHeightOptions() {
    const select = document.getElementById('height');
    if(!select) return;
    select.innerHTML = '';
    for (let i = 12; i <= 144; i++) {
        const ft = Math.floor(i / 12);
        const inch = i % 12;
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${ft}'${inch}"`;
        select.appendChild(option);
    }
}

function renderAttributePreview(player) {
    const container = document.getElementById('attributes-preview-container');
    container.innerHTML = '';
    const maxVal = 20;

    if (!player.attributes) player.attributes = {};

    for (const category in ATTRIBUTE_CONFIG) {
        const config = ATTRIBUTE_CONFIG[category];
        const section = document.createElement('div');
        section.className = 'preview-section';
        section.style.borderTop = `3px solid ${config.color}`;

        const header = document.createElement('div');
        header.className = 'preview-section-header';
        header.textContent = config.name;
        section.appendChild(header);

        const barsGroup = document.createElement('div');
        barsGroup.className = 'preview-bars-group';

        config.keys.forEach((key, index) => {
            const attrData = player.attributes[key] || [0, 0];
            const current = attrData[0] !== undefined ? attrData[0] : 0;
            const potential = attrData[1] !== undefined ? attrData[1] : 0;
            const abbr = config.abbr[index];
            const col = document.createElement('div');
            col.className = 'preview-mini-bar-col';
            col.innerHTML = `
                <div class="preview-mini-bar-track">
                     <div class="preview-mini-bar-pot" style="bottom: ${(potential/maxVal)*100}%;"></div>
                     <div class="preview-mini-bar-fill" style="height: ${(current/maxVal)*100}%; background-color: ${config.color};"></div>
                </div>
                <span class="preview-mini-label">${abbr}</span>
            `;
            barsGroup.appendChild(col);
        });
        section.appendChild(barsGroup);
        container.appendChild(section);
    }
}

function renderSkillsPreview(player) {
    // I kept this function structure here just in case I want to add it back later, but it's empty for now.
    const container = document.getElementById('skills-preview-container');
    if (container) container.innerHTML = ''; 
}

function calculateRating(player) {
    if (!player.attributes) return { currentPoints: 0, potentialStars: "0.0" };
    let totalCurrent = 0;
    for (const cat in ATTRIBUTE_CONFIG) {
        ATTRIBUTE_CONFIG[cat].keys.forEach(key => {
            const attr = player.attributes[key] || [0, 0];
            totalCurrent += (attr[0] || 0);
        });
    }
    
    // Potential is now direct from player.pot
    let potStars = "0.0";
    if (player.pot !== undefined) {
        potStars = (player.pot / 2).toFixed(1).replace('.0', '');
        // Append .5 if needed (though toFixed(1) does .5, replacing .0 removes it for whole numbers)
        if (potStars.endsWith('.5')) {
             // It's good gng
        } else if (potStars.includes('.')) {
             // Clean up potential weirdness if any, but /2 usually results in .0 or .5
        }
    }

    return { 
        currentPoints: totalCurrent,
        potentialStars: potStars
    };
}

function populateForm(player) {
    document.getElementById('player-name-card').textContent = (player.fn && player.ln) ? `${player.fn} ${player.ln}` : 'Player Name';
    document.getElementById('first-name').value = player.fn || '';
    document.getElementById('last-name').value = player.ln || '';
    document.getElementById('player-position-card').textContent = POSITION_MAP[player.pos] || 'N/A';
    document.getElementById('player-archetype-card').textContent = player.arc || 'N/A'; 
    document.getElementById('player-age-card').textContent = player.age || 'N/A';
    
    if (player.ht) {
        document.getElementById('player-height-card').textContent = `${Math.floor(player.ht/12)}'${player.ht%12}"`;
    } else {
        document.getElementById('player-height-card').textContent = 'N/A';
    }
    
    document.getElementById('player-weight-card').textContent = player.wt ? `${player.wt} lbs` : 'N/A';

    document.getElementById('age').value = player.age || 0;
    
    const heightSelect = document.getElementById('height');
    if (heightSelect) heightSelect.value = player.ht;

    document.getElementById('weight').value = player.wt || 0;
    document.getElementById('experience').value = player.yrs || 0;
    document.getElementById('regression-age').value = player.regressionAge || 32;
    // NEW TAG POPULATION
    document.getElementById('player-tag').value = player.tag !== undefined ? player.tag : 0;

    document.getElementById('archetype').value = player.arc || ''; 
    
    const positionSelect = document.getElementById('position');
    positionSelect.value = player.pos !== undefined ? player.pos : 0; 

    document.getElementById('condition').value = player.condition || 100;
    
    // -- Local Editor Changes --
    // These are specific changes for the local player editor.
    // I took out the relationship and morale logic because it wasn't really needed here.
    
    // Loading coins and fans directly from the league career data.
    const coinsInput = document.getElementById('coins');
    const fansInput = document.getElementById('fans');
    
    if (appState.currentLeague && appState.currentLeague.career) {
        if (coinsInput) coinsInput.value = appState.currentLeague.career.coins || 0;
        if (fansInput) fansInput.value = appState.currentLeague.career.fans || 0;
    }

    // Contract Logic
    if (!player.contract) player.contract = { yrs: 1, sal: 0, noTrd: 0 };
    const contractSalary = document.getElementById('contract_salary');
    const contractYears = document.getElementById('contract_years');
    const contractNtc = document.getElementById('contract_ntc');

    if (contractSalary) contractSalary.value = player.contract.sal !== undefined ? player.contract.sal : 0;
    if (contractYears) contractYears.value = player.contract.yrs !== undefined ? player.contract.yrs : 1;
    if (contractNtc) contractNtc.checked = (player.contract.noTrd === 1 || player.contract.noTrd === true);

    const ratings = calculateRating(player);
    // Formatting the ratings display so it looks clean.
    document.getElementById('player-calc-rating').innerHTML = `
        [pts: ${ratings.currentPoints}] <span style="color: var(--color-text-medium); margin-left: 8px;">[pot: ${ratings.potentialStars}&#9733;]</span>
    `;

    renderAttributePreview(player);
    renderSkillsPreview(player);
    populateTendencies(player);
    
    // Populating all the stats fields with the player's data.
    if (!player.seasonStats) player.seasonStats = {};
    const stats = player.seasonStats;
    const statKeys = ['GP','GS','PTS','AST','OREB','DREB','STL','BLK','TO','PF','FGM','FGA','3PM','3PA','FTM','FTA'];
    statKeys.forEach(key => {
        const el = document.getElementById(`stat_${key}`);
        if(el) el.value = stats[key] !== undefined ? stats[key] : 0;
    });

    // I'm automatically calculating the total rebounds whenever offensive or defensive rebounds change.
    const orebInput = document.getElementById('stat_OREB');
    const drebInput = document.getElementById('stat_DREB');
    const trebInput = document.getElementById('stat_TREB');

    const updateTreb = () => {
        const o = parseInt(orebInput.value) || 0;
        const d = parseInt(drebInput.value) || 0;
        if(trebInput) trebInput.value = o + d;
    };

    if(orebInput && drebInput) {
        updateTreb(); // Initial
        orebInput.addEventListener('input', updateTreb);
        drebInput.addEventListener('input', updateTreb);
    }
}

function saveStats() {
    const player = appState.currentPlayer;
    if (!player) return;
    if (!player.seasonStats) player.seasonStats = {};
    
    const statKeys = ['GP','GS','PTS','AST','OREB','DREB','STL','BLK','TO','PF','FGM','FGA','3PM','3PA','FTM','FTA'];
    statKeys.forEach(key => {
        const el = document.getElementById(`stat_${key}`);
        if(el) player.seasonStats[key] = parseInt(el.value) || 0;
    });
    
    showToast('Season stats updated!');
}

function populateTendencies(player) {
    if (player.tendencies) {
        for (const key in player.tendencies) {
            const select = document.getElementById(`tendency_${key}`);
            if (select) {
                select.value = player.tendencies[key] || 0;
            }
        }
    }
}



function saveAttributesFromModal() {
    renderAttributePreview(appState.currentPlayer);
    document.getElementById('attribute-editor-modal').classList.add('modal-hidden');
    showToast('Attributes updated!');
}

function saveSkillsFromModal() {
    document.getElementById('skills-editor-modal').classList.add('modal-hidden');
    showToast('Skills updated!');
}

function saveContractFromModal() {
    const player = appState.currentPlayer;
    if (!player) return;
    if (!player.contract) player.contract = { yrs: 1, sal: 0, noTrd: 0 };

    const salaryInput = document.getElementById('contract_salary');
    const yearsInput = document.getElementById('contract_years');
    const ntcInput = document.getElementById('contract_ntc');

    if (salaryInput) player.contract.sal = parseFloat(salaryInput.value) || 0;
    if (yearsInput) player.contract.yrs = parseInt(yearsInput.value) || 1;
    if (ntcInput) player.contract.noTrd = ntcInput.checked ? 1 : 0;

    document.getElementById('contract-modal').classList.add('modal-hidden');
    showToast('Contract updated!');
}

function maxAllAttributes() {
    const player = appState.currentPlayer;
    if (!player) return;
    if (!player.attributes) player.attributes = {};

    for (const cat in ATTRIBUTE_CONFIG) {
        ATTRIBUTE_CONFIG[cat].keys.forEach(key => {
            player.attributes[key] = [20, 20];
        });
    }
    openAttributeEditorModal(); // Re-render to show changes
    showToast('All attributes maxed!');
}

function resetAllAttributes() {
    const player = appState.currentPlayer;
    if (!player) return;
    if (!player.attributes) player.attributes = {};

    for (const cat in ATTRIBUTE_CONFIG) {
        ATTRIBUTE_CONFIG[cat].keys.forEach(key => {
            player.attributes[key] = [0, 0];
        });
    }
    openAttributeEditorModal(); // Re-render to show changes
    showToast('All attributes reset!');
}

function setupBadgeToggles() {
    document.querySelectorAll('.btn-select-all').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            const container = document.getElementById(targetId);
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => { cb.checked = !allChecked; });
        });
    });
}

function toggleSkill(card, skillId) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    const player = appState.currentPlayer;
    if (!player.skills) player.skills = [];
    if (player.skills.includes(skillId)) {
        player.skills = player.skills.filter(id => id !== skillId);
        card.classList.remove('active');
        checkbox.checked = false;
    } else {
        player.skills.push(skillId);
        card.classList.add('active');
        checkbox.checked = true;
    }
}

// Logic for manual typing
function updateAttributeFromEditor(e) {
    const input = e.target;
    const key = input.dataset.key;
    const type = input.dataset.type; 
    let value = parseInt(input.value, 10);
    if (isNaN(value)) value = 0;
    
    // Defer to centralized update logic
    performAttributeUpdate(key, type, value, input);
}

// Logic for stepper buttons
window.adjustValue = function(key, type, change) {
    const player = appState.currentPlayer;
    if (!player || !player.attributes || !player.attributes[key]) return;
    
    let currentVal = type === 'current' ? player.attributes[key][0] : player.attributes[key][1];
    let newVal = currentVal + change;
    
    // Find the input element to pass to logic (so it updates the UI correctly)
    const input = document.querySelector(`input[data-key="${key}"][data-type="${type}"]`);
    if(input) {
        performAttributeUpdate(key, type, newVal, input);
    }
}

function performAttributeUpdate(key, type, value, inputElement) {
    const player = appState.currentPlayer;
    if (!player) return;
    if (!player.attributes) player.attributes = {};
    if (!player.attributes[key]) player.attributes[key] = [0, 0];

    // Limits
    if (value > 20) value = 20;
    if (value < 0) value = 0;
    
    let current = player.attributes[key][0];
    let potential = player.attributes[key][1];

    if (type === 'current') {
        current = value;
        // Logic: Current cannot exceed potential. 
        // Making sure the current attribute value doesn't go higher than the potential cap.
        if (current > potential) potential = current;
    } else {
        potential = value;
        // Logic: Potential cannot drop below current.
        // And vice versa, the potential cap shouldn't be lower than the current value.
        if (potential < current) current = potential;
    }
    
    player.attributes[key] = [current, potential];
    
    // Updating the DOM.
    const box = inputElement.closest('.editor-box');
    const maxVal = 20;
    
    // Updating the input fields to reflect the new values.
    box.querySelector('input[data-type="current"]').value = current;
    box.querySelector('input[data-type="potential"]').value = potential;
    
    // Updating the visual bars.
    box.querySelector('.editor-bar-current-fill').style.width = `${(current/maxVal)*100}%`;
    box.querySelector('.editor-bar-potential-fill').style.width = `${(potential/maxVal)*100}%`;
    box.querySelector('.editor-bar-cap').style.left = `${(potential/maxVal)*100}%`;
    
    // Update text
    box.querySelector('.editor-display-val').textContent = (current / 2).toFixed(1).replace('.0', '');
    box.querySelector('.editor-game-val-text').textContent = `In Game: ${(current/2).toFixed(1)}`;

    // Recalculating the overall rating stars.
    const ratings = calculateRating(player);
    document.getElementById('player-calc-rating').innerHTML = `
        [pts: ${ratings.currentPoints}] <span style="color: var(--color-text-medium); margin-left: 8px;">[pot: ${ratings.potentialStars}&#9733;]</span>
    `;
}

function openAttributeEditorModal() {
    const player = appState.currentPlayer;
    if (!player) return;
    const container = document.getElementById('attributes-editor-grid');
    container.innerHTML = '';
    const maxVal = 20;
    if (!player.attributes) player.attributes = {};
    
    for (const category in ATTRIBUTE_CONFIG) {
        const config = ATTRIBUTE_CONFIG[category];
        config.keys.forEach(key => {
            if (!player.attributes[key]) player.attributes[key] = [0, 0];
            const current = player.attributes[key][0];
            const potential = player.attributes[key][1];
            const displayVal = (current / 2).toFixed(1).replace('.0', ''); 
            
            const box = document.createElement('div');
            box.className = 'editor-box';
            box.setAttribute('data-key', key);
            box.style.borderColor = config.color; 

            box.innerHTML = `
                <div class="editor-box-header" style="border-bottom-color: ${config.color}">
                    <span class="editor-box-label">${key}</span>
                </div>
                <div class="editor-box-controls">
                    <div class="editor-display-val">${displayVal}</div>
                    
                    <div class="editor-bar-track">
                        <div class="editor-bar-potential-fill" style="width: ${(potential/maxVal)*100}%; background-color: ${config.color}; opacity: 0.3;"></div>
                        <div class="editor-bar-current-fill" style="width: ${(current/maxVal)*100}%; background-color: ${config.color};"></div>
                        <div class="editor-bar-cap" style="left: ${(potential/maxVal)*100}%;"></div>
                    </div>
                    
                    <!-- New Stepper Controls with Labels (Row Layout) -->
                    <div class="editor-inputs-group">
                        <!-- Current Control -->
                        <div class="editor-inputs-column">
                            <span class="input-label">Current</span>
                            <div class="stepper-control-group">
                                 <input type="number" min="0" max="20" step="1" value="${current}" data-key="${key}" data-type="current" title="Current" inputmode="numeric">
                                 <button type="button" class="stepper-btn" onclick="adjustValue('${key}', 'current', -1)">-</button>
                                 <button type="button" class="stepper-btn" onclick="adjustValue('${key}', 'current', 1)">+</button>
                            </div>
                        </div>
                        
                        <!-- Potential Control -->
                        <div class="editor-inputs-column">
                            <span class="input-label">Cap</span>
                            <div class="stepper-control-group" style="opacity: 0.8;">
                                 <input type="number" min="0" max="20" step="1" value="${potential}" data-key="${key}" data-type="potential" title="Potential" inputmode="numeric">
                                 <button type="button" class="stepper-btn" onclick="adjustValue('${key}', 'potential', -1)">-</button>
                                 <button type="button" class="stepper-btn" onclick="adjustValue('${key}', 'potential', 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="editor-game-val-text">In Game: ${(current/2).toFixed(1)}</div>
            `;
            container.appendChild(box);
        });
    }
    
    // Attach manual input listeners
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateAttributeFromEditor);
    });
    
    document.getElementById('attribute-editor-modal').classList.remove('modal-hidden');
}

function openSkillsEditorModal() {
    const player = appState.currentPlayer;
    if (!player) return;
    const container = document.getElementById('skills-editor-grid');
    container.innerHTML = '';
    if (!player.skills) player.skills = [];

    for (const cat in SKILLS_CONFIG) {
        const skillsList = SKILLS_CONFIG[cat];
        const catDiv = document.createElement('div');
        catDiv.className = 'skills-category';
        
        const header = document.createElement('div');
        header.className = 'skills-category-header';
        header.innerHTML = `<h3>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>`;
        
        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'btn-select-all';
        selectAllBtn.textContent = 'Toggle All';
        selectAllBtn.dataset.target = `skills-grid-${cat}`;
        selectAllBtn.onclick = (e) => {
             const grid = container.querySelector(`#skills-grid-${cat}`);
             const cards = grid.querySelectorAll('.skill-card');
             let anyUnchecked = false;
             cards.forEach(card => { if (!card.classList.contains('active')) anyUnchecked = true; });
             
             cards.forEach(card => {
                const skillId = card.dataset.skillId;
                const checkbox = card.querySelector('input');
                if (anyUnchecked) {
                    if (!player.skills.includes(skillId)) {
                        player.skills.push(skillId);
                        card.classList.add('active');
                        checkbox.checked = true;
                    }
                } else {
                    if (player.skills.includes(skillId)) {
                        player.skills = player.skills.filter(id => id !== skillId);
                        card.classList.remove('active');
                        checkbox.checked = false;
                    }
                }
             });
        };

        header.appendChild(selectAllBtn);
        catDiv.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'skills-grid';
        grid.id = `skills-grid-${cat}`;

        skillsList.forEach(skill => {
            const isEquipped = player.skills.includes(skill.id);
            const card = document.createElement('div');
            card.className = `skill-card ${isEquipped ? 'active' : ''}`;
            card.dataset.skillId = skill.id;
            
            card.innerHTML = `
                <input type="checkbox" class="skill-checkbox" ${isEquipped ? 'checked' : ''}>
                <div class="skill-info">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-desc">${skill.desc}</span>
                </div>
            `;
            card.onclick = (e) => toggleSkill(card, skill.id);
            grid.appendChild(card);
        });

        catDiv.appendChild(grid);
        container.appendChild(catDiv);
    }
    document.getElementById('skills-editor-modal').classList.remove('modal-hidden');
}

function initializeModals() {
    const editorModal = document.getElementById('attribute-editor-modal');
    document.getElementById('open-editor-btn').addEventListener('click', openAttributeEditorModal);
    editorModal.querySelector('.close-button').addEventListener('click', () => editorModal.classList.add('modal-hidden'));
    document.getElementById('save-attributes-button').addEventListener('click', saveAttributesFromModal);
    
    // Bulk Actions
    document.getElementById('btn-max-all').addEventListener('click', maxAllAttributes);
    document.getElementById('btn-reset-all').addEventListener('click', resetAllAttributes);

    const contractModal = document.getElementById('contract-modal');
    document.getElementById('contract-button').addEventListener('click', () => contractModal.classList.remove('modal-hidden'));
    contractModal.querySelector('.close-button').addEventListener('click', () => contractModal.classList.add('modal-hidden'));
    document.getElementById('save-contract-button').addEventListener('click', saveContractFromModal);
    
    const saveStatsBtn = document.getElementById('save-stats-btn');
    if (saveStatsBtn) saveStatsBtn.addEventListener('click', saveStats);
    
    const skillsModal = document.getElementById('skills-editor-modal');
    document.getElementById('open-skills-btn').addEventListener('click', openSkillsEditorModal);
    skillsModal.querySelector('.close-button').addEventListener('click', () => skillsModal.classList.add('modal-hidden'));
    document.getElementById('save-skills-button').addEventListener('click', saveSkillsFromModal);

    window.addEventListener('click', (event) => {
        if (event.target === contractModal) contractModal.classList.add('modal-hidden');
        if (event.target === editorModal) editorModal.classList.add('modal-hidden');
        if (event.target === skillsModal) skillsModal.classList.add('modal-hidden');
    });
}

function generateTendencySelects() {
    const tendencies = Object.keys(TENDENCY_MAP);
    const container = document.getElementById('tendencies-content');
    if (!container) return;
    
    container.innerHTML = '';
    tendencies.forEach(tendency => {
        const labelText = TENDENCY_MAP[tendency] || tendency;
        let optionsHTML = '';
        const sortedKeys = ["-5", "-3", "-1", "0", "1", "3", "5"];
        sortedKeys.forEach(val => {
             optionsHTML += `<option value="${val}">${TENDENCY_VALUES[val]}</option>`;
        });
        const selectHTML = `
            <div>
                <label for="tendency_${tendency}">${labelText}</label>
                <select id="tendency_${tendency}" data-tendency="${tendency}">
                    ${optionsHTML}
                </select>
            </div>
        `;
        container.innerHTML += selectHTML;
    });

    container.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', (e) => {
            if (appState.currentPlayer) {
                if (!appState.currentPlayer.tendencies) appState.currentPlayer.tendencies = {};
                const key = e.target.dataset.tendency;
                appState.currentPlayer.tendencies[key] = parseInt(e.target.value);
            }
        });
    });
}

function initializeCollapsibles() {
    document.querySelectorAll('.collapsible').forEach(legend => {
        legend.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content) {
                const indicator = this.querySelector('.collapsible-indicator');
                if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                    content.style.maxHeight = null;
                    if(indicator) indicator.style.transform = '';
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                    if(indicator) indicator.style.transform = 'rotate(90deg)';
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Fade In
    setTimeout(() => document.body.classList.add('loaded'), 50);

    // Back Button
    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackNavigation();
        });
    }

    initializeCollapsibles();
    initializeModals();
    generateTendencySelects();
    generateHeightOptions();
    setupInputListeners();
    loadSaveFile();
    
    const archetypeInput = document.getElementById('archetype');
    if (archetypeInput) {
        archetypeInput.addEventListener('input', (e) => {
            if(appState.currentPlayer) {
                appState.currentPlayer.arc = e.target.value;
                document.getElementById('player-archetype-card').textContent = e.target.value || 'N/A';
            }
        });
    }

    // Coins Input Listener
    const coinsInput = document.getElementById('coins');
    if (coinsInput) {
        coinsInput.addEventListener('input', (e) => {
            if (appState.currentLeague && appState.currentLeague.career) {
                appState.currentLeague.career.coins = parseInt(e.target.value) || 0;
            }
        });
    }
    
    // Fans Input Listener
    const fansInput = document.getElementById('fans');
    if (fansInput) {
        fansInput.addEventListener('input', (e) => {
             if (appState.currentLeague && appState.currentLeague.career) {
                appState.currentLeague.career.fans = parseInt(e.target.value) || 0;
            }
        });
    }

    // Switch Team Button Listener
    const switchTeamBtn = document.getElementById('switch-team-btn');
    if (switchTeamBtn) {
        switchTeamBtn.addEventListener('click', () => {
            if (appState.fullSaveData) {
                try {
                    localStorage.setItem('hoopLandSaveData', JSON.stringify(appState.fullSaveData));
                } catch (e) {
                    console.warn("Could not save to localStorage. Relying on IndexedDB.");
                    saveToDB(appState.fullSaveData);
                }

                localStorage.setItem('switchTeamMode', 'true');
                localStorage.setItem('switchTeamContext', 'local');
                localStorage.setItem('returnFromSwitch', window.location.href);
                window.location.href = '../index.html?action=switch-team';
            }
        });
    }
});