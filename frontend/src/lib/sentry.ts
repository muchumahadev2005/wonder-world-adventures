import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for React / Vite frontend.
 * Gracefully does nothing if VITE_SENTRY_DSN is not set in .env.
 */
export const initFrontendSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    // 20% performance trace sampling in production to conserve free quota
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Session Replays: 100% of sessions that experience a crash
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    // COPPA & Privacy Scrubber
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/([?&](?:token|code|accessToken)=)[^&#\s]+/gi, "$1[HIDDEN]");
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.message) {
            crumb.message = crumb.message.replace(/([?&](?:token|code|accessToken)=)[^&#\s]+/gi, "$1[HIDDEN]");
          }
          return crumb;
        });
      }
      return event;
    },
    // Filter common benign browser noise
    ignoreErrors: [
      "ResizeObserver loop completed with undelivered notifications",
      "ResizeObserver loop limit exceeded",
      "NetworkError when attempting to fetch resource",
      "Failed to fetch",
      "Load failed",
      "AbortError",
    ],
  });
};

export { Sentry };
