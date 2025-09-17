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
import Aboutus from './pages/Aboutus'
import SubscriptionPage from './pages/subscritionPage'

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
      { path: '/pricing', element: <SubscriptionPage />}
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionManager>
      <RouterProvider router={router} />
    </SessionManager>
  </React.StrictMode>
)


