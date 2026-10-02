// Tab paths, shared by the server route (prerendering) and the client portal.

export type TabKey = "home" | "pins" | "progress" | "mentor" | "family";

export const TAB_PATHS: Record<TabKey, string> = {
  home: "/",
  pins: "/pinbook",
  progress: "/progress",
  mentor: "/mentor",
  family: "/family",
};

/** Path segments for the non-home tabs, e.g. "pinbook". */
export const TAB_SLUGS = Object.values(TAB_PATHS)
  .filter((path) => path !== "/")
  .map((path) => path.slice(1));

export function tabFromPath(pathname: string): TabKey {
  const match = (Object.keys(TAB_PATHS) as TabKey[]).find((k) => TAB_PATHS[k] === pathname);
  return match ?? "home";
}
