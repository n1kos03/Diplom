import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Pages
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';

//Protected route component
//

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App;