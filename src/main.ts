import "./style.css";
import { TimerWorker } from "./timer/TimerWorker";

let timerWorker: TimerWorker;
let milliseconds: number;
let resolution: number;
let timerState: "paused" | "stopped" | "running" = "stopped";

function startTimer() {
    if (timerState !== "running") {
        timerState = "running";
        timerWorker.startTimer(milliseconds);
    }
}

function resetSettings() {
    milliseconds =
        (document.getElementById("seconds-input")! as HTMLInputElement).valueAsNumber *
        1000;
    resolution = (document.getElementById("resolution-input")! as HTMLInputElement)
        .valueAsNumber;
    if (timerWorker) {
        timerWorker.terminate();
    }
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

function updateDOM(milliseconds: number) {
    document.getElementById("time")!.innerHTML = milliseconds.toString();
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

document.getElementById("seconds-input")!.addEventListener("change", (event) => {
    const element = event.target as HTMLInputElement;
    updateDOM(element.valueAsNumber * 1000);
});
document.getElementById("start-button")!.addEventListener("click", startTimer);
document.getElementById("pause-button")!.addEventListener("click", pauseTimer);
document.getElementById("stop-button")!.addEventListener("click", stopTimer);
resetSettings();
