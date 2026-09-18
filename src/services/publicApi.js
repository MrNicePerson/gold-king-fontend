// services/publicApi.js

import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL || "/api";

const publicApi = axios.create({
  baseURL: `${baseUrl}/public`,
  timeout: 30000,
});

export const publicAPI = {
  // Home page
  getHomePage: () => publicApi.get("/"),

  // Current public/live market prices
  getLivePrices: () => publicApi.get("/prices"),

  // Individual shop
  getShopDetail: (id) => publicApi.get(`/shop/${id}`),

  // Public live price polling fallback
  getPublicLivePrices: () => publicApi.get("/live-prices"),

  // Super Admin buy/sell price differences
  // No authentication/token required
  getSuperAdminPriceDifferences: () =>
    publicApi.get("/super-admin/price-differences"),
};

export default publicApi;