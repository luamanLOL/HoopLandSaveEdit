document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const fileUploadScreen = document.getElementById('file-upload-screen');
    const leagueSelectionScreen = document.getElementById('league-selection-screen');
    const editSelectionScreen = document.getElementById('edit-selection-screen');
    const createPlayerScreen = document.getElementById('create-player-screen'); // New screen

    // Interactive elements
    const selectFileBtn = document.getElementById('select-file-btn');
    const fileDropContainer = document.getElementById('file-drop-container');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const notificationToast = document.getElementById('notification-toast');
    const backToLeaguesBtn = document.getElementById('back-to-leagues-btn');
    const backToEditMenuBtn = document.getElementById('back-to-edit-menu-btn'); // New back button
    const createPlayerCard = document.getElementById('create-player-card'); // Specific ID for the card

    let isTransitioning = false;
    let loadedSaveData = null;

    // --- SCREEN TRANSITIONS ---
    function transitionTo(outgoingScreen, incomingScreen) {
        if (isTransitioning) return;
        isTransitioning = true;
        outgoingScreen.classList.add('fade-out');
        setTimeout(() => {
            outgoingScreen.classList.add('hidden');
            outgoingScreen.classList.remove('fade-out');
            incomingScreen.classList.remove('hidden');
            setTimeout(() => {
                incomingScreen.classList.remove('fade-out');
                isTransitioning = false;
            }, 50);
        }, 500);
    }

    // --- EVENT LISTENERS ---

    backToLeaguesBtn.addEventListener('click', () => {
        transitionTo(editSelectionScreen, leagueSelectionScreen);
    });

    // New listener for the back button on the Create Player screen
    backToEditMenuBtn.addEventListener('click', () => {
        transitionTo(createPlayerScreen, editSelectionScreen);
    });

    document.querySelectorAll('.edit-league-btn').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.league-card');
            const leagueData = {
                name: card.dataset.leagueName,
                players: card.dataset.playerCount,
                teams: card.dataset.teamCount
            };
            setupEditScreen(leagueData);
            transitionTo(leagueSelectionScreen, editSelectionScreen);
        });
    });

    // Updated listener for all edit option cards
    document.querySelectorAll('.edit-option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Check if the clicked card is the "Create Player" one
            if (e.currentTarget.id === 'create-player-card') {
                transitionTo(editSelectionScreen, createPlayerScreen);
            } else {
                const optionTitle = card.querySelector('.edit-option-title').textContent;
                showToast(`${optionTitle} editor coming soon!`);
                console.log(`Selected option: ${optionTitle}`);
            }
        });
    });

    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => fileDropZone.addEventListener(eventName, preventDefaults, false));
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter', 'dragover'].forEach(eventName => fileDropZone.addEventListener(eventName, () => fileDropZone.classList.add('dragover'), false));
    ['dragleave', 'drop'].forEach(eventName => fileDropZone.addEventListener(eventName, () => fileDropZone.classList.remove('dragover'), false));
    fileDropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, false);

    // --- SETUP AND UTILITY FUNCTIONS ---

    function setupEditScreen(leagueData) {
        document.getElementById('editing-league-title').textContent = `EDITING: ${leagueData.name}`;
        document.getElementById('player-edit-desc').textContent = `View and edit all ${leagueData.players} players in the league.`;
        document.getElementById('team-edit-desc').textContent = `View and edit all ${leagueData.teams} teams in the league.`;
        document.getElementById('league-edit-desc').textContent = `Edit global settings for the "${leagueData.name}".`;
    }

    function handleFile(file) {
        fileDropContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                loadedSaveData = JSON.parse(event.target.result);
                console.log("File data processed successfully:", loadedSaveData);
                setTimeout(() => transitionTo(fileUploadScreen, leagueSelectionScreen), 1500);
            } catch (error) {
                console.error("Error parsing JSON:", error);
                showToast("Error: Could not parse save file. Is it corrupted?", 'error', 4000);
                loadingIndicator.classList.add('hidden');
                fileDropContainer.classList.remove('hidden');
            }
        };
        reader.onerror = () => {
            console.error("Error reading file.");
            showToast("Error: Could not read the file.", 'error', 4000);
            loadingIndicator.classList.add('hidden');
            fileDropContainer.classList.remove('hidden');
        };
        reader.readAsText(file);
    }

    let toastTimeout;
    function showToast(message, type = 'success', duration = 3000) {
        if (toastTimeout) clearTimeout(toastTimeout);
        notificationToast.textContent = message;
        notificationToast.className = 'show';
        if (type === 'error') notificationToast.classList.add('error');
        toastTimeout = setTimeout(() => notificationToast.classList.remove('show', 'error'), duration);
    }
});
