# Make an audiobook (George, no pauses)

`make_audiobook.py` turns a DRM-free EPUB into a finished audiobook read by Kokoro AI's **George** (British male) — once, on your own computer. You then listen anywhere with any audio player: no waiting for speech to be generated, no pauses, lock-screen controls, works offline.

It is free and local: no accounts, no API keys, nothing is uploaded.

## One-time setup (Mac)

You need Python 3.10 or newer (`python3 --version`; if it is older, `brew install python`).

```bash
cd path/to/book-reader/audiobook
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Next time, just `cd` back and run `source .venv/bin/activate` first.

## Make a book

```bash
python make_audiobook.py ~/Downloads/mybook.epub --list           # see the chapters, make nothing
python make_audiobook.py ~/Downloads/mybook.epub --chapters 1     # a quick sample of chapter 1
python make_audiobook.py ~/Downloads/mybook.epub                  # the whole book
```

The first run downloads the voice model once (about 120 MB, kept in `~/.cache/chapter-and-verse`). The finished `mybook.m4b` appears next to the EPUB, with chapters and cover art.

- **It can be stopped and resumed.** Press Ctrl-C, or let the Mac sleep, then run the same command again; finished chapters are kept.
- **Long books:** use `caffeinate -i python make_audiobook.py mybook.epub` so the Mac does not sleep, and leave it running (overnight is fine).
- **How long will it take?** Run `python make_audiobook.py --benchmark`. For reference, on a plain 2-core cloud machine the whole pipeline made speech at about 1.6–2× real time, so a one-hour audiobook took roughly 30–40 minutes. Computers with more cores are faster, because chapters are read by several workers at once. Use `--workers 3` if your Mac feels sluggish while it runs.

## Listen on your iPhone, iPad and Mac

Open the `.m4b` in **Apple Books**: double-click it on the Mac, or drag it onto the Books app. It appears under Audiobooks with its chapters. With Books syncing turned on for the same Apple Account, it should appear on your iPhone and iPad too; otherwise AirDrop the file to the device and choose Books. Books remembers your place and plays with the screen locked, which makes it ideal in bed. Any other audiobook player that supports `.m4b` also works.

I could not test on Apple devices from where this was built; the file itself was checked with ffmpeg (chapters, cover art, tags and duration are all present and correct).

## Options

| Option | What it does |
|---|---|
| `--list` | Show chapters and estimated length, then stop |
| `--chapters 1-3` or `2,5` | Only some chapters (good for samples) |
| `--format mp3` | One MP3 per chapter in a folder, instead of one `.m4b` |
| `--voice bm_lewis` | Another Kokoro voice (e.g. `bf_emma`, `af_heart`); default `bm_george` |
| `--speed 1.1` | Speaking speed, 0.5–1.5 (you can also change speed in the player) |
| `--workers N` | Parallel processes (default: your cores minus one, at most 6) |
| `-o FOLDER` | Where to put the result (default: next to the EPUB) |
| `--min-chars N` | Skip sections shorter than this, such as title pages (default 200) |
| `--force` | Redo chapters that are already finished |
| `--model fp32` | The larger original model instead of the small 8-bit one |

## What it does with your book

Reads the EPUB's chapters in order, skips contents that should not be read aloud (navigation, side notes, images), drops footnote markers like `[3]`, reads headings as chapter titles, pauses a little longer between paragraphs and at scene breaks, and keeps abbreviations such as "Mr." and "Dr." intact. Chapter names come from the book's headings. DRM-protected EPUBs are not supported.
