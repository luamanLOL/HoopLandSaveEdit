const appState = {
    fullSaveData: null, // Store the entire save object
    currentLeague: null,
    currentTeam: null,
    editingStaff: null,
    editingPlayer: null // For Rotation Editor
};

const POSITION_MAP = {
    0: "PG", 1: "G", 2: "SG", 3: "GF", 4: "SF", 5: "F", 6: "PF", 7: "FC", 8: "C"
};

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show';
    toast.style.backgroundColor = type === 'error' ? '#ef4444' : 'var(--color-main-accent)';
    setTimeout(() => toast.className = toast.className.replace('show', ''), 3000);
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
        .then(res => {
            if (!res.ok) throw new Error("Failed to load save file");
            return res.json();
        })
        .then(data => {
            processLoadedData(data);
        })
        .catch(err => {
            console.error(err);
            showToast("Error processing save file.", "error");
        });
}

function processLoadedData(data) {
    appState.fullSaveData = data; // Keep reference to full object
    
    const storedIndex = localStorage.getItem('activeLeagueIndex');
    const leagueIdx = storedIndex ? parseInt(storedIndex, 10) : 0;
    appState.currentLeague = data.seasonLeagues[leagueIdx] || data.seasonLeagues[0];

    const season = appState.currentLeague.season;
    
    // 1. Check for Specific Team Edit Request
    const editingTeamId = localStorage.getItem('editingTeamId');
    let foundTeam = null;

    if (editingTeamId) {
        const tid = parseInt(editingTeamId, 10);
        if (appState.currentLeague.teams) {
            foundTeam = appState.currentLeague.teams.find(t => t.id === tid);
        }
        if (!foundTeam && appState.currentLeague.starTeams) {
            foundTeam = appState.currentLeague.starTeams.find(t => t.id === tid);
        }
        
        if (foundTeam) {
            console.log("Loaded specifically requested team:", foundTeam.name);
            localStorage.removeItem('editingTeamId'); // Consume flag
        }
    }

    // 2. Fallback: Find Local Player's Team
    if (!foundTeam) {
        const localPid = season.playerId;
        if (localPid !== undefined && localPid !== null) {
            if (appState.currentLeague.teams) {
                for (const team of appState.currentLeague.teams) {
                    const playerInRoster = team.roster.find(p => p.id === localPid);
                    if (playerInRoster) {
                        foundTeam = team;
                        break;
                    }
                }
            }
        } else {
             showToast("No local player ID found in save.", "error");
        }
    }

    // 3. Last Resort Fallback
    if (!foundTeam) {
            if (appState.currentLeague.teams && appState.currentLeague.teams.length > 0) {
                foundTeam = appState.currentLeague.teams[0];
                showToast("Loaded first team as fallback.", "error");
            }
    }
    
    if (foundTeam) {
        appState.currentTeam = foundTeam;
        renderAll();
        // showToast("Team loaded successfully!");
    }
}

function handleBackNavigation() {
    if (appState.fullSaveData) {
        saveToDB(appState.fullSaveData).then(() => {
            console.log("Data saved to DB.");
            proceedNavigation();
        }).catch(err => {
            console.error("Save failed", err);
            proceedNavigation();
        });
    } else {
        proceedNavigation();
    }
}

function proceedNavigation() {
    document.body.classList.remove('loaded');
    document.body.classList.add('fading-out');
    setTimeout(() => {
        window.location.href = '../index.html?state=restore';
    }, 300);
}

function renderAll() {
    updateTeamCard();
    populateFranchiseTab();
    renderStaffTab();
    renderRosterTab();
    renderSeasonTab();
}

