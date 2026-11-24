import { useCurrentFrame, useVideoConfig } from "remotion";
import { reveal } from "../motion";

const amber = "#ffbf88";
const mint = "#8af4cc";

const Surface = () => (
  <>
    <rect
      className="diagram-frame"
      x="1"
      y="1"
      width="830"
      height="566"
      rx="31"
    />
    <rect x="2" y="2" width="828" height="565" rx="30" fill="url(#panelGrid)" />
    <path
      d="M30 53v-8q0-15 15-15h26 M802 53v-8q0-15-15-15h-26 M30 516v8q0 15 15 15h26 M802 516v8q0 15-15 15h-26"
      fill="none"
      stroke="#7793a4"
      strokeOpacity=".65"
      strokeWidth="2"
    />
  </>
);

const Definitions = () => (
  <defs>
    <pattern
      id="panelGrid"
      width="23"
      height="23"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="2" cy="2" r="1.1" fill="#9ab4c5" opacity=".15" />
    </pattern>
    <linearGradient id="machine" x2="0" y2="1">
      <stop stopColor="#26374a" />
      <stop offset="1" stopColor="#141d2d" />
    </linearGradient>
    <linearGradient id="sharedGlow" x2="0" y2="1">
      <stop stopColor="#b4693d" stopOpacity=".29" />
      <stop offset="1" stopColor="#482b31" stopOpacity=".52" />
    </linearGradient>
    <linearGradient id="vpsGlow" x2="0" y2="1">
      <stop stopColor="#4bbba5" stopOpacity=".27" />
      <stop offset="1" stopColor="#17342e" stopOpacity=".64" />
    </linearGradient>
    <radialGradient id="sharedHalo">
      <stop stopColor="#ef9a65" stopOpacity=".24" />
      <stop offset="1" stopColor="#ef9a65" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="vpsHalo">
      <stop stopColor="#50dcb1" stopOpacity=".22" />
      <stop offset="1" stopColor="#50dcb1" stopOpacity="0" />
    </radialGradient>
  </defs>
);

const Rack = ({
  x,
  y,
  width,
  color,
  bays = 3,
}: {
  x: number;
  y: number;
  width: number;
  color: string;
  bays?: number;
}) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d={`M0 13 22 0h${width - 1}v${bays * 43 + 4}l-21 13H8L0 ${bays * 43 + 17}Z`}
      fill="#344454"
      stroke="#617686"
      strokeWidth="1.5"
    />
    <rect
      y="13"
      width={width}
      height={bays * 43 + 11}
      rx="10"
      fill="url(#machine)"
      stroke={color}
      strokeOpacity=".58"
      strokeWidth="2"
    />
    {Array.from({ length: bays }, (_, index) => (
      <g key={index} transform={`translate(12, ${24 + index * 43})`}>
        <rect
          width={width - 24}
          height="32"
          rx="5"
          fill="#0c1220"
          stroke="#9db5bb"
          strokeOpacity=".2"
        />
        <circle cx="15" cy="16" r="4" fill={color} />
        <circle cx="30" cy="16" r="3.2" fill={color} opacity=".42" />
        <path
          d={`M${width - 103} 12h61 M${width - 103} 20h61`}
          stroke="#8196a6"
          strokeOpacity=".43"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </g>
    ))}
  </g>
);

const BrowserChip = ({ x, label }: { x: number; label: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = reveal(frame, fps * (0.22 + (x - 70) / 3300), fps * 0.46);

  return (
    <g opacity={enter} transform={`translate(${x}, ${96 - (1 - enter) * 14})`}>
      <rect
        width="193"
        height="84"
        rx="14"
        fill="url(#sharedGlow)"
        stroke={amber}
        strokeWidth="1.6"
        strokeOpacity=".74"
      />
      <path
        d="M16 21h161 M17 12h5m6 0h5m6 0h5"
        stroke={amber}
        strokeOpacity=".59"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text className="diagram-main-label" x="96.5" y="62" textAnchor="middle">
        {label}
      </text>
    </g>
  );
};

const SharedWiring = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = reveal(frame, 0.57 * fps, 0.62 * fps);
  const offset = [0, 0.29, 0.57];

  return (
    <g opacity={line}>
      <path
        d="M166.5 180v59h499v-59 M416 180v112"
        fill="none"
        stroke={amber}
        strokeWidth="3"
        strokeOpacity=".65"
        strokeLinejoin="round"
      />
      {[166.5, 416, 665.5].map((x, index) => {
        const phase = ((frame / fps) * 0.66 + offset[index]) % 1;
        const point =
          phase < 0.32
            ? [x, 180 + (59 * phase) / 0.32]
            : phase < 0.81
              ? [x + ((416 - x) * (phase - 0.32)) / 0.49, 239]
              : [416, 239 + (53 * (phase - 0.81)) / 0.19];

        return (
          <g key={x} opacity={Math.sin(Math.PI * phase)}>
            <circle
              cx={point[0]}
              cy={point[1]}
              r="14"
              fill={amber}
              opacity=".19"
            />
            <circle cx={point[0]} cy={point[1]} r="5.4" fill="#ffe7cc" />
          </g>
        );
      })}
      <circle cx="416" cy="239" r="8" fill={amber} />
    </g>
  );
};

