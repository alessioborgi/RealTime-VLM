(() => {
  const els = {
    video: document.getElementById('videoFeed'),
    canvas: document.getElementById('canvas'),
    overlay: document.getElementById('overlay'),
    cameraSelect: document.getElementById('cameraSelect'),
    resolutionSelect: document.getElementById('resolutionSelect'),
    qualityRange: document.getElementById('qualityRange'),
    cameraStatus: document.getElementById('cameraStatus'),
    apiStatus: document.getElementById('apiStatus'),
    fps: document.getElementById('fps'),
    startButton: document.getElementById('startButton'),
    captureOnce: document.getElementById('captureOnce'),
    snapshotBtn: document.getElementById('snapshotBtn'),
    baseURL: document.getElementById('baseURL'),
    instructionText: document.getElementById('instructionText'),
    responseText: document.getElementById('responseText'),
    intervalSelect: document.getElementById('intervalSelect'),
    maxTokens: document.getElementById('maxTokens'),
    temperature: document.getElementById('temperature'),
    testAPI: document.getElementById('testAPI'),
    showOverlay: document.getElementById('showOverlay'),
    autoScroll: document.getElementById('autoScroll'),
    advancedToggle: document.getElementById('advancedToggle'),
    advancedPanel: document.getElementById('advancedPanel'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    clearLog: document.getElementById('clearLog'),
    logList: document.getElementById('logList'),
    logItemTemplate: document.getElementById('logItemTemplate'),
    themeToggle: document.getElementById('themeToggle'),
    modelSelect: document.getElementById('modelSelect'),
    refreshModels: document.getElementById('refreshModels'),
    customModelField: document.getElementById('customModelField'),
    customModel: document.getElementById('customModel'),
  };

  const state = {
    stream: null,
    isProcessing: false,
    intervalId: null,
    inFlight: false,
    lastFrameAt: 0,
    fpsCounter: { last: performance.now(), frames: 0 },
  };

  // Init
  els.instructionText.value = 'What do you see?';

  // Theme toggle (simple: store in localStorage and toggle class on body if needed)
  const themeKey = 'camera-app-theme';
  const applyTheme = (t) => {
    document.documentElement.dataset.theme = t;
  };
  const setTheme = (t) => {
    localStorage.setItem(themeKey, t);
    applyTheme(t);
  };
  const getTheme = () => localStorage.getItem(themeKey) || 'dark';
  setTheme(getTheme());
  els.themeToggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  // Advanced panel toggle
  els.advancedToggle.addEventListener('click', () => {
    const expanded = els.advancedPanel.classList.toggle('hidden') ? 'false' : 'true';
    els.advancedToggle.setAttribute('aria-expanded', expanded);
    els.advancedToggle.textContent = expanded === 'true' ? 'Advanced ▲' : 'Advanced ▼';
  });

  
  // Models
  async function fetchModels(){
    const base = (els.baseURL.value || '').replace(/\/$/, '');
    if(!base){ addLog('Set Base API first.'); return; }
    const url = base + '/v1/models';
    setBadge(els.apiStatus, 'warn', 'API: Fetching models…');
    try{
      const res = await fetch(url, { method:'GET' });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const list = Array.isArray(data) ? data
                 : Array.isArray(data?.data) ? data.data
                 : Array.isArray(data?.models) ? data.models
                 : [];
      const ids = list.map(m => (typeof m === 'string' ? m : (m.id || m.name || m.model))).filter(Boolean);
      els.modelSelect.innerHTML = '';
      if(ids.length === 0){
        els.modelSelect.innerHTML = '<option value="">(no models found)</option>';
        setBadge(els.apiStatus, 'warn', 'API: No models');
        return;
      }
      ids.forEach((id, i) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        els.modelSelect.appendChild(opt);
      });
      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = 'Custom…';
      els.modelSelect.appendChild(customOpt);

      els.modelSelect.value = ids[0];
      setBadge(els.apiStatus, 'ok', `API: ${ids.length} models`);
      addLog(`Fetched ${ids.length} models`);
    }catch(err){
      console.warn('fetchModels failed', err);
      setBadge(els.apiStatus, 'err', 'API: Models error');
      addLog('Models fetch error: ' + err.message);
    }
  }

  function currentModelId(){
    const v = els.modelSelect.value || '';
    if(v === '__custom__'){
      return (els.customModel.value || '').trim();
    }
    return v.trim();
  }

  // Presets
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      els.instructionText.value = chip.dataset.preset;
    });
  });

  // Enumerate devices
  async function listCameras(){
    try{
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      els.cameraSelect.innerHTML = '';
      videos.forEach((d, i) => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || `Camera ${i+1}`;
        els.cameraSelect.appendChild(opt);
      });
    }catch(err){
      console.warn('enumerateDevices failed', err);
    }
  }

  function getConstraints(){
    const res = els.resolutionSelect.value;
    const constraints = { video: { facingMode: 'user' }, audio: false };
    if(res !== 'default'){
      const [w, h] = res.split('x').map(Number);
      constraints.video = { width: { ideal: w }, height: { ideal: h } };
    }
    if(els.cameraSelect.value){
      constraints.video.deviceId = { exact: els.cameraSelect.value };
    }
    return constraints;
  }

  async function initCamera(){
    try{
      // Stop previous if any
      if(state.stream){
        state.stream.getTracks().forEach(t => t.stop());
        state.stream = null;
      }
      const constraints = getConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.stream = stream;
      els.video.srcObject = stream;
      setBadge(els.cameraStatus, 'ok', 'Camera ready');
      computeFPS();
    }catch(err){
      console.error('Camera error', err);
      setBadge(els.cameraStatus, 'err', `${err.name}: ${err.message}`);
      alert(`Error accessing camera: ${err.name}. Use HTTPS or localhost and grant permission.`);
    }
  }

  function setBadge(el, type, text){
    el.className = 'badge ' + (type || '');
    el.textContent = text;
  }

  function captureImage(){
    if(!state.stream || !els.video.videoWidth) return null;
    const q = parseFloat(els.qualityRange.value) || 0.8;
    const w = els.video.videoWidth;
    const h = els.video.videoHeight;
    els.canvas.width = w;
    els.canvas.height = h;
    const ctx = els.canvas.getContext('2d');
    ctx.drawImage(els.video, 0, 0, w, h);
    return els.canvas.toDataURL('image/jpeg', q);
  }

  async function sendChatCompletionRequest(instruction, imageBase64URL){
    const url = (els.baseURL.value || '').replace(/\/$/, '') + '/v1/chat/completions';
    const modelId = currentModelId();
    const payload = {
      ...(modelId ? { model: modelId } : {}),
      max_tokens: Math.max(1, parseInt(els.maxTokens.value, 10) || 100),
      temperature: Math.max(0, Math.min(2, parseFloat(els.temperature.value) || 0.2)),
      messages: [
        { role: 'user', content: [
          { type:'text', text: instruction },
          { type:'image_url', image_url: { url: imageBase64URL } }
        ]}
      ]
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '(No content)';
    return content;
  }

  async function sendData(){
    if(state.inFlight) return; // prevent overlap
    const instruction = els.instructionText.value.trim();
    if(!instruction){
      toast('Please enter an instruction first.');
      return;
    }
    const imageBase64URL = captureImage();
    if(!imageBase64URL){
      setResponse('Failed to capture image. Stream might not be active.');
      return;
    }

    try{
      state.inFlight = true;
      if(els.showOverlay.checked) els.overlay.classList.remove('hidden');
      const started = performance.now();
      const content = await sendChatCompletionRequest(instruction, imageBase64URL);
      const ms = Math.round(performance.now() - started);
      setBadge(els.apiStatus, 'ok', `API: OK (${ms} ms)`);
      setResponse(content);
      addLog(`OK in ${ms} ms — ${instruction.slice(0, 64)}`);
    }catch(err){
      console.error('sendData error', err);
      setBadge(els.apiStatus, 'err', 'API: Error');
      setResponse(`Error: ${err.message}`);
      addLog(`Error — ${err.message}`);
    }finally{
      state.inFlight = false;
      els.overlay.classList.add('hidden');
    }
  }

  function setResponse(text){
    els.responseText.value = text;
    if(els.autoScroll.checked){
      els.responseText.scrollTop = els.responseText.scrollHeight;
    }
  }

  function addLog(summary){
    const t = new Date();
    const li = els.logItemTemplate.content.cloneNode(true);
    li.querySelector('.time').textContent = t.toLocaleTimeString();
    li.querySelector('.summary').textContent = summary;
    els.logList.prepend(li);
    while(els.logList.children.length > 200){
      els.logList.removeChild(els.logList.lastChild);
    }
  }

  function toast(msg){
    // lightweight toast using alert fallback for now
    console.log('Toast:', msg);
  }

  function handleStart(){
    if(!state.stream){
      alert('Camera not available. Please grant permission first.');
      return;
    }
    if(state.isProcessing) return;
    state.isProcessing = true;
    els.startButton.textContent = 'Stop';
    els.startButton.classList.add('ghost');
    els.responseText.placeholder = 'Processing...';

    const intervalMs = parseInt(els.intervalSelect.value, 10) || 500;
    sendData(); // immediate
    state.intervalId = setInterval(sendData, intervalMs);
  }

  function handleStop(){
    state.isProcessing = false;
    if(state.intervalId) clearInterval(state.intervalId);
    state.intervalId = null;
    els.startButton.textContent = 'Start';
    els.startButton.classList.remove('ghost');
    els.responseText.placeholder = 'Server response will appear here...';
  }

  function computeFPS(){
    // measure how often video frame changes
    function tick(){
      if(!state.stream) return;
      const v = els.video;
      if(v.readyState >= 2){
        // approximate FPS using requestAnimationFrame counts per second
        state.fpsCounter.frames++;
        const now = performance.now();
        const diff = now - state.fpsCounter.last;
        if(diff >= 1000){
          const fps = state.fpsCounter.frames / (diff / 1000);
          els.fps.textContent = `FPS: ${fps.toFixed(1)}`;
          state.fpsCounter.last = now;
          state.fpsCounter.frames = 0;
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // API test
  els.testAPI.addEventListener('click', async () => {
    try{
      setBadge(els.apiStatus, 'warn', 'API: Testing...');
      const url = (els.baseURL.value || '').replace(/\/$/, '') + '/v1/chat/completions';
      const modelId = currentModelId();
    const payload = {
      ...(modelId ? { model: modelId } : {}),
        max_tokens: 5,
        messages: [{ role:'user', content: [{ type:'text', text:'ping'}]}]
      };
      const res = await fetch(url, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      setBadge(els.apiStatus, 'ok', 'API: OK');
      addLog('API test OK');
      await fetchModels();
    }catch(err){
      setBadge(els.apiStatus, 'err', 'API: Error');
      addLog('API test failed: ' + err.message);
    }
  });

  // UI events
  els.startButton.addEventListener('click', () => state.isProcessing ? handleStop() : handleStart());
  els.captureOnce.addEventListener('click', sendData);
  els.snapshotBtn.addEventListener('click', () => {
    const dataURL = captureImage();
    if(!dataURL){ alert('No frame to save.'); return; }
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'frame.jpg';
    a.click();
  });
  els.copyBtn.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(els.responseText.value || '');
      toast('Copied to clipboard.');
    }catch{}
  });
  els.clearBtn.addEventListener('click', () => setResponse(''));
  els.clearLog.addEventListener('click', () => els.logList.innerHTML = '');
  // Model UI events
  els.modelSelect.addEventListener('change', () => {
    const isCustom = els.modelSelect.value === '__custom__';
    els.customModelField.classList.toggle('hidden', !isCustom);
  });
  els.refreshModels.addEventListener('click', fetchModels);
  els.baseURL.addEventListener('change', () => { fetchModels(); });


  // Keyboard: space to toggle
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space' && !e.repeat){
      e.preventDefault();
      state.isProcessing ? handleStop() : handleStart();
    }
  });

  // Camera init on load
  window.addEventListener('DOMContentLoaded', async () => {
    if(!navigator.mediaDevices?.getUserMedia){
      alert('getUserMedia not supported in this browser.');
      return;
    }
    await listCameras();
    await initCamera();
    await fetchModels();
    // refresh labels when permission granted
    navigator.mediaDevices.addEventListener?.('devicechange', listCameras);
  });

  // React to control changes
  els.cameraSelect.addEventListener('change', initCamera);
  els.resolutionSelect.addEventListener('change', initCamera);

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    if(state.stream){
      state.stream.getTracks().forEach(t => t.stop());
    }
    if(state.intervalId) clearInterval(state.intervalId);
  });
})();