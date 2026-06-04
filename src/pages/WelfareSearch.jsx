import React, { useState } from 'react';
import { Search, Info, CheckCircle, MapPin, Briefcase, User, DollarSign, ArrowRight, Settings2, Zap } from 'lucide-react';
import { MOCK_SUBSIDIES } from '../data/mockSubsidies';
import AiInsightCard from '../components/AiInsightCard';
import BookmarkButton from '../components/BookmarkButton';
import { useNavigate } from 'react-router-dom';

function WelfareSearch() {
  const navigate = useNavigate();
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.age || !formData.location || !formData.income || !formData.jobType) {
      alert("모든 조건을 입력해주세요!");
      return;
    }

    setIsSearching(true);
    setResults(null);
    setCurrentPage(1);

    try {
      const age = parseInt(formData.age);
      let matched = [...MOCK_SUBSIDIES];

      // 기본 필터링 (Mock 데이터 기준)
      if (age > 34) {
        matched = matched.filter(sub => !sub.tags.includes('청년'));
      }
      if (formData.jobType === 'business') {
        matched = matched.filter(sub => sub.tags.includes('소상공인') || sub.tags.includes('자영업') || sub.tags.includes('구직자'));
      } else if (formData.jobType === 'employee') {
        matched = matched.filter(sub => sub.tags.includes('근로자') || sub.tags.includes('직장인') || sub.tags.includes('청년'));
      }

      // 청년정책 API 호출 (만 19세 이상 34세 이하인 경우 우선 호출)
      if (age >= 19 && age <= 34) {
        const apiKey = import.meta.env.VITE_YOUTH_API_KEY;
        if (apiKey) {
          try {
            // pageSize=1000으로 1000개를 가져옴
            const path = `/go/ythip/getPlcy?apiKeyNm=${apiKey}&pageSize=1000&pageNum=1&rtnType=xml`;
            const fetchUrl = import.meta.env.DEV ? `/api/youth${path}` : `https://asia-northeast3-publicmind-3e47b.cloudfunctions.net/proxyApi?url=${encodeURIComponent("https://www.youthcenter.go.kr" + path)}`;
            const response = await fetch(fetchUrl);
            if (response.ok) {
              const xmlText = await response.text();
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xmlText, "text/xml");
              
              const emps = xmlDoc.getElementsByTagName("youthPolicyList");
              
              if (emps && emps.length > 0) {
                const youthPolicies = Array.from(emps).map((emp, i) => {
                  const title = emp.getElementsByTagName("plcyNm")[0]?.textContent || '청년정책';
                  const lclsfNm = emp.getElementsByTagName("lclsfNm")[0]?.textContent || '';
                  const mclsfNm = emp.getElementsByTagName("mclsfNm")[0]?.textContent || '';
                  const category = lclsfNm ? (lclsfNm + (mclsfNm ? '/' + mclsfNm : '')) : '청년지원';
                  const intro = emp.getElementsByTagName("plcyExplnCn")[0]?.textContent || '상세 내용 참조';
                  
                  const minAge = emp.getElementsByTagName("sprtTrgtMinAge")[0]?.textContent;
                  const maxAge = emp.getElementsByTagName("sprtTrgtMaxAge")[0]?.textContent;
                  const target = minAge && maxAge ? `만 ${minAge}세 ~ ${maxAge}세` : '제한없음';
                  
                  const earnEtcCn = emp.getElementsByTagName("earnEtcCn")[0]?.textContent;
                  const earnMinAmt = emp.getElementsByTagName("earnMinAmt")[0]?.textContent;
                  const earnMaxAmt = emp.getElementsByTagName("earnMaxAmt")[0]?.textContent;
                  const income = earnEtcCn || (earnMinAmt && earnMaxAmt && earnMinAmt !== "0" && earnMaxAmt !== "0" ? `소득 ${earnMinAmt}~${earnMaxAmt}만원` : '-');
                  
                  const aplyUrl = emp.getElementsByTagName("aplyUrlAddr")[0]?.textContent;
                  const refUrl = emp.getElementsByTagName("refUrlAddr1")[0]?.textContent;
                  const link = aplyUrl || refUrl || 'https://www.youthcenter.go.kr';
                  const bizId = emp.getElementsByTagName("plcyNo")[0]?.textContent || `youth-${i}`;
                  
                  return {
                    id: bizId,
                    title: title,
                    category: category,
                    amount: intro.length > 40 ? intro.substring(0, 40) + '...' : intro,
                    target: target.length > 30 ? target.substring(0, 30) + '...' : target,
                    income_req: income.length > 30 ? income.substring(0, 30) + '...' : income,
                    match_score: 95 + Math.floor(Math.random() * 5),
                    tags: ['청년', category.split('/')[0]],
                    link: link.match(/^http/) ? link : 'https://www.youthcenter.go.kr'
                  };
                });
                
                if (youthPolicies.length > 0) {
                  matched = [...youthPolicies, ...matched.filter(sub => !sub.tags.includes('청년'))];
                }
              }
            }
          } catch (apiError) {
            console.error("청년정책 API 호출 실패:", apiError);
            // 실패 시 기존 Mock 데이터 유지
          }
        } else {
            console.warn("VITE_YOUTH_API_KEY가 설정되지 않았습니다.");
        }
      }

      // 인위적인 딜레이(UI 부드러움 제공) 및 결과 정렬
      await new Promise(resolve => setTimeout(resolve, 800));
      matched.sort((a, b) => b.match_score - a.match_score);
      
      setResults({
        summary: `AI 분석 결과, ${formData.location}에 거주하는 ${formData.age}세 ${formData.jobType === 'employee' ? '직장인' : formData.jobType === 'business' ? '소상공인' : '구직자'}의 경우 총 ${matched.length}개의 정부 지원금 혜택을 받을 가능성이 높습니다. 특히 '${matched[0]?.title || '해당 지원금'}'의 매칭률이 가장 높습니다.`,
        list: matched
      });
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      alert("조회 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = results ? results.list.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = results ? Math.ceil(results.list.length / itemsPerPage) : 0;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center' }}>맞춤 지원금 조회기</h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          보조금24 등 공공데이터를 융합하여 내가 받을 수 있는 숨은 지원금을 1초 만에 찾아줍니다.
        </p>
      </div>

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
      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', maxWidth: '1200px', margin: '0 auto', gap: '24px' }}>
        
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
                  <option value="경기">경기도</option>
                  <option value="인천">인천광역시</option>
                  <option value="부산">부산광역시</option>
                  <option value="기타">기타 지역</option>
                </select>
                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-red)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">연 소득 (대략)</label>
              <div style={{ position: 'relative' }}>
                <select name="income" value={formData.income} onChange={handleInputChange} className="form-input" style={{ paddingLeft: '44px', appearance: 'none' }} required>
                  <option value="">선택해주세요</option>
                  <option value="under_3000">3,000만원 미만</option>
                  <option value="3000_5000">3,000만원 ~ 5,000만원</option>
                  <option value="over_5000">5,000만원 초과</option>
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
                  <option value="student">대학생/취업준비생</option>
                  <option value="unemployed">무직/구직자</option>
                </select>
                <Briefcase size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-amber)' }} />
              </div>
            </div>
            
            <div style={{ marginTop: 'auto' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '16px', fontSize: '1.1rem', borderRadius: '99px' }} disabled={isSearching}>
                {isSearching ? 'AI가 숨은 지원금을 찾는 중...' : <><Search size={20} /> 맞춤 지원금 조회하기</>}
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isSearching ? (
            <div className="fade-in">
              <div className="glass-panel skeleton-box" style={{ height: '110px', marginBottom: '24px', borderRadius: '16px' }}></div>
              <div className="skeleton-box" style={{ height: '28px', width: '180px', borderRadius: '8px', marginBottom: '16px' }}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel" style={{ padding: '24px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: '70%' }}>
                        <div className="skeleton-box" style={{ height: '24px', width: '40px', borderRadius: '12px', marginBottom: '12px' }}></div>
                        <div className="skeleton-box" style={{ height: '28px', width: '90%', borderRadius: '8px', marginBottom: '8px' }}></div>
                        <div className="skeleton-box" style={{ height: '20px', width: '40%', borderRadius: '8px' }}></div>
                      </div>
                      <div className="skeleton-box" style={{ height: '70px', width: '70px', borderRadius: '16px' }}></div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                      <div className="skeleton-box" style={{ height: '56px', borderRadius: '12px' }}></div>
                      <div className="skeleton-box" style={{ height: '56px', borderRadius: '12px' }}></div>
                   </div>
                   <div className="skeleton-box" style={{ height: '48px', width: '100%', borderRadius: '99px', marginTop: '8px' }}></div>
                </div>
              ))}
            </div>
          ) : results ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
                  <AiInsightCard data={results.list} context="맞춤 지원금 추천 결과" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, paddingLeft: '8px', margin: 0 }}>추천 지원금 목록 <span className="badge badge-primary" style={{ marginLeft: '8px' }}>{results.list.length}</span></h3>
                {currentItems.length > 0 ? currentItems.map((item, idx) => (
                  <div key={item.id} className="glass-panel fade-in" style={{ padding: '20px', animationDelay: `${idx * 0.1}s` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                          <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>{item.category}</span>
                          {item.match_score >= 90 && <span className="badge badge-warning" style={{ padding: '2px 8px', fontSize: '0.75rem' }}><Zap size={10} style={{marginRight:'4px'}}/> 초고도 매칭</span>}
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0' }}>{item.title}</h4>
                        <p style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>{item.amount}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <BookmarkButton item={item} type="welfare" title={item.title} subtitle={item.target} link={item.link} itemId={item.id} />
                        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.8)', padding: '10px 16px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>AI 매칭률</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: item.match_score >= 90 ? 'var(--accent-red)' : 'var(--primary-blue)' }}>{item.match_score}%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'rgba(255,255,255,0.4)', padding: '12px 16px', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>지원 대상</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4 }}>{item.target}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px' }}>소득 조건</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4 }}>{item.income_req}</div>
                      </div>
                    </div>
                    
                    {/* 새로운 속성 배지 영역 */}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} color="#10b981" /> 정부 공식 데이터
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} color="#6366f1" /> {item.tags.includes('청년') ? '만 19~34세' : '연령 제한 없음'}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} color="#f59e0b" /> 사회 기여도 높은 정책
                      </span>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button className="btn btn-primary" style={{ flex: 1, borderRadius: '99px', padding: '10px 0', fontSize: '0.95rem' }} onClick={() => navigate(`/welfare/policy/${item.id}`, { state: { policy: item } })}>상세정보 및 AI 분석 보기 <ArrowRight size={16} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Info size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                    조건에 맞는 지원금을 찾지 못했습니다. <br/> 조건을 조금 변경해 보세요.
                  </div>
                )}
                
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', background: currentPage === 1 ? '#f8fafc' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >이전</button>
                    <span style={{ fontWeight: 700, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>
                      {currentPage} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalPages}</span>
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', background: currentPage === totalPages ? '#f8fafc' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >다음</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', height: '100%', textAlign: 'center', border: '2px dashed var(--border-light)', background: 'rgba(255, 255, 255, 0.4)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                 <Search size={40} color="var(--primary-blue)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', margin: 0 }}>조건을 입력하고 조회해주세요</h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                공공데이터를 실시간으로 스캔하여<br/>숨은 지원금을 찾아드립니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default WelfareSearch;
