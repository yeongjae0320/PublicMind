import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Phone, Music, AlertTriangle, Compass } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';

const API_KEY = '7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99';

function Festival() {
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFestivals = async (pageNo = 1) => {
    if (pageNo === 1) setLoading(true);
    else setLoadingMore(true);
    
    setError(null);
    try {
      const today = new Date();
      
      // 1달 전부터의 데이터를 가져와서 진행 중인 축제 포함
      const pastDate = new Date(today);
      pastDate.setMonth(today.getMonth() - 1);
      const yyyy = pastDate.getFullYear();
      const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pastDate.getDate()).padStart(2, '0');
      const startDate = `${yyyy}${mm}${dd}`;

      // 필터링용 오늘 날짜
      const tY = today.getFullYear();
      const tM = String(today.getMonth() + 1).padStart(2, '0');
      const tD = String(today.getDate()).padStart(2, '0');
      const todayFormatted = `${tY}${tM}${tD}`;

      const params = new URLSearchParams({
        serviceKey: API_KEY,
        numOfRows: '50', // 필터링으로 줄어들 것을 대비해 넉넉하게
        pageNo: pageNo.toString(),
        MobileOS: 'ETC',
        MobileApp: 'PublicMind',
        _type: 'json',
        eventStartDate: startDate,
        arrange: 'A'
      });

      const res = await fetch(`https://apis.data.go.kr/B551011/KorService2/searchFestival2?${params.toString()}`);
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
        
        // 이미 종료된 축제는 제외 (오늘 날짜 이후에 끝나는 축제만 포함)
        const validItems = itemsArray.filter(item => {
          return item.eventenddate && item.eventenddate >= todayFormatted;
        });
        
        if (pageNo === 1) {
          setFestivals(validItems);
        } else {
          setFestivals(prev => {
            // 중복 제거
            const existingIds = new Set(prev.map(f => f.contentid));
            const newValidItems = validItems.filter(f => !existingIds.has(f.contentid));
            return [...prev, ...newValidItems];
          });
        }
        setTotalCount(data.response.body.totalCount || 0);
      } else {
        throw new Error(data.response?.header?.resultMsg || 'Unknown API Error');
      }
    } catch (err) {
      if (err.message === 'FORBIDDEN' || err.message.includes('XML')) {
        setError('현재 API 인증키 서버 동기화 작업이 진행 중입니다. (승인 후 약 1~2시간 소요)\n동기화가 완료되면 전국의 무료 축제/공연 정보가 정상적으로 표출됩니다.');
      } else {
        setError('데이터를 불러오는 중 문제가 발생했습니다: ' + err.message);
      }
      if (pageNo === 1) setFestivals([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFestivals(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchFestivals(nextPage);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString.length !== 8) return dateString;
    return `${dateString.slice(0, 4)}.${dateString.slice(4, 6)}.${dateString.slice(6, 8)}`;
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
          aspect-ratio: 1 / 1;
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
          무료 축제/공연
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          현재 진행 중이거나 예정된 지역별 문화 축제를 알려드립니다.
        </p>
      </div>

      {loading ? (
        <div className="grid-3-col">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton-box" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '16px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-box" style={{ height: '20px', width: '80%', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ height: '16px', width: '60%', borderRadius: '4px' }}></div>
                <div className="skeleton-box" style={{ height: '16px', width: '40%', borderRadius: '4px' }}></div>
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
          <button onClick={() => fetchFestivals(1)} className="btn btn-primary" style={{ marginTop: '32px' }}>
            새로고침
          </button>
        </div>
      ) : festivals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Compass size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>예정된 축제 정보가 없습니다.</h3>
        </div>
      ) : (
        <>
          <div className="grid-3-col">
            {festivals.map((festival, idx) => (
              <div key={idx} className="interactive-card" style={{ cursor: 'pointer' }}>
                {/* Image Container */}
                <div className="img-wrapper">
                  <div 
                    className="img-zoom"
                    style={{ 
                      background: festival.firstimage ? `url(${festival.firstimage}) center/cover` : '#f3f4f6',
                    }}
                  />
                  {!festival.firstimage && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Music size={48} color="#9ca3af" opacity={0.5} />
                    </div>
                  )}
                  {/* Top Right Badge & Bookmark */}
                  <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '24px', fontSize: '0.8rem', fontWeight: 700, color: '#ec4899', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      축제/행사
                    </div>
                    <div onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <BookmarkButton item={festival} type="festival" title={festival.title} subtitle={festival.addr1} link={festival.firstimage || ''} itemId={festival.contentid} />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e293b', lineHeight: 1.4, wordBreak: 'keep-all' }}>
                    {festival.title}
                  </h3>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(236, 72, 153, 0.1)', color: '#db2777', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, width: 'fit-content' }}>
                    <Calendar size={14} />
                    {formatDate(festival.eventstartdate)} ~ {formatDate(festival.eventenddate)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{festival.addr1}</span>
                    </div>

                    {festival.tel && (
                      <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                        <span>{festival.tel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {festivals.length < totalCount && (
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
                    <div style={{ width: '18px', height: '18px', border: '3px solid #e2e8f0', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    불러오는 중...
                  </>
                ) : (
                  `더보기 (${festivals.length} / ${totalCount})`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Festival;
