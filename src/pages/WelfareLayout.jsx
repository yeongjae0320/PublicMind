import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Search, Users, Lightbulb, Navigation } from 'lucide-react';

function WelfareLayout() {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', gap: '32px', minHeight: 'calc(100vh - 120px)', alignItems: 'flex-start' }}>
      {/* LNB (Local Navigation Bar) */}
      <aside style={{ width: '240px', flexShrink: 0, padding: '24px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px', position: 'sticky', top: '100px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)', paddingLeft: '8px' }}>복지/지원금</h2>
        
        <NavLink 
          to="/welfare/search" 
          style={({isActive}) => ({ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)', background: isActive ? 'rgba(37,99,235,0.1)' : 'transparent', textDecoration: 'none' })}
        >
          <Search size={18} /> 맞춤 지원금 찾기
        </NavLink>
        <NavLink 
          to="/welfare/youth" 
          style={({isActive}) => ({ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)', background: isActive ? 'rgba(37,99,235,0.1)' : 'transparent', textDecoration: 'none' })}
        >
          <Lightbulb size={18} /> 청년 정책
        </NavLink>
        <NavLink 
          to="/welfare/community" 
          style={({isActive}) => ({ padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)', background: isActive ? 'rgba(37,99,235,0.1)' : 'transparent', textDecoration: 'none' })}
        >
          <Users size={18} /> 복지 커뮤니티
        </NavLink>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* If exact match to /welfare, redirect logic could be here, but we will handle it in App.jsx routing */}
        <Outlet />
      </div>
    </div>
  );
}

export default WelfareLayout;
