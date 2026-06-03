import React from 'react';
import { BookOpen, Baby, GraduationCap, School } from 'lucide-react';

function Education() {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>교육/보육</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          어린이집 대기 현황 및 유치원 정보, 지역별 학군 데이터를 한눈에 확인하세요.
        </p>
      </div>

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(254,252,232,0.8) 0%, rgba(254,249,195,0.8) 100%)' }}>
        <GraduationCap size={64} style={{ color: '#eab308', marginBottom: '24px' }} className="float" />
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#713f12', marginBottom: '16px' }}>API 연동 준비 중입니다</h2>
        <p style={{ color: '#a16207', fontSize: '1.1rem', marginBottom: '32px' }}>어린이집 정보공시포털 및 교육부 학교 알리미 공공데이터를 융합할 예정입니다.</p>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn" style={{ background: '#eab308', color: 'white', padding: '12px 24px', borderRadius: '99px', display: 'flex', gap: '8px' }}>
            <Baby size={20} /> 어린이집 빈자리 조회
          </button>
          <button className="btn" style={{ background: 'white', color: '#eab308', border: '1px solid #eab308', padding: '12px 24px', borderRadius: '99px', display: 'flex', gap: '8px' }}>
            <School size={20} /> 동네 학군 분석
          </button>
        </div>
      </div>
    </div>
  );
}

export default Education;
