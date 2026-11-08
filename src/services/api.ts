import { User, Habit, MonthRecord } from '../types/types';
import { CalendarEvent } from '../modules/calendar/eventStorage';
import { CalendarTask } from '../modules/calendar/taskStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper to get token
export function getToken(): string | null {
  return localStorage.getItem('LICHTRINH_TOKEN');
}

// Helper to set token
export function setToken(token: string): void {
  localStorage.setItem('LICHTRINH_TOKEN', token);
}

// Helper to clear token
export function clearToken(): void {
  localStorage.removeItem('LICHTRINH_TOKEN');
}

// Update MongoDB Sync status badge in UI
export function updateSyncBadge(status: 'syncing' | 'synced' | 'error'): void {
  const badge = document.getElementById('mongodb-sync-badge');
  if (!badge) return;

  const isVi = (localStorage.getItem('LICHTRINH_LANG') || 'vi') === 'vi';
  if (status === 'syncing') {
    badge.textContent = isVi ? '⏳ Đang lưu MongoDB...' : '⏳ Saving to MongoDB...';
    badge.style.color = 'var(--accent-orange)';
  } else if (status === 'synced') {
    badge.textContent = isVi ? '☁️ Đã lưu MongoDB' : '☁️ Saved to MongoDB';
    badge.style.color = 'var(--accent-green)';
  } else {
    badge.textContent = isVi ? '⚠️ Lỗi đồng bộ Server' : '⚠️ Server Sync Error';
    badge.style.color = '#e53935';
  }
}

// Helper for fetch options with auth headers
async function request(path: string, options: RequestInit = {}, trackSync = false): Promise<any> {
  if (trackSync) updateSyncBadge('syncing');

  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (trackSync) updateSyncBadge('synced');
    return data;
  } catch (err) {
    if (trackSync) updateSyncBadge('error');
    throw err;
  }
}

export async function apiGetOwnerProfile(): Promise<{ token: string; user: User }> {
  return request('/auth/owner', { method: 'GET' });
}

export async function apiLogin(username: string, password: string): Promise<{ token: string; user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiUpdateProfile(user: Partial<User>): Promise<{ user: User }> {
  return request('/auth/update-profile', {
    method: 'POST',
    body: JSON.stringify(user)
  }, true);
}

export async function apiChangePassword(oldPassword: string, newPassword: string): Promise<any> {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword })
  }, true);
}

export async function apiGetHabits(): Promise<Habit[]> {
  const data = await request('/tracker/habits');
  return Array.isArray(data) ? data : (data.habits || []);
}

export async function apiSaveHabits(habits: Habit[]): Promise<any> {
  return request('/tracker/habits', {
    method: 'POST',
    body: JSON.stringify({ habits })
  }, true);
}

export async function apiGetRecord(year: number, month: number): Promise<MonthRecord | null> {
  const data = await request(`/tracker/record/${year}/${month}`);
  return data.record || null;
}

export async function apiSaveRecord(year: number, month: number, record: MonthRecord): Promise<any> {
  return request(`/tracker/record/${year}/${month}`, {
    method: 'POST',
    body: JSON.stringify({ record })
  }, true);
}

export async function apiGetCalendarData(): Promise<{ events: CalendarEvent[] | null; tasks: CalendarTask[] | null }> {
  return request('/tracker/calendar');
}

export async function apiSaveCalendarEvents(events: CalendarEvent[]): Promise<any> {
  return request('/tracker/calendar/events', {
    method: 'POST',
    body: JSON.stringify({ events })
  }, true);
}

export async function apiSaveCalendarTasks(tasks: CalendarTask[]): Promise<any> {
  return request('/tracker/calendar/tasks', {
    method: 'POST',
    body: JSON.stringify({ tasks })
  }, true);
}
