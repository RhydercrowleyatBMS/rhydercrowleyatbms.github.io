import { Link } from "wouter";
import { GlitchText } from "@/components/GlitchText";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-zinc-300">
      <div className="max-w-md w-full p-8 border border-zinc-900 bg-zinc-950/50 text-center space-y-6">
        <AlertTriangle className="w-12 h-12 text-red-900 mx-auto opacity-50" />
        
        <div className="space-y-2">
          <GlitchText 
            text="404 - VOID DETECTED" 
            className="text-2xl font-bold tracking-widest text-red-500"
            intensity="high" 
          />
          <p className="text-sm text-zinc-600 font-mono">
            The coordinates you requested do not exist in this reality.
          </p>
        </div>

        <Link href="/" className="inline-block mt-8">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-white border-b border-transparent hover:border-white transition-all duration-300 pb-1 cursor-pointer">
            Return to Safety
          </span>
        </Link>
      </div>
    </div>
  );
}
