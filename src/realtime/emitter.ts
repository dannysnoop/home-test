// If you already have src/realtime/ws.ts exporting emitUserLocationUpdate, re-export it here.
// Fallback no-op avoids compile errors if websocket is not wired yet.
export function emitUserLocationUpdate(_userId: string, _payload: unknown) {
    /* noop if websockets not enabled */
}
