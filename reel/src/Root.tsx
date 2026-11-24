import { Composition, Folder } from "remotion";
import { HostingExplained } from "./reels/hosting/HostingExplained";

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
  </Folder>
);
