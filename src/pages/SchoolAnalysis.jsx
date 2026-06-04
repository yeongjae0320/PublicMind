import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, School, Globe, ArrowRight, BarChart2, BookOpen } from 'lucide-react';
import { REGIONS } from '../utils/regions';
import AiInsightCard from '../components/AiInsightCard';
import { analytics } from '../firebase';
import { logEvent } from 'firebase/analytics';

const EDU_OFFICE_CODES = {
  '서울': 'B10', '부산': 'C10', '대구': 'D10', '인천': 'E10', '광주': 'F10',
  '대전': 'G10', '울산': 'H10', '세종': 'I10', '경기': 'J10', '강원': 'K10',
  '충북': 'M10', '충남': 'N10', '전북': 'P10', '전남': 'Q10', '경북': 'R10',
  '경남': 'S10', '제주': 'T10'
};

function SchoolAnalysis() {
  const [sido, setSido] = useState('서울');
  const [schoolLevel, setSchoolLevel] = useState(''); // 전체, 초등학교, 중학교, 고등학교
  const [searchName, setSearchName] = useState('');
  
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 페이징
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchSchools = async () => {
    const apiKey = import.meta.env.VITE_NEIS_API_KEY;
    if (!apiKey) {
      setError("API 인증키가 설정되지 않았습니다.");
      return;
    }

    setLoading(true);
    setError(null);
    setSchools([]);
    setCurrentPage(1);

    try {
      const officeCode = EDU_OFFICE_CODES[sido];
      const path = `/hub/schoolInfo?KEY=${apiKey}&Type=json&pIndex=1&pSize=1000&ATPT_OFCDC_SC_CODE=${officeCode}`;
      let url = import.meta.env.DEV ? `/api/neis${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://open.neis.go.kr" + path)}`;
      
      if (schoolLevel) {
        url += `&SCHUL_KND_SC_NM=${encodeURIComponent(schoolLevel)}`;
      }
      if (searchName) {
        url += `&SCHUL_NM=${encodeURIComponent(searchName)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
        if (data.RESULT.CODE === 'INFO-200') {
          throw new Error("해당 조건에 맞는 학교 데이터가 없습니다.");
        }
        throw new Error(`API 오류: ${data.RESULT.MESSAGE}`);
      }

      if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
        let list = data.schoolInfo[1].row;
        // 행정동 필터링 (선택 사항이나 나중에 시군구 구현 시 사용)
        setSchools(list);
      } else {
        throw new Error("학교 데이터를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [sido, schoolLevel]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (analytics) {
      logEvent(analytics, 'search_school', { region: formData.region, schoolLevel: formData.schoolLevel });
    }

    fetchSchools();
  };

  // 통계 계산
  const stats = useMemo(() => {
    if (!schools.length) return { total: 0, elem: 0, mid: 0, high: 0, other: 0 };
    
    let elem = 0, mid = 0, high = 0, other = 0;
    schools.forEach(s => {
      if (s.SCHUL_KND_SC_NM === '초등학교') elem++;
      else if (s.SCHUL_KND_SC_NM === '중학교') mid++;
      else if (s.SCHUL_KND_SC_NM === '고등학교') high++;
      else other++;
    });
    
    return { total: schools.length, elem, mid, high, other };
  }, [schools]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchools = schools.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(schools.length / itemsPerPage);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>지역 학군 분석</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          선택하신 지역의 초/중/고등학교 분포와 상세 정보를 한눈에 분석합니다.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* 상단 컨트롤 패널 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>시/도 선택</label>
            <select 
              value={sido} 
              onChange={(e) => setSido(e.target.value)} 
              className="form-input" 
              style={{ width: '100%', height: '48px', fontSize: '1rem', borderRadius: '12px' }}
            >
              {Object.keys(REGIONS).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>학교급 필터</label>
            <select 
              value={schoolLevel} 
              onChange={(e) => setSchoolLevel(e.target.value)} 
              className="form-input" 
              style={{ width: '100%', height: '48px', fontSize: '1rem', borderRadius: '12px' }}
            >
              <option value="">전체 학교</option>
              <option value="초등학교">초등학교</option>
              <option value="중학교">중학교</option>
              <option value="고등학교">고등학교</option>
            </select>
          </div>

          <div style={{ flex: '2 1 300px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>학교명 검색</label>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="예: 서울과학고, 경기여고"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '44px', height: '48px', borderRadius: '12px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', height: '48px', borderRadius: '12px' }}>검색</button>
            </form>
          </div>
        </div>

        {/* 학군 요약 대시보드 */}
        {!error && !loading && schools.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>검색된 전체 학교</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}> 개교</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>초등학교</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.elem}<span style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 600 }}> 곳</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>중학교</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.mid}<span style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 600 }}> 곳</span></div>
            </div>
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>고등학교</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.high}<span style={{ fontSize: '1.2rem', opacity: 0.5, fontWeight: 600 }}> 곳</span></div>
            </div>
          </div>
        )}

        {!error && !loading && schools.length > 0 && (
          <AiInsightCard 
            data={schools.map(s => ({ 
              학교명: s.SCHUL_NM, 
              학교급: s.SCHUL_KND_SC_NM, 
              설립: s.FOND_SC_NM,
              남녀공학: s.COEDU_SC_NM 
            }))} 
            context={`${sido} 지역 학군`} 
          />
        )}

        {/* 에러 또는 로딩 처리 */}
        {error && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {error}
          </div>
        )}
        
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel skeleton-pulse" style={{ height: '220px', borderRadius: '16px' }}></div>
            ))}
          </div>
        )}

        {/* 학교 리스트 렌더링 */}
        {!error && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
            {currentSchools.map((school, idx) => (
              <div key={idx} className="glass-panel hover-lift" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={`badge ${school.SCHUL_KND_SC_NM === '초등학교' ? 'badge-success' : school.SCHUL_KND_SC_NM === '중학교' ? 'badge-warning' : school.SCHUL_KND_SC_NM === '고등학교' ? 'badge-danger' : ''}`} style={{ marginBottom: '8px', display: 'inline-block' }}>
                      {school.SCHUL_KND_SC_NM}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={18} color="var(--primary-blue)" /> {school.SCHUL_NM}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>{school.FOND_SC_NM}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{school.COEDU_SC_NM}</span>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{school.ORG_RDNMA}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Phone size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{school.ORG_TELNO}</span>
                  </div>
                </div>

                {school.HMPG_ADRES && (
                  <a 
                    href={school.HMPG_ADRES.startsWith('http') ? school.HMPG_ADRES : `http://${school.HMPG_ADRES}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-outline" 
                    style={{ padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '0.9rem', width: '100%' }}
                  >
                    <Globe size={16} /> 홈페이지 방문하기
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 페이징 컨트롤 */}
        {!error && !loading && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentPage === 1 ? 'rgba(0,0,0,0.05)' : 'var(--primary-blue)', color: currentPage === 1 ? '#94a3b8' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              이전
            </button>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: currentPage === totalPages ? 'rgba(0,0,0,0.05)' : 'var(--primary-blue)', color: currentPage === totalPages ? '#94a3b8' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
            >
              다음
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default SchoolAnalysis;
