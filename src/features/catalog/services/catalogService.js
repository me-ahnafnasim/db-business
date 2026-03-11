import shoeCatalog from "../data/shoeCatalog.json";

export async function fetchCatalog() {
  return Promise.resolve(shoeCatalog);
}