function updateTeamCard() {
    const t = appState.currentTeam;
    if (!t) return;

    document.getElementById('team-logo-card').textContent = t.shortName || "TM";
    document.getElementById('team-name-card').textContent = t.name || "Team Name";
    
    // Calculate simple averages for card
    let totalPot = 0;
    if (t.roster && t.roster.length > 0) {
        t.roster.forEach(p => {
            totalPot += (p.pot || 0);
        });
        const avgPot = (totalPot / t.roster.length / 2).toFixed(1);
        document.getElementById('team-ovr-card').textContent = avgPot;
    } else {
         document.getElementById('team-ovr-card').textContent = "--";
    }
    
    // Get current season wins/losses
    if (t.season && t.season.length > 0) {
        const currentSeason = t.season[t.season.length - 1];
        if (currentSeason.seasonStats) {
            document.getElementById('team-wl-card').textContent = `${currentSeason.seasonStats.W}-${currentSeason.seasonStats.L}`;
        }
    }
}

function populateFranchiseTab() {
    const t = appState.currentTeam;
    if (!t) return;

    // Ensure objects exist
    if (!t.frontOffice) t.frontOffice = { coins: 0, fans: 0, morale: 0 };
    if (!t.history) t.history = { championships: { yearsWon: [] } };
    if (!t.history.championships) t.history.championships = { yearsWon: [] };
    if (!t.retiredNumbers) t.retiredNumbers = [];
    if (!t.draftPicks) t.draftPicks = [];
    
    const fo = t.frontOffice;
    
    // -- Inputs --
    const nameInput = document.getElementById('team-name');
    const abbrInput = document.getElementById('team-abbr');
    // NEW TAG INPUT
    const tagInput = document.getElementById('team-tag');

    const arenaInput = document.getElementById('team-arena');
    const coinsInput = document.getElementById('team-coins');
    const fansInput = document.getElementById('team-fans');
    const moraleInput = document.getElementById('team-morale');
    const retiredInput = document.getElementById('team-retired-numbers');
    
    // -- Populate --
    nameInput.value = t.name || "";
    abbrInput.value = t.shortName || "";
    // POPULATE TAG
    tagInput.value = t.tag !== undefined ? t.tag : 0;

    arenaInput.value = t.arenaName || "";
    coinsInput.value = fo.coins || 0;
    fansInput.value = fo.fans || 0;
    moraleInput.value = fo.morale || 0;
    
    // -- Listeners --
    nameInput.oninput = (e) => { 
        t.name = e.target.value; 
        document.getElementById('team-name-card').textContent = e.target.value; 
    };
    abbrInput.oninput = (e) => { 
        t.shortName = e.target.value; 
        document.getElementById('team-logo-card').textContent = e.target.value; 
    };
    // TAG LISTENER
    tagInput.oninput = (e) => { t.tag = parseInt(e.target.value) || 0; };

    arenaInput.oninput = (e) => { t.arenaName = e.target.value; };
    coinsInput.oninput = (e) => { fo.coins = parseInt(e.target.value) || 0; };
    fansInput.oninput = (e) => { fo.fans = parseInt(e.target.value) || 0; };
    moraleInput.oninput = (e) => { fo.morale = parseInt(e.target.value) || 0; };
    
    // Button Listeners
    document.getElementById('add-pick-btn').onclick = addDraftPick;
    document.getElementById('add-retired-btn').onclick = addRetiredNumber;
    document.getElementById('add-champ-btn').onclick = addChampionship;

    renderDraftPicks();
    renderRetiredNumbers();
    renderChampionships();
}

