import { getCurrentSession } from './services/storage';
import { 
  CalendarEvent, 
  loadCalendarEvents, 
  saveCalendarEvents,
  addCalendarEvent, 
  deleteCalendarEvent 
} from './modules/calendar/eventStorage';
import {
  CalendarTask,
  loadCalendarTasks,
  addCalendarTask,
  toggleCalendarTask,
  deleteCalendarTask
} from './modules/calendar/taskStorage';

// Active calendar state
let currentUser: any = null;
let currentView: 'week' | 'month' = 'week';
let selectedDate: Date = new Date();
let miniCalendarMonthDate: Date = new Date(); // Separate tracker for mini calendar month view
let eventsList: CalendarEvent[] = [];
let activeFilters = new Set<string>(['calendar', 'work', 'school', 'personal']);
let activePopoverEventId: string | null = null;
let activePopoverEventDate: string | null = null; // Target date of the event popover
let searchQuery: string = ''; // Filter query string for toolbar search

// Drag-and-drop & Resizing Active State
let draggedEventId: string | null = null;
let draggedEventDate: string | null = null;
let dragOffsetY: number = 0;

// Tasks Active State
let tasksList: CalendarTask[] = [];
let draggedTaskId: string | null = null;

// Weather Active State
let weatherCache: { [dateStr: string]: { emoji: string; temp: string } } = {};

// DOM Elements
const userGreeting = document.getElementById('user-greeting-display');
const themeToggle = document.getElementById('outlook-theme-toggle');
const dateRangeDisplay = document.getElementById('date-range-display');
const btnNavToday = document.getElementById('btn-nav-today');
const btnNavPrev = document.getElementById('btn-nav-prev');
const btnNavNext = document.getElementById('btn-nav-next');
const gridDayHeaders = document.getElementById('grid-day-headers');
const timeAxisColumn = document.getElementById('time-axis-column');
const gridColumnsContainer = document.getElementById('grid-columns-container');
const calendarScrollContainer = document.getElementById('calendar-scroll-container');

// Toolbar buttons
const btnNewEvent = document.getElementById('btn-new-event-toolbar');
const viewOptWeek = document.getElementById('view-opt-week');
const viewOptMonth = document.getElementById('view-opt-month');

// Mini Calendar elements
const miniMonthYear = document.getElementById('mini-month-year');
const miniGridContainer = document.getElementById('mini-grid-container');
const miniPrevMonth = document.getElementById('mini-prev-month');
const miniNextMonth = document.getElementById('mini-next-month');

// Popover Elements
const eventPopover = document.getElementById('event-popover') as HTMLElement;
const popoverTitle = document.getElementById('popover-title');
const popoverTime = document.getElementById('popover-time');
const popoverDesc = document.getElementById('popover-desc');
const popoverClose = document.getElementById('popover-close');
const popoverBtnDelete = document.getElementById('popover-btn-delete');

// Modal Elements
const modalEventEditor = document.getElementById('modal-event-editor') as HTMLElement;
const formEventEditor = document.getElementById('form-event-editor') as HTMLFormElement;
const editorModalClose = document.getElementById('editor-modal-close');
const editorBtnCancel = document.getElementById('editor-btn-cancel');
const evtTitleInput = document.getElementById('evt-title') as HTMLInputElement;
const evtDateInput = document.getElementById('evt-date') as HTMLInputElement;
const evtCategorySelect = document.getElementById('evt-category') as HTMLSelectElement;
const evtStartTimeInput = document.getElementById('evt-start-time') as HTMLInputElement;
const evtEndTimeInput = document.getElementById('evt-end-time') as HTMLInputElement;
const evtDescriptionInput = document.getElementById('evt-description') as HTMLTextAreaElement;

// Helper: Convert time HH:MM to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

// Helper: Convert minutes from midnight to HH:MM format
function minutesToTime(mins: number): string {
  if (mins >= 1440) return '23:59';
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Helper: Get weather emoji from WMO weather code
function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 3) return '⛅';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌧️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95 && code <= 99) return '🌩️';
  return '⛅';
}

// Generate fallback mock weather around selected date
function generateMockWeather() {
  const base = new Date(selectedDate);
  base.setDate(base.getDate() - 15);
  for (let i = 0; i < 45; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = formatDateString(d);
    const val = d.getDate() % 5;
    let emoji = '☀️';
    let maxT = 32;
    let minT = 25;
    
    if (val === 1) { emoji = '⛅'; maxT = 31; minT = 24; }
    else if (val === 2) { emoji = '🌧️'; maxT = 28; minT = 23; }
    else if (val === 3) { emoji = '🌩️'; maxT = 29; minT = 23; }
    else if (val === 4) { emoji = '⛅'; maxT = 33; minT = 26; }
    
    weatherCache[dateStr] = {
      emoji,
      temp: `${maxT}°/${minT}°`
    };
  }
}

