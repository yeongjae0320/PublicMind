import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, X, Loader2, ArrowRight } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';

function VoiceNavigatorModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');

  // Initialize OpenAI (Browser mode)
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true 
  });

  const handleResult = (transcript, isFinal) => {
    setFinalTranscript(transcript);
    
    // Auto-process when speech is final (i.e. user paused/stopped speaking)
    if (isFinal && transcript.trim().length > 0) {
      processIntent(transcript);
    }
  };

  const handleEnd = () => {
    // If it stopped and we have text but haven't processed yet
    if (finalTranscript.trim().length > 0 && !isProcessing) {
      processIntent(finalTranscript);
    }
  };

  const { isListening, transcript, startListening, stopListening, error, isSupported } = useSpeechRecognition({
    onResult: handleResult,
    onEnd: handleEnd,
    continuous: false
  });

  useEffect(() => {
    if (isOpen) {
      setFinalTranscript('');
      setIsProcessing(false);
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen, startListening, stopListening]);

  const processIntent = async (text) => {
    setIsProcessing(true);
    stopListening();
    
    try {
      // 딥러닝 기반 의도 파악 (OpenAI API 호출)
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are an intent router for a public data app. Analyze the user's input and return EXACTLY ONE of the following paths that best matches their intent, with NO other text or explanation:
- /welfare (지원금, 복지, 돈, 보조금, 혜택, 청년 수당 등)
- /real-estate (부동산, 집, 이사, 월세, 전세, 아파트, 상권 등)
- /travel-safety (여행, 비행기, 해외, 치안, 여권, 경보 등)
- /health (건강, 병원, 약국, 질병, 응급실, 의료 등)
- /traffic (교통, 차, 도로, 주차장, cctv, 막히는지 등)
- /environment (미세먼지, 날씨, 환경, 대피소, 재난, 공기 등)
- /education (교육, 학교, 어린이집, 보육, 학군, 유치원 등)
- /culture (문화, 축제, 캠핑장, 공연, 여가, 여행지 등)
- /ai-assistant (기타 애매한 질문이나 위 카테고리에 명확히 속하지 않는 복합 질문)` 
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1, // 창의성보다는 정확도 우선
        max_tokens: 20,
      });

      const targetPath = response.choices[0].message.content.trim();
      
      // 혹시라도 이상한 문자열이 반환되었을 경우를 대비한 안전 장치
      const validPaths = ['/welfare', '/real-estate', '/travel-safety', '/health', '/traffic', '/environment', '/education', '/culture', '/ai-assistant'];
      const finalRoute = validPaths.includes(targetPath) ? targetPath : '/ai-assistant';

      onClose();
      navigate(finalRoute);
    } catch (err) {
      console.error('Intent parsing error:', err);
      // 에러 발생 시 기본 채팅방으로 폴백
      onClose();
      navigate('/ai-assistant');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: '24px', 
          right: '24px', 
          cursor: 'pointer', 
          padding: '12px', 
          color: 'rgba(255,255,255,0.7)',
          transition: 'color 0.2s ease'
        }} 
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        onClick={onClose}
      >
        <X size={32} />
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', width: '90%' }}>
        
        {/* Glow effect for Mic */}
        <div style={{ 
          position: 'relative', 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: isListening ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '40px',
          boxShadow: isListening ? '0 0 60px rgba(99, 102, 241, 0.6)' : 'none',
          transition: 'all 0.3s ease'
        }}>
          {isListening && (
            <>
              <div className="wave-ring" style={{ position: 'absolute', inset: 0, border: '2px solid rgba(99, 102, 241, 0.8)', borderRadius: '50%', animation: 'ripple 1.5s infinite linear' }}></div>
              <div className="wave-ring" style={{ position: 'absolute', inset: 0, border: '2px solid rgba(99, 102, 241, 0.5)', borderRadius: '50%', animation: 'ripple 1.5s infinite linear 0.75s' }}></div>
            </>
          )}
          {isProcessing ? (
            <Loader2 size={48} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Mic size={48} color={isListening ? '#818cf8' : 'rgba(255,255,255,0.5)'} />
          )}
        </div>

        <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, marginBottom: '16px', lineHeight: 1.4 }}>
          {isProcessing ? "AI가 의미를 파악하는 중입니다..." : (transcript || "어떤 서비스가 필요하신가요?")}
        </h2>
        
        {!isProcessing && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }}>
            예: "강남구 청년 지원금 찾아줘", "요즘 전세 사기 피하는 법 알려줘"
          </p>
        )}

        {error === 'not_supported' && (
          <p style={{ color: '#ef4444', marginTop: '24px' }}>현재 브라우저에서는 음성 인식을 지원하지 않습니다.</p>
        )}

        <style>{`
          @keyframes ripple {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}

export default VoiceNavigatorModal;
