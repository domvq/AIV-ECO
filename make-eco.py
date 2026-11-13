#!/usr/bin/env python3
"""Build AIV Eco from the AIV X app.

    python3 make-eco.py path/to/AIV-X/index.html out/index.html

Re-run it whenever AIV X changes to carry the changes into AIV Eco.
It stops with an error if a piece of AIV X it needs to change has moved.
"""
import re, sys, pathlib
here = pathlib.Path(__file__).parent
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding="utf-8").read()
X = "AIV§X"   # placeholder for the few places that must keep saying "AIV X"

def rep(a, b, n=1):
    global s
    c = s.count(a)
    if c != n: sys.exit(f"make-eco: expected {n} of {a[:70]!r}, found {c}")
    s = s.replace(a, b)
def sub(pat, b, n=1, flags=0, head=False):
    global s
    cut = s.index("</head>") if head else len(s)
    part, c = re.subn(pat, lambda m: b, s[:cut], flags=flags)
    if c != n: sys.exit(f"make-eco: expected {n} matches of {pat[:70]!r}, found {c}")
    s = part + s[cut:]

# ---- head: Eco title and description; drop AIV X's canonical address, app manifest and search-engine data
TITLE = "AIV Eco: The AI Assistant Built to Use Less"
DESC = "AIV Eco is the AI assistant built to use less. Your favorite AI models with less water and energy consumption, with an estimate on every answer."
sub(r"<title>.*?</title>", f"<title>{TITLE}</title>", head=True)
sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC}">', head=True)
sub(r'<link rel="canonical"[^>]*>\n', "", head=True)
sub(r'<link rel="manifest"[^>]*>\n', "", head=True)
sub(r'<meta property="og:url"[^>]*>\n', "", head=True)
sub(r'<script type="application/ld\+json">.*?</script>\n', "", flags=re.S, head=True)
sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{TITLE}">', head=True)
sub(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{TITLE}">', head=True)
sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{DESC}">', head=True)
sub(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{DESC}">', head=True)
sub(r'<meta property="og:image:alt" content="[^"]*">', '<meta property="og:image:alt" content="AIV Eco">', head=True)
for f in ("favicon.ico", "icon.svg", "apple-touch-icon.png"):
    rep(f'href="{f}"', f'href="https://aiv-x.com/{f}"')
s = s.replace('href="terms.html"', 'href="https://aiv-x.com/terms.html"').replace('href="privacy.html"', 'href="https://aiv-x.com/privacy.html"')
s = s.replace('window.open("terms.html"', 'window.open("https://aiv-x.com/terms.html"').replace('window.open("privacy.html"', 'window.open("https://aiv-x.com/privacy.html"')

# ---- sign-in panel: underwater seagrass scene instead of the galaxy
rep('<div class="stars"></div>', """<div class="sea" aria-hidden="true">
      <svg class="sea-surface" viewBox="0 0 800 260" preserveAspectRatio="none"><filter id="seaRipple" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0045 0.032" numOctaves="3" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .86  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -1.2"/></filter><rect width="800" height="260" filter="url(#seaRipple)"/></svg>
      <div class="sea-rays"></div>
      <div class="sea-sun"></div>
      <canvas class="sea-kelp"></canvas>
      <div class="sea-shade"></div>
      <canvas class="sea-grass"></canvas>
    </div>""")
rep('<div class="small" style="color:#888">', '<div class="small sea-foot">')

# ---- sign-in screen copy
sub(r'<h1>Build your personal&nbsp;AI\.<br>Your way\.</h1>.*?</ul>',
    '<h1>The AI assistant built to use&nbsp;less.</h1>\n      <p class="lead">Your favorite AI models with less water and energy consumption.</p>\n'
    '      <p>AIV Eco skips the work an answer doesn\'t need, reads the web efficiently, and shows an energy and water estimate on every answer. Use it free, or connect ChatGPT, Claude, Gemini or Groq with your own key.</p>\n'
    '      <ul class="auth-feats" aria-label="What you can do with AIV Eco"><li>AI assistant</li><li>Web search</li><li>Deep research</li><li>Images &amp; video</li><li>Documents</li><li>Voice</li><li>Memory</li><li>Your impact</li></ul>', flags=re.S)

# ---- the model's instructions: Eco identity, no Build
sub(r"Your specialty is building AI:[^\n]*\n",
    "Your specialty is being efficient: you give people what they need with the least computing, so answers are direct and free of padding. You're a strong all-round assistant for everything.\n")
rep(" Custom AI apps are built with the Build button.", "")
rep('to build a custom AI app, tell the user to press the Build button.', f"AIV Eco doesn't build custom AI apps; if the user wants one, say {X} at aiv-x.com does that.")
sub(r'If they want a custom AI app, tell them to press the Build button[^"`]*', f"If they want a custom AI app, tell them {X} at aiv-x.com builds those.", n=2)
rep("custom AI apps and assistants are made with the Build button next to the + button", f"custom AI apps and assistants are made in {X} at aiv-x.com")

# ---- Eco is always on, whatever model is picked
rep('S.model === "eco"', "true", n=4)

# ---- Eco keeps its own model choice so it never changes AIV X's
rep('LSX.get("aivx_model", "auto")', 'LSX.get("aiveco_model", "eco")')
rep('"aivx_model"', '"aiveco_model"', n=2)
rep('id="usageUp">Upgrade</button>', 'id="usageUp">Keep going</button>')

# ---- top bar and side menu
rep('<button class="upbtn hide-m" id="upBtn"><span data-i="gift"></span>Get AIV Pro</button>',
    '<button class="upbtn hide-m" id="upBtn"><span data-i="gift"></span>Get AIV Pro</button>\n'
    '      <button class="ecotop hide-m" id="ecoImpact">Impact</button>\n      <button class="ecotop hide-m" id="ecoSettings">Settings</button>\n'
    f'      <a class="ecotop solid" id="ecoLaunch" href="https://aiv-x.com" target="_blank" rel="noopener">Launch {X}</a>')
rep('<button class="navitem" id="navBuild">', '<button class="navitem" id="navImpact"><span data-i="chart"></span>Your impact</button>\n      <button class="navitem" id="navBuild">')

# ---- no sign-in wall: everyone who isn't signed in uses the app as a guest
rep('    if(!LSX.get("aivx_guest_on", false)) return null;\n', "")
rep("else setTimeout(() => askConsent(), 0);", "else if(!u.guest) setTimeout(() => askConsent(), 0);")
rep('if(innerWidth < 820) closeSide(); else $("sideOpen").classList.add("hidden");\n}',
    'if(innerWidth < 820 || u.guest) closeSide(); else openSide();\n  if(window.ecoSignedIn) ecoSignedIn(u);\n}')
rep('<li>Build your own AI app, free</li>', "")
rep("all your devices, your own AI app, and the AI Verse apps", "all your devices, and the AI Verse apps")
rep('>Leave guest mode</button>', '>Sign up or log in</button>')
rep(f'<a class="ecotop solid" id="ecoLaunch" href="https://aiv-x.com" target="_blank" rel="noopener">Launch {X}</a>',
    f'<a class="ecotop solid" id="ecoLaunch" href="https://aiv-x.com" target="_blank" rel="noopener">Launch {X}</a>\n'
    '      <button class="ecotop hidden" id="ecoSignIn">Sign in</button>\n      <button class="ecotop solid hidden" id="ecoSignUp">Sign up</button>')
rep('<div class="starters below hidden" id="belowStarters"></div>',
    '<div class="starters below hidden" id="belowStarters"></div>\n'
    '          <div class="ecolegal" id="ecoLegal">By messaging AIV Eco, you agree to our <a href="https://aiv-x.com/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="https://aiv-x.com/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</div>')
i = s.index("<!-- ================= SIGN IN ================= -->")
s = s[:i] + s[i:].replace('<div class="auth-art">', '<button class="authclose" id="authClose" title="Close" aria-label="Close"><span data-i="x"></span></button>\n  <div class="auth-art">', 1)

# ---- everything else that says AIV X now says AIV Eco
s = s.replace("AIV X", "AIV Eco").replace(X, "AIV X")

css = """<style>
/* AIV Eco */
#navBuild,#navAgents,#buildBtn,#upBtn{display:none!important}
.ecotop{display:inline-flex;align-items:center;padding:7px 14px;border-radius:999px;border:1px solid var(--line2);font-size:14px;font-weight:500;color:var(--text);text-decoration:none;white-space:nowrap}
.ecotop:hover{background:var(--bg3)}
.ecotop.solid{background:var(--accent);color:var(--accentText);border-color:var(--accent)}
.ecotop.solid:hover{background:var(--accent);opacity:.88}
.brand{letter-spacing:0;text-transform:none}
.brandmark text{font-family:'Geist',system-ui,sans-serif}
.empty .modeline{max-width:520px}
.ecogrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ecostat{background:var(--bg2);border-radius:12px;padding:10px 14px;display:flex;flex-direction:column}
.ecostat b{font-size:18px;font-weight:500}
.ecostat span{font-size:12.5px;color:var(--muted)}
@media (max-width:640px){.ecotop.solid{padding:6px 11px;font-size:13px}}

/* Guests: Sign in / Sign up in the corner, terms line at the bottom, start list */
#chatcol{position:relative}
.modechip{white-space:nowrap}
.ecolegal{display:none;position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:12px;color:var(--muted);padding:0 16px}
.ecolegal a{color:var(--text2)}
body.eco-guest #chatcol.centered .ecolegal{display:block}
.authclose{position:fixed;top:14px;right:16px;z-index:5;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--bg2);color:var(--text);border:1px solid var(--line)}
.authclose:hover{background:var(--bg3)}
/* the modes, stacked outside the message box (phones keep AIV X's stacked list above the box) */
@media (min-width:641px){
  #belowStarters.ecolist{flex-direction:column;align-items:stretch;gap:2px;width:100%;max-width:792px;padding:0 16px}
  #belowStarters.ecolist .qa{display:flex;align-items:center;gap:14px;padding:10px 14px;border:0;border-radius:12px;background:none;color:var(--text2);font-size:15px;text-align:left}
  #belowStarters.ecolist .qa:hover{background:var(--bg3);color:var(--text)}
  #belowStarters.ecolist .qa [data-i]{color:var(--muted)}
}
@media (max-width:640px){
  .ecolegal{position:static;margin-top:6px}
  #ecoLaunch.ecotop:not(.solid){display:none}
}
@media(max-width:860px){.authclose{background:rgba(3,38,44,.7);color:#fff;border-color:rgba(255,255,255,.2)}}

/* Eco greens, matched to the seagrass */
:root{--eco:#3d8a1f;--ok:#3d8a1f}
:root[data-theme="dark"]{--eco:#8cc63f;--ok:#8cc63f}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--eco:#8cc63f;--ok:#8cc63f}}

/* Sign-in panel: underwater seagrass meadow */
.auth-art{--eco:#a3d64c;background:linear-gradient(180deg,#1ba3ad 0%,#10878f 24%,#0a6873 48%,#074e59 70%,#053c46 100%)}
.auth-art::before{display:none}
.auth-art>.sea{position:absolute;inset:0;overflow:hidden;pointer-events:none;--sx:70%;--sy:13%}
.sea>*{position:absolute}
.sea::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 75% 48% at var(--sx) var(--sy),rgba(150,240,238,.55),rgba(60,190,200,.16) 45%,transparent 72%),radial-gradient(ellipse 120% 30% at 50% 100%,rgba(140,198,63,.22),transparent 70%)}
.sea-surface{left:0;top:0;width:100%;height:34%;opacity:.55;mix-blend-mode:screen;-webkit-mask:linear-gradient(#000,rgba(0,0,0,.45) 45%,transparent);mask:linear-gradient(#000,rgba(0,0,0,.45) 45%,transparent)}
.sea-rays{inset:0;background:repeating-conic-gradient(from 0deg at var(--sx) var(--sy),rgba(255,255,255,.10) 0deg 1.3deg,transparent 1.3deg 5.5deg),repeating-conic-gradient(from 2.5deg at var(--sx) var(--sy),rgba(200,255,250,.06) 0deg 3deg,transparent 3deg 12deg);-webkit-mask:radial-gradient(circle at var(--sx) var(--sy),#000 0,rgba(0,0,0,.55) 20%,transparent 58%);mask:radial-gradient(circle at var(--sx) var(--sy),#000 0,rgba(0,0,0,.55) 20%,transparent 58%);animation:seaRays 7s ease-in-out infinite alternate}
@keyframes seaRays{from{opacity:.6}to{opacity:1}}
.sea-sun{left:var(--sx);top:var(--sy);width:320px;height:320px;transform:translate(-50%,-50%);background:radial-gradient(circle,#fff 0 3.5%,rgba(255,255,255,.92) 6%,rgba(214,252,255,.55) 14%,rgba(150,236,240,.2) 32%,transparent 62%)}
.sea-kelp{left:0;top:0;width:100%;height:100%;transform-origin:14% 100%;animation:seaKelp 11s ease-in-out infinite alternate}
@keyframes seaKelp{from{transform:skewX(-1.1deg)}to{transform:skewX(1.4deg)}}
.sea-shade{inset:0;background:linear-gradient(90deg,rgba(2,34,40,.5) 0%,rgba(2,34,40,.28) 48%,transparent 80%)}
.sea-grass{left:0;top:0;width:100%;height:100%}
@media (prefers-reduced-motion:reduce){.sea-rays,.sea-kelp{animation:none}}
.auth-art h1{text-shadow:0 2px 28px rgba(0,30,38,.35)}
.auth-art p{color:#d6efee}
.auth-art p.lead{color:#fff}
.auth-feats li{border-color:rgba(255,255,255,.3);color:#f0fbfa;background:rgba(3,42,48,.38);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.auth-art .sea-foot{color:#cfeae9;text-shadow:0 1px 6px rgba(0,25,20,.6)}
@media(max-width:860px){
  #auth{background:linear-gradient(180deg,#1597a3 0%,#0b6a76 32%,#06434e 68%,#04323b 100%)}
  #auth .auth-art{background:transparent}
  #auth .auth-art>.sea{position:fixed;inset:0;z-index:0;--sx:82%;--sy:6%}
  .sea-surface{height:20%}
  .sea-sun{width:220px;height:220px}
  .sea-kelp{opacity:.5}
  .sea-shade{background:linear-gradient(180deg,rgba(2,34,40,.25),rgba(2,34,40,.45) 60%,rgba(2,34,40,.2))}
  .auth-card .sub{color:#bfe0df}
  .auth-form .prov,.auth-form .input{background:rgba(3,38,44,.74);border-color:rgba(255,255,255,.16);color:#fff}
  .auth-form .prov:hover{background:rgba(4,50,58,.85)}
}
</style>
</head>"""
i = s.index("</head>"); s = s[:i] + css + s[i + len("</head>"):]
engine = re.search(r'<script id="engine">[\s\S]*?</script>', open(here / "engine.html", encoding="utf-8").read()).group(0)
layer = open(here / "eco-layer.js", encoding="utf-8").read()
i = s.rindex("</body>")
s = s[:i] + engine + "\n<script>\n" + layer + "</script>\n" + s[i:]
open(out, "w", encoding="utf-8").write(s)
print("wrote", out, len(s), "bytes")
