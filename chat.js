const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const menu = $('.menu-toggle');
const links = $('.nav-links');
if (menu && links) {
  menu.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(isOpen));
  });

  $$('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

$$('.reveal').forEach((element) => observer.observe(element));

const shell = $('.demo-shell');
const selectedLabel = $('#selected-label');
const status = $('#demo-status');
const demoKeys = $$('.demo-key');
const buttons = $$('.key-buttons button');
let activeKey = null;

function setActiveKey(keyNumber) {
  activeKey = keyNumber;
  demoKeys.forEach((key) => {
    const current = Number(key.dataset.key);
    key.classList.toggle('active', current === keyNumber);
    key.classList.toggle('is-folded', current !== keyNumber);
  });

  selectedLabel.textContent = String(keyNumber).padStart(2, '0');
  status.textContent = `Sleutel ${String(keyNumber).padStart(2, '0')} staat in gebruikspositie`;
  shell.classList.add('open');
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    buttons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    setActiveKey(Number(button.dataset.key));
  });
});

$('#collapse')?.addEventListener('click', () => {
  buttons.forEach((btn) => btn.classList.remove('active'));
  demoKeys.forEach((key) => {
    key.classList.remove('active');
    key.classList.add('is-folded');
  });
  activeKey = null;
  selectedLabel.textContent = '00';
  status.textContent = 'Systeem opgeborgen — kies opnieuw';
});

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = $(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const chat = $('#chat');
const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const chatForm = $('#chat-form');
const chatFab = $('#chat-fab');
const closeChat = $('#close-chat');
const openChat = $('#open-chat');

const history = [
  { role: 'assistant', content: 'Hoi. Ik ben JOKEYO AI. Vraag me alles over het concept, de werking of het design.' }
];

function addMessage(text, type) {
  const node = document.createElement('div');
  node.className = `bubble ${type}`;
  node.textContent = text;
  chatMessages.appendChild(node);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return node;
}

function toggleChat(force) {
  if (!chat) return;
  chat.classList.toggle('open', force !== undefined ? force : !chat.classList.contains('open'));
}

chatFab?.addEventListener('click', () => toggleChat(true));
openChat?.addEventListener('click', () => { toggleChat(true); chatInput?.focus(); });
closeChat?.addEventListener('click', () => toggleChat(false));

chatForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  history.push({ role: 'user', content: text });
  chatInput.value = '';

  const typing = addMessage('JOKEYO AI denkt mee…', 'bot typing');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12) })
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    typing.remove();
    addMessage(data.reply || 'Ik begrijp je vraag. JOKEYO is een compact mechanisch sleutelsysteem.', 'bot');
    history.push({ role: 'assistant', content: data.reply || 'Ik begrijp je vraag.' });
  } catch (error) {
    typing.remove();
    addMessage('Ik kan momenteel geen verbinding maken met de chatservice. Probeer het later opnieuw of bekijk de FAQ.', 'bot');
  }
});
