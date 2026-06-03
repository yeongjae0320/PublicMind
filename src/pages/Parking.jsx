import React, { useState, useEffect, useRef } from 'react';
import { Car, MapPin, Navigation, Info, ShieldAlert, CheckCircle, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { fetchNationalRealtimeParking, normalizeParkingName } from '../services/parkingApi';
import AiInsightCard from '../components/AiInsightCard';

function Parking() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const mapRef = useRef(null);
  const kakaoMapRef = useRef(null);
  const markersRef = useRef([]);

  // Create real-time UI data from Seoul API data
  const createRealtimeParkingData = (capacity, currentParked) => {
    // TPKCT (capacity), NOW_PRK_VHCL_CNT (currentParked)
    const cap = parseInt(capacity) || 0;
    const parked = parseInt(currentParked) || 0;
    const available = Math.max(0, cap - parked);
    
    if (cap === 0) return createUnknownParkingData();

    const ratio = available / cap;
    
    let status = '여유';
    let color = '#10b981'; // Green
    let icon = <CheckCircle size={14} />;
    
    if (available === 0) {
      status = '만차';
      color = '#ef4444'; // Red
      icon = <XCircle size={14} />;
    } else if (ratio < 0.2) {
      status = '혼잡';
      color = '#f59e0b'; // Orange
      icon = <AlertCircle size={14} />;
    }

    return { capacity: cap, available, status, color, icon, hasData: true };
  };

  // Unmapped/Unknown parking lot UI (정확도 우선 정책)
  const createUnknownParkingData = () => {
    return {
      capacity: '-',
      available: '-',
      status: '정보 없음',
      color: '#94a3b8', // Slate Gray
      icon: <HelpCircle size={14} />,
      hasData: false
    };
  };

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
        level: 5 // A bit wider for parking lots
      };

      const map = new window.kakao.maps.Map(container, options);
      kakaoMapRef.current = map;

      // Current location marker
      new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: map,
        title: '내 위치'
      });
      
      try {
        const ps = new window.kakao.maps.services.Places();
        
        ps.keywordSearch('공영 주차장', async (data, status) => {
          try {
            if (status === window.kakao.maps.services.Status.OK) {
              
              // Fetch National Real-time Parking Data
              let nationalData = [];
              try {
                nationalData = await fetchNationalRealtimeParking();
              } catch (err) {
                if (err.message === 'API_SYNCING') {
                  setErrorMsg('현재 공공데이터포털 API 인증키 서버 동기화 작업이 진행 중입니다. (승인 후 약 1~2시간 소요)\\n동기화가 완료되면 전국 공영주차장의 실시간 빈자리 정보가 정상 표출됩니다.');
                }
              }
              
              // Mashup (Merge Kakao Map coordinates with National Real-time data)
              const enhancedData = data.map(place => {
                const kakaoNameNorm = normalizeParkingName(place.place_name);
                
                // Find match in National API by name
                const match = nationalData.find(s => {
                  const apiName = s.prk_nm || s.prk_plce_nm || s.pkltNm || s.PKLT_NM || s.parkingName;
                  return normalizeParkingName(apiName) === kakaoNameNorm;
                });
                
                if (match) {
                  const cap = match.prk_cmptnc || match.prk_tot_spc || match.TPKCT || match.capacity || 0;
                  const parked = match.prk_vhcl_cnt || match.NOW_PRK_VHCL_CNT || match.parked || 0;
                  return {
                    ...place,
                    realtimeData: createRealtimeParkingData(cap, parked)
                  };
                } else {
                  // Unmapped (e.g. Private parking or outside Seoul) -> Show "정보 없음"
                  return {
                    ...place,
                    realtimeData: createUnknownParkingData()
                  };
                }
              });
              
              // Sort so that those WITH data appear first
              enhancedData.sort((a, b) => {
                if (a.realtimeData.hasData && !b.realtimeData.hasData) return -1;
                if (!a.realtimeData.hasData && b.realtimeData.hasData) return 1;
                return a.distance - b.distance; // Then by distance
              });
              
              setParkingLots(enhancedData);
              
              const bounds = new window.kakao.maps.LatLngBounds();
              bounds.extend(new window.kakao.maps.LatLng(lat, lng));

              enhancedData.forEach((place) => {
                const position = new window.kakao.maps.LatLng(place.y, place.x);
                bounds.extend(position);

                const marker = new window.kakao.maps.Marker({
                  map: map,
                  position: position,
                });

                const infowindow = new window.kakao.maps.InfoWindow({
                  content: `<div style="padding:8px;font-size:12px;font-weight:700;color:#0ea5e9;">${place.place_name}</div>`
                });

                window.kakao.maps.event.addListener(marker, 'mouseover', () => {
                  infowindow.open(map, marker);
                });
                window.kakao.maps.event.addListener(marker, 'mouseout', () => {
                  infowindow.close();
                });
                window.kakao.maps.event.addListener(marker, 'click', () => {
                  setSelectedLot(place);
                  map.panTo(position);
                });

                markersRef.current.push(marker);
              });
              
              map.setBounds(bounds);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
              setErrorMsg('주변 3km 내에 검색된 공영 주차장이 없습니다.');
            } else {
              setErrorMsg('주차장 검색 중 오류가 발생했습니다.');
            }
          } catch (err) {
            console.error("Kakao places callback error:", err);
            setErrorMsg('데이터 처리 중 오류가 발생했습니다.');
          } finally {
            setLoading(false);
          }
        }, {
          location: new window.kakao.maps.LatLng(lat, lng),
          sort: window.kakao.maps.services.SortBy.DISTANCE,
          radius: 3000 // 3km radius
        });
      } catch (err) {
        console.error("Kakao services initialization error:", err);
        setErrorMsg('카카오 장소 검색 API를 불러오지 못했습니다. (새로고침이 필요합니다)');
        setLoading(false);
      }
    };

    const safetyTimeout = setTimeout(() => {
      if (!isLocationResolved) {
        isLocationResolved = true;
        console.warn("위치 정보 지연. 기본 위치(강남역)로 검색합니다.");
        initMapAndSearch(37.4979, 127.0276); // 강남역 기본 좌표
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
            initMapAndSearch(37.4979, 127.0276);
          }
        },
        { timeout: 3000, maximumAge: 0 }
      );
    } else {
      if (!isLocationResolved) {
        isLocationResolved = true;
        clearTimeout(safetyTimeout);
        initMapAndSearch(37.4979, 127.0276);
      }
    }
  }, []);

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px', position: 'relative' }}>
      
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>빈 주차장 찾기</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>현 위치 기반 주변 공영 주차장의 실시간 빈자리 정보를 제공합니다.</p>
      </div>

      {/* Map Section */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', height: '400px', position: 'relative', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
        
        {/* Map Skeleton Overlay */}
        {loading && (
          <div className="skeleton-pulse" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}></div>
        )}

        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        
        {/* AI Insight Card Overlay */}
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '380px', zIndex: 10 }}>
          <AiInsightCard 
            data={parkingLots.map(p => ({
              이름: p.place_name,
              주소: p.road_address_name || p.address_name,
              총주차면: p.realtimeData?.capacity,
              빈자리: p.realtimeData?.available,
              상태: p.realtimeData?.status
            }))}
            context="실시간 공영 주차장"
          />
        </div>

        {/* Floating Header on Map */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 2, pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', pointerEvents: 'auto' }}>
            <Car size={28} style={{ color: '#0ea5e9' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0c4a6e', margin: 0 }}>내 주변 빈 주차장 찾기</h3>
              <p style={{ fontSize: '0.85rem', color: '#0369a1', margin: 0 }}>현 위치 반경 3km 이내의 공영/민영 주차장</p>
            </div>
            {/* Disclaimer Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>
              <CheckCircle size={12} /> 서울시 실시간 API 연동됨
            </div>
          </div>
        </div>
      </div>

      {errorMsg ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', color: '#ef4444' }}>
          <ShieldAlert size={40} style={{ marginBottom: '16px' }} />
          <h3 style={{ fontWeight: 700 }}>{errorMsg}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>주변 주차장 목록 {loading ? '' : `(${parkingLots.length}곳)`}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>* 정보없음: 민영/타지역 주차장</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {loading ? (
              <>
                <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '16px' }}></div>
                <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '16px' }}></div>
                <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '16px' }}></div>
                <div className="skeleton-pulse" style={{ height: '90px', borderRadius: '16px' }}></div>
              </>
            ) : parkingLots.map((lot, index) => {
              const isSelected = selectedLot?.id === lot.id;
              const rt = lot.realtimeData;
              
              return (
                <div 
                  key={lot.id} 
                  className="glass-panel"
                  onClick={() => {
                    setSelectedLot(lot);
                    if (kakaoMapRef.current) {
                      kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(lot.y, lot.x));
                    }
                  }}
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(14, 165, 233, 0.05)' : 'white',
                    border: isSelected ? '2px solid #0ea5e9' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isSelected ? '#0ea5e9' : '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'white' : '#0ea5e9', flexShrink: 0 }}>
                      <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>P</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lot.place_name}
                      </h5>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lot.road_address_name || lot.address_name}</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', color: '#64748b', padding: '2px 8px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700 }}>
                        <Navigation size={10} />
                        거리: {lot.distance}m
                      </div>
                    </div>
                  </div>
                  
                  {/* Real-time Parking Status Badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      background: `${rt.color}15`, 
                      color: rt.color, 
                      padding: '4px 10px', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800 
                    }}>
                      {React.cloneElement(rt.icon, { size: 14 })}
                      {rt.status}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span style={{ color: rt.color, fontSize: '0.9rem', fontWeight: 800 }}>{rt.available}</span> / {rt.capacity}대
                    </div>
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

export default Parking;
