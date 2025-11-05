import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './lib/storage';
import Login from './routes/Login';
import Contacts from './routes/Contacts';
import Chat from './routes/Chat';

const ProtectedRoute = ({ children }) => {
  const session = getSession();
  return session ? children : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const session = getSession();
  return !session ? children : <Navigate to="/contacts" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/contacts" 
            element={
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:conversationId" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;