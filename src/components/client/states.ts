export enum CallState {
    idle = 1,
    ringing = 2,
    callee_is_ringing = 4,
    number_unknown = 8,
    callee_is_busy = 16,
    talking = 32,
    calling = 64,
}

export enum CallResponse {
    ringing = 1,
    busy = 2,
    unknown_number = 4
}