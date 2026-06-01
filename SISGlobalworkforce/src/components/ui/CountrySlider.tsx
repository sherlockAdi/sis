'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import * as d3 from 'd3';
import { GeoPermissibleObjects } from 'd3-geo';
import styles from './CountrySlider.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Region = 'all' | 'gcc' | 'europe';

interface Country {
  name: string;
  flag: string;
  region: Exclude<Region, 'all'>;
  lat: number;
  lon: number;
  accentColor: string;
  properties: string;
  img: string;
  videoSrc?: string; // optional local video path e.g. '/videos/saudi.mp4'
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_COUNTRIES: Country[] = [
  {
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    region: 'gcc',
    lat: 24,
    lon: 45,
    accentColor: '#ef4444',
    properties: '3,200+ roles',
    img: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80',
    // videoSrc: '/videos/saudi.mp4',
  },
  {
    name: 'UAE',
    flag: '🇦🇪',
    region: 'gcc',
    lat: 24,
    lon: 54,
    accentColor: '#f97316',
    properties: '2,800+ roles',
    img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
    // videoSrc: '/videos/uae.mp4',
  },
  {
    name: 'Qatar',
    flag: '🇶🇦',
    region: 'gcc',
    lat: 25,
    lon: 51,
    accentColor: '#dc2626',
    properties: '1,400+ roles',
    img: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=80',
  },
  {
    name: 'Oman',
    flag: '🇴🇲',
    region: 'gcc',
    lat: 21,
    lon: 57,
    accentColor: '#16a34a',
    properties: '980+ roles',
    img: 'https://images.unsplash.com/photo-1602091376565-4f5c95f4726b?w=600&q=80',
  },
  {
    name: 'Kuwait',
    flag: '🇰🇼',
    region: 'gcc',
    lat: 29,
    lon: 47,
    accentColor: '#ca8a04',
    properties: '760+ roles',
    img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80',
  },
  {
    name: 'Bahrain',
    flag: '🇧🇭',
    region: 'gcc',
    lat: 26,
    lon: 50,
    accentColor: '#2563eb',
    properties: '520+ roles',
    img: 'https://images.unsplash.com/photo-1519177218930-e2bbd7ff4e01?w=600&q=80',
  },
  {
    name: 'Romania',
    flag: '🇷🇴',
    region: 'europe',
    lat: 46,
    lon: 25,
    accentColor: '#7c3aed',
    properties: '640+ roles',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  {
    name: 'Serbia',
    flag: '🇷🇸',
    region: 'europe',
    lat: 44,
    lon: 21,
    accentColor: '#be185d',
    properties: '410+ roles',
    img: 'https://images.unsplash.com/photo-1555990538-1ebcfd48b9d1?w=600&q=80',
  },
  {
    name: 'Croatia',
    flag: '🇭🇷',
    region: 'europe',
    lat: 45,
    lon: 16,
    accentColor: '#0ea5e9',
    properties: '380+ roles',
    img: 'https://images.unsplash.com/photo-1555990538-1376e8968b05?w=600&q=80',
  },
  {
    name: 'Hungary',
    flag: '🇭🇺',
    region: 'europe',
    lat: 47,
    lon: 19,
    accentColor: '#16a34a',
    properties: '290+ roles',
    img: 'https://images.unsplash.com/photo-1541855492-581f618f69a0?w=600&q=80',
  },
  {
    name: 'Slovenia',
    flag: '🇸🇮',
    region: 'europe',
    lat: 46,
    lon: 15,
    accentColor: '#0284c7',
    properties: '210+ roles',
    img: 'https://images.unsplash.com/photo-1583394560236-de2d03f70b63?w=600&q=80',
  },
  {
    name: 'Global Markets',
    flag: '🌍',
    region: 'europe',
    lat: 50,
    lon: 10,
    accentColor: '#6366f1',
    properties: 'Custom placements',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
];

// ─── D3 Globe Component ───────────────────────────────────────────────────────

interface GlobeProps {
  targetLat: number;
  targetLon: number;
  accentColor: string;
}

// Topojson type stubs
interface TopoJSON {
  feature(topology: unknown, object: unknown): GeoPermissibleObjects;
}

declare global {
  interface Window {
    topojson?: TopoJSON;
  }
}

const Globe: React.FC<GlobeProps> = ({ targetLat, targetLon, accentColor }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const rotationRef = useRef<[number, number, number]>([0, -20, 0]);
  const animFrameRef = useRef<number>(0);
  const worldRef = useRef<unknown>(null);
  const topoLoadedRef = useRef(false);

  const SIZE = 280;
  const RADIUS = 130;

  // Load topojson CDN script once
  useEffect(() => {
    if (topoLoadedRef.current) return;
    topoLoadedRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Ocean gradient — deep realistic blue
    const oceanGrad = defs
      .append('radialGradient')
      .attr('id', 'ocean-grad')
      .attr('cx', '38%')
      .attr('cy', '32%');
    oceanGrad.append('stop').attr('offset', '0%').attr('stop-color', '#2a6cb0');
    oceanGrad.append('stop').attr('offset', '45%').attr('stop-color', '#1a5490');
    oceanGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0c2e5c');

    // Specular highlight
    const specGrad = defs
      .append('radialGradient')
      .attr('id', 'spec-grad')
      .attr('cx', '30%')
      .attr('cy', '28%');
    specGrad.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(255,255,255,0.28)');
    specGrad.append('stop').attr('offset', '60%').attr('stop-color', 'rgba(255,255,255,0)');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    filter.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Atmosphere
    const atmGrad = defs.append('radialGradient').attr('id', 'atm-grad').attr('cx', '50%').attr('cy', '50%');
    atmGrad.append('stop').attr('offset', '72%').attr('stop-color', 'transparent');
    atmGrad.append('stop').attr('offset', '88%').attr('stop-color', '#5599dd').attr('stop-opacity', '0.22');
    atmGrad.append('stop').attr('offset', '100%').attr('stop-color', '#2255aa').attr('stop-opacity', '0.08');

    const g = svg.append('g').attr('transform', `translate(${SIZE / 2},${SIZE / 2})`);

    // Atmosphere halo
    g.append('circle').attr('r', RADIUS + 18).attr('fill', 'url(#atm-grad)');

    // Ocean sphere
    g.append('circle')
      .attr('r', RADIUS)
      .attr('fill', 'url(#ocean-grad)')
      .attr('stroke', 'rgba(80,140,230,0.4)')
      .attr('stroke-width', 1);

    const projection = d3
      .geoOrthographic()
      .scale(RADIUS)
      .translate([0, 0])
      .clipAngle(90);

    const path = d3.geoPath(projection);

    // Graticule (finer)
    const graticule = d3.geoGraticule().step([15, 15])();
    const graticuleEl = g
      .append('path')
      .datum(graticule)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(120,170,240,0.10)')
      .attr('stroke-width', 0.5)
      .attr('d', path as d3.ValueFn<SVGPathElement, unknown, string>);

    const landGroup = g.append('g').attr('class', 'land-group');
    const markerGroup = g.append('g').attr('class', 'marker-group');

    // Specular overlay (on top of everything for realism)
    g.append('circle')
      .attr('r', RADIUS)
      .attr('fill', 'url(#spec-grad)')
      .style('pointer-events', 'none');

    // Load world data + render real land
    const loadAndRender = async () => {
      try {
        // Fetch world atlas
        const world = await d3.json<{
          type: string;
          objects: Record<string, unknown>;
          arcs: unknown[];
        }>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

        if (!world) throw new Error('No world data');
        worldRef.current = world;

        // Wait briefly for topojson script to execute if just loaded
        let attempts = 0;
        while (!window.topojson && attempts < 20) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }

        if (window.topojson) {
          const land = window.topojson.feature(world, (world.objects as Record<string, unknown>).land);
          // Countries for coloring
          const countries = window.topojson.feature(world, (world.objects as Record<string, unknown>).countries);

          // Land base (green/brown earth tones)
          landGroup
            .append('path')
            .datum(land)
            .attr('fill', '#2d6b3a')
            .attr('d', path as d3.ValueFn<SVGPathElement, unknown, string>);

          // Country borders (subtle)
          if ((countries as { features?: unknown[] }).features) {
            landGroup
              .selectAll('.country')
              .data((countries as { features: GeoPermissibleObjects[] }).features)
              .enter()
              .append('path')
              .attr('class', 'country')
              .attr('fill', 'none')
              .attr('stroke', 'rgba(255,255,255,0.08)')
              .attr('stroke-width', 0.4)
              .attr('d', (d) => path(d) ?? '');
          }

          // Land highlight (lighter green on sunlit side)
          landGroup
            .append('path')
            .datum(land)
            .attr('fill', 'rgba(80,180,80,0.12)')
            .attr('d', path as d3.ValueFn<SVGPathElement, unknown, string>);
        } else {
          drawFallbackLand(landGroup, path);
        }
      } catch {
        drawFallbackLand(landGroup, path);
      }
    };

    loadAndRender();

    function drawFallbackLand(
      group: d3.Selection<SVGGElement, unknown, null, undefined>,
      pathGen: d3.GeoPath
    ) {
      const continents: GeoPermissibleObjects[] = [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-130,70],[-60,70],[-60,20],[-80,10],[-130,30],[-130,70]]] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-80,10],[-35,10],[-35,-55],[-70,-55],[-80,10]]] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0,70],[40,70],[40,35],[0,35],[0,70]]] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[0,35],[40,35],[50,-35],[-20,-35],[0,35]]] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[40,70],[145,70],[145,0],[60,0],[40,35],[40,70]]] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[110,-15],[155,-15],[155,-45],[110,-45],[110,-15]]] }, properties: {} },
      ] as GeoPermissibleObjects[];

      group.selectAll('path')
        .data(continents)
        .enter()
        .append('path')
        .attr('fill', '#2d6b28')
        .attr('stroke', '#3d8834')
        .attr('stroke-width', 0.4)
        .attr('d', (d) => pathGen(d) ?? '');
    }

    // Animation loop
    const currentRot = rotationRef.current;
    const target: [number, number, number] = [-targetLon, -targetLat, 0];

    let frame = 0;
    function animate() {
      const speed = 0.04;
      currentRot[0] += (target[0] - currentRot[0]) * speed;
      currentRot[1] += (target[1] - currentRot[1]) * speed;
      currentRot[2] += (target[2] - currentRot[2]) * speed;

      projection.rotate(currentRot);

      graticuleEl.attr('d', path(graticule) ?? '');
      landGroup.selectAll<SVGPathElement, GeoPermissibleObjects>('path').attr('d', (d) => path(d) ?? '');

      const markerCoords = projection([targetLon, targetLat]);
      markerGroup.selectAll('*').remove();

      if (markerCoords) {
        const pulse = Math.abs(Math.sin(frame * 0.05));

        markerGroup.append('circle')
          .attr('cx', markerCoords[0]).attr('cy', markerCoords[1])
          .attr('r', 12 + pulse * 10)
          .attr('fill', 'none')
          .attr('stroke', accentColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.35 * (1 - pulse));

        markerGroup.append('circle')
          .attr('cx', markerCoords[0]).attr('cy', markerCoords[1])
          .attr('r', 7 + pulse * 5)
          .attr('fill', 'none')
          .attr('stroke', accentColor)
          .attr('stroke-width', 1)
          .attr('opacity', 0.6 * (1 - pulse * 0.5));

        markerGroup.append('circle')
          .attr('cx', markerCoords[0]).attr('cy', markerCoords[1])
          .attr('r', 5)
          .attr('fill', accentColor)
          .attr('filter', 'url(#glow)');

        markerGroup.append('circle')
          .attr('cx', markerCoords[0]).attr('cy', markerCoords[1])
          .attr('r', 2.5)
          .attr('fill', '#fff');
      }

      frame++;
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [targetLat, targetLon, accentColor]);

  return (
    <svg ref={svgRef} width={SIZE} height={SIZE} style={{ overflow: 'visible' }} />
  );
};

