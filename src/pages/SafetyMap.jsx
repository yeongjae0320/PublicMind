import React, { useEffect, useRef, useState } from 'react';
import { Shield, ShieldAlert, Store, Package, MapPin, Crosshair, Search, Loader2 } from 'lucide-react';

function SafetyMap() {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['police', 'store', 'locker']);
  const [searchResults, setSearchResults] = useState([]);
  const [markers, setMarkers] = useState([]);

  // Initialize Map
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) return;

    // 강남역 주변을 기본 중심 좌표로 설정
    const defaultPosition = new window.kakao.maps.LatLng(37.498095, 127.027610);
    
    const options = {
      center: defaultPosition,
      level: 4 // 좀 더 넓게 보기
    };
    
    const newMap = new window.kakao.maps.Map(mapContainer.current, options);
    const newPlaces = new window.kakao.maps.services.Places();
    
    setMap(newMap);
    setPlacesService(newPlaces);

    // 내 위치로 이동 (HTML5 Geolocation)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lon);
          newMap.setCenter(locPosition);
        }
      );
    }
  }, []);

  // Search logic when map moves or filters change
  useEffect(() => {
    if (!map || !placesService) return;

    let isSubscribed = true;

    const fetchPlaces = () => {
      if (!isSubscribed) return;
      setIsSearching(true);
      
      let allResults = [];
      let pendingRequests = 0;
      const center = map.getCenter();
      // 반경 5km 내에서 중심점 기준으로 가까운 순으로 검색 (최대 15개)
      const searchOptions = { location: center, radius: 5000, size: 15, sort: window.kakao.maps.services.SortBy.DISTANCE };

      // 콜백 함수 생성
      const createCallback = (categoryType) => (data, status) => {
        if (!isSubscribed) return;
        pendingRequests--;
        
        if (status === window.kakao.maps.services.Status.OK) {
          // 중복 제거 및 타입 추가
          const typedData = data.map(item => ({ ...item, categoryType }));
          allResults = [...allResults, ...typedData];
        }
        
        // 모든 요청이 끝났을 때
        if (pendingRequests === 0) {
          // 중복 아이디 제거
          const uniqueResults = [];
          const seen = new Set();
          for (const item of allResults) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              uniqueResults.push(item);
            }
          }
          setSearchResults(uniqueResults);
          setIsSearching(false);
        }
      };

      // 경찰서/파출소/지구대 검색
      if (activeFilters.includes('police')) {
        pendingRequests += 2;
        placesService.keywordSearch('파출소', createCallback('police'), searchOptions);
        placesService.keywordSearch('지구대', createCallback('police'), searchOptions);
      }

      // 편의점 (안심지킴이집) 검색 - 카테고리 CS2
      if (activeFilters.includes('store')) {
        pendingRequests += 1;
        placesService.categorySearch('CS2', createCallback('store'), searchOptions);
      }

      // 여성 안심 택배함
      if (activeFilters.includes('locker')) {
        pendingRequests += 1;
        placesService.keywordSearch('안심택배함', createCallback('locker'), searchOptions);
      }
      
      // 아무 필터도 켜져있지 않을 때
      if (pendingRequests === 0) {
        setSearchResults([]);
        setIsSearching(false);
      }
    };

    // 처음 렌더링 시 검색
    fetchPlaces();

    // 지도 이동이 끝났을 때 다시 검색
    const handleIdle = () => fetchPlaces();
    window.kakao.maps.event.addListener(map, 'idle', handleIdle);

    return () => {
      isSubscribed = false;
      if (map) {
        window.kakao.maps.event.removeListener(map, 'idle', handleIdle);
      }
    };
  }, [map, placesService, activeFilters]);

  // Update Markers when searchResults change
  useEffect(() => {
    if (!map) return;
    
    // 기존 마커 제거
    markers.forEach(markerObj => markerObj.marker.setMap(null));
    
    const newMarkers = searchResults.map(place => {
      let iconColor = '#64748b'; // default
      let zIndex = 1;
      
      if (place.categoryType === 'police') {
        iconColor = '#3b82f6'; // blue
        zIndex = 3;
      } else if (place.categoryType === 'store') {
        iconColor = '#f59e0b'; // amber
        zIndex = 1;
      } else if (place.categoryType === 'locker') {
        iconColor = '#10b981'; // green
        zIndex = 2;
      }

      // SVG 아이콘 마커 (카카오맵 커스텀 오버레이로 렌더링)
      const content = document.createElement('div');
      content.style.width = '36px';
      content.style.height = '36px';
      content.style.background = 'white';
      content.style.borderRadius = '50%';
      content.style.display = 'flex';
      content.style.alignItems = 'center';
      content.style.justifyContent = 'center';
      content.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
      content.style.border = `2px solid ${iconColor}`;
      content.style.color = iconColor;
      content.style.fontWeight = 'bold';
      content.style.fontSize = '18px';
      
      if (place.categoryType === 'police') content.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
      if (place.categoryType === 'store') content.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`;
      if (place.categoryType === 'locker') content.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(place.y, place.x),
        content: content,
        zIndex: zIndex
      });

      customOverlay.setMap(map);
      
      return {
        marker: customOverlay,
        place
      };
    });

    setMarkers(newMarkers);
    
    // Cleanup
    return () => {
      newMarkers.forEach(m => m.marker.setMap(null));
    };
  }, [searchResults, map]);

  const toggleFilter = (filter) => {
    setActiveFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const handleMyLocation = () => {
    if (map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lon);
          map.panTo(locPosition);
        }
      );
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>안심 귀갓길 지도</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', marginBottom: '24px' }}>
          내 주변의 치안 시설(파출소, 편의점, 택배함)을 실시간으로 확인하세요.
        </p>
      </div>

      <div className="safetymap-layout" style={{ display: "flex", gap: "32px", height: "calc(100vh - 200px)", minHeight: "600px" }}>
        
        {/* Left Sidebar - Filters & Results list */}
        <div className="safetymap-sidebar" style={{ width: "380px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>지도 표시 필터</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => toggleFilter('police')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${activeFilters.includes('police') ? 'var(--primary-blue)' : 'var(--border-light)'}`,
                  background: activeFilters.includes('police') ? 'rgba(37,99,235,0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ color: activeFilters.includes('police') ? 'var(--primary-blue)' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: activeFilters.includes('police') ? 'var(--primary-blue)' : 'var(--text-secondary)' }}>지구대 / 파출소</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>위급 시 가장 먼저 대피할 곳</div>
                </div>
              </button>

              <button 
                onClick={() => toggleFilter('store')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${activeFilters.includes('store') ? '#f59e0b' : 'var(--border-light)'}`,
                  background: activeFilters.includes('store') ? 'rgba(245, 158, 11, 0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ color: activeFilters.includes('store') ? '#f59e0b' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: activeFilters.includes('store') ? '#d97706' : 'var(--text-secondary)' }}>24시 편의점</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>여성 안심지킴이집, 야간 대피소</div>
                </div>
              </button>

              <button 
                onClick={() => toggleFilter('locker')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${activeFilters.includes('locker') ? '#10b981' : 'var(--border-light)'}`,
                  background: activeFilters.includes('locker') ? 'rgba(16, 185, 129, 0.05)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ color: activeFilters.includes('locker') ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={24} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: activeFilters.includes('locker') ? '#059669' : 'var(--text-secondary)' }}>안심 택배함</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>범죄 예방을 위한 무인 수령처</div>
                </div>
              </button>
            </div>
          </div>

          <div className="glass-panel" style={{ flex: 1, padding: '20px', borderRadius: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                검색된 장소 ({searchResults.length}건)
              </h3>
            </div>
            
            {isSearching ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <style>{`
                  @keyframes pulse-soft {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                  }
                  .skeleton {
                    animation: pulse-soft 1.5s ease-in-out infinite;
                    background-color: var(--border-light);
                    border-radius: 4px;
                  }
                `}</style>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '12px', background: 'white' }}>
                    <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '8px' }}></div>
                    <div className="skeleton" style={{ height: '16px', width: '90%' }}></div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                <Search size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p style={{ margin: 0 }}>지도 반경 내 검색된<br/>안심 장소가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map(place => (
                  <div key={place.id} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '12px', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{place.place_name}</strong>
                      <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>
                        {Math.round(place.distance || 0)}m
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={12} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.3 }}>{place.road_address_name || place.address_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Map Area */}
        <div className="responsive-content" style={{ flex: 1, position: "relative", borderRadius: "20px", overflow: "hidden", boxShadow: "var(--shadow-md)", border: "1px solid var(--border-light)" }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }}></div>
          
          {/* Floating Action Button for Location */}
          <button 
            onClick={handleMyLocation}
            style={{ 
              position: 'absolute', bottom: '24px', right: '24px', zIndex: 2, 
              width: '48px', height: '48px', borderRadius: '24px', background: 'white', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
            }}
          >
            <Crosshair size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SafetyMap;
