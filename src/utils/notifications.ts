/**
 * Utility to request and handle web notifications.
 * Works optimally on mobile devices when added to the home screen.
 */

export function checkNotificationSupport(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!checkNotificationSupport()) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!checkNotificationSupport()) {
    return 'denied';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Notification permission error: ", error);
    return Notification.permission;
  }
}

export function sendLocalNotification(title: string, body: string, isStart: boolean = true) {
  if (!checkNotificationSupport() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const options: any = {
      body,
      // Visual indicators: green circle emoji for start, red circle emoji for end
      icon: isStart ? '🟢' : '🔴',
      badge: isStart ? '🟢' : '🔴',
      tag: 'school-bell',
      renotify: true,
      requireInteraction: true,
    };
    
    // Check if ServiceWorker registration is available for PWA background notifications
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      // Fallback to standard browser notification
      new Notification(title, options);
    }
  } catch (error) {
    console.error("Notification trigger error: ", error);
  }
}
