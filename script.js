document.addEventListener('DOMContentLoaded', () => {
    // I've simplified the references to only what this page needs.
    const landingScreen = document.getElementById('landing-screen');
    const gameSelectionScreen = document.getElementById('game-selection-screen');
    
    const continueBtn = document.getElementById('continue-btn');
    const hoopLandBtn = document.getElementById('hoop-land-btn');
    const prizeFightersBtn = document.getElementById('prize-fighters-btn');
    const retroBowlBtn = document.getElementById('retro-bowl-btn');
    const retroBowlCollegeBtn = document.getElementById('retro-bowl-college-btn');
    
    const starsContainer = document.getElementById('stars-container');
    const spotlight = document.getElementById('spotlight');
    const notificationToast = document.getElementById('notification-toast');

    let isTransitioning = false;
    let audioContext;

    const initAudio = () => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    };
    document.body.addEventListener('mousedown', initAudio, { once: true });
    document.body.addEventListener('touchstart', initAudio, { once: true });

    function playEchoClick() {
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        // Simple click without echo for faster response
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    document.addEventListener('mousemove', (e) => {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
    });

    const starCount = 500;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        const size = Math.random() * 2.5 + 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${Math.random() * 3.5}s`;
        starsContainer.appendChild(star);
    }

    function transitionTo(outgoingScreen, incomingScreen) {
        if (isTransitioning) return;
        isTransitioning = true;
        playEchoClick();

        outgoingScreen.classList.add('fade-out');
        
        // I'm using a timeout instead of an event listener for reliability.
        setTimeout(() => {
            outgoingScreen.classList.add('hidden');
            outgoingScreen.classList.remove('fade-out');
            
            incomingScreen.classList.remove('hidden');
            
            setTimeout(() => {
                incomingScreen.classList.remove('fade-out');
                isTransitioning = false;
            }, 50);

        }, 500); // This matches the CSS animation duration.
    }

    continueBtn.addEventListener('click', () => transitionTo(landingScreen, gameSelectionScreen));
    
    // I've updated this to redirect to the new editor page.
    hoopLandBtn.addEventListener('click', () => {
        playEchoClick();
        // This will navigate the browser to your new editor page.
        window.location.href = 'hoopland/index.html';
    });

    prizeFightersBtn.addEventListener('click', () => showToast('Prize Fighters 2 editor coming soon!'));
    retroBowlBtn.addEventListener('click', () => showToast('Retro Bowl editor coming soon!'));
    retroBowlCollegeBtn.addEventListener('click', () => showToast('Retro Bowl College editor coming soon!'));

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
