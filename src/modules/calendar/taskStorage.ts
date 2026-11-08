import { apiSaveCalendarTasks } from '../../services/api';

export interface CalendarTask {
  id: string;
  title: string;
  completed: boolean;
}

export const getCalendarTasksStorageKey = (username: string) => `LICHTRINH_${username}_TASKS`;
export const KEY_DIRTY_CALENDAR_TASKS = 'LICHTRINH_DIRTY_CALENDAR_TASKS';

export const DEFAULT_CALENDAR_TASKS: CalendarTask[] = [
  { id: 'task_1', title: 'Hoàn thành bài tập lớn', completed: false },
  { id: 'task_2', title: 'Mua sắm nhu yếu phẩm', completed: true },
  { id: 'task_3', title: 'Chuẩn bị bài thuyết trình', completed: false }
];

export function loadCalendarTasks(username: string): CalendarTask[] {
  const key = getCalendarTasksStorageKey(username);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as CalendarTask[];
    } catch (e) {
      console.error(`Error parsing calendar tasks for ${username}`, e);
    }
  }

  // Return default tasks in memory only — do NOT call saveCalendarTasks() here
  // so an empty localStorage never overwrites existing MongoDB tasks on startup.
  return [...DEFAULT_CALENDAR_TASKS];
}

export function saveCalendarTasks(username: string, tasks: CalendarTask[]): void {
  const key = getCalendarTasksStorageKey(username);
  localStorage.setItem(key, JSON.stringify(tasks));
  localStorage.setItem(KEY_DIRTY_CALENDAR_TASKS, 'true');

  apiSaveCalendarTasks(tasks)
    .then(() => {
      localStorage.removeItem(KEY_DIRTY_CALENDAR_TASKS);
    })
    .catch(err => {
      console.error('Failed to sync calendar tasks to MongoDB (will retry):', err);
    });
}

export function addCalendarTask(username: string, title: string): CalendarTask {
  const tasks = loadCalendarTasks(username);
  const newTask: CalendarTask = {
    id: 'task_' + Date.now(),
    title,
    completed: false
  };
  tasks.push(newTask);
  saveCalendarTasks(username, tasks);
  return newTask;
}

export function toggleCalendarTask(username: string, taskId: string): void {
  const tasks = loadCalendarTasks(username);
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveCalendarTasks(username, tasks);
  }
}

export function deleteCalendarTask(username: string, taskId: string): void {
  const tasks = loadCalendarTasks(username);
  const filtered = tasks.filter(t => t.id !== taskId);
  saveCalendarTasks(username, filtered);
}
