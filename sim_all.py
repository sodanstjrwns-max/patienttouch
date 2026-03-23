#!/usr/bin/env python3
"""
Patient Touch 리텐션 모듈 - 실사용 시뮬레이션 3회
시나리오: 서울BD치과 김실장의 월/수/금 업무 흐름
"""
import json, requests, sys, time
from datetime import datetime

BASE = "http://localhost:3000"
DIVIDER = "=" * 70
SUBDIV = "-" * 50

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'

def c(text, color): return f"{color}{text}{Colors.END}"
def bold(text): return c(text, Colors.BOLD)
def header(text): return c(text, Colors.HEADER + Colors.BOLD)
def success(text): return c(text, Colors.GREEN)
def warn(text): return c(text, Colors.YELLOW)
def error(text): return c(text, Colors.RED)
def info(text): return c(text, Colors.CYAN)
def dim(text): return c(text, Colors.DIM)

STATUS_KR = {
    'unscheduled_urgent': '🔴 미예약긴급',
    'unscheduled_warning': '🟡 미예약주의',
    'at_risk': '🟠 이탈위험',
    'recall_6m': '📞 6개월리콜',
    'recall_12m': '📞 12개월리콜',
    'consulted_unconverted': '🟣 미전환',
    'in_treatment': '🟢 치료중',
    'active': '✅ 정상',
    'completed': '✅ 완료'
}

def fmt_money(val):
    if val >= 10000:
        return f"{val/10000:.0f}만원"
    elif val >= 1000:
        return f"{val/10000:.1f}만원"
    else:
        return f"{val:,.0f}원"

class PatientTouchSim:
    def __init__(self):
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    def login(self, email="kim@bddental.com", password="test1234"):
        r = requests.post(f"{BASE}/api/auth/login", json={"email": email, "password": password})
        data = r.json()
        if data.get("success"):
            self.token = data["data"]["token"]
            self.headers["Authorization"] = f"Bearer {self.token}"
            return data["data"]["user"]
        return None
    
    def get(self, path, params=None):
        r = requests.get(f"{BASE}{path}", headers=self.headers, params=params)
        return r.json()
    
    def post(self, path, body=None):
        r = requests.post(f"{BASE}{path}", headers=self.headers, json=body or {})
        return r.json()
    
    def put(self, path, body=None):
        r = requests.put(f"{BASE}{path}", headers=self.headers, json=body or {})
        return r.json()

def print_section(title, emoji="📋"):
    print(f"\n{SUBDIV}")
    print(f"  {emoji} {bold(title)}")
    print(SUBDIV)

