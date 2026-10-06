import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SwapPage from "./pages/SwapPage";
import TrackOrderPage from "./pages/TrackOrderPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/swap" replace />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="*" element={<Navigate to="/swap" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
