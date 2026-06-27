import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { applyThemeId, readStoredThemeId } from "./constants/themes";
import "./index.css";
import "./theme-palettes.css";

applyThemeId(readStoredThemeId());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
