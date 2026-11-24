import type { ReactNode } from "react";
import { reveal } from "../motion";

const amber = "#ffbd8c";
const mint = "#87e6cb";
const steel = "#537088";
const pale = "#c5d3dc";

type Point = readonly [number, number];
const draw = (points: readonly Point[]) =>
  points.map(([x, y]) => `${x},${y}`).join(" ");

const Fig = ({ label, children }: { label: string; children: ReactNode }) => (
  <svg
    className="v2-figure"
    viewBox="0 0 830 690"
    role="img"
    aria-label={label}
  >
    {children}
  </svg>
);

const Track = ({
  points,
  color = steel,
  opacity = 0.8,
  dash,
}: {
  points: readonly Point[];
  color?: string;
  opacity?: number;
  dash?: string;
}) => (
  <polyline
    points={draw(points)}
    fill="none"
    stroke={color}
    strokeWidth="2.7"
    strokeOpacity={opacity}
    strokeDasharray={dash}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const Packet = ({
  points,
  phase,
  color,
  size = 7,
}: {
  points: readonly Point[];
  phase: number;
  color: string;
  size?: number;
}) => {
  const along = Math.max(0, Math.min(0.9999, phase)) * (points.length - 1);
  const index = Math.floor(along);
  const fraction = along - index;
  const [x, y] = points[index];
  const [nx, ny] = points[index + 1];
  return (
    <circle
      cx={x + (nx - x) * fraction}
      cy={y + (ny - y) * fraction}
      r={size}
      fill={color}
    />
  );
};

const Plinth = ({
  x,
  y,
  w,
  depth = 81,
  h = 32,
  fill = "#253c4c",
  face = "#1d3041",
  side = "#172638",
  edge = steel,
}: {
  x: number;
  y: number;
  w: number;
  depth?: number;
  h?: number;
  fill?: string;
  face?: string;
  side?: string;
  edge?: string;
}) => (
  <g
    transform={`translate(${x} ${y})`}
    stroke={edge}
    strokeWidth="2"
    strokeLinejoin="round"
  >
    <polygon
      points={`0,0 ${w},0 ${w + depth},${-depth * 0.46} ${depth},${-depth * 0.46}`}
      fill={fill}
    />
    <polygon points={`0,0 ${w},0 ${w},${h} 0,${h}`} fill={face} />
    <polygon
      points={`${w},0 ${w + depth},${-depth * 0.46} ${w + depth},${h - depth * 0.46} ${w},${h}`}
      fill={side}
    />
  </g>
);

const Building = ({
  time,
  opacity = 1,
}: {
  time: number;
  opacity?: number;
}) => (
  <g opacity={opacity}>
    <ellipse cx="435" cy="589" rx="301" ry="53" fill="#080f18" opacity=".74" />
    <g transform={`translate(${-Math.sin(time * 0.23) * 16} ${-time * 2})`}>
      <path
        d="M121 549 494 619 739 476 370 411Z"
        fill="#202d3b"
        stroke="#4b6879"
        strokeWidth="2"
      />
      <path
        d="M152 181 476 250V580L152 512Z"
        fill="#1c2e40"
        stroke="#506d82"
        strokeWidth="2.3"
      />
      <path
        d="M476 250 682 138V465L476 580Z"
        fill="#243a4d"
        stroke="#506d82"
        strokeWidth="2.3"
      />
      <path
        d="M152 181 359 68 682 138 476 250Z"
        fill="#314d60"
        stroke="#688597"
        strokeWidth="2.3"
      />
      <path
        d="M170 181 359 82 663 145 474 237Z"
        fill="#24394e"
        stroke="#6f8b99"
        strokeWidth="2"
      />
      <path
        d="M152 281 476 350 682 239 M152 389 476 458 682 346"
        stroke="#7590a6"
        strokeWidth="2"
        opacity=".44"
        fill="none"
      />
      {[0, 1, 2].map((floor) =>
        [0, 1, 2].map((bay) => {
          const x = 178 + bay * 94;
          const y = 214 + bay * 20 + floor * 99;
          const active = floor === 1 && bay === 1;
          const emphasis = active
            ? 0.28 + reveal(time, 1.05, 0.62) * 0.72
            : 0.74;
          return (
            <g
              key={floor * 3 + bay}
              transform={`translate(${x} ${y})`}
              opacity={emphasis}
            >
              <path
                d="M0 0 63 13 63 62 0 49Z"
                fill={active ? "#6f4f42" : "#111b28"}
                stroke={active ? amber : "#57798e"}
                strokeWidth={active ? 3 : 1.8}
              />
              <path
                d="M31 7V55M0 26 63 39"
                stroke={active ? amber : "#3f566b"}
                strokeWidth="1.5"
              />
            </g>
          );
        }),
      )}
      <path
        d="M507 266 648 189M507 314 648 235M507 374 648 296M507 423 648 345M507 482 648 406"
        stroke="#7192a1"
        strokeOpacity=".45"
        strokeWidth="2"
      />
      <path
        d="M565 276 624 244V282L565 315ZM565 382 624 350V388L565 421Z"
        fill="#172633"
        stroke="#5c8295"
        strokeWidth="2"
      />
      <path
        d="M319 132 367 106 440 120 393 146Z"
        fill="#526b79"
        stroke="#7797a5"
        strokeWidth="2"
      />
      <path
        d="M319 132V158L393 173V146"
        fill="#304554"
        stroke="#7797a5"
        strokeWidth="2"
      />
      <path
        d="M393 146 440 120V145L393 173"
        fill="#273d51"
        stroke="#7797a5"
        strokeWidth="2"
      />
    </g>
  </g>
);

const Marker = ({
  x,
  y,
  text,
  tint = pale,
  align = "start",
}: {
  x: number;
  y: number;
  text: string;
  tint?: string;
  align?: "start" | "middle" | "end";
}) => (
  <text x={x} y={y} className="v2-figure-label" textAnchor={align} fill={tint}>
    {text}
  </text>
);

export const HookArt = ({ time, cue }: { time: number; cue: number }) => {
  const callout = reveal(time, cue - 0.35, 0.53);
  return (
    <Fig label="Apartment building with one floor lighting up as the neighbors are introduced">
      <g opacity=".55">
        <Track
          points={[
            [31, 535],
            [368, 616],
            [773, 397],
          ]}
        />
        <Track
          points={[
            [59, 572],
            [369, 649],
            [801, 416],
          ]}
          opacity={0.5}
        />
      </g>
      <Building time={time} />
      <g opacity={callout}>
        <Track
          points={[
            [311, 362],
            [404, 389],
            [536, 327],
            [762, 327],
          ]}
          color={amber}
          opacity={0.85}
        />
        <circle cx="311" cy="362" r="8" fill={amber} />
        <Marker x={762} y={310} text="SHARED SPACE" tint={amber} align="end" />
      </g>
    </Fig>
  );
};

const incoming = [
  [
    [144, 194],
    [144, 268],
    [417, 340],
    [417, 440],
  ],
  [
    [409, 180],
    [409, 273],
    [417, 340],
    [417, 440],
  ],
  [
    [679, 192],
    [679, 268],
    [417, 340],
    [417, 440],
  ],
] as const;

const counter = (x: number, y: number) => (
  <g>
    <Plinth
      x={x}
      y={y}
      w={355}
      depth={101}
      h={68}
      fill="#624d45"
      face="#42373a"
      side="#30313b"
      edge="#b58b72"
    />
    <path
      d={`M${x + 18} ${y + 15}h320m-245 0v40m100-40v40m99-40v40`}
      stroke="#af8c76"
      strokeOpacity=".67"
      strokeWidth="2"
    />
    <rect x={x + 58} y={y + 26} width="24" height="3" rx="1.5" fill="#c7a284" />
    <rect
      x={x + 154}
      y={y + 26}
      width="24"
      height="3"
      rx="1.5"
      fill="#c7a284"
    />
    <rect
      x={x + 255}
      y={y + 26}
      width="24"
      height="3"
      rx="1.5"
      fill="#c7a284"
    />
    <path
      d={`M${x + 26} ${y - 8}h135l68-31h-132Z`}
      fill="#302e3a"
      stroke="#ab826d"
      strokeWidth="1.8"
    />
    {[x + 103, x + 166].map((cx) => (
      <ellipse
        key={cx}
        cx={cx}
        cy={y - 23}
        rx="21"
        ry="8"
        fill="none"
        stroke={amber}
        strokeWidth="2"
        opacity=".74"
      />
    ))}
    <path
      d={`M${x + 238} ${y - 8}h62l45-22h-65Z`}
      fill="#34424f"
      stroke="#9aa4ac"
      strokeWidth="2"
    />
  </g>
);

export const SharedArt = ({
  time,
  kitchen,
  rush,
}: {
  time: number;
  kitchen: number;
  rush: number;
}) => {
  const entry = reveal(time, 0, 0.85);
  const room = reveal(time, 0.27, 0.92);
  const building = 1 - reveal(time, 0.34, 0.85);
  const wiring = reveal(time, kitchen - 0.24, 0.8);
  const queue = reveal(time, rush - 0.1, 0.32);
  const ease = 1 - reveal(time, rush + 2.25, 0.8);
  const congested = queue * ease;
  return (
    <Fig label="Three websites send traffic into one kitchen. When traffic spikes, connections wait on a single common route.">
      <g
        transform={`translate(${-38 * (1 - building)} ${-36 * (1 - building)}) scale(${1 + 0.12 * (1 - building)})`}
      >
        <Building time={time + 3.07} opacity={building} />
      </g>
      <g
        transform={`translate(${18 * (1 - entry)} ${23 * (1 - entry)}) scale(${0.96 + 0.04 * entry})`}
      >
        <g opacity={room}>
          <path
            d="M73 450 428 595 789 409 419 283Z"
            fill="#1b2937"
            stroke="#4b6274"
            strokeWidth="2"
          />
          <path
            d="M73 450V478L428 625V595M428 625 789 439V409"
            fill="#16222e"
            stroke="#475d70"
            strokeWidth="2"
          />
          <path
            d="M73 450 74 305 419 171 419 283M419 171 789 293V409"
            fill="none"
            stroke="#486478"
            strokeWidth="2"
            strokeDasharray="6 9"
          />
          <path
            d="M136 478 501 311M227 513 590 341M315 550 685 372M367 302 732 442M273 337 634 490M171 375 522 546"
            stroke="#556d7e"
            strokeWidth="1.4"
            opacity=".29"
          />
          {counter(226, 476)}
          <Marker
            x={418}
            y={580}
            text="SHARED CPU / RAM"
            tint={amber}
            align="middle"
          />
        </g>
        <g opacity={wiring}>
          {[144, 409, 679].map((x, i) => (
            <g key={x}>
              <Plinth
                x={x - 66}
                y={152}
                w={122}
                depth={23}
                h={39}
                fill={i === 2 ? "#244a49" : "#324454"}
                face="#1d2d3c"
                side="#182735"
                edge={i === 2 ? mint : steel}
              />
              <circle
                cx={x - 49}
                cy="172"
                r="3.3"
                fill={i === 2 ? mint : amber}
              />
              <Marker
                x={x + 1}
                y={180}
                text={i === 2 ? "YOU" : `SITE ${i + 1}`}
                tint={i === 2 ? mint : pale}
                align="middle"
              />
            </g>
          ))}
          {incoming.map((points, index) => (
            <Track
              key={index}
              points={points}
              color={index === 2 ? mint : amber}
              opacity={0.52}
            />
          ))}
          {incoming.map((points, index) => (
            <Packet
              key={index}
              points={points}
              phase={
                index === 2 && congested > 0.45
                  ? 0.69 + 0.015 * Math.sin(time * 5)
                  : (time * 0.42 + index * 0.3) % 1
              }
              color={index === 2 ? mint : amber}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} opacity={congested}>
              <Packet
                points={incoming[0]}
                phase={(time * 0.89 + i * 0.17) % 1}
                color={amber}
                size={5.5}
              />
            </g>
          ))}
          <g opacity={congested}>
            <path
              d="M517 332 576 348h138"
              fill="none"
              stroke={mint}
              strokeWidth="2"
            />
            <Marker x={714} y={380} text="WAITING" tint={mint} align="end" />
          </g>
        </g>
      </g>
    </Fig>
  );
};

