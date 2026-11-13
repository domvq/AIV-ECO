# AIV Eco

AIV Eco is the AIV X app with an Eco layer on top: the same chat, uploads, web search, deep research,
images, video, documents, spreadsheets, presentations, code, voice, projects, library, AI Verse apps,
memory and sign-in. Build and Agents are switched off.

## What the Eco layer adds

- Energy and water estimate on every text answer, on every model, plus running totals under Impact.
- Math, unit conversions and date/time are answered on the device with no AI model and no free message spent.
- General questions already answered on this device reuse the saved answer (Regenerate always asks again).
- AI model picker: AIV-1 Eco (default), AIV-1, AIV-1 Thinking, and ChatGPT, Claude, Gemini, Groq on the
  user's own key. Picking one without a key opens a box with a button to that company's key page.
- Own-key chats pick a small, medium or large model per request and don't spend free AIV messages.
- No sign-in wall: visitors land straight in the app as guests (10 messages), with Sign in and Sign up
  in the top-right corner and a line under the box saying that messaging means agreeing to the Terms.
  The sign-in screen (with the underwater background) opens only from those buttons and can be closed.
- Top bar: Impact, Settings, Launch AIV X, and Sign in / Sign up for guests.

## Publish

Easiest (no server changes): upload the `eco` folder into the AIV X GitHub repo, next to AIV X's own
index.html. AIV Eco is then live at https://aiv-x.com/eco/ and shares AIV X's sign-in, chats and memory.

On its own web address instead, three places need to learn that address:
1. `SITE_ORIGINS` in `aivx-worker.js` (the AIV X API only answers known sites).
2. Firebase console > Authentication > Settings > Authorized domains.
3. The allowed-sites list at the top of `aiv-connect.js` on aiverse.it.com (so opened apps can talk to the copilot).

## Updating when AIV X changes

`builder/` rebuilds AIV Eco from any newer AIV X index.html:

    python3 builder/make-eco.py path/to/AIV-X/index.html eco/index.html

It stops with a message if a part of AIV X it needs to change has moved. All Eco behavior lives in
`builder/eco-layer.js`.

## Things to know

- Estimates are modeled, not measured. They use AIV X's Eco coefficients. One difference from AIV X's
  Eco mode: the "three times more text" comparison is applied only to answers that read web pages.
  Plain chat is compared like for like against a large model, so a large model shows no savings.
- With an own key, the chat itself goes to that company. Web search, images, video and voice still run
  on the AI Verse API. Chats are still shared for training when "Improve AIV Eco for everyone" is on.
- Claude and Gemini answers appear all at once; AIV-1, ChatGPT and Groq stream.
- Guests keep the 10-message limit, with or without their own key. Guests no longer tick the 18+ and
  Terms box; they agree through the line under the message box. Sign-up still requires the box.
- "Create an app" (apps, games, websites) is still in the + menu; only the AI builder was removed.