function renderDraftPicks() {
    const t = appState.currentTeam;
    const container = document.getElementById('draft-picks-container');
    container.innerHTML = '';
    
    if (!t.draftPicks) t.draftPicks = [];
    
    // Sort by Year then Round
    t.draftPicks.sort((a, b) => a.yr - b.yr || a.rd - b.rd);

    t.draftPicks.forEach((pick, index) => {
        const tag = document.createElement('div');
        tag.style.cssText = `
            background-color: var(--color-secondary-bg);
            border: 1px solid var(--color-border);
            padding: 0.5rem 0.75rem;
            border-radius: 4px;
            font-size: 0.9rem;
            display: flex; align-items: center; gap: 0.75rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        tag.innerHTML = `
            <span style="font-family: 'Pixelify Sans', sans-serif; color: var(--color-main-accent);">Y${pick.yr} R${pick.rd}</span>
            <span style="color: #ef4444; font-weight: bold; cursor: pointer; opacity: 0.8;" title="Remove Pick">&times;</span>
        `;
        
        // Remove handler
        tag.querySelector('span:last-child').onclick = () => {
            t.draftPicks.splice(index, 1);
            renderDraftPicks(); 
            showToast("Pick removed");
        };
        
        container.appendChild(tag);
    });
}

function addDraftPick() {
    const t = appState.currentTeam;
    const yrInput = document.getElementById('new-pick-yr');
    const rdInput = document.getElementById('new-pick-rd');
    
    const yr = parseInt(yrInput.value);
    const rd = parseInt(rdInput.value);
    
    if (isNaN(yr) || isNaN(rd)) {
        showToast("Invalid Year or Round", "error");
        return;
    }
    
    if (!t.draftPicks) t.draftPicks = [];
    
    t.draftPicks.push({
        yr: yr,
        rd: rd,
        originalTid: t.id // Default to self
    });
    
    // Clear Round but keep Year (usually adding multiple for same year)
    rdInput.value = '';
    renderDraftPicks();
    showToast("Draft Pick Added");
}

function renderRetiredNumbers() {
    const t = appState.currentTeam;
    const container = document.getElementById('retired-numbers-container');
    container.innerHTML = '';
    
    if (!t.retiredNumbers) t.retiredNumbers = [];
    t.retiredNumbers.sort((a, b) => a - b);

    t.retiredNumbers.forEach((num, index) => {
        const box = document.createElement('div');
        box.style.cssText = `
            background-color: var(--color-card-bg);
            border: 2px solid var(--color-main-accent);
            color: var(--color-main-accent);
            width: 40px; height: 40px;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Pixelify Sans', sans-serif;
            font-size: 1.2rem;
            position: relative;
            cursor: default;
        `;
        
        // Number text
        box.textContent = num;
        
        // X button (appears on hover or small absolute)
        const close = document.createElement('div');
        close.textContent = '×';
        close.style.cssText = `
            position: absolute; top: -8px; right: -8px;
            background: #ef4444; color: white;
            width: 16px; height: 16px;
            border-radius: 50%;
            font-size: 12px; line-height: 16px; text-align: center;
            cursor: pointer;
            border: 1px solid var(--color-bg);
        `;
        close.onclick = () => {
            t.retiredNumbers.splice(index, 1);
            renderRetiredNumbers();
            showToast(`Jersey #${num} un-retired`);
        };
        
        box.appendChild(close);
        container.appendChild(box);
    });
}

function addRetiredNumber() {
    const t = appState.currentTeam;
    const input = document.getElementById('new-retired-num');
    const num = parseInt(input.value);
    
    if (isNaN(num)) return;
    
    if (!t.retiredNumbers) t.retiredNumbers = [];
    
    if (t.retiredNumbers.includes(num)) {
        showToast("Number already retired!", "error");
        return;
    }
    
    t.retiredNumbers.push(num);
    input.value = '';
    renderRetiredNumbers();
    showToast(`Retired #${num}`);
}

function renderStaffTab() {
    const container = document.getElementById('staff-list');
    container.innerHTML = '';
    const t = appState.currentTeam;
    
    // Updated data source per instructions: frontOffice.staff
    if (!t || !t.frontOffice || !t.frontOffice.staff) return;
    
    // Filter by tid match AND valid contract (yrs > 0)
    const validStaff = t.frontOffice.staff.filter(s => {
        const hasContract = s.contract && s.contract.yrs > 0;
        return s.tid === t.id && hasContract;
    });
    
    validStaff.forEach((s, index) => {
        const card = document.createElement('div');
        card.className = 'staff-card';
        // 0 is usually Head Coach in the array
        const role = index === 0 ? "Head Coach" : "Assistant"; 
        
        card.innerHTML = `
            <div class="staff-role">${role}</div>
            <div class="staff-name">${s.fn} ${s.ln}</div>
            <div class="staff-details">Age: ${s.age}</div>
            <div class="staff-details">Contract: ${s.contract?.yrs || 0} yrs / $${s.contract?.sal || 0}M</div>
        `;
        
        card.onclick = () => openStaffModal(s);
        container.appendChild(card);
    });
}

