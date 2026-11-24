import type { CSSProperties, ReactNode } from "react";
import { Interactive, useCurrentFrame, useVideoConfig } from "remotion";
import { reveal } from "../motion";
import { HookDiagram, SharedDiagram, VpsDiagram } from "./Diagram";
import captions from "./captions.json";

export type Tone = "mixed" | "amber" | "mint";

export const SceneBackdrop = ({ tone }: { tone: Tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bloom = {
    mixed: "#16434342",
    amber: "#7445313d",
    mint: "#145b5344",
  }[tone];
  return (
    <>
      <div
        className="reel-backdrop"
        style={{ "--bloom": bloom } as CSSProperties}
      />
      <div
        className="reel-grid"
        style={{
          backgroundPosition: `${(frame / fps) * 7}px ${(frame / fps) * 3}px`,
        }}
      />
      <div className="reel-vignette" />
    </>
  );
};

const SceneHeading = ({
  eyebrow,
  children,
  immediate = false,
}: {
  eyebrow: string;
  children: ReactNode;
  immediate?: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = reveal(frame, 0, 0.4 * fps);
  return (
    <div
      style={{
        opacity: immediate ? 1 : 0.65 + 0.35 * shown,
        translate: immediate ? undefined : `0 ${(1 - shown) * 22}px`,
      }}
    >
      <Interactive.Div name="Section label" className="reel-eyebrow">
        {eyebrow}
      </Interactive.Div>
      {children}
    </div>
  );
};

export const Hook = () => (
  <>
    <SceneHeading eyebrow="Web hosting" immediate>
      <Interactive.H1 name="Hook title" className="reel-title hook-title">
        Shared hosting
        <br />
        or <em>VPS?</em>
      </Interactive.H1>
      <Interactive.P name="Hook subtitle" className="reel-summary">
        Here’s what changes.
      </Interactive.P>
    </SceneHeading>
    <HookDiagram />
  </>
);

export const Shared = () => (
  <>
    <SceneHeading eyebrow="Shared hosting">
      <Interactive.H1 name="Shared hosting title" className="reel-title">
        Many sites.
        <br />
        <em>One server.</em>
      </Interactive.H1>
    </SceneHeading>
    <SharedDiagram />
  </>
);

export const Vps = () => (
  <>
    <SceneHeading eyebrow="Virtual private server">
      <Interactive.H1 name="VPS title" className="reel-title">
        One host.
        <br />
        <em>Isolated VMs.</em>
      </Interactive.H1>
    </SceneHeading>
    <VpsDiagram />
  </>
);

type Metric = "cost" | "control" | "resources" | "manage";

const icons: Record<Metric, ReactNode> = {
  cost: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  control: <path d="M6 3v18m6-18v18m6-18v18M3 8h6m0 8h6m0-10h6" />,
  resources: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 9h6v6H9zM9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3" />
    </>
  ),
  manage: <path d="M8 4H4v4m12-4h4v4m0 8v4h-4M4 16v4h4m0-8 3 3 5-6" />,
};

const ComparisonRow = ({
  metric,
  label,
  shared,
  vps,
  index,
}: {
  metric: Metric;
  label: string;
  shared: string;
  vps: string;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cue = captions.comparison[index];
  const currentTime = (frame / fps) * 1000;
  const entering = reveal(frame, index * 0.12 * fps, 0.52 * fps);
  const focusIn = reveal(currentTime, cue.startMs, 220);
  const focusOut =
    index === captions.comparison.length - 1
      ? 1
      : 1 - reveal(currentTime, captions.comparison[index + 1].startMs, 220);

  return (
    <div
      className="comparison-row"
      style={{
        opacity: 0.55 + entering * 0.45,
        translate: `0 ${24 * (1 - entering)}px`,
      }}
    >
      <div
        className="comparison-focus"
        style={{ opacity: focusIn * focusOut }}
      />
      <div className="comparison-metric">
        <svg
          aria-hidden="true"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icons[metric]}
        </svg>
        {label}
      </div>
      <div className="comparison-value">{shared}</div>
      <div className="comparison-value">{vps}</div>
    </div>
  );
};

export const Comparison = () => (
  <>
    <SceneHeading eyebrow="Shared vs. VPS">
      <Interactive.H1
        name="Comparison title"
        className="reel-title compare-title"
      >
        The trade-offs
      </Interactive.H1>
    </SceneHeading>
    <div className="comparison">
      <div className="comparison-head">
        <span />
        <span style={{ color: "var(--amber)" }}>SHARED</span>
        <span style={{ color: "var(--mint)" }}>VPS</span>
      </div>
      <ComparisonRow
        metric="cost"
        label="Cost"
        shared="Usually lower"
        vps="Usually higher"
        index={0}
      />
      <ComparisonRow
        metric="control"
        label="Control"
        shared="Limited settings"
        vps="More control"
        index={1}
      />
      <ComparisonRow
        metric="resources"
        label="Resources"
        shared="Shared pool"
        vps="VM allocation"
        index={2}
      />
      <ComparisonRow
        metric="manage"
        label="Ease"
        shared="Typically easier"
        vps="Varies by plan"
        index={3}
      />
      <Interactive.P name="Managed VPS note" className="comparison-note">
        Managed VPS can reduce server admin.
      </Interactive.P>
    </div>
  </>
);

const VerdictCard = ({
  vps = false,
  title,
  detail,
}: {
  vps?: boolean;
  title: string;
  detail: string;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = reveal(frame, fps * (vps ? 0.43 : 0.13), fps * 0.63);

  return (
    <div
      className={`verdict-card${vps ? " vps" : ""}`}
      style={{
        opacity: (vps ? 0.17 : 0.4) + (vps ? 0.83 : 0.6) * shown,
        translate: `${(1 - shown) * (vps ? 35 : -26)}px 0`,
      }}
    >
      <div className="verdict-icon">
        <svg
          aria-hidden="true"
          width="68"
          height="68"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="7" y="12" width="50" height="40" rx="6" />
          {vps ? (
            <path d="m18 26 8 7-8 7m15 0h13" />
          ) : (
            <path d="M7 24h50m-43-6h1m5 0h1m-6 15h16m-16 8h28" />
          )}
        </svg>
      </div>
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
};

export const Verdict = () => (
  <>
    <SceneHeading eyebrow="What to choose">
      <Interactive.H1 name="Decision title" className="reel-title">
        Which fits
        <br />
        <em>your site?</em>
      </Interactive.H1>
    </SceneHeading>
    <div className="verdict-list">
      <VerdictCard title="Shared hosting" detail="Blogs & small sites" />
      <VerdictCard
        title="VPS hosting"
        detail="Custom apps & growing workloads"
        vps
      />
    </div>
  </>
);
