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
| User's iPhone 13, Chrome iOS | 1.22 | Auto → Standard CPU | **Benchmark A: full first paragraph, 1 chunk** | **23.02 sec for 11.05 sec audio (0.48× real-time)** | **29.748 sec** | Completed, 0 clock anomalies and 0 underruns; voice engine ready in 6.393 sec. Awaiting Benchmark B with same paragraph split into 3 chunks. |
| User's iPhone 13, Chrome iOS | 1.21 | Auto → Standard CPU, 1 thread | **Norwood Welcome, 6 passages** | **145.80 sec for 62.05 sec audio (0.43× real-time)** | **29.549 sec** | **Completed, but 5 buffer underruns**. Between-passage delays 12.404, 11.576, 10.829, 17.027, 16.999 sec (avg 13.767 sec). **0 intra-passage audio stalls and 0 clock anomalies**. Model ready in 5.908 sec; generation takes 20.72–28.43 sec/passage. Subjective audibility/smoothness on this particular six-passage run not yet explicitly confirmed. |
| User's iPhone 13, Chrome iOS | 1.21 | Auto → Standard CPU, 1 thread | **Mobile quick test, 1 short sentence** | 8.91 sec for 4.85 sec audio (0.54×) | 15.857 sec | **Success, audible through AirPods (confirmed by user)**; 0 anomalies, 0 underruns; 5.58 sec wall-clock playback vs 4.85 sec media. Audio manually unlocked. |

Earlier MacBook GPU unrestricted repeats in lab v1.11–1.14 also exhibited ~18–24 seconds of playback delay during passage 11 generation; this is a reproducible warning, not a general rule about all GPU-equipped computers.

## Open investigations / test plan

- **MacBook M2 Chrome**: v1.16+ GPU **3 passages ahead** experimental mode, Full Tour, compare to known unrestricted GPU failure. This test has not yet been received.
- **Mac Studio**: GPU 3-ahead vs unlimited; optional Fast CPU performance comparator.
- **Simon's MacBook Pro**: repeat Auto to determine whether 25-second engine load was one-off; confirm subjective audio.
- **Old Dell Latitude PC**: Auto, Standard, Fast CPU if supported. Record Windows/Linux and Chrome/Edge version.
- **iPhone 13**: the six-passage Standard CPU test completed with **5 significant underruns**, average 13.77 seconds. Investigate mobile speech chunks/model performance, scheduling, and faster inference; prebuffering alone cannot sustain continuous reading when sustained generation remains ~0.43× real time. Safari remains to be independently verified.
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