function renderRosterTab() {
    const tbody = document.getElementById('roster-list');
    tbody.innerHTML = '';
    const t = appState.currentTeam;
    
    if(!t || !t.roster) return;
    
    t.roster.forEach((p, index) => {
        const tr = document.createElement('tr');
        const potStars = (p.pot / 2).toFixed(1);
        
        // I added a new column with an "Edit Stats" button for each player.
        const btnCell = document.createElement('td');
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit Stats';
        editBtn.style.fontSize = '0.7rem';
        editBtn.style.padding = '0.25rem 0.5rem';
        editBtn.style.width = 'auto';
        editBtn.onclick = () => {
            // Checking if the player being edited is the local user so I can send them to the right screen.
            const localPlayerId = appState.currentLeague?.season?.playerId; // Update to use season.playerId
            localStorage.setItem("editPlayerId", p.id); // Update to use editPlayerId
            
            if (p.id === localPlayerId) {
                window.location.href = '../Local-player/index.html';
            } else {
                window.location.href = '../Non-local/index.html';
            }
        };

        // Added logic to delete a player. Use with caution!
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;'; // X symbol
        deleteBtn.title = "Delete Player from Game";
        deleteBtn.style.cssText = `
            background-color: #ef4444; 
            color: white; 
            border: none; 
            padding: 0.25rem 0.6rem; 
            margin-left: 0.5rem; 
            border-radius: 4px; 
            font-weight: bold; 
            cursor: pointer;
        `;
        
        deleteBtn.onclick = (e) => {
            e.stopPropagation(); // Stop other clicks
            const confirmDelete = confirm(`ARE YOU SURE?\n\nThis will permanently delete ${p.fn} ${p.ln} from the team and the entire game.\n\nThis action cannot be undone.`);
            
            if (confirmDelete) {
                // Remove from roster array
                t.roster.splice(index, 1);
                
                // Save and Refresh
                renderRosterTab();
                showToast(`${p.fn} ${p.ln} deleted successfully.`);
            }
        };
        
        // Append BOTH buttons to the cell
        btnCell.appendChild(editBtn); // Ensure Edit is first
        btnCell.appendChild(deleteBtn); // Then Delete

        tr.appendChild(btnCell);
        
        // Rendering the rest of the columns as usual.
        tr.insertAdjacentHTML('beforeend', `
            <td>${p.fn} ${p.ln}</td>
            <td>${POSITION_MAP[p.pos]}</td>
            <td>${p.age}</td>
            <td>${potStars}★</td>
            <td>
                <button type="button" class="rotation-btn" onclick="openMinutesModal(${index})">
                    ROTATION
                </button>
            </td>
        `);
        
        tbody.appendChild(tr);
    });
    
    const theadRow = document.querySelector('.roster-table thead tr');
    if (theadRow && theadRow.cells.length === 5) { // Assuming 5 original columns
        const th = document.createElement('th');
        th.textContent = 'Edit';
        theadRow.insertBefore(th, theadRow.cells[0]);
    }
}

// This handles the rotation editor modal.
// I exposed this function globally so the onclick handlers in the HTML can reach it.
window.openMinutesModal = function(playerIndex) {
    const t = appState.currentTeam;
    if (!t || !t.roster || !t.roster[playerIndex]) return;

    const p = t.roster[playerIndex];
    appState.editingPlayer = p; // Store ref
    
    document.getElementById('min-modal-player-name').textContent = `${p.fn} ${p.ln}`;
    document.getElementById('min-modal-player-pos').textContent = POSITION_MAP[p.pos] || "N/A";
    
    // Making sure the minutes array exists, creating a default one if it doesn't.
    if (!p.minutes) p.minutes = [0, 0, 0, 0, 0, 0];
    
    // Filling in the inputs with the player's rotation minutes.
    // Index 0: Total Target
    // Index 1-5: Positional breakdown
    document.getElementById('min-total').value = p.minutes[0] || 0;
    document.getElementById('min-pg').value = p.minutes[1] || 0;
    document.getElementById('min-sg').value = p.minutes[2] || 0;
    document.getElementById('min-sf').value = p.minutes[3] || 0;
    document.getElementById('min-pf').value = p.minutes[4] || 0;
    document.getElementById('min-c').value = p.minutes[5] || 0;
    
    document.getElementById('minutes-modal').classList.remove('modal-hidden');
};

