// ============================================
// 터치 리포트 — 환자용 보고서 렌더러
// 카톡 인앱 브라우저 기준. 본문 16px 행간 1.7+. 중장년 가독성.
// ============================================
(function () {
  const root = document.getElementById('tr-root');
  const token = root.dataset.token;
  const $ = (id) => document.getElementById(id);

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function show(id) {
    ['tr-loading', 'tr-auth', 'tr-report', 'tr-error'].forEach((x) => {
      const el = $(x);
      el.classList.add('hidden');
      el.classList.remove('flex');
    });
    const el = $(id);
    el.classList.remove('hidden');
    if (id === 'tr-auth' || id === 'tr-error') el.classList.add('flex');
  }

  function fail(msg) {
    $('tr-error-msg').textContent = msg || '잠시 후 다시 시도해주세요.';
    show('tr-error');
  }

  async function api(path, body) {
    const res = await fetch(`/api/touch-report/public/${token}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  }

  function track(eventType) {
    fetch(`/api/touch-report/public/${token}/event`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType }),
    }).catch(() => {});
  }

  // ---------- 치식도 (FDI 상하악 성인 32치) ----------
  function toothChart(mentioned, color) {
    const upper = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
    const lower = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];
    const set = new Set(mentioned || []);
    const cell = (t) => {
      const hit = set.has(t);
      return `<div style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:9px;font-weight:700;
        ${hit ? `background:${color};color:#fff;box-shadow:0 2px 8px ${color}66;` : 'background:#f1f5f9;color:#94a3b8;'}">${t}</div>`;
    };
    return `
      <div style="display:grid;grid-template-columns:repeat(16,1fr);gap:3px;margin-bottom:6px;">${upper.map(cell).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(16,1fr);gap:3px;">${lower.map(cell).join('')}</div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;margin-top:8px;">
        <span>오른쪽</span><span>위 · 아래</span><span>왼쪽</span>
      </div>`;
  }

  // ---------- 본문 렌더 ----------
  function render(data) {
    const c = data.content;
    const b = data.brand || {};
    const pc = b.primary_color || '#7c4dff';
    const sc = b.secondary_color || '#22d3ee';
    const clinic = b.clinic_name || '병원';

    document.title = `${c.patient_name}님을 위한 상담 보고서 — ${clinic}`;

    let html = '';

    // 1. 커버 (다크 + 브랜드 컬러)
    html += `
    <section id="tr-cover" style="background:linear-gradient(155deg,#17123a 0%,#241457 60%,#17103e 100%);position:relative;overflow:hidden;padding:64px 28px 56px;">
      <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:${pc}33;filter:blur(60px);"></div>
      <div style="position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;border-radius:50%;background:${sc}22;filter:blur(50px);"></div>
      <div style="position:relative;max-width:480px;margin:0 auto;">
        ${b.logo_url ? `<img src="${esc(b.logo_url)}" alt="${esc(clinic)}" style="height:36px;margin-bottom:28px;filter:brightness(0) invert(1);opacity:.9;">`
          : `<div style="color:#fff;font-weight:800;font-size:15px;letter-spacing:.02em;margin-bottom:28px;opacity:.9;">${esc(clinic)}</div>`}
        <p style="color:${sc};font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;">Consultation Report</p>
        <h1 style="color:#fff;font-size:28px;font-weight:900;line-height:1.35;letter-spacing:-.02em;margin-bottom:14px;">
          ${esc(c.patient_name)}님을 위한<br>상담 보고서
        </h1>
        <p style="color:rgba(255,255,255,.45);font-size:14px;">상담일 ${esc(c.consultation_date)}</p>
      </div>
    </section>`;

    const section = (title, icon, body) => `
      <section style="max-width:480px;margin:0 auto;padding:36px 24px 0;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:34px;height:34px;border-radius:10px;background:${pc}14;display:flex;align-items:center;justify-content:center;">
            <i class="${icon}" style="color:${pc};font-size:14px;"></i>
          </div>
          <h2 style="font-size:18px;font-weight:800;color:#17123a;letter-spacing:-.01em;">${title}</h2>
        </div>
        ${body}
      </section>`;

    // 2. 오늘의 요약
    if (c.summary && c.summary.length) {
      html += section('오늘의 요약', 'fas fa-sun', `
        <div style="background:linear-gradient(135deg,${pc}0d,${sc}0a);border:1px solid ${pc}1f;border-radius:18px;padding:22px;">
          ${c.summary.map((s) => `<p style="font-size:16px;line-height:1.75;color:#2a2354;margin-bottom:10px;">${esc(s)}</p>`).join('')}
        </div>`);
    }

    // 3. 현재 구강 상태
    if (c.oral_status && c.oral_status.description) {
      html += section('현재 구강 상태', 'fas fa-tooth', `
        <p style="font-size:16px;line-height:1.75;color:#3b3568;margin-bottom:18px;">${esc(c.oral_status.description)}</p>
        ${(c.oral_status.mentioned_teeth || []).length ? `
        <div style="background:#fff;border:1px solid #ece9f8;border-radius:18px;padding:18px;">
          <p style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:12px;">상담에서 언급된 치아</p>
          ${toothChart(c.oral_status.mentioned_teeth, pc)}
        </div>` : ''}`);
    }

    // 4. 치료 옵션 비교 카드 (의사결정 핵심 화면)
    if (c.treatment_options && c.treatment_options.length) {
      const cards = c.treatment_options.map((o, i) => `
        <div style="background:#fff;border:1.5px solid ${i === 0 ? pc + '55' : '#ece9f8'};border-radius:20px;padding:22px;margin-bottom:14px;position:relative;
          ${i === 0 ? `box-shadow:0 8px 32px ${pc}1a;` : ''}">
          ${i === 0 ? `<span style="position:absolute;top:-10px;left:20px;background:${pc};color:#fff;font-size:11px;font-weight:800;padding:3px 12px;border-radius:99px;">상담 시 안내</span>` : ''}
          <h3 style="font-size:18px;font-weight:800;color:#17123a;margin:${i === 0 ? '6px' : '0'} 0 14px;">${esc(o.name)}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
            ${[['fa-calendar', '기간', o.duration], ['fa-shoe-prints', '내원', o.visit_count], ['fa-won-sign', '예상 비용', o.cost]]
              .map(([ic, lb, v]) => `
              <div style="background:#f8f7fd;border-radius:12px;padding:12px 8px;text-align:center;">
                <i class="fas ${ic}" style="color:${pc};font-size:12px;"></i>
                <p style="font-size:10px;color:#94a3b8;font-weight:600;margin:5px 0 2px;">${lb}</p>
                <p style="font-size:13px;font-weight:800;color:#17123a;line-height:1.3;">${esc(v) || '—'}</p>
              </div>`).join('')}
          </div>
          ${(o.pros || []).length ? `
          <div style="margin-bottom:10px;">
            ${o.pros.map((p) => `<p style="font-size:14.5px;line-height:1.65;color:#3b3568;margin-bottom:5px;"><i class="fas fa-check" style="color:${sc};font-size:11px;margin-right:7px;"></i>${esc(p)}</p>`).join('')}
          </div>` : ''}
          ${(o.considerations || []).length ? `
          <div style="background:#fffaf0;border-radius:12px;padding:12px 14px;">
            ${o.considerations.map((p) => `<p style="font-size:13.5px;line-height:1.6;color:#92700c;margin-bottom:4px;"><i class="fas fa-circle-info" style="font-size:11px;margin-right:6px;"></i>${esc(p)}</p>`).join('')}
          </div>` : ''}
        </div>`).join('');
      html += section('제안된 치료 옵션', 'fas fa-clipboard-list', cards);
    }

    // 5. 상담 중 질문과 답변
    if (c.qna && c.qna.length) {
      html += section('상담 중 나눈 질문과 답변', 'fas fa-comments', c.qna.map((q) => `
        <div style="margin-bottom:16px;">
          <div style="display:flex;gap:10px;margin-bottom:8px;">
            <div style="width:26px;height:26px;border-radius:8px;background:${pc};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">Q</div>
            <p style="font-size:15.5px;font-weight:700;color:#17123a;line-height:1.6;padding-top:2px;">${esc(q.question)}</p>
          </div>
          <div style="display:flex;gap:10px;">
            <div style="width:26px;height:26px;border-radius:8px;background:${sc}22;color:${sc.length === 7 ? sc : '#0891b2'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">A</div>
            <p style="font-size:15.5px;color:#3b3568;line-height:1.7;padding-top:2px;">${esc(q.answer)}</p>
          </div>
        </div>`).join(''));
    }

    // 6. 다음 단계 + 예약 버튼
    if (c.next_steps && c.next_steps.guidance) {
      html += section('다음 단계', 'fas fa-route', `
        <p style="font-size:16px;line-height:1.75;color:#3b3568;margin-bottom:14px;">${esc(c.next_steps.guidance)}</p>
        ${(c.next_steps.preparation || []).length ? `
        <div style="background:#f8f7fd;border-radius:14px;padding:16px 18px;margin-bottom:18px;">
          <p style="font-size:12px;font-weight:800;color:#94a3b8;margin-bottom:8px;">예약 전 준비사항</p>
          ${c.next_steps.preparation.map((p) => `<p style="font-size:14.5px;line-height:1.7;color:#3b3568;">· ${esc(p)}</p>`).join('')}
        </div>` : ''}
        ${b.booking_url ? `
        <a href="${esc(b.booking_url)}" id="tr-booking-btn"
          style="display:block;text-align:center;background:linear-gradient(135deg,${pc},${pc}dd);color:#fff;font-size:16px;font-weight:800;padding:17px;border-radius:16px;text-decoration:none;box-shadow:0 8px 24px ${pc}44;">
          <i class="fas fa-calendar-check" style="margin-right:8px;"></i>예약하기
        </a>` : b.clinic_phone ? `
        <a href="tel:${esc(b.clinic_phone)}" id="tr-booking-btn"
          style="display:block;text-align:center;background:linear-gradient(135deg,${pc},${pc}dd);color:#fff;font-size:16px;font-weight:800;padding:17px;border-radius:16px;text-decoration:none;box-shadow:0 8px 24px ${pc}44;">
          <i class="fas fa-phone" style="margin-right:8px;"></i>전화로 예약하기
        </a>` : ''}`);
    }

    // 7. 담당 의료진
    const staff = b.staff_profiles || [];
    if (staff.length) {
      html += section('담당 의료진', 'fas fa-user-doctor', staff.map((s) => `
        <div style="display:flex;gap:14px;align-items:center;background:#fff;border:1px solid #ece9f8;border-radius:18px;padding:16px;margin-bottom:10px;">
          ${s.photo_url ? `<img src="${esc(s.photo_url)}" style="width:64px;height:64px;border-radius:16px;object-fit:cover;">`
            : `<div style="width:64px;height:64px;border-radius:16px;background:${pc}14;display:flex;align-items:center;justify-content:center;"><i class="fas fa-user-doctor" style="color:${pc};font-size:22px;"></i></div>`}
          <div>
            <p style="font-size:16px;font-weight:800;color:#17123a;">${esc(s.name)} <span style="font-size:12px;font-weight:600;color:#94a3b8;">${esc(s.role || '')}</span></p>
            ${s.intro ? `<p style="font-size:13.5px;line-height:1.6;color:#64748b;margin-top:3px;">${esc(s.intro)}</p>` : ''}
          </div>
        </div>`).join(''));
    }

    // 8. 병원 정보
    if (b.clinic_address || b.clinic_phone || b.clinic_hours) {
      html += section('병원 정보', 'fas fa-hospital', `
        <div style="background:#fff;border:1px solid #ece9f8;border-radius:18px;padding:20px;">
          <p style="font-size:16px;font-weight:800;color:#17123a;margin-bottom:12px;">${esc(clinic)}</p>
          ${b.clinic_address ? `<p style="font-size:14.5px;line-height:1.7;color:#3b3568;margin-bottom:6px;"><i class="fas fa-location-dot" style="color:${pc};width:18px;"></i> ${esc(b.clinic_address)}</p>` : ''}
          ${b.clinic_phone ? `<p style="font-size:14.5px;line-height:1.7;color:#3b3568;margin-bottom:6px;"><i class="fas fa-phone" style="color:${pc};width:18px;"></i> <a href="tel:${esc(b.clinic_phone)}" style="color:${pc};font-weight:700;text-decoration:none;">${esc(b.clinic_phone)}</a></p>` : ''}
          ${b.clinic_hours ? `<p style="font-size:14.5px;line-height:1.7;color:#3b3568;white-space:pre-line;"><i class="fas fa-clock" style="color:${pc};width:18px;"></i> ${esc(b.clinic_hours)}</p>` : ''}
        </div>`);
    }

    // 공유/저장 액션 바
    html += `
    <section style="max-width:480px;margin:0 auto;padding:32px 24px 0;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="tr-share-btn" style="padding:15px;border-radius:14px;border:1.5px solid ${pc}33;background:#fff;color:${pc};font-size:14.5px;font-weight:800;">
          <i class="fas fa-share-nodes" style="margin-right:6px;"></i>가족에게 공유
        </button>
        <button id="tr-pdf-btn" style="padding:15px;border-radius:14px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-size:14.5px;font-weight:800;">
          <i class="fas fa-file-pdf" style="margin-right:6px;"></i>PDF로 저장
        </button>
      </div>
    </section>`;

    // 9. 고지 문구 (고정)
    html += `
    <footer style="max-width:480px;margin:40px auto 0;padding:28px 24px 48px;border-top:1px solid #f1f0fa;">
      <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin-bottom:6px;">· 본 보고서는 상담 내용을 요약한 참고 자료이며, 최종 치료 계획은 담당 의료진의 진단에 따릅니다.</p>
      <p style="font-size:12px;line-height:1.8;color:#94a3b8;margin-bottom:14px;">· 기재된 비용은 상담 시점 기준 예상 금액이며, 실제 치료 과정에서 변동될 수 있습니다.</p>
      <p style="font-size:11px;color:#cbd5e1;">보고서 번호 ${esc(data.report_no)} · 발송 ${esc((data.sent_at || '').slice(0, 10))}</p>
    </footer>`;

    $('tr-report').innerHTML = html;
    show('tr-report');
    document.body.style.background = '#ffffff';

    // 이벤트 바인딩
    const bookBtn = $('tr-booking-btn');
    if (bookBtn) bookBtn.addEventListener('click', () => track('booking_clicked'));

    $('tr-pdf-btn').addEventListener('click', () => {
      track('pdf_saved');
      window.print();
    });

    $('tr-share-btn').addEventListener('click', async () => {
      track('shared');
      const shareData = { title: document.title, url: location.href.split('#')[0] };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (e) {}
      } else {
        try {
          await navigator.clipboard.writeText(shareData.url);
          alert('보고서 링크가 복사되었습니다. 카카오톡에 붙여넣어 공유하세요.');
        } catch (e) {
          prompt('아래 링크를 복사하세요', shareData.url);
        }
      }
    });
  }

  // ---------- 부트 ----------
  async function boot() {
    let meta;
    try {
      const res = await fetch(`/api/touch-report/public/${token}/meta`);
      meta = await res.json();
      if (!meta.success) return fail(meta.error);
    } catch (e) {
      return fail('네트워크 연결을 확인해주세요.');
    }

    const load = async (authValue) => {
      const { status, json } = await api('', { auth_value: authValue });
      if (json.success) return render(json.data);
      if (status === 401) {
        $('tr-auth-error').textContent = authValue ? '인증 정보가 일치하지 않습니다. 다시 확인해주세요.' : '';
        $('tr-auth-error').classList.toggle('hidden', !authValue);
        show('tr-auth');
        return;
      }
      fail(json.error);
    };

    if (meta.data.needs_auth) {
      $('tr-auth-clinic').textContent = `${meta.data.clinic_name} 상담 보고서`;
      show('tr-auth');
      const btn = $('tr-auth-btn');
      const input = $('tr-auth-input');
      const submit = () => {
        const v = input.value.trim();
        if (v.length !== 4) { $('tr-auth-error').textContent = '4자리를 입력해주세요'; $('tr-auth-error').classList.remove('hidden'); return; }
        btn.disabled = true; btn.textContent = '확인 중...';
        load(v).finally(() => { btn.disabled = false; btn.textContent = '확인'; });
      };
      btn.addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      input.focus();
    } else {
      load(null);
    }
  }

  boot();
})();