// Fetch actual forecast from Open-Meteo API
async function loadWeatherForecast() {
  generateMockWeather();
  renderMainGrid();

  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=21.0285&longitude=105.8542&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FHo_Chi_Minh');
    const data = await res.json();
    if (data && data.daily) {
      const dates = data.daily.time;
      const codes = data.daily.weathercode;
      const maxTemps = data.daily.temperature_2m_max;
      const minTemps = data.daily.temperature_2m_min;
      
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        const code = codes[i];
        const maxT = Math.round(maxTemps[i]);
        const minT = Math.round(minTemps[i]);
        
        weatherCache[dateStr] = {
          emoji: getWeatherEmoji(code),
          temp: `${maxT}°/${minT}°`
        };
      }
      renderMainGrid();
    }
  } catch (e) {
    console.warn('Failed to fetch weather forecast, using simulator fallback', e);
  }
}

// Helper: Get all matching events (direct and recurring) for a specific date
function getEventsForDate(dateStr: string): CalendarEvent[] {
  const dateObj = new Date(dateStr);
  const targetDay = (dateObj.getDay() + 6) % 7; // Monday-start adjust (0 = Mon, 6 = Sun)
  const targetDateVal = dateObj.getDate();
  const query = searchQuery ? searchQuery.toLowerCase() : '';

  return eventsList.filter(evt => {
    // 1. Category Filter Check
    if (!activeFilters.has(evt.category)) return false;

    // 2. Search Query Filter Check
    if (query) {
      const matchTitle = evt.title.toLowerCase().includes(query);
      const matchDesc = evt.description ? evt.description.toLowerCase().includes(query) : false;
      if (!matchTitle && !matchDesc) return false;
    }

    // 3. Exception dates check (excluded instances)
    if (evt.excludedDates && evt.excludedDates.includes(dateStr)) {
      return false;
    }

    // 4. Direct Match
    if (evt.date === dateStr) {
      return true;
    }

    // If event is after the target date, it cannot repeat on target date
    const evtDateObj = new Date(evt.date);
    const targetMid = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const evtMid = new Date(evtDateObj.getFullYear(), evtDateObj.getMonth(), evtDateObj.getDate());
    if (targetMid < evtMid) return false;

    // 5. Recurrence Match
    if (evt.recurrence === 'daily') {
      return true;
    }

    if (evt.recurrence === 'weekly') {
      const evtDay = (evtDateObj.getDay() + 6) % 7;
      return evtDay === targetDay;
    }

    if (evt.recurrence === 'monthly') {
      return evtDateObj.getDate() === targetDateVal;
    }

    return false;
  });
}

// Helper: Format Date as YYYY-MM-DD
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper: Get start and end dates of the week
function getWeekRange(date: Date, startOnMonday = true): { start: Date; end: Date } {
  const current = new Date(date);
  const day = current.getDay();
  // Adjust day index (0 = Sun, 1 = Mon)
  const diff = current.getDate() - day + (startOnMonday ? (day === 0 ? -6 : 1) : 0);
  
  const start = new Date(current.setDate(diff));
  const end = new Date(current.setDate(start.getDate() + 6));
  return { start, end };
}

// Initialize Page
function init() {
  currentUser = getCurrentSession();
  if (!currentUser) {
    // Redirect to login page if no active session
    window.location.href = '/index.html';
    return;
  }

  // Display Greeting
  if (userGreeting) {
    userGreeting.textContent = `Xin chào, ${currentUser.fullName || currentUser.username} 👋`;
  }

  // Set Theme on Load
  const savedTheme = localStorage.getItem('LICHTRINH_THEME');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light-theme-outlook');
  } else {
    document.body.classList.add('light-theme-outlook');
  }

  // Initialize events lists
  eventsList = loadCalendarEvents(currentUser.username);
  tasksList = loadCalendarTasks(currentUser.username);
  miniCalendarMonthDate = new Date(selectedDate);

  // Setup Event Listeners
  setupEventListeners();
  
  // Initial renders
  renderAll();
  renderTasksList();
  loadWeatherForecast();
  
  // Auto-scroll time grid to 7:00 AM for better viewing on startup
  if (calendarScrollContainer) {
    calendarScrollContainer.scrollTop = 7 * 60; // 7 hours * 60px/hour
  }

  // Start real-time current time line updater
  setInterval(() => {
    updateCurrentTimeMarker();
  }, 60000);
}

