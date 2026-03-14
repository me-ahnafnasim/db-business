import shoeCatalog from "../data/shoeCatalog.json";
import { enrichCatalogWithProductConfig } from "../utils/productConfigurator";

export async function fetchCatalog() {
  return Promise.resolve(enrichCatalogWithProductConfig(shoeCatalog));
}
