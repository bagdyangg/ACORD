import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = () => {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h1 style={{ 
          textAlign: "center", 
          marginBottom: "2rem",
          color: "#333"
        }}>
          ACORD Lunch Ordering System
        </h1>
        <p style={{ textAlign: "center", color: "#666" }}>
          Application is being restored...
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />)