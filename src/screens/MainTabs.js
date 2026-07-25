import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { getLocalizedError } from "../i18n/errors";
import { supabase } from "../config/supabase";

import { TAB_KEYS } from "../data/tabs";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { SHIPPING_OPTIONS } from "../features/checkout/data/shippingOptions";
import { fetchCatalog } from "../features/catalog/services/catalogService";
import {
  addConfiguredItem,
  changeCartItem,
  deleteCartItem,
  fetchCart,
} from "../features/cart/services/cartService";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { createOrder, getProfile, getStorefront } from "../services/api";
import { paisaToBdt } from "../utils/money";
import CartScreen from "./CartScreen";
import CategoriesScreen from "./CategoriesScreen";
import CheckoutReviewScreen from "./CheckoutReviewScreen";
import ExpenseTrackerScreen from "./ExpenseTrackerScreen";
import HomeScreen from "./HomeScreen";
import OrderConfirmationScreen from "./OrderConfirmationScreen";
import OrdersScreen from "./OrdersScreen";
import PaymentScreen from "./PaymentScreen";
import ProductDetailsScreen from "./ProductDetailsScreen";
import ProfileScreen from "./ProfileScreen";
import SearchScreen from "./SearchScreen";
import ShippingScreen from "./ShippingScreen";

const STACK_ROUTES = {
  PRODUCT_DETAILS: "product-details",
  SHIPPING: "shipping",
  PAYMENT: "payment",
  CHECKOUT_REVIEW: "checkout-review",
  ORDER_CONFIRMATION: "order-confirmation",
  ORDERS: "orders",
  EXPENSE_TRACKER: "expense-tracker",
};

const DEFAULT_ADDRESS = {
  customerName: "",
  phone: "",
  division: "",
  district: "",
  thana: "",
  shopName: "",
};

