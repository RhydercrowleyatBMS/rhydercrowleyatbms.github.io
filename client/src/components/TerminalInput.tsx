import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TerminalInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TerminalInput({ onSubmit, disabled, placeholder = "ENTER COMMAND...", className }: TerminalInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value);
      setValue("");
    }
  };

  // Keep focus
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative w-full group flex items-center gap-3 border-b border-zinc-800 focus-within:border-red-900 transition-colors duration-300 py-4",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-zinc-600 font-mono select-none group-focus-within:text-red-600 transition-colors">
        {">"}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent outline-none font-mono text-lg text-zinc-300 placeholder:text-zinc-700 disabled:opacity-50"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
      />
      
      <AnimatePresence>
        {!disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-3 h-5 bg-red-600/50 absolute left-[calc(1.5rem+var(--cursor-pos,0px))]"
          />
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={!value.trim() || disabled}
        className="px-4 py-1 text-xs font-mono uppercase tracking-widest text-zinc-600 hover:text-red-500 disabled:opacity-0 transition-all"
      >
        Send
      </button>
    </form>
  );
}
