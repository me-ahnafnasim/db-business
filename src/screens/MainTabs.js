import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { TAB_KEYS } from "../data/tabs";
import { PAYMENT_OPTIONS } from "../features/checkout/data/paymentOptions";
import { SHIPPING_OPTIONS } from "../features/checkout/data/shippingOptions";
import { getMockAccount, normalizeDisplayName } from "../features/auth/utils/authRole";
import { fetchCatalog } from "../features/catalog/services/catalogService";
import { buildCartLineId } from "../features/catalog/utils/productConfigurator";
import { getCheckoutTotals } from "../features/checkout/utils/checkoutPricing";
import { buildMockOrder } from "../features/order/utils/orderBuilder";
import AdminPanelScreen from "./AdminPanelScreen";
import CartScreen from "./CartScreen";
import CategoriesScreen from "./CategoriesScreen";
import CheckoutReviewScreen from "./CheckoutReviewScreen";
import HomeScreen from "./HomeScreen";
import OrderConfirmationScreen from "./OrderConfirmationScreen";
import PaymentScreen from "./PaymentScreen";
import ProductDetailsScreen from "./ProductDetailsScreen";
import ProfileScreen from "./ProfileScreen";
import SearchScreen from "./SearchScreen";
import ShippingScreen from "./ShippingScreen";
import SignInGateScreen from "./SignInGateScreen";

const STACK_ROUTES = {
  PRODUCT_DETAILS: "product-details",
  SIGN_IN: "sign-in",
  ADMIN_PANEL: "admin-panel",
  SHIPPING: "shipping",
  PAYMENT: "payment",
  CHECKOUT_REVIEW: "checkout-review",
  ORDER_CONFIRMATION: "order-confirmation",
};

