## v1.12.308 — 16 November 2026

- Two extra Prosody levels for testing: Theatrical (pauses about twice as long as Natural) and Melodrama (about two and a half times).

## v1.12.307 — 16 November 2026

- Prosody is now a setting with four levels (Off, Subtle, Natural, Dramatic) that scales every pause and the slowing at the end of a paragraph. Four test switches under it: pauses that follow the meaning of each sentence, pace by sentence type, keep two short sentences together, and quicker bracketed asides. (Italic emphasis is not done yet: books lose their italics when imported.)

## v1.12.301 — 15 November 2026

- Removed the two largest voice files (the High versions of Cori and LJSpeech) to keep the project small. The Medium versions of both remain.

## v1.12.300 — 15 November 2026

- Removed the Clean 100 voices (245 speakers) to keep the project small. Piper voices, ManyVoice and Kokoro voices stay. Voice files moved to a fresh copy without Clean 100.

## v1.12.299 — 15 November 2026

- Removed the "Report a problem" link.

## v1.12.298 — 15 November 2026

- New "Report a problem" link at the top right. It opens an email to eddi@gunpowderstudios.co.uk with the device, browser, voice, speed and version already filled in (no book names or text), and also copies the same details so they can be pasted.

## v1.12.297 — 15 November 2026

- If a Piper voice cannot start on a browser, E.D.D.i now switches to the Emma (Kokoro) voice automatically and tells you to press Play again, instead of leaving you stuck.

## v1.12.296 — 14 November 2026

- The slow-device hint now says E.D.D.i instead of George, so it reads correctly with Piper voices too.

## v1.12.263 — 12 November 2026

- The hidden ?mode= test switch no longer accepts the graphics chip, because it froze a MacBook in the full reader. ?mode=fast and ?mode=standard still work.

## v1.12.262 — 12 November 2026

- When George can't keep up with listening, the hint now says so plainly: on a laptop running on battery it asks you to plug in (battery makes speech about half as fast), otherwise it explains he is catching up. The old hint pointed to settings that no longer exist.

## v1.12.261 — 12 November 2026

- Hidden test switch: adding ?mode=gpu (or ?mode=fast, ?mode=standard) to the address tries that voice mode for that visit only. Nothing is saved, and Automatic is unchanged.

## v1.12.260 — 12 November 2026

- The Eddi report now also measures the silent gap between one spoken clip and the next (average, longest, and how many were over 0.4 s), so we can tell hand-off gaps from George being too slow.

## v1.12.251 — 11 November 2026

- Faster first start on computers: the voice now starts downloading as soon as a book is opened, instead of waiting for Play. (Phones still wait for Play. Nothing downloads if the browser is in data-saving mode or you never open a book.)

## v1.12.250 — 11 November 2026

- Fixed slow starts on computers: the new Install Eddi helper was replacing the one that switches on multi-core Fast mode, so George loaded slowly. Both now live in one helper again.

## v1.12.238 — 2 November 2026

- More human pacing: rests now depend on how a sentence ends (question, exclamation, colon, dash, quote), vary very slightly so it doesn't sound like a metronome, and the last sentence of a paragraph is spoken a touch slower. New Settings option: Pause length (Shorter / Normal / Longer / Much longer).

## v1.12.237 — 2 November 2026

- A slightly longer rest after each full stop. On computers George now speaks one sentence at a time (very short ones join the next) with a small pause between them; phones keep their longer passages with the same small pause where a passage ends.

## v1.12.234 — 2 November 2026

- Long book titles in the left panel now shrink and wrap instead of running over the edge.

## v1.12.233 — 2 November 2026

- PDFs with a fancy font that hid scrambled text (such as "5IFO MfuAT...") are now read properly, both in the text view and out loud.

## v1.12.232 — 2 November 2026

- The "E.D.D.i is scanning..." dimming now also shows in full screen PDF reading (it was hidden behind real full screen mode).

## v1.12.231 — 2 November 2026

- The three dots in "E.D.D.i is scanning..." now animate: . then .. then ... on a loop (static dots if the device asks for reduced motion).

## v1.12.230 — 2 November 2026

- The dimmed-screen message now reads "E.D.D.i is scanning..." and stays on screen until George actually starts reading (it also covers the voice loading and the first passage being prepared after you press Play). It goes away when speech starts, when you pause or stop, or if you tap the dimmed screen.

## v1.12.229 — 2 November 2026

