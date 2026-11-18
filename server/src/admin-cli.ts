import "dotenv/config";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { pool, query } from "./lib/db.js";
import { ROLES, type Role } from "./lib/constants.js";
import { checkPasswordStrength, BCRYPT_COST } from "./routes/auth.js";
import { readEmail } from "./lib/validation.js";

// Team accounts are managed here (on Render: the service's "Shell" tab), never from the website.
//   npm run admin -- add owner you@example.com "Your Name"   -> asks for a password
//   npm run admin -- password you@example.com               -> reset password (signs out all sessions)
//   npm run admin -- role someone@example.com reviewer
//   npm run admin -- disable someone@example.com  |  enable  |  list

async function askPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pw = await rl.question("Password (10+ characters): ");
  rl.close();
  return pw;
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "add") {
    const [role, emailRaw, ...nameParts] = args;
    if (!(ROLES as readonly string[]).includes(role)) throw new Error(`Role must be one of: ${ROLES.join(", ")}`);
    const email = readEmail(emailRaw);
    const name = nameParts.join(" ").trim() || email.split("@")[0];
    const hash = await bcrypt.hash(checkPasswordStrength(await askPassword()), BCRYPT_COST);
    await query("insert into admins (name, email, password_hash, role) values ($1, $2, $3, $4)", [name, email, hash, role as Role]);
    console.log(`Added ${role} ${email}`);
  } else if (cmd === "password") {
    const email = readEmail(args[0]);
    const hash = await bcrypt.hash(checkPasswordStrength(await askPassword()), BCRYPT_COST);
    const r = await query("update admins set password_hash = $2, token_version = token_version + 1, failed_logins = 0, locked_until = null where email = $1", [email, hash]);
    console.log(r.rowCount ? `Password reset for ${email}. Their other sessions are signed out.` : "No such account.");
  } else if (cmd === "role") {
    const email = readEmail(args[0]);
    if (!(ROLES as readonly string[]).includes(args[1])) throw new Error(`Role must be one of: ${ROLES.join(", ")}`);
    const r = await query("update admins set role = $2, token_version = token_version + 1 where email = $1", [email, args[1]]);
    console.log(r.rowCount ? `${email} is now ${args[1]}.` : "No such account.");
  } else if (cmd === "disable" || cmd === "enable") {
    const email = readEmail(args[0]);
    const r = await query("update admins set is_active = $2, token_version = token_version + 1 where email = $1", [email, cmd === "enable"]);
    console.log(r.rowCount ? `${email} ${cmd}d.` : "No such account.");
  } else if (cmd === "list") {
    const { rows } = await query("select email, name, role, is_active, last_login_at from admins order by created_at");
    console.table(rows);
  } else {
    console.log('Usage: npm run admin -- add|password|role|disable|enable|list ...  (see src/admin-cli.ts)');
  }
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
