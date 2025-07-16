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
        gameOptions.forEach(opt => opt.classList.remove('active'));
        detailsPanes.forEach(pane => pane.style.display = 'none');

        if (!selectedOption) return;

        selectedOption.classList.add('active');
        const gameId = selectedOption.dataset.game;

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

    gameOptions.forEach(option => {
        option.addEventListener('click', () => selectGame(option));
    });

    selectGame(null);

    // --- Notification Toast Logic ---
    const notificationToast = document.getElementById('notification-toast');
    const toastButtons = document.querySelectorAll('.toast-btn');
    let toastTimeout;

    function showToast(message) {
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        notificationToast.textContent = message;
        notificationToast.classList.add('show');
        toastTimeout = setTimeout(() => {
            notificationToast.classList.remove('show');
        }, 3000);
    }

    toastButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const customMessage = e.currentTarget.dataset.message;
            const featureName = e.currentTarget.dataset.name;
            
            if (customMessage) {
                showToast(customMessage);
            } else if (featureName) {
                showToast(`${featureName} will be added soon!`);
            }
        });
    });

    // --- NEW: Smooth Page Transition ---
    const continueToHoopLandBtn = document.getElementById('continue-to-hoopland');
    if (continueToHoopLandBtn) {
        continueToHoopLandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const destination = e.currentTarget.href;
            document.body.classList.add('page-fade-out');
            setTimeout(() => {
                window.location.href = destination;
            }, 400); // This duration should match the CSS transition time
        });
    }
});