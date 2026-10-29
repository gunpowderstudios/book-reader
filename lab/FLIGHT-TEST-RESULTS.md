# E.D.D.i. / The Norwood — Flight Test Results

Updated: 27 October 2026. Living research log for deciding changes to the **live Reading Room**. **Do not treat lab experiments as validated live-reader settings.** No production changes authorised yet.

## Standard methodology

E.D.D.i. LAB at https://gunpowderstudios.github.io/book-reader/lab/ — Emma voice, 12-passage Full Tour unless noted. Collect compact JSON plus subjective audible smoothness, device/browser and engine. Clock anomalies measure wall time against audio media progress, while average passage transition measures only the gap between media elements; zero reported underruns does **not** rule out intra-passage freezes.

## Verified observations

| Device/browser | Lab version | Requested → actual engine | Test | Generation / 131.97 sec audio | Startup (first sound) | Playback findings |
| --- | --- | --- | --- | --- | --- | --- |
| User's MacBook M2, Chrome | 1.14 | Auto → GPU unrestricted | Full 12 | 65.95 sec (2.00× real time) | 5.815 sec | **Failure**: passage 3 wall clock 32.90 sec versus 9.35 sec audio, 23.55 sec unaccounted; coincident with passage 11 GPU generation taking 25.24 sec. 2 clock-anomaly logs for same major stall. |
| User's MacBook M2, Chrome | 1.15 | Fast CPU, 4 threads | Full 12 | 70.79 sec (1.86×) | 7.907 sec | **Smooth according to user**; 0 clock anomalies, 0 underruns; passage 11 9.09 sec to generate, average transition 29 ms. |
| User's Mac Studio, Chrome | 1.16 | Auto → GPU unrestricted | Full 12 | 13.00 sec (10.15×) | 4.004 sec | 0 anomalies, 0 underruns; passage 11 1.60 sec; average transition 36 ms. **Not** a 3-passage-ahead test (report: lookAheadLimit unlimited). |
| Simon's MacBook Pro, Chrome | 1.16 | Auto → GPU unrestricted | Full 12 | 18.25 sec (7.23×) | 27.067 sec | 0 anomalies, 0 underruns; passage 11 2.47 sec; avg transition 25 ms. Engine startup 25.38 sec, possibly first-load cost; second-run check outstanding. |
| User's iPhone 13, Chrome iOS | 1.20 | Auto → Standard CPU | Full 12 (stopped during passage 1) | Not completed | No sound recorded | iOS audio unlock event; engine ready after 16.614 sec; generation of first full passage still incomplete when stopped ~21.5 sec later. This does **not** prove an engine crash. |
| User's iPhone 13, Safari iOS | 1.25 | **Compact q4f16**, 1 thread | **Benchmark A, matched-v2 text** | **17.24 sec for 10.80 sec audio (0.63× real-time)** | **52.841 sec** | **Success**, engine ready after 35.270 sec, 0 audio stalls, 0 clock anomalies. Compared to Standard q8 Chrome v1.23: 20.68 sec for 11.05 sec (0.53×), but **different browser** and potential cold download make comparison provisional. |
| User's iPhone 13, Chrome iOS | 1.23 | **Standard q8 explicitly selected**, 1 thread | **Benchmark A, matched-v2 text** | **20.68 sec for 11.05 sec audio (0.53× real-time)** | **28.057 sec** | Completed, engine ready 7.045 sec, 0 audio stalls/clock anomalies; baseline for Compact q8f16 same text comparison. |
| User's iPhone 13, Chrome iOS | 1.22 | Auto → Standard CPU | **Benchmark B: different text, 3 chunks** | **27.16 sec for 12.38 sec audio (0.46× real-time)** | **15.528 sec** | 2 buffer underruns, 4.525 sec and 3.417 sec; 0 clock anomalies. **Not a controlled A/B text comparison**; Benchmark A used passages[0], whereas B used benchmarkParts, so first-sound results are indicative only. Both confirmed slower-than-realtime synthesis. |
| User's iPhone 13, Chrome iOS | 1.22 | Auto → Standard CPU | **Benchmark A: first original tour paragraph, 1 chunk** | **23.02 sec for 11.05 sec audio (0.48× real-time)** | **29.748 sec** | Completed, 0 clock anomalies and 0 underruns; voice engine ready in 6.393 sec. Awaiting Benchmark B with same paragraph split into 3 chunks. |
| User's iPhone 13, Chrome iOS | 1.21 | Auto → Standard CPU, 1 thread | **Norwood Welcome, 6 passages** | **145.80 sec for 62.05 sec audio (0.43× real-time)** | **29.549 sec** | **Completed, but 5 buffer underruns**. Between-passage delays 12.404, 11.576, 10.829, 17.027, 16.999 sec (avg 13.767 sec). **0 intra-passage audio stalls and 0 clock anomalies**. Model ready in 5.908 sec; generation takes 20.72–28.43 sec/passage. Subjective audibility/smoothness on this particular six-passage run not yet explicitly confirmed. |
| User's iPhone 13, Chrome iOS | 1.21 | Auto → Standard CPU, 1 thread | **Mobile quick test, 1 short sentence** | 8.91 sec for 4.85 sec audio (0.54×) | 15.857 sec | **Success, audible through AirPods (confirmed by user)**; 0 anomalies, 0 underruns; 5.58 sec wall-clock playback vs 4.85 sec media. Audio manually unlocked. |

