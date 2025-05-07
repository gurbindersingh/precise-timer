# Precise Timer

A lightweight, high-precision, headless JavaScript/TypeScript timer for the browser, built with web workers and **zero dependencies**. Just three files (four if you count the interfaces), and under 200 lines of code! It’s super easy to read and adapt, though you probably won’t need to.

A working example can be found on the project's [GitHub page](https://gurbindersingh.github.io/precise-timer/).

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Why?](#why)
- [Installation](#installation)
- [Usage](#usage)
- [A Look Under the Hood](#a-look-under-the-hood)
  - [Background](#background)
    - [Web Workers to the Rescue?](#web-workers-to-the-rescue)
    - [Fixing Timer Drift](#fixing-timer-drift)
    - [The Most Accurate Timer](#the-most-accurate-timer)
  - [Putting It All Together](#putting-it-all-together)

## Why?

If you’ve ever used `setTimeout` or `setInterval` to build a timer, you probably noticed how inaccurate they can be, especially for short intervals. Even when running inside a web worker, it can be off by as much as 200%! That kind of drift just doesn’t cut it when you’re building something that depends on precise timing. This little project is a solution to that.

## Installation

Just copy the contents of the `src/timer/` folder if you’re using TypeScript, or `js/timer/` if you’re using plain JavaScript, and drop them into your project. Depending on your bundler, you might need to adjust how the web worker is imported, but it should work out of the box with Vite.

## Usage

Import `TimerWorker`, create an instance, and you’re good to go! There’s also a simple example in the `main` script that shows how to use it.

## A Look Under the Hood

### Background

#### Web Workers to the Rescue?

As mentioned earlier, `setTimeout` and `setInterval` don’t guarantee exact timing. All they promise is that the callback won’t run _before_ the timeout you specify, which isn't very helpful. If you use them on the main thread, things get worse: when a tab is inactive, the main thread gets throttled or suspended, causing major delays.

`requestAnimationFrame` is a bit better, but it’s tied to the screen refresh rate and still isn’t immune to throttling. There's also the `AudioWorklet` API, which might be another workaround, but diving into that rabbit hole just didn’t feel worth it for this use case.

So what’s the fix?

**Web workers**. These run in their own thread and stay active even if the tab loses focus. That solves one part of the problem, but not all of it. Web workers still suffer from timing drift if you're just using `setTimeout` or `setInterval`.

#### Fixing Timer Drift

Instead of scheduling each tick at a fixed interval, we track when each tick _should_ have happened, compare it to the actual time, and adjust the next interval accordingly.

For example, let’s say you want a tick every 1000ms, but the last tick happened at 1099ms. For the next one, you subtract the 99ms delay and schedule the tick in 901ms instead.

This approach significantly reduces drift, though the very last tick might still be off by a few hundred milliseconds depending on your interval length.

#### The Most Accurate Timer

If you want absolute precision, the only way is to use **busy waiting**. Here's the basic idea:

```pseudo
while (currentTime < endTime):
  if (currentTime >= timeOfNextTick):
    emit("tick")
    timeOfNextTick += interval
emit("completed")
```

This way, you have zero delays. But it keeps the CPU constantly busy, which is inefficient and definitely overkill for long-running timers.

### Putting It All Together

The sweet spot? Combine both strategies.

Use dynamic timeouts that adjust for drift, but instead of waiting the full adjusted interval, stop a little early of the total interval (what the code calls `timerResolution`), and use busy waiting for just that final stretch.

From my testing, 12.5% worked well as a balance between accuracy and performance. For longer intervals, you might want to reduce that proportion to save CPU.
