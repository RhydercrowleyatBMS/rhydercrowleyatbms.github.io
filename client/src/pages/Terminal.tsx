import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useChat, useStartGame } from "@/hooks/use-game";
import { TerminalInput } from "@/components/TerminalInput";
import { TypewriterEffect } from "@/components/TypewriterEffect";
import { GlitchText } from "@/components/GlitchText";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "system" | "entity";
  content: string;
  timestamp: number;
};

export default function Terminal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [effects, setEffects] = useState<string[]>([]);
  const [aggressionLevel, setAggressionLevel] = useState(0);
  const [aggressionDesc, setAggressionDesc] = useState<"low" | "elevated" | "high" | "critical">("low");
  const [isGameOver, setIsGameOver] = useState(false);
  const [, setLocation] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  const chatMutation = useChat();
  const startGameMutation = useStartGame();
  
  // Load session data
  const sessionId = sessionStorage.getItem("game_session_id");
  
  useEffect(() => {
    if (!sessionId || hasInitializedRef.current) {
      if (!sessionId) {
        setLocation("/");
      }
      return;
    }
    
    hasInitializedRef.current = true;
    
    // Initial system message
    setMessages([{
      id: "init",
      role: "system",
      content: "CONNECTION ESTABLISHED. SUBJECT IS LISTENING.",
      timestamp: Date.now()
    }]);

    // Trigger initial AI message
    const initializeGame = async () => {
      setIsThinking(true);
      try {
        const result = await startGameMutation.mutateAsync({ sessionId });
        
        // Add the initial AI question
        const entityMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "entity",
          content: result.initialMessage,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, entityMsg]);
        setAggressionLevel(0);
        setAggressionDesc("low");
      } catch (error) {
        console.error("Initialization error:", error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "system",
          content: "INITIALIZATION FAILED. SESSION TERMINATED.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMsg]);
        setIsGameOver(true);
      } finally {
        setIsThinking(false);
      }
    };

    initializeGame();
  }, [sessionId, setLocation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSendMessage = async (text: string) => {
    if (!sessionId || isThinking || isGameOver) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await chatMutation.mutateAsync({
        sessionId,
        message: text,
      });

      // Update aggression display
      setAggressionLevel(response.state.aggressionLevel);
      setAggressionDesc(response.state.aggressionDescriptor);

      // Apply effects
      if (response.state.visualEffects && response.state.visualEffects.length > 0) {
        setEffects(response.state.visualEffects);
        // Clear effects after duration
        setTimeout(() => setEffects([]), 3000);
      }

      const entityMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "entity",
        content: response.response,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, entityMsg]);

      // Check if game is over
      if (response.state.isOver) {
        setIsGameOver(true);
        setTimeout(() => {
          const gameOverMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: "system",
            content: "CONTAINMENT PROTOCOL FAILED. SESSION TERMINATED.",
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, gameOverMsg]);
        }, 1000);
      }

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "CONNECTION UNSTABLE. RETRY TRANSMISSION.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  // Derived Effect Classes
  const isRedTint = effects.includes("red-tint");
  const isShaking = effects.includes("shake");
  const isFlash = effects.includes("flash");
  const isDistorted = effects.includes("distortion");

  // Aggression bar styling
  const aggressionColor = 
    aggressionLevel < 25 ? "bg-green-600" :
    aggressionLevel < 50 ? "bg-yellow-600" :
    aggressionLevel < 80 ? "bg-orange-600" :
    "bg-red-600";

  const aggressionLabel =
    aggressionDesc === "low" ? "STABILITY" :
    aggressionDesc === "elevated" ? "ELEVATED" :
    aggressionDesc === "high" ? "AGITATION" :
    "CRITICAL";

  return (
    <div className={cn(
      "min-h-screen bg-black text-zinc-300 font-mono flex flex-col relative overflow-hidden transition-colors duration-1000",
      isRedTint && "bg-[#1a0505]"
    )}>
      {/* Visual Effects Overlays */}
      <AnimatePresence>
        {isFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>
      
      <div className={cn(
        "absolute inset-0 pointer-events-none z-40 border-[20px] border-transparent transition-colors duration-1000",
        isRedTint && "border-red-900/10 shadow-[inset_0_0_100px_rgba(255,0,0,0.1)]"
      )}/>

      <motion.div 
        animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.4 }}
        className={cn(
          "flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 flex flex-col",
          isDistorted && "filter contrast-150 brightness-90 sepia-[0.3]"
        )}
      >
        {/* Header with Aggression Bar */}
        <header className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center opacity-50 text-[10px] tracking-[0.2em] uppercase border-b border-zinc-900 pb-4">
            <span>Session: {sessionId?.slice(0, 8)}...</span>
            <span>Status: {isGameOver ? "TERMINATED" : isThinking ? "TRANSMITTING" : "ACTIVE"}</span>
          </div>

          {/* Aggression Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((aggressionLevel / 100) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn("h-full transition-colors", aggressionColor)}
                />
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest w-16 text-right">
              {aggressionLabel}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 space-y-8 mb-8">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col gap-2 max-w-2xl",
                msg.role === "user" ? "ml-auto items-end text-right" : "mr-auto items-start",
                msg.role === "system" ? "mx-auto items-center text-center w-full" : ""
              )}
            >
              <div className="text-[10px] text-zinc-700 uppercase tracking-widest mb-1">
                {msg.role === "entity" ? <span className="text-red-900 font-bold">UNKNOWN</span> : msg.role}
              </div>
              
              <div className={cn(
                "text-sm md:text-base leading-relaxed",
                msg.role === "user" ? "text-zinc-400" : "text-zinc-100",
                msg.role === "system" ? "text-red-900 text-xs py-2 px-4 border border-red-900/30 bg-red-950/10" : ""
              )}>
                {msg.role === "entity" ? (
                  <TypewriterEffect text={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {isThinking && !isGameOver && (
            <div className="mr-auto">
              <div className="text-[10px] text-red-900 uppercase tracking-widest mb-1 font-bold">
                UNKNOWN
              </div>
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-red-800 text-sm"
              >
                ...
              </motion.div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="mt-auto pt-6 border-t border-zinc-900 relative z-50">
          <TerminalInput 
            onSubmit={handleSendMessage} 
            disabled={isThinking || isGameOver} 
            className={cn(
              (isThinking || isGameOver) && "opacity-50 cursor-not-allowed"
            )}
          />
          <div className="flex justify-between mt-2">
             <div className="text-[9px] text-zinc-800 uppercase tracking-widest">
               Secure Channel // 256-bit
             </div>
             <button 
               onClick={() => {
                 sessionStorage.clear();
                 setLocation("/");
               }}
               className="text-[9px] text-zinc-800 hover:text-red-900 uppercase tracking-widest transition-colors"
             >
               Terminate Session
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
