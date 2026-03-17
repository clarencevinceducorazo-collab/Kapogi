"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { X, Bell } from "lucide-react";

const ABLY_KEY = "YEbuRQ.r9odYA:eJmjank2w4vunEmM6HKLsKY557aJyRLPd8urztGykVs";

function getCurrentWallet(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("sui-dapp-kit:wallet-connection-info");
    if (raw) {
      const parsed = JSON.parse(raw);
      const addr = parsed?.state?.lastConnectedAccountAddress;
      if (addr && addr.startsWith("0x")) return addr.toLowerCase();
    }
    return null;
  } catch { return null; }
}

interface NotificationPayload {
  id:        string;
  title:     string;
  desc:      string;
  image:     string | null;
  timestamp: number;
  target:    string;
}

// ─── Floating cloud/star decorations ─────────────────────────────────────────
function Deco() {
  return (
    <>
      {/* Cloud puffs */}
      <span className="kapo-deco kapo-cloud1" aria-hidden>☁️</span>
      <span className="kapo-deco kapo-cloud2" aria-hidden>🌤️</span>
      {/* Sparkle dots */}
      <span className="kapo-deco kapo-star1" aria-hidden>✦</span>
      <span className="kapo-deco kapo-star2" aria-hidden>✦</span>
      <span className="kapo-deco kapo-star3" aria-hidden>✦</span>
    </>
  );
}

