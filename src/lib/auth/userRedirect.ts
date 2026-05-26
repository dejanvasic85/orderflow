export function getPostLoginRedirect(
  userRole: string | undefined,
): "/accounts" | "/manage/dashboard" {
  return userRole === "user" ? "/accounts" : "/manage/dashboard";
}
