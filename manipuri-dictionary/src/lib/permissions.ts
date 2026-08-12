/**
 * Role-based access control helpers.
 * Roles: user, contributor, moderator, admin
 * (contributor exists in the DB enum but behaves like user in the UI).
 */

export type AppRole = "user" | "contributor" | "moderator" | "admin";

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  contributor: 0,
  moderator: 1,
  admin: 2,
};

export function hasRole(role: string | undefined, required: AppRole): boolean {
  if (!role) return false;
  const rank = ROLE_RANK[role as AppRole];
  if (rank === undefined) return false;
  return rank >= ROLE_RANK[required];
}

/** True if the user can moderate (moderator or admin). */
export function canModerate(role: string | undefined): boolean {
  return hasRole(role, "moderator");
}

/** True if the user is an admin. */
export function isAdmin(role: string | undefined): boolean {
  return hasRole(role, "admin");
}

/** Display label for a role. */
export function roleLabel(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "moderator":
      return "Moderator";
    case "contributor":
      return "Contributor";
    default:
      return "User";
  }
}