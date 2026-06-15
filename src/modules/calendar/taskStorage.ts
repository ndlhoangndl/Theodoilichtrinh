export interface CalendarTask {
  id: string;
  title: string;
  completed: boolean;
}

const getStorageKey = (username: string) => `LICHTRINH_${username}_TASKS`;

// Load all tasks for a user
export function loadCalendarTasks(username: string): CalendarTask[] {
  const key = getStorageKey(username);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as CalendarTask[];
    } catch (e) {
      console.error(`Error parsing calendar tasks for ${username}`, e);
    }
  }

  // Default mock tasks on first launch
  const defaultTasks: CalendarTask[] = [
    { id: 'task_1', title: 'Hoàn thành bài tập lớn', completed: false },
    { id: 'task_2', title: 'Mua sắm nhu yếu phẩm', completed: true },
    { id: 'task_3', title: 'Chuẩn bị bài thuyết trình', completed: false }
  ];
  saveCalendarTasks(username, defaultTasks);
  return defaultTasks;
}

// Save all tasks for a user
export function saveCalendarTasks(username: string, tasks: CalendarTask[]): void {
  const key = getStorageKey(username);
  localStorage.setItem(key, JSON.stringify(tasks));
}

// Add a new task
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

// Toggle task completion
export function toggleCalendarTask(username: string, taskId: string): void {
  const tasks = loadCalendarTasks(username);
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveCalendarTasks(username, tasks);
  }
}

// Delete a task
export function deleteCalendarTask(username: string, taskId: string): void {
  const tasks = loadCalendarTasks(username);
  const filtered = tasks.filter(t => t.id !== taskId);
  saveCalendarTasks(username, filtered);
}
