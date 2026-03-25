"use client";

import { useEffect, useRef, useState } from "react";
import { getDocuments, streamChatMessage } from "@/lib/api";
import type { ChatMessage, ChatMode, DocumentInfo } from "@/lib/types";

const MODE_LABELS: Record<ChatMode, string> = {
  auto: "🤖 Auto",
  library: "📚 Bibliothèque",
  web: "🌐 Web",
};

const MODE_USED_BADGE: Record<string, string> = {
  library: "📚 Bibliothèque",
  web: "🌐 Web",
  none: "Sans contexte",
};

let msgCounter = 0;
function newId() {
  return `msg-${++msgCounter}`;
}

export function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("auto");
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load available documents
  useEffect(() => {
    getDocuments().then(setDocs).catch(() => setDocs([]));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function toggleFile(filename: string) {
    setSelectedFiles((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: newId(), role: "user", content: text }]);
    setInput("");
    setLoading(true);

    const assistantId = newId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      for await (const event of streamChatMessage(text, mode, selectedFiles)) {
        if (event.type === "meta") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, sources: event.sources, modeUsed: event.mode_used as ChatMessage["modeUsed"] }
                : m
            )
          );
        } else if (event.type === "token") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + event.text } : m
            )
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: `Erreur : ${event.message}` } : m
            )
          );
        } else if (event.type === "done") {
          break;
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: err instanceof Error ? `Erreur : ${err.message}` : "Une erreur est survenue." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-3">

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-3">

        {/* Mode selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium shrink-0">Source :</span>
          <div className="flex gap-1">
            {(["auto", "library", "web"] as ChatMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  mode === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* File selector (visible only when library or auto) */}
        {mode !== "web" && docs.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1.5">
              Fichiers sources{" "}
              <span className="font-normal text-gray-400">
                (laisser vide = tous)
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {docs.map((doc) => (
                <button
                  key={doc.filename}
                  onClick={() => toggleFile(doc.filename)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedFiles.includes(doc.filename)
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                  }`}
                >
                  {doc.filename}
                </button>
              ))}
            </div>
            {selectedFiles.length > 0 && (
              <button
                onClick={() => setSelectedFiles([])}
                className="mt-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Tout désélectionner
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">
            Posez une question à l&apos;assistant pédagogique…
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {/* Sources + mode badge */}
              {msg.role === "assistant" && (msg.sources?.length || msg.modeUsed) && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center">
                  {msg.modeUsed && (
                    <span className="text-xs text-gray-400">
                      {MODE_USED_BADGE[msg.modeUsed] ?? msg.modeUsed}
                    </span>
                  )}
                  {msg.sources?.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full truncate max-w-[200px]"
                      title={s}
                    >
                      {s.split("/").pop() ?? s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question…"
          disabled={loading}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
