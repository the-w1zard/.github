/**
 * Flood Gates — transport routing and flood-opening.
 *
 * The bus's transport fabric: every traffic category (SENDS/SUBS, STATE,
 * DUPLEX, STREAMS, SIGNALS, BINARY, SHARED MEMORY) has an ordered stack
 * of gates. Traffic begins on Gate 0; as the sustained rate crosses a
 * gate's threshold, the next gate OPENS — a dam with flood gates, not a
 * throttle. More water → more pipe, never less speed.
 */
export {};
