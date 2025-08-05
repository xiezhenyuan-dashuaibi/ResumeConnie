import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import AnalysisDetails from './AnalysisDetails.jsx';
import ResumeEditor from './ResumeEditor.jsx';
import Results from './Results.jsx'; // 新导入

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/details" element={<AnalysisDetails />} />
        <Route path="/edit-resume" element={<ResumeEditor />} />
        <Route path="/results" element={<Results />} /> {/* 新路由 */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
