# AI Reel Studio production instructions

Read the installed Remotion agent skills before touching a composition. Work
through creative direction → script → voice generation → storyboard → motion
design → audio mixing → quality review → final rendering. Keep a previous
approved or reviewed cut available as a separate composition.

1. **Creative direction.** Define the viewer, the question the Reel answers,
   and the action the viewer can take. Choose a single visual metaphor and
   check factual claims before using them.
2. **Script.** Write for the ear. Read each line aloud when audio playback is
   available. Start with a specific question, consequence, or surprise within
   three seconds. Write a closing prompt the viewer can answer about their own
   situation.
3. **Voice.** Audition the same excerpt with different local voices and native
   speeds. Log the model, version, voice, pronunciation corrections, and
   listening or measurement evidence. Use consented references for any cloned
   voice. Report model download failures and their hostnames. Preserve
   intentional rests and natural delivery when the cut needs more time.
4. **Storyboard and motion.** Measure the completed narration before assigning
   scene lengths. Give every scene a visual action that explains its idea.
   Use staging, camera movement, and animation to direct attention. Keep
   orientation between shots for a continuing metaphor. Give complex diagrams
   enough time to read at phone size.
5. **Audio.** Keep dialogue, music and effects isolatable. Expose playback
   drafts of the dry dialogue and the mixed track. Measure before processing.
   Compare source and processed stems at comparable loudness. Use restrained
   EQ and peak control only as needed. Duck the music through speech and leave
   room for meaningful effects. Check the encoded audio for peak headroom.
6. **Captions and review.** Derive caption times from the actual wav. Check
   proper names, acronyms, missing words and timing estimates. Use safe
   placement with short lines and check every supported style at motion speed
   or on representative frames. Inspect pictures across every scene and
   around cuts. Inspect at least one short motion preview. Report which
   observations came from machine checks and which received a listening pass.
7. **Delivery.** Render locally when possible and verify the delivered
   dimensions, frame count, rate, codecs, audio and duration with FFprobe.
   Save narration auditions and verification with the GitHub Actions render.
   Reuse the existing draft PR when applicable. Leave merging to the user.

Use local engines and original or licensed media. Follow the project-specific
settings and reproducibility notes in each Reel's production configuration.
