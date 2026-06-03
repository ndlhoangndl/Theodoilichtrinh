import { apiGetAdminThreads, apiGetChatHistory, apiSendMessage, apiMarkAsRead } from '../../services/api';
import { state } from '../common/state';

let adminChatInterval: number | null = null;
let selectedUserId: string | null = null;

export function initAdminChat(): void {
  const tabUsers = document.getElementById('btn-admin-tab-users');
  const tabSupport = document.getElementById('btn-admin-tab-support');
  const panelUsers = document.getElementById('admin-panel-users');
  const panelSupport = document.getElementById('admin-panel-support');

  if (!tabUsers || !tabSupport || !panelUsers || !panelSupport) return;

  // Tab switching
  tabUsers.addEventListener('click', () => {
    tabUsers.classList.add('active');
    tabSupport.classList.remove('active');
    panelUsers.style.display = 'block';
    panelSupport.style.display = 'none';

    stopAdminPolling();
  });

  tabSupport.addEventListener('click', () => {
    tabSupport.classList.add('active');
    tabUsers.classList.remove('active');
    panelUsers.style.display = 'none';
    panelSupport.style.display = 'flex';

    loadAdminThreads();
    startAdminThreadsPolling();
  });

  // Reply form submit
  const form = document.getElementById('form-admin-chat-reply') as HTMLFormElement;
  const input = document.getElementById('input-admin-chat-reply') as HTMLInputElement;

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val || !selectedUserId) return;

      input.value = '';
      apiSendMessage(val, selectedUserId)
        .then(newMsg => {
          appendAdminMessage(newMsg, true);
          scrollToAdminChatBottom();
          // Reload threads to update last message preview
          loadAdminThreads();
        })
        .catch(err => {
          console.error('Failed to send admin response:', err);
        });
    });
  }
}

export function refreshAdminChat(): void {
  const tabUsers = document.getElementById('btn-admin-tab-users');
  const tabSupport = document.getElementById('btn-admin-tab-support');
  const panelUsers = document.getElementById('admin-panel-users');
  const panelSupport = document.getElementById('admin-panel-support');

  if (!tabUsers || !tabSupport || !panelUsers || !panelSupport) return;

  if (state.currentUser && state.currentUser.role === 'ADMIN') {
    tabUsers.classList.add('active');
    tabSupport.classList.remove('active');
    panelUsers.style.display = 'block';
    panelSupport.style.display = 'none';
  } else {
    stopAdminPolling();
  }
}

function startAdminThreadsPolling(): void {
  if (adminChatInterval) clearInterval(adminChatInterval);
  
  adminChatInterval = window.setInterval(() => {
    loadAdminThreads();
    if (selectedUserId) {
      loadHistoryForUser(selectedUserId, false);
    }
  }, 3000);
}

function stopAdminPolling(): void {
  if (adminChatInterval) {
    clearInterval(adminChatInterval);
    adminChatInterval = null;
  }
  selectedUserId = null;
}

function loadAdminThreads(): void {
  apiGetAdminThreads()
    .then(threads => {
      renderThreadsList(threads);
    })
    .catch(err => {
      console.error('Error loading admin threads:', err);
    });
}

function renderThreadsList(threads: any[]): void {
  const container = document.getElementById('admin-support-threads-list');
  if (!container) return;

  if (threads.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">
        ${state.currentLang === 'vi' ? 'Không có yêu cầu hỗ trợ nào.' : 'No support requests yet.'}
      </div>
    `;
    // If no threads, clear chat area
    const chatHeader = document.getElementById('admin-chat-partner-name');
    if (chatHeader) chatHeader.textContent = state.currentLang === 'vi' ? 'Chọn một hội thoại' : 'Select a conversation';
    const chatMsgArea = document.getElementById('admin-support-chat-messages');
    if (chatMsgArea) chatMsgArea.innerHTML = '';
    const inputArea = document.getElementById('form-admin-chat-reply');
    if (inputArea) inputArea.style.display = 'none';
    return;
  }

  let html = '';
  threads.forEach(t => {
    const isActive = t.partnerId === selectedUserId ? 'active' : '';
    const initial = t.fullName ? t.fullName.charAt(0).toUpperCase() : t.username.charAt(0).toUpperCase();
    const unreadBadge = t.unreadCount > 0 ? `<span class="admin-thread-badge">${t.unreadCount}</span>` : '';
    const lastMsg = t.lastMessageContent ? t.lastMessageContent : '...';

    html += `
      <div class="admin-support-thread-item ${isActive}" data-userid="${t.partnerId}">
        <div class="admin-thread-avatar">${initial}</div>
        <div class="admin-thread-info">
          <div class="admin-thread-name">${escapeHTML(t.fullName || t.username)}</div>
          <div class="admin-thread-preview">${escapeHTML(lastMsg)}</div>
        </div>
        ${unreadBadge}
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind thread clicks
  container.querySelectorAll('.admin-support-thread-item').forEach(item => {
    item.addEventListener('click', () => {
      const uId = item.getAttribute('data-userid');
      if (!uId) return;

      // Set active highlight class
      container.querySelectorAll('.admin-support-thread-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      selectedUserId = uId;
      
      // Update header partner name
      const nameEl = item.querySelector('.admin-thread-name');
      const partnerHeader = document.getElementById('admin-chat-partner-name');
      if (partnerHeader && nameEl) {
        partnerHeader.textContent = nameEl.textContent;
      }

      // Show input area
      const inputArea = document.getElementById('form-admin-chat-reply');
      if (inputArea) inputArea.style.display = 'flex';

      // Load history
      loadHistoryForUser(uId, true);

      // Mark messages as read on click
      apiMarkAsRead(uId)
        .then(() => {
          loadAdminThreads();
        })
        .catch(err => console.error(err));
    });
  });
}

function loadHistoryForUser(userId: string, shouldScroll: boolean): void {
  apiGetChatHistory(userId)
    .then(messages => {
      if (selectedUserId !== userId) return; // Guard against race conditions
      renderAdminChatMessages(messages);
      if (shouldScroll) {
        scrollToAdminChatBottom();
      }
    })
    .catch(err => {
      console.error('Error fetching admin chat messages:', err);
    });
}

function renderAdminChatMessages(messages: any[]): void {
  const container = document.getElementById('admin-support-chat-messages');
  if (!container) return;

  let html = '';
  messages.forEach(msg => {
    const isSentByMe = state.currentUser && msg.sender === state.currentUser.id;
    const msgClass = isSentByMe ? 'sent' : 'received';
    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="chat-message ${msgClass}">
        <span>${escapeHTML(msg.content)}</span>
        <span class="chat-message-time">${formattedTime}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function appendAdminMessage(msg: any, isSentByMe: boolean): void {
  const container = document.getElementById('admin-support-chat-messages');
  if (!container) return;

  const msgClass = isSentByMe ? 'sent' : 'received';
  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msgEl = document.createElement('div');
  msgEl.className = `chat-message ${msgClass}`;
  msgEl.innerHTML = `
    <span>${escapeHTML(msg.content)}</span>
    <span class="chat-message-time">${formattedTime}</span>
  `;
  container.appendChild(msgEl);
}

function scrollToAdminChatBottom(): void {
  const container = document.getElementById('admin-support-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