export const SharedDiagram = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const revealRack = reveal(frame, 0.55 * fps, 0.66 * fps);
  return (
    <svg
      className="reel-chart"
      viewBox="0 0 832 568"
      aria-label="Three websites connect to one server and draw from the same resource pool"
    >
      <Definitions />
      <Surface />
      <ellipse cx="420" cy="338" rx="376" ry="207" fill="url(#sharedHalo)" />
      <BrowserChip x={70} label="Site A" />
      <BrowserChip x={319.5} label="Site B" />
      <BrowserChip x={569} label="Site C" />
      <SharedWiring />
      <g
        opacity={revealRack}
        transform={`translate(0, ${(1 - revealRack) * 18})`}
      >
        <Rack x={205} y={286} width={402} color={amber} />
        <text
          className="diagram-main-label"
          x="416"
          y="505"
          textAnchor="middle"
        >
          One resource pool
        </text>
      </g>
    </svg>
  );
};

const VirtualMachine = ({
  x,
  name,
  focus = false,
  delay,
}: {
  x: number;
  name: string;
  focus?: boolean;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const amount = reveal(frame, delay * fps, 0.56 * fps);
  const glow = (Math.sin((frame / fps) * 3.8) + 1) / 2;

  return (
    <g
      opacity={amount}
      transform={`translate(${x}, ${131 + (1 - amount) * 32})`}
    >
      {focus ? (
        <rect
          x="-7"
          y="-7"
          width="229"
          height="255"
          rx="20"
          fill={mint}
          opacity={0.042 + 0.04 * glow}
        />
      ) : null}
      <rect
        width="215"
        height="241"
        rx="15"
        fill={focus ? "url(#vpsGlow)" : "#172235"}
        stroke={focus ? mint : "#66838f"}
        strokeWidth={focus ? 2.4 : 1.7}
      />
      <path
        d="M13 65h189"
        stroke={focus ? mint : "#66838f"}
        strokeOpacity=".45"
      />
      <circle cx="21" cy="35" r="4.5" fill={focus ? mint : "#8ba9ad"} />
      <text
        x="107.5"
        y="49"
        textAnchor="middle"
        className="diagram-main-label"
        style={{ fill: focus ? mint : "#c4d1d9", fontSize: 37 }}
      >
        {name}
      </text>
      <rect x="12" y="88" width="191" height="53" rx="9" fill="#0d1621" />
      <text className="diagram-detail" x="107.5" y="123" textAnchor="middle">
        Own OS
      </text>
      <rect x="12" y="155" width="191" height="62" rx="9" fill="#0d1621" />
      <text className="diagram-detail" x="107.5" y="195" textAnchor="middle">
        CPU · RAM
      </text>
    </g>
  );
};

export const VpsDiagram = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = reveal(frame, 0.24 * fps, 0.49 * fps);
  const wire = reveal(frame, 0.75 * fps, 0.5 * fps);
  return (
    <svg
      className="reel-chart"
      viewBox="0 0 832 568"
      aria-label="The physical server contains three isolated virtual machines, each with its own operating system and resource allocation"
    >
      <Definitions />
      <Surface />
      <ellipse cx="416" cy="287" rx="380" ry="244" fill="url(#vpsHalo)" />
      <g opacity={shown}>
        <rect
          x="41"
          y="65"
          width="750"
          height="443"
          rx="21"
          fill="#13202b80"
          stroke="#70948e"
          strokeWidth="2"
          strokeDasharray="6 7"
        />
        <text className="diagram-label" x="65" y="109">
          PHYSICAL SERVER
        </text>
      </g>
      <g opacity={wire} stroke="#78ab9b" strokeWidth="2.5" fill="none">
        <path d="M174.5 371v37h483v-37 M416 371v37" />
        <circle cx="174.5" cy="408" r="4" fill="#78ab9b" />
        <circle cx="416" cy="408" r="5" fill={mint} />
        <circle cx="657.5" cy="408" r="4" fill="#78ab9b" />
      </g>
      <VirtualMachine x={67} name="VPS A" delay={0.38} />
      <VirtualMachine x={308.5} name="Your VPS" delay={0.57} focus />
      <VirtualMachine x={550} name="VPS C" delay={0.75} />
      <g opacity={wire}>
        <rect
          x="197"
          y="434"
          width="438"
          height="52"
          rx="12"
          fill="#0d191f"
          stroke="#4c746b"
        />
        <text className="diagram-detail" x="416" y="469" textAnchor="middle">
          Shared host hardware
        </text>
      </g>
    </svg>
  );
};

