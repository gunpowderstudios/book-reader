#!/usr/bin/env python3
"""Chapter & Verse — turn a DRM-free EPUB into an audiobook, read by Kokoro AI's George.

Runs entirely on your own computer: no accounts, no API keys, no paid services.
Output is a single .m4b audiobook with chapters (best for Apple Books on iPhone, iPad and Mac)
or a folder of per-chapter .mp3 files.

    python make_audiobook.py mybook.epub
    python make_audiobook.py mybook.epub --list          # show chapters, make nothing
    python make_audiobook.py mybook.epub --chapters 1-2  # quick sample
    python make_audiobook.py --benchmark                 # how fast is this computer?
"""
import argparse
import html.parser
import json
import multiprocessing
import os
import posixpath
import re
import shutil
import signal
import ssl
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

VERSION = "1.0.0"
SAMPLE_RATE = 24000
MODEL_BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL_FILES = {"int8": "kokoro-v1.0.int8.onnx", "fp16": "kokoro-v1.0.fp16.onnx", "fp32": "kokoro-v1.0.onnx"}
VOICES_FILE = "voices-v1.0.bin"
MIN_BYTES = {"kokoro-v1.0.int8.onnx": 80e6, "kokoro-v1.0.fp16.onnx": 150e6, "kokoro-v1.0.onnx": 300e6, VOICES_FILE: 25e6}
CHARS_PER_SECOND = 14.0  # rough speaking rate at speed 1.0, only used for estimates


class UserError(Exception):
    """A problem the user can fix; shown without a traceback."""


# ───────────────────────── EPUB reading ─────────────────────────
BLOCK = {"p", "div", "li", "ul", "ol", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article",
         "tr", "td", "th", "dd", "dt", "pre", "figcaption", "caption", "table", "hr", "header", "footer"}
SKIP = {"script", "style", "nav", "svg", "head", "noscript", "aside"}
HEADINGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
FONT_OBFUSCATION = ("http://www.idpf.org/2008/embedding", "http://ns.adobe.com/pdf/enc#RC")


def norm(s):
    return re.sub(r"\s+", " ", s.replace(" ", " ").replace("​", "")).strip()


