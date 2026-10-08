// redirect()/notFound() stop the request in Next by throwing; do the same
// with an error tests can recognise.
export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`redirect:${url}`);
  }
}

export function redirect(url: string): never {
  throw new RedirectError(url);
}

export function notFound(): never {
  throw new Error("notFound");
}
