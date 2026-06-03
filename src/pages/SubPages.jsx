import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function SubPages() {
  const location = useLocation();
  const path = location.pathname;

  // Simple mapping for dummy pages
  const titles = {
    '/alerts/history': '경보 이력 조회',
    '/alerts/map': '국가별 리스크 지도',
    '/suppliers/recommend': '대체 공급처 추천',
    '/suppliers/compare': '공급처 비교 분석',
    '/suppliers/contract': '계약/발주 관리',
    '/reports/quarterly': '분기별 리스크 리포트',
    '/reports/esg': '공급망 지속가능성(ESG)'
  };

  const title = titles[path] || '준비 중인 페이지';

  return (
    <div className="fade-in">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 500 }}>
        <ArrowLeft size={18} /> 대시보드로 돌아가기
      </Link>
      
      <div className="panel" style={{ padding: '64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--text-primary)' }}>{title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          해당 기능은 현재 개발 진행 중입니다. (V3 업데이트 예정)
        </p>
      </div>
    </div>
  );
}

export default SubPages;
