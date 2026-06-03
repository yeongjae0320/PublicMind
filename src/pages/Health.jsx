import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Clock, Phone, Navigation, Crosshair, Loader2, Pill, Hospital, Activity } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import { fetchPharmacies, fetchHospitals, fetchEmergencyRooms } from '../services/healthApi';
import AiInsightCard from '../components/AiInsightCard';

// Custom Kakao Map Component for Health
function KakaoMap({ data, activeId, activeTab, onMarkerClick, userLocation }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    let attempts = 0;
    const checkKakaoMap = setInterval(() => {
      attempts++;
      if (window.kakao && window.kakao.maps && mapElement.current && !mapInstance.current) {
        clearInterval(checkKakaoMap);
        window.kakao.maps.load(() => {
          const lat = userLocation?.lat || 37.5665;
          const lng = userLocation?.lng || 126.9780;
          const location = new window.kakao.maps.LatLng(lat, lng);
          const mapOptions = {
            center: location,
            level: 4, 
          };
          mapInstance.current = new window.kakao.maps.Map(mapElement.current, mapOptions);
        });
      } else if (attempts > 50) {
        clearInterval(checkKakaoMap);
      }
    }, 100);

    return () => {
      clearInterval(checkKakaoMap);
      if (mapInstance.current) {
        mapInstance.current = null;
      }
    };
  }, [userLocation]); // Re-init map if userLocation changes initially

  useEffect(() => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;
    
    // Clear old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (data && data.length > 0) {
      window.kakao.maps.load(() => {
        data.forEach((item) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lng);
          if (isNaN(lat) || isNaN(lng)) return;
          
          const position = new window.kakao.maps.LatLng(lat, lng);
          const isActive = activeId === item.id;
          const markerColor = activeTab === 'pharmacy' ? 'var(--primary-blue)' : (activeTab === 'hospital' ? '#059669' : '#e11d48');
          
          const markerHTML = `
            <div style="
              display: flex; flex-direction: column; align-items: center;
              cursor: pointer; position: relative;
              z-index: ${isActive ? 10 : 1};
            ">
              ${isActive ? `
                <div style="background: white; padding: 6px 10px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 6px; white-space: nowrap; font-size: 0.85rem; font-weight: 700; color: #1e293b; border: 1px solid #e2e8f0;">
                  ${item.name}
                </div>
              ` : ''}
              <div style="
                width: ${isActive ? '36px' : '28px'};
                height: ${isActive ? '36px' : '28px'};
                background: ${isActive ? markerColor : 'white'};
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: ${isActive ? `0 0 15px ${markerColor}80` : '0 2px 5px rgba(0,0,0,0.2)'};
                border: 2px solid ${isActive ? 'white' : markerColor};
                transition: all 0.2s ease;
              ">
                <svg width="${isActive ? '18' : '14'}" height="${isActive ? '18' : '14'}" viewBox="0 0 24 24" fill="none" stroke="${isActive ? 'white' : markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
            </div>
          `;
          
          const content = document.createElement('div');
          content.innerHTML = markerHTML;
          content.onclick = () => {
            onMarkerClick(item.id);
            mapInstance.current.panTo(position);
          };

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: content,
            yAnchor: 1,
            zIndex: isActive ? 5 : 2
          });
          
          customOverlay.setMap(mapInstance.current);
          markersRef.current.push(customOverlay);
        });
      });
    }
  }, [data, activeId, activeTab, onMarkerClick]);

  useEffect(() => {
    if (activeId && data && mapInstance.current && window.kakao && window.kakao.maps) {
      const selectedItem = data.find(item => item.id === activeId);
      if (selectedItem) {
        const lat = parseFloat(selectedItem.lat);
        const lng = parseFloat(selectedItem.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          const position = new window.kakao.maps.LatLng(lat, lng);
          mapInstance.current.panTo(position);
        }
      }
    }
  }, [activeId, data]);

  return <div ref={mapElement} style={{ flex: 1, width: '100%', height: '100%', borderRadius: '24px', minHeight: '400px' }} />;
}