function saveRotation() {
    const p = appState.editingPlayer;
    if (!p) return;
    
    // Read Inputs
    const newMinutes = [
        parseInt(document.getElementById('min-total').value) || 0,
        parseInt(document.getElementById('min-pg').value) || 0,
        parseInt(document.getElementById('min-sg').value) || 0,
        parseInt(document.getElementById('min-sf').value) || 0,
        parseInt(document.getElementById('min-pf').value) || 0,
        parseInt(document.getElementById('min-c').value) || 0
    ];
    
    p.minutes = newMinutes;
    
    document.getElementById('minutes-modal').classList.add('modal-hidden');
    appState.editingPlayer = null;
    showToast("Rotation saved!");
}


function renderChampionships() {
    const t = appState.currentTeam;
    const champContainer = document.getElementById('championships-list');
    if (!champContainer) return;
    champContainer.innerHTML = '';
    
    if (t.history && t.history.championships && t.history.championships.yearsWon) {
        // Sort years
        t.history.championships.yearsWon.sort((a, b) => a - b);
        
        t.history.championships.yearsWon.forEach(year => {
            const tag = document.createElement('div');
            tag.style.cssText = `
                background-color: var(--color-main-accent);
                color: var(--color-primary-bg);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-family: 'Pixelify Sans', sans-serif;
                display: flex; align-items: center; gap: 0.5rem;
                font-weight: bold;
            `;
            tag.innerHTML = `
                <span>${year}</span>
                <span style="cursor: pointer; opacity: 0.7;" onclick="removeChampionship(${year})">&times;</span>
            `;
            champContainer.appendChild(tag);
        });
    }
}

// Logic for the Season tab.
function renderSeasonTab() {
    const t = appState.currentTeam;
    if (!t) return;

    // Finding the current season data based on the league year.
    const currentYear = appState.currentLeague.season.currentYear;
    let currentSeason = null;

    if (t.season && t.season.length > 0) {
        currentSeason = t.season.find(s => s.yr === currentYear);
    }

    if (currentSeason) {
        if (!currentSeason.seasonStats) currentSeason.seasonStats = { W: 0, L: 0, STRK: 0 };
        document.getElementById('season-wins').value = currentSeason.seasonStats.W;
        document.getElementById('season-losses').value = currentSeason.seasonStats.L;
        const streakInput = document.getElementById('season-streak');
        if (streakInput) streakInput.value = currentSeason.seasonStats.STRK || 0;
        
        // Update Card
        document.getElementById('team-wl-card').textContent = `${currentSeason.seasonStats.W}-${currentSeason.seasonStats.L}`;
    } else {
        // No current season data found
        document.getElementById('season-wins').value = 0;
        document.getElementById('season-losses').value = 0;
        const streakInput = document.getElementById('season-streak');
        if (streakInput) streakInput.value = 0;
    }
}

function saveSeasonStats() {
    const t = appState.currentTeam;
    if (!t || !t.season) {
        showToast("No season data to update!", "error");
        return;
    }
    
    const currentYear = appState.currentLeague.season.currentYear;
    let currentSeason = t.season.find(s => s.yr === currentYear);
    
    if (!currentSeason) {
        showToast("Current season entry not found.", "error");
        return;
    }
    
    if (!currentSeason.seasonStats) currentSeason.seasonStats = { W: 0, L: 0, STRK: 0 };
    
    currentSeason.seasonStats.W = parseInt(document.getElementById('season-wins').value) || 0;
    currentSeason.seasonStats.L = parseInt(document.getElementById('season-losses').value) || 0;
    currentSeason.seasonStats.STRK = parseInt(document.getElementById('season-streak').value) || 0;
    
    renderSeasonTab(); // Refresh UI/Card
    showToast("Season stats updated!");
}

