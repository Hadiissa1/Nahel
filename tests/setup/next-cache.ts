// Outside Next, "use cache" is an ignored string, so cached functions just run.
// The cache helpers they call become no-ops.
const noop = (...args: unknown[]) => void args;
export const cacheTag = noop;
export const cacheLife = noop;
export const revalidateTag = noop;
export const updateTag = noop;
export const revalidatePath = noop;
