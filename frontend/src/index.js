import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ✅ Error Boundary — catches ALL React crashes that would otherwise show blank screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("🚨 App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#ece8da", padding: "20px", fontFamily: "sans-serif",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🍽️</div>
          <h2 style={{ color: "#4a1e0e", marginBottom: "8px" }}>Mangal Enterprises</h2>
          <p style={{ color: "#6b2f1a", marginBottom: "4px" }}>Something went wrong loading the page.</p>
          <p style={{ color: "#8b5a2b", fontSize: "13px", marginBottom: "24px", wordBreak: "break-word", maxWidth: "300px" }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 32px", background: "#4a1e0e", color: "white",
              border: "none", borderRadius: "999px", fontSize: "16px",
              fontWeight: "700", cursor: "pointer"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
