/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */
const APPS = [
  { id:"calculator", name:"Calculator", icon:"🧮" },
  { id:"calendar",   name:"Calendar",   icon:"📅" },
  { id:"clock",      name:"Clock",      icon:"🕐" },
  { id:"maps",       name:"Maps",       icon:"🗺️" },
  { id:"notes",      name:"Notes",      icon:"📝" },
  { id:"translator", name:"Translator", icon:"🌐" },
  { id:"compass",    name:"Compass",    icon:"🧭" },
  { id:"passwords",  name:"Passwords",  icon:"🔑" },
  { id:"camera",     name:"Camera",     icon:"📷" },
  { id:"gallery",    name:"Photo Gallery", icon:"🖼️" },
  { id:"weather",    name:"Weather",    icon:"⛅" },
];

const PHOTO_EMOJIS = "🌉🌇🌆🏙️🌃🎆🎇🌠🌄🏞️🌅🌌🌁🖼️😀😇🤓😱🫥🤢🤐👿💀😽😵🥵😫".match(/\p{Emoji_Presentation}/gu);
let savedPhotos = [];

let openWindows = [];
let activeWindow = null;
let zCounter = 10;

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
function init() {
  const boot = document.getElementById("boot-screen");
  if (boot) {
    setTimeout(() => { boot.classList.add("fade-out"); }, 4200);
    setTimeout(() => {
      boot.classList.add("hidden");
      const logon = document.getElementById("logon-sound");
      const bgm = document.getElementById("bgm");
      logon.volume = 0.9;   // ← logon 音量 (0~1)
      bgm.volume = 0.1;     // ← 背景音乐音量 (0~1)
      logon.play().catch(() => {});
      logon.addEventListener("ended", () => {
        bgm.play().catch(() => {});
      });
      setTimeout(() => {
        if (bgm.paused) bgm.play().catch(() => {});
      }, 5000);
    }, 5000);
  }

  document.addEventListener("click", (e) => {
    let soundId = "click-sound";
    if (e.target.closest("#body-weather")) {
      soundId = "ding-sound";
    } else if (e.target.closest("#body-passwords")) {
      soundId = "pw-sound";
    } else if (e.target.closest("#body-camera") || e.target.closest("#body-gallery")) {
      soundId = "cam-sound";
    }
    const sound = document.getElementById(soundId);
    sound.volume = 1;     
    sound.currentTime = 0;
    sound.play().catch(() => {});
  });

  renderIcons();
  renderStartMenu();
  updateSysClock();
  setInterval(updateSysClock, 30000);
  document.getElementById("desktop").addEventListener("click", e => {
    if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) {
      document.getElementById("start-menu").classList.remove("open");
    }
  });
}

function updateSysClock() {
  document.getElementById("systray-clock").textContent = "NOW:NOW";
}

/* ═══════════════════════════════════════
   ICONS
   ═══════════════════════════════════════ */
function renderIcons() {
  const grid = document.getElementById("icon-grid");
  APPS.forEach(app => {
    const d = document.createElement("div");
    d.className = "desktop-icon";
    d.onclick = () => openApp(app.id);
    d.innerHTML = `<span class="ico">${app.icon}</span><span class="lbl">${app.name}</span>`;
    grid.appendChild(d);
  });
}

/* ═══════════════════════════════════════
   START MENU
   ═══════════════════════════════════════ */
function toggleStart() {
  document.getElementById("start-menu").classList.toggle("open");
}

function renderStartMenu() {
  const body = document.getElementById("start-menu-body");
  const left = document.createElement("div");
  left.className = "start-col start-col-left";
  const right = document.createElement("div");
  right.className = "start-col start-col-right";

  APPS.forEach((app, i) => {
    const item = document.createElement("div");
    item.className = "start-item";
    item.innerHTML = `<span class="si-ico">${app.icon}</span><span>${app.name}</span>`;
    item.onclick = () => { openApp(app.id); document.getElementById("start-menu").classList.remove("open"); };
    (i < 6 ? left : right).appendChild(item);
  });

  body.appendChild(left);
  body.appendChild(right);
}

/* ═══════════════════════════════════════
   WINDOW MANAGEMENT
   ═══════════════════════════════════════ */
function openApp(id) {
  if (openWindows.includes(id)) {
    bringToFront(id);
    // 如果是 gallery 就刷新内容
    if (id === "gallery") {
      const body = document.getElementById("body-gallery");
      if (body) renderGallery(body);
    }
    return;
  }
  openWindows.push(id);
  createWindow(id);
  bringToFront(id);
  updateTaskbar();
}

function closeApp(id) {
  openWindows = openWindows.filter(x => x !== id);
  const el = document.getElementById("win-" + id);
  if (el) el.remove();
  if (activeWindow === id) activeWindow = openWindows[openWindows.length - 1] || null;
  updateTaskbar();
  updateWindowStyles();
}

function bringToFront(id) {
  zCounter++;
  const el = document.getElementById("win-" + id);
  if (el) el.style.zIndex = zCounter;
  activeWindow = id;
  updateWindowStyles();
  updateTaskbar();
}

function updateWindowStyles() {
  document.querySelectorAll(".xp-window").forEach(w => {
    const wid = w.id.replace("win-", "");
    if (wid === activeWindow) {
      w.classList.remove("inactive");
    } else {
      w.classList.add("inactive");
    }
  });
}

function updateTaskbar() {
  const tb = document.getElementById("taskbar-windows");
  tb.innerHTML = "";
  openWindows.forEach(id => {
    const app = APPS.find(a => a.id === id);
    const btn = document.createElement("button");
    btn.className = "taskbar-item" + (id === activeWindow ? " active" : "");
    btn.innerHTML = `<span style="font-size:13px">${app.icon}</span>${app.name}`;
    btn.onclick = () => bringToFront(id);
    tb.appendChild(btn);
  });
}

/* ═══════════════════════════════════════
   CREATE WINDOW
   ═══════════════════════════════════════ */
function createWindow(id) {
  const app = APPS.find(a => a.id === id);
  const idx = openWindows.indexOf(id);
  const x = 120 + (idx % 5) * 40;
  const y = 50 + (idx % 5) * 35;
  const sizes = {
    calculator:  { w: 400, h: 380 },
    calendar:    { w: 400, h: 360 },
    clock:       { w: 320, h: 200 },
    maps:        { w: 420, h: 340 },
    notes:       { w: 400, h: 300 },
    translator:  { w: 420, h: 340 },
    compass:     { w: 350, h: 340 },
    passwords:   { w: 500, h: 380 },
    camera:      { w: 400, h: 420 },
    gallery:     { w: 480, h: 400 },
    weather:     { w: 400, h: 340 },
  };
  const wide = sizes[id].w;
  const tall = sizes[id].h;

  const win = document.createElement("div");
  win.id = "win-" + id;
  win.className = "xp-window";
  win.style.cssText = `left:${x}px;top:${y}px;width:${wide}px;height:${tall}px;z-index:${zCounter}`;
  win.onmousedown = () => bringToFront(id);

  win.innerHTML = `
    <div class="xp-titlebar" data-winid="${id}">
      <span class="title-icon">${app.icon}</span>
      <span class="title-text">${app.name}</span>
      <div class="title-btns">
        <button class="title-btn blue-btn">─</button>
        <button class="title-btn blue-btn">□</button>
        <button class="title-btn red-btn" onclick="closeApp('${id}')">✕</button>
      </div>
    </div>
    <div class="xp-menubar"><span>File</span><span>Edit</span><span>View</span><span>Help</span></div>
    <div class="xp-body" id="body-${id}"></div>
  `;

  document.getElementById("windows-container").appendChild(win);
  makeDraggable(win, win.querySelector(".xp-titlebar"));
  renderApp(id);
}

/* ═══════════════════════════════════════
   DRAGGING
   ═══════════════════════════════════════ */
function makeDraggable(el, handle) {
  let ox, oy, sx, sy, dragging = false;
  handle.addEventListener("mousedown", e => {
    if (e.target.closest(".title-btn")) return;
    dragging = true;
    ox = e.clientX;
    oy = e.clientY;
    sx = el.offsetLeft;
    sy = el.offsetTop;
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    el.style.left = (sx + e.clientX - ox) + "px";
    el.style.top = (sy + e.clientY - oy) + "px";
  });
  document.addEventListener("mouseup", () => { dragging = false; });
}

/* ═══════════════════════════════════════
   APP RENDERERS
   ═══════════════════════════════════════ */
function renderApp(id) {
  const body = document.getElementById("body-" + id);
  const renderers = {
    calculator: renderCalculator,
    calendar: renderCalendar,
    clock: renderClock,
    maps: renderMaps,
    notes: renderNotes,
    translator: renderTranslator,
    compass: renderCompass,
    passwords: renderPasswords,
    camera: renderCamera,
    gallery: renderGallery,
    weather: renderWeather,
  };
  renderers[id](body);
}

/* ── Calculator ── */
function renderCalculator(el) {
  let display = "0", expr = "";
  const btns = ["7","8","9","÷","4","5","6","×","1","2","3","-","0",".","=","+","C"];
  el.innerHTML = `
    <div style="max-width:240px;margin:0 auto">
      <div class="inset-box calc-display" id="calc-disp">0</div>
      <div class="calc-grid" id="calc-btns"></div>
    </div>`;
  const grid = el.querySelector("#calc-btns");
  const disp = el.querySelector("#calc-disp");

  btns.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "xp-btn" + (b === "C" ? " span4" : "");
    btn.textContent = b;
    btn.onclick = () => {
      if (b === "C") { display = "0"; expr = ""; disp.textContent = display; }
      else if (b === "=") {
        const result = expr || display;
        disp.textContent = "";
        disp.innerHTML = '<span class="calc-loading">Calculating...</span>';
        grid.querySelectorAll(".xp-btn").forEach(b => b.disabled = true);
        setTimeout(() => {
          display = result;
          disp.innerHTML = "";
          disp.textContent = display;
          grid.querySelectorAll(".xp-btn").forEach(b => b.disabled = false);
        }, 1600);
        return;
      }
      else {
        const next = (display === "0" && !"+-×÷".includes(b)) ? b : display + b;
        display = next;
        expr = next;
      }
      disp.textContent = display;
    };
    grid.appendChild(btn);
  });
}

/* ── Calendar ── */
function renderCalendar(el) {
  el.innerHTML = `
    <div class="cal-row"><b>The Day Before Yesterday</b></div>
    <div class="cal-row"><b>Yesterday</b></div>
    <div class="cal-row today"><b>Today ← You are here</b></div>
    <div class="cal-row"><b>Tomorrow</b></div>
    <div class="cal-row"><b>The Day After Tomorrow</b></div>
    <hr style="border:1px inset #D4D0C8;margin:12px 0">
    <div class="cal-extra">
      <div><span>📅 Last Week</span></div>
      <div><span>📅 This Week</span></div>
      <div><span>📅 Next Week</span></div>
      <div><span>📅 This Year</span></div>
      <div><span>📅 Next Year</span></div>
    </div>`;
}

/* ── Clock ── */
function renderClock(el) {
  el.innerHTML = `
    <div style="text-align:center;padding-top:60px">
      <div style="font-size:72px;font-weight:bold;color:#003C74;text-shadow:2px 2px 0 #D4D0C8;letter-spacing:4px">NOW:NOW</div>
    </div>`;
}

