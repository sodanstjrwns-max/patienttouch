var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;
var isPaused = false;
var startTime = null;
var timerInterval = null;
var consultationId = null;
var selectedPatientId = ${patientId ? `'${patientId}'` : 'null'};
var audioContext = null;
var analyser = null;
var animationFrame = null;

// ===== REAL-TIME COACHING ENGINE =====
var realtimeEngine = {
  sttRecorder: null,       // Separate MediaRecorder for STT chunks
  sttChunks: [],           // Audio chunks for current STT interval
  chunkIndex: 0,           // Running chunk counter
  hintTimer: null,         // Interval for sending STT chunks
  liveTranscript: '',      // Accumulated transcript shown to user
  hintHistory: [],         // All hints received during session
  hintCount: 0,            // Total hints shown
  context: {               // Running context for smarter hints
    priceDiscussed: false,
    objectionDetected: null,
    emotionTrend: 'stable',
    elapsed_seconds: 0
  },
  CHUNK_INTERVAL_MS: 15000,  // Send chunk every 15 seconds
  MIN_CHUNK_SIZE: 2000,      // Minimum audio bytes to send
};

// Load patient info if provided
if (selectedPatientId) {
  fetch('/api/patients/' + selectedPatientId).then(r=>r.json()).then(function(data) {
    if (data.success) {
      document.getElementById('patientName').textContent = data.data.name;
      document.querySelector('#patientInfo p:last-child').textContent = (data.data.age ? data.data.age + '세' : '') + (data.data.gender ? (data.data.gender==='male'?' 남':' 여') : '');
    }
  }).catch(function(){});
}

function updateTimer() {
  if (!startTime) return;
  var elapsed = Math.floor((Date.now() - startTime) / 1000);
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  document.getElementById('timer').textContent = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  realtimeEngine.context.elapsed_seconds = elapsed;
}

function drawWaveform() {
  if (!analyser) return;
  var canvas = document.getElementById('waveCanvas');
  var ctx = canvas.getContext('2d');
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    if (!isRecording) return;
    animationFrame = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 2;
    var gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#6366f1');
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    
    var sliceWidth = canvas.width / bufferLength;
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {
      var v = dataArray[i] / 128.0;
      var y = v * canvas.height / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

// ===== REAL-TIME STT + COACHING =====
function startRealtimeCoaching(stream) {
  // Show transcript container immediately
  var tc = document.getElementById('transcriptContainer');
  tc.classList.remove('hidden');
  tc.innerHTML =
    '<div class="glass-dark rounded-2xl p-4 max-h-32 overflow-y-auto" id="liveTranscriptBox">' +
      '<div class="flex items-center gap-2 mb-2">' +
        '<div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft"></div>' +
        '<span class="text-xs font-bold text-surface-400">실시간 자막</span>' +
        '<span id="sttStatus" class="text-[9px] text-surface-600 ml-auto">대기 중...</span>' +
      '</div>' +
      '<p id="liveTranscriptText" class="text-sm text-surface-300 leading-relaxed">상담이 시작되면 여기에 자막이 표시됩니다...</p>' +
    '</div>';

  // Show hint container
  showHintUI();

  // Use a separate MediaRecorder for STT chunks at lower quality
  try {
    realtimeEngine.sttRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 32000 // Low bitrate for fast upload
    });
    realtimeEngine.sttChunks = [];

    realtimeEngine.sttRecorder.ondataavailable = function(e) {
      if (e.data.size > 0) realtimeEngine.sttChunks.push(e.data);
    };

    // Collect audio in 5-second timeslices
    realtimeEngine.sttRecorder.start(5000);

    // Send accumulated chunks to server every CHUNK_INTERVAL_MS
    realtimeEngine.hintTimer = setInterval(function() {
      if (!isRecording || isPaused || !consultationId) return;
      sendSTTChunk();
    }, realtimeEngine.CHUNK_INTERVAL_MS);

  } catch(e) {
    console.warn('Real-time STT not supported:', e);
  }
}

