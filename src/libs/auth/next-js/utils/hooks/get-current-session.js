/** @import { ValidSessionResult, InvalidSessionResult } from "~/libs/auth/types" */

import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "../get-current-session";

/**
 * @typedef {(ValidSessionResult & { type: "authenticated" })
 * 	| (InvalidSessionResult & { type: "unauthenticated" })
 *  | (InvalidSessionResult & { type: "initial-loading" })} ClientUserSession
 * }
 */

export function useGetCurrentSession() {
  return useQuery({
    queryKey: ["current-session"],
    /** @returns {Promise<ClientUserSession>} */
    queryFn: async () => {
      const result = await getCurrentSession();

      if (!result.session) {
        return {
          type: "unauthenticated",
          session: null,
          user: null,
        };
      }

      return {
        type: "authenticated",
        session: result.session,
        user: result.user,
      };
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    /** @type {ClientUserSession} */
    initialData: {
      type: "initial-loading",
      session: null,
      user: null,
    },
  });
}
