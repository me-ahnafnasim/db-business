// The Help Center's table of contents.
//
// Every answer here restates a rule the app already enforces somewhere in code — the
// 12-pairs-per-dozen pack total, the 2-pair floor per size, MOQ counted across packs, the
// checkout gate. Nothing is invented, so when a rule changes this file has to change with it.
//
// Keys are written out in full rather than built from a template, so `check:i18n` sees them
// as statically referenced and an accidental deletion shows up as a missing key.

export const helpSections = [
  {
    key: "packs",
    icon: "package",
    titleKey: "help.packsTitle",
    items: [
      { key: "exact12", q: "help.exact12Q", a: "help.exact12A" },
      { key: "scaling", q: "help.scalingQ", a: "help.scalingA" },
      { key: "minTwo", q: "help.minTwoQ", a: "help.minTwoA" },
      { key: "moq", q: "help.moqQ", a: "help.moqA" },
      { key: "blocked", q: "help.blockedQ", a: "help.blockedA" },
    ],
  },
  {
    key: "cart",
    icon: "shopping-bag",
    titleKey: "help.cartTitle",
    items: [
      { key: "edit", q: "help.editQ", a: "help.editA" },
      { key: "perDozen", q: "help.perDozenQ", a: "help.perDozenA" },
    ],
  },
  {
    key: "payment",
    icon: "credit-card",
    titleKey: "help.paymentTitle",
    items: [
      { key: "methods", q: "help.methodsQ", a: "help.methodsA" },
      { key: "bank", q: "help.bankQ", a: "help.bankA" },
      { key: "paymentStatus", q: "help.paymentStatusQ", a: "help.paymentStatusA" },
    ],
  },
  {
    key: "delivery",
    icon: "truck",
    titleKey: "help.deliveryTitle",
    items: [
      { key: "options", q: "help.optionsQ", a: "help.optionsA" },
      { key: "orderStatus", q: "help.orderStatusQ", a: "help.orderStatusA" },
      { key: "cancel", q: "help.cancelQ", a: "help.cancelA" },
    ],
  },
  {
    key: "account",
    icon: "user",
    titleKey: "help.accountTitle",
    items: [
      { key: "details", q: "help.detailsQ", a: "help.detailsA" },
      { key: "settings", q: "help.settingsQ", a: "help.settingsA" },
      { key: "expenses", q: "help.expensesQ", a: "help.expensesA" },
    ],
  },
];
