// I made savexf fully client-sided so you can learn from it!

const appState = {
    fullSaveData: null,
    currentLeague: null,
};

let originalSaveData = null;

// --- Helper Functions ---
// Helper functions.

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show';
    if (type === 'error') toast.style.backgroundColor = '#ef4444';
    else toast.style.backgroundColor = 'var(--color-main-accent)';
    setTimeout(() => toast.className = toast.className.replace('show', ''), 3000);
}

function handleBackNavigation() {
    if (appState.fullSaveData) {
        // grabbing the latest data from the form before saving.
        if (appState.currentLeague) {
            const formData = getFormData();
            Object.assign(appState.currentLeague, formData);
        }

        saveToDB(appState.fullSaveData).then(() => {
            console.log("Data saved to DB.");
            proceedNavigation();
        }).catch(err => {
            console.error("Save failed", err);
            proceedNavigation();
        });
    } else {
        proceedNavigation();
    }
}

function proceedNavigation() {
    document.body.classList.remove('loaded');
    document.body.classList.add('fading-out');
    setTimeout(() => {
        window.location.href = '../index.html?state=restore';
    }, 300);
}

async function loadSaveFile() {
    try {
        const storedData = await loadFromDB();
        if (storedData) {
            console.log("Loading data from IndexedDB...");
            processLoadedData(storedData);
        } else {
            console.log("Loading data from file...");
            fetchSaveFile();
        }
    } catch (e) {
        console.error("Error loading from DB:", e);
        fetchSaveFile();
    }
}

function fetchSaveFile() {
    fetch('../../../../resources/hoop-land-save.json')
        .then(response => response.json())
        .then(data => {
            processLoadedData(data);
        })
        .catch(error => {
            console.error("Error loading save file:", error);
            showToast('Could not load save file.', 'error');
        });
}

function processLoadedData(data) {
    originalSaveData = data; // Keeping a copy of the original data just in case.
    appState.fullSaveData = data;
    
    const storedIndex = localStorage.getItem('activeLeagueIndex');
    const leagueIdx = storedIndex ? parseInt(storedIndex, 10) : 0;
    appState.currentLeague = data.seasonLeagues[leagueIdx] || data.seasonLeagues[0];

    appState.currentLeague.allPlayers = [];
    (appState.currentLeague.teams || []).forEach(team => { if (team && team.roster) appState.currentLeague.allPlayers.push(...team.roster.map(p => ({ ...p, teamId: team.id, teamAbbr: team.abbr, teamName: team.name }))); });
    (appState.currentLeague.starTeams || []).forEach(starTeam => { if (starTeam && starTeam.roster) appState.currentLeague.allPlayers.push(...starTeam.roster.map(p => ({ ...p, teamId: starTeam.id, teamAbbr: starTeam.abbr, teamName: starTeam.name }))); });
    populateForm(appState.currentLeague);
    // showToast('Save file loaded!');
}

document.addEventListener('DOMContentLoaded', () => {
    // Fade In
    setTimeout(() => document.body.classList.add('loaded'), 50);

    // Back Button
    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackNavigation();
        });
    }
    
    loadSaveFile();
});

function getFormData() {
    const data = {};
    data.leagueName = document.getElementById('leagueName').value;
    data.shortName = document.getElementById('shortName').value;
    data.regression = document.getElementById('regression').checked ? 1 : 0;
    data.injuries = document.getElementById('injuries').checked ? 1 : 0;

    data.sliders = {};
    const gameplaySliders = document.querySelectorAll('[id^="sliders_"]');
    gameplaySliders.forEach(input => {
        const key = input.id.replace('sliders_', '');
        data.sliders[key] = parseFloat(input.value);
    });

    data.simulationSliders = {};
    const simSliders = document.querySelectorAll('[id^="sim_sliders_"]');
    simSliders.forEach(input => {
        const key = input.id.replace('sim_sliders_', '');
        data.simulationSliders[key] = parseFloat(input.value);
    });

    data.difficulty = {};
    const difficulty = document.querySelectorAll('[id^="difficulty_"]');
    difficulty.forEach(input => {
        const key = input.id.replace('difficulty_', '');
        data.difficulty[key] = parseFloat(input.value);
    });

    data.divisions = [];
    const divisions = document.querySelectorAll('[id^="division_"]');
    divisions.forEach(input => {
        data.divisions.push(input.value);
    });

    data.media = [];
    const media = document.querySelectorAll('[id^="media_fn_"]');
    media.forEach((input, i) => {
        const lnInput = document.getElementById(`media_ln_${i}`);
        data.media.push({ fn: input.value, ln: lnInput.value });
    });

    data.awards = [];
    const awards = document.querySelectorAll('[id^="award_"]');
    awards.forEach(input => {
        data.awards.push({ name: input.value });
    });

    return data;
}

