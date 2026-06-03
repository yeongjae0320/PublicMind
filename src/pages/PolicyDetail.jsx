import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Zap, ChevronLeft, Calendar, FileText, CheckCircle, ArrowRight, MousePointerClick, Heart, ExternalLink, MessageCircle, Scan } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import { MOCK_SUBSIDIES } from '../data/mockSubsidies';
import OcrScannerModal from '../components/OcrScannerModal';

function PolicyDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(location.state?.policy || null);
  const [isOcrOpen, setIsOcrOpen] = useState(false);

  useEffect(() => {
    // If user accessed directly via URL without state, fetch from mock
    if (!policy) {
      const found = MOCK_SUBSIDIES.find(p => p.id === id);
      if (found) {
        setPolicy(found);
      } else {
        // Mock fallback for dynamically generated IDs (like from the API)
        setPolicy({
          id,
          title: '상세 정부 지원 정책',
          category: '맞춤 지원금',
          amount: '상세 페이지에서 확인 가능합니다.',
          target: '대한민국 국민',
          income_req: '해당 기관 공지 참조',
          match_score: 98,
          tags: ['청년', '정부지원'],
          link: 'https://www.gov.kr'
        });
      }
    }
  }, [id, policy]);

  if (!policy) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>정책을 찾을 수 없습니다.</div>;
  }

  // Generate random stats for the prototype
  const socialImpactScore = policy.tags.includes('청년') ? 85 : 92;
  const impactLabel = policy.tags.includes('청년') ? '청년 주거/자립 안정 기여' : '국민 생활 필수 안정 기여';

  return (
    <div className="fade-in" style={{ paddingBottom: '120px', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      
      {/* Background Decor */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', borderRadius: '50%', zIndex: -1 }}></div>
      <div style={{ position: 'absolute', top: '20%', right: '-20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)', borderRadius: '50%', zIndex: -1 }}></div>

      {/* Top Nav */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => navigate(-1)}>
        <ChevronLeft size={24} />
        <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>목록으로 돌아가기</span>
      </div>

      {/* Hero Section */}
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{policy.category}</span>
              {policy.match_score >= 90 && <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#d97706', border: 'none' }}><Zap size={12} style={{marginRight: '4px'}}/> AI 초고도 매칭</span>}
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: '0 0 16px 0', lineHeight: 1.3, color: '#1e293b', wordBreak: 'keep-all' }}>{policy.title}</h1>
            <p style={{ fontSize: '1.3rem', color: 'var(--primary-blue)', fontWeight: 700, margin: 0 }}>{policy.amount}</p>
          </div>
          <div>
            <BookmarkButton item={policy} type="welfare" title={policy.title} subtitle={policy.target} link={policy.link} itemId={policy.id} />
          </div>
        </div>

        {/* AI Summary Box */}
        <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(217, 70, 239, 0.1))', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={20} color="var(--primary-blue)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>PublicMind AI 핵심 요약</h3>
          </div>
          <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: 1.6, color: '#334155', fontWeight: 500, wordBreak: 'keep-all' }}>
            이 정책은 <strong>{policy.target}</strong>을 대상으로 하며, 소득 요건은 <strong>{policy.income_req}</strong>입니다. 사용자님의 현재 상황과 <strong>{policy.match_score}% 매칭</strong>되어 당장 신청하시면 혜택을 받을 가능성이 매우 높습니다. 복잡한 서류 없이 온라인으로 바로 신청 가능한 것이 특징입니다.
          </p>
        </div>
      </div>

      {/* Attributes Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '24px' }}>
        
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <ShieldCheck size={28} color="#10b981" />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>데이터 신뢰도</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>정부 공식 인증 100%</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <User size={28} color="#6366f1" />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>타겟 연령층</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{policy.tags.includes('청년') ? '만 19세 ~ 34세 청년' : '전 연령 (제한 없음)'}</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Heart size={28} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>사회적 기여도</div>
          <div style={{ width: '100%', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
              <span>{impactLabel}</span>
              <span style={{ color: '#f59e0b' }}>{socialImpactScore}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#fef3c7', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${socialImpactScore}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', borderRadius: '99px' }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* Details Tabs / Content */}
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px', marginTop: '24px' }}>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle color="var(--primary-blue)" /> 상세 지원 내용
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ width: '120px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>지원 대상</div>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#1e293b', fontWeight: 500 }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>{policy.target}</li>
                <li>{policy.income_req}</li>
              </ul>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)' }}></div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ width: '120px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>지원 규모</div>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#1e293b', fontWeight: 500 }}>
              {policy.amount}
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border-light)' }}></div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ width: '120px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>신청 절차</div>
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#1e293b', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-blue)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>1</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>자격 확인</span>
                </div>
                <div style={{ flex: 1, height: '2px', background: '#e2e8f0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-blue)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>2</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>서류 접수</span>
                </div>
                <div style={{ flex: 1, height: '2px', background: '#e2e8f0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary-blue)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>3</div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>심사/지급</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Action Bar (Normal flow, not fixed) */}
      <div className="glass-panel" style={{ 
        marginTop: '24px',
        padding: '32px', 
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8))',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 10px 30px rgba(37, 99, 235, 0.05)'
      }}>
        <div>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>놓치지 말고 혜택을 받아보세요</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>온라인 즉시 신청 가능</div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            className="btn hover-card" 
            style={{ padding: '16px 24px', fontSize: '1.1rem', borderRadius: '16px', background: 'var(--primary-blue)', color: 'white', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}
            onClick={() => setIsOcrOpen(true)}
          >
            <Scan size={24} /> 내 서류 스캔해서 1초 자격 확인
          </button>

          <button 
            className="btn" 
            style={{ padding: '16px 24px', fontSize: '1.1rem', borderRadius: '16px', background: '#1e293b', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => window.open(policy.link, '_blank')}
          >
            신청 페이지로 이동 <ExternalLink size={20} />
          </button>
        </div>
      </div>

      <OcrScannerModal 
        isOpen={isOcrOpen} 
        onClose={() => setIsOcrOpen(false)} 
        policyName={policy.title} 
      />
    </div>
  );
}

export default PolicyDetail;
