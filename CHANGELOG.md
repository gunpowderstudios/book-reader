## Eddi’s Lab v1.28 — 30 October 2026

- Added a Kokoro / Kitten Nano **Voice engine** dropdown to the Lab's Live Eddi test section. The Voice dropdown updates to show Emma and Lewis for Kokoro, or Bella, Jasper, Luna, Bruno, Rosie, Hugo, Kiki and Leo for Kitten.
- Kokoro retains its existing diagnostic processing options. Kitten selects the preserved Nano INT8 Web Worker and generates sample narration using the selected Kitten voice, then plays it in the lab audio player.
- Experimental Kitten playback is not yet verified on all devices. Main live Eddi is unchanged at v1.12.118.

## v1.12.118 — 30 October 2026

- Replaced the desktop Mobile Test shortcut with **Eddi’s Lab**, linking to the existing isolated laboratory; made the link available on tablets and phones too.
- Confirmed automatic Desktop / Tablet / Mobile edition labels remain based on device detection; kept one Kokoro-powered player and its existing layouts unchanged.
- Extended the existing memory-related engine failure warning with: “Eddi is working on this in his lab.” The warning is triggered by reported memory-related failures, not by device type alone. An abrupt browser termination can still prevent any message appearing.
- Preserved Kitten experimental files and test logs.

## v1.12.117 — 30 October 2026

- Moved the 'Already bought an ebook?' DRM-free EPUB guidance and the E.D.D.i’s Choice explanatory heading/text beneath the free-book source links, without altering book covers, links or reader logic.

## Kitten research archive — preserved 30 October 2026 (reference only)

Kitten is **not part of the live Eddi voice engine**; live desktop, tablet and mobile use Kokoro. These files remain in GitHub for future investigation and should not be deleted during routine cleanup.

- [Flight test results](lab/FLIGHT-TEST-RESULTS.md) — iPhone 13 Safari testing, measured startup, worker performance, buffering gaps, chapter transitions, prolonged-run slowdowns and diagnostic history (29 October 2026).
- [Kitten beta reader](lab/kitten-reader.html) — experimental EPUB player, including the later chapter navigation and playback tests; kept as research source, not a public-facing alternative Eddi interface.
- [Kitten Web Worker](lab/kitten-worker.js) — tested Nano INT8 engine and supported voices: Bella, Jasper, Luna, Bruno, Rosie, Hugo, Kiki and Leo.
- [Kitten diagnostics](lab/kitten.html) — isolated diagnostics and model testing.
- [Integrated mobile engine experiment](lab/mobile-engine-test.js) and [mobile test reader](lab/mobile-kitten.html) — preliminary attempt to share Eddi's mobile layout; **not validated as ready for release**.

Key findings: Kitten Nano using a dedicated Web Worker successfully produced audible speech on iPhone Safari, but long narration tests exposed throughput deterioration and buffering pauses. Reuse requires fresh testing, particularly on iOS; preserve the original results and code.

## v1.12.116 — 30 October 2026

- Keep Kokoro as the single live voice engine on desktop, tablet, and mobile, with responsive layouts.
- Simplified the existing memory-related voice load failure notice to a brief RAM warning, shown after a relevant failure rather than simply based on device age.
- Left the separate Kitten laboratory tests untouched.

## v1.12.115 — 30 October 2026

- Hide the slow-speech / Prepare this chapter advisory panel across desktop, tablet and mobile, while keeping existing voice buffering and other controls intact.

## v1.12.114 — 30 October 2026

- Hid the slow-speech / Prepare this chapter advisory panel in the desktop edition, including its estimates and storage notices. Preserved playback, the remaining right-sidebar controls, mobile behaviour, and the underlying preparation feature.
- Bumped the visible desktop/live edition to v1.12.114.

## v1.12.113 — 30 October 2026

