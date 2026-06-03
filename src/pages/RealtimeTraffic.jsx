import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchTrafficInfo, fetchEventInfo, fetchCctvInfo } from '../services/trafficApi';
import { ExternalLink, X, ShieldAlert } from 'lucide-react';

function RealtimeTraffic() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [events, setEvents] = useState([]);
  const [cctvs, setCctvs] = useState([]);
  
  const [selectedCctv, setSelectedCctv] = useState(null); // URL for modal
  const [activeTab, setActiveTab] = useState('cctv'); // cctv, event
  
  const [cctvPage, setCctvPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const itemsPerPage = 5;
  
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markersRef = useRef([]); // Combine event and cctv markers
  const clustererRef = useRef(null);
  
  const [mapBounds, setMapBounds] = useState(null);

  // Debounce fetching
  const fetchTimeout = useRef(null);

  const initMap = () => {
    if (!window.kakao || !window.kakao.maps) {
      setErrorMsg('카카오 지도 API가 로드되지 않았습니다.');
      setLoading(false);
      return;
    }

    // Default to Seoul City Hall
    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
      level: 7 // Wide enough to see highways
    };

    const map = new window.kakao.maps.Map(container, options);
    
    // Add real-time traffic layer provided by Kakao Map (this takes care of the green/yellow/red lines!)
    map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
    
    kakaoMapRef.current = map;

    // Listen to bounds change
    window.kakao.maps.event.addListener(map, 'idle', () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      const newBounds = {
        minX: sw.getLng(),
        maxX: ne.getLng(),
        minY: sw.getLat(),
        maxY: ne.getLat(),
      };
      
      setMapBounds(newBounds);
    });
    
    // Trigger initial load
    window.kakao.maps.event.trigger(map, 'idle');
    
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setCenter(new window.kakao.maps.LatLng(lat, lng));
      });
    }
  };

  useEffect(() => {
    initMap();
    return () => {
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    };
  }, []);

  // Fetch data when bounds change
  useEffect(() => {
    if (!mapBounds) return;
    
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }
    
    fetchTimeout.current = setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      
      try {
        // Fetch concurrently
        const [eventData, cctvData] = await Promise.all([
          fetchEventInfo(mapBounds),
          fetchCctvInfo(mapBounds)
        ]);
        
        setEvents(eventData || []);
        setCctvs(cctvData || []);
        setCctvPage(1);
        setEventPage(1);
        
        // Update markers
        updateMarkers(eventData || [], cctvData || []);
      } catch (err) {
        console.error("Failed to fetch traffic data", err);
        setErrorMsg('교통정보 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce
  }, [mapBounds]);

  const updateMarkers = (eventList, cctvList) => {
    const map = kakaoMapRef.current;
    if (!map) return;
    
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    
    // Add Event markers
    eventList.forEach(ev => {
      if (!ev.coordX || !ev.coordY) return;
      const position = new window.kakao.maps.LatLng(ev.coordY, ev.coordX);
      
      // Marker image for event (warning icon)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'; 
      const imageSize = new window.kakao.maps.Size(24, 35); 
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
      
      const marker = new window.kakao.maps.Marker({
        position,
        image: markerImage,
        map: map,
        title: ev.message || ev.eventType
      });
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;width:150px;color:red;font-weight:bold;">${ev.eventType}: ${ev.message}</div>`
      });
      
      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
      
      markersRef.current.push(marker);
    });
    
    // Add CCTV markers
    cctvList.forEach(cctv => {
      if (!cctv.coordx || !cctv.coordy) return;
      const position = new window.kakao.maps.LatLng(cctv.coordy, cctv.coordx);
      
      // Marker image for CCTV (blue icon)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'; 
      const imageSize = new window.kakao.maps.Size(24, 35); 
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);
      
      const marker = new window.kakao.maps.Marker({
        position,
        image: markerImage,
        map: map,
        title: cctv.cctvname
      });
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;width:150px;color:#0ea5e9;font-weight:bold;">${cctv.cctvname}</div>`
      });
      
      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedCctv(cctv);
      });
      
      markersRef.current.push(marker);
    });
  };

  const panToCctv = (cctv) => {
    if (kakaoMapRef.current && cctv.coordy && cctv.coordx) {
      kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(cctv.coordy, cctv.coordx));
    }
  };
  
  const panToEvent = (ev) => {
    if (kakaoMapRef.current && ev.coordY && ev.coordX) {
      kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(ev.coordY, ev.coordX));
    }
  };

  const paginatedCctvs = cctvs.slice((cctvPage - 1) * itemsPerPage, cctvPage * itemsPerPage);
  const totalCctvPages = Math.ceil(cctvs.length / itemsPerPage);

  const paginatedEvents = events.slice((eventPage - 1) * itemsPerPage, eventPage * itemsPerPage);
  const totalEventPages = Math.ceil(events.length / itemsPerPage);

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', position: 'relative' }}>
      
      <div style={{ marginBottom: '24px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>실시간 도로/CCTV 정보</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>국토교통부 제공 국가교통정보센터 실시간 도로상황 및 CCTV 스트리밍</p>
      </div>

      <div className="responsive-grid-1-2" style={{ gap: '24px', height: '700px' }}>
        
        {/* 왼쪽 패널: 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
          
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', paddingBottom: '8px' }}>
            <button 
              onClick={() => setActiveTab('cctv')}
              style={{ 
                flex: 1, padding: '12px', fontSize: '1rem', fontWeight: activeTab === 'cctv' ? 800 : 500, 
                color: activeTab === 'cctv' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'cctv' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                transition: 'all 0.3s'
              }}
            >
              주변 CCTV ({cctvs.length})
            </button>
            <button 
              onClick={() => setActiveTab('event')}
              style={{ 
                flex: 1, padding: '12px', fontSize: '1rem', fontWeight: activeTab === 'event' ? 800 : 500, 
                color: activeTab === 'event' ? 'var(--accent-red)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'event' ? '3px solid var(--accent-red)' : '3px solid transparent',
                transition: 'all 0.3s'
              }}
            >
              돌발 상황 ({events.length})
            </button>
          </div>
          
          <div className="glass-panel" style={{ flex: 1, padding: '16px', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.4)', minHeight: 0 }}>
            
            {loading && cctvs.length === 0 && events.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-pulse" style={{ height: '72px', borderRadius: '16px' }}></div>
                ))}
              </div>
            )}
            
            {!loading && activeTab === 'cctv' && cctvs.length === 0 && (
              <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>조회된 CCTV가 없습니다.</div>
            )}
            
            {!loading && activeTab === 'event' && events.length === 0 && (
              <div style={{ padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>조회된 돌발상황이 없습니다.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'hidden' }}>
              {activeTab === 'cctv' && paginatedCctvs.map((cctv, idx) => (
              <div key={idx} onClick={() => { panToCctv(cctv); setSelectedCctv(cctv); }} style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.85) 100%)', border: '1px solid rgba(255,255,255,0.8)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', letterSpacing: '-0.01em', wordBreak: 'keep-all', lineHeight: 1.3 }}>{cctv.cctvname}</h4>
                  <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: 'white', background: '#0f172a', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>{cctv.cctvformat || 'LIVE'}</span>
                </div>
              </div>
            ))}
            
            {activeTab === 'event' && paginatedEvents.map((ev, idx) => (
              <div key={idx} onClick={() => panToEvent(ev)} style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(145deg, rgba(254,242,242,0.85) 0%, rgba(255,255,255,0.95) 100%)', border: '1px solid rgba(254,226,226,0.6)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 12px rgba(239,68,68,0.04), inset 0 1px 0 rgba(255,255,255,1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, color: '#7f1d1d', fontSize: '0.95rem', letterSpacing: '-0.01em', wordBreak: 'keep-all', lineHeight: 1.3 }}>{ev.roadName}</h4>
                  <span style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '6px' }}>{ev.eventType}</span>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#450a0a', lineHeight: 1.5, fontWeight: 500 }}>{ev.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, opacity: 0.8 }}>
                  <span>방향: {ev.roadDrcType}</span>
                  {ev.startDate && <span>발생: {ev.startDate.substring(4,6)}/{ev.startDate.substring(6,8)} {ev.startDate.substring(8,10)}:{ev.startDate.substring(10,12)}</span>}
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Controls */}
            {!loading && activeTab === 'cctv' && totalCctvPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                <button 
                  disabled={cctvPage === 1}
                  onClick={() => setCctvPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: cctvPage === 1 ? 'rgba(0,0,0,0.05)' : 'white', color: cctvPage === 1 ? '#94a3b8' : '#0f172a', fontWeight: 600, border: '1px solid var(--border-light)', cursor: cctvPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  이전
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>{cctvPage} / {totalCctvPages}</span>
                <button 
                  disabled={cctvPage === totalCctvPages}
                  onClick={() => setCctvPage(p => Math.min(totalCctvPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: cctvPage === totalCctvPages ? 'rgba(0,0,0,0.05)' : 'white', color: cctvPage === totalCctvPages ? '#94a3b8' : '#0f172a', fontWeight: 600, border: '1px solid var(--border-light)', cursor: cctvPage === totalCctvPages ? 'not-allowed' : 'pointer' }}
                >
                  다음
                </button>
              </div>
            )}

            {!loading && activeTab === 'event' && totalEventPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                <button 
                  disabled={eventPage === 1}
                  onClick={() => setEventPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: eventPage === 1 ? 'rgba(0,0,0,0.05)' : 'white', color: eventPage === 1 ? '#94a3b8' : '#0f172a', fontWeight: 600, border: '1px solid var(--border-light)', cursor: eventPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  이전
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>{eventPage} / {totalEventPages}</span>
                <button 
                  disabled={eventPage === totalEventPages}
                  onClick={() => setEventPage(p => Math.min(totalEventPages, p + 1))}
                  style={{ padding: '6px 12px', borderRadius: '8px', background: eventPage === totalEventPages ? 'rgba(0,0,0,0.05)' : 'white', color: eventPage === totalEventPages ? '#94a3b8' : '#0f172a', fontWeight: 600, border: '1px solid var(--border-light)', cursor: eventPage === totalEventPages ? 'not-allowed' : 'pointer' }}
                >
                  다음
                </button>
              </div>
            )}
            
          </div>
        </div>

        {/* 우측 패널: 지도 */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', height: '100%', position: 'relative', border: '1px solid var(--border-light)' }}>
          {errorMsg ? (
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}>
               <ShieldAlert size={40} style={{ marginBottom: '16px' }} />
               <h3 style={{ fontWeight: 700 }}>{errorMsg}</h3>
             </div>
          ) : (
            <>
              {loading && (
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '12px 20px', borderRadius: '99px', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: 'var(--primary-blue)', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-blue)', animation: 'pulse 1.5s infinite' }}></div> 데이터 갱신 중...
                </div>
              )}
              <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', zIndex: 2, pointerEvents: 'none', display: 'flex', gap: '8px' }}>
                 <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                   <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#22c55e' }}></div> <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>원활</span>
                   <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#eab308', marginLeft: '8px' }}></div> <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>서행</span>
                   <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444', marginLeft: '8px' }}></div> <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>정체</span>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* CCTV 비디오 모달 */}
      {selectedCctv && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="fade-in" style={{ background: '#020617', width: '100%', maxWidth: '900px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' }}>
            <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{selectedCctv.cctvname}</h3>
              <button onClick={() => setSelectedCctv(null)} style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', transition: 'all 0.2s', ':hover': { background: 'rgba(255,255,255,0.1)', color: 'white' } }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ width: '100%', background: 'black', position: 'relative', aspectRatio: '16/9' }}>
               {/* HLS/mp4 비디오 플레이어 */}
               <video 
                 controls 
                 autoPlay 
                 style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                 src={selectedCctv.cctvurl}
               >
                 브라우저가 비디오 태그를 지원하지 않습니다.
               </video>
               
               <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', color: '#38bdf8', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
                 실시간 스트리밍
               </div>
            </div>
            
            <div style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>* 브라우저 보안 정책(CORS, 혼합 콘텐츠)으로 재생되지 않을 수 있습니다.</p>
              <a href={selectedCctv.cctvurl} target="_blank" rel="noreferrer" style={{ color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', transition: 'all 0.2s', textDecoration: 'none' }}>
                 외부 플레이어 <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default RealtimeTraffic;
