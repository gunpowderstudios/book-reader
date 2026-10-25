# Book Reader — Version history

## v1.12.19 — 25 October 2026
- Build the book chapter list and reading text before switching to Now Reading, rather than relying on tab switching to trigger rendering.
- Show chapter-rendering failures in the reader and playback status, instead of silently leaving the initial placeholder visible.
- Verified JavaScript syntax after the change; browser-level verification still needed.

## v1.12.18 — 25 October 2026
- Fixed a potential interruption in chapter rendering: draw book heading, text, chapter selector and highlighting before refreshing optional prepared-audio controls.
- Isolated optional offline-panel errors so they cannot leave the reading text and chapter list blank.

## v1.12.17 — 25 October 2026
- Replaced the long, technical slow-narration warning with simple guidance for readers.
- Removed the experimental GPU button from the warning because GPU mode is not currently selectable by the app's performance settings.

## v1.12.16 — 25 October 2026
- Simplified the Now Reading collapsible title: display just the book name, without the confusing 'Now Playing' label.
- Added a chapter selector and a missing-chapter-content recovery check in v1.12.15.

## v1.12.14 — 25 October 2026
- Reduced temporary generated audio RAM cache to 16 MB on phones/tablets and 48 MB on desktops.
- Discard completed speech clips from the in-memory cache as narration progresses. Preserve downloaded voice model, EPUBs and any separately prepared chapters.

## v1.12.13 — 25 October 2026
- Stop AI narration and prepared-chapter playback when the page is reloaded or navigated away from.
- Reset playback if a browser restores the page from back/forward cache, without deleting downloaded models, EPUBs, bookmarks or saved audio.

## v1.12.12 — 25 October 2026
- Now Playing information panel on the reading page starts collapsed and expands by tapping the heading.
- Keep the detached mobile playback panel visible outside the collapsed section.

## v1.12.11 — 25 October 2026
- Added a Listening Tools tab on desktop and the mobile dropdown.
- Moved optional Save for Later chapter preparation and Bookmarks & sharing out of Now Reading and into Listening Tools, retaining existing controls and IDs.

## v1.12.10 — 25 October 2026
- Loading indicator now tracks the actual browser audio `playing` event instead of vanishing when speech generation completes.
- Keeps the spinner and preparation status visible between model loading and the first audible passage; cleans up audio event handlers on stop.

## v1.12.9 — 25 October 2026
- Added a small animated loading wheel beside the selected narrator in the right-hand status panel, during AI engine startup and initial speech generation.
- The wheel disappears when narration begins or loading is stopped, and respects reduced-motion settings.

## v1.12.8 — 25 October 2026
- On phones, replace the four navigation tabs with one full-width dropdown beginning with My Library.
- Dropdown and desktop tabs stay in sync when opening a book or switching pages; desktop layout unchanged.

## v1.12.7 — 25 October 2026
- Playback description and automatic listening advice now display the selected AI narrator's name (George, Emma, Eric or Aoede) instead of always saying George.

## v1.12.6 — 25 October 2026
- On mobile, playback controls are no longer fixed to the bottom of the screen. The full player becomes a standalone panel beneath the active tab’s opening description.
- Player buttons stack and wrap for narrow phones; desktop retains the existing fixed playback bar.

## v1.12.5 — 25 October 2026
- Returned status and performance settings to a persistent right-hand column, visible alongside each tab.
- On smaller screens, the settings panel stacks below the main content, with controls contained within the viewport.

## v1.12.4 — 25 October 2026
- Moved voice status and performance settings into a shared panel above all tab content.
- Reworked layout to prevent the Automatic performance selector overflowing the page on narrow displays.

## v1.12.3 — 25 October 2026
- Both header logo versions (desktop and mobile) now link to the reader home page.

## v1.12.2 — 25 October 2026
- Simplified Syncing Playback: export a tiny JSON reading-progress file and import it on another device, using the device's standard file picker and any cloud folder.
- No registration, API access, hosted database or direct Dropbox/Google/iCloud integration needed; manual transfer only.
- Saved progress can cover multiple books; loading restores the position of a currently open matching EPUB or the next time it opens.

## v1.12.1 — 25 October 2026
- Added a **☁ Syncing Playback** tab explaining planned bring-your-own Google Drive and Dropbox connections, potential iCloud integration, privacy, and how cross-device reading would work.
- Removed the unconfigured Supabase sign-in panel and stopped loading its client scripts; cloud sync is not active yet. Local position saving remains unchanged.
- Clarified the current manual Share Place link as an interim option.

