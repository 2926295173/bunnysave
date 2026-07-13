// Sentry instrumentation entry. Runs once per server/edge runtime boot.
// Next.js auto-loads this file at startup when it exists.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: string;
    revalidateReason?: string;
    renderType?: string;
  },
) {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(err, {
      tags: {
        routePath: context.routePath,
        routerKind: context.routerKind,
        routeType: context.routeType,
      },
      extra: {
        method: request.method,
        path: request.path,
      },
    });
  } catch {
    // Sentry not initialized (e.g. dev without DSN); swallow.
  }
}