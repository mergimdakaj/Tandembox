import { LOGO_DATA_URL } from '../assets/logo';

export interface ScheduleSettings {
  enabled: boolean;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "16:00"
  notifyStart: boolean;
  notifyEnd: boolean;
}

const DEFAULT_SCHEDULE: ScheduleSettings = {
  enabled: true,
  startTime: "08:00",
  endTime: "16:00",
  notifyStart: true,
  notifyEnd: true
};

export function getScheduleSettings(): ScheduleSettings {
  const saved = localStorage.getItem('pl_schedule_settings');
  if (saved) {
    try {
      return { ...DEFAULT_SCHEDULE, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SCHEDULE;
    }
  }
  return DEFAULT_SCHEDULE;
}

export function saveScheduleSettings(settings: ScheduleSettings) {
  localStorage.setItem('pl_schedule_settings', JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn("Ky shfletues nuk mbështet njoftimet e drejtpërdrejta (Notification API).");
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;

    // Dual chime tone
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.3); // G5

    osc2.frequency.setValueAtTime(1046.50, now); // C6
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.3); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.log("Audio not supported or blocked by gesture:", err);
  }
}

export function triggerVibration() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {
      // Vibrate fallback
    }
  }
}

export function sendDeviceNotification(title: string, body: string) {
  // 1. Play sound chime & vibrate mobile device immediately
  playNotificationSound();
  triggerVibration();

  // 2. Dispatch custom in-app popup event so mobile screen shows an unmissable banner/modal
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mergim_push_alert', {
      detail: { title, body, timestamp: new Date().toISOString() }
    }));
  }

  // 3. Attempt Native Web Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        // Try Service Worker registration showNotification first (much better for Android/iOS)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: LOGO_DATA_URL,
              badge: LOGO_DATA_URL,
              vibrate: [200, 100, 200],
              tag: 'mergim-group-work-reminder'
            } as any);
          }).catch(() => {
            new Notification(title, {
              body,
              icon: LOGO_DATA_URL,
              badge: LOGO_DATA_URL,
              tag: 'mergim-group-work-reminder'
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: LOGO_DATA_URL,
            badge: LOGO_DATA_URL,
            tag: 'mergim-group-work-reminder'
          });
        }
      } catch (err) {
        console.warn("Standard Notification constructor failed on mobile:", err);
      }
    }
  }
}

export function checkAndTriggerWorkReminders(userUid: string, attendanceRecord: any, showToast?: (msg: string, type?: 'success' | 'warning' | 'info') => void) {
  if (!userUid) return;

  const settings = getScheduleSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentMinutesFromMidnight = currentHour * 60 + currentMinute;

  // Parse start time (e.g. "08:00")
  const [sHour, sMin] = settings.startTime.split(':').map(Number);
  const startMinutes = (sHour || 8) * 60 + (sMin || 0);

  // Parse end time (e.g. "16:00")
  const [eHour, eMin] = settings.endTime.split(':').map(Number);
  const endMinutes = (eHour || 16) * 60 + (eMin || 0);

  // 1. CHECK-IN REMINDER: If time reached/passed start time, and user has NOT checked in today
  if (settings.notifyStart && currentMinutesFromMidnight >= startMinutes && currentMinutesFromMidnight < startMinutes + 120) {
    const hasCheckedIn = attendanceRecord && attendanceRecord.checkIn;
    const notifiedKey = `pl_notified_start_${dateStr}_${userUid}`;

    if (!hasCheckedIn && !localStorage.getItem(notifiedKey)) {
      const title = '⏰ Kyçu për të filluar orarin e punës!';
      const message = 'MergimGroup: Përshëndetje! Ka ardhur ora e orarit të punës. Ju lutemi bëni Check-In në sistem.';

      sendDeviceNotification(title, message);
      if (showToast) {
        showToast(`⏰ ${message}`, 'info');
      }
      localStorage.setItem(notifiedKey, 'true');
    }
  }

  // 2. CHECK-OUT REMINDER: If time reached/passed end time, and user IS checked in but HAS NOT checked out
  if (settings.notifyEnd && currentMinutesFromMidnight >= endMinutes && currentMinutesFromMidnight < endMinutes + 120) {
    const hasCheckedIn = attendanceRecord && attendanceRecord.checkIn;
    const hasCheckedOut = attendanceRecord && attendanceRecord.checkOut;
    const notifiedKey = `pl_notified_end_${dateStr}_${userUid}`;

    if (hasCheckedIn && !hasCheckedOut && !localStorage.getItem(notifiedKey)) {
      const title = '🏁 Kyçu për të përfunduar orarin e punës!';
      const message = 'MergimGroup: Orari i punës ka përfunduar. Bëni Sign Out dhe regjistroni shënimet tuaja të punës.';

      sendDeviceNotification(title, message);
      if (showToast) {
        showToast(`🏁 ${message}`, 'info');
      }
      localStorage.setItem(notifiedKey, 'true');
    }
  }
}
