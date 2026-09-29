/** Optional sign-in gate, shared by the auth API routes and the home page. */

export const AUTH_COOKIE = "ocpp_sim_auth";
export const AUTH_MAX_AGE_SECS = 10 * 24 * 60 * 60; // 10 days

export const isAuthEnabled = () => process.env.ALLOW_AUTH === "true";

export const hasSession = (cookieValue: string | undefined) =>
  cookieValue === "1";
