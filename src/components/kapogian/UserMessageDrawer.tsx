"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupportMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
}

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";

// ─── Component ────────────────────────────────────────────────────────────────

export function UserMessageDrawer({ walletAddress }: { walletAddress: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sending, setSending] = useState(false);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channelName = walletAddress
    ? `kapogian-support:${walletAddress.toLowerCase()}`
    : null;

  useEffect(() => {
    if (!channelName) return;

    let destroyed = false; // guard against React Strict Mode double-invoke

    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected", () => { if (!destroyed) setConnected(true); });
    ably.connection.on("disconnected", () => { if (!destroyed) setConnected(false); });
    ably.connection.on("failed", () => { if (!destroyed) setConnected(false); });

    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    // Announce to admin inbox so they can discover this user
    const inboxChannel = ably.channels.get("kapogian-support-inbox");
    inboxChannel.publish("user-connected", { walletAddress });

    // ── Load history so past messages survive page refresh ────────────────
    const loadHistory = async () => {
      try {
        await channel.attach();
        if (destroyed) return; // component unmounted while awaiting
        const page = await channel.history({ limit: 100, direction: "forwards" });
        if (destroyed) return;
        const historical: SupportMessage[] = page.items
          .filter((msg) => msg.name === "user-message" || msg.name === "admin-message")
          .map((msg) => ({
            id: msg.id ?? `hist-${Date.now()}-${Math.random()}`,
            text: msg.data.text,
            sender: (msg.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: msg.data.timestamp ?? (msg as any).timestamp ?? Date.now(),
          }));
        if (historical.length > 0) {
          setMessages(historical.sort((a, b) => a.timestamp - b.timestamp));
        }
      } catch (e) {
        if (!destroyed) console.warn("History load failed:", e);
      }
    };
    loadHistory();

    // Subscribe to messages from admin
    channel.subscribe("admin-message", (msg) => {
      const newMsg: SupportMessage = {
        id: msg.id ?? `${Date.now()}`,
        text: msg.data.text,
        sender: "admin",
        timestamp: msg.data.timestamp ?? Date.now(),
      };
      // Deduplicate against history
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setUnreadCount((c) => c + 1);
    });

    // Subscribe to echo of own messages — replace the optimistic bubble
    // with the server-confirmed one (Ably assigns its own msg.id, so we
    // match by text + approximate timestamp instead of ID)
    channel.subscribe("user-message", (msg) => {
      setMessages((prev) => {
        const echoText = msg.data.text;
        const echoTs   = msg.data.timestamp ?? Date.now();

        // Find the pending optimistic entry: same text, temp id starts with "user-"
        const optimisticIdx = prev.findIndex(
          (m) =>
            m.sender === "user" &&
            m.text === echoText &&
            m.id.startsWith("user-") &&
            Math.abs(m.timestamp - echoTs) < 10_000
        );

        if (optimisticIdx !== -1) {
          // Swap the temp bubble for the confirmed one — no duplicate
          const next = [...prev];
          next[optimisticIdx] = {
            id: msg.id ?? `echo-${Date.now()}`,
            text: echoText,
            sender: "user",
            timestamp: echoTs,
          };
          return next;
        }

        // No matching optimistic — just append (edge case)
        return [
          ...prev,
          {
            id: msg.id ?? `${Date.now()}`,
            text: echoText,
            sender: "user",
            timestamp: echoTs,
          },
        ];
      });
    });

    return () => {
      destroyed = true;
      channel.unsubscribe();
      ably.close();
    };
  }, [channelName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !channelRef.current || sending) return;

    setSending(true);
    const msgId = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();

    // Optimistic
    const optimistic: SupportMessage = { id: msgId, text, sender: "user", timestamp };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      // Re-announce on every send so admin discovers this user even if they
      // weren't online when the drawer first opened
      if (ablyRef.current) {
        ablyRef.current.channels
          .get("kapogian-support-inbox")
          .publish("user-connected", { walletAddress });
      }
      await channelRef.current.publish("user-message", {
        text,
        timestamp,
        walletAddress,
      });
    } catch {
      // On failure, remove the optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending, walletAddress]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!walletAddress) return null;

  return (
    <>
      {/* ── FAB Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-black text-white rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open support chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-[10px] font-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Drawer ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-3rem)] flex flex-col bg-white border-4 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                  <ShieldCheck size={16} className="text-white" />
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${
                    connected ? "bg-green-400" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-tight leading-none">Kapogian Support</p>
                <p className="text-[10px] font-bold text-white/40 mt-0.5">
                  {connected ? "Connected · replies in real-time" : "Connecting..."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[380px] bg-[#fdfcfa]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <MessageCircle size={24} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-black text-slate-500 text-sm uppercase tracking-tight">
                    Send us a message
                  </p>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    We'll respond as soon as possible
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                      msg.sender === "user"
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.sender === "admin" && (
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Kapogian Admin
                      </p>
                    )}
                    <p>{msg.text}</p>
                    <p
                      className={`text-[9px] mt-1 font-mono ${
                        msg.sender === "user" ? "text-white/40 text-right" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t-2 border-slate-100 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your concern..."
              maxLength={500}
              className="flex-1 h-10 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || !connected}
              className="w-10 h-10 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}