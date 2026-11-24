import { Composition, Folder } from "remotion";
import { HostingExplained } from "./reels/hosting/HostingExplained";
import { HostingExplainedV2 } from "./reels/hosting-v2/HostingExplainedV2";
import type { Look } from "./production/types";
import production from "./reels/hosting-v2/production.json";
import timing from "./reels/hosting-v2/timing.json";

export const RemotionRoot = () => (
  <Folder name="Instagram-Reels">
    <Composition
      id="HostingExplained"
      component={HostingExplained}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ narrationVolume: 0.98, musicVolume: 0.2 }}
    />
    <Composition
      id="HostingExplainedV2"
      component={HostingExplainedV2}
      durationInFrames={timing.durationFrames}
      fps={timing.fps}
      width={1080}
      height={1920}
      defaultProps={{
        theme: production.theme as Look["theme"],
        cutStyle: production.cutStyle as Look["cutStyle"],
        captionStyle: production.captionStyle as Look["captionStyle"],
      }}
    />
  </Folder>
);
