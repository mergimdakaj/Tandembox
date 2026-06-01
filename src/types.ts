export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'vacation' | 'half-day' | 'holiday';

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO string
  checkOut?: string; // ISO string
  status: AttendanceStatus;
  isSaturday?: boolean;
  note?: string;
  overtimeHours?: number;
}

export interface ExpenseRecord {
  id?: string;
  userId: string;
  date: string; // ISO string
  amount: number;
  description: string;
  category: string;
}

export interface BreakRecord {
  id?: string;
  userId: string;
  attendanceId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO string
}

