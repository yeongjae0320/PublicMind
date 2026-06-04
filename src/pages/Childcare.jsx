import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, Users, Search, AlertCircle, ExternalLink, Hash, Info } from 'lucide-react';
import { sigunguCodes } from '../data/sigunguCodes';

function Childcare() {
  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigungu, setSelectedSigungu] = useState('');
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // 시도 목록 추출
  const sidos = Object.keys(sigunguCodes);
  
  // 선택된 시도의 시군구 목록
  const sigungus = selectedSido ? sigunguCodes[selectedSido] : [];

  // 시도 변경 시 시군구 초기화
  useEffect(() => {
    setSelectedSigungu('');
  }, [selectedSido]);

  const handleSearch = async () => {
    if (!selectedSigungu) {
      setErrorMsg('조회할 시/군/구를 선택해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setHasSearched(true);
    setCenters([]);

    try {
      const apiKey = import.meta.env.VITE_CHILDCARE_API_KEY;
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
      }

      const path = `/mediate/rest/cpmsapi021/cpmsapi021/request?key=${apiKey}&arcode=${selectedSigungu}`;
      const url = import.meta.env.DEV ? `/api/childcare${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("http://api.childcare.go.kr" + path)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('서버 응답 오류 (HTTP ' + response.status + ')');
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // 에러 확인
      const resultMsg = xmlDoc.getElementsByTagName('resultMsg')[0]?.textContent || '';
      const resultCode = xmlDoc.getElementsByTagName('resultCode')[0]?.textContent || '';
      
      // ERROR-100, ERROR-200, INFO-100, INFO-200, INFO-300, INFO-400 처리
      if (resultCode && resultCode !== '00') {
        if (resultCode === 'INFO-200') {
          setCenters([]); // 검색 결과 없음
          setLoading(false);
          return;
        }
        throw new Error(`[${resultCode}] ${resultMsg || '알 수 없는 오류'}`);
      }

      const items = xmlDoc.getElementsByTagName('item');
      
      if (!items || items.length === 0) {
        // 아이템이 없으면 검색 결과 없음
        setCenters([]);
        setLoading(false);
        return;
      }

      const parsedCenters = Array.from(items).map((item, index) => {
        const getText = (tag) => {
          const el = item.getElementsByTagName(tag)[0];
          return el ? el.textContent : '';
        };

        return {
          id: getText('stcode') || `temp-${index}`,
          name: getText('crname'),
          tel: getText('crtel'),
          fax: getText('crfax'),
          address: getText('craddr'),
          home: getText('crhome'),
          capacity: getText('crcapat')
        };
      });

      setCenters(parsedCenters);
    } catch (error) {
      console.error('Childcare API Fetch Error:', error);
      // 예제에서 제공한 INFO-200(결과없음) 텍스트가 포함된 경우
      if (error.message.includes('INFO-200') || error.message.includes('검색결과가 없습니다')) {
        setCenters([]);
        setErrorMsg('');
      } else {
        setErrorMsg(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
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
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center', marginBottom: '16px' }}>
          어린이집 현황
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          전국의 어린이집 정보를 실시간으로 확인하세요.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label className="form-label">시/도</label>
          <select 
            className="form-input" 
            value={selectedSido} 
            onChange={(e) => setSelectedSido(e.target.value)}
          >
            <option value="">시/도 선택</option>
            {sidos.map(sido => (
              <option key={sido} value={sido}>{sido}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '200px' }}>
          <label className="form-label">시/군/구</label>
          <select 
            className="form-input" 
            value={selectedSigungu} 
            onChange={(e) => setSelectedSigungu(e.target.value)}
            disabled={!selectedSido}
          >
            <option value="">시/군/구 선택</option>
            {sigungus.map(sgg => (
              <option key={sgg.code} value={sgg.code}>{sgg.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSearch}
          disabled={loading || !selectedSigungu}
          style={{ height: '48px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? (
            <>
              <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div>
              조회중...
            </>
          ) : (
            <>
              <Search size={18} />
              조회하기
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="panel" style={{ borderLeft: '4px solid var(--accent-red)', marginBottom: '32px', background: 'rgba(239, 68, 68, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-red)', fontWeight: 600, marginBottom: '8px' }}>
            <AlertCircle size={20} /> API 오류가 발생했습니다
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
        </div>
      )}

      {/* Initial Empty State */}
      {!loading && !hasSearched && !errorMsg && (
        <div className="fade-in panel" style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', border: '1px dashed var(--border-light)' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: 'var(--primary-blue)', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}>
            <MapPin size={40} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            우리가족이 찾는 지역은 어디인가요?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '450px', lineHeight: 1.6 }}>
            상단에서 <strong>시/도</strong> 및 <strong>시/군/구</strong>를 선택하신 후 조회하기를 누르시면, 해당 지역의 모든 어린이집 정보를 실시간으로 불러옵니다.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              검색 중...
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '180px' }}>
                <div className="skeleton-pulse" style={{ width: '70%', height: '24px', borderRadius: '4px', marginBottom: '24px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <div className="skeleton-pulse" style={{ width: '100%', height: '16px', borderRadius: '4px' }}></div>
                  <div className="skeleton-pulse" style={{ width: '50%', height: '16px', borderRadius: '4px' }}></div>
                  <div className="skeleton-pulse" style={{ width: '40%', height: '16px', borderRadius: '4px' }}></div>
                  <div className="skeleton-pulse" style={{ width: '30%', height: '16px', marginTop: 'auto', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && !errorMsg && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              검색 결과 <span style={{ color: 'var(--primary-blue)' }}>{centers.length}</span>건
            </h2>
          </div>
          
          {centers.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
              {centers.map((center) => (
                <div key={center.id} className="panel hover-effect" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
                      {center.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <MapPin size={16} style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.5 }}>{center.address}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <Phone size={16} style={{ flexShrink: 0 }} />
                      <span>{center.tel || '번호 없음'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <Users size={16} style={{ flexShrink: 0 }} />
                      <span>정원: {center.capacity}명</span>
                    </div>

                    {center.home && center.home !== '없음' && center.home !== 'http://' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
                        <ExternalLink size={16} style={{ color: 'var(--primary-blue)' }} />
                        <a 
                          href={center.home.startsWith('http') ? center.home : `http://${center.home}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary-blue)', fontSize: '0.95rem', textDecoration: 'none' }}
                        >
                          홈페이지 바로가기
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Info size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>검색 결과가 없습니다</h3>
              <p style={{ color: 'var(--text-secondary)' }}>해당 지역에 등록된 어린이집 정보가 존재하지 않습니다.</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

export default Childcare;
