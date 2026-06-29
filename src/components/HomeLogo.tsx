import { useNavigate } from 'react-router-dom'
import s from './HomeLogo.module.css'

export default function HomeLogo() {
  const navigate = useNavigate()
  return (
    <button className={s.logo} onClick={() => navigate('/')} aria-label="Back to title">
      <div className={s.ring} />
      <span className={s.name}>Online Ring</span>
    </button>
  )
}
