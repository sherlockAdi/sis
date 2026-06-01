# SIS Global Workforce Solutions — Next.js Website

Production-grade website built with **Next.js 15 + TypeScript + Tailwind CSS**.

---

## 🚀 Quick Start

```bash
cd sis-global
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles, animations, CSS vars
│   ├── layout.tsx           # Root layout (fonts, metadata)
│   ├── page.tsx             # Home page
│   └── industries/
│       ├── page.tsx         # Industries listing
│       └── [slug]/page.tsx  # Dynamic industry detail page
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx       # Sticky nav with dropdown + mobile menu
│   │   └── Footer.tsx       # 4-column footer with social links
│   ├── sections/
│   │   ├── HeroSection.tsx       # Full-screen looping video hero
│   │   ├── StatsBar.tsx          # Animated counter bar (red gradient)
│   │   ├── AboutSection.tsx      # Company info with image
│   │   ├── IndustriesSection.tsx # 6-card industry grid
│   │   ├── WhySISSection.tsx     # Scroll-triggered card shuffle
│   │   ├── RecruitmentSection.tsx# Alternating scroll timeline
│   │   ├── WorldMapSection.tsx   # D3.js interactive world map
│   │   └── CTASection.tsx        # Red gradient CTA banner
│   └── ui/
│       └── QuickForm.tsx         # Floating side form tab
│
├── data/
│   └── index.ts             # All site content (industries, stats, etc.)
│
├── lib/
│   ├── utils.ts             # cn() utility
│   └── useIntersectionObserver.ts
│
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--brand-red` | `#C8102E` |
| `--brand-red-dark` | `#A00D25` |
| Background | `#FFFFFF` |
| Grey scale | `#F9F9F9` → `#171717` |
| Display font | Oswald |
| Body font | Barlow |

---

## 🎬 Hero Video

Place your video file at:
```
public/videos/hero.mp4
```

The `<video>` tag has `autoPlay muted loop playsInline` — it will loop forever. The `poster` attribute shows a fallback image from Unsplash while the video loads.

---

## 🏭 Adding a New Industry

1. Open `src/data/index.ts`
2. Add a new entry to the `industries` array:

```ts
{
  id: "construction",          // used as URL slug
  title: "Construction",
  description: "...",
  icon: "🏗️",
  image: "https://...",
  href: "/industries/construction",
}
```

The dynamic route `src/app/industries/[slug]/page.tsx` will automatically generate the page.

---

## 🗺️ World Map (D3.js)

`WorldMapSection.tsx` uses:
- `d3` + `topojson-client` for SVG map rendering
- `world-atlas` CDN for GeoJSON data
- Interactive hover tooltips
- Country project counts from `src/data/index.ts`

To add countries: update `countriesData` in `src/data/index.ts`.

---

## ✨ Key Animations

| Feature | Implementation |
|---------|---------------|
| Stats counter | JS interval with `IntersectionObserver` |
| Card shuffle (Why SIS) | CSS `@keyframes shuffleIn` + staggered delay |
| Recruitment timeline | Alternating `translateX` on scroll + growing line |
| Industry cards | CSS hover `translateY` + gradient overlay |
| Section reveals | `opacity 0→1` + `translateY` via `IntersectionObserver` |

---

## 📦 Dependencies

```json
"next": "15",
"react": "^18",
"d3": "^7.9",
"topojson-client": "^3.1",
"framer-motion": "^11",
"lucide-react": "^0.383",
"clsx": "^2",
"tailwind-merge": "^2"
```
