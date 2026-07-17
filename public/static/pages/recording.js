// =========================================
// RECORDING v8.0 — Segmented Reliable Recording
// - 60초 단위 세그먼트 업로드 (탭 사망 시에도 최대 60초만 손실)
// - 비동기 분석 + 진행률 폴링
// - 녹음 전 "오늘의 미션 카드" (직전 개선과제 리마인드)
// =========================================

var SEGMENT_MS = 60000; // 60초 세그먼트

var mediaStream = null;
var mediaRecorder = null;
var segmentChunks = [];
var segmentIndex = 0;
var uploadQueue = Promise.resolve();
var uploadedCount = 0;
var failedUploads = 0;
var rotateTimer = null;

var isRecording = false;
var isPaused = false;
var startTime = null;
var pausedTotal = 0;
var pauseStart = null;
var timerInterval = null;
var consultationId = null;
var audioContext = null;
var analyser = null;
var animationFrame = null;
var finalizing = false;
var stopResolver = null; // 마지막 onstop 대기용 resolver

// patientId: URL 경로 /recording/:patientId 에서 추출 (정적 JS — 서버 주입 없음)
var selectedPatientId = (function () {
  var m = location.pathname.match(/^\/recording\/([^\/]+)/);
  return m ? decodeURIComponent(m[1]) : null;
})();

// ===== 환자 정보 로드 =====
if (selectedPatientId) {
  fetch('/api/patients/' + selectedPatientId).then(function(r){ return r.json(); }).then(function (data) {
    if (data.success) {
      document.getElementById('patientName').textContent = data.data.name;
      var sub = document.querySelector('#patientInfo p:last-child');
      if (sub) sub.textContent = (data.data.age ? data.data.age + '세' : '') + (data.data.gender ? (data.data.gender === 'male' ? ' 남' : ' 여') : '');
    }
  }).catch(function () {});
}

