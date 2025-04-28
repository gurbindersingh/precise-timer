import { CountdownSettings, TimerEventPayload } from "./interfaces";

/**
 * The timer only needs the start and stop function. Everything else we can
 * handle in calling function.
 */
export class Timer extends EventTarget {
    static readonly DRIFT_CORRECTION = 0.875;

    readonly workerId: string;
    readonly timerId: string;
    private timeoutId: number;
    private timerResolution: number;

    /**
     * Create a new timer instance.
     *
     * @param workerId  ID of the worker thread running this timer.
     * @param timerResolution   The resolution of the timer in milliseconds. This
     *                          determines the interval in which the tick events
     *                          will be fired.
     */
    public constructor(workerId: string = "none", timerResolution: number = 1000) {
        if (timerResolution < 10 || timerResolution > 1000) {
            throw new Error("Timer resolution must be between 10 and 1000 ms.");
        }
        super();
        this.timeoutId = -1;
        this.workerId = workerId;
        this.timerId = crypto.randomUUID();
        this.timerResolution = timerResolution;

        this.log("log", "Created timer.");
    }

    public start(milliseconds: number) {
        this.log("log", "Starting timer.");

        const now = performance.now();
        this.scheduleNextTick({
            startTime: now,
            endTime: now + milliseconds,
            millisecondsLeft: milliseconds,
            nextExpectedTickAt: now + this.timerResolution
        });
    }

    public stop() {
        if (this.timeoutId > 0) {
            clearTimeout(this.timeoutId);
            this.log("log", "Stopped timer.");
        }
    }

    private scheduleNextTick(settings: CountdownSettings) {
        if (settings.millisecondsLeft > 0) {
            this.timeoutId = setTimeout(
                () => {
                    this.countdown(settings);
                },
                Math.floor(
                    (settings.nextExpectedTickAt - performance.now()) *
                        Timer.DRIFT_CORRECTION
                )
            );
            this.log("log", "Scheduled next countdown. Currently: ", performance.now());
        } else {
            this.fireEvent({ timerEvent: "completed" });
            this.log(
                "log",
                "Completed timer. Settings:",
                settings,
                ". Time:",
                performance.now()
            );
            this.log("log", `Timer was ${performance.now() - settings.endTime}ms late.`);
        }
    }

    private countdown(settings: CountdownSettings) {
        const busyStart = performance.now();
        while (performance.now() < settings.nextExpectedTickAt) {
            continue;
        }
        const busyEnd = performance.now();
        const newSettings = {
            ...settings,
            millisecondsLeft: settings.millisecondsLeft - this.timerResolution,
            nextExpectedTickAt: settings.nextExpectedTickAt + this.timerResolution
        };
        this.fireEvent({
            timerEvent: "tick",
            millisecondsLeft: newSettings.millisecondsLeft
        });
        this.log(
            "log",
            "function:countdown",
            settings,
            "now:",
            performance.now(),
            "drift:",
            performance.now() - settings.nextExpectedTickAt
        );
        this.log("log", "Busy waited for", busyEnd - busyStart, "ms");
        this.scheduleNextTick(newSettings);
    }

    private fireEvent(payload: TimerEventPayload) {
        this.dispatchEvent(
            new CustomEvent("timer.event", {
                detail: payload
            })
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private log(level: "log" | "error", ...args: any[]) {
        const msgPrefix = `[timer: ${this.timerId}, worker: ${this.workerId}]`;

        switch (level) {
            case "log":
                console.log(msgPrefix, ...args);
                break;
            case "error":
                console.error(msgPrefix, ...args);
                break;
            default:
                break;
        }
    }
}
