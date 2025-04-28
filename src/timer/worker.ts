import { TimerMessage } from "@/interfaces/Timer";
import { Timer } from "./Timer";

let timer: Timer;

self.onmessage = (message: MessageEvent<TimerMessage>) => {
    switch (message.data.event) {
        case "create":
            createTimer(message.data);
            break;

        case "start":
            startTimer(message.data);
            break;

        case "stop":
            stopTimer();
            break;

        default:
            break;
    }
};

function createTimer(timerMessage: TimerMessage) {
    if (!timer) {
        timer = new Timer(timerMessage.workerId, timerMessage.timerResolution);

        timer.addEventListener("timer.event", (event) => {
            const { detail } = event as CustomEvent;
            console.log("Timer event details:", detail);
            notifyMainThread({ event: detail.timerEvent });
        });
    }
}

function startTimer({ milliseconds }: TimerMessage) {
    if (milliseconds) {
        timer.start(milliseconds);
        return;
    }
    notifyMainThread({ event: "error", errorDetails: "seconds.missing" });
}

function stopTimer() {
    timer.stop();
}

function notifyMainThread(message: TimerMessage) {
    self.postMessage(message);
}
