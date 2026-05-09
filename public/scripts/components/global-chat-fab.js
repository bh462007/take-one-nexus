(function () {
  if (window.__takeOneChatFabLoaded) return;
  window.__takeOneChatFabLoaded = true;

  const params = new URLSearchParams(window.location.search);
  const authMode = params.get('auth');

  if (authMode === 'login' || authMode === 'register') return;

  const TOKEN_KEY = 'take_one_token';
  const USER_KEY = 'take_one_user';
  const LAST_CONVERSATION_KEY = 'take_one_last_conversation';

  function getChatTarget() {
    const lastConversation = localStorage.getItem(LAST_CONVERSATION_KEY);
    return lastConversation ? `/chat?conversationId=${encodeURIComponent(lastConversation)}` : '/chat';
  }

  function hasLocalSession() {
    return Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(USER_KEY));
  }

  async function fetchSession() {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'same-origin'
      });
      const json = await response.json();

      if (response.ok && json.success && json.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        return true;
      }
    } catch (error) {
      console.warn('Could not verify chat session', error);
    }

    return false;
  }

  async function updateConversationCount(badge) {
    if (!hasLocalSession()) return;

    try {
      const response = await fetch('/api/chat/unread-count', {
        credentials: 'same-origin'
      });
      const json = await response.json();
      const count = json.success && typeof json.count === 'number' ? json.count : 0;

      if (response.ok && json.success && count > 0) {
        badge.textContent = count > 9 ? '9+' : String(count);
        badge.classList.add('is-visible');
      } else {
        badge.classList.remove('is-visible');
      }
    } catch (error) {
      console.warn('Could not load chat unread count', error);
    }
  }

  function buildButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'takeone-chat-fab';
    button.setAttribute('aria-label', 'Open Secure Signal');
    button.innerHTML = `
      <span class="takeone-chat-fab-tooltip" role="tooltip">Open Secure Signal</span>
      <span class="takeone-chat-fab-badge" aria-hidden="true"></span>
      <span class="takeone-chat-fab-ripple" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a8.5 8.5 0 0 1-9 8.45 9.8 9.8 0 0 1-4.18-.96L3 21l1.54-4.56A8.2 8.2 0 0 1 3 12a8.5 8.5 0 0 1 9-8.45A8.5 8.5 0 0 1 21 12Z"></path>
        <path d="M8.5 11.5h7"></path>
        <path d="M8.5 15h4.8"></path>
      </svg>
      <span class="takeone-chat-fab-label">Signal</span>
    `;

    if (window.location.pathname.startsWith('/chat')) {
      button.classList.add('is-chat-page');
    }

    button.addEventListener('click', async () => {
      button.classList.remove('is-rippling');
      void button.offsetWidth;
      button.classList.add('is-rippling');

      if (hasLocalSession() || await fetchSession()) {
        window.location.href = getChatTarget();
        return;
      }

      window.location.href = `/?auth=login&next=${encodeURIComponent(getChatTarget())}`;
    });

    document.body.appendChild(button);
    requestAnimationFrame(() => button.classList.add('is-visible'));
    updateConversationCount(button.querySelector('.takeone-chat-fab-badge'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton, { once: true });
  } else {
    buildButton();
  }
})();