Earlier MacBook GPU unrestricted repeats in lab v1.11–1.14 also exhibited ~18–24 seconds of playback delay during passage 11 generation; this is a reproducible warning, not a general rule about all GPU-equipped computers.

## Open investigations / test plan

- **MacBook M2 Chrome**: v1.16+ GPU **3 passages ahead** experimental mode, Full Tour, compare to known unrestricted GPU failure. This test has not yet been received.
- **Mac Studio**: GPU 3-ahead vs unlimited; optional Fast CPU performance comparator.
- **Simon's MacBook Pro**: repeat Auto to determine whether 25-second engine load was one-off; confirm subjective audio.
- **Old Dell Latitude PC**: Auto, Standard, Fast CPU if supported. Record Windows/Linux and Chrome/Edge version.
- **iPhone 13**: the six-passage Standard CPU test completed with **5 significant underruns**, average 13.77 seconds. Prior v1.22 benchmark A (29.75 sec to first sound) and B (15.53 sec) used **different text**, so their difference cannot be attributed solely to chunk size. Both measured slower-than-realtime synthesis (~0.46–0.48×). v1.23 corrects both benchmark options to use identical text and exposes Compact q8f16 as an opt-in Lab-only engine. Investigate faster inference/model; prebuffering alone cannot sustain continuous reading when generation is below real time. Safari remains to be independently verified.
- **Russ's Galaxy phone**: Auto first, then Standard or GPU 3-ahead if supported, with short mobile test before the full tour.
- Continue collecting other testers' device models, actual engines, first sound, generation speed, clock anomalies, underruns, audible quality, and any browser crashes.

## Working hypotheses and release considerations

1. **Do not globally disable GPU.** It ran smoothly and rapidly on both Mac Studio and Simon's MacBook Pro. On the M2 MacBook, unrestricted GPU caused repeated stalls even when ample audio had buffered.
2. **Test bounded look-ahead** before adopting it. v1.16 introduced GPU 3-passages-ahead experiment; its effect on the MacBook GPU freeze is **unverified**.
3. **Mobile Standard CPU is functional**, but 8.91 sec compute for 4.85 sec audio is slower than real time. Six-passages performance now measured at 0.43× real-time, with 5 substantial inter-passage gaps; full-book performance unknown. Investigate shorter speech chunks, smaller mobile model, generation progress, and buffering; seek actual phone results.
4. **Autoplay and iOS audio unlock** require testing at the passage boundary as well as the first sound. An unlocked one-sentence test doesn't guarantee hands-free multi-passage playback.
5. For live reader eventually consider: playback wall-clock monitoring, adaptive mode selection/fallback at safe passage boundaries, bounded generation buffers, explicit user progress during model loading, reliable resume/position. Preserve existing live experience until validated, and test on multiple classes of hardware.

## Lab timeline