export default function MainTabs({ auth, onSignOut }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TAB_KEYS.HOME);
  const [catalog, setCatalog] = useState({ categories: [] });
  const [storefront, setStorefront] = useState({ carouselSlides: [], activeFestivalDiscount: null });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [stack, setStack] = useState([]);
  const [shippingMethodId, setShippingMethodId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
  const [savedAddress, setSavedAddress] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [dataStatus, setDataStatus] = useState("loading");
  const [dataError, setDataError] = useState("");
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const checkoutAttemptId = useRef(null);
  const loadStoreRef = useRef(null);

  const loadStore = useCallback(async () => {
    setDataStatus("loading");
    setDataError("");
    try {
      const storefrontResponse = await getStorefront();
      const nextStorefront = storefrontResponse.data || { carouselSlides: [], activeFestivalDiscount: null };
      const nextCatalog = await fetchCatalog(nextStorefront.activeFestivalDiscount);
      setStorefront(nextStorefront);
      setCatalog(nextCatalog);
      if (auth?.role === "CLIENT") {
        setCartItems(await fetchCart(nextCatalog, nextStorefront.activeFestivalDiscount));
        try {
          const profileResponse = await getProfile();
          const data = profileResponse.data;
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
        } catch {
          // profile fetch is best-effort; fall back to empty address
        }
      }
      setDataStatus("ready");
    } catch (error) {
      setDataError(getLocalizedError(error, t, "errors.loadStore"));
      setDataStatus("error");
    }
  }, [auth?.role, t]);
  loadStoreRef.current = loadStore;

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    let refreshTimer;
    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => loadStoreRef.current?.(), 500);
    };
    const channel = supabase
      .channel("catalog-revision")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "catalog_revision", filter: "id=eq.1" },
        scheduleRefresh
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") scheduleRefresh();
      });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") scheduleRefresh();
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
    const timeout = setTimeout(loadStore, Math.min(delay, 2_147_000_000));
    return () => clearTimeout(timeout);
  }, [loadStore, storefront.activeFestivalDiscount?.endsAt]);

  const screens = useMemo(
    () => ({
      [TAB_KEYS.HOME]: HomeScreen,
      [TAB_KEYS.CATEGORIES]: CategoriesScreen,
      [TAB_KEYS.SEARCH]: SearchScreen,
      [TAB_KEYS.CART]: CartScreen,
      [TAB_KEYS.PROFILE]: ProfileScreen,
    }),
    []
  );

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const currentRoute = stack[stack.length - 1] ?? null;
  const shippingMethod = SHIPPING_OPTIONS.find((option) => option.id === shippingMethodId) ?? null;
  const paymentMethod = PAYMENT_OPTIONS.find((option) => option.id === paymentMethodId) ?? null;
  const checkoutTotals = getCheckoutTotals({
    cartItems,
    shippingCost: shippingMethod?.price ?? 0,
    festivalCampaign: storefront.activeFestivalDiscount,
  });

  const pushScreen = (name, params = {}) => {
    setStack((currentStack) => [...currentStack, { name, params }]);
  };

  const popScreen = () => {
    setStack((currentStack) => currentStack.slice(0, -1));
  };

  const handleProfilePress = () => setActiveTab(TAB_KEYS.PROFILE);
  const handleSearchPress = () => setActiveTab(TAB_KEYS.SEARCH);
  const handleCartPress = () => setActiveTab(TAB_KEYS.CART);
  const handleViewCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveTab(TAB_KEYS.CATEGORIES);
  };
  const handleOpenProduct = (product) => pushScreen(STACK_ROUTES.PRODUCT_DETAILS, { product });
  const runCartMutation = async (operation) => {
    if (mutationBusy) return;
    setMutationBusy(true);
    setMutationError("");
    try {
      setCartItems(await operation());
    } catch (error) {
      setMutationError(getLocalizedError(error, t, "errors.updateCart"));
    } finally {
      setMutationBusy(false);
    }
  };
  const handleIncreaseCartItem = (lineId) => {
    const item = cartItems.find((entry) => entry.lineId === lineId);
    if (item) runCartMutation(() => changeCartItem(item.id, item.quantity + 1, catalog, storefront.activeFestivalDiscount));
  };
  const handleDecreaseCartItem = (lineId) => {
    const item = cartItems.find((entry) => entry.lineId === lineId);
    if (item && item.quantity > 1) {
      runCartMutation(() => changeCartItem(item.id, item.quantity - 1, catalog, storefront.activeFestivalDiscount));
    }
  };
  const handleRemoveCartItem = (lineId) => {
    const item = cartItems.find((entry) => entry.lineId === lineId);
    if (item) runCartMutation(() => deleteCartItem(item.id, catalog, storefront.activeFestivalDiscount));
  };
  const handleClearCart = () => {
    if (!cartItems.length || mutationBusy) return;
    Alert.alert(t("cart.clearTitle"), t("cart.clearMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("cart.clearAll"),
        style: "destructive",
        onPress: () =>
          runCartMutation(async () => {
            for (const item of cartItems) await deleteCartItem(item.id, catalog, storefront.activeFestivalDiscount);
            return [];
          }),
      },
    ]);
  };
  const handleAddConfiguredProduct = async (config) => {
    if (!config?.product?.id || !config?.allocations?.length || mutationBusy) return;
    setMutationBusy(true);
    setMutationError("");
    try {
      setCartItems(await addConfiguredItem(config, catalog, storefront.activeFestivalDiscount));
      setStack([]);
      setActiveTab(TAB_KEYS.CART);
    } catch (error) {
      setMutationError(getLocalizedError(error, t, "errors.addProduct"));
    } finally {
      setMutationBusy(false);
    }
  };

  const handleStartCheckout = (couponCode) => {
    if (!cartItems.length) {
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
    setActiveTab(TAB_KEYS.HOME);
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
        shippingMethod: shippingMethod?.id?.toUpperCase(),
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
        shippingMethodKey: shippingMethod?.labelKey || "checkout.pickup",
        paymentMethodKey: paymentMethod?.labelKey || "status.unpaid",
        etaKey: shippingMethod?.descriptionKey || "checkout.pickupDescription",
        status: order.status,
      });
      setCartItems([]);
      setShippingMethodId(null);
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
    setActiveTab(TAB_KEYS.HOME);
  };

  const handleTrackOrder = () => {
    setStack([{ name: STACK_ROUTES.ORDERS, params: {} }]);
  };

  const renderStackScreen = () => {
    if (!currentRoute) {
      return null;
    }

    switch (currentRoute.name) {
      case STACK_ROUTES.PRODUCT_DETAILS:
        return (
          <ProductDetailsScreen
            product={currentRoute.params.product}
            onBack={popScreen}
            onAddConfiguredProduct={handleAddConfiguredProduct}
          />
        );
      case STACK_ROUTES.SHIPPING:
        return (
          <ShippingScreen
            cartItems={cartItems}
            appliedCoupon={appliedCoupon}
            shippingMethod={shippingMethodId}
            shippingAddress={shippingAddress}
            savedAddress={savedAddress}
            onBack={popScreen}
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
        return <OrdersScreen onBack={popScreen} />;
      case STACK_ROUTES.EXPENSE_TRACKER:
        return <ExpenseTrackerScreen onBack={popScreen} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {Object.entries(screens).map(([screenKey, ScreenComponent]) => (
        <View key={screenKey} style={screenKey === activeTab ? styles.activeScreen : styles.hiddenScreen}>
          <ScreenComponent
            activeTab={activeTab}
            onTabPress={setActiveTab}
            onProfilePress={handleProfilePress}
            onSearchPress={handleSearchPress}
            onCartPress={handleCartPress}
            catalog={catalog}
            storefront={storefront}
            festivalCampaign={storefront.activeFestivalDiscount}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onViewCategory={handleViewCategory}
            onOpenProduct={handleOpenProduct}
            cartItems={cartItems}
            cartCount={cartCount}
            onIncreaseCartItem={handleIncreaseCartItem}
            onDecreaseCartItem={handleDecreaseCartItem}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleStartCheckout}
            loading={dataStatus === "loading" || mutationBusy}
            error={mutationError}
            auth={auth}
            onSignOut={handleSignOut}
            onOrdersPress={() => pushScreen(STACK_ROUTES.ORDERS)}
            onExpenseTrackerPress={() => pushScreen(STACK_ROUTES.EXPENSE_TRACKER)}
          />
        </View>
      ))}
      {currentRoute ? <View style={styles.stackOverlay}>{renderStackScreen()}</View> : null}
      {dataStatus === "loading" ? (
        <View style={styles.statusOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.statusText}>{t("common.loading")}</Text>
        </View>
      ) : null}
      {dataStatus === "error" ? (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusTitle}>{t("errors.storeUnavailable")}</Text>
          <Text style={styles.statusText}>{dataError}</Text>
          <Pressable style={styles.retryButton} onPress={loadStore}>
            <Text style={styles.retryText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      ) : null}
      {mutationError ? (
        <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{mutationError}</Text></View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    backgroundColor: "rgba(10,14,39,0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  statusTitle: { color: "#ffffff", fontSize: 24, fontWeight: "800", marginBottom: 10 },
  statusText: { color: "#cbd5e1", fontSize: 15, textAlign: "center", marginTop: 12 },
  retryButton: { marginTop: 22, backgroundColor: "#ffffff", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  retryText: { color: "#0a0e27", fontSize: 15, fontWeight: "800" },
  errorBanner: { position: "absolute", left: 16, right: 16, bottom: 88, zIndex: 25, backgroundColor: "#b91c1c", borderRadius: 14, padding: 12 },
  errorBannerText: { color: "#ffffff", fontSize: 14, textAlign: "center", fontWeight: "600" },
});
