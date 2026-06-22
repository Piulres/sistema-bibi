import { NextRequest } from "next/server";

export function jsonRequest(
  url: string,
  init: RequestInit & { body?: unknown } = {},
): Request {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Request(url, {
    ...init,
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

export function nextRequest(
  pathname: string,
  init: { cookies?: Record<string, string> } = {},
): NextRequest {
  const url = `http://localhost${pathname}`;
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(init.cookies ?? {})) {
    req.cookies.set(name, value);
  }
  return req;
}