const HookMachine = ({ x, vps }: { x: number; vps?: boolean }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const amount = reveal(frame, vps ? 0.12 * fps : 0, 0.63 * fps);
  const color = vps ? mint : amber;
  const float = Math.sin((frame / fps) * 2.8 + (vps ? 0.75 : 0)) * 6;
  return (
    <g
      transform={`translate(${x}, ${90 + float + (1 - amount) * 20})`}
      opacity={0.72 + 0.28 * amount}
    >
      <path
        d="M3 185 155 137l148 48-152 49Z"
        fill={color}
        fillOpacity=".1"
        stroke={color}
        strokeOpacity=".47"
        strokeWidth="2"
      />
      <path
        d="M3 185v20l148 49 152-49v-20"
        fill="none"
        stroke={color}
        strokeOpacity=".39"
        strokeWidth="2"
      />
      {vps ? (
        <g>
          {[19, 100, 181].map((left, index) => (
            <g
              key={left}
              transform={`translate(${left}, ${index === 1 ? 4 : 35})`}
            >
              <path
                d="M0 14 21 1h62v120l-21 13H0Z"
                fill="#2f5b55"
                stroke="#8af4cc"
                strokeOpacity=".64"
                strokeWidth="1.5"
              />
              <rect
                x="0"
                y="14"
                width="62"
                height="120"
                rx="6"
                fill="#17312d"
                stroke={mint}
                strokeOpacity=".8"
              />
              <path
                d="M11 45h40m-40 13h40m-40 42h40"
                stroke={mint}
                strokeOpacity=".38"
                strokeWidth="2"
              />
              <circle cx="14" cy="28" r="4" fill={mint} />
            </g>
          ))}
        </g>
      ) : (
        <Rack x={38} y={12} width={215} color={amber} />
      )}
    </g>
  );
};

export const HookDiagram = () => (
  <svg
    className="reel-chart hook-chart"
    viewBox="0 0 832 478"
    aria-label="One common server on the left and isolated virtual machines on the right"
  >
    <Definitions />
    <rect
      className="diagram-frame"
      x="1"
      y="1"
      width="830"
      height="476"
      rx="31"
    />
    <rect x="2" y="2" width="828" height="473" rx="30" fill="url(#panelGrid)" />
    <ellipse cx="205" cy="225" rx="210" ry="181" fill="url(#sharedHalo)" />
    <ellipse cx="626" cy="229" rx="200" ry="180" fill="url(#vpsHalo)" />
    <path
      d="M416 32v414"
      stroke="#7793a4"
      strokeOpacity=".56"
      strokeDasharray="4 8"
    />
    <HookMachine x={55} />
    <HookMachine x={473} vps />
    <text
      className="diagram-label"
      x="207"
      y="412"
      textAnchor="middle"
      style={{ fill: amber, fontSize: 29 }}
    >
      SHARED POOL
    </text>
    <text
      className="diagram-label"
      x="625"
      y="412"
      textAnchor="middle"
      style={{ fill: mint, fontSize: 29 }}
    >
      ISOLATED VMS
    </text>
  </svg>
);
