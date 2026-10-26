# E.D.D.i. 13.0 — packaged audiobook experiment

Status: **design / implementation branch**. Not yet a working offline audiobook player.

## Isolation
- This experiment lives only on `eddi-v13-experiment`.
- Do not merge into `main` or change the existing GitHub Pages deployment without explicit approval.
- The current v1.12.x app remains available as the fallback.

## Product direction
Separate speech synthesis from playback:
1. Reader opens a DRM-free EPUB.
2. Reader selects Lewis (`bm_lewis`) or Emma (`bf_emma`) initially.
3. On a capable device, the Kokoro model synthesizes chapter audio **ahead of time**.
4. Export one portable `.eddi` archive containing EPUB text, metadata, audio, and text/audio mapping.
5. Lightweight playback opens the package, plays saved audio, and remembers position with no inference and no network.

## File format proposal (v1)
An `.eddi` file is a ZIP archive containing:
- `manifest.json` (`format: "eddi-audiobook"`, `formatVersion: 1`, `title`, `author`, `voice`, `chapters`, `audioCodec`)
- `book.epub` (original DRM-free EPUB; preserve text, formatting and covers)
- `audio/<chapter>/<segment>.<ext>` (pre-rendered compressed audio)
- `segments.json` (segment audio paths, text fingerprints and chapter/paragraph identifiers; never assume plain paragraphs correspond 1:1 to generated clips)
- optional `cover.*`

Audio should be encoded in a browser-compatible format; test AAC/MP3 fallback across Safari and Chrome, optionally Opus when supported. Do not claim fully offline support until the player, ZIP library, book, audio, and all required resources load in airplane mode.

## Safety and performance
- Export **one chapter first** to prove timing, codec, manifest and memory behaviour.
- Use streaming/segmented exports for whole books; avoid accumulating hours of PCM audio in RAM.
- Keep saved reading position outside the immutable archive, keyed by package ID.
- The audiobook player must NOT download the AI model.
- Keep voice preview and other narrators in the creator interface; no second Kokoro model download per voice.
- On older hardware, audiobook creation may take a long time; playback should remain lightweight.
- Warn that copyright and DRM restrictions still apply.
- Never silently delete the original EPUB or saved audio.

## Acceptance tests
- Generate a short chapter using Lewis, export and reopen `.eddi`.
- Audio survives closing/reopening browser and transfers to another device.
- Flight-mode playback after preparing offline app resources; tested on desktop and iOS Safari.
- Chapters, progress, seek, audio continuity, and reading text align.
- The original `main` branch and deployed site are unaffected.
