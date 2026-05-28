import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof Pi !== "undefined") {
  Pi.init({ version: "2.0", sandbox: true });
}

createRoot(document.getElementById("root")!).render(<App />);
