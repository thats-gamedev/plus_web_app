// App emails (spec, "Emails"): subject, HTML and plain text per email.
// Plain functions, not React: react-dom/server isn't available in the
// server-components layer where Server Actions and webhooks run. Email
// clients don't support CSS variables, so the brand colours are written out
// here (same values as app/globals.css). Every dynamic value is escaped.

export type EmailContent = { subject: string; html: string; text: string }

const C = { ink: "#1f1f1f", muted: "#6b6b6b", faint: "#9a9a9a", brand: "#e2622b", bg: "#f3f3f3", card: "#ffffff", border: "#e5e5e5" }

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

const p = (html: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${C.ink}">${html}</p>`
const small = (html: string) => `<p style="margin:16px 0 0;font-size:13px;line-height:20px;color:${C.muted}">${html}</p>`
const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;margin:8px 0 16px;padding:12px 22px;border-radius:10px;background:${C.brand};color:#ffffff;font-weight:600;font-size:15px;text-decoration:none">${escapeHtml(label)}</a>`
const link = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:${C.brand}">${escapeHtml(label)}</a>`

/** The shared frame: logo line, white card, small footer. */
function layout({ preheader, body, footer }: { preheader: string; body: string; footer?: string }): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 16px;font-size:18px;font-weight:700;color:${C.ink}">thats_gamedev <span style="color:${C.brand}">Plus</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:28px">${body}</td></tr>
<tr><td style="padding:16px 4px;font-size:12px;line-height:18px;color:${C.faint}">${footer ?? ""}</td></tr>
</table></td></tr></table></body></html>`
}

const heading = (text: string) => `<h1 style="margin:0 0 16px;font-size:24px;line-height:30px;color:${C.ink}">${escapeHtml(text)}</h1>`

/** "12 October 2026" in German time. */
export function emailDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" })
}

function stamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
    timeZoneName: "short",
  })
}

export function welcomeEmail({ name, siteUrl, dropTitle }: { name: string; siteUrl: string; dropTitle: string | null }): EmailContent {
  const hey = name ? `Hey ${name},` : "Hey,"
  return {
    subject: "Welcome to That's Game Dev Plus",
    html: layout({
      preheader: "Your membership is active. Here's where to start.",
      body:
        heading("Welcome to Plus") +
        p(`${escapeHtml(hey)} your membership is active.`) +
        p(
          dropTitle
            ? `This month's drop is live: <strong>${escapeHtml(dropTitle)}</strong>. Start there, then browse the library.`
            : "Start with the library: curated tools, assets, creators and prompts."
        ) +
        button(`${siteUrl}/app`, "Open your dashboard") +
        p(`Your member codes for the merch shop and promotions are on the ${link(`${siteUrl}/app/perks`, "Perks page")}.`) +
        small(
          `You can cancel any time under ${link(`${siteUrl}/app/account`, "Account")} or with the link “Verträge hier kündigen” at the bottom of every page. You keep access until the end of the period you paid for.`
        ),
    }),
    text: `${hey} your membership is active.\n\n${dropTitle ? `This month's drop is live: ${dropTitle}.\n\n` : ""}Open your dashboard: ${siteUrl}/app\nYour member codes: ${siteUrl}/app/perks\n\nCancel any time under Account (${siteUrl}/app/account) or at ${siteUrl}/cancel. You keep access until the end of the period you paid for.`,
  }
}

export function cancellationConfirmedEmail({ name, endsAt, siteUrl }: { name: string; endsAt: string; siteUrl: string }): EmailContent {
  const date = emailDate(endsAt)
  const hey = name ? `Hi ${name},` : "Hi,"
  return {
    subject: `Your membership ends on ${date}`,
    html: layout({
      preheader: `You keep full access until ${date}.`,
      body:
        heading("Your cancellation is confirmed") +
        p(`${escapeHtml(hey)} your membership ends on <strong>${escapeHtml(date)}</strong>. You keep full access until then; nothing is charged after that.`) +
        p("Your perk codes stop working when the membership ends.") +
        p("Changed your mind? Rejoin before that date and you keep your founding price.") +
        button(`${siteUrl}/app/account`, "Rejoin"),
    }),
    text: `${hey} your membership ends on ${date}. You keep full access until then; nothing is charged after that.\nYour perk codes stop working when the membership ends.\n\nChanged your mind? Rejoin before that date and keep your founding price: ${siteUrl}/app/account`,
  }
}

export type CancellationReceiptInput = {
  requestId: string
  name: string
  email: string
  reference: string | null
  receivedAt: string
}

