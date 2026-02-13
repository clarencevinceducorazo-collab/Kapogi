"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SummoningPage() {
  const router = useRouter();

  useEffect(() => {
    // --- REDIRECT ---
    const redirectTimeout = setTimeout(() => {
      router.push("/generate");
    }, 7500); // 7.5 seconds, allows full animation to play

    // --- ANIMATION LOGIC ---
    // Elements
    const el = {
      text: document.getElementById("story-text"),
      darkLayer: document.getElementById("dark-layer"),
      flash: document.getElementById("flash-overlay"),
      wizard: document.getElementById("summoning-wizard"),
      rings: document.getElementById("ritual-rings"),
      ringOuter: document.getElementById("ring-outer"),
      ringInner: document.getElementById("ring-inner"),
      glow: document.getElementById("center-glow"),
      emeraldBg: document.getElementById("emerald-bg"),
      particleAnchor: document.getElementById("particle-anchor"),
      finalUi: document.getElementById("final-ui"),
    };

    // Check if all elements are found before proceeding
    if (
      !el.text ||
      !el.darkLayer ||
      !el.flash ||
      !el.wizard ||
      !el.rings ||
      !el.ringOuter ||
      !el.ringInner ||
      !el.glow ||
      !el.emeraldBg ||
      !el.particleAnchor ||
      !el.finalUi
    ) {
      console.error("One or more elements for loading animation not found.");
      // If elements are missing, just redirect immediately to not get stuck.
      router.push("/generate");
      return;
    }

    // Helper: Play Text
    function playText(html: string, duration: number) {
      if (!el.text) return;
      el.text.innerHTML = html;
      el.text.className =
        "font-fantasy text-3xl md:text-5xl font-semibold tracking-wide text-white text-enter drop-shadow-lg";

      setTimeout(() => {
        if (!el.text) return;
        el.text.classList.remove("text-enter");
        el.text.classList.add("text-exit");
      }, duration - 800);
    }

    // Helper: Spawn Particles
    function spawnParticles(type: "converge" | "burst") {
      if (!el.particleAnchor) return;
      const count = type === "converge" ? 30 : 15;
      const colors = ["#FBBF24", "#34D399", "#FFFFFF"]; // Amber, Emerald, White

      for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        const size = Math.random() * 4 + 2;
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.backgroundColor =
          colors[Math.floor(Math.random() * colors.length)]!;
        p.className = "particle";

        // Position relative to center
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const sx = Math.cos(angle) * distance + "px";
        const sy = Math.sin(angle) * distance + "px";

        if (type === "converge") {
          p.style.left = "50%";
          p.style.top = "50%";
          p.style.setProperty("--sx", sx);
          p.style.setProperty("--sy", sy);
          p.style.animation = `converge-center 1.2s ease-in forwards`;
          p.style.animationDelay = Math.random() * 0.5 + "s";
        } else if (type === "burst") {
          // Simple burst out
          p.style.left = "50%";
          p.style.top = "50%";
          p.style.transition = "all 0.8s ease-out";
          p.style.opacity = "1";

          setTimeout(() => {
            p.style.transform = `translate(${sx}, ${sy}) scale(0)`;
            p.style.opacity = "0";
          }, 50);
        }

        el.particleAnchor.appendChild(p);
        setTimeout(() => p.remove(), 2000);
      }
    }

    // --- Sequence Start ---
    const timeouts: NodeJS.Timeout[] = [];

    // 2. First Light Pop - Welcome (1.5s)
    timeouts.push(
      setTimeout(() => {
        if (!el.rings || !el.wizard || !el.glow) return;
        el.rings.classList.remove("opacity-20", "scale-95");
        el.rings.classList.add("opacity-100", "scale-100");
        el.wizard.classList.remove("opacity-0");
        el.glow.classList.replace("bg-emerald-500/0", "bg-amber-500/10");
        spawnParticles("burst");
        playText(
          `Welcome, Kapogi, to the<br/><span class="text-amber-300 text-glow-gold">Kapogian Summoning!</span>`,
          1500,
        );
      }, 1500),
    );

    // 3. Second Pop - Engagement (3s)
    timeouts.push(
      setTimeout(() => {
        if (!el.glow) return;
        el.glow.classList.replace("bg-amber-500/10", "bg-indigo-500/20");
        spawnParticles("converge");
        playText(
          `Are you ready to create your<br/><span class="text-emerald-300 text-glow-emerald">Unique Character?</span>`,
          1800,
        );
      }, 3500),
    );

    // 4. Final Text Pop - Start (5s)
    timeouts.push(
      setTimeout(() => {
        if (!el.emeraldBg || !el.wizard) return;
        el.emeraldBg.classList.remove("opacity-0");
        el.emeraldBg.classList.add("opacity-60");
        el.wizard.classList.add("animate-pulse");
        playText(
          `<span class="uppercase tracking-widest text-4xl md:text-6xl text-white text-magical">It starts now!</span>`,
          1200,
        );
      }, 5500),
    );

    // 5. Ultimate White Reveal (6.5s)
    timeouts.push(
      setTimeout(() => {
        if (
          !el.flash ||
          !el.darkLayer ||
          !el.wizard ||
          !el.ringOuter ||
          !el.ringInner ||
          !el.finalUi
        )
          return;
        el.flash.classList.add("white-flash");

        setTimeout(() => {
          if (!el.darkLayer) return;
          el.darkLayer.style.opacity = "0";
        }, 300);

        el.wizard.classList.remove("animate-pulse");
        el.wizard.classList.add("ritual-active-wizard");

        el.ringOuter.classList.replace(
          "border-slate-600/30",
          "border-slate-200",
        );
        el.ringInner.classList.replace(
          "border-slate-700/40",
          "border-slate-300",
        );

        el.finalUi.classList.remove("opacity-0", "translate-y-4");
        el.finalUi.classList.add("opacity-100", "translate-y-0");
      }, 6800),
    );

    // Cleanup function
    return () => {
      clearTimeout(redirectTimeout);
      timeouts.forEach(clearTimeout);
    };
  }, [router]);

  return (
    <>
      <style jsx global>{`
        body {
          font-family: "Inter", sans-serif;
          background-color: #ffffff; /* Final reveal color */
          overflow: hidden;
        }

        .font-fantasy {
          font-family: "Cinzel", serif;
        }

        /* --- Ambient Animations --- */
        @keyframes drift-shadow {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 0.1;
          }
          80% {
            opacity: 0.1;
          }
          100% {
            transform: translate(-60px, -100px) rotate(15deg);
            opacity: 0;
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.3);
          }
        }

        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* --- Sequence Specific Animations --- */

        /* Text Appear (Pop) */
        @keyframes text-pop-enter {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            filter: blur(8px);
          }
          40% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* Text Disappear (Flash/Fade) */
        @keyframes text-flash-exit {
          0% {
            opacity: 1;
            transform: scale(1);
            filter: blur(0px);
            text-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          20% {
            opacity: 1;
            transform: scale(1.02);
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            color: white;
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
            filter: blur(4px);
          }
        }

        /* Particle Converge (Implosion) */
        @keyframes converge-center {
          0% {
            transform: translate(var(--sx), var(--sy)) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(var(--sx), var(--sy)) scale(1);
          }
          100% {
            transform: translate(0, 0) scale(0.5);
            opacity: 0;
          }
        }

        /* White Flash Overlay */
        @keyframes flash-white-screen {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        /* Wizard Final Pulse */
        @keyframes wizard-active-pulse {
          0% {
            filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
          }
          100% {
            filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.2));
          }
        }

        .animate-drift {
          animation: drift-shadow 12s infinite ease-out;
        }
        .animate-rotate {
          animation: rotate-slow 40s linear infinite;
        }
        .animate-rotate-reverse {
          animation: rotate-slow 30s linear infinite reverse;
        }

        /* Utility classes for JS triggering */
        .text-enter {
          animation: text-pop-enter 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .text-exit {
          animation: text-flash-exit 0.8s ease-in forwards;
        }
        .white-flash {
          animation: flash-white-screen 1s ease-out forwards;
        }
        .ritual-active-wizard {
          animation: wizard-active-pulse 2s infinite;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        /* Typography Effects */
        .text-magical {
          text-shadow: 0 0 25px rgba(255, 255, 255, 0.3);
        }
        .text-glow-gold {
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
        }
        .text-glow-emerald {
          text-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
        }

        /* Transition Utilities */
        .transition-long {
          transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hide scrollbar */
        body::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="relative h-screen w-full bg-white selection:bg-emerald-500/30">
        {/* Flash Overlay (Z-50) */}
        <div
          id="flash-overlay"
          className="pointer-events-none absolute inset-0 z-50 bg-white opacity-0"
        ></div>

        {/* Dark Ambience Layer (Z-10) - Will dissolve at end */}
        <div
          id="dark-layer"
          className="absolute inset-0 z-10 bg-slate-950 transition-opacity duration-[1500ms]"
        >
          {/* Deep Background Gradient (Indigo to Black) */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/80 via-slate-950 to-black"></div>

          {/* Emerald Gradient (Fades in later) */}
          <div
            id="emerald-bg"
            className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-[2000ms]"
          ></div>

          {/* Floating Shadows / Glyphs */}
          <div
            className="absolute inset-0 overflow-hidden"
            id="shadow-container"
          >
            {/* Shadows generated by JS or static ones here */}
            <div
              className="absolute top-1/4 left-1/4 animate-drift text-slate-700 opacity-20"
              style={{ animationDelay: "0s" }}
            >
              <iconify-icon
                icon="solar:black-hole-linear"
                width="64"
              ></iconify-icon>
            </div>
            <div
              className="absolute bottom-1/3 right-1/4 animate-drift text-slate-700 opacity-20"
              style={{ animationDelay: "2s" }}
            >
              <iconify-icon
                icon="solar:asteroid-linear"
                width="48"
              ></iconify-icon>
            </div>
            <div
              className="absolute top-1/2 left-1/3 animate-drift text-slate-700 opacity-20"
              style={{ animationDelay: "4s" }}
            >
              <iconify-icon icon="solar:stars-linear" width="32"></iconify-icon>
            </div>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(transparent_40%,_black_100%)] pointer-events-none"></div>
        </div>

        {/* Main Stage (Z-20) */}
        <main className="relative z-20 h-full w-full p-6 grid place-items-center">
          {/* Central Glow Source */}
          <div
            id="center-glow"
            className="pointer-events-none absolute h-[600px] w-[600px] rounded-full bg-emerald-500/0 blur-[100px] transition-all duration-[2000ms]"
          ></div>

          {/* Text Container (Overlay) */}
          <div className="absolute top-[20%] z-30 flex w-full max-w-2xl flex-col items-center justify-center text-center">
            <h1
              id="story-text"
              className="font-fantasy text-3xl font-semibold tracking-wide text-transparent md:text-5xl"
            >
              {/* Text injected by JS */}
            </h1>
          </div>

          {/* The Summoning Container */}

          {/* Ritual Rings */}
          <div
            id="ritual-rings"
            className="relative flex h-72 w-72 items-center justify-center transition-all duration-[1000ms] opacity-20 scale-95 md:h-96 md:w-96"
          >
            {/* Outer Ring */}
            <div
              id="ring-outer"
              className="absolute inset-0 animate-rotate rounded-full border border-dashed border-slate-600/30 transition-colors duration-1000"
            ></div>
            {/* Inner Ring */}
            <div
              id="ring-inner"
              className="absolute inset-8 animate-rotate-reverse rounded-full border border-dotted border-slate-700/40 transition-colors duration-1000"
            ></div>

            {/* Particle Anchor */}
            <div
              id="particle-anchor"
              className="absolute inset-0 pointer-events-none overflow-visible"
            ></div>
          </div>

          {/* The Wizard GIF */}
          <Image
            id="summoning-wizard"
            src="/images/effects/wizard.gif"
            alt="Summoning Wizard"
            width={256}
            height={256}
            unoptimized
            className="absolute w-40 h-40 md:w-46 md:h-56 opacity-0 transition-opacity duration-[1200ms]"
          />

          {/* Post-Reveal UI (Hidden Initially) */}
          <div
            id="final-ui"
            className="absolute top-1/2 mt-40 flex flex-col items-center gap-3 opacity-0 transition-all duration-1000 translate-y-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/50 px-4 py-1.5 shadow-sm backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase font-sans">
                Summoning Complete
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
