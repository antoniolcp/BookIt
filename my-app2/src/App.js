import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/User/HomePage';
import LogIn from './pages/LogIn/LogInPage';
import SignUp from './pages/LogIn/SignUpPage';
import UserPage from './pages/User/UserPage';
import AdminUserPage from './pages/Admin/AdminUserPage';
import AdminHomePage from './pages/Admin/AdminHomePage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LogIn />} />
        <Route path="/signUp" element={<SignUp />}/>
        <Route path="/homePage" element={<HomePage />} />
        <Route path="/adminHomePage" element={<AdminHomePage />} />
        <Route path="/userPage" element={<UserPage />}/>
        <Route path="/adminUserPage" element={<AdminUserPage/>}/>
      </Routes>
    </Router>
  );
}