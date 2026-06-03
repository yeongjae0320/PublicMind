import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Info, CheckCircle, MapPin, Briefcase, User, DollarSign, ArrowRight, Settings2, Zap } from 'lucide-react';
import { MOCK_SUBSIDIES } from '../data/mockSubsidies';

function Welfare() {
  const [formData, setFormData] = useState({
    age: '',
    location: '',
    income: '',
    jobType: ''
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!formData.age || !formData.location || !formData.income || !formData.jobType) {
      alert("모든 조건을 입력해주세요!");
      return;
    }

    setIsSearching(true);
    setResults(null);
    setCurrentPage(1);
    
    // Simulate AI / API Delay
    setTimeout(() => {
      // Mock LLM matching logic based on inputs
      let matched = [...MOCK_SUBSIDIES];
      
      const age = parseInt(formData.age);
      if (age > 34) {
        matched = matched.filter(sub => !sub.tags.includes('청년'));
      }
      
      if (formData.jobType === 'business') {
        matched = matched.filter(sub => sub.tags.includes('소상공인') || sub.tags.includes('자영업') || sub.tags.includes('구직자'));
      } else if (formData.jobType === 'employee') {
        matched = matched.filter(sub => sub.tags.includes('근로자') || sub.tags.includes('직장인') || sub.tags.includes('청년'));
      }

      // Sort by match score
      matched.sort((a, b) => b.match_score - a.match_score);
      
      setResults({
        summary: `AI 분석 결과, ${formData.location}에 거주하는 ${formData.age}세 ${formData.jobType === 'employee' ? '직장인' : formData.jobType === 'business' ? '소상공인' : '구직자'}의 경우 총 ${matched.length}개의 정부 지원금 혜택을 받을 가능성이 높습니다. 특히 '${matched[0]?.title || '해당 지원금'}'의 매칭률이 가장 높습니다.`,
        list: matched
      });
      
      setIsSearching(false);
    }, 2000);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = results ? results.list.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = results ? Math.ceil(results.list.length / itemsPerPage) : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>복지/지원금 조회기</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          보조금24 등 공공데이터를 융합하여 내가 받을 수 있는 숨은 지원금을 1초 만에 찾아줍니다.
        </p>
      </div>

      <div className="responsive-grid-1-15" style={{ gap: '24px', maxWidth: '1200px', margin: '0 auto', transition: 'max-width 0.5s ease-in-out' }}>
        
        {/* Input Form Panel */}
        <div className="glass-panel" style={{ padding: '32px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Settings2 color="var(--primary-blue)" size={28} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>나의 조건 입력</h2>
          </div>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">만 나이</label>
              <div style={{ position: 'relative' }}>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="form-input" placeholder="예: 28" style={{ paddingLeft: '44px' }} required />
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-blue)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">거주 지역</label>
              <div style={{ position: 'relative' }}>
                <select name="location" value={formData.location} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', appearance: 'none' }} required>
                  <option value="">선택해주세요</option>
                  <option value="서울">서울특별시</option>
                  <option value="부산">부산광역시</option>
                  <option value="대구">대구광역시</option>
                  <option value="인천">인천광역시</option>
                  <option value="광주">광주광역시</option>
                  <option value="대전">대전광역시</option>
                  <option value="울산">울산광역시</option>
                  <option value="세종">세종특별자치시</option>
                  <option value="경기">경기도</option>
                  <option value="강원">강원특별자치도</option>
                  <option value="충북">충청북도</option>
                  <option value="충남">충청남도</option>
                  <option value="전북">전북특별자치도</option>
                  <option value="전남">전라남도</option>
                  <option value="경북">경상북도</option>
                  <option value="경남">경상남도</option>
                  <option value="제주">제주특별자치도</option>
                </select>
                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-red)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">연 소득 (대략)</label>
              <div style={{ position: 'relative' }}>
                <select name="income" value={formData.income} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', appearance: 'none' }} required>
                  <option value="">선택해주세요</option>
                  <option value="under_2000">2,000만원 미만</option>
                  <option value="2000_3000">2,000만원 ~ 3,000만원</option>
                  <option value="3000_4000">3,000만원 ~ 4,000만원</option>
                  <option value="4000_5000">4,000만원 ~ 5,000만원</option>
                  <option value="5000_6000">5,000만원 ~ 6,000만원</option>
                  <option value="6000_8000">6,000만원 ~ 8,000만원</option>
                  <option value="over_8000">8,000만원 초과</option>
                </select>
                <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-green)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">직업 형태</label>
              <div style={{ position: 'relative' }}>
                <select name="jobType" value={formData.jobType} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', appearance: 'none' }} required>
                  <option value="">선택해주세요</option>
                  <option value="employee">근로자/직장인</option>
                  <option value="business">자영업/소상공인</option>
                  <option value="freelancer">프리랜서</option>
                  <option value="student">대학생/취업준비생</option>
                  <option value="parttime">시간제/아르바이트</option>
                  <option value="housewife">전업주부</option>
                  <option value="unemployed">무직/구직자</option>
                </select>
                <Briefcase size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-amber)' }} />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', padding: '16px', fontSize: '1.1rem', borderRadius: '99px' }} disabled={isSearching}>
              {isSearching ? 'AI가 숨은 지원금을 찾는 중...' : <><Search size={20} /> 맞춤 지원금 조회하기</>}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        {isSearching ? (
          <div className="fade-in-stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton-box" style={{ height: '220px', borderRadius: '24px' }}></div>
            <div className="skeleton-box" style={{ height: '240px', borderRadius: '24px' }}></div>
            <div className="skeleton-box" style={{ height: '240px', borderRadius: '24px' }}></div>
          </div>
        ) : results ? (
          <div className="fade-in-stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* AI Summary Box */}
            <div style={{ 
              padding: '32px', 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.5))', 
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background glow */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)', padding: '10px', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' }}>
                    <Zap size={22} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #4f46e5, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI 맞춤 요약</h3>
              </div>
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#334155', margin: 0, fontWeight: 500, position: 'relative', zIndex: 1, letterSpacing: '-0.3px' }}>
                {results.summary}
              </p>
            </div>

            {/* Subsidy List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, paddingLeft: '8px' }}>추천 지원금 목록 <span className="badge badge-primary" style={{ marginLeft: '8px' }}>{results.list.length}</span></h3>
              
              {currentItems.length > 0 ? currentItems.map((item, idx) => (
                <div key={item.id} className="glass-panel fade-in" style={{ padding: '24px', animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span className="badge badge-success">{item.category}</span>
                        {item.match_score >= 90 && <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.75rem' }}><Zap size={10} style={{marginRight:'4px'}}/> 초고도 매칭</span>}
                      </div>
                      <h4 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h4>
                      <p style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '1.1rem' }}>{item.amount}</p>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '12px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AI 매칭률</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.match_score >= 90 ? 'var(--accent-red)' : 'var(--primary-blue)' }}>{item.match_score}%</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'rgba(255,255,255,0.4)', padding: '16px', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>지원 대상</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.target}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>소득 조건</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.income_req}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => alert(`'${item.title}' 신청 페이지로 이동합니다. (데모)`)}>신청 바로가기 <ArrowRight size={16} /></button>
                    <button className="btn btn-outline" style={{ flex: 1 }}>관심 목록에 저장</button>
                  </div>
                </div>
              )) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Info size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                  조건에 맞는 지원금을 찾지 못했습니다. <br/> 조건을 조금 변경해 보세요.
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}
                  >
                    이전
                  </button>
                  <span style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>
                    {currentPage} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalPages}</span>
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)' }}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', height: '100%', minHeight: '600px', textAlign: 'center', border: '2px dashed var(--border-light)', background: 'rgba(255, 255, 255, 0.4)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
               <Search size={40} color="var(--primary-blue)" />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>조건을 입력하고 조회해주세요</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              보조금24 등 공공데이터를 실시간으로 스캔하여<br/>숨은 지원금을 즉시 찾아드립니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Welfare;