- Restored E.D.D.i. live reader to v1.12.112 as the baseline before these changes.
- Added desktop-only Mobile Test shortcut, located in the header below the edition badge.
- Added an isolated Mobile Test Bench in `lab/mobile-test.html`, with a v1.12.112 UI test copy and experimental Kokoro/Kitten voice-engine selection. This is not integrated into live mobile.
- Retained standalone Kitten beta code and recorded flight-test results in `lab/` for reference.
- Updated Free Books Conan and Beowulf covers to favour saved EPUB artwork; Beowulf uses its JPG cover, and Conan's unsaved fallback was changed to a historical magazine cover.
- Updated the visible live edition number to v1.12.113. The existing voice engine and mobile behaviour are otherwise unchanged.

## v1.12.106 — 28 October 2026

- Fixed: phones and tablets were sent to a separate, older copy of the app (the mobile-beta folder, frozen at v1.12.96), so they never showed any newer version whatever was done to the main page. Phones now open the main page, so the new mobile layout (menu, collapsible player, chapter list, voice starting on Play) reaches them. The old mobile-beta address now just forwards to the main page. No saved books, progress or voices are touched.

## v1.12.102 — 28 October 2026

- Fixed: the offline helper (coi-sw.js, v1.12.101) had two lines of code run together by mistake, so it never fetched anything from the internet. It could only show files it had already saved, which was just the app's own pages. That is why phones kept showing an old version (v1.12.96) and why book covers and books would not load. It now fetches fresh files again and falls back to the saved copy only when offline. Saved books, progress, settings and downloaded voices are not touched.
- Not fixed here: the Beowulf cover (and EPUB) were never added to the repository, so Beowulf shows the placeholder cover.

## v1.12.85 — 26 October 2026

- Removed the experimental capsule test page (capsule.html) and its bundled files. It is parked while a different approach is tried. The main reader is unchanged.

## v1.12.84 — 26 October 2026

- New experimental page, capsule.html (separate from the main reader, which is unchanged). It makes a "capsule": one .eddi file holding a book chapter and its finished narration by Lewis or Emma, compressed to a small size. A second part of the page plays any capsule with no voice engine and no internet, so it should run smoothly on phones and older tablets. Made with the same voice engine the reader uses; compression uses the browser's built-in Opus encoder (computers), and playback uses a bundled decoder (vendor/opus-decoder.min.js, MIT) that works in any browser. JSZip is also bundled (vendor/jszip.min.js).

## v1.12.83 — 26 October 2026

- Fixed: the "George is getting a head start… Start now" message was sitting in the right-hand panel, where the larger player bar (v1.12.72–80) now covers it on shorter windows, so Start now could not be clicked. It now appears inside the player bar itself, always in view. No change to how the head start works.
- The engine version shown in the Test report now matches the page version.

## v1.12.82 — 26 October 2026

- Offline pilot (ChatGPT): the service worker now saves the app's own files (page, scripts, logos, JSZip) so the app itself can open without a connection, while still adding the headers that Fast mode needs. It does not yet save the voice engine or voices. (Entry written afterwards; the original release did not include one.)

## v1.12.81 — 26 October 2026

- Hid the persistent green waiting status and added more desktop playback spacing (ChatGPT). (Entry written afterwards.)

## v1.12.80 — 26 October 2026
- Removed the green ‘Waiting for George…’ playback banner entirely, including its observer/DOM insertion. Loading progress and ordinary voice status remain available elsewhere.
- Enlarged the desktop fixed playback strip by approximately one third, increasing vertical separation between status text, buttons, and progress controls. Mobile playback sizing unchanged.

## v1.12.79 — 26 October 2026
- Removed the stale initial ‘Buffering…’ banner. The fixed player now only shows ‘Waiting for George…’ when the engine reports that narration is actually waiting for the next audio passage; background read-ahead is not presented as a stall.
- Increased desktop playback strip height and vertical spacing, including the progress slider row. Mobile dimensions and synthesis settings are unchanged.

## v1.12.78 — 26 October 2026
- Replaced misleading 'Buffering…' banner: when the engine prepares audio while playback continues, show 'George is reading ahead…'; when playback has genuinely stopped for audio, show 'Waiting for George…'. Uses existing playback and buffer state, with no mode or synthesis algorithm changes.