## v1.12.0 — 25 October 2026
- Added optional authenticated cloud reading-position sync using Supabase: chapter and paragraph only; EPUB text and files stay on each device.
- Added email magic-link sign-in, remote position restore, throttled progress uploads, and Row Level Security database setup instructions.
- Cloud sync is **not active** until an administrator supplies a Supabase project URL and public key in `cloud-sync-config.js`. The UI explains the unconfigured state.

## v1.11.5 — 25 October 2026
- Added a plain-English H2 explaining the app's AI audiobook narration, read-along text and saved reading position above the library storage note.

## v1.11.4 — 25 October 2026
- Renamed the Book Reader navigation tab to **Now Reading** to make its purpose clearer.

## v1.11.3 — 25 October 2026
- Removed the redundant large My Library heading while retaining the navigation tab.
- Bottom Play now reopens and resumes the most recent saved book when no book is loaded; removed the duplicate saved Conan card and the redundant Add EPUB control.
- Updated the library instructions to refer to the main Load a Book button.

## v1.11.1 — 25 October 2026
- Removed the unsatisfactory Classic Voice option from the narrator dropdown and playback controls.
- Added a polite device compatibility warning when Kokoro reports an out-of-memory load failure, with advice to try a newer device or an available browser update.
- Does not guess available RAM: mobile browsers, particularly Safari, cannot reliably expose usable memory; actual engine failure is more informative.

## v1.11.0 — 25 October 2026
- Added **Classic Voice** using the browser's built-in speech synthesis, avoiding the Kokoro memory requirement on older iPads.
- When Kokoro reports an out-of-memory loading failure, show a **Use Classic Voice** button to continue from the current reading position. Users may also select Classic Voice directly in the narrator selector.
- Removed Captain's Log and its diagnostics/update checker from the interface; kept the narrator and performance status area.
- Classic Voice uses paragraph-level highlighting rather than Kokoro's approximate yellow word-following.

## v1.10.5 — 24 October 2026
- Changed links and visited links to warm yellow for better contrast on the dark theme, with a pale yellow hover and keyboard-focus state.

## v1.10.5 — 24 October 2026
- Changed links to warm yellow `#F8D36E` for contrast on dark backgrounds, with a lighter hover/focus colour.

## v1.10.4 — 24 October 2026
- Fixed a read-along jump between sentences: removed competing automatic smooth scrolling from the reading-position updater, leaving the read-along tracker in charge.
- Tracking now scrolls only when the active paragraph is outside the visible reading pane, with no animated overshoot.

## v1.10.3 — 24 October 2026
- Linked Robert E. Howard's name on the included Conan book card to his Wikipedia biography, opening in a new tab.

## v1.10.2 — 24 October 2026
- Increased desktop long-logo size by 30% (430 to 559 px maximum width), preserving mobile full-width layout.

## v1.10.1 — 24 October 2026
- Display the wide EPUB sign at full available width on mobile, replacing the small square icon and significantly increasing its apparent size.
- Centre the version beneath the sign and put Load a Book underneath to prevent overlap on narrow screens.

## v1.10.0 — 24 October 2026
- Narrator loading now has an animated indeterminate progress bar while the voice or speech engine prepares, rather than jumping abruptly to 100%.
- Show real percentage progress only when Kokoro supplies download totals; new voice choices show an explicit preparing-voice message.
- Respects reduced-motion preferences.

## v1.9.9 — 24 October 2026
- Added **Check for updates** at the bottom of Captain's Log. On demand, it compares the reader's Kokoro JS version with the npm registry's latest release and links to release details when newer.
- No automatic upgrades or model swaps; model upgrades need separate compatibility review. The check requires internet access.

## v1.9.8 — 24 October 2026
- Simplified reader-facing voice performance choices to **Automatic (recommended)**, **Fast**, and **Low Memory**. GPU remains internal for developer experiments.
- Automatic selects Fast for computers and Low Memory for phones/tablets. Saved manual choices are carried forward and users can return to Automatic.
- Replaced the detailed technical mode description with simple language in the optional performance settings panel.

