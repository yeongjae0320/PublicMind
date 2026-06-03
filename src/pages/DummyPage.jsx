import React from 'react';
import { ArrowRight, Compass } from 'lucide-react';

function DummyPage({ title, subtitle, apiName }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>{title}</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>{subtitle}</p>
      </div>

      <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-base)' }}>
        <Compass size={48} style={{ color: 'var(--primary-blue)', margin: '0 auto 24px auto' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>서비스 준비 중입니다</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
          **{apiName}** 무료 공공데이터 API를 연동하여 실시간 실제 데이터를 제공할 예정입니다.
        </p>
        <button className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '99px', fontSize: '1.1rem', display: 'inline-flex', gap: '8px' }}>
          출시 알림 받기 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export default DummyPage;
