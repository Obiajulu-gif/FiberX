import { Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing.js";
import { Dashboard } from "./pages/Dashboard.js";

export function App() {
  return (
    <>
      {/* Ambient liquid-glass background */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-orb" />
      </div>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
