import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ShieldAlert, AlertTriangle, ChevronRight } from 'lucide-react';

function Shelter() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    let isLocationResolved = false;

    const initMapAndSearch = (lat, lng) => {
      setUserLocation({ lat, lng });

      if (!window.kakao || !window.kakao.maps) {
        setErrorMsg('카카오 지도 API가 로드되지 않았습니다.');
        setLoading(false);
        return;
      }

      const container = mapRef.current;
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 4
      };

      const map = new window.kakao.maps.Map(container, options);
      kakaoMapRef.current = map;

      // Current location marker
      const userMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: map,
        title: '내 위치'
      });
      
      // Custom user marker image (optional, using default for now but could be styled)
      
      const ps = new window.kakao.maps.services.Places();
      
      // Search for shelters around the location
      ps.keywordSearch('대피소', (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setShelters(data);
          
          const bounds = new window.kakao.maps.LatLngBounds();
          bounds.extend(new window.kakao.maps.LatLng(lat, lng));

          data.forEach((place, i) => {
            const position = new window.kakao.maps.LatLng(place.y, place.x);
            bounds.extend(position);

            const marker = new window.kakao.maps.Marker({
              map: map,
              position: position,
            });

            // Create custom overlay or info window
            const infowindow = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;font-weight:700;">${place.place_name}</div>`
            });

            window.kakao.maps.event.addListener(marker, 'mouseover', () => {
              infowindow.open(map, marker);
            });
            window.kakao.maps.event.addListener(marker, 'mouseout', () => {
              infowindow.close();
            });
            window.kakao.maps.event.addListener(marker, 'click', () => {
              setSelectedShelter(place);
              map.panTo(position);
            });

            markersRef.current.push(marker);
          });
          
          map.setBounds(bounds);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setErrorMsg('주변 2km 내에 검색된 대피소가 없습니다.');
        } else {
          setErrorMsg('대피소 검색 중 오류가 발생했습니다.');
        }
        setLoading(false);
      }, {
        location: new window.kakao.maps.LatLng(lat, lng),
        sort: window.kakao.maps.services.SortBy.DISTANCE,
        radius: 2000 // 2km radius
      });
    };

    const safetyTimeout = setTimeout(() => {
      if (!isLocationResolved) {
        isLocationResolved = true;
        console.warn("위치 정보 지연. 기본 위치(여의도)로 검색합니다.");
        initMapAndSearch(37.5271, 126.9324); // 여의도 공원 기본 좌표
      }
    }, 3000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isLocationResolved) {
            isLocationResolved = true;
            clearTimeout(safetyTimeout);
            initMapAndSearch(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          if (!isLocationResolved) {
            isLocationResolved = true;
            clearTimeout(safetyTimeout);
            console.warn("위치 권한 거부됨. 기본 위치로 검색합니다.");
            initMapAndSearch(37.5271, 126.9324);
          }
        },
        { timeout: 3000, maximumAge: 0 }
      );
    } else {
      if (!isLocationResolved) {
        isLocationResolved = true;
        clearTimeout(safetyTimeout);
        initMapAndSearch(37.5271, 126.9324);
      }
    }
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '24px' }}>
        <div className="skeleton-pulse" style={{ height: '350px', borderRadius: '24px' }}></div>
        <div className="skeleton-pulse" style={{ height: '80px', borderRadius: '16px' }}></div>
        <div className="skeleton-pulse" style={{ height: '80px', borderRadius: '16px' }}></div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Map Section */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', height: '400px', position: 'relative', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        
        {/* Floating Header on Map */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', pointerEvents: 'auto' }}>
            <ShieldAlert size={28} style={{ color: '#ef4444' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>가장 가까운 대피소 찾기</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>현 위치 반경 2km 이내의 지진/민방위 대피소</p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', color: '#ef4444' }}>
          <AlertTriangle size={40} style={{ marginBottom: '16px' }} />
          <h3 style={{ fontWeight: 700 }}>{errorMsg}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', paddingLeft: '8px' }}>주변 대피소 목록 ({shelters.length}곳)</h4>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {shelters.map((shelter, index) => {
              const isSelected = selectedShelter?.id === shelter.id;
              
              return (
                <div 
                  key={shelter.id} 
                  className="glass-panel"
                  onClick={() => {
                    setSelectedShelter(shelter);
                    if (kakaoMapRef.current) {
                      kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(shelter.y, shelter.x));
                    }
                  }}
                  style={{ 
                    padding: '24px', 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'white',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isSelected ? '#3b82f6' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'white' : '#64748b' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{index + 1}</span>
                    </div>
                    <div>
                      <h5 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {shelter.place_name}
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <MapPin size={14} />
                        {shelter.road_address_name || shelter.address_name}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Navigation size={12} />
                        거리: {shelter.distance}m
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ color: isSelected ? '#3b82f6' : '#cbd5e1' }}>
                    <ChevronRight size={24} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Shelter;