async function sendSTTChunk() {
  if (realtimeEngine.sttChunks.length === 0) return;

  var chunks = realtimeEngine.sttChunks.slice();
  realtimeEngine.sttChunks = [];

  var blob = new Blob(chunks, { type: 'audio/webm' });
  if (blob.size < realtimeEngine.MIN_CHUNK_SIZE) return;

  var sttEl = document.getElementById('sttStatus');
  if (sttEl) sttEl.textContent = '분석 중...';

  var formData = new FormData();
  formData.append('audio', blob, 'chunk_' + realtimeEngine.chunkIndex + '.webm');

  try {
    // First: quick server-side STT transcription
    var sttRes = await fetch('/api/consultations/' + consultationId + '/upload-audio-chunk', {
      method: 'POST', body: formData
    });
    var sttData = await sttRes.json();
    
    if (sttData.success && sttData.data && sttData.data.transcript) {
      var newText = sttData.data.transcript;
      realtimeEngine.liveTranscript += (realtimeEngine.liveTranscript ? ' ' : '') + newText;
      
      // Update live transcript display
      var txEl = document.getElementById('liveTranscriptText');
      if (txEl) {
        // Show last 200 chars
        var display = realtimeEngine.liveTranscript;
        if (display.length > 200) display = '...' + display.slice(-200);
        txEl.textContent = display;
        // Auto-scroll
        var box = document.getElementById('liveTranscriptBox');
        if (box) box.scrollTop = box.scrollHeight;
      }

      // Detect context changes from transcript
      var lower = newText.toLowerCase();
      if (lower.match(/만원|금액|가격|비용|얼마|할부|분납|수납/)) {
        realtimeEngine.context.priceDiscussed = true;
      }
      if (lower.match(/비싸|부담|다른.?병원|생각.?해|나중에|상의/)) {
        realtimeEngine.context.objectionDetected = newText.slice(0, 50);
      }

      // Now request AI coaching hint
      requestHint(newText);
    }

    realtimeEngine.chunkIndex++;
    if (sttEl) sttEl.textContent = '실시간';
  } catch(e) {
    console.warn('STT chunk failed:', e);
    if (sttEl) sttEl.textContent = '재시도...';
  }
}

async function requestHint(transcriptChunk) {
  if (!consultationId || !transcriptChunk || transcriptChunk.length < 10) return;

  try {
    var res = await fetch('/api/consultations/' + consultationId + '/realtime-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript_chunk: transcriptChunk,
        chunk_index: realtimeEngine.chunkIndex,
        context: realtimeEngine.context
      })
    });
    var data = await res.json();

    if (data.success && data.data && data.data.hint) {
      showRealtimeHint(data.data.hint);
    }
  } catch(e) {
    console.warn('Hint request failed:', e);
  }
}

function showHintUI() {
  var container = document.getElementById('hintContainer');
  container.classList.remove('hidden');
  container.innerHTML =
    '<div id="hintCard" class="glass-dark rounded-2xl p-4 border-l-4 border-l-brand-500/30 transition-all duration-500 opacity-60">' +
      '<div class="flex items-center gap-2 mb-1">' +
        '<i class="fas fa-robot text-brand-400 text-sm animate-pulse-soft"></i>' +
        '<span class="text-xs font-bold text-brand-400">AI 실시간 코칭</span>' +
        '<span id="hintBadge" class="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-400 font-semibold">대기 중</span>' +
      '</div>' +
      '<p id="hintText" class="text-sm text-surface-500 italic">상담이 진행되면 AI가 실시간으로 코칭합니다...</p>' +
    '</div>';
}

function showRealtimeHint(hint) {
  realtimeEngine.hintCount++;
  realtimeEngine.hintHistory.push({ ...hint, time: Date.now() - startTime });

  var typeConfig = {
    warning: { icon: 'fa-triangle-exclamation', color: 'rose', label: '주의', border: 'border-l-rose-500', bg: 'bg-rose-500/10' },
    objection: { icon: 'fa-shield', color: 'amber', label: '반론 대응', border: 'border-l-amber-500', bg: 'bg-amber-500/10' },
    closing: { icon: 'fa-bullseye', color: 'emerald', label: '클로징 기회', border: 'border-l-emerald-500', bg: 'bg-emerald-500/10' },
    spin: { icon: 'fa-comments', color: 'purple', label: 'SPIN 코칭', border: 'border-l-purple-500', bg: 'bg-purple-500/10' },
    rapport: { icon: 'fa-handshake', color: 'sky', label: '라포 형성', border: 'border-l-sky-500', bg: 'bg-sky-500/10' },
    pricing: { icon: 'fa-coins', color: 'brand', label: '가격 프레이밍', border: 'border-l-brand-500', bg: 'bg-brand-500/10' }
  };

  var tc = typeConfig[hint.type] || typeConfig.rapport;

  var container = document.getElementById('hintContainer');
  var card = document.getElementById('hintCard');
  
  // Animate in new hint
  if (card) {
    card.className = 'glass-dark rounded-2xl p-4 ' + tc.border + ' border-l-4 ' + tc.bg + ' transition-all duration-300 animate-slide-up';
    card.innerHTML =
      '<div class="flex items-center gap-2 mb-1.5">' +
        '<div class="w-6 h-6 rounded-lg bg-' + tc.color + '-500/20 flex items-center justify-center">' +
          '<i class="fas ' + tc.icon + ' text-' + tc.color + '-400 text-[10px]"></i>' +
        '</div>' +
        '<span class="text-xs font-bold text-' + tc.color + '-400">' + tc.label + '</span>' +
        '<span class="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-' + tc.color + '-500/20 text-' + tc.color + '-400 font-semibold">#' + realtimeEngine.hintCount + '</span>' +
      '</div>' +
      '<p class="text-sm text-white font-medium leading-relaxed">' + esc(hint.message) + '</p>';
  }

  // Haptic feedback if supported
  if (navigator.vibrate) navigator.vibrate(100);
}

