import { Outlet, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'

export default function App() {
  const location = useLocation()
  
  // Pages where footer should not be shown
  const noFooterPages = ['/login', '/signup']
  const shouldShowFooter = !noFooterPages.includes(location.pathname)
  
  return (
    <div className="min-h-screen flex flex-col">
      <Outlet />
      {shouldShowFooter && <Footer />}
    </div>
  )
}


