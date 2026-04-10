import { rawSql } from "../db";

const LOG = (msg: string) => console.log(`[SubscriptionBilling] ${msg}`);
const WARN = (msg: string) => console.warn(`[SubscriptionBilling] ${msg}`);

export async function runMonthlySubscriptionInvoicing(): Promise<void> {
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  LOG(`Running monthly invoicing for ${monthLabel}`);

  try {
    const [orgs] = await rawSql(
      `SELECT id, name, subscription_amount, billing_contact_email
       FROM organisations
       WHERE status = 'active' AND billing_type = 'subscription'`
    );

    let created = 0;
    let skipped = 0;
    let warnings = 0;

    for (const org of orgs) {
      if (!org.subscription_amount) {
        WARN(`${org.name} (id=${org.id}) missing subscription_amount — skipped`);
        warnings++;
        continue;
      }

      const [existing] = await rawSql(
        `SELECT id FROM billing_invoices
         WHERE client_id = $1
           AND internal_notes LIKE $2
         LIMIT 1`,
        [org.id, `%subscription:${monthLabel}%`]
      );

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const invNumber = `SUB-${monthLabel}-${org.id}`;
      const amount = org.subscription_amount * 100;
      const taxCents = Math.round(amount * 0.15);

      await rawSql(
        `INSERT INTO billing_invoices (invoice_number, client_id, title, subtotal_cents, tax_percent, tax_cents, total_cents, status, issued_at, internal_notes)
         VALUES ($1, $2, $3, $4, 15, $5, $6, 'pending', NOW(), $7)`,
        [
          invNumber,
          org.id,
          `Monthly subscription — ${monthLabel}`,
          amount,
          taxCents,
          amount + taxCents,
          `subscription:${monthLabel}`,
        ]
      );

      if (!org.billing_contact_email) {
        WARN(`${org.name} (id=${org.id}) missing billing_contact_email — invoice created but email skipped`);
        warnings++;
      }

      created++;
    }

    LOG(`Complete: ${created} invoices created, ${skipped} duplicates skipped, ${warnings} warnings`);
  } catch (e: any) {
    LOG(`Error: ${e.message}`);
  }
}

async function catchUpCurrentMonth(): Promise<void> {
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  try {
    const [orgs] = await rawSql(
      `SELECT id FROM organisations WHERE status = 'active' AND billing_type = 'subscription' AND subscription_amount IS NOT NULL`
    );

    if (!orgs.length) return;

    const [existing] = await rawSql(
      `SELECT DISTINCT client_id FROM billing_invoices WHERE internal_notes LIKE $1`,
      [`%subscription:${monthLabel}%`]
    );

    const invoicedIds = new Set(existing.map((r: any) => r.client_id));
    const missing = orgs.filter((o: any) => !invoicedIds.has(o.id));

    if (missing.length > 0) {
      LOG(`Catch-up: ${missing.length} subscription org(s) missing invoices for ${monthLabel} — running invoicing`);
      await runMonthlySubscriptionInvoicing();
    }
  } catch (e: any) {
    WARN(`Catch-up check failed: ${e.message}`);
  }
}

export function startSubscriptionBillingScheduler(): void {
  const CHECK_INTERVAL = 60 * 60 * 1000;
  let lastRunMonth = "";

  setTimeout(() => catchUpCurrentMonth(), 10000);

  setInterval(async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    if (now.getDate() === 1 && now.getHours() >= 8 && lastRunMonth !== currentMonth) {
      lastRunMonth = currentMonth;
      await runMonthlySubscriptionInvoicing();
    }
  }, CHECK_INTERVAL);

  LOG("Scheduler started — will run on 1st of each month at 08:00");
}
