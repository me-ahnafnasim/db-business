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
  INSUFFICIENT_STOCK: "errors.insufficientStock",
  MOQ_NOT_MET: "cart.moqNotMet",
  PACK_RULE_CHANGED: "errors.packRuleChanged",
  PACK_PAIR_TOTAL: "errors.packPairTotal",
  PACK_OPTION_LIMIT: "errors.packOptionLimit",
  PACK_VARIANT_INVALID: "errors.packRuleChanged",
  VALIDATION_ERROR: "errors.validation",
};

export function getLocalizedError(error, t, fallbackKey) {
  const key = ERROR_KEYS[error?.code];
  const requestId = error?.requestId;
  const baseMessage = key ? t(key) : error?.message || t(fallbackKey);
  if (!requestId || String(baseMessage).includes(requestId)) return baseMessage;
  return `${baseMessage} (${t("errors.requestId")}: ${requestId})`;
}
