import { createRoot } from "react-dom/client";
import { Shell } from "@/components/shell";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");
createRoot(root).render(<Shell />);
