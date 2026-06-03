import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

function WelfareYouth() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>청년 정책</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>청년들을 위한 주거, 금융, 취업 정책을 한눈에 확인하세요.</p>
      </div>

      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8), rgba(219, 234, 254, 0.8))' }}>
        <Compass size={48} style={{ color: 'var(--primary-blue)', margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>청년 도약 계좌 등 신규 정책 업데이트 중입니다</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>국무조정실 청년포털 API 연동이 진행 중입니다.</p>
        <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '99px', margin: '0 auto', display: 'inline-flex' }}>
          자세히 알아보기 <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
        </button>
      </div>
    </div>
  );
}

export default WelfareYouth;