// ===== v8.2 녹음 전 브리핑: 코치 미션 + 환자 컨텍스트 =====
(function loadBriefing() {
  var url = '/api/dashboard/pre-consultation-briefing' + (selectedPatientId ? '?patient_id=' + encodeURIComponent(selectedPatientId) : '');
  fetch(url).then(function(r){ return r.ok ? r.json() : null; }).then(function (res) {
    if (!res || !res.success) return;
    var host = document.getElementById('patientInfo');
    if (!host) return;
    var d = res.data || {};
    var insertAfter = host;

    // --- 환자 브리핑 카드 (재상담 환자: 지난 상담 장벽/미해소 우려) ---
    var pb = d.patient_briefing;
    if (pb && (pb.main_concern || (pb.unresolved_concerns && pb.unresolved_concerns.length) || pb.decision_maker)) {
      var pbCard = document.createElement('div');
      pbCard.id = 'patientBriefingCard';
      pbCard.className = 'glass-dark rounded-2xl p-4 mt-3 border border-sky-500/30';
      var rows = '';
      if (pb.main_concern) {
        rows += '<div class="flex items-start gap-1.5 mt-1"><i class="fas fa-triangle-exclamation text-rose-400 text-[9px] mt-0.5 shrink-0"></i><p class="text-[11px] text-white/85"><span class="text-rose-300 font-semibold">핵심 장벽</span> · ' + escapeHtmlSafe(pb.main_concern) + '</p></div>';
      }
      if (pb.unresolved_concerns && pb.unresolved_concerns.length > 0) {
        rows += '<div class="flex items-start gap-1.5 mt-1"><i class="fas fa-circle-question text-amber-400 text-[9px] mt-0.5 shrink-0"></i><p class="text-[11px] text-white/85"><span class="text-amber-300 font-semibold">미해소 우려</span> · ' + escapeHtmlSafe(pb.unresolved_concerns.join(' / ')) + '</p></div>';
      }
      if (pb.decision_maker) {
        rows += '<div class="flex items-start gap-1.5 mt-1"><i class="fas fa-user-check text-brand-400 text-[9px] mt-0.5 shrink-0"></i><p class="text-[11px] text-white/85"><span class="text-brand-300 font-semibold">결정권자</span> · ' + escapeHtmlSafe(pb.decision_maker) + '</p></div>';
      }
      var meta = [];
      if (pb.treatment_type) meta.push(escapeHtmlSafe(pb.treatment_type));
      if (pb.amount) meta.push(Math.round(pb.amount / 10000) + '만원');
      if (pb.days_since_last != null) meta.push(pb.days_since_last === 0 ? '오늘' : pb.days_since_last + '일 전 상담');
      if (pb.decision_score) meta.push('결정도 ' + pb.decision_score + '/10');
      pbCard.innerHTML =
        '<div class="flex items-start gap-3">' +
          '<div class="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0">' +
            '<i class="fas fa-clipboard-user text-sky-400 text-sm"></i>' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-[10px] font-bold text-sky-400 tracking-wider">재상담 브리핑 · 지난 상담에서 확인된 것</p>' +
            (meta.length ? '<p class="text-[10px] text-surface-400 mt-0.5">' + meta.join(' · ') + '</p>' : '') +
            rows +
            '<p class="text-[10px] text-surface-500 mt-1.5">💡 이 장벽을 먼저 풀어야 결정이 나옵니다</p>' +
          '</div>' +
        '</div>';
      insertAfter.parentNode.insertBefore(pbCard, insertAfter.nextSibling);
      insertAfter = pbCard;
    }

    // --- 코치 미션 카드 (직전 개선과제 + 최약 영역 실천 팁) ---
    var cm = d.coach_mission;
    if (cm && (cm.latest_improvement || cm.weakest_area)) {
      var card = document.createElement('div');
      card.id = 'missionCard';
      card.className = 'glass-dark rounded-2xl p-4 mt-3 border border-amber-500/30';
      var body = '';
      if (cm.latest_improvement && cm.latest_improvement !== '없음') {
        body += '<p class="text-xs text-white/90 leading-relaxed">' + escapeHtmlSafe(cm.latest_improvement) + '</p>';
      }
      if (cm.recurring_issues && cm.recurring_issues.length > 0) {
        body += '<div class="flex items-start gap-1.5 mt-1.5"><i class="fas fa-rotate-right text-rose-400 text-[9px] mt-0.5 shrink-0"></i><p class="text-[10px] text-rose-300/90"><span class="font-semibold">반복 지적</span> · ' + escapeHtmlSafe(cm.recurring_issues[0]) + '</p></div>';
      }
      if (cm.weakest_area && cm.weakest_area.tip) {
        body += '<div class="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">' +
          '<p class="text-[10px] font-bold text-amber-300">🎯 최약 영역: ' + escapeHtmlSafe(cm.weakest_area.label) + ' (' + cm.weakest_area.avg_score + '/' + cm.weakest_area.max_score + '점)</p>' +
          '<p class="text-[10px] text-white/80 mt-0.5 leading-relaxed">' + escapeHtmlSafe(cm.weakest_area.tip) + '</p>' +
        '</div>';
      }
      card.innerHTML =
        '<div class="flex items-start gap-3">' +
          '<div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">' +
            '<i class="fas fa-bullseye text-amber-400 text-sm"></i>' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<p class="text-[10px] font-bold text-amber-400 tracking-wider mb-0.5">오늘의 미션 · 최근 ' + (cm.sessions_analyzed || 0) + '회 분석 기반</p>' +
            body +
            '<p class="text-[10px] text-surface-500 mt-1.5">이번 상담에서 이거 하나만 의식해보세요 💪</p>' +
          '</div>' +
        '</div>';
      insertAfter.parentNode.insertBefore(card, insertAfter.nextSibling);
    }
  }).catch(function () {});
})();

function escapeHtmlSafe(s) {
  var d = document.createElement('div');
  d.textContent = String(s == null ? '' : s);
  return d.innerHTML;
}

// ===== 타이머 =====
function elapsedMs() {
  if (!startTime) return 0;
  var pausedNow = isPaused && pauseStart ? (Date.now() - pauseStart) : 0;
  return Date.now() - startTime - pausedTotal - pausedNow;
}