const Room = ({
  x,
  y,
  focus,
  lift,
}: {
  x: number;
  y: number;
  focus: boolean;
  lift: number;
}) => {
  const color = focus ? mint : "#68879b";
  return (
    <g transform={`translate(${x} ${y - lift})`}>
      <Plinth
        x={0}
        y={124}
        w={163}
        depth={53}
        h={25}
        fill={focus ? "#2e5f56" : "#294354"}
        face={focus ? "#244a45" : "#1c2c3b"}
        side="#192c38"
        edge={color}
      />
      <path
        d="M0 124V26L53 0v99M53 0h163v100"
        fill={focus ? "#2a5a4d" : "#263c4e"}
        fillOpacity=".78"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M53 43h163M68 15h96"
        fill="none"
        stroke={color}
        strokeOpacity=".5"
        strokeWidth="1.8"
      />
      <path
        d="M92 67 137 67 153 60h-45ZM92 67v45h45V67M137 112l16-7V60"
        fill="#162935"
        stroke={color}
        strokeWidth="2"
      />
      <path
        d="M100 77h28m-28 12h28m-28 12h28"
        fill="none"
        stroke={color}
        strokeOpacity=".67"
        strokeWidth="2"
      />
      <circle cx="105" cy="76" r="3.4" fill={color} />
      <path
        d="M181 11h19v19h-19Z"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
      />
    </g>
  );
};

