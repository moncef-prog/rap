# Rap Map Morocco 

Plateforme interactive pour explorer la scène rap marocaine : carte en temps réel, système de paris et ligue fantasy.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** — Auth + base de données
- **Mapbox GL** — carte interactive
- **Spotify & YouTube APIs** — données artistes
- **Tailwind CSS** + **Framer Motion**

## Démarrage

```bash
cp .env.example .env.local
# remplis les variables d'environnement

npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables requises.

## Déploiement

```bash
npm run build
```

Compatible Vercel — définis les variables d'environnement dans le dashboard Vercel.
