const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

exports.kakaoLogin = onCall(async (request) => {
  const { accessToken } = request.data;
  if (!accessToken) {
    throw new HttpsError("invalid-argument", "Access Token is required.");
  }

  try {
    // 1. 카카오 서버에서 액세스 토큰으로 사용자 정보 가져오기
    const kakaoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const kakaoUser = kakaoResponse.data;
    const uid = `kakao:${kakaoUser.id}`;
    
    // 2. Firebase Auth에 사용자 정보 업데이트 또는 생성
    const updateParams = {
      displayName: kakaoUser.kakao_account?.profile?.nickname || "카카오 유저",
      photoURL: kakaoUser.kakao_account?.profile?.profile_image_url || null,
    };
    
    try {
      await admin.auth().updateUser(uid, updateParams);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        await admin.auth().createUser({
          uid: uid,
          ...updateParams,
        });
      } else {
        throw error;
      }
    }
    
    // 3. 커스텀 토큰 생성 후 프론트엔드로 반환
    const customToken = await admin.auth().createCustomToken(uid);
    return { customToken };
  } catch (error) {
    console.error("Kakao Login Error:", error);
    throw new HttpsError("internal", "Failed to create custom token for Kakao login");
  }
});

exports.naverLogin = onCall(async (request) => {
  const { accessToken } = request.data;
  if (!accessToken) {
    throw new HttpsError("invalid-argument", "Access Token is required.");
  }

  try {
    // 1. 네이버 서버에서 액세스 토큰으로 사용자 정보 가져오기
    const naverResponse = await axios.get("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (naverResponse.data.resultcode !== "00") {
      throw new Error(`Naver API Error: ${naverResponse.data.message}`);
    }

    const naverUser = naverResponse.data.response;
    const uid = `naver:${naverUser.id}`;
    
    // 2. Firebase Auth에 사용자 정보 업데이트 또는 생성
    const updateParams = {
      displayName: naverUser.name || naverUser.nickname || "네이버 유저",
      photoURL: naverUser.profile_image || null,
    };
    
    try {
      await admin.auth().updateUser(uid, updateParams);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        await admin.auth().createUser({
          uid: uid,
          ...updateParams,
        });
      } else {
        throw error;
      }
    }
    
    // 3. 커스텀 토큰 생성 후 프론트엔드로 반환
    const customToken = await admin.auth().createCustomToken(uid);
    return { customToken };
  } catch (error) {
    console.error("Naver Login Error:", error);
    throw new HttpsError("internal", "Failed to create custom token for Naver login");
  }
});

exports.proxyApi = onRequest({ region: "asia-northeast3" }, (req, res) => {
  cors(req, res, async () => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl) {
        return res.status(400).send("Missing target URL");
      }

      // Whitelist allowed domains for proxy
      const allowedDomains = [
        "www.youthcenter.go.kr",
        "www.safetydata.go.kr",
        "openapi.seoul.go.kr",
        "api.childcare.go.kr",
        "open.neis.go.kr",
        "openapi.molit.go.kr",
        "apis.data.go.kr"
      ];

      const urlObj = new URL(targetUrl);
      if (!allowedDomains.includes(urlObj.hostname)) {
        return res.status(403).send("Domain not allowed by proxy");
      }

      const response = await axios({
        method: req.method,
        url: targetUrl,
        responseType: "arraybuffer", // To properly forward binary data or encoding
        headers: {
          "Accept": req.headers["accept"] || "*/*",
          // Don't forward Origin or Host to avoid CORS/Host mismatch at destination
        }
      });

      // Forward response headers safely
      const excludedHeaders = [
        "access-control-allow-origin", 
        "access-control-allow-credentials",
        "transfer-encoding",
        "content-encoding",
        "content-length",
        "connection",
        "keep-alive"
      ];
      Object.keys(response.headers).forEach(key => {
        if (!excludedHeaders.includes(key.toLowerCase())) {
          res.set(key, response.headers[key]);
        }
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      console.error("Proxy Error:", error.message);
      res.status(error.response?.status || 500).send(error.response?.data || error.message);
    }
  });
});
