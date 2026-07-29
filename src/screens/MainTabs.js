import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../i18n/LanguageProvider";
import { getLocalizedError } from "../i18n/errors";
import { supabase } from "../config/supabase";
import { radius, spacing, useStyles, useTheme } from "../theme";
import { useBackHandler } from "../hooks/useBackHandler";
import { useExitConfirm } from "../hooks/useExitConfirm";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import OfflineBanner from "../components/OfflineBanner";
import { AppText, Button, Dialog } from "../ui";
import NoboSoleLoader from "../ui/NoboSoleLoader";

import { TAB_KEYS } from "../data/tabs";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { findMethod, formatDeliveryDays, isPickup, methodLabel, methodPriceBdt } from "../features/checkout/utils/deliveryOptions";
import {
  buildCatalog,
  fetchCatalogRaw,
  setCatalogCacheRevision,
} from "../features/catalog/services/catalogService";
import {
  clearCatalogDataCache,
  getCurrentCatalogRevision,
  readCatalogSnapshot,
  writeCatalogSnapshot,
} from "../features/catalog/services/catalogCache";
import {
  maintainImageDiskCache,
  prefetchImages,
} from "../features/catalog/services/imageCache";
import {
  addConfiguredItem,
  catalogProductFor,
  configFromCartLine,
  deleteCartItem,
  fetchCartRaw,
  mapApiCart,
  replaceCartItem,
} from "../features/cart/services/cartService";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { createOrder, getProfile, getStorefront } from "../services/api";
import { paisaToBdt } from "../utils/money";
import CartScreen from "./CartScreen";
import CategoriesScreen from "./CategoriesScreen";
import CheckoutReviewScreen from "./CheckoutReviewScreen";
import ExpenseTrackerScreen from "./ExpenseTrackerScreen";
import HomeScreen from "./HomeScreen";
import HelpCenterScreen from "./HelpCenterScreen";
import OrderConfirmationScreen from "./OrderConfirmationScreen";
import OrdersScreen from "./OrdersScreen";
import PaymentScreen from "./PaymentScreen";
import ProductDetailsScreen from "./ProductDetailsScreen";
import ProfileScreen from "./ProfileScreen";
import SearchScreen from "./SearchScreen";
import ShippingScreen from "./ShippingScreen";

const STACK_ROUTES = {
  SEARCH: "search",
  HELP_CENTER: "help-center",
  PRODUCT_DETAILS: "product-details",
  SHIPPING: "shipping",
  PAYMENT: "payment",
  CHECKOUT_REVIEW: "checkout-review",
  ORDER_CONFIRMATION: "order-confirmation",
  ORDERS: "orders",
  EXPENSE_TRACKER: "expense-tracker",
};

// Data older than this is worth refreshing in the background; newer than this, a
// foreground event or a realtime subscribe is not a reason to re-download the catalog.
const STALE_AFTER_MS = 60_000;
// How long the app must actually have been backgrounded before returning counts as a
// return. Filters out the notification shade, permission dialogs and the sign-in bounce.
const MIN_BACKGROUND_MS = 5_000;
const REVISION_DEBOUNCE_MS = 300;
const EMPTY_STOREFRONT = {
  carouselSlides: [],
  activeFestivalDiscount: null,
  // Couriers and their delivery methods are admin-managed. Empty means checkout has nothing to
  // offer, which ShippingScreen surfaces rather than falling back to a hardcoded list.
  couriers: [],
};

const DEFAULT_ADDRESS = {
  customerName: "",
  phone: "",
  division: "",
  district: "",
  thana: "",
  shopName: "",
};

function storefrontForNow(value) {
  const next = value || EMPTY_STOREFRONT;
  const campaign = next.activeFestivalDiscount;
  if (!campaign) return next;

  const now = Date.now();
  const startsAt = new Date(campaign.startsAt).getTime();
  const endsAt = new Date(campaign.endsAt).getTime();
  if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && startsAt <= now && endsAt > now) {
    return next;
  }
  return { ...next, activeFestivalDiscount: null };
}

function prefetchVisibleStoreImages(catalog, storefront) {
  const products = [
    ...(catalog.featuredProducts || []),
    ...(catalog.newArrivals || []),
    ...(catalog.popularProducts || []),
  ];
  const urls = [
    storefront.carouselSlides?.[0]?.imageUrl,
    ...products.slice(0, 8).map((product) => product.image),
  ];
  void prefetchImages(urls).catch(() => {});
}