function updateTimer() {
  var elapsed = Math.floor(elapsedMs() / 1000);
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  document.getElementById('timer').textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ===== 파형 =====
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
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

// ===== 세그먼트 녹음 엔진 =====
// 브라우저별 지원 mimeType 자동 감지 (Chrome/Android=webm, iOS Safari=mp4)
var recorderMimeType = (function () {
  var candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    for (var i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
    }
  }
  return ''; // 브라우저 기본값에 위임
})();
var recorderFileExt = recorderMimeType.indexOf('mp4') >= 0 ? 'mp4' : (recorderMimeType.indexOf('ogg') >= 0 ? 'ogg' : 'webm');

function startSegmentRecorder() {
  // v9.1.1: 세그먼트별 chunks를 클로저로 격리 — 이전 버전은 전역 배열을 공유해
  // 로테이션 시 새 레코더가 배열을 초기화, 이전 레코더의 onstop이 헤더 없는
  // 조각만 담긴 깨진 webm을 업로드하는 레이스가 있었음 (STT 인식 불가 원인)
  var chunks = [];
  var rec = recorderMimeType
    ? new MediaRecorder(mediaStream, { mimeType: recorderMimeType })
    : new MediaRecorder(mediaStream);
  rec.ondataavailable = function (e) {
    if (e.data.size > 0) chunks.push(e.data);
  };
  rec.onstop = function () {
    if (chunks.length > 0) {
      var blob = new Blob(chunks, { type: recorderMimeType || 'audio/webm' });
      chunks = [];
      var idx = segmentIndex++;
      enqueueSegmentUpload(blob, idx);
    }
    // 마지막 세그먼트 flush 대기자 (saveRecording)에게 알림
    if (stopResolver) { var r = stopResolver; stopResolver = null; r(); }
  };
  rec.start(1000);
  mediaRecorder = rec;
}

// 60초마다 recorder 재시작 → 각 세그먼트가 독립 재생/STT 가능한 webm이 됨
function rotateSegment() {
  if (!isRecording || isPaused || !mediaRecorder || mediaRecorder.state === 'inactive') return;
  mediaRecorder.stop(); // onstop에서 업로드 큐 등록
  startSegmentRecorder();
}

function enqueueSegmentUpload(blob, idx) {
  uploadQueue = uploadQueue.then(function () {
    return uploadSegmentWithRetry(blob, idx, 3);
  });
}

function uploadSegmentWithRetry(blob, idx, retries) {
  var fd = new FormData();
  fd.append('audio', blob, 'segment-' + idx + '.' + recorderFileExt);
  fd.append('index', String(idx));
  return fetch('/api/consultations/' + consultationId + '/segments', { method: 'POST', body: fd })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) throw new Error(data.error || 'upload failed');
      uploadedCount++;
      updateUploadBadge();
    })
    .catch(function (err) {
      if (retries > 0) {
        return new Promise(function (resolve) { setTimeout(resolve, 2000); })
          .then(function () { return uploadSegmentWithRetry(blob, idx, retries - 1); });
      }
      failedUploads++;
      updateUploadBadge();
      console.error('Segment upload permanently failed:', idx, err);
    });
}

function updateUploadBadge() {
  var el = document.getElementById('timerSub');
  if (!el || !isRecording) return;
  var txt = '세그먼트 ' + uploadedCount + '개 안전 저장됨';
  if (failedUploads > 0) txt += ' · ' + failedUploads + '개 실패(마무리 시 재시도)';
  el.textContent = txt;
}

// ===== v8.6: 녹음 동의 게이트 =====
var consentConfirmed = false;
var consentNoticeText = '상담 품질 향상을 위해 상담 내용이 녹음됩니다. 녹음에 동의하십니까?';

// 조직 동의 문구 로드
fetch('/api/privacy/policy').then(function(r){ return r.json(); }).then(function(d) {
  if (d.success && d.data.consent_notice_text) consentNoticeText = d.data.consent_notice_text;
}).catch(function(){});

