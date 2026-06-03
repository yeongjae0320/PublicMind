import React, { useState } from 'react';
import { Stethoscope, User, Calendar, Activity, Info, HeartPulse, CheckCircle, Search, AlertCircle, ChevronRight, Calculator } from 'lucide-react';
import { CHECKUP_TIPS, CANCER_CRITERIA } from '../data/mockHealthCheckup';

function HealthCheckup() {
  const CURRENT_YEAR = 2026;
  
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator', 'tips'
  
  const [inputData, setInputData] = useState({
    birthYear: '',
    gender: '' // 'M' or 'F'
  });
  
  const [result, setResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    const { birthYear, gender } = inputData;
    
    if (!birthYear || birthYear.length !== 4 || isNaN(birthYear)) {
      alert("출생연도 4자리를 정확히 입력해주세요. (예: 1980)");
      return;
    }
    if (!gender) {
      alert("성별을 선택해주세요.");
      return;
    }
    
    const birthYearNum = parseInt(birthYear, 10);
    const age = CURRENT_YEAR - birthYearNum;
    
    if (age < 0 || age > 120) {
      alert("유효한 출생연도를 입력해주세요.");
      return;
    }

    setIsCalculating(true);
    setResult(null);
    
    setTimeout(() => {
      // 1. 일반 검진 대상 여부 (짝수해는 짝수년도 출생자, 홀수해는 홀수년도 출생자)
      const isEvenYear = CURRENT_YEAR % 2 === 0;
      const isEvenBirth = birthYearNum % 2 === 0;
      const isGeneralEligible = isEvenYear === isEvenBirth;
      
      // 2. 암 검진 대상 항목 추출
      const eligibleCancers = CANCER_CRITERIA.filter(cancer => {
        // 성별 체크
        if (!cancer.targetGender.includes(gender)) return false;
        
        // 나이 체크
        if (age < cancer.minAge) return false;
        if (cancer.maxAge && age > cancer.maxAge) return false;
        
        // 자궁경부암 등 2년 주기이면서 홀짝수 룰을 따르는 경우 (일반 검진과 동일)
        if (cancer.id === 'cervical' && cancer.cycle === 2) {
          if (isEvenYear !== isEvenBirth) return false;
        }
        
        return true;
      });
      
      setResult({
        age,
        isGeneralEligible,
        eligibleCancers
      });
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
      
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .skeleton-loader {
          animation: pulse-soft 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          background-color: var(--border-light);
          border-radius: 8px;
        }
        .radio-card {
          flex: 1;
          padding: 16px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          background: white;
          color: var(--text-secondary);
        }
        .radio-card.active {
          border-color: var(--primary-blue);
          background: rgba(37,99,235,0.05);
          color: var(--primary-blue);
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>내 건강검진 가이드</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '600px' }}>
          올해 나는 무슨 검사를 받아야 할까? <br/>출생연도와 성별만 입력하면 국민건강보험공단 기준 무료 검진 대상을 즉시 알려드립니다.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderRadius: '16px', padding: '8px', boxShadow: 'var(--shadow-sm)', marginBottom: '32px', border: '1px solid var(--border-light)' }}>
        {[
          { id: 'calculator', label: '올해 나의 검진 대상 조회', icon: <Calculator size={18} /> },
          { id: 'tips', label: '검진 전 필수 주의사항', icon: <AlertCircle size={18} /> }
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
        
        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="fade-in" style={{ display: 'flex', gap: '48px', alignItems: 'stretch' }}>
            
            {/* Form */}
            <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>정보 입력</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>정확한 조회를 위해 출생연도를 입력해주세요.</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                
                {/* Year Input */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>출생연도 (4자리)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Calendar size={20} />
                    </div>
                    <input 
                      type="number" 
                      value={inputData.birthYear}
                      onChange={(e) => setInputData({...inputData, birthYear: e.target.value.slice(0, 4)})}
                      placeholder="예: 1980" 
                      style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border-light)', fontSize: '1.1rem', background: '#f8fafc', outline: 'none' }} 
                    />
                  </div>
                </div>

                {/* Gender Input */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>성별</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className={`radio-card ${inputData.gender === 'M' ? 'active' : ''}`} onClick={() => setInputData({...inputData, gender: 'M'})}>
                      남성
                    </div>
                    <div className={`radio-card ${inputData.gender === 'F' ? 'active' : ''}`} onClick={() => setInputData({...inputData, gender: 'F'})}>
                      여성
                    </div>
                  </div>
                </div>

                {/* Removed spacer div to prevent stretch */}

                <button onClick={handleCalculate} disabled={isCalculating} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isCalculating ? '대상 조회 중...' : <><Search size={20} /> 나의 검진 대상 확인하기</>}
                </button>
              </div>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', background: 'var(--border-light)' }}></div>

            {/* Result Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {isCalculating ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="skeleton-loader" style={{ width: '40%', height: '32px' }}></div>
                  <div className="skeleton-loader" style={{ width: '100%', height: '80px', borderRadius: '16px' }}></div>
                  <div className="skeleton-loader" style={{ width: '30%', height: '24px', marginTop: '16px' }}></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div className="skeleton-loader" style={{ height: '100px', borderRadius: '16px' }}></div>
                    <div className="skeleton-loader" style={{ height: '100px', borderRadius: '16px' }}></div>
                    <div className="skeleton-loader" style={{ height: '100px', borderRadius: '16px' }}></div>
                  </div>
                </div>
              ) : !result ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Stethoscope size={64} style={{ opacity: 0.2, margin: '0 auto 24px auto', color: 'var(--primary-blue)' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>조회 결과가 여기에 표시됩니다</h3>
                  <p style={{ margin: 0, fontSize: '1rem' }}>국민건강보험공단 2026년 기준 데이터를 활용합니다.</p>
                </div>
              ) : (
                <div className="fade-in" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                    <div>
                      <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px' }}>
                        2026년 기준 ({result.age}세)
                      </span>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>올해 귀하의 검진 대상 내역</h3>
                    </div>
                  </div>
                  
                  {/* 일반 검진 결과 */}
                  <div style={{ background: result.isGeneralEligible ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc', border: `1px solid ${result.isGeneralEligible ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-light)'}`, padding: '24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    {result.isGeneralEligible ? (
                      <CheckCircle size={28} color="var(--accent-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <Info size={28} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: result.isGeneralEligible ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                        {result.isGeneralEligible ? '일반건강검진 대상자입니다!' : '올해는 일반건강검진 대상이 아닙니다.'}
                      </h4>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {result.isGeneralEligible 
                          ? '2026년은 짝수해이므로 짝수 연도 출생자인 귀하는 무료 일반건강검진(신장, 체중, 청력, 시력, 혈압, 혈액검사 등) 대상입니다. 가까운 병원을 예약하세요.'
                          : '일반건강검진은 2년에 1회 실시됩니다. 2026년은 짝수해이므로 짝수 연도 출생자만 대상입니다. 비사무직 근로자는 매년 대상이 될 수 있으니 직장에 확인하세요.'}
                      </p>
                    </div>
                  </div>

                  {/* 암 검진 결과 */}
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HeartPulse size={20} color="var(--accent-red)" /> 국가 암 검진 대상 ({result.eligibleCancers.length}건)
                  </h4>
                  
                  {result.eligibleCancers.length === 0 ? (
                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      올해는 연령 및 주기 기준상 해당하는 국가 암 검진 항목이 없습니다.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {result.eligibleCancers.map(cancer => (
                        <div key={cancer.id} style={{ background: 'white', border: '1px solid var(--border-light)', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h5 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--primary-blue)' }}>{cancer.name}</h5>
                            <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {cancer.cycle < 1 ? '6개월 주기' : `${cancer.cycle}년 주기`}
                            </span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                            {cancer.desc}
                          </p>
                          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{cancer.note}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TIPS TAB */}
        {activeTab === 'tips' && (
          <div className="fade-in">
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>검진 전 필수 주의사항</h2>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>정확한 검사 결과를 위해 아래 수칙을 반드시 지켜주세요.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {CHECKUP_TIPS.map((tip, idx) => (
                <div key={idx} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', marginBottom: '12px', alignSelf: 'flex-start' }}>
                    {tip.category}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>{tip.title}</h3>
                  <div style={{ background: 'rgba(37,99,235,0.03)', padding: '20px', borderRadius: '16px', flex: 1, border: '1px solid rgba(37,99,235,0.1)' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default HealthCheckup;
