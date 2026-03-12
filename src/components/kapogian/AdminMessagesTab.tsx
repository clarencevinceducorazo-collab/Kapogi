"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import {
  MessageCircle, Send, Loader2, User, ShieldCheck,
  Inbox, Circle, Phone, PhoneOff, PhoneCall, PhoneMissed,
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

type AdminCallState =
  | { status: "idle" }
  | { status: "calling";  walletAddress: string }
  | { status: "active";   walletAddress: string; startedAt: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "turn:openrelay.metered.ca:80",                username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443",               username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

const shortAddr = (a: string) => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;

// ─── Sub-components ───────────────────────────────────────────────────────────

function CallTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <span className="font-mono tabular-nums">
      {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminMessagesTab() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeWallet, setActiveWallet]   = useState<string | null>(null);
  const [replyInput, setReplyInput]       = useState("");
  const [connected, setConnected]         = useState(false);
  const [sending, setSending]             = useState(false);
  const [callState, setCallState]         = useState<AdminCallState>({ status: "idle" });

  // Ably refs
  const ablyRef    = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, Ably.RealtimeChannel>>(new Map());
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  // WebRTC refs — all inlined, no hook
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudio    = useRef<HTMLAudioElement | null>(null);
  const iceBufRef      = useRef<RTCIceCandidateInit[]>([]);
  const sigChannelRef  = useRef<Ably.RealtimeChannel | null>(null); // channel for current call

  // One-time boot guard
  const bootedRef = useRef(false);

  // ── WebRTC teardown ────────────────────────────────────────────────────
  const hangup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudio.current) { remoteAudio.current.srcObject = null; remoteAudio.current = null; }
    iceBufRef.current = [];
    sigChannelRef.current = null;
    console.log("[RTC-admin] hangup");
  }, []);

  // ── Build offerer PC and create offer ─────────────────────────────────
  // mic is already granted before calling this (from button click)
  const startCall = useCallback(async (ch: Ably.RealtimeChannel, mic: MediaStream) => {
    console.log("[RTC-admin] startCall: building PC");

    pcRef.current?.close();
    pcRef.current = null;
    iceBufRef.current = [];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    sigChannelRef.current = ch;

    // Add local mic
    mic.getTracks().forEach((t) => {
      console.log("[RTC-admin] adding track:", t.kind);
      pc.addTrack(t, mic);
    });

    // Remote audio
    pc.ontrack = (evt) => {
      console.log("[RTC-admin] ontrack:", evt.track.kind);
      const stream = evt.streams[0] ?? new MediaStream([evt.track]);
      if (!remoteAudio.current) {
        const a = new Audio();
        a.autoplay = true;
        a.setAttribute("playsinline", "true");
        remoteAudio.current = a;
      }
      remoteAudio.current.srcObject = stream;
      remoteAudio.current.play()
        .then(() => console.log("[RTC-admin] remote audio ✓"))
        .catch(() => {
          const retry = () => { remoteAudio.current?.play().catch(() => {}); document.removeEventListener("click", retry); };
          document.addEventListener("click", retry, { once: true });
        });
    };

    // Send ICE to user
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) ch.publish("webrtc-ice", { candidate: candidate.toJSON() }).catch(console.error);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[RTC-admin] ICE:", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };
    pc.onconnectionstatechange = () => console.log("[RTC-admin] conn:", pc.connectionState);

    // Create and publish offer
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);
    console.log("[RTC-admin] publishing webrtc-offer");
    await ch.publish("webrtc-offer", { sdp: pc.localDescription });

    // Flush any ICE that arrived before remote desc
    // (unlikely for offerer but just in case)
    for (const c of iceBufRef.current) {
      if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
    }
  }, []);

  // ── Subscribe to a user's channel ─────────────────────────────────────
  const subscribeToUser = useCallback((walletAddress: string, ablyInst: Ably.Realtime) => {
    if (channelsRef.current.has(walletAddress)) return;

    const channelName = `kapogian-support:${walletAddress.toLowerCase()}`;
    const ch = ablyInst.channels.get(channelName);
    channelsRef.current.set(walletAddress, ch);

    // History
    (async () => {
      try {
        await ch.attach();
        const page = await ch.history({ limit: 100, direction: "forwards" });
        const historical: SupportMessage[] = page.items
          .filter((m) => m.name === "user-message" || m.name === "admin-message")
          .map((m) => ({
            id: m.id ?? `hist-${Math.random()}`,
            text: m.data.text,
            sender: (m.name === "admin-message" ? "admin" : "user") as "admin" | "user",
            timestamp: m.data.timestamp ?? (m as any).timestamp ?? Date.now(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (historical.length > 0) {
          setConversations((prev) => {
            const next = new Map(prev);
            const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
            const ids = new Set(conv.messages.map((m) => m.id));
            const merged = [...conv.messages, ...historical.filter((m) => !ids.has(m.id))].sort((a, b) => a.timestamp - b.timestamp);
            next.set(walletAddress, { ...conv, messages: merged, lastActivity: merged.at(-1)?.timestamp ?? conv.lastActivity });
            return next;
          });
        }
      } catch (e) { if ((e as any)?.code !== 80017) console.warn("history failed:", e); }
    })();

    // Live chat
    ch.subscribe("user-message", (msg) => {
      const newMsg: SupportMessage = {
        id: msg.id ?? `${Date.now()}`,
        text: msg.data.text, sender: "user",
        timestamp: msg.data.timestamp ?? Date.now(),
      };
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(walletAddress) ?? { walletAddress, messages: [], unread: 0, lastActivity: Date.now() };
        if (conv.messages.some((m) => m.id === newMsg.id)) return prev;
        setActiveWallet((cur) => {
          next.set(walletAddress, {
            ...conv,
            messages: [...conv.messages, newMsg],
            unread: cur === walletAddress ? 0 : conv.unread + 1,
            lastActivity: Date.now(),
          });
          return cur;
        });
        return next;
      });
    });

    // ── Call signaling ─────────────────────────────────────────────────
    // User accepted → now we build the PC and send the offer
    // Guard against duplicate call-accepted events
    let offerSent = false;
    ch.subscribe("call-accepted", () => {
      console.log("[RTC-admin] call-accepted from", walletAddress);
      if (offerSent) { console.log("[RTC-admin] duplicate call-accepted, ignoring"); return; }

      setCallState((prev) => {
        if (prev.status !== "calling" || prev.walletAddress !== walletAddress) return prev;
        offerSent = true;
        const mic = localStreamRef.current;
        if (!mic) { console.error("[RTC-admin] no mic stream available!"); return prev; }
        startCall(ch, mic).catch(console.error);
        return { status: "active", walletAddress, startedAt: Date.now() };
      });
    });

    ch.subscribe("call-rejected", () => {
      console.log("[RTC-admin] call-rejected by", walletAddress);
      setCallState((prev) => {
        if (prev.status === "calling" && prev.walletAddress === walletAddress) {
          hangup(); return { status: "idle" };
        }
        return prev;
      });
    });

    ch.subscribe("call-ended", () => {
      console.log("[RTC-admin] call-ended by", walletAddress);
      setCallState((prev) => {
        if (prev.status !== "idle" && prev.walletAddress === walletAddress) {
          hangup(); return { status: "idle" };
        }
        return prev;
      });
    });

    // Receive answer from user
    ch.subscribe("webrtc-answer", (msg) => {
      console.log("[RTC-admin] webrtc-answer received");
      const pc = pcRef.current;
      if (!pc) { console.warn("[RTC-admin] no PC for answer"); return; }
      if (pc.signalingState !== "have-local-offer") {
        console.warn("[RTC-admin] wrong signaling state for answer:", pc.signalingState);
        return;
      }
      pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp as RTCSessionDescriptionInit))
        .then(async () => {
          console.log("[RTC-admin] remote desc set ✓");
          for (const c of iceBufRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
          }
          iceBufRef.current = [];
        })
        .catch(console.error);
    });

    // Receive ICE from user
    ch.subscribe("webrtc-ice", (msg) => {
      const candidate = msg.data.candidate as RTCIceCandidateInit;
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        iceBufRef.current.push(candidate);
        return;
      }
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    });

    // Register conversation
    setConversations((prev) => {
      if (prev.has(walletAddress)) return prev;
      const next = new Map(prev);
      next.set(walletAddress, { walletAddress, messages: [], unread: 0, lastActivity: Date.now() });
      return next;
    });
  }, [hangup, startCall]);

  // ── Boot Ably (once) ───────────────────────────────────────────────────
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    const ably = new Ably.Realtime({ key: ABLY_KEY });
    ablyRef.current = ably;

    ably.connection.on("connected",    () => setConnected(true));
    ably.connection.on("disconnected", () => setConnected(false));
    ably.connection.on("failed",       () => setConnected(false));

    ably.channels.get("kapogian-support-inbox").subscribe("user-connected", (msg) => {
      const { walletAddress } = msg.data as { walletAddress: string };
      if (walletAddress) subscribeToUser(walletAddress, ably);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initiate call (button click → mic here) ───────────────────────────
  const handleInitiateCall = useCallback(async () => {
    if (!activeWallet || callState.status !== "idle") return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;

    // Mic MUST be from button click (user gesture)
    let mic: MediaStream;
    try {
      mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log("[RTC-admin] mic granted ✓");
    } catch {
      alert("Microphone access is required to make a call.\nPlease allow mic access in your browser settings.");
      return;
    }

    localStreamRef.current = mic;
    setCallState({ status: "calling", walletAddress: activeWallet });

    try {
      await ch.publish("call-request", { timestamp: Date.now() });
      console.log("[RTC-admin] published call-request");
    } catch {
      hangup();
      setCallState({ status: "idle" });
    }
  }, [activeWallet, callState.status, hangup]);

  const handleEndCall = useCallback(async () => {
    if (callState.status === "idle") return;
    const wallet = callState.walletAddress;
    hangup();
    setCallState({ status: "idle" });
    const ch = channelsRef.current.get(wallet);
    if (ch) await ch.publish("call-ended", { from: "admin", timestamp: Date.now() }).catch(() => {});
  }, [callState, hangup]);

  // ── Send message ──────────────────────────────────────────────────────
  const handleSendReply = useCallback(async () => {
    const text = replyInput.trim();
    if (!text || !activeWallet || sending) return;
    const ch = channelsRef.current.get(activeWallet);
    if (!ch) return;
    setSending(true);
    const msgId = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const timestamp = Date.now();
    const optimistic: SupportMessage = { id: msgId, text, sender: "admin", timestamp };
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(activeWallet);
      if (conv) next.set(activeWallet, { ...conv, messages: [...conv.messages, optimistic], lastActivity: Date.now() });
      return next;
    });
    setReplyInput("");
    try {
      await ch.publish("admin-message", { text, timestamp });
    } catch {
      setConversations((prev) => {
        const next = new Map(prev);
        const conv = next.get(activeWallet);
        if (conv) next.set(activeWallet, { ...conv, messages: conv.messages.filter((m) => m.id !== msgId) });
        return next;
      });
      setReplyInput(text);
    } finally { setSending(false); }
  }, [replyInput, activeWallet, sending]);

  const selectConversation = (wallet: string) => {
    setActiveWallet(wallet);
    setConversations((prev) => {
      const next = new Map(prev);
      const conv = next.get(wallet);
      if (conv) next.set(wallet, { ...conv, unread: 0 });
      return next;
    });
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); inputRef.current?.focus(); }, 50);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversations, activeWallet]);

  const totalUnread  = Array.from(conversations.values()).reduce((s, c) => s + c.unread, 0);
  const sortedConvs  = Array.from(conversations.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  const activeConv   = activeWallet ? conversations.get(activeWallet) : null;
  const isCallActive = callState.status === "active"  && callState.walletAddress === activeWallet;
  const isCalling    = callState.status === "calling" && callState.walletAddress === activeWallet;

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)] min-h-[500px]">

      {/* ── Left: Inbox ─────────────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col gap-3">
        <div className="bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Inbox size={16} />
              <span className="font-black text-sm uppercase tracking-tight">Inbox</span>
              {totalUnread > 0 && (
                <span className="w-5 h-5 bg-red-500 text-[9px] font-black rounded-full flex items-center justify-center">{totalUnread > 9 ? "9+" : totalUnread}</span>
              )}
            </div>
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-slate-500"}`} />
          </div>
          <div className="overflow-y-auto flex-1">
            {sortedConvs.length === 0 ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center h-full justify-center">
                <MessageCircle size={20} className="text-slate-300" />
                <p className="font-black text-slate-300 text-xs uppercase">No messages yet</p>
                <p className="text-[10px] text-slate-300 leading-tight">Users appear automatically when they message</p>
              </div>
            ) : sortedConvs.map((conv) => (
              <button key={conv.walletAddress} onClick={() => selectConversation(conv.walletAddress)}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${activeWallet === conv.walletAddress ? "bg-black text-white hover:bg-black" : ""}`}>
                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${activeWallet === conv.walletAddress ? "border-white/30 bg-white/10" : "border-slate-200 bg-slate-100"}`}>
                  <User size={14} className={activeWallet === conv.walletAddress ? "text-white" : "text-slate-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-xs truncate uppercase ${activeWallet === conv.walletAddress ? "text-white" : "text-slate-800"}`}>{shortAddr(conv.walletAddress)}</p>
                  {conv.messages.length > 0 && (
                    <p className={`text-[10px] font-semibold truncate mt-0.5 ${activeWallet === conv.walletAddress ? "text-white/50" : "text-slate-400"}`}>
                      {conv.messages.at(-1)!.text}
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center flex-shrink-0">{conv.unread > 9 ? "9+" : conv.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Chat ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-2 border-slate-200 flex items-center justify-center">
              <MessageCircle size={32} className="text-slate-300" />
            </div>
            <p className="font-black text-slate-400 uppercase text-base tracking-tight">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-black text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase tracking-tight">{shortAddr(activeConv.walletAddress)}</p>
                <p className="text-[10px] font-mono text-white/40 mt-0.5 truncate">{activeConv.walletAddress}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={11} className="text-green-400" />
                  <span className="text-[9px] font-black uppercase text-white/60">Admin</span>
                </div>
                {callState.status === "idle" ? (
                  <button onClick={handleInitiateCall} disabled={!connected} title="Start voice call"
                    className="w-9 h-9 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center hover:bg-green-400 disabled:opacity-40 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)]">
                    <Phone size={15} className="text-white" />
                  </button>
                ) : (
                  <button onClick={handleEndCall} title={isCalling ? "Cancel call" : "End call"}
                    className="w-9 h-9 rounded-full bg-red-500 border-2 border-red-400 flex items-center justify-center hover:bg-red-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] animate-pulse">
                    {isCalling ? <PhoneMissed size={15} className="text-white" /> : <PhoneOff size={15} className="text-white" />}
                  </button>
                )}
              </div>
            </div>

            {/* Active call banner */}
            {isCallActive && (
              <div className="bg-green-500 border-b-2 border-green-600 px-5 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-0.5 h-4">
                    {[0,1,2,3,4].map((i) => (
                      <span key={i} className="w-1 rounded-full bg-white animate-bounce"
                        style={{ height: `${8 + (i % 3) * 5}px`, animationDelay: `${i * 80}ms`, animationDuration: "0.7s" }} />
                    ))}
                  </div>
                  <span className="text-white font-black text-xs uppercase">
                    Call active · <CallTimer startedAt={(callState as any).startedAt} />
                  </span>
                </div>
                <button onClick={handleEndCall} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  <PhoneOff size={11} /> End
                </button>
              </div>
            )}

            {/* Calling banner */}
            {isCalling && (
              <div className="bg-yellow-400 border-b-2 border-yellow-500 px-5 py-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <PhoneCall size={14} className="text-black animate-pulse" />
                  <span className="text-black font-black text-xs uppercase">Calling user...</span>
                </div>
                <button onClick={handleEndCall} className="flex items-center gap-1.5 bg-black/10 hover:bg-black/20 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full">
                  <PhoneMissed size={11} /> Cancel
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#fdfcfa]">
              {activeConv.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                  <Circle size={32} className="text-slate-200" />
                  <p className="font-black text-slate-300 text-sm uppercase">No messages yet</p>
                </div>
              ) : activeConv.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-semibold leading-snug ${msg.sender === "admin" ? "bg-black text-white rounded-br-sm" : "bg-white border-2 border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"}`}>
                    {msg.sender === "user"  && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">User</p>}
                    {msg.sender === "admin" && <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">You (Admin)</p>}
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 font-mono ${msg.sender === "admin" ? "text-white/40 text-right" : "text-slate-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="flex gap-3 p-4 border-t-2 border-slate-100 bg-white flex-shrink-0">
              <input ref={inputRef} value={replyInput} onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                placeholder="Reply to user..." maxLength={1000}
                className="flex-1 h-11 rounded-2xl border-2 border-slate-200 px-4 text-sm font-semibold outline-none focus:border-black transition-colors bg-slate-50" />
              <button onClick={handleSendReply} disabled={!replyInput.trim() || sending || !connected}
                className="w-11 h-11 rounded-2xl bg-black text-white border-2 border-black flex items-center justify-center disabled:opacity-40 hover:bg-slate-800 transition-colors flex-shrink-0">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Unread count hook for nav badge ─────────────────────────────────────────

export function useAdminUnreadCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const ably = new Ably.Realtime({ key: ABLY_KEY });
    const subscribed = new Set<string>();
    const inbox = ably.channels.get("kapogian-support-inbox");
    inbox.subscribe("user-connected", (msg) => {
      const { walletAddress } = msg.data as { walletAddress: string };
      if (!walletAddress || subscribed.has(walletAddress)) return;
      subscribed.add(walletAddress);
      ably.channels.get(`kapogian-support:${walletAddress.toLowerCase()}`)
        .subscribe("user-message", () => setCount((c) => c + 1));
    });
    return () => { inbox.unsubscribe(); ably.close(); };
  }, []);
  return count;
}