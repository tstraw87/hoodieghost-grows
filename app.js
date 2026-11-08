let isFahrenheit = true;
let activeTent = "tent1";

let dataStorage = JSON.parse(localStorage.getItem('hoodieghost_master_db')) || {
  tent1: { name: "Tent 1", temp: 75, rh: 60, stage: "Vegetative", age: 18, water: "RO", ppm: 0, history: },
  tent2: { name: "Tent 2", temp: 78, rh: 50, stage: "EarlyFlower", age: 45, water: "Tap", ppm: 210, history: },
  tent3: { name: "Tent 3", temp: 72, rh: 65, stage: "Seedling", age: 8, water: "RO", ppm: 0, history: }
};

// --- ATMOSPHERIC FOG COMPONENT CANVAS ENGINE ---
const canvas = document.getElementById('fogCanvas');
const ctx = canvas.getContext('2d');
let particles =;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 120 + 70;
    this.speedX = Math.random() * 0.3 - 0.15;
    this.speedY = Math.random() * 0.15 - 0.07;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x > canvas.width) this.x = 0;
    if (this.x < 0) this.x = canvas.width;
  }
  draw(colorHex) {
    ctx.fillStyle = colorHex;
    ctx.globalAlpha = 0.025;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
for(let i=0; i<35; i++) particles.push(new Particle());

// --- BUBBLING FLUID STORAGE UNIT LOOPS ---
const rezCanvas = document.getElementById('rezCanvas');
const rezCtx = rezCanvas ? rezCanvas.getContext('2d') : null;
let bubbles =;

class Bubble {
  constructor() {
    this.x = Math.random() * 400;
    this.y = 150;
    this.speed = Math.random() * 1.2 + 0.6;
    this.radius = Math.random() * 3.5 + 1;
  }
  update() {
    this.y -= this.speed;
    if (this.y < 50) {
      this.y = 150;
      this.x = Math.random() * (rezCanvas ? rezCanvas.width : 400);
    }
  }
  draw() {
    if (!rezCtx) return;
    rezCtx.strokeStyle = "rgba(255,255,255,0.35)";
    rezCtx.lineWidth = 1.5;
    rezCtx.beginPath();
    rezCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    rezCtx.stroke();
  }
}
for(let i=0; i<20; i++) bubbles.push(new Bubble());

function calculateVPD() {
  const current = dataStorage[activeTent];
  let t = parseFloat(document.getElementById('tempSlider').value);
  let rh = parseFloat(document.getElementById('rhSlider').value);
  
  current.temp = t;
  current.rh = rh;
  document.getElementById('tempVal').innerText = t;
  document.getElementById('rhVal').innerText = rh;

  let tempC = isFahrenheit ? (t - 32) * 5/9 : t;
  let leafTempC = tempC - 2;

  let svpAir = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  let svpLeaf = 0.61078 * Math.exp((17.27 * leafTempC) / (leafTempC + 237.3));
  let avpAir = svpAir * (rh / 100);
  let vpd = svpLeaf - avpAir;

  if (vpd < 0) vpd = 0;

  const display = document.getElementById('vpdDisplay');
  display.innerText = vpd.toFixed(2) + " kPa";

  updateVisualOutputs(vpd, current);
}

// --- DYNAMIC INGREDIENT CONSOLE UTILITIES ---
function addNewNutrientItem() {
  const inputEl = document.getElementById('newNutrientInput');
  const name = inputEl.value.trim();
  if(!name) return;

  const id = "custom_nut_" + Date.now();
  const shelf = document.getElementById('shelfGrid');
  
  // Build and inject custom nutrient element template
  const wrapper = document.createElement('label');
  wrapper.className = "checkbox-label";
  wrapper.innerHTML = `<input type="checkbox" id="${id}" checked onchange="runNutrientAudit()"> ${name}`;
  
  shelf.appendChild(wrapper);
  inputEl.value = '';
  runNutrientAudit();
}

function runNutrientAudit() {
  const current = dataStorage[activeTent];
  const waterSrc = document.getElementById('waterSource').value;
  const rawPPM = parseInt(document.getElementById('rawPPM').value) || 0;
  const mascotTxt = document.getElementById('mascotSpeech');
  
  current.water = waterSrc;
  current.ppm = rawPPM;

  let alerts =;
  let rezColor = '#99CCFF'; // Stable Blue

  if (waterSrc === "Tap" && rawPPM > 180) {
    alerts.push("⚠️ RAW TAP WATER IS ABOVE 180 PPM! Base volumes restricted by 15% to safeguard root zones.");
    document.getElementById('rezStatusText').innerText = "RESTRICTED DOSAGE MATRIX MODE ACTIVE";
    rezColor = '#FFB300'; // Amber Warning
  } else {
    document.getElementById('rezStatusText').innerText = "REZ OK";
  }

  // Auditing split Calcium/Magnesium configurations
  if (waterSrc === "RO" && (!document.getElementById('nut_cal').checked || !document.getElementById('nut_mag').checked)) {
    alerts.push("❌ WATER BASE CRISIS: Reverse Osmosis setups require isolated Pure Calcium AND Pure Magnesium checks.");
  }
  if (current.stage === "LateFlower" && document.getElementById('nut_silica') && document.getElementById('nut_silica').checked) {
    alerts.push("❌ SILICA FLAG WARNING: Do not leave Silica active during Late Flower.");
  }

  if (alerts.length > 0) {
    mascotTxt.innerText = alerts.join(" | ");
    document.getElementById('mascotSkull').className = "skull-wizard crisis";
  } else {
    mascotTxt.innerText = `"System operational for space: [${activeTent.toUpperCase()}]. Variables verified safe."`;
    document.getElementById('mascotSkull').className = "skull-wizard optimal";
  }

  renderReservoir(rezColor);
  saveToMemory();
}

function updateVisualOutputs(vpd, state) {
  const skull = document.getElementById('mascotSkull');
  let fogColor = '#66FF33';

  if (vpd < 0.4 || vpd > 2.0) {
    skull.className = "skull-wizard crisis";
    fogColor = '#FF3333';
  } else if (vpd < 0.8 || vpd > 1.6) {
    if(skull.className !== "skull-wizard crisis") skull.className = "skull-wizard warning";
    fogColor = '#FFB300';
  } else {
    if(skull.className !== "skull-wizard crisis") skull.className = "skull-wizard optimal";
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw(fogColor);
  });
}