/* ── Maps ── */
function renderMaps(el) {
  el.innerHTML = `
    <div class="inset-box map-box" style="background:url('asset/map.png') center/cover no-repeat;height:260px;">
      <div class="map-pin"><span style="font-size:24px;display:block">📍</span><b>You are here.</b></div>
    </div>
    <div class="map-btns">
      <button class="xp-btn" disabled>Zoom In</button>
      <button class="xp-btn" disabled>Zoom Out</button>
      <button class="xp-btn" disabled>Directions</button>
    </div>`;
}

/* ── Notes ── */
function renderNotes(el) {
  let saved = false;
  el.innerHTML = `
    <textarea class="inset-box notes-area" id="notes-ta" placeholder="Type your notes here..."></textarea>
    <div class="notes-btns">
      <button class="xp-btn" id="notes-save">💾 Save</button>
      <button class="xp-btn" id="notes-reopen">📂 Reopen</button>
      <button class="xp-btn" id="notes-clear">🗑️ Clear</button>
    </div>
    <div id="notes-msg"></div>`;

  const ta = el.querySelector("#notes-ta");
  const msg = el.querySelector("#notes-msg");

  el.querySelector("#notes-save").onclick = () => {
    if (ta.value.trim()) { saved = true; ta.readOnly = false; ta.style.background = "#FFF"; msg.innerHTML = '<p class="notes-saved">✓ Note saved successfully!</p>'; }
  };
  el.querySelector("#notes-reopen").onclick = () => {
    if (saved) { ta.value = "You wrote something earlier."; ta.readOnly = true; ta.style.background = "#F5F5DC"; msg.innerHTML = ""; }
  };
  el.querySelector("#notes-clear").onclick = () => {
    ta.value = ""; saved = false; ta.readOnly = false; ta.style.background = "#FFF"; msg.innerHTML = "";
  };
}

/* ── Translator ── */
function renderTranslator(el) {
  const langs = ["English","Spanish","French","German","Japanese","Korean","Arabic","Russian","Hindi","Swahili","Mandarin (Simplified)","Mandarin (Traditional)"];
  const nativeNames = {
    "English":"English","Spanish":"Español","French":"Français","German":"Deutsch",
    "Japanese":"日本語","Korean":"한국어","Arabic":"العربية","Russian":"Русский",
    "Hindi":"हिन्दी","Swahili":"Kiswahili","Mandarin (Simplified)":"简体中文","Mandarin (Traditional)":"繁體中文"
  };
  const opts = langs.map(l => `<option>${l}</option>`).join("");

  el.innerHTML = `
    <div class="trans-row">
      <select id="trans-from">${opts}</select>
      <span style="font-size:16px">→</span>
      <select id="trans-to">${opts.replace('selected','')}</select>
    </div>
    <textarea class="inset-box trans-input" id="trans-in" placeholder="Enter text to translate..." style="height:120px"></textarea>
    <button class="xp-btn" style="margin-top:6px" id="trans-go">Translate</button>
    <div class="trans-result" id="trans-res"></div>`;

  el.querySelector("#trans-to").selectedIndex = 1;

  el.querySelector("#trans-go").onclick = () => {
    const input = el.querySelector("#trans-in").value.trim();
    if (!input) return;
    const from = el.querySelector("#trans-from").value;
    const to = el.querySelector("#trans-to").value;
    const native = nativeNames[to] || to;
    const res = el.querySelector("#trans-res");
    res.classList.add("show");
    res.innerHTML = `<b>Translation (${from} → ${to}):</b><p style="margin-top:6px">${input}（${native}）</p>`;
  };
}

