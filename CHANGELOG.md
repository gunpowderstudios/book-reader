# Chapter & Verse — Version history

## v1.1.2 — 22 October 2026
- Prepare audio ahead of playback with a three-segment buffer to reduce gaps between passages.
- Increase narration segments to approximately 380 characters for fewer interruptions.
- Keep play/pause state while AI audio is generating and reuse the loaded voice model.
- Show more informative loading and buffering messages.

## v1.1.1 — 22 October 2026
- Fixed the Kokoro import to use its browser-specific bundle instead of a Node-compatible CDN build, addressing the unsupported `fs.readFile` error.
- Added a cache-busting version to the Kokoro script.

## v1.1.0 — 22 October 2026
- Added Kokoro AI narration using the British male voice George (`bm_george`).
- Kept browser voices as an alternative.
- Added a visible application version in the header.

## v1.0.0 — 22 October 2026
- Initial EPUB reader: load DRM-free EPUBs, select chapters, listen with browser voices, adjust speed and text size, and save reading position.

## Version numbering
- Patch (v1.1.3): bug fixes.
- Minor (v1.2.0): new features.
- Major (v2.0.0): substantial redesigns or breaking changes.

Update the header version and this changelog together on every release.
