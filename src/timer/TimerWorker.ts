import { TimerEventHook, TimerMessage } from "./interfaces";

/**
 * This class abstracts the creation of the web worker with the timer
 * functionality and the message passing between it and the main thread.
 */
export class TimerWorker {
    private readonly workerId: string;
    private readonly webWorker: Worker;

    /**
     * Create a new worker that executes the timer in background thread.
     *
     * @param timerResolution The number of milliseconds after which each tick event will be fired.
     */
    constructor(timerResolution: number) {
        if (timerResolution < 10 || timerResolution > 1000) {
            throw new Error("Timer resolution must be between 10 and 1000 ms.");
        }

        this.workerId = crypto.randomUUID();
        // Using `new URL()` is the syntax as specified in the Vite documentation
        this.webWorker = new Worker(new URL("./worker", import.meta.url), {
            type: "module"
        });
        this.createTimer(timerResolution);
    }

    setupMessageHandler(eventHooks: TimerEventHook[]) {
        console.log(`[${this.workerId}] Setting up message Handlers.`);

        this.webWorker.onmessage = (message: MessageEvent<TimerMessage>) => {
            if (message.data.event === "error") {
                console.error("Error in web worker:", message.data.errorDetails);
                return;
            }
            eventHooks
                .filter((hook) => hook.onEvent === message.data.event)
                .forEach((hook) => {
                    hook.execute();
                });
        };
        return this;
    }

    private notifyWebWorker(message: TimerMessage) {
        this.webWorker.postMessage(message);
    }

    private createTimer(timerResolution: number) {
        this.notifyWebWorker({
            event: "create",
            workerId: this.workerId,
            timerResolution: timerResolution
        });
    }

    startTimer(milliseconds: number) {
        this.notifyWebWorker({
            event: "start",
            milliseconds: milliseconds,
            workerId: this.workerId
        });
    }

    stopTimer() {
        this.notifyWebWorker({ event: "stop", workerId: this.workerId });
    }

    terminate() {
        this.webWorker.terminate();
    }
}
