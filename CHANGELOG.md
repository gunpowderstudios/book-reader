# Chapter & Verse — Version history

## v1.2.3 — 22 October 2026
**Fixes the long pauses between passages in the book reader.** There were three causes:
- **No lookahead.** Each passage was only generated after the previous one finished playing, so every boundary was a full generation wait. Now the next three passages generate in the background while the current one plays (one at a time, in order, off the main thread). Passages already generated, for example after seeking back, are reused from the cache.
- **Mid-sentence cuts.** Text was cut every 190 characters on word boundaries. Passages now end at sentence ends (up to 230 characters; abbreviations such as "Mr." are respected), and only very long sentences are split, at commas first. The first passage of a session is shorter (up to 140 characters) so reading starts sooner.
- **Silent padding.** Kokoro adds silence to the start and end of every clip. It is now trimmed, leaving about 20 ms at the start and 40 ms at the end.
- If George generates more slowly than the audio plays, the status line says "George is catching up…" and reports this device's speed (for example "0.6× real time"). Lookahead cannot hide pauses when generation is slower than speech, so the message suggests lowering the Speed slider.
- Reading position and bookmarks now move to the passage being read; resuming starts at the saved paragraph.

## v1.2.2 — 22 October 2026
**Root cause of the freezing and slow Test a Voice:** Kokoro's phonemiser and ONNX inference were running on the page's own thread. The model runs single-threaded WebAssembly (GitHub Pages cannot send the headers needed for multi-threading), so every generation froze the whole page, including the Stop button and status text.

- Kokoro now runs in a Web Worker (`kokoro-worker.js`). Model download, phonemising and inference no longer touch the page thread, so the interface stays responsive.
- Test a Voice rebuilt on a clear state machine: loading → generating → playing → idle/error, with a visible status line, real download progress (MB and %) and generation timing.
- The button now becomes **Stop** immediately, and works during loading and generating. In 1.2.1 it only changed once audio started, so clicks made during a freeze fired later as fresh Play clicks, threw away finished audio and restarted generation.
- Finished audio is now always cached, even if you press Stop first (1.2.1 discarded it). The cache is keyed by voice and whitespace-normalised text, holds up to 48 MB (least recently used goes first), and is shared with book narration.
- Audio is cached and played as 16-bit WAV, half the memory of the library's default.
- Sample text is capped at 300 characters with a counter (it was silently cut at 220) and stays well within Kokoro's ~510-token limit.
- One generation at a time; requests cancelled before they start are dropped. A worker that goes silent for 2.5 minutes is restarted, and any failure shows a clear message and can be retried.
- The worker finishes loading with a short warm-up generation, so voice-file or phonemiser failures appear as loading errors instead of mid-playback.
- One shared audio element, unlocked on the click, so playback after generation is not blocked on Safari/iOS.
- A voice registry (`VOICES` in `kokoro.js`) makes adding more Kokoro voices later a one-line change; the selector stays hidden while George is the only voice.
- Book narration uses the same worker. Its chunking and playback logic are otherwise unchanged in this release.

**Not yet addressed (next):** book chunks are still cut at 190 characters mid-sentence and generated with no lookahead, so gaps between passages remain. Generation is still single-threaded WebAssembly, so speed per clip is unchanged, but it no longer blocks the page.

## v1.2.1 — 22 October 2026
- Simplified voice selector to George only; removed browser voices from the interface.
- Cache up to six generated voice-test samples in memory so repeating identical text plays without regenerating speech in the same tab.
- This doesn't speed up first-time synthesis or permanently cache samples across reloads.

## v1.2.0 — 22 October 2026
- Added a dedicated **Test a Voice** tab with editable sample text and its own Play/Stop button.
- Voice tests work without an EPUB, separating narration/model issues from book-file issues.
- Supports George and browser voices from the existing voice menu, ready for more voices later.

## v1.1.3 — 22 October 2026
- Removed background AI speech generation and three-part buffering to reduce browser CPU and memory pressure.
- Generate one short passage at a time, with explicit cancellation and audio cleanup.
- Preserve pause/resume controls and model reuse. Longer gaps between passages are possible on slower computers.

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
