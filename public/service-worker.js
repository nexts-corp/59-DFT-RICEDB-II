// Set a name for the current cache
var CACHE_NAME = 'TEST-APP';

var urlsToCache = [

];


/*self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('[ServiceWorker] Caching cacheFiles');
                return cache.addAll(urlsToCache);
            })
    );
});


self.addEventListener('fetch', function (event) {
    event.respondWith(
        
        caches.match(event.request)
        .then(function (response) {
            // Cache hit - return response
            if (response) {
                //console.log('%c[ServiceWorker] Found in Cache : '+response.url,'color:green')
                return response;
            }


            // IMPORTANT: Clone the request. A request is a stream and
            // can only be consumed once. Since we are consuming this
            // once by cache and once by the browser for fetch, we need
            // to clone the response.
            var fetchRequest = event.request.clone();
            //console.log('[ServiceWorker] Cache Not Found :',fetchRequest.url);
            return fetch(fetchRequest)
        })

    );
});

self.addEventListener('activate', function(event) {
    console.log('[ServiceWorker] Activated');
    var cacheWhitelist = ['TEST-APP'];

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
        return Promise.all(
            cacheNames.map(function(cacheName) {
                if (cacheWhitelist.indexOf(cacheName) === -1) {
                    return caches.delete(cacheName);
                }
            })
        );
        })
    );
});*/


self.addEventListener('push', function(event) {
     console.log('Received a push message', event);
  console.log('Received a push message', event.data);

 var title = "xxx";
  var body = "xxx";
  var icon = '/img/logo128.png';
  var tag =  "xx";

  //event.waitUntil(
   // self.registration.showNotification(title, {
   //   body: body,
   //   icon: icon,
    //  tag: tag
  //  })
 // );


   const promiseChain = Promise.resolve(event.data.json())
    .then(data => {
        return self.registration.getNotifications({tag: data.tag});
    })
    .then(notifications => {
        //Do something with the notifications.
         self.registration.showNotification(notifications.title, {
            body: notifications.body,
            icon: notifications.icon,
            tag: notifications.tag
        })
    });
  event.waitUntil(promiseChain);
  
});

self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  // Android doesn’t close the notification when you click on it
  // See: http://crbug.com/463146
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});