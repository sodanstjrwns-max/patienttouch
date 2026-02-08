import { FC } from 'hono/jsx'
import { Header } from '../shared/Layout'

interface RecordingPageProps {
  patientId?: string
}

export const RecordingPage: FC<RecordingPageProps> = ({ patientId }) => {
  return (
    <div class="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background effects */}
      <div class="absolute inset-0">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-3xl" />
        <div class="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-surface-950/50 to-transparent" />
      </div>

      <div class="relative z-10">
        {/* Header */}
        <header class="flex items-center justify-between px-4 py-3 safe-area-top">
          <a href={patientId ? `/patients/${patientId}` : '/consultations'} class="w-10 h-10 glass-dark rounded-xl flex items-center justify-center text-surface-400 hover:text-white transition-colors">
            <i class="fas fa-chevron-left text-sm"></i>
          </a>
          <div class="text-center">
            <h1 class="text-sm font-bold text-white">상담 녹음</h1>
            <p class="text-xs text-surface-500" id="statusText">준비 중</p>
          </div>
          <div class="w-10" />
        </header>

        {/* Patient Selection */}
        <div class="px-5 mt-4">
          <div id="patientInfo" class="glass-dark rounded-2xl p-4 flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-brand-500/20 flex items-center justify-center">
              <i class="fas fa-user text-brand-400"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p id="patientName" class="text-sm font-bold text-white truncate">빠른 녹음 모드</p>
              <p class="text-xs text-surface-400">환자 미선택 &bull; 나중에 연결 가능</p>
            </div>
            <button id="selectPatientBtn" class="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-surface-300 hover:bg-white/15 transition-colors">
              <i class="fas fa-search mr-1"></i>선택
            </button>
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div class="px-5 mt-10 mb-6">
          <div class="flex items-center justify-center h-40" id="waveformContainer">
            {/* Idle state */}
            <div id="idleWave" class="flex items-center gap-1 h-20">
              {Array.from({ length: 32 }).map((_, i) => (
                <div class="waveform-bar bg-surface-600 opacity-30" style={`height: ${8 + Math.sin(i * 0.4) * 6}px; animation-delay: ${i * 0.05}s`} />
              ))}
            </div>
            {/* Active waveform (hidden initially) */}
            <canvas id="waveCanvas" class="hidden w-full h-40" width="400" height="160"></canvas>
          </div>
        </div>

        {/* Timer */}
        <div class="text-center mb-8">
          <div id="timer" class="text-5xl font-black text-white tracking-tighter font-mono">00:00</div>
          <div id="timerSub" class="text-xs text-surface-500 mt-2">녹음 버튼을 눌러 시작하세요</div>
        </div>

        {/* Real-time hints */}
        <div id="hintContainer" class="px-5 mb-6 hidden">
          <div class="glass-dark rounded-2xl p-4 border-l-4 border-l-brand-500">
            <div class="flex items-center gap-2 mb-1">
              <i class="fas fa-lightbulb text-brand-400 text-sm"></i>
              <span class="text-xs font-bold text-brand-400">AI 힌트</span>
            </div>
            <p id="hintText" class="text-sm text-surface-300"></p>
          </div>
        </div>

        {/* Real-time transcript */}
        <div id="transcriptContainer" class="px-5 mb-8 hidden">
          <div class="glass-dark rounded-2xl p-4 max-h-32 overflow-y-auto">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft"></div>
              <span class="text-xs font-bold text-surface-400">실시간 자막</span>
            </div>
            <p id="transcriptText" class="text-sm text-surface-300 leading-relaxed"></p>
          </div>
        </div>

        {/* Controls */}
        <div class="fixed bottom-0 left-0 right-0 pb-10 pt-6 safe-area-bottom" style="background: linear-gradient(to top, rgba(15,23,42,0.95) 60%, transparent)">
          <div class="flex items-center justify-center gap-8 max-w-lg mx-auto">
            {/* Cancel / Stop */}
            <button id="cancelBtn" class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-surface-400 hover:bg-white/15 transition-all active:scale-95" onclick="cancelRecording()">
              <i class="fas fa-xmark text-xl"></i>
            </button>

            {/* Record / Pause */}
            <button id="recordBtn" class="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 relative" onclick="toggleRecording()">
              <div id="recordBtnBg" class="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-xl shadow-rose-600/40"></div>
              <div id="recordBtnRing" class="absolute inset-0 rounded-full border-4 border-rose-400/30"></div>
              <i id="recordIcon" class="fas fa-microphone text-2xl text-white relative z-10"></i>
            </button>

            {/* Save */}
            <button id="saveBtn" class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-surface-400 hover:bg-white/15 transition-all active:scale-95 opacity-50 pointer-events-none" onclick="saveRecording()">
              <i class="fas fa-check text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
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
                alert('마이크 접근이 거부되었습니다. 설정에서 권한을 허용해주세요.');
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
            document.getElementById('timerSub').textContent = 'AI가 상담을 분석하고 있습니다...';
            
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
                document.getElementById('statusText').textContent = '분석 완료!';
                document.getElementById('statusText').className = 'text-xs text-emerald-400 font-semibold';
                document.getElementById('saveBtn').innerHTML = '<i class="fas fa-check text-xl text-emerald-400"></i>';
                setTimeout(function() {
                  window.location.href = '/consultations/' + consultationId + '/report';
                }, 1000);
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
        `
      }} />
    </div>
  )
}