function stopRealtimeCoaching() {
  if (realtimeEngine.hintTimer) {
    clearInterval(realtimeEngine.hintTimer);
    realtimeEngine.hintTimer = null;
  }
  if (realtimeEngine.sttRecorder && realtimeEngine.sttRecorder.state !== 'inactive') {
    try { realtimeEngine.sttRecorder.stop(); } catch(e) {}
  }
}

async function toggleRecording() {
  if (!isRecording) {
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext();
      var source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];
      
      mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      mediaRecorder.start(1000);
      isRecording = true;
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
      
      // UI updates
      document.getElementById('idleWave').classList.add('hidden');
      document.getElementById('waveCanvas').classList.remove('hidden');
      document.getElementById('statusText').textContent = '녹음 중...';
      document.getElementById('statusText').className = 'text-xs text-rose-400 font-semibold';
      document.getElementById('timerSub').textContent = 'AI 코칭이 활성화되었습니다';
      document.getElementById('recordIcon').className = 'fas fa-pause text-2xl text-white relative z-10';
      document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40 animate-pulse-soft';
      document.getElementById('saveBtn').classList.remove('opacity-50', 'pointer-events-none');
      document.getElementById('saveBtn').classList.add('bg-emerald-500/20', 'text-emerald-400');
      
      drawWaveform();
      
      // Create consultation
      var createRes = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: selectedPatientId })
      });
      var createData = await createRes.json();
      if (createData.success) {
        consultationId = createData.data.id;
        // Start real-time coaching engine
        startRealtimeCoaching(stream);
      }
      
    } catch (err) {
      showToast('마이크 접근이 거부되었습니다.','error');
    }
  } else if (!isPaused) {
    mediaRecorder.pause();
    isPaused = true;
    clearInterval(timerInterval);
    // Pause STT too
    if (realtimeEngine.sttRecorder && realtimeEngine.sttRecorder.state === 'recording') {
      try { realtimeEngine.sttRecorder.pause(); } catch(e) {}
    }
    document.getElementById('recordIcon').className = 'fas fa-microphone text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-600/40';
    document.getElementById('statusText').textContent = '일시정지';
  } else {
    mediaRecorder.resume();
    isPaused = false;
    timerInterval = setInterval(updateTimer, 1000);
    // Resume STT
    if (realtimeEngine.sttRecorder && realtimeEngine.sttRecorder.state === 'paused') {
      try { realtimeEngine.sttRecorder.resume(); } catch(e) {}
    }
    document.getElementById('recordIcon').className = 'fas fa-pause text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40 animate-pulse-soft';
    document.getElementById('statusText').textContent = '녹음 중...';
    drawWaveform();
  }
}

function cancelRecording() {
  if (isRecording && !confirm('녹음을 취소하시겠습니까?')) return;
  stopRealtimeCoaching();
  cleanup();
  window.location.href = selectedPatientId ? '/patients/' + selectedPatientId : '/consultations';
}