export default function MainTabs({ auth, onSignIn, onSignOut }) {
  const { t } = useTranslation();
  // Read directly, not through a ref like `t`: it is only used inside plain per-render
  // handlers (the order-confirmation labels), never as a memo dependency, so it cannot
  // re-create loadStore the way `t` used to. Its absence here was the "language is not
  // defined" crash on Place order.
  const { language } = useLanguage();
  const { colors } = useTheme();
  const styles = useStyles(getStyles);
  // Trail of visited tabs, most recent last, with Home pinned at the bottom so back always
  // terminates there. The active tab is derived rather than stored separately, so the two
  // cannot drift apart.
  const [tabHistory, setTabHistory] = useState([TAB_KEYS.HOME]);
  const activeTab = tabHistory[tabHistory.length - 1];
  const [mountedTabs, setMountedTabs] = useState(() => new Set([TAB_KEYS.HOME]));
  const [catalog, setCatalog] = useState({ categories: [] });
  const [storefront, setStorefront] = useState({ carouselSlides: [], activeFestivalDiscount: null });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  // Owned here rather than inside SearchScreen so it survives pushing a product on top of
  // the results — only the top of the stack is rendered, so the search screen unmounts.
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [stack, setStack] = useState([]);
  const [shippingMethodId, setShippingMethodId] = useState(null);
  // Which courier the buyer picked. Changing it clears the method, because a method belongs to
  // exactly one courier and carrying the old id across would price the order from the wrong row.
  const [courierId, setCourierId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
  const [savedAddress, setSavedAddress] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [dataStatus, setDataStatus] = useState("loading");
  const [dataError, setDataError] = useState("");
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const [catalogValidated, setCatalogValidated] = useState(false);
  const checkoutAttemptId = useRef(null);
  const loadStoreRef = useRef(null);
  const loadRequestRef = useRef(0);
  const cacheSnapshotRef = useRef(null);
  const contentGenerationRef = useRef(0);
  const lastRevisionRef = useRef(null);
  const lastRevisionCheckRef = useRef(0);
  const backgroundedAtRef = useRef(0);
  const silentFailuresRef = useRef(0);
  const stateRef = useRef({});
  // Read by the back handler so it can stay referentially stable and not re-subscribe on
  // every navigation.
  const stackRef = useRef([]);
  const tabHistoryRef = useRef([TAB_KEYS.HOME]);
  const handleContinueShoppingRef = useRef(() => {});
  const confirmExit = useExitConfirm();
  const isOffline = useNetworkStatus();

  // `t` is read through a ref rather than a dependency. As a dependency it changed
  // identity on every language switch, which re-created `loadStore` and re-downloaded the
  // entire 100-product catalog just because the user toggled EN/BN.
  const tRef = useRef(t);
  tRef.current = t;

  // The app's own Dialog rather than Alert.alert, for two reasons. Alert.alert is a no-op on
  // react-native-web — a guest tapping "Add to cart" in the browser saw nothing at all — and
  // even on Android a bare system alert is not the design: the ask is the message with the
  // Google button directly beneath it.
  const [signInDialogVisible, setSignInDialogVisible] = useState(false);
  const requestSignIn = useCallback(() => {
    setSignInDialogVisible(true);
  }, []);
  const handleSignInFromDialog = useCallback(() => {
    // Close first: signing in flips AppContent to the launch screen, and an open Modal
    // surviving that unmount is exactly the kind of orphan the web platform leaves behind.
    setSignInDialogVisible(false);
    onSignIn?.();
  }, [onSignIn]);

  // Cached public content can paint immediately, but cart/profile are still fetched and every
  // mutation remains gated until the cached catalogue revision has been confirmed.
  const loadStore = useCallback(async (mode = "initial", options = {}) => {
    const generation = contentGenerationRef.current;
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    if (mode !== "silent") {
      setDataStatus("loading");
      setDataError("");
    }
    try {
      const isClient = auth?.role === "CLIENT";
      const cachedSnapshot = options.cachedSnapshot ?? cacheSnapshotRef.current;
      const forceCatalog = options.forceCatalog || mode === "user";
      const includeAccountData = options.includeAccountData !== false;
      let revision = options.revision === null || options.revision === undefined
        ? null
        : String(options.revision);
      let revisionConfirmed = Boolean(revision);

      if (!revision) {
        try {
          revision = await getCurrentCatalogRevision();
          revisionConfirmed = Boolean(revision);
          lastRevisionCheckRef.current = Date.now();
        } catch {
          // A cached catalogue is still useful for offline browsing. Without a confirmed
          // revision it cannot enable add-to-cart or checkout.
          revision = null;
        }
      }

      const cacheMatches = Boolean(
        cachedSnapshot
        && !forceCatalog
        && (!revision || String(cachedSnapshot.catalogRevision) === revision)
      );
      const catalogPromise = cacheMatches
        ? Promise.resolve(cachedSnapshot.catalogRaw)
        : fetchCatalogRaw();

      const [storefrontResult, catalogResult, cartResult, profileResult] = await Promise.allSettled([
        getStorefront(),
        catalogPromise,
        isClient && includeAccountData ? fetchCartRaw() : Promise.resolve(null),
        isClient && includeAccountData ? getProfile() : Promise.resolve(null),
      ]);

      if (
        generation !== contentGenerationRef.current
        || requestId !== loadRequestRef.current
      ) return;
      if (catalogResult.status === "rejected") throw catalogResult.reason;

      const nextStorefront = storefrontForNow(
        (storefrontResult.status === "fulfilled" && storefrontResult.value?.data)
        || cachedSnapshot?.storefront
        || EMPTY_STOREFRONT
      );
      const festival = nextStorefront.activeFestivalDiscount;
      const nextCatalog = buildCatalog(catalogResult.value, festival);

      const effectiveRevision = revision || cachedSnapshot?.catalogRevision || null;
      if (effectiveRevision) {
        setCatalogCacheRevision(effectiveRevision);
        lastRevisionRef.current = String(effectiveRevision);
      }
      setStorefront(nextStorefront);
      setCatalog(nextCatalog);
      prefetchVisibleStoreImages(nextCatalog, nextStorefront);

      if (isClient && cartResult.status === "fulfilled" && cartResult.value) {
        setCartItems(mapApiCart(cartResult.value.data, nextCatalog, festival));
      }

      if (isClient && profileResult.status === "fulfilled" && profileResult.value) {
        const data = profileResult.value.data;
        const p = data?.profile;
        const loaded = {
          customerName: p?.name || data?.displayName || "",
          phone: p?.phone || "",
          division: p?.division?.name || "",
          district: p?.district?.name || "",
          thana: p?.thana?.name || "",
          shopName: p?.shopName || "",
        };
        setSavedAddress(loaded);
        setShippingAddress(loaded);
      }

      const catalogueIsCurrent = !cacheMatches
        || (revisionConfirmed && String(cachedSnapshot.catalogRevision) === revision);
      setCatalogValidated(catalogueIsCurrent);

      if (
        revision
        && storefrontResult.status === "fulfilled"
      ) {
        const saved = await writeCatalogSnapshot({
          catalogRevision: revision,
          catalogRaw: catalogResult.value,
          storefront: nextStorefront,
        });
        if (saved) cacheSnapshotRef.current = saved;
      }

      silentFailuresRef.current = 0;
      setDataStatus("ready");
    } catch (error) {
      if (
        generation !== contentGenerationRef.current
        || requestId !== loadRequestRef.current
      ) return;
      // A silent refresh must not destroy data the user is already looking at. Only
      // escalate to a visible error once background refreshes have failed repeatedly.
      if (mode === "silent") {
        silentFailuresRef.current += 1;
        if (silentFailuresRef.current >= 2) {
          setMutationError(getLocalizedError(error, tRef.current, "errors.loadStore"));
        }
        return;
      }
      setDataError(getLocalizedError(error, tRef.current, "errors.loadStore"));
      setDataStatus("error");
    }
  }, [auth?.role]);
  loadStoreRef.current = loadStore;

  useEffect(() => {
    let cancelled = false;
    void maintainImageDiskCache().catch(() => {});

    (async () => {
      const cachedSnapshot = await readCatalogSnapshot();
      if (cancelled) return;

      if (cachedSnapshot) {
        const cachedStorefront = storefrontForNow(cachedSnapshot.storefront);
        const cachedCatalog = buildCatalog(
          cachedSnapshot.catalogRaw,
          cachedStorefront.activeFestivalDiscount
        );
        cacheSnapshotRef.current = cachedSnapshot;
        lastRevisionRef.current = cachedSnapshot.catalogRevision;
        setCatalogCacheRevision(cachedSnapshot.catalogRevision);
        setStorefront(cachedStorefront);
        setCatalog(cachedCatalog);
        setDataStatus("ready");
        prefetchVisibleStoreImages(cachedCatalog, cachedStorefront);
      }

      await loadStore(cachedSnapshot ? "silent" : "initial", {
        cachedSnapshot,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [loadStore]);

  useEffect(() => {
    let refreshTimer;
    const invalidateAndRefresh = (nextRevision) => {
      const revision = nextRevision === null || nextRevision === undefined
        ? null
        : String(nextRevision);
      if (revision && revision === lastRevisionRef.current) return;

      if (revision) lastRevisionRef.current = revision;
      lastRevisionCheckRef.current = Date.now();
      contentGenerationRef.current += 1;
      cacheSnapshotRef.current = null;
      setCatalogValidated(false);
      setCatalogCacheRevision(revision);
      clearTimeout(refreshTimer);
      const invalidation = clearCatalogDataCache();
      refreshTimer = setTimeout(
        async () => {
          await invalidation;
          await loadStoreRef.current?.("silent", {
            forceCatalog: true,
            revision,
          });
        },
        REVISION_DEBOUNCE_MS
      );
    };

    const channel = supabase
      .channel("catalog-revision")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "catalog_revision", filter: "id=eq.1" },
        (payload) => {
          // The revision number used to be discarded, so every event forced a full
          // re-download. Skip events that do not actually advance the revision.
          invalidateAndRefresh(payload?.new?.revision ?? payload?.new?.updated_at ?? null);
        }
      )
      .subscribe();

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        backgroundedAtRef.current = Date.now();
        return;
      }
      const away = Date.now() - backgroundedAtRef.current;
      const checkIsStale = Date.now() - lastRevisionCheckRef.current > STALE_AFTER_MS;
      if (away <= MIN_BACKGROUND_MS || !checkIsStale) return;

      getCurrentCatalogRevision()
        .then((revision) => {
          lastRevisionCheckRef.current = Date.now();
          if (String(revision) !== String(lastRevisionRef.current)) {
            invalidateAndRefresh(revision);
            return;
          }
          return loadStoreRef.current?.("silent", {
            cachedSnapshot: cacheSnapshotRef.current,
            revision,
          });
        })
        .catch(() => {
          setCatalogValidated(false);
        });
    });
    return () => {
      clearTimeout(refreshTimer);
      appStateSubscription.remove();
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const endsAt = storefront.activeFestivalDiscount?.endsAt;
    if (!endsAt) return undefined;
    const delay = Math.max(0, new Date(endsAt).getTime() - Date.now() + 1000);
    const timeout = setTimeout(
      () => loadStore("silent", {
        cachedSnapshot: cacheSnapshotRef.current,
        revision: lastRevisionRef.current,
      }),
      Math.min(delay, 2_147_000_000)
    );
    return () => clearTimeout(timeout);
  }, [loadStore, storefront.activeFestivalDiscount?.endsAt]);

  // A scheduled campaign becoming active is a clock transition, not a database write, so it
  // cannot emit catalog_revision at that moment. Refresh only the tiny storefront response
  // once a minute while foregrounded; the cached catalog means no product request is made.
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState !== "active") return;
      void loadStore("silent", {
        cachedSnapshot: cacheSnapshotRef.current,
        revision: lastRevisionRef.current,
        includeAccountData: false,
      });
    }, STALE_AFTER_MS);
    return () => clearInterval(interval);
  }, [loadStore]);

  const screens = useMemo(
    () => ({
      [TAB_KEYS.HOME]: HomeScreen,
      [TAB_KEYS.CATEGORIES]: CategoriesScreen,
      [TAB_KEYS.CART]: CartScreen,
      [TAB_KEYS.PROFILE]: ProfileScreen,
    }),
    []
  );

  // A tab joins the mounted set the first time it is opened, and stays.
  useEffect(() => {
    setMountedTabs((current) => (current.has(activeTab) ? current : new Set(current).add(activeTab)));
  }, [activeTab]);

  // These two are the only handlers that must be referentially stable: `handleOpenProduct`
  // flows down to the memoized CatalogProductCard, and an unstable identity there defeated
  // the memo entirely, so every grid row re-rendered on every MainTabs render.
  const pushScreen = useCallback((name, params = {}) => {
    setStack((currentStack) => [...currentStack, { name, params }]);
  }, []);

  const popScreen = useCallback(() => {
    setStack((currentStack) => currentStack.slice(0, -1));
  }, []);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const currentRoute = stack[stack.length - 1] ?? null;
  const hasData = catalog.categories.length > 0;
  // A guest has no authenticated fallback request to retry. On any empty-store failure,
  // offer the one action that can move them forward instead of a retry loop.
  const showGuestSignIn = !auth?.isSignedIn;

  // Latest-value mirror of the state the stable handlers below need to read.
  stateRef.current = { cartItems, catalog, storefront, mutationBusy, catalogValidated };
  stackRef.current = stack;
  tabHistoryRef.current = tabHistory;
  // Resolved out of the admin-managed couriers rather than a hardcoded array.
  const couriers = storefront.couriers || [];
  const shippingMethod = findMethod(couriers, shippingMethodId);
  const paymentMethod = PAYMENT_OPTIONS.find((option) => option.id === paymentMethodId) ?? null;
  const checkoutTotals = getCheckoutTotals({
    cartItems,
    shippingCost: methodPriceBdt(shippingMethod),
    festivalCampaign: storefront.activeFestivalDiscount,
  });

  // Re-visiting a tab moves it to the top of the trail rather than appending, so the history
  // stays bounded by the tab count and back never walks a loop. Choosing Home explicitly
  // clears the trail — Home is then one press from the exit prompt.
  // WhatsApp is the entire support channel — there is no complaint feature — and the message
  // used to be a constant carrying no context at all. Passing the product code or order
  // number means the customer never has to read, remember or retype an identifier.
  const handleContactSupport = useCallback((context = null) => {
    const message = context?.productCode
      ? tRef.current("support.productMessage", {
          code: context.productCode,
          name: context.productName || "",
        })
      : context?.orderNumber
        ? tRef.current("support.orderMessage", { order: context.orderNumber })
        : tRef.current("profile.supportMessage");

    Linking.openURL(
      `https://wa.me/393202935579?text=${encodeURIComponent(message)}`
    ).catch(() => {
      Alert.alert(
        tRef.current("profile.linkErrorTitle"),
        tRef.current("profile.linkErrorMessage")
      );
    });
  }, []);

  const navigateToTab = useCallback((key) => {
    if (key === TAB_KEYS.CART && !auth?.isSignedIn) {
      requestSignIn();
      return;
    }
    // Support is an action, not a destination: it hands off to WhatsApp and leaves the user
    // exactly where they were. Returning before the history update is the point — switching to
    // it would mean coming back from WhatsApp to a tab that has no screen behind it, showing
    // as selected.
    if (key === TAB_KEYS.SUPPORT) {
      handleContactSupport();
      return;
    }
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === key) return prev;
      if (key === TAB_KEYS.HOME) return [TAB_KEYS.HOME];
      return [TAB_KEYS.HOME, ...prev.filter((tab) => tab !== TAB_KEYS.HOME && tab !== key), key];
    });
  }, [auth?.isSignedIn, requestSignIn, handleContactSupport]);

  const popTab = useCallback(() => {
    setTabHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleProfilePress = useCallback(() => navigateToTab(TAB_KEYS.PROFILE), [navigateToTab]);
  // Search is pushed rather than switched to: it is an action opened from the header, so
  // back returns to whichever tab you were on. Each fresh open starts with an empty query.
  const handleSearchPress = useCallback(() => {
    setSearchQuery("");
    pushScreen(STACK_ROUTES.SEARCH);
  }, [pushScreen]);
  const handleCartPress = useCallback(() => navigateToTab(TAB_KEYS.CART), [navigateToTab]);
  const handleViewCategory = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId);
    navigateToTab(TAB_KEYS.CATEGORIES);
  }, [navigateToTab]);
  const handleOpenProduct = useCallback(
    (product) => pushScreen(STACK_ROUTES.PRODUCT_DETAILS, { product }),
    [pushScreen]
  );
  const handleOrdersPress = useCallback(() => {
    if (!auth?.isSignedIn) {
      requestSignIn();
      return;
    }
    pushScreen(STACK_ROUTES.ORDERS);
  }, [auth?.isSignedIn, pushScreen, requestSignIn]);
  const handleExpenseTrackerPress = useCallback(
    () => {
      if (!auth?.isSignedIn) {
        requestSignIn();
        return;
      }
      pushScreen(STACK_ROUTES.EXPENSE_TRACKER);
    },
    [auth?.isSignedIn, pushScreen, requestSignIn]
  );
  const handleHelpCenterPress = useCallback(
    () => pushScreen(STACK_ROUTES.HELP_CENTER),
    [pushScreen]
  );
  // These handlers are passed to every screen and down into memoized rows, so they must
  // keep a stable identity. They read the volatile values they need from `stateRef`
  // instead of closing over them, which is what lets the dependency arrays stay empty.
  const runCartMutation = useCallback(async (operation) => {
    if (stateRef.current.mutationBusy) return;
    setMutationBusy(true);
    setMutationError("");
    try {
      setCartItems(await operation());
    } catch (error) {
      setMutationError(getLocalizedError(error, tRef.current, "errors.updateCart"));
    } finally {
      setMutationBusy(false);
    }
  }, []);
  // Reopens a cart line's pack in the configurator. Quantity, colours, sizes and pairs are
  // all edited together there — the old +/- steppers could not work, because the server
  // validates a line's stored allocations against its quantity and they scale together.
  const handleEditCartItem = useCallback((lineId) => {
    const { cartItems, catalog } = stateRef.current;
    const item = cartItems.find((entry) => entry.lineId === lineId);
    if (!item) return;
    const product = catalogProductFor(catalog, item.productId);
    // The product may have left the catalog since it was added; there is nothing to edit.
    if (!product) return;
    pushScreen(STACK_ROUTES.PRODUCT_DETAILS, {
      product,
      initialConfig: configFromCartLine(item),
      editingLine: { lineId: item.id, product, allocations: item.allocations, quantity: item.quantity },
    });
  }, [pushScreen]);
  const handleRemoveCartItem = useCallback((lineId) => {
    const { cartItems, catalog, storefront } = stateRef.current;
    const item = cartItems.find((entry) => entry.lineId === lineId);
    if (item) runCartMutation(() => deleteCartItem(item.id, catalog, storefront.activeFestivalDiscount));
  }, [runCartMutation]);
  const handleClearCart = () => {
    if (!cartItems.length || mutationBusy) return;
    Alert.alert(t("cart.clearTitle"), t("cart.clearMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("cart.clearAll"),
        style: "destructive",
        onPress: () =>
          // Was a sequential await loop — ten cart lines meant ten serial round-trips,
          // each re-mapping the whole cart response only for it to be discarded.
          runCartMutation(async () => {
            await Promise.all(
              cartItems.map((item) => deleteCartItem(item.id, catalog, storefront.activeFestivalDiscount))
            );
            return [];
          }),
      },
    ]);
  };
  // Handles both adding a new pack and saving an edit to an existing one. `editingLine` is
  // set only in the edit case and carries enough to restore the original if the save fails.
  const handleAddConfiguredProduct = async (configs, editingLine) => {
    if (!configs?.length || mutationBusy) return;
    if (!auth?.isSignedIn) {
      requestSignIn();
      return;
    }
    if (!catalogValidated) {
      setMutationError(t("errors.catalogRefreshing"));
      return;
    }
    setMutationBusy(true);
    setMutationError("");
    const festival = storefront.activeFestivalDiscount;
    try {
      let updatedCart = [];

      if (editingLine) {
        const [config] = configs;
        if (!config?.product?.id || !config?.allocations?.length) return;
        // No rollback branch any more. replaceCartItem is a single transactional PATCH, so a
        // failure leaves the original line exactly as it was — re-adding it here would now
        // duplicate the pack rather than restore it.
        updatedCart = await replaceCartItem(editingLine.lineId, config, catalog, festival);
      } else {
        for (const config of configs) {
          if (!config?.product?.id || !config?.allocations?.length) continue;
          updatedCart = await addConfiguredItem(config, catalog, festival);
        }
      }

      setCartItems(updatedCart);
      setStack([]);
      navigateToTab(TAB_KEYS.CART);
    } catch (error) {
      setMutationError(getLocalizedError(error, t, "errors.addProduct"));
    } finally {
      setMutationBusy(false);
    }
  };

  const handleStartCheckout = (couponCode) => {
    if (!auth?.isSignedIn) {
      requestSignIn();
      return;
    }
    if (!cartItems.length) {
      return;
    }
    if (!catalogValidated) {
      setMutationError(t("errors.catalogRefreshing"));
      return;
    }
    if (cartItems.some((item) => !item.configurationValid)) {
      setMutationError(t("cart.packInvalid"));
      return;
    }
    if (cartItems.some((item) => !item.moqSatisfied)) {
      setMutationError(t("cart.moqNotMet"));
      return;
    }

    setAppliedCoupon(couponCode ?? "");
    checkoutAttemptId.current = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pushScreen(STACK_ROUTES.SHIPPING);
  };

  const handleSignOut = () => {
    setStack([]);
    setTabHistory([TAB_KEYS.HOME]);
    onSignOut?.();
  };
  const handleContinueToPayment = () => {
    pushScreen(STACK_ROUTES.PAYMENT);
  };

  const handleContinueToReview = () => {
    pushScreen(STACK_ROUTES.CHECKOUT_REVIEW);
  };

  const handlePlaceOrder = async () => {
    if (mutationBusy) return;
    if (!auth?.isSignedIn) {
      requestSignIn();
      return;
    }
    if (!catalogValidated) {
      setMutationError(t("errors.catalogRefreshing"));
      return;
    }
    setMutationBusy(true);
    setMutationError("");
    try {
      const itemCount = cartCount;
      if (!checkoutAttemptId.current) {
        checkoutAttemptId.current = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      const response = await createOrder({
        idempotencyKey: checkoutAttemptId.current,
        address: shippingMethod?.requiresAddress ? shippingAddress : undefined,
        // Only the id: the server reads the price from that row, so no amount is ever sent
        // from the client. Pickup has no row — it goes as the text code, and with no id the
        // server's delivery charge falls through to zero, which is what pickup costs.
        ...(isPickup(shippingMethodId)
          ? { shippingMethod: "PICKUP" }
          : { shippingMethodId: shippingMethod ? Number(shippingMethod.id) : undefined }),
        paymentMethod: paymentMethod?.id === "bank" ? "BANK_TRANSFER" : "COD",
      });
      const order = response.data;
      if (!order?.id && !order?.orderNumber) {
        throw new Error(t("errors.serverConfirmation"));
      }
      setOrderConfirmation({
        id: order.orderNumber || String(order.id),
        itemCount,
        packs: cartItems,
        total: paisaToBdt(order.grandTotalPaisa),
        shippingMethodLabel: shippingMethod ? methodLabel(shippingMethod, language) : "",
        paymentMethodKey: paymentMethod?.labelKey || "status.unpaid",
        etaLabel: shippingMethod ? formatDeliveryDays(shippingMethod, language, t) : "",
        status: order.status,
      });
      setCartItems([]);
      setShippingMethodId(null);
      setCourierId(null);
      setShippingAddress(DEFAULT_ADDRESS);
      setPaymentMethodId(null);
      setAppliedCoupon("");
      checkoutAttemptId.current = null;
      setStack([{ name: STACK_ROUTES.ORDER_CONFIRMATION, params: {} }]);
    } catch (error) {
      setMutationError(getLocalizedError(error, t, "errors.placeOrder"));
    } finally {
      setMutationBusy(false);
    }
  };

  const handleContinueShopping = () => {
    checkoutAttemptId.current = null;
    setStack([]);
    setTabHistory([TAB_KEYS.HOME]);
  };
  handleContinueShoppingRef.current = handleContinueShopping;

  const handleTrackOrder = () => {
    setStack([{ name: STACK_ROUTES.ORDERS, params: {} }]);
  };

  // Android hardware back, in priority order. Every branch returns true — the app is only
  // ever closed through the explicit confirmation at the end, never by falling through.
  //
  // Three things never reach here because Android consumes them first, which is correct:
  // the fullscreen image viewer (it has its own onRequestClose), any Alert dialog, and the
  // soft keyboard. On the Search tab the input auto-focuses, so the first press there closes
  // the keyboard and appears to do nothing.
  const handleHardwareBack = useCallback(() => {
    // An order is in flight — do not let the user navigate out from under it.
    if (stateRef.current.mutationBusy) return true;

    const route = stackRef.current[stackRef.current.length - 1] ?? null;

    // The confirmation screen's own back chevron goes Home; hardware back must match it,
    // rather than popping onto the now-empty cart.
    if (route?.name === STACK_ROUTES.ORDER_CONFIRMATION) {
      handleContinueShoppingRef.current();
      return true;
    }
    if (stackRef.current.length) {
      popScreen();
      return true;
    }
    if (tabHistoryRef.current.length > 1) {
      popTab();
      return true;
    }

    // Home with nothing left to unwind.
    return confirmExit();
  }, [confirmExit, popScreen, popTab]);

  useBackHandler(handleHardwareBack);

  const renderStackScreen = () => {
    if (!currentRoute) {
      return null;
    }

    switch (currentRoute.name) {
      case STACK_ROUTES.SEARCH:
        return (
          <SearchScreen
            catalog={catalog}
            onOpenProduct={handleOpenProduct}
            onBack={popScreen}
            query={searchQuery}
            onQueryChange={setSearchQuery}
          />
        );
      case STACK_ROUTES.PRODUCT_DETAILS:
        return (
          <ProductDetailsScreen
            product={currentRoute.params.product}
            initialConfig={currentRoute.params.initialConfig}
            editingLine={currentRoute.params.editingLine}
            onBack={popScreen}
            onAddConfiguredProduct={handleAddConfiguredProduct}
            onContactSupport={handleContactSupport}
            festivalCampaign={storefront.activeFestivalDiscount}
          />
        );
      case STACK_ROUTES.SHIPPING:
        return (
          <ShippingScreen
            cartItems={cartItems}
            appliedCoupon={appliedCoupon}
            festivalCampaign={storefront.activeFestivalDiscount}
            couriers={couriers}
            courierId={courierId}
            shippingMethod={shippingMethodId}
            shippingAddress={shippingAddress}
            savedAddress={savedAddress}
            onBack={popScreen}
            onSelectCourier={(nextCourierId) => {
              setCourierId(nextCourierId);
              // Pickup has no method to choose, so selecting it settles both at once.
              setShippingMethodId(isPickup(nextCourierId) ? nextCourierId : null);
            }}
            onSelectShipping={setShippingMethodId}
            onAddressChange={setShippingAddress}
            onContinue={handleContinueToPayment}
          />
        );
      case STACK_ROUTES.PAYMENT:
        return (
          <PaymentScreen
            paymentMethod={paymentMethodId}
            onBack={popScreen}
            onSelectPayment={setPaymentMethodId}
            onContinue={handleContinueToReview}
          />
        );
      case STACK_ROUTES.CHECKOUT_REVIEW:
        return (
          <CheckoutReviewScreen
            cartItems={cartItems}
            shippingMethod={shippingMethod}
            paymentMethod={paymentMethod}
            totals={checkoutTotals}
            onBack={popScreen}
            onPlaceOrder={handlePlaceOrder}
            busy={mutationBusy}
            error={mutationError}
          />
        );
      case STACK_ROUTES.ORDER_CONFIRMATION:
        return (
          <OrderConfirmationScreen
            order={orderConfirmation}
            onTrackOrder={handleTrackOrder}
            onContinueShopping={handleContinueShopping}
          />
        );
      case STACK_ROUTES.ORDERS:
        return <OrdersScreen onBack={popScreen} onContactSupport={handleContactSupport} />;
      case STACK_ROUTES.EXPENSE_TRACKER:
        return <ExpenseTrackerScreen onBack={popScreen} />;
      case STACK_ROUTES.HELP_CENTER:
        return (
          <HelpCenterScreen
            onBack={popScreen}
            onContactSupport={handleContactSupport}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {Object.entries(screens).map(([screenKey, ScreenComponent]) => {
        // Tabs mount on first visit and stay mounted. Previously all five mounted on the
        // first render and never unmounted, so four invisible screen trees — their effects,
        // timers, images and ~280 text nodes — stayed live for the whole session.
        if (!mountedTabs.has(screenKey)) return null;

        return (
        <View key={screenKey} style={screenKey === activeTab ? styles.activeScreen : styles.hiddenScreen}>
          <ScreenComponent
            activeTab={activeTab}
            onTabPress={navigateToTab}
            onProfilePress={handleProfilePress}
            onSearchPress={handleSearchPress}
            onCartPress={handleCartPress}
            catalog={catalog}
            storefront={storefront}
            festivalCampaign={storefront.activeFestivalDiscount}
            selectedCategoryId={selectedCategoryId}
            onViewCategory={handleViewCategory}
            onOpenProduct={handleOpenProduct}
            cartItems={cartItems}
            cartCount={cartCount}
            onEditCartItem={handleEditCartItem}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleStartCheckout}
            loading={dataStatus === "loading" || mutationBusy}
            error={mutationError}
            auth={auth}
            onSignIn={onSignIn}
            onSignOut={handleSignOut}
            onOrdersPress={handleOrdersPress}
            onExpenseTrackerPress={handleExpenseTrackerPress}
            onHelpCenterPress={handleHelpCenterPress}
          />
        </View>
        );
      })}
      {currentRoute ? <View style={styles.stackOverlay}>{renderStackScreen()}</View> : null}
      {/* Rendered after the stack so it sits above a pushed checkout screen — losing signal
          on the payment step is exactly when this needs to be readable. */}
      <OfflineBanner visible={isOffline} />
      {/* The loading and error overlays are opaque and cover the whole app, so they are
          only allowed to appear when there is genuinely nothing to show. A background
          refresh over existing content stays silent. */}
      {dataStatus === "loading" && !hasData ? (
        <NoboSoleLoader
          style={styles.loaderOverlay}
          accessibilityLabel={`NoboSole ${t("common.loading")}`}
        />
      ) : null}
      {dataStatus === "error" && !hasData ? (
        <View style={styles.statusOverlay} accessibilityLiveRegion="assertive">
          <AppText variant="h2" style={styles.statusTitle}>
            {showGuestSignIn ? t("guest.signInRequiredTitle") : t("errors.storeUnavailable")}
          </AppText>
          <AppText variant="body" tone="secondary" style={styles.statusText}>
            {dataError}
          </AppText>
          <Button
            title={
              showGuestSignIn ? t("launch.googleSignIn") : t("common.retry")
            }
            // Wrapped so the press event cannot land in the `mode` parameter.
            onPress={
              showGuestSignIn ? onSignIn : () => loadStore("user")
            }
            size="md"
            fullWidth={false}
            style={styles.retryButton}
          />
        </View>
      ) : null}
      {mutationError && !currentRoute ? (
        <View style={styles.errorBanner} accessibilityLiveRegion="assertive">
          <AppText variant="bodySm" tone="onError" style={styles.errorBannerText}>
            {mutationError}
          </AppText>
        </View>
      ) : null}
      {/* Guest sign-in prompt: shown whenever a guest reaches an action that needs an
          account (cart tab, add to cart, checkout, orders). One dialog serves every gate. */}
      <Dialog
        visible={signInDialogVisible}
        onDismiss={() => setSignInDialogVisible(false)}
        accessibilityLabel={`${t("guest.signInRequiredTitle")} ${t("guest.signInRequiredMessage")}`}
      >
        <AppText variant="h2" style={styles.signInDialogTitle}>
          {t("guest.signInRequiredTitle")}
        </AppText>
        <AppText variant="body" tone="secondary" style={styles.signInDialogBody}>
          {t("guest.signInRequiredMessage")}
        </AppText>
        <View style={styles.signInDialogActions}>
          <Button title={t("launch.googleSignIn")} onPress={handleSignInFromDialog} />
          <Button
            title={t("common.cancel")}
            onPress={() => setSignInDialogVisible(false)}
            variant="secondary"
          />
        </View>
      </Dialog>
    </View>
  );
}

// Previously a module-level StyleSheet with seven hardcoded colours, which meant the
// loading and error overlays rendered dark-on-dark in light mode.
const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    activeScreen: {
      flex: 1,
    },
    hiddenScreen: {
      display: "none",
    },
    stackOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 10,
    },
    loaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 30,
    },
    statusOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 30,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xxxl,
    },
    statusTitle: {
      marginBottom: spacing.sm + 2,
      textAlign: "center",
    },
    statusText: {
      textAlign: "center",
      marginTop: spacing.md,
    },
    retryButton: {
      marginTop: spacing.xxl - 2,
    },
    errorBanner: {
      position: "absolute",
      left: spacing.lg,
      right: spacing.lg,
      bottom: 88,
      zIndex: 25,
      backgroundColor: colors.error,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    errorBannerText: {
      textAlign: "center",
      fontWeight: "600",
    },
    signInDialogTitle: {
      marginBottom: spacing.md,
    },
    signInDialogBody: {
      marginBottom: spacing.xxl,
    },
    signInDialogActions: {
      gap: spacing.md,
    },
  });
