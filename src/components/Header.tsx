import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { APP_BRAND, APP_PRODUCT, COMPANY_NAME } from "../constants/brand";

export function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink shadow-glow"
        >
          <Sparkles size={22} className="text-white" />
        </motion.div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {APP_BRAND}<span className="text-gradient"> {APP_PRODUCT}</span>
          </h1>
          <p className="text-xs text-white/40">
            {COMPANY_NAME} · disk detox for the chronically online
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
        <span className="h-2 w-2 animate-pulse rounded-full bg-neon-lime" />
        <span className="text-xs font-medium text-white/60">MVP v0.1</span>
      </div>
    </header>
  );
}
