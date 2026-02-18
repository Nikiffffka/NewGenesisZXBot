# 🎵 New Genesis Music Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14-blue.svg)](https://discord.js.org/)

**[🇷🇺 Русская версия](README.ru.md)**

Discord music bot with a modern React web interface for playback control.

## ✨ Features

- 🎶 Play music from YouTube, Spotify, SoundCloud, Yandex Music
- 📋 Support for playlists and YouTube Mix/Radio
- 🔁 Loop modes (track / queue)
- 🔀 Queue shuffle
- 🔊 Volume control
- 📊 Playback progress bar
- 🌐 Web interface for control
- 🔄 Real-time updates via WebSocket
- 📱 Responsive design

## 📋 Requirements

- Node.js 18+ (20+ recommended)
- npm or yarn
- Discord Bot Token

## 🚀 Installation

### 1. Clone and setup

```bash
# Clone repository
git clone https://github.com/Nikiffffka/NewGenesisZXBot.git
cd NewGenesisZXBot

# Install bot dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here  # optional, for quick command registration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Create Discord bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the token to `.env`
5. Enable the following Intents:
   - `PRESENCE INTENT`
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
6. Copy Client ID from "General Information" section

### 4. Invite bot to server

Use this link (replace `YOUR_CLIENT_ID`):

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=3147776&scope=bot%20applications.commands
```

## 🏃 Running

### Development mode (bot + client)

```bash
npm run dev:all
```

### Bot only

```bash
npm run dev
```

### Client only

```bash
npm run client
```

### Production

```bash
# Bot
npm start

# Client (build)
cd client
npm run build
```

## 📝 Slash Commands

| Command | Description |
|---------|-------------|
| `/play <query>` | Play a track or add to queue |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/skip` | Skip current track |
| `/stop` | Stop and clear queue |
| `/queue` | Show queue |
| `/nowplaying` | Show current track |
| `/shuffle` | Shuffle queue |
| `/loop <mode>` | Loop mode (off/track/queue) |
| `/volume <level>` | Set volume (0-200%) |
| `/leave` | Disconnect from channel |

## 🌐 Web Interface

After starting, open in browser:

```
http://localhost:5173
```

### Web interface features:

- Server selection
- Voice channel selection
- Search and add tracks
- Playback control (pause, skip, stop)
- Volume control
- Current track progress bar
- Queue view and management
- Loop modes
- Shuffle

## 📁 Project Structure

```
NewGenesisZXBot/
├── src/
│   ├── index.js           # Bot entry point
│   ├── commands/
│   │   ├── index.js       # Command loader
│   │   └── slash/         # Slash commands
│   ├── music/
│   │   └── player.js      # Music player
│   └── server/
│       └── index.js       # Express + WebSocket server
├── client/                # React application
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── components/
│   ├── package.json
│   └── vite.config.js
├── package.json
├── .env.example
└── README.md
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/guilds` | List of servers |
| GET | `/api/guilds/:id` | Server info |
| GET | `/api/guilds/:id/player` | Player state |
| POST | `/api/guilds/:id/play` | Add track |
| POST | `/api/guilds/:id/pause` | Pause |
| POST | `/api/guilds/:id/resume` | Resume |
| POST | `/api/guilds/:id/skip` | Skip |
| POST | `/api/guilds/:id/stop` | Stop |
| POST | `/api/guilds/:id/shuffle` | Shuffle |
| POST | `/api/guilds/:id/loop` | Loop mode |
| POST | `/api/guilds/:id/volume` | Set volume |
| POST | `/api/guilds/:id/connect` | Connect to channel |
| POST | `/api/guilds/:id/disconnect` | Disconnect |
| DELETE | `/api/guilds/:id/queue/:index` | Remove from queue |
| DELETE | `/api/guilds/:id/queue` | Clear queue |

## 🔌 WebSocket

Connection: `ws://localhost:3001`

Subscribe to updates:
```json
{ "type": "subscribe", "guildId": "YOUR_GUILD_ID" }
```

## ⚠️ Troubleshooting

### FFmpeg not found
FFmpeg is included via `ffmpeg-static`, no additional installation required.

### YouTube playback errors
The bot uses `yt-dlp-exec` for audio. If issues occur:
```bash
npm update yt-dlp-exec
```

### Opus/sodium errors
```bash
npm rebuild
```

### Port already in use
If port 3001 is busy:
```powershell
# Windows
Get-Process -Name node | Stop-Process -Force
```

## 🛠️ Technologies

- **Discord.js 14** - Discord API
- **@discordjs/voice** - Voice connections
- **yt-dlp-exec** - YouTube audio download
- **ffmpeg-static** - Audio processing
- **play-dl** - Search and metadata
- **Express** - REST API
- **WebSocket (ws)** - Real-time updates
- **React 18 + Vite** - Web interface
- **Tailwind CSS** - Styling

## ⚠️ Disclaimer

This project is for **educational and personal use only**.

- The developers are not responsible for any misuse of this software
- Users are responsible for complying with the Terms of Service of third-party platforms (YouTube, Spotify, SoundCloud, Yandex Music, etc.)
- This software should not be used for commercial purposes
- Respect copyright laws in your jurisdiction
- The bot does not store or distribute copyrighted content

## 📄 License

MIT