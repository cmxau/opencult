const REMINDER_ALARM_KEY = 'open-cult-reminder-interval';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function scheduleReminder(dayOfWeek: number, timeHHMM: string): void {
  clearReminder();

  // Web Notifications can't fire in background on iOS PWA without a server.
  // This schedules a check every minute while the app is open.
  const [hh, mm] = timeHHMM.split(':').map(Number);

  const intervalId = window.setInterval(() => {
    const now = new Date();
    if (
      now.getDay()     === dayOfWeek &&
      now.getHours()   === hh &&
      now.getMinutes() === mm
    ) {
      new Notification('Open Cult', {
        body: 'Time to weigh in! Tap to open the scale.',
        icon: '/icons/icon-192.png',
        tag:  'weigh-in-reminder',
      });
    }
  }, 60_000);

  sessionStorage.setItem(REMINDER_ALARM_KEY, String(intervalId));
}

export function clearReminder(): void {
  const id = sessionStorage.getItem(REMINDER_ALARM_KEY);
  if (id) window.clearInterval(Number(id));
  sessionStorage.removeItem(REMINDER_ALARM_KEY);
}
