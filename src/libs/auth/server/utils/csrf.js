/**
 * Middleware to protect against CSRF attacks.
 *
 * @param {string | null} originHeader - The 'Origin' header value from the request.
 * @param {string | null} hostHeader - The 'Host' header value from the request.
 * @returns {boolean} Returns true if the request passes the CSRF check, false otherwise.
 */
export function csrfProtection(originHeader, hostHeader) {
  if (!originHeader || !hostHeader) {
    return false;
  }

  try {
    const origin = new URL(originHeader);
    return origin.host === hostHeader;
  } catch {
    return false;
  }
}
