// --- UI/UX FUNCTIONS ---

// Helper functions for UI stuff like transitions and popups.
function transitionTo(outgoingScreen, incomingScreen) {
    if (appState.isTransitioning) return;
    appState.isTransitioning = true;
    outgoingScreen.classList.add('fade-out');
    setTimeout(() => {
        outgoingScreen.classList.add('hidden');
        outgoingScreen.classList.remove('fade-out');
        incomingScreen.classList.remove('hidden');
        setTimeout(() => {
            incomingScreen.classList.remove('fade-out');
            appState.isTransitioning = false;
        }, 50);
    }, 500);
}

function closeDiscordPopup() {
    const discordPopup = document.getElementById('discord-popup');
    if (discordPopup) {
        discordPopup.classList.remove('show');
        if (appState.countdownTimer) {
            clearInterval(appState.countdownTimer);
            appState.countdownTimer = null;
        }
    }
}

function updateLocalPlayerInfoDisplay() {
    const localPlayerInfoDisplay = document.getElementById('local-player-info');
    const localPlayerNameDisplay = document.getElementById('local-player-name');
    const localPlayerTagDisplay = document.getElementById('local-player-tag');
    const localPlayerCoinsDisplay = document.getElementById('local-player-coins');
    const localPlayerFansDisplay = document.getElementById('local-player-fans');
    const localPlayerFameDisplay = document.getElementById('local-player-fame');
    const localPlayerCard = document.getElementById('local-player-card');
    const localPlayerCardDesc = document.getElementById('local-player-card-desc');

    if (localPlayerCard && localPlayerCardDesc) {
        if (appState.localPlayer) {
            localPlayerNameDisplay.textContent = `${appState.localPlayer.fn} ${appState.localPlayer.ln}`;
            localPlayerTagDisplay.textContent = appState.localPlayer.tag ? `@${appState.localPlayer.tag}` : '';
            localPlayerCoinsDisplay.textContent = appState.currentLeagueCoins.toLocaleString();
            localPlayerFansDisplay.textContent = appState.currentLeagueFans.toLocaleString();
            localPlayerFameDisplay.textContent = getFameLevel(appState.currentLeagueFans);
            localPlayerInfoDisplay.classList.remove('local-player-info-initial-state');

            localPlayerCard.querySelector('.edit-option-title').innerHTML = `Local Player: <span id="local-player-card-name">${appState.localPlayer.fn} ${appState.localPlayer.ln}</span>`;
            localPlayerCardDesc.textContent = "Directly edit your currently selected player's attributes and contract.";
            localPlayerCard.classList.remove('disabled');
            localPlayerCard.style.pointerEvents = 'auto';
        } else {
            localPlayerNameDisplay.textContent = 'Player N/A';
            localPlayerTagDisplay.textContent = '';
            localPlayerCoinsDisplay.textContent = '0';
            localPlayerFansDisplay.textContent = '0';
            localPlayerFameDisplay.textContent = '';
            localPlayerInfoDisplay.classList.add('local-player-info-initial-state');

            localPlayerCard.querySelector('.edit-option-title').innerHTML = 'Join this League';
            localPlayerCardDesc.textContent = "Force player to join this league regardless of status and age.";
            localPlayerCard.classList.remove('disabled');
            localPlayerCard.style.pointerEvents = 'auto';
        }
    }
}

function getFameLevel(fans) {
    if (fans >= 100000) return "Global Icon";
    if (fans >= 10000) return "National Star";
    if (fans >= 1000) return "Local Legend";
    return "Hometown Hero";
}

function convertInchesToFeetAndInches(totalInches) {
    if (totalInches === 0 || isNaN(totalInches)) return "N/A";
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
}

function renderLeagueCards(leagues) {
    const leagueCardContainer = document.getElementById('league-card-container');
    const noLeaguesMessage = document.getElementById('no-leagues-message');
    const template = document.getElementById('league-card-template');

    leagueCardContainer.innerHTML = ''; // Clear previous cards

    if (!leagues || leagues.length === 0) {
        noLeaguesMessage.classList.remove('hidden');
        return;
    }

    noLeaguesMessage.classList.add('hidden');

    leagues.forEach(league => {
        const cardClone = template.content.cloneNode(true);
        const cardElement = cardClone.querySelector('.sports-card');

        cardElement.dataset.leagueIndex = league.id;
        cardElement.querySelector('.card-title').textContent = league.name;
        cardElement.querySelector('.card-subtitle').textContent = `${league.players} Players | ${league.teams} Teams`;
        cardElement.querySelector('.avg-age').textContent = league.avgAge;
        cardElement.querySelector('.avg-height').textContent = league.avgHeight;
        cardElement.querySelector('.avg-potential').textContent = league.avgPotential;

        leagueCardContainer.appendChild(cardClone);
    });
}


let toastTimeout;
function showToast(message, type = 'success', duration = 3000) {
    const notificationToast = document.getElementById('notification-toast');
    if (toastTimeout) clearTimeout(toastTimeout);
    notificationToast.textContent = message;
    notificationToast.className = 'show';
    if (type === 'error') notificationToast.classList.add('error');
    toastTimeout = setTimeout(() => notificationToast.classList.remove('show', 'error'), duration);
}

