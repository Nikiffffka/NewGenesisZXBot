import { Routes, Route } from 'react-router-dom'
import GuildList from './components/GuildList'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-discord-darker">
      <Routes>
        <Route path="/" element={<GuildList />} />
        <Route path="/guild/:guildId" element={<Dashboard />} />
      </Routes>
    </div>
  )
}

export default App
