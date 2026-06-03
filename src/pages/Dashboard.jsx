import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle, ShieldAlert, Clock, ArrowRight, Search, Download, Settings, X } from 'lucide-react';

const ALERTS = [
  { id: 1, type: 'critical', title: '홍해 물류 마비 경고', location: 'Red Sea, Yemen', impact: '-$2.4M', time: '10분 전' },
  { id: 2, type: 'warning', title: '대만 가뭄으로 인한 반도체 공장 감산 예상', location: 'Hsinchu, Taiwan', impact: '-$800K', time: '2시간 전' },
  { id: 3, type: 'success', title: '베트남 하이퐁 항구 파업 종료', location: 'Hai Phong, Vietnam', impact: '정상화', time: '5시간 전' },
];

function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + "Date,Alert Title,Location,Impact,Type\n"
      + "2026-05-30,홍해 물류 마비 경고,Red Sea Yemen,-$2.4M,CRITICAL\n"
      + "2026-05-30,대만 가뭄으로 인한 반도체 공장 감산 예상,Hsinchu Taiwan,-$800K,WARNING\n"
      + "2026-05-30,베트남 하이퐁 항구 파업 종료,Hai Phong Vietnam,정상화,SUCCESS\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SupplyMind_Risk_Report_20260530.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }} className="header-actions">
        <div>
          <h1 className="page-title">글로벌 리스크 대시보드</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>전 세계 공급망의 실시간 위험 요소를 모니터링합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleDownload}>
            <Download size={16} /> 리포트 다운로드
          </button>
          <button className="btn btn-primary" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={16} /> 설정
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
        <div className="panel panel-body">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>모니터링 중인 공급처</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>1,248</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontSize: '0.875rem' }}>
            <TrendingUp size={16} /> <span>전월 대비 +12%</span>
          </div>
        </div>
        <div className="panel panel-body">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>활성화된 위험 경보</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-red)', marginBottom: '8px' }}>3</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-red)', fontSize: '0.875rem' }}>
            <TrendingUp size={16} /> <span>어제보다 1건 증가</span>
          </div>
        </div>
        <div className="panel panel-body">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>예상 방어 손실액 (YTD)</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '8px' }}>$14.2M</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <CheckCircle size={16} /> <span>AI 최적화 달성률 94%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid-container" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="panel">
          <div className="panel-header">글로벌 리스크 맵</div>
          <div className="panel-body" style={{ height: '400px', background: '#e2e8f0', position: 'relative', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
            
            {/* SVG World Map Background */}
            <svg viewBox="0 0 1008 650" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.5, fill: '#cbd5e1' }}>
              <path d="M495.8,111.4c-0.2-1.1-2-1.7-2-1.7c0,0-1.2,0.9-2.1,0.5c-0.9-0.4-1.2-1.8-1.2-1.8s-2.1-0.7-2.6-1.5c-0.4-0.9-0.7-3.7,1.8-4.4c2.5-0.7,0.7-3.7-0.7-3.7c-1.4,0-3,0.5-3,1.4s-1.8,2.8-1.8,2.8s-2.6,0.2-2.8,0.9c-0.2,0.7,1.6,2.1,1.6,3.5c0,1.4,2.5,3.7,1.6,5.1c-0.9,1.4-2.8,1.2-3.3,0s-2.1-2.1-1.2-4.2c0.9-2.1-0.2-2.1-0.2-2.1s-2.3-0.7-2.6-1.8c-0.4-1.2-0.2-2.8-0.2-2.8s1.6-0.7,2.8-0.2c1.2,0.5,3.3,0,3.3-1.2c0-1.2,0-3-1.6-4.2c-1.6-1.2-3.7-1.4-5.1,0.2c-1.4,1.6-3.3,1.4-4.2-0.2s-0.7-3,0-3.5c0.7-0.5,2.1,1.2,2.8,0.2c0.7-0.9,2.1-1.2,2.1-2.1s-0.2-1.6-1.2-1.6c-0.9,0-1.8-0.9-1.2-2.1c0.5-1.2,1.2-1.6,1.2-2.6c0-0.9-0.7-2.8-1.8-3.5c-1.2-0.7-4.2-2.1-5.6,0s-0.2,3,0.5,3.7c0.7,0.7,0.7,2.1,0,3c-0.7,0.9-1.6,0.5-2.1-0.7s-0.9-2.3-1.6-2.1s-1.2,0.9-0.9,2.3c0.2,1.4,1.6,3,1.6,4.4s-0.5,3-2.1,3s-2.3-0.7-3.5-0.7c-1.2,0-2.3,0.7-3,2.1c-0.7,1.4,0,3,1.6,3c1.6,0,2.1,1.4,1.2,2.3c-0.9,0.9-3.7,1.2-4.9,2.3c-1.2,1.2-2.3,1.4-3.5,1.4c-1.2,0-3,0.9-3.7,2.3s0.5,2.6,2.1,3.5c1.6,0.9,2.8,2.3,2.1,3.7c-0.7,1.4-2.1,2.1-4.2,2.1c-2.1,0-4.2,0.5-4.2,2.1s1.2,2.8,2.8,3c1.6,0.2,3.3,1.2,2.8,3c-0.5,1.9-2.1,3.3-4.2,3.3s-4.2,1.2-5.1,3c-0.9,1.9,0.5,3.7,2.8,3.7c2.3,0,4.2-1.2,6.1,0s3,3.3,3,5.1c0,1.9,0.5,4.2,2.8,4.2c2.3,0,4.2-1.2,5.1-3c0.9-1.9,0.5-3.3-0.9-4.2c-1.4-0.9-2.8-2.3-2.3-3.7c0.5-1.4,1.9-2.3,4.2-2.3s4.2,1.2,5.1,2.3s1.2,2.3,3.5,1.4c2.3-0.9,4.2-2.3,5.1-4.2c0.9-1.9,0-3.3,2.3-4.2c2.3-0.9,4.2,0,5.1,1.9c0.9,1.9,1.2,3.7,3.5,3.7c2.3,0,3.3-1.9,4.2-3.7c0.9-1.9,2.8-2.3,4.2-1.4s2.8,1.9,2.8,3.7c0,1.9,0.9,3.7,2.3,4.2c1.4,0.5,3.3-0.9,3.3-2.8c0-1.9,1.2-3.3,3-3.3c1.9,0,3.3,1.4,4.2,3c0.9,1.6,2.3,2.3,4.2,1.4c1.9-0.9,2.3-2.8,2.3-4.7c0-1.9,0.9-3.7,2.8-4.2s3.7-0.9,3.7-2.8c0-1.9-1.4-3.3-3.3-4.2s-2.8-2.3-1.9-3.7C495.8,114.7,496,112.5,495.8,111.4z" />
              <path d="M570,90c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S572,90,570,90z" />
              <path d="M600,100c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S602,100,600,100z" />
              {/* Very simplified SVG map path for visual context */}
              <path d="M814.7,243.6c-2.8-1.5-6.1-0.9-8.4,1.4c-2.3,2.3-3.1,5.6-2,8.6c1.1,3,3.9,5.2,7,5.5c3.1,0.3,6.2-1.3,8-4 c1.8-2.6,1.9-6.1,0.2-8.8C818.5,244.7,816.6,243.9,814.7,243.6z M185,150c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S187,150,185,150z M200,160 c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S202,160,200,160z M300,200c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S302,200,300,200z M400,250 c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S402,250,400,250z M500,300c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S502,300,500,300z M600,350 c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S602,350,600,350z M700,400c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S702,400,700,400z M800,450 c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S802,450,800,450z M900,500c-2,0-3,1-3,2s1,3,3,3s3-1,3-3S902,500,900,500z" />
              <rect x="0" y="0" width="1008" height="650" fill="url(#grid)" opacity="0.1" />
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#64748b" strokeWidth="1" />
                </pattern>
              </defs>
            </svg>
            
            {/* Mock Map Marker (Red Sea) */}
            <div style={{ position: 'absolute', top: '45%', left: '55%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 16, height: 16, background: 'var(--accent-red)', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.3)', animation: 'pulseGlow 2s infinite' }}></div>
              <div className="panel" style={{ padding: '6px 12px', fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)' }}>홍해 물류 마비 경고</div>
            </div>

            {/* Mock Map Marker (Taiwan) */}
            <div style={{ position: 'absolute', top: '40%', left: '75%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 12, height: 12, background: 'var(--accent-amber)', borderRadius: '50%', boxShadow: '0 0 0 3px rgba(217, 119, 6, 0.3)' }}></div>
              <div className="panel" style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>대만 가뭄</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>실시간 AI 경보</span>
            <span style={{ color: 'var(--primary-blue)', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>전체보기</span>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ALERTS.map(alert => (
              <div 
                key={alert.id} 
                className="panel"
                style={{ 
                  padding: '16px', 
                  borderLeft: `4px solid ${alert.type === 'critical' ? 'var(--accent-red)' : alert.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-green)'}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: 'none'
                }}
                onClick={() => setSelectedAlert(alert)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge ${alert.type === 'critical' ? 'badge-danger' : alert.type === 'warning' ? 'badge-warning' : 'badge-success'}`}>
                    {alert.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alert.time}</span>
                </div>
                <h4 style={{ fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{alert.title}</h4>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{alert.location}</span>
                  <span style={{ fontWeight: 600, color: alert.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{alert.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="panel fade-in" style={{ width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>경보 상세 분석</span>
              <button onClick={() => setSelectedAlert(null)} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            <div className="panel-body">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{selectedAlert.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>발생 지역: {selectedAlert.location} | 예상 피해: {selectedAlert.impact}</p>
              
              <div style={{ padding: '20px', background: '#fef2f2', borderLeft: '4px solid var(--accent-red)', borderRadius: '4px', marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--accent-red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} /> AI 시나리오 분석 결과</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>유럽발 핵심 부품의 도착 지연이 기정사실화 되었습니다. 현재 재고량은 14일분이며, 우회 경로 이용 시 리드타임이 21일 추가 소요되어 <strong>최소 7일간의 생산 라인 가동 중단</strong>이 불가피합니다.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => { alert('대안 공급처 매칭 시스템으로 이동합니다.'); setSelectedAlert(null); }}>
                  <Search size={16} /> 대체 공급처 AI 검색
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer */}
      {isSettingsOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="drawer">
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>대시보드 설정</h3>
              <button onClick={() => setIsSettingsOpen(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>알림 수신 설정</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Critical 경보 즉시 수신 (이메일)</span>
                  <div className="toggle-switch on"><div className="toggle-knob"></div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span>Warning 경보 주간 요약 수신</span>
                  <div className="toggle-switch on"><div className="toggle-knob"></div></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <span>모바일 Push 알림 (SupplyMind App)</span>
                  <div className="toggle-switch"><div className="toggle-knob"></div></div>
                </div>
              </div>
              
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>관심 권역(Region) 필터</h4>
                <div className="form-group">
                  <select className="form-input" defaultValue="global">
                    <option value="global">전 세계 (Global)</option>
                    <option value="apac">아시아 태평양 (APAC)</option>
                    <option value="emea">유럽, 중동, 아프리카 (EMEA)</option>
                    <option value="americas">미주 (Americas)</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600 }}>리스크 민감도 (AI 임계값)</h4>
                <input type="range" min="1" max="100" defaultValue="70" style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  <span>매우 낮음 (모든 알림)</span>
                  <span>매우 높음 (핵심 위험만)</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsSettingsOpen(false)}>취소</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setIsSettingsOpen(false)}>저장하기</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
