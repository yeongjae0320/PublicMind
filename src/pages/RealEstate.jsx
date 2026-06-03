import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Shield, ShoppingCart, Train, Sparkles, Building, Map as MapIcon, X } from 'lucide-react';
import { MOCK_NEIGHBORHOODS } from '../data/mockRealEstate';
import AiInsightCard from '../components/AiInsightCard';

// Custom Kakao Map Component
function KakaoMap({ results, onMarkerClick, selectedItem }) {
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
          const location = new window.kakao.maps.LatLng(37.5665, 126.9780);
          const mapOptions = {
            center: location,
            level: 5, // Kakao zoom level (1-14, lower is closer)
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
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;
    
    // Clear old markers (in Kakao, overlays are setMap(null))
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (results && results.length > 0) {
      window.kakao.maps.load(() => {
        results.forEach((item) => {
          // Add some jitter to coordinates if multiple items have exactly the same lat/lng
          const jitterLat = (Math.random() - 0.5) * 0.001;
          const jitterLng = (Math.random() - 0.5) * 0.001;
          const lat = parseFloat(item.lat) + jitterLat || 37.5665;
          const lng = parseFloat(item.lng) + jitterLng || 126.9780;
          
          const position = new window.kakao.maps.LatLng(lat, lng);
          
          // 지도 마커에서 이모지 제거, 심플하고 깔끔한 디자인으로 변경
          const bgColor = item.isReal ? 'var(--accent-red)' : 'var(--primary-blue)';
          const markerHTML = `
            <div style="background: ${bgColor}; color: white; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); white-space: nowrap; border: 2px solid white;">
              ${item.price || item.name}
            </div>
          `;
          
          const content = document.createElement('div');
          content.innerHTML = markerHTML;
          content.style.cursor = 'pointer';
          content.onclick = () => {
            onMarkerClick(item);
            mapInstance.current.panTo(position);
          };

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: position,
            content: content,
            yAnchor: 1,
            zIndex: 3
          });
          
          customOverlay.setMap(mapInstance.current);
          markersRef.current.push(customOverlay);
        });

        // Center map to first result
        const firstPos = new window.kakao.maps.LatLng(
          parseFloat(results[0].lat) || 37.5665, 
          parseFloat(results[0].lng) || 126.9780
        );
        mapInstance.current.panTo(firstPos);
      });
    }
  }, [results, onMarkerClick]);

  useEffect(() => {
    if (selectedItem && mapInstance.current && window.kakao && window.kakao.maps) {
      const position = new window.kakao.maps.LatLng(
        parseFloat(selectedItem.lat) || 37.5665, 
        parseFloat(selectedItem.lng) || 126.9780
      );
      mapInstance.current.panTo(position);
    }
  }, [selectedItem]);

  return <div ref={mapElement} style={{ width: '100%', height: '100%' }} />;
}

