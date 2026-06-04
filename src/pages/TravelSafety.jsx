import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, ShieldAlert, Navigation, Search, CheckCircle, Info, Filter, ArrowRight, Settings, X, RefreshCw, Map as MapIcon, AlertTriangle, Plane, Download, Sparkles } from 'lucide-react';
import { getCoordinates } from '../data/countryMap';
import AiInsightCard from '../components/AiInsightCard';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
function MapController({ selectedAlert }) {
  const map = useMap();
  useEffect(() => {
    if (selectedAlert) {
      map.flyTo([selectedAlert.lat, selectedAlert.lng], 5, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedAlert, map]);
  return null;
}

function GlobalLeafletMap({ alerts, onMarkerClick, selectedAlert }) {
  // Center of the world
  const defaultCenter = [20.0, 0.0];
  const defaultZoom = 2;

  const createCustomIcon = (type, title) => {
    const color = type === 'critical' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981';
    
    const markerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px; transform:translate(-50%, -100%); cursor:pointer;">
        <div style="background:${color}; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 15px ${color}; animation: pulseGlow 2s infinite;"></div>
        <div style="background:rgba(255,255,255,0.9); padding:4px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; color:#1e293b; box-shadow:0 4px 6px rgba(0,0,0,0.1); white-space:nowrap; margin-left:-50%;">
          ${title}
        </div>
      </div>
    `;

    return L.divIcon({
      html: markerHTML,
      className: 'custom-leaflet-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={defaultZoom} 
      style={{ width: '100%', height: '100%', zIndex: 1 }}
      zoomControl={true}
      minZoom={2}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapController selectedAlert={selectedAlert} />
      
      {alerts.map(alert => (
        <Marker 
          key={alert.id}
          position={[alert.lat, alert.lng]}
          icon={createCustomIcon(alert.type, alert.title)}
          eventHandlers={{
            click: () => onMarkerClick(alert),
          }}
        />
      ))}
    </MapContainer>
  );
}

function TravelSafety() {
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, danger: 0 });
  const [filterLevel, setFilterLevel] = useState(3); // Default to 3단계 이상
  const sliderRef = useRef(null);

  useEffect(() => {
    if (selectedAlert && sliderRef.current) {
      const cardElement = document.getElementById(`alert-card-${selectedAlert.id}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedAlert]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setIsLoading(true);
        const API_KEY = "7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99";
        const path = `/1262000/TravelAlarmService2/getTravelAlarmList2?serviceKey=${API_KEY}&returnType=JSON&numOfRows=200&pageNo=1`;
        const url = import.meta.env.DEV ? `/api/travel${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("http://apis.data.go.kr" + path)}`;
        
        const res = await fetch(url);
        const text = await res.text();
        
        let parsedData = [];
        try {
          const json = JSON.parse(text);
          if (json.data) {
            parsedData = json.data;
          } else if (json.response?.body?.items) {
             const items = json.response.body.items.item || json.response.body.items;
             parsedData = Array.isArray(items) ? items : [items];
          }
        } catch (e) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/xml");
          const items = doc.getElementsByTagName("item");
          for(let i=0; i<items.length; i++) {
             parsedData.push({
                countryName: items[i].getElementsByTagName("countryName")[0]?.textContent || "",
                countryEnName: items[i].getElementsByTagName("countryEnName")[0]?.textContent || "",
                isoCode: items[i].getElementsByTagName("isoCode")[0]?.textContent || "",
                alarmLvl: items[i].getElementsByTagName("alarmLvl")[0]?.textContent || "",
                remark: items[i].getElementsByTagName("remark")[0]?.textContent || "",
             });
          }
        }
        
        if (parsedData.length === 0) {
          console.warn("No data parsed or empty response.");
        }
        
        processAndSetData(parsedData);
      } catch (err) {
        console.error("API Fetch Error:", err);
        setAlerts([]);
        setStats({ total: 0, danger: 0 });
        setIsLoading(false);
      }
    };

    const processAndSetData = (parsedData) => {
      let dangerCount = 0;
      
      const formattedAlerts = parsedData.map((item, idx) => {
         const alarmLvl = item.alarm_lvl || item.alarmLvl || "0";
         const isoCode = item.country_iso_alp2 || item.isoCode || "";
         const countryName = item.country_nm || item.countryName || "";
         const countryEnName = item.country_eng_nm || item.countryEnName || "";
         const remark = item.remark || "";
         
         let lvl = parseInt(alarmLvl, 10);
         
         let type = 'success';
         let impact = '안전';
         if (lvl >= 3) { type = 'critical'; impact = '출국권고/여행금지'; dangerCount++; }
         else if (lvl === 2) { type = 'warning'; impact = '여행자제'; }
         else if (lvl === 1) { type = 'warning'; impact = '여행유의'; }
         
         if (remark && remark.includes('특별여행주의보')) {
            type = 'critical'; impact = '특별여행주의보'; 
            if (lvl < 3) dangerCount++;
            if (lvl < 3) lvl = 2.5; 
         }
         
         const coords = getCoordinates(isoCode, countryName);
         
         return {
            id: isoCode || `alert_${idx}`,
            type,
            title: `${countryName} 여행경보`,
            location: `${countryName} (${countryEnName || isoCode})`,
            impact,
            time: '실시간 갱신',
            lat: coords.lat,
            lng: coords.lng,
            remark: remark || '특이사항 없음',
            lvl
         };
      }).filter(item => item.lvl >= 1);
      
      formattedAlerts.sort((a,b) => {
        if (a.type === 'critical' && b.type !== 'critical') return -1;
        if (a.type !== 'critical' && b.type === 'critical') return 1;
        return 0;
      });
      
      setAlerts(formattedAlerts);
      setStats({ total: parsedData.length > 20 ? parsedData.length : 195, danger: dangerCount });
      setIsLoading(false);
    };
    
    fetchGlobalData();
  }, []);

  const displayAlerts = alerts.filter(alert => {
    if (filterLevel === 0) return true;
    if (filterLevel === 1) return alert.lvl === 1;
    if (filterLevel === 2) return alert.lvl === 2;
    if (filterLevel === 3) return alert.lvl === 3;
    if (filterLevel === 4) return alert.lvl === 4;
    return true;
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
      <style>{`
        @keyframes skeleton-loading {
          0% { background-color: rgba(226, 232, 240, 0.4); }
          50% { background-color: rgba(226, 232, 240, 0.8); }
          100% { background-color: rgba(226, 232, 240, 0.4); }
        }
        .skeleton-box {
          animation: skeleton-loading 1.5s infinite ease-in-out;
        }
      `}</style>
      
      {/* 1. 통일된 헤더 레이아웃 */}
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>글로벌 재난/안전 대시보드</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          외교부 해외안전여행 및 세계 기상 기구 데이터를 실시간으로 모니터링합니다.
        </p>
      </div>

      {/* 2. 상단 요약 KPI 카드 (2분할) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>모니터링 중인 국가</div>
          {isLoading ? (
            <div className="skeleton-box" style={{ height: '40px', width: '80px', borderRadius: '8px' }}></div>
          ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}<span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>개국</span></div>
          )}
        </div>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>현재 위험경보 (3단계 이상)</div>
          {isLoading ? (
            <div className="skeleton-box" style={{ height: '40px', width: '80px', borderRadius: '8px' }}></div>
          ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-red)' }}>{stats.danger}<span style={{ fontSize: '1.2rem', fontWeight: 600, opacity: 0.8 }}>곳</span></div>
          )}
        </div>
      </div>

      {/* 3. 풀스크린 지도 및 플로팅 UI */}
      <div style={{ flex: 1, position: 'relative', height: 'calc(100vh - 300px)', minHeight: '700px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', marginBottom: '24px' }}>
        
        {/* 상단 우측: 플로팅 필터 */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)' }}>
          {[
            { label: '전체보기', level: 0 },
            { label: '1단계', level: 1 },
            { label: '2단계', level: 2 },
            { label: '3단계 이상', level: 3 }
          ].map(filter => (
            <button
              key={filter.level}
              onClick={() => setFilterLevel(filter.level)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: filterLevel === filter.level ? 'var(--primary-blue)' : 'transparent',
                color: filterLevel === filter.level ? 'white' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 메인 풀스크린 지도 */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <GlobalLeafletMap alerts={displayAlerts} onMarkerClick={setSelectedAlert} selectedAlert={selectedAlert} />
        </div>

        {/* AI Insight Card Overlay */}
        <div style={{ position: 'absolute', top: '80px', right: '20px', width: '380px', zIndex: 1000 }}>
          <AiInsightCard 
            data={displayAlerts.map(a => ({ 
              국명: a.location, 
              경보단계: a.impact, 
              특이사항: a.remark 
            }))} 
            context="글로벌 안전 경보 현황" 
          />
        </div>

        {/* 하단: 플로팅 가로 슬라이더 (Horizontal Cards) */}
        <div 
          ref={sliderRef}
          style={{ 
            position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 1000, 
            display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', padding: '10px',
            scrollBehavior: 'smooth'
          }}
          className="hide-scrollbar"
        >
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-panel" style={{ flexShrink: 0, width: '320px', padding: '20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton-box" style={{ height: '24px', width: '60px', borderRadius: '12px' }}></div>
                    <div className="skeleton-box" style={{ height: '16px', width: '50px', borderRadius: '4px' }}></div>
                  </div>
                  <div className="skeleton-box" style={{ height: '28px', width: '80%', borderRadius: '6px', margin: '8px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton-box" style={{ height: '16px', width: '40%', borderRadius: '4px' }}></div>
                    <div className="skeleton-box" style={{ height: '16px', width: '30%', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))}
            </>
          ) : displayAlerts.map(alert => {
            const isSelected = selectedAlert && selectedAlert.id === alert.id;
            return (
              <div 
                key={alert.id} 
                id={`alert-card-${alert.id}`}
                style={{ 
                  flexShrink: 0,
                  width: '320px',
                  padding: '20px', 
                  borderRadius: '16px',
                  background: isSelected ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 10px 25px rgba(0,0,0,0.2)' : '0 4px 15px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'translateY(-10px)' : 'translateY(0)',
                  border: isSelected ? `2px solid var(--primary-blue)` : '2px solid transparent',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className={`badge ${alert.type === 'critical' ? 'badge-danger' : alert.type === 'warning' ? 'badge-warning' : 'badge-success'}`}>
                    {alert.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{alert.time}</span>
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{alert.title}</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapIcon size={14} /> {alert.location}</span>
                  <span style={{ fontWeight: 800, color: alert.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{alert.impact}</span>
                </div>
                
                {/* 선택된 경우에만 확장되는 상세 내용 */}
                {isSelected && (
                  <div className="fade-in" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> 외교부 공시 지침
                    </h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, maxHeight: '80px', overflowY: 'auto' }}>
                      {alert.remark}
                    </p>
                    <button 
                      className="btn btn-outline" 
                      style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '0.85rem' }}
                      onClick={() => navigate('/travel-safety/contacts', { state: { query: alert.location.split(' ')[0] } })}
                    >
                      현지 대사관 연락처 조회
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TravelSafety;
