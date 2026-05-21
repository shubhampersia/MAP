import { useRef, useState, useMemo, useEffect } from "react";
import { geoEqualEarth, geoPath, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import type { FeatureCollection, Geometry } from "geojson";

const WIDTH = 980;
const HEIGHT = 520;

const projection = geoEqualEarth()
  .scale(235)
  .translate([WIDTH / 2.1, HEIGHT / 1.7]);
const pathGen = geoPath(projection);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countries = feature(worldData as any, (worldData as any).objects.countries) as unknown as FeatureCollection<Geometry>;

type Office = {
  name: string;
  country: string;
  coords: [number, number]; // [lng, lat]
  type: "hq" | "office" | "partner";
  unit: string;
  team: number;
  since: number;
  focus: string[];
};

const OFFICES: Office[] = [
  {
    name: "Ohio",
    country: "United States of America",
    coords: [-82.9988, 40.4173],
    type: "office",
    unit: "Manufacturing",
    team: 40,
    since: 2018,
    focus: ["Production"],
  },

  {
    name: "Arkansas",
    country: "United States of America",
    coords: [-92.3731, 34.7465],
    type: "office",
    unit: "Operations",
    team: 28,
    since: 2019,
    focus: ["Supply Chain"],
  },

  {
    name: "Stevensville",
    country: "United States of America",
    coords: [-79.8170, 39.3187],
    type: "hq",
    unit: "HQ",
    team: 120,
    since: 2014,
    focus: ["Leadership", "Engineering"],
  },

  {
    name: "North Carolina",
    country: "United States of America",
    coords: [-79.0193, 35.7596],
    type: "office",
    unit: "Distribution",
    team: 35,
    since: 2020,
    focus: ["Logistics"],
  },

  {
    name: "Pune",
    country: "India",
    coords: [73.8567, 18.5204],
    type: "office",
    unit: "India Operations",
    team: 85,
    since: 2017,
    focus: ["Engineering", "QA"],
  },

  {
    name: "South India",
    country: "India",
    coords: [77.5946, 12.9716],
    type: "partner",
    unit: "South Operations",
    team: 50,
    since: 2021,
    focus: ["Support"],
  },

  {
    name: "North China",
    country: "China",
    coords: [116.4074, 39.9042],
    type: "office",
    unit: "North China Manufacturing",
    team: 60,
    since: 2016,
    focus: ["Manufacturing"],
  },

  {
    name: "South China",
    country: "China",
    coords: [113.2644, 23.1291],
    type: "partner",
    unit: "South China Supply",
    team: 48,
    since: 2018,
    focus: ["Production"],
  },

  {
    name: "Vietnam",
    country: "Vietnam",
    coords: [105.8342, 21.0278],
    type: "office",
    unit: "Vietnam Operations",
    team: 42,
    since: 2019,
    focus: ["Assembly"],
  },

  {
    name: "Malaysia",
    country: "Malaysia",
    coords: [101.6869, 3.139],
    type: "office",
    unit: "Malaysia Operations",
    team: 30,
    since: 2020,
    focus: ["Logistics"],
  },

  {
    name: "South Korea",
    country: "South Korea",
    coords: [126.978, 37.5665],
    type: "office",
    unit: "Korea Office",
    team: 38,
    since: 2018,
    focus: ["Electronics"],
  },
];

const TYPE_LABEL: Record<Office["type"], string> = {
  hq: "Headquarters",
  office: "Regional Office",
  partner: "Partner",
};

// Build curved great-circle-ish arcs between two [lng,lat] points
function buildArcPath(from: [number, number], to: [number, number]): string {
  const interp = geoInterpolate(from, to);
  const steps = 40;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const p = projection(interp(i / steps));
    if (!p) return "";
    pts.push(p as [number, number]);
  }
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`)
    .join(" ");
}

function MapContent({
  hoveredOffice,
  onHoverOffice,
  activeOffice,
  hoveredCountry,
  onHoverCountry,
}: {
  hoveredOffice: string | null;
  onHoverOffice: (n: string | null) => void;
  activeOffice: string | null;
  hoveredCountry: string | null;
  onHoverCountry: (n: string | null) => void;
}) {
  const hq = OFFICES.find((o) => o.type === "hq")!;
  const officeCountries = useMemo(
    () => new Set(OFFICES.map((o) => o.country)),
    []
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--map-accent)" stopOpacity="0.05" />
          <stop offset="50%" stopColor="var(--map-accent)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--map-accent)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--map-ocean)" />
      <g>
        {countries.features.map((f, i) => {
          const d = pathGen(f);
          if (!d) return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const name = (f as any).properties?.name as string | undefined;
          const hasOffice = name && officeCountries.has(name);
          const isHover = name && hoveredCountry === name;
          return (
            <path
              key={i}
              d={d}
              fill={
                isHover
                  ? "color-mix(in oklab, var(--map-accent) 28%, var(--map-land))"
                  : hasOffice
                    ? "color-mix(in oklab, var(--map-accent) 10%, var(--map-land))"
                    : "var(--map-land)"
              }
              stroke="var(--map-stroke)"
              strokeWidth={isHover ? 0.9 : 0.5}
              onMouseEnter={() => name && onHoverCountry(name)}
              onMouseLeave={() => onHoverCountry(null)}
              style={{ cursor: hasOffice ? "pointer" : "default", transition: "fill 200ms" }}
            />
          );
        })}
      </g>

      {/* Network arcs from HQ to each office */}
      <g style={{ pointerEvents: "none" }}>
        {OFFICES.filter((o) => o.name !== hq.name).map((o, i) => {
          const d = buildArcPath(hq.coords, o.coords);
          if (!d) return null;
          const isActive = activeOffice === o.name || hoveredOffice === o.name;
          return (
            <g key={o.name}>
              <path
                d={d}
                fill="none"
                stroke="url(#arc-grad)"
                strokeWidth={isActive ? 1.6 : 0.7}
                opacity={isActive ? 1 : 0.35}
                strokeLinecap="round"
                style={{ transition: "stroke-width 250ms, opacity 250ms" }}
              />
              {/* Traveling pulse along the arc */}
              <circle r={isActive ? 3 : 1.8} fill={
  o.type === "partner" || o.name === "Stevensville"
    ? "#4DA3FF"
    : "#FFC107"
} opacity={isActive ? 1 : 0.7}>
                <animateMotion
                  dur={`${4 + (i % 5) * 0.6}s`}
                  repeatCount="indefinite"
                  path={d}
                  rotate="auto"
                  begin={`${(i * 0.3).toFixed(2)}s`}
                />
              </circle>
            </g>
          );
        })}
      </g>

      {OFFICES.map((o) => {
        const pt = projection(o.coords);
        if (!pt) return null;
        const [x, y] = pt;
        const isHQ = o.type === "hq";
        const isHover = hoveredOffice === o.name || activeOffice === o.name;
        const r = isHQ ? 5 : 3.5;
        return (
          <g
            key={o.name}
            transform={`translate(${x},${y})`}
            onMouseEnter={() => onHoverOffice(o.name)}
            onMouseLeave={() => onHoverOffice(null)}
            style={{ cursor: "pointer" }}
          >
<circle
  r={r + (isHover ? 10 : 6)}
fill={
  o.type === "partner" || o.name === "Stevensville"
    ? "#4DA3FF"
    : "#FFC107"
}
            >
              <animate
                attributeName="r"
                values={`${r + 4};${r + 10};${r + 4}`}
                dur="2.4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.55;0.05;0.55"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </circle>
<circle
  r={isHover ? r + 1.2 : r}
   fill={
    o.type === "partner" || o.name === "Stevensville"
      ? "#4DA3FF"
      : "#FFC107"
  }
              stroke="white"
              strokeWidth={isHQ ? 1.4 : 0.9}
              style={{ transition: "r 200ms" }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function WorldPresenceMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredOffice, setHoveredOffice] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Auto-cycle spotlight through offices

  const activeOffice = hoveredOffice;

  const stats = useMemo(
    () => ({
      countries: new Set(OFFICES.map((o) => o.country)).size,
      cities: OFFICES.length,
      hqs: OFFICES.filter((o) => o.type === "hq").length,
    }),
    []
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--map-accent)]">
            Global presence
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Operating across {stats.countries} countries
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            MMI operates a fully integrated production network across the US, India, China, Vietnam and South Korea, utilizing each region’s specialized capabilities.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Stat label="Cities" value={stats.cities} />
          <Stat label="Countries" value={stats.countries} />
          <Stat label="HQs" value={stats.hqs} />
        </div>
      </div>

<div
  ref={containerRef}
  onMouseLeave={() => {
    setHoveredCountry(null);
    setHoveredOffice(null);
  }}
  className="relative overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--map-bg)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
>
        <MapContent
          hoveredOffice={hoveredOffice}
          onHoverOffice={setHoveredOffice}
          activeOffice={activeOffice}
          hoveredCountry={hoveredCountry}
          onHoverCountry={setHoveredCountry}
        />

        <OfficeCard
          office={OFFICES.find((o) => o.name === activeOffice) ?? null}
          containerRef={containerRef}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <LegendDot label="Headquarters" big />
        <LegendDot label="Office" />
        <LegendDot label="Partner" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function LegendDot({ label, big }: { label: string; big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block rounded-full bg-[color:var(--map-accent)]"
        style={{
          width: big ? 10 : 7,
          height: big ? 10 : 7,
          boxShadow: "0 0 10px var(--map-accent-glow)",
        }}
      />
      {label}
    </div>
  );
}

function OfficeCard({
  office,
  containerRef,
}: {
  office: Office | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!office) return null;
  const rect = containerRef.current?.getBoundingClientRect();
  const cw = rect?.width ?? WIDTH;
  const ch = rect?.height ?? HEIGHT;
  const pt = projection(office.coords);
  if (!pt) return null;
  const [mx, my] = pt;
  // Map SVG coords (WIDTH x HEIGHT) to container pixels (preserveAspectRatio: meet)
  const scale = Math.min(cw / WIDTH, ch / HEIGHT);
  const offsetX = (cw - WIDTH * scale) / 2;
  const offsetY = (ch - HEIGHT * scale) / 2;
  const x = offsetX + mx * scale;
  const y = offsetY + my * scale;

  const CARD_W = 240;
  // Flip horizontally / vertically to stay inside the container
  const placeRight = x + CARD_W + 24 < cw;
  const left = placeRight ? x + 16 : x - CARD_W - 16;
  const placeBelow = y < ch / 2;
  const top = placeBelow ? y + 16 : y - 16;
  const translateY = placeBelow ? "0%" : "-100%";

  return (
    <div
      className="pointer-events-none absolute z-10 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left,
        top,
        width: CARD_W,
        transform: `translateY(${translateY})`,
      }}
    >
      <div
        className="rounded-xl border border-white/15 bg-black/75 p-4 text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] backdrop-blur-md"
        style={{ boxShadow: "0 0 0 1px var(--map-accent-glow), 0 20px 50px -15px rgba(0,0,0,0.8)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: "var(--map-accent)",
              background: "color-mix(in oklab, var(--map-accent) 15%, transparent)",
              border: "1px solid color-mix(in oklab, var(--map-accent) 40%, transparent)",
            }}
          >
            {TYPE_LABEL[office.type]}
          </span>
          <span className="text-[10px] text-white/50">Est. {office.since}</span>
        </div>

        <div className="mt-3">
          <div className="text-base font-semibold leading-tight">{office.name}</div>
          <div className="text-xs text-white/60">{office.country}</div>
        </div>

        <div className="mt-3 text-sm text-white/90">{office.unit}</div>

        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Team</div>
            <div className="text-sm font-semibold tabular-nums">{office.team}</div>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {office.focus.map((f) => (
              <span
                key={f}
                className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/80"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}