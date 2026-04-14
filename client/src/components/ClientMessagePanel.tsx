import { useState, useRef, useEffect } from "react";
import { trpc } from "../lib/trpc";

interface ClientMessagePanelProps {
  token: string;
  sessionId: number;
  recipientName: string;
}

export function ClientMessagePanel({ token, sessionId, recipientName }: ClientMessagePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch } = trpc.sessionMessages.getSessionMessages.useQuery(
    { sessionId, limit: 50, token },
    { enabled: isOpen, refetchInterval: isOpen ? 4000 : undefined }
  );

  const sendMessage = trpc.sessionMessages.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
  });

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105"
          title="Message the operator"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-80 flex flex-col" style={{ height: "420px" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div>
              <h4 className="text-sm font-semibold text-white">Session Chat</h4>
              <p className="text-xs text-gray-400">{recipientName}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages && Array.isArray(messages) && messages.length > 0 ? (
              messages.map((msg: any, i: number) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.from_role === "client" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.from_role === "client"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-200"
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">
                    {msg.from_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center mt-8">No messages yet. Send a message to your operator.</p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 border-t border-gray-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!message.trim()) return;
                sendMessage.mutate({
                  sessionId,
                  fromRole: "client",
                  fromName: recipientName,
                  message: message.trim(),
                  token,
                });
              }}
              className="flex gap-2"
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!message.trim() || sendMessage.isPending}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
