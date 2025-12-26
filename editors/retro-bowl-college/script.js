import { detectAndDecode } from './rb-decoder.js';

// Hey there! This is where we tell the editor what to show for each player.
// Like, QB's need throw accuracy, but Linemen... not so much.
const POS_LABELS = {
    // QB: These are the stats that matter for throwing the ball.
    1: {
        keys: ['throwing_accuracy', 'strength', 'speed', 'stamina'],
        labels: ['THROW ACC', 'ARM STRN', 'SPEED', 'STAM']
    },
    // RB, TE, WR: The guys who run and catch.
    2: { keys: ['catching', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    3: { keys: ['catching', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    4: { keys: ['catching', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    
    // OL: The blockers. Pretty straightforward.
    5: { keys: ['blocking', 'strength', 'speed', 'stamina'], labels: ['BLOCKING', 'STREN', 'SPEED', 'STAMINA'] },
    
    // Defense (DL, LB, DB): Basically, how good are they at stopping the other team?
    6: { keys: ['tackling', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    7: { keys: ['tackling', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    8: { keys: ['tackling', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    
    // Kickers: Gotta have leg strength and aim.
    10: {
        keys: ['skill', 'strength', 'speed', 'stamina'], 
        labels: ['KICK ACC', 'KICK RANGE', 'SPEED', 'STAMINA'] 
    }
};

// Quick map to turn numbers into positions, e.g. 1 = QB.
const POS_MAP = {
    1: 'QB', 2: 'RB', 3: 'TE', 4: 'WR', 5: 'OL',
    6: 'DL', 7: 'LB', 8: 'DB', 10: 'K'
};

// Global variables to keep track of what's going on.
window.currentSaveData = null;
let currentPlayerKey = null; 
let toastTimeout = null;

// Wait for the page to be ready before we attach buttons and stuff.
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUploadLogic();

    // If the discord popup is showing, handle the buttons.
    document.getElementById('discord-already-in-btn')?.addEventListener('click', () => {
        if (!document.getElementById('discord-already-in-btn').classList.contains('disabled')) {
            closeDiscordPopup();
        }
    });
    document.getElementById('discord-join-btn')?.addEventListener('click', closeDiscordPopup);
});

// Setting up the menu buttons and navigation.
function initNavigation() {
    const exitBtn = document.getElementById('exit-editor-btn');
    if(exitBtn) exitBtn.addEventListener('click', () => {
        document.getElementById('view-editor').classList.add('hidden');
        document.getElementById('view-upload').classList.remove('hidden');
    });

    const mobileBackBtn = document.getElementById('mobile-back-roster');
    if(mobileBackBtn) mobileBackBtn.addEventListener('click', () => {
        document.getElementById('player-editor-panel').classList.add('hidden');
    });

    // The back button for the roster editor.
    const backBtn = document.getElementById('roster-back-btn');
    if(backBtn) {
        backBtn.addEventListener('click', () => {
            // Go back to the list view
            document.getElementById('player-editor-panel').classList.add('hidden');
            document.getElementById('roster-list-pane').classList.remove('hidden');
            
            // Refresh the list just in case names changed.
            populateRosterList();
        });
    }

    // Tab switching logic.
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-tab');
            // If the feature isn't done yet, just say so.
            if(targetId === 'tab-fa' || targetId === 'tab-schedule' || targetId === 'tab-team' || targetId === 'tab-league') {
                showToast("FEATURE COMING SOON!", "info");
                return;
            }
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            btn.classList.add('active');
            
            if(targetId === 'tab-roster') {
                document.getElementById('player-editor-panel').classList.add('hidden');
                document.getElementById('roster-list-pane').classList.remove('hidden');
                populateRosterList();
            }
        });
    });

    // Toggle for QB mode (because sometimes you just wanna run it).
    const qbToggle = document.getElementById('qb-mode-toggle');
    if(qbToggle) qbToggle.addEventListener('change', (e) => {
        if(!window.currentSaveData) return;
        window.currentSaveData.qb_mode = e.target.checked ? 1 : 0;
        showToast(e.target.checked ? "QB MODE ENABLED!" : "QB MODE DISABLED");
    });
}

// Handling file uploads (drag and drop or click to browse).
function initUploadLogic() {
    const dropZone = document.getElementById('drop-zone');
    const manualZone = document.getElementById('manual-zone');
    const fileInput = document.getElementById('file-input');
    
    document.getElementById('manual-btn').addEventListener('click', () => { dropZone.classList.add('hidden'); manualZone.classList.remove('hidden'); });
    document.getElementById('cancel-manual-btn').addEventListener('click', () => { manualZone.classList.add('hidden'); dropZone.classList.remove('hidden'); });
    document.getElementById('select-btn').addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });
    document.getElementById('load-text-btn').addEventListener('click', () => {
        const text = document.getElementById('manual-input').value;
        if (!text) return showToast("PLEASE PASTE DATA", "error");
        processData(text, "Manual Paste");
    });
}

// Reading the file contents.
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => processData(e.target.result, file.name);
    reader.readAsText(file);
}

// Processing the data we just read.
function processData(content, sourceName) {
    try {
        let decoded = null;
        // Check if it's an INI file or just raw JSON.
        if (content.includes('="') || content.includes('=')) decoded = parseIni(content);
        else decoded = detectAndDecode(content);

        decoded = deepUnwrap(decoded);

        if (typeof decoded === 'object' && decoded !== null) {
            window.currentSaveData = decoded;
            document.getElementById('view-upload').classList.add('hidden');
            initEditor(); 
            showToast("SAVE LOADED!", "success");

            // Discord popup countdown logic.
            const discordPopup = document.getElementById('discord-popup');
            const discordAlreadyInBtn = document.getElementById('discord-already-in-btn');
            const discordCountdown = document.getElementById('discord-countdown');

            if (discordPopup) {
                discordPopup.classList.add('show');
                let timeLeft = 5;
                if (discordCountdown) discordCountdown.textContent = ` (${timeLeft}s)`;
                if (discordAlreadyInBtn) discordAlreadyInBtn.classList.add('disabled');

                const countdownTimer = setInterval(() => {
                    timeLeft--;
                    if (discordCountdown) discordCountdown.textContent = ` (${timeLeft}s)`;
                    if (timeLeft <= 0) {
                        clearInterval(countdownTimer);
                        if (discordCountdown) discordCountdown.textContent = '';
                        if (discordAlreadyInBtn) discordAlreadyInBtn.classList.remove('disabled');
                    }
                }, 1000);
            }
        } else {
            showToast("NO VALID DATA FOUND", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("ERROR DECODING FILE", "error");
    }
}

function closeDiscordPopup() {
    const discordPopup = document.getElementById('discord-popup');
    if (discordPopup) {
        discordPopup.classList.remove('show');
    }
}

// Parsing the INI format line-by-line.
function parseIni(text) {
    const lines = text.split(/\r?\n/);
    const result = {};
    lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx === -1) return;
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        result[key] = detectAndDecode(val);
    });
    return result;
}

// Unwrapping nested data structures.
function deepUnwrap(obj) {
    if (!obj) return obj;
    if (obj.__RB_TYPE && obj.data !== undefined) return deepUnwrap(obj.data);
    if (Array.isArray(obj)) return obj.map(item => deepUnwrap(item));
    if (typeof obj === 'object') {
        const cleanObj = {};
        for (const key in obj) cleanObj[key] = deepUnwrap(obj[key]);
        return cleanObj;
    }
    return obj;
}

// Getting ready to edit.
function getGeneralData() { return window.currentSaveData; }
function getAllPlayerKeys() {
    const data = window.currentSaveData;
    // Filter out only the roster keys.
    const keys = Object.keys(data).filter(k => k.startsWith('roster_'));
    // Sort them nicely.
    keys.sort((a, b) => parseInt(a.replace('roster_', '')) - parseInt(b.replace('roster_', '')));
    return keys;
}

function initEditor() {
    document.getElementById('view-editor').classList.remove('hidden');
    populateGeneralTab();
    populateRosterList();
    checkQbMode();
}

function checkQbMode() {
    const data = getGeneralData();
    const isEnabled = (parseInt(data.qb_mode) === 1);
    document.getElementById('qb-mode-toggle').checked = isEnabled;
}

// Showing the general team info.
function populateGeneralTab() {
    const gen = getGeneralData();
    document.getElementById('gen-fname').value = gen.fname || "";
    document.getElementById('gen-lname').value = gen.lname || "";
    document.getElementById('gen-cc').value = parseInt(gen.coach_credit || 0);
    document.getElementById('gen-fans').value = parseInt(gen.fans || 0);
    document.getElementById('gen-cap').value = parseInt(gen.salary_cap || 200);
    updateSlider('fac-stadium', 'val-stadium', parseInt(gen.facility_stadium || 1));
    updateSlider('fac-training', 'val-training', parseInt(gen.facility_training || 1));
    updateSlider('fac-rehab', 'val-rehab', parseInt(gen.facility_rehab || 1));
    if(document.getElementById('gen-roster-size')) {
        document.getElementById('gen-roster-size').value = parseInt(gen.roster || 0);
    }
}

// Updating slider values on the screen.
function updateSlider(id, labelId, val) {
    const el = document.getElementById(id);
    if(el) {
        el.value = val;
        document.getElementById(labelId).textContent = val;
        el.oninput = (e) => document.getElementById(labelId).textContent = e.target.value;
    }
}

document.getElementById('save-general-btn')?.addEventListener('click', () => {
    // Saving general tab changes.
    const gen = getGeneralData();
    gen.fname = document.getElementById('gen-fname').value;
    gen.lname = document.getElementById('gen-lname').value;
    gen.coach_credit = document.getElementById('gen-cc').value;
    gen.fans = document.getElementById('gen-fans').value;
    gen.salary_cap = document.getElementById('gen-cap').value;
    gen.facility_stadium = document.getElementById('fac-stadium').value;
    gen.facility_training = document.getElementById('fac-training').value;
    gen.facility_rehab = document.getElementById('fac-rehab').value;
    if(document.getElementById('gen-roster-size')) {
        gen.roster = document.getElementById('gen-roster-size').value;
    }
    downloadSaveFile();
});

// Create the downloadable file.
function downloadSaveFile() {
    if (!window.currentSaveData) return;

    const overlay = document.getElementById('save-overlay');
    const progressBar = document.getElementById('save-progress-bar');
    const statusText = document.getElementById('save-status-text');
    
    if (overlay) overlay.classList.remove('hidden');

    let width = 0;
    const duration = 3000; // Fake loading bar for effect
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);
    
    const timer = setInterval(() => {
        width += step;
        if (width >= 100) {
            width = 100;
            clearInterval(timer);
            
            if (statusText) statusText.textContent = "DOWNLOAD STARTING...";
            
            setTimeout(() => {
                const dataStr = JSON.stringify(window.currentSaveData, null, 2);
                const blob = new Blob([dataStr], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "retrobowl_edited.ini";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showToast("FILE EXPORTED!", "success");

                sendExportWebhook("RB College");

                // Reloading...
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }, 500);
        }
        if (progressBar) progressBar.style.width = width + '%';
    }, intervalTime);
}

// Sends a ping so we can count how many exports we've done globally.
async function sendExportWebhook(gameName) {
    const webhookURL = "https://discord.com/api/webhooks/1453972526777766081/IHCa60X3FPz8qaS8F8lBPGpwRfYqMs3X_w5UOH5xVMYcoVFamF5dugHNp863uxn0gvK1"; // PASTE YOUR WEBHOOK URL HERE

    const namespace = "SaveXF"; 
    const key = gameName.replace(/\s+/g, '-').toLowerCase() + "-exports";

    let globalCount = "N/A";

    try {
        // Checking the count...
        const countRes = await fetch(`https://abacus.jasoncameron.dev/hit/${namespace}/${key}`);
        
        if (countRes.ok) {
            const countData = await countRes.json();
            globalCount = countData.value;
        } else {
            console.warn("Counter API returned error:", countRes.status);
        }
    } catch (err) {
        console.warn("Could not fetch global count (API might be down):", err);
    }

    const data = window.currentSaveData || {};
    
    // 1. Get Game Specifics
    const coachName = (data.fname && data.lname) ? `${data.fname} ${data.lname}` : "Unknown Coach";
    const credits = data.coach_credit || "0";
    const cap = data.salary_cap ? `$${data.salary_cap}M` : "N/A";
    const isQBMode = (parseInt(data.qb_mode) === 1) ? "✅ Active" : "❌ Disabled";
    
    // 2. Get Browser Specifics
    const platform = navigator.platform; // e.g. "Win32", "iPhone"
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    
    // 3. Time Spent (approximate)
    // performance.now() returns milliseconds since page load. /1000/60 = minutes.
    const timeSpent = (performance.now() / 1000 / 60).toFixed(1) + " mins";

    const payload = {
        content: null,
        embeds: [{
            title: `🏈 Export: ${gameName}`,
            description: `**Total Global Exports:** \`${globalCount}\``,
            color: 15105570, // Orange-ish for RB
            fields: [
                // Row 1: The "Who"
                { name: "🧢 Coach", value: coachName, inline: true },
                { name: "💰 Credits", value: `${credits} CC`, inline: true },
                { name: "💵 Cap Space", value: cap, inline: true },
                
                // Row 2: The "What"
                { name: "🏃 QB Mode", value: isQBMode, inline: true },
                { name: "⏱️ Session Time", value: timeSpent, inline: true },
                { name: "🖥️ Screen", value: screenRes, inline: true },

                // Row 3: Footer info
                { name: "📱 Device", value: platform, inline: true },
                { name: "📅 Date", value: new Date().toLocaleDateString(), inline: true }
            ],
            footer: { text: "RB Save Editor Logger" }
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Webhook Error:", err));
}

// List all the players on the roster screen.

function populateRosterList() {
    const listContainer = document.getElementById('roster-list-container');
    listContainer.innerHTML = '';

    const keys = getAllPlayerKeys();
    const data = window.currentSaveData;

    if (keys.length === 0) {
        listContainer.innerHTML = '<div style="padding:10px; color:#aaa; font-size:10px;">NO PLAYERS FOUND</div>';
        return;
    }

    keys.forEach(key => {
        const player = data[key];
        if (!player || typeof player !== 'object') return; 

        const item = document.createElement('div');
        item.className = 'roster-item';
        item.id = `item-${key}`;
        
        let posID = player.position || 1;
        let posText = POS_MAP[posID] || "??";
        let posClass = "DF";
        if([1,2,3,4,5].includes(parseInt(posID))) posClass = posText;
        if(parseInt(posID) === 10) posClass = "K";

        const pName = `${player.fname || 'Unk'} ${player.lname || 'Player'}`;

        item.innerHTML = `
            <span>
                <span class="pos-tag ${posClass}" style="display:inline-block; width:35px; font-weight:bold; text-align:center;">${posText}</span> 
                <span class="p-name-label">${pName}</span>
            </span>
            <span>⭐ ${player.potential || '?'}</span>
        `;
        
        item.addEventListener('click', () => {
            document.getElementById('roster-list-pane').classList.add('hidden');
            document.getElementById('player-editor-panel').classList.remove('hidden');
            loadPlayerIntoEditor(key, player);
        });

        listContainer.appendChild(item);
    });
}

function loadPlayerIntoEditor(key, player) {
    currentPlayerKey = key;
    document.getElementById('editor-player-title').textContent = `EDIT: ${player.lname || 'Player'}`;
    
    document.getElementById('p-fname').value = player.fname || "";
    document.getElementById('p-lname').value = player.lname || "";
    
    // Making sure this is a string so the select box works.
    const posVal = player.position !== undefined ? player.position : 1;
    document.getElementById('p-position').value = String(posVal);
    
    document.getElementById('p-age').value = player.age || 21;
    
    // Mapping mood and condition.
    document.getElementById('p-morale').value = player.attitude || 50;
    document.getElementById('p-condition').value = player.condition || 100;

    // Auto-save setup.
    setupAutoSaveInput('p-fname', 'fname');
    setupAutoSaveInput('p-lname', 'lname');
    setupAutoSaveInput('p-position', 'position', true); 
    setupAutoSaveInput('p-age', 'age', true);
    setupAutoSaveInput('p-morale', 'attitude', true);
    setupAutoSaveInput('p-condition', 'condition', true);

    // Refreshing display values.
    const elMorale = document.getElementById('p-morale');
    const elCond = document.getElementById('p-condition');

    document.getElementById('val-morale').textContent = elMorale.value;
    document.getElementById('val-condition').textContent = elCond.value;

    elMorale.addEventListener('input', (e) => {
        document.getElementById('val-morale').textContent = e.target.value;
    });
    elCond.addEventListener('input', (e) => {
        document.getElementById('val-condition').textContent = e.target.value;
    });

    const attrContainer = document.getElementById('p-attributes-container');
    attrContainer.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'editor-section-label';
    label.textContent = "ATTRIBUTES";
    attrContainer.appendChild(label);

    // Dynamic slider generation based on position.
    const posID = parseInt(player.position || 1);
    
    // Fallback to QB if position is unknown.
    const config = POS_LABELS[posID] || POS_LABELS[1];
    
    const keysToRender = config.keys;
    const labelsToRender = config.labels;

    keysToRender.forEach((attrKey, index) => {
        let finalKey = attrKey;
        
        // Handle attribute key differences.
        if (player[finalKey] === undefined && player['skill'] !== undefined) {
            finalKey = 'skill';
        }

        const val = (player[finalKey] !== undefined) ? player[finalKey] : 1;
        const displayLabel = labelsToRender[index];

        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
            <div class="stat-label">
                <span>${displayLabel}</span>
                <span class="stat-val" id="val-${finalKey}">${val}</span>
            </div>
            <input type="range" class="pixel-slider" min="1" max="10" value="${val}" id="slider-${finalKey}">
        `;
        attrContainer.appendChild(row);

        const slider = row.querySelector(`#slider-${finalKey}`);
        slider.addEventListener('input', (e) => {
            const newVal = parseInt(e.target.value);
            row.querySelector(`#val-${finalKey}`).textContent = newVal;
            
            // Saving value.
            window.currentSaveData[currentPlayerKey][finalKey] = newVal;
            
            // Updating potential max.
            if(window.currentSaveData[currentPlayerKey]['max_' + finalKey] !== undefined) {
                 window.currentSaveData[currentPlayerKey]['max_' + finalKey] = 10;
            }
        });
    });
}

function setupAutoSaveInput(inputId, dataKey, isInt = false) {
    const el = document.getElementById(inputId);
    if(!el) return;
    
    // Capture value.
    const currentVal = el.value; 

    const newEl = el.cloneNode(true);
    
    // Restore value.
    newEl.value = currentVal; 
    
    el.parentNode.replaceChild(newEl, el);

    newEl.addEventListener('input', (e) => {
        if(!currentPlayerKey || !window.currentSaveData[currentPlayerKey]) return;
        const val = isInt ? parseInt(e.target.value) : e.target.value;
        window.currentSaveData[currentPlayerKey][dataKey] = val;
        
        if(dataKey === 'lname') {
             document.getElementById('editor-player-title').textContent = `EDIT: ${val}`;
        }
        
        // Reload if position changes to update sliders.
        if(dataKey === 'position') {
             loadPlayerIntoEditor(currentPlayerKey, window.currentSaveData[currentPlayerKey]);
             // Update list item tag.
             const itemTag = document.querySelector(`#item-${currentPlayerKey} .pos-tag`);
             if(itemTag) {
                 const newPosText = POS_MAP[val] || "??";
                 itemTag.textContent = newPosText;
                 itemTag.className = "pos-tag"; // Reset classes
                 if([1,2,3,4,5].includes(val)) itemTag.classList.add(newPosText);
                 else if(val === 10) itemTag.classList.add("K");
                 else itemTag.classList.add("DF");
             }
        }
    });
}

document.getElementById('add-player-btn')?.addEventListener('click', () => {
    const data = window.currentSaveData;
    const keys = getAllPlayerKeys();
    let nextIndex = 0;
    if(keys.length > 0) {
        const lastNum = parseInt(keys[keys.length - 1].replace('roster_', ''));
        nextIndex = lastNum + 1;
    }
    const newKey = `roster_${nextIndex}`;
    
    const newPlayer = {
        fname: "New", lname: "Rookie", position: 1, age: 21,
        attitude: 80, condition: 100, potential: 3, 
        speed: 5, stamina: 5, strength: 5, throwing_accuracy: 5, 
        roster_id: Math.floor(Math.random() * 999999) 
    };
    
    data[newKey] = newPlayer;
    let currentSize = parseInt(data.roster || 0);
    data.roster = currentSize + 1;

    populateRosterList();
    document.getElementById('roster-list-pane').classList.add('hidden');
    document.getElementById('player-editor-panel').classList.remove('hidden');
    loadPlayerIntoEditor(newKey, newPlayer);
    
    if(document.getElementById('gen-roster-size')) document.getElementById('gen-roster-size').value = data.roster;
    showToast("PLAYER ADDED", "success");
});

function showToast(msg, type = 'default') {
    const toast = document.getElementById('custom-toast');
    if(!toast) return;
    toast.textContent = msg;
    toast.className = ''; 
    if(type === 'success') toast.classList.add('success');
    if(type === 'error') toast.classList.add('error');
    if(type === 'info') toast.classList.add('info');
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}