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
      document.getElementById('timerSub').textContent = '상담을 진행하세요';
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
      if (createData.success) consultationId = createData.data.id;
      
    } catch (err) {
      showToast('마이크 접근이 거부되었습니다.','error');
    }
  } else if (!isPaused) {
    mediaRecorder.pause();
    isPaused = true;
    clearInterval(timerInterval);
    document.getElementById('recordIcon').className = 'fas fa-microphone text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-600/40';
    document.getElementById('statusText').textContent = '일시정지';
  } else {
    mediaRecorder.resume();
    isPaused = false;
    timerInterval = setInterval(updateTimer, 1000);
    document.getElementById('recordIcon').className = 'fas fa-pause text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40 animate-pulse-soft';
    document.getElementById('statusText').textContent = '녹음 중...';
    drawWaveform();
  }
}

function cancelRecording() {
  if (isRecording && !confirm('녹음을 취소하시겠습니까?')) return;
  cleanup();
  window.location.href = selectedPatientId ? '/patients/' + selectedPatientId : '/consultations';
}

async function saveRecording() {
  if (!isRecording || audioChunks.length === 0) return;
  
  mediaRecorder.stop();
  isRecording = false;
  clearInterval(timerInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  document.getElementById('statusText').textContent = 'AI 분석 중...';
  document.getElementById('statusText').className = 'text-xs text-brand-400 font-semibold animate-pulse-soft';
  document.getElementById('recordBtn').classList.add('opacity-50', 'pointer-events-none');
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-circle-notch fa-spin text-xl text-brand-400"></i>';
  document.getElementById('timerSub').textContent = 'GPT-5가 상담을 분석하고 있습니다...';
  
  // 녹음 품질 인디케이터
  showQualityIndicator(Date.now() - startTime);
  
  // AI 분석 진행 단계 표시
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
      // 분석 완료 - 프로그레스 100%
      var bar = document.getElementById('progressBar');
      var pctEl = document.getElementById('progressPct');
      if (bar) bar.style.width = '100%';
      if (pctEl) { pctEl.textContent = '100%'; pctEl.className = 'ml-auto text-sm font-black text-emerald-400'; }
      // 마지막 단계 체크
      for(var si=0; si<5; si++) {
        var sIcon = document.getElementById('stepIcon'+si);
        if(sIcon) sIcon.className = 'fas fa-check text-[9px] text-emerald-400';
      }
      
      document.getElementById('statusText').textContent = '분석 완료!';
      document.getElementById('statusText').className = 'text-xs text-emerald-400 font-semibold';
      document.getElementById('saveBtn').innerHTML = '<i class="fas fa-check text-xl text-emerald-400"></i>';
      setTimeout(function() {
        window.location.href = '/consultations/' + consultationId + '/report';
      }, 1200);
    } else {
      document.getElementById('statusText').textContent = data.error || '분석 실패';
      window.location.href = '/consultations/' + consultationId;
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

// 녹음 품질 인디케이터
function showQualityIndicator(durationMs) {
  var secs = Math.floor(durationMs / 1000);
  var mins = Math.floor(secs / 60);
  var quality = mins >= 5 ? { label: '최적', color: 'emerald', icon: 'fa-check-circle', desc: '충분한 녹음 시간 · 정밀 분석 가능' }
    : mins >= 2 ? { label: '양호', color: 'brand', icon: 'fa-thumbs-up', desc: '기본 분석 가능 · 더 길면 더 정확' }
    : mins >= 1 ? { label: '보통', color: 'amber', icon: 'fa-clock', desc: '간략 분석만 가능 · 2분 이상 권장' }
    : { label: '짧음', color: 'rose', icon: 'fa-triangle-exclamation', desc: '분석 정확도가 낮을 수 있어요' };
  
  var tc = document.getElementById('transcriptContainer');
  tc.classList.remove('hidden');
  tc.innerHTML = 
    '<div class="glass-dark rounded-2xl p-3 flex items-center gap-3">' +
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

// AI 분석 진행 단계 애니메이션 (프로그레스 바 + 체크마크)
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
  
  // 진행률 바 + 단계 리스트
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
  
  // 단계별 애니메이션
  var pcts = [5, 25, 50, 75, 95];
  steps.forEach(function(s, i) {
    setTimeout(function() {
      // 이전 단계 완료 표시
      if (i > 0) {
        var prev = document.getElementById('step' + (i-1));
        var prevIcon = document.getElementById('stepIcon' + (i-1));
        if (prev) { prev.classList.remove('opacity-40'); prev.style.opacity = '0.7'; }
        if (prevIcon) { prevIcon.className = 'fas fa-check text-[9px] text-emerald-400'; }
      }
      // 현재 단계 활성화
      var cur = document.getElementById('step' + i);
      var curIcon = document.getElementById('stepIcon' + i);
      if (cur) { cur.classList.remove('opacity-40'); cur.style.opacity = '1'; }
      if (curIcon) { curIcon.className = 'fas fa-circle-notch fa-spin text-[9px] text-brand-400'; }
      // 프로그레스 바
      var bar = document.getElementById('progressBar');
      var pctEl = document.getElementById('progressPct');
      if (bar) bar.style.width = pcts[i] + '%';
      if (pctEl) pctEl.textContent = pcts[i] + '%';
    }, s.delay);
  });
}
