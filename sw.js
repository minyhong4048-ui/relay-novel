const CACHE_NAME = 'relay-novel-v1';
const STATIC_ASSETS = [
  '/relay-novel/',
  '/relay-novel/index.html',
  '/relay-novel/icon-192.png',
  '/relay-novel/icon-512.png'
];

// 설치 시 기본 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 오래된 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 사용 (Firebase 실시간 데이터 보장)
self.addEventListener('fetch', event => {
  // Firebase, Google Fonts 등 외부 요청은 항상 네트워크
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공한 응답은 캐시 업데이트
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
