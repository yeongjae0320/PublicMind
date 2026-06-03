import React, { useState, useEffect } from 'react';
import { Search, MapPin, Compass, Tent, Phone, ExternalLink, Navigation, AlertTriangle, TreePine, Flame, Wifi, Coffee } from 'lucide-react';
import AiInsightCard from '../components/AiInsightCard';

const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';

function Culture() {
  const [campsites, setCampsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCampsites = async (keyword = '', pageNo = 1) => {
    if (pageNo === 1) setLoading(true);
    else setLoadingMore(true);
    
    setError(null);
    try {
      const endpoint = keyword
        ? `https://apis.data.go.kr/B551011/GoCamping/searchList`
        : `https://apis.data.go.kr/B551011/GoCamping/basedList`;
      
      const params = new URLSearchParams({
        serviceKey: API_KEY,
        numOfRows: '24',
        pageNo: pageNo.toString(),
        MobileOS: 'ETC',
        MobileApp: 'PublicMind',
        _type: 'json'
      });

      if (keyword) {
        params.append('keyword', keyword);
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('FORBIDDEN');
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const text = await res.text();
      
      if (text.includes('<OpenAPI_ServiceResponse>') || text.startsWith('<')) {
        throw new Error('FORBIDDEN');
      }
      
      const data = JSON.parse(text);
      if (data.response?.header?.resultCode === '0000') {
        const items = data.response.body.items.item || [];
        const itemsArray = Array.isArray(items) ? items : [items];
        
        if (pageNo === 1) {
          setCampsites(itemsArray);
        } else {
          setCampsites(prev => [...prev, ...itemsArray]);
        }
        setTotalCount(data.response.body.totalCount || 0);
      } else {
        throw new Error(data.response?.header?.resultMsg || 'Unknown API Error');
      }
    } catch (err) {
      if (err.message === 'FORBIDDEN' || err.message.includes('XML')) {
        setError('현재 API 인증키 서버 동기화 작업이 진행 중입니다. (승인 후 약 1~2시간 소요)\n동기화가 완료되면 전국의 캠핑장 정보가 정상적으로 표출됩니다.');
      } else {
        setError('데이터를 불러오는 중 문제가 발생했습니다: ' + err.message);
      }
      if (pageNo === 1) setCampsites([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCampsites('', 1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCampsites(searchTerm, 1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCampsites(searchTerm, nextPage);
  };

  return (
    <div className="fade-in">
      <style>{`
        @keyframes skeleton-loading {
          0% { background-color: rgba(226, 232, 240, 0.4); }
          50% { background-color: rgba(226, 232, 240, 0.8); }
          100% { background-color: rgba(226, 232, 240, 0.4); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .skeleton-box {
          animation: skeleton-loading 1.5s infinite ease-in-out;
        }
        .interactive-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .interactive-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(100, 100, 200, 0.15), 0 10px 10px -5px rgba(100, 100, 200, 0.05);
          border-color: rgba(255, 255, 255, 0.9);
        }
        .interactive-card .img-wrapper {
          overflow: hidden;
          width: 100%;
          aspect-ratio: 4 / 3;
          position: relative;
        }
        .interactive-card .img-zoom {
          width: 100%;
          height: 100%;
          background-position: center;
          background-size: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .interactive-card:hover .img-zoom {
          transform: scale(1.08);
        }
        .grid-3-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px 24px;
        }
        @media (max-width: 1024px) {
          .grid-3-col {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .grid-3-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      
      <div style={{ marginBottom: '40px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>
          공공 캠핑장 찾기
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          전국 캠핑장 정보를 실시간으로 확인하세요.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: '16px', padding: '0 20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'border-color 0.2s', ':focusWithin': { borderColor: '#4f46e5' } }}>
          <Search size={22} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="캠핑장 이름이나 지역(예: 가평, 오토캠핑)을 검색해보세요." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '18px 12px', fontSize: '1.05rem', outline: 'none', color: '#334155' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 36px', height: '58px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}>
          검색
        </button>
      </form>

      {!loading && !error && campsites.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <AiInsightCard 
            data={campsites.slice(0, 10).map(c => ({ 
              야영장명: c.facltNm, 
              한줄소개: c.lineIntro, 
              주소: c.addr1,
              테마: c.induty 
            }))} 
            context="캠핑장 검색 결과" 
          />
        </div>
      )}

      {loading ? (
        <div className="grid-3-col">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton-box" style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: '16px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-box" style={{ height: '24px', width: '70%', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ height: '16px', width: '100%', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ height: '16px', width: '50%', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <AlertTriangle size={40} color="var(--accent-red)" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>API 동기화 대기 중</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxWidth: '600px' }}>
            {error}
          </p>
          <button onClick={() => fetchCampsites(searchTerm, 1)} className="btn btn-primary" style={{ marginTop: '32px' }}>
            다시 시도하기
          </button>
        </div>
      ) : campsites.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Compass size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>검색 결과가 없습니다.</h3>
        </div>
      ) : (
        <>
          <div className="grid-3-col">
            {campsites.map((camp, idx) => (
              <div key={idx} className="interactive-card">
                {/* Image Container */}
                <div className="img-wrapper">
                  <div 
                    className="img-zoom"
                    style={{ 
                      background: camp.firstImageUrl ? `url(${camp.firstImageUrl}) center/cover` : '#f3f4f6',
                    }}
                  />
                  {!camp.firstImageUrl && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Tent size={48} color="#9ca3af" opacity={0.5} />
                    </div>
                  )}
                  {camp.induty && (
                    <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '24px', fontSize: '0.8rem', fontWeight: 700, color: '#4f46e5', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {camp.induty.split(',')[0]}
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b', lineHeight: 1.3 }}>
                    {camp.facltNm}
                  </h3>
                  
                  {camp.lineIntro && (
                    <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {camp.lineIntro}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                    <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{camp.addr1} {camp.addr2}</span>
                    </div>

                    {camp.tel && (
                      <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                        <span>{camp.tel}</span>
                      </div>
                    )}
                  </div>

                  {(camp.resveUrl || camp.homepage) && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      {camp.resveUrl && (
                        <a href={camp.resveUrl} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', padding: '10px 0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                          예약하기 <ExternalLink size={14} />
                        </a>
                      )}
                      {camp.homepage && (
                        <a href={camp.homepage} target="_blank" rel="noreferrer" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', padding: '10px 0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 1, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                          홈페이지 <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {campsites.length < totalCount && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                className="card-hover"
                style={{ 
                  padding: '14px 40px', 
                  borderRadius: '30px', 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  color: '#475569', 
                  fontSize: '1rem', 
                  fontWeight: 600, 
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {loadingMore ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    불러오는 중...
                  </>
                ) : (
                  `더보기 (${campsites.length} / ${totalCount})`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Culture;
