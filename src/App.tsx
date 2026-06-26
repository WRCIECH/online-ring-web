import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { initSound } from './engine/sound'
import TitleScreen from './screens/TitleScreen'
import ClassSelectScreen from './screens/ClassSelectScreen'
import LocationSelectScreen from './screens/LocationSelectScreen'
import RunMapScreen from './screens/RunMapScreen'
import CombatScreen from './screens/CombatScreen'
import RunCompleteScreen from './screens/RunCompleteScreen'

export default function App() {
  useEffect(() => {
    const unlock = () => { initSound(); document.removeEventListener('click', unlock) }
    document.addEventListener('click', unlock)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<TitleScreen />} />
        <Route path="/start-class"  element={<ClassSelectScreen />} />
        <Route path="/locations"    element={<LocationSelectScreen />} />
        <Route path="/map"          element={<RunMapScreen />} />
        <Route path="/combat"       element={<CombatScreen />} />
        <Route path="/run-complete" element={<RunCompleteScreen />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