- v1.13 playback wall-clock anomaly detection captures GPU-associated freezes.
- v1.14 mute mode.
- v1.15 layout tidy; engine selector moved under voice.
- v1.16 GPU 3-passage-ahead experimental mode.
- v1.17 compact shareable JSON reports.
- v1.19 fix removed-button reference preventing scripts from initialising.
- v1.20 iOS Automatic uses Standard CPU.
- v1.21 one-sentence Mobile Quick Test; successful iPhone 13 / AirPods test.

## Next production decision gate

Wait for MacBook GPU-limited test, Dell and Galaxy results, plus an effective mobile speed/chunking strategy informed by the six-passage iPhone test. Compare subjective continuity and objective logs. **Do not silently port Laboratory settings into the live Reading Room.** Keep this document updated as results arrive.

## 27 October 2026: v1.23 mobile engine experiment

- Kokoro worker already included **compact** WASM mode (v1.23 specified invalid q8f16; corrected to q4f16 in v1.24, size unverified), compared with Standard q8 (~92 MB). v1.23 exposes this existing option in the Lab speech-engine selector; iOS Auto stays Standard. Smaller disk size does **not** establish faster generation or lower runtime memory; browser compatibility remains unknown.
- **Correction:** v1.22 Benchmark A used `passages[0]` but Benchmark B used a separately authored `benchmarkParts` passage; previous first-sound results were not a controlled chunk-size comparison. v1.23 now derives both test scripts from `benchmarkParts` (joined text for A; segmented for B), marks `benchmarkTextVersion: matched-v2` in JSON, and thus requires new baseline tests.
- Next test: iPhone 13, Emma, **Mobile benchmark A**, first **Standard q8**, then **Compact CPU q8f16**; send both compact reports and subjective audio quality. Avoid repeated attempts if Compact crashes the browser. No live reader changes.

## 27 October 2026: Compact load failure and v1.24 fix

- iPhone 13 Chrome, LAB v1.23, Compact selected: **13 recorded immediate engine failures** across attempts; all report `Invalid dtype: q8f16. Should be one of: auto, fp32, fp16, q8, int8, uint8, q4, bnb4, q4f16`. This demonstrates a configuration typo, not browser/memory incompatibility. No speech generation or valid engine-load benchmark occurred.
- v1.24 corrects experimental Compact worker dtype to `q4f16`, updates Lab label and worker cache version. **Not yet confirmed** that q4f16 model files exist, load on iOS, or generate speech faster; size claims for q4f16 unverified. Standard/Auto unchanged; live reader unchanged.

## 27 October 2026: v1.25 older-iPad device voice fallback

- Lab now offers **Device voice (older iPad · no AI download)** using browser `speechSynthesis`, and selects it by default on iPhone/iPad. It is **not Emma** (uses an English voice installed by the device) and cannot be assumed to have the same audio quality. Kokoro Standard remains selectable; live Reading Room unchanged.
- New test logs: `native-ready`, `native-passage-start`, `native-speaking`, `first-sound`, `native-passage-complete`, `native-error`, `native-timeout`, `stream-complete`. Native speech does not provide accurate audio-duration, stall or transition statistics; 0 gaps in native completion is **not** proof of gapless playback.
- **Unverified on actual older iPad**; tester should try single-sentence then six-passage test, report audible output and compact JSON. Older iOS implementations can behave differently.

## 27 October 2026: older iPad native voice observation

- Old iPad, Safari 17.14 reporting MacIntel, Lab v1.25, Device Voice (`native-speech`), six-passage tour selected. `native-ready` lists 186 installed voices. Passage 1 chose **Rocko** (not Emma); `first-sound` and `native-speaking` recorded at **247 ms** from start. User confirms they heard the iPad's synthetic voice.
- **Important limitation:** supplied compact report ends immediately after first passage starts. There are **no** `native-passage-complete` or `stream-complete` events in the submitted excerpt, therefore full six-passage continuity is **not verified**. Device voice is a compatibility fallback, not a substitute for Emma's neural narrator; selecting first `en-GB` voice may yield a poor-quality/novelty voice (Rocko). Improve voice selection before considering production.

## 28 October 2026: Compact q4f16 first successful iPhone test