function addChampionship() {
    const input = document.getElementById('new-champ-year');
    const year = parseInt(input.value);
    if (!year) return;
    
    const t = appState.currentTeam;
    if (!t.history) t.history = {};
    if (!t.history.championships) t.history.championships = {};
    if (!t.history.championships.yearsWon) t.history.championships.yearsWon = [];
    
    if (!t.history.championships.yearsWon.includes(year)) {
        t.history.championships.yearsWon.push(year);
        renderChampionships(); // Refresh Franchise Tab view
        input.value = '';
    } else {
        showToast("Year already exists!", "error");
    }
}

// Make global so onclick in HTML works
window.removeChampionship = function(year) {
    const t = appState.currentTeam;
    if (t.history && t.history.championships && t.history.championships.yearsWon) {
        t.history.championships.yearsWon = t.history.championships.yearsWon.filter(y => y !== year);
        renderChampionships(); // Refresh Franchise Tab view
    }
};


// Logic for the mass edit tools.
function openMassEditModal() {
    document.getElementById('mass-edit-modal').classList.remove('modal-hidden');
}

function applyMassEdit(action) {
    const t = appState.currentTeam;
    if (!t || !t.roster) return;

    let msg = "";
    
    t.roster.forEach(p => {
        if (action === 'god-mode') {
            if (!p.attributes) p.attributes = {};
            // I updated this to use 20 as the max value because that maps to a 10 in the game.
            const keys = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK', 'SPD', 'STR', 'STM'];
            keys.forEach(k => {
                p.attributes[k] = [20, 20]; 
            });
            msg = "All Attributes Maxed (10)!";
        }
        else if (action === 'health-potion') {
            // Completely wiping out the injury object to heal the player.
            p.injury = { gamesOut: 0, type: 0 }; 
            p.condition = 100;
            msg = "Health & Condition Restored!";
        }
        else if (action === 'cap-cleaner') {
            if (!p.contract) p.contract = { yrs: 1, sal: 0, noTrd: 0 };
            p.contract.sal = 0;
            msg = "Contracts set to Free!";
        }
        else if (action === 'contract-lock') {
            if (!p.contract) p.contract = { yrs: 1, sal: 0, noTrd: 0 };
            p.contract.yrs = 100;
            p.contract.noTrd = 1; // Enable NTC
            msg = "Contracts Locked (100 yrs)!";
        }
    });

    document.getElementById('mass-edit-modal').classList.add('modal-hidden');
    renderRosterTab(); // Refresh to show potential changes
    showToast(msg);
}


// Helper functions for managing modals and tabs.

// Logic for the stepper buttons in the staff editor.
window.adjustStaffAttr = function(attr, type, delta) {
    // attr: 'development', 'motivation', 'leadership'
    // type: 0 (current), 1 (max)
    const short = attr === 'development' ? 'dev' : attr === 'motivation' ? 'mot' : 'ldr';
    const suffix = type === 0 ? 'cur' : 'max';
    const inputId = `staff-${short}-${suffix}`;
    
    const input = document.getElementById(inputId);
    if (!input) return;

    let val = parseInt(input.value) || 0;
    val += delta;

    if (val < 0) val = 0;
    if (val > 20) val = 20;

    input.value = val;
};

