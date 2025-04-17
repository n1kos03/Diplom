import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Home from '../pages/Home.tsx'
import NotFoundPage from '../pages/NotFoundPage.tsx'
import ProtectedRoute from './ProtectedRoute.tsx'
import Login from '../pages/Login.tsx'

const router = createBrowserRouter([
  { path: "/login", element: <Login />},
  { path: "/", element: <ProtectedRoute> <Home /> </ProtectedRoute>},
  { path: "*", element: <NotFoundPage />}
])

const Router = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default Router