- iPhone 13 **Safari** iOS, LAB v1.25 Compact q4f16, 1 thread, matched-v2 full paragraph: 35.270-sec model/engine readiness, 17.24-sec generation producing 10.80-sec audio (0.63×), first sound 52.841 sec, playback completed with zero gaps/stalls/anomalies.
- Standard comparator from v1.23 used **Chrome iOS**: 7.045-sec readiness, 20.68-sec generation, 11.05-sec audio (0.53×), first sound 28.057 sec. Despite shared WebKit, browser, cache and repeated runs differ; do not claim controlled speed advantage until a matched same-browser comparison/repeat.
- Suggested next step: repeat Compact on same Safari/iPhone to examine cached start, then try Standard in Safari with identical text; continuous narration still unproven at below 1× generation.

## 28 October 2026: Compact output audibly silent despite successful media clock

- User reports **no audible output through AirPods** on iPhone 13 Safari with Compact q4f16. Two iPhone Safari reports show the engine loading, generating, and playback media clock completing without stalls, but this does **not** establish audible output. In particular repeat v1.25 run: engine ready 5.291 sec, generation 17.92 sec for 10.8 sec audio (0.60×), first media start 23.427 sec, and no playback anomalies. User confirms silence. Earlier iPhone Standard q8 on Chrome was *audible* through AirPods.
- Possible cause: Compact q4f16 inference returns extremely low/silent waveform or Safari output route/mute is silent. Do not label Compact voice as verified successful/audible yet.
- v1.26 Lab adds `audio-signal` event (peak amplitude, RMS, nonzero sample %, invalid samples, muted, volume) and warning for near-silent output to distinguish generated-silence from audio-output routing; live reader unchanged. Ask user to run Compact benchmark and submit report; if signal nonzero, compare same Safari Standard q8.

## 28 October 2026: DEFINITIVE Compact q4f16 failure — invalid waveform

- iPhone 13 Safari LAB v1.26 Compact q4f16: `audio-signal` measured **259,200 invalid/nonfinite samples out of 259,200**, peak 0, RMS 0, 0% nonzero. Muted false, HTML media volume 1. Engine load 5.980 sec, generation 17.80 sec, output duration 10.80 sec, media player completed **silently**, confirmed by user.
- **Conclusion:** q4f16 does not produce usable speech on this phone. Previously reported 0.60–0.63× generation and completed media timeline are **not successful voice benchmarks**; speed comparison with Standard is invalid. Cause may be model numerical inference instability or unsupported quantized model on this runtime; don't blame Bluetooth/audio routing.
- **Production:** do not enable Compact q4f16 in Automatic mode; retain known-audible Standard q8 and continue looking for working alternatives. Consider guarding all generated waveforms against nonfinite samples before playback and presenting an error instead of silent progress.

## 28 October 2026: Lab v1.27 q4 model experiment and invalid-audio guard

- Added opt-in **Q4 CPU (dtype q4)** mode in shared Kokoro worker, selected only when explicitly requested in Lab. Q4 not yet confirmed available/functional on iPhone.
- Worker now checks all generated samples before returning WAV: reject non-finite values (NaN/Infinity) or near-silent peak/RMS with a clear diagnostic error. This prevents UI clock playing through unusable audio. Shared worker was edited; live Reading Room *could* use it depending on its worker path, but the new q4 mode is not selected in live and audio guard is protective.
- Lab v1.27 marks broken q4f16 as **avoid**, offers Q4 CPU for Mobile benchmark A, changes worker cache URL to lab27; Auto on iOS remains Standard on Lab (unless the user manually selects Device Voice). Report whether Q4 loads, generates valid audio and is audible, with stats.

## 28 October 2026: Q4 model audible and valid on iPhone 13

- Safari iPhone 13, LAB v1.27, Emma, q4 WASM, matched-v2 Mobile benchmark A: engine ready after 33.662 sec; generation 20.88 sec for 10.80 sec audio (0.52× real time), first sound 55.055 sec, 0 gaps/stalls/anomalies.
- Signal is **valid and audible**: peak 0.965783, RMS 0.086739, 81.99% nonzero samples, 0 invalid out of ~259,200; muted false, volume 1. **User explicitly confirms hearing Emma through audio output**.
- Comparison against earlier Standard q8 v1.23 (Chrome iOS) 0.53× shows **no demonstrated speed advantage** for q4; cold loading and browser/caching differ. Q4 potential memory/model-size benefits on older iPad remain unmeasured. Do not enable Q4 in live automatically yet. q4f16 remains unusable because it generated 100% invalid samples.
- Next: repeat q4 in Safari after cached load to test startup; then test q4 on old iPad in single-sentence mode before longer runs; optionally compare q8 in Safari and collect subjective voice fidelity.