## v1.12.77 — 26 October 2026
- Show the active EPUB cover above the narrator/voice status controls in the desktop right-hand column, scaled to its full available column width. The sidebar cover stays hidden until a book is opened. Mobile audiobook view is unchanged.

## v1.12.76 — 26 October 2026
- Mobile Now Reading defaults to an audiobook-style view with a large EPUB cover, title, author and prominent Play/Pause control. The existing bottom player and voice loading/buffering indicators are retained.
- Added an optional Show book text button to reveal the traditional reading/chapter view. Desktop retains the existing scrolling/highlighted text view. No Kokoro engine changes.

## v1.12.75 — 26 October 2026
- Display a live ‘Buffering…’ message directly above the fixed playback controls on both desktop and mobile when the existing narration buffer reports it is empty; hide it again when audio is ready.
- Temporarily hide the Bedtime button without deleting its underlying code.

## v1.12.74 — 26 October 2026
- Mobile-only: added a compact live voice-loading ribbon above the fixed bottom player, mirroring the existing Kokoro status/progress without modifying voice processing. It shows loading percentage where available, animates while preparing, and disappears when ready.
- Improved phone player touch targets, Play button emphasis, safe-area padding and spacing; desktop layout unchanged.

## v1.12.72 — 26 October 2026
- Made the desktop bottom playback strip approximately 80% larger with more generous buttons, text, spacing and padding at widths above 900px. Mobile playback layout remains unchanged.