export const VpsArt = ({
  time,
  unlock,
  resources,
}: {
  time: number;
  unlock: number;
  resources: number;
}) => {
  const raised = reveal(time, unlock - 0.27, 0.95);
  const settle =
    reveal(time, unlock + 0.07, 0.23) - reveal(time, unlock + 0.33, 0.35);
  const rail = reveal(time, resources - 0.12, 0.82);
  const scale = 0.93 + 0.07 * reveal(time, 0, 2.4);
  return (
    <Fig label="Three separated virtual apartments sit on one physical server. Your unit has its own operating system and resource allocation.">
      <g
        transform={`translate(${(1 - scale) * 415} ${(1 - scale) * 320}) scale(${scale})`}
      >
        <path
          d="M78 152v386h650V152l-71-50H151Z"
          fill="#162533"
          fillOpacity=".65"
          stroke="#557488"
          strokeWidth="2.5"
          strokeDasharray="7 10"
        />
        <Plinth
          x={102}
          y={507}
          w={533}
          depth={68}
          h={50}
          fill="#233746"
          face="#182939"
          side="#1c2a33"
        />
        <path
          d="M130 532h42m12 0h22m12 0h10m330 0h43"
          stroke="#7e9bac"
          strokeWidth="2.5"
          opacity=".66"
        />
        <Marker x={405} y={609} text="ONE PHYSICAL HOST" align="middle" />
        <g opacity={0.44 + 0.56 * rail}>
          <Track
            points={[
              [219, 338],
              [219, 469],
              [408, 488],
            ]}
            color={steel}
            dash="7 9"
          />
          <Track
            points={[
              [416, 315],
              [416, 488],
            ]}
            color={mint}
            opacity={0.7}
          />
          <Track
            points={[
              [613, 338],
              [613, 469],
              [422, 488],
            ]}
            color={steel}
            dash="7 9"
          />
          <Packet
            points={[
              [416, 488],
              [416, 423],
              [416, 315],
            ]}
            phase={(time * 0.47) % 1}
            color={mint}
            size={5.5}
          />
        </g>
        <Room x={103} y={231} lift={14 * raised} focus={false} />
        <Room x={303} y={206} lift={75 * raised + 10 * settle} focus />
        <Room x={503} y={231} lift={14 * raised} focus={false} />
        <g opacity={raised}>
          <Marker x={408} y={113} text="YOUR VPS" tint={mint} align="middle" />
          <Track
            points={[
              [408, 123],
              [408, 143 - raised * 14],
            ]}
            color={mint}
          />
        </g>
        <g opacity={rail}>
          <rect
            x="286"
            y="337"
            width="260"
            height="44"
            rx="10"
            fill="#152d2e"
            stroke="#5ca695"
            strokeWidth="1.6"
          />
          <Marker x={416} y={368} text="OWN OS" tint={mint} align="middle" />
          <rect
            x="220"
            y="394"
            width="392"
            height="46"
            rx="10"
            fill="#152d2e"
            stroke="#5ca695"
            strokeWidth="1.6"
          />
          <Marker
            x={416}
            y={425}
            text="CPU / RAM ALLOCATION"
            tint={mint}
            align="middle"
          />
        </g>
      </g>
    </Fig>
  );
};