## 28 October 2026: Mobile Reading Room beta created

- Separate beta at https://gunpowderstudios.github.io/book-reader/mobile-beta/ clones the Reading Room so existing EPUB parsing, library and bookmarks can be tested on mobile. Desktop production `index.html` and the public phone/tablet holding notice are untouched.
- Beta has its own `mobile-beta/index.html` and `mobile-beta/kokoro-beta.js`. It uses Standard CPU by default on mobile; Q4 can be explicitly selected in Voice performance. Broken q4f16 is not offered. Uses shared `kokoro-worker.js` with invalid-audio rejection.
- Free-book links and local asset paths were adjusted for nested deployment. **Not yet tested on actual phone/iPad**, including whether EPUBs open and position persists; confirm before lifting live notice. Beta uses same-origin browser local storage, so testing may share book positions with the normal reader on the same device. Device Voice fallback has only been tested in LAB, not integrated into the live beta.
- Next validation: load a free classic or local EPUB on iPhone, choose Emma (or another available narrator), Standard CPU, start/pause/resume, reload and check saved location. Optionally test Q4 for memory/quality. Record mobile playback gaps and bugs.

## 28 October 2026: Mobile beta simplified for early testing

- In `/mobile-beta/`, mobile/tablet UI now carries **Mobile Beta** label, a plain instruction to open a book and press Play, and a warning narration may buffer.
- Hide the advanced Settings, offline-generation controls and speed slider on mobile/tablet via CSS (preserved in DOM for script compatibility). Leave book/library and primary playback controls accessible. The experimental q4 choice is intentionally hidden from the simplified mobile UI.
- Beta narration controller now forces **Standard q8** on mobile/tablet at initial load, independent of any saved selection, without overwriting existing stored preference; this is the only engine confirmed audible and valid with sufficiently repeatable results, though still <1× realtime. Desktop public Reading Room and holding notice not changed.
- Beta remains unverified on real mobile device; test a free book, Play, pause/resume, library return/bookmarks, loading and buffering feedback. Complex offline features not part of early beta.

## 28 October 2026: iPad-specific mobile defaults on unified Reading Room

- Repo has been consolidated since earlier beta deployment: root `index.html` now serves phones, tablets and desktop with responsive UI; `/mobile-beta/` redirects to root. Settings therefore updated in active root `kokoro.js` and `index.html`, not retired beta files.
- iPad detection includes `iPad` UA and desktop-style `MacIntel` with touch points >1. Automatically selects **Standard WASM q8** regardless of saved performance mode (avoids GPU/Fast selection), caps temporary clip cache to 8 MiB and read-ahead target to 90 seconds to reduce memory pressure. iPad narrator defaults to Emma unless user has a saved narrator preference. Worker controller cache-busted to `ipad-safe-1`.
- Important limitation: older iPad was only proven to speak via native Apple `speechSynthesis` in Laboratory; Kokoro q8 has **not** been verified on that older iPad. Native speech fallback is not integrated into current production reader. These choices are conservative AI settings, **not verified as fastest on older iPad**. Test actual iPad EPUB playback/loading/voice and consider built-in speech fallback if q8 fails.

## 28 October 2026: KittenTTS Nano separate browser experiment

- Added `lab/kitten.html` isolated experimental browser test using official `@kittentts/web` SDK via ESM CDN, model `nano-int8` (~25 MB), 8 available Kitten voices, output WAV signal metrics, real-time synthesis ratio, progress and copyable report. `analytics:false` disables SDK's opt-in/out analytics. The browser SDK is currently developer preview, Apache-2.0, and model is downloaded on first use.
- Linked Kitten test at top of Lab page. **No Kokoro worker, Kokoro controller, production Reading Room code or settings were changed**. Kitten has NOT yet been verified on iPhone/iPad; SDK CDN/module runtime behavior is subject to live test. Confirm generated speech is audible (not only advancing player clock) and report download/load/generation timing.

## 28 October 2026: KittenTTS first Safari attempt fails at module import

