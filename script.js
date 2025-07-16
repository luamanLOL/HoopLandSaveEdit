document.addEventListener('DOMContentLoaded', () => {

    // --- View Switching Logic ---
    const landingView = document.getElementById('landing-view');
    const editorView = document.getElementById('editor-view');
    const launchEditorBtn = document.getElementById('launch-editor-btn');
    const navLaunchEditor = document.getElementById('nav-launch-editor');
    const homeBtn = document.getElementById('nav-home-btn');

    const showEditor = () => {
        landingView.classList.remove('active-view');
        editorView.classList.add('active-view');
    };

    const showHome = () => {
        editorView.classList.remove('active-view');
        landingView.classList.add('active-view');
    };

    launchEditorBtn.addEventListener('click', showEditor);
    navLaunchEditor.addEventListener('click', showEditor);
    homeBtn.addEventListener('click', showHome);


    // --- Editor Game Selection Logic ---
    const gameOptions = document.querySelectorAll('.game-option');
    const detailsPanes = document.querySelectorAll('.game-details');
    const hoopLandDetails = document.getElementById('details-hoop-land');
    const comingSoonDetails = document.getElementById('details-coming-soon');

    function selectGame(selectedOption) {
        // Deactivate all options and hide all details panes
        gameOptions.forEach(opt => opt.classList.remove('active'));
        detailsPanes.forEach(pane => pane.style.display = 'none');

        if (!selectedOption) return;

        // Activate the selected game option
        selectedOption.classList.add('active');
        const gameId = selectedOption.dataset.game;

        // Show the corresponding details pane
        let paneToShow = null;
        switch (gameId) {
            case 'hoop-land':
                paneToShow = hoopLandDetails;
                break;
            case 'prize-fighters':
            case 'retro-bowl':
            case 'retro-bowl-college':
                paneToShow = comingSoonDetails;
                break;
        }
        
        if (paneToShow) {
            paneToShow.style.display = 'block';
        }
    }

    // Add click event listeners to all game options
    gameOptions.forEach(option => {
        option.addEventListener('click', () => selectGame(option));
    });

    // Deselect all by default so the pane is empty initially
    selectGame(null);
});