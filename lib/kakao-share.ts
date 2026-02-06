'use client';

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: KakaoShareParams) => void;
      };
    };
  }
}

interface KakaoShareParams {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

const SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('SSR'));
      return;
    }

    if (window.Kakao) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Kakao SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function initSdk() {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  if (!key) return;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key);
  }
}

export async function initKakaoShare(): Promise<boolean> {
  try {
    await loadScript();
    initSdk();
    return true;
  } catch {
    return false;
  }
}

export function sendKakaoShare(params: {
  title: string;
  description: string;
  imageUrl: string;
  shareUrl: string;
}) {
  if (!window.Kakao?.isInitialized()) return;

  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl,
      link: {
        mobileWebUrl: params.shareUrl,
        webUrl: params.shareUrl,
      },
    },
    buttons: [
      {
        title: '청첩장 보기',
        link: {
          mobileWebUrl: params.shareUrl,
          webUrl: params.shareUrl,
        },
      },
    ],
  });
}
