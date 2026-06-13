"""
fetch_data.py
─────────────
Descarga precios OHLC diarios de Yahoo Finance para todos los activos
del dashboard Capital Flow. Guarda el resultado en data/prices.json.

Uso:
    python fetch_data.py

Requiere:
    pip install yfinance
"""

import json
import datetime
import yfinance as yf
from pathlib import Path

# ── Activos ───────────────────────────────────────────────────────────────────
ASSETS = [
    {"id": "SPY",  "label": "EE.UU.",        "group": "Equity"},
    {"id": "FXI",  "label": "China",          "group": "Equity"},
    {"id": "EFA",  "label": "Europa",         "group": "Equity"},
    {"id": "EWJ",  "label": "Japón",          "group": "Resto"},
    {"id": "EEM",  "label": "Emergentes",     "group": "Resto"},
    {"id": "INDA", "label": "India",          "group": "Resto"},
    {"id": "EWZ",  "label": "Brasil",         "group": "Resto"},
    {"id": "TLT",  "label": "Bonos 20yr",     "group": "Bonos"},
    {"id": "SHY",  "label": "Bonos 2yr",      "group": "Bonos"},
    {"id": "HYG",  "label": "High Yield",     "group": "Bonos"},
    {"id": "TIP",  "label": "TIPS",           "group": "Bonos"},
    {"id": "GLD",  "label": "Oro",            "group": "Commodities"},
    {"id": "SLV",  "label": "Plata",          "group": "Commodities"},
    {"id": "USO",  "label": "Petróleo",       "group": "Commodities"},
    {"id": "CPER", "label": "Cobre",          "group": "Commodities"},
    {"id": "DBA",  "label": "Agrícolas",      "group": "Commodities"},
    {"id": "UUP",  "label": "Dólar",          "group": "Macro"},
    {"id": "FXE",  "label": "Euro",           "group": "Macro"},
    {"id": "BTC-USD", "label": "Bitcoin",     "group": "Crypto"},
    {"id": "ETH-USD", "label": "Ethereum",    "group": "Crypto"},
]

# 1 año de historia para que el canal Donchian de 55d esté maduro
PERIOD = "1y"

def fetch():
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}] Descargando precios...")
    
    result = {
        "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "assets": [],
        "prices": {}
    }

    tickers = [a["id"] for a in ASSETS]
    
    # Descarga batch — más rápido que uno por uno
    raw = yf.download(
        tickers,
        period=PERIOD,
        interval="1d",
        auto_adjust=True,
        progress=False,
        group_by="ticker",
    )

    for asset in ASSETS:
        ticker = asset["id"]
        try:
            if len(tickers) == 1:
                df = raw
            else:
                df = raw[ticker]

            df = df.dropna(subset=["High", "Low", "Close"])

            result["prices"][ticker] = {
                "high":  [round(v, 6) for v in df["High"].tolist()],
                "low":   [round(v, 6) for v in df["Low"].tolist()],
                "close": [round(v, 6) for v in df["Close"].tolist()],
                "dates": [d.strftime("%Y-%m-%d") for d in df.index.tolist()],
            }

            result["assets"].append({
                "id":    ticker,
                "label": asset["label"],
                "group": asset["group"],
            })

            print(f"  ✓ {ticker:10s} {len(df)} días")

        except Exception as e:
            print(f"  ✗ {ticker:10s} ERROR: {e}")

    # Guardar
    out = Path("data/prices.json")
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(result, indent=2))
    print(f"\n✅ Guardado en {out} — {len(result['assets'])} activos")
    return result

if __name__ == "__main__":
    fetch()