class TextExtractor(html.parser.HTMLParser):
    """Collects readable paragraphs from XHTML, remembering which ones are headings."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paragraphs, self.buf, self.skip, self.heading = [], [], 0, 0

    def flush(self):
        text = norm("".join(self.buf))
        self.buf = []
        if text:
            self.paragraphs.append((text, self.heading > 0))

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip += 1
        elif self.skip:
            return
        elif tag == "br":
            self.buf.append(" ")
        elif tag in BLOCK:
            self.flush()
            if tag in HEADINGS:
                self.heading += 1

    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1)
        elif self.skip:
            return
        elif tag in BLOCK:
            self.flush()
            if tag in HEADINGS:
                self.heading = max(0, self.heading - 1)

    def handle_data(self, data):
        if not self.skip:
            self.buf.append(data)


def extract_paragraphs(markup):
    p = TextExtractor()
    p.feed(markup)
    p.close()
    p.flush()
    return p.paragraphs


def make_title(paragraphs, fallback):
    lead = []
    for text, is_heading in paragraphs[:3]:
        if is_heading and len(text) < 95:
            lead.append(text)
        else:
            break
    if lead:
        return ": ".join(lead[:2])
    if paragraphs and len(paragraphs[0][0]) < 95:
        return paragraphs[0][0]
    return fallback


def read_epub(path):
    try:
        z = zipfile.ZipFile(path)
    except (zipfile.BadZipFile, FileNotFoundError, IsADirectoryError) as e:
        raise UserError(f"Cannot open {path} as an EPUB ({e}).")
    names = set(z.namelist())
    if "META-INF/container.xml" not in names:
        raise UserError("This does not look like an EPUB (no META-INF/container.xml).")
    if "META-INF/encryption.xml" in names:
        enc = ET.fromstring(z.read("META-INF/encryption.xml"))
        algos = [e.get("Algorithm", "") for e in enc.iter() if e.tag.endswith("EncryptionMethod")]
        if any(not a.startswith(FONT_OBFUSCATION) for a in algos):
            raise UserError("This EPUB is DRM-protected, so it cannot be read. Only DRM-free EPUBs are supported.")
    rootfile = ET.fromstring(z.read("META-INF/container.xml")).find(".//{*}rootfile").get("full-path")
    opf = ET.fromstring(z.read(rootfile))
    base = posixpath.dirname(rootfile)

    def locate(href):
        return posixpath.normpath(posixpath.join(base, urllib.parse.unquote(href.split("#")[0])))

    manifest = {}
    for item in opf.findall(".//{*}manifest/{*}item"):
        manifest[item.get("id")] = (item.get("href", ""), item.get("media-type", ""), item.get("properties", ""))

    def meta_text(tag):
        el = opf.find(f".//{{*}}metadata/{{*}}{tag}")
        return norm(el.text or "") if el is not None else ""

    title, author = meta_text("title"), meta_text("creator")

    cover = None
    cover_id = next((m.get("content") for m in opf.findall(".//{*}metadata/{*}meta") if m.get("name") == "cover"), None)
    cover_item = manifest.get(cover_id) or next((v for v in manifest.values() if "cover-image" in v[2]), None)
    if cover_item and cover_item[1] in ("image/jpeg", "image/png") and locate(cover_item[0]) in names:
        cover = (z.read(locate(cover_item[0])), ".png" if cover_item[1] == "image/png" else ".jpg")

    chapters = []
    for ref in opf.findall(".//{*}spine/{*}itemref"):
        entry = manifest.get(ref.get("idref"))
        if not entry or "html" not in entry[1]:
            continue
        member = locate(entry[0])
        if member not in names:
            continue
        paragraphs = extract_paragraphs(z.read(member).decode("utf-8", errors="replace"))
        if paragraphs:
            chapters.append(paragraphs)

    # A whole book in one file: split at its headings so chapters (and bookmarks) still make sense.
    expanded = []
    for paragraphs in chapters:
        if sum(len(t) for t, _ in paragraphs) > 60000 and sum(1 for _, h in paragraphs if h) >= 3:
            current = []
            for item in paragraphs:
                if item[1] and current and any(not h for _, h in current):
                    expanded.append(current)
                    current = []
                current.append(item)
            if current:
                expanded.append(current)
        else:
            expanded.append(paragraphs)

    result = []
    for i, paragraphs in enumerate(expanded, 1):
        result.append({"n": i, "title": make_title(paragraphs, f"Section {i}"), "paragraphs": paragraphs,
                       "chars": sum(len(t) for t, _ in paragraphs)})
    return {"title": title or Path(path).stem, "author": author, "chapters": result, "cover": cover}


# ───────────────────────── Text planning ─────────────────────────
ABBR = re.compile(r"\b(?:Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|vs|etc|No|Mt|Capt|Col|Gen|Lt|Sgt)\.$")


def sentences(text):
    raw = re.findall(r"[^.!?…]+(?:[.!?…]+[\"'”’)\]]*|$)\s*", text) or [text]
    out = []
    for piece in raw:
        if out and ABBR.search(out[-1].strip()):
            out[-1] += piece
        else:
            out.append(piece)
    return [s.strip() for s in out if s.strip()]


def group(text, limit=700):
    """Whole sentences, grouped into tasks of at most `limit` characters (so work spreads across processes)."""
    groups, buf = [], ""
    for s in sentences(text):
        if buf and len(buf) + len(s) + 1 > limit:
            groups.append(buf)
            buf = ""
        buf = f"{buf} {s}".strip()
    if buf:
        groups.append(buf)
    return groups


def clean_for_speech(text):
    return norm(re.sub(r"\[\d{1,3}\]", "", text))


def plan(chapter):
    """[(text, pause_after_seconds)] for one chapter; paragraphs and headings get longer pauses."""
    tasks = []
    for text, is_heading in chapter["paragraphs"]:
        text = clean_for_speech(text)
        if not re.search(r"\w", text):  # scene-break marks such as "* * *": no speech, a longer pause
            if tasks:
                tasks[-1] = (tasks[-1][0], max(tasks[-1][1], 1.2))
            continue
        if is_heading and text[-1] not in ".!?…:":
            text += "."
        parts = group(text)
        for i, part in enumerate(parts):
            last = i == len(parts) - 1
            tasks.append((part, (1.0 if is_heading else 0.7) if last else 0.25))
    return tasks


# ───────────────────────── Models ─────────────────────────
def ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        return ssl.create_default_context()


def fetch(name, directory):
    dest = directory / name
    if dest.exists() and dest.stat().st_size >= MIN_BYTES[name]:
        return dest
    directory.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    print(f"Downloading {name} (one-time, kept in {directory}) …")
    req = urllib.request.Request(MODEL_BASE + name, headers={"User-Agent": "chapter-and-verse"})
    try:
        with urllib.request.urlopen(req, context=ssl_context(), timeout=60) as r, open(part, "wb") as f:
            total, done, last = int(r.headers.get("Content-Length") or 0), 0, 0.0
            while True:
                block = r.read(1 << 20)
                if not block:
                    break
                f.write(block)
                done += len(block)
                if time.time() - last > 0.5 and sys.stdout.isatty():
                    last = time.time()
                    print(f"\r  {done / 1e6:.0f}" + (f" / {total / 1e6:.0f}" if total else "") + " MB", end="", flush=True)
        if sys.stdout.isatty():
            print()
    except Exception as e:
        raise UserError(f"Could not download {name}: {e}\nCheck your internet connection, or download it from\n"
                        f"{MODEL_BASE}{name}\nand put it in {directory}")
    if part.stat().st_size < MIN_BYTES[name]:
        part.unlink()
        raise UserError(f"The download of {name} looks incomplete; please run again.")
    os.replace(part, dest)
    return dest


# ───────────────────────── Synthesis (worker processes) ─────────────────────────
_kokoro = None
_cfg = {}


def _init_worker(model_path, voices_path, voice, speed, lang, ignore_sigint=True):
    global _kokoro, _cfg
    if ignore_sigint:
        signal.signal(signal.SIGINT, signal.SIG_IGN)  # the parent handles Ctrl-C
    import onnxruntime as ort
    from kokoro_onnx import Kokoro
    opts = ort.SessionOptions()
    opts.intra_op_num_threads = 1  # one thread per process; several processes scale better than many threads
    opts.inter_op_num_threads = 1
    session = ort.InferenceSession(str(model_path), sess_options=opts, providers=["CPUExecutionProvider"])
    _kokoro = Kokoro.from_session(session, str(voices_path))
    _cfg = {"voice": voice, "speed": speed, "lang": lang}


def _synthesize(task):
    import numpy as np
    text, pause = task
    try:
        audio, _ = _kokoro.create(text, voice=_cfg["voice"], speed=_cfg["speed"], lang=_cfg["lang"])
        return np.asarray(audio, dtype=np.float32), pause, None
    except Exception as e:  # one odd passage must not ruin a whole book
        return np.zeros(0, dtype=np.float32), pause, f"{e.__class__.__name__}: {e} — {text[:60]!r}"


def to_int16(audio):
    import numpy as np
    return (np.clip(audio, -1.0, 1.0) * 32767.0).astype("<i2")


def silence(seconds):
    import numpy as np
    return np.zeros(int(seconds * SAMPLE_RATE), dtype="<i2")


# ───────────────────────── Encoding ─────────────────────────
def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        raise UserError("ffmpeg was not found. Run:  pip install imageio-ffmpeg   (or install ffmpeg, e.g. brew install ffmpeg)")


class Encoder:
    """Streams raw 16-bit audio into ffmpeg and writes the finished file atomically."""

    def __init__(self, ffmpeg, dest, fmt, bitrate, tags):
        self.dest, self.part = str(dest), str(dest) + ".part"
        args = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1",
                "-i", "-", "-ar", "44100", "-ac", "1"]
        if fmt == "mp3":
            args += ["-c:a", "libmp3lame", "-b:a", bitrate, "-id3v2_version", "3"]
            for k, v in tags.items():
                args += ["-metadata", f"{k}={v}"]
            args += ["-f", "mp3"]
        else:
            args += ["-c:a", "aac", "-b:a", bitrate, "-f", "ipod"]
        self.proc = subprocess.Popen(args + [self.part], stdin=subprocess.PIPE)
        self.samples = 0

    def write(self, pcm):
        try:
            self.proc.stdin.write(pcm.tobytes())
        except BrokenPipeError:
            raise UserError("ffmpeg stopped unexpectedly while encoding (see its message above).")
        self.samples += len(pcm)

    def close(self):
        self.proc.stdin.close()
        if self.proc.wait() != 0:
            raise UserError("ffmpeg failed while encoding audio (see its message above).")
        os.replace(self.part, self.dest)
        return self.samples / SAMPLE_RATE


def ffmeta_escape(s):
    return re.sub(r"([=;#\\\n])", r"\\\1", s)


def build_m4b(ffmpeg, parts, book, dest, cover_path):
    """parts = [(path, title, seconds)] → one .m4b with chapters, no re-encoding."""
    work = Path(dest).parent
    listing, meta = work / ".concat.txt", work / ".chapters.txt"
    listing.write_text("".join("file '" + str(p).replace("'", "'\\''") + "'\n" for p, _, _ in parts))
    lines = [";FFMETADATA1", f"title={ffmeta_escape(book['title'])}", f"album={ffmeta_escape(book['title'])}",
             "genre=Audiobook"]
    if book["author"]:
        lines += [f"artist={ffmeta_escape(book['author'])}", f"album_artist={ffmeta_escape(book['author'])}"]
    start = 0.0
    for _, title, seconds in parts:
        end = start + seconds
        lines += ["[CHAPTER]", "TIMEBASE=1/1000", f"START={int(start * 1000)}", f"END={int(end * 1000)}",
                  f"title={ffmeta_escape(title)}"]
        start = end
    meta.write_text("\n".join(lines) + "\n", encoding="utf-8")
    cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
           "-i", str(meta)]
    if cover_path:
        cmd += ["-i", str(cover_path)]
    cmd += ["-map", "0:a", "-map_metadata", "1", "-map_chapters", "1"]
    if cover_path:
        cmd += ["-map", "2:v", "-c:v", "copy", "-disposition:v:0", "attached_pic"]
    cmd += ["-c:a", "copy", "-f", "ipod", str(dest) + ".part"]
    if subprocess.run(cmd).returncode != 0:
        raise UserError("ffmpeg could not assemble the audiobook (see its message above).")
    os.replace(str(dest) + ".part", dest)
    listing.unlink(missing_ok=True)
    meta.unlink(missing_ok=True)


# ───────────────────────── Command line ─────────────────────────
def parse_selection(text, count):
    chosen = set()
    for piece in text.split(","):
        piece = piece.strip()
        if not piece:
            continue
        a, _, b = piece.partition("-")
        try:
            lo, hi = int(a), int(b or a)
        except ValueError:
            raise UserError(f"Cannot understand --chapters {text!r}; use something like 3, 2-5 or 1,4,6-8.")
        chosen.update(range(lo, hi + 1))
    return {n for n in chosen if 1 <= n <= count}


def slug(s):
    return re.sub(r"[^\w\- .]+", "", s).strip().strip(".")[:80] or "audiobook"


def fmt_time(seconds):
    seconds = int(max(0, seconds))
    h, m = divmod(seconds // 60, 60)
    return f"{h}h {m:02d}m" if h else f"{m}m {seconds % 60:02d}s"


def default_workers():
    cores = os.cpu_count() or 2
    return max(1, min(cores - 1, 6))


def benchmark(args, model_path, voices_path, lang):
    import numpy as np
    sample = ("In the gathering darkness, a lone rider approached the ancient castle. Beyond its gates, a forgotten "
              "secret was waiting to be discovered. The wind carried the smell of rain across the moor.")
    _init_worker(model_path, voices_path, args.voice, args.speed, lang, ignore_sigint=False)
    _synthesize(("Warm up.", 0))
    t = time.time()
    audio, _, err = _synthesize((sample, 0))
    took = time.time() - t
    if err:
        raise UserError("Benchmark failed: " + err)
    seconds = len(audio) / SAMPLE_RATE
    one = seconds / took
    print(f"One worker makes speech at {one:.2f}× real time ({seconds:.1f} s of audio in {took:.1f} s).")
    est = one * args.workers * 0.8
    print(f"With {args.workers} workers expect roughly {est:.1f}× real time, i.e. about {60 / est:.0f} minutes of "
          f"computing per hour of audiobook. (Rough estimate.)")
    return one


def main(argv=None):
    ap = argparse.ArgumentParser(description="Turn a DRM-free EPUB into an audiobook read by Kokoro AI.")
    ap.add_argument("epub", nargs="?", help="the EPUB file")
    ap.add_argument("-o", "--output", help="output folder (default: next to the EPUB)")
    ap.add_argument("--voice", default="bm_george", help="Kokoro voice id (default bm_george, British male)")
    ap.add_argument("--speed", type=float, default=1.0, help="speaking speed, 0.5–1.5 (default 1.0)")
    ap.add_argument("--format", choices=["m4b", "mp3"], default="m4b",
                    help="m4b: one audiobook with chapters (default); mp3: one file per chapter")
    ap.add_argument("--workers", type=int, default=default_workers(), help="parallel processes (default %(default)s)")
    ap.add_argument("--model", choices=sorted(MODEL_FILES), default="int8", help="int8 is smallest; fp32 is the original")
    ap.add_argument("--bitrate", default="64k", help="audio bitrate (default 64k, plenty for speech)")
    ap.add_argument("--chapters", help="only these chapters, e.g. 1-3 or 2,5 (use --list to see numbers)")
    ap.add_argument("--min-chars", type=int, default=200, help="skip sections shorter than this (default 200)")
    ap.add_argument("--list", action="store_true", help="list chapters and estimated length, then stop")
    ap.add_argument("--benchmark", action="store_true", help="measure this computer's speed, then stop")
    ap.add_argument("--force", action="store_true", help="redo chapters that were already finished")
    ap.add_argument("--keep-parts", action="store_true", help="keep the per-chapter working files")
    ap.add_argument("--model-dir", default=str(Path.home() / ".cache" / "chapter-and-verse"))
    ap.add_argument("--version", action="version", version=VERSION)
    args = ap.parse_args(argv)

    if not args.epub and not args.benchmark:
        ap.error("give an EPUB file (or use --benchmark)")
    if not 0.5 <= args.speed <= 1.5:
        raise UserError("--speed must be between 0.5 and 1.5")
    args.workers = max(1, args.workers)
    lang = "en-gb" if args.voice[:2] in ("bm", "bf") else "en-us"

    book, chapters = None, []
    if args.epub:
        book = read_epub(args.epub)
        keep = parse_selection(args.chapters, len(book["chapters"])) if args.chapters else None
        for ch in book["chapters"]:
            ch["skip"] = None
            if ch["chars"] < args.min_chars:
                ch["skip"] = "too short"
            elif keep is not None and ch["n"] not in keep:
                ch["skip"] = "not selected"
        chapters = [c for c in book["chapters"] if not c["skip"]]
        print(f"{book['title']}" + (f" — {book['author']}" if book["author"] else ""))
        total = sum(c["chars"] for c in chapters)
        if args.list:
            for ch in book["chapters"]:
                est = ch["chars"] / CHARS_PER_SECOND / args.speed
                note = f"  (skipped: {ch['skip']})" if ch["skip"] else ""
                print(f"  {ch['n']:3d}  {ch['title'][:60]:<60} {ch['chars']:>7} chars  ~{fmt_time(est)}{note}")
        print(f"{len(chapters)} chapters to read, about {fmt_time(total / CHARS_PER_SECOND / args.speed)} of audio.")
        if args.list:
            return 0
        if not chapters:
            raise UserError("Nothing to read: no chapters selected (try --min-chars 0 or check --chapters).")

    model_dir = Path(args.model_dir)
    model_path = fetch(MODEL_FILES[args.model], model_dir)
    voices_path = fetch(VOICES_FILE, model_dir)
    import numpy as np
    if args.voice not in np.load(voices_path).files:
        raise UserError(f"Unknown voice {args.voice!r}. Examples: bm_george, bm_lewis, bf_emma, af_heart.")

    if args.benchmark:
        benchmark(args, model_path, voices_path, lang)
        return 0

    ffmpeg = find_ffmpeg()
    out_dir = (Path(args.output) if args.output else Path(args.epub).parent).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    name = slug(book["title"])
    work = (out_dir / name) if args.format == "mp3" else (out_dir / f".{name}-parts")
    work.mkdir(parents=True, exist_ok=True)
    ext = "mp3" if args.format == "mp3" else "m4a"

    total_chars = sum(c["chars"] for c in chapters)
    print(f"Voice {args.voice}, model {args.model}, {args.workers} worker(s), output {args.format}. "
          f"Press Ctrl-C any time; run the same command again to continue.")
    started, chars_done, parts, problems = time.time(), 0, [], []
    # "spawn" gives each worker a clean start. (With "fork", workers started after ffmpeg inherit a copy of its
    # input pipe, so ffmpeg never sees end-of-file and the run hangs. macOS already uses spawn.)
    pool = ProcessPoolExecutor(max_workers=args.workers, mp_context=multiprocessing.get_context("spawn"),
                               initializer=_init_worker,
                               initargs=(model_path, voices_path, args.voice, args.speed, lang))
    try:
        for index, ch in enumerate(chapters, 1):
            stem = f"{ch['n']:03d} - {slug(ch['title'])}" if args.format == "mp3" else f"{ch['n']:03d}"
            dest, side = work / f"{stem}.{ext}", work / f"{ch['n']:03d}.json"
            if dest.exists() and not args.force and (args.format == "mp3" or side.exists()):
                seconds = json.loads(side.read_text())["seconds"] if side.exists() else 0
                parts.append((dest, ch["title"], seconds))
                chars_done += ch["chars"]
                print(f"[{index}/{len(chapters)}] {ch['title'][:50]} — already done")
                continue
            tasks = plan(ch)
            tags = {"title": ch["title"], "artist": book["author"], "album": book["title"],
                    "track": f"{index}/{len(chapters)}", "genre": "Audiobook"}
            enc = Encoder(ffmpeg, dest, args.format, args.bitrate, tags)
            t0, done = time.time(), 0
            try:
                for audio, pause, err in pool.map(_synthesize, tasks, chunksize=1):
                    if err:
                        problems.append(err)
                    if len(audio):
                        enc.write(to_int16(audio))
                    enc.write(silence(pause))
                    done += 1
                    if sys.stdout.isatty():
                        print(f"\r[{index}/{len(chapters)}] {ch['title'][:40]} … {done * 100 // len(tasks)}%", end="", flush=True)
                enc.write(silence(1.0))
                seconds = enc.close()
            except BaseException:
                enc.proc.kill()
                Path(enc.part).unlink(missing_ok=True)
                raise
            if args.format == "m4b":
                side.write_text(json.dumps({"seconds": seconds}))  # chapter lengths, needed to resume an .m4b
            parts.append((dest, ch["title"], seconds))
            chars_done += ch["chars"]
            took = time.time() - t0
            left = (time.time() - started) / max(chars_done, 1) * (total_chars - chars_done)
            print(f"\r[{index}/{len(chapters)}] {ch['title'][:40]:<40} {fmt_time(seconds)} of audio in "
                  f"{fmt_time(took)} ({seconds / max(took, 0.1):.1f}× real time)"
                  + (f" — about {fmt_time(left)} left" if index < len(chapters) else "") + " " * 8)
    except KeyboardInterrupt:
        pool.shutdown(wait=False, cancel_futures=True)
        print("\nStopped. Run the same command again to continue where you left off.")
        return 130
    finally:
        pool.shutdown(wait=False, cancel_futures=True)

    if args.format == "m4b":
        cover_path = None
        if book["cover"]:
            cover_path = work / ("cover" + book["cover"][1])
            cover_path.write_bytes(book["cover"][0])
        final = out_dir / f"{name}.m4b"
        build_m4b(ffmpeg, parts, book, final, cover_path)
        if not args.keep_parts:
            shutil.rmtree(work, ignore_errors=True)
        print(f"\nDone: {final}  ({fmt_time(sum(s for _, _, s in parts))} of audio, {len(parts)} chapters)")
    else:
        print(f"\nDone: {work}  ({len(parts)} MP3 files)")
    if problems:
        print(f"\n{len(problems)} passage(s) could not be read aloud and were skipped, for example:")
        for p in problems[:5]:
            print("  -", p)
    print(f"Total time {fmt_time(time.time() - started)}.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except UserError as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)
