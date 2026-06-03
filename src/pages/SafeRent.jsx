import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, Copy, Calculator, AlertTriangle, CheckCircle, Info, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { CHECKLIST_ITEMS, SPECIAL_CLAUSES } from '../data/mockSafeRent';

function SafeRent() {
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'clauses', 'calculator'
  
  // Checklist State
  const [checkedItems, setCheckedItems] = useState({});
  const totalItems = CHECKLIST_ITEMS.reduce((acc, phase) => acc + phase.items.length, 0);
  const checkedCount = Object.keys(checkedItems).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const handleCheck = (id) => {
    setCheckedItems(prev => {
      const newItems = { ...prev };
      if (newItems[id]) {
        delete newItems[id];
      } else {
        newItems[id] = true;
      }
      return newItems;
    });
  };

  // Calculator State
  const [calcData, setCalcData] = useState({
    housePrice: '',
    debt: '',
    deposit: ''
  });
  const [calcResult, setCalcResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalcInput = (e) => {
    const { name, value } = e.target;
    setCalcData(prev => ({ ...prev, [name]: value }));
  };

  const runCalculator = () => {
    const hp = parseFloat(calcData.housePrice) || 0;
    const debt = parseFloat(calcData.debt) || 0;
    const dp = parseFloat(calcData.deposit) || 0;

    if (hp === 0 || dp === 0) {
      alert("시세와 보증금을 입력해주세요.");
      return;
    }

    // 경매 낙찰가율 보통 70% 가정
    const auctionPrice = hp * 0.7;
    // 내 보증금을 돌려받기 위해 필요한 금액 (선순위 빚 + 내 보증금)
    const totalRisk = debt + dp;

    setCalcResult(null);
    setIsCalculating(true);

    setTimeout(() => {
      let status = 'danger';
      let message = '위험! 깡통전세일 확률이 높습니다.';
      let icon = <ShieldAlert size={48} color="var(--accent-red)" />;

      if (totalRisk <= auctionPrice) {
        status = 'safe';
        message = '안전! 경매로 넘어가도 보증금을 지킬 확률이 높습니다.';
        icon = <ShieldCheck size={48} color="var(--accent-green)" />;
      } else if (totalRisk <= hp * 0.8) {
        status = 'warning';
        message = '주의! 시세가 하락하면 보증금 일부를 잃을 수 있습니다.';
        icon = <AlertTriangle size={48} color="var(--accent-amber)" />;
      }

      setCalcResult({
        status,
        message,
        icon,
        auctionPrice: Math.round(auctionPrice),
        totalRisk
      });
      setIsCalculating(false);
    }, 1200);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('특약 사항이 복사되었습니다! 부동산에 그대로 전달하세요.');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>전세/월세 안전 지킴이</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '600px' }}>
          어려운 부동산 계약, 사기당할까 두려우신가요? <br/>체크리스트와 특약 생성기로 소중한 내 보증금을 완벽하게 지켜내세요.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderRadius: '16px', padding: '8px', boxShadow: 'var(--shadow-sm)', marginBottom: '32px', border: '1px solid var(--border-light)' }}>
        {[
          { id: 'checklist', label: '안전 체크리스트', icon: <CheckSquare size={18} /> },
          { id: 'clauses', label: '필수 특약 템플릿', icon: <FileText size={18} /> },
          { id: 'calculator', label: '내 보증금 안전 계산기', icon: <Calculator size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 700 : 600,
              fontSize: '1rem', transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'var(--primary-blue)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-panel" style={{ padding: '48px 56px', flex: 1 }}>
        
        {/* CHECKLIST TAB */}
        {activeTab === 'checklist' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>시기별 안전 체크리스트</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>안전한 계약을 위해 단계별로 반드시 확인해야 할 사항들입니다.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>진행률</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: progressPercent === 100 ? 'var(--accent-green)' : 'var(--primary-blue)' }}>{progressPercent}%</div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '99px', marginBottom: '32px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: progressPercent === 100 ? 'var(--accent-green)' : 'var(--primary-blue)', transition: 'width 0.5s ease', borderRadius: '99px' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {CHECKLIST_ITEMS.map((phase, idx) => (
                <div key={idx}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', borderRadius: '50%', fontSize: '0.9rem' }}>{idx + 1}</span>
                    {phase.phase}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {phase.items.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleCheck(item.id)}
                        style={{ 
                          display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', 
                          background: checkedItems[item.id] ? 'rgba(16, 185, 129, 0.05)' : 'white',
                          border: `1px solid ${checkedItems[item.id] ? 'var(--accent-green)' : 'var(--border-light)'}`,
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ marginTop: '2px' }}>
                          {checkedItems[item.id] ? (
                            <CheckCircle size={24} color="var(--accent-green)" />
                          ) : (
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--text-muted)' }}></div>
                          )}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 700, color: checkedItems[item.id] ? 'var(--text-primary)' : 'var(--text-primary)', textDecoration: checkedItems[item.id] ? 'line-through' : 'none', opacity: checkedItems[item.id] ? 0.6 : 1 }}>
                            {item.text}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {progressPercent === 100 && (
              <div className="fade-in" style={{ marginTop: '32px', padding: '24px', background: 'var(--accent-green)', borderRadius: '16px', color: 'white', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={32} />
                완벽합니다! 모든 안전 수칙을 확인하셨습니다.
              </div>
            )}
          </div>
        )}

        {/* CLAUSES TAB */}
        {activeTab === 'clauses' && (
          <div className="fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>필수 특약 템플릿</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>부동산에 "이 특약 꼭 넣어주세요!" 라고 복사해서 보내기만 하세요.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {SPECIAL_CLAUSES.map(clause => (
                <div key={clause.id} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', marginBottom: '12px', alignSelf: 'flex-start' }}>
                    {clause.category}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>{clause.title}</h3>
                  <div style={{ background: 'rgba(37,99,235,0.03)', padding: '20px', borderRadius: '16px', marginBottom: '16px', flex: 1, border: '1px solid rgba(37,99,235,0.1)' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>"{clause.text}"</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px' }}>
                    <Info size={16} color="var(--text-muted)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{clause.why}</p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => copyToClipboard(clause.text)}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
                  >
                    <Copy size={18} /> 문구 복사하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="fade-in" style={{ display: 'flex', gap: '40px', alignItems: 'stretch' }}>
            
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
              .skeleton-loader {
                animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                background-color: var(--border-light);
                border-radius: 8px;
              }
            `}</style>

            {/* Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>내 보증금 안전 계산기</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>해당 집의 빚(근저당)과 내 보증금을 비교해 깡통전세 위험을 진단합니다.</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>해당 집의 현재 시세 (매매가)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" name="housePrice" value={calcData.housePrice} onChange={handleCalcInput} placeholder="예: 30000" style={{ width: '100%', padding: '16px', paddingRight: '48px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1.1rem', background: '#f8fafc' }} />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-secondary)' }}>만원</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>국토교통부 실거래가나 부동산 앱의 최근 매매가를 입력하세요.</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>선순위 채권 (등기부등본 상의 빚)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" name="debt" value={calcData.debt} onChange={handleCalcInput} placeholder="예: 5000 (없으면 0)" style={{ width: '100%', padding: '16px', paddingRight: '48px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1.1rem', background: '#f8fafc' }} />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-secondary)' }}>만원</span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>을구의 '채권최고액' 합산을 입력하세요. (통상 대출금의 120%)</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>지불할 전세/월세 보증금</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" name="deposit" value={calcData.deposit} onChange={handleCalcInput} placeholder="예: 15000" style={{ width: '100%', padding: '16px', paddingRight: '48px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1.1rem', background: '#f8fafc' }} />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-secondary)' }}>만원</span>
                  </div>
                </div>

                {/* Spacer to push button to bottom if needed */}
                <div style={{ flex: 1 }}></div>

                <button onClick={runCalculator} disabled={isCalculating} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '12px', marginTop: '12px' }}>
                  {isCalculating ? '계산 중...' : '안전도 분석하기'}
                </button>
              </div>
            </div>

            {/* Result Panel */}
            <div style={{ width: '400px', background: 'white', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {isCalculating ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="skeleton-loader" style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '24px' }}></div>
                  <div className="skeleton-loader" style={{ width: '80%', height: '28px', marginBottom: '32px' }}></div>
                  
                  <div style={{ width: '100%', background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div className="skeleton-loader" style={{ width: '40%', height: '20px' }}></div>
                      <div className="skeleton-loader" style={{ width: '30%', height: '20px' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
                      <div className="skeleton-loader" style={{ width: '40%', height: '20px' }}></div>
                      <div className="skeleton-loader" style={{ width: '30%', height: '20px' }}></div>
                    </div>
                    <div className="skeleton-loader" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
                    <div className="skeleton-loader" style={{ width: '80%', height: '14px' }}></div>
                  </div>
                  
                  <div className="skeleton-loader" style={{ width: '100%', height: '52px', borderRadius: '12px' }}></div>
                </div>
              ) : !calcResult ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <Calculator size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>좌측에 금액을 입력하고<br/>안전도를 확인해보세요!</p>
                </div>
              ) : (
                <div className="fade-in" style={{ width: '100%', textAlign: 'center' }}>
                  <div style={{ marginBottom: '24px' }}>
                    {calcResult.icon}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: `var(--accent-${calcResult.status === 'safe' ? 'green' : calcResult.status === 'warning' ? 'amber' : 'red'})`, marginBottom: '16px' }}>
                    {calcResult.message}
                  </h3>
                  
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', textAlign: 'left', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>경매 예상 낙찰가 (시세 70%)</span>
                      <span style={{ fontWeight: 700 }}>{calcResult.auctionPrice.toLocaleString()}만원</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>총 위험 금액 (빚 + 보증금)</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{calcResult.totalRisk.toLocaleString()}만원</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      * 통상적으로 집이 경매로 넘어갈 경우 시세의 약 70%에 낙찰됩니다. 따라서 (선순위 빚 + 내 보증금)이 이 금액보다 커진다면 보증금을 다 돌려받지 못할 위험이 큽니다.
                    </p>
                  </div>
                  
                  {calcResult.status !== 'safe' && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={20} flexShrink={0} />
                      보증보험 가입이 거절될 확률이 높으니 계약을 재고하세요.
                    </div>
                  )}
                  {calcResult.status === 'safe' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={20} flexShrink={0} />
                      수치상으로는 안전선에 있습니다. 그래도 특약은 필수입니다!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default SafeRent;
