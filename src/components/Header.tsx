import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { APP_NAME, COMPANY_NAME } from "../constants/brand";
import { HeaderIconDock } from "./HeaderIconButton";

interface HeaderProps {
  onAboutClick: () => void;
  onThemeClick: () => void;
}

export function Header({ onAboutClick, onThemeClick }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink shadow-glow"
        >
          <Sparkles size={22} className="text-on-accent" />
        </motion.div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="brand-title text-gradient">{APP_NAME}</span>
          </h1>
          <p className="truncate text-xs text-fg-muted">
            {COMPANY_NAME} · disk detox for the chronically online
          </p>
        </div>
      </div>

      <HeaderIconDock onThemeClick={onThemeClick} onAboutClick={onAboutClick} />
    </header>
  );
}
