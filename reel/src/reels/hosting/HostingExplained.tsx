import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionLine } from "../CaptionLine";
import {
  Comparison,
  Hook,
  SceneBackdrop,
  type Tone,
  Shared,
  Verdict,
  Vps,
} from "./Scenes";
import captions from "./captions.json";
import narration from "./narration-script.json";
import "./reel.css";

type SceneId = keyof typeof captions;
type ReelProps = { narrationVolume: number; musicVolume: number };

const [, shared, vps, comparison, verdict] = narration;

const Scene = ({
  id,
  tone = "mint",
  narrationVolume,
  children,
}: {
  id: SceneId;
  tone?: Tone;
  narrationVolume: number;
  children: ReactNode;
}) => (
  <>
    <div
      className="reel-scene"
      style={
        {
          "--accent": tone === "amber" ? "var(--amber)" : "var(--mint)",
        } as CSSProperties
      }
    >
      <SceneBackdrop tone={tone} />
      <div className="reel-safe">{children}</div>
      <CaptionLine captions={captions[id]} />
    </div>
    <Audio
      name="Narration"
      src={staticFile(`hosting/${id}.mp3`)}
      volume={narrationVolume}
    />
  </>
);

const CutSweep = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const phase = frame / (durationInFrames - 1);
  const opacity = 0.38 * Math.sin(Math.PI * phase) ** 2;
  return (
    <AbsoluteFill
      style={{
        zIndex: 2,
        pointerEvents: "none",
        opacity,
        background: `linear-gradient(111deg, transparent ${phase * 137 - 20}%, #a1f6e2b0 ${phase * 137 - 4}%, transparent ${phase * 137 + 22}%)`,
      }}
    />
  );
};

const ReelProgress = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  return (
    <div className="reel-progress" aria-hidden="true">
      {narration.map(({ id, duration }, index) => {
        const start = narration
          .slice(0, index)
          .reduce((total, scene) => total + scene.duration, 0);
        const progress = interpolate(
          currentTime,
          [start, start + duration],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        );
        return (
          <div key={id}>
            <i style={{ scale: `${progress} 1` }} />
          </div>
        );
      })}
    </div>
  );
};

export const HostingExplained = ({
  narrationVolume,
  musicVolume,
}: ReelProps) => {
  const { fps } = useVideoConfig();
  const cut = Math.round(0.4 * fps);
  return (
    <AbsoluteFill className="reel">
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Hook"
          durationInFrames={narration[0].duration * fps}
        >
          <Scene id="hook" tone="mixed" narrationVolume={narrationVolume}>
            <Hook />
          </Scene>
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={cut}>
          <CutSweep />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence
          name="Shared hosting"
          durationInFrames={shared.duration * fps}
        >
          <Scene id="shared" tone="amber" narrationVolume={narrationVolume}>
            <Shared />
          </Scene>
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={cut}>
          <CutSweep />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence
          name="Virtual private server"
          durationInFrames={vps.duration * fps}
        >
          <Scene id="vps" narrationVolume={narrationVolume}>
            <Vps />
          </Scene>
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={cut}>
          <CutSweep />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence
          name="Compare plans"
          durationInFrames={comparison.duration * fps}
        >
          <Scene id="comparison" narrationVolume={narrationVolume}>
            <Comparison />
          </Scene>
        </TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={cut}>
          <CutSweep />
        </TransitionSeries.Overlay>
        <TransitionSeries.Sequence
          name="Choose a plan"
          durationInFrames={verdict.duration * fps}
        >
          <Scene id="verdict" narrationVolume={narrationVolume}>
            <Verdict />
          </Scene>
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <ReelProgress />
      <Audio
        name="Original music bed"
        src={staticFile("hosting/music.mp3")}
        volume={musicVolume}
      />
    </AbsoluteFill>
  );
};
