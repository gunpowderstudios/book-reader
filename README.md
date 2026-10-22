# Chapter & Verse — EPUB Audiobook Reader

A free browser-based audiobook reader for DRM-free EPUB files. Runs on GitHub Pages with no build step, account, or server-side book upload.

## Use

1. Open the deployed website.
2. Select **Open EPUB** and choose a DRM-free `.epub` from your device.
3. Select a voice and reading speed, then press **Play**.
4. Pause or navigate paragraphs and chapters. Your bookmark is saved locally; reopen the same book on your next visit to restore it.

Your EPUB file is processed locally in the browser. ZIP parsing uses JSZip from a public CDN, so an internet connection is needed for that library. Speech uses browser text-to-speech and available system voices. Background or lock-screen playback may not work on all devices.

## Publish

In this GitHub repository, open **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, then save. The expected public URL is:

https://gunpowderstudios.github.io/book-reader/

## Limitations

DRM-protected EPUBs aren't supported, and available voices differ by browser and device. The browser may interrupt long passages or playback when the screen is locked. No audiobook MP3 is generated.

## Kokoro AI narration (George)

Press Play to be read to by **George** (Kokoro AI, British male). The first time, your browser downloads the free quantized Kokoro model (roughly 90 MB), then generates speech locally. This may take a while, especially on older devices. An internet connection is needed initially for the model and JS library. Subsequent visits reuse the cached weights.

Open the **Test a Voice** tab to check George without an EPUB: edit the sample text, press Play, and watch the loading, generating and playing states. Repeating the same text plays instantly from memory.

George uses the `bm_george` British voice of Kokoro 82M via `kokoro-js`. All speech generation runs in a Web Worker (`kokoro-worker.js`) on your own device, so the page stays responsive; nothing is sent to a paid speech API. Generation speed depends on your computer. The first visit after upgrading may need a hard refresh.

Files: `index.html` (reader and interface), `kokoro.js` (playback, queue and cache), `kokoro-worker.js` (model and inference).

## Audiobook maker (no pauses, plays anywhere)

The browser reader generates speech while you listen, which needs a fast computer. For phones, tablets and long books, use the tool in [`audiobook/`](audiobook/): it turns an EPUB into a finished `.m4b` audiobook read by George, once, on your own computer. See [audiobook/README.md](audiobook/README.md).
