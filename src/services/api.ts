import { User, Habit, MonthRecord } from '../types/types';

const API_BASE_URL = 'http://localhost:5000/api';

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

// Helper for fetch options with auth headers
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiLogin(username: string, password: string): Promise<{ token: string; user: User }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiRegister(user: any): Promise<any> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      password: user.passwordHash,
      email: user.email,
      fullName: user.fullName,
      gender: user.gender,
      dob: user.dob
    })
  });
}

export async function apiUpdateProfile(user: Partial<User>): Promise<{ user: User }> {
  return request('/auth/update-profile', {
    method: 'POST',
    body: JSON.stringify(user)
  });
}

export async function apiChangePassword(oldPassword: string, newPassword: string): Promise<any> {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword })
  });
}

export async function apiGetHabits(): Promise<Habit[]> {
  return request('/tracker/habits');
}

export async function apiSaveHabits(habits: Habit[]): Promise<any> {
  return request('/tracker/habits', {
    method: 'POST',
    body: JSON.stringify({ habits })
  });
}

export async function apiGetRecord(year: number, month: number): Promise<MonthRecord | null> {
  return request(`/tracker/record?year=${year}&month=${month}`);
}

export async function apiSaveRecord(year: number, month: number, record: MonthRecord): Promise<any> {
  return request('/tracker/record', {
    method: 'POST',
    body: JSON.stringify({ year, month, record })
  });
}

export async function apiGetAdminUsers(): Promise<any[]> {
  return request('/admin/users');
}

export async function apiDeleteUser(userId: string): Promise<any> {
  return request(`/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

export async function apiUpdateUserRole(userId: string, role: string): Promise<any> {
  return request(`/admin/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role })
  });
}

export async function apiForgotPassword(email: string): Promise<any> {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
}

export async function apiResetPassword(email: string, code: string, newPassword: string): Promise<any> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword })
  });
}

export async function apiGetChatHistory(partnerId: string): Promise<any[]> {
  return request(`/messages/history/${partnerId}`);
}

export async function apiSendMessage(content: string, receiverId?: string): Promise<any> {
  return request('/messages', {
    method: 'POST',
    body: JSON.stringify({ content, receiverId })
  });
}

export async function apiGetAdminThreads(): Promise<any[]> {
  return request('/messages/admin/threads');
}

export async function apiMarkAsRead(partnerId: string): Promise<any> {
  return request(`/messages/read/${partnerId}`, {
    method: 'POST'
  });
}

