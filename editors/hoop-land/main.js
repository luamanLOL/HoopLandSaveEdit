// --- GLOBAL APPLICATION STATE ---
// Alright, so here's the global state. This object keeps track of everything happening in the app right now.
// I tried to explain my thought process in the comments as I went along. Hopefully, it makes sense!
const appState = {
    isTransitioning: false,
    loadedSaveData: null,
    currentLeague: null,
    localPlayer: null,
    localTeam: null,
    currentLeagueCoins: 0,
    currentLeagueFans: 0,
    countdownTimer: null,
    search: {
        allPlayers: [],
        allTeams: [],
        currentMode: 'general',
        currentSort: {},
        filters: { positions: [], potential: { min: null, max: null } }
    }
};

function navigateWithFade(url) {
    document.body.classList.remove('loaded');
    document.body.classList.add('fading-out');
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("main.js: DOM fully loaded and parsed.");
    
    // I moved all the DOM element references up here to keep things organized and easy to find.
    const fileUploadScreen = document.getElementById('file-upload-screen');
    const leagueSelectionScreen = document.getElementById('league-selection-screen');
    const editSelectionScreen = document.getElementById('edit-selection-screen');
    const generalSearchSelectionScreen = document.getElementById('general-search-selection-screen');
    const searchScreen = document.getElementById('search-screen');
    const leagueEditScreen = document.getElementById('league-edit-screen');
    const localPlayerSelectionScreen = document.getElementById('local-player-selection-screen');
    const localPlayerAttributeEditScreen = document.getElementById('local-player-attribute-edit-screen');
    const localPlayerStatsEditScreen = document.getElementById('local-player-stats-edit-screen');
    
    const backToLeaguesBtn = document.getElementById('back-to-leagues-btn');
    const backToEditSelectionBtn = document.getElementById('back-to-edit-selection-btn');
    const backToEditMenuBtn = document.getElementById('back-to-edit-menu-btn');
    const backToEditFromLeagueBtn = document.getElementById('back-to-edit-from-league-btn');
    const backToEditSelectionFromLocalPlayerBtn = document.getElementById('back-to-edit-selection-from-local-player-btn');
    const backToLocalPlayerMenuBtn = document.getElementById('back-to-local-player-menu-btn');
    const backToLocalPlayerMenuFromStatsBtn = document.getElementById('back-to-local-player-menu-from-stats-btn');

    const selectFileBtn = document.getElementById('select-file-btn');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const leagueCardContainer = document.getElementById('league-card-container');
    
    const localPlayerCard = document.getElementById('local-player-card');
    const localTeamCard = document.getElementById('local-team-card');
    const createPlayerCard = document.getElementById('create-player-card');
    const generalSearchCard = document.getElementById('general-search-card');
    const playerEditCard = document.getElementById('player-edit-card');
    const teamEditCard = document.getElementById('team-edit-card');
    const leagueEditMainCard = document.getElementById('league-edit-main-card');
    const leagueSettingsCard = document.getElementById('league-settings-card');
    const leagueStatsEditCard = document.getElementById('league-stats-edit-card');
    const localAttributeEditCard = document.getElementById('local-attribute-edit-card');
    const localStatsEditCard = document.getElementById('local-stats-edit-card');

    const discordAlreadyInBtn = document.getElementById('discord-already-in-btn');
    const discordJoinBtn = document.getElementById('discord-join-btn');

    // I added a slight delay here to trigger the fade-in effect smoothly.
    setTimeout(() => document.body.classList.add('loaded'), 50);

    // First things first, I'm checking if there's any data saved in IndexedDB so we can load it up immediately.
    try {
        const storedData = await loadFromDB();
        if (storedData) {
            console.log("Main Hub: Loaded latest data from IndexedDB.");
            appState.loadedSaveData = storedData;
            
            // If we have data, I'm validating it and then rendering the league cards.
            if (appState.loadedSaveData && appState.loadedSaveData.seasonLeagues && appState.loadedSaveData.seasonLeagues.length > 0) {
                const leagueDataForCards = extractLeagueData(appState.loadedSaveData.seasonLeagues);
                renderLeagueCards(leagueDataForCards);
                
                document.getElementById('file-upload-screen').classList.add('hidden');

                const urlParams = new URLSearchParams(window.location.search);
                
                if (urlParams.get('action') === 'switch-team') {
                    // I need to make sure the active league is selected, so I'm pulling the index from local storage.
                    const storedIndex = localStorage.getItem('activeLeagueIndex');
                    const leagueIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
                    
                    appState.currentLeague = appState.loadedSaveData.seasonLeagues[leagueIndex];
                    
                    if (appState.currentLeague) {
                        // Here I'm flattening the roster data so it's easier to search through players and teams later.
                        appState.currentLeague.allPlayers = [];
                        (appState.currentLeague.teams || []).forEach(team => { if (team && team.roster) appState.currentLeague.allPlayers.push(...team.roster.map(p => ({ ...p, teamId: team.id, teamAbbr: team.abbr, teamName: team.name }))); });
                        (appState.currentLeague.starTeams || []).forEach(starTeam => { if (starTeam && starTeam.roster) appState.currentLeague.allPlayers.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id, teamAbbr: starTeam.abbr, teamName: starTeam.name }))); });
                        
                        initializeSearch('switchTeam');
                        transitionTo(editSelectionScreen, searchScreen);
                        const searchTitleEl = document.getElementById('search-title');
                        if (searchTitleEl) {
                            searchTitleEl.textContent = "Select New Team";
                            searchTitleEl.style.display = 'block'; 
                        }
                    }
                } else if (urlParams.get('action') === 'poach-player') {
                    // Okay, this part handles the "poach player" functionality when you're coming from another screen.
                    const destTeamId = urlParams.get('destTeamId');
                    if (destTeamId) {
                        // I'm saving the destination team ID so the search logic knows where to send the player.
                        localStorage.setItem('poachDestTeamId', destTeamId);
                        
                        // I need to make sure the active league is selected, so I'm pulling the index from local storage.
                        const storedIndex = localStorage.getItem('activeLeagueIndex');
                        const leagueIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
                        
                        appState.currentLeague = appState.loadedSaveData.seasonLeagues[leagueIndex];
                        
                        if (appState.currentLeague) {
                            // Here I'm flattening the roster data so it's easier to search through players and teams later.
                            appState.currentLeague.allPlayers = [];
                            (appState.currentLeague.teams || []).forEach(team => { if (team && team.roster) appState.currentLeague.allPlayers.push(...team.roster.map(p => ({ ...p, teamId: team.id, teamAbbr: team.abbr, teamName: team.name }))); });
                            (appState.currentLeague.starTeams || []).forEach(starTeam => { if (starTeam && starTeam.roster) appState.currentLeague.allPlayers.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id, teamAbbr: starTeam.abbr, teamName: starTeam.name }))); });
                            
                            // Since we're poaching, I want the search screen to pop up right away.
                            initializeSearch('poachPlayer'); 
                            transitionTo(editSelectionScreen, searchScreen);
                            
                            // I'm updating the title so the user knows they are selecting a player to poach.
                            const titleEl = document.getElementById('search-title'); 
                            if(titleEl) {
                                titleEl.textContent = "Select Player to Poach";
                                titleEl.style.display = 'block';
                            }
                        }
                    }
                } else if (urlParams.get('state') === 'restore') {
                    console.log("State restore detected: bypassing to dashboard.");
                    // I need to make sure the active league is selected, so I'm pulling the index from local storage.
                    const storedIndex = localStorage.getItem('activeLeagueIndex');
                    const leagueIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
                    
                    appState.currentLeague = appState.loadedSaveData.seasonLeagues[leagueIndex];
                    
                    if (appState.currentLeague) {
                        // Here I'm flattening the roster data so it's easier to search through players and teams later.
                        appState.currentLeague.allPlayers = [];
                        (appState.currentLeague.teams || []).forEach(team => { if (team && team.roster) appState.currentLeague.allPlayers.push(...team.roster.map(p => ({ ...p, teamId: team.id, teamAbbr: team.abbr, teamName: team.name }))); });
                        (appState.currentLeague.starTeams || []).forEach(starTeam => { if (starTeam && starTeam.roster) appState.currentLeague.allPlayers.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id, teamAbbr: starTeam.abbr, teamName: starTeam.name }))); });
                        
                        const userPlayerId = appState.currentLeague.season?.playerId;
                        const userTeamId = appState.currentLeague.season?.teamId;

                        appState.currentLeagueCoins = appState.currentLeague.career?.coins || 0;
                        appState.currentLeagueFans = appState.currentLeague.career?.fans || 0;
                        
                        appState.localPlayer = userPlayerId ? appState.currentLeague.allPlayers.find(p => p && p.id?.toString() === userPlayerId.toString()) : null;
                        appState.localTeam = userTeamId ? [...(appState.currentLeague.teams || []), ...(appState.currentLeague.starTeams || [])].find(t => t && t.id?.toString() === userTeamId.toString()) : null;

                        if (appState.localTeam) {
                            document.getElementById('local-team-card-name').textContent = appState.localTeam.name;
                        }

                        updateLocalPlayerInfoDisplay();
                        initializeSearch('general');
                        document.getElementById('editing-league-title').textContent = `EDITING: ${appState.currentLeague.name || appState.currentLeague.leagueName}`;
                        document.getElementById('league-edit-desc').textContent = `Edit global settings for the "${appState.currentLeague.name || appState.currentLeague.leagueName}".`;
                        
                        document.getElementById('edit-selection-screen').classList.remove('hidden');
                    } else {
                        document.getElementById('league-selection-screen').classList.remove('hidden');
                    }
                } else {
                    document.getElementById('league-selection-screen').classList.remove('hidden');
                }
            }
        } else {
             console.log("Main Hub: No data in DB, waiting for upload.");
        }
    } catch (e) {
        console.error("Main Hub load error:", e);
    }
    
    // Everyone likes a dark mode, right? Here's the logic for toggling the theme.
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');

    const applyTheme = (theme) => {
        const isDark = theme === 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggleIcon.classList.toggle('fa-sun', !isDark);
        themeToggleIcon.classList.toggle('fa-moon', isDark);
    };

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Now for the interactive part. I'm setting up all the event listeners for buttons and stuff.
    console.log("main.js: Adding event listeners.");

    // These handle all the "Back" button clicks to navigate between screens.
    backToLeaguesBtn.addEventListener('click', () => transitionTo(editSelectionScreen, leagueSelectionScreen));
    backToEditSelectionBtn.addEventListener('click', () => transitionTo(generalSearchSelectionScreen, editSelectionScreen));
    backToEditFromLeagueBtn.addEventListener('click', () => transitionTo(leagueEditScreen, editSelectionScreen));
    backToEditSelectionFromLocalPlayerBtn.addEventListener('click', () => transitionTo(localPlayerSelectionScreen, editSelectionScreen));
    backToLocalPlayerMenuBtn.addEventListener('click', () => transitionTo(localPlayerAttributeEditScreen, localPlayerSelectionScreen));
    backToLocalPlayerMenuFromStatsBtn.addEventListener('click', () => transitionTo(localPlayerStatsEditScreen, localPlayerSelectionScreen));

    if (backToEditMenuBtn) {
        backToEditMenuBtn.addEventListener('click', () => {
            if (appState.search.currentMode === 'playerEdit' || appState.search.currentMode === 'teamEdit') {
                transitionTo(searchScreen, generalSearchSelectionScreen);
            } else {
                transitionTo(searchScreen, editSelectionScreen);
            }
        });
    }

    // Just some logic to handle the Discord popup appearing and closing.
    if (discordAlreadyInBtn) discordAlreadyInBtn.addEventListener('click', () => { if (!discordAlreadyInBtn.classList.contains('disabled')) closeDiscordPopup(); });
    if (discordJoinBtn) discordJoinBtn.addEventListener('click', closeDiscordPopup);

    // This handles what happens when you click on a league card.
    leagueCardContainer.addEventListener('click', (e) => {
        const leagueCard = e.target.closest('.edit-league-btn'); 
        
        if (leagueCard) {
            const leagueIndex = parseInt(leagueCard.dataset.leagueIndex, 10);
            
            if (isNaN(leagueIndex) || !appState.loadedSaveData.seasonLeagues[leagueIndex]) {
                console.error(`main.js: Invalid league index or league data not found for index: ${leagueIndex}`);
                showToast('Error: Could not find data for the selected league.', 'error');
                return;
            }

            localStorage.setItem('activeLeagueIndex', leagueIndex);
            appState.currentLeague = appState.loadedSaveData.seasonLeagues[leagueIndex];

            if (appState.currentLeague) {
                appState.currentLeague.allPlayers = [];
                (appState.currentLeague.teams || []).forEach(team => { if (team && team.roster) appState.currentLeague.allPlayers.push(...team.roster.map(p => ({ ...p, teamId: team.id, teamAbbr: team.abbr, teamName: team.name }))); });
                (appState.currentLeague.starTeams || []).forEach(starTeam => { if (starTeam && starTeam.roster) appState.currentLeague.allPlayers.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id, teamAbbr: starTeam.abbr, teamName: starTeam.name }))); });
                
                const userPlayerId = appState.currentLeague.season?.playerId;
                const userTeamId = appState.currentLeague.season?.teamId;

                appState.currentLeagueCoins = appState.currentLeague.career?.coins || 0;
                appState.currentLeagueFans = appState.currentLeague.career?.fans || 0;
                
                appState.localPlayer = userPlayerId ? appState.currentLeague.allPlayers.find(p => p && p.id?.toString() === userPlayerId.toString()) : null;
                appState.localTeam = userTeamId ? [...(appState.currentLeague.teams || []), ...(appState.currentLeague.starTeams || [])].find(t => t && t.id?.toString() === userTeamId.toString()) : null;

                if (appState.localTeam) {
                    document.getElementById('local-team-card-name').textContent = appState.localTeam.name;
                }

                updateLocalPlayerInfoDisplay();
                document.getElementById('editing-league-title').textContent = `EDITING: ${appState.currentLeague.name || appState.currentLeague.leagueName}`;
                document.getElementById('league-edit-desc').textContent = `Edit global settings for the "${appState.currentLeague.name || appState.currentLeague.leagueName}".`;
                transitionTo(leagueSelectionScreen, editSelectionScreen);
            } else {
                showToast('Error: Selected league data could not be processed.', 'error');
            }
        }
    });

    // Here are the listeners for the main edit options like Local Player, Team, etc.
    localPlayerCard.addEventListener('click', () => {
        if (appState.localPlayer) {
            navigateWithFade('Local-player/index.html');
        } else {
            showToast('No local player found in this league.', 'error');
        }
    });

    localTeamCard.addEventListener('click', () => {
        if (appState.localTeam) {
            localStorage.removeItem('editingTeamId');
            navigateWithFade('Team-editor/index.html');
        } else {
            showToast('No local team found in this league.', 'error');
        }
    });

    createPlayerCard.addEventListener('click', () => {
        if (appState.currentLeague) {
            initializeSearch('createPlayer');
            transitionTo(editSelectionScreen, searchScreen);
        } else {
            showToast('No league selected.', 'error');
        }
    });

    generalSearchCard.addEventListener('click', () => {
        if (appState.currentLeague) {
            transitionTo(editSelectionScreen, generalSearchSelectionScreen);
        } else {
            showToast('No league selected.', 'error');
        }
    });
    
    playerEditCard.addEventListener('click', () => {
        if (appState.currentLeague) {
            initializeSearch('playerEdit');
            transitionTo(generalSearchSelectionScreen, searchScreen);
        } else {
            showToast('No league selected.', 'error');
        }
    });

    teamEditCard.addEventListener('click', () => {
        if (appState.currentLeague) {
            initializeSearch('teamEdit');
            transitionTo(generalSearchSelectionScreen, searchScreen);
        } else {
            showToast('No league selected.', 'error');
        }
    });

    leagueEditMainCard.addEventListener('click', () => transitionTo(editSelectionScreen, leagueEditScreen));
    leagueSettingsCard.addEventListener('click', () => {
        navigateWithFade('league-settings-editor/index.html');
    });
    leagueStatsEditCard.addEventListener('click', () => {
        document.getElementById('mass-edit-league-modal').classList.remove('hidden');
    });

    // This functionality allows users to apply changes to the entire league at once, like a "God Mode".
    const massEditLeagueModal = document.getElementById('mass-edit-league-modal');
    const massEditLeagueClose = document.getElementById('mass-edit-league-close');
    
    if (massEditLeagueClose) {
        massEditLeagueClose.addEventListener('click', () => {
            massEditLeagueModal.classList.add('hidden');
        });
    }

    document.querySelectorAll('.mass-edit-league-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!appState.currentLeague || !appState.currentLeague.allPlayers) return;
            
            const action = btn.dataset.action;
            let msg = "";
            let count = 0;

            appState.currentLeague.allPlayers.forEach(p => {
                count++;
                if (action === 'god-mode') {
                    if (!p.attributes) p.attributes = {};
                    const keys = ['LAY', 'DNK', 'INS', 'MID', 'TPT', 'FTS', 'DRB', 'PAS', 'ORE', 'DRE', 'STL', 'BLK', 'SPD', 'STR', 'STM'];
                    keys.forEach(k => { p.attributes[k] = [20, 20]; }); // 20 Internal = 10 Display
                    msg = "All Players Maxed!";
                }
                else if (action === 'health-potion') {
                    p.injury = { gamesOut: 0, type: 0 };
                    p.condition = 100;
                    msg = "League Health Restored!";
                }
                else if (action === 'cap-cleaner') {
                    if (!p.contract) p.contract = { yrs: 1, sal: 0, noTrd: 0 };
                    p.contract.sal = 0;
                    msg = "League Contracts Freed!";
                }
                else if (action === 'contract-lock') {
                    if (!p.contract) p.contract = { yrs: 1, sal: 0, noTrd: 0 };
                    p.contract.yrs = 100;
                    p.contract.noTrd = 1;
                    msg = "League Contracts Locked!";
                }
            });

            // I'm saving the changes to the DB right after the mass edit is applied.
            saveToDB(appState.loadedSaveData);
            
            massEditLeagueModal.classList.add('hidden');
            showToast(`${msg} (${count} players updated)`);
        });
    });

    // Handling file selection and drag-and-drop functionality here.
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => fileDropZone.addEventListener(e, preventDefaults, false));
    ['dragenter', 'dragover'].forEach(e => fileDropZone.addEventListener(e, () => fileDropZone.classList.add('dragover'), false));
    ['dragleave', 'drop'].forEach(e => fileDropZone.addEventListener(e, () => fileDropZone.classList.remove('dragover'), false));
    fileDropZone.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, false);

    
    const saveBtn = document.getElementById('save-modded-file-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => { // Make async
            // First, I show the "Saving" overlay so the user knows something is happening.
            const overlay = document.getElementById('save-overlay');
            const progressBar = document.getElementById('save-progress-bar');
            const statusText = document.getElementById('save-status-text');
            
            overlay.classList.remove('hidden');
            
            // Just to be safe, I'm re-fetching the latest data from the DB before packaging it.
            // Before we package the file, let's grab the ABSOLUTE LATEST from the DB
            // just in case appState.loadedSaveData is somehow broke or sum.
            try {
                const freshData = await loadFromDB();
                if (freshData) {
                    appState.loadedSaveData = freshData;
                    console.log("Save Button: Refreshed data from DB.");
                }
            } catch (e) {
                console.warn("Could not refresh from DB, using memory state.");
            }

            // I added a fake progress bar here just to make it look cool while it prepares the download.
            let width = 0;
            const duration = 5000; // 5 seconds
            const intervalTime = 50;
            const step = 100 / (duration / intervalTime);
            
            const timer = setInterval(() => {
                width += step;
                if (width >= 100) {
                    width = 100;
                    clearInterval(timer);
                    
                    // Once the progress bar hits 100%, we trigger the download.
                    statusText.textContent = "Download Starting...";
                    
                    setTimeout(() => {
                        // Trigger the ACTUAL download
                        downloadObjectAsJson(appState.loadedSaveData, "hoop-land-modded-save");
                        
                        sendExportWebhook("Hoop Land");

                        // After the download, I'm clearing the DB and reloading the page to reset everything.
                        setTimeout(() => {
                            // Clear DB to prevent errors on next load
                            const deleteReq = indexedDB.deleteDatabase('HoopLandDB');
                            deleteReq.onsuccess = () => console.log("DB Deleted");
                            deleteReq.onerror = () => console.warn("DB Delete failed");
                             
                            localStorage.clear();
                            
                            // Reset UI
                            location.reload(); 
                        }, 2000);
                    }, 500);
                }
                progressBar.style.width = width + '%';
            }, intervalTime);
        });
    }
});

function downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

/**
 * Sends a webhook to Discord with a Global Export Count.
 * Uses abacus.jasoncameron.dev (a free CountAPI alternative).
 */
async function sendExportWebhook(gameName) {
    const webhookURL = "https://discord.com/api/webhooks/1453972526777766081/IHCa60X3FPz8qaS8F8lBPGpwRfYqMs3X_w5UOH5xVMYcoVFamF5dugHNp863uxn0gvK1"; // PASTE YOUR WEBHOOK URL HERE
    
    const namespace = "SaveXF"; 
    const key = gameName.replace(/\s+/g, '-').toLowerCase() + "-exports"; // e.g., "retro-bowl-exports"

    let globalCount = "N/A";

    try {
        const countRes = await fetch(`https://abacus.jasoncameron.dev/hit/${namespace}/${key}`);
        
        if (countRes.ok) {
            const countData = await countRes.json();
            globalCount = countData.value;
        } else {
            console.warn("Counter API returned error:", countRes.status);
        }
    } catch (err) {
        console.warn("Could not fetch global count (API might be down):", err);
    }

    
    // 1. Extract Hoop Land Specifics
    const league = appState.currentLeague || {};
    const leagueName = league.name || league.leagueName || "Unknown League";
    const seasonYear = (league.season && league.season.year) ? `Year ${league.season.year}` : "N/A";
    
    // Attempt to find user team/player names
    let userTeam = "None";
    if (appState.localTeam) userTeam = appState.localTeam.name || appState.localTeam.city + " " + appState.localTeam.name;
    
    let userPlayer = "None";
    if (appState.localPlayer) userPlayer = `${appState.localPlayer.firstName} ${appState.localPlayer.lastName}`;

    const coins = appState.currentLeagueCoins || "0";

    // 2. Browser Stats
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const timeSpent = (performance.now() / 1000 / 60).toFixed(1) + " mins";

    const payload = {
        content: null,
        embeds: [{
            title: `🏀 Export: ${gameName}`,
            description: `**Total Global Exports:** \`${globalCount}\``,
            color: 3447003, // Hoop Land Blue
            fields: [
                // Row 1: League Info
                { name: "🏆 League", value: leagueName, inline: true },
                { name: "📅 Season", value: seasonYear, inline: true },
                { name: "🪙 Coins", value: coins.toString(), inline: true },

                // Row 2: User Context
                { name: "🏟️ Team", value: userTeam, inline: true },
                { name: "👤 My Player", value: userPlayer, inline: true },
                { name: "⏱️ Edit Time", value: timeSpent, inline: true },

                // Row 3: Device
                { name: "🖥️ Resolution", value: screenRes, inline: true },
                { name: "📱 Platform", value: navigator.platform, inline: true }
            ],
            footer: { text: "Hoop Land Editor Logger" }
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Webhook Error:", err));
}