// ─── Single Notification Card ─────────────────────────────────────────────────
function NotifCard({
  notif,
  onDismiss,
}: {
  notif: NotificationPayload;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(), 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => onDismiss(notif.id), 400);
  }, [notif.id, onDismiss]);

  const isPersonal = notif.target !== "all";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Fredoka:wght@500;600;700&display=swap');

        .kapo-card {
          font-family: 'Nunito', sans-serif;
          position: relative;
          width: 360px;
          max-width: calc(100vw - 2rem);
          border-radius: 24px;
          overflow: hidden;
          transition: opacity 0.4s cubic-bezier(.34,1.56,.64,1),
                      transform 0.4s cubic-bezier(.34,1.56,.64,1);
          /* Sky glass card */
          background: linear-gradient(145deg,
            rgba(255,255,255,0.92) 0%,
            rgba(224,242,254,0.95) 50%,
            rgba(240,249,255,0.92) 100%);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255,255,255,0.8);
          box-shadow:
            0 8px 32px rgba(56,189,248,0.25),
            0 2px 8px rgba(14,165,233,0.15),
            inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .kapo-card.visible   { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        .kapo-card.hidden    { opacity: 0; transform: translateY(-20px) scale(0.92) rotate(-1deg); }
        .kapo-card.leaving   { opacity: 0; transform: translateY(-16px) scale(0.94) rotate(1deg); }

        /* Animated rainbow top bar */
        .kapo-topbar {
          height: 5px;
          width: 100%;
          background: linear-gradient(90deg,
            #38bdf8, #818cf8, #f472b6, #fb923c, #facc15, #34d399, #38bdf8);
          background-size: 200% 100%;
          animation: kapo-slide 3s linear infinite;
        }
        @keyframes kapo-slide {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        /* Bell icon bubble */
        .kapo-bell {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(56,189,248,0.45), 0 0 0 3px rgba(255,255,255,0.9);
          animation: kapo-wiggle 2.5s ease-in-out infinite;
        }
        @keyframes kapo-wiggle {
          0%,100% { transform: rotate(-8deg) scale(1); }
          25%      { transform: rotate(8deg) scale(1.05); }
          50%      { transform: rotate(-4deg) scale(1); }
          75%      { transform: rotate(6deg) scale(1.03); }
        }

        /* Label */
        .kapo-label {
          font-family: 'Fredoka', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0ea5e9;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        /* Personal badge */
        .kapo-badge {
          background: linear-gradient(90deg, #f472b6, #c084fc);
          color: white;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 6px rgba(244,114,182,0.4);
        }

        /* Title */
        .kapo-title {
          font-family: 'Fredoka', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0c4a6e;
          line-height: 1.25;
        }

        /* Desc */
        .kapo-desc {
          font-size: 12px;
          font-weight: 600;
          color: #4b7c9a;
          line-height: 1.55;
          margin-top: 6px;
        }

        /* Close button */
        .kapo-close {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
          border: 1.5px solid rgba(56,189,248,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7dd3f8;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .kapo-close:hover {
          background: #f43f5e;
          border-color: #f43f5e;
          color: white;
          transform: rotate(90deg) scale(1.1);
        }

        /* Progress bar */
        .kapo-bar-track {
          height: 4px;
          background: rgba(186,230,253,0.6);
          border-radius: 999px;
          overflow: hidden;
          margin-top: 12px;
        }
        .kapo-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #38bdf8, #818cf8, #f472b6);
          background-size: 200% 100%;
          animation: kapo-bar 8s linear forwards, kapo-slide 1.5s linear infinite;
        }
        @keyframes kapo-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }

        /* Floating deco elements */
        .kapo-deco {
          position: absolute;
          pointer-events: none;
          user-select: none;
          line-height: 1;
        }
        .kapo-cloud1 { top: 6px; right: 48px; font-size: 13px; opacity: 0.35; animation: kapo-float 4s ease-in-out infinite; }
        .kapo-cloud2 { bottom: 10px; left: 8px; font-size: 11px; opacity: 0.25; animation: kapo-float 5s ease-in-out infinite reverse; }
        .kapo-star1  { top: 14px; right: 16px; font-size: 7px; color: #facc15; opacity: 0.7; animation: kapo-twinkle 1.8s ease-in-out infinite; }
        .kapo-star2  { bottom: 18px; right: 22px; font-size: 6px; color: #f472b6; opacity: 0.6; animation: kapo-twinkle 2.3s ease-in-out infinite 0.5s; }
        .kapo-star3  { top: 38px; left: 12px; font-size: 5px; color: #818cf8; opacity: 0.5; animation: kapo-twinkle 2s ease-in-out infinite 1s; }

        @keyframes kapo-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes kapo-twinkle {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }

        /* Subtle inner glow at bottom */
        .kapo-inner-glow {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(to top, rgba(186,230,253,0.25), transparent);
          pointer-events: none;
        }
      `}</style>

      <div
        className={`kapo-card ${visible && !leaving ? "visible" : leaving ? "leaving" : "hidden"}`}
        role="alert"
        aria-live="polite"
      >
        {/* Rainbow top bar */}
        <div className="kapo-topbar" />

        {/* Floating decorations */}
        <Deco />

        {/* Inner glow */}
        <div className="kapo-inner-glow" />

        <div style={{ padding: "14px 16px 14px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            {/* Bell */}
            <div className="kapo-bell">
              <Bell size={17} color="white" strokeWidth={2.5} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kapo-label">
                ✦ Kapogian
                {isPersonal && (
                  <span className="kapo-badge">Just for you 🌟</span>
                )}
              </div>
              <div className="kapo-title">{notif.title}</div>
            </div>

            {/* Close */}
            <button className="kapo-close" onClick={dismiss} aria-label="Dismiss notification">
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>

          {/* Image */}
          {notif.image && (
            <div style={{
              marginTop: "10px",
              borderRadius: "14px",
              overflow: "hidden",
              border: "2px solid rgba(186,230,253,0.6)",
              boxShadow: "0 4px 16px rgba(56,189,248,0.15)"
            }}>
              <img
                src={notif.image}
                alt="notification"
                style={{ width: "100%", maxHeight: "140px", objectFit: "cover", display: "block" }}
              />
            </div>
          )}

          {/* Description */}
          {notif.desc && (
            <p className="kapo-desc">{notif.desc}</p>
          )}

          {/* Progress bar */}
          <div className="kapo-bar-track">
            <div className="kapo-bar-fill" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GlobalNotification() {
  const [notifs, setNotifs] = useState<NotificationPayload[]>([]);
  const seenRef             = useRef<Set<string>>(new Set());

  const addNotif = useCallback((data: NotificationPayload, id: string) => {
    if (seenRef.current.has(id)) return;
    seenRef.current.add(id);
    setNotifs(prev => [...prev, {
      id,
      title:     data.title     ?? "Kapogian",
      desc:      data.desc      ?? "",
      image:     data.image     ?? null,
      timestamp: data.timestamp ?? Date.now(),
      target:    data.target    ?? "all",
    }]);
  }, []);

  useEffect(() => {
    const instances: Ably.Realtime[] = [];

    const ablyInbox = new Ably.Realtime({ key: ABLY_KEY });
    instances.push(ablyInbox);

    const inbox = ablyInbox.channels.get("kapogian-support-inbox");
    inbox.subscribe("broadcast-notification", (msg) => {
      const data   = msg.data as NotificationPayload;
      const id     = msg.id ?? `notif-${data.timestamp}`;
      const target = data.target ?? "all";
      if (target === "all") addNotif(data, id);
    });

    const wallet = getCurrentWallet();

    if (wallet) {
      const ablyPersonal = new Ably.Realtime({ key: ABLY_KEY });
      instances.push(ablyPersonal);
      ablyPersonal.channels
        .get(`kapogian-support:${wallet}`)
        .subscribe("broadcast-notification", (msg) => {
          const data = msg.data as NotificationPayload;
          const id   = msg.id ?? `notif-personal-${data.timestamp}`;
          addNotif(data, id);
        });
    } else {
      let personalAbly: Ably.Realtime | null = null;
      const intervalId = setInterval(() => {
        const w = getCurrentWallet();
        if (!w || personalAbly) return;
        personalAbly = new Ably.Realtime({ key: ABLY_KEY });
        instances.push(personalAbly);
        personalAbly.channels
          .get(`kapogian-support:${w}`)
          .subscribe("broadcast-notification", (msg) => {
            const data = msg.data as NotificationPayload;
            const id   = msg.id ?? `notif-personal-${data.timestamp}`;
            addNotif(data, id);
          });
        clearInterval(intervalId);
      }, 3000);

      return () => {
        clearInterval(intervalId);
        instances.forEach(a => a.close());
      };
    }

    return () => instances.forEach(a => a.close());
  }, [addNotif]);

  const dismiss = useCallback((id: string) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  if (notifs.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      alignItems: "flex-end",
      pointerEvents: "none",
    }}>
      {notifs.map(n => (
        <div key={n.id} style={{ pointerEvents: "auto" }}>
          <NotifCard notif={n} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}