const DEFAULT_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  postalCode: "",
};

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.HOME);
  const [catalog, setCatalog] = useState({ categories: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [stack, setStack] = useState([]);
  const [auth, setAuth] = useState({
    isSignedIn: false,
    email: "",
    displayName: "",
    role: null,
  });
  const [authError, setAuthError] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState(null);
  const [shippingAddress, setShippingAddress] = useState(DEFAULT_ADDRESS);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      const data = await fetchCatalog();
      setCatalog(data);
    }

    loadCatalog();
  }, []);

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
    appliedCoupon,
  });

  const pushScreen = (name, params = {}) => {
    setStack((currentStack) => [...currentStack, { name, params }]);
  };

  const popScreen = () => {
    setStack((currentStack) => currentStack.slice(0, -1));
  };

  const replaceTopScreen = (name, params = {}) => {
    setStack((currentStack) => {
      if (!currentStack.length) {
        return [{ name, params }];
      }

      return [...currentStack.slice(0, -1), { name, params }];
    });
  };

  const handleProfilePress = () => setActiveTab(TAB_KEYS.PROFILE);
  const handleSearchPress = () => setActiveTab(TAB_KEYS.SEARCH);
  const handleCartPress = () => setActiveTab(TAB_KEYS.CART);
  const handleViewCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveTab(TAB_KEYS.CATEGORIES);
  };
  const handleOpenProduct = (product) => pushScreen(STACK_ROUTES.PRODUCT_DETAILS, { product });
  const handleIncreaseCartItem = (lineId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };
  const handleDecreaseCartItem = (lineId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.lineId === lineId ? { ...item, quantity: Math.max(item.moq, item.quantity - 1) } : item
      )
    );
  };
  const handleRemoveCartItem = (lineId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.lineId !== lineId));
  };
  const handleClearCart = () => setCartItems([]);
  const handleAddConfiguredProduct = (config) => {
    if (!config?.product) {
      return;
    }

    const lineId = buildCartLineId({
      productId: config.product.id,
      selectedColor: config.selectedColorValue,
      selectedSize: config.selectedSizeValue,
      hasCustomLogo: config.hasCustomLogo,
      logoFileName: config.logoFileName,
    });

    const cartLine = {
      ...config.product,
      lineId,
      unitPrice: config.unitPrice,
      quantity: config.quantity,
      selectedColor: config.selectedColor,
      selectedColorValue: config.selectedColorValue,
      selectedSize: config.selectedSize,
      selectedSizeValue: config.selectedSizeValue,
      hasCustomLogo: config.hasCustomLogo,
      logoFileName: config.logoFileName,
    };

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.lineId === lineId);

      if (existingItem) {
        return currentItems.map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + config.quantity } : item
        );
      }

      return [...currentItems, cartLine];
    });

    setStack([]);
    setActiveTab(TAB_KEYS.CART);
  };

  const handleStartCheckout = (couponCode) => {
    if (!cartItems.length) {
      return;
    }

    setAppliedCoupon(couponCode ?? "");

    if (!auth.isSignedIn) {
      pushScreen(STACK_ROUTES.SIGN_IN, { postLoginRoute: { name: STACK_ROUTES.SHIPPING, params: {} } });
      return;
    }

    pushScreen(STACK_ROUTES.SHIPPING);
  };

  const handleOpenSignIn = (postLoginRoute = null) => {
    setAuthError("");
    pushScreen(STACK_ROUTES.SIGN_IN, { postLoginRoute });
  };

  const resolvePostLoginRoute = (postLoginRoute) => {
    if (!postLoginRoute?.name) {
      popScreen();
      return;
    }

    replaceTopScreen(postLoginRoute.name, postLoginRoute.params ?? {});
  };

  const handleSignIn = ({ displayName, email, password, role }) => {
    const account = getMockAccount(email, password, role);

    if (!account) {
      setAuthError("Invalid credentials. Use the hardcoded admin or user account.");
      return;
    }

    const nextAuth = {
      isSignedIn: true,
      email: account.email,
      displayName: normalizeDisplayName(displayName, account.displayName || account.email),
      role: account.role,
    };

    setAuth(nextAuth);
    setAuthError("");

    if (account.role === "admin") {
      replaceTopScreen(STACK_ROUTES.ADMIN_PANEL);
      return;
    }

    resolvePostLoginRoute(currentRoute?.params?.postLoginRoute);
  };

  const handleSignOut = () => {
    setAuth({
      isSignedIn: false,
      email: "",
      displayName: "",
      role: null,
    });
    setStack([]);
    setActiveTab(TAB_KEYS.PROFILE);
  };

  const handleContinueToPayment = () => {
    pushScreen(STACK_ROUTES.PAYMENT);
  };

  const handleContinueToReview = () => {
    pushScreen(STACK_ROUTES.CHECKOUT_REVIEW);
  };

  const handlePlaceOrder = () => {
    const order = buildMockOrder({
      cartItems,
      totals: checkoutTotals,
      shippingMethod,
      paymentMethod,
    });

    setOrderConfirmation(order);
    setCartItems([]);
    setShippingMethodId(null);
    setShippingAddress(DEFAULT_ADDRESS);
    setPaymentMethodId(null);
    setAppliedCoupon("");
    setStack([{ name: STACK_ROUTES.ORDER_CONFIRMATION, params: {} }]);
  };

  const handleContinueShopping = () => {
    setStack([]);
    setActiveTab(TAB_KEYS.HOME);
  };

  const handleTrackOrder = () => {
    setStack([]);
    setActiveTab(TAB_KEYS.PROFILE);
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
      case STACK_ROUTES.SIGN_IN:
        return <SignInGateScreen onBack={popScreen} onSignIn={handleSignIn} errorMessage={authError} />;
      case STACK_ROUTES.ADMIN_PANEL:
        return <AdminPanelScreen auth={auth} onBack={popScreen} onSignOut={handleSignOut} />;
      case STACK_ROUTES.SHIPPING:
        return (
          <ShippingScreen
            cartItems={cartItems}
            appliedCoupon={appliedCoupon}
            shippingMethod={shippingMethodId}
            shippingAddress={shippingAddress}
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
            auth={auth}
            onSignInPress={() => handleOpenSignIn()}
            onSignOut={handleSignOut}
            onAdminPress={() => pushScreen(STACK_ROUTES.ADMIN_PANEL)}
          />
        </View>
      ))}
      {currentRoute ? <View style={styles.stackOverlay}>{renderStackScreen()}</View> : null}
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
});
