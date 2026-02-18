import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipForward, 
  Square, 
  Shuffle, 
  Repeat, 
  Repeat1,
  Volume2,
  VolumeX,
  Music,
  Trash2,
  LogOut,
  Search
} from 'lucide-react'
import { api, createWebSocket } from '../api'

function Dashboard() {
  const { guildId } = useParams()
  const [guild, setGuild] = useState(null)
  const [playerState, setPlayerState] = useState({
    currentTrack: null,
    queue: [],
    isPlaying: false,
    isPaused: false,
    loopMode: 'off',
    volume: 100,
    progress: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localProgress, setLocalProgress] = useState(0)
  const progressInterval = useRef(null)

  useEffect(() => {
    loadGuild()
    
    // WebSocket соединение
    const ws = createWebSocket(guildId, (data) => {
      if (data.type === 'state') {
        setPlayerState({
          currentTrack: data.currentTrack,
          queue: data.queue,
          isPlaying: data.isPlaying,
          isPaused: data.isPaused,
          loopMode: data.loopMode,
          volume: data.volume || 100,
          progress: data.progress || 0,
        })
        setLocalProgress(data.progress || 0)
      }
    })

    return () => {
      ws.close()
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [guildId])

  // Локальное обновление прогресса
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current)
    
    if (playerState.isPlaying && !playerState.isPaused) {
      progressInterval.current = setInterval(() => {
        setLocalProgress(prev => {
          const duration = playerState.currentTrack?.duration || 0
          if (prev >= duration) return prev
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [playerState.isPlaying, playerState.isPaused, playerState.currentTrack])

  async function loadGuild() {
    try {
      setLoading(true)
      const [guildData, state] = await Promise.all([
        api.getGuild(guildId),
        api.getPlayerState(guildId),
      ])
      setGuild(guildData)
      setPlayerState(state)
      setLocalProgress(state.progress || 0)
      if (guildData.voiceChannels?.length > 0) {
        setSelectedChannel(guildData.voiceChannels[0].id)
      }
    } catch (err) {
      setError('Не удалось загрузить данные сервера')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handlePlay(e) {
    e.preventDefault()
    if (!searchQuery.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await api.play(guildId, searchQuery, selectedChannel)
      if (result.success) {
        setSearchQuery('')
      }
    } catch (err) {
      console.error('Ошибка воспроизведения:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePauseResume() {
    if (playerState.isPaused) {
      await api.resume(guildId)
    } else {
      await api.pause(guildId)
    }
  }

  async function handleSkip() {
    await api.skip(guildId)
  }

  async function handleStop() {
    await api.stop(guildId)
  }

  async function handleShuffle() {
    await api.shuffle(guildId)
  }

  async function handleLoopToggle() {
    const modes = ['off', 'track', 'queue']
    const currentIndex = modes.indexOf(playerState.loopMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    await api.setLoop(guildId, nextMode)
  }

  async function handleVolumeChange(e) {
    const newVolume = parseInt(e.target.value)
    await api.setVolume(guildId, newVolume)
  }

  async function handleRemoveFromQueue(index) {
    await api.removeFromQueue(guildId, index)
  }

  async function handleDisconnect() {
    await api.disconnect(guildId)
  }

  function formatDuration(seconds) {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function getProgressPercent() {
    if (!playerState.currentTrack?.duration) return 0
    return Math.min((localProgress / playerState.currentTrack.duration) * 100, 100)
  }

  function getLoopIcon() {
    switch (playerState.loopMode) {
      case 'track':
        return <Repeat1 className="w-5 h-5" />
      case 'queue':
        return <Repeat className="w-5 h-5 text-discord-primary" />
      default:
        return <Repeat className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link
            to="/"
            className="px-4 py-2 bg-discord-primary rounded-lg hover:bg-opacity-80 transition"
          >
            Назад к списку серверов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="p-2 hover:bg-discord-dark rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          {guild?.icon ? (
            <img
              src={guild.icon}
              alt={guild.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-discord-primary flex items-center justify-center text-xl font-bold">
              {guild?.name?.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold">{guild?.name}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Play */}
            <div className="bg-discord-dark rounded-lg p-4">
              <form onSubmit={handlePlay} className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="bg-discord-light px-4 py-2 rounded-lg text-white outline-none focus:ring-2 focus:ring-discord-primary"
                  >
                    {guild?.voiceChannels?.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="URL или название трека (YouTube, Spotify, SoundCloud)"
                      className="w-full bg-discord-light pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-discord-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !searchQuery.trim()}
                    className="px-6 py-3 bg-discord-primary rounded-lg hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span className="hidden sm:inline">Добавить</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Now Playing */}
            <div className="bg-discord-dark rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-discord-primary" />
                Сейчас играет
              </h2>

              {playerState.currentTrack ? (
                <div>
                  <div className="flex gap-4">
                    {playerState.currentTrack.thumbnail && (
                      <img
                        src={playerState.currentTrack.thumbnail}
                        alt={playerState.currentTrack.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {playerState.currentTrack.title}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {playerState.currentTrack.author}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {playerState.isPlaying && !playerState.isPaused ? (
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Воспроизводится
                          </span>
                        ) : playerState.isPaused ? (
                          <span className="text-yellow-400 text-sm">На паузе</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-discord-light rounded-full h-2">
                      <div 
                        className="bg-discord-primary h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${getProgressPercent()}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatDuration(localProgress)}</span>
                      <span>{formatDuration(playerState.currentTrack.duration)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Ничего не воспроизводится</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={handleShuffle}
                  className="p-2 hover:bg-discord-light rounded-full transition"
                  title="Перемешать"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePauseResume}
                  disabled={!playerState.isPlaying}
                  className="p-4 bg-discord-primary rounded-full hover:bg-opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {playerState.isPaused ? (
                    <Play className="w-6 h-6" />
                  ) : (
                    <Pause className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!playerState.isPlaying}
                  className="p-2 hover:bg-discord-light rounded-full transition disabled:opacity-50"
                  title="Пропустить"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button
                  onClick={handleStop}
                  disabled={!playerState.isPlaying && playerState.queue.length === 0}
                  className="p-2 hover:bg-discord-light rounded-full transition disabled:opacity-50"
                  title="Остановить"
                >
                  <Square className="w-5 h-5" />
                </button>
                <button
                  onClick={handleLoopToggle}
                  className={`p-2 hover:bg-discord-light rounded-full transition ${
                    playerState.loopMode !== 'off' ? 'text-discord-primary' : ''
                  }`}
                  title={`Повтор: ${
                    playerState.loopMode === 'off'
                      ? 'Выключен'
                      : playerState.loopMode === 'track'
                      ? 'Трек'
                      : 'Очередь'
                  }`}
                >
                  {getLoopIcon()}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="p-2 hover:bg-discord-light rounded-full transition text-red-400"
                  title="Отключиться"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 mt-4 px-4">
                {playerState.volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-gray-400" />
                )}
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={playerState.volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-discord-light rounded-lg appearance-none cursor-pointer accent-discord-primary"
                />
                <span className="text-sm text-gray-400 w-12 text-right">{playerState.volume}%</span>
              </div>
            </div>
          </div>

          {/* Queue Section */}
          <div className="bg-discord-dark rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">
              Очередь ({playerState.queue.length})
            </h2>

            {playerState.queue.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Очередь пуста</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {playerState.queue.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 hover:bg-discord-light rounded-lg group"
                  >
                    <span className="text-gray-500 w-6 text-center text-sm">
                      {index + 1}
                    </span>
                    {track.thumbnail && (
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.title}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {track.author} • {formatDuration(track.duration)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromQueue(index)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
