import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Interactive,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "../../production/Captions";
import type { Beat, CutStyle, Look, SceneTiming } from "../../production/types";
import { reveal } from "../motion";
import { ChoiceArt, CtaArt, HookArt, SharedArt, VpsArt } from "./Illustrations";
import production from "./production.json";
import timing from "./timing.json";
import "./hosting-v2.css";

const [hook, shared, vps, choice, cta] = timing.scenes;

const cueTime = (scene: SceneTiming, beat: Beat, fps: number) =>
  (beat.effectMs ?? beat.startMs) / 1000 - scene.from / fps;

const Heading = ({
  kicker,
  children,
  detail,
}: {
  kicker: string;
  children: ReactNode;
  detail?: string;
}) => (
  <div className="v2-safe">
    <Interactive.Div name="Section label" className="v2-kicker">
      {kicker}
    </Interactive.Div>
    <Interactive.H1 name="Scene headline" className="v2-heading">
      {children}
    </Interactive.H1>
    {detail ? (
      <Interactive.P name="Supporting detail" className="v2-deck">
        {detail}
      </Interactive.P>
    ) : null}
  </div>
);

const Figure = ({ children }: { children: ReactNode }) => (
  <div className="v2-figure-wrap">{children}</div>
);

const useSceneTime = () => useCurrentFrame() / useVideoConfig().fps;

const Hook = () => {
  const time = useSceneTime();
  const cue =
    (hook.beats[0].captions
      .flatMap(({ words }) => words)
      .find(({ text }) => text.trim() === "Neighbors.")?.startMs ?? 1750) /
    1000;
  const answer = reveal(time, cue - 0.14, 0.35);
  return (
    <>
      <div className="v2-hook">
        <Heading kicker="Web hosting">
          Cheap hosting
          <br />
          has a catch.
          <br />
          <em
            className="v2-hook-answer"
            style={{
              clipPath: `inset(0 ${(1 - answer) * 100}% 0 0)`,
              translate: `${(1 - answer) * -15}px 0`,
            }}
          >
            Neighbors.
          </em>
        </Heading>
      </div>
      <Figure>
        <HookArt time={time} cue={cue} />
      </Figure>
    </>
  );
};

const Shared = () => {
  const time = useSceneTime();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading
        kicker="Shared hosting"
        detail="Many sites draw from the same pool."
      >
        One <em>kitchen.</em>
      </Heading>
      <Figure>
        <SharedArt
          time={time}
          kitchen={cueTime(shared, shared.beats[1], fps)}
          rush={cueTime(shared, shared.beats[2], fps)}
        />
      </Figure>
    </>
  );
};

const Vps = () => {
  const time = useSceneTime();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading
        kicker="Virtual private server"
        detail="Isolation on shared physical hardware."
      >
        Your own <em>unit.</em>
      </Heading>
      <Figure>
        <VpsArt
          time={time}
          unlock={cueTime(vps, vps.beats[0], fps)}
          resources={cueTime(vps, vps.beats[1], fps)}
        />
      </Figure>
    </>
  );
};

const Choice = () => {
  const time = useSceneTime();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading kicker="Choosing a plan">What I’d pick.</Heading>
      <Figure>
        <ChoiceArt
          time={time}
          app={cueTime(choice, choice.beats[1], fps)}
          upkeep={cueTime(choice, choice.beats[2], fps)}
        />
      </Figure>
    </>
  );
};

const Cta = () => {
  const time = useSceneTime();
  const { fps } = useVideoConfig();
  return (
    <>
      <Heading kicker="Your next project">
        Which would
        <br />
        <em>you choose?</em>
      </Heading>
      <Figure>
        <CtaArt time={time} ask={cueTime(cta, cta.beats[1], fps)} />
      </Figure>
    </>
  );
};

const Scene = ({
  scene,
  captionStyle,
  children,
}: {
  scene: SceneTiming;
  captionStyle: Look["captionStyle"];
  children: ReactNode;
}) => (
  <div className="v2-scene" data-scene={scene.id}>
    <div className="v2-backdrop" />
    <div className="v2-blueprint" />
    {children}
    <div className="v2-rule">
      <i />
    </div>
    <Captions
      sceneFrom={scene.from}
      style={captionStyle}
      pages={scene.beats.flatMap((beat) => beat.captions)}
    />
  </div>
);

const TransitionVeil = ({
  style,
  frames,
}: {
  style: CutStyle;
  frames: number;
}) => {
  const frame = useCurrentFrame();
  const phase = frame / Math.max(1, frames - 1);
  const amount = Math.sin(Math.PI * phase) ** 2;
  const travel = 115 * phase - 19;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundColor: "var(--bg)",
        opacity: amount * (style === "fade" ? 0.42 : 0.28),
        clipPath:
          style === "fade"
            ? undefined
            : `polygon(${travel - 26}% 0, ${travel + 38}% 0, ${travel + 13}% 100%, ${travel - 50}% 100%)`,
      }}
    />
  );
};

export const HostingExplainedV2 = ({ theme, captionStyle, cutStyle }: Look) => {
  const { fps } = useVideoConfig();
  const frames = Math.round(fps * 0.37);
  return (
    <AbsoluteFill className="production" data-theme={theme}>
      <TransitionSeries>
        <TransitionSeries.Sequence
          name="Hook · The neighbors"
          durationInFrames={hook.duration}
        >
          <Scene scene={hook} captionStyle={captionStyle}>
            <Hook />
          </Scene>
        </TransitionSeries.Sequence>
        {cutStyle === "cut" ? null : (
          <TransitionSeries.Overlay durationInFrames={frames}>
            <TransitionVeil style={cutStyle} frames={frames} />
          </TransitionSeries.Overlay>
        )}
        <TransitionSeries.Sequence
          name="Shared hosting · One kitchen"
          durationInFrames={shared.duration}
        >
          <Scene scene={shared} captionStyle={captionStyle}>
            <Shared />
          </Scene>
        </TransitionSeries.Sequence>
        {cutStyle === "cut" ? null : (
          <TransitionSeries.Overlay durationInFrames={frames}>
            <TransitionVeil style={cutStyle} frames={frames} />
          </TransitionSeries.Overlay>
        )}
        <TransitionSeries.Sequence
          name="VPS · Isolate the units"
          durationInFrames={vps.duration}
        >
          <Scene scene={vps} captionStyle={captionStyle}>
            <Vps />
          </Scene>
        </TransitionSeries.Sequence>
        {cutStyle === "cut" ? null : (
          <TransitionSeries.Overlay durationInFrames={frames}>
            <TransitionVeil style={cutStyle} frames={frames} />
          </TransitionSeries.Overlay>
        )}
        <TransitionSeries.Sequence
          name="Comparison · Follow the routes"
          durationInFrames={choice.duration}
        >
          <Scene scene={choice} captionStyle={captionStyle}>
            <Choice />
          </Scene>
        </TransitionSeries.Sequence>
        {cutStyle === "cut" ? null : (
          <TransitionSeries.Overlay durationInFrames={frames}>
            <TransitionVeil style={cutStyle} frames={frames} />
          </TransitionSeries.Overlay>
        )}
        <TransitionSeries.Sequence
          name="CTA · Choose your setup"
          durationInFrames={cta.duration}
        >
          <Scene scene={cta} captionStyle={captionStyle}>
            <Cta />
          </Scene>
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Audio
        name="Dialogue, ducked music and effects"
        src={staticFile(`${production.assetPath}/mix.wav`)}
      />
    </AbsoluteFill>
  );
};