// ─── Country Card ─────────────────────────────────────────────────────────────

interface CardProps {
  country: Country;
  isActive: boolean;
  isAdjacent: boolean;
  onClick: () => void;
}

const CountryCard: React.FC<CardProps> = ({ country, isActive, isAdjacent, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause video based on active state
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isActive) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div
      className={`${styles.card} ${isActive ? styles.cardActive : ''} ${isAdjacent ? styles.cardAdjacent : ''}`}
      onClick={onClick}
      style={{ '--accent': country.accentColor } as React.CSSProperties}
    >
      <div className={styles.cardImgWrap}>
        {country.videoSrc ? (
          <video
            ref={videoRef}
            src={country.videoSrc}
            className={styles.cardImg}
            muted
            loop
            playsInline
            poster={country.img}
          />
        ) : (
          <img src={country.img} alt={country.name} className={styles.cardImg} />
        )}
        <div className={styles.cardImgOverlay} />
        <div className={styles.cardBadge}>{country.flag}</div>
        {country.videoSrc && (
          <div className={styles.videoPill}>▶ Live</div>
        )}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{country.name}</div>
        <div className={styles.cardRegion}>
          {country.region === 'gcc' ? 'GCC & Middle East' : 'Europe & Emerging'}
        </div>
        <div className={styles.cardProps}>
          <span className={styles.cardDot} />
          {country.properties}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CountrySlider: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState<Region>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filtered: Country[] =
    activeRegion === 'all'
      ? ALL_COUNTRIES
      : ALL_COUNTRIES.filter((c) => c.region === activeRegion);

  const safeIndex = Math.min(currentIndex, filtered.length - 1);
  const active = filtered[safeIndex];

  // Scroll only within the track — NOT using scrollIntoView (which scrolls the page)
  const scrollTrackToIndex = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[idx] as HTMLElement;
    if (!card) return;
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offset = cardRect.left - trackRect.left + track.scrollLeft - trackRect.width / 2 + cardRect.width / 2;
    track.scrollTo({ left: offset, behavior: 'smooth' });
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const idx = ((i % filtered.length) + filtered.length) % filtered.length;
      setCurrentIndex(idx);
      scrollTrackToIndex(idx);
    },
    [filtered.length, scrollTrackToIndex]
  );

  // Auto-advance
  useEffect(() => {
    if (isPaused) return;
    autoTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % filtered.length;
        scrollTrackToIndex(next);
        return next;
      });
    }, 3800);
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [filtered.length, isPaused, scrollTrackToIndex]);

  // Region change → reset index only (no scroll side-effect)
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeRegion]);

  const regions: { id: Region; label: string }[] = [
    { id: 'all', label: 'All Regions' },
    { id: 'gcc', label: 'GCC & Middle East' },
    { id: 'europe', label: 'Europe & Emerging' },
  ];

  return (
    <section className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.eyebrow}>Global Workforce Network</span>
        <h2 className={styles.title}>
          Countries <span>We Serve</span>
        </h2>
        <p className={styles.subtitle}>
          Connecting employers with verified talent across {ALL_COUNTRIES.length} strategic markets worldwide.
        </p>
      </div>

      {/* Main content: Globe + Info */}
      <div className={styles.stage}>
        <div className={styles.globeWrap}>
          <Globe
            targetLat={active.lat}
            targetLon={active.lon}
            accentColor={active.accentColor}
          />
          <div className={styles.globeLabel} style={{ color: active.accentColor }}>
            {active.flag} {active.name}
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.infoFlag}>{active.flag}</div>
          <div className={styles.infoName}>{active.name}</div>
          <div className={styles.infoRegion}>
            {active.region === 'gcc' ? '📍 GCC & Middle East' : '📍 Europe & Emerging Markets'}
          </div>
          <div className={styles.infoProp} style={{ color: active.accentColor }}>
            {active.properties}
          </div>
          <a href="/jobs" className={styles.infoBtn} style={{ '--accent': active.accentColor } as React.CSSProperties}>
            Explore Opportunities →
          </a>

          <div className={styles.progressWrap}>
            {filtered.map((_, i) => (
              <button
                key={i}
                className={`${styles.progressDot} ${i === safeIndex ? styles.progressDotActive : ''}`}
                style={i === safeIndex ? { background: active.accentColor } : {}}
                onClick={() => { setIsPaused(true); goTo(i); }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Region filters */}
      <div className={styles.filters}>
        {regions.map((r) => (
          <button
            key={r.id}
            className={`${styles.pill} ${activeRegion === r.id ? styles.pillActive : ''}`}
            onClick={() => setActiveRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
        <span className={styles.filterCount}>{filtered.length} countries</span>
      </div>

      {/* Slider */}
      <div className={styles.sliderWrap}>
        <button
          className={styles.navBtn}
          onClick={() => { setIsPaused(true); goTo(safeIndex - 1); }}
          aria-label="Previous country"
        >
          ‹
        </button>

        <div
          className={styles.track}
          ref={trackRef}
          onTouchStart={() => setIsPaused(true)}
        >
          {filtered.map((country, i) => (
            <CountryCard
              key={country.name}
              country={country}
              isActive={i === safeIndex}
              isAdjacent={Math.abs(i - safeIndex) === 1}
              onClick={() => { setIsPaused(true); goTo(i); }}
            />
          ))}
        </div>

        <button
          className={styles.navBtn}
          onClick={() => { setIsPaused(true); goTo(safeIndex + 1); }}
          aria-label="Next country"
        >
          ›
        </button>
      </div>
    </section>
  );
};

export default CountrySlider;