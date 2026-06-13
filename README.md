# Capital Flow

Tracks capital rotation across macro assets using ratio analysis. Deployed as a live web app via GitHub Pages, updated automatically every trading day.

## Structure

capital-flow/
├── fetch_data.py
├── requirements.txt
├── src/
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── data/
│       └── prices.json
├── index.html
├── package.json
├── vite.config.js
└── .github/
    └── workflows/
        └── update.yml

## Local Setup

# Python
pip install -r requirements.txt

# Node
npm install

# Download prices
python fetch_data.py

# Copy data and run app
cp data/prices.json public/data/prices.json
npm run dev

Open http://localhost:5173

## Deploy on GitHub Pages

git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/EnderA44hub/capital-flow.git
git push -u origin main

Then go to Settings → Pages → Source: GitHub Actions.

The workflow runs automatically Monday to Friday at 23:00 UTC.
Can also be triggered manually from Actions → "Update Daily Prices" → Run workflow.

## Logic

- Ratio = price(A) / price(B) using mid = (High + Low) / 2
- Donchian Channel 55d = max(High ratio, 55d) and min(Low ratio, 55d)
- Flowing into = ratio rising over 55 days
- Flowing out of = ratio falling over 55 days
- Global Ranking = each asset vs all others (wins / total comparisons)