function showConsentSheet() {
  var existing = document.getElementById('consentSheet');
  if (existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'consentSheet';
  el.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:flex-end;justify-content:center;';
  el.innerHTML =
    '<div style="position:absolute;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(3px);" onclick="closeConsentSheet()"></div>' +
    '<div style="position:relative;width:100%;max-width:480px;background:white;border-radius:24px 24px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));">' +
      '<div style="width:44px;height:44px;border-radius:14px;background:#eef2ff;display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><i class="fas fa-shield-halved" style="color:#6366f1;font-size:18px;"></i></div>' +
      '<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 8px;">녹음 동의 확인</h3>' +
      '<p style="font-size:13px;color:#475569;line-height:1.7;margin:0 0 14px;">환자분께 아래 내용을 안내하고 <b>구두 동의</b>를 받아주세요:</p>' +
      '<div style="padding:14px;background:#f8fafc;border-radius:14px;border-left:3px solid #6366f1;margin-bottom:18px;">' +
        '<p style="font-size:13px;color:#334155;line-height:1.7;margin:0;font-weight:600;">"' + escapeHtml(consentNoticeText) + '"</p>' +
      '</div>' +
      '<label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:18px;cursor:pointer;">' +
        '<input type="checkbox" id="consentCheck" style="width:18px;height:18px;margin-top:1px;accent-color:#6366f1;">' +
        '<span style="font-size:12px;color:#64748b;line-height:1.6;">환자에게 녹음 사실을 고지하고 구두 동의를 받았음을 확인합니다. 동의 기록은 상담 기록과 함께 보관됩니다.</span>' +
      '</label>' +
      '<div style="display:flex;gap:10px;">' +
        '<button onclick="closeConsentSheet()" style="flex:1;padding:14px;border-radius:14px;border:1px solid #e2e8f0;background:white;font-size:14px;font-weight:700;color:#64748b;cursor:pointer;">취소</button>' +
        '<button onclick="confirmConsent()" style="flex:2;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);font-size:14px;font-weight:700;color:white;cursor:pointer;">동의 확인 · 녹음 시작</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);
}

function closeConsentSheet() {
  var el = document.getElementById('consentSheet');
  if (el) el.remove();
}

var pendingConsentAction = null; // 동의 완료 후 실행할 액션 (기본: 녹음 시작)

function confirmConsent() {
  var cb = document.getElementById('consentCheck');
  if (!cb || !cb.checked) {
    showToast('동의 확인 체크박스를 선택해주세요', 'warning');
    return;
  }
  consentConfirmed = true;
  closeConsentSheet();
  if (pendingConsentAction) {
    var act = pendingConsentAction;
    pendingConsentAction = null;
    act();
  } else {
    toggleRecording(); // 동의 완료 → 녹음 시작 재진입
  }
}

// ===== v9.1.1: 이미 녹음된 파일 업로드 =====
var MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // OpenAI STT 한도 25MB

function pickAudioFile() {
  if (isRecording || finalizing) { showToast('녹음 중에는 파일을 업로드할 수 없습니다', 'warning'); return; }
  var input = document.getElementById('audioFileInput');
  if (!input) return;
  input.onchange = function () {
    var file = input.files && input.files[0];
    input.value = ''; // 같은 파일 재선택 허용
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast('파일이 25MB를 초과합니다. 더 짧게 나누어 업로드해주세요.', 'error');
      return;
    }
    if (file.size < 1024) {
      showToast('파일이 너무 작습니다. 정상 녹음 파일인지 확인해주세요.', 'error');
      return;
    }
    var proceed = function () { uploadPickedFile(file); };
    if (!consentConfirmed) { pendingConsentAction = proceed; showConsentSheet(); return; }
    proceed();
  };
  input.click();
}

function readAudioDurationMin(file) {
  // 브라우저 디코더로 길이(분) 추정 — 실패하면 null (서버는 null 허용)
  return new Promise(function (resolve) {
    try {
      var url = URL.createObjectURL(file);
      var a = new Audio();
      var done = false;
      var finish = function (v) { if (done) return; done = true; URL.revokeObjectURL(url); resolve(v); };
      a.onloadedmetadata = function () {
        var d = a.duration;
        finish(isFinite(d) && d > 0 ? Math.max(1, Math.round(d / 60)) : null);
      };
      a.onerror = function () { finish(null); };
      setTimeout(function () { finish(null); }, 5000);
      a.src = url;
    } catch (e) { resolve(null); }
  });
}

