document.addEventListener('DOMContentLoaded', () => {
    // Screen references
    const landingScreen = document.getElementById('landing-screen');
    const editorView = document.getElementById('editor-view');
    const gameSelectionSection = document.getElementById('game-selection-section'); // Reference to the game selection section
    const detailsPageContent = document.getElementById('details-page-content'); // Reference to the details page section
    
    // Button and link references
    const launchEditorBtn = document.getElementById('launch-editor-btn');
    const launchEditorNav = document.getElementById('launch-editor-nav');
    const homeNavLink = document.getElementById('home-nav-link');
    
    // Game Card references
    const hoopLandBtn = document.getElementById('hoop-land-btn');
    const prizeFightersBtn = document.getElementById('prize-fighters-btn');
    const retroBowlBtn = document.getElementById('retro-bowl-btn');
    const retroBowlCollegeBtn = document.getElementById('retro-bowl-college-btn');
    const continueToHoopLandEditorBtn = document.getElementById('continue-to-hoop-land-editor');

    // Toast reference
    const notificationToast = document.getElementById('notification-toast');

    let isTransitioning = false;
    // Removed audioContext and related audio functions

    // Screen Transition Logic (remains largely the same for main screens)
    function transitionToScreen(outgoingScreen, incomingScreen, callback = () => {}) {
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
                callback(); // Execute callback after transition
            }, 50);
        }, 500);
    }

    // This function is no longer needed for toggling hidden states within editor-view
    // as detailsPageContent will always be present and we'll use scrollIntoView.
    // function showEditorPage(pageToShow) { ... }
    
    // Event Listeners for Main Navigation
    const goToEditorMain = () => {
        if (editorView.classList.contains('hidden')) {
            transitionToScreen(landingScreen, editorView, () => {
                // When entering editor view, both game selection and details are visible by default in HTML.
                // No specific 'showEditorPage' call needed here.
            });
        }
    };
    
    const goToHomeView = () => {
        if (landingScreen.classList.contains('hidden')) {
            transitionToScreen(editorView, landingScreen);
            // No specific 'showEditorPage' call needed when going home
        }
    };

    launchEditorBtn.addEventListener('click', goToEditorMain);
    launchEditorNav.addEventListener('click', (e) => { e.preventDefault(); goToEditorMain(); });
    homeNavLink.addEventListener('click', (e) => { e.preventDefault(); goToHomeView(); });

    // Game Selection & Details Page Transition Logic
    hoopLandBtn.addEventListener('click', () => {
        // Scroll smoothly to the details page content when Hoop Land is clicked
        detailsPageContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    continueToHoopLandEditorBtn.addEventListener('click', () => {
        window.location.href = 'hoopland/index.html'; // This will navigate away
    });

    const handleComingSoon = () => {
        // For other games, just show the toast.
        // The detailsPageContent is always visible for Hoop Land's features,
        // so no need to transition anything within editor-view here.
        showToast('This editor is coming soon!');
    };

    prizeFightersBtn.addEventListener('click', handleComingSoon);
    retroBowlBtn.addEventListener('click', handleComingSoon);
    retroBowlCollegeBtn.addEventListener('click', handleComingSoon);

    // Toast Notification Logic
    let toastTimeout;
    function showToast(message, duration = 3000) {
        if (toastTimeout) clearTimeout(toastTimeout);
        notificationToast.textContent = message;
        notificationToast.classList.add('show');
        toastTimeout = setTimeout(() => {
            notificationToast.classList.remove('show');
        }, duration);
    }
});
