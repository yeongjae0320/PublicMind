import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function AiInsightCard({ data, context, systemPrompt }) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const defaultPrompt = `당신은 ${context} 전문가입니다. 다음 제공되는 JSON 데이터를 분석하여 핵심만 3줄로 요약된 사용자 맞춤형 브리핑을 제공하세요. 
  - 말투는 친절하고 전문적인 비서처럼 하세요.
  - 현재 보고 있는 화면(위치, 데이터 갯수, 주요 특징)에 대한 통찰을 제공하세요.
  - 마크다운 리스트(- ) 형태로 간결하게 응답하세요.`;

  useEffect(() => {
    // 로그인이 안 되어있으면 API 호출 무시
    if (!currentUser) return;

    // data가 비어있거나 유효하지 않으면 요청 무시
    if (!data || (Array.isArray(data) && data.length === 0) || Object.keys(data).length === 0 || data === '[]') {
      setInsight('');
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 4초 디바운싱
    debounceRef.current = setTimeout(async () => {
      try {
        const openai = new OpenAI({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true,
        });

        // 데이터가 너무 클 수 있으므로 적절히 슬라이싱 (최대 10개)
        const summaryData = Array.isArray(data) ? data.slice(0, 10) : data;
        const dataString = typeof summaryData === 'string' ? summaryData : JSON.stringify(summaryData, null, 2);

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt || defaultPrompt },
            { role: 'user', content: `[현재 ${context} 데이터 (최대 10개 표시)]\n${dataString}` }
          ],
          temperature: 0.7,
        });

        setInsight(response.choices[0].message.content);
      } catch (error) {
        console.error("AiInsightCard Error:", error);
        setInsight("- AI 분석 중 오류가 발생했습니다.\n- 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }, 4000); 

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data, context, systemPrompt]);

  if (!currentUser) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 1)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center'
      }}>
        <div style={{ padding: '12px', color: '#94a3b8' }}>
          <Lock size={28} />
        </div>
        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>AI 인사이트 잠금</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          PublicMind 회원이 되시면 AI가 데이터를 분석하여<br/>맞춤형 핵심 브리핑을 제공해 드립니다.
        </p>
        <button 
          onClick={() => navigate('/login')}
          style={{
            marginTop: '8px',
            padding: '8px 24px',
            background: 'var(--primary-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          무료로 가입하고 혜택 받기
        </button>
      </div>
    );
  }

  if (!insight && !loading) return null;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 1)',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', fontWeight: 800 }}>
        <Sparkles size={18} className={loading ? 'pulse' : ''} />
        <span>AI 인사이트 브리핑</span>
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0', animation: 'fadeIn 0.5s ease' }}>
          <style>{`
            @keyframes ai-shimmer {
              0% { background-position: -200px 0; }
              100% { background-position: calc(200px + 100%) 0; }
            }
            .ai-skeleton {
              background-color: #f1f5f9;
              background-image: linear-gradient(90deg, #f1f5f9 0px, #e2e8f0 40px, #f1f5f9 80px);
              background-size: 200px 100%;
              background-repeat: no-repeat;
              animation: ai-shimmer 1.5s infinite linear;
              border-radius: 6px;
            }
          `}</style>
          <div className="ai-skeleton" style={{ height: '18px', width: '100%' }}></div>
          <div className="ai-skeleton" style={{ height: '18px', width: '85%' }}></div>
          <div className="ai-skeleton" style={{ height: '18px', width: '60%' }}></div>
        </div>
      ) : (
        <div className="markdown-body custom-ai-list" style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, animation: 'fadeIn 0.5s ease' }}>
          <style>{`
            .custom-ai-list ul {
              list-style-type: none;
              padding-left: 0;
              margin: 0;
            }
            .custom-ai-list li {
              margin-bottom: 8px;
            }
          `}</style>
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default AiInsightCard;
