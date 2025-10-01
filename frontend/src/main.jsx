import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './pages/App'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/home'
import FreelancerDashboard from './pages/FreelancerDashboard'
import ClientDashboard from './pages/ClientDashboard'
import ProjectCreate from './pages/ProjectCreate'
import FreelancerHome from './pages/FreelancerHome'
import ClientHome from './pages/ClientHome'
import ProjectList from './pages/ProjectList'
import ProjectDetail from './pages/ProjectDetail'
import ProjectEdit from './pages/ProjectEdit'
import ClientMyProjects from './pages/ClientMyProjects'
import MyProjectsPage from './pages/MyProjectsPage'
import FindWork from './pages/FindWork'
import BrowseProjects from './pages/BrowseProjects'
import Freelancers from './pages/Freelancers'
import SessionManager from './components/SessionManager'
import { LanguageProvider } from './contexts/LanguageContext'
import Aboutus from './pages/Aboutus'
import ContactUs from './pages/ContactUs'
import SubscriptionPage from './pages/subscritionPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import CancellationRefunds from './pages/CancellationRefunds'
import ShippingPolicy from './pages/ShippingPolicy'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import AdminSetup from './pages/AdminSetup'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/freelancer-dashboard', element: <FreelancerDashboard /> },
      { path: '/client-dashboard', element: <ClientDashboard /> },
      { path: '/create-project', element: <ProjectCreate /> },
      { path: '/project/create', element: <ProjectCreate /> },
      { path: '/projects', element: <ProjectList /> },
      { path: '/project/:id', element: <ProjectDetail /> },
      { path: '/project/edit/:id', element: <ProjectEdit /> },
      { path: '/freelancer-home', element: <FreelancerHome /> },
      { path: '/client-home', element: <ClientHome /> },
      { path: '/client/my-projects', element: <ClientMyProjects /> },
      { path: '/my-projects', element: <MyProjectsPage /> },
      { path: '/find-work', element: <FindWork /> },
      { path: '/browse', element: <BrowseProjects /> },
      { path: '/freelancers', element: <Freelancers /> },
      { path: '/about', element: <Aboutus />},
      { path: '/contact', element: <ContactUs />},
      { path: '/pricing', element: <SubscriptionPage />},
      { path: '/privacy', element: <PrivacyPolicy />},
      { path: '/terms', element: <TermsAndConditions />},
      { path: '/cancellation-refunds', element: <CancellationRefunds />},
      { path: '/shipping', element: <ShippingPolicy />},
    ],
  },
  // Admin Routes
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin/setup',
    element: <AdminSetup />
  },
  {
    path: '/admin/*',
    element: <AdminPanel />
  }
])

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <SessionManager>
      <RouterProvider router={router} />
    </SessionManager>
  </LanguageProvider>
)


