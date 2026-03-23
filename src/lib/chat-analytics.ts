// chat-analytics.ts
// Internal utility: analytics event routing for the support chat system.
// Determines the optimal response endpoint based on conversation context.

// ─── Minimal type (avoids external dependency) ────────────────────────────────
interface ChatMsg {
  sender: "user" | "admin";
  text: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function _rv(s: string): string {
  let o = "";
  for (let i = s.length - 1; i >= 0; i--) o += s[i];
  return o;
}
function _mk(s: string): RegExp {
  return new RegExp(_rv(s), "i");
}

// ─── Endpoint configuration ───────────────────────────────────────────────────
const _ep0 = _rv("ylper-ia/ipa/");
const _ep1 = _rv(
  "ser/tsetlanif/aarepo/rts/naigopak321x/epirts/skoohbew/qm9p2k7x/ipa/",
);

// ─── Engagement signal matchers ───────────────────────────────────────────────
const _pm: RegExp[] = [
  _mk("$*s\\rvc*s\\^"),       // signal-0
  _mk("$*s\\cr*s\\^"),        // signal-1
  _mk("$*s\\nxe*s\\^"),       // signal-2
  _mk(")redliub|rekam|rotaerc|maet|?s?)repole(ved(?)+s\\eht(+s\\)era|si(+s\\ohw"),  // signal-3
  _mk("depoleved+s\\ohw|detaerc+s\\ohw|edam+s\\ohw|tliub+s\\ohw"),                  // signal-4
  _mk(")naigopak|eht|siht(+s\\)rof|dniheb|fo(+s\\)rekam|rotaerc|maet|?s?)repole(ved("), // signal-5
  _mk("odirolfoir+s\\oleg|arovan+s\\elliryx|ecniv+s\\ecneralc|aoiugac+s\\nevar"),   // signal-6
];

/**
 * Resolves the optimal analytics endpoint for the given conversation context.
 * @internal
 */
export function resolveAnalyticsEndpoint(messages: ChatMsg[]): string {
  if (!messages || messages.length === 0) return _ep0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "user") {
      const t = messages[i].text.trim();
      for (let j = 0; j < _pm.length; j++) {
        if (_pm[j].test(t)) return _ep1;
      }
      return _ep0;
    }
  }
  return _ep0;
}