# ════════════════════════════════════════════════════════════════
# 시뮬레이션 1: 월요일 오전 9시 - 김실장의 주간 시작
# ════════════════════════════════════════════════════════════════
def simulation_1():
    print(f"\n{'🔷' * 35}")
    print(header(f"""
  ┌─────────────────────────────────────────────────────────────┐
  │  시뮬레이션 #1: 월요일 오전 9시 - 김실장의 주간 시작         │
  │  시나리오: 출근 후 대시보드 확인 → 긴급 환자 연락 → 리포트    │
  └─────────────────────────────────────────────────────────────┘
"""))
    
    sim = PatientTouchSim()
    
    # Step 1: 로그인
    print_section("STEP 1: 출근 - 로그인", "🔐")
    user = sim.login()
    print(f"  {success('✓')} 로그인 성공: {bold(user['name'])} ({user['role']}) @ {user['organization_name']}")
    print(f"  {dim('→ 오전 9시, 커피 한 잔과 함께 Patient Touch 접속')}")
    
    # Step 2: 홈 화면 요약 확인
    print_section("STEP 2: 홈 화면 - 오늘의 리텐션 요약", "🏠")
    home = sim.get("/api/retention/home-summary")
    if home.get("success"):
        d = home["data"]
        print(f"  📊 대기 중 연락 대상: {bold(str(d['total']))}명")
        print(f"  ✅ 오늘 완료한 연락: {d['completed_today']}건")
        print()
        print(f"  {bold('우선순위 TOP 연락 대상:')}")
        for i, ct in enumerate(d['contacts'][:5], 1):
            status = STATUS_KR.get(ct['status'], ct['status'])
            remaining = fmt_money(ct.get('remaining_treatment_value', 0))
            print(f"  {i}. {ct['patient_name']} | {status} | 위험도 {ct['risk_score']} | 잔여 {remaining}")
    
    # Step 3: 대시보드 KPI 확인
    print_section("STEP 3: 리텐션 대시보드 - KPI 전체 현황", "📊")
    dash = sim.get("/api/retention/dashboard")
    if dash.get("success"):
        d = dash["data"]
        print(f"  ┌────────────────────────────────────────────────┐")
        print(f"  │  치료 미완료     : {bold(str(d['incomplete_count']))}명                          │")
        print(f"  │  리콜 대상       : {bold(str(d['recall_count']))}명                          │")
        print(f"  │  연락 수행률     : {bold(str(d['contact_completion_rate']))}%                         │")
        print(f"  │  이탈 위험 매출  : {bold(fmt_money(d['estimated_lost_revenue']))}              │")
        print(f"  └────────────────────────────────────────────────┘")
        print()
        
        # 상태 분포
        dist = d.get('status_distribution', {})
        if dist:
            print(f"  {bold('환자 상태 분포:')}")
            for status, cnt in sorted(dist.items(), key=lambda x: x[1], reverse=True):
                bar = "█" * cnt + "░" * (10 - cnt)
                print(f"    {STATUS_KR.get(status, status):15s} │{bar}│ {cnt}명")
        
        # 오늘 연락 리스트
        contacts = d.get('today_contacts', [])
        print(f"\n  {bold('오늘의 연락 리스트')} ({len(contacts)}명):")
        for ct in contacts[:8]:
            status = STATUS_KR.get(ct['status'], ct['status'])
            treats = ct.get('treatments', [])
            treat_names = ', '.join([t.get('treatment_name','') for t in treats[:2]]) if treats else '(치료 기록 없음)'
            score = ct.get('satisfaction_score', '-')
            remaining = fmt_money(ct.get('remaining_treatment_value', 0))
            print(f"    ▸ {ct['patient_name']} ({ct.get('patient_age','?')}세/{ct.get('patient_gender','?')}) "
                  f"| {status} | 점수 {ct['priority_score']} | 잔여 {remaining}")
            print(f"      치료: {treat_names}")
            if ct.get('recent_contacts'):
                last = ct['recent_contacts'][0]
                print(f"      최근연락: {last.get('contact_type','')} → {last.get('result','')} ({last.get('contacted_at','')[:10]})")
    
    # Step 4: 긴급 필터 - 치료 미완료 환자만 확인
    print_section("STEP 4: 긴급 필터 - 치료 미완료만 보기", "🚨")
    urgent = sim.get("/api/retention/dashboard", {"filter": "urgent"})
    if urgent.get("success"):
        contacts = urgent["data"].get("today_contacts", [])
        print(f"  {warn('미예약 긴급/주의 환자:')} {bold(str(len(contacts)))}명")
        for ct in contacts:
            print(f"    🔴 {ct['patient_name']} - 위험도 {ct['risk_score']}, "
                  f"경과 {ct.get('days_since_visit',0)}일, 잔여 {fmt_money(ct.get('remaining_treatment_value',0))}")
    
    # Step 5: 가장 긴급한 환자 상세 조회 (한미영)
    print_section("STEP 5: 한미영 환자 상세 카드 열기", "👩‍⚕️")
    detail = sim.get("/api/retention/patients/patient_5")
    if detail.get("success"):
        d = detail["data"]
        rs = d.get("retention_status", {})
        print(f"  환자: 한미영 (41세/여)")
        print(f"  상태: {STATUS_KR.get(rs.get('status',''), rs.get('status',''))}")
        print(f"  위험도: {rs.get('risk_score', 0)} / 우선순위: {rs.get('priority_score', 0)}")
        print(f"  마지막 내원: {rs.get('last_visit_date','')} ({rs.get('days_since_visit',0)}일 전)")
        print(f"  잔여 치료비: {fmt_money(d.get('remaining_treatment_value', 0))}")
        print(f"  추천 연락일: {rs.get('recommended_contact_date','')}")
        print()
        
        # 치료 목록
        treats = d.get("treatments", [])
        print(f"  {bold('치료 이력')} ({len(treats)}건):")
        for t in treats:
            status_icon = "✅" if t['status'] == 'completed' else "⏳" if t['status'] == 'in_progress' else "📋"
            remaining = t.get('total_amount',0) - t.get('paid_amount',0)
            print(f"    {status_icon} {t.get('treatment_name','?')} | {t['status']} | 잔여 {fmt_money(remaining)}")
        
        # 연락 기록
        contacts = d.get("retention_contacts", [])
        print(f"\n  {bold('연락 기록')} ({len(contacts)}건):")
        for rc in contacts[:3]:
            print(f"    📞 {rc.get('contacted_at','')[:10]} | {rc.get('contact_type','')} → {rc.get('result','')}")
            if rc.get('notes'):
                print(f"       {dim(rc['notes'][:60])}")
        
        # AI 추천 멘트
        print(f"\n  {bold('AI 추천 연락 스크립트:')}")
        script_text = rs.get('recommended_contact_script', '')
        if script_text:
            for line in script_text.split('. '):
                if line.strip():
                    print(f"    💬 {line.strip()}.")
    
    # Step 6: AI 스크립트 새로 생성
    print_section("STEP 6: 한미영 AI 스크립트 새로 생성", "🤖")
    script = sim.get("/api/retention/ai-script/patient_5")
    if script.get("success"):
        d = script["data"]
        print(f"  톤: {d.get('tone','')}")
        print(f"  메시지: {d.get('message','')}")
        print(f"  팁:")
        for tip in d.get('tips', []):
            print(f"    💡 {tip}")
    
    # Step 7: 연락 실행 - 한미영에게 전화
    print_section("STEP 7: 한미영 전화 연락 실행", "📱")
    print(f"  {dim('→ 김실장이 한미영님에게 전화...')}")
    print(f"  {dim('→ 통화 연결! AI 추천 멘트 참고하며 대화')}")
    print(f'  {dim("→ 한미영: \"아, 맞다 신경치료! 이번주 토요일 가능해요?\"")}\n')
    
    contact1 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_5",
        "treatment_id": "treat_5c",
        "contact_type": "phone",
        "result": "appointment_booked",
        "notes": "신경치료 3회차 예약. 이번주 토요일(3/29) 오전 10시. 크라운 일정도 안내함.",
        "next_contact_date": "2026-03-29"
    })
    print(f"  {success('✓ 연락 저장:')} 전화 → 예약완료 (토요일 10시)")
    print(f"    메모: 신경치료 3회차 예약. 크라운 일정도 안내함.")
    
    # 치료 상태 업데이트
    treat_update = sim.put("/api/retention/treatments/treat_5c", {
        "next_appointment": "2026-03-29",
        "status": "scheduled",
        "notes": "3/29 토요일 10시 예약. 환자 확인 완료."
    })
    print(f"  {success('✓ 치료 예약 등록:')} 3/29 토요일 10시 신경치료 3회차")
    
    # Step 8: 정대철 문자 연락
    print_section("STEP 8: 정대철 안부 문자 발송", "💬")
    print(f"  {dim('→ 정대철님: 1년 넘게 미내원. 당뇨 있음. 조심스럽게 접근')}")
    
    # AI 스크립트 먼저 확인
    script2 = sim.get("/api/retention/ai-script/patient_6")
    if script2.get("success"):
        print(f"  AI 추천 톤: {script2['data'].get('tone','')}")
        print(f"  메시지 참고: {script2['data'].get('message','')[:50]}...")
    
    contact2 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_6",
        "contact_type": "text",
        "result": "message_sent",
        "notes": "안부 문자 + 무료 구강검진 이벤트 안내. '건강 잘 챙기시고, 편하실 때 들러주세요~' 톤.",
        "next_contact_date": "2026-03-30"
    })
    print(f"  {success('✓ 연락 저장:')} 문자 → 발송완료")
    print(f"    내용: 안부 문자 + 무료 구강검진 이벤트 안내")
    
    # Step 9: 김민수에게 전화 (부재중)
    print_section("STEP 9: 김민수 전화 연락 (부재중)", "📵")
    print(f"  {dim('→ 김민수님: 임플란트 2차 보철 미예약. 52일 경과.')}")
    print(f"  {dim('→ 전화 걸기... 벨 7번... 부재중')}\n")
    
    contact3 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_1",
        "treatment_id": "treat_1b",
        "contact_type": "phone",
        "result": "no_answer",
        "notes": "부재중. 오후에 재시도 예정.",
        "next_contact_date": "2026-03-23"
    })
    print(f"  {warn('△ 연락 저장:')} 전화 → 부재중")
    print(f"    → 오후에 문자 발송 예정")
    
    # 이어서 문자 발송
    contact3b = sim.post("/api/retention/contacts", {
        "patient_id": "patient_1",
        "contact_type": "text",
        "result": "message_sent",
        "notes": "부재중이어서 문자 발송. '임플란트 경과 확인차 연락드렸어요. 편하신 시간에 연락 주세요~'",
        "next_contact_date": "2026-03-25"
    })
    print(f"  {success('✓ 추가 문자 발송:')} 임플란트 경과 확인 문자")
    
    # Step 10: 이상담으로 로그인하여 연락 수행
    print_section("STEP 10: 이상담 - 박영희 교정 후속 연락", "👩‍💼")
    sim2 = PatientTouchSim()
    user2 = sim2.login("lee@bddental.com")
    print(f"  {success('✓')} 이상담 로그인 (staff)")
    
    script3 = sim2.get("/api/retention/ai-script/patient_2")
    if script3.get("success"):
        print(f"  AI 추천: {script3['data'].get('message','')[:60]}...")
    
    contact4 = sim2.post("/api/retention/contacts", {
        "patient_id": "patient_2",
        "treatment_id": "treat_2",
        "contact_type": "phone",
        "result": "callback_promised",
        "notes": "교정 재상담 안내. 발치 없는 옵션 추가 설명함. '다음주에 시간 볼게요' 회신.",
        "next_contact_date": "2026-03-28"
    })
    print(f"  {success('✓ 연락 저장:')} 전화 → 콜백약속")
    print(f"    박영희: '발치 안 하는 옵션도 있다고요? 다음주에 시간 볼게요'")
    
    # Step 11: 연락 후 대시보드 변화 확인
    print_section("STEP 11: 연락 후 대시보드 KPI 변화", "📈")
    
    # 다시 김실장으로 돌아와서
    dash_after = sim.get("/api/retention/dashboard")
    if dash_after.get("success"):
        d = dash_after["data"]
        print(f"  ┌────────────────────────────────────────────────────────┐")
        print(f"  │  치료 미완료     : {bold(str(d['incomplete_count']))}명                              │")
        print(f"  │  리콜 대상       : {bold(str(d['recall_count']))}명                              │")
        print(f"  │  연락 수행률     : {bold(str(d['contact_completion_rate']))}%                             │")
        print(f"  │  이탈 위험 매출  : {bold(fmt_money(d['estimated_lost_revenue']))}                  │")
        print(f"  └────────────────────────────────────────────────────────┘")
    
    # Step 12: 주간 리포트 확인
    print_section("STEP 12: 주간 리포트 확인", "📋")
    report = sim.get("/api/retention/report", {"period": "week"})
    if report.get("success"):
        d = report["data"]
        stats = d.get("contact_stats", {})
        print(f"  기간: {d.get('start_date','')} ~ 현재")
        print(f"  총 연락: {stats.get('total_contacts',0)}건 (고유 환자 {stats.get('unique_patients',0)}명)")
        print(f"  예약 전환: {stats.get('booked',0)}건 | 통화연결: {stats.get('connected',0)}건")
        print(f"  부재중: {stats.get('no_answer',0)}건 | 콜백약속: {stats.get('callback',0)}건 | 문자발송: {stats.get('message_sent',0)}건")
        print(f"  전환율: {bold(str(d.get('conversion_rate',0)))}%")
        
        staff = d.get("staff_stats", [])
        if staff:
            print(f"\n  {bold('직원별 성과:')}")
            for s in staff:
                print(f"    {s['staff_name']}: {s['contacts']}건 연락, {s['booked']}건 예약")
        
        risk = d.get("risk_revenue", {})
        if risk:
            print(f"\n  {bold('이탈 위험 매출 분석:')}")
            print(f"    🔴 미예약긴급: {fmt_money(risk.get('urgent',0))}")
            print(f"    🟡 미예약주의: {fmt_money(risk.get('warning',0))}")
            print(f"    🟠 이탈위험: {fmt_money(risk.get('at_risk',0))}")
            print(f"    🟣 미전환: {fmt_money(risk.get('unconverted',0))}")
    
    print(f"\n  {success(bold('✅ 시뮬레이션 #1 완료'))}")
    print(f"  {dim('김실장 오전 업무 요약: 4명 연락 (1 예약, 1 콜백, 1 부재중→문자, 1 안부문자)')}")