## v1.12.71 — 26 October 2026
- Replaced the empty-library placeholder on the home page with an illustrated new-visitor welcome card featuring the Dracula cover and a prominent bright-green (#D1F869) “Load your first book” link to the Free Books page.
- The welcome card automatically disappears when books exist in the local library, preserving the library availability message when storage is restricted.

## v1.12.70 — 26 October 2026
- Added large #D1F869 green homepage headline 'E.D.D.i is ready to read you a book!' immediately above 'Your FREE AI Book Reader that works right in your browser!'.

## v1.12.69 — 26 October 2026
- Removed the specially featured Conan free-book panel from the front page.
- Added Conan: Original Published Stories as a standard cover/card on the Free Books page, with the same Open in E.D.D.i. button and shared loading logic as the other books. Its included EPUB and cover remain in the repository.

## v1.12.68 — 26 October 2026
- Temporarily hide the AI Compatibility Test panel from the settings UI. Its test and Copy Report code remain intact for easy restoration; narration and playback are unchanged.

## v1.12.67 — 26 October 2026
- Add Back 30s and Forward 30s buttons to the compact bottom playback bar. Seeks accurately within the current audio clip; when a skip crosses generated passage boundaries, jumps by estimated reading duration and resumes if already playing. No AI model or performance settings changed.

## v1.12.66 — 26 October 2026

- Slow devices are now told so. If the voice is measured as slower than it plays (for example an iPhone 13 or an older PC), a box appears saying so and offering "Prepare this chapter". It generates the chapter once, keeps it on the device, and Play then starts straight away with no pauses. It shows about how long preparing takes on this device.
- The box is remembered for that device and disappears if the voice is later measured as fast enough. Fast computers never see it.

## v1.12.65 — 26 October 2026

- New opt-in test in Settings: "Low Memory: use extra processor cores". Phones and older computers normally run Low Memory on one core, which measured only 0.3–0.4× real time on an iPhone 13 and an older PC. With this ticked, the same small voice file runs on several cores (using up to 3 on a 4-core device). It is off by default and Automatic is unchanged.
- If a start with extra cores stops the page, the setting switches itself off and says so.
- The report now shows the setting and how many cores were really used.

## v1.12.64 — 26 October 2026
- On mobile, display the long E.D.D.i. logo full width, the 'Your FREE AI Book Reader' slogan beneath it, and a centred Load a Book button below. Desktop masthead and bottom playback controls are unchanged.

## v1.12.63 — 26 October 2026
- Centre the E.D.D.i. long logo and 'Your FREE AI Book Reader' slogan as one horizontal group in the black masthead, retaining the Load a Book control on the right and the compact bottom player.

## v1.12.62 — 26 October 2026
- Returned the playback controls to a compact fixed strip at the bottom on desktop and mobile, moving the existing controls out of the right-hand voice status panel without recreating or altering their playback logic.

## v1.12.57 — 26 October 2026

- The head-start message now reads "Isabella is getting a head start to read without stopping." (no "he", so it suits every narrator).

## v1.12.56 — 26 October 2026

- Fixed the report wrongly saying "WebAssembly SIMD: No" on every device (the check itself was faulty; it did not affect narration).
- The report now says "None. No errors were recorded." when a voice played without problems.

## v1.12.55 — 26 October 2026

- The full device test now shows a spinning "Test running… X of 30 seconds" notice while it works.
- Copy Report is greyed out until a report exists, then turns yellow so it is easy to spot.

## v1.12.54 — 26 October 2026

- **Full device test.** Tick the box in Settings > AI Compatibility Test, press Play, and the page restarts clean. Press Play again and it plays for about 30 seconds, then writes the report ready to copy.
- If the page crashes during the test (for example an iPad running out of memory), the next visit shows a report saying how far it got and the last thing it was doing.
- The report now also lists CPU cores, screen size, touch points, what Automatic would choose and any saved safety fallback.
- The AI Compatibility Test moved to the bottom of Settings.
- Removed the Experimental Smaller Kokoro option (it could not load).

## v1.12.53 — 26 October 2026
Review fixes after v1.12.52 (no change to the voice engine, Automatic settings or laptop playback behaviour).
- The visible version number said v1.12.51 while the code was v1.12.52; the script links used a mix of version numbers. All now agree.
- **First-speech time is now measured from pressing Play.** On a laptop the engine starts when the page opens, so the old figure included the time before Play was pressed (it could read tens of seconds when it was really about one).
- **The Start now button is fresh for every head start.** After one use it was left disabled and reappeared stuck for the next one.
- **If the page crashed while loading the experimental smaller model, it now returns to Automatic** instead of trying the same model again on the next visit (it was not covered by the crash guard).

## v1.12.52 — 26 October 2026
- Expanded AI Compatibility Test with read-only playback metrics: selected vs actual engine mode, model startup time, first audible speech latency, generation speed, buffered seconds, buffer interruptions, clips played, and audio errors.
- All figures are added to Copy Report. The test does not alter device voice preferences or trigger model loading on its own; press Play before collecting a report.

# E.D.D.i. — Version history

## v1.12.51 — 26 October 2026
- Cap the initial playback head-start wait (12 seconds on phones, 30 seconds elsewhere) so buffering cannot keep narration waiting indefinitely.
- Make **Start now** acknowledge the tap and explain when first-pass speech generation is still pending.
- Include speech-generation and model-preparation failures in the AI Compatibility Report, with clearer first-passage progress text.
- Refresh the `kokoro.js` script URL to ensure devices load the updated controller without stale browser cache.


## v1.12.50 — 26 October 2026
- Updated branding to use the uploaded `eddi-reader-logo-long.png` in the header and `eddi-reader-logo-square.png` as the browser favicon and Apple home-screen icon.
- Added **Copy Report** beside AI Compatibility Test, with clipboard support and a fallback for older iPad browsers.
- The button copies the currently displayed diagnostic report for easy sharing with ChatGPT or Claude; it tells users to run the test first if no report is present.
- Archived supplied debugging screenshots separately, without changing the voice engine.

## v1.12.49 — 26 October 2026
### Experimental Kokoro on older iPads
- Added an **opt-in Experimental Smaller Kokoro (86 MB)** setting under Voice performance, using the official mixed-precision q8f16 ONNX model with CPU/WebAssembly. Keeps the same Kokoro voices.
- Automatic mode and ordinary Fast/Low Memory modes remain unchanged. Existing Low Memory already uses one CPU thread, so simply disabling multithreading again could not resolve the reported error.
- The smaller download **does not guarantee lower runtime RAM usage**; older WebKit browsers may still report out-of-memory or lack required WebAssembly features. This experiment needs a real-device test before being considered compatible.
- AI Compatibility Test from v1.12.48 remains available to capture failure messages.

## v1.12.48 — 26 October 2026
### AI compatibility diagnosis
- Added an **AI Compatibility Test** in the narration settings for older iPads and other devices. It checks key browser features and records the actual Kokoro model-loading error when the reader fails. The test itself does not download the AI model.
- The test is diagnostic only; no replacement speech engine or change to the Kokoro narration quality was made.

### Consolidated recent interface and transfer updates
- Renamed the app **E.D.D.i. — Your FREE AI ePUB Reader**, refreshed the long-logo desktop and mobile layouts, and moved the small version label to the upper-right.
- Added a **Free Books** page with public-domain sources, copyright guidance and information about purchased DRM-free EPUBs.
- Restored **Meet the Narrators**, listing all supported voices with a short sample and a narrator selection button.
- Improved the **Now Reading** page and clarified progress as a percentage and paragraph number; retained optional spoken-word highlighting.
- Added smoother continuous read-ahead indicators and shorter initial buffering defaults.
- Added **Save Book & Progress / Load Book & Progress** (original EPUB + reading position in one ZIP), timestamped filenames, a copyright reminder and simpler cross-device instructions; retained JSON-only bookmark transfers.
- Added browser-native **Save As** for supported browsers, with normal downloads elsewhere.
- All these changes follow the core v1.12.47 release; this entry replaces earlier unnumbered notes.

## v1.12.47 — 25 October 2026
- **“📖 Now Reading” tab is back** (after My Library): it shows the book you are playing, with its chapters, the paragraphs and the yellow word highlight, so you can get back to it from any other page.

## v1.12.46 — 25 October 2026
Long “getting a head start” wait and a Start now button that did nothing (found from your screenshot, MacBook, Emma).
- **Start now works.** The button was being rebuilt every half second, so clicks often landed on a button that had just been replaced. It is now kept in place.
- **The wait is no longer overestimated.** (1) The first passage of a voice includes fetching the voice itself, which made the voice look slow; that passage is now ignored when judging speed. (2) The safety margin was set so that a voice only slightly faster than speech still asked for about 1½ minutes of head start; the margin is now much smaller, so a voice that keeps up with speech starts straight away.

## v1.12.45 — 25 October 2026
- **Shorter passages on phones, tablets and Low Memory setups** (as before v1.12.29), so older devices wait less before each passage and for the first words. Fast computers keep the longer, smoother passages.

## v1.12.44 — 25 October 2026
- **Fixed the play bar flashing while the voice gets a head start (found from your screen recording).** Two messages were fighting over the status line: “Getting ahead so George can read without stopping…” (two lines) and “George is catching up…” (one line), swapping every fraction of a second so the bar kept jumping. The head-start message now has the line to itself.
- **The play bar also stays one line tall.** Its status line used to wrap onto two lines for long messages (such as “Getting ahead so George can read without stopping…”) and then back to one, making the whole bar resize and flicker. It is now always one line, shortened with “…” if needed.

## v1.12.43 — 25 October 2026
- **No more flash at the start on computers using Fast mode.** Fast mode needs the page to reload once to switch on extra processor cores (on a first visit, or after a hard refresh); the page is now kept blank for that moment instead of showing and reloading. If the reload does not happen, the page appears after 4 seconds.

## v1.12.42 — 25 October 2026
- **The progress file now says more:** book title and author, chapter name and number, paragraph, percent read, when you last read it and when the file was saved. Loading is unchanged and still works with older files.
- Removed the “Why I built this” link and note for now.

## v1.12.41 — 25 October 2026
- Added a small “Why I built this” link at the end of the copyright note at the bottom of the page, which opens Tim's note about why EPub Reader exists.

## v1.12.40 — 25 October 2026
- **Removed the “Smooth Listening: prepare ahead” menu.** The reader now chooses automatically: 2 minutes ahead on fast computers, 6 minutes on phones, tablets and Low Memory setups. The head start for slower devices works as before.

## v1.12.39 — 25 October 2026
- **Removed “Prepare a whole chapter” and “Bookmarks & sharing” from Settings for now.** Settings now has the voice performance choice, read-ahead and the yellow-word highlight.

## v1.12.38 — 25 October 2026
- **Narration style removed from Settings.** Everyone gets the natural single-voice narration. Choose the narrator from the Voice menu on the play strip.
- **All British and American Kokoro voices added to the Voice menu** (28 in total: 8 British, 11 American female, 9 American male), best-rated first within each group. The lower-rated ones (grades D and below on the Kokoro voice page) sound less polished.

## v1.12.37 — 25 October 2026
- **Livelier speech is now a little higher as well as quicker.** Quoted speech is generated about 10% quicker and played back about 7% higher in pitch, in the same voice. There is no change of voice at all in either style.

## v1.12.36 — 25 October 2026
- **Narration style now has two choices, both with one voice:** “Natural” (default) and “Natural, same voice with livelier speech” (quoted speech a little quicker). The second-voice acting and Classic choices are removed from the menu. Everyone starts on Natural.

## v1.12.35 — 25 October 2026
- The “livelier speech” style was too subtle to hear. Quoted speech is now about 18% quicker (was 8%), and even short quotes such as “Yes.” are included.

## v1.12.34 — 25 October 2026
- **New narration style: “Natural, same voice with livelier speech”** (Settings → Narration style). The narrator keeps one voice, and quoted speech is spoken about 8% quicker (18% from v1.12.35) with a small pause either side. The second-voice acting style stays the default.

## v1.12.33 — 25 October 2026
- The free Conan book now always shows its cover in My Library (Continue / Start), like your other books, instead of a plain letter.

## v1.12.32 — 25 October 2026
- **The saved progress file is named after the book** (for example “Conan the Barbarian - reading progress.json”) and holds just that book's place, so you can tell your files apart in Dropbox, iCloud or Google Drive. Loading works as before.

## v1.12.31 — 25 October 2026
Simpler layout.
- **Acting is now on by default** (a second voice reads quoted speech), so the "Again with feeling!" button is gone from the play strip. Change it any time in **Settings → Narration style** (acting, one voice, or Classic). Everyone starts on acting again with this version.
- **The right-hand panel is now called Settings** (it was "Performance settings (optional)").
- **Removed the "Now Reading", "Meet the Narrators" and "Listening Tools" tabs.** Opening a book from My Library still takes you to the text. Choose the narrator with the Voice menu on the play strip. **Listening Tools** (highlighting, preparing a chapter, bookmarks) now sit inside **Settings**, under Listening Tools.
- **Simpler play strip:** the "Smooth Listening…" line, the ready-ahead bar and "Next passage" are gone. Smooth Listening still works the same; the only message that still appears is the "Start now" offer when a device needs a head start.
- The Settings panel scrolls when its contents are taller than the screen.

## v1.12.30 — 25 October 2026
- (Replaced in 1.12.31 by a setting.) **“🎭 Again with feeling!” button on the play strip** turned acting on or off: a second voice reads quoted speech. Pressed while reading, it carries on from the start of the current passage. Acting is off by default; the Narration style setting also has it (as “Natural with acting”), plus Classic to go back to the old behaviour.
- Syncing Playback tab now explains in plain words what the progress (JSON) file is, and that it is a standard, safe, text-only note with no program code.
- Graphics-chip messages reworded without technical terms.

## v1.12.29 — 25 October 2026
Aim: make the narration sound less like a computer. Kokoro has no emotion control, so this improves what it can influence: speed, voice and phrasing. Whether it sounds better is a matter of listening; **Settings → Narration style → Classic (previous version)** restores v1.12.28 behaviour exactly.
- **Natural style (default).**
  - **Speed is built into the speech.** Before, the browser sped up finished audio, which sounds robotic above 1×; now the voice itself speaks faster or slower.
  - **A second voice for quoted speech** (same accent and gender: George→Fable, Emma→Isabella, Eric→Michael, Aoede→Bella). Very short quotes stay with the narrator; unclear quotes stay with the narrator.
  - **Smoother phrasing.** Dashes become gentle pauses, "..." becomes an ellipsis, footnote numbers like [3] and stray asterisks are not spoken, and passages are longer so the voice has more context.
  - **Longer pauses** after a paragraph, a chapter heading and at scene breaks ("* * *" lines are a pause, not read out). The page text and yellow highlighting are unchanged.
- **Narration style setting** (Natural / Natural, one voice / Classic) in Settings, and a style choice on Meet the Narrators with a sample containing speech, so you can compare.
- Prepared chapters follow the chosen style. Chapters prepared in v1.12.28 are used in Classic and are prepared again in Natural.
- The old version is also kept as commit 753aab8 (v1.12.28).

## v1.12.28 — 25 October 2026
- Page title is now "EPUB Reader - Turn your EPUB books into audiobooks with natural-sounding AI voices. Read along, save your place, and pick up where you left off.", with the same sentence as the search-result description.

## v1.12.27 — 25 October 2026
Playback stopping/jolting report after v1.12.26. Not reproducible in desktop Chromium with a stand-in voice (gaps between passages stayed around 15 ms), so these are the changes most likely to have caused it on real devices; please confirm on your device.
- **Graphics chip mode is no longer chosen by Automatic.** It is untested on real hardware, so it is an opt-in "experimental" choice again; Automatic goes back to Fast (computers) or Low Memory.
- **The head-start wait is capped at about 2½ minutes.** Before, a slow device could be asked to wait up to 10–20 minutes, which looks like it has stopped. Start now remains available.
- **The voice engine no longer starts at page open on phones and tablets** (it still starts when a book is opened or Play is pressed), to avoid memory pressure there.
- **Saved and parked audio is stored as plain data instead of Blob objects** (more reliable in Safari), and a slow or stuck browser database can no longer delay speech: lookups time out after 0.4 s and parked passages after 1.5 s, then the passage is generated instead.
- The lock-screen "now playing" info is set once per chapter instead of every passage.

## v1.12.26 — 25 October 2026
Faster starts and fewer gaps. Tested in real Chromium with a stand-in voice (42 checks across two suites); real speed on your devices, WebGPU on real hardware and iPhone/iPad Safari are not tested here.
- **Head start instead of repeated pauses.** After the first two passages the reader measures how fast the voice is. If it is slower than your listening speed it works out how much audio must be ready to read the rest without stopping, shows "Getting ahead so George can read without stopping: 1m 05s of 3m 40s ready (about 2m 10s to go)", and starts automatically. A **Start now (may pause)** button skips the wait. In the test (voice at 0.6× speed) reading then had no pauses. A fast voice never waits. Prepared chapters start at once.
- **Graphics chip mode (WebGPU).** New option, and the Automatic choice on a capable computer (not a phone or tablet, 4+ cores, 8 GB+ memory) whose browser supports it. Falls back safely (to Fast, then Low Memory) and remembers what failed. If a page is killed while a heavier mode loads, which phones do without any message, the next visit switches to a lighter option and says so. It can be picked by hand on phones and tablets.
- **Voice engine starts when the page opens** once it has been installed, so Play is near-instant (skipped when the browser asks to save data).
- **Deep read-ahead without memory cost.** Only about 3 minutes (phones) or 6 minutes (computers) of prepared speech stays in memory; the rest is parked in browser storage and removed when played or stopped.
- Fixed: after any fallback the reader quietly turned Automatic into a fixed Low Memory choice on the next visit; Automatic now stays Automatic. The fallback explanation now stays visible while the first passage is prepared.

## v1.12.25 — 25 October 2026
Code-review fixes. Tested in real Chromium with a stand-in voice model (29 checks); not tested on real iPhone/iPad Safari or with the real Kokoro model.
**Playback**
- A failed passage is retried once automatically instead of ending the session.
- About 0.3 s of quiet is added after each paragraph, like an audiobook narrator's breath. The yellow highlight accounts for it.
- Lock-screen and headset controls (Media Session): now-playing title, play/pause, previous/next paragraph. Bedtime mode now also asks the browser to keep the screen on.
**Saved chapters (Listening Tools) rebuilt**
- Saved passages are found by what they say (text fingerprint + narrator), so they can never play against the wrong text after a parser or splitting change. Pressing Play uses them automatically, with highlighting, bookmarks, pause and chapter-to-chapter reading, and without loading the voice engine. The separate "Play prepared chapter" button and its whole-chapter in-memory file (about 100 MB for a long chapter) are gone.
- Added "Delete all saved audio" with a passage count. Audio saved by earlier versions is deleted once to free the space; prepare chapters again if you want them.
**Highlighting**
- Fixed: after Stop then Play, the yellow highlight started in the wrong place in the paragraph.
- Words are timed by length and punctuation instead of evenly.
**Automatic mode**
- Fast is chosen only on a computer with 4+ cores and 8 GB+ memory (when the browser reports it) that can run multi-core; otherwise Low Memory. A Fast failure is remembered, so a failing 326 MB load is not retried every visit (choosing Automatic again resets this).
- Phones and tablets no longer register the helper service worker or reload the page on first visit. Read-ahead is limited to 6 minutes on phones and tablets.
**Mobile and loading**
- Fixed: on phones the player vanished on Meet the Narrators and on any tab after rotating or resizing.
- First-load images cut from 13.7 MB to about 170 KB: the 8 MB candle animation now loads only when Bedtime is pressed, and the logos were resized and compressed. The unused square logo element is gone. The chapter dropdown replaces the duplicate chapter list on phones.
**EPUB**
- Chapter headings inside `<header>` and ordinary `<aside>` text are no longer dropped; footnotes and note markers still are. Badly encoded file names no longer stop a book opening, and a missing description file gives a clear message.
- The free Conan book now appears in My Library once opened, with your place and Continue.
**Clean-up**
- Removed unused files (cloud sync, activity log, benchmark, auto-listen, reader-status, `.DS_Store`), the unused GPU mode, the old browser-voice player and a dead update-check script. One version number is used for all script files so updates are never served stale.

## v1.12.24 — 25 October 2026
- Removed the redundant collapsible book information module from Now Reading, keeping internal status elements for compatibility.
- Moved the yellow spoken-word highlighting checkbox to Listening Tools.
- Kept the mobile playback panel below the reading heading after removal.

## v1.12.23 — 25 October 2026
- Added Next passage status and an animated progress strip beside playback controls.
- Display Preparing while audio generation is pending, Ready when the next clip is generated, and Waiting when inactive. Does not invent a percentage from an AI operation that has no progress reports.

## v1.12.22 — 25 October 2026
- Made continuous background read-ahead the clearly labelled default **Smooth Listening** behaviour when pressing Play; it already existed in the Kokoro player.
- New users default to a two-minute target instead of six minutes; existing readers retain saved preferences. Audio starts after the first available passage rather than waiting for the full target to prepare.
- Reworded the optional full-chapter preparation as an extra for offline listening; no need to use it for normal playback.
- If generation is slower than playback, occasional pauses remain possible.

## v1.12.21 — 25 October 2026
- Removed the technical narration generation-speed advice from the collapsible Now Reading information panel.

## v1.12.20 — 25 October 2026
- Fixed malformed HTML in Now Reading: the collapsible book summary was incorrectly closed with `</h2>` rather than `</summary>`, breaking the browser's parsed page structure and leaving chapter elements unavailable.
- Restores valid panel structure for chapter list, chapter dropdown and highlighted reading text.

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