async function uploadPickedFile(file) {
  finalizing = true;
  var btn = document.getElementById('uploadFileBtn');
  if (btn) { btn.classList.add('opacity-50', 'pointer-events-none'); }
  document.getElementById('statusText').textContent = '파일 업로드 중...';
  document.getElementById('statusText').className = 'text-xs text-brand-400 font-semibold animate-pulse-soft';
  document.getElementById('timerSub').textContent = escapeHtmlSafe(file.name) + ' 업로드 중...';

  try {
    // 1. 상담 레코드 생성
    var createRes = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient_id: selectedPatientId, recording_consent: consentConfirmed })
    });
    var createData = await createRes.json();
    if (!createData.success) throw new Error(createData.error || '상담 기록 생성 실패');
    consultationId = createData.data.id;

    // 2. 길이 추정 + 업로드 → 서버가 바로 분석 시작 (processing)
    var durationMin = await readAudioDurationMin(file);
    var fd = new FormData();
    fd.append('audio', file, file.name || 'upload.webm');
    if (durationMin) fd.append('duration', String(durationMin));
    var upRes = await fetch('/api/consultations/' + consultationId + '/upload-audio', { method: 'POST', body: fd });
    var upData = await upRes.json();
    if (!upData.success) throw new Error(upData.error || '업로드 실패');

    // 3. 분석 폴링 (녹음 플로우와 동일 UI)
    consentConfirmed = false;
    document.getElementById('recordBtn').classList.add('opacity-50', 'pointer-events-none');
    document.getElementById('timerSub').textContent = 'AI가 상담을 분석하고 있습니다... (이 화면을 벗어나도 분석은 계속됩니다)';
    showAnalysisProgress();
    pollAnalysis();
  } catch (err) {
    finalizing = false;
    if (btn) { btn.classList.remove('opacity-50', 'pointer-events-none'); }
    document.getElementById('statusText').textContent = '업로드 실패';
    document.getElementById('statusText').className = 'text-xs text-rose-400 font-semibold';
    showToast(err.message || '파일 업로드에 실패했습니다', 'error');
  }
}

// ===== 녹음 시작/일시정지/재개 =====
async function toggleRecording() {
  if (!isRecording) {
    // v8.6: 녹음 시작 전 동의 게이트
    if (!consentConfirmed) {
      showConsentSheet();
      return;
    }
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext();
      var source = audioContext.createMediaStreamSource(mediaStream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      // 상담 레코드 먼저 생성 (세그먼트 업로드에 ID 필요)
      var createRes = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: selectedPatientId, recording_consent: consentConfirmed })
      });
      var createData = await createRes.json();
      if (!createData.success) {
        showToast('상담 기록 생성에 실패했습니다.', 'error');
        return;
      }
      consultationId = createData.data.id;

      segmentIndex = 0; uploadedCount = 0; failedUploads = 0;
      startSegmentRecorder();
      rotateTimer = setInterval(rotateSegment, SEGMENT_MS);

      isRecording = true;
      startTime = Date.now();
      pausedTotal = 0;
      timerInterval = setInterval(updateTimer, 1000);

      // UI
      document.getElementById('idleWave').classList.add('hidden');
      document.getElementById('waveCanvas').classList.remove('hidden');
      document.getElementById('statusText').textContent = '녹음 중...';
      document.getElementById('statusText').className = 'text-xs text-rose-400 font-semibold';
      document.getElementById('timerSub').textContent = '상담을 진행하세요 · 60초마다 자동 저장';
      document.getElementById('recordIcon').className = 'fas fa-pause text-2xl text-white relative z-10';
      document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40 animate-pulse-soft';
      document.getElementById('saveBtn').classList.remove('opacity-50', 'pointer-events-none');
      document.getElementById('saveBtn').classList.add('bg-emerald-500/20', 'text-emerald-400');
      var mission = document.getElementById('missionCard');
      if (mission) mission.style.opacity = '0.6';
      var pbCard = document.getElementById('patientBriefingCard');
      if (pbCard) pbCard.style.opacity = '0.6';

      drawWaveform();
    } catch (err) {
      console.error(err);
      showToast('마이크 접근이 거부되었습니다.', 'error');
    }
  } else if (!isPaused) {
    mediaRecorder.pause();
    isPaused = true;
    pauseStart = Date.now();
    document.getElementById('recordIcon').className = 'fas fa-microphone text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-xl shadow-brand-600/40';
    document.getElementById('statusText').textContent = '일시정지';
  } else {
    mediaRecorder.resume();
    isPaused = false;
    if (pauseStart) { pausedTotal += Date.now() - pauseStart; pauseStart = null; }
    document.getElementById('recordIcon').className = 'fas fa-pause text-2xl text-white relative z-10';
    document.getElementById('recordBtnBg').className = 'absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40 animate-pulse-soft';
    document.getElementById('statusText').textContent = '녹음 중...';
    drawWaveform();
  }
}

