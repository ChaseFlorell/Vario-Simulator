# Vario Simulator

A browser trainer for teaching paraglider pilots to **find a thermal by ear and stay in it**.

It emulates a modern flight-deck vario — the phone on your riser — with the real
audio behaviour, an XCTrack-style thermal assistant, and an instructor's map
beside it showing where the lift actually is. No install, no dependencies, no
build step: one self-contained `index.html`.

---

## Why it exists

Students can be told "turn towards the strongest beeps" a hundred times on the
hill and still fly straight through every core on their first thermic flight.
The gap is that thermalling is an *audio* skill practised under time pressure,
and there is nowhere to practise it on the ground.

This puts the sound, the lag, and the consequences in front of them at a desk,
and then shows them the answer.

## What the student sees

The left-hand panel is the whole instrument: a big climb number, an LED vario
bar, altitude, 30-second average, speed, glide — and the beeps. That is all you
get in the air.

The map beside it is the **instructor's view**, not the pilot's. Press `H` to
hide or reveal where the thermals really are. Most exercises start with it
hidden on purpose.

## The thermal sniffer

Press `T` for the thermal assistant. It shows your last 42 seconds of track as
dots coloured by climb rate, and an arrow to where it thinks the core is.

It is worth being precise with students about what this is doing, because the
instrument is not magic and its one real limitation matters:

> The sniffer has **no idea** where the thermal is. It knows only where you have
> already been and what the air did there. It takes the lift-weighted centroid of
> your recent track. It follows you — it never leads you.

That is why the confidence figure starts low and climbs as you complete a turn.
Flying in a straight line through lift, the assistant can work out which *line*
the lift is on but not which *side* of you it sits — so it sits at about 50%.
Only a completed circle resolves the ambiguity. **Exercise 3 exists purely to
show this.** Turn the sniffer on with the air revealed and let students watch
the estimate guess badly, then sharpen, then track the real core about 20 m
behind the truth, forever.

The honest lesson: the assistant is a good confirmation and a poor guide. The
ear is faster.

## The exercises

| # | Exercise | Teaches |
|---|----------|---------|
| 1 | First contact | What lift sounds like. Fat, steady thermal, no wind, air revealed. |
| 2 | Centring | Moving a circle onto a core you cannot see. |
| 3 | How the vario sniffs | What the thermal assistant can and cannot know. |
| 4 | Drift | You drift with the air. The ground moves; the core leans downwind as you climb. |
| 5 | Broken air | Not abandoning a core because one beat went quiet. |
| 6 | Search & survive | Committing to the first surge when you are low. |
| 7 | Blind coring | The map goes away. Instrument and sound only. |

Every exercise is deterministic — the same thermal in the same place every time,
so a student can repeat the same problem until they solve it.

## The one thing to teach first

The single most common error, and the one exercise 1 is built to expose:
**students turn at the first beep.** By the time the vario speaks you are already
a second or two into the lift, and the vario itself is running about a second
late on top of that. Turn immediately and your circle sits on the *edge* of the
thermal, tangent to the core, and you grind round in half-strength lift
wondering why you are not climbing.

Fly on until the tone stops rising, *then* turn. In exercise 1 the difference is
measurable:

| Technique | Height gained | Avg per circle | Time in lift |
|-----------|---------------|----------------|--------------|
| Turn at the first beep | +2 m | +0.22 m/s | 61% |
| Fly to the peak, then turn | **+46 m** | **+1.05 m/s** | **80%** |

Same thermal, same wing, same 95 seconds.

## The coach

After every completed 360 the coach computes where the lift actually was
relative to your circle and tells you in the language an instructor uses —
a clock position, a distance, and how many seconds to straighten:

> Off the core. The best air was 34 m to the NW, your 11 o'clock. Straighten
> about 3.1 s as you come round to that heading, then re-establish the turn.

The side panel keeps a bar chart of every circle's average climb, and
**Centring %** scores what you took against what was actually on offer.

## Controls

| Key | Action |
|-----|--------|
| `←` `→` | Weight-shift. Hold to steepen; the bank stays where you leave it. |
| `X` | Wings level |
| `↑` `↓` | Speed bar on / off |
| `T` | Thermal sniffer |
| `H` | Reveal the air (instructor view) |
| `M` | Mute |
| `Space` | Pause |
| `R` | Restart the exercise |
| `+` `−` | Zoom the map |

On a tablet or phone the map grows touch controls, so it works on a projector,
a lap, or a phone passed round the group.

## Running it

Open `index.html`. That is the whole procedure — it is a single file with no
dependencies and no build step.

Headphones or a decent speaker matter more than the screen. The sound *is* the
lesson; muted, this is just a diagram.

## Deploying

Pushed to `main`, GitHub Actions publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). The workflow copies `index.html` onto a
`gh-pages` branch, which needs only `contents: write` — no admin has to enable
Pages by hand first.

If you would rather use the newer Actions-based Pages source (`actions/deploy-pages`),
switch **Settings → Pages → Source** to *GitHub Actions* and swap the publish
step for `actions/upload-pages-artifact` + `actions/deploy-pages`. That route
needs the one-time settings change; this one does not.

---

## How the simulation works

Worth knowing if you are going to teach off it, because a few choices are
deliberate and a student may ask.

**Everything happens in the air-mass frame.** The glider and the thermals both
drift with the wind, which is precisely why you can circle in a thermal at all.
The wind setting moves the *ground* beneath you — the sliding grid and fields on
the map. That is the entire content of exercise 4, and the reason chasing a
thermal upwind is futile.

**Thermals** are Gaussian cores with a compensating ring of sink around them, so
you punch through sink on the way in. They are narrow and sharp low down, broad
and gentle up high; they wander; they can pulse; and in the search exercise they
are born and die. They weaken under cloudbase.

**The wing** flies a real polar — `sink(V) = minSink + k·(V − V_minsink)²` — with
sink rising as the 3/2 power of load factor in a turn. Three wings are modelled
(EN-A school, EN-B XC, EN-D performance) at roughly 8.1, 9.6 and 11.4 glide.

This produces the trade-off students need to feel: at 30° of bank an EN-B
circles at about a 21 m radius and sinks 1.4 m/s; steepen to 45° and the radius
tightens to 12 m but the sink goes to 1.9 m/s. Flatter turns sink less but sit
further from the core on average. The optimum for these thermals lands around
30–35°, which is where it should be.

**The vario is deliberately late.** Indicated climb is a first-order lag on the
truth — 1.2 s by default, adjustable from 0.1 to 3.5 s. The audiogram strip
under the map plots both: solid line is what the instrument says, dashed is what
the air is actually doing. The gap between them is the thing students have to
learn to fly ahead of. Turning the lag up to 3 s and re-flying exercise 1 makes
the point faster than any explanation.

Beeps follow the usual convention — about an octave per 6 m/s, cadence and duty
cycle rising with the climb until strong lift is nearly a continuous note, and a
low continuous growl below the sink alarm.