- While a book or document is being opened, the whole screen dims and a green "Scanning..." message shows until it is ready. (Very quick opens skip it, so it doesn't flash.)

## v1.12.228 — 2 November 2026

- ALL-CAPS words are now read as words much more reliably, in every format (EPUBs too): BUY, STEAL, DON'T, HE SAID NO, chapter headings and so on. Short and unusual ones that were being spelled out letter by letter are fixed. Acronyms (USA, FBI, BBC, TV, DNA), Roman numerals (XVII) and letter-only names (SHTF) are still spelled out, as before. The page text still shows the original capitals.

## v1.12.226 — 2 November 2026

- PDF charts: when a page has a chart of rows (a name on the left, pictures such as dots in the middle, a short number on the right), each row is now read as "Buy/Sell resources, section 4.2" and highlighted on its own in Page view. The sideways column headings (DEFCON, Green, Yellow, Amber, Section) are no longer read out. The dots themselves cannot be read aloud.

## v1.12.225 — 2 November 2026

- PDFs now open straight into Page view. If you switch to Text view, E.D.D.i remembers that choice for next time (and Page view again resets it).

## v1.12.224 — 2 November 2026

- PDFs in columns: E.D.D.i now spots clear column gaps on a page and reads each column top to bottom (left to right), instead of across the page. Full-width headings and intro text stay in their place, a sentence that runs from one column into the next stays together, and Page view highlights just the column being read. Pages with no clear columns read exactly as before.

## v1.12.223 — 2 November 2026

- Bookmarks: a 🔖 Bookmark button at the top right of the reading page (and in the Page view toolbar). Press it to save your place, press again to remove it. A Bookmarks list under the chapter menu jumps back to any saved place. Bookmarks are saved in this browser for each book, and are included in Save Book & Progress zips so they come with the book to your other devices.

## v1.12.222 — 2 November 2026

- Text view tidied to match Page view: smaller chapter/page heading with tighter gaps, and the Page view button now sits on the same line at the top right (PDFs only).

## v1.12.221 — 2 November 2026

- PDF Page view tidied up: one neat row with the page number (small, left), Back / Next / play / full screen, and the Text view button at the far right. The big page heading is hidden in Page view and the gaps are closed up. On a phone the buttons shrink to icons.

## v1.12.220 — 2 November 2026

- PDF Page view: **Full screen** button (⛶) that fits the whole page on the screen, whether it is a single page or a two-page spread, exactly as designed. Back / Next page buttons, left and right arrow keys, and a swipe on a phone move between pages; there is also a play/pause button. Esc or ✕ leaves full screen (F toggles it).

## v1.12.219 — 2 November 2026

- PDFs: new **Page view** button. It shows the PDF page as it was designed, with a soft green box moving over the paragraph being read (and a switch back to Text view). Tap a paragraph on the page to start reading from there. Only PDFs get the button; other formats are unchanged.

## v1.12.212 — 1 November 2026

- Removed the private Voice Trial page from the Lab. Kokoro stays as the only voice. (The Bench test page is still there.)

## v1.12.211 — 1 November 2026

- Phone: "Back to E.D.D.i" now returns to My Library without reloading the page, and stops the narration. (Reloading could show an empty library until you refreshed.)

## v1.12.210 — 1 November 2026

- Phone reading screen: the book's name now shows at the top in small E.D.D.i green.

## v1.12.209 — 1 November 2026

- Phones and tablets: the screen now stays awake while E.D.D.i is reading aloud, so it doesn't dim and lock and stop the voice. It lets go as soon as you pause. (Locking the phone yourself can still stop it on some phones.)

## v1.12.208 — 1 November 2026

- The main Upload button now recognises a zipped book and progress file from Syncing Playback and opens it (book and place), just like the Load Book & Progress button.

## v1.12.207 — 1 November 2026

- Removed the Bedtime feature everywhere (the button on the player, the Bedtime button on the phone play strip, the B shortcut and the black candle screen). Space still pauses and resumes. The phone strip now just has the Back to E.D.D.i button.

## v1.12.206 — 1 November 2026

- Mobile welcome: "Try anyway" now takes you to My Library.

## v1.12.205 — 1 November 2026

- Mobile welcome message now says: "E.D.D.i is still learning about mobiles and he works better when plugged in…", with the button "Try anyway".

## v1.12.204 — 1 November 2026

- Phone play strip: "← Back to E.D.D.i" now sits on the left of "🕯 Bedtime", both on one line.
- Phone: a flashing 🔌 now shows in the play strip while the phone is running on battery (only in browsers that can tell, such as Chrome on Android; iPhone Safari cannot).
- Phone: tap the play strip (anywhere that isn't a button) to tuck it away, giving more room for text. A small bar stays at the bottom; tap it to bring the strip back.
- Computer: the Upload button and its "Choose a book or document" note now sit in the right-hand column under Current reader.

