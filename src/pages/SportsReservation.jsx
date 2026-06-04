import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, CreditCard, ExternalLink, Activity, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import AiInsightCard from '../components/AiInsightCard';

function SportsReservation() {
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Categories
  const categories = ['전체', '테니스장', '축구장', '풋살장', '배드민턴장', '야구장', '다목적경기장'];
  const [activeCategory, setActiveCategory] = useState('전체');

  useEffect(() => {
    setCurrentPage(1);
    fetchFacilities(activeCategory);
  }, [activeCategory]);

  const fetchFacilities = async (category) => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      // 서울시 공공서비스예약 오픈 API (정식 키 적용 - 최대 100건 조회)
      const path = `/6344764652706f77313132646f63666d/json/ListPublicReservationSport/1/100/`;
      let url = import.meta.env.DEV ? `/api/seoul${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("http://openapi.seoul.go.kr:8088" + path)}`;
      if (category !== '전체') {
        url += category;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Response Error');
      
      const data = await response.json();
      
      if (data.RESULT && data.RESULT.CODE && data.RESULT.CODE !== 'INFO-000') {
        // 서울시 API 에러
        if (data.RESULT.CODE === 'INFO-200') {
          setFacilities([]);
        } else {
          throw new Error(data.RESULT.MESSAGE);
        }
      } else if (data.ListPublicReservationSport && data.ListPublicReservationSport.row) {
        setFacilities(data.ListPublicReservationSport.row);
      } else {
        setFacilities([]);
      }
    } catch (err) {
      console.error("Failed to fetch sports facilities", err);
      setErrorMsg('공공 체육시설 예약 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case '접수중':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> {status}</span>;
      case '안내중':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {status}</span>;
      case '예약마감':
      case '접수종료':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{status}</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{status}</span>;
    }
  };

  const handleReservationClick = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>
          공공 체육시설 예약
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          서울시 전역의 공공 체육시설 빈자리를 실시간으로 확인하고 간편하게 예약하세요.
        </p>
      </div>

      <div className="responsive-grid-2-1" style={{ gap: '32px' }}>
        {/* 왼쪽 패널: 컨텐츠 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          
          {/* 필터 */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              종목 선택
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '99px',
                    border: `1px solid ${activeCategory === cat ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                    background: activeCategory === cat ? 'var(--primary-blue)' : 'white',
                    color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                    fontWeight: activeCategory === cat ? 700 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: activeCategory === cat ? '0 4px 12px rgba(37,99,235,0.2)' : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 리스트 영역 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                실시간 예약 현황 <span style={{ color: 'var(--primary-blue)' }}>{facilities.length > 0 ? `(최대 100건)` : ''}</span>
              </h3>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <style>{`
                  @keyframes pulse-soft {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                  }
                  .skeleton-card {
                    animation: pulse-soft 1.5s ease-in-out infinite;
                    background-color: white;
                    border: 1px solid var(--border-light);
                    border-radius: 20px;
                    height: 180px;
                  }
                `}</style>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card" style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                    <div style={{ width: '140px', height: '140px', background: 'var(--border-light)', borderRadius: '12px' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
                      <div style={{ width: '60px', height: '24px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                      <div style={{ width: '80%', height: '24px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                      <div style={{ width: '40%', height: '16px', background: 'var(--border-light)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : errorMsg ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {errorMsg}
              </div>
            ) : facilities.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '20px' }}>
                <Search size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p style={{ fontSize: '1.1rem', margin: 0 }}>선택하신 종목의 예약 가능한 체육시설이 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {facilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((fac) => (
                  <div key={fac.SVCID} className="glass-panel hover-card" style={{ padding: '16px', borderRadius: '16px', display: 'flex', gap: '16px', border: '1px solid var(--border-light)', background: 'white', alignItems: 'flex-start' }}>
                    
                    {/* 썸네일 이미지 */}
                    <div style={{ width: '130px', height: '130px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', border: '1px solid var(--border-light)', position: 'relative' }}>
                      {fac.IMGURL ? (
                        <img src={fac.IMGURL} alt={fac.SVCNM} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      ) : null}
                      <div style={{ display: fac.IMGURL ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Activity size={24} opacity={0.3} />
                      </div>
                    </div>

                    {/* 상세 정보 */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '99px' }}>
                            {fac.MINCLASSNM}
                          </span>
                          {getStatusBadge(fac.SVCSTATNM)}
                        </div>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0', lineHeight: 1.3, wordBreak: 'keep-all' }}>
                        {fac.SVCNM}
                      </h4>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <MapPin size={14} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{fac.PLACENM} ({fac.AREANM})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>접수: {fac.RCPTBGNDT ? fac.RCPTBGNDT.substring(0, 10) : '상시'} ~ {fac.RCPTENDDT ? fac.RCPTENDDT.substring(0, 10) : ''}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <CreditCard size={14} style={{ flexShrink: 0 }} /> <span style={{ color: fac.PAYATNM === '무료' ? '#059669' : 'inherit', fontWeight: fac.PAYATNM === '무료' ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{fac.PAYATNM}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleReservationClick(fac.SVCURL)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: fac.SVCSTATNM === '접수중' ? 'var(--primary-blue)' : '#cbd5e1',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: fac.SVCSTATNM === '접수중' ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                          disabled={fac.SVCSTATNM !== '접수중'}
                        >
                          {fac.SVCSTATNM === '접수중' ? '예약하기' : '예약 불가'}
                          {fac.SVCSTATNM === '접수중' && <ExternalLink size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {facilities.length > itemsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)',
                        background: currentPage === 1 ? '#f1f5f9' : 'white',
                        color: currentPage === 1 ? '#94a3b8' : 'var(--text-primary)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      이전
                    </button>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {currentPage} / {Math.ceil(facilities.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(facilities.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(facilities.length / itemsPerPage)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)',
                        background: currentPage === Math.ceil(facilities.length / itemsPerPage) ? '#f1f5f9' : 'white',
                        color: currentPage === Math.ceil(facilities.length / itemsPerPage) ? '#94a3b8' : 'var(--text-primary)',
                        cursor: currentPage === Math.ceil(facilities.length / itemsPerPage) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 우측 패널: AI 분석 & 안내 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <AiInsightCard 
            data={facilities}
            context={`선택된 종목: ${activeCategory}. 서울시 공공서비스예약 API 기반 실시간 데이터입니다.`}
          />
          
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>예약 필수 안내</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>본인인증 필수</strong><br/>
                  모든 공공 체육시설 예약 및 결제는 서울시 통합 회원가입 및 실명인증이 필요합니다.
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>우천 시 취소</strong><br/>
                  야외 시설(축구장, 테니스장 등)은 우천 등 기상 악화 시 자동 취소 및 환불 처리될 수 있습니다.
                </span>
              </li>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>예약 확인</strong><br/>
                  예약 내역은 결제까지 모두 완료되어야 최종 확정되며, 마이페이지가 아닌 카카오톡/문자로 개별 안내됩니다.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SportsReservation;
