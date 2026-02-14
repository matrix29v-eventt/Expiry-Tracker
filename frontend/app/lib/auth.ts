import { cookies } from "next/headers";

/**
 * Checks if JWT cookie exists
 * SERVER COMPONENT ONLY
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  return !!token;
}
