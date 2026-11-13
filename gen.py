import json, html, sys, pathlib
OUT = pathlib.Path(sys.argv[1]); DATE = "2026-11-12"; BASE = "https://aiv-x.com/eco/"
E = html.escape
APP = {"@type":"WebApplication","@id":BASE+"#app","name":"AIV Eco","url":BASE,"applicationCategory":"ProductivityApplication","operatingSystem":"Web browser","isAccessibleForFree":True,
       "description":"AIV Eco is an eco-friendly AI assistant that uses less water and energy by skipping unnecessary AI work, and shows an estimated energy and water footprint on every answer.",
       "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"publisher":{"@type":"Organization","name":"AI Verse","url":"https://aiverse.it.com/"}}
PAGES = []
def page(slug, title, desc, crumb, h1, lead, sections, faqs, related_label):
    PAGES.append(dict(slug=slug, title=title, desc=desc, crumb=crumb, h1=h1, lead=lead, sections=sections, faqs=faqs, label=related_label))

def cards(items): return '<div class="grid">' + "".join(f'<div class="card"><h3>{E(t)}</h3><p>{p}</p></div>' for t, p in items) + "</div>"
def steps(items): return '<ol class="steps">' + "".join(f"<li>{x}</li>" for x in items) + "</ol>"
def para(*ps): return "".join(f"<p>{p}</p>" for p in ps)
def table(head, rows): return '<div class="tw"><table class="cmp"><tr>' + "".join(f"<th>{E(h)}</th>" for h in head) + "</tr>" + "".join("<tr>" + "".join(f"<td{' class=\"us\"' if i == len(r)-1 else ''}>{c}</td>" for i, c in enumerate(r)) + "</tr>" for r in rows) + "</table></div>"
HONEST = '<p class="fine">AIV Eco reduces how much computing each answer needs. It can\'t change how a provider cools its data centers, and its energy and water figures are modeled estimates, not meter readings. <a href="ai-water-usage.html">How AI uses water</a></p>'

page("eco-friendly-ai.html",
  "Eco-Friendly AI Assistant That Uses Less Water | AIV Eco",
  "AIV Eco is the eco-friendly AI assistant built to use less water and energy. It skips unnecessary AI work and shows the estimated water usage of every answer. Free.",
  "Eco-friendly AI",
  "The eco-friendly AI assistant that uses less water",
  "AIV Eco is an AI assistant built around one idea: give you the answer you need with the least computing possible. Less computing means less electricity, and less electricity means less water used to cool data centers and generate power. Every answer shows its estimated energy and water usage, so you can see the difference.",
  [("How AIV Eco uses less water", cards([
      ("No AI when it isn't needed", "Math, unit conversions, and the date and time are worked out right on your device. No data center, no water."),
      ("Reuses answers it already has", "Ask a general question that was already answered on your device, and AIV Eco shows the saved answer instead of running the AI again."),
      ("The right-size model", "Simple requests go to a small model and hard ones to a large one, instead of sending everything to the biggest model."),
      ("Efficient web reading", "AIV Eco reads web pages as plain text first, reuses pages it has already read, and stops searching once the question is answered."),
      ("Shorter, direct answers", "Eco mode answers directly, without padding. Fewer words generated means less computing."),
      ("Your impact, on every answer", "Each answer shows estimated energy and water, and Your impact keeps a running total of what you've saved."),
    ])),
   ("Everything you expect from an AI assistant", para(
      "Using less water doesn't mean doing less. AIV Eco chats, searches the web, does deep research, reads your PDFs and documents, writes and runs code, creates images and short videos, and makes documents, spreadsheets, and presentations. It remembers what you ask it to, works with voice, and opens the AI Verse apps for health, study, finance, careers, and more.",
      "Prefer a model you already know? Pick ChatGPT, Claude, Gemini, or Groq with your own API key, and AIV Eco still applies its water-saving steps around every request.")),
   ("How it works", steps([
      "Open <a href=\"./\">aiv-x.com/eco</a>. No account needed to start.",
      "Ask anything. AIV Eco decides the lightest way to answer well: on your device, from a saved answer, or with the smallest AI model that fits.",
      "Check the energy and water line under the answer, or open Your impact to see your totals.",
    ]) + HONEST)],
  [("Does AIV Eco really use less water?", "AIV Eco uses less computing for the same task by skipping work an answer doesn't need, and computing is what drives AI's energy and water usage. Its per-answer figures are estimates based on that computing."),
   ("Is AIV Eco free?", "Yes. You can send 10 messages without an account, and a free account includes 20 messages a day. Chats that use your own ChatGPT, Claude, Gemini, or Groq key don't count toward the free messages."),
   ("Is AIV Eco as capable as other AI assistants?", "It has the features of AIV X, AI Verse's full AI assistant, including web search, deep research, file reading, images, video, documents, voice, and memory. Eco mode keeps answers direct."),
   ("Who makes AIV Eco?", "AIV Eco is made by AI Verse, a California AI company that builds AI apps for everyday tasks.")],
  "Eco-friendly AI assistant")

page("ai-water-usage.html",
  "How Much Water Does AI Use? AI Water Usage Explained | AIV Eco",
  "Why AI uses water, how much a single AI prompt may use, and practical ways to reduce AI's water usage, including the eco-friendly AI assistant AIV Eco.",
  "AI water usage",
  "How much water does AI use?",
  "Every AI answer runs on servers in a data center. Those servers use electricity and get hot, and both cooling them and generating their electricity can consume fresh water. Here's what's known about AI water usage, why the numbers vary so much, and what you can do about it.",
  [("Where AI's water goes", cards([
      ("Cooling data centers", "Many data centers cool servers with water that evaporates. This is the water used on site."),
      ("Generating electricity", "Power plants that supply data centers also consume water. Researchers count this as off-site water, and it is often the larger share."),
      ("Making the hardware", "Manufacturing chips and servers uses water too, though it's usually counted separately from running the AI."),
    ])),
   ("How much water does one AI prompt use?", para(
      "Estimates vary widely. In 2025, Google reported that its median Gemini Apps text prompt used about 0.24 watt-hours of energy and 0.26 milliliters of water, about five drops. Earlier research from UC Riverside, <i>Making AI Less \"Thirsty\"</i>, estimated that GPT-3 consumed a 500 mL bottle of water for roughly 10 to 50 medium-length responses, depending on when and where it ran.",
      "The figures differ because they measure different models, data centers, and boundaries: some count only on-site cooling, others include the water used to generate electricity. What all of them agree on is that more computing means more energy and more water, and that long answers, large models, image and video generation, and repeated web searches all add up.") +
      table(["Source", "What it measured", "Water"], [
        ["Google, 2025", "Median Gemini Apps text prompt, on-site cooling", "About 0.26 mL per prompt"],
        ["Li, Yang, Islam and Ren (UC Riverside)", "GPT-3 inference, on-site and electricity water", "About 500 mL per 10 to 50 responses"],
      ])),
   ("Ways to reduce AI water usage", cards([
      ("Skip AI for simple things", "A calculator or unit converter doesn't need a data center."),
      ("Don't ask twice", "Reuse good answers instead of asking the same question again."),
      ("Use a smaller model", "Most everyday questions don't need the largest AI model."),
      ("Keep it short", "Shorter prompts and answers mean less computing."),
      ("Search less, read smarter", "Reading a few pages as plain text uses far less than fully loading many pages."),
      ("Use AIV Eco", "AIV Eco does all of the above automatically and shows the estimated water for every answer."),
    ]) + HONEST)],
  [("Why does AI use water?", "AI runs on servers that need electricity and cooling. Data centers often use evaporating water for cooling, and power plants consume water to generate electricity."),
   ("Is AI water usage a problem?", "One prompt uses a small amount, but billions of prompts add up, and some data centers sit in areas where fresh water is scarce. Researchers have called for more transparency about AI's water footprint."),
   ("How does AIV Eco estimate water usage?", "AIV Eco models the energy from the amount of text the AI reads and writes and the web pages it fetches, then converts energy to water using published averages for data-center cooling and electricity. The method is shown in the app under Your impact."),
   ("Can I see the water usage of my own AI chats?", "Yes. In AIV Eco, every answer shows its estimated energy and water usage, and Your impact keeps a running total.")],
  "AI water usage explained")

page("green-ai-solutions.html",
  "Green AI Solutions: Sustainable AI for Everyday Work | AIV Eco",
  "AIV Eco is a green AI solution for people, students, and teams who want sustainable AI: lower water usage and energy per task, with the environmental impact shown on every answer.",
  "Green AI solutions",
  "Green AI solutions for everyday work",
  "AI is becoming part of everyday work, and its environmental footprint grows with it. AIV Eco is AI Verse's answer: a sustainable AI assistant that does the same everyday work with less computing, so each task uses less energy and less water.",
  [("Sustainable AI, built in", cards([
      ("Minimum necessary computing", "Every request takes the lightest path that still answers well: on your device, from a saved answer, or with the smallest model that fits."),
      ("Water-aware answers", "AIV Eco is designed around AI water usage, not just speed and cost."),
      ("Transparent impact", "Estimated energy and water appear on every answer, with the method explained."),
      ("Bring your own AI", "Use ChatGPT, Claude, Gemini, or Groq with your own key and still get Eco's savings."),
    ])),
   ("Eco-friendly AI for", cards([
      ("Everyday life", "Questions, plans, writing, and research with a smaller environmental footprint."),
      ("Students", "Study help, summaries, and research that don't waste computing on repeat questions."),
      ("Teams and small businesses", "A greener default AI for documents, spreadsheets, presentations, and web research."),
      ("Sustainability-minded organizations", "An AI tool whose environmental impact is visible, not hidden."),
    ])),
   ("Why green AI matters", para(
      "Every AI answer uses electricity, and electricity and data-center cooling both use water. Making AI more efficient is one of the most direct ways to reduce its environmental impact, because the savings repeat on every single request.",
      "AIV Eco focuses on the part an AI app can control: how much work each request causes. Providers control the data centers; AIV Eco controls the workload.") + HONEST)],
  [("What is green AI?", "Green AI, or sustainable AI, means getting useful results from AI with less energy, water, and carbon. That includes efficient models, efficient data centers, and apps that avoid unnecessary AI work."),
   ("How is AIV Eco a sustainable AI solution?", "It reduces computing per task by answering simple things on your device, reusing saved answers, choosing the right-size model, reading the web efficiently, and keeping answers direct. It shows the estimated impact of each answer."),
   ("Can my business use AIV Eco?", "Yes. Anyone can use AIV Eco for free. For custom AI solutions, contact AI Verse at team@aiverse.it.com."),
   ("Is AIV Eco carbon neutral?", "No. AIV Eco reduces the computing each answer needs, which lowers its estimated energy and water usage, but it doesn't make AI carbon neutral or water free.")],
  "Green AI solutions")

page("ai-environmental-impact-tracker.html",
  "AI Energy and Water Usage Tracker for Every Answer | AIV Eco",
  "See the environmental impact of your AI use. AIV Eco shows estimated energy and water usage on every answer and tracks how much water and energy you've saved.",
  "AI impact tracker",
  "See the energy and water behind every AI answer",
  "Most AI apps hide their environmental impact. AIV Eco shows it. Under every answer you'll see the estimated energy and water it took, and Your impact adds it all up: the water used, the water avoided, and what AIV Eco skipped to get there.",
  [("What the tracker shows", cards([
      ("Energy per answer", "Estimated watt-hours for the answer, including any web pages read."),
      ("Water per answer", "Estimated milliliters of water for data-center cooling and electricity."),
      ("Compared with a traditional approach", "The same request sent to a large AI model, so you can see the savings."),
      ("How it was answered", "On your device, from a saved answer, or by an AI model, and which one."),
      ("Your impact totals", "Water and energy used and avoided, answers measured, and AI calls skipped."),
      ("The method, in plain words", "Every estimate links to how it was calculated and what it leaves out."),
    ])),
   ("How the estimates work", para(
      "AIV Eco models energy from the amount of text the AI model reads and writes, using different rates for small, medium, and large models, plus the web pages fetched for the answer. Water is that energy multiplied by published averages for data-center cooling and electricity generation.",
      "These are estimates, not measurements. AI providers don't publish per-request energy or water for most models, and AIV Eco can't see which data center answered. The estimates are meant to show the direction and size of the savings honestly.") + HONEST)],
  [("Is the water number exact?", "No. It's a modeled estimate. Real water usage depends on the provider, the data center, its cooling system, and the local power grid."),
   ("What does \"compared with a traditional approach\" mean?", "It's the same request sent with the full context to a large AI model. For answers that use the web, it also assumes every page is fully loaded and more text is read."),
   ("Does tracking my impact cost extra?", "No. The tracker is part of every answer and is free."),
   ("Where are my totals stored?", "Your impact totals are kept in your browser on this device.")],
  "AI energy and water tracker")

page("chatgpt-claude-gemini-with-less-water.html",
  "Use ChatGPT, Claude and Gemini With Less Water | AIV Eco",
  "Bring your own ChatGPT, Claude, Gemini, or Groq API key to AIV Eco and use your favorite AI models with less water and energy consumption.",
  "Your favorite AI models",
  "Your favorite AI models, with less water and energy",
  "Already use ChatGPT, Claude, or Gemini? Connect your own API key to AIV Eco and keep the model you like. AIV Eco wraps every request in its water-saving steps, so you get the same AI with less unnecessary computing.",
  [("What Eco adds to your model", cards([
      ("Right-size routing", "Simple requests go to the small model from that provider, everyday questions to the medium one, and hard problems to the large one."),
      ("Fewer calls", "Simple math and conversions are answered on your device, and repeat questions reuse saved answers."),
      ("Less text sent", "Long conversations and documents are trimmed to what the question needs."),
      ("Impact on every answer", "See estimated energy and water for each answer, whichever model you use."),
    ])),
   ("Supported models", table(["Model", "Provider", "How to connect"], [
      ["ChatGPT", "OpenAI", "Your OpenAI API key"],
      ["Claude", "Anthropic", "Your Anthropic API key"],
      ["Gemini", "Google", "Your Google AI Studio key"],
      ["Groq", "Groq", "Your Groq API key"],
      ["AIV-1 Eco", "AI Verse", "Built in, free"],
    ])),
   ("How to connect", steps([
      "Open <a href=\"./\">AIV Eco</a> and choose a model from the AI model menu.",
      "If you don't have a key yet, use the button to get one from the provider.",
      "Paste your key. It's stored only in your browser and sent only to that provider.",
    ]) + '<p class="fine">ChatGPT, Claude, Gemini, and Groq are trademarks of their owners. AIV Eco is not affiliated with or endorsed by OpenAI, Anthropic, Google, or Groq.</p>' + HONEST)],
  [("Do I need my own API key?", "Only for ChatGPT, Claude, Gemini, or Groq. AIV-1 Eco is built in and free to use."),
   ("Who pays for my API usage?", "Your provider bills your own account for what you use. Chats on your own key don't count toward AIV Eco's free messages."),
   ("Is my API key safe?", "Your key is stored only in your browser and is sent only to the provider you chose. It doesn't pass through AI Verse."),
   ("Does Eco change my model's answers?", "Eco picks the model size for each request and keeps answers direct. You can still choose the model and edit which small, medium, and large models it uses.")],
  "ChatGPT, Claude and Gemini with less water")

CSS = (pathlib.Path("/home/claude/aivx_src/AIV-X-main/seo.css").read_text()
  .replace(":root{--bg:#fff;", ":root{--eco:#2f7a18;--eco-on:#fff;--bg:#fff;")
  .replace("@media (prefers-color-scheme: dark){:root{", "@media (prefers-color-scheme: dark){:root{--eco:#8cc63f;--eco-on:#0a0a0b;")
  .replace(".cta{display:inline-block;background:var(--text);color:var(--bg);", ".cta{display:inline-block;background:var(--eco);color:var(--eco-on);")
  .replace(".fair{border-left:3px solid var(--text);", ".fair{border-left:3px solid var(--eco);")) + """
.brand{display:inline-flex;align-items:center;gap:8px;letter-spacing:0}.brand svg{height:18px;width:auto}.brand b{color:var(--eco);font-weight:700;letter-spacing:0}
.hero{border-radius:20px;overflow:hidden;margin:0 0 28px;aspect-ratio:1200/630;background:#0a6873}.hero img{width:100%;height:100%;object-fit:cover;display:block}
h2 a{color:inherit}
main>p:not(.lead):not(.fine){margin:0 0 14px;color:var(--text2)}
.tw{margin-top:8px}
"""
(OUT / "seo.css").write_text(CSS)

LOGO = '<svg viewBox="168 188 1044 394" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"><path d="M210 538L402 232L582 538"/><path d="M372 432L428 432"/><path d="M700 232V538"/><path d="M822 232L992 536L1164 232"/></g></svg>'
def related(cur):
    links = [(p["slug"], p["label"]) for p in PAGES if p["slug"] != cur] + [("../", "AIV X")]
    return '<nav class="related" aria-label="More about AIV Eco">' + "".join(f'<a href="{s}">{E(l)}</a>' for s, l in links) + "</nav>"
def head(title, desc, url, ld):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="AIV Eco">
<meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{BASE}og-image.png"><meta property="og:image:alt" content="AIV Eco: the AI that uses less water">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(desc)}"><meta name="twitter:image" content="{BASE}og-image.png">
<meta name="theme-color" content="#0a6873">
<link rel="icon" href="../favicon.ico" sizes="any"><link rel="icon" href="../icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../apple-touch-icon.png">
<link rel="stylesheet" href="seo.css">
<script type="application/ld+json">{json.dumps(ld)}</script>
</head>
<body>
<div class="wrap">
<header><a class="brand" href="./" aria-label="AIV Eco">{LOGO}<b>Eco</b></a><a class="cta" href="./">Try AIV Eco free</a></header>
<main>
'''
FOOT = '''<footer>AIV Eco by AI Verse · <a href="../terms.html">Terms of Use</a> · <a href="../privacy.html">Privacy Policy</a> · <a href="https://aiverse.it.com/">AI Verse</a></footer>
</div>
</body>
</html>
'''
BAND = '<div class="band"><h2 style="margin:0">Try the AI that uses less water</h2><p>Free to use. Send 10 messages without an account, or sign up free for 20 messages a day.</p><a class="cta" href="./">Open AIV Eco</a></div>'
for p in PAGES:
    url = BASE + p["slug"]
    ld = {"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","@id":url+"#page","url":url,"name":p["title"],"description":p["desc"],"inLanguage":"en","isPartOf":{"@id":BASE+"#site"},"about":{"@id":BASE+"#app"},"primaryImageOfPage":BASE+"og-image.png","dateModified":DATE},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AIV Eco","item":BASE},{"@type":"ListItem","position":2,"name":"Explore","item":BASE+"explore.html"},{"@type":"ListItem","position":3,"name":p["crumb"],"item":url}]},
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q, a in p["faqs"]]},
      APP]}
    body = head(p["title"], p["desc"], url, ld)
    body += f'<div class="crumbs"><a href="./">AIV Eco</a> / <a href="explore.html">Explore</a> / {E(p["crumb"])}</div>\n<h1>{E(p["h1"])}</h1>\n<p class="lead">{E(p["lead"])}</p>\n<a class="cta" href="./">Start free</a>\n'
    for h, c in p["sections"]: body += f"<h2>{E(h)}</h2>\n{c}\n"
    body += "<h2>Questions</h2>\n" + "".join(f"<details><summary>{E(q)}</summary><p>{E(a)}</p></details>" for q, a in p["faqs"]) + "\n" + BAND
    if p["slug"] == "ai-water-usage.html":
        body += '<h2>Sources</h2><ul class="steps" style="padding-left:22px"><li><a href="https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference">Google Cloud: Measuring the environmental impact of AI inference (2025)</a></li><li><a href="https://arxiv.org/abs/2508.15734">Measuring the environmental impact of delivering AI at Google scale (arXiv 2508.15734)</a></li><li><a href="https://arxiv.org/abs/2304.03271">Li, Yang, Islam and Ren: Making AI Less "Thirsty" (arXiv 2304.03271)</a></li></ul>'
    body += "\n<h2>Explore more</h2>\n" + related(p["slug"]) + "\n</main>\n" + FOOT
    (OUT / p["slug"]).write_text(body)

# hub
url = BASE + "explore.html"
ld = {"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","@id":url,"url":url,"name":"Explore AIV Eco","description":"AIV Eco, the eco-friendly AI that uses less water: how it saves water and energy, AI water usage explained, and green AI solutions.","isPartOf":{"@id":BASE+"#site"}},
  {"@type":"ItemList","itemListElement":[{"@type":"ListItem","position":i+1,"url":BASE+p["slug"],"name":p["label"]} for i, p in enumerate(PAGES)]},
  {"@type":"WebSite","@id":BASE+"#site","url":BASE,"name":"AIV Eco","publisher":{"@type":"Organization","name":"AI Verse","url":"https://aiverse.it.com/"}}, APP]}
hub = head("Explore AIV Eco: The Eco-Friendly AI That Uses Less Water", "AIV Eco is the AI that uses less water and is better for the environment. Learn how it saves water and energy, how AI water usage works, and green AI solutions.", url, ld)
hub += '<div class="hero"><img src="og-image.png" alt="AIV Eco: the AI that uses less water" width="1200" height="630"></div>\n<h1>The AI that uses less water</h1>\n<p class="lead">AIV Eco is AI Verse\'s eco-friendly AI assistant. It does everyday AI work with less computing, so each answer uses less energy and less water, and it shows you the estimated environmental impact of every answer.</p>\n'
hub += '<div class="grid">' + "".join(f'<a class="card" style="text-decoration:none;color:inherit" href="{p["slug"]}"><h3>{E(p["label"])}</h3><p>{E(p["desc"])}</p></a>' for p in PAGES) + "</div>\n" + BAND + "\n</main>\n" + FOOT
(OUT / "explore.html").write_text(hub)

# sitemap entries for the root sitemap
print("\n".join(f'  <url><loc>{BASE}{s}</loc><lastmod>{DATE}</lastmod><changefreq>{f}</changefreq><priority>{pr}</priority></url>' for s, f, pr in [("", "weekly", "0.9"), ("explore.html", "monthly", "0.8")] + [(p["slug"], "monthly", "0.7") for p in PAGES]))
