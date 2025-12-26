import { detectAndDecode } from './rb-decoder.js';
import { jsonToIni } from './rb-encoder.js';

// RBC uses 'skill' for the primary attribute of ALL positions.
const POS_LABELS = {
    1: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['THROW ACC', 'ARM STRN', 'SPEED', 'STAM'] },
    2: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    3: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    4: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['CATCHING', 'STREN', 'SPEED', 'STAMINA'] },
    5: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['BLOCKING', 'STREN', 'SPEED', 'STAMINA'] },
    6: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    7: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    8: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['TACKLING', 'STREN', 'SPEED', 'STAMINA'] },
    10: { keys: ['skill', 'strength', 'speed', 'stamina'], labels: ['KICK ACC', 'KICK RANGE', 'SPEED', 'STAMINA'] }
};

const POS_MAP = {
    1: 'QB', 2: 'RB', 3: 'TE', 4: 'WR', 5: 'OL',
    6: 'DL', 7: 'LB', 8: 'DB', 10: 'K'
};

window.currentSaveData = null;
window.originalFileName = null;
let currentPlayerKey = null;
let toastTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUploadLogic();
});

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

    const backBtn = document.getElementById('roster-back-btn');
    if(backBtn) {
        backBtn.addEventListener('click', () => {
            document.getElementById('player-editor-panel').classList.add('hidden');
            document.getElementById('roster-list-pane').classList.remove('hidden');
            populateRosterList();
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-tab');
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
}

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

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => processData(e.target.result, file.name);
    reader.readAsText(file);
}

function processData(content, sourceName) {
    try {
        window.originalFileName = sourceName;
        let decoded = null;
        if (content.includes('="') || content.includes('=')) decoded = parseIni(content);
        else decoded = detectAndDecode(content);

        decoded = deepUnwrap(decoded);

        if (typeof decoded === 'object' && decoded !== null) {
            window.currentSaveData = decoded;
            document.getElementById('view-upload').classList.add('hidden');
            initEditor(); 
            showToast("SAVE LOADED!", "success");
        } else {
            showToast("NO VALID DATA FOUND", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("ERROR DECODING FILE", "error");
    }
}

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

function getGeneralData() { return window.currentSaveData; }
function getAllPlayerKeys() {
    const data = window.currentSaveData;
    const keys = Object.keys(data).filter(k => k.startsWith('roster_'));
    keys.sort((a, b) => parseInt(a.replace('roster_', '')) - parseInt(b.replace('roster_', '')));
    return keys;
}

function initEditor() {
    document.getElementById('view-editor').classList.remove('hidden');
    populateGeneralTab();
    populateRosterList();
}

function populateGeneralTab() {
    const gen = getGeneralData();
    document.getElementById('gen-fname').value = gen.fname || "";
    document.getElementById('gen-lname').value = gen.lname || "";
    document.getElementById('gen-cc').value = parseInt(gen.coach_credit || 0);
    // RBC has scholarship fund instead of salary cap
    document.getElementById('gen-cap').value = parseInt(gen.salary_cap || 50000); 
    
    updateSlider('fac-stadium', 'val-stadium', parseInt(gen.facility_stadium || 1));
    updateSlider('fac-training', 'val-training', parseInt(gen.facility_training || 1));
    updateSlider('fac-rehab', 'val-rehab', parseInt(gen.facility_rehab || 1));
}

function updateSlider(id, labelId, val) {
    const el = document.getElementById(id);
    if(el) {
        el.value = val;
        document.getElementById(labelId).textContent = val;
        el.oninput = (e) => document.getElementById(labelId).textContent = e.target.value;
    }
}

document.getElementById('save-general-btn')?.addEventListener('click', () => {
    const gen = getGeneralData();
    gen.fname = document.getElementById('gen-fname').value;
    gen.lname = document.getElementById('gen-lname').value;
    gen.coach_credit = document.getElementById('gen-cc').value;
    gen.salary_cap = document.getElementById('gen-cap').value;
    gen.facility_stadium = document.getElementById('fac-stadium').value;
    gen.facility_training = document.getElementById('fac-training').value;
    gen.facility_rehab = document.getElementById('fac-rehab').value;
    downloadSaveFile();
});

function downloadSaveFile() {
    if (!window.currentSaveData) return;

    const overlay = document.getElementById('save-overlay');
    const progressBar = document.getElementById('save-progress-bar');
    const statusText = document.getElementById('save-status-text');
    
    if (overlay) overlay.classList.remove('hidden');

    let width = 0;
    const duration = 3000;
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);
    
    const timer = setInterval(() => {
        width += step;
        if (width >= 100) {
            width = 100;
            clearInterval(timer);
            
            if (statusText) statusText.textContent = "DOWNLOAD STARTING...";
            
            setTimeout(() => {
                try {
                    const iniContent = jsonToIni(window.currentSaveData);
                    const ext = window.originalFileName ? window.originalFileName.split('.').pop() : 'ini';
                    const finalName = `modded with savexf.${ext}`;

                    const blob = new Blob([iniContent], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = finalName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showToast("FILE EXPORTED!", "success");
                    sendExportWebhook("Retro Bowl College");

                    const btn = document.createElement('button');
                    btn.textContent = "RESET EDITOR";
                    btn.className = "pixel-btn red-btn";
                    btn.style.marginTop = "20px";
                    btn.onclick = () => location.reload();
                    
                    if (statusText) {
                        statusText.textContent = "DOWNLOAD COMPLETE!";
                        if (!statusText.parentNode.querySelector('.reset-btn-marker')) {
                            btn.classList.add('reset-btn-marker');
                            statusText.parentNode.appendChild(btn);
                        }
                    }
                } catch (e) {
                    console.error(e);
                    showToast("EXPORT ERROR", "error");
                }
            }, 500);
        }
        if (progressBar) progressBar.style.width = width + '%';
    }, intervalTime);
}

async function sendExportWebhook(gameName) {
    const webhookURL = "https://discord.com/api/webhooks/1453972526777766081/IHCa60X3FPz8qaS8F8lBPGpwRfYqMs3X_w5UOH5xVMYcoVFamF5dugHNp863uxn0gvK1";
    
    const namespace = "SaveXF"; 
    const key = gameName.replace(/\s+/g, '-').toLowerCase() + "-exports";

    let globalCount = "N/A";

    try {
        const countRes = await fetch(`https://abacus.jasoncameron.dev/hit/${namespace}/${key}`);
        if (countRes.ok) {
            const countData = await countRes.json();
            globalCount = countData.value;
        }
    } catch (err) {}

    const data = window.currentSaveData || {};
    const coachName = (data.fname && data.lname) ? `${data.fname} ${data.lname}` : "Unknown Coach";
    const credits = data.coach_credit || "0";
    const cap = data.salary_cap ? `$${data.salary_cap}` : "N/A";
    
    const platform = navigator.platform;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const timeSpent = (performance.now() / 1000 / 60).toFixed(1) + " mins";

    const payload = {
        content: null,
        embeds: [{
            title: `🎓 Export: ${gameName}`,
            description: `**Total Global Exports:** \`${globalCount}\``,
            color: 16763904, 
            fields: [
                { name: "🧢 Coach", value: coachName, inline: true },
                { name: "💰 Credits", value: `${credits} CC`, inline: true },
                { name: "💵 Scholarship", value: cap, inline: true },
                { name: "⏱️ Session Time", value: timeSpent, inline: true },
                { name: "🖥️ Screen", value: screenRes, inline: true },
                { name: "📱 Device", value: platform, inline: true },
                { name: "📅 Date", value: new Date().toLocaleDateString(), inline: true }
            ],
            footer: { text: "RBC Save Editor Logger" }
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Webhook Error:", err));
}

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
    
    const posVal = player.position !== undefined ? player.position : 1;
    document.getElementById('p-position').value = String(posVal);
    
    document.getElementById('p-age').value = player.age || 21;
    
    document.getElementById('p-morale').value = player.attitude || 50;
    document.getElementById('p-condition').value = player.condition || 100;

    setupAutoSaveInput('p-fname', 'fname');
    setupAutoSaveInput('p-lname', 'lname');
    setupAutoSaveInput('p-position', 'position', true); 
    setupAutoSaveInput('p-age', 'age', true);
    setupAutoSaveInput('p-morale', 'attitude', true);
    setupAutoSaveInput('p-condition', 'condition', true);

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

    const posID = parseInt(player.position || 1);
    const config = POS_LABELS[posID] || POS_LABELS[1];
    
    const keysToRender = config.keys;
    const labelsToRender = config.labels;

    keysToRender.forEach((attrKey, index) => {
        let finalKey = attrKey;
        // Legacy check, mostly redundant now that 'skill' is standard
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
            
            // Update actual data
            window.currentSaveData[currentPlayerKey][finalKey] = newVal;
            
            // Force create/update max value so the stat is accepted by the game
            window.currentSaveData[currentPlayerKey]['max_' + finalKey] = 10;
        });
    });
}

function setupAutoSaveInput(inputId, dataKey, isInt = false) {
    const el = document.getElementById(inputId);
    if(!el) return;
    
    const currentVal = el.value; 
    const newEl = el.cloneNode(true);
    newEl.value = currentVal; 
    el.parentNode.replaceChild(newEl, el);

    newEl.addEventListener('input', (e) => {
        if(!currentPlayerKey || !window.currentSaveData[currentPlayerKey]) return;
        const val = isInt ? parseInt(e.target.value) : e.target.value;
        window.currentSaveData[currentPlayerKey][dataKey] = val;
        
        if(dataKey === 'lname') {
             document.getElementById('editor-player-title').textContent = `EDIT: ${val}`;
        }
        
        if(dataKey === 'position') {
             loadPlayerIntoEditor(currentPlayerKey, window.currentSaveData[currentPlayerKey]);
             const itemTag = document.querySelector(`#item-${currentPlayerKey} .pos-tag`);
             if(itemTag) {
                 const newPosText = POS_MAP[val] || "??";
                 itemTag.textContent = newPosText;
                 itemTag.className = "pos-tag";
                 if([1,2,3,4,5].includes(val)) itemTag.classList.add(newPosText);
                 else if(val === 10) itemTag.classList.add("K");
                 else itemTag.classList.add("DF");
             }
        }
    });
}

function createFullPlayerTemplate(id) {
    return {
        // --- Identity ---
        fname: "New", 
        lname: "Player", 
        position: 1, 
        age: 18, 
        roster_id: id, 
        teamid: 0,
        
        // --- Appearance ---
        face_set: 0, 
        face_x: 0, 
        face_y: 0, 
        skin: 1,
        
        // --- Academics & Background ---
        // These MUST be strings to match the save format
        major: "0", 
        minor: "0", 
        hobby: "0", 
        hometown: 777, // Fixed: Was 'home_town'
        
        curriculum_interest: "Undeclared",
        curriculum_vitae: "2024-H.S. Diploma", 
        
        // --- Costs & Values ---
        rc_cost: 0, 
        creditcost: 0, 
        scholarship: 0, 
        salary: 0, 
        contract: { yrs: 4, sal: 0, noTrd: 0 }, 
        signed_year: -1, // Default to -1 (unsigned)

        // --- Status Flags ---
        backup: 0, 
        walk_on: 0, 
        kr: 0, // Kick Returner flag
        scouted: 1, 
        resting: 0, 
        injury_week: 0, 
        suspended: 0,
        meetingdone: 0, 
        hof: 0,
        
        // --- Development ---
        xp: 0, 
        xp_gain: 0, 
        xp_level: 1, 
        skill_points: 0,
        potential: 3, 
        trait: "", // Must be a string (e.g., "TalentSpotter" or empty)
        
        // --- Social / GPA ---
        percent_grade: 100.0, 
        max_percent_grade: 100.0, 
        happiness: 100, 
        attitude: 100, 
        condition: 100,
        party_meter: 0, 
        party_dilemmas: 0, 
        toxic_dilemmas: 0,
        subject_reveal: 2,

        // --- Base Attributes ---
        speed: 5, max_speed: 10,
        stamina: 5, max_stamina: 10,
        strength: 5, max_strength: 10,
        skill: 5, max_skill: 10, 
        
        // --- Game Logic Strings ---
        drafted_pro_team: "", // Must be string
        team_leave_reason: "", // Must be string
        epilogue: "", // Must be string
        epilogue_story: "", // Must be string
        intrade_pick: 0, 
        outtrade_pick: 0,
        
        // --- STATS: General ---
        season_games: 0, career_games: 0,
        flash_time: 0, randnum: Math.random(),
        
        // --- STATS: Passing ---
        stat_attempts: 0, season_attempts: 0, career_attempts: 0,
        stat_complete: 0, season_complete: 0, career_complete: 0,
        stat_yards: 0, season_yards: 0, career_yards: 0,
        stat_touchdowns: 0, season_touchdowns: 0, career_touchdowns: 0,
        stat_int: 0, season_int: 0, career_int: 0,
        stat_longest: 0, season_longest: 0, career_longest: 0,
        stat_sacks: 0, season_sacks: 0, career_sacks: 0,
        stat_throws: 0, // Internal counter

        // --- STATS: Rushing (CRITICAL MISSING BLOCK) ---
        stat_rush_attempts: 0, season_rush_attempts: 0, career_rush_attempts: 0,
        stat_rush_yards: 0, season_rush_yards: 0, career_rush_yards: 0,
        stat_rush_touchdowns: 0, season_rush_touchdowns: 0, career_rush_touchdowns: 0,
        stat_rush_longest: 0, season_rush_longest: 0, career_rush_longest: 0,
        stat_trucking: 0,

        // --- STATS: Receiving/Defense Misc ---
        stat_tackles: 0, season_tackles: 0, career_tackles: 0,
        stat_fumbles: 0, season_fumbles: 0, career_fumbles: 0,

        // --- STATS: Kicking ---
        stat_kicks: 0, // Field Goals made?
        
        // --- STATS: Returns (CRITICAL MISSING BLOCK) ---
        stat_return_attempts: 0, season_return_attempts: 0, career_return_attempts: 0,
        stat_return_yards: 0, season_return_yards: 0, career_return_yards: 0,
        stat_return_tds: 0, season_return_tds: 0, career_return_tds: 0,
        stat_return_longest: 0, season_return_longest: 0, career_return_longest: 0
    };
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
    
    // Updated: Use the robust RBC template
    const newPlayer = createFullPlayerTemplate(Math.floor(Math.random() * 999999));
    
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
