import "../src/style.css";
import { TimerWorker } from "./timer/TimerWorker";
// The necessary variables needed for the a basic timer.
let timerWorker;
let milliseconds;
let resolution;
let timerState = "stopped";
/**
 * Start the timer if it isn't already running.
 */
function startTimer() {
    if (timerState !== "running") {
        timerState = "running";
        timerWorker.startTimer(milliseconds);
    }
}
/**
 * Instantiate the necessary variables for a new execution of the timer.
 */
function resetSettings() {
    // Here we just save the values from the input elements in the variables.
    milliseconds =
        document.getElementById("seconds-input").valueAsNumber *
            1000;
    resolution = document.getElementById("resolution-input")
        .valueAsNumber;
    if (timerWorker) {
        timerWorker.terminate();
    }
    // This is the important bit! Here we set up the callbacks we want to
    // execute for the `tick` and `completed` events.
    timerWorker = new TimerWorker(resolution).setupEventListeners([
        {
            onEvent: "tick",
            execute() {
                milliseconds -= resolution;
                updateDOM(milliseconds);
            }
        },
        {
            onEvent: "completed",
            execute() {
                timerState = "stopped";
                resetSettings();
            }
        }
    ]);
    updateDOM(milliseconds);
}
/**
 * Updates the timer element in the DOM.
 *
 * @param milliseconds The milliseconds to show on the page.
 */
function updateDOM(milliseconds) {
    document.getElementById("time").innerHTML = milliseconds.toString();
}
function stopTimer() {
    timerWorker.stopTimer();
    timerState = "stopped";
    resetSettings();
    updateDOM(milliseconds);
}
function pauseTimer() {
    timerWorker.stopTimer();
    timerState = "paused";
}
// These aren't relevant for the timer. They are just for the example page.
document.getElementById("seconds-input").addEventListener("change", (event) => {
    const element = event.target;
    updateDOM(element.valueAsNumber * 1000);
});
document.getElementById("start-button").addEventListener("click", startTimer);
document.getElementById("pause-button").addEventListener("click", pauseTimer);
document.getElementById("stop-button").addEventListener("click", stopTimer);
resetSettings();