const RouteIcon = ({
  x,
  y,
  type,
  color,
}: {
  x: number;
  y: number;
  type: "site" | "app";
  color: string;
}) => (
  <g
    transform={`translate(${x} ${y})`}
    fill="none"
    stroke={color}
    strokeWidth="3.1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="110" height="85" rx="10" fill="#172936" />
    {type === "site" ? (
      <path d="M0 25h110M13 12h5m7 0h5m-16 31h45m-45 15h65" />
    ) : (
      <path d="m22 27 16 15-16 15m31 0h32" />
    )}
  </g>
);

export const ChoiceArt = ({
  time,
  app,
  upkeep,
}: {
  time: number;
  app: number;
  upkeep: number;
}) => {
  const progress = reveal(time, app - 0.22, 0.8);
  const admin = reveal(time, upkeep - 0.12, 0.66);
  return (
    <Fig label="One decision branches towards a small site on shared hosting or a custom app on VPS hosting.">
      <path
        d="M112 310h154l104-162h367M266 310l104 165h367"
        fill="none"
        stroke="#526e82"
        strokeWidth="3"
      />
      <path
        d="M112 310h154l104-162h366"
        fill="none"
        stroke={amber}
        opacity={0.8 - 0.3 * progress}
        strokeWidth="4.4"
      />
      <path
        d="M266 310l104 165h367"
        fill="none"
        stroke={mint}
        strokeWidth="4.4"
        strokeOpacity={0.28 + 0.69 * progress}
      />
      <circle
        cx="112"
        cy="310"
        r="14"
        fill="#172936"
        stroke={pale}
        strokeWidth="3"
      />
      <circle cx="266" cy="310" r="10" fill={pale} />
      <Packet
        points={[
          [266, 310],
          [370, 148],
          [735, 148],
        ]}
        phase={(time * 0.37) % 1}
        color={amber}
        size={6}
      />
      <g opacity={0.5 + 0.5 * progress}>
        <Packet
          points={[
            [266, 310],
            [370, 475],
            [735, 475],
          ]}
          phase={(time * 0.39) % 1}
          color={mint}
          size={6}
        />
        <RouteIcon x={381} y={349} type="app" color={mint} />
        <Marker x={521} y={386} text="VPS" tint={mint} />
        <Marker x={521} y={431} text="CUSTOM APP" />
        <Marker x={376} y={535} text="MORE CONTROL" />
        <g opacity={admin}>
          <Marker x={376} y={584} text="UNMANAGED: MORE UPKEEP" />
        </g>
      </g>
      <RouteIcon x={381} y={22} type="site" color={amber} />
      <Marker x={521} y={59} text="SHARED" tint={amber} />
      <Marker x={521} y={104} text="BLOG OR SMALL SITE" />
      <Marker x={376} y={209} text="TYPICALLY LOWER COST" />
      <Marker x={376} y={255} text="LESS SETUP" />
    </Fig>
  );
};

export const CtaArt = ({ time, ask }: { time: number; ask: number }) => {
  const choose = reveal(time, ask, 1.05);
  return (
    <Fig label="A shared kitchen and a private apartment sit on two sides of the same platform.">
      <g transform={`translate(${9 * (1 - choose)} ${12 * (1 - choose)})`}>
        <Plinth x={72} y={477} w={660} depth={54} h={35} fill="#2d4253" />
        <path
          d="M417 482V145"
          stroke="#738998"
          strokeWidth="2"
          strokeDasharray="6 10"
        />
        <g transform="translate(50 192) scale(.64)">{counter(15, 280)}</g>
        <Room x={519} y={249} lift={27 * choose} focus />
        <Marker
          x={237}
          y={558}
          text="SHARED HOSTING"
          tint={amber}
          align="middle"
        />
        <Marker x={605} y={558} text="VPS HOSTING" tint={mint} align="middle" />
        <path d="M237 513v17m368-17v17" stroke="#7995a7" strokeWidth="2" />
      </g>
    </Fig>
  );
};
