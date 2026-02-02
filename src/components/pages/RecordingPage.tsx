import { FC } from 'hono/jsx'
import { Header } from '../shared/Layout'

interface Props {
  patientId?: string
}

export const RecordingPage: FC<Props> = ({ patientId }) => {
  return (
    <div class="min-h-screen bg-gray-900">
      <Header title="상담 녹음" showBack backUrl="/" rightAction={
        <a href="/settings" class="text-gray-300">
          <i class="fas fa-cog"></i>
        </a>
      } />

      <div class="px-4 py-6">
        {/* Recording Mode Selection */}
        <div class="mb-6">
          <div class="flex gap-2 mb-4">
            <button id="modePatient" class="flex-1 py-3 px-4 rounded-xl font-medium transition bg-primary-600 text-white">
              <i class="fas fa-user mr-2"></i>환자 지정
            </button>
            <button id="modeQuick" class="flex-1 py-3 px-4 rounded-xl font-medium transition bg-gray-700 text-gray-300 hover:bg-gray-600">
              <i class="fas fa-bolt mr-2"></i>빠른 녹음
            </button>
          </div>
          
          {/* Patient Selection (shown when patient mode selected) */}
          <div id="patientSelectArea">
            <label class="block text-gray-400 text-sm mb-2">환자 선택</label>
            <div class="relative">
              <select id="patientSelect" class="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-primary-500 outline-none appearance-none">
                <option value="">환자를 선택하세요</option>
              </select>
              <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <button id="newPatientBtn" class="mt-2 text-primary-400 text-sm font-medium">
              <i class="fas fa-plus mr-1"></i>새 환자 등록
            </button>
          </div>

          {/* Quick Recording Notice (shown when quick mode selected) */}
          <div id="quickModeNotice" class="hidden">
            <div class="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4">
              <p class="text-yellow-400 text-sm font-medium mb-1">
                <i class="fas fa-bolt mr-2"></i>빠른 녹음 모드
              </p>
              <p class="text-yellow-300/80 text-sm">
                환자 등록 없이 바로 녹음을 시작합니다.<br/>
                녹음 완료 후 환자를 연결하거나 새로 등록할 수 있어요.
              </p>
            </div>
          </div>
        </div>

        {/* Recording UI */}
        <div class="text-center py-8">
          {/* Recording Status */}
          <div id="recordingStatus" class="mb-8">
            <div id="idleState">
              <div class="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700">
                <i class="fas fa-microphone text-5xl text-gray-400"></i>
              </div>
              <p id="idleMessage" class="text-gray-400 mt-4">환자를 선택하고 녹음을 시작하세요</p>
            </div>
            
            <div id="recordingState" class="hidden">
              <div class="w-32 h-32 mx-auto bg-red-600 rounded-full flex items-center justify-center recording-pulse">
                <i class="fas fa-microphone text-5xl text-white"></i>
              </div>
              <p id="recordingTime" class="text-white text-3xl font-mono mt-4">00:00</p>
              <p class="text-red-400 text-sm mt-2">
                <i class="fas fa-circle text-xs mr-1 animate-pulse"></i>녹음 중...
              </p>
            </div>
            
            <div id="processingState" class="hidden">
              <div class="w-32 h-32 mx-auto bg-primary-600 rounded-full flex items-center justify-center">
                <i class="fas fa-spinner fa-spin text-5xl text-white"></i>
              </div>
              <p class="text-white mt-4">AI 분석 중...</p>
              <p class="text-gray-400 text-sm mt-2">약 1-2분 소요</p>
            </div>
          </div>

          {/* Recording Button */}
          <button id="recordBtn" disabled class="w-20 h-20 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full flex items-center justify-center mx-auto shadow-lg transition">
            <i id="recordIcon" class="fas fa-microphone text-3xl text-white"></i>
          </button>
          <p id="recordBtnText" class="text-gray-400 text-sm mt-3">녹음 시작</p>
        </div>

        {/* Recording Notice */}
        <div class="bg-gray-800 rounded-xl p-4 mt-6">
          <p class="text-gray-400 text-sm">
            <i class="fas fa-info-circle text-primary-400 mr-2"></i>
            녹음 시작 전 환자에게 "상담 품질 향상을 위해 녹음됩니다"라고 안내해주세요.
          </p>
        </div>

        {/* Tips */}
        <div class="mt-6 space-y-3">
          <p class="text-gray-500 text-xs">💡 녹음 팁</p>
          <ul class="text-gray-400 text-sm space-y-2">
            <li>• 휴대폰을 테이블 위에 올려두세요</li>
            <li>• 조용한 환경에서 녹음하면 정확도가 올라갑니다</li>
            <li>• 녹음 중에도 다른 앱을 사용할 수 있습니다</li>
          </ul>
        </div>
      </div>

      {/* New Patient Modal (Before Recording) */}
      <div id="newPatientModal" class="hidden fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
        <div class="bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-white">새 환자 등록</h3>
            <button onclick="closeNewPatientModal()" class="text-gray-400 hover:text-white">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form id="newPatientForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">이름 *</label>
              <input type="text" name="name" required class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="환자 이름" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">연락처</label>
              <input type="tel" name="phone" class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="010-0000-0000" />
            </div>
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition">
              등록 후 녹음 시작
            </button>
          </form>
        </div>
      </div>

      {/* Link Patient Modal (After Recording - Quick Mode) */}
      <div id="linkPatientModal" class="hidden fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div class="bg-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto bg-green-600 rounded-full flex items-center justify-center mb-4">
              <i class="fas fa-check text-3xl text-white"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">녹음 완료!</h3>
            <p class="text-gray-400">이제 환자를 연결해주세요</p>
          </div>

          {/* Tabs: Existing Patient / New Patient */}
          <div class="flex gap-2 mb-4">
            <button id="tabExisting" class="flex-1 py-2 px-4 rounded-lg font-medium transition bg-primary-600 text-white">
              기존 환자 연결
            </button>
            <button id="tabNew" class="flex-1 py-2 px-4 rounded-lg font-medium transition bg-gray-700 text-gray-300 hover:bg-gray-600">
              새 환자 등록
            </button>
          </div>

          {/* Existing Patient Selection */}
          <div id="existingPatientArea">
            <div class="relative mb-4">
              <input type="text" id="patientSearch" placeholder="환자 이름 또는 연락처 검색" class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none pl-10" />
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
            <div id="patientList" class="space-y-2 max-h-60 overflow-y-auto">
              {/* Patient list will be loaded here */}
            </div>
          </div>

          {/* New Patient Form */}
          <div id="newPatientArea" class="hidden">
            <form id="linkNewPatientForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">이름 *</label>
                <input type="text" name="name" required class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="환자 이름" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">연락처</label>
                <input type="tel" name="phone" class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="010-0000-0000" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">나이</label>
                <input type="number" name="age" class="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="나이" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">성별</label>
                <div class="flex gap-4">
                  <label class="flex items-center text-gray-300">
                    <input type="radio" name="gender" value="male" class="mr-2" /> 남성
                  </label>
                  <label class="flex items-center text-gray-300">
                    <input type="radio" name="gender" value="female" class="mr-2" /> 여성
                  </label>
                </div>
              </div>
              <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition">
                환자 등록 후 연결
              </button>
            </form>
          </div>

          {/* Skip Option */}
          <div class="mt-4 pt-4 border-t border-gray-700">
            <button id="skipLinkBtn" class="w-full text-gray-400 hover:text-white text-sm py-2 transition">
              나중에 연결하기 <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>

      <style>
        {`
          .recording-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
          .slide-up {
            animation: slideUp 0.3s ease-out;
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}
      </style>

      <script dangerouslySetInnerHTML={{
        __html: `
          const initialPatientId = '${patientId || ''}';
          let mediaRecorder = null;
          let audioChunks = [];
          let recordingStartTime = null;
          let timerInterval = null;
          let selectedPatientId = null;
          let consultationId = null;
          let isQuickMode = false;
          let allPatients = [];

          async function init() {
            const authRes = await fetch('/api/auth/me');
            if (!authRes.ok) {
              window.location.href = '/login';
              return;
            }

            await loadPatients();
            
            if (initialPatientId) {
              document.getElementById('patientSelect').value = initialPatientId;
              selectedPatientId = initialPatientId;
              document.getElementById('recordBtn').disabled = false;
            }
          }

          async function loadPatients() {
            try {
              const res = await fetch('/api/patients?limit=100');
              const data = await res.json();
              
              if (data.success) {
                allPatients = data.data;
                const select = document.getElementById('patientSelect');
                data.data.forEach(p => {
                  const option = document.createElement('option');
                  option.value = p.id;
                  option.textContent = p.name + (p.phone ? ' (' + p.phone + ')' : '');
                  select.appendChild(option);
                });
              }
            } catch (err) {
              console.error('Failed to load patients:', err);
            }
          }

          // Mode selection
          document.getElementById('modePatient').addEventListener('click', () => {
            isQuickMode = false;
            document.getElementById('modePatient').classList.remove('bg-gray-700', 'text-gray-300');
            document.getElementById('modePatient').classList.add('bg-primary-600', 'text-white');
            document.getElementById('modeQuick').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('modeQuick').classList.add('bg-gray-700', 'text-gray-300');
            
            document.getElementById('patientSelectArea').classList.remove('hidden');
            document.getElementById('quickModeNotice').classList.add('hidden');
            document.getElementById('idleMessage').textContent = '환자를 선택하고 녹음을 시작하세요';
            
            document.getElementById('recordBtn').disabled = !selectedPatientId;
          });

          document.getElementById('modeQuick').addEventListener('click', () => {
            isQuickMode = true;
            document.getElementById('modeQuick').classList.remove('bg-gray-700', 'text-gray-300');
            document.getElementById('modeQuick').classList.add('bg-primary-600', 'text-white');
            document.getElementById('modePatient').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('modePatient').classList.add('bg-gray-700', 'text-gray-300');
            
            document.getElementById('patientSelectArea').classList.add('hidden');
            document.getElementById('quickModeNotice').classList.remove('hidden');
            document.getElementById('idleMessage').textContent = '빠른 녹음 준비 완료!';
            
            document.getElementById('recordBtn').disabled = false;
          });

          document.getElementById('patientSelect').addEventListener('change', (e) => {
            selectedPatientId = e.target.value;
            document.getElementById('recordBtn').disabled = !selectedPatientId && !isQuickMode;
          });

          document.getElementById('recordBtn').addEventListener('click', async () => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
              await startRecording();
            } else {
              await stopRecording();
            }
          });

          async function startRecording() {
            try {
              // Create consultation (with or without patient)
              const consultRes = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: isQuickMode ? null : selectedPatientId,
                  consultation_date: new Date().toISOString()
                })
              });
              const consultData = await consultRes.json();
              if (!consultData.success) {
                alert('상담 기록 생성에 실패했습니다.');
                return;
              }
              consultationId = consultData.data.id;

              // Request microphone permission
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
              audioChunks = [];
              
              mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                  audioChunks.push(e.data);
                }
              };
              
              mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                await processRecording();
              };
              
              mediaRecorder.start(1000);
              recordingStartTime = Date.now();
              
              // Update UI
              document.getElementById('idleState').classList.add('hidden');
              document.getElementById('recordingState').classList.remove('hidden');
              document.getElementById('recordIcon').classList.remove('fa-microphone');
              document.getElementById('recordIcon').classList.add('fa-stop');
              document.getElementById('recordBtnText').textContent = '녹음 종료';
              document.getElementById('patientSelect').disabled = true;
              document.getElementById('modePatient').disabled = true;
              document.getElementById('modeQuick').disabled = true;
              
              timerInterval = setInterval(updateTimer, 1000);
            } catch (err) {
              console.error('Failed to start recording:', err);
              alert('마이크 접근 권한이 필요합니다.');
            }
          }

          async function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
              clearInterval(timerInterval);
              
              document.getElementById('recordingState').classList.add('hidden');
              document.getElementById('processingState').classList.remove('hidden');
              document.getElementById('recordBtn').disabled = true;
            }
          }

          function updateTimer() {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('recordingTime').textContent = minutes + ':' + seconds;
          }

          async function processRecording() {
            const duration = Math.floor((Date.now() - recordingStartTime) / 1000 / 60);
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('duration', duration.toString());
            
            try {
              const res = await fetch('/api/consultations/' + consultationId + '/upload-audio', {
                method: 'POST',
                body: formData
              });
              
              const data = await res.json();
              
              // If quick mode, show link patient modal
              if (isQuickMode) {
                document.getElementById('processingState').classList.add('hidden');
                showLinkPatientModal();
              } else {
                // Normal flow - redirect to consultation detail
                window.location.href = '/consultations/' + consultationId;
              }
            } catch (err) {
              console.error('Failed to upload recording:', err);
              alert('녹음 업로드에 실패했습니다.');
              resetRecordingUI();
            }
          }

          function resetRecordingUI() {
            document.getElementById('processingState').classList.add('hidden');
            document.getElementById('idleState').classList.remove('hidden');
            document.getElementById('recordBtn').disabled = false;
            document.getElementById('recordIcon').classList.add('fa-microphone');
            document.getElementById('recordIcon').classList.remove('fa-stop');
            document.getElementById('recordBtnText').textContent = '녹음 시작';
            document.getElementById('patientSelect').disabled = false;
            document.getElementById('modePatient').disabled = false;
            document.getElementById('modeQuick').disabled = false;
          }

          // Link Patient Modal Functions
          function showLinkPatientModal() {
            document.getElementById('linkPatientModal').classList.remove('hidden');
            renderPatientList(allPatients);
          }

          function renderPatientList(patients) {
            const container = document.getElementById('patientList');
            if (patients.length === 0) {
              container.innerHTML = '<p class="text-gray-400 text-center py-4">검색 결과가 없습니다</p>';
              return;
            }
            container.innerHTML = patients.map(p => \`
              <button class="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-left" onclick="linkPatient('\${p.id}')">
                <div class="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <i class="fas fa-user text-gray-400"></i>
                </div>
                <div>
                  <p class="text-white font-medium">\${p.name}</p>
                  <p class="text-gray-400 text-sm">\${p.phone || '연락처 없음'}</p>
                </div>
              </button>
            \`).join('');
          }

          // Tab switching in link modal
          document.getElementById('tabExisting').addEventListener('click', () => {
            document.getElementById('tabExisting').classList.remove('bg-gray-700', 'text-gray-300');
            document.getElementById('tabExisting').classList.add('bg-primary-600', 'text-white');
            document.getElementById('tabNew').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('tabNew').classList.add('bg-gray-700', 'text-gray-300');
            document.getElementById('existingPatientArea').classList.remove('hidden');
            document.getElementById('newPatientArea').classList.add('hidden');
          });

          document.getElementById('tabNew').addEventListener('click', () => {
            document.getElementById('tabNew').classList.remove('bg-gray-700', 'text-gray-300');
            document.getElementById('tabNew').classList.add('bg-primary-600', 'text-white');
            document.getElementById('tabExisting').classList.remove('bg-primary-600', 'text-white');
            document.getElementById('tabExisting').classList.add('bg-gray-700', 'text-gray-300');
            document.getElementById('newPatientArea').classList.remove('hidden');
            document.getElementById('existingPatientArea').classList.add('hidden');
          });

          // Patient search in link modal
          document.getElementById('patientSearch').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allPatients.filter(p => 
              p.name.toLowerCase().includes(query) || 
              (p.phone && p.phone.includes(query))
            );
            renderPatientList(filtered);
          });

          // Link existing patient
          async function linkPatient(patientId) {
            try {
              const res = await fetch('/api/consultations/' + consultationId + '/link-patient', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientId })
              });
              
              const data = await res.json();
              if (data.success) {
                window.location.href = '/consultations/' + consultationId;
              } else {
                alert(data.error || '환자 연결에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          }
          window.linkPatient = linkPatient;

          // New patient form in link modal
          document.getElementById('linkNewPatientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
              // Create new patient
              const patientRes = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: formData.get('name'),
                  phone: formData.get('phone') || undefined,
                  age: formData.get('age') ? parseInt(formData.get('age')) : undefined,
                  gender: formData.get('gender') || undefined
                })
              });
              
              const patientData = await patientRes.json();
              if (!patientData.success) {
                alert(patientData.error || '환자 등록에 실패했습니다.');
                return;
              }
              
              // Link to consultation
              await linkPatient(patientData.data.id);
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          });

          // Skip linking (view consultation without patient)
          document.getElementById('skipLinkBtn').addEventListener('click', () => {
            window.location.href = '/consultations/' + consultationId;
          });

          // Original new patient modal (before recording)
          document.getElementById('newPatientBtn').addEventListener('click', () => {
            document.getElementById('newPatientModal').classList.remove('hidden');
          });

          function closeNewPatientModal() {
            document.getElementById('newPatientModal').classList.add('hidden');
            document.getElementById('newPatientForm').reset();
          }
          window.closeNewPatientModal = closeNewPatientModal;

          document.getElementById('newPatientModal').addEventListener('click', (e) => {
            if (e.target.id === 'newPatientModal') closeNewPatientModal();
          });

          document.getElementById('newPatientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            try {
              const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: formData.get('name'),
                  phone: formData.get('phone') || undefined
                })
              });
              
              const data = await res.json();
              
              if (data.success) {
                closeNewPatientModal();
                allPatients.push(data.data);
                
                const select = document.getElementById('patientSelect');
                const option = document.createElement('option');
                option.value = data.data.id;
                option.textContent = data.data.name;
                select.appendChild(option);
                select.value = data.data.id;
                
                selectedPatientId = data.data.id;
                document.getElementById('recordBtn').disabled = false;
              } else {
                alert(data.error || '환자 등록에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          });

          init();
        `
      }} />
    </div>
  )
}
