// =========================================
// LEVEL SYSTEM - Patient Touch 상담 레벨 시스템
// 모든 페이지에서 공유하는 레벨 유틸리티
// =========================================

var LEVELS = [
  { min: 0,  max: 39,  level: 1, title: '새싹 상담사',    emoji: '🌱', color: 'emerald',  gradient: 'from-emerald-400 to-green-500' },
  { min: 40, max: 54,  level: 2, title: '성장하는 상담사', emoji: '🌿', color: 'teal',     gradient: 'from-teal-400 to-emerald-500' },
  { min: 55, max: 69,  level: 3, title: '능숙한 상담사',   emoji: '🌳', color: 'sky',      gradient: 'from-sky-400 to-blue-500' },
  { min: 70, max: 79,  level: 4, title: '프로 상담사',     emoji: '⭐', color: 'brand',    gradient: 'from-brand-500 to-indigo-600' },
  { min: 80, max: 89,  level: 5, title: '엘리트 상담사',   emoji: '💎', color: 'purple',   gradient: 'from-purple-500 to-fuchsia-600' },
  { min: 90, max: 100, level: 6, title: '마스터 상담사',   emoji: '👑', color: 'amber',    gradient: 'from-amber-400 to-orange-500' }
];

function getLevel(score) {
  score = Math.max(0, Math.min(100, score || 0));
  for (var i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(score) {
  var current = getLevel(score);
  if (current.level >= 6) return null;
  return LEVELS[current.level]; // next level (0-indexed: level-1 is index, so level is next index)
}

function getExpProgress(score) {
  var lv = getLevel(score);
  var next = getNextLevel(score);
  if (!next) return { current: score, needed: 0, percent: 100, toNext: 0 };
  var rangeSize = next.min - lv.min;
  var progress = score - lv.min;
  var percent = rangeSize > 0 ? Math.round((progress / rangeSize) * 100) : 100;
  return { current: progress, needed: rangeSize, percent: percent, toNext: next.min - score };
}

// Render level badge (small inline)
function levelBadge(score, size) {
  var lv = getLevel(score);
  size = size || 'sm';
  if (size === 'xs') {
    return '<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-' + lv.color + '-100 text-' + lv.color + '-700 text-[9px] font-bold">' +
      lv.emoji + ' Lv.' + lv.level + '</span>';
  }
  return '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-' + lv.color + '-100 text-' + lv.color + '-700 text-[10px] font-bold">' +
    lv.emoji + ' Lv.' + lv.level + ' ' + lv.title + '</span>';
}

// Render EXP bar with next level info
function expBar(score, showLabel) {
  var lv = getLevel(score);
  var exp = getExpProgress(score);
  var next = getNextLevel(score);
  
  var label = '';
  if (showLabel !== false) {
    label = next
      ? '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-[10px] font-bold text-' + lv.color + '-600">' + lv.emoji + ' Lv.' + lv.level + ' ' + lv.title + '</span>' +
          '<span class="text-[10px] text-surface-400">다음: ' + next.emoji + ' Lv.' + next.level + ' (' + exp.toNext + '점 남음)</span>' +
        '</div>'
      : '<div class="flex items-center justify-between mb-1">' +
          '<span class="text-[10px] font-bold text-' + lv.color + '-600">' + lv.emoji + ' Lv.' + lv.level + ' ' + lv.title + '</span>' +
          '<span class="text-[10px] text-amber-500 font-bold">🏆 MAX LEVEL</span>' +
        '</div>';
  }
  
  return label +
    '<div class="h-2 bg-surface-100 rounded-full overflow-hidden">' +
      '<div class="h-full bg-gradient-to-r ' + lv.gradient + ' rounded-full transition-all duration-1000 ease-out" style="width:' + exp.percent + '%"></div>' +
    '</div>';
}

// Nudge message for home page
function levelNudge(score, totalSessions) {
  var lv = getLevel(score);
  var exp = getExpProgress(score);
  var next = getNextLevel(score);
  
  if (!next) return '👑 마스터 레벨 달성! 당신은 이미 최고의 상담사입니다.';
  
  if (exp.toNext <= 3) return '🔥 ' + next.emoji + ' Lv.' + next.level + '까지 단 ' + exp.toNext + '점! 다음 상담에서 돌파하세요!';
  if (exp.toNext <= 7) return '💪 ' + next.emoji + ' ' + next.title + '까지 ' + exp.toNext + '점 남았어요. 거의 다 왔습니다!';
  if (exp.toNext <= 15) return '📈 꾸준히 성장 중! ' + next.emoji + ' ' + next.title + '까지 ' + exp.toNext + '점 남았어요.';
  if (totalSessions <= 2) return '🌱 상담을 더 분석할수록 실력이 눈에 보입니다. 계속 도전하세요!';
  return '💡 ' + lv.title + '에서 한 단계 더! ' + next.title + '을 향해 나아가고 있어요.';
}

// Level-up celebration check
function checkLevelUp(prevScore, currentScore) {
  if (!prevScore || !currentScore) return null;
  var prevLv = getLevel(prevScore);
  var curLv = getLevel(currentScore);
  if (curLv.level > prevLv.level) {
    return { from: prevLv, to: curLv, isLevelUp: true };
  }
  return null;
}

// Show level-up celebration overlay
function showLevelUpCelebration(fromLevel, toLevel, score) {
  var overlay = document.createElement('div');
  overlay.id = 'levelUpOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);animation:fadeIn 0.3s ease-out';
  
  overlay.innerHTML =
    '<div style="animation:bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" class="text-center px-8 py-10 max-w-xs">' +
      // Confetti particles
      '<div class="relative mb-4">' +
        '<div style="font-size:72px;animation:pulse 1s ease-in-out infinite">' + toLevel.emoji + '</div>' +
        '<div class="absolute -top-2 -left-4" style="font-size:24px;animation:floatUp 2s ease-out infinite">✨</div>' +
        '<div class="absolute -top-4 right-0" style="font-size:20px;animation:floatUp 2s ease-out 0.3s infinite">🎉</div>' +
        '<div class="absolute top-2 -right-6" style="font-size:18px;animation:floatUp 2s ease-out 0.6s infinite">⭐</div>' +
      '</div>' +
      '<p class="text-amber-400 text-lg font-black tracking-wider mb-2" style="animation:slideUp 0.5s ease-out 0.3s both">LEVEL UP!</p>' +
      '<p class="text-white text-3xl font-black mb-1" style="animation:slideUp 0.5s ease-out 0.4s both">Lv.' + toLevel.level + '</p>' +
      '<p class="text-white/90 text-lg font-bold mb-4" style="animation:slideUp 0.5s ease-out 0.5s both">' + toLevel.title + '</p>' +
      '<div class="bg-white/10 rounded-2xl p-4 mb-6" style="animation:slideUp 0.5s ease-out 0.6s both">' +
        '<p class="text-white/60 text-xs mb-1">Lv.' + fromLevel.level + ' ' + fromLevel.title + ' → Lv.' + toLevel.level + ' ' + toLevel.title + '</p>' +
        '<p class="text-white text-2xl font-black">' + score + '<span class="text-sm text-white/60">점</span></p>' +
      '</div>' +
      '<button onclick="this.closest(\'#levelUpOverlay\').remove()" class="px-8 py-3 bg-gradient-to-r ' + toLevel.gradient + ' text-white rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-transform" style="animation:slideUp 0.5s ease-out 0.7s both">계속하기</button>' +
    '</div>';
  
  document.body.appendChild(overlay);
  
  // Auto-dismiss after 8 seconds
  setTimeout(function() {
    var el = document.getElementById('levelUpOverlay');
    if (el) { el.style.animation = 'fadeOut 0.3s ease-in forwards'; setTimeout(function(){ el.remove(); }, 300); }
  }, 8000);
}

// Show personal best celebration
function showPersonalBestCelebration(score) {
  var overlay = document.createElement('div');
  overlay.id = 'pbOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);animation:fadeIn 0.3s ease-out';
  
  overlay.innerHTML =
    '<div style="animation:bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1)" class="text-center px-8 py-8 max-w-xs">' +
      '<div style="font-size:56px;animation:pulse 1s ease-in-out infinite" class="mb-3">🏆</div>' +
      '<p class="text-amber-400 text-sm font-black tracking-widest mb-2">NEW PERSONAL BEST!</p>' +
      '<p class="text-white text-4xl font-black mb-2">' + score + '<span class="text-lg text-white/60">점</span></p>' +
      '<p class="text-white/70 text-sm mb-6">역대 최고 점수를 달성했어요!</p>' +
      '<button onclick="this.closest(\'#pbOverlay\').remove()" class="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-bold text-sm shadow-lg hover:scale-105 transition-transform">멋져요! 👏</button>' +
    '</div>';
  
  document.body.appendChild(overlay);
  setTimeout(function() {
    var el = document.getElementById('pbOverlay');
    if (el) { el.style.animation = 'fadeOut 0.3s ease-in forwards'; setTimeout(function(){ el.remove(); }, 300); }
  }, 6000);
}

// Show streak celebration
function showStreakBadge(streakCount) {
  if (streakCount < 2) return '';
  var flames = streakCount >= 5 ? '🔥🔥🔥' : streakCount >= 3 ? '🔥🔥' : '🔥';
  return '<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[9px] font-bold">' +
    flames + ' ' + streakCount + '연속 성장</span>';
}

// CSS animations (inject once)
(function injectLevelAnimations() {
  if (document.getElementById('levelAnimStyles')) return;
  var style = document.createElement('style');
  style.id = 'levelAnimStyles';
  style.textContent = 
    '@keyframes fadeIn{from{opacity:0}to{opacity:1}}' +
    '@keyframes fadeOut{from{opacity:1}to{opacity:0}}' +
    '@keyframes bounceIn{0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.05)}70%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}' +
    '@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}' +
    '@keyframes floatUp{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-15px);opacity:0.5}}' +
    '@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}' +
    '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}';
  document.head.appendChild(style);
})();
