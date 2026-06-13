# Capital Flow · Donchian 55d

Dashboard para visualizar el flujo de capital entre activos globales usando ratios relativos y canal Donchian de 55 días sobre High/Low.

## Estructura

```
capital-flow/
├── fetch_data.py          # Descarga precios de Yahoo Finance
├── requirements.txt       # Dependencias Python
├── src/
│   ├── App.jsx            # App React con datos reales
│   └── main.jsx           # Entry point
├── public/
│   └── data/
│       └── prices.json    # Generado por fetch_data.py
├── index.html
├── package.json
├── vite.config.js
└── .github/
    └── workflows/
        └── update.yml     # Cron diario: fetch + build + deploy
```

## Setup local

### 1. Instalar dependencias

```bash
# Python
pip install -r requirements.txt

# Node
npm install
```

### 2. Descargar precios

```bash
python fetch_data.py
```

Genera `data/prices.json` con 1 año de OHLC para todos los activos.

### 3. Copiar data a public y correr app

```bash
cp data/prices.json public/data/prices.json
npm run dev
```

Abre http://localhost:5173

## Deploy en GitHub Pages

### 1. Crear repositorio en GitHub y subir código

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/TU_USUARIO/capital-flow.git
git push -u origin main
```

### 2. Activar GitHub Pages

- Ir a Settings → Pages
- Source: **GitHub Actions**

### 3. El workflow corre automáticamente

- Lunes a viernes a las 23:00 UTC (6pm Colombia)
- Descarga precios → build → deploy
- También puedes correrlo manualmente desde Actions → "Actualizar Precios Diario" → Run workflow

## Lógica

- **Ratio** = precio(A) / precio(B) usando mid = (High+Low)/2
- **Canal Donchian 55d** = max(High ratio, 55d) y min(Low ratio, 55d) dinámico
- **Fluye hacia** = ratio creciente en 55d
- **Sale de** = ratio decreciente en 55d
- **Ranking Global** = cada activo vs todos los demás (victorias / total)