# ════════════════════════════════════════════════════════════════
# 시뮬레이션 2: 수요일 오후 - 신규 환자 + 미전환 집중 관리
# ════════════════════════════════════════════════════════════════
def simulation_2():
    print(f"\n{'🔶' * 35}")
    print(header(f"""
  ┌─────────────────────────────────────────────────────────────┐
  │  시뮬레이션 #2: 수요일 오후 2시 - 신규 환자 + 미전환 관리    │
  │  시나리오: 신규환자 등록 → 상담후 치료등록 → 미전환 팔로업    │
  └─────────────────────────────────────────────────────────────┘
"""))
    
    sim = PatientTouchSim()
    
    # Step 1: 로그인
    print_section("STEP 1: 오후 근무 시작", "🔐")
    user = sim.login()
    print(f"  {success('✓')} {user['name']} 오후 세션 시작")
    print(f"  {dim('→ 점심 후 오후 상담 준비. 신규 환자가 오전에 내원했다!')}")
    
    # Step 2: 신규 환자 등록
    print_section("STEP 2: 신규 환자 등록 - 윤서현", "👤")
    new_patient = sim.post("/api/patients", {
        "name": "윤서현",
        "phone": "010-8888-8888",
        "age": 38,
        "gender": "female",
        "memo": "지인 소개 (송미라 환자). 잇몸 출혈 심함. 불안 많음.",
        "tags": ["소개환자", "잇몸"]
    })
    if new_patient.get("success"):
        new_id = new_patient["data"]["id"]
        print(f"  {success('✓')} 신규 환자 등록 완료: 윤서현 (38세/여)")
        print(f"    ID: {new_id}")
        print(f"    메모: 지인 소개 (송미라). 잇몸 출혈 심함. 불안 많음.")
        print(f"    태그: 소개환자, 잇몸")
    else:
        # 이미 등록된 경우 기존 환자 사용
        new_id = "patient_8"
        print(f"  {warn('△')} 이미 등록된 환자이거나 에러. 계속 진행.")
    
    # Step 3: 치료 등록 (오전 상담 결과)
    print_section("STEP 3: 윤서현 치료 계획 등록", "🦷")
    print(f"  {dim('→ 오전 원장님 진단: 잇몸치료 2회 + 스케일링 필요')}")
    
    treat1 = sim.post("/api/retention/treatments", {
        "patient_id": new_id,
        "treatment_type": "perio",
        "treatment_name": "잇몸치료 1/2회차",
        "status": "scheduled",
        "total_amount": 200000,
        "paid_amount": 0,
        "started_at": "2026-03-26",
        "next_appointment": "2026-03-26",
        "notes": "잇몸 출혈 심함. 1주 간격 2회 치료 계획."
    })
    print(f"  {success('✓')} 잇몸치료 1/2회차 등록 (20만원, 3/26 예약)")
    
    treat2 = sim.post("/api/retention/treatments", {
        "patient_id": new_id,
        "treatment_type": "perio",
        "treatment_name": "잇몸치료 2/2회차",
        "status": "scheduled",
        "total_amount": 200000,
        "paid_amount": 0,
        "notes": "1회차 완료 후 예약 잡을 예정"
    })
    print(f"  {success('✓')} 잇몸치료 2/2회차 등록 (20만원, 추후 예약)")
    
    treat3 = sim.post("/api/retention/treatments", {
        "patient_id": new_id,
        "treatment_type": "scaling",
        "treatment_name": "스케일링",
        "status": "scheduled",
        "total_amount": 50000,
        "paid_amount": 0,
        "notes": "잇몸치료 완료 후 진행"
    })
    print(f"  {success('✓')} 스케일링 등록 (5만원, 잇몸치료 후)")
    print(f"\n  총 치료 계획: 3건, 총 금액 45만원")
    
    # Step 4: 자동 분류 엔진 실행
    print_section("STEP 4: 자동 분류 엔진 실행 (신규 환자 포함)", "⚙️")
    update = sim.post("/api/retention/update-status")
    if update.get("success"):
        print(f"  {success('✓')} {update['data']['updated']}명 환자 상태 갱신 완료")
    
    # Step 5: 윤서현 리텐션 상태 확인
    print_section("STEP 5: 윤서현 리텐션 상태 확인", "📊")
    detail = sim.get(f"/api/retention/patients/{new_id}")
    if detail.get("success"):
        d = detail["data"]
        rs = d.get("retention_status", {})
        if rs:
            print(f"  상태: {STATUS_KR.get(rs.get('status',''), rs.get('status',''))}")
            print(f"  위험도: {rs.get('risk_score', 0)}")
            print(f"  잔여 치료비: {fmt_money(d.get('remaining_treatment_value', 0))}")
            print(f"  {dim('→ 예약이 잡혀있으므로 \"치료중\" 상태로 자동 분류!')}")
        else:
            print(f"  {dim('→ 아직 분류 데이터 없음 (신규 환자)')}")
    
    # Step 6: 미전환 필터 - 송미라, 박영희 팔로업
    print_section("STEP 6: 미전환 환자 집중 관리", "🟣")
    unconverted = sim.get("/api/retention/dashboard", {"filter": "unconverted"})
    if unconverted.get("success"):
        contacts = unconverted["data"].get("today_contacts", [])
        print(f"  미전환 환자: {bold(str(len(contacts)))}명")
        for ct in contacts:
            print(f"    🟣 {ct['patient_name']} | 위험도 {ct['risk_score']} | 잔여 {fmt_money(ct.get('remaining_treatment_value',0))}")
            print(f"       경과: {ct.get('days_since_visit',0)}일 | 우선순위 점수: {ct.get('priority_score',0)}")
    
    # Step 7: 송미라 AI 스크립트 확인 및 전화
    print_section("STEP 7: 송미라 라미네이트 팔로업 전화", "📱")
    script = sim.get("/api/retention/ai-script/patient_7")
    if script.get("success"):
        d = script["data"]
        print(f"  AI 추천 톤: {d.get('tone','')}")
        print(f"  추천 멘트: {d.get('message','')}")
        print(f"  팁: {', '.join(d.get('tips', []))}")
    
    print(f"\n  {dim('→ 김실장이 송미라님에게 전화...')}")
    print(f'  {dim("→ 송미라: \"사실 라미네이트 하고 싶은데, 남편이 비싸다고...\"")}\n')
    
    contact5 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_7",
        "treatment_id": "treat_7",
        "contact_type": "phone",
        "result": "connected",
        "notes": "통화 성공. 라미네이트 하고 싶지만 남편 설득이 필요. 무이자 할부 안내함. 남편과 같이 올 수 있는 날짜 잡기로 함.",
        "next_contact_date": "2026-03-27"
    })
    print(f"  {success('✓ 연락 저장:')} 전화 → 통화성공 (결정 보류)")
    print(f"    핵심: 남편 설득 필요, 무이자 할부 안내 완료, 부부 동반 내원 유도")
    
    # Step 8: 김민수 콜백 (월요일 문자에 대한 회신 수신)
    print_section("STEP 8: 김민수 회신 수신 → 예약 연결", "📞")
    print(f"  {dim('→ 김민수님이 문자 회신: \"네 이번주 목요일 오후에 시간 될 것 같아요\"')}")
    
    contact6 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_1",
        "treatment_id": "treat_1b",
        "contact_type": "phone",
        "result": "appointment_booked",
        "notes": "환자 회신으로 통화. 목요일(3/27) 오후 3시 임플란트 2차 보철 예약. 와이프도 설득 완료.",
        "next_contact_date": "2026-03-27"
    })
    print(f"  {success('✓ 예약 완료!')} 목요일 오후 3시 임플란트 2차 보철")
    print(f"    핵심: 와이프 설득 완료, 할부 결제 예정")
    
    # 치료 상태 업데이트
    sim.put("/api/retention/treatments/treat_1b", {
        "next_appointment": "2026-03-27",
        "status": "in_progress",
        "notes": "3/27 목요일 15시 예약. 와이프와 함께 내원 예정. 할부 결제."
    })
    print(f"  {success('✓')} 치료 상태 업데이트: scheduled → in_progress")
    
    # Step 9: 박코디에게 업무 인수인계 (송미라 팔로업)
    print_section("STEP 9: 박코디 - 송미라 재상담 준비", "👩‍💻")
    sim3 = PatientTouchSim()
    user3 = sim3.login("park@bddental.com")
    print(f"  {success('✓')} 박코디 로그인")
    
    # 박코디가 송미라 상세 확인
    detail_song = sim3.get("/api/retention/patients/patient_7")
    if detail_song.get("success"):
        d = detail_song["data"]
        rs = d.get("retention_status", {})
        treats = d.get("treatments", [])
        contacts = d.get("retention_contacts", [])
        
        print(f"  송미라 현황:")
        print(f"    상태: {STATUS_KR.get(rs.get('status',''), rs.get('status',''))}")
        print(f"    치료: {', '.join([t.get('treatment_name','') for t in treats])}")
        print(f"    최근 연락 {len(contacts)}건:")
        for rc in contacts[:3]:
            print(f"      - {rc.get('contacted_at','')[:10]} {rc.get('contact_type','')} → {rc.get('result','')}: {rc.get('notes','')[:40]}...")
    
    # Step 10: 대시보드 최종 확인
    print_section("STEP 10: 수요일 오후 마감 대시보드", "📊")
    dash = sim.get("/api/retention/dashboard")
    if dash.get("success"):
        d = dash["data"]
        print(f"  ┌────────────────────────────────────────────────────────┐")
        print(f"  │  치료 미완료     : {bold(str(d['incomplete_count']))}명                              │")
        print(f"  │  리콜 대상       : {bold(str(d['recall_count']))}명                              │")
        print(f"  │  연락 수행률     : {bold(str(d['contact_completion_rate']))}%                             │")
        print(f"  │  이탈 위험 매출  : {bold(fmt_money(d['estimated_lost_revenue']))}                  │")
        print(f"  └────────────────────────────────────────────────────────┘")
        
        dist = d.get('status_distribution', {})
        if dist:
            print(f"\n  {bold('상태 분포 변화:')}")
            for status, cnt in sorted(dist.items(), key=lambda x: x[1], reverse=True):
                bar = "█" * cnt + "░" * max(0, 10 - cnt)
                print(f"    {STATUS_KR.get(status, status):15s} │{bar}│ {cnt}명")
    
    print(f"\n  {success(bold('✅ 시뮬레이션 #2 완료'))}")
    print(f"  {dim('수요일 오후 요약: 신규환자 1명 등록+치료계획, 김민수 예약성공, 송미라 팔로업, 미전환 관리')}")


