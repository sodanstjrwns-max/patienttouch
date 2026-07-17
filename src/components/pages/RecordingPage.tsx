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

        {/* File Upload (이미 녹음된 파일) */}
        <div class="px-5 mb-4" id="uploadFileSection">
          <input type="file" id="audioFileInput" accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg,.mp4,.aac" class="hidden" />
          <button id="uploadFileBtn" class="w-full glass-dark rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left" onclick="pickAudioFile()">
            <div class="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
              <i class="fas fa-file-audio text-cyan-400"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-white">녹음 파일 업로드</p>
              <p class="text-xs text-surface-400">이미 녹음된 파일(mp3·m4a·wav·webm 등, 최대 25MB)로 바로 분석</p>
            </div>
            <i class="fas fa-chevron-right text-surface-500 text-xs"></i>
          </button>
        </div>

        {/* Quality indicator (shown after save) */}
        <div id="qualityIndicator" class="px-5 mb-4 hidden"></div>

        {/* Analysis steps (shown after save) */}
        <div id="analysisSteps" class="px-5 mb-8 hidden"></div>

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

      <script src="/static/level-system.js"></script>
      <script src="/static/pages/recording.js"></script>
    </div>
  )
}
