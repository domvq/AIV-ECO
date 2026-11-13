/* =====================================================================
   AIV ECO LAYER
   Everything above this point is the AIV X app. This layer turns it into AIV Eco:
   - Eco estimates on every text answer, plus running totals (Impact)
   - simple math, conversions and date/time answered on the device, no AI model
   - saved answers reused for repeat questions
   - "AI model" picker with ChatGPT, Claude, Gemini and Groq on the user's own key
   - Build and Agents switched off
   ===================================================================== */
const ECO_LAUNCH_URL = "https://aiv-x.com";
(() => {
const E = Engine;
const OWN = {
  openai:    { name:"ChatGPT", co:"OpenAI",    url:"https://platform.openai.com/api-keys",        base:"https://api.openai.com/v1" },
  anthropic: { name:"Claude",  co:"Anthropic", url:"https://console.anthropic.com/settings/keys" },
  gemini:    { name:"Gemini",  co:"Google",    url:"https://aistudio.google.com/apikey" },
  groq:      { name:"Groq",    co:"Groq",      url:"https://console.groq.com/keys",               base:"https://api.groq.com/openai/v1" },
};
MODELS.length = 0;
MODELS.push(
  { id:"eco",   name:"AIV-1 Eco",      desc:"Free. The lightest way to a good answer" },
  { id:"auto",  name:"AIV-1",          desc:"Best for most things. Searches, checks facts, sees photos" },
  { id:"think", name:"AIV-1 Thinking", desc:"Reasons step by step for harder problems" },
  ...Object.keys(OWN).map(k => ({ id:k, name:OWN[k].name, desc:"Runs on your own " + OWN[k].co + " key", own:true }))
);
const modelName = id => (MODELS.find(x => x.id === id) || MODELS[0]).name;
let K = LSX.get("aiveco_keys", {}), TM = LSX.get("aiveco_tiers", {});
const OPT = Object.assign({ local:true, reuse:true }, LSX.get("aiveco_opts", {}));
const ownKey = () => OWN[S.model] ? S.model : null;
const turn = { active:false, level:2, noCount:false, tier:null, by:"", skipCache:false };

/* ---------------- Build and Agents are not part of AIV Eco ---------------- */
window.isAgentAsk = () => false;
window.agentsBoot = () => {};
window.openAgents = () => {};
window.openBuild = () => {};
window.canBuildAssistant = () => false;

/* ---------------- brand: the AIV mark + "Eco" ---------------- */
window.brandSVG = function(){
  return `<svg class="brandmark" viewBox="70 330 1560 370" fill="none" role="img" aria-label="AIV Eco">
  <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48"><path d="M125 640 L283 388 L430 640"/><path d="M256 557 H300"/><path d="M525 392 V640"/><path d="M625 392 L765 642 L905 392"/></g>
  <text x="1010" y="640" font-family="Geist,system-ui,sans-serif" font-weight="600" font-size="330" letter-spacing="-8" fill="var(--eco)" style="text-transform:none">Eco</text></svg>`;
};
document.querySelectorAll("[data-brand]").forEach(el => { el.innerHTML = ""; });
paintBrand();

/* ---------------- own-key models ---------------- */
async function ownHttp(url, opt){
  let r; try{ r = await fetch(url, opt); }catch(e){ if(e.name === "AbortError") throw e; throw new Error("Couldn't reach " + new URL(url).hostname + ". Check your connection and try again."); }
  if(!r.ok){
    const d = await r.json().catch(() => ({}));
    const m = d.error && (d.error.message || d.error) || d.message;
    if(r.status === 401 || r.status === 403) throw new Error("That API key was rejected (" + r.status + "). Check the key under AI model, then try again.");
    throw new Error(typeof m === "string" ? m : "The request failed (" + r.status + ").");
  }
  return r;
}
const anthHeaders = k => ({ "x-api-key":k, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true", "content-type":"application/json" });
async function loadTiers(p){
  const k = K[p]; if(!k) throw new Error("Add your " + OWN[p].co + " API key first.");
  let ids = [];
  if(OWN[p].base) ids = (await (await ownHttp(OWN[p].base + "/models", { headers:{ Authorization:"Bearer " + k } })).json()).data.map(m => m.id);
  else if(p === "anthropic") ids = (await (await ownHttp("https://api.anthropic.com/v1/models?limit=100", { headers:anthHeaders(k) })).json()).data.map(m => m.id);
  else ids = (await (await ownHttp("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers:{ "x-goog-api-key":k } })).json()).models.filter(m => (m.supportedGenerationMethods || []).includes("generateContent")).map(m => m.name.replace(/^models\//, ""));
  ids = ids.filter(i => !/embed|whisper|tts|audio|image|dall-e|moderation|realtime|transcribe|sora|guard|aqa|imagen|veo|speech|search|computer-use/i.test(i)).sort().reverse();
  const pick = rx => ids.find(i => rx.test(i)) || "";
  const m = Object.assign({ light:"", standard:"", advanced:"" }, TM[p]);
  if(!m.light) m.light = pick(/nano|flash-lite|haiku|instant|8b|mini|lite/i);
  if(!m.advanced) m.advanced = pick(/opus|(^|-)pro(-|$)|120b|gpt-5(?!.*(mini|nano))/i);
  if(!m.standard) m.standard = pick(/sonnet|flash(?!-lite)|70b|versatile|gpt-4\.1$|gpt-4o$/i) || ids.find(i => /mini/i.test(i) && i !== m.light) || m.advanced || m.light || ids[0] || "";
  m.list = ids; TM[p] = m; LSX.set("aiveco_tiers", TM);
  return m;
}
function tierFor(model, maxTokens){
  model = String(model || "auto");
  if(/think/.test(model)) return "advanced";
  if(/fast/.test(model)) return "light";
  const t = { 1:"light", 2:"standard", 3:"advanced" }[turn.active ? turn.level : 2];
  return t === "light" && maxTokens >= 4000 ? "standard" : t;
}
const textOf = c => typeof c === "string" ? c : (c || []).filter(x => x.type === "text").map(x => x.text).join("\n");
const imagesOf = c => Array.isArray(c) ? c.filter(x => x.type === "image_url" && x.image_url && x.image_url.url).map(x => x.image_url.url) : [];
function prepMessages(messages, cfg){
  const out = messages.map((m, i) => ({ role: m.role === "system" && i > 0 ? "user" : m.role, content: m.role === "system" && i > 0 ? "[Note from the app]\n" + textOf(m.content) : m.content }));
  if(out[0] && out[0].role === "system"){
    out[0] = { role:"system", content: textOf(out[0].content)
      .replace("running on AIV-1, AI Verse's own AI system", "currently answering with " + cfg.name + " from " + cfg.co + ", which the user chose and connected with their own API key")
      .replace(/If asked what you're built on[^\n]*/, "If asked what you're built on, say you are AIV Eco from AI Verse and that this chat is running on " + cfg.name + " (" + cfg.co + ") because the user selected it.") };
  }
  return out;
}
async function ownChat(messages, o){
  const p = S.model, cfg = OWN[p], key = K[p];
  if(!key){ setTimeout(() => openKey(p), 0); throw new Error(cfg.name + " needs your own " + cfg.co + " API key. Add it, then send again. Or switch the AI model back to AIV-1 Eco, which is free."); }
  let tm = TM[p]; if(!tm || !(tm.light || tm.standard || tm.advanced)) tm = await loadTiers(p);
  const r = E.route(2, "balanced", tierFor(o.model, o.max_tokens || 0), tm);
  if(!r.model) throw new Error("No " + cfg.name + " model is set. Open AI model, choose " + cfg.name + ", and pick the models to use.");
  if(o.onToken || !turn.tier){ turn.tier = r.tier; turn.by = cfg.name + " · " + r.model; }
  const msgs = prepMessages(messages, cfg);
  let cap = o.max_tokens || 2048; if(/^(o\d|gpt-5)|thinking|reason|gemini-(2\.5|[3-9])|gpt-oss|qwen-qwq|deepseek-r/i.test(r.model)) cap *= 2;
  if(cfg.base){
    const body = { model:r.model, stream:!!o.onToken, messages: p === "groq" ? msgs.map(m => ({ role:m.role, content:textOf(m.content) + (imagesOf(m.content).length ? "\n[The user attached an image, which this model can't see.]" : "") })) : msgs };
    body[p === "groq" ? "max_tokens" : "max_completion_tokens"] = cap;
    const res = await ownHttp(cfg.base + "/chat/completions", { method:"POST", signal:o.signal, headers:{ Authorization:"Bearer " + key, "content-type":"application/json" }, body:JSON.stringify(body) });
    if(!o.onToken){ const j = await res.json(); return (((j.choices || [])[0] || {}).message || {}).content || ""; }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "", full = "";
    while(true){
      const { done, value } = await reader.read(); if(done) break;
      buf += dec.decode(value, { stream:true });
      const lines = buf.split("\n"); buf = lines.pop();
      for(const line of lines){
        const l = line.trim(); if(!l.startsWith("data:")) continue;
        const d = l.slice(5).trim(); if(d === "[DONE]") continue;
        try{ const j = JSON.parse(d); const t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content || ""; if(t){ full += t; o.onToken(full); } }catch(e){}
      }
    }
    return full;
  }
  const sys = msgs[0] && msgs[0].role === "system" ? msgs[0].content : "";
  let rest = msgs.filter((m, i) => !(i === 0 && m.role === "system"));
  while(rest.length && rest[0].role !== "user") rest.shift();
  const merged = [];
  for(const m of rest){
    const parts = [{ t:textOf(m.content) || "(no text)" }].concat(imagesOf(m.content).map(u => ({ u })));
    const last = merged[merged.length - 1];
    if(last && last.role === m.role) last.parts.push(...parts); else merged.push({ role:m.role, parts });
  }
  const dataUrl = u => { const m = /^data:([^;]+);base64,(.*)$/.exec(u); return m ? { mime:m[1], data:m[2] } : null; };
  let text = "";
  if(p === "anthropic"){
    const body = { model:r.model, max_tokens:cap, system:sys, messages: merged.map(m => ({ role:m.role, content: m.parts.map(x => { if(x.t !== undefined) return { type:"text", text:x.t }; const d = dataUrl(x.u); return d ? { type:"image", source:{ type:"base64", media_type:d.mime, data:d.data } } : { type:"image", source:{ type:"url", url:x.u } }; }) })) };
    const j = await (await ownHttp("https://api.anthropic.com/v1/messages", { method:"POST", signal:o.signal, headers:anthHeaders(key), body:JSON.stringify(body) })).json();
    text = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  }else{
    const body = { systemInstruction:{ parts:[{ text:sys }] }, generationConfig:{ maxOutputTokens:cap },
      contents: merged.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: m.parts.map(x => { if(x.t !== undefined) return { text:x.t }; const d = dataUrl(x.u); return d ? { inlineData:{ mimeType:d.mime, data:d.data } } : { text:"[image: " + x.u + "]" }; }) })) };
    const j = await (await ownHttp("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(r.model) + ":generateContent", { method:"POST", signal:o.signal, headers:{ "x-goog-api-key":key, "content-type":"application/json" }, body:JSON.stringify(body) })).json();
    text = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(x => x.text || "").join("");
  }
  if(o.onToken && text) o.onToken(text);
  return text;
}
/* Route the app's two model entry points. Everything else (search, images, voice) stays on the AIV API. */
const _api = window.api, _streamChat = window.streamChat;
window.api = async function(path, body){
  if(path === "/chat" && ownKey()) return { reply: await ownChat(body.messages, { model:body.model, max_tokens:body.max_tokens, signal:S.abort && S.abort.signal }) };
  return _api(path, body);
};
window.streamChat = async function(messages, o = {}){
  if(ownKey()) return ownChat(messages, { model:o.model, max_tokens:o.max_tokens, signal:o.signal, onToken:o.onToken || (() => {}) });
  if(!turn.tier){ turn.tier = /think/.test(o.model) ? "advanced" : /fast/.test(o.model) ? "light" : "standard"; turn.by = /think/.test(o.model) ? "AIV-1 Thinking" : /fast/.test(o.model) ? "AIV-1 Eco" : "AIV-1"; }
  return _streamChat(messages, o);
};

/* ---------------- free-use counting: own-key chat doesn't spend AIV free messages ---------------- */
const _canUse = window.canUse, _bump = window.bump, _refund = window.refund;
const isGuest = () => !!(S.user && S.user.guest);
window.canUse = () => (ownKey() && !S.tool && !isGuest()) ? true : _canUse();
window.bump = n => { if(!turn.noCount) _bump(n); };
window.refund = n => { if(!turn.noCount) _refund(n); };

/* ---------------- estimates: every text answer gets one ---------------- */
const MID_WH = 0.00015;   // medium-size model, between ECO.whPerToken.small and .large
/* The 3x-more-text comparison only applies when web pages were read; plain chat is compared like for like against a large model. */
const baseMult = e => (e.searches || e.fetches || Object.keys(e.steps || {}).length) ? ECO.baselineContext : 1;
const rateFor = tier => tier === "advanced" ? ECO.whPerToken.large : tier === "standard" ? MID_WH : ECO.whPerToken.small;
function promptChars(ai){ try{ return systemPrompt().length + JSON.stringify(historyFor(S.chat, S.chat.messages.indexOf(ai))).length; }catch(x){ return 6000; } }
window.ecoFinish = function(ai){
  const e = ai.eco; if(!e) return;
  const tokens = (promptChars(ai) * e.rounds + (ai.content || "").length) / 4;
  e.tier = turn.tier || "light"; e.by = turn.by || modelName(S.model);
  e.answerWh = tokens * rateFor(e.tier) * ECO.pue;
  e.answerBaseWh = tokens * baseMult(e) * ECO.whPerToken.large * ECO.pue;
  tally(e);
};
function localEco(ai, how){
  ecoStart(ai); const e = ai.eco;
  e.local = how; e.tier = "light"; e.by = "Your device";
  e.answerWh = 0;
  e.answerBaseWh = (promptChars(ai) + (ai.content || "").length) / 4 * ECO.whPerToken.large * ECO.pue;
  tally(e);
}
window.ecoHTML = function(m){
  const e = m.eco; if(!e) return "";
  const t = ecoTotals(e);
  const how = e.local ? e.local : Object.keys(e.steps).length ? "Retrieved via " + Object.keys(e.steps).map(k => k === "http" ? "plain text" : k === "jsonld" ? "structured data" : k === "render" ? "page render" : k).join(", ") : (e.fallback ? "Retrieved via standard search" : "No browsing needed");
  const nSrc = (m.sources || []).length;
  const line = `${how}${nSrc ? " · " + nSrc + " source" + (nSrc > 1 ? "s" : "") : ""} · est. ${e.local ? "0 Wh / 0 mL" : fmtWh(t.wh) + " / " + fmtMl(t.ml)} water`;
  const row = (a, b) => `<div class="eco-row"><span>${a}</span><b>${esc(b)}</b></div>`;
  return `<details class="eco"><summary>${esc(line)}</summary><div class="eco-box">` +
    row("Answered by", e.by || "AIV-1 Eco") +
    row("Estimated energy", e.local ? "0 Wh" : fmtWh(t.wh)) + row("Estimated water", e.local ? "0 mL" : fmtMl(t.ml)) +
    row("Same task, traditional approach", fmtWh(t.baseWh) + " / " + fmtMl(t.baseMl)) +
    (t.saved > 0 ? row("Estimated savings", "about " + t.saved + "% less") : "") +
    (e.searches || e.fetches ? row("Searches · pages read", e.searches + " · " + e.fetches) : "") +
    (e.cacheHits ? row("Reused from cache", String(e.cacheHits)) : "") +
    (e.skipped ? row("Pages skipped (early stop)", String(e.skipped)) : "") +
    (e.local ? "" : row("Full page renders", String(e.renders))) +
    `<div class="eco-note">${e.fallback ? "The efficient browsing engine wasn't reachable, so standard search was used. " : ""}These are modeled estimates based on the work done for this answer, not direct measurements. The traditional comparison is the same request sent to a large model; for web answers it also assumes every page fully rendered and about three times more text read.</div>` +
    `</div></details>`;
};
const IMPACT0 = { n:0, wh:0, baseWh:0, local:0, reused:0, searches:0, fetches:0, cacheHits:0, skipped:0 };
function tally(e){
  const I = Object.assign({}, IMPACT0, LSX.get("aiveco_impact", {})), t = ecoTotals(e);
  I.n++; I.wh += t.wh; I.baseWh += t.baseWh;
  if(e.local){ if(/saved answer/.test(e.local)) I.reused++; else I.local++; }
  I.searches += e.searches || 0; I.fetches += e.fetches || 0; I.cacheHits += e.cacheHits || 0; I.skipped += e.skipped || 0;
  LSX.set("aiveco_impact", I);
}
function openImpact(){
  const I = Object.assign({}, IMPACT0, LSX.get("aiveco_impact", {}));
  const saved = I.baseWh > 0 ? Math.max(0, Math.round((1 - I.wh / I.baseWh) * 100)) : 0;
  const st = (v, k) => `<div class="ecostat"><b>${esc(v)}</b><span>${esc(k)}</span></div>`;
  modal(`<div class="mh2"><h3>Your impact</h3><button class="iconbtn" data-close><span data-i="x"></span></button></div>
    <div class="mb">
      <p class="muted small" style="margin-bottom:12px">Estimated totals for answers on this device.</p>
      <div class="ecogrid">${st(fmtMl(ecoWater(Math.max(0, I.baseWh - I.wh))), "Water avoided")}${st(fmtWh(Math.max(0, I.baseWh - I.wh)), "Energy avoided")}${st(fmtMl(ecoWater(I.wh)), "Water used")}${st(fmtWh(I.wh), "Energy used")}${st(saved + "%", "Less than the traditional approach")}${st(String(I.n), "Answers measured")}</div>
      <label class="label">What AIV Eco skipped</label>
      <div class="ecogrid">${st(String(I.local), "Answered on your device")}${st(String(I.reused), "Saved answers reused")}${st(String(I.skipped), "Web pages not read")}${st(String(I.cacheHits), "Web pages reused from cache")}</div>
      <label class="label">How this is estimated</label>
      <p class="muted small">Energy is modeled from the amount of text the AI model reads and writes, plus the web pages fetched for the answer. Water is that energy times ${ECO.waterLPerKwh} liters per kWh, covering data-center cooling and electricity generation. The "traditional approach" is a modeled comparison: the same request sent to a large model, and for web answers, every page fully rendered with about ${ECO.baselineContext} times more text read.</p>
      <p class="muted small" style="margin-top:8px">These are estimates, not measurements. AI providers don't publish per-request energy or water for most models, and AIV Eco can't see which data center answered.</p>
    </div>
    <div class="mf"><button class="btn" id="impReset">Reset totals</button><button class="btn primary" data-close>Done</button></div>`);
  $("impReset").onclick = () => { LSX.set("aiveco_impact", IMPACT0); openImpact(); };
}

/* ---------------- local answers + saved answers, around the app's runAssistant ---------------- */
const PERSONAL = /\b(i|i'm|im|i've|my|me|mine|myself|we|our|us)\b/i;
const cacheSalt = () => [(S.user && (S.user.uid || S.user.email)) || "guest", S.mode, (S.chat && S.chat.project) || ""].join("|");
async function finishLocal(ai, text, how){
  ai.content = text; localEco(ai, how);
  ai.pending = false; ai.status = ""; updateMsg(ai, true);
  if(S.chat.title === "New chat"){ const f = S.chat.messages.find(m => m.role === "user"); S.chat.title = ((f && f.content) || "New chat").slice(0, 40); renderChatList(); }
  await persistChat();
}
const _run = window.runAssistant;
window.runAssistant = async function(ai, userMsg, tool){
  const text = userMsg.content || "";
  const plain = !tool && !userMsg.routed && !userMsg.agentAsk && !(userMsg._images && userMsg._images.length) && !userMsg.ctx && !S.openApp && !userMsg._retry && !!text;
  const skipCache = turn.skipCache; turn.skipCache = false;
  const hasHistory = S.chat.messages.filter(m => m !== ai && m !== userMsg && !m.error).length > 0;
  const cls = E.classify(text, { hasHistory });
  let cacheable = false, vec = null;
  if(plain){
    if(OPT.local){ const det = E.deterministic(text); if(det) return finishLocal(ai, det.answer, "Answered on your device"); }
    cacheable = OPT.reuse && cls.standalone && !cls.timeSensitive && !cls.needsWeb && !PERSONAL.test(text);
    if(cacheable){
      vec = E.embedLexical(text);
      if(!skipCache){
        const hit = E.cacheLookup(LSX.get("aiveco_cache", []), text, vec, "lexical", "balanced", cacheSalt());
        if(hit) return finishLocal(ai, hit.entry.answer, hit.kind === "exact" ? "Reused a saved answer" : "Reused a saved answer to a similar question");
      }
    }
  }
  Object.assign(turn, { active:true, level:cls.level, noCount: !!ownKey() && !tool && !isGuest(), tier:null, by:"" });
  try{ await _run(ai, userMsg, tool); }
  finally{ turn.active = false; turn.noCount = false; }
  if(cacheable && !ai.error && ai.content && ai.content !== "_Stopped._" && !(ai.steps && ai.steps.length) && !(ai.sources && ai.sources.length) && !ai.artifact && !(ai.images && ai.images.length) && !ai.suggestApp)
    LSX.set("aiveco_cache", E.cacheStore(LSX.get("aiveco_cache", []), text, vec, "lexical", ai.content, {}, cacheSalt()).slice(-120));
};
const _regen = window.regenerate;
window.regenerate = function(m){ turn.skipCache = true; return _regen(m); };

/* ---------------- AI model picker and key setup ---------------- */
function pickModel(id){
  S.model = id; $("modelName").textContent = modelName(id); LSX.set("aiveco_model", id);
  if(OWN[id] && !K[id]) setTimeout(() => openKey(id), 0);
}
$("modelBtn").onclick = e => {
  e.stopPropagation();
  showMenu(e.currentTarget, [{ head:"AI model" }].concat(MODELS.map(m => ({ label:m.name, desc: m.own ? (K[m.id] ? "Using your " + OWN[m.id].co + " key" : "Needs your own " + OWN[m.id].co + " key") : m.desc, check:S.model === m.id, fn:() => pickModel(m.id) }))), { up:true });
};
function openKey(p){
  const cfg = OWN[p], has = !!K[p], tm = Object.assign({ light:"", standard:"", advanced:"" }, TM[p]);
  const mi = (t, l) => `<label class="label">${l}</label><input class="input" list="ecoModels" data-tier="${t}" value="${esc(tm[t])}" placeholder="model id">`;
  modal(`<div class="mh2"><h3>${esc(cfg.name)}</h3><button class="iconbtn" data-close><span data-i="x"></span></button></div>
    <div class="mb">
      ${has ? `<p class="muted small">${esc(cfg.name)} is connected with your ${esc(cfg.co)} API key.</p>` : `<p>${esc(cfg.name)} runs on your own ${esc(cfg.co)} API key. Get a key, then paste it here.</p>
      <a class="btn primary" href="${cfg.url}" target="_blank" rel="noopener" style="width:100%;margin-top:14px">Get your ${esc(cfg.co)} API key</a>`}
      <label class="label">${esc(cfg.co)} API key</label>
      <div style="display:flex;gap:8px"><input class="input" id="ecoKey" type="password" autocomplete="off" placeholder="Paste your key" value="${esc(K[p] || "")}"><button class="btn" id="ecoKeySave">Save</button></div>
      <div class="small" id="ecoKeyMsg" style="margin-top:8px"></div>
      <p class="muted small" style="margin-top:8px">Your key is stored only in this browser and is sent only to ${esc(cfg.co)}. ${esc(cfg.co)} bills your account for what you use.${has ? ` <a href="${cfg.url}" target="_blank" rel="noopener">Manage keys</a>` : ""}</p>
      <details style="margin-top:14px"${has ? " open" : ""}><summary class="small" style="cursor:pointer;color:var(--text2)">Models AIV Eco uses</summary>
        <p class="muted small" style="margin-top:8px">AIV Eco sends each request to the smallest model that fits it.</p>
        <datalist id="ecoModels">${(tm.list || []).map(i => `<option value="${esc(i)}">`).join("")}</datalist>
        ${mi("light", "Small, for simple requests")}${mi("standard", "Medium, for everyday questions")}${mi("advanced", "Large, for hard reasoning, writing and code")}
      </details>
    </div>
    <div class="mf">${has ? '<button class="btn danger" id="ecoKeyDel">Remove key</button>' : ""}<button class="btn primary" data-close>Done</button></div>`);
  const msg = (t, c) => { const el = $("ecoKeyMsg"); if(el){ el.textContent = t; el.style.color = c || ""; } };
  $("ecoKeySave").onclick = async () => {
    const k = $("ecoKey").value.trim(); if(!k) return $("ecoKey").focus();
    K[p] = k; LSX.set("aiveco_keys", K); msg("Checking…");
    try{ const m = await loadTiers(p); openKey(p); msg("Key works. " + (m.list || []).length + " models found.", "var(--ok)"); }
    catch(e){ msg(errText(e), "var(--danger)"); }
  };
  document.querySelectorAll("#modal [data-tier]").forEach(i => i.onchange = () => { TM[p] = Object.assign({ light:"", standard:"", advanced:"" }, TM[p]); TM[p][i.dataset.tier] = i.value.trim(); LSX.set("aiveco_tiers", TM); });
  if($("ecoKeyDel")) $("ecoKeyDel").onclick = () => { delete K[p]; delete TM[p]; LSX.set("aiveco_keys", K); LSX.set("aiveco_tiers", TM); if(S.model === p) pickModelQuiet("eco"); closeModal(); toast(cfg.name + " key removed"); };
}
function pickModelQuiet(id){ S.model = id; $("modelName").textContent = modelName(id); LSX.set("aiveco_model", id); }

/* When the free messages run out: keep going on your own key */
window.openUpgrade = function(reason){
  modal(`<div class="mh2"><h3>Keep going</h3><button class="iconbtn" data-close><span data-i="x"></span></button></div>
    <div class="mb">${reason ? `<p style="margin-bottom:14px"><b>${esc(reason)}</b></p>` : ""}
      <p class="muted">Chat as much as you like with your own key. Pick an AI model:</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 4px">${Object.keys(OWN).map(k => `<button class="btn" data-own="${k}">${esc(OWN[k].name)}</button>`).join("")}</div>
      <label class="label" style="margin-top:22px">Have an AIV key?</label>
      <div style="display:flex;gap:8px"><input class="input" id="upKey" placeholder="aiv-xxxxxxxx" value="${esc(S.profile.proKey || "")}"><button class="btn" id="upGo">Unlock</button></div>
      <div class="small" id="upMsg" style="margin-top:8px"></div>
      <p class="muted small" style="margin-top:16px">Free plan: ${FREE_DAILY_LIMIT} messages a day, resets at midnight.</p></div>`);
  document.querySelectorAll("#modal [data-own]").forEach(b => b.onclick = () => { closeModal(); pickModel(b.dataset.own); if(K[b.dataset.own]) toast("Now using " + OWN[b.dataset.own].name); });
  $("upGo").onclick = async () => {
    const k = $("upKey").value.trim(); if(!k) return;
    $("upMsg").textContent = "Checking…"; $("upMsg").style.color = "";
    S.profile.proKey = k;
    const ok = await _api("/verify", { key:k }).then(d => d.valid).catch(() => false);
    if(ok){ S.pro = true; await saveProfile(); renderUsage(); $("upMsg").textContent = "AIV key unlocked."; $("upMsg").style.color = "var(--ok)"; }
    else { S.profile.proKey = ""; S.pro = false; $("upMsg").textContent = "That key isn't active. Contact team@aiverse.it.com if this is a mistake."; $("upMsg").style.color = "var(--danger)"; }
  };
};

/* ---------------- settings: two extra sections ---------------- */
window.openSettings = function(section = "general"){
  const secs = [["general","General"],["keys","AI models"],["eco","Eco"],["personal","Personalization"],["memory","Memory"],["plan","Plan"],["account","Account"]].concat(isAdmin() ? [["training","Training data"]] : []);
  const m = modal(`<div class="mh2"><h3>Settings</h3><button class="iconbtn" data-close><span data-i="x"></span></button></div>
    <div class="set-wrap"><div class="set-nav">${secs.map(([k, v]) => `<button data-s="${k}" class="${k === section ? "on" : ""}">${v}</button>`).join("")}</div><div class="set-body" id="setBody"></div></div>`, true);
  m.querySelectorAll("[data-s]").forEach(b => b.onclick = () => { m.querySelectorAll("[data-s]").forEach(x => x.classList.toggle("on", x === b)); drawSettings(b.dataset.s); });
  drawSettings(section);
};
const _drawSettings = window.drawSettings;
window.drawSettings = function(sec){
  const b = $("setBody");
  if(sec === "keys"){
    b.innerHTML = `<div class="set-row"><div class="lt">AIV-1 Eco, AIV-1, AIV-1 Thinking<small>Run on the AI Verse API. Free every day, no key needed.</small></div><b>Included</b></div>` +
      Object.keys(OWN).map(k => `<div class="set-row"><div class="lt">${esc(OWN[k].name)}<small>${K[k] ? "Connected with your " + esc(OWN[k].co) + " key" : "Runs on your own " + esc(OWN[k].co) + " API key"}</small></div><button class="btn sm ${K[k] ? "" : "primary"}" data-key="${k}">${K[k] ? "Manage" : "Add key"}</button></div>`).join("") +
      `<p class="muted small" style="margin-top:14px">Choose the model for a chat with the AI model button in the message box. Chats on your own key don't use your free AIV messages. Web search, images, video and voice still run on the AI Verse API.</p>`;
    b.querySelectorAll("[data-key]").forEach(x => x.onclick = () => openKey(x.dataset.key));
    return;
  }
  if(sec === "eco"){
    const n = LSX.get("aiveco_cache", []).length;
    b.innerHTML = `<div class="set-row"><div class="lt">Answer simple things on this device<small>Math, unit conversions, and the date and time are worked out here, with no AI model.</small></div>${sw(OPT.local)}</div>
      <div class="set-row"><div class="lt">Reuse saved answers<small>When you ask a general question AIV Eco has already answered on this device, it shows the saved answer. Regenerate always asks the model again.</small></div>${sw(OPT.reuse)}</div>
      <div class="set-row"><div class="lt">Saved answers<small>${n} stored in this browser</small></div><button class="btn sm" id="ecoClear">Clear</button></div>
      <div class="set-row"><div class="lt">Your impact<small>Estimated energy and water for your answers.</small></div><button class="btn sm" id="ecoImp">Open</button></div>`;
    const s = b.querySelectorAll(".switch");
    s[0].onclick = () => { OPT.local = !OPT.local; s[0].classList.toggle("on", OPT.local); LSX.set("aiveco_opts", OPT); };
    s[1].onclick = () => { OPT.reuse = !OPT.reuse; s[1].classList.toggle("on", OPT.reuse); LSX.set("aiveco_opts", OPT); };
    $("ecoClear").onclick = () => { LSX.set("aiveco_cache", []); drawSettings("eco"); };
    $("ecoImp").onclick = () => openImpact();
    return;
  }
  _drawSettings(sec);
};

/* ---------------- menus and the start screen, without Build and Agents ---------------- */
$("plusBtn").onclick = e => {
  e.stopPropagation();
  const anchor = e.currentTarget;
  const curMode = S.mode === "aivx" ? "AIV Eco" : appById(S.mode).name;
  showMenu(anchor, [
    ...(innerWidth <= 640 ? [{ label:"AI model: " + modelName(S.model), desc:"Tap to change", fn:() => setTimeout(() => $("modelBtn").click(), 0) }, { sep:true }] : []),
    { label:"Add photos & files", desc:"PDF, Word, Excel, slides, audio, code", fn:() => $("fileInput").click() },
    { label:"Take a photo", fn:() => $("camInput").click() },
    { sep:true },
    { label:"AI mode", desc:"Now: " + curMode + ". Switch to an AI Verse app", fn:() => setTimeout(() => openAIMode(anchor), 0) },
    { sep:true },
    ...["image","video","search","research","doc","sheet","slides","app","code","link"].map(k => ({ label:TOOLS[k].name, desc:TOOLS[k].desc, check:S.tool === k, fn:() => setTool(k) })),
    { sep:true },
    { label:"Work in a project", desc:"Chats with shared instructions", fn:() => pickProject() },
    ...(innerWidth <= 640 ? [{ sep:true }, { label:"Your impact", fn:() => setTimeout(openImpact, 0) }, { label:"Settings", fn:() => setTimeout(() => openSettings(), 0) }] : []),
  ], { up:true });
};
$("meBtn").onclick = e => {
  e.stopPropagation();
  showMenu(e.currentTarget, [
    { label:"Settings", fn:() => openSettings() },
    { label:"AI models", fn:() => openSettings("keys") },
    { label:"Your impact", fn:() => openImpact() },
    { label:"Memory", fn:() => openSettings("memory") },
    { label:"Personalization", fn:() => openSettings("personal") },
    { sep:true },
    { label:"Launch AIV X", fn:() => window.open(ECO_LAUNCH_URL, "_blank", "noopener") },
    { label:"Terms of Use", fn:() => window.open(ECO_LAUNCH_URL + "/terms.html", "_blank", "noopener") },
    { label:"Privacy Policy", fn:() => window.open(ECO_LAUNCH_URL + "/privacy.html", "_blank", "noopener") },
    { sep:true },
    ...(isGuest() ? [{ label:"Sign in", fn:() => showAuth("login") }, { label:"Sign up", fn:() => showAuth("signup") }] : [{ label:"Log out", fn:() => Auth.signOut() }]),
  ], { up:true });
};
window.renderEmpty = function(){
  const app = appById(S.mode);
  const name = (S.profile.name || "").split(" ")[0];
  const proj = S.chat && S.chat.project && (S.profile.projects || []).find(x => x.id === S.chat.project);
  const h = S.openApp ? `How can I help with ${esc(app.name)}?` : app.id === "aivx" ? (name ? `What's on your mind today, ${esc(name)}?` : "What's on your mind today?") : esc(app.name);
  $("chatcol").classList.add("centered");
  $("thread").innerHTML = `<div class="empty"><h1>${h}</h1>
    <div class="modeline">${proj ? "Project · " + esc(proj.name) : S.openApp ? "I'm right here while you use the app." : app.id === "aivx" ? "The AI assistant built to use less. Your favorite AI models with less water and energy consumption." : esc(app.desc) + (app.url ? ` · <a href="#" data-openapp="${app.id}">Open full app</a>` : "")}</div>
    </div>`;
  const bs = $("belowStarters"); bs.classList.remove("hidden");
  if(S.openApp){
    bs.classList.remove("quick");
    bs.innerHTML = app.starters.map(s => `<button class="starter">${esc(s)}</button>`).join("");
    bs.querySelectorAll(".starter").forEach(b => b.onclick = () => { $("input").value = b.textContent; autoGrow(); send(); });
  }else{
    bs.classList.add("quick", "ecolist");
    const items = [["impact","chart","Your impact"],["mode","modes", S.mode === "aivx" ? "AI mode" : "AI mode: " + app.name]];
    bs.innerHTML = items.map(([k, ic, t]) => `<button class="qa" data-qa="${k}"><span data-i="${ic}"></span><span>${esc(t)}</span></button>`).join("");
    paintIcons(bs);
    bs.querySelectorAll(".qa").forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.qa; if(k === "mode") openAIMode(b); else if(k === "impact") openImpact(); else { setTool(k); $("input").focus(); } });
  }
  const oa = $("thread").querySelector("[data-openapp]"); if(oa) oa.onclick = e => { e.preventDefault(); openFullApp(app); };
};

/* ---------------- no sign-in wall: guests land in the app; Sign in / Sign up in the corner ---------------- */
let wantLogin = false;
function showAuth(mode){
  wantLogin = mode === "login";
  authShow("authMain");
  const h = document.querySelector("#authMain h2"), sub = document.querySelector("#authMain .sub");
  h.textContent = wantLogin ? "Log in to AIV Eco" : "Create your free account";
  sub.textContent = wantLogin ? "Welcome back." : "It's free, and your guest chats come with you.";
  $("auth").classList.remove("hidden");
}
window.showAuth = showAuth;
const hideAuth = () => { if(S.user) $("auth").classList.add("hidden"); };
Auth.leaveGuest = () => showAuth("signup");
$("authGuest").textContent = "Continue without an account";
$("authGuest").onclick = hideAuth;
$("authClose").onclick = hideAuth;
document.addEventListener("keydown", e => { if(e.key === "Escape" && !$("auth").classList.contains("hidden") && !document.getElementById("modal")) hideAuth(); });
const _emailGo = $("authEmailGo").onclick;
$("authEmailGo").onclick = () => { _emailGo(); if(wantLogin && Auth.emailMode === "signup" && !$("authEmailStep").classList.contains("hidden")) setEmailMode("signin"); };
$("ecoSignIn").onclick = () => showAuth("login");
$("ecoSignUp").onclick = () => showAuth("signup");
window.ecoSignedIn = u => {
  const g = !!(u && u.guest);
  document.body.classList.toggle("eco-guest", g);
  $("ecoSignIn").classList.toggle("hidden", !g); $("ecoSignUp").classList.toggle("hidden", !g);
  $("ecoLaunch").classList.toggle("solid", !g);
  $("authClose").classList.toggle("hidden", !u);
};
ecoSignedIn(S.user);

/* ---------------- top bar: Impact, Settings, Launch AIV X ---------------- */
$("ecoImpact").onclick = () => openImpact();
$("ecoSettings").onclick = () => openSettings();
$("navImpact").onclick = () => { if(innerWidth < 820) closeSide(); openImpact(); };
$("modelName").textContent = modelName(LSX.get("aiveco_model", "eco"));
paintIcons();
/* If the app finished starting before this layer loaded, redraw the start screen with the Eco version */
try{ if(S.user && S.profile && (!S.chat || !(S.chat.messages || []).length) && !S.openApp) renderEmpty(); }catch(e){ console.warn("eco start screen", e); }

/* ---------------- sign-in scene: seagrass meadow (canvas) ----------------
   Draws at most 30 frames a second, only while the sign-in screen is showing and the tab is visible,
   and draws a single still frame for people who prefer reduced motion. */
(function sea(){
  const box = document.querySelector("#auth .sea"); if(!box) return;
  const auth = $("auth"), gc = box.querySelector(".sea-grass"), kc = box.querySelector(".sea-kelp");
  const g = gc.getContext("2d"), k = kc.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let W = 0, H = 0, sunX = .7, sunY = .13, zone = 0, blades = [], motes = [], fish = [], grads = [], sheen = null, raf = 0, last = 0;
  const LAYERS = [
    { base:"#0b2c1f", top:"#2c6a3c", alpha:.75, share:.30, hk:.62 },
    { base:"#11380f", top:"#5a9a2a", alpha:.92, share:.35, hk:.82 },
    { base:"#173f0e", top:"#8cc63f", alpha:1,   share:.35, hk:1   },
  ];
  function size(){
    const r = box.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    for(const c of [gc, kc]){ c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); k.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(box); sunX = parseFloat(cs.getPropertyValue("--sx")) / 100 || .7; sunY = parseFloat(cs.getPropertyValue("--sy")) / 100 || .13;
    zone = H * (W < 600 ? .17 : .25);
    blades = [];
    const n = Math.min(560, Math.round(W / 1.9));
    LAYERS.forEach((L, li) => {
      for(let i = 0; i < n * L.share; i++){
        const h = zone * rnd(.42, 1) * L.hk;
        blades.push({ li, x:rnd(-12, W + 12), h, w:rnd(1.5, 3.4) + li * .8, lean:rnd(-.32, .38), ph:rnd(0, 6.283), sp:rnd(.45, .85) });
      }
      const gr = g.createLinearGradient(0, H, 0, H - zone * L.hk);
      gr.addColorStop(0, L.base); gr.addColorStop(.55, L.top); gr.addColorStop(1, li === 2 ? "#c2e46a" : L.top);
      grads[li] = gr;
    });
    sheen = g.createRadialGradient(W * sunX, H - zone, 0, W * sunX, H - zone, Math.max(W, zone) * .75);
    sheen.addColorStop(0, "rgba(225,255,150,.38)"); sheen.addColorStop(1, "rgba(225,255,150,0)");
    motes = Array.from({ length: Math.round(W / 12) }, () => ({ x:rnd(0, W), y:rnd(0, H - zone * .6), r:rnd(.5, 1.7), vx:rnd(-3, 3), vy:rnd(-7, -2), a:rnd(.15, .55), ph:rnd(0, 6.283) }));
    fish = Array.from({ length: 12 }, () => ({ x:W * sunX + rnd(-W * .22, W * .22), y:H * sunY + rnd(-H * .02, H * .2), s:rnd(1.6, 3.2), vx:rnd(3, 9) * (Math.random() < .5 ? -1 : 1), ph:rnd(0, 6.283) }));
    drawKelp(); frame(performance.now(), true);
  }
  function drawKelp(){
    k.clearRect(0, 0, W, H);
    const stalks = W < 600 ? [[.03, .62, 2.5], [.12, .48, 1.5]] : [[.015, .9, 3], [.07, .78, 2], [.135, .95, 1], [.21, .7, 2.2], [.97, .55, 3]];
    for(const [fx, fh, blur] of stalks){
      const x0 = W * fx, top = H * (1 - fh), ph = rnd(0, 6.283), amp = rnd(8, 18);
      k.filter = "blur(" + blur + "px)";
      const gr = k.createLinearGradient(0, top, 0, H);
      gr.addColorStop(0, "rgba(28,104,92,.30)"); gr.addColorStop(1, "rgba(6,44,38,.88)");
      k.fillStyle = gr; k.strokeStyle = gr; k.lineWidth = 3.5;
      const xs = y => x0 + Math.sin(y * .011 + ph) * amp;
      k.beginPath(); for(let y = H + 10; y >= top; y -= 8) k.lineTo(xs(y), y); k.stroke();
      let side = 1;
      for(let y = H; y > top + 10; y -= rnd(15, 24)){
        const len = rnd(26, 62) * (.55 + .45 * (y - top) / (H - top)), wid = rnd(6, 13), ang = -Math.PI / 2 + side * rnd(.45, 1.05);
        const bx = xs(y), by = y, tx = bx + Math.cos(ang) * len, ty = by + Math.sin(ang) * len;
        const nx = -Math.sin(ang) * wid, ny = Math.cos(ang) * wid, mx = (bx + tx) / 2, my = (by + ty) / 2;
        k.beginPath(); k.moveTo(bx, by); k.quadraticCurveTo(mx + nx, my + ny, tx, ty); k.quadraticCurveTo(mx - nx, my - ny, bx, by); k.fill();
        side = -side;
      }
    }
    k.filter = "none";
  }
  function frame(t, force){
    raf = 0;
    if(!force && (document.hidden || auth.classList.contains("hidden"))) return;
    if(!force && t - last < 33){ raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(.1, (t - (last || t)) / 1000); last = t;
    const s = t / 1000;
    g.clearRect(0, 0, W, H);
    for(const m of motes){
      if(!still){ m.x += m.vx * dt; m.y += m.vy * dt; if(m.y < -4){ m.y = H - zone * .6; m.x = rnd(0, W); } if(m.x < -4) m.x = W + 4; if(m.x > W + 4) m.x = -4; }
      g.globalAlpha = m.a * (.6 + .4 * Math.sin(s * 1.3 + m.ph)); g.fillStyle = "#e9fffb";
      g.beginPath(); g.arc(m.x, m.y, m.r, 0, 6.283); g.fill();
    }
    g.fillStyle = "#06343b";
    for(const f of fish){
      if(!still){ f.x += f.vx * dt; if(f.x < W * (sunX - .3)) f.vx = Math.abs(f.vx); if(f.x > W * (sunX + .3)) f.vx = -Math.abs(f.vx); }
      g.globalAlpha = .55; g.beginPath(); g.ellipse(f.x, f.y + Math.sin(s * .8 + f.ph) * 3, f.s * 1.8, f.s * .7, 0, 0, 6.283); g.fill();
    }
    let li = -1;
    for(const b of blades){
      if(b.li !== li){ li = b.li; g.fillStyle = grads[li]; g.globalAlpha = LAYERS[li].alpha; }
      const sway = still ? 0 : Math.sin(s * b.sp + b.ph + b.x * .004) * b.h * .09 + Math.sin(s * .33 + b.x * .0025) * b.h * .06;
      const tx = b.x + b.lean * b.h + sway, ty = H - b.h, cx = b.x + (tx - b.x) * .22, cy = H - b.h * .58;
      g.beginPath();
      g.moveTo(b.x - b.w / 2, H + 4);
      g.quadraticCurveTo(cx - b.w * .3, cy, tx, ty);
      g.quadraticCurveTo(cx + b.w * .3, cy, b.x + b.w / 2, H + 4);
      g.fill();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-atop"; g.fillStyle = sheen; g.fillRect(0, H - zone * 1.1, W, zone * 1.1); g.globalCompositeOperation = "source-over";
    if(!still) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if(!raf && !still && !document.hidden && !auth.classList.contains("hidden")){ last = 0; raf = requestAnimationFrame(frame); } };
  new ResizeObserver(() => { if(!auth.classList.contains("hidden")) size(); }).observe(box);
  new MutationObserver(() => { if(!auth.classList.contains("hidden")){ if(!W || W < 2) size(); wake(); } }).observe(auth, { attributes:true, attributeFilter:["class"] });
  document.addEventListener("visibilitychange", wake);
  if(!auth.classList.contains("hidden")) size();
})();
})();
