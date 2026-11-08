document.addEventListener('DOMContentLoaded', () => {
    let currentTent = 'tent1';

    const tentButtons = document.querySelectorAll('.tent-btn');
    const ageSlider = document.getElementById('age-slider');
    const ageText = document.getElementById('age-text');
    const stageText = document.getElementById('stage-text');
    const airTempInput = document.getElementById('air-temp');
    const roomRhInput = document.getElementById('room-rh');
    const leafTempDisplay = document.getElementById('leaf-temp-display');
    const vpdDisplay = document.getElementById('vpd-display');
    const calCheck = document.getElementById('cal-check');
    const magCheck = document.getElementById('mag-check');
    const roWarning = document.getElementById('ro-warning');
    const additiveInput = document.getElementById('additive-input');
    const injectBtn = document.getElementById('inject-btn');
    const inventoryGrid = document.getElementById('inventory-grid');
    const tempUnitRadios = document.querySelectorAll('input[name="temp-unit"]');
    const logDatePicker = document.getElementById('log-date-picker');
    const dailyLogNotes = document.getElementById('daily-log-notes');
    const resLiquid = document.getElementById('reservoir-liquid');
    const volumeDisplay = document.getElementById('volume-display');
    const resVolumeSlider = document.getElementById('reservoir-volume-slider');
    const newGrowBtn = document.getElementById('new-grow-btn');

    const defaultData = {
        tent1: { age: 1, airTemp: 78, rh: 60, unit: 'F', cal: false, mag: false, reservoir: 100, additives: ['Ghost Root Booster', 'Neon Foliar Blast'], notes: {} },
        tent2: { age: 25, airTemp: 76, rh: 55, unit: 'F', cal: false, mag: false, reservoir: 80, additives: ['Hydro Grow A'], notes: {} },
        tent3: { age: 60, airTemp: 74, rh: 45, unit: 'F', cal: false, mag: false, reservoir: 50, additives: ['Organic Bloom Pack'], notes: {} }
    };

    logDatePicker.value = new Date().toISOString().split('T')[0];

    function getTentState(tentId) {
        const stored = localStorage.getItem(`hg_${tentId}`);
        return stored ? JSON.parse(stored) : defaultData[tentId];
    }

    function saveTentState(tentId, data) {
        localStorage.setItem(`hg_${tentId}`, JSON.stringify(data));
    }

    function determineStage(day) {
        if (day <= 7) return 'Germination';
        if (day <= 21) return 'Seedling';
        if (day <= 56) return 'Vegetative Stage';
        return 'Flowering Window';
    }

    function calculateVPD() {
        const airTemp = parseFloat(airTempInput.value) || 0;
        const rh = parseFloat(roomRhInput.value) || 0;
        const selectedUnit = document.querySelector('input[name="temp-unit"]:checked').value;

        let tempC = selectedUnit === 'F' ? (airTemp - 32) * 5 / 9 : airTemp;
        const leafTempC = tempC - 2;
        leafTempDisplay.textContent = selectedUnit === 'F' ? `${((leafTempC * 9 / 5) + 32).toFixed(1)}°F` : `${leafTempC.toFixed(1)}°C`;

        const svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
        const svpLeaf = 0.61078 * Math.exp((17.27 * leafTempC) / (leafTempC + 237.3));
        let vpd = svpLeaf - (svpAir * (rh / 100));
        vpdDisplay.textContent = `${Math.max(0, vpd).toFixed(2)} kPa`;
    }

    function renderAdditives(arr) {
        inventoryGrid.innerHTML = '';
        arr.forEach((item, i) => {
            const li = document.createElement('li');
            li.className = 'inventory-item';
            li.innerHTML = `<span>${item}</span><button class="delete-btn" data-index="${i}">✕</button>`;
            inventoryGrid.appendChild(li);
        });
    }

    function loadView(tentId) {
        currentTent = tentId;
        const state = getTentState(tentId);

        ageSlider.value = state.age;
        ageText.textContent = `Day ${state.age}`;
        stageText.textContent = determineStage(state.age);
        airTempInput.value = state.airTemp;
        roomRhInput.value = state.rh;

        tempUnitRadios.forEach(r => r.checked = (r.value === state.unit));
        calCheck.checked = state.cal;
        magCheck.checked = state.mag;

        resVolumeSlider.value = state.reservoir;
        volumeDisplay.textContent = `${state.reservoir}%`;
        resLiquid.style.height = `${state.reservoir}%`;

        const d = logDatePicker.value;
        dailyLogNotes.value = (state.notes && state.notes[d]) ? state.notes[d] : '';

        renderAdditives(state.additives);
        calculateVPD();
        roWarning.classList.toggle('hidden', calCheck.checked && magCheck.checked);
    }

    function updateStore() {
        const state = getTentState(currentTent);
        const d = logDatePicker.value;
        if (!state.notes) state.notes = {};
        state.notes[d] = dailyLogNotes.value;

        const adds = [];
        inventoryGrid.querySelectorAll('.inventory-item span').forEach(el => adds.push(el.textContent));

        state.age = parseInt(ageSlider.value);
        state.airTemp = parseFloat(airTempInput.value) || 0;
        state.rh = parseFloat(roomRhInput.value) || 0;
        state.unit = document.querySelector('input[name="temp-unit"]:checked').value;
        state.cal = calCheck.checked;
        state.mag = magCheck.checked;
        state.reservoir = parseInt(resVolumeSlider.value);
        state.additives = adds;

        saveTentState(currentTent, state);
        roWarning.classList.toggle('hidden', calCheck.checked && magCheck.checked);
    }

    tentButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tentButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadView(e.target.getAttribute('data-tent'));
        });
    });

    ageSlider.addEventListener('input', (e) => {
        ageText.textContent = `Day ${e.target.value}`;
        stageText.textContent = determineStage(parseInt(e.target.value));
        updateStore();
    });

    [airTempInput, roomRhInput].forEach(i => i.addEventListener('input', () => { calculateVPD(); updateStore(); }));
    tempUnitRadios.forEach(r => r.addEventListener('change', () => { calculateVPD(); updateStore(); }));
    [calCheck, magCheck].forEach(c => c.addEventListener('change', updateStore));
    resVolumeSlider.addEventListener('input', (e) => {
        volumeDisplay.textContent = `${e.target.value}%`;
        resLiquid.style.height = `${e.target.value}%`;
        updateStore();
    });
    logDatePicker.addEventListener('change', () => { loadView(currentTent); });
    dailyLogNotes.addEventListener('input', updateStore);

    injectBtn.addEventListener('click', () => {
        const txt = additiveInput.value.trim();
        if (txt) {
            const state = getTentState(currentTent);
            state.additives.push(txt);
            saveTentState(currentTent, state);
            loadView(currentTent);
            additiveInput.value = '';
        }
    });

    inventoryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const state = getTentState(currentTent);
            state.additives.splice(parseInt(e.target.getAttribute('data-index')), 1);
            saveTentState(currentTent, state);
            loadView(currentTent);
        }
    });

    newGrowBtn.addEventListener('click', () => {
        if (confirm("Reset current tent data to clear all logs and start a new grow?")) {
            saveTentState(currentTent, { age: 1, airTemp: 78, rh: 60, unit: 'F', cal: false, mag: false, reservoir: 100, additives: [], notes: {} });
            loadView(currentTent);
        }
    });

    const canvas = document.getElementById('fog-canvas');
    const ctx = canvas.getContext('2d');
    const particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    class P {
        constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.r = Math.random() * 80 + 40; this.vy = -(Math.random() * 0.4 + 0.1); this.a = Math.random() * 0.1 + 0.02; }
        update() { this.y += this.vy; if (this.y < -this.r) { this.y = canvas.height + this.r; this.x = Math.random() * canvas.width; } }
        draw() {
            ctx.beginPath();
            let g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
            g.addColorStop(0, `rgba(102, 255, 51, ${this.a})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    for(let i=0; i<15; i++) particles.push(new P());
    function anim() { ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(anim); }
    anim();

    loadView('tent1');
});
