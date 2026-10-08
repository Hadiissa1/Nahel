// In-memory stand-ins for next/headers. Tests set the request headers
// (e.g. a different IP per test) and read back the cookies the code set.

const jar = new Map<string, string>();
let requestHeaders = new Headers({ host: "localhost:3000", "x-forwarded-for": "127.0.0.1" });

export function setRequestHeaders(init: Record<string, string>) {
  requestHeaders = new Headers({ host: "localhost:3000", ...init });
}

export function resetRequest() {
  jar.clear();
  setRequestHeaders({ "x-forwarded-for": "127.0.0.1" });
}

export const cookieJar = jar;

export async function cookies() {
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    has: (name: string) => jar.has(name),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  };
}

export async function headers() {
  return requestHeaders;
}
