import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Tent, MapPin, Search } from 'lucide-react';
import AiInsightCard from '../components/AiInsightCard';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

function DisasterShelter() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [shelters, setShelters] = useState([]);
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markersRef = useRef([]);
  
  const [mapBounds, setMapBounds] = useState(null);
  const fetchTimeout = useRef(null);

  const initMap = () => {
    if (!window.kakao || !window.kakao.maps) {
      setErrorMsg('카카오 지도 API가 로드되지 않았습니다.');
      setLoading(false);
      return;
    }

    // Default to Seoul City Hall, but we will try to get user location
    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
      level: 6
    };

    const map = new window.kakao.maps.Map(container, options);
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
        const apiKey = '11XW1SUZ8097Q1CD'; // User's Service Key
        
        // 100 rows per request, bounded by map coords
        const path = `/V2/api/DSSP-IF-10944?serviceKey=${apiKey}&pageNo=1&numOfRows=100&returnType=json&startLot=${mapBounds.minX}&endLot=${mapBounds.maxX}&startLat=${mapBounds.minY}&endLat=${mapBounds.maxY}`;
        const url = import.meta.env.DEV ? `/api/safetydata${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://www.safetydata.go.kr" + path)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('API Response Error');
        }
        
        const data = await response.json();
        
        // The API returns data in data.body or data.response.body or directly in data
        // For safetydata.go.kr usually it's in body or body[0]
        // Let's handle different possible structures safely
        let items = [];
        if (data.body) {
          items = data.body;
        } else if (data.response && data.response.body && data.response.body.items) {
          items = data.response.body.items;
        } else if (Array.isArray(data)) {
          items = data;
        }
        
        setShelters(items || []);
        setPage(1);
        updateMarkers(items || []);
        
      } catch (err) {
        console.error("Failed to fetch shelter data", err);
        // API error or CORS error
        setErrorMsg('지진해일 대피소 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }, 800); // 800ms debounce
  }, [mapBounds]);

  const updateMarkers = (shelterList) => {
    const map = kakaoMapRef.current;
    if (!map) return;
    
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    
    shelterList.forEach(shelter => {
      // API coords field names are LA (lat) and LO (lng)
      const lat = parseFloat(shelter.LA);
      const lng = parseFloat(shelter.LO);
      
      if (!lat || !lng) return;
      
      const position = new window.kakao.maps.LatLng(lat, lng);
      
      // We will use a standard marker for now
      const marker = new window.kakao.maps.Marker({
        position,
        map: map,
        title: shelter.SHNT_PLACE_NM
      });
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;width:200px;color:var(--primary-blue);font-weight:bold;">${shelter.SHNT_PLACE_NM}<br/><span style="color:#666;font-weight:normal;">수용인원: ${shelter.PSBL_NMPR || 0}명</span></div>`
      });
      
      window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
      window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
      window.kakao.maps.event.addListener(marker, 'click', () => {
        panToShelter(shelter);
      });
      
      markersRef.current.push(marker);
    });
  };

  const panToShelter = (shelter) => {
    if (kakaoMapRef.current && shelter.LA && shelter.LO) {
      kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(parseFloat(shelter.LA), parseFloat(shelter.LO)));
    }
  };

  const jumpToLocation = (lat, lng) => {
    if (kakaoMapRef.current) {
      kakaoMapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      kakaoMapRef.current.setLevel(5); // Zoom in a bit more
    }
  };

  const paginatedShelters = shelters.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(shelters.length / itemsPerPage);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>
          지진해일 대피소 찾기
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', marginBottom: '24px' }}>내 주변 가장 가까운 지진해일 대피소를 확인하세요.</p>
      </div>

      <div className="responsive-grid-1-2" style={{ gap: '24px', height: '700px' }}>
        
        {/* 왼쪽 패널: 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
          
          <div className="glass-panel" style={{ flex: 1, padding: '16px', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.4)', minHeight: 0 }}>
            
            {loading && shelters.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-pulse" style={{ height: '72px', borderRadius: '16px' }}></div>
                ))}
              </div>
            )}
            
            {!loading && shelters.length === 0 && !errorMsg && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>현재 지도 영역에 대피소가 없습니다.<br/>(지진해일 대피소는 해안가에 위치해 있습니다)</p>
                
                <div style={{ marginTop: '24px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>해안가로 바로 이동해 보세요</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => jumpToLocation(35.158697, 129.160384)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>부산 해운대</button>
                    <button onClick={() => jumpToLocation(37.751853, 128.876057)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>강원 강릉</button>
                    <button onClick={() => jumpToLocation(38.207015, 128.591833)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>강원 속초</button>
                    <button onClick={() => jumpToLocation(36.019017, 129.343489)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>경북 포항</button>
                    <button onClick={() => jumpToLocation(35.358249, 129.361002)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>울산 간절곶</button>
                    <button onClick={() => jumpToLocation(34.848821, 128.431613)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>경남 통영</button>
                    <button onClick={() => jumpToLocation(34.743122, 127.737119)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>전남 여수</button>
                    <button onClick={() => jumpToLocation(33.510414, 126.521568)} style={{ padding: '6px 12px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>제주 탑동</button>
                  </div>
                </div>
              </div>
            )}
            
            {errorMsg && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                {errorMsg}
              </div>
            )}

            {!loading && shelters.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {paginatedShelters.map((shelter, idx) => (
                  <div key={idx} onClick={() => panToShelter(shelter)} style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))', border: '1px solid rgba(226, 232, 240, 0.6)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,1), 0 2px 4px rgba(0,0,0,0.02)'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {shelter.SHNT_PLACE_NM}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
                          <MapPin size={12} />
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shelter.RN_DTL_ADRES || '주소 정보 없음'}</span>
                        </div>
                      </div>
                      <div style={{ padding: '4px 10px', background: 'var(--primary-blue)', color: 'white', fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px', flexShrink: 0 }}>
                        {shelter.PSBL_NMPR ? `수용 ${shelter.PSBL_NMPR}명` : '수용인원 미상'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingTop: '16px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'white', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
                >
                  이전
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {page} / {totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'white', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 우측 패널: 지도 */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', height: '100%', position: 'relative', border: '1px solid var(--border-light)' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          
          {/* AI Insight Card Overlay */}
          <div className="ai-insight-wrapper" style={{ position: "absolute", bottom: "24px", right: "24px", width: "380px", zIndex: 10 }}>
            <AiInsightCard 
              data={shelters.map(s => ({
                이름: s.SHNT_PLACE_NM,
                주소: s.RN_DTL_ADRES || '주소 정보 없음',
                수용가능인원: s.PSBL_NMPR || '미상'
              }))}
              context="지진해일 대피소"
            />
          </div>

          {loading && (
            <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', borderRadius: '99px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
              <div style={{ width: '12px', height: '12px', border: '2px solid var(--primary-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              데이터 불러오는 중...
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default DisasterShelter;