/* ── Compass ── */
function renderCompass(el) {
  const dirs = [
    {l:"Some direction ↗",a:45},{l:"Some direction ↘",a:135},
    {l:"Some direction ↙",a:225},{l:"Some direction ↖",a:315},
    {l:"Some direction →",a:90},{l:"Some direction ←",a:270},
    {l:"Some direction ↑",a:0},{l:"Some direction ↓",a:180},
  ];
  const lettersHtml = "";

  el.innerHTML = `
    <div style="text-align:center;padding-top:10px">
      <div class="compass-ring">${lettersHtml}<div class="compass-needle" id="compass-needle">⬆</div></div>
      <button class="xp-btn" style="margin-top:16px" id="compass-btn">🧭 Find Direction</button>
      <div class="compass-result" id="compass-res" style="display:none"></div>
    </div>`;

  el.querySelector("#compass-btn").onclick = () => {
    const d = dirs[Math.floor(Math.random()*dirs.length)];
    el.querySelector("#compass-needle").style.transform = `translate(-50%,-50%) rotate(${d.a}deg)`;
    const res = el.querySelector("#compass-res");
    res.style.display = "block";
    res.textContent = d.l;
  };
}

/* ── Passwords ── */
function renderPasswords(el) {
  const pws = [
    {site:"google.com", user:"user@gmail.com"},
    {site:"facebook.com", user:"john.doe"},
    {site:"github.com", user:"dev_master"},
    {site:"bank.com", user:"john.savings"},
    {site:"netflix.com", user:"binge.watcher"},
    {site:"amazon.com", user:"prime.buyer"},
    {site:"twitter.com", user:"tweet_lord"},
    {site:"spotify.com", user:"music.lover"},
    {site:"reddit.com", user:"lurker_99"},
    {site:"discord.com", user:"gamer.tag"},
    {site:"linkedin.com", user:"professional.me"},
  ];
  el.innerHTML = `
    <div class="inset-box" style="max-height:260px;overflow:auto">
      <table class="pw-table">
        <thead><tr><th>Site</th><th>Username</th><th>Password</th><th></th></tr></thead>
        <tbody>${pws.map((p,i) => `
          <tr>
            <td>🌐 ${p.site}</td><td>${p.user}</td>
            <td class="pw-val" id="pw-${i}">--------</td>
            <td><button class="xp-btn" onclick="document.getElementById('pw-${i}').textContent='********';this.textContent='👁️'">Reveal</button></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

/* ── Camera ── */
function renderCamera(el) {
  let taken = false;
  let stream = null;
  el.innerHTML = `
    <div class="inset-box cam-viewfinder cam-preview" id="cam-view" style="height:280px;">
      <video id="cam-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;display:none;"></video>
      <div id="cam-placeholder"><div style="font-size:40px;margin-bottom:8px">📷</div>Connecting to camera...</div>
    </div>
    <div class="cam-btns">
      <button class="xp-btn" id="cam-take">📸 Take Photo</button>
      <button class="xp-btn" id="cam-retake">🔄 Retake</button>
    </div>`;

  const view = el.querySelector("#cam-view");
  const video = el.querySelector("#cam-video");
  const placeholder = el.querySelector("#cam-placeholder");

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        video.srcObject = s;
        video.style.display = "block";
        placeholder.style.display = "none";
      })
      .catch(() => {
        placeholder.innerHTML = '<div style="font-size:40px;margin-bottom:8px">📷</div>Camera Preview';
      });
  }

  el.querySelector("#cam-take").onclick = () => {
    if (taken) return;
    const flash = document.createElement("div");
    flash.className = "cam-flash";
    view.appendChild(flash);
    setTimeout(() => {
      taken = true;
      if (stream) { stream.getTracks().forEach(t => t.stop()); }
      video.style.display = "none";
      if (placeholder) placeholder.style.display = "none";
      if (flash.parentNode) flash.remove();

      // 存一张随机 emoji 照片到 gallery
      const emoji = PHOTO_EMOJIS[Math.floor(Math.random() * PHOTO_EMOJIS.length)];
      savedPhotos.push(emoji);

      view.className = "inset-box cam-viewfinder cam-taken";
      view.style.height = "280px";
      view.innerHTML = `
        <div style="padding:20px;text-align:center">
          <div class="cam-default-img">
            <div class="sky"></div>
            <div class="sun"></div>
            <svg viewBox="0 0 120 40" style="width:100%;position:absolute;bottom:0">
              <path d="M0,40 Q30,10 60,25 Q90,5 120,40 Z" fill="#228B22"/>
            </svg>
          </div>
          <p style="font-size:10px;color:#888;margin-top:10px">📸 Photo taken successfully! (${savedPhotos.length} in gallery)</p>
        </div>`;
    }, 300);
  };

  el.querySelector("#cam-retake").onclick = () => {
    taken = false;
    view.className = "inset-box cam-viewfinder cam-preview";
    view.style.height = "280px";
    view.innerHTML = `
      <video id="cam-video" autoplay playsinline style="width:100%;height:100%;object-fit:cover;display:none;"></video>
      <div id="cam-placeholder"><div style="font-size:40px;margin-bottom:8px">📷</div>Connecting to camera...</div>`;
    const newVideo = view.querySelector("#cam-video");
    const newPlaceholder = view.querySelector("#cam-placeholder");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          newVideo.srcObject = s;
          newVideo.style.display = "block";
          newPlaceholder.style.display = "none";
        })
        .catch(() => {
          newPlaceholder.innerHTML = '<div style="font-size:40px;margin-bottom:8px">📷</div>Camera Preview';
        });
    }
  };
}

