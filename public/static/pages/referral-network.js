// Patient Referral Network — D3 force-directed graph
// v7.3: Visualize patient-to-patient referral relationships

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmtAmount = (n) => {
    n = n || 0;
    if (n >= 10000) return (n / 10000).toFixed(0) + '만원';
    return n.toLocaleString() + '원';
  };
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // ---- Auth ----
  function getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  async function api(path, opts = {}) {
    const token = getToken();
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(opts.headers || {})
      },
      credentials: 'include'
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('unauthorized');
    }
    return res.json();
  }

  // ---- Color scheme by referral source ----
  const SOURCE_COLOR = {
    '지인소개': '#10b981',  // emerald
    '네이버광고': '#f59e0b', // amber
    '구글광고': '#f97316',  // orange
    '인스타그램': '#ec4899', // pink
    '미지정': '#94a3b8',   // surface-400
  };
  const colorFor = (src) => SOURCE_COLOR[src] || '#6366f1';

  // ---- Render hero impact card (TOP 인플루언서 강조) ----
  function renderHero(topInfluencers, stats) {
    const hero = $('heroImpact');
    if (!hero) return;
    if (!topInfluencers || topInfluencers.length === 0) {
      hero.classList.add('hidden');
      return;
    }
    const top = topInfluencers[0];
    const downstream = top.downstream_count || 0;
    const revenue = top.downstream_revenue || 0;
    const revenueManwon = Math.round(revenue / 10000).toLocaleString('ko-KR');
    const nameEl = $('heroName');
    const dsEl = $('heroDownstream');
    const revEl = $('heroRevenue');
    const depEl = $('heroDepth');
    if (nameEl) nameEl.textContent = top.name || '-';
    if (dsEl) dsEl.textContent = downstream;
    if (revEl) revEl.textContent = revenueManwon;
    if (depEl) depEl.textContent = stats.max_depth || 0;
    hero.classList.remove('hidden');
  }

  // ---- Render stats KPI cards ----
  function renderStats(stats) {
    const el = $('networkStats');
    el.innerHTML = `
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-surface-100">
        <p class="text-[10px] text-surface-400 mb-1">전체 환자</p>
        <p class="text-2xl font-bold text-surface-900">${stats.total_patients}<span class="text-xs text-surface-400 ml-1">명</span></p>
        <p class="text-[10px] text-surface-500 mt-1">루트 ${stats.root_patients} · 소개 ${stats.referred_patients}</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-surface-100">
        <p class="text-[10px] text-surface-400 mb-1">총 소개 건수</p>
        <p class="text-2xl font-bold text-emerald-600">${stats.total_referrals}<span class="text-xs text-surface-400 ml-1">건</span></p>
        <p class="text-[10px] text-surface-500 mt-1">최대 깊이 ${stats.max_depth}단계</p>
      </div>
      <div class="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-4 shadow-sm text-white">
        <p class="text-[10px] text-white/70 mb-1">K-Factor</p>
        <p class="text-2xl font-bold">${stats.k_factor.toFixed(2)}</p>
        <p class="text-[10px] text-white/80 mt-1">환자당 평균 소개수</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-surface-100">
        <p class="text-[10px] text-surface-400 mb-1">소개 비율</p>
        <p class="text-2xl font-bold text-amber-600">${stats.total_patients > 0 ? Math.round((stats.referred_patients / stats.total_patients) * 100) : 0}<span class="text-xs text-surface-400 ml-1">%</span></p>
        <p class="text-[10px] text-surface-500 mt-1">전체 중 소개 유입</p>
      </div>
    `;
    el.classList.remove('hidden');
    el.classList.add('grid');
  }

  // ---- Render top influencers ----
  function renderInfluencers(list) {
    const el = $('topInfluencers');
    if (!list || list.length === 0) {
      el.innerHTML = '<li class="text-xs text-surface-400">아직 소개를 만든 환자가 없습니다</li>';
      return;
    }
    el.innerHTML = list.map((n, i) => {
      const rank = i + 1;
      const rankClr = rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-surface-200 text-surface-700' : 'bg-surface-100 text-surface-600';
      return `
        <li class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-50 cursor-pointer" data-pid="${escapeHtml(n.id)}">
          <span class="w-6 h-6 rounded-full ${rankClr} text-[11px] font-bold flex items-center justify-center flex-shrink-0">${rank}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-surface-900 truncate">${escapeHtml(n.name)}</p>
            <p class="text-[10px] text-surface-500">직접 ${n.direct_referrals}명 · 누적 ${n.downstream_count}명</p>
          </div>
          <span class="text-[10px] font-bold text-emerald-600">${fmtAmount(n.downstream_revenue)}</span>
        </li>
      `;
    }).join('');
    // Wire up click → select node
    el.querySelectorAll('li[data-pid]').forEach(li => {
      li.addEventListener('click', () => selectNode(li.dataset.pid));
    });
  }

  // ---- Render source breakdown ----
  function renderSourceBreakdown(breakdown) {
    const el = $('sourceBreakdown');
    const entries = Object.entries(breakdown).sort((a, b) => b[1].count - a[1].count);
    const totalRev = entries.reduce((s, [, v]) => s + v.revenue, 0);
    el.innerHTML = entries.map(([src, v]) => {
      const pct = totalRev > 0 ? Math.round((v.revenue / totalRev) * 100) : 0;
      return `
        <li class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" style="background:${colorFor(src)}"></span>
              <span class="font-semibold text-surface-700">${escapeHtml(src)}</span>
              <span class="text-surface-400">${v.count}명</span>
            </span>
            <span class="text-[10px] font-bold text-surface-900">${fmtAmount(v.revenue)}</span>
          </div>
          <div class="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
            <div class="h-full rounded-full transition-all" style="width:${pct}%;background:${colorFor(src)}"></div>
          </div>
        </li>
      `;
    }).join('');
  }

  // ---- Selected node detail ----
  let allNodes = [];
  function selectNode(id) {
    const n = allNodes.find(x => x.id === id);
    if (!n) return;
    $('nodeDetail').classList.remove('hidden');
    $('selectedName').textContent = n.name;
    $('selectedStats').innerHTML = `
      <div class="flex justify-between"><dt class="text-surface-500">유입경로</dt><dd class="font-semibold">${escapeHtml(n.referral_source)}</dd></div>
      <div class="flex justify-between"><dt class="text-surface-500">트리 깊이</dt><dd class="font-semibold">${n.depth}단계</dd></div>
      <div class="flex justify-between"><dt class="text-surface-500">직접 소개</dt><dd class="font-semibold text-emerald-600">${n.direct_referrals}명</dd></div>
      <div class="flex justify-between"><dt class="text-surface-500">하위 누적</dt><dd class="font-semibold text-emerald-700">${n.downstream_count}명</dd></div>
      <div class="flex justify-between"><dt class="text-surface-500">상담 건수</dt><dd class="font-semibold">${n.consultation_count}건</dd></div>
      <div class="flex justify-between"><dt class="text-surface-500">본인 수납</dt><dd class="font-semibold">${fmtAmount(n.paid_amount)}</dd></div>
      <div class="flex justify-between border-t border-brand-100 pt-1.5 mt-1.5"><dt class="text-brand-700 font-semibold">하위 누적 매출</dt><dd class="font-bold text-brand-700">${fmtAmount(n.downstream_revenue)}</dd></div>
    `;
    $('selectedLink').href = '/patients/' + encodeURIComponent(n.id);

    // Highlight in graph
    d3.selectAll('#referralGraph .node circle')
      .attr('stroke-width', d => d.id === id ? 4 : 2)
      .attr('stroke', d => d.id === id ? '#6366f1' : '#ffffff');
  }

  // ---- D3 force graph ----
  function renderGraph(nodes, edges) {
    allNodes = nodes;
    const svg = d3.select('#referralGraph');
    svg.selectAll('*').remove();

    const container = $('graphContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Arrow marker for edges
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    const g = svg.append('g');

    // Zoom/pan support
    svg.call(d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (e) => g.attr('transform', e.transform))
    );

    // Mutable clones for force simulation (D3 mutates these)
    const simNodes = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e }));

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id(d => d.id).distance(80).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 4));

    const link = g.append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(simEdges)
      .enter().append('line')
      .attr('marker-end', 'url(#arrow)');

    const node = g.append('g')
      .selectAll('g.node')
      .data(simNodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    function nodeRadius(d) {
      return Math.max(10, Math.min(28, 10 + Math.sqrt(d.downstream_count + 1) * 4));
    }

    node.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => colorFor(d.referral_source))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', d => d.is_vip ? 1 : 0.85);

    // VIP crown badge
    node.filter(d => d.is_vip)
      .append('text')
      .attr('y', d => -nodeRadius(d) - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text('👑');

    node.append('text')
      .attr('y', d => nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#334155')
      .attr('font-weight', '600')
      .text(d => d.name);

    // Interactivity
    const tooltip = $('nodeTooltip');
    node.on('mouseenter', (e, d) => {
      tooltip.innerHTML = `
        <div class="font-bold mb-0.5">${escapeHtml(d.name)}</div>
        <div>직접 ${d.direct_referrals}명 · 하위 ${d.downstream_count}명</div>
        <div class="text-emerald-300">${fmtAmount(d.downstream_revenue)}</div>
      `;
      tooltip.classList.remove('hidden');
    });
    node.on('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tooltip.style.left = (e.clientX - rect.left + 10) + 'px';
      tooltip.style.top = (e.clientY - rect.top + 10) + 'px';
    });
    node.on('mouseleave', () => tooltip.classList.add('hidden'));
    node.on('click', (e, d) => selectNode(d.id));

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  // ---- Main load ----
  async function load() {
    $('networkLoading').classList.remove('hidden');
    $('networkBody').classList.add('hidden');
    $('networkStats').classList.add('hidden');
    $('networkEmpty').classList.add('hidden');

    try {
      const res = await api('/api/patients/network/graph');
      if (!res.success) throw new Error(res.error || 'unknown');

      const { nodes, edges, stats, source_breakdown, top_influencers } = res.data;

      $('networkLoading').classList.add('hidden');

      if (!nodes || nodes.length === 0) {
        $('networkEmpty').classList.remove('hidden');
        $('networkEmpty').classList.add('flex');
        return;
      }

      renderHero(top_influencers, stats);
      renderStats(stats);
      renderInfluencers(top_influencers);
      renderSourceBreakdown(source_breakdown);

      $('networkBody').classList.remove('hidden');
      $('networkBody').classList.add('grid');

      // Ensure D3 is loaded then render
      const drawWhenReady = () => {
        if (window.d3) renderGraph(nodes, edges);
        else setTimeout(drawWhenReady, 50);
      };
      drawWhenReady();
    } catch (err) {
      console.error('Network load error:', err);
      $('networkLoading').innerHTML = `
        <i class="fas fa-triangle-exclamation text-3xl text-rose-400"></i>
        <p class="text-sm text-rose-500 mt-2">데이터 로드 실패</p>
        <p class="text-xs text-surface-400 mt-1">${escapeHtml(err.message || '')}</p>
      `;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    load();
    $('refreshNetwork')?.addEventListener('click', load);
  });
})();
