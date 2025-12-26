document.addEventListener('DOMContentLoaded', () => {
// I made savexf fully client-sided so you can check out the code and mess around with it if you want. It's a great way to learn!
    // So, I needed a way to switch between the landing page and the editor view without reloading, so I built this simple view switcher.
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


    // Here I'm handling the logic for selecting which game you want to edit. It highlights the selected game and shows the relevant details.
    const gameOptions = document.querySelectorAll('.game-option');
    const detailsPanes = document.querySelectorAll('.game-details');
    const hoopLandDetails = document.getElementById('details-hoop-land');
    const retroBowlDetails = document.getElementById('details-retro-bowl');
    const retroBowlCollegeDetails = document.getElementById('details-retro-bowl-college');
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
            case 'retro-bowl':
                paneToShow = retroBowlDetails;
                break;
            case 'retro-bowl-college':
                paneToShow = retroBowlCollegeDetails;
                break;
            case 'prize-fighters':
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

    // I wanted a nice way to show messages to the user, like "Coming Soon", so I whipped up this toast notification system.
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

    // I added this bit to make the transition to the editors feel smoother. It fades out the current page before navigating.
    const continueButtons = document.querySelectorAll('.btn-primary[href]');
    continueButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const destination = e.currentTarget.href;
            document.body.classList.add('page-fade-out');
            setTimeout(() => {
                window.location.href = destination;
            }, 400); // This duration should match the CSS transition time
        });
    });
});