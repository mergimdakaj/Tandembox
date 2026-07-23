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

export function sendDeviceNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/logo.jpeg',
      badge: '/logo.jpeg',
      tag: 'mergim-group-work-reminder',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Play subtle audio alert if possible
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio fallback silent
    }
  } catch (err) {
    console.error("Dërgimi i njoftimit dështoi:", err);
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