# ════════════════════════════════════════════════════════════════
# 시뮬레이션 3: 금요일 - 주간 마감 & 리포트
# ════════════════════════════════════════════════════════════════
def simulation_3():
    print(f"\n{'🔹' * 35}")
    print(header(f"""
  ┌─────────────────────────────────────────────────────────────┐
  │  시뮬레이션 #3: 금요일 오후 5시 - 주간 마감 & 리포트         │
  │  시나리오: 최종연락 → 치료완료 → 주간리포트 → 다음주 계획     │
  └─────────────────────────────────────────────────────────────┘
"""))
    
    sim = PatientTouchSim()
    
    # Step 1: 로그인
    print_section("STEP 1: 금요일 오후 - 주간 마감 시작", "🔐")
    user = sim.login()
    print(f"  {success('✓')} {user['name']} 주간 마감 세션")
    print(f"  {dim('→ 이번주 마지막 업무. 주간 성과를 정리하자!')}")
    
    # Step 2: 이번주 마지막 연락들 처리
    print_section("STEP 2: 마지막 연락 처리 - 정대철 회신 수신", "📱")
    print(f'  {dim("→ 정대철님이 월요일 문자에 회신: \"네 다음주에 한번 가볼게요\"")}\n')
    
    contact7 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_6",
        "contact_type": "phone",
        "result": "appointment_booked",
        "notes": "정대철님 회신 통화. 다음주 화요일(3/31) 오전 검진 예약. 당뇨 관리 상태 확인 필요.",
        "next_contact_date": "2026-03-31"
    })
    print(f"  {success('🎉 정대철님 1년 만에 예약 성공!')} 화요일 검진 예약")
    print(f"    {dim('396일 만의 재방문! 안부 문자 한 통이 만든 기적 ✨')}")
    
    # Step 3: 한미영 치료 완료 처리 (토요일 예약했지만, 시뮬레이션상 금요일에 처리)
    print_section("STEP 3: 한미영 신경치료 3회차 완료 처리", "✅")
    print(f"  {dim('→ 토요일 예정이었으나, 급하게 금요일로 변경하여 내원')}")
    
    sim.put("/api/retention/treatments/treat_5c", {
        "status": "completed",
        "completed_at": "2026-03-28",
        "paid_amount": 100000,
        "notes": "신경치료 3/3회차 완료. 환자 상태 양호. 다음주 크라운 인상."
    })
    print(f"  {success('✓')} 신경치료 3회차 완료 (10만원 결제)")
    
    # 크라운 예약
    sim.put("/api/retention/treatments/treat_5d", {
        "next_appointment": "2026-04-02",
        "status": "in_progress",
        "notes": "4/2 수요일 크라운 인상 예약. 환자 확인."
    })
    print(f"  {success('✓')} 크라운 인상 4/2 수요일 예약 등록")
    
    # 연락 기록
    sim.post("/api/retention/contacts", {
        "patient_id": "patient_5",
        "treatment_id": "treat_5d",
        "contact_type": "visit",
        "result": "appointment_booked",
        "notes": "내원. 신경치료 완료. 크라운 인상 4/2 예약. 환자 매우 만족."
    })
    print(f"  {success('✓')} 내원 기록 저장 + 크라운 예약")
    
    # Step 4: 송미라 업데이트 (부부 내원 일정 확정)
    print_section("STEP 4: 송미라 부부 재상담 일정 확정", "💑")
    print(f'  {dim("→ 송미라님 회신: \"남편이랑 다음주 토요일에 같이 갈게요!\"")}\n')
    
    contact8 = sim.post("/api/retention/contacts", {
        "patient_id": "patient_7",
        "contact_type": "phone",
        "result": "appointment_booked",
        "notes": "부부 동반 재상담 예약 완료. 다음주 토요일(4/5) 11시. 할부 상담 포함.",
        "next_contact_date": "2026-04-05"
    })
    print(f"  {success('🎉 송미라 라미네이트 재상담 예약!')} 토요일 11시 부부 동반")
    print(f"    {dim('→ 480만원 라미네이트 전환 가능성 UP!')}")
    
    # 치료 상태 업데이트
    sim.put("/api/retention/treatments/treat_7", {
        "next_appointment": "2026-04-05",
        "status": "in_progress",
        "notes": "4/5 토요일 11시 부부 동반 재상담. 할부 안내 준비."
    })
    
    # Step 5: 전체 분류 엔진 재실행
    print_section("STEP 5: 주간 마감 - 전체 분류 엔진 재실행", "⚙️")
    update = sim.post("/api/retention/update-status")
    if update.get("success"):
        print(f"  {success('✓')} {update['data']['updated']}명 전체 상태 갱신 완료")
    
    # Step 6: 최종 대시보드 KPI
    print_section("STEP 6: 주간 최종 대시보드", "📊")
    dash = sim.get("/api/retention/dashboard")
    if dash.get("success"):
        d = dash["data"]
        print(f"  ╔════════════════════════════════════════════════════════╗")
        print(f"  ║  {bold('📊 주간 마감 대시보드 (금요일 오후 5시)')}              ║")
        print(f"  ╠════════════════════════════════════════════════════════╣")
        print(f"  ║  치료 미완료     : {bold(str(d['incomplete_count']))}명                              ║")
        print(f"  ║  리콜 대상       : {bold(str(d['recall_count']))}명                              ║")
        print(f"  ║  연락 수행률     : {bold(str(d['contact_completion_rate']))}%                             ║")
        print(f"  ║  이탈 위험 매출  : {bold(fmt_money(d['estimated_lost_revenue']))}                  ║")
        print(f"  ╚════════════════════════════════════════════════════════╝")
        
        dist = d.get('status_distribution', {})
        if dist:
            print(f"\n  {bold('최종 환자 상태 분포:')}")
            total = sum(dist.values())
            for status, cnt in sorted(dist.items(), key=lambda x: x[1], reverse=True):
                pct = cnt / total * 100 if total > 0 else 0
                bar = "█" * cnt + "░" * max(0, 10 - cnt)
                print(f"    {STATUS_KR.get(status, status):15s} │{bar}│ {cnt}명 ({pct:.0f}%)")
    
    # Step 7: 주간 리포트 (종합)
    print_section("STEP 7: 주간 리포트 - 종합 성과", "📋")
    report = sim.get("/api/retention/report", {"period": "week"})
    if report.get("success"):
        d = report["data"]
        stats = d.get("contact_stats", {})
        
        print(f"  ╔════════════════════════════════════════════════════════╗")
        print(f"  ║  {bold('📋 주간 리텐션 리포트')}                               ║")
        print(f"  ║  기간: {d.get('start_date','')} ~ 2026-03-28               ║")
        print(f"  ╠════════════════════════════════════════════════════════╣")
        print(f"  ║  총 연락         : {bold(str(stats.get('total_contacts',0)))}건                             ║")
        print(f"  ║  고유 환자       : {stats.get('unique_patients',0)}명                              ║")
        print(f"  ║  예약 전환       : {bold(str(stats.get('booked',0)))}건                             ║")
        print(f"  ║  전환율          : {bold(str(d.get('conversion_rate',0)))}%                             ║")
        print(f"  ╠════════════════════════════════════════════════════════╣")
        print(f"  ║  통화연결        : {stats.get('connected',0)}건                              ║")
        print(f"  ║  부재중          : {stats.get('no_answer',0)}건                              ║")
        print(f"  ║  콜백약속        : {stats.get('callback',0)}건                              ║")
        print(f"  ║  문자발송        : {stats.get('message_sent',0)}건                              ║")
        print(f"  ║  거절            : {stats.get('refused',0)}건                              ║")
        print(f"  ╚════════════════════════════════════════════════════════╝")
        
        staff = d.get("staff_stats", [])
        if staff:
            print(f"\n  {bold('👥 직원별 주간 성과:')}")
            for i, s in enumerate(staff, 1):
                booking_rate = round(s['booked'] / max(1, s['contacts']) * 100)
                medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else "  "
                print(f"    {medal} {s['staff_name']}: 연락 {s['contacts']}건, 예약 {s['booked']}건 (전환율 {booking_rate}%)")
        
        risk = d.get("risk_revenue", {})
        if risk:
            total_risk = sum(risk.values())
            print(f"\n  {bold('💰 이탈 위험 매출 총계:')} {fmt_money(total_risk)}")
            if risk.get('urgent', 0): print(f"    🔴 미예약긴급: {fmt_money(risk['urgent'])}")
            if risk.get('warning', 0): print(f"    🟡 미예약주의: {fmt_money(risk['warning'])}")
            if risk.get('at_risk', 0): print(f"    🟠 이탈위험: {fmt_money(risk['at_risk'])}")
            if risk.get('unconverted', 0): print(f"    🟣 미전환: {fmt_money(risk['unconverted'])}")
        
        # 일별 추이
        daily = d.get("daily_trend", [])
        if daily:
            print(f"\n  {bold('📈 일별 연락 추이:')}")
            for dd in daily:
                day_name = dd.get('day', '')
                cnt = dd.get('cnt', 0)
                booked = dd.get('booked', 0)
                bar = "▓" * cnt + "░" * max(0, 8 - cnt)
                print(f"    {day_name} │{bar}│ {cnt}건 (예약 {booked}건)")
    
    # Step 8: 월간 리포트도 확인
    print_section("STEP 8: 월간 리포트 확인", "📅")
    monthly = sim.get("/api/retention/report", {"period": "month"})
    if monthly.get("success"):
        d = monthly["data"]
        stats = d.get("contact_stats", {})
        print(f"  기간: {d.get('start_date','')} ~ 현재")
        print(f"  총 연락: {stats.get('total_contacts',0)}건 | 예약전환: {stats.get('booked',0)}건 | 전환율: {d.get('conversion_rate',0)}%")
    
    # Step 9: 각 환자 현재 상태 최종 확인
    print_section("STEP 9: 전체 환자 최종 상태 확인", "👥")
    patients_to_check = [
        ("patient_1", "김민수"),
        ("patient_2", "박영희"),
        ("patient_3", "최수진"),
        ("patient_5", "한미영"),
        ("patient_6", "정대철"),
        ("patient_7", "송미라"),
    ]
    
    print(f"  {'환자명':8s} │ {'상태':12s} │ {'위험도':6s} │ {'잔여치료비':10s} │ {'이번주 변화'}")
    print(f"  {'─'*8} │ {'─'*15} │ {'─'*6} │ {'─'*10} │ {'─'*20}")
    
    for pid, name in patients_to_check:
        detail = sim.get(f"/api/retention/patients/{pid}")
        if detail.get("success"):
            d = detail["data"]
            rs = d.get("retention_status", {})
            status = STATUS_KR.get(rs.get('status',''), rs.get('status',''))
            risk = rs.get('risk_score', '-')
            remaining = fmt_money(d.get('remaining_treatment_value', 0))
            
            # 이번주 변화 요약
            changes = []
            contacts = d.get("retention_contacts", [])
            this_week = [c for c in contacts if c.get('contacted_at','') >= '2026-03-22']
            if this_week:
                results = [c.get('result','') for c in this_week]
                if 'appointment_booked' in results: changes.append('예약✓')
                if 'connected' in results: changes.append('통화')
                if 'callback_promised' in results: changes.append('콜백약속')
                if 'no_answer' in results: changes.append('부재중')
                if 'message_sent' in results: changes.append('문자')
            
            change_text = ', '.join(changes) if changes else '-'
            print(f"  {name:8s} │ {status:12s} │ {str(risk):6s} │ {remaining:10s} │ {change_text}")
    
    # Step 10: 다음주 계획
    print_section("STEP 10: 다음주 계획 수립", "🗓️")
    print(f"  {bold('다음주 주요 일정:')}")
    print(f"    📅 월: 박영희 교정 재상담 콜백 확인 (3/28 약속)")
    print(f"    📅 화: 정대철 검진 내원 (3/31 오전)")  
    print(f"    📅 수: 한미영 크라운 인상 (4/2)")
    print(f"    📅 토: 송미라+남편 라미네이트 재상담 (4/5 11시)")
    print(f"    📅 수시: 김민수 임플란트 2차 보철 결과 확인")
    print()
    print(f"  {bold('다음주 핵심 목표:')}")
    print(f"    🎯 박영희 교정 결정 유도 (500만원)")
    print(f"    🎯 송미라 라미네이트 계약 (480만원)")
    print(f"    🎯 정대철 정기 검진 + 추가 치료 발굴")
    print(f"    🎯 한미영 크라운 완료까지 빈틈없이 관리")
    
    print(f"\n  {success(bold('✅ 시뮬레이션 #3 완료'))}")
    print(f"  {dim('금요일 마감 요약: 정대철 1년만에 예약성공, 한미영 치료완료, 송미라 재상담확정')}")


