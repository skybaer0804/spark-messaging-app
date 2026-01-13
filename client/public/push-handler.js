// Push Event Listener for Web Push Notifications
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: '새 메시지',
      body: event.data.text(),
    };
  }

  const title = data.title || 'Spark 메시지';
  const options = {
    body: data.body || '새로운 메시지가 도착했습니다.',
    icon: data.icon || '/asset/spark_icon_192.png',
    badge: '/asset/spark_icon_96.png',
    data: data.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Listener
self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // 이미 앱이 열려있으면 해당 창으로 이동
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 아니면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
