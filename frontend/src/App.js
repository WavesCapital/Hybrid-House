import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AthleteProfile from "./components/AthleteProfile";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AthleteProfile />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;