import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function DomainLayout({ title, menus }) {
  return (
    <div className="responsive-sidebar-layout" style={{ minHeight: 'calc(100vh - 120px)', alignItems: 'flex-start' }}>
      {/* Left Column (Sticky Container) */}
      <div className="responsive-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '100px' }}>
        {/* LNB (Local Navigation Bar) */}
        <aside className="glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.6)', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '8px', marginBottom: '24px', color: 'var(--text-primary)', paddingLeft: '12px' }}>{title}</h2>
          
          <style>{`
            .timeline-nav-item {
              cursor: pointer;
            }
            .timeline-nav-item:hover .timeline-node {
              transform: scale(1.15) !important;
              border-color: var(--primary-blue) !important;
              box-shadow: 0 0 10px rgba(37,99,235,0.2) !important;
            }
            .timeline-nav-item:hover .timeline-text {
              color: var(--primary-blue) !important;
              transform: translateX(6px) !important;
            }
          `}</style>
          
          <div style={{ position: 'relative', marginLeft: '12px', paddingBottom: '16px', paddingTop: '16px' }}>
            {/* Background vertical line */}
            <div className="timeline-vertical-line" style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '3px', background: 'var(--border-light)', zIndex: 0, borderRadius: '4px' }}></div>
            
            <div className="sidebar-menu-container" style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              {menus.map((menu, idx) => (
                <NavLink 
                  key={idx}
                  to={menu.path} 
                  style={{ textDecoration: 'none', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}
                  className={({isActive}) => `timeline-nav-item sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  {({isActive}) => (
                    <>
                      <div className="timeline-node" style={{ 
                        width: '25px', 
                        height: '25px', 
                        flexShrink: 0,
                        borderRadius: '50%', 
                        background: isActive ? 'var(--primary-blue)' : 'white',
                        border: `3px solid ${isActive ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                        boxShadow: isActive ? '0 0 15px rgba(37,99,235,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'scale(1.2)' : 'scale(1)'
                      }}>
                        {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></div>}
                      </div>
                      <span className="timeline-text" style={{ 
                        fontWeight: isActive ? 800 : 600, 
                        color: isActive ? 'var(--primary-blue)' : 'var(--text-secondary)',
                        fontSize: isActive ? '1.15rem' : '1.05rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'translateX(6px)' : 'translateX(0)'
                      }}>
                        {menu.name}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="responsive-content">
        <Outlet />
      </div>
    </div>
  );
}

export default DomainLayout;