## v1.9.7 — 24 October 2026
- Removed the manual voice speed benchmark panel and its script from the public Meet the Narrators page.
- Simplified narrator testing instructions and removed outdated George-only technical explanations.
- Book Reader continues measuring practical speech-generation speed automatically during normal listening, without a separate benchmark or extra test downloads.

## v1.9.6 — 24 October 2026
- Added American Male — Eric (`am_eric`) and American Female — Aoede (`af_aoede`) alongside British Male — George and British Female — Emma.
- Narrator dropdowns and status labels use the appropriate accent, gender and character names. Existing narrator selection and prepared audio remain supported.

## v1.9.5 — 24 October 2026
- Added a **Bedtime** button to the bottom playback controls. It shows an edge-to-edge black overlay with the animated candle from `images/candel.gif` centred.
- Narration continues underneath the overlay; tap/click anywhere or press Escape, Enter or Space to return to the reader. Does not attempt screen-off playback.

## v1.9.4 — 24 October 2026
- Open **My Library** by default on every fresh page visit, even when books are already stored.
- Move the narrator loading, download and processing-speed panel from above the reading tabs into the right-hand column above **Captain's Log** on the Book Reader tab.
- On narrow screens this sidebar sits underneath the reader, keeping the top of the mobile layout uncluttered.

## v1.9.3 — 24 October 2026
- Simplified speed setup: Book Reader automatically recommends **Fast** on desktop computers and the lower-memory **Standard** mode on phones and tablets for first-time users; this is a device-based starting recommendation, not an exhaustive benchmark.
- Existing manually chosen modes remain saved. The active speed and recommendation are shown above the collapsed **Change speed (optional)** settings.
- Corrected the initial default-mode selection logic so a new desktop visitor actually starts in Fast rather than silently selecting Standard.

## v1.9.2 — 24 October 2026
- Fixed the engine heading and narration status to show Emma when Emma is selected instead of always saying George.
- Voice mode status refreshes immediately when switching narrators. The voice engine and model remain shared.

## v1.9.1 — 24 October 2026
- Space bar now toggles Play/Pause when the reader is open. Ignores held-key repeats, text fields, selects, buttons and other interactive controls.

## v1.9.0 — 24 October 2026
- Added Kokoro British female narrator Emma (`bf_emma`) alongside George (`bm_george`) using the existing model and worker.
- Enabled narrator selection in the bottom player; choices persist on each device and can be auditioned in Meet the Narrators.
- Prepared audio caches distinguish George and Emma so speech is not mixed between narrators.

## v1.8.2 — 24 October 2026
- Centred the wide pub-sign logo at the top of the page with the version number directly beneath it. Kept Load a Book accessible on the right and the responsive square icon on small screens.

## v1.8.1 — 24 October 2026
- Used the uploaded wide pub sign logo in the page header and the square logo for browser favicon and iPad home-screen icon.
- Small-screen header adapts to the square logo on narrow devices. Original uploaded filenames, including `sqaure`, are used unchanged.

## v1.8.0 — 24 October 2026
- Featured the complete uploaded 17-story *Conan: Original Published Stories* EPUB as a free included book in My Library, with an original SVG cover and an Open free book button.
- Added context on UK public-domain status from 1 January 2007 and a personal-reading / not-offered-for-resale notice, while clarifying that public-domain texts cannot be newly restricted.

## v1.7.2 — 24 October 2026
- Removed redundant **Listen Now** button; the bottom playback bar remains the single primary Play/Pause control.
- Updated the heading to show **Load a Book…**, the loaded title, and **Now Playing** when narration starts.
- Made the story text independently scrollable so long EPUB chapters no longer push the credits to the end of the entire story; read-along scrolling follows inside that pane.

## v1.7.1 — 24 October 2026
- Linked Gunpowder Studios in the copyright footer to https://www.gunpowderstudios.co.uk/apps/.

## v1.7.0 — 24 October 2026
- Added **Bookmarks & sharing**, collapsed by default, with named bookmarks saved per book in browser localStorage.
- Bookmark entries can reopen a saved chapter and paragraph or be removed independently of normal automatic reading-position saving.
- **Share My Place** copies a URL containing the EPUB content identifier, chapter and paragraph; it does not share copyrighted book content.
- Opening a shared link retrieves the matching EPUB from My Library on that device and jumps to the requested position; otherwise the user is prompted to add the same EPUB. The two devices do not automatically sync their libraries or bookmarks.
- Shared position accuracy is paragraph-level; book files must match, and browser storage can be cleared by the user or browser.

