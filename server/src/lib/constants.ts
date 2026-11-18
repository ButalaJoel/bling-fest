// Mirrors src/config/site.ts in the frontend. Server is the authority.
export const PARTICIPATION = ["art_exhibition", "fashion_runway", "creative_market", "jewellery_accessories", "beauty_makeup", "other_sme"] as const;
export const STATUSES = ["pending", "under_review", "approved", "rejected"] as const;
export const ROLES = ["owner", "admin", "reviewer"] as const;
export type Role = (typeof ROLES)[number];
export const BUSINESS_CATEGORIES = [
  "Painting & Visual Art", "Photography", "Illustration & Portraits", "Fashion & Apparel", "Streetwear",
  "Jewellery & Accessories", "Makeup & Beauty", "Perfume & Fragrance", "Skincare & Cosmetics", "Wigs & Hair",
  "Art & Craft / Handmade", "Food & Beverage", "Gifts", "Online Shop", "Other",
] as const;
export const PHOTO = { maxFiles: 6, maxBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] as const };