// Bind event handlers
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light-theme-outlook');
      localStorage.setItem('LICHTRINH_THEME', isLight ? 'light' : 'dark');
    });
  }

  // Search input binding
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderMainGrid();
    });
  }

  // Toolbar View Switcher Buttons
  const viewBtns = [
    { btn: viewOptWeek, view: 'week' },
    { btn: viewOptMonth, view: 'month' }
  ];
  
  viewBtns.forEach(({ btn, view }) => {
    if (btn) {
      btn.addEventListener('click', () => {
        viewBtns.forEach(item => item.btn?.classList.remove('active'));
        btn.classList.add('active');
        currentView = view as any;
        renderAll();
      });
    }
  });

  // Sidebar Category Filter Checkboxes
  document.querySelectorAll('.category-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const checkbox = e.target as HTMLInputElement;
      const cat = checkbox.getAttribute('data-category');
      if (cat) {
        if (checkbox.checked) {
          activeFilters.add(cat);
        } else {
          activeFilters.delete(cat);
        }
        renderMainGrid(); // Re-render main grid with updated filters
      }
    });
  });

  // Date Range Navigation Controls
  if (btnNavToday) {
    btnNavToday.addEventListener('click', () => {
      selectedDate = new Date();
      miniCalendarMonthDate = new Date(selectedDate);
      renderAll();
    });
  }

  if (btnNavPrev) {
    btnNavPrev.addEventListener('click', () => {
      navigateDate(-1);
    });
  }

  if (btnNavNext) {
    btnNavNext.addEventListener('click', () => {
      navigateDate(1);
    });
  }

  // Mini Calendar Navigation
  if (miniPrevMonth) {
    miniPrevMonth.addEventListener('click', () => {
      miniCalendarMonthDate.setMonth(miniCalendarMonthDate.getMonth() - 1);
      renderMiniCalendar();
    });
  }

  if (miniNextMonth) {
    miniNextMonth.addEventListener('click', () => {
      miniCalendarMonthDate.setMonth(miniCalendarMonthDate.getMonth() + 1);
      renderMiniCalendar();
    });
  }

  // Modal Buttons
  if (btnNewEvent) {
    btnNewEvent.addEventListener('click', () => {
      openEventEditorModal();
    });
  }
  
  const toolbarNewEvent = document.getElementById('btn-new-event-toolbar');
  if (toolbarNewEvent) {
    toolbarNewEvent.addEventListener('click', () => {
      openEventEditorModal();
    });
  }

  if (editorModalClose) {
    editorModalClose.addEventListener('click', closeEventEditorModal);
  }

  if (editorBtnCancel) {
    editorBtnCancel.addEventListener('click', closeEventEditorModal);
  }

  // Modal Submit (Form Submit)
  if (formEventEditor) {
    formEventEditor.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const recurrenceEl = document.getElementById('evt-recurrence') as HTMLSelectElement;
      const newEvt: Omit<CalendarEvent, 'id'> = {
        title: evtTitleInput.value.trim(),
        date: evtDateInput.value,
        category: evtCategorySelect.value as any,
        startTime: evtStartTimeInput.value,
        endTime: evtEndTimeInput.value,
        description: evtDescriptionInput.value.trim(),
        recurrence: recurrenceEl ? (recurrenceEl.value as any) : 'none'
      };

      // Validation check
      if (newEvt.startTime >= newEvt.endTime) {
        alert(currentUser.username === 'vi' ? 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc!' : 'Start time must be before end time!');
        return;
      }

      addCalendarEvent(currentUser.username, newEvt);
      eventsList = loadCalendarEvents(currentUser.username);
      
      closeEventEditorModal();
      renderAll();
    });
  }

  // Popover Close & Delete Buttons
  if (popoverClose) {
    popoverClose.addEventListener('click', closePopover);
  }

  if (popoverBtnDelete) {
    popoverBtnDelete.addEventListener('click', () => {
      if (activePopoverEventId) {
        const evt = eventsList.find(e => e.id === activePopoverEventId);
        if (!evt) return;

        if (evt.recurrence && evt.recurrence !== 'none') {
          // Recurring event deletion prompt
          const choice = confirm(
            currentUser.username === 'vi' || document.documentElement.lang === 'vi'
              ? "Đây là sự kiện lặp lại. Bấm OK để xóa toàn bộ chuỗi lặp lại, hoặc Cancel để chỉ xóa lần lặp ngày này?"
              : "This is a recurring event. Click OK to delete all occurrences, or Cancel to delete only this single occurrence?"
          );
          
          if (choice) {
            deleteCalendarEvent(currentUser.username, activePopoverEventId);
          } else {
            if (activePopoverEventDate) {
              if (!evt.excludedDates) evt.excludedDates = [];
              if (!evt.excludedDates.includes(activePopoverEventDate)) {
                evt.excludedDates.push(activePopoverEventDate);
              }
              saveCalendarEvents(currentUser.username, eventsList);
            }
          }
        } else {
          // Regular deletion
          const confirmed = confirm(
            document.documentElement.lang === 'vi' 
              ? 'Bạn có chắc chắn muốn xóa sự kiện này?' 
              : 'Are you sure you want to delete this event?'
          );
          if (confirmed) {
            deleteCalendarEvent(currentUser.username, activePopoverEventId);
          }
        }
        
        eventsList = loadCalendarEvents(currentUser.username);
        closePopover();
        renderAll();
      }
    });
  }

  // Click outside detail popover to close it
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      eventPopover.style.display === 'flex' &&
      !eventPopover.contains(target) &&
      !target.classList.contains('event-card') &&
      !target.closest('.event-card')
    ) {
      closePopover();
    }
  });

  // Tasks Sidebar Toggle
  const btnToggleTasks = document.getElementById('btn-toggle-tasks');
  const tasksSidebar = document.getElementById('tasks-sidebar');
  const tasksSidebarClose = document.getElementById('tasks-sidebar-close');

  if (btnToggleTasks && tasksSidebar) {
    btnToggleTasks.addEventListener('click', () => {
      tasksSidebar.classList.toggle('collapsed');
    });
  }

  if (tasksSidebarClose && tasksSidebar) {
    tasksSidebarClose.addEventListener('click', () => {
      tasksSidebar.classList.add('collapsed');
    });
  }

  // Quick Task Add Input
  const taskInputQuick = document.getElementById('task-input-quick') as HTMLInputElement;
  if (taskInputQuick) {
    taskInputQuick.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const title = taskInputQuick.value.trim();
        if (title) {
          addCalendarTask(currentUser.username, title);
          tasksList = loadCalendarTasks(currentUser.username);
          taskInputQuick.value = '';
          renderTasksList();
        }
      }
    });
  }
}

