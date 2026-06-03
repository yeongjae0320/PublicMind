import React, { useState, useEffect } from 'react';
import { Globe, Lock, Mail, ArrowRight, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { loginWithKakao, loginWithNaverToken } = useAuth();

  useEffect(() => {
    // 1. 팝업창 자신(자식)일 경우: URL에 access_token이 있으면 부모창으로 전송하고 창 닫기
    if (window.location.hash.includes('access_token')) {
      const hash = window.location.hash.substring(1);
      if (window.opener) {
        window.opener.postMessage({ type: 'NAVER_LOGIN_SUCCESS', payload: hash }, window.location.origin);
        window.close();
      }
    }

    // 2. 부모창일 경우: 자식 팝업이 보내는 메시지 수신
    const handleMessage = async (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data && e.data.type === 'NAVER_LOGIN_SUCCESS') {
        const hash = e.data.payload;
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        if (accessToken) {
          try {
            await loginWithNaverToken(accessToken);
            navigate('/');
          } catch (err) {
            setErrorMsg(`네이버 로그인 에러: ${err.message}`);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginWithNaverToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('유효한 이메일 주소를 입력해 주세요.');
      return;
    }

    if (!isLogin) {
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setErrorMsg('비밀번호는 영문, 숫자를 포함하여 8자 이상이어야 합니다.');
        return;
      }
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
      }
      navigate('/');
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error("Google Auth error:", error);
      setErrorMsg(error.message);
    }
  };

  const handleNaverLogin = () => {
    setErrorMsg('');
    const clientId = '2KpweAjgv3KPE9wPy476';
    const callbackUrl = encodeURIComponent(window.location.origin + '/login');
    const url = `https://nid.naver.com/oauth2.0/authorize?response_type=token&client_id=${clientId}&redirect_uri=${callbackUrl}&state=test`;
    window.open(url, 'naverloginpop', 'titlebar=1, resizable=1, scrollbars=yes, width=600, height=550');
  };

  const handleKakaoLogin = async () => {
    setErrorMsg('');
    try {
      await loginWithKakao();
      navigate('/');
    } catch (error) {
      console.error("Kakao login failed:", error);
      setErrorMsg(`카카오 로그인 에러: ${error.message || JSON.stringify(error)}`);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email) {
      setErrorMsg('비밀번호를 재설정할 이메일 주소를 입력칸에 먼저 적어주세요.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      // 성공 시 에러 메시지 란을 이용해 초록색 안내 문구를 띄우는 대신, alert나 setErrorMsg로 표시합니다.
      // 여기서는 간단히 alert 사용하거나 에러 메시지 텍스트를 활용합니다.
      alert('비밀번호 재설정 이메일을 발송했습니다. 메일함을 확인해 주세요!');
    } catch (error) {
      console.error("Password reset error:", error);
      setErrorMsg('이메일 발송 실패: 가입된 이메일인지 확인해 주세요.');
    }
  };

  return (
    <div className="fade-in responsive-split" style={{ minHeight: '100vh', background: '#ffffff' }}>
      
      {/* Left Side: Info/Branding */}
      <div className="responsive-split-left" style={{ 
        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '60px', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', margin: '0 auto' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '40px', color: 'white', textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '8px', borderRadius: '12px', display: 'flex' }}>
              <Globe size={28} color="#4f46e5" />
            </div>
            <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>PublicMind</span>
          </Link>
          
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
            공공데이터로<br/>더 스마트한 일상
          </h1>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.6, opacity: 0.9, marginBottom: '40px' }}>
            부동산, 복지, 교통, 안전 등 흩어져 있던 정부의 수많은 공공데이터를 한 곳에서 쉽고 빠르게 통합 검색하세요.
          </p>
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>10+</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>통합 공공 분야</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '16px 24px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>1초</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>맞춤 정보 탐색</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="responsive-split-right" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px',
        background: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>
              {isLogin ? '오신 것을 환영합니다' : '지금 바로 시작하세요'}
            </h2>
            <p style={{ color: '#64748b' }}>
              {isLogin ? '계정에 로그인하여 맞춤 서비스를 이용해보세요.' : 'PublicMind의 모든 기능을 무료로 경험하세요'}
            </p>
          </div>

          {errorMsg && (
            <div style={{ padding: '12px', marginBottom: '16px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>이름</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="홍길동" style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} required={!isLogin} />
                  <UserIcon size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>이메일 주소</label>
              <div style={{ position: 'relative' }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" placeholder="name@example.com" style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                <span>비밀번호</span>
                {isLogin && <button type="button" onClick={handlePasswordReset} style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>비밀번호를 잊으셨나요?</button>}
              </label>
              <div style={{ position: 'relative' }}>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" placeholder="••••••••" style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }} required />
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              </div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px', borderRadius: '12px', background: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#4338ca'} onMouseOut={e => e.currentTarget.style.background = '#4f46e5'}>
              {isLogin ? '이메일로 로그인' : '이메일로 가입하기'}
            </button>
          </form>

          {/* Social Logins */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '32px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ padding: '0 16px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>또는 소셜 계정으로 {isLogin ? '로그인' : '가입'}</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button type="button" onClick={handleNaverLogin} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#03C75A', color: 'white', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: 'white', color: '#03C75A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, borderRadius: '2px', fontSize: '12px' }}>N</div>
              네이버로 계속하기
            </button>
            <button type="button" onClick={handleKakaoLogin} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#FEE500', color: '#000000', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '20px', height: '20px', background: '#000000', color: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, borderRadius: '10px', fontSize: '12px' }}>K</div>
              카카오로 계속하기
            </button>
            <button type="button" onClick={handleGoogleSignIn} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#334155', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
              구글로 계속하기
            </button>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.95rem', color: '#64748b' }}>
            {isLogin ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              style={{ color: '#4f46e5', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? '회원가입' : '로그인하기'}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default Auth;
