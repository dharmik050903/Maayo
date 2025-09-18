import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Outlet />
      <Footer />
    </div>
  )
}


