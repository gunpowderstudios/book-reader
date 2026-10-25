# Book Reader — EPUB audiobook reader

A free browser-based reader that turns DRM-free EPUB books into spoken audiobooks using Kokoro AI voices, with yellow word-by-word highlighting. Runs on GitHub Pages with no build step, account or paid service. Your books never leave your device.

Live: https://gunpowderstudios.github.io/book-reader/

## Use
1. Open the site and load a book (or open the free Conan book). It is saved in **My Library** on this device with your place.
2. Press **Play**. The first time, the voice model downloads once (about 92 MB, or 326 MB in Fast mode); the browser keeps it afterwards.
3. Smooth Listening prepares the next minutes of speech while you listen. Use Pause, the chapter menu, bookmarks and the speed slider as needed.

## Good to know
- **Performance settings** default to Automatic: Fast on a capable computer, Low Memory on phones, tablets and older machines. If a mode fails, the reader falls back to the lighter one and remembers it.
- **Listening Tools** can prepare a whole chapter ahead of time (Play then uses it automatically), save bookmarks and share your place, and save/load a small progress file to move your place between devices.
- If the voice cannot keep up with speech on a device, short pauses can happen. Preparing the chapter, or making an audiobook with [`audiobook/`](audiobook/), avoids them.
- Saved books, places and prepared audio are per browser and device. Private browsing blocks saving.

## Files
`index.html` (interface and EPUB reading), `kokoro.js` (playback, read-ahead and memory), `kokoro-worker.js` (voice model, runs off the main thread), `library.js` (My Library), `offline.js` (prepared chapters), `read-along.js` (highlighting), `bookmarks.js`, `coi-sw.js` (enables multi-core for Fast mode on GitHub Pages), `audiobook/` (optional offline audiobook maker).

DRM-protected EPUBs are not supported. Voices: Kokoro 82M via `kokoro-js` (voice and library load from public CDNs).
