// --- CONSTANTS ---
const POSITIONS = {
    0: 'PG', 1: 'G', 2: 'SG', 3: 'GF', 4: 'SF',
    5: 'F', 6: 'PF', 7: 'FC', 8: 'C'
};

const DIVISIONS = {
    '-1': 'Star Team', 0: 'NorthWest', 1: 'Pacific', 2: 'SouthWest',
    3: 'Atlantic', 4: 'Central', 5: 'SouthEast'
};

// grabbing all the DOM elements I need for the search functionality.
const searchInput = document.getElementById('searchInput');
const searchTitle = document.getElementById('search-title');
const resultsContainer = document.getElementById('resultsContainer');
const noResultsMessage = document.getElementById('noResultsMessage');

// These are the elements related to the filtering dropdowns.
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterMenu = document.getElementById('filterDropdownMenu');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const positionFilterContainer = document.getElementById('position-filter-container');
const activeFiltersContainer = document.getElementById('active-filters-container');

// This function sets up the search state when you enter a specific mode.
function initializeSearch(mode) {
    appState.search.currentMode = mode;
    appState.search.allPlayers = appState.currentLeague.allPlayers || [];
    appState.search.allTeams = [...(appState.currentLeague.teams || []), ...(appState.currentLeague.starTeams || [])];
    
    // I'm resetting the filters and sort options every time search is initialized.
    appState.search.filters = {
        positions: [],
        potential: { min: null, max: null }
    };
    appState.search.currentSort = { type: 'potential', direction: 'desc', label: 'Potential' }; 

    populateFilters(mode);

    if(searchInput) searchInput.value = '';

    performSearch();
    updateActiveFilterPills();

    // I'm setting up the event listeners for the filter dropdown menu here.
    // Re-query button to ensure we have the current DOM element
    const toggleBtn = document.getElementById('filterToggleBtn');
    
    if(toggleBtn && filterMenu) {
        const newBtn = toggleBtn.cloneNode(true);
        if(toggleBtn.parentNode) {
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filterMenu.classList.toggle('hidden');
            });
            
            document.addEventListener('click', (e) => {
                if (!filterMenu.contains(e.target) && e.target !== newBtn) {
                    filterMenu.classList.add('hidden');
                }
            });
        }
    }
    
    if(clearFiltersBtn) {
        clearFiltersBtn.onclick = () => {
            appState.search.filters.positions = [];
            populateFilters(mode); // Re-render pills
            performSearch();
            updateActiveFilterPills();
        };
    }
}