## v1.6.2 — 24 October 2026
- Added a concise, professional credits and copyright notice near the bottom of the reader, above the fixed playback controls.
- Credited the Kokoro text-to-speech model and contributors, with links to the official model, project and available voices.
- Clarified that users should only read material they own, public-domain works, or material they are authorised to use; copyright remains with the original rights holders.
- Added a link to the open-source Book Reader GitHub repository and a Gunpowder Studios copyright line.

## v1.6.1 — 24 October 2026
- Added a yellow word-following highlight during George's live narration, with the current passage scrolled near the top of the reading area.
- Added a **Highlight spoken words in yellow** toggle beside Listen Now; preference is saved per browser.
- Word timing is approximate, based on progress through each generated audio passage. Kokoro does not return per-word speech timestamps, so highlighting will not always align exactly with the spoken word.
- Offline prepared chapter playback has no individual word timing and is unchanged.

## v1.6.0 — 24 October 2026
- Simplified the reading screen with a prominent **Listen Now** button and a collapsible **Save for Later** chapter preparation section.
- Moved technical voice-mode choices under Advanced voice settings; the existing Fast default and fallback behavior remain.
- Automatically remember George's observed generation speed during normal narration, then recommend live listening or prepared playback without a surprise benchmark or additional model download.
- Fixed the offline preparation estimate to show ~326 MB for Fast/GPU mode instead of incorrectly showing 92 MB.
- Performance advice is based on measured speech-generation throughput; it is not a hardware benchmark or guaranteed uninterrupted playback.

## v1.5.3 — 24 October 2026
- Renamed Activity Log to **Captain's Log (look under the hood)**.
- Collapsed by default to keep the reading interface uncluttered; tap the title to show or hide diagnostics. Logging, Copy Log and Clear remain functional while collapsed.

## v1.5.2 — 24 October 2026
- Added a right-hand **Activity Log** on the Book Reader tab, showing live voice engine status, buffering, preparation, playback, benchmarks and errors.
- Added **Copy Log** and **Clear** controls, with a rolling 250-event history; no EPUB book text is recorded.
- On narrower screens and iPads the log moves below the reader. The log is session-only and does not upload diagnostics.

## v1.5.1 — 24 October 2026
- Added a **Run speed test** button under Test a Voice to measure model start + three short samples, real-time generation rate, and browser UI delays on the user's device.
- Fast is the recommended default for *new* users. Existing saved mode preferences are preserved; unsupported modes fall back to a lighter option.
- Explained model download sizes, memory trade-offs, and why chapter preparation avoids live speech-generation gaps.
- Benchmarks do not automatically run, and test results should be interpreted as indicative rather than a guarantee of gapless playback.

## v1.5.0 — 24 October 2026
- Added **Prepare Chapter** to Book Reader, with estimates for narration duration, uncompressed WAV storage and the selected AI model download.
- Generate George's narration one chapter at a time, save every completed audio passage in IndexedDB and resume preparation later without regenerating saved passages.
- Added **Play prepared chapter**: assemble saved PCM-WAV passages into one continuous audio file for seamless playback without live AI inference.
- Preparation stays on the device, not a streaming speech download. Progress must remain open in the foreground; iPad Safari may suspend background generation. The browser may evict stored audio, and the GitHub Pages app itself is not yet guaranteed to open offline.
- This first release saves large WAV audio files rather than MP3/M4B; exporting compressed offline audiobooks remains a separate Mac-based feature.
- No changes to EPUB import, existing live narration or My Library logic.

## v1.4.2 — 24 October 2026
- Renamed the app header and browser tab to **Book Reader**, followed by the version number. No functional changes.

## v1.4.1 — 24 October 2026
**Fixes "George could not load: no available backend found. ERR: [wasm] RangeError: Out of memory".**
- Cause: a failed load (typically the 326 MB Fast/GPU model, which needs far more memory on phones and tablets) left WebAssembly memory held inside the worker, so the automatic fallback to Standard in the *same* worker also ran out of memory. On a page with multi-core enabled, Standard also picked several threads, needing more memory still.
- Fix: each attempt now runs in its own worker. If it fails, that worker is discarded and a fresh one starts in the next lighter mode (GPU → Fast → Standard). The mode that works is remembered on that device, and the bar explains what happened.
- Standard is always single-threaded now (set explicitly), even after Fast mode has enabled multi-core on the page; Fast uses up to 4 threads only when the page is isolated.
- Tested: worker (24 checks) and page (153 checks), including the fresh-worker fallback. Not reproduced on a real phone/iPad here.

