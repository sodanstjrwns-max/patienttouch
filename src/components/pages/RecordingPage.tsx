import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

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
        {/* Patient Selection */}
        <div class="mb-6">
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

        {/* Recording UI */}
        <div class="text-center py-8">
          {/* Recording Status */}
          <div id="recordingStatus" class="mb-8">
            <div id="idleState">
              <div class="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center border-4 border-gray-700">
                <i class="fas fa-microphone text-5xl text-gray-400"></i>
              </div>
              <p class="text-gray-400 mt-4">환자를 선택하고 녹음을 시작하세요</p>
            </div>
            
            <div id="recordingState" class="hidden">
              <div class="w-32 h-32 mx-auto bg-red-600 rounded-full flex items-center justify-center recording-pulse">
                <i class="fas fa-microphone text-5xl text-white"></i>
              </div>
              <p id="recordingTime" class="text-white text-3xl font-mono mt-4">00:00</p>
              <p class="text-red-400 text-sm mt-2">
                <i class="fas fa-circle text-xs mr-1"></i>녹음 중...
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

      {/* New Patient Modal */}
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

      <script dangerouslySetInnerHTML={{
        __html: `
          const initialPatientId = '${patientId || ''}';
          let mediaRecorder = null;
          let audioChunks = [];
          let recordingStartTime = null;
          let timerInterval = null;
          let selectedPatientId = null;
          let consultationId = null;

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

          document.getElementById('patientSelect').addEventListener('change', (e) => {
            selectedPatientId = e.target.value;
            document.getElementById('recordBtn').disabled = !selectedPatientId;
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
              // Create consultation first
              const consultRes = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: selectedPatientId,
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
              
              mediaRecorder.start(1000); // Collect data every second
              recordingStartTime = Date.now();
              
              // Update UI
              document.getElementById('idleState').classList.add('hidden');
              document.getElementById('recordingState').classList.remove('hidden');
              document.getElementById('recordIcon').classList.remove('fa-microphone');
              document.getElementById('recordIcon').classList.add('fa-stop');
              document.getElementById('recordBtnText').textContent = '녹음 종료';
              document.getElementById('patientSelect').disabled = true;
              
              // Start timer
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
              
              // Update UI
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
              
              if (data.success) {
                // Redirect to consultation detail
                window.location.href = '/consultations/' + consultationId;
              } else {
                alert('AI 분석에 실패했습니다: ' + (data.error || ''));
                window.location.href = '/consultations/' + consultationId;
              }
            } catch (err) {
              console.error('Failed to upload recording:', err);
              alert('녹음 업로드에 실패했습니다.');
              document.getElementById('processingState').classList.add('hidden');
              document.getElementById('idleState').classList.remove('hidden');
              document.getElementById('recordBtn').disabled = false;
              document.getElementById('recordIcon').classList.add('fa-microphone');
              document.getElementById('recordIcon').classList.remove('fa-stop');
              document.getElementById('recordBtnText').textContent = '녹음 시작';
              document.getElementById('patientSelect').disabled = false;
            }
          }

          // New patient modal
          document.getElementById('newPatientBtn').addEventListener('click', () => {
            document.getElementById('newPatientModal').classList.remove('hidden');
          });

          function closeNewPatientModal() {
            document.getElementById('newPatientModal').classList.add('hidden');
            document.getElementById('newPatientForm').reset();
          }

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
                
                // Add to select and select it
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
