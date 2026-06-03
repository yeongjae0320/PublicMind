import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { X, Upload, FileText, CheckCircle, AlertCircle, Scan, Camera } from 'lucide-react';

function OcrScannerModal({ isOpen, onClose, policyName }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setScanning(false);
      setProgress(0);
      setScanResult(null);
      setParsedData(null);
    }
  }, [isOpen]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const generateMockDocument = () => {
    // 브라우저 캔버스를 이용해 가상의 "주민등록등본" 이미지를 생성합니다.
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // 배경 흰색
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 테두리
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // 텍스트 작성
    ctx.fillStyle = '#0f172a';
    
    // 제목
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('주민등록표(등본)', canvas.width / 2, 80);

    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('발급번호: 1234-5678-9012', 40, 140);
    ctx.fillText('세대주 성명: 홍길동', 40, 180);

    // 테이블 헤더
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 210, 520, 40);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('주소변동사항', 50, 238);

    ctx.font = '18px sans-serif';
    ctx.fillText('서울특별시 강남구 테헤란로 123', 50, 280);
    ctx.fillText('전입일: 2024년 01월 15일', 50, 310);

    // 테이블 헤더 2
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 350, 520, 40);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('세대원 정보', 50, 378);

    ctx.font = '18px sans-serif';
    ctx.fillText('홍길동 (세대주) - 1995년 05월 05일 출생', 50, 420);
    
    // 직인
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('강남구청장 (인)', 550, 700);
    
    // 원형 직인 표시
    ctx.beginPath();
    ctx.arc(500, 690, 30, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/png');
    setImageSrc(dataUrl);
  };

  const runOcr = async () => {
    if (!imageSrc) return;
    setScanning(true);
    setProgress(0);
    setScanResult(null);

    try {
      const result = await Tesseract.recognize(
        imageSrc,
        'kor', // 한국어 모델
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.floor(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      setScanResult(text);

      // Rule-based 검증 (프로토타입용 트릭)
      // 실제로는 LLM이나 정규식으로 복잡하게 파싱해야 하지만, 시연을 위해 특정 키워드를 찾습니다.
      const hasSeoul = text.includes('서울') || text.includes('서울특별시');
      const hasYouthYear = text.includes('1995') || text.includes('1990') || text.includes('2000');
      
      let isEligible = false;
      let matchReasons = [];

      if (hasSeoul) matchReasons.push('거주지 조건 충족 (서울시)');
      if (hasYouthYear) matchReasons.push('나이 조건 충족 (청년)');

      if (hasSeoul && hasYouthYear) {
        isEligible = true;
      }

      setParsedData({
        isEligible,
        matchReasons,
        rawText: text
      });

    } catch (err) {
      console.error("OCR Error", err);
      setScanResult("텍스트 인식 중 오류가 발생했습니다.");
    } finally {
      setScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)',
      zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px'
    }}>
      <div className="fade-in" style={{
        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '1000px',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ padding: '32px 48px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Scan size={26} color="var(--primary-blue)" /> 스마트 서류 검증
            </h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem' }}>
              '{policyName}' 지원 자격을 서류 한 장으로 즉시 확인합니다.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-bg">
            <X size={24} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left: Image Viewer & Controls */}
          <div style={{ flex: 1, padding: '48px', display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border-light)', overflowY: 'hidden' }}>
            
            {!imageSrc ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-color)', borderRadius: '16px', background: '#f8fafc', padding: '40px', textAlign: 'center' }}>
                <Camera size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0' }}>서류 이미지를 업로드하세요</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>주민등록등본, 건강보험료 납부확인서 등</p>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', width: '100%' }}>
                  <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'white', border: '1px solid var(--border-light)', padding: '0 24px', height: '80px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', color: 'var(--text-primary)', transition: 'all 0.2s', boxSizing: 'border-box' }}>
                    <Upload size={24} style={{ flexShrink: 0 }} /> 
                    <span style={{ textAlign: 'left', lineHeight: 1.4, whiteSpace: 'nowrap' }}>직접<br/>업로드</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
                  
                  <button onClick={generateMockDocument} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0 32px', height: '80px', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', transition: 'all 0.2s', boxSizing: 'border-box' }}>
                    <FileText size={24} style={{ flexShrink: 0 }} /> 
                    <span style={{ textAlign: 'left', lineHeight: 1.4, whiteSpace: 'nowrap' }}>테스트용 모의 등본<br/>(추천)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>스캔 대상 이미지</h3>
                  {!scanning && !parsedData && (
                    <button onClick={() => setImageSrc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>다시 선택</button>
                  )}
                </div>
                
                <div style={{ flex: 1, minHeight: 0, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={imageSrc} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  
                  {/* 스캐닝 애니메이션 효과 */}
                  {scanning && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,99,235,0.1)' }}></div>
                      <div style={{
                        position: 'absolute', left: 0, right: 0, height: '4px', background: 'var(--primary-blue)',
                        boxShadow: '0 0 15px 5px rgba(37,99,235,0.4)',
                        animation: 'scan-vertical 2s infinite ease-in-out'
                      }}></div>
                      <style>{`
                        @keyframes scan-vertical {
                          0% { top: 0%; }
                          50% { top: 100%; }
                          100% { top: 0%; }
                        }
                      `}</style>
                    </>
                  )}
                </div>

                {!parsedData && (
                  <button 
                    onClick={runOcr} 
                    disabled={scanning}
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                      background: scanning ? '#cbd5e1' : 'var(--primary-blue)', color: 'white',
                      fontSize: '1.1rem', fontWeight: 700, cursor: scanning ? 'wait' : 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexShrink: 0
                    }}
                  >
                    {scanning ? (
                      <>
                        <Scan size={20} className="spin-slow" /> 
                        문서 분석 중... {progress}%
                        <style>{`
                          .spin-slow { animation: spin-slow 3s linear infinite; }
                          @keyframes spin-slow { 100% { transform: rotate(360deg); } }
                        `}</style>
                      </>
                    ) : (
                      <>
                        <Scan size={20} /> AI 자동 자격 검증 시작
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div style={{ width: '400px', background: '#f8fafc', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, borderBottom: '2px solid var(--border-light)', paddingBottom: '16px', flexShrink: 0 }}>
              분석 결과
            </h3>

            {!parsedData ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
                <FileText size={48} style={{ marginBottom: '16px' }} />
                <p>문서를 스캔하면<br/>여기에 결과가 표시됩니다.</p>
              </div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px', flex: 1 }}>
                {/* 판정 결과 카드 */}
                <div style={{ 
                  background: parsedData.isEligible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  border: `1px solid ${parsedData.isEligible ? '#10b981' : '#ef4444'}`,
                  padding: '20px 16px', borderRadius: '16px', textAlign: 'center', flexShrink: 0
                }}>
                  {parsedData.isEligible ? (
                    <>
                      <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', color: '#047857', fontSize: '1.2rem', fontWeight: 800 }}>지원 가능합니다!</h4>
                      <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem', lineHeight: 1.3 }}>문서 내용이 지원 자격과 일치합니다.</p>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 8px' }} />
                      <h4 style={{ margin: '0 0 4px 0', color: '#b91c1c', fontSize: '1.2rem', fontWeight: 800 }}>지원 대상이 아님</h4>
                      <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.3 }}>요건을 충족하지 않는 항목이 있습니다.</p>
                    </>
                  )}
                </div>

                {/* 인식된 자격 요건 */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>확인된 자격 요건</h4>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {parsedData.matchReasons.map((reason, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={16} color="#10b981" /> {reason}
                      </li>
                    ))}
                    {parsedData.matchReasons.length === 0 && (
                      <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>조건에 맞는 항목을 찾지 못했습니다.</li>
                    )}
                  </ul>
                </div>

                {/* Raw Text (개발자용/확인용) */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>추출된 원본 텍스트</h4>
                  <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {parsedData.rawText}
                  </div>
                </div>
                
                </div> {/* End scrollable area */}

                <button 
                  onClick={onClose}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', fontWeight: 700, cursor: 'pointer', flexShrink: 0, color: 'var(--text-primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OcrScannerModal;
