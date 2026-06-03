import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Send, Bot, User, Zap, Building, Plane, DollarSign, Car, Heart, Tent, Wind, Mic } from 'lucide-react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import { MOCK_SUBSIDIES } from '../data/mockSubsidies';
import { MOCK_NEIGHBORHOODS } from '../data/mockRealEstate';
import { AI_TOOLS, executeAiTool } from '../services/aiTools';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

// 비용 절감형 요약 데이터 구성
const SYSTEM_PROMPT = `당신은 'PublicMind 통합 AI 어시스턴트'입니다. 
공공데이터 기반으로 사용자 질문에 정확하고 친절하게 답변하세요.
아래는 현재 시스템에 연동된 핵심 데이터 요약본입니다. 질문 시 반드시 참고하세요.

[복지/지원금 데이터]
${MOCK_SUBSIDIES.map(s => `- ${s.title}: 대상(${s.target}), 소득요건(${s.income_req}), 혜택(${s.amount})`).join('\n')}

[부동산 입지 데이터]
${MOCK_NEIGHBORHOODS.map(n => `- ${n.name}: 시세(${n.rent}), 특징(${n.summary})`).join('\n')}

[해외 안전 여행]
해외 국가의 여행경보나 치안을 물어보면, "현재 전 세계의 실시간 재난/안전 경보는 '글로벌 재난/안전 대시보드' 탭에서 실시간 지도로 확인하실 수 있습니다."라고 안내해 주세요.

[신규 확장 5대 공공데이터 안내 가이드]
사용자가 아래 5개 분야에 대해 질문할 경우, 현재는 직접 대답하는 대신 **해당 탭(메뉴)으로 이동하여 상세한 정보를 확인하시라**고 친절하게 유도하세요:
1. 보건/의료 (심야약국, 병원등급 등): "상단 메뉴의 **[보건/의료]** 탭에서 확인하세요."
2. 교통/주차 (빈 주차장, 지하철 혼잡도 등): "상단 메뉴의 **[교통/주차]** 탭에서 확인하세요."
3. 환경/안전 (미세먼지, 대피소 등): "상단 메뉴의 **[환경/안전]** 탭에서 확인하세요."
4. 교육/보육 (어린이집 대기, 학군 등): "상단 메뉴의 **[교육/보육]** 탭에서 확인하세요."
5. 문화/여가 (무료 축제, 캠핑장 등): "상단 메뉴의 **[문화/여가]** 탭에서 확인하세요."

[답변 가이드]
- 마크다운(Markdown)을 적극 사용하여 가독성 있게 답변하세요. (표, 굵은 글씨, 리스트 등)
- 데이터에 없는 내용을 지어내지 말고, 데이터에 기반해서만 답변하세요.`;

function AiAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! PublicMind 통합 AI 어시스턴트입니다. 복지, 부동산, 교통, 안전, 환경, 보건, 문화 등 다양한 공공데이터에 대해 자유롭게 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toolStatus, setToolStatus] = useState('');
  const chatContainerRef = useRef(null);

  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
    onResult: (text, isFinal) => {
      setInput(text);
    }
  });

  // Initialize OpenAI (Browser mode)
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true 
  });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSend = async (e, quickActionText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickActionText || input.trim();
    if (!textToSend) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // API 호출 전, 메시지 포맷팅 (시스템 프롬프트 추가)
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      // 1. 첫 번째 API 호출 (Tools 포함, non-streaming)
      let response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        tools: AI_TOOLS,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;

      // 2. 도구(Tool) 호출이 필요한 경우
      if (responseMessage.tool_calls) {
        setToolStatus('API 데이터를 수집 중입니다...');
        apiMessages.push(responseMessage); // AI의 tool_call 메시지 추가
        
        for (const toolCall of responseMessage.tool_calls) {
          const toolResult = await executeAiTool(toolCall);
          apiMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
        
        setToolStatus(''); // 수집 완료

        // 3. 도구 실행 결과를 바탕으로 두 번째 API 호출 (streaming)
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          stream: true,
        });

        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        setIsTyping(false);

        let fullContent = '';
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullContent += content;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].content = fullContent;
            return updated;
          });
        }
      } else {
        // 도구 호출이 필요 없는 일반 답변인 경우 (이미 받은 응답 사용)
        setMessages(prev => [...prev, { role: 'assistant', content: responseMessage.content }]);
        setIsTyping(false);
      }
      
    } catch (error) {
      console.error("OpenAI Error:", error);
      setIsTyping(false);
      setToolStatus('');
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. AI 응답 중 오류가 발생했습니다. API 키나 네트워크 상태를 확인해주세요.' }]);
    }
  };

  const quickActions = [
    { icon: <DollarSign size={16}/>, label: "지원금 찾기", text: "20대 직장인이 받을 수 있는 지원금 혜택을 모두 정리해줘." },
    { icon: <Building size={16}/>, label: "안전한 동네 찾기", text: "보증금 5천만원으로 갈 수 있는 치안 좋은 동네 추천해줘." },
    { icon: <Car size={16}/>, label: "주차장 찾기", text: "내 주변 공영주차장 실시간 빈자리 정보 알려줘." },
    { icon: <Heart size={16}/>, label: "심야약국 검색", text: "밤 10시 이후에 문을 여는 심야 공공약국 찾아줘." },
    { icon: <Tent size={16}/>, label: "주말 무료 축제", text: "이번 주말에 열리는 무료 문화 축제 추천해줘." },
    { icon: <Wind size={16}/>, label: "미세먼지 확인", text: "오늘 서울 지역 대기질 미세먼지 상태 어때?" },
  ];

  if (!currentUser) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', transform: 'translateY(-40px)' }}>
          <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#94a3b8' }}>
            <Bot size={40} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            통합 AI 어시스턴트
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '32px' }}>
            10여 개 공공데이터를 융합하여 당신의 질문에 답변해 드리는 <b>AI 비서 기능은 PublicMind 회원 전용 혜택</b>입니다.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '99px', width: '100%', justifyContent: 'center' }}
          >
            무료 회원가입하고 AI 비서 이용하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 128px)', minHeight: '500px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center', position: 'relative' }}>
        <h1 className="page-title text-gradient" style={{ fontSize: '2.5rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
          통합 AI 어시스턴트
        </h1>
        <p className="page-subtitle" style={{ fontSize: '1.1rem', margin: '0 auto', maxWidth: '800px' }}>
          복지, 부동산, 교통, 안전, 환경, 보건, 문화 등 10여 개 공공 분야의 맞춤 정보를 자유롭게 물어보세요.
        </p>
      </div>

      <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat History */}
        <div ref={chatContainerRef} className="panel-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: '#f8fafc', scrollBehavior: 'smooth' }}>
          
          {/* Quick Actions (초기 화면에만 표시) */}
          {messages.length === 1 && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
              {quickActions.map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSend(null, action.text)}
                  className="btn btn-outline fade-in" 
                  style={{ animationDelay: `${idx * 0.1}s`, background: 'white', borderRadius: '99px', fontSize: '0.9rem' }}
                >
                  <span style={{ color: 'var(--primary-blue)' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className="fade-in" style={{ display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--primary-navy)' : 'var(--primary-blue)', color: 'white'
              }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div style={{ 
                maxWidth: '80%', padding: '16px 20px', borderRadius: '16px', lineHeight: 1.6,
                background: msg.role === 'user' ? 'white' : 'rgba(37, 99, 235, 0.05)',
                border: msg.role === 'user' ? '1px solid var(--border-color)' : '1px solid rgba(37, 99, 235, 0.2)',
                color: 'var(--text-primary)', borderTopRightRadius: msg.role === 'user' ? '4px' : '16px', borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-body" style={{ fontSize: '0.95rem' }}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{msg.content}</div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
              {toolStatus && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(37,99,235,0.1)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content', alignSelf: 'flex-start' }}>
                  <Zap size={14} className="pulse" /> {toolStatus}
                </div>
              )}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} />
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate' }}></div>
                  <div style={{ width: 8, height: 8, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate 0.3s' }}></div>
                  <div style={{ width: 8, height: 8, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'fadeIn 1s infinite alternate 0.6s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
          <form onSubmit={(e) => handleSend(e)} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? "말씀해 주시면 텍스트로 변환됩니다..." : "예: 28세 프리랜서가 받을 수 있는 서울시 지원금 다 찾아줘."}
              style={{
                flex: 1, padding: '16px 24px', paddingRight: '110px',
                border: '1px solid var(--border-color)', borderRadius: '99px',
                fontSize: '1rem', outline: 'none', boxShadow: 'var(--shadow-sm)',
                transition: 'border-color var(--transition-fast)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            
            {/* Voice Input Button */}
            {isSupported && (
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening()}
                style={{
                  position: 'absolute', right: '56px', top: '50%', transform: 'translateY(-50%)',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: isListening ? '#ef4444' : '#f1f5f9',
                  color: isListening ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition-fast)', cursor: 'pointer',
                  border: 'none'
                }}
                title="음성으로 입력하기"
              >
                <Mic size={20} style={isListening ? { animation: 'pulse 1.5s infinite' } : {}} />
              </button>
            )}

            <button 
              type="submit" 
              style={{ 
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                width: '40px', height: '40px', borderRadius: '50%', 
                background: input.trim() && !isTyping ? 'var(--primary-blue)' : '#e2e8f0', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition-fast)', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                border: 'none'
              }}
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            OpenAI <b>gpt-4o-mini</b> 모델과 연동되어 있습니다. 중요한 결정 전에는 원본 공공데이터를 직접 확인하세요.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAssistant;