function populateForm(data) {
    document.getElementById('leagueName').value = data.leagueName || '';
    document.getElementById('shortName').value = data.shortName || '';
    
    document.getElementById('regression').checked = data.regression == 1 || data.regression === true;
    document.getElementById('injuries').checked = data.injuries == 1 || data.injuries === true;

    populateCollapsible('Gameplay Sliders', data.sliders, 'sliders_');
    populateCollapsible('Simulation Sliders', data.simulationSliders, 'sim_sliders_');
    populateCollapsible('Difficulty', data.difficulty, 'difficulty_');
    populateCollapsible('Divisions', data.divisions, 'division_');
    populateCollapsible('League Rules', {}); // Making the section collapsible.

    const mediaList = document.getElementById('media-list');
    mediaList.innerHTML = '';
    if (data.media) data.media.forEach((p, i) => {
        mediaList.innerHTML += `
            <li style="align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display: block; font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--color-text-medium);">First Name</label>
                    <input type="text" id="media_fn_${i}" value="${p.fn}" placeholder="First Name">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; font-size: 0.75rem; margin-bottom: 0.25rem; color: var(--color-text-medium);">Last Name</label>
                    <input type="text" id="media_ln_${i}" value="${p.ln}" placeholder="Last Name">
                </div>
            </li>`;
    });
}

function populateCollapsible(legendText, data, prefix = '') {
    const legend = Array.from(document.querySelectorAll('legend')).find(el => el.textContent.includes(legendText));
    if (!legend) return;
    const contentDiv = legend.nextElementSibling;
    if (!contentDiv.classList.contains('collapsible-content')) return;
    contentDiv.innerHTML = '';
    if (!data) return;

    if (Array.isArray(data)) { // Handling the divisions data.
        data.forEach((item, index) => {
            contentDiv.innerHTML += `<div><label for="${prefix}${index}">Division ${index + 1}</label><input type="text" id="${prefix}${index}" value="${item}"></div>`;
        });
    } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) { // Handling sliders and difficulty settings.
        for (const key in data) {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (legendText.includes('Sliders')) {
                contentDiv.innerHTML += `<div><label for="${prefix}${key}">${label}</label><div class="slider-container"><input type="range" min="0" max="100" id="${prefix}${key}" value="${data[key]}" style="background: linear-gradient(90deg, var(--color-main-accent) ${data[key]}%, var(--color-primary-bg) ${data[key]}%)"><span class="slider-value">${data[key]}</span></div></div>`;
            } else if (legendText.includes('Difficulty')) {
                contentDiv.innerHTML += `<div><label>${label}</label><div class="difficulty-buttons" id="${prefix}${key}"></div></div>`;
                const buttonContainer = contentDiv.querySelector(`#${prefix}${key}`);
                for (let i = 0; i <= 3; i++) {
                    const button = document.createElement('button');
                    button.textContent = i;
                    button.dataset.value = i;
                    if (i === data[key]) {
                        button.classList.add('active');
                    }
                    buttonContainer.appendChild(button);
                }
            } else {
                contentDiv.innerHTML += `<div><label for="${prefix}${key}">${label}</label><input type="number" id="${prefix}${key}" value="${data[key]}"></div>`;
            }
        }
    }
}

document.querySelectorAll('.collapsible').forEach(legend => {
    legend.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});

document.addEventListener('input', (e) => {

    if (e.target.type === 'range') {

        const sliderValue = e.target.nextElementSibling;

        if (sliderValue && sliderValue.classList.contains('slider-value')) {

            sliderValue.textContent = e.target.value;

        }

        e.target.style.background = `linear-gradient(90deg, var(--color-main-accent) ${e.target.value}%, var(--color-primary-bg) ${e.target.value}%)`;

    }

});



document.addEventListener('click', (e) => {

    if (e.target.matches('.difficulty-buttons button')) {

        e.preventDefault(); // Prevent form submission/reload

        const button = e.target;

        const container = button.parentElement;

        const key = container.id.replace('difficulty_', '');

        const value = parseInt(button.dataset.value, 10);



        // Update active button

        Array.from(container.children).forEach(child => child.classList.remove('active'));

        button.classList.add('active');



        // Updating the app state.

        if (appState.currentLeague && appState.currentLeague.difficulty) {

            appState.currentLeague.difficulty[key] = value;

        }

    }

});



function showToast(message, type = 'success') {

    const toast = document.getElementById('toast');

    toast.textContent = message;

    toast.className = 'show';

    if (type === 'error') {

        toast.style.backgroundColor = '#ef4444'; // Red for error

    } else {

        toast.style.backgroundColor = 'var(--color-main-accent)';

    }



    setTimeout(() => {

        toast.className = toast.className.replace('show', '');

    }, 3000);

}