- Mac-like Safari user agent `Macintosh; Intel Mac OS X 10_15_7 ... Version/17.14 Safari/605.1.15` (may be iPad Safari desktop-style UA): `lab/kitten.html` v1 generated immediate `Importing a module script failed.` 13 ms after `Loading KittenTTS browser SDK…`; **no model download and no voice synthesis attempted**. Selected Rosie, Norwood welcome sentence.
- v2 changes SDK loader to try jsDelivr `@kittentts/web/+esm`, then two esm.sh variants, recording exact failed URLs/messages. No changes made to Kokoro or main Reading Room. Whether CDNs/SDK function on this Safari is **not yet established**; retest and send report.

## 28 October 2026: Kitten Lab v2.1 import failure; v3 bundle fallback

- User on Safari 17.14 (Macintosh Intel UA, potentially iPad desktop mode) reports **all three ESM CDN imports failed** (jsDelivr +esm, esm.sh es2020, esm.sh default), before model loading or speech generation. Bella was selected. No evidence of Kitten engine incompatibility yet; the JavaScript loading is blocked/unsatisfied.
- Official KittenTTS-web repo `examples/html/index.html` uses a **traditional UMD/plain browser bundle** (`assets/kittentts-web.js`, global `window.KittenTTSWeb`) rather than importing the npm package from CDN. Kitten Lab v3.0 tries that bundle through two CDN file paths, with load errors in the report. Its success on the user's device and hosted CDN paths remain unverified. Kokoro production unchanged.

## 28 October 2026: Kitten Nano Safari 17.14 WASM out-of-memory

- Kitten Lab v3.0 plain browser bundle **loaded successfully** from jsDelivr GitHub `KittenML/KittenTTS-web@main/examples/html/assets/kittentts-web.js` after npm path failed. Bella selected, standard welcome text. On Safari 17.14 Macintosh-style UA (likely older iPad desktop-style UA), after ~5.8 sec model initialisation failed: `ONNX inference failed: Could not initialise ONNX Runtime: no available backend found. ERR: [wasm] RangeError: Out of memory`.
- Hence SDK import issue is resolved; **actual blocker is memory / ONNX WASM initialisation**. 25MB model on disk does NOT imply it fits in the browser's runtime memory. No audio produced; Kitten Nano not proven viable on this iPad. Do not replace working Kokoro. Consider testing Nano on newer iPhone or desktop, and native Apple speech on old iPad; do not repeat same failing browser/model without memory improvement.

## 29 October 2026: Kitten Nano succeeds on iPhone 13 Safari — audible and fast

- LAB v3.0, iPhone 13 Safari iOS 18.7 UA, KittenTTS nano-int8, Bella, Norwood welcome sentence. Browser bundle loaded via jsDelivr GitHub route; model ready in **2.95 sec**; **3.27 sec** generated **7.48 sec** of audio (**2.29× real time**). Valid WAV 24kHz, 359066 bytes, peak 0.68451, RMS 0.10141, playback started and user explicitly confirms **'worked very well'** (audible and good subjective result).
- Stronger mobile outcome than prior Kokoro q8 (0.53×) / q4 (0.52×) iPhone benchmarks, but **not controlled same-text tests**, so keep comparison provisional. Previous old iPad Safari 17.14 failed with ONNX WASM out-of-memory; not solved.
- Next: run Kitten 6+ passage / EPUB streaming test with same text/voice to assess buffering, playback transitions, voice quality over longer passages; keep Kokoro as production fallback pending validation. Preserve both engines.

## 29 October 2026: Kitten LAB v4.0 multi-passage test added

- Separate Kitten Laboratory now offers original single-passage benchmark and six-passage sequential Norwood narration benchmark. Generates successive WAV passages while first passage is available to manually play on iOS, queues audio, measures per-passage generation seconds, audio duration, valid waveform and transition gaps. Playback events only indicate media clock; **user must confirm audible narration**. Voice and current working Kokoro reader unchanged.
- Prior iPhone 13 successful single-passage result (2.29×) should be confirmed across multiple passages. Older iPad failed ONNX memory initialization, so not an automatic Kitten candidate without separate validation. New lab code remains untested on actual devices.

## 29 October 2026: Kitten LAB v4 six passages audible, smooth on iPhone 13