function renderReservoir(color) {
  if (!rezCanvas || !rezCtx) return;
  rezCanvas.width = rezCanvas.parentElement.clientWidth;
  rezCanvas.height = 150;

  rezCtx.clearRect(0, 0, rezCanvas.width, rezCanvas.height);
  rezCtx.fillStyle = color;
  rezCtx.fillRect(0, 50, rezCanvas.width, 100);

  bubbles.forEach(b => {
    b.update();
    b.draw();
  });
}

function switchTent(val) {
  activeTent = val;
  const current = dataStorage[activeTent];
  document.getElementById('tempSlider').value = current.temp;
  document.getElementById('rhSlider').value = current.rh;
  document.getElementById('stageSelect').value = current.stage;
  document.getElementById('ageSlider').value = current.age;
  document.getElementById('waterSource').value = current.water;
  document.getElementById('rawPPM').value = current.ppm;
  
  calculateVPD();
  runNutrientAudit();
  renderHistoryTable();
}

function updateStage() {
  dataStorage[activeTent].stage = document.getElementById('stageSelect').value;
  runNutrientAudit();
}

function updateAge() {
  let val = document.getElementById('ageSlider').value;
  dataStorage[activeTent].age = val;
  document.getElementById('ageDisplay').innerText = val;
  saveToMemory();
}

function logDailyMetrics() {
  const current = dataStorage[activeTent];
  const vpdStr = document.getElementById('vpdDisplay').innerText;
  const entry = {
    date: new Date().toLocaleDateString(),
    stage: current.stage,
    age: current.age,
    climate: `${current.temp}° / ${current.rh}%`,
    vpd: vpdStr,
    status: document.getElementById('rezStatusText').innerText
  };
  current.history.unshift(entry);
  saveToMemory();
  renderHistoryTable();
}

function renderHistoryTable() {
  const tbody = document.querySelector('#historyTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  dataStorage[activeTent].history.forEach(h => {
    let row = `<tr><td>${h.date}</td><td>${h.stage}</td><td>Day ${h.age}</td><td>${h.climate}</td><td>${h.vpd}</td><td>${h.status}</td></tr>`;
    tbody.innerHTML += row;
  });
}

function toggleUnits() {
  isFahrenheit = !isFahrenheit;
  const btn = document.getElementById('unitToggle');
  const slider = document.getElementById('tempSlider');
  if (isFahrenheit) {
    btn.innerText = "SCALE: Fahrenheit (°F)";
    slider.min = 50; slider.max = 100; slider.value = 75;
  } else {
    btn.innerText = "SCALE: Celsius (°C)";
    slider.min = 10; slider.max = 38; slider.value = 24;
  }
  calculateVPD();
}

function askAI() {
  const prompt = document.getElementById('aiInput').value;
  if(!prompt) return;
  document.getElementById('mascotSpeech').innerText = `"[AI Terminal Parsing: '${prompt}'] ... Looking up decentralized organic data archives for you right now."`;
  document.getElementById('aiInput').value = '';
}

function saveToMemory() {
  localStorage.setItem('hoodieghost_master_db', JSON.stringify(dataStorage));
}

function appLoop() {
  calculateVPD();
  requestAnimationFrame(appLoop);
}

window.addEventListener('load', () => {
  switchTent('tent1');
  appLoop();
});
