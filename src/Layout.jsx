import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const SEARCHABLE_ITEMS = [
  { title: '복지/지원금', path: '/welfare', desc: '맞춤 지원금 찾기, 청년 정책' },
  { title: '맞춤 지원금 찾기', path: '/welfare/search', desc: '정부 보조금 검색' },
  { title: '청년 정책', path: '/welfare/youth', desc: '청년 구직활동지원금 등' },
  { title: '부동산/입지', path: '/real-estate', desc: '조건별 동네 찾기, 실거래가, 전세/월세 지킴이' },
  { title: '조건별 동네 찾기', path: '/real-estate/search', desc: '내 예산에 맞는 동네 찾기' },
  { title: '실거래가 분석', path: '/real-estate/analysis', desc: '아파트 실거래가 조회' },
  { title: '전세/월세 지킴이', path: '/real-estate/safety', desc: '전세 사기 예방 가이드' },
  { title: '교통/주차', path: '/traffic', desc: '실시간 도로 및 주차장' },
  { title: '빈 주차장 찾기', path: '/traffic/parking', desc: '공영 주차장 현황' },
  { title: '실시간 도로/CCTV', path: '/traffic/road', desc: '고속도로 상황 실시간 확인' },
  { title: '보건/의료', path: '/health', desc: '약국, 병원 정보, 내 건강검진 가이드' },
  { title: '심야/휴일 약국', path: '/health/pharmacy', desc: '24시간 문 여는 약국' },
  { title: '1등급 병원 검색', path: '/health/hospital', desc: '질병별 우수 병원' },
  { title: '내 건강검진 가이드', path: '/health/checkup', desc: '나에게 맞는 건강검진 찾기' },
  { title: '환경/안전', path: '/environment', desc: '미세먼지, 대피소, 안심 귀갓길' },
  { title: '미세먼지/오존', path: '/environment/air', desc: '실시간 대기질 정보' },
  { title: '지진해일 대피소', path: '/environment/shelter', desc: '해안가 대피소 찾기' },
  { title: '안심 귀갓길 지도', path: '/environment/safety-map', desc: 'CCTV 및 비상벨 위치' },
  { title: '글로벌 안전', path: '/travel-safety', desc: '해외 여행 경보' },
  { title: '실시간 경보 지도', path: '/travel-safety/map', desc: '국가별 안전 정보' },
  { title: '영사관 연락처', path: '/travel-safety/contacts', desc: '해외 영사관 비상 연락처' },
  { title: '교육/보육', path: '/education', desc: '어린이집, 학군 분석' },
  { title: '어린이집 현황', path: '/education/childcare', desc: '대기 현황 및 정원' },
  { title: '학군 분석', path: '/education/school-district', desc: '초중고 학업성취도 분석' },
  { title: '문화/여가', path: '/culture', desc: '캠핑장, 축제, 체육시설' },
  { title: '공공 캠핑장', path: '/culture/camping', desc: '전국 공공 캠핑장 예약 현황' },
  { title: '무료 축제/공연', path: '/culture/festival', desc: '문화행사 및 축제 안내' },
  { title: '공공 체육시설 예약', path: '/culture/sports', desc: '축구장, 테니스장 등 예약' },
  { title: 'AI 어시스턴트', path: '/ai-assistant', desc: 'AI에게 물어보는 통합 검색' }
];
import { Globe, Search, Menu, Sparkles, Building, Plane, HeartPulse, Car, Leaf, GraduationCap, Tent, DollarSign, ChevronRight, LogOut, User } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowBubble(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-base)' }}>
        <Outlet />
      </div>
    );
  }

  const megaMenuCategories = [
    {
      title: '라이프/경제',
      items: [
        { name: '복지/지원금', path: '/welfare', icon: <DollarSign size={18}/>, submenus: [
          {name: '맞춤 지원금 찾기', path: '/welfare/search'}, 
          {name: '청년 정책', path: '/welfare/youth'}, 
          {name: '복지 커뮤니티', path: '/welfare/community'}
        ] },
        { name: '부동산/입지', path: '/real-estate', icon: <Building size={18}/>, submenus: [
          {name: '조건별 동네 찾기', path: '/real-estate/search'}, 
          {name: '실거래가 분석', path: '/real-estate/analysis'}, 
          {name: '전세/월세 지킴이', path: '/real-estate/safety'}, 
          {name: '부동산 커뮤니티', path: '/real-estate/community'}
        ] },
        { name: '교통/주차', path: '/traffic', icon: <Car size={18}/>, submenus: [
          {name: '빈 주차장 찾기', path: '/traffic/parking'}, 
          {name: '실시간 도로/CCTV', path: '/traffic/road'}, 
          {name: '교통 커뮤니티', path: '/traffic/community'}
        ] }
      ]
    },
    {
      title: '건강/안전',
      items: [
        { name: '보건/의료', path: '/health', icon: <HeartPulse size={18}/>, submenus: [
          {name: '심야/휴일 약국', path: '/health/pharmacy'}, 
          {name: '1등급 병원 검색', path: '/health/hospital'}, 
          {name: '내 건강검진 가이드', path: '/health/checkup'}, 
          {name: '보건 커뮤니티', path: '/health/community'}
        ] },
        { name: '환경/안전', path: '/environment', icon: <Leaf size={18}/>, submenus: [
          {name: '미세먼지/오존', path: '/environment/air'}, 
          {name: '지진해일 대피소', path: '/environment/shelter'}, 
          {name: '안심 귀갓길 지도', path: '/environment/safety-map'}, 
          {name: '환경 커뮤니티', path: '/environment/community'}
        ] },
        { name: '글로벌 안전', path: '/travel-safety', icon: <Plane size={18}/>, submenus: [
          {name: '실시간 경보 지도', path: '/travel-safety/map'}, 
          {name: '영사관 연락처', path: '/travel-safety/contacts'}, 
          {name: '여행 커뮤니티', path: '/travel-safety/community'}
        ] }
      ]
    },
    {
      title: '교육/문화',
      items: [
        { name: '교육/보육', path: '/education', icon: <GraduationCap size={18}/>, submenus: [
          {name: '어린이집 현황', path: '/education/childcare'}, 
          {name: '학군 분석', path: '/education/school-district'}, 
          {name: '교육 커뮤니티', path: '/education/community'}
        ] },
        { name: '문화/여가', path: '/culture', icon: <Tent size={18}/>, submenus: [
          {name: '공공 캠핑장', path: '/culture/camping'}, 
          {name: '무료 축제/공연', path: '/culture/festival'}, 
          {name: '공공 체육시설 예약', path: '/culture/sports'}, 
          {name: '문화 커뮤니티', path: '/culture/community'}
        ] }
      ]
    }
  ];

  return (
    <div className="app-container">
      {/* Floating Header */}
      <header style={{ position: 'sticky', top: '16px', zIndex: 50, margin: '0 auto 48px auto', maxWidth: '1200px', width: '95%' }}>
        <div 
          className="header-container" 
          style={{ 
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', 
            borderRadius: '24px', padding: '12px 24px', boxShadow: 'var(--shadow-md)', border: '1px solid rgba(255,255,255,0.9)',
            position: 'relative', overflowX: 'auto', scrollbarWidth: 'none'
          }}
          onMouseLeave={() => setIsMegaMenuOpen(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {/* Left Section: Logo + Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Logo */}
              <Link to="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-blue)' }} onClick={() => setIsMegaMenuOpen(false)}>
                <Globe size={22} />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>PublicMind</span>
              </Link>

              {/* Divider */}
              <div className="core-nav-link" style={{ width: '1px', height: '20px', background: 'var(--border-light)', margin: '0 4px' }}></div>

              {/* Core GNB Navigation */}
              <nav className="header-nav" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div 
                  className="nav-item mega-menu-trigger" 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', padding: '6px 10px', background: isMegaMenuOpen ? 'rgba(37,99,235,0.05)' : 'transparent', borderRadius: '12px', color: isMegaMenuOpen ? 'var(--primary-blue)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                >
                  <Menu size={16} /> 전체 서비스
                </div>
                <Link to="/welfare" className="nav-item core-nav-link" style={{ fontSize: '0.9rem', color: location.pathname.includes('/welfare') ? 'var(--primary-blue)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }} onClick={() => setIsMegaMenuOpen(false)}>복지/지원금</Link>
                <Link to="/real-estate" className="nav-item core-nav-link" style={{ fontSize: '0.9rem', color: location.pathname.includes('/real-estate') ? 'var(--primary-blue)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }} onClick={() => setIsMegaMenuOpen(false)}>부동산/입지</Link>
                <Link to="/ai-assistant" className="nav-item core-nav-link" style={{ fontSize: '0.9rem', color: location.pathname === '/ai-assistant' ? 'var(--primary-blue)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }} onClick={() => setIsMegaMenuOpen(false)}>
                  AI 어시스턴트
                </Link>
              </nav>
            </div>

            {/* Right Section: Search + User Actions */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="header-search core-nav-link" style={{ position: 'relative', width: '180px' }} ref={searchRef}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 2 }} />
                <input 
                  type="text" 
                  placeholder="메뉴, 기능 검색..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px',
                    background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)',
                    borderRadius: isSearchOpen ? '16px 16px 0 0' : '99px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem',
                    transition: 'all 0.2s ease', position: 'relative', zIndex: 2
                  }}
                />
                
                {/* Search Dropdown */}
                {isSearchOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(226,232,240,0.8)', borderTop: 'none',
                    borderRadius: '0 0 16px 16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    maxHeight: '300px', overflowY: 'auto', zIndex: 1, paddingTop: '4px'
                  }}>
                    {searchQuery.trim() === '' ? (
                      <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                        검색어를 입력하세요.<br/><span style={{fontSize: '0.75rem'}}>(예: 대피소, 주차장, 지원금)</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {SEARCHABLE_ITEMS.filter(item => 
                          item.title.includes(searchQuery) || item.desc.includes(searchQuery)
                        ).length > 0 ? (
                          SEARCHABLE_ITEMS.filter(item => 
                            item.title.includes(searchQuery) || item.desc.includes(searchQuery)
                          ).map((item, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => {
                                navigate(item.path);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              style={{ 
                                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                                display: 'flex', flexDirection: 'column', gap: '4px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-blue)' }}>{item.title}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                            검색 결과가 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Divider between Search and Profile */}
              <div className="core-nav-link" style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>

              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }} ref={userMenuRef}>
                    <div 
                      onClick={() => setShowBubble(!showBubble)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', padding: '4px 8px', borderRadius: '99px', transition: 'background 0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                        <User size={16} color="var(--primary-blue)" />
                      </div>
                      {currentUser.displayName || currentUser.email?.split('@')[0]}님
                    </div>
                    
                    {showBubble && (
                      <div className="real-bubble-container">
                        <div className="real-bubble" onClick={() => { setShowBubble(false); navigate('/mypage'); }}>
                          <User size={36} color="var(--primary-blue)" strokeWidth={2} style={{ filter: 'drop-shadow(0 2px 4px rgba(255,255,255,0.8))' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Divider between Profile and Logout */}
                  <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }}></div>

                  <button onClick={handleLogout} className="btn" style={{ padding: '6px 12px', borderRadius: '99px', background: 'var(--bg-base)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <LogOut size={14} /> 로그아웃
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                  <Link to="/login" className="btn" style={{ padding: '6px 12px', borderRadius: '99px', background: 'var(--bg-base)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none' }} onClick={() => setIsMegaMenuOpen(false)}>
                    <User size={14} /> 로그인
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mega Dropdown Panel */}
          {isMegaMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, paddingTop: '12px', zIndex: 100 }}>
              <div className="mega-menu-panel fade-in" style={{ 
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', 
                borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
                border: '1px solid rgba(255,255,255,0.8)',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px'
              }}>
                {megaMenuCategories.map((category, idx) => (
                <div key={idx}>
                  <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    {category.title}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {category.items.map((item, i) => (
                      <div key={i} className="mega-menu-item" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '12px', margin: '-12px', borderRadius: '16px', transition: 'background 0.2s' }}>
                        <Link to={item.path} className="mega-menu-icon" style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(37, 99, 235, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', flexShrink: 0, transition: 'all 0.2s' }} onClick={() => setIsMegaMenuOpen(false)}>
                          {item.icon}
                        </Link>
                        <div>
                          <Link to={item.path} className="mega-menu-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', transition: 'color 0.2s' }} onClick={() => setIsMegaMenuOpen(false)}>
                            {item.name} <ChevronRight className="mega-menu-chevron" size={14} style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} />
                          </Link>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {item.submenus.map((sub, sIdx) => (
                              <Link key={sIdx} to={sub.path} className="mega-menu-badge" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: '4px', transition: 'all 0.2s' }} onClick={() => setIsMegaMenuOpen(false)}>
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Responsive Styles embedded for Mega Menu & Core Links */}
      <style>{`
        .real-bubble-container {
          position: absolute; 
          top: 150%; 
          left: 50%;
          margin-left: -40px;
          z-index: 100;
          animation: bubblePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: top center;
        }
        .real-bubble {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.85), rgba(167, 139, 250, 0.25) 50%, rgba(255, 255, 255, 0) 80%);
          box-shadow: 
            inset -6px -6px 12px rgba(59, 130, 246, 0.25),
            inset 6px 6px 16px rgba(255, 255, 255, 0.95),
            0 10px 20px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          animation: floatBubble 2s ease-in-out infinite alternate;
          transition: transform 0.2s;
        }
        .real-bubble:hover {
          transform: scale(1.05) !important;
        }
        .real-bubble-text {
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--primary-blue);
          text-align: center;
          line-height: 1.1;
          text-shadow: 0 1px 3px rgba(255, 255, 255, 1);
        }
        @keyframes floatBubble {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-8px); }
        }
        @keyframes bubblePop {
          0% { transform: scale(0) rotate(10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .mega-menu-item:hover {
          background: rgba(37, 99, 235, 0.04) !important;
        }
        .mega-menu-item:hover .mega-menu-title {
          color: var(--primary-blue) !important;
        }
        .mega-menu-item:hover .mega-menu-icon {
          background: rgba(37, 99, 235, 0.1) !important;
          transform: scale(1.05);
        }
        .mega-menu-item:hover .mega-menu-chevron {
          color: var(--primary-blue) !important;
        }
        .mega-menu-badge:hover {
          background: rgba(37, 99, 235, 0.08) !important;
          color: var(--primary-blue) !important;
        }
        @media (max-width: 768px) {
          .mega-menu-panel {
            grid-template-columns: 1fr !important;
            max-height: 70vh;
            overflow-y: auto;
            padding: 20px !important;
          }
          .core-nav-link {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Content Area */}
      <main className="main-content" style={{ padding: '24px 0', flex: 1, maxWidth: '1200px', width: '95%', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-light)', padding: '32px 24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Globe size={16} color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PublicMind</span>
        </div>
        <p>Email: poweryjkim@naver.com</p>
        <p style={{ marginTop: '4px', color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Layout;