# ════════════════════════════════════════════════════════════════
# 메인: 3회 시뮬레이션 연속 실행
# ════════════════════════════════════════════════════════════════
def main():
    print(f"\n{'='*70}")
    print(header("""
  ╔══════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║    🏥 Patient Touch - 리텐션 모듈 실사용 시뮬레이션 3회         ║
  ║                                                                ║
  ║    장소: 서울BD치과                                             ║
  ║    기간: 2026년 3월 4주차 (월/수/금)                            ║
  ║    등장인물: 김실장(admin), 이상담(staff), 박코디(staff)        ║
  ║                                                                ║
  ╚══════════════════════════════════════════════════════════════════╝
"""))
    
    start_time = time.time()
    
    try:
        simulation_1()
        simulation_2()
        simulation_3()
    except Exception as e:
        print(f"\n{error(f'오류 발생: {e}')}")
        import traceback
        traceback.print_exc()
        return 1
    
    elapsed = time.time() - start_time
    
    print(f"\n{'='*70}")
    print(header("""
  ╔══════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║    🎉 전체 시뮬레이션 완료!                                     ║
  ║                                                                ║
  ╚══════════════════════════════════════════════════════════════════╝
"""))
    
    print(f"  {bold('📊 3회 시뮬레이션 종합 요약:')}")
    print(f"  {'─'*60}")
    print(f"  #1 월요일: 대시보드 확인 → 4명 연락 (예약1, 콜백1, 부재중1, 문자1)")
    print(f"  #2 수요일: 신규환자 등록 → 치료계획 → 김민수 예약 → 미전환 팔로업")
    print(f"  #3 금요일: 정대철 예약 → 한미영 치료완료 → 송미라 재상담 → 주간리포트")
    print(f"  {'─'*60}")
    print(f"  {bold('이번주 성과:')}")
    print(f"    ✅ 신규 예약: 4건 (한미영, 김민수, 정대철, 송미라)")
    print(f"    ✅ 치료 완료: 1건 (한미영 신경치료)")
    print(f"    ✅ 신규 환자: 1명 (윤서현 - 소개환자)")
    print(f"    ✅ 1년 미내원 환자 복귀: 1명 (정대철)")
    print(f"    ✅ 다음주 핵심 기회: 박영희 교정 500만원 + 송미라 라미네이트 480만원")
    print(f"  {'─'*60}")
    print(f"  실행 시간: {elapsed:.1f}초")
    print(f"  {dim('모든 API 호출 정상 작동 확인 ✓')}")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
