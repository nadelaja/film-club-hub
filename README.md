[![Netlify Status](https://api.netlify.com/api/v1/badges/f2aadc3c-3679-408d-b6fc-a7d86f35e642/deploy-status)](https://app.netlify.com/projects/jummys-film-club/deploys)
# Film Club Hub

That's basically what this is :D

## To My Friends

Welcome to my film club! I'll keep this updated with new curated lists throughout the year, think October horror marathons, summer blockbusters, holiday classics, genre deep-dives, whatever strikes **_my_** fancy (we can pick themes together tooo~!). Each collection has its own tracker so you can mark off what you've watched. This is currently being done via localSorage, but I might change that in the future because cross device tracking isn't possible right now. You can also filter by year or genre, and even get random picks when you can't decide. Your progress saves automatically in your browser, so you can work through the lists at your own pace. Currently live: Fangtober 🦇 (watch 31 vampire films in 31 days!).

**Updates**

The overlay no longer jumps when navigating through films, but the the navigation arrows use the movies array (original order), while the page itself shows the filtered movies (sorted order). So, they're out of sync! 

With The Movie Database's API most sources are listed in the details of the film cards, but please let me know if you have trouble finding anything!

## Overall Project Structure

```
movie-challenge-hub/
├── index.html         # Homepage with list selection
├── challenge.html     # Main page
├── config.js          # Movie lists and configurations
├── .env               # Environment variables, I've also included a Environment Variables Template/Example For the Node.js/Vite/webpack peeps (DO NOT COMMIT :P)
├── .gitignore         # Git ignore file
├── netlify.toml       # Netlify deployment configuration is using Netlify Environment Variables
└── README.md          # This file!
```

## Basic Setup (For Me and Those Who Care)
**Notice**: If you're not using a build tool like Node.js/Vite/Webpack, skip step 1


1. **Create a `.gitignore` file** in the project root:
```
.env
.env.local
node_modules/
```

2. **Get an API Key:**
   - **TMDb API**: https://www.themoviedb.org/settings/api (free, instant approval, *attribution required*!)

3. **Push to GitHub** (without API keys in code):
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin github-repo-url
git push -u origin main
```

4. **Add Environment Variables & Deploy on Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub repository
   - Add enviroment variables
      - Add the key/value pair `TMDB_API_KEY`, generated_tmdb_key
   - Deploy site

5. **Create `netlify.toml` in project root:**
```toml
[build]
  command = "sed -i 's/{{TMDB_API_KEY}}/'$TMDB_API_KEY'/g' watchlist.html"
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Adding New Challenges

1. **Edit `config.js`** - Add new watchlist:

```javascript
// Please follw this `year-theme-slug` format
'2025-summer-slashers': {
    title: 'SUMMER SLASHERS',
    theme: 'Classic Slashers',
    year: 2025,
    targetCount: 30,
    congratsMessage: "You survived! What's next for our final girl?",
    movies: [
        { title: 'Halloween', year: 1978 },
        { title: 'Friday the 13th', year: 1980 },
        // ... add more
    ]
}
```

2. **Edit `index.html`** - Add a new watchlist card:

```html
<div class="challenge-card" onclick="window.location.href='challenge.html?id=2025-summer-slashers'">
</div>
    <div class="challenge-year">Summer</div>
    <div class="challenge-theme">Summer Slashers</div>
    <p class="challenge-description">30 classic slasher films</p>
    <button class="challenge-btn">Start Challenge</button>
</div>
```

3. **Optional** - Update navigation in `challenge.html`: 
<!--Will update with dropdown-->
```html
<div class="nav-links">
    <a href="index.html">Home</a>
    <a href="challenge.html?id=2025-fangtober">Fangtober</a>
    <a href="challenge.html?id=2025-summer-slashers">Summer Slashers</a>
</div>
```

## Data Storage

Each challenge stores progress separately in localStorage:
- `challenge_2025-fangtober_watched` - Fangtober progress
- `challenge_2025-spooktober_watched` - Spooktober progress
- `challenge_2025-winter-wonderland_watched` - Winter Wonderland progress

This means:
- You can work through multiple lists simultaneously
- Progress doesn't overlap between them
- Each watchlist has its own completion tracking

## Features (so far!)

- Multiple lists per with unique IDs (`year-theme-slug`)
- Separate progress tracking per challenge (localStorage!)
- Filters, sorting, random movie picker
- Swipe navigation on mobile
- Streaming info from TMDb (working on organizing them)
- Button to reset progress

## Keyboard Shortcuts

- `←/→` - Navigate movies
- `Esc` - Close overlay

## TMDb Attribution

Required by TMDb terms:
- TMDb logo + "This product uses the TMDb API but is not endorsed or certified by TMDb."
- TMDb API Docs: https://developers.themoviedb.org/3
