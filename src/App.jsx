import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";   
import Signup from "./pages/Signup"; 
import Dashboard from "./pages/Dashboard";
import TemplateSelector from "./pages/TemplateSelector"; // Added Template Selector Onboarding Page
import ResumeBuilder from "./pages/ResumeBuilder";
import CvBuilder from "./pages/CvBuilder"; 

export default function App() {
  return (
    <Router>
      <Routes>
        {/* The Landing/Home Page */}
        <Route path="/" element={<Home />} /> 

        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} /> 

        {/* Workspaces & Onboarding Flow */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* The user hits this page right after clicking "Create New" on the Dashboard */}
        <Route path="/templates" element={<TemplateSelector />} /> 

        {/* Builders get populated with the choice configuration state */}
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/cv-builder" element={<CvBuilder />} /> 
      </Routes>
    </Router>
  );
}