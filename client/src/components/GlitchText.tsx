import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
  intensity?: "low" | "medium" | "high";
}

export function GlitchText({ text, className, as: Component = "span", intensity = "low" }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const triggerGlitch = () => {
      if (Math.random() > 0.8) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    };

    const interval = setInterval(triggerGlitch, intensity === "high" ? 1000 : intensity === "medium" ? 2500 : 5000);
    return () => clearInterval(interval);
  }, [intensity]);

  return (
    <Component className={cn("relative inline-block", className)}>
      <span className={cn(isGlitching && "opacity-0")}>{text}</span>
      {isGlitching && (
        <>
          <span 
            className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-70 animate-glitch" 
            aria-hidden="true"
          >
            {text}
          </span>
          <span 
            className="absolute top-0 left-0 ml-[2px] text-cyan-500 opacity-70 animate-glitch"
            style={{ animationDirection: "reverse" }}
            aria-hidden="true"
          >
            {text}
          </span>
        </>
      )}
    </Component>
  );
}