/** The statutory receipt (§ 312k BGB): what was sent, and when. Sent immediately. */
export function cancellationReceiptEmail(r: CancellationReceiptInput): EmailContent {
  const when = stamp(r.receivedAt)
  const rows: [string, string][] = [
    ["Name", r.name],
    ["Email", r.email],
    ["Reference", r.reference || "–"],
    ["Cancel", "At the earliest possible date"],
    ["Received", when],
    ["Request", r.requestId.slice(0, 8).toUpperCase()],
  ]
  const table = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;line-height:22px">${rows
    .map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:${C.muted}">${k}</td><td style="color:${C.ink}">${escapeHtml(v)}</td></tr>`)
    .join("")}</table>`
  return {
    subject: "We received your cancellation",
    html: layout({
      preheader: `Received ${when}.`,
      body:
        heading("We received your cancellation") +
        p("This is your receipt. We received the following cancellation:") +
        table +
        p("If this email belongs to a membership, we'll confirm the end date separately. If you didn't send this, reply to this email."),
    }),
    text: `We received your cancellation.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nIf this email belongs to a membership, we'll confirm the end date separately. If you didn't send this, reply to this email.`,
  }
}

export function cancellationVerifyEmail({ confirmUrl, expiresAt }: { confirmUrl: string; expiresAt: string }): EmailContent {
  const until = emailDate(expiresAt)
  return {
    subject: "Confirm the cancellation of your membership",
    html: layout({
      preheader: "One click to confirm.",
      body:
        heading("Confirm your cancellation") +
        p("Someone asked to cancel the membership for this email address on our cancellation page. To confirm it, use this button:") +
        button(confirmUrl, "Confirm cancellation") +
        small(`The link works once and until ${escapeHtml(until)}. If you didn't ask for this, ignore this email; nothing changes.`),
    }),
    text: `Someone asked to cancel the membership for this email address. To confirm, open:\n${confirmUrl}\n\nThe link works once and until ${until}. If you didn't ask for this, ignore this email; nothing changes.`,
  }
}

export function cancellationNoMatchEmail({ email, siteUrl }: { email: string; siteUrl: string }): EmailContent {
  return {
    subject: "About your cancellation request",
    html: layout({
      preheader: "We couldn't find a membership for this address.",
      body:
        heading("We couldn't find your membership") +
        p(`We received your cancellation request, but no membership uses <strong>${escapeHtml(email)}</strong>.`) +
        p("Please reply with the email address you signed up with, or send the request again from that address:") +
        button(`${siteUrl}/cancel`, "Cancellation page"),
    }),
    text: `We received your cancellation request, but no membership uses ${email}.\nPlease reply with the email address you signed up with, or send the request again from that address: ${siteUrl}/cancel`,
  }
}

export type DropEmailInput = {
  monthName: string
  theme: string
  intro: string | null
  highlights: string[]
  siteUrl: string
  unsubscribeUrl: string
}

export function dropAnnouncementEmail(d: DropEmailInput): EmailContent {
  const title = `${d.monthName}: ${d.theme}`
  const list = d.highlights.length
    ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:26px;color:${C.ink}">${d.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}</ul>`
    : ""
  return {
    subject: `The ${d.monthName} drop is live: ${d.theme}`,
    html: layout({
      preheader: d.highlights.slice(0, 3).join(" · "),
      body:
        heading(title) +
        (d.intro ? p(escapeHtml(d.intro).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")) : "") +
        list +
        button(`${d.siteUrl}/app`, "Open the drop"),
      footer: `You get this because drop emails are on in your account. ${link(d.unsubscribeUrl, "Unsubscribe")} or change it under Account.`,
    }),
    text: `${title}\n\n${d.intro ? `${d.intro.replace(/\*\*/g, "")}\n\n` : ""}${d.highlights.map((h) => `- ${h}`).join("\n")}\n\nOpen the drop: ${d.siteUrl}/app\n\nUnsubscribe: ${d.unsubscribeUrl}`,
  }
}

export function spotlightFeaturedEmail({ name, title, postUrl }: { name: string; title: string; postUrl: string }): EmailContent {
  const hey = name ? `Hey ${name},` : "Hey,"
  return {
    subject: `“${title}” is featured on @thats_gamedev`,
    html: layout({
      preheader: "Your project is live on the page.",
      body:
        heading("You're featured!") +
        p(`${escapeHtml(hey)} we picked <strong>${escapeHtml(title)}</strong> for this month's Spotlight and posted it with credit.`) +
        button(postUrl, "See the post") +
        p("Thanks for sharing your work. Submit again next month."),
    }),
    text: `${hey} we picked "${title}" for this month's Spotlight and posted it with credit.\n\nSee the post: ${postUrl}\n\nThanks for sharing your work. Submit again next month.`,
  }
}
