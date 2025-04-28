export interface CountdownSettings {
    millisecondsLeft: number;
    readonly startTime: number;
    readonly endTime: number;
    nextExpectedTickAt: number;
}

export type TimerEvent = "tick" | "completed";

export interface TimerMessage {
    readonly event: "create" | "start" | "stop" | TimerEvent | "error";
    readonly workerId?: string;
    readonly milliseconds?: number;
    readonly errorDetails?: string;
    readonly timerResolution?: number;
}

export interface TimerEventPayload {
    timerEvent: TimerEvent;
    millisecondsLeft?: number;
}

export interface TimerEventHook {
    onEvent: TimerEvent;
    execute(): void;
}