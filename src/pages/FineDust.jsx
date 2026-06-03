import React, { useState, useEffect } from 'react';
import { Wind, MapPin, Activity, Droplets, Sun, AlertTriangle, BarChart2 } from 'lucide-react';
import { fetchFineDust } from '../services/environmentApi';

function FineDust() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadRealData = async (lat, lng) => {
      if (!window.kakao || !window.kakao.maps) {
        setErrorMsg('카카오 지도 API가 로드되지 않았습니다.');
        setLoading(false);
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2RegionCode(lng, lat, async (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          // Find legal dong (region_type === 'B')
          const region = result.find(r => r.region_type === 'B') || result[0];
          const sidoName = region.region_1depth_name; // e.g. 서울특별시
          const guName = region.region_2depth_name; // e.g. 영등포구
          const dongName = region.region_3depth_name; // e.g. 신길동

          try {
            const apiData = await fetchFineDust(sidoName, guName, dongName);
            setData(apiData);
          } catch (error) {
            setErrorMsg('에어코리아 API 연동 중 오류가 발생했습니다.');
          }
        } else {
          setErrorMsg('현재 위치의 행정동을 찾을 수 없습니다.');
        }
        setLoading(false);
      });
    };

    let isLocationResolved = false;

    // 강력한 3초 수동 타임아웃 방어 로직 (브라우저 위치 팝업 응답 대기 지연 시 기본 위치 렌더링)
    const safetyTimeout = setTimeout(() => {
      if (!isLocationResolved) {
        isLocationResolved = true;
        console.warn("위치 정보 응답 지연. 기본 위치(서울 영등포구)로 렌더링합니다.");
        loadRealData(37.5133, 126.9064); // 서울 영등포구 기본 좌표
      }
    }, 3000);

    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isLocationResolved) {
            isLocationResolved = true;
            clearTimeout(safetyTimeout);
            loadRealData(position.coords.latitude, position.coords.longitude);
          }
        },
        (error) => {
          if (!isLocationResolved) {
            isLocationResolved = true;
            clearTimeout(safetyTimeout);
            console.warn("위치 권한 거부됨. 기본 위치로 렌더링합니다.", error);
            loadRealData(37.5133, 126.9064); // 에러 발생 시에도 기본 위치로 폴백
          }
        },
        { timeout: 3000, maximumAge: 0 }
      );
    } else {
      if (!isLocationResolved) {
        isLocationResolved = true;
        clearTimeout(safetyTimeout);
        loadRealData(37.5133, 126.9064);
      }
    }
  }, []);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', gap: '24px' }}>
        {/* Skeleton UI */}
        <div className="skeleton-pulse" style={{ height: '200px', borderRadius: '24px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="skeleton-pulse" style={{ height: '160px', borderRadius: '20px' }}></div>
          <div className="skeleton-pulse" style={{ height: '160px', borderRadius: '20px' }}></div>
          <div className="skeleton-pulse" style={{ height: '160px', borderRadius: '20px' }}></div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{errorMsg}</h3>
      </div>
    );
  }

  if (!data) return null;

  // 통합대기환경지수(Khai)를 기반으로 메인 테마 카드 결정
  const mainColor = data.khai.color || '#10b981';
  const mainGradient = data.khai.gradient || 'linear-gradient(135deg, #34d399, #10b981)';

  // Sub text based on Khai status
  let subText = '야외 활동하기 무난한 날씨입니다.';
  if (data.khai.status === '좋음') subText = '공기가 상쾌합니다! 야외 활동하기 아주 좋아요.';
  if (data.khai.status === '나쁨') subText = '외출 시 마스크를 착용하시고 장시간 야외 활동을 피하세요.';
  if (data.khai.status === '매우나쁨') subText = '야외 활동을 자제하시고 실내 환기도 주의하세요.';

  return (
    <div className="fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Top Main Card */}
      <div 
        className="glass-panel" 
        style={{ 
          background: mainGradient,
          color: 'white',
          padding: '40px 32px',
          borderRadius: '32px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 20px 40px -10px ${mainColor}80`,
          border: 'none'
        }}
      >
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1, transform: 'scale(2)' }}>
          <Wind size={200} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '99px', width: 'fit-content', backdropFilter: 'blur(10px)' }}>
              <MapPin size={16} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{data.stationName} 측정소</span>
            </div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '10px 0 0 0', lineHeight: 1.1 }}>{data.khai.status}</h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, fontWeight: 600, marginTop: '8px' }}>{subText}</p>
          </div>
          
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.8, marginBottom: '8px' }}>통합대기환경지수 (Khai)</div>
            <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {data.khai.value}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>
              측정 시간: {data.time} 기준
            </div>
          </div>
        </div>
      </div>

      {/* Primary Pollutants Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        
        {/* PM10 Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
            <Wind size={18} /> 미세먼지 (PM10)
          </div>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Simple CSS Circle Gauge */}
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={data.pm10.color} strokeWidth="12" strokeDasharray="339" strokeDashoffset={339 - (339 * (data.pm10.value / 150))} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: data.pm10.color, lineHeight: 1 }}>{data.pm10.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>㎍/㎥</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', background: data.pm10.color, color: 'white', padding: '4px 16px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800 }}>
            {data.pm10.status}
          </div>
        </div>

        {/* PM2.5 Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
            <Activity size={18} /> 초미세먼지 (PM2.5)
          </div>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={data.pm25.color} strokeWidth="12" strokeDasharray="339" strokeDashoffset={339 - (339 * (data.pm25.value / 100))} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: data.pm25.color, lineHeight: 1 }}>{data.pm25.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>㎍/㎥</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', background: data.pm25.color, color: 'white', padding: '4px 16px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800 }}>
            {data.pm25.status}
          </div>
        </div>

        {/* Ozone Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '16px' }}>
            <Sun size={18} /> 오존 (O₃)
          </div>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={data.o3.color} strokeWidth="12" strokeDasharray="339" strokeDashoffset={339 - (339 * (data.o3.value / 0.15))} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: data.o3.color, lineHeight: 1 }}>{data.o3.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ppm</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', background: data.o3.color, color: 'white', padding: '4px 16px', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800 }}>
            {data.o3.status}
          </div>
        </div>

      </div>

      {/* Secondary Pollutants */}
      <div className="glass-panel" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, borderRight: '1px solid var(--border-light)', paddingRight: '24px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>이산화질소 (NO₂)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.no2.value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ppm</span>
            <span style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{data.no2.status}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, borderRight: '1px solid var(--border-light)', padding: '0 24px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>일산화탄소 (CO)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.co.value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ppm</span>
            <span style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{data.co.status}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingLeft: '24px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>아황산가스 (SO₂)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.so2.value}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ppm</span>
            <span style={{ marginLeft: 'auto', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{data.so2.status}</span>
          </div>
        </div>
      </div>

      {/* Regional Comparison */}
      {data.regionalData && data.regionalData.length > 0 && (
        <div className="glass-panel" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>
            <BarChart2 size={24} style={{ color: '#3b82f6' }} />
            {data.sidoName} 내 미세먼지(PM10) 현황 비교
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Best Regions */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 800, marginBottom: '16px' }}>가장 공기가 맑은 곳 (Top 3)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.regionalData.slice(0, 3).map((r, i) => (
                  <div key={`best-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', fontWeight: 800, color: '#94a3b8', fontSize: '0.9rem' }}>{i + 1}</div>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>
                      {r.stationName}
                      {r.stationName === data.stationName && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>현재위치</span>}
                    </div>
                    <div style={{ width: '120px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((r.pm10Value / 150) * 100, 100)}%`, background: r.gradient || r.color, borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '32px', textAlign: 'right', fontWeight: 800, color: r.color }}>{r.pm10Value}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Worst Regions */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 800, marginBottom: '16px' }}>가장 미세먼지가 심한 곳 (Bottom 3)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.regionalData.slice(-3).reverse().map((r, i) => (
                  <div key={`worst-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', fontWeight: 800, color: '#94a3b8', fontSize: '0.9rem' }}>{data.regionalData.length - i}</div>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: '0.95rem' }}>
                      {r.stationName}
                      {r.stationName === data.stationName && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>현재위치</span>}
                    </div>
                    <div style={{ width: '120px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min((r.pm10Value / 150) * 100, 100)}%`, background: r.gradient || r.color, borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ width: '32px', textAlign: 'right', fontWeight: 800, color: r.color }}>{r.pm10Value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default FineDust;
