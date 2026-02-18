const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = {
  // Получить список гильдий
  async getGuilds() {
    const response = await fetch(`${API_URL}/api/guilds`);
    return response.json();
  },

  // Получить информацию о гильдии
  async getGuild(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}`);
    return response.json();
  },

  // Получить состояние плеера
  async getPlayerState(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/player`);
    return response.json();
  },

  // Воспроизвести трек
  async play(guildId, query, channelId = null) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, channelId }),
    });
    return response.json();
  },

  // Пауза
  async pause(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/pause`, {
      method: 'POST',
    });
    return response.json();
  },

  // Продолжить
  async resume(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/resume`, {
      method: 'POST',
    });
    return response.json();
  },

  // Пропустить
  async skip(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/skip`, {
      method: 'POST',
    });
    return response.json();
  },

  // Остановить
  async stop(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/stop`, {
      method: 'POST',
    });
    return response.json();
  },

  // Перемешать
  async shuffle(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/shuffle`, {
      method: 'POST',
    });
    return response.json();
  },

  // Режим повтора
  async setLoop(guildId, mode) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/loop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return response.json();
  },

  // Громкость
  async setVolume(guildId, volume) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/volume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume }),
    });
    return response.json();
  },

  // Удалить трек из очереди
  async removeFromQueue(guildId, index) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/queue/${index}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Очистить очередь
  async clearQueue(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/queue`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Подключиться к каналу
  async connect(guildId, channelId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    return response.json();
  },

  // Отключиться от канала
  async disconnect(guildId) {
    const response = await fetch(`${API_URL}/api/guilds/${guildId}/disconnect`, {
      method: 'POST',
    });
    return response.json();
  },
};

// WebSocket соединение
export function createWebSocket(guildId, onMessage) {
  const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001').replace('http', 'ws');
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', guildId }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket ошибка:', error);
  };

  return ws;
}