function cancelRecording() {
  if (isRecording && !confirm('녹음을 취소하시겠습니까? (이미 저장된 세그먼트는 유지됩니다)')) return;
  cleanup();
  window.location.href = selectedPatientId ? '/patients/' + selectedPatientId : '/consultations';
}

// ===== 저장 → finalize → 폴링 =====
async function saveRecording() {
  if (!isRecording || finalizing) return;
  finalizing = true;

  var durationMs = elapsedMs();

  // 마지막 세그먼트 마감 — onstop이 실제로 호출될 때까지 결정적으로 대기
  clearInterval(rotateTimer);
  var finalStopPromise = Promise.resolve();
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    finalStopPromise = new Promise(function (resolve) {
      stopResolver = resolve;
      setTimeout(resolve, 3000); // onstop 미발화 대비 안전망
    });
    mediaRecorder.stop();
  }
  isRecording = false;
  consentConfirmed = false; // 다음 녹음 시 동의 재확인
  clearInterval(timerInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);

  document.getElementById('statusText').textContent = '업로드 마무리 중...';
  document.getElementById('statusText').className = 'text-xs text-brand-400 font-semibold animate-pulse-soft';
  document.getElementById('recordBtn').classList.add('opacity-50', 'pointer-events-none');
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-circle-notch fa-spin text-xl text-brand-400"></i>';
  document.getElementById('timerSub').textContent = '남은 세그먼트를 안전하게 저장하고 있습니다...';

  showQualityIndicator(durationMs);

  // 마지막 onstop 대기 → 업로드 큐 완료 대기
  await finalStopPromise;
  await uploadQueue;

  // 마이크 해제
  releaseMedia();

  try {
    var res = await fetch('/api/consultations/' + consultationId + '/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration: Math.max(1, Math.floor(durationMs / 60000)) })
    });
    var data = await res.json();
    if (!data.success) {
      document.getElementById('statusText').textContent = data.error || '마무리 실패';
      setTimeout(function () { window.location.href = '/consultations/' + consultationId; }, 2000);
      return;
    }
    // 비동기 분석 시작됨 → 폴링
    document.getElementById('timerSub').textContent = 'AI가 상담을 분석하고 있습니다... (이 화면을 벗어나도 분석은 계속됩니다)';
    showAnalysisProgress();
    pollAnalysis();
  } catch (err) {
    window.location.href = '/consultations/' + consultationId;
  }
}

function releaseMedia() {
  try { if (mediaStream) mediaStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
  try { if (audioContext) audioContext.close(); } catch (e) {}
}

// ===== 분석 진행률 폴링 =====
var pollCount = 0;
function pollAnalysis() {
  pollCount++;
  if (pollCount > 150) { // 최대 ~7.5분
    document.getElementById('statusText').textContent = '분석이 오래 걸리고 있어요';
    document.getElementById('timerSub').innerHTML = '상담 상세에서 진행 상태를 확인할 수 있습니다. <a href="/consultations/' + consultationId + '" class="text-brand-400 underline">이동하기</a>';
    return;
  }
  fetch('/api/consultations/' + consultationId + '/analysis-status')
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (!res.success) throw new Error(res.error);
      var d = res.data;
      updateProgressUI(d.progress, d.step_label);

      if (d.status === 'completed') {
        onAnalysisComplete(d);
      } else if (d.status === 'failed') {
        document.getElementById('statusText').textContent = '분석 실패';
        document.getElementById('statusText').className = 'text-xs text-rose-400 font-semibold';
        document.getElementById('timerSub').innerHTML =
          escapeHtmlSafe(d.error || '알 수 없는 오류') +
          ' · <a href="/consultations/' + consultationId + '" class="text-brand-400 underline">상담 상세에서 재분석</a>';
      } else {
        setTimeout(pollAnalysis, 3000);
      }
    })
    .catch(function () { setTimeout(pollAnalysis, 5000); });
}

