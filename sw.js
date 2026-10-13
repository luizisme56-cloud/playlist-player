/* PWA Service Worker: 缓存壳层, 让加主屏后启动更快、可离线打开界面 */
var CACHE = 'rpshell-v1';
var ASSETS = ['./', './index.html', './manifest.json',
              './icon-120.png', './icon-152.png', './icon-180.png',
              './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      // 逐个加, 失败不影响安装
      return Promise.all(ASSETS.map(function(u){
        return c.add(u).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url = new URL(req.url);
  // 网易云图片 & 其他跨域资源: 直接用网络, 不缓存(避免体积膨胀)
  if(url.origin !== location.origin){
    return;
  }

  // 同源: 网络优先, 失败回退缓存(离线可用)
  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.status === 200){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});
