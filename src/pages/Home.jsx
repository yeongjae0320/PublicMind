import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, MapPin, ShieldAlert, HeartPulse, Car, Leaf, BookOpen, Tent, Mic } from 'lucide-react';
import VoiceNavigatorModal from '../components/VoiceNavigatorModal';

const CARDS = [
  { id: 'welfare', title: '복지/지원금 조회기', desc: '보조금24 등 공공데이터를 융합하여 내가 받을 수 있는 숨은 지원금을 1초 만에 찾아줍니다.', icon: <Wallet size={24} color="var(--primary-blue)" />, path: '/welfare', image: '/images/welfare.png', fallback: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
  { id: 'realestate', title: '부동산/입지 분석기', desc: '국토교통부 실거래가 및 상권 데이터를 융합하여 내 라이프스타일에 딱 맞는 동네를 찾아줍니다.', icon: <MapPin size={24} color="var(--accent-amber)" />, path: '/real-estate', image: '/images/realestate.png', fallback: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { id: 'travel', title: '글로벌 재난/안전 대시보드', desc: '외교부 해외안전여행 및 세계 기상 기구 데이터를 실시간으로 모니터링합니다.', icon: <ShieldAlert size={24} color="var(--accent-red)" />, path: '/travel-safety', image: '/images/travel.png', fallback: 'linear-gradient(135deg, #ef4444, #f87171)' },
  { id: 'health', title: '보건/의료 내비게이션', desc: '가까운 심야 약국부터 질병별 1등급 병원까지, 건강 정보를 한눈에 제공합니다.', icon: <HeartPulse size={24} color="#ec4899" />, path: '/health', image: '/images/health.png', fallback: 'linear-gradient(135deg, #db2777, #ec4899)' },
  { id: 'traffic', title: '실시간 도로/CCTV', desc: '국토교통부 실시간 도로소통 정보와 전국 고속도로 CCTV 영상을 한눈에 확인하세요.', icon: <Car size={24} color="#8b5cf6" />, path: '/traffic', image: '/images/traffic.png', fallback: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { id: 'environment', title: '환경/재난 알리미', desc: '내 주변 미세먼지 수치부터 비상시 대피소 위치까지, 안전한 환경을 책임집니다.', icon: <Leaf size={24} color="#10b981" />, path: '/environment', image: '/images/environment.png', fallback: 'linear-gradient(135deg, #059669, #10b981)' },
  { id: 'education', title: '교육/보육 솔루션', desc: '어린이집 대기 현황과 초중고 학군 분석 데이터를 통해 완벽한 교육 환경을 설계하세요.', icon: <BookOpen size={24} color="#f59e0b" />, path: '/education', image: '/images/education.png', fallback: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  { id: 'culture', title: '문화/여가 가이드', desc: '무료 문화 축제부터 국공립 캠핑장 예약 현황까지, 풍성한 여가 생활을 지원합니다.', icon: <Tent size={24} color="#14b8a6" />, path: '/culture', image: '/images/culture.png', fallback: 'linear-gradient(135deg, #0d9488, #14b8a6)' },
];

function Home() {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with middle card active
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const navigate = useNavigate();

  // 자동 회전(Autoplay) 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, 3000); // 3초마다 한 칸씩 회전
    return () => clearInterval(timer);
  }, []);

  // Glow Effect Mouse Tracker
  const handleMouseMove = (e, index) => {
    const card = document.getElementById(`glow-card-${index}`);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardClick = (index, path) => {
    if (currentIndex === index) {
      // If clicking the active card, navigate to it
      navigate(path);
    } else {
      // Otherwise, rotate the carousel to make it active
      setCurrentIndex(index);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 140px)', textAlign: 'center' }}>
      
      <div className="fade-in-stagger-1" style={{ maxWidth: '800px', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>
        <h1 className="hero-title" style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em' }}>
          일상을 혁신하는 <br />
          <span className="text-gradient">공공데이터 슈퍼앱</span>
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '40px', fontWeight: 400, maxWidth: '600px', margin: '0 auto 40px auto' }}>
          숨은 정부 지원금부터 최적의 부동산 입지, 글로벌 안전 지도까지. 
          당신의 일상을 완벽하게 케어합니다.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/ai-assistant')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.125rem', borderRadius: '99px' }}>
            통합 어시스턴트 시작하기 <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="coverflow-wrapper fade-in-stagger-2">
        {Array(3).fill(CARDS).flat().map((card, index) => {
          // 8 unique cards * 3 copies = 24 total cards for smooth infinite rotation
          const TOTAL = 24;
          let offset = ((index - currentIndex + TOTAL + Math.floor(TOTAL/2)) % TOTAL) - Math.floor(TOTAL/2);
          let zIndex = 100 - Math.abs(offset);
          
          let rotateZ = offset * 15; // 8개의 카드가 촘촘히 겹치도록 15도 각도 부여
          
          return (
            <div
              key={`${card.id}-${index}`}
              style={{
                position: 'absolute',
                top: '1100px', // 원판의 중심축을 래퍼 상단 기준 1100px 지점에 위치시킴
                left: '50%',   // 가로 정중앙
                transform: `rotate(${rotateZ}deg)`, // 중심축 자체를 회전
                zIndex: zIndex,
                transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div 
                id={`glow-card-${index}`}
                className={`coverflow-card glow-card ${offset === 0 ? 'active' : ''}`}
                style={{
                  position: 'absolute',
                  top: '-850px',
                  marginLeft: '-160px',
                  marginTop: '-210px',
                  width: '320px',
                  height: '420px',
                  flexShrink: 0,
                  transform: 'none',
                }}
                onClick={() => handleCardClick(index, card.path)}
                onMouseMove={(e) => handleMouseMove(e, index)}
              >
                <div className="coverflow-card-bg" style={{ backgroundImage: `url(${card.image})`, background: `url(${card.image}) center/cover, ${card.fallback}` }}></div>
                <div className="coverflow-card-content" style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{card.title}</h3>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{card.desc}</p>
                  {offset === 0 && (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '99px', width: 'fit-content' }}>
                      자세히 보기 <ArrowRight size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Voice Action Button (Bottom Right) */}
      {createPortal(
        <div 
          onClick={() => setIsVoiceOpen(true)}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #d946ef)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Mic color="white" size={28} />
        </div>,
        document.body
      )}

      <VoiceNavigatorModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}

export default Home;