async function onAnalysisComplete(d) {
  var bar = document.getElementById('progressBar');
  var pctEl = document.getElementById('progressPct');
  if (bar) bar.style.width = '100%';
  if (pctEl) { pctEl.textContent = '100%'; pctEl.className = 'ml-auto text-sm font-black text-emerald-400'; }
  document.getElementById('statusText').textContent = '분석 완료!';
  document.getElementById('statusText').className = 'text-xs text-emerald-400 font-semibold';
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-check text-xl text-emerald-400"></i>';

  // 레벨업 / PB 축하
  var celebrationDelay = 800;
  try {
    var newScore = d.coaching_score || 0;
    if (typeof getLevel === 'function' && newScore > 0) {
      var growthRes = await fetch('/api/dashboard/growth-sessions?limit=20');
      var growthData = await growthRes.json();
      if (growthData.success && growthData.data.sessions.length > 1) {
        var sessions = growthData.data.sessions;
        var prevSession = sessions[sessions.length - 2];
        var prevScore = prevSession ? prevSession.total_score : 0;
        var lvUp = checkLevelUp(prevScore, newScore);
        if (lvUp && lvUp.isLevelUp) {
          showLevelUpCelebration(lvUp.from, lvUp.to, newScore);
          celebrationDelay = 5000;
        } else if (growthData.data.stats.personal_best === newScore && sessions.length >= 3) {
          showPersonalBestCelebration(newScore);
          celebrationDelay = 4000;
        } else {
          var curLv = getLevel(newScore);
          showScoreResult(curLv, newScore, prevScore);
          celebrationDelay = 3000;
        }
      } else if (newScore > 0) {
        var firstLv = getLevel(newScore);
        showFirstSessionCelebration(firstLv, newScore);
        celebrationDelay = 4000;
      }
    }
  } catch (lvErr) { console.warn('Level check error:', lvErr); }

  setTimeout(function () {
    window.location.href = '/consultations/' + consultationId + '/report';
  }, celebrationDelay);
}

