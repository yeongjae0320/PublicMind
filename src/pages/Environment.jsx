import React, { useState } from 'react';
import { Leaf, Wind, ShieldAlert, CloudRain } from 'lucide-react';
import FineDust from './FineDust';
import Shelter from './Shelter';

import { useNavigate } from 'react-router-dom';

function Environment() {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>환경/생활안전</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', marginBottom: '24px' }}>
          초미세먼지, 오존 경보, 장마철 상습 침수 구역 정보를 실시간으로 확인하세요.
        </p>
        
        {/* Tab Menu */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button 
            className="glass-panel"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#10b981', color: 'white', fontWeight: 700, borderRadius: '99px', border: 'none', boxShadow: '0 10px 20px -5px rgba(16,185,129,0.4)', transition: 'all 0.3s ease' }}
          >
            <Wind size={20} /> 실시간 미세먼지
          </button>
          <button 
            onClick={() => navigate('/environment/shelter')}
            className="glass-panel"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.8)', color: 'var(--text-secondary)', fontWeight: 700, borderRadius: '99px', border: 'none', boxShadow: 'var(--shadow-sm)', transition: 'all 0.3s ease' }}
          >
            <ShieldAlert size={20} /> 주변 대피소 찾기
          </button>
        </div>
      </div>

      <FineDust />
    </div>
  );
}

export default Environment;