- iPhone 13 Safari iOS 18.7, Kitten Nano int8, **Rosie**. User reports **'Sounds great'** and all six passages play. Engine ready 0.82 sec (cached), total generation **23.55 sec** for **51.88 sec** audio (**2.20× realtime**); six valid WAVs.
- Five player transitions: **110, 112, 111, 113, 129 milliseconds**, average **115 ms**, no user-reported audible interruption. All six generated before playback started (generation complete 07:15:24, playback begins 07:15:28), so this verifies **pre-buffered sequential playback**, NOT simultaneous generation/playback or prevention of buffer underruns during long books.
- Recommended next stage: Kitten EPUB prototype in isolated lab or opted-in mobile beta, with live generation during playback, audiobook-style chunking, caching/bookmarks and error fallback. Keep Kokoro intact. Older iPad still has ONNX WASM OOM, so don't automatically select Kitten there.

## 29 October 2026: Isolated Kitten EPUB Beta v1.0 created

- New standalone `lab/kitten-reader.html` (linked from `lab/kitten.html`) reads a DRM-free EPUB via JSZip; ships with quick test of `books/classics/dracula.epub`; allows local EPUB uploads, EPUB spine/chapter selection, basic text display, per-device localStorage chapter/passage bookmarks, Play/Pause/Previous/Next and Rosie Nano int8 voice. Generates subsequent speech passages as listening starts, with a small queue, reported generation ratios and playback transition gaps. Version visible top right, report copy available.
- **Preliminary prototype, not device-tested or validated against a wide range of EPUB structures.** User should try first with the bundled Dracula and report audible output and gaps. Advanced features (full book library persistence, multi-device sync, complete EPUB formatting) are not included. If a user refreshes, reopen the EPUB to restore the bookmark. Kitten SDK depends on CDN and may fail on older iPads with ONNX WASM OOM. Existing Kokoro production reader and all its engine files are untouched.

## 29 October 2026: Kitten EPUB beta v1.0 did not play; background preload v1.1

- User iPhone 13 Safari opened Dracula (32 chapters, 168 text segments in selected chapter). Kitten engine loaded in 0.79 sec and generated 4 passages (3.04 / 4.47 / 6.59 / 7.39 sec, 2.06–2.21× realtime), but **no audio playback events** appeared; user explicitly heard nothing. Important: slow experience was from waiting for generated passages and a UI that required second Play without clearly handling readiness; voice model itself was generating valid-duration output.
- Beta v1.1 initiates Kitten loading and narration pre-generation automatically when the EPUB or chapter is opened, also on next/previous passage. Displays first-passage-ready status and switches Play button from Preparing to Play. Fixes awkward first Play press merely starting generation. Caps ahead queue at a few passages and continues generation as playback advances. iOS Safari still may require a direct tap to play even after audio is ready; *do not promise truly automatic playback*. Production Kokoro unaffected.
- **Pending real iPhone verification** of v1.1 audible playback and performance; SDK synthesis may still occupy main-thread CPU, so “background” means pre-generating while book is open, not an isolated Web Worker.

## 29 October 2026: Kitten EPUB v1.1 live narration and v1.2 scrolling passage-only view

- iPhone 13 Safari user confirmed beta v1.1 works. Dracula chapter 5, engine loaded in 0.82 s, first passage prepared in 3.85 s, speech generated 2.06–2.24× realtime. Playback events prove narration started and progressed. Transition gaps observed: 111 ms, **3527 ms**, 104 ms, 130 ms. One long audible interruption remains to investigate independently of UI change.
- v1.2 replaces entire long chapter DOM rendering with a short (~190px) vertically scrollable text area showing only the currently narrated passage, plus passage counter. It updates at playback transitions and resets scroll per passage. Generation and Kokoro production code unchanged.

## 29 October 2026: Kitten EPUB beta v1.3 immersive reading screen

- Added pure-black fullscreen narration overlay activated by the audio `play` event. It shows only the current passage, tap-to-toggle transport/close controls, scrolling text, and estimated word progress based on `audio.currentTime / audio.duration`. Highlighting is **approximate** (not real TTS word timings), and needs device validation; narration synthesis/playback engine and original Kokoro reader untouched.