function Health() {
  const [activeTab, setActiveTab] = useState('pharmacy'); // 'pharmacy', 'hospital', 'emergency'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  
  const [activeId, setActiveId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Get Location and Fetch Data
  useEffect(() => {
    const loadData = async (lat, lng) => {
      setLoading(true);
      try {
        let result = [];
        if (activeTab === 'pharmacy') {
          result = await fetchPharmacies(lat, lng);
        } else if (activeTab === 'hospital') {
          result = await fetchHospitals(lat, lng);
        } else if (activeTab === 'emergency') {
          result = await fetchEmergencyRooms(lat, lng);
        }
        setData(result);
        if (result.length > 0) setActiveId(result[0].id);
      } catch (error) {
        console.error("Data load error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          loadData(lat, lng);
        },
        (error) => {
          console.error("GPS Error:", error);
          setLocationError('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 권한을 허용해주세요.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      setLoading(false);
    }
  }, [activeTab]);

  // Reset page when data or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchTerm, activeTab]);

  const filteredData = data.filter(item => 
    item.name.includes(searchTerm) || item.address.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .skeleton-pulse {
          background-color: #e2e8f0;
          background-image: linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px);
          background-size: 200px 100%;
          background-repeat: no-repeat;
          animation: skeleton-shimmer 1.5s infinite linear;
        }
      `}</style>
      <div style={{ marginBottom: '24px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>실시간 보건/의료</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px', marginBottom: '24px' }}>
          내 주변의 약국, 병원, 응급실을 실시간으로 확인하세요.
        </p>

        {/* Tab Menu */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
          <button 
            onClick={() => setActiveTab('pharmacy')}
            className="glass-panel"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: activeTab === 'pharmacy' ? 'var(--primary-blue)' : 'rgba(255,255,255,0.8)', color: activeTab === 'pharmacy' ? 'white' : 'var(--text-secondary)', fontWeight: 700, borderRadius: '99px', border: 'none', boxShadow: activeTab === 'pharmacy' ? '0 10px 20px -5px rgba(37,99,235,0.4)' : 'var(--shadow-sm)', transition: 'all 0.3s ease' }}
          >
            <Pill size={20} /> 실시간 약국
          </button>
          <button 
            onClick={() => setActiveTab('hospital')}
            className="glass-panel"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: activeTab === 'hospital' ? '#059669' : 'rgba(255,255,255,0.8)', color: activeTab === 'hospital' ? 'white' : 'var(--text-secondary)', fontWeight: 700, borderRadius: '99px', border: 'none', boxShadow: activeTab === 'hospital' ? '0 10px 20px -5px rgba(5,150,105,0.4)' : 'var(--shadow-sm)', transition: 'all 0.3s ease' }}
          >
            <Hospital size={20} /> 동네 병·의원
          </button>
          <button 
            onClick={() => setActiveTab('emergency')}
            className="glass-panel"
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: activeTab === 'emergency' ? '#e11d48' : 'rgba(255,255,255,0.8)', color: activeTab === 'emergency' ? 'white' : 'var(--text-secondary)', fontWeight: 700, borderRadius: '99px', border: 'none', boxShadow: activeTab === 'emergency' ? '0 10px 20px -5px rgba(225,29,72,0.4)' : 'var(--shadow-sm)', transition: 'all 0.3s ease' }}
          >
            <Activity size={20} /> 응급의료기관
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', flex: 1, minHeight: '600px' }}>
        
        {/* Left: Map Area */}
        <div className="glass-panel" style={{ position: 'relative', overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)' }}>
          <KakaoMap 
            data={!loading ? data : []} 
            activeId={activeId} 
            activeTab={activeTab} 
            onMarkerClick={setActiveId} 
            userLocation={userLocation}
          />
          
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '380px', zIndex: 10 }}>
            <AiInsightCard 
              data={!loading ? data : []} 
              context={activeTab === 'pharmacy' ? '실시간 약국' : (activeTab === 'hospital' ? '동네 병·의원' : '응급의료기관')} 
            />
          </div>
          
          <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', zIndex: 10, display: 'flex', gap: '12px' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.9)', boxShadow: 'var(--shadow-md)' }}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="이름 또는 주소 검색..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1.05rem', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>
            <button 
              className="glass-panel" 
              style={{ padding: '12px', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}
              onClick={() => {
                if (navigator.geolocation) {
                  setLoading(true);
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const lat = position.coords.latitude;
                      const lng = position.coords.longitude;
                      setUserLocation({ lat, lng });
                      // Map will re-center via useEffect if userLocation object changes entirely
                    }
                  );
                }
              }}
            >
              <Crosshair size={24} color="var(--primary-blue)" />
            </button>
          </div>
        </div>

        {/* Right: List Area */}
        <div className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              검색 결과 <span className="badge badge-primary" style={{ background: activeTab === 'pharmacy' ? 'var(--primary-blue)' : (activeTab === 'hospital' ? '#059669' : '#e11d48'), color: 'white' }}>{filteredData.length}</span>
            </h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="custom-scrollbar">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'white', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="skeleton-pulse" style={{ width: '40px', height: '18px', borderRadius: '4px', marginBottom: '12px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '60%', height: '24px', borderRadius: '4px', marginBottom: '16px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '80%', height: '16px', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '50%', height: '16px', borderRadius: '4px' }}></div>
                  </div>
                ))}
              </div>
            ) : locationError ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#e11d48', textAlign: 'center', padding: '20px' }}>
                <MapPin size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <span style={{ fontWeight: 600 }}>{locationError}</span>
              </div>
            ) : currentItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                주변에 검색된 정보가 없습니다.
              </div>
            ) : (
              currentItems.map(item => {
                const isActive = activeId === item.id;
                const themeColor = activeTab === 'pharmacy' ? 'var(--primary-blue)' : (activeTab === 'hospital' ? '#059669' : '#e11d48');
                const themeShadow = activeTab === 'pharmacy' ? 'rgba(37,99,235,0.4)' : (activeTab === 'hospital' ? 'rgba(5,150,105,0.4)' : 'rgba(225,29,72,0.4)');
                
                return (
                  <div 
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    style={{ 
                      padding: '16px', 
                      borderRadius: '16px', 
                      background: isActive ? themeColor : 'white',
                      color: isActive ? 'white' : 'var(--text-primary)',
                      boxShadow: isActive ? `0 8px 20px -4px ${themeShadow}` : 'var(--shadow-sm)',
                      border: `1px solid ${isActive ? 'transparent' : 'var(--border-light)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                          background: isActive ? 'rgba(255,255,255,0.2)' : '#dcfce7',
                          color: isActive ? 'white' : '#166534'
                        }}>
                          영업중
                        </span>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
                          background: isActive ? 'rgba(255,255,255,0.1)' : 'var(--bg-base)',
                          color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                        }}>
                          {item.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? 'rgba(255,255,255,0.9)' : themeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Navigation size={12} /> {item.distance}
                        </div>
                        <div onClick={(e) => e.stopPropagation()} style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-base)', borderRadius: '50%', display: 'flex', zIndex: 10 }}>
                          <BookmarkButton item={item} type={activeTab === 'pharmacy' ? 'health' : 'hospital'} title={item.name} subtitle={item.address} link={item.phone ? `tel:${item.phone}` : ''} itemId={item.id} />
                        </div>
                      </div>
                    </div>
                    
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 10px 0', lineHeight: 1.3 }}>{item.name}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.85rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                        <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.3 }}>{item.address}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                        <Clock size={14} />
                        <span>{item.operatingHours}</span>
                      </div>
                    </div>
                    
                    {isActive && (
                      <button 
                        onClick={() => item.phone && window.open(`tel:${item.phone}`)}
                        style={{ 
                          width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px',
                          background: 'white', color: themeColor, border: 'none',
                          fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Phone size={16} /> {item.phone || '전화번호 없음'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <button 
                className="btn" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', background: currentPage === 1 ? 'var(--bg-base)' : 'white', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', border: '1px solid var(--border-light)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                이전
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currentPage} / {totalPages}
              </span>
              <button 
                className="btn" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', background: currentPage === totalPages ? 'var(--bg-base)' : 'white', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', border: '1px solid var(--border-light)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Health;
