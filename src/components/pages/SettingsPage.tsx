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
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-sm text-surface-900">아침 푸시 알림</p>
                <p class="text-xs text-surface-500 mt-0.5">출근 시 오늘의 연락 알림</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="notificationEnabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-brand-600 transition-colors"></div>
              </label>
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

        {/* App Info */}
        <div class="card-premium p-5">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center"><i class="fas fa-circle-info text-xs text-surface-500"></i></div>
            <h3 class="font-bold text-sm text-surface-900">앱 정보</h3>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
              <span class="text-surface-500 text-xs">버전</span>
              <span class="font-bold text-surface-800 text-xs">v2.0.0</span>
            </div>
            <div class="flex justify-between items-center p-2 bg-surface-50 rounded-lg">
              <span class="text-surface-500 text-xs">문의</span>
              <a href="mailto:support@patienttouch.com" class="text-brand-600 font-semibold text-xs hover:text-brand-700 transition-colors">support@patienttouch.com</a>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button id="saveSettingsBtn" class="w-full bg-gradient-brand text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-brand-600/20 text-sm">
          <i class="fas fa-check mr-2"></i>설정 저장
        </button>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          async function loadSettings() {
            try {
              var res = await fetch('/api/auth/me');
              if (!res.ok) { window.location.href = '/login'; return; }
              var data = await res.json();
              if (data.success) {
                var user = data.data;
                var settings = user.settings || {};
                var colors = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'];
                var avatarColor = colors[user.name.charCodeAt(0) % colors.length];
                document.getElementById('profileSection').innerHTML =
                  '<div class="w-16 h-16 rounded-2xl ' + avatarColor + ' flex items-center justify-center font-black text-2xl shrink-0">' + user.name.charAt(0) + '</div>' +
                  '<div><p class="font-bold text-surface-900">' + user.name + '</p>' +
                  '<p class="text-surface-500 text-sm">' + user.email + '</p>' +
                  '<p class="text-brand-600 text-xs font-semibold mt-0.5">' + user.organization_name + '</p></div>';

                document.getElementById('notificationEnabled').checked = settings.notification_enabled !== false;
                document.getElementById('notificationTime').value = settings.notification_time || '08:30';
                document.getElementById('weekendNotification').checked = settings.weekend_notification === true;

                var planNames = { basic:'Basic', standard:'Standard', premium:'Premium', enterprise:'Enterprise', trial:'Trial' };
                var statusNames = { active:'활성', expired:'만료', trial:'무료체험' };
                document.getElementById('planInfo').innerHTML =
                  '<span class="text-surface-500 text-sm">현재 플랜</span>' +
                  '<span class="font-bold text-brand-600 text-sm">' + (planNames[user.plan_type] || user.plan_type) + '</span>';
                document.getElementById('subInfo').innerHTML =
                  '<span class="text-surface-500 text-sm">구독 상태</span>' +
                  '<span class="inline-flex items-center gap-1.5 font-bold text-sm ' +
                  (user.subscription_status === 'active' ? 'text-emerald-600' : user.subscription_status === 'trial' ? 'text-amber-600' : 'text-rose-600') + '">' +
                  '<span class="w-1.5 h-1.5 rounded-full ' +
                  (user.subscription_status === 'active' ? 'bg-emerald-500' : user.subscription_status === 'trial' ? 'bg-amber-500' : 'bg-rose-500') + '"></span>' +
                  (statusNames[user.subscription_status] || user.subscription_status) + '</span>';
              }
            } catch (err) { console.error('Failed to load settings:', err); }
          }

          document.getElementById('saveSettingsBtn').addEventListener('click', async function() {
            var settings = {
              notification_enabled: document.getElementById('notificationEnabled').checked,
              notification_time: document.getElementById('notificationTime').value,
              weekend_notification: document.getElementById('weekendNotification').checked
            };
            try {
              var res = await fetch('/api/auth/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
              var data = await res.json();
              if (data.success) alert('설정이 저장되었습니다.');
              else alert(data.error || '설정 저장에 실패했습니다.');
            } catch (err) { alert('오류가 발생했습니다.'); }
          });

          document.getElementById('logoutBtn').addEventListener('click', async function() {
            if (!confirm('로그아웃 하시겠습니까?')) return;
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
            window.location.href = '/login';
          });

          loadSettings();
        `
      }} />
    </Layout>
  )
}
