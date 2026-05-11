# Photopark AR — Web Demo

The browser prototype of the Photopark forced-perspective AR concept. Drag to orbit, scroll to zoom, find the magic spot. Hit "Snap to spot" for the pitch reveal.

---

## Three ways to put this online

Pick whichever path matches your comfort level. **Path 1 is the easiest** — no terminal needed.

---

### Path 1 — GitHub + Vercel (no terminal, ~10 minutes)

1. **Sign up for GitHub** at https://github.com if you don't have an account. Free.
2. **Create a new repository.** Click the `+` button at the top-right of GitHub, then **New repository**. Name it `photopark-ar`. Pick **Public** (free Vercel works with public repos). Don't tick "Add a README." Click **Create repository**.
3. **Upload these files.** On the empty repo page, click the link **"uploading an existing file"**. Open this folder on your computer, select everything inside it (including the `src` folder), and drag it into the browser upload area. Scroll down and click **Commit changes**.
4. **Sign up for Vercel** at https://vercel.com. You can log in with your new GitHub account — fastest path.
5. **Import the project.** On the Vercel dashboard click **Add New → Project**. Find `photopark-ar` in the list and click **Import**. Vercel will auto-detect this is a Vite app. Don't change any settings. Click **Deploy**.
6. **Wait about a minute.** When the build finishes, Vercel gives you a public URL like `photopark-ar-xxx.vercel.app`. That's your live demo.

**Bonus:** any future edits you push to  GitHub auto-redeploy. You can even edit `src/App.jsx` directly in the GitHub web UI for quick tweaks.

---

### Path 2 — Vercel CLI (fastest, requires Node.js)

If you already have Node.js installed (check with `node --version`):

```bash
# Install the Vercel CLI once
npm install -g vercel

# From inside this folder
cd photopark-ar-vercel
vercel
```

Follow the prompts. First time: it opens a browser to log in (use GitHub, Google, or email). Then it asks a few questions — accept all defaults. ~30 seconds later you have a URL.

To deploy a production version (Vercel calls the first one a "preview"):

```bash
vercel --prod
```

---

### Path 3 — Build first, drag-drop on Vercel

If you want to deploy without GitHub or the CLI:

```bash
cd photopark-ar-vercel
npm install     # one-time
npm run build   # creates the dist/ folder
```

Then go to https://vercel.com/new and use the **deploy a static folder** option (look for it under templates or in the docs — Vercel occasionally moves it). Drag the `dist/` folder up. Done.

---

## Running it locally first (recommended before deploying)

Verify the demo works on your machine before pushing it anywhere.

```bash
cd photopark-ar-vercel
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). Edits to files under `src/` reload in the browser automatically.

---

## File layout

```
photopark-ar-vercel/
├── index.html          ← HTML shell that loads React
├── package.json        ← dependencies list
├── vite.config.js      ← build tool config
├── .gitignore          ← files git should ignore
└── src/
    ├── main.jsx        ← entry point, mounts React
    └── App.jsx         ← the whole demo (Three.js + UI)
```

Everything that matters is in `src/App.jsx`. If you want to tweak colors, copy, props, scenes, or the magic-spot logic, that's the only file you need to touch.

---

## Common problems

**`command not found: npm`** — Install Node.js from https://nodejs.org (pick the LTS option). Restart your terminal after install.

**Build succeeds but the page is blank** — Open the browser DevTools (Cmd+Option+I on Mac, F12 on Windows), look at the Console tab. The error message will tell you what's wrong — usually a typo. Fix it in `src/App.jsx`, save, and Vercel auto-rebuilds (Path 1) or run `vercel --prod` again (Path 2).

**Fonts look wrong** — The demo loads Google Fonts (`Big Shoulders Display`, `JetBrains Mono`) at runtime. If you're behind a strict firewall they may not load — the demo falls back to system fonts and still works, just less stylish.

**WebGL not supported** — On very old machines or some locked-down browsers. The demo needs WebGL 2 (any browser from the last 5 years works). Chrome, Firefox, Safari all fine.

---

## What to change before showing investors

- The badge text in the top-left ("PHOTOPARK · AR · FORCED PERSPECTIVE · PROTOTYPE") — drop "PROTOTYPE" if you're confident, change the kicker copy
- The intro card headline ("FIND THE MAGIC ANGLE") and the bullets below
- The list of preset artworks — add real Photopark hero images, replace the procedural ones

All of this lives in `src/App.jsx`. Search for the strings.

---

## What's next

- **Custom domain** — under Vercel project settings → Domains, add your own (e.g. `demo.photopark.com`). Free, takes a few minutes plus DNS propagation.
- **iPad AR version** — see the separate brief (`photopark_ipad_brief.md`) for what to hand a developer to build the real on-site AR app.
