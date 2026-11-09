# Monthly Halaqah Competition (مسابقة الحلقة الشهرية)

An installable app that works offline for tracking the monthly group points competition. It has no build step and no server: just static files.

## Files

| File | What it is |
|---|---|
| `index.html` | App shell |
| `app.js` | All app logic (scoring, screens, backup, sharing) |
| `style.css` | iPhone-first styles, light/dark themes |
| `sw.js` | Service worker that makes the app work offline |
| `manifest.webmanifest` | Lets the app be installed to the home screen |
| `icon-*.png`, `apple-touch-icon.png` | App icons |
| `vercel.json` | Tells Vercel not to cache `sw.js` |

## Deploy (Vercel)

1. Put this folder in a GitHub repo (or run `npx vercel` inside it).
2. In Vercel: **Add New → Project →** import the repo. Framework preset: **Other**. No build command. Output directory: the folder root.
3. Deploy. You'll get a URL like `https://halaqah-competition.vercel.app`.

GitHub Pages or Netlify also work. It must be served over **https**, or offline mode won't turn on.

## Install on the teacher's phone

**Android (Chrome):** open the URL → tap **Install app** (or ⋮ → *Add to Home screen*).
**iPhone (Safari):** open the URL → Share button → **Add to Home Screen**.

Open it once while online. After that it works fully offline.

## Updating the app

1. Edit the files and redeploy.
2. In `sw.js`, change `VERSION` (e.g. `'v1'` → `'v2'`). This is what makes installed phones download the new files.
3. The phone picks up the update the next time the app is opened with internet, and shows it on the following launch.

Data is not affected by updates.

## Where the data lives

Everything is saved in the phone's browser storage (`localStorage`, key `hc-data`). Nothing is sent anywhere.

- **Backup:** Settings → Groups & settings → **Save backup file** (a `.json` file). The app reminds the teacher if no backup has been made in over 30 days.
- **Restore / move to a new phone:** install the app on the new phone → **Restore from file**.
- Deleting the app or clearing browser data erases the data, so keep monthly backups.

## Sharing with students (view-only)

Leaderboard → **Share results image** (a ready-made picture for the WhatsApp group) or **Share as text**.

## Moving data from the Claude version

In the Claude version, Settings → Groups & settings → **Copy data**. Paste the copied text into a file named `backup.json`, then in this app use **Restore from file**.