async function saveRecording() {
  if (!isRecording || audioChunks.length === 0) return;
  
  // Stop real-time coaching first
  stopRealtimeCoaching();
  
  mediaRecorder.stop();
  isRecording = false;
  clearInterval(timerInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  document.getElementById('statusText').textContent = 'AI 분석 중...';
  document.getElementById('statusText').className = 'text-xs text-brand-400 font-semibold animate-pulse-soft';
  document.getElementById('recordBtn').classList.add('opacity-50', 'pointer-events-none');
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-circle-notch fa-spin text-xl text-brand-400"></i>';
  document.getElementById('timerSub').textContent = 'GPT-5가 상담을 분석하고 있습니다...';
  
  // Show coaching session summary if hints were given
  var hc = realtimeEngine.hintCount;
  if (hc > 0) {
    showCoachingSummary();
  }
  
  // Recording quality indicator
  showQualityIndicator(Date.now() - startTime);
  
  // AI analysis steps
  showAnalysisSteps();
  
  await new Promise(function(r) { setTimeout(r, 500); });
  
  var blob = new Blob(audioChunks, { type: 'audio/webm' });
  var elapsed = Math.floor((Date.now() - startTime) / 1000);
  
  var formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  formData.append('duration', String(Math.floor(elapsed / 60)));
  
  try {
    var res = await fetch('/api/consultations/' + consultationId + '/upload-audio', {
      method: 'POST', body: formData
    });
    var data = await res.json();
    
    if (data.success) {
      // Analysis complete
      var bar = document.getElementById('progressBar');
      var pctEl = document.getElementById('progressPct');
      if (bar) bar.style.width = '100%';
      if (pctEl) { pctEl.textContent = '100%'; pctEl.className = 'ml-auto text-sm font-black text-emerald-400'; }
      for(var si=0; si<5; si++) {
        var sIcon = document.getElementById('stepIcon'+si);
        if(sIcon) sIcon.className = 'fas fa-check text-[9px] text-emerald-400';
      }
      
      document.getElementById('statusText').textContent = '분석 완료!';
      document.getElementById('statusText').className = 'text-xs text-emerald-400 font-semibold';
      document.getElementById('saveBtn').innerHTML = '<i class="fas fa-check text-xl text-emerald-400"></i>';
      setTimeout(function() {
        window.location.href = '/consultations/' + consultationId + '/report';
      }, 1500);
    } else {
      document.getElementById('statusText').textContent = data.error || '분석 실패';
      setTimeout(function() {
        window.location.href = '/consultations/' + consultationId;
      }, 2000);
    }
  } catch (err) {
    window.location.href = '/consultations/' + consultationId;
  }
}

function cleanup() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (timerInterval) clearInterval(timerInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (audioContext) audioContext.close();
  isRecording = false;
}

// Show coaching session summary
function showCoachingSummary() {
  var hc = realtimeEngine.hintCount;
  var types = {};
  realtimeEngine.hintHistory.forEach(function(h) { types[h.type] = (types[h.type]||0)+1; });
  
  var tc = document.getElementById('transcriptContainer');
  tc.classList.remove('hidden');
  var html = '<div class="glass-dark rounded-2xl p-3">' +
    '<div class="flex items-center gap-2 mb-2">' +
      '<div class="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center"><i class="fas fa-chart-line text-brand-400 text-[10px]"></i></div>' +
      '<span class="text-xs font-bold text-white">실시간 코칭 요약</span>' +
      '<span class="ml-auto text-[10px] font-bold text-brand-400">' + hc + '개 힌트</span>' +
    '</div>' +
    '<div class="flex gap-1.5 flex-wrap">';
  
  var labels = { warning:'주의', objection:'반론', closing:'클로징', spin:'SPIN', rapport:'라포', pricing:'가격' };
  var colors = { warning:'rose', objection:'amber', closing:'emerald', spin:'purple', rapport:'sky', pricing:'brand' };
  Object.keys(types).forEach(function(t) {
    html += '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-' + (colors[t]||'brand') + '-500/20 text-' + (colors[t]||'brand') + '-400 font-semibold">' +
      (labels[t]||t) + ' ' + types[t] + '</span>';
  });
  html += '</div></div>';
  tc.innerHTML = html;
}

// Recording quality indicator
function showQualityIndicator(durationMs) {
  var secs = Math.floor(durationMs / 1000);
  var mins = Math.floor(secs / 60);
  var quality = mins >= 5 ? { label: '최적', color: 'emerald', icon: 'fa-check-circle', desc: '충분한 녹음 시간 · 정밀 분석 가능' }
    : mins >= 2 ? { label: '양호', color: 'brand', icon: 'fa-thumbs-up', desc: '기본 분석 가능 · 더 길면 더 정확' }
    : mins >= 1 ? { label: '보통', color: 'amber', icon: 'fa-clock', desc: '간략 분석만 가능 · 2분 이상 권장' }
    : { label: '짧음', color: 'rose', icon: 'fa-triangle-exclamation', desc: '분석 정확도가 낮을 수 있어요' };
  
  // Append quality card after coaching summary
  var tc = document.getElementById('transcriptContainer');
  var existing = tc.innerHTML;
  tc.innerHTML = existing +
    '<div class="glass-dark rounded-2xl p-3 flex items-center gap-3 mt-2">' +
      '<div class="w-9 h-9 rounded-xl bg-' + quality.color + '-500/20 flex items-center justify-center shrink-0">' +
        '<i class="fas ' + quality.icon + ' text-' + quality.color + '-400 text-sm"></i>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-1.5">' +
          '<span class="text-xs font-bold text-' + quality.color + '-400">녹음 품질: ' + quality.label + '</span>' +
          '<span class="text-[10px] text-surface-500">' + mins + '분 ' + (secs%60) + '초</span>' +
        '</div>' +
        '<p class="text-[10px] text-surface-400 mt-0.5">' + quality.desc + '</p>' +
      '</div>' +
    '</div>';
}

// AI analysis steps animation
function showAnalysisSteps() {
  var container = document.getElementById('hintContainer');
  container.classList.remove('hidden');
  var steps = [
    { icon: 'fa-microphone-lines', text: '음성 인식', sub: 'gpt-4o-transcribe', delay: 0 },
    { icon: 'fa-users', text: '화자 분리', sub: 'GPT-5 화자분석', delay: 8000 },
    { icon: 'fa-magnifying-glass-chart', text: 'NER + SPIN 분석', sub: '병렬 처리 중', delay: 18000 },
    { icon: 'fa-brain', text: '코칭 리포트 생성', sub: 'GPT-5 종합분석', delay: 28000 },
    { icon: 'fa-sparkles', text: '최종 마무리', sub: '리포트 저장', delay: 40000 }
  ];
  
  var html = '<div class="glass-dark rounded-2xl p-4 border border-brand-500/20">' +
    '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center"><i class="fas fa-robot text-brand-400 text-xs animate-pulse"></i></div>' +
      '<div><span class="text-xs font-bold text-white">AI 분석 파이프라인</span>' +
      '<p class="text-[9px] text-surface-500">GPT-5 · Patient Funnel AI</p></div>' +
      '<span id="progressPct" class="ml-auto text-sm font-black text-brand-400">0%</span>' +
    '</div>' +
    '<div class="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">' +
      '<div id="progressBar" class="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-1000" style="width:0%"></div>' +
    '</div>' +
    '<div id="stepsList" class="space-y-1.5">';
  
  steps.forEach(function(s, i) {
    html += '<div id="step' + i + '" class="flex items-center gap-2 py-1 opacity-40">' +
      '<div class="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center shrink-0">' +
        '<i id="stepIcon' + i + '" class="fas ' + s.icon + ' text-[9px] text-surface-500"></i>' +
      '</div>' +
      '<span class="text-[11px] text-surface-400 flex-1">' + s.text + '</span>' +
      '<span id="stepSub' + i + '" class="text-[9px] text-surface-600">' + s.sub + '</span>' +
    '</div>';
  });
  html += '</div></div>';
  container.innerHTML = html;
  
  var pcts = [5, 25, 50, 75, 95];
  steps.forEach(function(s, i) {
    setTimeout(function() {
      if (i > 0) {
        var prev = document.getElementById('step' + (i-1));
        var prevIcon = document.getElementById('stepIcon' + (i-1));
        if (prev) { prev.classList.remove('opacity-40'); prev.style.opacity = '0.7'; }
        if (prevIcon) { prevIcon.className = 'fas fa-check text-[9px] text-emerald-400'; }
      }
      var cur = document.getElementById('step' + i);
      var curIcon = document.getElementById('stepIcon' + i);
      if (cur) { cur.classList.remove('opacity-40'); cur.style.opacity = '1'; }
      if (curIcon) { curIcon.className = 'fas fa-circle-notch fa-spin text-[9px] text-brand-400'; }
      var bar = document.getElementById('progressBar');
      var pctEl = document.getElementById('progressPct');
      if (bar) bar.style.width = pcts[i] + '%';
      if (pctEl) pctEl.textContent = pcts[i] + '%';
    }, s.delay);
  });
}
