const ERROR_KEYS = {
  NETWORK_ERROR: "errors.network",
  REQUEST_TIMEOUT: "errors.timeout",
  CONFIGURATION_ERROR: "errors.configuration",
  AUTH_SESSION_ERROR: "errors.session",
  SESSION_REVOKED: "errors.sessionExpired",
  CLIENT_ACCOUNT_REQUIRED: "errors.clientOnly",
  PROFILE_INCOMPLETE: "errors.profileIncomplete",
  PROFILE_REQUIRED: "errors.profileIncomplete",
  CART_EMPTY: "errors.cartEmpty",
  MOQ_NOT_MET: "cart.moqNotMet",
  PACK_RULE_CHANGED: "errors.packRuleChanged",
  PACK_PAIR_TOTAL: "errors.packPairTotal",
  PACK_REQUIRES_RECONFIGURE: "errors.packRequiresReconfigure",
  PACK_OPTION_LIMIT: "errors.packOptionLimit",
  PACK_VARIANT_INVALID: "errors.packRuleChanged",
  VALIDATION_ERROR: "errors.validation",
  // Thrown client-side by api.js when the body will not parse. It was the only code the app
  // itself raises that had no mapping, so it surfaced as raw English.
  INVALID_RESPONSE: "errors.invalidResponse",
};

export function getLocalizedError(error, t, fallbackKey) {
  const key = ERROR_KEYS[error?.code];
  const requestId = error?.requestId;
  const baseMessage = key ? t(key) : error?.message || t(fallbackKey);
  if (!requestId || String(baseMessage).includes(requestId)) return baseMessage;
  return `${baseMessage} (${t("errors.requestId")}: ${requestId})`;
}
