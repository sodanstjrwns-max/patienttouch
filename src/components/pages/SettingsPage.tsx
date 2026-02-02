import { FC } from 'hono/jsx'
import { Layout, Header, Card } from '../shared/Layout'

export const SettingsPage: FC = () => {
  return (
    <Layout hideNav>
      <Header title="설정" showBack backUrl="/" />
      
      <div class="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <Card className="p-4">
          <div id="profileSection" class="flex items-center gap-4">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-2xl text-primary-600"></i>
            </div>
            <div class="animate-pulse">
              <div class="h-5 bg-gray-200 rounded w-24 mb-2"></div>
              <div class="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-bell text-primary-600 mr-2"></i>
            알림 설정
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">아침 푸시 알림</p>
                <p class="text-sm text-gray-500">출근 시 오늘의 연락 알림</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="notificationEnabled" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">알림 시간</p>
                <p class="text-sm text-gray-500">매일 이 시간에 알림</p>
              </div>
              <input type="time" id="notificationTime" class="px-3 py-2 border border-gray-200 rounded-lg text-sm" value="08:30" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">주말 알림</p>
                <p class="text-sm text-gray-500">토/일에도 알림 받기</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="weekendNotification" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Recording Settings */}
        <Card className="p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-microphone text-primary-600 mr-2"></i>
            녹음 설정
          </h3>
          <div class="space-y-4">
            <div>
              <p class="font-medium text-gray-900 mb-2">녹음 안내 문구</p>
              <textarea id="recordingNotice" rows={2} class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="상담 품질 향상을 위해 녹음됩니다."></textarea>
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card className="p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-user-cog text-primary-600 mr-2"></i>
            계정
          </h3>
          <div class="space-y-2">
            <div id="planInfo" class="flex items-center justify-between py-2">
              <span class="text-gray-600">현재 플랜</span>
              <span class="font-medium text-primary-600">-</span>
            </div>
            <div id="subInfo" class="flex items-center justify-between py-2 border-t border-gray-100">
              <span class="text-gray-600">구독 상태</span>
              <span class="font-medium">-</span>
            </div>
            <button id="logoutBtn" class="w-full mt-4 py-3 text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition">
              로그아웃
            </button>
          </div>
        </Card>

        {/* App Info */}
        <Card className="p-4">
          <h3 class="font-semibold text-gray-900 mb-4">
            <i class="fas fa-info-circle text-primary-600 mr-2"></i>
            앱 정보
          </h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">버전</span>
              <span class="text-gray-900">1.0.0</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">문의</span>
              <a href="mailto:support@patienttouch.com" class="text-primary-600">support@patienttouch.com</a>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <button id="saveSettingsBtn" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-xl transition">
          설정 저장
        </button>
      </div>

      <script dangerouslySetInnerHTML={{
        __html: `
          async function loadSettings() {
            try {
              const res = await fetch('/api/auth/me');
              if (!res.ok) {
                window.location.href = '/login';
                return;
              }
              
              const data = await res.json();
              
              if (data.success) {
                const user = data.data;
                const settings = user.settings || {};
                
                // Profile
                document.getElementById('profileSection').innerHTML = \`
                  <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-2xl text-primary-600"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">\${user.name}</p>
                    <p class="text-gray-500 text-sm">\${user.email}</p>
                    <p class="text-primary-600 text-sm">\${user.organization_name}</p>
                  </div>
                \`;
                
                // Settings
                document.getElementById('notificationEnabled').checked = settings.notification_enabled !== false;
                document.getElementById('notificationTime').value = settings.notification_time || '08:30';
                document.getElementById('weekendNotification').checked = settings.weekend_notification === true;
                
                // Plan info
                const planNames = { basic: 'Basic', standard: 'Standard', premium: 'Premium', enterprise: 'Enterprise' };
                const statusNames = { active: '활성', expired: '만료', trial: '무료체험' };
                document.getElementById('planInfo').innerHTML = \`
                  <span class="text-gray-600">현재 플랜</span>
                  <span class="font-medium text-primary-600">\${planNames[user.plan_type] || user.plan_type}</span>
                \`;
                document.getElementById('subInfo').innerHTML = \`
                  <span class="text-gray-600">구독 상태</span>
                  <span class="font-medium \${user.subscription_status === 'active' ? 'text-green-600' : user.subscription_status === 'trial' ? 'text-yellow-600' : 'text-red-600'}">
                    \${statusNames[user.subscription_status] || user.subscription_status}
                  </span>
                \`;
              }
            } catch (err) {
              console.error('Failed to load settings:', err);
            }
          }

          document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
            const settings = {
              notification_enabled: document.getElementById('notificationEnabled').checked,
              notification_time: document.getElementById('notificationTime').value,
              weekend_notification: document.getElementById('weekendNotification').checked
            };
            
            try {
              const res = await fetch('/api/auth/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
              });
              
              const data = await res.json();
              
              if (data.success) {
                alert('설정이 저장되었습니다.');
              } else {
                alert(data.error || '설정 저장에 실패했습니다.');
              }
            } catch (err) {
              alert('오류가 발생했습니다.');
            }
          });

          document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (!confirm('로그아웃 하시겠습니까?')) return;
            
            try {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            } catch (err) {
              window.location.href = '/login';
            }
          });

          loadSettings();
        `
      }} />
    </Layout>
  )
}