function cleanup() {
  clearInterval(rotateTimer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') { try { mediaRecorder.stop(); } catch (e) {} }
  if (timerInterval) clearInterval(timerInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  releaseMedia();
  isRecording = false;
}

// 페이지 이탈 경고 (녹음 중일 때만)
window.addEventListener('beforeunload', function (e) {
  if (isRecording) { e.preventDefault(); e.returnValue = ''; }
});

// ===== 녹음 품질 표시 =====
function showQualityIndicator(durationMs) {
  var secs = Math.floor(durationMs / 1000);
  var mins = Math.floor(secs / 60);
  var quality = mins >= 5 ? { label: '최적', color: 'emerald', icon: 'fa-check-circle', desc: '충분한 녹음 시간 · 정밀 분석 가능' }
    : mins >= 2 ? { label: '양호', color: 'brand', icon: 'fa-thumbs-up', desc: '기본 분석 가능 · 더 길면 더 정확' }
    : mins >= 1 ? { label: '보통', color: 'amber', icon: 'fa-clock', desc: '간략 분석만 가능 · 2분 이상 권장' }
    : { label: '짧음', color: 'rose', icon: 'fa-triangle-exclamation', desc: '분석 정확도가 낮을 수 있어요' };

  var qualityEl = document.getElementById('qualityIndicator');
  if (qualityEl) {
    qualityEl.classList.remove('hidden');
    qualityEl.innerHTML =
      '<div class="glass-dark rounded-2xl p-3 flex items-center gap-3">' +
        '<div class="w-9 h-9 rounded-xl bg-' + quality.color + '-500/20 flex items-center justify-center shrink-0">' +
          '<i class="fas ' + quality.icon + ' text-' + quality.color + '-400 text-sm"></i>' +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-1.5">' +
            '<span class="text-xs font-bold text-' + quality.color + '-400">녹음 품질: ' + quality.label + '</span>' +
            '<span class="text-[10px] text-surface-500">' + mins + '분 ' + (secs % 60) + '초</span>' +
          '</div>' +
          '<p class="text-[10px] text-surface-400 mt-0.5">' + quality.desc + '</p>' +
        '</div>' +
      '</div>';
  }
}

// ===== 분석 진행률 UI (실제 서버 상태 기반) =====
function showAnalysisProgress() {
  var container = document.getElementById('analysisSteps');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML =
    '<div class="glass-dark rounded-2xl p-4 border border-brand-500/20">' +
      '<div class="flex items-center gap-2 mb-3">' +
        '<div class="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center"><i class="fas fa-robot text-brand-400 text-xs animate-pulse"></i></div>' +
        '<div><span class="text-xs font-bold text-white">AI 분석 파이프라인</span>' +
        '<p class="text-[9px] text-surface-500">Patient Funnel AI · 실시간 진행 상태</p></div>' +
        '<span id="progressPct" class="ml-auto text-sm font-black text-brand-400">5%</span>' +
      '</div>' +
      '<div class="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">' +
        '<div id="progressBar" class="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-1000" style="width:5%"></div>' +
      '</div>' +
      '<p id="progressLabel" class="text-[11px] text-surface-400">분석 준비 중...</p>' +
    '</div>';
}

function updateProgressUI(pct, label) {
  var bar = document.getElementById('progressBar');
  var pctEl = document.getElementById('progressPct');
  var labelEl = document.getElementById('progressLabel');
  if (bar) bar.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (labelEl) labelEl.textContent = label || '';
}

// ===== 점수/레벨 축하 =====
function showScoreResult(lv, score, prevScore) {
  var delta = score - prevScore;
  var deltaStr = delta > 0 ? '+' + delta : String(delta);
  var deltaColor = delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : '#94a3b8';
  var toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9998;text-align:center;animation:bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)';
  toast.innerHTML =
    '<div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 min-w-[240px]">' +
      '<span style="font-size:48px">' + lv.emoji + '</span>' +
      '<p class="text-surface-900 text-xl font-black mt-2">' + score + '<span class="text-sm text-surface-400">점</span></p>' +
      '<p class="text-sm font-bold mt-1" style="color:' + deltaColor + '">' + deltaStr + '점</p>' +
      '<p class="text-[11px] text-surface-500 mt-1">Lv.' + lv.level + ' ' + lv.title + '</p>' +
    '</div>';
  document.body.appendChild(toast);
  setTimeout(function () { toast.style.animation = 'fadeOut 0.3s forwards'; setTimeout(function () { toast.remove(); }, 300); }, 2500);
}

function showFirstSessionCelebration(lv, score) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);animation:fadeIn 0.3s ease-out';
  overlay.innerHTML =
    '<div style="animation:bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" class="text-center px-8 py-8 max-w-xs">' +
      '<div style="font-size:56px;animation:pulse 1s ease-in-out infinite" class="mb-2">🎊</div>' +
      '<p class="text-white text-xs tracking-widest font-bold mb-2">WELCOME TO</p>' +
      '<p class="text-4xl mb-1">' + lv.emoji + '</p>' +
      '<p class="text-white text-lg font-black mb-1">Lv.' + lv.level + ' ' + lv.title + '</p>' +
      '<p class="text-white/80 text-sm mb-4">첫 번째 상담 분석 완료!</p>' +
      '<div class="bg-white/10 rounded-xl p-3 mb-4"><p class="text-white text-2xl font-black">' + score + '<span class="text-sm text-white/60">점</span></p></div>' +
      '<p class="text-white/60 text-[11px] mb-4">상담을 더 분석할수록 레벨이 올라갑니다 💪</p>' +
      '<button onclick="this.closest(\'div[style]\').remove()" class="px-6 py-2.5 bg-gradient-to-r ' + lv.gradient + ' text-white rounded-2xl font-bold text-sm shadow-lg">시작이 반! 🚀</button>' +
    '</div>';
  document.body.appendChild(overlay);
  setTimeout(function () { if (overlay.parentNode) overlay.remove(); }, 6000);
}
