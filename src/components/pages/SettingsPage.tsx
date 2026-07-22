import { FC } from 'hono/jsx'
import { Layout, Header } from '../shared/Layout'

export const SettingsPage: FC = () => {
  return (
    <Layout hideNav>
      <Header title="설정" subtitle="프로필 및 앱 설정" showBack backUrl="/" />
      
      <div class="px-4 py-4 space-y-3 pb-24">
        {/* Profile Card */}
        <div class="card-premium p-5">
          <div id="profileSection" class="flex items-center gap-4">
            <div class="w-16 h-16 shimmer rounded-2xl"></div>
            <div class="space-y-2 flex-1">
              <div class="shimmer h-5 rounded-lg w-1/2"></div>
              <div class="shimmer h-4 rounded-lg w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-bell text-xs text-amber-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">알림 설정</h3>
          </div>
          <div class="space-y-5">
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-sm text-surface-900">아침 브리핑 푸시 알림</p>
                  <p class="text-xs text-surface-500 mt-0.5">매일 아침 "오늘 연락 N건 · 예상 금액" 알림</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="notificationEnabled" class="sr-only peer" />
                  <div class="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-brand-600 transition-colors"></div>
                </label>
              </div>
              <p id="pushStatusLine" class="text-[11px] text-surface-400 mt-1.5"></p>
              <button id="pushTestBtn" class="hidden mt-2 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-all">
                <i class="fas fa-paper-plane mr-1"></i>테스트 발송
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-sm text-surface-900">알림 시간</p>
                <p class="text-xs text-surface-500 mt-0.5">매일 이 시간에 알림</p>
              </div>
              <input type="time" id="notificationTime" class="px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all" value="08:30" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-sm text-surface-900">주말 알림</p>
                <p class="text-xs text-surface-500 mt-0.5">토/일에도 알림 받기</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="weekendNotification" class="sr-only peer" />
                <div class="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-brand-600 transition-colors"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Recording Settings */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><i class="fas fa-microphone text-xs text-rose-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">녹음 설정</h3>
          </div>
          <div>
            <p class="font-semibold text-sm text-surface-900 mb-2">녹음 안내 문구</p>
            <textarea id="recordingNotice" rows={2} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all leading-relaxed" placeholder="상담 품질 향상을 위해 녹음됩니다."></textarea>
          </div>
        </div>

        {/* Account */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center"><i class="fas fa-user-gear text-xs text-brand-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">계정</h3>
          </div>
          <div class="space-y-0">
            <div id="planInfo" class="flex items-center justify-between py-3">
              <span class="text-surface-500 text-sm">현재 플랜</span>
              <span class="font-bold text-brand-600 text-sm">-</span>
            </div>
            <div class="h-px bg-surface-100"></div>
            <div id="subInfo" class="flex items-center justify-between py-3">
              <span class="text-surface-500 text-sm">구독 상태</span>
              <span class="font-bold text-sm">-</span>
            </div>
            <button id="logoutBtn" class="w-full mt-4 py-3 text-rose-600 font-semibold border-2 border-rose-200 rounded-xl hover:bg-rose-50 transition-all active:scale-[0.98] text-sm">
              <i class="fas fa-arrow-right-from-bracket mr-2"></i>로그아웃
            </button>
          </div>
        </div>

        {/* v9.3: AI Usage (admin only) */}
        <section id="usageSection" class="card-premium p-5 hidden">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><i class="fas fa-gauge-high text-xs text-violet-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">이번 달 AI 사용량</h3>
            </div>
            <span id="usageMonth" class="text-xs text-surface-400 font-semibold"></span>
          </div>
          <div id="usageBody">
            <div class="shimmer h-16 rounded-lg w-full"></div>
          </div>
        </section>

        {/* Feature 10: Team Management */}
        <div class="card-premium p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><i class="fas fa-users-gear text-xs text-purple-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">팀 관리</h3>
            </div>
            <button id="addMemberBtn" class="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-all">
              <i class="fas fa-user-plus mr-1 text-[10px]"></i>추가
            </button>
          </div>
          <div id="teamList" class="space-y-2">
            <div class="shimmer h-12 rounded-lg w-full"></div>
          </div>
        </div>

        {/* v8.7.1: 도입 문의(리드) 관리 (admin only — settings.js에서 role 기반 표시) */}
        <div id="leadsSection" class="card-premium p-5 hidden">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-inbox text-xs text-amber-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">도입 문의 (리드)</h3>
              <span id="leadsNewBadge" class="hidden text-[10px] font-black text-white bg-rose-500 px-1.5 py-0.5 rounded-full"></span>
            </div>
            <div class="flex items-center gap-1.5">
              <select id="leadsStatusFilter" class="text-[11px] font-semibold px-2 py-1 bg-surface-50 border border-surface-200 rounded-lg outline-none">
                <option value="">전체</option>
                <option value="new" selected>신규</option>
                <option value="contacted">연락함</option>
                <option value="demo">데모</option>
                <option value="won">계약</option>
                <option value="lost">이탈</option>
              </select>
              <button id="loadLeadsBtn" class="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-all">
                <i class="fas fa-rotate mr-1 text-[10px]"></i>조회
              </button>
            </div>
          </div>
          <div id="leadsList" class="space-y-2">
            <p class="text-xs text-surface-400 text-center py-3">조회 버튼을 눌러 도입 문의를 확인하세요</p>
          </div>
        </div>

        {/* Feature 11: Data Export (admin only — settings.js에서 role 기반 표시) */}
        <div id="exportSection" class="card-premium p-5 hidden">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><i class="fas fa-file-export text-xs text-emerald-600"></i></div>
            <h3 class="font-bold text-sm text-surface-900">데이터 내보내기</h3>
          </div>
          <div class="space-y-2">
            <button onclick="exportData('consultations')" class="w-full flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-brand-50 transition-all group">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center"><i class="fas fa-stethoscope text-sky-600 text-xs"></i></div>
                <div><p class="text-sm font-semibold text-surface-900 group-hover:text-brand-700">상담 내역</p><p class="text-[10px] text-surface-500">최근 30일 CSV</p></div>
              </div>
              <i class="fas fa-download text-surface-300 text-xs group-hover:text-brand-500"></i>
            </button>
            <button onclick="exportData('patients')" class="w-full flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-brand-50 transition-all group">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><i class="fas fa-user-group text-emerald-600 text-xs"></i></div>
                <div><p class="text-sm font-semibold text-surface-900 group-hover:text-brand-700">환자 목록</p><p class="text-[10px] text-surface-500">전체 환자 CSV</p></div>
              </div>
              <i class="fas fa-download text-surface-300 text-xs group-hover:text-brand-500"></i>
            </button>
            <button onclick="exportData('retention')" class="w-full flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-brand-50 transition-all group">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center"><i class="fas fa-heart text-rose-600 text-xs"></i></div>
                <div><p class="text-sm font-semibold text-surface-900 group-hover:text-brand-700">리텐션 현황</p><p class="text-[10px] text-surface-500">이탈 위험 환자 CSV</p></div>
              </div>
              <i class="fas fa-download text-surface-300 text-xs group-hover:text-brand-500"></i>
            </button>
          </div>
        </div>

        {/* v8.6: Privacy & Compliance (admin only — settings.js에서 role 기반 표시) */}
        <div id="privacySection" class="card-premium p-5 hidden">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center"><i class="fas fa-shield-halved text-xs text-indigo-600"></i></div>
            <div>
              <h3 class="font-bold text-sm text-surface-900">개인정보 보호</h3>
              <p class="text-[9px] text-surface-400">녹음 동의 · 보존기간 · 파기 · 감사 로그</p>
            </div>
          </div>
          <div class="space-y-4">
            {/* 녹음 동의 안내 문구 */}
            <div>
              <p class="font-semibold text-sm text-surface-900 mb-1">녹음 동의 안내 문구</p>
              <p class="text-[11px] text-surface-500 mb-2">녹음 시작 전 상담사가 환자에게 고지하는 문구입니다</p>
              <textarea id="consentNoticeText" rows={2} class="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all leading-relaxed"></textarea>
            </div>
            {/* 보존 기간 */}
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-sm text-surface-900">상담 원문 보존 기간</p>
                <p class="text-[11px] text-surface-500 mt-0.5">기간 경과 시 원문·녹음 자동 파기 (통계는 유지)</p>
              </div>
              <select id="retentionMonths" class="px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all">
                <option value="0">무기한</option>
                <option value="6">6개월</option>
                <option value="12">1년</option>
                <option value="24">2년</option>
                <option value="36">3년</option>
                <option value="60">5년</option>
              </select>
            </div>
            <div id="purgePendingLine" class="hidden p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/50 text-[11px] text-amber-700"></div>
            <div class="flex gap-2">
              <button id="savePrivacyBtn" class="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">
                <i class="fas fa-check mr-1.5"></i>정책 저장
              </button>
              <button id="purgeNowBtn" class="flex-1 py-2.5 text-sm font-semibold text-rose-600 border-2 border-rose-200 rounded-xl hover:bg-rose-50 transition-all active:scale-[0.98]">
                <i class="fas fa-eraser mr-1.5"></i>지금 파기 실행
              </button>
            </div>
            {/* 감사 로그 */}
            <div class="pt-2 border-t border-surface-100">
              <div class="flex items-center justify-between mb-2">
                <p class="font-semibold text-sm text-surface-900">감사 로그</p>
                <button id="loadAuditBtn" class="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-all">
                  <i class="fas fa-list mr-1 text-[10px]"></i>조회
                </button>
              </div>
              <p class="text-[11px] text-surface-500 mb-2">원문 열람·검색·파기·환자 삭제 이력이 기록됩니다</p>
              <div id="auditLogList" class="space-y-1.5 max-h-64 overflow-y-auto"></div>
            </div>
          </div>
        </div>

        {/* Feature 12: Duplicate Check */}
        <div class="card-premium p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><i class="fas fa-clone text-xs text-amber-600"></i></div>
              <h3 class="font-bold text-sm text-surface-900">중복 환자 관리</h3>
            </div>
            <button onclick="checkDuplicates()" class="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-all">
              <i class="fas fa-magnifying-glass mr-1 text-[10px]"></i>검사
            </button>
          </div>
          <div id="duplicatesList" class="space-y-2">
            <p class="text-xs text-surface-500 text-center py-3">위 버튼을 눌러 중복 환자를 검사하세요</p>
          </div>
        </div>

        {/* AI Model Settings */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-sm shadow-brand-400/30"><i class="fas fa-brain text-[10px] text-white"></i></div>
            <div>
              <h3 class="font-bold text-sm text-surface-900">AI 모델 설정</h3>
              <p class="text-[9px] text-surface-400">GPT-5 · Patient Funnel AI Engine</p>
            </div>
          </div>
          <div class="space-y-3">
            <div class="p-3 bg-surface-50 rounded-xl">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold text-surface-700">핵심 분석 모델</span>
                <span id="aiPrimaryModel" class="text-xs font-bold text-brand-600">GPT-5</span>
              </div>
              <p class="text-[10px] text-surface-400">상담 분석, 화자 분리, 코칭 리포트</p>
            </div>
            <div class="p-3 bg-surface-50 rounded-xl">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold text-surface-700">보조 모델</span>
                <span id="aiSecondaryModel" class="text-xs font-bold text-emerald-600">GPT-5-mini</span>
              </div>
              <p class="text-[10px] text-surface-400">NER, SPIN 분석, 실시간 힌트, 연락 멘트</p>
            </div>
            <div class="p-3 bg-surface-50 rounded-xl">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold text-surface-700">음성 인식</span>
                <span id="aiSttModel" class="text-xs font-bold text-purple-600">gpt-4o-transcribe</span>
              </div>
              <p class="text-[10px] text-surface-400">한국어 음성 → 텍스트 변환</p>
            </div>
            <div class="flex items-center gap-2 p-2.5 bg-brand-50/50 rounded-xl border border-brand-100/50">
              <i class="fas fa-shield-check text-brand-500 text-xs"></i>
              <p class="text-[10px] text-brand-700">모델은 환경변수로 관리됩니다. 관리자에게 문의하세요.</p>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center"><i class="fas fa-circle-info text-xs text-surface-500"></i></div>
            <h3 class="font-bold text-sm text-surface-900">앱 정보</h3>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
              <span class="text-surface-500 text-xs">버전</span>
              <span class="font-bold text-surface-800 text-xs">v9.3.2</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
              <span class="text-surface-500 text-xs">AI 엔진</span>
              <span class="font-bold text-brand-600 text-xs">GPT-5 기반</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
              <span class="text-surface-500 text-xs">문의</span>
              <a href="mailto:support@patienttouch.com" class="text-brand-600 font-semibold text-xs hover:text-brand-700 transition-colors">support@patienttouch.com</a>
            </div>
            <a href="/guide" target="_blank" class="flex justify-between items-center p-2 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors">
              <span class="text-surface-500 text-xs"><i class="fas fa-book-open mr-1.5 text-brand-500"></i>사용 설명서</span>
              <span class="text-brand-600 font-semibold text-xs">전체 기능 안내 <i class="fas fa-arrow-up-right-from-square text-[10px]"></i></span>
            </a>
            <a href="/terms" target="_blank" class="flex justify-between items-center p-2 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors">
              <span class="text-surface-500 text-xs"><i class="fas fa-file-contract mr-1.5 text-surface-400"></i>이용약관</span>
              <span class="text-surface-400 text-xs"><i class="fas fa-arrow-up-right-from-square text-[10px]"></i></span>
            </a>
            <a href="/privacy-policy" target="_blank" class="flex justify-between items-center p-2 bg-surface-50 rounded-lg hover:bg-surface-100 transition-colors">
              <span class="text-surface-500 text-xs"><i class="fas fa-shield-halved mr-1.5 text-surface-400"></i>개인정보처리방침</span>
              <span class="text-surface-400 text-xs"><i class="fas fa-arrow-up-right-from-square text-[10px]"></i></span>
            </a>
          </div>
        </div>

        {/* Save Button */}
        <button id="saveSettingsBtn" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20 text-sm">
          <i class="fas fa-check mr-2"></i>설정 저장
        </button>
      </div>

      <script src="/static/push-client.js"></script>
      <script src="/static/pages/settings.js"></script>
    </Layout>
  )
}
