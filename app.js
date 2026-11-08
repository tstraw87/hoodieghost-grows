/**
 * HOODIEGHOST GROWS ENGINE
 * Complete state, dynamic tracking metrics & localized persistence management.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Current Global Active Workspace Scope
    let currentTent = 'tent1';

    // Elements Lookup Matrix
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

    // Default structural schemas per workspace sandbox environment
    const defaultData = {
        tent1: { age: 1, airTemp: 78, rh: 60, unit: 'F', cal: false, mag: false, additives: ['Ghost Root Booster', 'Neon Foliar Blast'] },
        tent2: { age: 25, airTemp: 76, rh: 55, unit: 'F', cal: false, mag: false, additives: ['Hydro Grow A', 'Hydro Grow B'] },
        tent3: { age: 60, airTemp: 74, rh: 45, unit: 'F', cal: false, mag: false, additives: ['Organic Bloom Pack'] }
    };

    // Initialize local tracking datasets
    function getTentState(tentId) {
        const stored = localStorage.getItem(`hoodieghost_${tentId}`);
        if (stored) {
            try { return JSON.parse(stored); } catch(e) { return defaultData[tentId]; }
        }
        return defaultData[tentId];
    }

    function saveTentState(tentId, data) {
        localStorage.setItem(`hoodieghost_${tentId}`, JSON.stringify(data));
    }

    // Dynamic stage mapper based on continuous timeline ranges
    function determineGrowthStage(day) {
        if (day <= 7) return 'Germination';
        if (day <= 21) return 'Seedling';
        if (day <= 56) return 'Vegetative Stage';
        if (day <= 110) return 'Flowering Cycle';
        return 'Harvest Window';
    }

    // VPD Calculation Engine with Offset Mechanics
    function calculateVPD() {
        const airTemp = parseFloat(airTempInput.value) || 0;
        const rh = parseFloat(roomRhInput.value) || 0;
        const selectedUnit = document.querySelector('input[name="temp-unit"]:checked').value;

        let tempC = airTemp;
        if (selectedUnit === 'F') {
            tempC = (airTemp - 32) * 5 / 9;
        }

        // Apply specific -2° Leaf-to-Air Offset Target
        const leafTempC = tempC - 2;
        const leafTempF = (leafTempC * 9 / 5) + 32;

        // Render leaf value feedback
        if (selectedUnit === 'F') {
            leafTempDisplay.textContent = `${leafTempF.toFixed(1)}°F`;
        } else {
            leafTempDisplay.textContent = `${leafTempC.toFixed(1)}°C`;
        }

        // Tetens Equation parameters for saturated vapor pressures (SVP)
        const svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
        const svpLeaf = 0.61078 * Math.exp((17.27 * leafTempC) / (leafTempC + 237.3));

        // Actual vapor pressure calculation of room atmosphere
        const avpAir = svpAir * (rh / 100);

        // Vapor Pressure Deficit calculation (Target Leaf SVP - Real Air AVP)
        let vpd = svpLeaf - avpAir;
        if (vpd < 0) vpd = 0;

        vpdDisplay.textContent = `${vpd.toFixed(2)} kPa`;
    }

    // Split Feed Logic Validation
    function checkDeficiencyAlarms() {
        // Warning triggers when either independent channel registers unchecked state
        if (!calCheck.checked || !magCheck.checked) {
            roWarning.classList.remove('hidden');
        } else {
            roWarning.classList.add('hidden');
        }
    }

    // Build Inventory Components dynamically
    function renderAdditives(additivesArray) {
        inventoryGrid.innerHTML = '';
        additivesArray.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'inventory-item';
            li.innerHTML = `
                <span>${item}</span>
                <button class="delete-btn" data-index="${index}">✕</button>
            `;
            inventoryGrid.appendChild(li);
        });
    }

    // Compile view layout tracking directly from current tent states
    function loadActiveTentView(tentId) {
        currentTent = tentId;
        const state = getTentState(tentId);

        // Map component elements
        ageSlider.value = state.age;
        ageText.textContent = `Day ${state.age}`;
        stageText.textContent = determineGrowthStage(state.age);

        airTempInput.value = state.airTemp;
        roomRhInput.value = state.rh;

        tempUnitRadios.forEach(radio => {
            radio.checked = (radio.value === state.unit);
        });

        calCheck.checked = state.cal;
        magCheck.checked = state.mag;

        renderAdditives(state.additives);
        calculateVPD();
        checkDeficiencyAlarms();
    }

    // Extract current interface settings to save back to memory ledger
    function updateCurrentTentStore() {
        const additives = [];
        inventoryGrid.querySelectorAll('.inventory-item span').forEach(el => {
            additives.push(el.textContent);
        });

        const state = {
            age: parseInt(ageSlider.value),
            airTemp: parseFloat(airTempInput.value) || 0,
            rh: parseFloat(roomRhInput.value) || 0,
            unit: document.querySelector('input[name="temp-unit"]:checked').value,
            cal: calCheck.checked,
            mag: magCheck.checked,
            additives: additives
        };
        saveTentState(currentTent, state);
    }

    // Event Loop Hook Listeners
    tentButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tentButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            loadActiveTentView(e.target.getAttribute('data-tent'));
        });
    });

    ageSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        ageText.textContent = `Day ${val}`;
        stageText.textContent = determineGrowthStage(parseInt(val));
        updateCurrentTentStore();
    });

    [airTempInput, roomRhInput].forEach(input => {
        input.addEventListener('input', () => {
            calculateVPD();
            updateCurrentTentStore();
        });
    });

    tempUnitRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            calculateVPD();
            updateCurrentTentStore();
        });
    });

    [calCheck, magCheck].forEach(box => {
        box.addEventListener('change', () => {
            checkDeficiencyAlarms();
            updateCurrentTentStore();
        });
    });

    // Append New Additives Terminal Command Execution
    injectBtn.addEventListener('click', () => {
        const text = additiveInput.value.trim();
        if (text) {
            const state = getTentState(currentTent);
            state.additives.push(text);
            saveTentState(currentTent, state);
            renderAdditives(state.additives);
            additiveInput.value = '';
        }
    });

    additiveInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') injectBtn.click();
    });

    // Delete Additive Handler via event delegation matrix
    inventoryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const idx = parseInt(e.target.getAttribute('data-index'));
            const state = getTentState(currentTent);
            state.additives.splice(idx, 1);
            saveTentState(currentTent, state);
            renderAdditives(state.additives);
        }
    });

    // Atmospheric Floating Background Fog Canvas Animation Loop
    const canvas = document.getElementById('fog-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class FogParticle {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height; // Spread initially across height
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.radius = Math.random() * 80 + 40;
            this.vx = Math.random() * 0.4 - 0.2;
            this.vy = -(Math.random() * 0.5 + 0.1);
            this.alpha = Math.random() * 0.15 + 0.05;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -this.radius || this.x < -this.radius || this.x > canvas.width + this.radius) {
                this.reset();
            }
        }
        draw() {
            ctx.beginPath();
            let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            gradient.addColorStop(0, `rgba(102, 255, 51, ${this.alpha})`); // Subtle Toxic Neon Hue blend
            gradient.addColorStop(0.4, `rgba(29, 31, 33, ${this.alpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(20, 22, 23, 0)');
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Populate initial background atmosphere context
