// Barrel re-export — keeps test imports working after the eager/lazy router split.
// Tests import `appRouter` from "./routers"; this file satisfies that contract.
export { appRouter } from "./routers.eager";
export type { AppRouter } from "./routers.eager";
