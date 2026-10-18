import { createMemoryStore } from "@/lib/store/memory";
import { createPostgresStore } from "@/lib/store/postgres";
import type { Store } from "@/lib/store/types";

const globalStore = globalThis as unknown as { bordermathMemoryStore?: Store; bordermathPgStore?: Store };

export function getStore(options?: { forceMemory?: boolean }): Store {
  if (options?.forceMemory || !process.env.DATABASE_URL) {
    if (!globalStore.bordermathMemoryStore) globalStore.bordermathMemoryStore = createMemoryStore();
    return globalStore.bordermathMemoryStore;
  }
  if (!globalStore.bordermathPgStore) globalStore.bordermathPgStore = createPostgresStore();
  return globalStore.bordermathPgStore;
}