function openStaffModal(staffMember) {
    appState.editingStaff = staffMember;
    const m = document.getElementById('staff-modal');
    
    // Bio
    document.getElementById('staff-fn').value = staffMember.fn || "";
    document.getElementById('staff-ln').value = staffMember.ln || "";
    document.getElementById('staff-age').value = staffMember.age || 0;
    
    // Contract
    if(!staffMember.contract) staffMember.contract = { yrs: 1, sal: 0 };
    document.getElementById('staff-yrs').value = staffMember.contract.yrs || 0;
    document.getElementById('staff-sal').value = staffMember.contract.sal || 0;

    // Attributes (Dev, Mot, Ldr)
    if (!staffMember.attributes) staffMember.attributes = {};
    // Check nested keys, use ? operator liberally
    document.getElementById('staff-dev-cur').value = staffMember.attributes.development?.[0] || 0;
    document.getElementById('staff-dev-max').value = staffMember.attributes.development?.[1] || 0;
    document.getElementById('staff-mot-cur').value = staffMember.attributes.motivation?.[0] || 0;
    document.getElementById('staff-mot-max').value = staffMember.attributes.motivation?.[1] || 0;
    document.getElementById('staff-ldr-cur').value = staffMember.attributes.leadership?.[0] || 0;
    document.getElementById('staff-ldr-max').value = staffMember.attributes.leadership?.[1] || 0;

    // Career Record
    if (!staffMember.career) staffMember.career = {};
    if (!staffMember.career.season) staffMember.career.season = { W: 0, L: 0 };
    document.getElementById('staff-wins').value = staffMember.career.season.W || 0;
    document.getElementById('staff-losses').value = staffMember.career.season.L || 0;

    // Tactics / Tendencies
    if (!staffMember.tendencies) staffMember.tendencies = {};
    document.getElementById('staff-off-focus').value = staffMember.tendencies.offFocus || 0;
    document.getElementById('staff-off-tempo').value = staffMember.tendencies.offTempo || 0;
    document.getElementById('staff-off-reb').value = staffMember.tendencies.offRebounding || 0;
    document.getElementById('staff-def-focus').value = staffMember.tendencies.defFocus || 0;
    document.getElementById('staff-def-agg').value = staffMember.tendencies.defAggression || 0;
    document.getElementById('staff-def-reb').value = staffMember.tendencies.defRebounding || 0;

    // Rotations
    document.getElementById('staff-bench-depth').value = staffMember.tendencies.benchDepth || 0;
    document.getElementById('staff-bench-util').value = staffMember.tendencies.benchUtilization || 0;
    document.getElementById('staff-closing').value = staffMember.tendencies.closingLineup || 0;

    m.classList.remove('modal-hidden');
}

function saveStaff() {
    const s = appState.editingStaff;
    if(!s) return;
    
    // Bio
    s.fn = document.getElementById('staff-fn').value;
    s.ln = document.getElementById('staff-ln').value;
    s.age = parseInt(document.getElementById('staff-age').value) || 0;
    
    // Contract
    if(!s.contract) s.contract = {};
    s.contract.yrs = parseInt(document.getElementById('staff-yrs').value) || 0;
    s.contract.sal = parseFloat(document.getElementById('staff-sal').value) || 0;

    // Attributes
    if (!s.attributes) s.attributes = {};
    s.attributes.development = [
        parseInt(document.getElementById('staff-dev-cur').value) || 0,
        parseInt(document.getElementById('staff-dev-max').value) || 0
    ];
    s.attributes.motivation = [
        parseInt(document.getElementById('staff-mot-cur').value) || 0,
        parseInt(document.getElementById('staff-mot-max').value) || 0
    ];
    s.attributes.leadership = [
        parseInt(document.getElementById('staff-ldr-cur').value) || 0,
        parseInt(document.getElementById('staff-ldr-max').value) || 0
    ];

    // Career
    if (!s.career) s.career = {};
    if (!s.career.season) s.career.season = {};
    s.career.season.W = parseInt(document.getElementById('staff-wins').value) || 0;
    s.career.season.L = parseInt(document.getElementById('staff-losses').value) || 0;

    // Tendencies
    if (!s.tendencies) s.tendencies = {};
    s.tendencies.offFocus = parseInt(document.getElementById('staff-off-focus').value) || 0;
    s.tendencies.offTempo = parseInt(document.getElementById('staff-off-tempo').value) || 0;
    s.tendencies.offRebounding = parseInt(document.getElementById('staff-off-reb').value) || 0;
    s.tendencies.defFocus = parseInt(document.getElementById('staff-def-focus').value) || 0;
    s.tendencies.defAggression = parseInt(document.getElementById('staff-def-agg').value) || 0;
    s.tendencies.defRebounding = parseInt(document.getElementById('staff-def-reb').value) || 0;
    
    s.tendencies.benchDepth = parseInt(document.getElementById('staff-bench-depth').value) || 0;
    s.tendencies.benchUtilization = parseInt(document.getElementById('staff-bench-util').value) || 0;
    s.tendencies.closingLineup = parseInt(document.getElementById('staff-closing').value) || 0;

    document.getElementById('staff-modal').classList.add('modal-hidden');
    renderStaffTab();
    showToast("Staff updated!");
}


function setupTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active
            buttons.forEach(b => b.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function setupMassEdit() {
    const btn = document.getElementById('mass-edit-btn');
    const modal = document.getElementById('mass-edit-modal');
    if(btn && modal) {
        btn.onclick = () => openMassEditModal();
        modal.querySelector('.close-button').onclick = () => modal.classList.add('modal-hidden');
        
        // Setup option buttons
        modal.querySelectorAll('.mass-edit-option').forEach(opt => {
            opt.onclick = () => applyMassEdit(opt.dataset.action);
        });
        
        window.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('modal-hidden');
        });
    }
}

function setupSeasonTab() {
    const saveBtn = document.getElementById('save-season-stats-btn');
    if (saveBtn) saveBtn.onclick = saveSeasonStats;
    
    const addBtn = document.getElementById('add-champ-btn');
    if (addBtn) addBtn.onclick = addChampionship;
}

function setupMinutesModal() {
    const modal = document.getElementById('minutes-modal');
    if (!modal) return;
    
    document.getElementById('save-minutes-btn').addEventListener('click', saveRotation);
    modal.querySelector('.close-button').addEventListener('click', () => modal.classList.add('modal-hidden'));
    
    window.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.add('modal-hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Checking if we just successfully switched teams so I can show a success message.
    if (localStorage.getItem('switchTeamToast') === 'true') {
        // Remove the flag so it doesn't show again on reload
        localStorage.removeItem('switchTeamToast');
        
        // I'm using the global toast function to keep things consistent.
        if (typeof showToast === 'function') {
            showToast('Team switched successful', 'success');
        } else {
            console.warn('showToast function not found');
        }
    }

    // Logic for the "Poach Player" button.
    const poachBtn = document.getElementById('poach-player-btn');
    if (poachBtn) {
        poachBtn.addEventListener('click', () => {
            // First, finding out which team we're currently looking at.
            const editingTeamId = localStorage.getItem('editingTeamId') || (appState.currentTeam ? appState.currentTeam.id : null);
            if (!editingTeamId) {
                alert("Error: No team selected.");
                return;
            }
            // Redirecting to the search page with the poach action active.
            window.location.href = `../index.html?action=poach-player&destTeamId=${editingTeamId}`;
        });
    }

    // Checking if we just came back from a successful poach.
    if (localStorage.getItem('poachToast') === 'true') {
        localStorage.removeItem('poachToast');
        // Use global ui.js toast if available
        if (typeof showToast === 'function') showToast('Player Poached Successfully!', 'success');
    }

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

    setupTabs();
    setupMassEdit();
    setupSeasonTab();
    setupMinutesModal();
    
    document.getElementById('save-staff-btn').addEventListener('click', saveStaff);
    
    const staffModal = document.getElementById('staff-modal');
    staffModal.querySelector('.close-button').addEventListener('click', () => staffModal.classList.add('modal-hidden'));
    
    // Global modal click closer for staff modal
    window.addEventListener('click', (e) => {
        if(e.target === staffModal) staffModal.classList.add('modal-hidden');
    });
    
    
    // This button is for controlling the team, but it's not ready yet.
    const controlTeamBtn = document.getElementById('control-team-btn');
    if (controlTeamBtn) {
        controlTeamBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // I made a custom toast here because I wanted it to look specific.
            const toast = document.createElement('div');
            toast.textContent = "Control team is coming with the full release of savexf";
            
            // Apply custom styling (Black box, White text)
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#000000', // Black background
                color: '#ffffff',           // White text
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: '9999',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: '600',
                opacity: '0',
                transition: 'opacity 0.5s ease-in-out'
            });

            document.body.appendChild(toast);

            // Trigger animation
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
            });

            // Remove after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 500); // Wait for fade out
            }, 3000);
        });
    }

    loadSaveFile();
});
