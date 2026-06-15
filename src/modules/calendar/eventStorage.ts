export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  category: 'calendar' | 'work' | 'school' | 'personal';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  excludedDates?: string[]; // Date strings (YYYY-MM-DD) to exclude from recurrence
}

const getStorageKey = (username: string) => `LICHTRINH_${username}_CALENDAR_EVENTS`;

// Load all events for a user
export function loadCalendarEvents(username: string): CalendarEvent[] {
  const key = getStorageKey(username);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as CalendarEvent[];
    } catch (e) {
      console.error(`Error parsing calendar events for ${username}`, e);
    }
  }
  
  // Return some mock events initially for demonstration
  const defaultEvents: CalendarEvent[] = [
    {
      id: 'mock_1',
      title: 'Học lập trình',
      description: 'Lớp học lập trình web frontend/backend',
      date: '2026-06-16',
      startTime: '08:00',
      endTime: '12:00',
      category: 'school',
      recurrence: 'weekly'
    },
    {
      id: 'mock_2',
      title: 'Dạy lớp Python',
      description: 'Dạy học viên lớp Python cơ bản',
      date: '2026-06-15',
      startTime: '08:00',
      endTime: '10:00',
      category: 'work',
      recurrence: 'none'
    },
    {
      id: 'mock_3',
      title: 'Trực kỹ thuật',
      description: 'Hỗ trợ kỹ thuật dự án',
      date: '2026-06-17',
      startTime: '14:00',
      endTime: '17:00',
      category: 'work',
      recurrence: 'none'
    },
    {
      id: 'mock_4',
      title: 'Luyện tập thể thao',
      description: 'Chạy bộ công viên',
      date: '2026-06-18',
      startTime: '08:00',
      endTime: '11:00',
      category: 'personal',
      recurrence: 'none'
    },
    {
      id: 'mock_5',
      title: 'Dạy thuật toán',
      description: 'Dạy cấu trúc dữ liệu và giải thuật',
      date: '2026-06-19',
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      recurrence: 'weekly'
    },
    {
      id: 'mock_6',
      title: 'Học kỹ năng mềm',
      description: 'Thuyết trình trước đám đông',
      date: '2026-06-21',
      startTime: '14:00',
      endTime: '17:00',
      category: 'school',
      recurrence: 'none'
    }
  ];

  saveCalendarEvents(username, defaultEvents);
  return defaultEvents;
}

// Save all events for a user
export function saveCalendarEvents(username: string, events: CalendarEvent[]): void {
  const key = getStorageKey(username);
  localStorage.setItem(key, JSON.stringify(events));
}

// Add a new event
export function addCalendarEvent(username: string, event: Omit<CalendarEvent, 'id'>): CalendarEvent {
  const events = loadCalendarEvents(username);
  const newEvent: CalendarEvent = {
    ...event,
    id: 'evt_' + Date.now()
  };
  events.push(newEvent);
  saveCalendarEvents(username, events);
  return newEvent;
}

// Delete an event
export function deleteCalendarEvent(username: string, eventId: string): boolean {
  const events = loadCalendarEvents(username);
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events.splice(index, 1);
    saveCalendarEvents(username, events);
    return true;
  }
  return false;
}
