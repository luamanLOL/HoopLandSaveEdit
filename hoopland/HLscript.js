document.addEventListener('DOMContentLoaded', () => {
    // I've moved the relevant references here.
    const fileUploadScreen = document.getElementById('file-upload-screen');
    const leagueSelectionScreen = document.getElementById('league-selection-screen');
    
    const selectFileBtn = document.getElementById('select-file-btn');
    const leagueBtn = document.getElementById('league-btn');
    const collegeBtn = document.getElementById('college-btn');

    const fileDropContainer = document.getElementById('file-drop-container');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    
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
        
        outgoingScreen.addEventListener('transitionend', () => {
            outgoingScreen.classList.add('hidden');
            outgoingScreen.classList.remove('fade-out');
            
            incomingScreen.classList.remove('hidden');
            
            setTimeout(() => {
                incomingScreen.classList.remove('fade-out');
                isTransitioning = false;
            }, 50);

        }, { once: true });
    }

    // I've added the listeners for the league/college buttons here.
    leagueBtn.addEventListener('click', () => {
        playEchoClick();
        console.log("League selected. Ready to show league editor.");
        showToast("League editor coming soon!");
        // NEXT STEP: transitionTo(leagueSelectionScreen, editorScreen);
    });
    collegeBtn.addEventListener('click', () => {
        playEchoClick();
        console.log("College selected. Ready to show college editor.");
        showToast("College editor coming soon!");
    });

    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, () => fileDropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileDropZone.addEventListener(eventName, () => fileDropZone.classList.remove('dragover'), false);
    });

    fileDropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            handleFile(file);
        }
    }, false);

    function handleFile(file) {
        const fileName = file.name;
        const isJson = fileName.endsWith('.json');
        const hasNoExtension = !fileName.includes('.');

        if (!isJson && !hasNoExtension) {
            showToast("Invalid File Type. Please use .json or a file with no extension.", 4000);
            return;
        }

        fileDropContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        setTimeout(() => {
            transitionTo(fileUploadScreen, leagueSelectionScreen);
        }, 3000);
    }

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
