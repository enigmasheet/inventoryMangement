export const PRODUCT_UNITS = ["pcs", "kg", "ltr", "bottle", "pack", "box", "bag", "dozen"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export const ATTRIBUTE_TYPES = ["text", "number", "date"] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const MOVEMENT_TYPES = ["IN", "OUT"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const STOCK_TAKE_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type StockTakeStatus = (typeof STOCK_TAKE_STATUS)[keyof typeof STOCK_TAKE_STATUS];

export const STORAGE_KEYS = {
  THEME: "theme",
  LOG_LEVEL: "logLevel",
} as const;

export const ROUTES = {
  DASHBOARD: "/dashboard",
  PRODUCTS: "/products",
  SETTINGS: "/settings",
  STOCK_TAKE: "/stock-take",
  CREATE_SHOP: "/create-shop",
  HOME: "/",
} as const;
