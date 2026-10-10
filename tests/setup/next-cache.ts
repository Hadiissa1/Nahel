// Outside Next there is no cache: cached functions just run.
// The cache helpers they call become no-ops.
const noop = (...args: unknown[]) => void args;
export const cacheTag = noop;
export const cacheLife = noop;
export const revalidateTag = noop;
export const updateTag = noop;
export const revalidatePath = noop;
export const refresh = noop;
// No cache in tests: the wrapped function runs every time.
export const unstable_cache = <F extends (...args: never[]) => unknown>(fn: F) => fn;
