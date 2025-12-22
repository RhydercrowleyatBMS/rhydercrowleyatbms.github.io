import { useState } from "react";
import { useLocation } from "wouter";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { GlitchText } from "@/components/GlitchText";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Landing() {
  const [isConsented, setIsConsented] = useState(false);
  const [, setLocation] = useLocation();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleStart = async () => {
    if (!isConsented) return;

    setIsInitializing(true);
    
    // Generate Session ID (volatile)
    const sessionId = uuidv4();
    sessionStorage.setItem("game_session_id", sessionId);

    // Navigate to terminal - the Terminal component will handle initialization
    setLocation("/terminal");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg border border-red-950/60 bg-black/60 p-6 rounded-xl shadow-[0_0_60px_rgba(255,0,0,0.08)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <GlitchText className="text-xl tracking-widest">DEREALIZATION</GlitchText>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">
          Fictional interrogation experience. No real device scanning. Your session is temporary and resets when you close the tab.
        </p>

        <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConsented}
            onChange={(e) => setIsConsented(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-zinc-300">
            I am at least 16 and I understand this contains disturbing language and psychological horror.
          </span>
        </label>

        <Button
          onClick={handleStart}
          disabled={!isConsented || isInitializing}
          className="w-full mt-6 bg-red-950 hover:bg-red-900 text-red-50 font-mono"
        >
          {isInitializing ? "INITIALIZING..." : "ENTER"}
        </Button>

        <p className="text-[11px] text-zinc-600 mt-4">
          Fictional interrogation engine. Encrypted API key authentication enabled.
        </p>
      </motion.div>
    </div>
  );
}