/* ── Photo Gallery ── */
function renderGallery(el) {
  if (savedPhotos.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding-top:40px;color:#888">
        <div style="font-size:48px;margin-bottom:12px">🖼️</div>
        <p>No photos yet.</p>
        <p style="margin-top:6px;font-size:11px">Take some photos with Camera first!</p>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div style="margin-bottom:10px;font-size:11px;color:#555">${savedPhotos.length} photo(s)</div>
    <div class="gallery-grid">
      ${savedPhotos.map((emoji, i) => `
        <div class="gallery-item inset-box">
          <span class="gallery-emoji">${emoji}</span>
          <div class="gallery-label">IMG_${String(i + 1).padStart(3, '0')}</div>
        </div>`).join("")}
    </div>`;
}

/* ── Weather ── */
function renderWeather(el) {
  const qs = [
    {q:"Is there rain outside?",y:"🌧️ Rainy",n:"Not rainy"},
    {q:"Is it sunny?",y:"☀️ Sunny",n:"Not sunny"},
    {q:"Is it windy?",y:"💨 Windy",n:"Not windy"},
    {q:"Is it cold?",y:"🥶 Cold",n:"Not cold"},
    {q:"Can you see clouds?",y:"☁️ Cloudy",n:"Not cloudy"},
  ];
  const answers = {};

  function updateReport() {
    const report = Object.entries(answers).filter(([,v]) => v).map(([k]) => qs[k].y);
    const header = el.querySelector("#weather-report");
    header.textContent = report.length ? report.join(" · ") : "";
  }

  el.innerHTML = `
    <div class="inset-box weather-header">
      🌤️ Weather Report
      <div class="weather-report" id="weather-report"></div>
    </div>
    <div id="weather-qs"></div>`;

  const container = el.querySelector("#weather-qs");
  qs.forEach((item, i) => {
    const row = document.createElement("div");
    row.className = "weather-q";
    row.innerHTML = `
      <span>${item.q}</span>
      <div class="q-btns">
        <button class="xp-btn" data-i="${i}" data-v="yes">Yes</button>
        <button class="xp-btn" data-i="${i}" data-v="no">No</button>
      </div>`;

    row.querySelectorAll(".xp-btn").forEach(btn => {
      btn.onclick = () => {
        const idx = btn.dataset.i;
        const val = btn.dataset.v === "yes";
        answers[idx] = val;
        row.querySelectorAll(".xp-btn").forEach(b => b.classList.remove("chosen-yes","chosen-no"));
        btn.classList.add(val ? "chosen-yes" : "chosen-no");
        updateReport();
      };
    });

    container.appendChild(row);
  });
}

/* ═══════ GO ═══════ */
init();