// This is the core logic that actually performs the search and filters the results.
const performSearch = () => {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    // Depending on the mode, we might be searching for teams or players, so I'm determining that here.
    const searchType = ['teamEdit', 'createPlayer', 'switchTeam'].includes(appState.search.currentMode) ? 'team' : 'player';
    let results = [];

    // First step is to filter the list based on the search term and any active filters.
    if (searchType === 'player') {
        results = appState.search.allPlayers.filter(player => {
            if (!player) return false;

            const fullName = `${player.fn || ''} ${player.ln || ''}`.toLowerCase();
            const teamName = (player.teamName || '').toLowerCase();
            const teamAbbr = (player.teamAbbr || '').toLowerCase();
            const pos = getPlayerPositionAbbr(player.pos).toLowerCase();
            
            if (searchTerm && !fullName.includes(searchTerm) && !teamName.includes(searchTerm) && !teamAbbr.includes(searchTerm) && !pos.includes(searchTerm)) {
                return false;
            }

            if (appState.search.filters.positions.length > 0 && !appState.search.filters.positions.includes(player.pos)) {
                return false;
            }

            return true;
        });
    } else { // Team search
        results = appState.search.allTeams.filter(team =>
            (team.name || '').toLowerCase().includes(searchTerm) ||
            (team.abbr || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Then I sort the results, usually by potential.
    results.sort((a, b) => (b.pot || 0) - (a.pot || 0));

    // Finally, I render the filtered and sorted results to the screen.
    renderResults(results, searchType);
    updateActiveFilterPills();
};

const getRatingColor = (val) => {
    if (val >= 4.5) return '#10b981'; // Green
    if (val >= 3.5) return '#f59e0b'; // Gold
    return '#ef4444'; // Red
};

// I need this helper to find the highest player ID so I can generate a unique one for new players.
function getHighestPlayerId(data) {
    let maxId = 0;
    if (data.seasonLeagues) {
        data.seasonLeagues.forEach(league => {
            if (league.teams) league.teams.forEach(t => t.roster.forEach(p => { if (p.id > maxId) maxId = p.id; }));
            if (league.starTeams) league.starTeams.forEach(t => t.roster.forEach(p => { if (p.id > maxId) maxId = p.id; }));
        });
    }
    return maxId;
}

// This function takes the results and creates the HTML elements to display them.
const renderResults = (results, type) => {
    if(resultsContainer) {
        resultsContainer.innerHTML = '';
        if(noResultsMessage) noResultsMessage.classList.toggle('hidden', results.length > 0);
        
        const badge = document.getElementById('hub-count-badge');
        if(badge) badge.textContent = `${results.length} Items`;

        const tableContainer = document.querySelector('.table-container');
        // I'm toggling a class on the container to style it differently depending on if we are listing teams or players.
        if (appState.search.currentMode === 'teamEdit') {
            if(tableContainer) tableContainer.classList.add('mode-team');
        } else {
            if(tableContainer) tableContainer.classList.remove('mode-team');
        }

        results.forEach((item, index) => {
            if (!item) return;
            
            let col1 = index + 1;
            let name = item.name;
            let colPos = '';
            let colPts = ''; // Total Attributes
            let colPot = '';

            if (appState.search.currentMode === 'teamEdit') {
                // If we're editing teams, I format the data differently here.
                name = item.name; 
                colPos = 'TEAM';
                colPts = item.frontOffice ? item.frontOffice.fans + ' Fans' : '-';
                colPot = '-'; 
            } else {
                // For players, I show their name, position, attributes, and potential.
                name = `${item.fn || item.name} ${item.ln || ''}`;
                colPos = item.pos !== undefined ? getPlayerPositionAbbr(item.pos) : '?';
                
                // I'm summing up all the attribute values to give a "Total" rating.
                const attr = item.attributes || item.ratings || {};
                let totalAttrs = 0;
                for (let key in attr) {
                    if (Array.isArray(attr[key]) && attr[key].length > 0) {
                        totalAttrs += attr[key][0];
                    } else if (typeof attr[key] === 'number') {
                        totalAttrs += attr[key];
                    }
                }
                
                colPts = totalAttrs > 0 ? totalAttrs : '-';
                colPot = item.pot ? (item.pot / 2).toFixed(1) + '★' : '-';
            }

            const row = document.createElement('div');
            row.className = 'data-row';
            row.dataset.itemId = item.id;

            row.innerHTML = `
                <div class="col-rank">${col1}</div>
                <div class="col-name">${name}</div>
                <div class="col-pos">${colPos}</div>
                <div class="col-stat" data-label="PTS" style="font-weight:bold; color:var(--color-main-accent);">
                    ${colPts}
                </div>
                <div class="col-stat" data-label="POT">${colPot}</div>
            `;

            // This click handler needs to be async because we might need to await some DB operations.
            row.addEventListener('click', async () => {
                if (appState.search.currentMode === 'createPlayer') {
                    // I'm generating a new unique ID for the created player.
                    const newId = getHighestPlayerId(appState.loadedSaveData) + 1;

                    // Here I'm constructing the new player object with default values, matching the game's data structure.
                    const newPlayer = {
                        id: newId,
                        tid: item.id,
                        teamAbbr: item.abbr,
                        teamName: item.name,
                        fn: "New",
                        ln: "Player",
                        name: "New Player",
                        pos: 0, 
                        age: 20,
                        ht: 75,
                        wt: 200,
                        yrs: 0,
                        regressionAge: 32, 
                        pot: 5,
                        // Attributes must be [Current, Potential] arrays with 3-letter keys
                        attributes: { 
                            LAY: [10,10], DNK: [10,10], INS: [10,10], MID: [10,10], TPT: [10,10], 
                            FTS: [10,10], DRB: [10,10], PAS: [10,10], ORE: [10,10], DRE: [10,10], 
                            STL: [10,10], BLK: [10,10], STR: [10,10], SPD: [10,10], STM: [10,10] 
                        },
                        contract: { tid: item.id, type: 0, yrs: 1, sal: 500, opt: 0, noTrd: 0 },
                        appearance: { skinC: "A05B53", hair: "0000", hairC: "000000" }, 
                        season: { relationship: 50, following: false },
                        stats: [],
                        awards: [],
                        tendencies: {},
                        skills: []
                    };

                    // Now I find the selected team and add the new player to their roster.
                    let teamFound = false;
                    appState.loadedSaveData.seasonLeagues.forEach(l => {
                        const t = l.teams.find(team => team.id === item.id);
                        if (t) {
                            t.roster.push(newPlayer);
                            teamFound = true;
                        }
                    });

                    if (teamFound) {
                        
                        try {
                            await saveToDB(appState.loadedSaveData); // Use IndexedDB
                            localStorage.setItem('editPlayerId', newId); // ID is small, safe for localStorage
                            window.location.href = 'Non-local/index.html';
                        } catch (err) {
                            console.error("Save failed:", err);
                            alert("Failed to save data. See console.");
                        }
                    } else {
                        alert("Error: Team not found in save file.");
                    }
                } else if (appState.search.currentMode === 'switchTeam') {
                    // This logic handles switching a player (usually the user) to a different team.
                    const targetTeam = item;
                    let playerToMove = null;

                    // First, I need to figure out exactly which player we are moving.
                    // Ideally, we have a specific player ID stored.
                    const movingPid = parseInt(localStorage.getItem('movingPlayerId'));
                    
                    if (movingPid) {
                        const allTeams = [...(appState.currentLeague.teams||[]), ...(appState.currentLeague.starTeams||[])];
                        for(const t of allTeams) {
                             const found = t.roster.find(p => p.id === movingPid);
                             if(found) { playerToMove = found; break; }
                        }
                    }

                    // If not, I assume we are moving the local player.
                    if (!playerToMove) {
                        playerToMove = appState.localPlayer;
                    }

                    // As a last resort, I check the season data for the player ID.
                    if (!playerToMove && appState.currentLeague.season.playerId) {
                         const pid = appState.currentLeague.season.playerId;
                         const allTeams = [...(appState.currentLeague.teams||[]), ...(appState.currentLeague.starTeams||[])];
                         for(const t of allTeams) {
                             const found = t.roster.find(p => p.id === pid);
                             if(found) { playerToMove = found; break; }
                         }
                    }

                    if (playerToMove) {
                        console.log(`Transferring ${playerToMove.fn} ${playerToMove.ln} to ${targetTeam.name}...`);

                        // I'm removing the player from their current team's roster.
                        let oldTeamRef = null;
                        appState.loadedSaveData.seasonLeagues.forEach(l => {
                            if (!oldTeamRef) oldTeamRef = (l.teams||[]).find(t => t.id === playerToMove.tid);
                            if (!oldTeamRef) oldTeamRef = (l.starTeams||[]).find(t => t.id === playerToMove.tid);
                        });
                        
                        if (oldTeamRef) {
                            const idx = oldTeamRef.roster.findIndex(p => p.id === playerToMove.id);
                            if (idx > -1) oldTeamRef.roster.splice(idx, 1);
                        }

                        // Now I update the player's data to reflect their new team ID and name.
                        playerToMove.tid = targetTeam.id;
                        playerToMove.teamAbbr = targetTeam.abbr;
                        playerToMove.teamName = targetTeam.name;
                        if (!playerToMove.contract) playerToMove.contract = {};
                        playerToMove.contract.tid = targetTeam.id;

                        // And finally, I push them onto the new team's roster.
                        let newTeamRef = null;
                        appState.loadedSaveData.seasonLeagues.forEach(l => {
                            if (!newTeamRef) newTeamRef = (l.teams||[]).find(t => t.id === targetTeam.id);
                            if (!newTeamRef) newTeamRef = (l.starTeams||[]).find(t => t.id === targetTeam.id);
                        });

                        if (newTeamRef) newTeamRef.roster.push(playerToMove);
                        
                        // If we moved the user's character, I also need to update the season data so they control the new team.
                        // If we just moved a random NPC, we don't want to change who we control.
                        const isLocalUser = (appState.currentLeague.season.playerId === playerToMove.id);
                        if (isLocalUser) {
                            appState.currentLeague.season.teamId = targetTeam.id;
                            // playerId remains the same, we just follow them to the new team
                        }

                        // Saving the changes and redirecting the user back.
                        try {
                            await saveToDB(appState.loadedSaveData);
                            localStorage.setItem('switchTeamToast', 'true');
                            
                            // Cleanup
                            localStorage.removeItem('movingPlayerId');

                            // Redirect Logic: Go back to where we came from
                            if (localStorage.getItem('switchTeamContext') === 'non-local') {
                                // Go back to the player editor (re-load this player)
                                localStorage.setItem('editPlayerId', playerToMove.id);
                                window.location.href = 'Non-local/index.html';
                            } else {
                                // Go back to dashboard
                                window.location.href = 'index.html?state=restore';
                            }

                        } catch (err) {
                            console.error("Save failed:", err);
                        }

                    } else {
                        // If I couldn't find a player to move, I assume the user just wants to switch which team they are spectating/controlling.
                        console.log("No player found. Switching Team Control only.");
                        appState.currentLeague.season.teamId = targetTeam.id;
                        
                        await saveToDB(appState.loadedSaveData);
                        window.location.href = 'index.html?state=restore';
                    }

                } else if (appState.search.currentMode === 'poachPlayer') {
                    // Here's the logic for executing the "poach" action.
                    const targetPlayer = item; // The player clicked
                    const destTeamId = parseInt(localStorage.getItem('poachDestTeamId'));

                    if (!destTeamId) { alert("Error: Destination team lost."); return; }

                    // Taking the player off their old team.
                    let oldTeam = null;
                    appState.loadedSaveData.seasonLeagues.forEach(l => {
                        if(!oldTeam) oldTeam = l.teams.find(t => t.id === targetPlayer.tid);
                        if(!oldTeam && l.starTeams) oldTeam = l.starTeams.find(t => t.id === targetPlayer.tid);
                    });
                    
                    if (oldTeam) {
                        const idx = oldTeam.roster.findIndex(p => p.id === targetPlayer.id);
                        if (idx > -1) oldTeam.roster.splice(idx, 1);
                    }

                    // And putting them on the new one.
                    let destTeam = null;
                     appState.loadedSaveData.seasonLeagues.forEach(l => {
                        if(!destTeam) destTeam = l.teams.find(t => t.id === destTeamId);
                        if(!destTeam && l.starTeams) destTeam = l.starTeams.find(t => t.id === destTeamId);
                    });

                    if (destTeam) {
                        // Update Player Data
                        targetPlayer.tid = destTeam.id;
                        targetPlayer.teamAbbr = destTeam.abbr;
                        targetPlayer.teamName = destTeam.name;
                        if (targetPlayer.contract) targetPlayer.contract.tid = destTeam.id;
                        
                        // Push to new roster
                        destTeam.roster.push(targetPlayer);

                        // Saving up and sending them back to the editor.
                        try {
                            await saveToDB(appState.loadedSaveData);
                            localStorage.setItem('poachToast', 'true'); // Trigger toast on arrival
                            // Redirect back to the Team Editor
                            window.location.href = 'Team-editor/index.html';
                        } catch (err) {
                            console.error("Poach save failed:", err);
                        }
                    } else {
                        alert("Destination team not found in save data.");
                    }

                } else {
                    handleDirectEdit(item.id, type);
                }
            });

            resultsContainer.appendChild(row);
        });
    }
};

window.handleDirectEdit = (id, mode) => {
    if (mode === 'team') {
        localStorage.setItem('editingTeamId', id);
        window.location.href = 'Team-editor/index.html';
    } else {
        // I had to rename this key to match what the other script expects.
        localStorage.setItem('editPlayerId', id); 
        window.location.href = 'Non-local/index.html'; 
    }
};

// Functions to handle the filter sidebar and populating the filter options.

function populateFilters(mode) {
    if(positionFilterContainer) positionFilterContainer.innerHTML = '';
    
    // I'm generating the buttons for filtering by position here.
    if (mode === 'playerEdit' || mode === 'general' || mode === 'hub' || mode === 'leaguePlayerEdit') { 
        for (const [key, value] of Object.entries(POSITIONS)) {
            const btn = document.createElement('button');
            btn.className = 'position-filter-btn';
            btn.textContent = value;
            btn.dataset.pos = key;
            
            if(appState.search.filters.positions.includes(parseInt(key))) {
                btn.classList.add('active');
            }

            btn.onclick = () => {
                const pos = parseInt(key);
                const idx = appState.search.filters.positions.indexOf(pos);
                if(idx > -1) appState.search.filters.positions.splice(idx, 1);
                else appState.search.filters.positions.push(pos);
                
                populateFilters(mode);
                performSearch();
                updateActiveFilterPills();
            };
            
            if(positionFilterContainer) positionFilterContainer.appendChild(btn);
        }
    }
}

function updateActiveFilterPills() {
    if(!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';
    // ... logic for pills if needed ...
}

function updateFilterSidebarVisuals() {
    // Placeholder if needed
}

// Some helper functions for things like getting position abbreviations.
const getPlayerPositionAbbr = (pos) => POSITIONS[pos] || 'N/A';
const getTeamDivisionName = (code) => DIVISIONS[code] || code || 'N/A';
const debounce = (func, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// Setting up event listeners for the search input and other controls.
if(searchInput) searchInput.addEventListener('keyup', debounce(performSearch, 300));

// I added a Ctrl+K shortcut to quickly focus the search bar.
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('searchInput');
        if(input) input.focus();
    }
});

const exitSearchBtn = document.getElementById('exitSearchBtn');
if (exitSearchBtn) {
    exitSearchBtn.addEventListener('click', () => {
        const searchScreen = document.getElementById('search-screen');
        const editSelectionScreen = document.getElementById('edit-selection-screen');
        const generalSearchSelectionScreen = document.getElementById('general-search-selection-screen');
        const leagueEditScreen = document.getElementById('league-edit-screen');

        let returnScreen = editSelectionScreen; // Default fallback

        // Depending on what mode we were in, the "Back" button needs to take us to a different screen.
        switch (appState.search.currentMode) {
            case 'createPlayer':
            case 'switchTeam':
                returnScreen = editSelectionScreen;
                break;
            case 'playerEdit':
            case 'teamEdit':
                returnScreen = generalSearchSelectionScreen;
                break;
            case 'leaguePlayerEdit':
                returnScreen = leagueEditScreen;
                break;
            default:
                returnScreen = editSelectionScreen;
        }

        if (searchScreen && returnScreen) {
             transitionTo(searchScreen, returnScreen);
        } else {
             console.error("Navigation Error: Missing screen elements.");
             // Fallback if something is broken
             if(searchScreen) searchScreen.classList.add('hidden');
             if(returnScreen) returnScreen.classList.remove('hidden');
        }
    });
}