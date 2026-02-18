# 🎵 New Genesis ZX Music Bot

Discord музыкальный бот с веб-интерфейсом для управления воспроизведением.

## ✨ Возможности

- 🎶 Воспроизведение музыки из YouTube, Spotify, SoundCloud, Яндекс.Музыка
- 📋 Поддержка плейлистов и YouTube Mix/Radio
- 🔁 Режимы повтора (трек / очередь)
- 🔀 Перемешивание очереди
- 🔊 Регулировка громкости
- 📊 Прогресс-бар воспроизведения
- 🌐 Веб-интерфейс для управления
- 🔄 Обновление в реальном времени через WebSocket
- 📱 Адаптивный дизайн

## 📋 Требования

- Node.js 18+ (рекомендуется 20+)
- npm или yarn
- Discord Bot Token

## 🚀 Установка

### 1. Клонирование и настройка

```bash
# Установка зависимостей бота
npm install

# Установка зависимостей клиента
cd client
npm install
cd ..
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here  # опционально, для быстрой регистрации команд
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Создание Discord бота

1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Создайте новое приложение
3. Перейдите в раздел "Bot" и создайте бота
4. Скопируйте токен в `.env`
5. Включите следующие Intents:
   - `PRESENCE INTENT`
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
6. Скопируйте Client ID из раздела "General Information"

### 4. Приглашение бота на сервер

Используйте эту ссылку (замените `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3147776&scope=bot%20applications.commands
```

## 🏃 Запуск

### Режим разработки (бот + клиент)

```bash
npm run dev:all
```

### Только бот

```bash
npm run dev
```

### Только клиент

```bash
npm run client
```

### Production

```bash
# Бот
npm start

# Клиент (сборка)
cd client
npm run build
```

## 📝 Slash-команды

| Команда | Описание |
|---------|----------|
| `/play <query>` | Воспроизвести трек или добавить в очередь |
| `/pause` | Поставить на паузу |
| `/resume` | Продолжить воспроизведение |
| `/skip` | Пропустить текущий трек |
| `/stop` | Остановить и очистить очередь |
| `/queue` | Показать очередь |
| `/nowplaying` | Показать текущий трек |
| `/shuffle` | Перемешать очередь |
| `/loop <mode>` | Режим повтора (off/track/queue) |
| `/volume <level>` | Установить громкость (0-200%) |
| `/leave` | Отключиться от канала |

## 🌐 Веб-интерфейс

После запуска откройте в браузере:

```
http://localhost:5173
```

### Возможности веб-интерфейса:

- Выбор сервера из списка
- Выбор голосового канала
- Поиск и добавление треков
- Управление воспроизведением (пауза, пропуск, стоп)
- Регулировка громкости
- Прогресс-бар текущего трека
- Просмотр и управление очередью
- Режимы повтора
- Перемешивание

## 📁 Структура проекта

```
NewGenesisZXBot/
├── src/
│   ├── index.js           # Точка входа бота
│   ├── commands/
│   │   ├── index.js       # Загрузчик команд
│   │   └── slash/         # Slash-команды
│   │       ├── play.js
│   │       ├── pause.js
│   │       ├── resume.js
│   │       ├── skip.js
│   │       ├── stop.js
│   │       ├── queue.js
│   │       ├── shuffle.js
│   │       ├── loop.js
│   │       ├── nowplaying.js
│   │       ├── volume.js
│   │       └── leave.js
│   ├── music/
│   │   └── player.js      # Музыкальный плеер
│   └── server/
│       └── index.js       # Express + WebSocket сервер
├── client/                # React приложение
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js         # API клиент
│   │   └── components/
│   │       ├── GuildList.jsx
│   │       └── Dashboard.jsx
│   ├── package.json
│   └── vite.config.js
├── package.json
├── .env.example
└── README.md
```

## 🔧 API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/guilds` | Список серверов |
| GET | `/api/guilds/:id` | Информация о сервере |
| GET | `/api/guilds/:id/player` | Состояние плеера |
| POST | `/api/guilds/:id/play` | Добавить трек |
| POST | `/api/guilds/:id/pause` | Пауза |
| POST | `/api/guilds/:id/resume` | Продолжить |
| POST | `/api/guilds/:id/skip` | Пропустить |
| POST | `/api/guilds/:id/stop` | Остановить |
| POST | `/api/guilds/:id/shuffle` | Перемешать |
| POST | `/api/guilds/:id/loop` | Режим повтора |
| POST | `/api/guilds/:id/volume` | Установить громкость |
| POST | `/api/guilds/:id/connect` | Подключиться к каналу |
| POST | `/api/guilds/:id/disconnect` | Отключиться |
| DELETE | `/api/guilds/:id/queue/:index` | Удалить из очереди |
| DELETE | `/api/guilds/:id/queue` | Очистить очередь |

## 🔌 WebSocket

Подключение: `ws://localhost:3001`

Подписка на обновления:
```json
{ "type": "subscribe", "guildId": "YOUR_GUILD_ID" }
```

## ⚠️ Возможные проблемы

### FFmpeg не найден
FFmpeg включён в проект через `ffmpeg-static`, дополнительная установка не требуется.

### Ошибки воспроизведения YouTube
Бот использует `yt-dlp-exec` для загрузки аудио. Если возникают проблемы:
```bash
npm update yt-dlp-exec
```

### Ошибки opus/sodium
```bash
npm rebuild
```

### Порт уже занят
Если порт 3001 занят:
```powershell
# Windows
Get-Process -Name node | Stop-Process -Force
```

## 🛠️ Технологии

- **Discord.js 14** - Discord API
- **@discordjs/voice** - Голосовые соединения
- **yt-dlp-exec** - Загрузка аудио YouTube
- **ffmpeg-static** - Обработка аудио
- **play-dl** - Поиск и метаданные
- **Express** - REST API
- **WebSocket (ws)** - Реалтайм обновления
- **React 18 + Vite** - Веб-интерфейс
- **Tailwind CSS** - Стилизация

## ⚠️ Disclaimer

This project is for **educational and personal use only**.

- The developers are not responsible for any misuse of this software
- Users are responsible for complying with the Terms of Service of third-party platforms (YouTube, Spotify, SoundCloud, Yandex Music, etc.)
- This software should not be used for commercial purposes
- Respect copyright laws in your jurisdiction
- The bot does not store or distribute copyrighted content

**Данный проект предназначен только для образовательных целей и личного использования.** Разработчики не несут ответственности за неправомерное использование. Соблюдайте законодательство об авторских правах.

## 📄 Лицензия

MIT
