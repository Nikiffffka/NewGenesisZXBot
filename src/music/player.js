const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType,
} = require('@discordjs/voice');
const play = require('play-dl');
const { spawn } = require('child_process');
const { raw: ytdlp } = require('yt-dlp-exec');
const path = require('path');

// Устанавливаем путь к FFmpeg
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

// Путь к yt-dlp
const ytdlpBinary = path.join(__dirname, '../../node_modules/yt-dlp-exec/bin/yt-dlp.exe');

class MusicPlayer {
    constructor(guildId) {
        this.guildId = guildId;
        this.queue = [];
        this.currentTrack = null;
        this.connection = null;
        this.player = createAudioPlayer();
        this.isPlaying = false;
        this.isPaused = false;
        this.volume = 100;
        this.loopMode = 'off'; // 'off', 'track', 'queue'
        this.listeners = [];

        // Обработка событий плеера
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.handleTrackEnd();
        });

        this.player.on('error', (error) => {
            console.error('Ошибка плеера:', error);
            this.handleTrackEnd();
        });
    }

    // Добавить слушателя для обновлений состояния
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Удалить слушателя
    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    // Уведомить всех слушателей об изменении состояния
    notifyListeners() {
        const state = this.getState();
        this.listeners.forEach(callback => callback(state));
    }

    // Получить текущее состояние плеера
    getState() {
        return {
            guildId: this.guildId,
            currentTrack: this.currentTrack,
            queue: this.queue,
            isPlaying: this.isPlaying,
            isPaused: this.isPaused,
            volume: this.volume,
            loopMode: this.loopMode,
            progress: this.getProgress(),
        };
    }

    // Получить прогресс воспроизведения в секундах
    getProgress() {
        if (!this.isPlaying || !this.startTime || !this.currentTrack) {
            return 0;
        }
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        return Math.min(elapsed, this.currentTrack.duration || elapsed);
    }

    // Подключиться к голосовому каналу
    async connect(channel) {
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        try {
            await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
            this.connection.subscribe(this.player);
            return true;
        } catch (error) {
            console.error('Ошибка подключения к каналу:', error);
            this.connection.destroy();
            this.connection = null;
            return false;
        }
    }

    // Отключиться от голосового канала
    disconnect() {
        this.killCurrentProcesses();
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTrack = null;
        this.queue = [];
        this.notifyListeners();
    }

    // Получить информацию о треке через yt-dlp (работает с SoundCloud, Bandcamp и др.)
    async getTrackInfoWithYtDlp(url) {
        return new Promise((resolve, reject) => {
            const args = [
                '--dump-json',
                '--no-playlist',
                '--no-warnings',
                url
            ];

            const ytDlpProcess = spawn(ytdlpBinary, args);
            let output = '';
            let errorOutput = '';

            ytDlpProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            ytDlpProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            ytDlpProcess.on('close', (code) => {
                if (code === 0 && output.trim()) {
                    try {
                        const info = JSON.parse(output);
                        resolve({
                            title: info.title || info.track || 'Unknown',
                            url: url, // Используем оригинальный URL
                            duration: info.duration || 0,
                            thumbnail: info.thumbnail || null,
                            author: info.uploader || info.artist || info.channel || 'Unknown',
                        });
                    } catch (e) {
                        reject(new Error('Failed to parse track info'));
                    }
                } else {
                    reject(new Error(errorOutput || 'Failed to get track info'));
                }
            });

            ytDlpProcess.on('error', (err) => {
                reject(err);
            });

            // Таймаут
            setTimeout(() => {
                ytDlpProcess.kill();
                reject(new Error('Timeout getting track info'));
            }, 15000);
        });
    }

    // Получить информацию о Spotify треке через oEmbed API
    async getSpotifyTrackInfo(url) {
        return new Promise(async (resolve, reject) => {
            try {
                // Spotify oEmbed API не требует авторизации
                const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
                const response = await fetch(oembedUrl);
                
                if (!response.ok) {
                    reject(new Error('Failed to fetch Spotify oEmbed'));
                    return;
                }
                
                const data = await response.json();
                // data.title обычно в формате "Track Name - Artist Name"
                const titleParts = data.title ? data.title.split(' - ') : ['Unknown', 'Unknown'];
                
                resolve({
                    title: titleParts[0] || 'Unknown',
                    artist: titleParts[1] || titleParts[0] || 'Unknown',
                    thumbnail: data.thumbnail_url || null,
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // Получить информацию о треке с Яндекс.Музыки через API
    async getYandexMusicInfo(url) {
        return new Promise(async (resolve, reject) => {
            try {
                // Извлекаем trackId из URL
                // Форматы: /album/123/track/456 или /track/456
                const trackMatch = url.match(/track\/(\d+)/);
                const albumMatch = url.match(/album\/(\d+)/);
                
                if (!trackMatch) {
                    reject(new Error('Cannot extract track ID from URL'));
                    return;
                }
                
                const trackId = trackMatch[1];
                const albumId = albumMatch ? albumMatch[1] : null;
                
                console.log(`Яндекс.Музыка: trackId=${trackId}, albumId=${albumId}`);
                
                // Пробуем получить данные через handlers API
                const apiUrl = `https://music.yandex.ru/handlers/track.jsx?track=${trackId}${albumId ? `:${albumId}` : ''}`;
                
                const response = await fetch(apiUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/javascript, */*; q=0.01',
                        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Referer': 'https://music.yandex.ru/',
                    }
                });
                
                let title = 'Unknown';
                let artist = 'Unknown';
                let thumbnail = null;
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.track) {
                        title = data.track.title || 'Unknown';
                        if (data.track.artists && data.track.artists.length > 0) {
                            artist = data.track.artists.map(a => a.name).join(', ');
                        }
                        if (data.track.coverUri) {
                            thumbnail = `https://${data.track.coverUri.replace('%%', '400x400')}`;
                        }
                    }
                }
                
                // Если API не сработало, пробуем альтернативный метод через oEmbed
                if (title === 'Unknown') {
                    try {
                        const oembedUrl = `https://music.yandex.ru/oembed?url=${encodeURIComponent(url)}&format=json`;
                        const oembedResponse = await fetch(oembedUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            }
                        });
                        
                        if (oembedResponse.ok) {
                            const oembedData = await oembedResponse.json();
                            if (oembedData.title) {
                                // Формат обычно "Название — Исполнитель"
                                const parts = oembedData.title.split(/\s*[—–-]\s*/);
                                if (parts.length >= 2) {
                                    title = parts[0].trim();
                                    artist = parts.slice(1).join(' - ').trim();
                                } else {
                                    title = oembedData.title;
                                }
                            }
                            if (oembedData.thumbnail_url) {
                                thumbnail = oembedData.thumbnail_url;
                            }
                        }
                    } catch (e) {
                        console.log('oEmbed также не сработал:', e.message);
                    }
                }
                
                // Если всё ещё Unknown, используем ID для поиска
                if (title === 'Unknown') {
                    // Последняя попытка - просто вернём ID как часть поискового запроса
                    console.log('Не удалось получить данные, попробуем поиск по ID');
                    title = `yandex track ${trackId}`;
                    artist = '';
                }
                
                console.log(`Яндекс.Музыка: найден трек "${title}" - ${artist}`);
                
                resolve({
                    title: title,
                    artist: artist,
                    thumbnail: thumbnail,
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    // Загрузить плейлист через yt-dlp (работает с YouTube Mix/Radio)
    async loadPlaylistWithYtDlp(url, maxTracks = 50) {
        return new Promise((resolve, reject) => {
            const args = [
                '--flat-playlist',
                '--dump-json',
                '-i',
                '--no-warnings',
                `--playlist-end=${maxTracks}`,
                url
            ];

            const ytDlpProcess = spawn(ytdlpBinary, args);
            const tracks = [];
            let buffer = '';

            ytDlpProcess.stdout.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Оставляем неполную строку в буфере
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const info = JSON.parse(line);
                            if (info.url || info.id) {
                                tracks.push({
                                    title: info.title || 'Unknown',
                                    url: info.url || `https://www.youtube.com/watch?v=${info.id}`,
                                    duration: info.duration || 0,
                                    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || null,
                                    author: info.uploader || info.channel || 'Unknown',
                                });
                            }
                        } catch (e) {
                            // Игнорируем ошибки парсинга
                        }
                    }
                }
            });

            ytDlpProcess.stderr.on('data', (data) => {
                // Игнорируем предупреждения
            });

            ytDlpProcess.on('close', (code) => {
                // Обрабатываем последнюю строку
                if (buffer.trim()) {
                    try {
                        const info = JSON.parse(buffer);
                        if (info.url || info.id) {
                            tracks.push({
                                title: info.title || 'Unknown',
                                url: info.url || `https://www.youtube.com/watch?v=${info.id}`,
                                duration: info.duration || 0,
                                thumbnail: info.thumbnail || null,
                                author: info.uploader || info.channel || 'Unknown',
                            });
                        }
                    } catch (e) {}
                }
                resolve(tracks);
            });

            ytDlpProcess.on('error', (err) => {
                reject(err);
            });

            // Таймаут на случай зависания
            setTimeout(() => {
                ytDlpProcess.kill();
                resolve(tracks);
            }, 30000);
        });
    }

    // Добавить трек в очередь
    async addTrack(query) {
        try {
            let trackInfo;

            console.log('Добавление трека:', query);

            // Проверяем, является ли это YouTube URL
            const isYouTubeUrl = query.includes('youtube.com') || query.includes('youtu.be');
            
            // Проверяем на плейлист
            const listMatch = query.match(/[?&]list=([^&]+)/);
            const isPlaylist = listMatch !== null;
            const isMixPlaylist = listMatch && listMatch[1].startsWith('RD');
            
            if (isYouTubeUrl && !isPlaylist) {
                // Обычное YouTube видео
                try {
                    const info = await play.video_info(query);
                    trackInfo = {
                        title: info.video_details.title || 'Unknown Title',
                        url: info.video_details.url || query,
                        duration: info.video_details.durationInSec || 0,
                        thumbnail: info.video_details.thumbnails?.[0]?.url || null,
                        author: info.video_details.channel?.name || 'Unknown',
                    };
                } catch (e) {
                    console.log('Не удалось получить info, используем URL напрямую');
                    // Если не удалось получить инфо, используем URL напрямую
                    trackInfo = {
                        title: 'YouTube Video',
                        url: query,
                        duration: 0,
                        thumbnail: null,
                        author: 'Unknown',
                    };
                }
            } else if (isYouTubeUrl && isPlaylist) {
                // YouTube плейлист (включая Mix/Radio) - используем yt-dlp
                try {
                    console.log(isMixPlaylist ? 'Загрузка YouTube Mix...' : 'Загрузка плейлиста...');
                    const tracks = await this.loadPlaylistWithYtDlp(query, isMixPlaylist ? 25 : 100);
                    
                    if (tracks.length > 0) {
                        for (const track of tracks) {
                            this.queue.push(track);
                        }
                        
                        this.notifyListeners();
                        return { 
                            type: isMixPlaylist ? 'mix' : 'playlist', 
                            count: tracks.length, 
                            name: isMixPlaylist ? 'YouTube Mix' : 'Playlist' 
                        };
                    } else {
                        // Если не удалось загрузить плейлист, пробуем как одно видео
                        const videoIdMatch = query.match(/[?&]v=([^&]+)/);
                        if (videoIdMatch) {
                            query = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
                            console.log('Плейлист пуст, воспроизводим одно видео:', query);
                            trackInfo = {
                                title: 'YouTube Video',
                                url: query,
                                duration: 0,
                                thumbnail: null,
                                author: 'Unknown',
                            };
                        }
                    }
                } catch (e) {
                    console.error('Ошибка загрузки плейлиста:', e);
                    return null;
                }
            } else if (query.includes('spotify.com')) {
                // Spotify URL - получаем информацию и ищем на YouTube
                try {
                    console.log('Обработка Spotify ссылки...');
                    // Извлекаем ID трека из URL
                    const trackIdMatch = query.match(/track\/([a-zA-Z0-9]+)/);
                    if (trackIdMatch) {
                        // Используем yt-dlp для получения информации о Spotify треке
                        // yt-dlp может извлечь метаданные из embed-страницы Spotify
                        const spotifyInfo = await this.getSpotifyTrackInfo(query);
                        if (spotifyInfo) {
                            // Ищем трек на YouTube
                            const searchQuery = `${spotifyInfo.title} ${spotifyInfo.artist}`;
                            console.log('Поиск на YouTube:', searchQuery);
                            const searched = await play.search(searchQuery, { limit: 1 });
                            if (searched[0]) {
                                trackInfo = {
                                    title: spotifyInfo.title,
                                    url: searched[0].url,
                                    duration: searched[0].durationInSec || 0,
                                    thumbnail: spotifyInfo.thumbnail || searched[0].thumbnails?.[0]?.url || null,
                                    author: spotifyInfo.artist,
                                };
                            }
                        }
                    }
                } catch (e) {
                    console.error('Ошибка Spotify:', e);
                }
            } else if (query.includes('soundcloud.com')) {
                // SoundCloud URL - используем yt-dlp
                try {
                    console.log('Загрузка SoundCloud трека через yt-dlp...');
                    trackInfo = await this.getTrackInfoWithYtDlp(query);
                } catch (e) {
                    console.error('Ошибка SoundCloud:', e);
                }
            } else if (query.includes('music.yandex.ru') || query.includes('music.yandex.com')) {
                // Яндекс.Музыка URL - парсим страницу и ищем на YouTube
                try {
                    console.log('Обработка ссылки Яндекс.Музыки...');
                    const yandexInfo = await this.getYandexMusicInfo(query);
                    if (yandexInfo && yandexInfo.title !== 'Unknown') {
                        const searchQuery = `${yandexInfo.title} ${yandexInfo.artist}`;
                        console.log('Поиск на YouTube:', searchQuery);
                        const searched = await play.search(searchQuery, { limit: 1 });
                        if (searched[0]) {
                            trackInfo = {
                                title: yandexInfo.title,
                                url: searched[0].url,
                                duration: searched[0].durationInSec || 0,
                                thumbnail: yandexInfo.thumbnail || searched[0].thumbnails?.[0]?.url || null,
                                author: yandexInfo.artist,
                            };
                        }
                    }
                } catch (e) {
                    console.error('Ошибка Яндекс.Музыки:', e);
                }
            } else {
                // Поиск на YouTube
                const searched = await play.search(query, { limit: 1 });
                if (searched[0] && searched[0].url) {
                    trackInfo = {
                        title: searched[0].title || 'Unknown Title',
                        url: searched[0].url,
                        duration: searched[0].durationInSec || 0,
                        thumbnail: searched[0].thumbnails?.[0]?.url || null,
                        author: searched[0].channel?.name || 'Unknown',
                    };
                }
            }

            if (trackInfo && trackInfo.url) {
                this.queue.push(trackInfo);
                this.notifyListeners();
                return { type: 'track', track: trackInfo };
            }

            console.log('Не удалось найти трек для:', query);
            return null;
        } catch (error) {
            console.error('Ошибка добавления трека:', error);
            return null;
        }
    }

    // Воспроизвести следующий трек
    async playNext() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            this.currentTrack = null;
            this.notifyListeners();
            return false;
        }

        const track = this.queue.shift();
        
        // Проверяем что URL существует
        if (!track || !track.url) {
            console.error('Трек не имеет URL:', track);
            return this.playNext();
        }

        this.currentTrack = track;
        this.startTime = Date.now(); // Время начала воспроизведения

        try {
            console.log('Воспроизведение:', track.title, '-', track.url);
            
            // Убиваем предыдущие процессы если есть
            this.killCurrentProcesses();
            
            let resource;
            
            // Используем yt-dlp для YouTube
            if (track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
                // Запускаем yt-dlp для получения лучшего качества аудио
                this.ytdlpProcess = spawn(ytdlpBinary, [
                    '-f', 'bestaudio[acodec=opus]/bestaudio/best',
                    '-o', '-',
                    '--quiet',
                    '--no-warnings',
                    '--no-playlist',
                    track.url
                ]);

                // Прогоняем через FFmpeg для конвертации в высоком качестве
                this.ffmpegProcess = spawn(ffmpegPath, [
                    '-i', 'pipe:0',
                    '-analyzeduration', '0',
                    '-loglevel', '0',
                    '-acodec', 'pcm_s16le',
                    '-f', 's16le',
                    '-ar', '48000',
                    '-ac', '2',
                    '-af', `volume=${this.volume / 100}`,
                    'pipe:1'
                ]);

                // Обработка ошибок потоков
                this.ytdlpProcess.stdout.on('error', () => {});
                this.ffmpegProcess.stdin.on('error', () => {});
                this.ffmpegProcess.stdout.on('error', () => {});

                this.ytdlpProcess.stdout.pipe(this.ffmpegProcess.stdin);

                resource = createAudioResource(this.ffmpegProcess.stdout, {
                    inputType: StreamType.Raw,
                    inlineVolume: false,
                });

                this.ytdlpProcess.stderr.on('data', (data) => {
                    const msg = data.toString();
                    if (msg.trim()) console.error('yt-dlp error:', msg);
                });

                this.ffmpegProcess.stderr.on('data', (data) => {
                    const msg = data.toString();
                    if (msg.trim()) console.error('ffmpeg error:', msg);
                });

                this.ytdlpProcess.on('error', () => {});
                this.ffmpegProcess.on('error', () => {});
            } else if (track.url.includes('soundcloud.com')) {
                // SoundCloud - тоже используем yt-dlp
                this.ytdlpProcess = spawn(ytdlpBinary, [
                    '-f', 'bestaudio/best',
                    '-o', '-',
                    '--quiet',
                    '--no-warnings',
                    track.url
                ]);

                this.ffmpegProcess = spawn(ffmpegPath, [
                    '-i', 'pipe:0',
                    '-analyzeduration', '0',
                    '-loglevel', '0',
                    '-acodec', 'pcm_s16le',
                    '-f', 's16le',
                    '-ar', '48000',
                    '-ac', '2',
                    '-af', `volume=${this.volume / 100}`,
                    'pipe:1'
                ]);

                this.ytdlpProcess.stdout.on('error', () => {});
                this.ffmpegProcess.stdin.on('error', () => {});
                this.ffmpegProcess.stdout.on('error', () => {});

                this.ytdlpProcess.stdout.pipe(this.ffmpegProcess.stdin);

                resource = createAudioResource(this.ffmpegProcess.stdout, {
                    inputType: StreamType.Raw,
                    inlineVolume: false,
                });

                this.ytdlpProcess.on('error', () => {});
                this.ffmpegProcess.on('error', () => {});
            } else {
                // Для других источников используем play-dl
                const playStream = await play.stream(track.url);
                resource = createAudioResource(playStream.stream, {
                    inputType: playStream.type,
                });
            }

            this.player.play(resource);
            this.isPlaying = true;
            this.isPaused = false;
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Ошибка воспроизведения:', error);
            this.killCurrentProcesses();
            return this.playNext();
        }
    }

    // Убить текущие процессы воспроизведения
    killCurrentProcesses() {
        try {
            if (this.ytdlpProcess) {
                this.ytdlpProcess.kill('SIGKILL');
                this.ytdlpProcess = null;
            }
            if (this.ffmpegProcess) {
                this.ffmpegProcess.kill('SIGKILL');
                this.ffmpegProcess = null;
            }
        } catch (e) {
            // Игнорируем ошибки при убийстве процессов
        }
    }

    // Обработка окончания трека
    handleTrackEnd() {
        this.killCurrentProcesses();
        
        if (this.loopMode === 'track' && this.currentTrack) {
            this.queue.unshift(this.currentTrack);
        } else if (this.loopMode === 'queue' && this.currentTrack) {
            this.queue.push(this.currentTrack);
        }
        
        this.playNext();
    }

    // Пауза
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.player.pause();
            this.isPaused = true;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    // Продолжить воспроизведение
    resume() {
        if (this.isPaused) {
            this.player.unpause();
            this.isPaused = false;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    // Пропустить трек
    skip() {
        if (this.loopMode === 'track') {
            this.loopMode = 'off';
        }
        this.killCurrentProcesses();
        this.player.stop();
        return true;
    }

    // Остановить воспроизведение
    stop() {
        this.queue = [];
        this.currentTrack = null;
        this.killCurrentProcesses();
        this.player.stop();
        this.isPlaying = false;
        this.isPaused = false;
        this.notifyListeners();
        return true;
    }

    // Перемешать очередь
    shuffle() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        this.notifyListeners();
        return true;
    }

    // Удалить трек из очереди по индексу
    remove(index) {
        if (index >= 0 && index < this.queue.length) {
            const removed = this.queue.splice(index, 1)[0];
            this.notifyListeners();
            return removed;
        }
        return null;
    }

    // Очистить очередь
    clearQueue() {
        this.queue = [];
        this.notifyListeners();
        return true;
    }

    // Установить режим повтора
    setLoop(mode) {
        if (['off', 'track', 'queue'].includes(mode)) {
            this.loopMode = mode;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    // Установить громкость (0-200)
    setVolume(vol) {
        const newVolume = Math.max(0, Math.min(200, parseInt(vol)));
        this.volume = newVolume;
        this.notifyListeners();
        return true;
    }

    // Переместить трек в очереди
    move(from, to) {
        if (from >= 0 && from < this.queue.length && to >= 0 && to < this.queue.length) {
            const [track] = this.queue.splice(from, 1);
            this.queue.splice(to, 0, track);
            this.notifyListeners();
            return true;
        }
        return false;
    }
}

module.exports = { MusicPlayer };