## v1.4.0 — 23 October 2026
**Read-ahead, a download/data bar, and My Library.**
- **Read-ahead by minutes.** George now prepares audio ahead of what you are hearing, up to a target (default 6 minutes; Voice settings: 1–30), keeping two passages in the engine at a time, and keeps preparing while paused. The first passages are also prepared as soon as a book opens, if George is already installed on the device (no surprise download).
- **Live buffer meter** under the player: "Ready ahead: 1m 09s of 6m 00s · George works at 33× speaking speed". If George falls behind it says so, with the measured speed, and offers the next speed mode in one tap. Honest limit: read-ahead hides gaps only when generation is at least as fast as playback. If it is slower, the buffer drains and pauses return; the meter shows the real figure so you can see which case you are in.
- **Speed modes** (Voice settings): Standard (92 MB model, one core), Fast (326 MB full-precision model, several cores; enables multi-core with a small service worker `coi-sw.js` and one page reload, because GitHub Pages cannot send the required headers), GPU (experimental, WebGPU). Fast and GPU fall back automatically (GPU → Fast → Standard) and the bar says why. Measured here: Fast about 2× Standard on 2 cores.
- **Download bar.** Shows the stage (speech library, model with MB of MB and %, starting, ready), the mode in use and cores, and "Downloaded by George this visit: N MB" counted from real network traffic. A start from the browser's saved copy reports about 0 MB.
- **My Library.** EPUBs are saved in this browser (IndexedDB) with title, author, cover, and your place (chapter, paragraph, % read). Reopening a book, or restarting the app, continues where you were; place is saved as you read and when the page is hidden. Add several books at once, remove with a two-step confirmation, see storage used. Per device only; not synced between Mac, iPhone and iPad. Persistent storage is requested so the browser is less likely to clear it. In private browsing the library is unavailable and the app says so.
- Fixed: opening a second EPUB in one session threw an error.
- Tested: 151 page checks (jsdom, fake worker and clock), 24 worker-protocol checks (modes, fallback chain, byte counter), and a real Chromium run with a stand-in model covering add → read → reload → resume at the same paragraph, the download bar showing 3.0 MB, and cross-origin isolation switching on for Fast mode with cross-origin loads still working.
- Not verified here: the real Kokoro model in a browser under Fast mode, real Hugging Face and jsDelivr headers under isolation, WebGPU, iOS/Safari behaviour, and actual speed on iPhone, M2 or iPad.

## v1.3.0 — 22 October 2026
**New: make a finished audiobook with George (`audiobook/make_audiobook.py`).** Measurement showed why the in-browser reader still pauses: George generated at about 0.94× real time on one native thread (1.6× on two), and the browser is limited to a single thread of slower WebAssembly, so generation cannot keep up with speech and lookahead cannot hide that. Older phones and tablets are slower still, and a locked screen interrupts chunked browser audio.
- The new command-line tool runs the real Kokoro model on your own computer (all cores, native speed) and produces one `.m4b` audiobook with chapters, cover art and tags (best for Apple Books on iPhone, iPad and Mac), or per-chapter MP3s. Once made, it plays anywhere, offline, with no pauses and with lock-screen controls.
- Free and local: no accounts, API keys or uploads. Downloads the model once from the kokoro-onnx GitHub release.
- Reads EPUB chapters in order; skips navigation, side notes and images; removes footnote markers; reads headings as chapter titles; longer pauses between paragraphs and at scene breaks; keeps "Mr." and "Dr." intact; splits single-file books at their headings; refuses DRM-protected EPUBs clearly.
- Resumable (Ctrl-C or sleep, then run again), parallel across workers, with `--list`, `--chapters`, `--benchmark`, `--format mp3`, `--voice`, `--speed`.
- Tested end to end with the real model: chapters, cover art, tags and duration verified in the output; MP3 mode; Ctrl-C and resume; clean model download; error messages. Found and fixed two bugs on the way (ffmpeg hanging because forked workers inherited its input pipe, and relative output paths).
- The web app is unchanged apart from a pointer to the tool on the Test a Voice tab.

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
