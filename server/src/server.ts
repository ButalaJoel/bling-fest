import "dotenv/config";
import app from "./app.js";
import { storageMode } from "./lib/storage.js";

// Refuse to start a live site with unsafe settings (pattern from vana-power-mart/server.ts).
function checkProductionSettings() {
  if (process.env.NODE_ENV !== "production") return;
  const problems: string[] = [];
  if ((process.env.JWT_SECRET ?? "").length < 32) problems.push("JWT_SECRET must be at least 32 random characters.");
  if (storageMode !== "cloudinary") problems.push("Cloudinary must be configured (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).");
  if (process.env.ADMIN_PASSWORD) problems.push("Remove ADMIN_PASSWORD from the environment after creating the owner account.");
  if (problems.length) {
    console.error("Not starting. Fix these settings first:\n- " + problems.join("\n- "));
    process.exit(1);
  }
}
checkProductionSettings();

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Bling Fest running on http://localhost:${PORT} (photos: ${storageMode})`);
});
