import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { TAB_KEYS } from "../data/tabs";
import MoqModal from "../features/catalog/components/MoqModal";
import { fetchCatalog } from "../features/catalog/services/catalogService";
import CartScreen from "./CartScreen";
import CategoriesScreen from "./CategoriesScreen";
import HomeScreen from "./HomeScreen";
import ProfileScreen from "./ProfileScreen";
import SearchScreen from "./SearchScreen";

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.HOME);
  const [catalog, setCatalog] = useState({ categories: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [moqProduct, setMoqProduct] = useState(null);

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

  const handleProfilePress = () => setActiveTab(TAB_KEYS.PROFILE);
  const handleSearchPress = () => setActiveTab(TAB_KEYS.SEARCH);
  const handleCartPress = () => setActiveTab(TAB_KEYS.CART);
  const handleViewCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setActiveTab(TAB_KEYS.CATEGORIES);
  };
  const handleRequestAddToCart = (product) => setMoqProduct(product);
  const handleIncreaseCartItem = (productId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };
  const handleDecreaseCartItem = (productId) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, quantity: Math.max(item.moq, item.quantity - 1) } : item
      )
    );
  };
  const handleRemoveCartItem = (productId) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.id !== productId));
  };
  const handleClearCart = () => setCartItems([]);
  const handleConfirmAddToCart = () => {
    if (!moqProduct) {
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === moqProduct.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === moqProduct.id ? { ...item, quantity: item.quantity + moqProduct.moq } : item
        );
      }

      return [...currentItems, { ...moqProduct, quantity: moqProduct.moq }];
    });
    setMoqProduct(null);
    setActiveTab(TAB_KEYS.CART);
  };

  return (
    <>
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
            onAddToCart={handleRequestAddToCart}
            cartItems={cartItems}
            cartCount={cartCount}
            onIncreaseCartItem={handleIncreaseCartItem}
            onDecreaseCartItem={handleDecreaseCartItem}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
          />
        </View>
      ))}
      <MoqModal
        product={moqProduct}
        visible={Boolean(moqProduct)}
        onClose={() => setMoqProduct(null)}
        onConfirm={handleConfirmAddToCart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  activeScreen: {
    flex: 1,
  },
  hiddenScreen: {
    display: "none",
  },
});
