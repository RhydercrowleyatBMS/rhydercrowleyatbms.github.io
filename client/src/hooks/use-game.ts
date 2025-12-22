import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ChatInput, type ChatResponse, type StartGameInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useStartGame() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: StartGameInput) => {
      const res = await fetch(api.game.start.path, {
        method: api.game.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to initialize containment protocol.");
      }
      return api.game.start.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "INITIALIZATION ERROR",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useChat() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: ChatInput) => {
      const res = await fetch(api.game.chat.path, {
        method: api.game.chat.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authorization failed.");
        }
        if (res.status === 500) {
          throw new Error("Internal containment breach.");
        }
        throw new Error("Communication failure.");
      }

      return api.game.chat.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "TRANSMISSION ERROR",
        description: error.message,
        variant: "destructive",
        className: "bg-red-950 border-red-900 text-red-100 font-mono",
      });
    },
  });
}
