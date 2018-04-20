/*
- service_workerとして登録するjsは1byteでも変更があると再度registerされる
- なので、VERSIONを変更してcommitすれば再度installイベントを発火させ、新しい静的コンテンツをcacheに格納できる
- VERSIONをgonで渡しても良い。
*/

var VERSION = 5
var CACHE_NAME = 'cached_files_' + VERSION + '_'
var ORIGIN = location.protocol + '//' + location.hostname

// キャッシュする対象のパス
var urlsToCache = [
    '/offline',
    '/main.js',
    '/style.css'
]

// 1. install: swを新規にregisterする,またはswの差分を検出した場合に呼ばれる
// install直後、swはwaitingというステータスになるが、すぐにactiveにさせたい場合は、
// event.waitUntil(self.skipWaiting()) させればいい
// 
// waitUntil ... 引数処理が終わるまで、呼ばれた場所でのライフサイクルを維持する
// skipWaiting ... すぐにactiveに移行する
self.addEventListener('install', function (event) {
    event.waitUntil(
        // cacheにはバージョン番号をセットできる
        caches.open(CACHE_NAME).then((cache) => {
            cache.addAll(urlsToCache)
        })
    )
})


// 2. activate: waiting状態から、ページコントロールを得たときに発火する
//
// event.waitUntil(self.clients.claim()) すると、ブラウザがページを読み込み中でもコントロールできるようになる
self.addEventListener('activate', function (event) {
    console.log('Activated.')
    event.waitUntil(
        caches.keys().then(function (keys) {
            console.log('remove old caches')
            return Promise.all(
                keys.map(function (key) {
                    if (key.indexOf(CACHE_NAME) === -1) {
                        return caches.delete(key)
                    }
                })
            );
        }));
});


// fetch 外部に対して通信を行ったときに走る
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// other: push, notificationclick, ...