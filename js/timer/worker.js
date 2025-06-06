import { Timer } from "./Timer";
/**
 * This is the actual timer that does all the heavy lifting.
 */
let timer;
/**
 * Set up the event listener in the web worker. This function will be triggered
 * every time the main thread calls `postMessage` on the corresponding web
 * worker object.
 *
 * @param message A message sent by the main thread.
 */
self.onmessage = (message) => {
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
/**
 * Create a new timer and set up the event listener to relay events to the main
 * thread.
 *
 * @param timerMessage Settings for the timer.
 */
function createTimer(timerMessage) {
    if (!timer) {
        timer = new Timer(timerMessage.workerId, timerMessage.timerResolution);
        timer.addEventListener("timer.event", (event) => {
            const { detail } = event;
            console.log("Timer event details:", detail);
            notifyMainThread({ event: detail.timerEvent });
        });
    }
}
function startTimer({ milliseconds }) {
    if (milliseconds) {
        timer.start(milliseconds);
        return;
    }
    notifyMainThread({ event: "error", errorDetails: "seconds.missing" });
}
function stopTimer() {
    timer.stop();
}
function notifyMainThread(message) {
    self.postMessage(message);
}
