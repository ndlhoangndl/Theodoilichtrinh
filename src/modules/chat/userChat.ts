import { apiGetChatHistory, apiSendMessage, apiMarkAsRead } from '../../services/api';
import { state } from '../common/state';

let userChatInterval: number | null = null;

export function initUserChat(): void {
  const trigger = document.getElementById('chat-bubble-trigger');
  const card = document.getElementById('user-chat-card');
  const closeBtn = document.getElementById('btn-close-user-chat');
  const form = document.getElementById('form-user-chat') as HTMLFormElement;
  const input = document.getElementById('input-user-chat') as HTMLInputElement;

  if (!trigger || !card || !closeBtn || !form || !input) return;

  // Toggle chat card
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = card.classList.toggle('active');
    if (isActive) {
      openChat();
    } else {
      closeChat();
    }
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    card.classList.remove('active');
    closeChat();
  });

  // Close when clicking outside card
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (card.classList.contains('active') && !card.contains(target) && !trigger.contains(target)) {
      card.classList.remove('active');
      closeChat();
    }
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;

    input.value = '';
    apiSendMessage(val)
      .then(newMsg => {
        appendMessage(newMsg, true);
        scrollToBottom();
      })
      .catch(err => {
        console.error('Failed to send message:', err);
      });
  });
}

export function refreshUserChat(): void {
  const container = document.getElementById('user-chat-container');
  if (!container) return;

  const card = document.getElementById('user-chat-card');
  if (card) card.classList.remove('active');

  if (state.currentUser && state.currentUser.role === 'USER') {
    container.style.display = 'block';
    startUnreadBadgeCheck();
  } else {
    container.style.display = 'none';
    closeChat();
  }
}

function openChat(): void {
  // Clear unread badge
  const badge = document.getElementById('chat-unread-badge');
  if (badge) {
    badge.style.display = 'none';
    badge.textContent = '0';
  }

  loadHistoryAndStartPolling();
}

function closeChat(): void {
  if (userChatInterval) {
    clearInterval(userChatInterval);
    userChatInterval = null;
  }
  // Restart unread badge check interval
  startUnreadBadgeCheck();
}

function loadHistoryAndStartPolling(): void {
  // Clear any existing interval
  if (userChatInterval) clearInterval(userChatInterval);

  // Fetch history immediately
  fetchHistory(true);

  // Poll history every 3 seconds
  userChatInterval = window.setInterval(() => {
    fetchHistory(false);
  }, 3000);
}

function fetchHistory(shouldScroll: boolean): void {
  apiGetChatHistory('admin')
    .then(messages => {
      renderChatMessages(messages);
      if (shouldScroll) {
        scrollToBottom();
      }
    })
    .catch(err => {
      console.error('Error fetching chat history:', err);
    });
}

function renderChatMessages(messages: any[]): void {
  const container = document.getElementById('user-chat-messages');
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

function appendMessage(msg: any, isSentByMe: boolean): void {
  const container = document.getElementById('user-chat-messages');
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

function scrollToBottom(): void {
  const container = document.getElementById('user-chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

function startUnreadBadgeCheck(): void {
  if (userChatInterval) clearInterval(userChatInterval);

  // Check once immediately
  checkUnread();

  // Check every 8 seconds when chat is closed
  userChatInterval = window.setInterval(() => {
    checkUnread();
  }, 8000);
}

function checkUnread(): void {
  if (!state.currentUser || state.currentUser.role !== 'USER') return;

  apiGetChatHistory('admin')
    .then(messages => {
      const card = document.getElementById('user-chat-card');
      const isChatOpen = card && card.classList.contains('active');
      if (isChatOpen) return; // Handled separately if chat is open

      // Count unread received messages
      let unreadCount = 0;
      messages.forEach(msg => {
        if (msg.receiver === state.currentUser?.id && !msg.isRead) {
          unreadCount++;
        }
      });

      const badge = document.getElementById('chat-unread-badge');
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount.toString();
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    })
    .catch(err => {
      console.error('Error checking unread messages:', err);
    });
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
