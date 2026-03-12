"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  ShieldCheck,
  Inbox,
  Circle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupportMessage {
  id: string;
  text: string;
  sender: "user" | "admin";
  timestamp: number;
}

interface Conversation {
  walletAddress: string;
  messages: SupportMessage[];
  unread: number;
  lastActivity: number;
}

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";

const shortAddr = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminMessagesTab() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, Ably.RealtimeChannel>>(new Map());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Boot Ably ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false; // guard against React Strict Mode double-invoke

    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected", () => { if (!destroyed) setConnected(true); });
    ably.connection.on("disconnected", () => { if (!destroyed) setConnected(false); });
    ably.connection.on("failed", () => { if (!destroyed) setConnected(false); });

    // Listen for users announcing themselves (fired on every message send)
    const inboxChannel = ably.channels.get("kapogian-support-inbox");
    inboxChannel.subscribe("user-connected", (msg) => {
      if (destroyed) return;
      const { walletAddress } = msg.data as { walletAddress: string };
      if (walletAddress) subscribeToUser(walletAddress, ably);
    });

    return () => {
      destroyed = true;
      channelsRef.current.forEach((ch) => ch.unsubscribe());
      channelsRef.current.clear();
      inboxChannel.unsubscribe();
      ably.close();
    };
  }, []);

  // ── Subscribe to a specific user's channel + load history ───────────────
  const subscribeToUser = useCallback(
    (walletAddress: string, ablyInstance?: Ably.Realtime) => {
      const ably = ablyInstance ?? ablyRef.current;
      if (!ably) return;
      if (channelsRef.current.has(walletAddress)) return; // already subscribed

      const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
      const channel = ably.channels.get(channelName);
      channelsRef.current.set(walletAddress, channel);

      // ── Load history with async/await ─────────────────────────────────────
      const loadHistory = async () => {
        try {
          await channel.attach();
          if (ably.connection.state !== "connected") return; // closed before attach finished
          const page = await channel.history({ limit: 100, direction: "forwards" });
          const historical: SupportMessage[] = page.items
            .filter((msg) => msg.name === "user-message" || msg.name === "admin-message")
            .map((msg) => ({
              id: msg.id ?? `hist-${Date.now()}-${Math.random()}`,
              text: msg.data.text,
              sender: (msg.name === "admin-message" ? "admin" : "user") as "admin" | "user",
              timestamp: msg.data.timestamp ?? (msg as any).timestamp ?? Date.now(),
            }));

          if (historical.length > 0) {
            setConversations((prev) => {
              const next = new Map(prev);
              const conv = next.get(walletAddress) ?? {
                walletAddress,
                messages: [],
                unread: 0,
                lastActivity: Date.now(),
              };
              const existingIds = new Set(conv.messages.map((m) => m.id));
              const merged = [
                ...conv.messages,
                ...historical.filter((m) => !existingIds.has(m.id)),
              ].sort((a, b) => a.timestamp - b.timestamp);
              const lastTs = merged[merged.length - 1]?.timestamp ?? conv.lastActivity;
              next.set(walletAddress, {
                ...conv,
                messages: merged,
                lastActivity: lastTs,
              });
              return next;
            });
          }
        } catch (e) {
          // Silently ignore "Connection closed" — happens during Strict Mode unmount
          if ((e as any)?.code !== 80017) console.warn("History load failed:", e);
        }
      };
      loadHistory();

      // ── Live: new user messages ───────────────────────────────────────────
      channel.subscribe("user-message", (msg) => {
        const newMsg: SupportMessage = {
          id: msg.id ?? `${Date.now()}`,
          text: msg.data.text,
          sender: "user",
          timestamp: msg.data.timestamp ?? Date.now(),
        };
        setConversations((prev) => {
          const next = new Map(prev);
          const conv = next.get(walletAddress) ?? {
            walletAddress,
            messages: [],
            unread: 0,
            lastActivity: Date.now(),
          };
          // Deduplicate (history replay can overlap with live)
          if (conv.messages.some((m) => m.id === newMsg.id)) return prev;
          setActiveWallet((currentActive) => {
            const isActive = currentActive === walletAddress;
            next.set(walletAddress, {
              ...conv,
              messages: [...conv.messages, newMsg],
              unread: isActive ? 0 : conv.unread + 1,
              lastActivity: Date.now(),
            });
            return currentActive;
          });
          return next;
        });
      });

      // Ensure conversation entry exists even before history loads
      setConversations((prev) => {
        if (prev.has(walletAddress)) return prev;
        const next = new Map(prev);
        next.set(walletAddress, {
          walletAddress,
          messages: [],
          unread: 0,
          lastActivity: Date.now(),
        });
        return next;
      });
    },
    [],
  );

  // ── Select conversation → clear unread ────────────────────────────────────
  const selectConversation = (walletAddress: string) => {
    setActiveWallet(walletAddress);
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(walletAddress);
      if (conv) next.set(walletAddress, { ...conv, unread: 0 });
      return next;
    });
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 50);
  };

  // ── Send reply ────────────────────────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
    const text = replyInput.trim();
    if (!text || !activeWallet || sending) return;

    const channel = channelsRef.current.get(activeWallet);
    if (!channel) return;

    setSending(true);
    const msgId = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();

    // Optimistic
    const optimistic: SupportMessage = { id: msgId, text, sender: "admin", timestamp };
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(activeWallet);
      if (conv)
        next.set(activeWallet, {
          ...conv,
          messages: [...conv.messages, optimistic],
          lastActivity: Date.now(),
        });
      return next;
    });
    setReplyInput("");

    try {
      await channel.publish("admin-message", { text, timestamp });
    } catch {
      // Rollback on failure
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(activeWallet);
        if (conv)
          next.set(activeWallet, {
            ...conv,
            messages: conv.messages.filter((m) => m.id !== msgId),
          });
        return next;
      });
      setReplyInput(text);
    } finally {
      setSending(false);
    }
  }, [replyInput, activeWallet, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // ── Scroll on new messages ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeWallet]);

  const totalUnread = Array.from(conversations.values()).reduce(
    (sum, c) => sum + c.unread,
    0,
  );
  const sortedConvs = Array.from(conversations.values()).sort(
    (a, b) => b.lastActivity - a.lastActivity,
  );
  const activeConv = activeWallet ? conversations.get(activeWallet) : null;

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">
      {/* ── Left: Conversation List ───────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-white" />
              <span className="font-black text-sm uppercase tracking-tight">Inbox</span>
              {totalUnread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </div>
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-slate-500"}`}
              title={connected ? "Connected" : "Disconnected"}
            />
          </div>

          {/* Conversation list */}
          <div className="overflow-y-auto flex-1">
            {sortedConvs.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-center h-full">
                <div className="w-12 h-12 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
                  <MessageCircle size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-black text-slate-300 text-xs uppercase">No messages yet</p>
                  <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                    Users will appear here automatically when they send a message
                  </p>
                </div>
              </div>
            ) : (
              sortedConvs.map((conv) => (
                <button
                  key={conv.walletAddress}
                  onClick={() => selectConversation(conv.walletAddress)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${
                    activeWallet === conv.walletAddress ? "bg-black text-white hover:bg-black" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      activeWallet === conv.walletAddress
                        ? "border-white/30 bg-white/10"
                        : "border-slate-200 bg-slate-100"
                    }`}
                  >
                    <User
                      size={14}
                      className={
                        activeWallet === conv.walletAddress ? "text-white" : "text-slate-400"
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-black text-xs truncate uppercase ${
                        activeWallet === conv.walletAddress ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {shortAddr(conv.walletAddress)}
                    </p>
                    {conv.messages.length > 0 && (
                      <p
                        className={`text-[10px] font-semibold truncate mt-0.5 ${
                          activeWallet === conv.walletAddress
                            ? "text-white/50"
                            : "text-slate-400"
                        }`}
                      >
                        {conv.messages[conv.messages.length - 1].text}
                      </p>
                    )}
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread > 9 ? "9+" : conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Chat Window ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
              <MessageCircle size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="font-black text-slate-400 uppercase text-base tracking-tight">
                Waiting for messages
              </p>
              <p className="text-sm font-semibold text-slate-300 mt-1">
                Users will appear in the inbox as soon as they send a message
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-black text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase tracking-tight">
                  {shortAddr(activeConv.walletAddress)}
                </p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5 truncate">
                  {activeConv.walletAddress}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full flex-shrink-0">
                <ShieldCheck size={11} className="text-green-400" />
                <span className="text-[9px] font-black uppercase text-white/60">Admin</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#fdfcfa]">
              {activeConv.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                  <Circle size={32} className="text-slate-200" />
                  <p className="font-black text-slate-300 text-sm uppercase">
                    No messages yet
                  </p>
                  <p className="text-xs text-slate-300">
                    When the user sends a message, it will appear here
                  </p>
                </div>
              ) : (
                activeConv.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${
                        msg.sender === "admin"
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                      }`}
                    >
                      {msg.sender === "user" && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          User
                        </p>
                      )}
                      {msg.sender === "admin" && (
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                          You (Admin)
                        </p>
                      )}
                      <p>{msg.text}</p>
                      <p
                        className={`text-[9px] mt-1 font-mono ${
                          msg.sender === "admin" ? "text-white/40 text-right" : "text-slate-400"
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

            {/* Reply Input */}
            <div className="flex gap-3 p-4 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <input
                ref={inputRef}
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to user..."
                maxLength={1000}
                className="flex-1 h-11 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyInput.trim() || sending || !connected}
                className="w-11 h-11 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Hook: total unread count for nav badge ───────────────────────────────────
export function useAdminUnreadCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const ably = new Ably.Realtime({ key: ABLY_KEY });
    const subscribedWallets = new Set<string>();
    const inboxChannel = ably.channels.get("kapogian-support-inbox");

    inboxChannel.subscribe("user-connected", (msg) => {
      const { walletAddress } = msg.data as { walletAddress: string };
      if (!walletAddress || subscribedWallets.has(walletAddress)) return;
      subscribedWallets.add(walletAddress);
      const ch = ably.channels.get(
        `kapogian-support:${walletAddress.toLowerCase()}`,
      );
      ch.subscribe("user-message", () => {
        setCount((c) => c + 1);
      });
    });

    return () => {
      inboxChannel.unsubscribe();
      ably.close();
    };
  }, []);

  return count;
}