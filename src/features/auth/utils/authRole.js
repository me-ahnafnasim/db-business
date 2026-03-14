import { MOCK_ACCOUNTS } from "../data/adminConfig";

export function getMockAccount(email, password, role) {
  const normalizedEmail = email?.trim()?.toLowerCase();
  const normalizedRole = role?.trim()?.toLowerCase();
  return (
    MOCK_ACCOUNTS.find(
      (account) =>
        account.email.toLowerCase() === normalizedEmail &&
        account.password === password &&
        account.role === normalizedRole
    ) ?? null
  );
}

export function normalizeDisplayName(displayName, email) {
  const trimmedName = displayName?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailPrefix = email?.split("@")?.[0] ?? "Guest";
  return emailPrefix
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
