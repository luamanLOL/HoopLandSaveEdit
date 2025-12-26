/**
 COMMUNITY NOTE THIS FILE: handles the file processing workflow. It reads the file, sanitizes its content,
 * parses it as JSON, validates the structure, and passes the data to the next step.
 * @param {File} file - The save file selected by the user.
 */
function handleFile(file) {
    console.log("handleFile: Starting to process file:", file.name);
    const fileDropContainer = document.getElementById('file-drop-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const loadingMessage = document.getElementById('loading-message');
    const fileUploadScreen = document.getElementById('file-upload-screen');
    const leagueSelectionScreen = document.getElementById('league-selection-screen');
    const discordPopup = document.getElementById('discord-popup');
    const discordAlreadyInBtn = document.getElementById('discord-already-in-btn');
    const discordCountdown = document.getElementById('discord-countdown');

    fileDropContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    loadingMessage.textContent = 'Loading Save File...';

    const reader = new FileReader();

    reader.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            loadingMessage.textContent = `Loading Save File... ${percent}%`;
        }
    };

    reader.onload = (event) => {
        try {
            loadingMessage.textContent = 'Parsing Save Data...';
            console.log("handleFile (onload): File read complete. Attempting to parse JSON.");
            const fileContent = event.target.result;
            if (!fileContent) {
                console.error("handleFile (onload): File content is empty or null.");
                showToast("Error: File is empty.", 'error', 4000);
                return;
            }

            
            // 1. Force the file content into a single line by removing newlines.
            console.log("handleFile (onload): Forcing file content to a single line.");
            const singleLineContent = fileContent.replace(/(\r\n|\n|\r)/gm, "");

            // 2. Parse the sanitized content.
            let parsedData = JSON.parse(singleLineContent);

            // 3. Check if the 'seasonLeagues' wrapper is missing and add it if necessary.
            if (!parsedData.seasonLeagues) {
                console.log("handleFile (onload): No seasonLeagues property found, wrapping data.");
                parsedData = { seasonLeagues: [parsedData] };
            }
            

            // Correctly assign the standardized data to the global appState object
            appState.loadedSaveData = parsedData;
            
            saveToDB(appState.loadedSaveData).then(() => {
                console.log("handleFile (onload): JSON parsed and saved to DB. Full save data:", appState.loadedSaveData);

                if (appState.loadedSaveData && appState.loadedSaveData.seasonLeagues && appState.loadedSaveData.seasonLeagues.length > 0) {
                    console.log("handleFile (onload): Found leagues. Count:", appState.loadedSaveData.seasonLeagues.length);
                    const leagueDataForCards = extractLeagueData(appState.loadedSaveData.seasonLeagues);
                    renderLeagueCards(leagueDataForCards); 

                    document.getElementById('local-player-info').classList.add('local-player-info-initial-state');

                    setTimeout(() => {
                        transitionTo(fileUploadScreen, leagueSelectionScreen);
                        if (discordPopup) {
                            discordPopup.classList.add('show');
                            let timeLeft = 5;
                            if (discordCountdown) discordCountdown.textContent = ` (${timeLeft}s)`;
                            if (discordAlreadyInBtn) discordAlreadyInBtn.classList.add('disabled');

                            appState.countdownTimer = setInterval(() => {
                                timeLeft--;
                                if (discordCountdown) discordCountdown.textContent = ` (${timeLeft}s)`;
                                if (timeLeft <= 0) {
                                    clearInterval(appState.countdownTimer);
                                    appState.countdownTimer = null;
                                    if (discordCountdown) discordCountdown.textContent = '';
                                    if (discordAlreadyInBtn) discordAlreadyInBtn.classList.remove('disabled');
                                }
                            }, 1000);
                        }
                    }, 1500);

                } else {
                    console.error("handleFile (onload): No league data found in save file.");
                    showToast("Error: No league data found in save file.", 'error', 4000);
                    loadingIndicator.classList.add('hidden');
                    fileDropContainer.classList.remove('hidden');
                };
            }).catch(err => {
                console.error("Failed to save to DB:", err);
                showToast("Error: Failed to save data. DB Error", 'error', 4000);
                loadingIndicator.classList.add('hidden');
                fileDropContainer.classList.remove('hidden');
            });
        } catch (error) {
            console.error("handleFile (onload): Error parsing JSON:", error);
            showToast("Error: Could not parse save file. Is it corrupted?", 'error', 4000);
            loadingIndicator.classList.add('hidden');
            fileDropContainer.classList.remove('hidden');
        }
    };
    reader.onerror = () => {
        console.error("handleFile (onerror): Error reading file.");
        showToast("Error: Could not read the file.", 'error', 4000);
        loadingIndicator.classList.add('hidden');
        fileDropContainer.classList.remove('hidden');
    };
    reader.readAsText(file);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function extractLeagueData(leaguesArray) {
    console.log("extractLeagueData: Starting extraction for leagues:", leaguesArray);
    const noLeaguesMessage = document.getElementById('no-leagues-message');
    const processedLeagues = [];

    if (!leaguesArray || leaguesArray.length === 0) {
        console.error("extractLeagueData: leaguesArray is null or empty.");
        return processedLeagues;
    }

    leaguesArray.forEach((league, index) => {
        console.log(`extractLeagueData: Processing league ${index}:`, league.leagueName);
        const teamsInLeague = league.teams || [];
        const starTeamsInLeague = league.starTeams || [];
        let allPlayersInLeague = [];

        teamsInLeague.forEach(team => {
            if (team && team.roster && Array.isArray(team.roster)) {
                allPlayersInLeague.push(...team.roster.map(p => ({ ...p, teamId: team.id })));
            } else {
                console.warn(`extractLeagueData: Team ${team?.name} has no valid roster.`);
            }
        });

        starTeamsInLeague.forEach(starTeam => {
            if (starTeam && starTeam.roster && Array.isArray(starTeam.roster)) {
                allPlayersInLeague.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id })));
            } else {
                console.warn(`extractLeagueData: Star Team ${starTeam?.name} has no valid roster.`);
            }
        });
        console.log(`extractLeagueData: League ${index} total raw players found:`, allPlayersInLeague.length);


        const uniquePlayers = {};
        allPlayersInLeague.forEach(player => {
            if (player && player.id !== undefined) {
                uniquePlayers[player.id.toString()] = player;
            }
        });
        allPlayersInLeague = Object.values(uniquePlayers);
        console.log(`extractLeagueData: League ${index} unique players:`, allPlayersInLeague.length);


        let totalAge = 0;
        let totalHeightInInches = 0;
        let totalPotentialConverted = 0;

        allPlayersInLeague.forEach(player => {
            if (player) {
                totalAge += player.age || 0;
                totalHeightInInches += player.ht || 0; 
                totalPotentialConverted += (player.pot !== undefined ? player.pot / 2 : 0);
            }
        });

        const avgAge = allPlayersInLeague.length > 0 ? (totalAge / allPlayersInLeague.length).toFixed(1) : 'N/A';
        const avgHeightInches = allPlayersInLeague.length > 0 ? (totalHeightInInches / allPlayersInLeague.length) : 0;
        const avgHeightFormatted = allPlayersInLeague.length > 0 ? convertInchesToFeetAndInches(avgHeightInches) : 'N/A';
        const avgPotential = allPlayersInLeague.length > 0 ? (totalPotentialConverted / allPlayersInLeague.length).toFixed(1) : 'N/A';

        const leagueInfo = {
            id: index.toString(),
            name: league.leagueName,
            players: allPlayersInLeague.length,
            teams: teamsInLeague.length,
            starTeams: starTeamsInLeague.length,
            avgAge: avgAge,
            avgHeight: avgHeightFormatted,
            avgPotential: avgPotential
        };
        processedLeagues.push(leagueInfo);
        console.log(`extractLeagueData: Finished processing league ${index}. Data:`, leagueInfo);
    });

    if (processedLeagues.length === 0) {
        noLeaguesMessage.classList.remove('hidden');
        console.warn("extractLeagueData: No leagues were processed.");
    } else {
        noLeaguesMessage.classList.add('hidden');
    }

    console.log("extractLeagueData: Final processed leagues data:", processedLeagues);
    return processedLeagues;
}

// I kept this here because extractLeagueData depends on it. Muddy, quit moving it!
function convertInchesToFeetAndInches(totalInches) {
    if (isNaN(totalInches) || totalInches <= 0) return 'N/A';
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
}