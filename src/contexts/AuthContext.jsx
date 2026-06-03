import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, functions } from '../firebase';
import { onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 카카오 SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('e657a89183cdb97ed5a465f8e7536fe8');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithKakao = async () => {
    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: async (authObj) => {
          try {
            const accessToken = authObj.access_token;
            // Firebase Function 호출하여 커스텀 토큰 발급
            const kakaoLoginFunction = httpsCallable(functions, 'kakaoLogin');
            const result = await kakaoLoginFunction({ accessToken });
            const customToken = result.data.customToken;
            
            // 발급받은 커스텀 토큰으로 Firebase 로그인
            const userCredential = await signInWithCustomToken(auth, customToken);
            resolve(userCredential.user);
          } catch (error) {
            console.error("Firebase Kakao Login Error:", error);
            reject(error);
          }
        },
        fail: (err) => {
          console.error("Kakao SDK Login Error:", err);
          reject(err);
        },
      });
    });
  };

  const loginWithNaverToken = async (accessToken) => {
    try {
      const naverLoginFunction = httpsCallable(functions, 'naverLogin');
      const result = await naverLoginFunction({ accessToken });
      const customToken = result.data.customToken;
      
      const userCredential = await signInWithCustomToken(auth, customToken);
      return userCredential.user;
    } catch (error) {
      console.error("Firebase Naver Login Error:", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    loginWithKakao,
    loginWithNaverToken,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