function RealEstate() {
  const [formData, setFormData] = useState({
    deposit: '5000',
    rent: '60',
    region: '11680', // Default: 강남구
    priority1: 'safety',
    priority2: 'commercial'
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedRealEstate, setSelectedRealEstate] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchRealData = async (lawdCd) => {
    try {
      const API_KEY = "7a3edd922501de268c179c92ad1a8dadba4c961d8bec81c71bf969280acf3d99";
      const aptUrl = `/api/rtms/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${API_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=202312&numOfRows=10&pageNo=1`;
      const villaUrl = `/api/rtms/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade?serviceKey=${API_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=202312&numOfRows=10&pageNo=1`;
      
      const [aptRes, villaRes] = await Promise.all([
        fetch(aptUrl).catch(e => null),
        fetch(villaUrl).catch(e => null)
      ]);
      
      const aptXml = aptRes ? await aptRes.text() : "";
      const villaXml = villaRes ? await villaRes.text() : "";
      
      const parser = new DOMParser();
      let realResults = [];

      if (aptXml) {
        const aptDoc = parser.parseFromString(aptXml, "text/xml");
        const aptItems = aptDoc.getElementsByTagName("item");
        for (let i = 0; i < Math.min(aptItems.length, 3); i++) {
          const aptNm = aptItems[i].getElementsByTagName("aptNm")[0]?.textContent || "무명 아파트";
          const dealAmount = aptItems[i].getElementsByTagName("dealAmount")[0]?.textContent?.trim() || "0";
          const area = aptItems[i].getElementsByTagName("excluUseAr")[0]?.textContent || "0";
          const dong = aptItems[i].getElementsByTagName("umdNm")[0]?.textContent || "";
          
          realResults.push({
            id: `real_apt_${i}`,
            name: `${dong} ${aptNm}`,
            price: `${dealAmount}만`,
            rent: `[아파트] 매매 ${dealAmount}만 원`,
            isReal: true,
            summary: `전용면적 ${area}㎡`,
            lat: 37.5 + (Math.random() * 0.1),
            lng: 127.0 + (Math.random() * 0.1)
          });
        }
      }

      if (villaXml) {
        const villaDoc = parser.parseFromString(villaXml, "text/xml");
        const villaItems = villaDoc.getElementsByTagName("item");
        for (let i = 0; i < Math.min(villaItems.length, 3); i++) {
          const villaNm = villaItems[i].getElementsByTagName("mhouseNm")[0]?.textContent || 
                          villaItems[i].getElementsByTagName("단지명")[0]?.textContent || "연립/빌라";
          const dealAmount = villaItems[i].getElementsByTagName("dealAmount")[0]?.textContent?.trim() || "0";
          const area = villaItems[i].getElementsByTagName("excluUseAr")[0]?.textContent || "0";
          const dong = villaItems[i].getElementsByTagName("umdNm")[0]?.textContent || "";
          
          realResults.push({
            id: `real_villa_${i}`,
            name: `${dong} ${villaNm}`,
            price: `${dealAmount}만`,
            rent: `[빌라] 매매 ${dealAmount}만 원`,
            isReal: true,
            summary: `전용면적 ${area}㎡`,
            lat: 37.5 + (Math.random() * 0.1),
            lng: 127.0 + (Math.random() * 0.1)
          });
        }
      }

      return realResults;
    } catch (e) {
      console.error("API Fetch Error:", e);
      return [];
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setResults(null);
    
    const realApts = await fetchRealData(formData.region);
    
    setTimeout(() => {
      let matched = [...MOCK_NEIGHBORHOODS];
      matched.sort(() => Math.random() - 0.5); 
      
      const combined = [matched[0], ...realApts];
      setResults(combined);
      setIsSearching(false);
    }, 1200);
  };

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
        .real-estate-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
          border: 1px solid rgba(226, 232, 240, 0.8);
          position: relative;
        }
        .real-estate-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.08);
        }
      `}</style>

      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>부동산/입지 분석기</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          국토교통부 실거래가 및 상권 데이터를 융합하여 내 라이프스타일에 딱 맞는 동네를 찾아줍니다.
        </p>
      </div>

      {/* Top Section: Form (Left) & Map (Right) */}
      <div className="realestate-top-section" style={{ 
        width: '100%', 
        marginBottom: '40px'
      }}>
        {/* Left: Form */}
        <div className="glass-panel realestate-form" style={{ flexShrink: 0, padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <MapPin color="var(--primary-blue)" size={24} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>희망 지역 및 조건</h2>
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>관심 지역</label>
              <div style={{ position: 'relative' }}>
                <select name="region" value={formData.region} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', padding: '12px 12px 12px 44px', appearance: 'none', background: '#f8fafc', fontSize: '0.95rem' }}>
                  <optgroup label="서울특별시">
                    <option value="11680">강남구</option>
                    <option value="11740">강동구</option>
                    <option value="11500">강서구</option>
                    <option value="11620">관악구</option>
                    <option value="11215">광진구</option>
                    <option value="11530">구로구</option>
                    <option value="11350">노원구</option>
                    <option value="11590">동작구</option>
                    <option value="11440">마포구</option>
                    <option value="11650">서초구</option>
                    <option value="11200">성동구</option>
                    <option value="11710">송파구</option>
                    <option value="11560">영등포구</option>
                    <option value="11170">용산구</option>
                    <option value="11110">종로구</option>
                  </optgroup>
                  <optgroup label="기타 주요도시">
                    <option value="41130">성남시</option>
                    <option value="28185">인천 연수구</option>
                    <option value="26350">부산 해운대구</option>
                  </optgroup>
                </select>
                <Building size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-blue)' }} />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>예산 (보증금 / 월세)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type="number" name="deposit" value={formData.deposit} onChange={handleInputChange} className="form-input" placeholder="보증금" style={{ paddingRight: '32px', padding: '12px', background: '#f8fafc', fontSize: '0.95rem' }} required />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>만</span>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type="number" name="rent" value={formData.rent} onChange={handleInputChange} className="form-input" placeholder="월세" style={{ paddingRight: '32px', padding: '12px', background: '#f8fafc', fontSize: '0.95rem' }} required />
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>만</span>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>우선 고려 1순위</label>
              <div style={{ position: 'relative' }}>
                <select name="priority1" value={formData.priority1} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', padding: '12px 12px 12px 44px', appearance: 'none', background: '#f8fafc', fontSize: '0.95rem' }}>
                  <option value="safety">치안/안전 인프라</option>
                  <option value="commercial">상권 인프라</option>
                  <option value="transport">교통 접근성</option>
                </select>
                {formData.priority1 === 'safety' && <Shield size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-blue)' }} />}
                {formData.priority1 === 'commercial' && <ShoppingCart size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-amber)' }} />}
                {formData.priority1 === 'transport' && <Train size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-green)' }} />}
              </div>
            </div>
            
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '16px', fontSize: '1.05rem', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} disabled={isSearching}>
                {isSearching ? '매핑 중...' : <><Search size={20} /> 실거래가 기반 동네 찾기</>}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Map */}
        <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '24px' }}>
          <KakaoMap results={results} onMarkerClick={setSelectedRealEstate} selectedItem={selectedRealEstate} />
          {results && (
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '380px', zIndex: 10 }}>
              <AiInsightCard data={results} context="부동산 매물 및 입지" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Search Results Grid */}
      <div style={{ padding: '0 8px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
          {isSearching ? '결과를 불러오는 중입니다...' : results ? '추천 동네 및 매물 리스트' : ''}
        </h2>
        
        {isSearching ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="real-estate-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div className="skeleton-box" style={{ height: '24px', width: '50%', borderRadius: '6px' }}></div>
                  <div className="skeleton-box" style={{ height: '24px', width: '60px', borderRadius: '12px' }}></div>
                </div>
                <div className="skeleton-box" style={{ height: '22px', width: '70%', borderRadius: '4px', marginBottom: '16px' }}></div>
                <div className="skeleton-box" style={{ height: '60px', width: '100%', borderRadius: '6px', marginBottom: '20px' }}></div>
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <div className="skeleton-box" style={{ height: '20px', width: '40%', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : results ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {results.map((item, idx) => (
              <div key={item.id} className="real-estate-card" onClick={() => setSelectedRealEstate(item)} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0', color: 'var(--text-primary)', paddingRight: '8px', wordBreak: 'keep-all' }}>{item.name}</h4>
                  <span className="badge" style={{ 
                    background: item.isReal ? 'var(--accent-red)' : 'var(--primary-blue)', 
                    color: 'white', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, flexShrink: 0
                  }}>
                    {item.isReal ? '실거래' : 'AI 추천'}
                  </span>
                </div>
                
                <div style={{ color: item.isReal ? 'var(--accent-red)' : 'var(--primary-blue)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '12px' }}>
                  {item.rent}
                </div>
                
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, flex: 1 }}>
                  {item.summary}
                </p>
                
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 700 }}>지도에서 위치 보기</span>
                  <MapIcon size={16} style={{ color: 'var(--primary-blue)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.4)', borderRadius: '24px', border: '1px dashed var(--border-light)' }}>
            <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>좌측 폼에서 조건을 입력하고 검색해주세요</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RealEstate;
