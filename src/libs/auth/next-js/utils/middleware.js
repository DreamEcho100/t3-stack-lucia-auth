/**
 * @import { NextRequest } from "next/server"
 * @import { Session, User } from "~/libs/auth/types"
 */

import { NextResponse } from "next/server";
import { csrfProtection } from "~/libs/auth/server/utils/csrf";
import { COOKIE_TOKEN_SESSION_KEY } from "~/libs/auth/server/utils/constants";
import { handleSessionMiddleware } from "~/libs/auth/server/utils/sessions";

/**
 * @param {NextRequest} request
 * @param {{
 *  onAuthorized?: (result: { session: Session; user: User }) => NextResponse | Promise<NextResponse>;
 *  onUnauthorized?: () => NextResponse | Promise<NextResponse>;
 *  onInvalidCSRF?: () => NextResponse | Promise<NextResponse>;
 *  onValidCSRF?: () => NextResponse | Promise<NextResponse>;
 *  onError?: (error: unknown) => NextResponse | Promise<NextResponse>;
 * }} [options] Handlers for different middleware states, including authorization,
 *  CSRF validation, and errors.
 * @returns {Promise<NextResponse>} - Returns the appropriate Next.js response based on the
 *  middleware state (authorized, unauthorized, CSRF validation, error).
 *
 * @example
 * ```ts
 * import { createAuthMiddleware } from "~/libs/auth/server/middleware";
 *
 * export default async function middleware(request, next) {
 *   return createAuthMiddleware(request, {
 *     onAuthorized: ({ session, user }) => {
 *       console.log("Authorized", session, user);
 *       return next(request);
 *     },
 *     onUnauthorized: () => {
 *       console.log("Unauthorized");
 *       return new NextResponse(null, { status: 401 });
 *     },
 *     onInvalidCSRF: () => {
 *       console.log("Invalid CSRF");
 *       return new NextResponse(null, { status: 403 });
 *     },
 *     onValidCSRF: () => {
 *       console.log("Valid CSRF");
 *       return next(request);
 *     },
 *     onError: (error) => {
 *       console.error("Error", error);
 *       return new NextResponse(null, { status: 500 });
 *     },
 *   });
 * }
 * ```
 */
export async function createAuthMiddleware(request, options) {
  const authedRequest = await handleAuthMiddleware(request);

  switch (authedRequest.status) {
    case "authorized":
      // return authedRequest.result;
      return (
        options?.onAuthorized?.(authedRequest.result) ?? NextResponse.next()
      );
    case "unauthorized":
      return (
        options?.onUnauthorized?.() ?? new NextResponse(null, { status: 401 })
      );
    case "invalid-csrf":
      // return new NextResponse(null, { status: 403 });
      return (
        options?.onInvalidCSRF?.() ?? new NextResponse(null, { status: 403 })
      );
    case "valid-csrf":
      // return NextResponse.next();
      return options?.onValidCSRF?.() ?? NextResponse.next();
    case "error":
      // return new NextResponse(null, { status: 500 });
      return (
        options?.onError?.(authedRequest.error) ??
        new NextResponse(null, { status: 500 })
      );
  }
}

/**
 * Handles the core session validation and CSRF protection logic for the middleware.
 *
 * @param {NextRequest} request - The incoming HTTP request object.
 *
 * @returns {Promise<
 *  { status: "authorized", result: { session: Session, user: User }} |
 *  { status: "unauthorized", result: null } |
 *  { status: "invalid-csrf", result: null } |
 *  { status: "valid-csrf", result: null } |
 *  { status: "error", error: unknown }
 * >} - The middleware result, containing the status (authorized, unauthorized, etc.) and
 *  the relevant session or error data.
 */
async function handleAuthMiddleware(request) {
  try {
    // Handle session token for GET requests
    if (request.method === "GET") {
      const response = NextResponse.next();
      const token =
        request.cookies.get(COOKIE_TOKEN_SESSION_KEY)?.value ?? null;

      if (token !== null) {
        const result = await handleSessionMiddleware({
          token,
          // eslint-disable-next-line @typescript-eslint/unbound-method
          setCookie: response.cookies.set,
        });

        if (result.session) {
          return { status: "authorized", result };
        } else {
          return { status: "unauthorized", result: null };
        }
      }

      return { status: "unauthorized", result: null };
    }

    // CSRF Protection for non-GET requests
    const originHeader = request.headers.get("Origin");
    const hostHeader = request.headers.get("Host");

    if (!csrfProtection(originHeader, hostHeader)) {
      return { status: "invalid-csrf", result: null };
    }

    return { status: "valid-csrf", result: null };
  } catch (error) {
    return { status: "error", error };
  }
}
