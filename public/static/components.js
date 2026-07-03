// =====================================================
// Patient Touch — Shared UI Components (v8.6)
// 부채 상환 1차: 페이지 JS들에 흩어진 중복 패턴 통합
//   - 상담 상태 맵/배지 (3곳+ 중복 → 1곳)
//   - 아바타 컬러 해시 (7곳 중복 → 1곳)
//   - 연락 결과/치료 상태 라벨
//   - 바텀시트/모달 공통 헬퍼
// 전역 네임스페이스: window.PT
// 의존: utils.js (esc, fmtWon, fmtDate) — renderer에서 먼저 로드됨
// =====================================================
(function() {
  'use strict';

  var PT = {};

  // ---------- 1. 상담 상태 (Single Source of Truth) ----------
  PT.CONSULT_STATUS = {
    paid:      { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '결제완료', dot: 'bg-emerald-500', border: 'border-l-emerald-400' },
    undecided: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: '미결정',   dot: 'bg-amber-500',   border: 'border-l-amber-400' },
    lost:      { bg: 'bg-rose-50',    text: 'text-rose-700',    label: '이탈',     dot: 'bg-rose-500',    border: 'border-l-rose-400' },
    pending:   { bg: 'bg-surface-50', text: 'text-surface-600', label: '대기중',   dot: 'bg-surface-400', border: 'border-l-surface-300' }
  };

  PT.status = function(key) {
    return PT.CONSULT_STATUS[key] || PT.CONSULT_STATUS.pending;
  };

  /**
   * 상담 상태 배지 HTML
   * @param {string} key - paid|undecided|lost|pending
   * @param {object} [opt] - { dot: true(기본), size: 'xs'|'sm' }
   */
  PT.statusBadge = function(key, opt) {
    opt = opt || {};
    var s = PT.status(key);
    var sizeCls = opt.size === 'sm' ? 'text-xs px-2 py-1' : 'text-[10px] px-1.5 py-0.5';
    var dot = opt.dot === false ? '' : '<span class="w-1.5 h-1.5 rounded-full ' + s.dot + '"></span>';
    return '<span class="inline-flex items-center gap-1 ' + sizeCls + ' rounded-md font-semibold ' + s.bg + ' ' + s.text + '">' + dot + s.label + '</span>';
  };

  // ---------- 2. 기타 상태 라벨 (타임라인/연락 기록) ----------
  PT.TREATMENT_STATUS = { completed: '완료', in_progress: '진행중', scheduled: '예약됨', consulted: '상담완료' };
  PT.CONTACT_RESULT = { connected: '통화성공', no_answer: '부재중', message_sent: '메시지발송', callback_promised: '콜백약속', appointment_booked: '예약완료', refused: '거절', success: '연결', busy: '통화중' };
  PT.CONTACT_OUTCOME = { booked: '예약완료', callback: '재연락', hold: '보류', rejected: '거절' };

  // ---------- 3. 아바타 (이름 해시 → 컬러 + 이니셜) ----------
  PT.AVATAR_COLORS = [
    'bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700',
    'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700'
  ];

  PT.avatarColor = function(name) {
    if (!name) return PT.AVATAR_COLORS[0];
    return PT.AVATAR_COLORS[String(name).charCodeAt(0) % PT.AVATAR_COLORS.length];
  };

  /**
   * 아바타 HTML
   * @param {string} name - 표시할 이름 (첫 글자 = 이니셜)
   * @param {string} [sizeCls] - 크기/모양 클래스 (기본: 'w-10 h-10 rounded-xl text-sm')
   */
  PT.avatar = function(name, sizeCls) {
    sizeCls = sizeCls || 'w-10 h-10 rounded-xl text-sm';
    var initial = name ? esc(String(name).charAt(0)) : '?';
    return '<div class="' + sizeCls + ' ' + PT.avatarColor(name) + ' flex items-center justify-center font-bold shrink-0">' + initial + '</div>';
  };

  // ---------- 4. 바텀시트 / 모달 공통 헬퍼 ----------
  /**
   * 바텀시트 열기 (모바일: 하단 슬라이드업 / 데스크톱: 중앙 모달)
   * @param {string} id - 시트 DOM id (중복 방지)
   * @param {string} innerHtml - 시트 내부 HTML (흰 카드 내용물)
   * @param {object} [opt] - { maxWidth: 'sm:max-w-md', onClose: fn }
   * @returns {HTMLElement} 생성된 오버레이 엘리먼트
   */
  PT.openSheet = function(id, innerHtml, opt) {
    opt = opt || {};
    PT.closeSheet(id);
    var wrap = document.createElement('div');
    wrap.id = id;
    wrap.className = 'fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center';
    wrap.innerHTML = '<div class="bg-white w-full ' + (opt.maxWidth || 'sm:max-w-md') + ' rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">' + innerHtml + '</div>';
    wrap.addEventListener('click', function(e) {
      if (e.target === wrap) { PT.closeSheet(id); if (opt.onClose) opt.onClose(); }
    });
    document.body.appendChild(wrap);
    return wrap;
  };

  PT.closeSheet = function(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  };

  /**
   * 시트 표준 헤더 HTML
   * @param {string} title
   * @param {string} [subtitle]
   * @param {string} [icon] - fa 클래스 (예: 'fas fa-shield-halved')
   * @param {string} [iconCls] - 아이콘 박스 색 (예: 'bg-rose-50 text-rose-500')
   */
  PT.sheetHeader = function(title, subtitle, icon, iconCls) {
    var h = '<div class="flex items-center gap-3 mb-4">';
    if (icon) {
      h += '<div class="w-10 h-10 rounded-xl ' + (iconCls || 'bg-brand-50 text-brand-600') + ' flex items-center justify-center"><i class="' + icon + '"></i></div>';
    }
    h += '<div class="flex-1 min-w-0"><h3 class="font-bold text-surface-900">' + esc(title) + '</h3>';
    if (subtitle) h += '<p class="text-[11px] text-surface-500">' + esc(subtitle) + '</p>';
    h += '</div></div>';
    return h;
  };

  // ---------- 5. 섹션 타이틀 (카드 내부 헤더) ----------
  /**
   * 카드 섹션 헤더 HTML — patient-detail.js의 sec()와 동일 패턴
   * @param {string} title
   * @param {string} icon - fa 클래스 + 텍스트 컬러 (예: 'fas fa-user text-brand-600')
   * @param {string} iconBg - 아이콘 박스 배경 (예: 'bg-brand-50')
   */
  PT.sectionHeader = function(title, icon, iconBg) {
    return '<div class="flex items-center gap-2 mb-3">' +
      '<div class="w-7 h-7 rounded-lg ' + iconBg + ' flex items-center justify-center"><i class="' + icon + ' text-xs"></i></div>' +
      '<h3 class="font-bold text-sm text-surface-900">' + esc(title) + '</h3></div>';
  };

  // ---------- 6. 원문 뷰어 연결 요소 (v8.6.1: 11곳 중복 → 1곳) ----------
  /**
   * 클릭하면 원문 뷰어가 열리는 환자 이름 요소
   * @param {string} patientId
   * @param {string} name
   * @param {object} [opt] - { tag:'span'|'h2'|'p', cls: 추가 클래스, suffix: '님' 등, stop: true면 이벤트 전파 차단, fallbackCls: id 없을 때 클래스 }
   */
  PT.patientNameLink = function(patientId, name, opt) {
    opt = opt || {};
    var tag = opt.tag || 'span';
    var safeName = esc(name || '');
    var suffix = opt.suffix || '';
    if (!patientId || !safeName) {
      return '<' + tag + ' class="' + (opt.fallbackCls || 'font-bold text-sm') + '">' + (safeName || opt.emptyText || '') + suffix + '</' + tag + '>';
    }
    var jsName = safeName.replace(/'/g, "\\'");
    var stop = opt.stop ? 'event.preventDefault();event.stopPropagation();' : '';
    var cls = opt.cls || 'font-bold text-sm text-brand-700 underline decoration-dotted decoration-brand-300 underline-offset-2 active:opacity-60';
    return '<' + tag + ' onclick="' + stop + 'openTranscriptViewer(\'' + patientId + '\', \'' + jsName + '\')" class="' + cls + ' cursor-pointer">' + safeName + suffix + '</' + tag + '>';
  };

  /**
   * 원문 뷰어를 여는 작은 스크롤(📜) 버튼
   * @param {string} patientId
   * @param {string} name
   */
  PT.transcriptBtn = function(patientId, name) {
    if (!patientId) return '';
    var jsName = esc(name || '').replace(/'/g, "\\'");
    return '<button onclick="event.preventDefault();event.stopPropagation();openTranscriptViewer(\'' + patientId + '\', \'' + jsName + '\')" title="상담 원문 보기" class="w-5 h-5 rounded-md bg-indigo-50 text-indigo-500 hover:bg-indigo-100 flex items-center justify-center active:scale-90 transition-all"><i class="fas fa-scroll text-[8px]"></i></button>';
  };

  // ---------- 7. 스코어 컬러 (상담 점수 60/80 기준) ----------
  PT.scoreColor = function(score) {
    return score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  };

  window.PT = PT;
})();
