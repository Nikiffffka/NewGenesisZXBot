import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Music, Users, ChevronRight } from 'lucide-react'
import { api } from '../api'

function GuildList() {
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadGuilds()
  }, [])

  async function loadGuilds() {
    try {
      setLoading(true)
      const data = await api.getGuilds()
      setGuilds(data)
    } catch (err) {
      setError('Не удалось загрузить список серверов')
      console.error(err)
    } finally {
      setLoading(false)
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
          <button
            onClick={loadGuilds}
            className="px-4 py-2 bg-discord-primary rounded-lg hover:bg-opacity-80 transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Music className="w-10 h-10 text-discord-primary" />
          <h1 className="text-3xl font-bold">Music Bot Dashboard</h1>
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-300">Выберите сервер</h2>

        {guilds.length === 0 ? (
          <div className="text-center py-12 bg-discord-dark rounded-lg">
            <p className="text-gray-400">Бот не добавлен ни на один сервер</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {guilds.map((guild) => (
              <Link
                key={guild.id}
                to={`/guild/${guild.id}`}
                className="flex items-center gap-4 p-4 bg-discord-dark rounded-lg hover:bg-discord-light transition group"
              >
                {guild.icon ? (
                  <img
                    src={guild.icon}
                    alt={guild.name}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-discord-primary flex items-center justify-center text-xl font-bold">
                    {guild.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{guild.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{guild.memberCount} участников</span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-discord-primary transition" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GuildList
