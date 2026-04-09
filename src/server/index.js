const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const { PermissionFlagsBits } = require('discord.js');

function startServer(discordClient) {
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });

    // Middleware
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }));
    app.use(express.json());

    // WebSocket соединения для каждой гильдии
    const guildConnections = new Map();

    // WebSocket обработчик
    wss.on('connection', (ws, req) => {
        console.log('🔌 Новое WebSocket соединение');

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === 'subscribe' && data.guildId) {
                    // Подписка на обновления гильдии
                    if (!guildConnections.has(data.guildId)) {
                        guildConnections.set(data.guildId, new Set());
                    }
                    guildConnections.get(data.guildId).add(ws);
                    ws.guildId = data.guildId;

                    // Добавляем слушателя к плееру
                    const player = discordClient.getPlayer(data.guildId);
                    const listener = (state) => {
                        broadcastToGuild(data.guildId, { type: 'state', ...state });
                    };
                    player.addListener(listener);
                    ws.playerListener = listener;

                    // Отправляем текущее состояние
                    ws.send(JSON.stringify({ type: 'state', ...player.getState() }));
                }
            } catch (error) {
                console.error('Ошибка обработки WebSocket сообщения:', error);
            }
        });

        ws.on('close', () => {
            if (ws.guildId && guildConnections.has(ws.guildId)) {
                guildConnections.get(ws.guildId).delete(ws);
                
                // Удаляем слушателя плеера
                if (ws.playerListener) {
                    const player = discordClient.getPlayer(ws.guildId);
                    player.removeListener(ws.playerListener);
                }
            }
        });
    });

    // Функция для отправки сообщений всем подключённым клиентам гильдии
    function broadcastToGuild(guildId, data) {
        if (guildConnections.has(guildId)) {
            const message = JSON.stringify(data);
            guildConnections.get(guildId).forEach(ws => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(message);
                }
            });
        }
    }

    // API Routes

    // Получить список гильдий бота
    app.get('/api/guilds', (req, res) => {
        const guilds = discordClient.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
        }));
        res.json(guilds);
    });

    // Получить информацию о гильдии
    app.get('/api/guilds/:guildId', (req, res) => {
        const guild = discordClient.guilds.cache.get(req.params.guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        const voiceChannels = guild.channels.cache
            .filter(channel => channel.type === 2) // Voice channel
            .map(channel => ({
                id: channel.id,
                name: channel.name,
            }));

        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            voiceChannels,
        });
    });

    // Получить состояние плеера
    app.get('/api/guilds/:guildId/player', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        res.json(player.getState());
    });

    // Воспроизвести/добавить трек
    app.post('/api/guilds/:guildId/play', async (req, res) => {
        const { query, channelId } = req.body;
        const guild = discordClient.guilds.cache.get(req.params.guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        const player = discordClient.getPlayer(req.params.guildId);

        const result = await player.addTrack(query);

        if (!result) {
            return res.status(400).json({ error: 'Track not found' });
        }

        const response = { success: true, result };

        // Подключаемся к каналу если указан и не подключены
        if (channelId && !player.isConnected()) {
            const channel = guild.channels.cache.get(channelId);
            if (channel) {
                const me = guild.members.me || await guild.members.fetch(discordClient.user.id);
                const perms = channel.permissionsFor(me);

                if (!perms?.has(PermissionFlagsBits.Connect)) {
                    response.warning = 'Track queued, but bot has no CONNECT permission for this voice channel';
                    return res.status(200).json(response);
                }

                if (!perms?.has(PermissionFlagsBits.Speak)) {
                    response.warning = 'Track queued, but bot has no SPEAK permission for this voice channel';
                    return res.status(200).json(response);
                }

                const connected = await player.connect(channel);
                if (!connected) {
                    response.warning = 'Track queued, but failed to connect to voice channel';
                    return res.status(200).json(response);
                }
            } else {
                response.warning = 'Track queued, but selected voice channel not found';
                return res.status(200).json(response);
            }
        }

        if (!player.isConnected()) {
            response.warning = 'Track queued, but bot is not connected to a voice channel';
            return res.status(200).json(response);
        }

        // Начинаем воспроизведение если плеер не играет
        if (!player.isPlaying) {
            const started = await player.playNext();
            if (!started) {
                response.warning = 'Track queued, but failed to start playback after connecting';
                return res.status(200).json(response);
            }
        }

        res.json(response);
    });

    // Пауза
    app.post('/api/guilds/:guildId/pause', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.pause();
        res.json({ success });
    });

    // Продолжить
    app.post('/api/guilds/:guildId/resume', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.resume();
        res.json({ success });
    });

    // Пропустить
    app.post('/api/guilds/:guildId/skip', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.skip();
        res.json({ success });
    });

    // Остановить
    app.post('/api/guilds/:guildId/stop', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.stop();
        res.json({ success });
    });

    // Перемешать
    app.post('/api/guilds/:guildId/shuffle', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.shuffle();
        res.json({ success });
    });

    // Режим повтора
    app.post('/api/guilds/:guildId/loop', (req, res) => {
        const { mode } = req.body;
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.setLoop(mode);
        res.json({ success });
    });

    // Громкость
    app.post('/api/guilds/:guildId/volume', (req, res) => {
        const { volume } = req.body;
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.setVolume(volume);
        res.json({ success, volume: player.volume });
    });

    // Удалить трек из очереди
    app.delete('/api/guilds/:guildId/queue/:index', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const removed = player.remove(parseInt(req.params.index));
        res.json({ success: !!removed, removed });
    });

    // Очистить очередь
    app.delete('/api/guilds/:guildId/queue', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        const success = player.clearQueue();
        res.json({ success });
    });

    // Подключиться к каналу
    app.post('/api/guilds/:guildId/connect', async (req, res) => {
        const { channelId } = req.body;
        const guild = discordClient.guilds.cache.get(req.params.guildId);

        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel || channel.type !== 2) {
            return res.status(400).json({ error: 'Invalid voice channel' });
        }

        const player = discordClient.getPlayer(req.params.guildId);
        const success = await player.connect(channel);
        res.json({ success });
    });

    // Отключиться от канала
    app.post('/api/guilds/:guildId/disconnect', (req, res) => {
        const player = discordClient.getPlayer(req.params.guildId);
        player.disconnect();
        res.json({ success: true });
    });

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🌐 API сервер запущен на порту ${PORT}`);
        console.log(`📡 WebSocket сервер запущен`);
    });

    return { app, server, wss };
}

module.exports = { startServer };