// Navigation Date Calculations
function navigateDate(direction: number) {
  if (currentView === 'week') {
    selectedDate.setDate(selectedDate.getDate() + (direction * 7));
  } else if (currentView === 'month') {
    selectedDate.setMonth(selectedDate.getMonth() + direction);
  }
  miniCalendarMonthDate = new Date(selectedDate);
  renderAll();
}

// Render Header Date Text (e.g. June 15–21, 2026)
function renderDateDisplay() {
  if (!dateRangeDisplay) return;

  const monthsVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  if (currentView === 'week') {
    const { start, end } = getWeekRange(selectedDate);
    
    const startStr = `${start.getDate()} ${monthsVi[start.getMonth()]}`;
    const endStr = `${end.getDate()} ${monthsVi[end.getMonth()]}`;
    
    dateRangeDisplay.textContent = `${startStr} – ${endStr}, ${start.getFullYear()}`;
  } else if (currentView === 'month') {
    dateRangeDisplay.textContent = `${monthsVi[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }
}

// Render both left mini calendar and the main grid
function renderAll() {
  renderDateDisplay();
  renderMiniCalendar();
  renderMainGrid();
}

// Render Mini Month Calendar
function renderMiniCalendar() {
  if (!miniMonthYear || !miniGridContainer) return;

  const monthsVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const year = miniCalendarMonthDate.getFullYear();
  const month = miniCalendarMonthDate.getMonth();
  
  miniMonthYear.textContent = `${monthsVi[month]} ${year}`;

  let html = '';
  // Days of week header
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  weekDays.forEach(wd => {
    html += `<div class="mini-day-header">${wd}</div>`;
  });

  // Calculate grid dates
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-start adjust
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Prev Month Days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    html += `<div class="mini-day-cell other-month" data-date="${formatDateString(prevDate)}">${day}</div>`;
  }

  // Active Month Days
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month, d);
    const dateStr = formatDateString(currDate);
    
    let classes = 'mini-day-cell';
    if (formatDateString(today) === dateStr) classes += ' today';
    if (formatDateString(selectedDate) === dateStr) classes += ' active-focus';

    html += `<div class="${classes}" data-date="${dateStr}">${d}</div>`;
  }

  // Next Month Days to fill grid (6 rows * 7 columns = 42 cells)
  const totalCells = html.split('<div').length - 1;
  const remainingCells = 49 - totalCells; // 7 rows (header + 6 days rows)
  for (let d = 1; d <= remainingCells - 7; d++) {
    const nextDate = new Date(year, month + 1, d);
    html += `<div class="mini-day-cell other-month" data-date="${formatDateString(nextDate)}">${d}</div>`;
  }

  miniGridContainer.innerHTML = html;

  // Click handlers on cells
  miniGridContainer.querySelectorAll('.mini-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const dateVal = cell.getAttribute('data-date');
      if (dateVal) {
        selectedDate = new Date(dateVal);
        miniCalendarMonthDate = new Date(selectedDate);
        renderAll();
      }
    });
  });
}

// Render right-sidebar tasks list
function renderTasksList() {
  const container = document.getElementById('task-list-container');
  if (!container) return;

  let html = '';
  tasksList.forEach(task => {
    html += `
      <li class="task-item ${task.completed ? 'completed' : ''}" 
          draggable="true" 
          data-task-id="${task.id}">
        <input type="checkbox" class="task-item-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-item-content">${task.title}</span>
        <button class="task-item-delete">✕</button>
      </li>
    `;
  });
  container.innerHTML = html;

  // Bind listeners
  container.querySelectorAll('.task-item-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const taskItem = cb.closest('.task-item');
      const taskId = taskItem ? taskItem.getAttribute('data-task-id') : null;
      if (taskId) {
        toggleCalendarTask(currentUser.username, taskId);
        tasksList = loadCalendarTasks(currentUser.username);
        renderTasksList();
      }
    });
  });

  container.querySelectorAll('.task-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskItem = btn.closest('.task-item');
      const taskId = taskItem ? taskItem.getAttribute('data-task-id') : null;
      if (taskId) {
        deleteCalendarTask(currentUser.username, taskId);
        tasksList = loadCalendarTasks(currentUser.username);
        renderTasksList();
      }
    });
  });

  // Drag start/end listeners
  container.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('dragstart', (e: any) => {
      draggedTaskId = item.getAttribute('data-task-id');
      item.classList.add('dragging');

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', draggedTaskId || '');
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedTaskId = null;
    });
  });
}

// Render Main Calendar Grid (depending on Day / Week / Month view)
function renderMainGrid() {
  if (currentView === 'month') {
    renderMonthViewGrid();
    return;
  }

  // Otherwise draw hour axis calendar grid
  if (!gridDayHeaders || !timeAxisColumn || !gridColumnsContainer) return;

  // 1. Calculate active day dates based on selectedDate and currentView
  const activeDates: Date[] = [];
  if (currentView === 'week') {
    const { start } = getWeekRange(selectedDate);
    for (let i = 0; i < 7; i++) { // Monday to Sunday
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      activeDates.push(d);
    }
  }

  // 2. Set grid styles
  const colCount = activeDates.length;
  gridDayHeaders.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
  gridColumnsContainer.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;

  // 3. Render Day headers row
  const daysVi = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
  const todayStr = formatDateString(new Date());

  let headersHtml = '';
  activeDates.forEach(date => {
    const dateStr = formatDateString(date);
    const dayOfWeek = (date.getDay() + 6) % 7; // Monday-start adjust
    const isToday = todayStr === dateStr;

    // Retrieve weather info if available
    let weatherHtml = '';
    const weather = weatherCache[dateStr];
    if (weather) {
      weatherHtml = `
        <div class="day-weather-info" title="Thời tiết dự kiến">
          <span class="weather-icon-lbl">${weather.emoji}</span>
          <span class="weather-temp-lbl">${weather.temp}</span>
        </div>
      `;
    }

    headersHtml += `
      <div class="day-header-cell ${isToday ? 'today-header' : ''}">
        <span class="day-name-lbl">${daysVi[dayOfWeek]}</span>
        <span class="day-date-lbl">${date.getDate()}</span>
        ${weatherHtml}
      </div>
    `;
  });
  gridDayHeaders.innerHTML = headersHtml;

  // 4. Render Time Axis labels (12 AM - 11 PM)
  let timeHtml = '';
  for (let h = 0; h < 24; h++) {
    let hourDisplay = '';
    if (h === 0) hourDisplay = '12 AM';
    else if (h < 12) hourDisplay = `${h} AM`;
    else if (h === 12) hourDisplay = '12 PM';
    else hourDisplay = `${h - 12} PM`;

    timeHtml += `<div class="hour-axis-cell">${hourDisplay}</div>`;
  }
  timeAxisColumn.innerHTML = timeHtml;

  // 5. Render Columns with Grid lines & Event cards
  let columnsHtml = '';
  activeDates.forEach((date, colIndex) => {
    const dateStr = formatDateString(date);
    
    // Draw background dashed grid lines
    let linesHtml = '';
    for (let h = 0; h < 24; h++) {
      // solid line for hours, dashed line for half-hours
      linesHtml += `<div class="hour-grid-line solid" style="top: ${h * 60}px;"></div>`;
      linesHtml += `<div class="hour-grid-line" style="top: ${h * 60 + 30}px;"></div>`;
    }

    // Filter events matching this date and active category selection filters
    const matchedEvents = getEventsForDate(dateStr);
    
    let cardsHtml = '';
    matchedEvents.forEach(evt => {
      const startParts = evt.startTime.split(':').map(Number);
      const endParts = evt.endTime.split(':').map(Number);
      
      const startHour = startParts[0] + (startParts[1] / 60);
      const endHour = endParts[0] + (endParts[1] / 60);
      
      const topOffset = startHour * 60;
      const height = (endHour - startHour) * 60;

      cardsHtml += `
        <div class="event-card event-${evt.category}" 
             style="top: ${topOffset}px; height: ${height}px;" 
             draggable="true"
             data-event-id="${evt.id}">
          <div class="event-card-title">${evt.title}</div>
          <div class="event-card-time">${evt.startTime} - ${evt.endTime}</div>
          <div class="event-resize-handle"></div>
        </div>
      `;
    });

    columnsHtml += `
      <div class="day-column-grid" data-date="${dateStr}" data-col-index="${colIndex}">
        ${linesHtml}
        ${cardsHtml}
      </div>
    `;
  });
  gridColumnsContainer.innerHTML = columnsHtml;

  // 6. Draw current-time line marker
  updateCurrentTimeMarker();

  // 7. Click events inside grid
  attachGridInteractionHandlers();
}

// Render Month Calendar view inside workspace
function renderMonthViewGrid() {
  if (!gridDayHeaders || !timeAxisColumn || !gridColumnsContainer) return;
  
  gridDayHeaders.style.gridTemplateColumns = 'repeat(7, 1fr)';
  
  // Render Day headers
  const daysVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  let headersHtml = '';
  daysVi.forEach(day => {
    headersHtml += `
      <div class="day-header-cell" style="padding: 6px 0;">
        <span class="day-name-lbl" style="font-size:12px;">${day}</span>
      </div>
    `;
  });
  gridDayHeaders.innerHTML = headersHtml;
  
  // Clean time axis
  timeAxisColumn.innerHTML = '';
  
  // Render Monthly Grid cells
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  let gridHtml = '<div class="month-grid-container">';
  
  const drawCell = (cellDate: Date, isOtherMonth: boolean) => {
    const dateStr = formatDateString(cellDate);
    const todayStr = formatDateString(new Date());
    const isToday = dateStr === todayStr;
    
    // Filter events
    const matchedEvents = getEventsForDate(dateStr);
    let evtsHtml = '';
    matchedEvents.forEach(evt => {
      evtsHtml += `
        <div class="month-event-item event-${evt.category}" draggable="true" data-event-id="${evt.id}">
          ${evt.startTime} ${evt.title}
        </div>
      `;
    });
    
    return `
      <div class="month-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="month-cell-header">${cellDate.getDate()}</div>
        <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:2px;">
          ${evtsHtml}
        </div>
      </div>
    `;
  };
  
  // Prev month cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    gridHtml += drawCell(new Date(year, month - 1, day), true);
  }
  
  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    gridHtml += drawCell(new Date(year, month, d), false);
  }
  
  // Next month cells
  const totalCells = (gridHtml.split('class="month-cell').length - 1);
  const remainingCells = 42 - totalCells; // standard 6-row month grid
  for (let d = 1; d <= remainingCells; d++) {
    gridHtml += drawCell(new Date(year, month + 1, d), true);
  }
  
  gridHtml += '</div>';
  
  gridColumnsContainer.style.gridTemplateColumns = '1fr';
  gridColumnsContainer.innerHTML = gridHtml;
  
  // Bind events click details
  gridColumnsContainer.querySelectorAll('.month-event-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = item.getAttribute('data-event-id');
      const parentCell = item.closest('.month-cell');
      const dateVal = parentCell ? parentCell.getAttribute('data-date') : null;
      if (id) {
        showEventPopover(id, item as HTMLElement, dateVal);
      }
    });

    // Drag start for month items
    item.addEventListener('dragstart', (e: any) => {
      draggedEventId = item.getAttribute('data-event-id');
      const parentCell = item.closest('.month-cell');
      draggedEventDate = parentCell ? parentCell.getAttribute('data-date') : null;
      dragOffsetY = 0;
      
      item.classList.add('dragging');
      
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedEventId || '');
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedEventId = null;
      draggedEventDate = null;
    });
  });

  // Bind double click/single click on cells to create event
  gridColumnsContainer.querySelectorAll('.month-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('month-event-item')) {
        const dStr = cell.getAttribute('data-date');
        if (dStr) {
          openEventEditorModal(dStr, '09:00', '10:00');
        }
      }
    });

    // Drag targets for month cells
    cell.addEventListener('dragover', (e: any) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });

    cell.addEventListener('dragleave', () => {
      cell.classList.remove('drag-over');
    });

    cell.addEventListener('drop', (e: any) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      
      if (!draggedEventId && !draggedTaskId) return;
      
      const targetDate = cell.getAttribute('data-date');
      if (!targetDate) return;
      
      if (draggedEventId) {
        const evt = eventsList.find(ev => ev.id === draggedEventId);
        if (!evt) return;
        
        if (targetDate === draggedEventDate) return;
        
        handleEventMoveOrResize(evt, targetDate, evt.startTime, evt.endTime, draggedEventDate);
      } else if (draggedTaskId) {
        const task = tasksList.find(t => t.id === draggedTaskId);
        if (!task) return;

        const newEvt: Omit<CalendarEvent, 'id'> = {
          title: task.title,
          description: 'Lập lịch từ công việc cần làm.',
          date: targetDate,
          startTime: '09:00',
          endTime: '10:00',
          category: 'calendar',
          recurrence: 'none'
        };

        addCalendarEvent(currentUser.username, newEvt);
        eventsList = loadCalendarEvents(currentUser.username);
        renderAll();
      }
    });
  });
}

// Update the red indicator timeline line in the correct day column
function updateCurrentTimeMarker() {
  if (currentView === 'month') return;
  
  // Remove existing timeline marker
  const oldMarker = document.getElementById('current-time-marker-el');
  if (oldMarker) oldMarker.remove();

  const now = new Date();
  const todayStr = formatDateString(now);
  
  // Find column matching today's date
  const todayColumn = document.querySelector(`.day-column-grid[data-date="${todayStr}"]`) as HTMLElement;
  if (todayColumn) {
    const hour = now.getHours();
    const min = now.getMinutes();
    
    // Top position = hour * 60 + min
    const topOffset = (hour * 60) + min;
    
    const marker = document.createElement('div');
    marker.id = 'current-time-marker-el';
    marker.className = 'current-time-marker';
    marker.style.top = `${topOffset}px`;
    
    todayColumn.appendChild(marker);
  }
}

// Bind clicks inside calendar cells to open modal or clicks on cards to open popover
function attachGridInteractionHandlers() {
  if (!gridColumnsContainer) return;

  // 1. Click on event card to open Popover
  gridColumnsContainer.querySelectorAll('.event-card').forEach(cardEl => {
    const card = cardEl as HTMLElement;
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = card.getAttribute('data-event-id');
      const parentCol = card.closest('.day-column-grid');
      const dateVal = parentCol ? parentCol.getAttribute('data-date') : null;
      if (id) {
        showEventPopover(id, card, dateVal);
      }
    });

    // Drag-and-drop source on event card
    card.addEventListener('dragstart', (e: any) => {
      if (e.target.classList.contains('event-resize-handle')) {
        e.preventDefault();
        return;
      }

      draggedEventId = card.getAttribute('data-event-id');
      const parentCol = card.closest('.day-column-grid');
      draggedEventDate = parentCol ? parentCol.getAttribute('data-date') : null;

      const rect = card.getBoundingClientRect();
      dragOffsetY = e.clientY - rect.top;

      card.classList.add('dragging');

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedEventId || '');
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedEventId = null;
      draggedEventDate = null;
    });

    // Resize handlers on event card
    const handle = card.querySelector('.event-resize-handle');
    if (handle) {
      handle.addEventListener('mousedown', (e: any) => {
        e.stopPropagation();
        e.preventDefault();

        const eventId = card.getAttribute('data-event-id');
        if (!eventId) return;

        const evt = eventsList.find(ev => ev.id === eventId);
        if (!evt) return;

        const originalOccurrenceDate = card.closest('.day-column-grid')?.getAttribute('data-date') || evt.date;

        const startY = e.clientY;
        const startHeight = card.offsetHeight;
        const topOffset = parseFloat(card.style.top);

        const onMouseMove = (moveEvent: MouseEvent) => {
          const deltaY = moveEvent.clientY - startY;
          let newHeight = startHeight + deltaY;

          newHeight = Math.max(15, newHeight);
          card.style.height = `${newHeight}px`;

          const endMin = topOffset + newHeight;
          const newEndTimeStr = minutesToTime(endMin);

          const timeLabel = card.querySelector('.event-card-time');
          if (timeLabel) {
            timeLabel.textContent = `${evt.startTime} - ${newEndTimeStr}`;
          }
        };

        const onMouseUp = (upEvent: MouseEvent) => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const deltaY = upEvent.clientY - startY;
          let finalHeight = startHeight + deltaY;
          finalHeight = Math.max(15, Math.round(finalHeight / 15) * 15);

          const endMin = topOffset + finalHeight;
          const newEndTimeStr = minutesToTime(endMin);

          if (newEndTimeStr === evt.endTime) {
            renderAll();
            return;
          }

          handleEventMoveOrResize(evt, originalOccurrenceDate, evt.startTime, newEndTimeStr, originalOccurrenceDate);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  });

  // 2. Click on empty grid column slot to create event
  gridColumnsContainer.querySelectorAll('.day-column-grid').forEach(col => {
    col.addEventListener('click', (e: any) => {
      const target = e.target as HTMLElement;
      // Make sure we didn't click directly on an event card
      if (!target.classList.contains('event-card') && !target.closest('.event-card')) {
        const dateVal = col.getAttribute('data-date') || formatDateString(selectedDate);
        
        // Calculate clicked hour based on cursor click offset inside column
        const rect = col.getBoundingClientRect();
        const clickedY = e.clientY - rect.top; // pixel offset
        const totalMinutes = Math.floor(clickedY); // 1px = 1min
        
        // Round to nearest 15 minutes
        const roundedMin = Math.round(totalMinutes / 15) * 15;
        const startHour = Math.floor(roundedMin / 60);
        const startMin = roundedMin % 60;
        
        const endHour = startMin === 45 ? startHour + 1 : startHour;
        const endMin = startMin === 45 ? 0 : startMin + 15;

        const pad = (n: number) => String(n).padStart(2, '0');
        const startStr = `${pad(startHour)}:${pad(startMin)}`;
        const endStr = `${pad(endHour)}:${pad(endMin)}`;

        openEventEditorModal(dateVal, startStr, endStr);
      }
    });

    // Drag-and-drop target on column
    col.addEventListener('dragover', (e: any) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e: any) => {
      e.preventDefault();
      col.classList.remove('drag-over');

      if (!draggedEventId && !draggedTaskId) return;

      const targetDate = col.getAttribute('data-date');
      if (!targetDate) return;

      if (draggedEventId) {
        const evt = eventsList.find(ev => ev.id === draggedEventId);
        if (!evt) return;

        const duration = timeToMinutes(evt.endTime) - timeToMinutes(evt.startTime);
        const rect = col.getBoundingClientRect();
        const droppedY = e.clientY - rect.top;

        let newTop = droppedY - dragOffsetY;
        newTop = Math.max(0, Math.min(1440 - duration, newTop));

        const roundedTop = Math.round(newTop / 15) * 15;
        const newStartTimeMins = roundedTop;
        const newEndTimeMins = roundedTop + duration;

        const newStartTime = minutesToTime(newStartTimeMins);
        const newEndTime = minutesToTime(newEndTimeMins);

        if (targetDate === draggedEventDate && newStartTime === evt.startTime && newEndTime === evt.endTime) {
          return;
        }

        handleEventMoveOrResize(evt, targetDate, newStartTime, newEndTime, draggedEventDate);
      } else if (draggedTaskId) {
        const task = tasksList.find(t => t.id === draggedTaskId);
        if (!task) return;

        const rect = col.getBoundingClientRect();
        const droppedY = e.clientY - rect.top;

        let newTop = droppedY;
        newTop = Math.max(0, Math.min(1440 - 60, newTop)); // Default 1 hour duration

        const roundedTop = Math.round(newTop / 15) * 15;
        const newStartTimeMins = roundedTop;
        const newEndTimeMins = roundedTop + 60; // 1 hour duration

        const newStartTime = minutesToTime(newStartTimeMins);
        const newEndTime = minutesToTime(newEndTimeMins);

        const newEvt: Omit<CalendarEvent, 'id'> = {
          title: task.title,
          description: 'Lập lịch từ công việc cần làm.',
          date: targetDate,
          startTime: newStartTime,
          endTime: newEndTime,
          category: 'calendar',
          recurrence: 'none'
        };

        addCalendarEvent(currentUser.username, newEvt);
        eventsList = loadCalendarEvents(currentUser.username);
        renderAll();
      }
    });
  });
}

// Helper: Handle event drag-and-drop or resize in database & re-render
function handleEventMoveOrResize(
  evt: CalendarEvent, 
  newDate: string, 
  newStartTime: string, 
  newEndTime: string,
  originalOccurrenceDate: string | null
) {
  if (evt.recurrence && evt.recurrence !== 'none') {
    const isVi = currentUser.username === 'vi' || document.documentElement.lang === 'vi';
    const choice = confirm(
      isVi
        ? "Đây là sự kiện lặp lại. Bấm OK để áp dụng cho tất cả các lần lặp, hoặc Cancel để chỉ áp dụng cho lần lặp ngày này?"
        : "This is a recurring event. Click OK to apply to all occurrences, or Cancel to apply only to this single occurrence?"
    );
    
    if (choice) {
      // Apply to all: Update the master event
      evt.date = newDate;
      evt.startTime = newStartTime;
      evt.endTime = newEndTime;
      saveCalendarEvents(currentUser.username, eventsList);
    } else {
      // Apply to single occurrence: Exclude original date and create exception event
      const origDate = originalOccurrenceDate || evt.date;
      if (!evt.excludedDates) evt.excludedDates = [];
      if (!evt.excludedDates.includes(origDate)) {
        evt.excludedDates.push(origDate);
      }
      
      const newEvt: Omit<CalendarEvent, 'id'> = {
        title: evt.title,
        description: evt.description,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        category: evt.category,
        recurrence: 'none'
      };
      addCalendarEvent(currentUser.username, newEvt);
    }
  } else {
    // Non-recurring: Just update
    evt.date = newDate;
    evt.startTime = newStartTime;
    evt.endTime = newEndTime;
    saveCalendarEvents(currentUser.username, eventsList);
  }
  
  // Reload and re-render
  eventsList = loadCalendarEvents(currentUser.username);
  renderAll();
}

// Event Details Popover Panel
function showEventPopover(eventId: string, anchorElement: HTMLElement, dateStr: string | null = null) {
  const evt = eventsList.find(e => e.id === eventId);
  if (!evt) return;

  activePopoverEventId = eventId;
  activePopoverEventDate = dateStr;
  
  if (popoverTitle) popoverTitle.textContent = evt.title;
  if (popoverDesc) popoverDesc.textContent = evt.description || 'No description provided.';
  
  // Format Date range
  const dateObj = new Date(evt.date);
  const dateFormatted = dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (popoverTime) {
    popoverTime.textContent = `${dateFormatted}, ${evt.startTime} - ${evt.endTime}`;
  }

  // Position the popover floating window next to the anchor element
  eventPopover.style.display = 'flex';
  const rect = anchorElement.getBoundingClientRect();
  
  let left = rect.right + window.scrollX + 8;
  // If popover goes off the screen, show on left
  if (left + 300 > window.innerWidth) {
    left = rect.left + window.scrollX - 300;
  }
  
  let top = rect.top + window.scrollY;
  if (top + 200 > window.innerHeight) {
    top = window.innerHeight - 220;
  }

  eventPopover.style.left = `${left}px`;
  eventPopover.style.top = `${top}px`;
}

function closePopover() {
  eventPopover.style.display = 'none';
  activePopoverEventId = null;
}

// Create/Edit Event Modal Dialog
function openEventEditorModal(dateVal?: string, startTimeVal?: string, endTimeVal?: string) {
  evtTitleInput.value = '';
  evtDescriptionInput.value = '';
  
  // Pre-fill values
  evtDateInput.value = dateVal || formatDateString(selectedDate);
  evtStartTimeInput.value = startTimeVal || '08:00';
  evtEndTimeInput.value = endTimeVal || '09:00';
  evtCategorySelect.value = 'calendar';

  const recurrenceEl = document.getElementById('evt-recurrence') as HTMLSelectElement;
  if (recurrenceEl) recurrenceEl.value = 'none';

  modalEventEditor.classList.add('active');
  evtTitleInput.focus();
}

function closeEventEditorModal() {
  modalEventEditor.classList.remove('active');
}

// Launch init on page load
window.addEventListener('DOMContentLoaded', init);
