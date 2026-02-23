import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ========== TYPE DEFINITIONS ==========
type Bindings = {
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  MFSN_API_BASE: string
  MFSN_EMAIL: string
  MFSN_PASSWORD: string
  MFSN_AID: string
  MFSN_PID: string
  OPENAI_API_KEY: string
  COMPANY_NAME: string
  COMPANY_EMAIL: string
  MFSN_AFFILIATE_URL_PRIMARY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// ========== HELPER: Get client info ==========
function getClientInfo(c: any) {
  return {
    ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
    userAgent: c.req.header('user-agent') || 'unknown'
  }
}

// ========== API: Health Check ==========
app.get('/api/health', async (c) => {
  let dbStatus = 'not_configured'
  try {
    if (c.env.DB) {
      await c.env.DB.prepare('SELECT 1').first()
      dbStatus = 'connected'
    }
  } catch { dbStatus = 'error' }

  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      stripe: c.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      mfsn: c.env.MFSN_API_BASE ? 'configured' : 'not_configured'
    }
  })
})

// ========== API: Lead Capture (with D1 persistence) ==========
app.post('/api/leads', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, plan, utm_source, utm_medium, utm_campaign } = body
    const { ip, userAgent } = getClientInfo(c)

    if (!name || !email) {
      return c.json({ success: false, error: 'Name and email are required' }, 400)
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({ success: false, error: 'Please provide a valid email address' }, 400)
    }

    let leadId = null

    // Persist to D1 if available
    if (c.env.DB) {
      try {
        // Check for existing lead
        const existing = await c.env.DB.prepare(
          'SELECT id, status FROM leads WHERE email = ?'
        ).bind(email).first()

        if (existing) {
          // Update existing lead
          await c.env.DB.prepare(
            'UPDATE leads SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(name, phone || null, existing.id).run()
          leadId = existing.id
        } else {
          // Insert new lead
          const result = await c.env.DB.prepare(
            `INSERT INTO leads (name, email, phone, plan, source, ip_address, user_agent, utm_source, utm_medium, utm_campaign)
             VALUES (?, ?, ?, ?, 'funnel', ?, ?, ?, ?, ?)`
          ).bind(
            name, email, phone || null, plan || 'basic',
            ip, userAgent,
            utm_source || null, utm_medium || null, utm_campaign || null
          ).run()
          leadId = result.meta.last_row_id
        }

        // Log activity
        await c.env.DB.prepare(
          `INSERT INTO activity_log (lead_id, action, details, ip_address) VALUES (?, ?, ?, ?)`
        ).bind(leadId, 'lead_captured', JSON.stringify({ name, email, plan: plan || 'basic' }), ip).run()

      } catch (dbErr) {
        console.error('D1 error:', dbErr)
        // Continue even if DB fails — we still want to capture the lead
      }
    }

    // Build MFSN affiliate enrollment URL
    const mfsnUrl = c.env.MFSN_AFFILIATE_URL_PRIMARY ||
      `https://myfreescorenow.com/enroll/?AID=${c.env.MFSN_AID || 'RickJeffersonSolutions'}&PID=${c.env.MFSN_PID || '49914'}`

    return c.json({
      success: true,
      message: "You're in! Check your email for next steps.",
      data: {
        leadId,
        name,
        email,
        plan: plan || 'basic',
        nextSteps: {
          step1: 'Activate MyFreeScoreNow monitoring',
          step1_url: mfsnUrl,
          step2: 'Complete your $99 audit fee payment',
          step2_url: '/api/checkout'
        }
      }
    })
  } catch (err) {
    console.error('Lead capture error:', err)
    return c.json({ success: false, error: 'Something went wrong. Please try again.' }, 500)
  }
})

// ========== API: Stripe Checkout Session ==========
app.post('/api/checkout', async (c) => {
  try {
    const body = await c.req.json()
    const { email, name, leadId } = body

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Payment system not configured' }, 503)
    }

    // Create Stripe Checkout Session via API
    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('success_url', `${c.req.header('origin') || 'https://clean-it-up-funnel.pages.dev'}/success?session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', `${c.req.header('origin') || 'https://clean-it-up-funnel.pages.dev'}/?canceled=true`)
    params.append('line_items[0][price_data][currency]', 'usd')
    params.append('line_items[0][price_data][product_data][name]', 'Forensic 3-Bureau ITIN/SSN Credit Audit')
    params.append('line_items[0][price_data][product_data][description]', 'Complete forensic audit of your ITIN or SSN credit file across TransUnion, Equifax, and Experian + Personalized 10-Point Restoration Roadmap. ITIN holders accepted. Delivered within 24–48 hours.')
    params.append('line_items[0][price_data][unit_amount]', '9900') // $99.00
    params.append('line_items[0][quantity]', '1')
    params.append('payment_method_types[0]', 'card')
    if (email) params.append('customer_email', email)
    if (leadId) params.append('metadata[lead_id]', String(leadId))
    if (name) params.append('metadata[customer_name]', name)
    params.append('metadata[plan]', 'basic')
    params.append('metadata[product]', 'credit_audit')

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const session = await stripeRes.json() as any

    if (session.error) {
      console.error('Stripe error:', session.error)
      return c.json({ success: false, error: 'Payment session creation failed' }, 500)
    }

    // Update lead with checkout session ID
    if (c.env.DB && leadId) {
      await c.env.DB.prepare(
        'UPDATE leads SET stripe_checkout_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(session.id, 'checkout_started', leadId).run()

      await c.env.DB.prepare(
        `INSERT INTO activity_log (lead_id, action, details) VALUES (?, ?, ?)`
      ).bind(leadId, 'checkout_created', JSON.stringify({ session_id: session.id, amount: 9900 })).run()
    }

    return c.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    })
  } catch (err) {
    console.error('Checkout error:', err)
    return c.json({ success: false, error: 'Payment system error' }, 500)
  }
})

// ========== API: Stripe Webhook ==========
app.post('/api/webhooks/stripe', async (c) => {
  try {
    const payload = await c.req.text()
    // In production, verify webhook signature with STRIPE_WEBHOOK_SECRET
    const event = JSON.parse(payload) as any

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const leadId = session.metadata?.lead_id

      if (c.env.DB && leadId) {
        // Update lead status
        await c.env.DB.prepare(
          `UPDATE leads SET status = 'paid', stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        ).bind(session.customer || null, leadId).run()

        // Record payment
        await c.env.DB.prepare(
          `INSERT INTO payments (lead_id, stripe_payment_id, stripe_checkout_id, amount, description, status, payment_type)
           VALUES (?, ?, ?, ?, ?, 'completed', 'audit_fee')`
        ).bind(
          leadId,
          session.payment_intent || null,
          session.id,
          session.amount_total || 9900,
          'Forensic 3-Bureau ITIN/SSN Credit Audit Fee'
        ).run()

        // Log activity
        await c.env.DB.prepare(
          `INSERT INTO activity_log (lead_id, action, details) VALUES (?, ?, ?)`
        ).bind(leadId, 'payment_completed', JSON.stringify({
          amount: session.amount_total,
          payment_intent: session.payment_intent
        })).run()
      }
    }

    return c.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return c.json({ error: 'Webhook processing failed' }, 400)
  }
})

// ========== API: Get Lead Status ==========
app.get('/api/leads/:email', async (c) => {
  try {
    const email = c.req.param('email')
    if (!c.env.DB) return c.json({ success: false, error: 'Database not available' }, 503)

    const lead = await c.env.DB.prepare(
      'SELECT id, name, email, plan, status, mfsn_enrolled, audit_status, created_at FROM leads WHERE email = ?'
    ).bind(email).first()

    if (!lead) return c.json({ success: false, error: 'Lead not found' }, 404)

    return c.json({ success: true, data: lead })
  } catch (err) {
    return c.json({ success: false, error: 'Error fetching lead' }, 500)
  }
})

// ========== API: Admin — List all leads ==========
app.get('/api/admin/leads', async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: 'Database not available' }, 503)

    const { results } = await c.env.DB.prepare(
      'SELECT id, name, email, phone, plan, status, mfsn_enrolled, audit_status, stripe_checkout_id, created_at FROM leads ORDER BY created_at DESC LIMIT 100'
    ).all()

    return c.json({ success: true, count: results.length, data: results })
  } catch (err) {
    return c.json({ success: false, error: 'Error fetching leads' }, 500)
  }
})

// ========== API: Admin — Dashboard Stats ==========
app.get('/api/admin/stats', async (c) => {
  try {
    if (!c.env.DB) return c.json({ success: false, error: 'Database not available' }, 503)

    const total = await c.env.DB.prepare('SELECT COUNT(*) as count FROM leads').first() as any
    const paid = await c.env.DB.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'paid'").first() as any
    const newLeads = await c.env.DB.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'new'").first() as any
    const today = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = DATE('now')"
    ).first() as any
    const revenue = await c.env.DB.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"
    ).first() as any

    return c.json({
      success: true,
      data: {
        totalLeads: total?.count || 0,
        paidLeads: paid?.count || 0,
        newLeads: newLeads?.count || 0,
        todayLeads: today?.count || 0,
        totalRevenue: (revenue?.total || 0) / 100, // Convert cents to dollars
        conversionRate: total?.count > 0 ? ((paid?.count || 0) / total.count * 100).toFixed(1) + '%' : '0%'
      }
    })
  } catch (err) {
    return c.json({ success: false, error: 'Error fetching stats' }, 500)
  }
})

// ========== API: MFSN Auth Token ==========
app.post('/api/mfsn/auth', async (c) => {
  try {
    if (!c.env.MFSN_API_BASE || !c.env.MFSN_EMAIL) {
      return c.json({ success: false, error: 'MFSN not configured' }, 503)
    }

    const res = await fetch(`${c.env.MFSN_API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: c.env.MFSN_EMAIL,
        password: c.env.MFSN_PASSWORD
      })
    })

    const data = await res.json() as any
    if (data.success && data.data?.token) {
      return c.json({ success: true, token: data.data.token })
    }
    return c.json({ success: false, error: 'MFSN authentication failed' }, 401)
  } catch (err) {
    console.error('MFSN auth error:', err)
    return c.json({ success: false, error: 'MFSN connection failed' }, 500)
  }
})

// ========== API: MFSN Get Credit Report ==========
app.post('/api/mfsn/report', async (c) => {
  try {
    const { username, password, token } = await c.req.json()
    if (!token || !username || !password) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const res = await fetch(`${c.env.MFSN_API_BASE}/auth/3B/report.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password })
    })

    const data = await res.json()
    return c.json({ success: true, data })
  } catch (err) {
    console.error('MFSN report error:', err)
    return c.json({ success: false, error: 'Failed to fetch credit report' }, 500)
  }
})

// ========== API: Config (public safe values) ==========
app.get('/api/config', (c) => {
  return c.json({
    stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY || null,
    mfsnEnrollUrl: c.env.MFSN_AFFILIATE_URL_PRIMARY ||
      `https://myfreescorenow.com/enroll/?AID=${c.env.MFSN_AID || 'RickJeffersonSolutions'}&PID=${c.env.MFSN_PID || '49914'}`,
    companyName: c.env.COMPANY_NAME || 'RJ Business Solutions',
    companyEmail: c.env.COMPANY_EMAIL || 'rickjefferson@rickjeffersonsolutions.com'
  })
})

// ========== SUCCESS PAGE (after Stripe checkout) ==========
app.get('/success', (c) => {
  return c.html(successPageHTML())
})

// ========== LEGAL PAGES ==========
app.get('/legal', (c) => c.html(legalPageHTML()))
app.get('/privacy', (c) => c.html(privacyPageHTML()))
app.get('/terms', (c) => c.html(termsPageHTML()))
app.get('/consumer-rights', (c) => c.html(consumerRightsPageHTML()))
app.get('/cancellation', (c) => c.html(cancellationPageHTML()))

// ========== MAIN FUNNEL PAGE ==========
app.get('/', (c) => {
  const stripeKey = c.env.STRIPE_PUBLISHABLE_KEY || ''
  const mfsnUrl = c.env.MFSN_AFFILIATE_URL_PRIMARY ||
    `https://myfreescorenow.com/enroll/?AID=${c.env.MFSN_AID || 'RickJeffersonSolutions'}&PID=${c.env.MFSN_PID || '49914'}`
  return c.html(basicFunnelHTML(stripeKey, mfsnUrl))
})

app.get('/basic', (c) => c.redirect('/'))

// ========== SUCCESS PAGE HTML ==========
function successPageHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed | Clean It Up ITIN Credit Repair — RJ Business Solutions</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#030712;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
    .card{max-width:560px;width:100%;background:#111827;border:1px solid rgba(74,222,128,0.3);border-radius:1.5rem;padding:3rem;text-align:center}
    .icon{width:80px;height:80px;color:#4ade80;margin:0 auto 1.5rem}
    h1{font-size:2rem;font-weight:900;margin-bottom:0.75rem}
    .sub{color:#9ca3af;font-size:1.1rem;margin-bottom:2rem;line-height:1.6}
    .steps{text-align:left;margin-bottom:2rem}
    .step{display:flex;gap:1rem;padding:1rem;background:rgba(30,58,138,0.2);border:1px solid rgba(59,130,246,0.2);border-radius:0.75rem;margin-bottom:0.75rem}
    .step-num{width:32px;height:32px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.85rem;flex-shrink:0}
    .step h3{font-size:0.95rem;font-weight:700;margin-bottom:0.25rem}
    .step p{color:#9ca3af;font-size:0.85rem}
    .btn{display:inline-flex;align-items:center;gap:0.5rem;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:800;font-size:1.1rem;padding:1rem 2rem;border-radius:0.75rem;text-decoration:none;transition:all 0.3s}
    .btn:hover{opacity:0.9;transform:translateY(-2px)}
    .footer{margin-top:2rem;color:#6b7280;font-size:0.8rem}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon"><i data-lucide="check-circle-2"></i></div>
    <h1>Payment Confirmed!</h1>
    <p class="sub">Your $99 forensic ITIN/SSN credit audit fee has been received. Here's what happens next:</p>

    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div>
          <h3>Check Your Email</h3>
          <p>You'll receive a confirmation email with your audit timeline and next steps within the hour.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div>
          <h3>Activate Credit Monitoring</h3>
          <p>If you haven't already, activate your MyFreeScoreNow monitoring using your ITIN or SSN so we can begin your audit.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div>
          <h3>Audit Delivered in 24–48 Hours</h3>
          <p>Your complete forensic 3-bureau audit of your ITIN or SSN credit file + personalized 10-Point Restoration Roadmap will be emailed to you.</p>
        </div>
      </div>
    </div>

    <a href="https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=49914" target="_blank" class="btn">
      Activate Monitoring Now <i data-lucide="external-link" style="width:18px;height:18px"></i>
    </a>

    <p class="footer">
      Questions? Email <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a><br>
      &copy; 2026 RJ Business Solutions
    </p>
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`
}

// ========== SHARED LEGAL PAGE LAYOUT ==========
function legalLayout(title: string, metaDesc: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | RJ Business Solutions</title>
  <meta name="description" content="${metaDesc}">
  <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#x1f6e1;</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#030712;color:#d1d5db;line-height:1.8;padding:0}
    a{color:#60a5fa;text-decoration:none}a:hover{text-decoration:underline}
    .nav{background:#111827;border-bottom:1px solid #1f2937;padding:1rem 0;position:sticky;top:0;z-index:100}
    .nav-inner{max-width:900px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between}
    .nav a.logo{color:#fff;font-weight:700;font-size:1.1rem;display:flex;align-items:center;gap:.5rem}
    .nav-links{display:flex;gap:1.5rem;font-size:.85rem}
    .container{max-width:900px;margin:0 auto;padding:3rem 1.5rem 4rem}
    h1{color:#fff;font-size:2.25rem;font-weight:800;margin-bottom:.5rem;line-height:1.3}
    h2{color:#fff;font-size:1.5rem;font-weight:700;margin:2.5rem 0 1rem;padding-bottom:.5rem;border-bottom:1px solid #1f2937}
    h3{color:#e5e7eb;font-size:1.15rem;font-weight:600;margin:1.5rem 0 .75rem}
    p{margin-bottom:1rem}
    .updated{color:#6b7280;font-size:.85rem;margin-bottom:2rem}
    .legal-nav{display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid #1f2937}
    .legal-nav a{background:rgba(30,58,138,.3);border:1px solid rgba(59,130,246,.3);color:#93c5fd;padding:.4rem 1rem;border-radius:999px;font-size:.8rem;font-weight:500;white-space:nowrap}
    .legal-nav a:hover{background:rgba(59,130,246,.2);text-decoration:none}
    .legal-nav a.active{background:rgba(59,130,246,.4);border-color:#3b82f6;color:#fff}
    .highlight-box{background:rgba(30,58,138,.2);border:1px solid rgba(59,130,246,.3);border-radius:.75rem;padding:1.5rem;margin:1.5rem 0}
    .warning-box{background:rgba(127,29,29,.15);border:1px solid rgba(239,68,68,.3);border-radius:.75rem;padding:1.5rem;margin:1.5rem 0}
    .warning-box strong{color:#fca5a5}
    .croa-box{background:rgba(6,78,59,.15);border:2px solid rgba(52,211,153,.3);border-radius:.75rem;padding:2rem;margin:1.5rem 0}
    .croa-box h3{color:#6ee7b7;margin-top:0}
    ul,ol{margin:0 0 1rem 1.5rem}
    li{margin-bottom:.5rem}
    .statute-ref{color:#fbbf24;font-weight:600;font-size:.85rem}
    .section-badge{display:inline-block;background:rgba(59,130,246,.2);border:1px solid rgba(59,130,246,.3);color:#93c5fd;padding:.15rem .5rem;border-radius:.25rem;font-size:.75rem;font-weight:600;margin-right:.5rem}
    blockquote{border-left:3px solid #3b82f6;padding:.75rem 1.25rem;margin:1rem 0 1.5rem;background:rgba(30,58,138,.1);border-radius:0 .5rem .5rem 0;font-style:italic;color:#bfdbfe}
    .footer{padding:2rem 0;background:#111827;border-top:1px solid #1f2937;text-align:center;margin-top:3rem}
    .footer p{color:#6b7280;font-size:.8rem;line-height:1.8;margin:0}
    .footer a{color:#60a5fa}
    @media(max-width:768px){h1{font-size:1.75rem}.legal-nav{gap:.5rem}.legal-nav a{font-size:.75rem;padding:.35rem .75rem}}
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="logo">&#128737; Clean It Up</a>
      <div class="nav-links">
        <a href="/legal">Legal</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/">Home</a>
      </div>
    </div>
  </nav>
  <div class="container">
    <div class="legal-nav">
      <a href="/legal">Disclosures &amp; Compliance (ECOA, FCRA, CROA)</a>
      <a href="/consumer-rights">Consumer Rights (CROA)</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/terms">Terms of Service</a>
      <a href="/cancellation">Cancellation Policy</a>
    </div>
    ${content}
  </div>
  <footer class="footer">
    <p><strong style="color:#d1d5db">RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br><a href="https://rickjeffersonsolutions.com">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a></p>
    <p style="margin-top:.75rem">&copy; 2026 RJ Business Solutions. All rights reserved.</p>
    <p style="margin-top:.5rem"><a href="/legal">Legal Disclosures</a> &bull; <a href="/privacy">Privacy Policy</a> &bull; <a href="/terms">Terms of Service</a> &bull; <a href="/consumer-rights">Consumer Rights</a> &bull; <a href="/cancellation">Cancellation Policy</a></p>
  </footer>
</body>
</html>`
}

// ========== /legal — FULL COMPLIANCE DISCLOSURES PAGE ==========
function legalPageHTML(): string {
  return legalLayout(
    'Legal Disclosures &amp; Federal Compliance — ITIN Credit Repair',
    'Complete federal legal disclosures for RJ Business Solutions ITIN credit repair services. CROA, FCRA, ECOA, FDCPA, TSR, FTC, CFPB compliance. ITIN holders have full credit dispute rights under federal law.',
    `<h1>Legal Disclosures &amp; Federal Compliance</h1>
    <p class="updated">Last Updated: February 23, 2026 &bull; Effective for all ITIN and SSN credit repair services provided by RJ Business Solutions</p>

    <div class="warning-box">
      <strong>Important Notice:</strong> RJ Business Solutions is a credit repair organization as defined under the Credit Repair Organizations Act (15 U.S.C. &sect; 1679 et seq.). We are not a law firm, we are not attorneys, and we do not provide legal advice. The information on this page is provided for transparency and compliance purposes only.
    </div>

    <div class="highlight-box">
      <strong>&#127919; ITIN Credit Repair Clients:</strong> If you hold an Individual Taxpayer Identification Number (ITIN), you have the <strong>exact same credit dispute rights</strong> as Social Security Number (SSN) holders under the Fair Credit Reporting Act (FCRA) and Equal Credit Opportunity Act (ECOA). All three major credit bureaus — TransUnion, Equifax, and Experian — accept and maintain ITIN-based credit files. Our services are fully available to ITIN holders, and we use the same federal statutes to challenge inaccurate information on your ITIN credit file as we do for SSN-based files.
    </div>

    <!-- ═══════ CROA ═══════ -->
    <h2 id="croa"><span class="section-badge">CROA</span> Credit Repair Organizations Act (15 U.S.C. &sect; 1679)</h2>

    <p>RJ Business Solutions operates in full compliance with the Credit Repair Organizations Act, enacted September 30, 1996 (Pub. L. 104-208). CROA provides important protections for consumers who use credit repair services.</p>

    <div class="croa-box">
      <h3>&#9989; Required CROA Consumer Disclosure Statement</h3>
      <p><em>Pursuant to 15 U.S.C. &sect; 1679c, the following disclosure is provided to all consumers before any contract or agreement is executed:</em></p>

      <blockquote>
        <strong>"Consumer Credit File Rights Under State and Federal Law</strong><br><br>
        You have a right to dispute inaccurate information in your credit report by contacting the credit bureau directly. However, neither you nor any 'credit repair' company or credit repair organization has the right to have accurate, current, and verifiable information removed from your credit report. The credit bureau must remove accurate, negative information from your report only if it is over 7 years old. Bankruptcy information can be reported for 10 years.<br><br>
        You have a right to obtain a copy of your credit report from a credit bureau. You may be charged a reasonable fee. There is no fee, however, if you have been turned down for credit, employment, insurance, or a rental dwelling because of information in your credit report within the preceding 60 days. The credit bureau must provide someone to help you interpret the information in your credit file. You are entitled to receive a free copy of your credit report if you are unemployed and intend to apply for employment in the next 60 days, if you are a recipient of public welfare assistance, or if you have reason to believe that there is inaccurate information in your credit report due to fraud.<br><br>
        You have a right to sue a credit repair organization that violates the Credit Repair Organization Act. This law prohibits deceptive practices by credit repair organizations.<br><br>
        You have the right to cancel your contract with any credit repair organization for any reason within 3 business days from the date you signed it.<br><br>
        Credit bureaus are required to follow reasonable procedures to ensure that the information they report is accurate. However, mistakes may occur.<br><br>
        You may, on your own, notify a credit bureau in writing that you dispute the accuracy of information in your credit file. The credit bureau must then reinvestigate and modify or remove inaccurate or incomplete information. The credit bureau may not charge any fee for this service. Any pertinent information and copies of all documents you have concerning an error should be given to the credit bureau.<br><br>
        If the credit bureau's reinvestigation does not resolve the dispute to your satisfaction, you may send a brief statement to the credit bureau, to be kept in your file, explaining why you think the record is inaccurate. The credit bureau must include a summary of your statement about disputed information with any report it issues about you.<br><br>
        The Federal Trade Commission regulates credit bureaus and credit repair organizations. For more information contact:<br><br>
        <strong>The Public Reference Branch<br>
        Federal Trade Commission<br>
        Washington, D.C. 20580"</strong>
      </blockquote>
    </div>

    <h3>CROA Compliance Practices</h3>
    <ul>
      <li><strong>No Advance Fees (15 U.S.C. &sect; 1679b(b)):</strong> We do not charge or receive payment for credit repair services until such services have been fully performed. The $99 audit fee covers a completed forensic audit product delivered to you — it is not an advance fee for future dispute work.</li>
      <li><strong>Written Contracts (15 U.S.C. &sect; 1679d):</strong> All services require a signed, written contract that details the services to be performed, total costs, payment terms, estimated timelines, and your cancellation rights.</li>
      <li><strong>3-Business-Day Cancellation Right (15 U.S.C. &sect; 1679e):</strong> You may cancel your contract for any reason within 3 business days of signing, without penalty or obligation. A Notice of Cancellation form is provided with every contract.</li>
      <li><strong>No Misleading Claims (15 U.S.C. &sect; 1679b(a)):</strong> We do not guarantee specific credit score increases or claim we can remove accurate, current, and verifiable information from your credit report.</li>
      <li><strong>Disclosure Before Contract (15 U.S.C. &sect; 1679c):</strong> The Consumer Credit File Rights statement above is provided to every consumer before any contract is executed, as a separate document.</li>
      <li><strong>Consumer Waivers Void (15 U.S.C. &sect; 1679f):</strong> Any waiver of your rights under CROA is void and unenforceable.</li>
    </ul>

    <!-- ═══════ ECOA ═══════ -->
    <h2 id="ecoa"><span class="section-badge">ECOA</span> Equal Credit Opportunity Act (15 U.S.C. &sect; 1691)</h2>

    <p>The Equal Credit Opportunity Act is <strong>critically important for ITIN holders</strong>. ECOA prohibits discrimination in any aspect of a credit transaction based on race, color, religion, national origin, sex, marital status, age, receipt of public assistance, or good-faith exercise of consumer rights.</p>

    <h3>Why ECOA Matters for ITIN Credit Repair</h3>
    <ul>
      <li><strong>National Origin Protection (15 U.S.C. &sect; 1691(a)(1)):</strong> Creditors, lenders, and credit bureaus <strong>cannot</strong> treat your ITIN credit file differently than an SSN-based file based on your national origin. Any creditor who refuses to report, investigate, or correct information because you use an ITIN may be violating ECOA.</li>
      <li><strong>Regulation B (12 C.F.R. Part 1002):</strong> The CFPB's Regulation B implements ECOA. It explicitly prohibits creditors from using immigration status or national origin as a factor in credit decisions when the applicant is otherwise creditworthy.</li>
      <li><strong>Bureau Compliance:</strong> All three major credit bureaus (TransUnion, Equifax, and Experian) accept ITINs as valid identifiers for creating and maintaining credit files. They are required to investigate disputes from ITIN holders under the same FCRA procedures as SSN holders.</li>
      <li><strong>Right to Sue (15 U.S.C. &sect; 1691e):</strong> If a creditor or bureau discriminates against you because of your ITIN status, you may sue for actual damages, punitive damages up to $10,000 (individual action), and attorney's fees.</li>
    </ul>

    <div class="croa-box">
      <h3>&#128161; 2026 ECOA Update — DOJ &amp; CFPB Guidance</h3>
      <p>In January 2026, the DOJ and CFPB withdrew their previous joint statement on creditor immigration-status considerations. However, the <strong>underlying ECOA statutory protections remain fully in effect</strong>. National-origin discrimination remains illegal under 15 U.S.C. &sect; 1691 regardless of any regulatory guidance changes. RJ Business Solutions will cite ECOA in any dispute where an ITIN holder's credit file appears to have been treated differently than an SSN holder's file.</p>
    </div>

    <!-- ═══════ FCRA ═══════ -->
    <h2 id="fcra"><span class="section-badge">FCRA</span> Fair Credit Reporting Act (15 U.S.C. &sect; 1681)</h2>

    <p>All dispute activities performed by RJ Business Solutions are conducted in accordance with the Fair Credit Reporting Act. We invoke specific FCRA provisions on your behalf to challenge inaccurate, incomplete, unverifiable, or obsolete information on your credit reports — <strong>whether your file is identified by SSN or ITIN</strong>.</p>

    <h3>Your Rights Under the FCRA</h3>
    <ul>
      <li><strong>Right to Dispute (Section 611, 15 U.S.C. &sect; 1681i):</strong> You have the right to dispute any information in your credit file that you believe is inaccurate or incomplete. Credit reporting agencies (CRAs) must investigate within 30 days (extendable to 45 days if you provide additional information).</li>
      <li><strong>Duty to Correct (Section 623, 15 U.S.C. &sect; 1681s-2):</strong> Furnishers of information (creditors, lenders, collection agencies) must investigate disputes forwarded by CRAs and correct or delete inaccurate information.</li>
      <li><strong>Permissible Purpose (Section 604, 15 U.S.C. &sect; 1681b):</strong> Your credit report may only be accessed by parties with a legally permissible purpose, such as credit applications, insurance underwriting, or employment screening (with your consent).</li>
      <li><strong>Obsolescence Protections (Section 605, 15 U.S.C. &sect; 1681c):</strong> Most negative information must be removed after 7 years. Bankruptcy filings under Chapter 7 may be reported for 10 years; Chapter 13 for 7 years.</li>
      <li><strong>Free Annual Reports (Section 612, 15 U.S.C. &sect; 1681j):</strong> You are entitled to one free credit report per year from each of the three major bureaus (TransUnion, Equifax, Experian) via <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener">AnnualCreditReport.com</a>.</li>
      <li><strong>Right to Sue (Section 616-617, 15 U.S.C. &sect; 1681n-o):</strong> You may sue CRAs or furnishers for willful or negligent noncompliance with the FCRA.</li>
      <li><strong>Fraud Alerts &amp; Credit Freezes (Section 605A-B):</strong> You have the right to place fraud alerts or security freezes on your credit file at no cost.</li>
    </ul>

    <div class="highlight-box">
      <strong>How We Use the FCRA for ITIN Credit Files:</strong> Our disputes cite specific FCRA sections (primarily 611, 623, and 605) when challenging information with the credit bureaus. For ITIN holders, we file disputes using each bureau's ITIN-specific procedures — TransUnion and Equifax accept online ITIN disputes; Experian may require mail-in disputes for ITIN-identified files. We do not file frivolous disputes or misrepresent information on your behalf. Every dispute is substantive, statute-specific, and tracked through the full 30-day investigation window. ITIN holders receive identical FCRA protections as SSN holders — there is no legal distinction.
    </div>

    <!-- ═══════ ITIN-SPECIFIC BUREAU PROCEDURES ═══════ -->
    <h2 id="itin-bureaus"><span class="section-badge">ITIN</span> ITIN-Specific Bureau Dispute Procedures (2026)</h2>

    <p>Each credit bureau has specific procedures for ITIN-identified credit files. RJ Business Solutions is experienced with all three bureau systems and files disputes using the correct channel for each:</p>

    <ul>
      <li><strong>TransUnion &amp; ITIN:</strong> TransUnion accepts ITIN numbers for credit file identification. Disputes can be filed online, by phone (1-800-916-8800), or by mail. TransUnion's online dispute portal accepts ITINs in the identification field.</li>
      <li><strong>Equifax &amp; ITIN:</strong> Equifax creates and maintains ITIN credit files. Disputes can be filed online at <a href="https://www.equifax.com/personal/disputes" target="_blank" rel="noopener">equifax.com/personal/disputes</a>, by phone (1-866-349-5191), or by mail. ITIN holders should use their ITIN where SSN is requested.</li>
      <li><strong>Experian &amp; ITIN:</strong> Experian accepts ITINs for credit file identification. Some ITIN dispute procedures may require mail-in submissions with copies of your ITIN documentation (IRS Letter CP565 or ITIN card). We handle the appropriate filing method for each case.</li>
    </ul>

    <div class="highlight-box">
      <strong>ITIN Credit File Building:</strong> If you hold an ITIN and do not yet have a credit file, you can establish one by applying for credit products that accept ITINs (certain secured credit cards, credit-builder loans, and ITIN mortgage programs). Once a creditor reports your account to the bureaus using your ITIN, your credit file is created. Our service includes guidance on ITIN-friendly credit-building products.
    </div>

    <!-- ═══════ FDCPA ═══════ -->
    <h2 id="fdcpa"><span class="section-badge">FDCPA</span> Fair Debt Collection Practices Act (15 U.S.C. &sect; 1692)</h2>

    <p>While RJ Business Solutions is not a debt collector, we educate our clients on their rights under the Fair Debt Collection Practices Act and may reference FDCPA violations when challenging collection accounts on your credit report.</p>

    <h3>Your Rights Under the FDCPA</h3>
    <ul>
      <li><strong>Debt Validation (Section 809, 15 U.S.C. &sect; 1692g):</strong> Within 5 days of initial contact, a debt collector must provide you with written notice of the amount of debt, name of the creditor, and your right to dispute the debt within 30 days.</li>
      <li><strong>Cease Communication (Section 805(c), 15 U.S.C. &sect; 1692c(c)):</strong> You may demand in writing that a debt collector stop contacting you.</li>
      <li><strong>Prohibited Practices (Section 806-808):</strong> Debt collectors cannot harass, threaten, or use abusive language; cannot call before 8am or after 9pm; cannot make false or misleading representations; cannot use unfair collection practices.</li>
      <li><strong>Third-Party Disclosure (Section 805(b)):</strong> Debt collectors cannot discuss your debt with third parties (with limited exceptions for your attorney, spouse, or parents if you are a minor).</li>
      <li><strong>Right to Sue (Section 813, 15 U.S.C. &sect; 1692k):</strong> You may sue a debt collector for FDCPA violations and recover actual damages, statutory damages up to $1,000 per case, and attorney's fees.</li>
    </ul>

    <div class="highlight-box">
      <strong>How We Use the FDCPA for ITIN Holders:</strong> When a collection account on your ITIN credit report is found to be unverifiable or improperly reported, we may reference FDCPA &sect; 1692g debt validation requirements in our dispute strategy. If a collector has failed to validate a debt, reporting it to a CRA may violate both the FDCPA and the FCRA. <strong>Important:</strong> Debt collectors cannot discriminate against ITIN holders or treat ITIN-identified debts differently than SSN-identified debts. ECOA protections apply to all collection activities.
    </div>

    <!-- ═══════ TSR ═══════ -->
    <h2 id="tsr"><span class="section-badge">TSR</span> FTC Telemarketing Sales Rule (16 C.F.R. Part 310)</h2>

    <p>The Telemarketing Sales Rule (TSR), enforced by the Federal Trade Commission, imposes specific requirements on credit repair services marketed via telemarketing.</p>

    <h3>Our TSR Compliance</h3>
    <ul>
      <li><strong>Advance Fee Ban (16 C.F.R. &sect; 310.4(a)(2)):</strong> We do not charge fees for credit repair services until the promised service has been fully performed and the results have been documented. This applies to all services, whether marketed by telephone, internet, or other means.</li>
      <li><strong>No Misrepresentations (16 C.F.R. &sect; 310.3(a)):</strong> We do not make false or misleading claims about the nature, results, or efficacy of our credit repair services during telemarketing or in any marketing materials.</li>
      <li><strong>Required Disclosures (16 C.F.R. &sect; 310.4(d)):</strong> Before a customer pays, we disclose the total cost of services, any material restrictions or conditions, and our refund or cancellation policy.</li>
      <li><strong>Recordkeeping (16 C.F.R. &sect; 310.5):</strong> We maintain records of all telemarketing transactions, advertising, and customer communications for a minimum of 24 months (extended to 5 years under the 2024 TSR amendments).</li>
    </ul>

    <div class="warning-box">
      <strong>TSR Advance Fee Ban Clarification:</strong> Under both CROA and the TSR, it is illegal to charge advance fees for credit repair services. Our $99 forensic audit fee is payment for a <em>completed, delivered product</em> (your forensic audit report and personalized roadmap), not an advance fee for future dispute work. Monthly service fees are billed only after verifiable results have been achieved in that billing period.
    </div>

    <!-- ═══════ FTC ACT ═══════ -->
    <h2 id="ftc"><span class="section-badge">FTC</span> Federal Trade Commission Act (15 U.S.C. &sect; 41 et seq.)</h2>

    <p>Section 5 of the FTC Act prohibits unfair or deceptive acts or practices in or affecting commerce. Under 15 U.S.C. &sect; 1679h, violations of CROA are treated as violations of the FTC Act.</p>

    <h3>Our FTC Act Compliance</h3>
    <ul>
      <li><strong>No Deceptive Practices:</strong> All marketing materials, website content, and client communications are truthful, non-misleading, and substantiated.</li>
      <li><strong>No Unfair Practices:</strong> We do not impose unreasonable terms, hidden fees, or conditions that cause substantial consumer injury.</li>
      <li><strong>Substantiation:</strong> All claims about our services, success rates, or potential outcomes are based on documented evidence and presented with appropriate qualifications.</li>
      <li><strong>Clear Disclosures:</strong> Material terms, costs, and conditions are disclosed clearly and conspicuously before a consumer makes a purchasing decision.</li>
    </ul>

    <!-- ═══════ CFPB ═══════ -->
    <h2 id="cfpb"><span class="section-badge">CFPB</span> Consumer Financial Protection Bureau</h2>

    <p>The Consumer Financial Protection Bureau (CFPB) shares enforcement authority with the FTC over credit repair organizations. RJ Business Solutions adheres to all CFPB guidance and regulatory standards applicable to credit repair services.</p>

    <h3>CFPB Regulatory Compliance</h3>
    <ul>
      <li><strong>Regulation V (12 C.F.R. Part 1022):</strong> Implements the FCRA. We ensure all disputes are filed in accordance with Regulation V procedures.</li>
      <li><strong>Regulation F (12 C.F.R. Part 1006):</strong> Implements the FDCPA. We educate clients on their rights and reference Regulation F when challenging improperly reported collection accounts.</li>
      <li><strong>Supervision Authority:</strong> We acknowledge the CFPB's supervisory and enforcement authority over credit repair organizations and maintain our practices in accordance with CFPB guidance.</li>
      <li><strong>Consumer Complaint Process:</strong> If you are dissatisfied with our services, you have the right to file a complaint with the CFPB at <a href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener">consumerfinance.gov/complaint</a>.</li>
    </ul>

    <!-- ═══════ STATE LAW ═══════ -->
    <h2 id="state"><span class="section-badge">STATE</span> State Law Compliance</h2>

    <p>In addition to federal law, credit repair organizations may be subject to state-specific regulations. RJ Business Solutions complies with all applicable state laws, including but not limited to:</p>
    <ul>
      <li><strong>New Mexico:</strong> As our principal place of business is in Tijeras, New Mexico, we comply with all New Mexico consumer protection statutes, including the Unfair Practices Act (NMSA 57-12-1 et seq.). New Mexico law does not distinguish between ITIN and SSN holders for consumer protection purposes.</li>
      <li><strong>State Bonding/Registration:</strong> Where required by state law, we maintain appropriate bonds and registrations.</li>
      <li><strong>State Cancellation Rights:</strong> Some states provide cancellation rights that exceed the federal 3-business-day period. Where applicable, the longer cancellation period applies.</li>
      <li><strong>State-Specific Disclosures:</strong> Additional disclosures required by your state of residence will be provided as part of your service contract.</li>
      <li><strong>State ITIN Protections:</strong> Many states, including California (SB 1159), New York, Illinois, and others, have enacted additional protections prohibiting discrimination based on immigration status in credit and lending. We comply with all applicable state ITIN protection laws regardless of where our ITIN clients reside.</li>
    </ul>

    <!-- ═══════ RESULTS DISCLAIMER ═══════ -->
    <h2 id="results"><span class="section-badge">DISCLAIMER</span> Results &amp; Earnings Disclaimer</h2>

    <div class="warning-box">
      <strong>No Guarantee of Results:</strong> Credit repair results vary based on individual circumstances. RJ Business Solutions does not guarantee any specific credit score increase, removal of any specific item, or any particular outcome. Past results achieved for other clients do not guarantee or predict future results for you.<br><br>
      <strong>Factors Affecting Results:</strong> The outcome of credit repair depends on many factors including but not limited to: the accuracy and completeness of information currently reported, the willingness of furnishers to investigate and correct errors, the specific items on your credit report, your payment history during the repair process, and changes in credit reporting regulations.<br><br>
      <strong>Not a Guarantee:</strong> Any examples of results, testimonials, or case studies shared on this website or in our marketing materials are for illustrative purposes only and should not be construed as a guarantee of similar results. Individual results may be better or worse than those described.
    </div>

    <!-- ═══════ CONTACT & REGULATORY ═══════ -->
    <h2 id="regulatory">Regulatory Contacts</h2>

    <p>If you believe your consumer rights have been violated, you may contact the following regulatory agencies:</p>

    <ul>
      <li><strong>Federal Trade Commission (FTC):</strong> <a href="https://www.ftc.gov/complaint" target="_blank" rel="noopener">ftc.gov/complaint</a> | 1-877-FTC-HELP (1-877-382-4357) | 600 Pennsylvania Avenue NW, Washington, DC 20580</li>
      <li><strong>Consumer Financial Protection Bureau (CFPB):</strong> <a href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener">consumerfinance.gov/complaint</a> | 1-855-411-CFPB (1-855-411-2372)</li>
      <li><strong>Department of Justice — Civil Rights Division:</strong> <a href="https://www.justice.gov/crt" target="_blank" rel="noopener">justice.gov/crt</a> (for ECOA national-origin discrimination complaints)</li>
      <li><strong>New Mexico Attorney General:</strong> <a href="https://www.nmag.gov/consumer-protection.aspx" target="_blank" rel="noopener">nmag.gov</a> | 1-844-255-9210 | P.O. Box 1508, Santa Fe, NM 87504</li>
      <li><strong>TransUnion:</strong> <a href="https://www.transunion.com/dispute" target="_blank" rel="noopener">transunion.com/dispute</a> | 1-800-916-8800 (accepts ITIN disputes)</li>
      <li><strong>Equifax:</strong> <a href="https://www.equifax.com/personal/disputes" target="_blank" rel="noopener">equifax.com/personal/disputes</a> | 1-866-349-5191 (accepts ITIN disputes)</li>
      <li><strong>Experian:</strong> <a href="https://www.experian.com/disputes" target="_blank" rel="noopener">experian.com/disputes</a> | 1-888-397-3742 (accepts ITIN disputes — may require mail-in for ITIN files)</li>
    </ul>

    <h2 id="contact">Contact Us</h2>
    <p><strong>RJ Business Solutions</strong><br>
    1342 NM 333, Tijeras, New Mexico 87059<br>
    Email: <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a><br>
    Website: <a href="https://rickjeffersonsolutions.com" target="_blank" rel="noopener">rickjeffersonsolutions.com</a></p>`
  )
}

// ========== /consumer-rights — CROA CONSUMER RIGHTS (STANDALONE) ==========
function consumerRightsPageHTML(): string {
  return legalLayout(
    'Consumer Credit File Rights — ITIN &amp; SSN Holders',
    'Your consumer credit file rights under CROA, FCRA, ECOA, and applicable state and federal law. ITIN holders have full credit dispute rights. Required disclosure from RJ Business Solutions.',
    `<h1>Consumer Credit File Rights Under State and Federal Law</h1>
    <p class="updated">Required Disclosure Pursuant to 15 U.S.C. &sect; 1679c (Credit Repair Organizations Act)</p>

    <div class="highlight-box">
      <strong>&#127919; ITIN Holders:</strong> Everything on this page applies equally to you. Under the FCRA and ECOA, ITIN holders have the <strong>exact same credit dispute rights</strong> as SSN holders. All three major credit bureaus accept ITINs for credit file identification and dispute filing.
    </div>

    <div class="croa-box">
      <p>You have a right to dispute inaccurate information in your credit report by contacting the credit bureau directly. However, neither you nor any "credit repair" company or credit repair organization has the right to have accurate, current, and verifiable information removed from your credit report. The credit bureau must remove accurate, negative information from your report only if it is over 7 years old. Bankruptcy information can be reported for 10 years.</p>

      <p>You have a right to obtain a copy of your credit report from a credit bureau. You may be charged a reasonable fee. There is no fee, however, if you have been turned down for credit, employment, insurance, or a rental dwelling because of information in your credit report within the preceding 60 days. The credit bureau must provide someone to help you interpret the information in your credit file. You are entitled to receive a free copy of your credit report if you are unemployed and intend to apply for employment in the next 60 days, if you are a recipient of public welfare assistance, or if you have reason to believe that there is inaccurate information in your credit report due to fraud.</p>

      <p>You have a right to sue a credit repair organization that violates the Credit Repair Organization Act. This law prohibits deceptive practices by credit repair organizations.</p>

      <p>You have the right to cancel your contract with any credit repair organization for any reason within 3 business days from the date you signed it.</p>

      <p>Credit bureaus are required to follow reasonable procedures to ensure that the information they report is accurate. However, mistakes may occur.</p>

      <p>You may, on your own, notify a credit bureau in writing that you dispute the accuracy of information in your credit file. The credit bureau must then reinvestigate and modify or remove inaccurate or incomplete information. The credit bureau may not charge any fee for this service. Any pertinent information and copies of all documents you have concerning an error should be given to the credit bureau.</p>

      <p>If the credit bureau's reinvestigation does not resolve the dispute to your satisfaction, you may send a brief statement to the credit bureau, to be kept in your file, explaining why you think the record is inaccurate. The credit bureau must include a summary of your statement about disputed information with any report it issues about you.</p>

      <p>The Federal Trade Commission regulates credit bureaus and credit repair organizations. For more information contact:</p>

      <p><strong>The Public Reference Branch<br>Federal Trade Commission<br>Washington, D.C. 20580</strong></p>
    </div>

    <h2>Additional Resources for Consumers</h2>
    <ul>
      <li><a href="https://www.annualcreditreport.com" target="_blank" rel="noopener">AnnualCreditReport.com</a> — Free annual credit reports from all three bureaus (ITIN accepted)</li>
      <li><a href="https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/" target="_blank" rel="noopener">CFPB Credit Reports &amp; Scores</a> — Consumer tools and educational resources</li>
      <li><a href="https://www.ftc.gov/legal-library/browse/statutes/credit-repair-organizations-act" target="_blank" rel="noopener">FTC — Credit Repair Organizations Act (Full Text)</a></li>
      <li><a href="https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act" target="_blank" rel="noopener">FTC — Fair Credit Reporting Act (Full Text)</a></li>
      <li><a href="https://www.ftc.gov/legal-library/browse/rules/fair-debt-collection-practices-act-text" target="_blank" rel="noopener">FTC — Fair Debt Collection Practices Act (Full Text)</a></li>
      <li><a href="https://www.ftc.gov/legal-library/browse/statutes/equal-credit-opportunity-act" target="_blank" rel="noopener">FTC — Equal Credit Opportunity Act (Full Text)</a></li>
    </ul>

    <h2>Your ECOA Rights as an ITIN Holder</h2>
    <div class="croa-box">
      <h3>&#9989; Equal Credit Opportunity Act (15 U.S.C. &sect; 1691)</h3>
      <p>The ECOA prohibits discrimination in credit transactions based on national origin. This means:</p>
      <ul>
        <li>Creditors <strong>cannot</strong> refuse to report your account to credit bureaus because you use an ITIN instead of an SSN</li>
        <li>Credit bureaus <strong>cannot</strong> refuse to investigate your disputes because your file is ITIN-identified</li>
        <li>Lenders <strong>cannot</strong> deny you credit solely because you use an ITIN</li>
        <li>Collection agencies <strong>cannot</strong> treat your ITIN-identified debt differently than an SSN-identified debt</li>
        <li>You have the right to sue for ECOA violations and recover actual damages, punitive damages, and attorney's fees</li>
      </ul>
    </div>

    <h2>Your Right to Self-Dispute</h2>
    <p>You have the right to dispute inaccurate information on your credit report directly with the credit bureaus at no cost — <strong>whether you have an SSN or an ITIN</strong>. You do not need to hire a credit repair organization to exercise this right. The credit bureaus' dispute processes are available at:</p>
    <ul>
      <li><strong>TransUnion:</strong> <a href="https://www.transunion.com/dispute" target="_blank" rel="noopener">transunion.com/dispute</a> | 1-800-916-8800 (accepts ITIN for identification)</li>
      <li><strong>Equifax:</strong> <a href="https://www.equifax.com/personal/disputes" target="_blank" rel="noopener">equifax.com/personal/disputes</a> | 1-866-349-5191 (accepts ITIN for identification)</li>
      <li><strong>Experian:</strong> <a href="https://www.experian.com/disputes" target="_blank" rel="noopener">experian.com/disputes</a> | 1-888-397-3742 (accepts ITIN — may require mail-in for ITIN files)</li>
    </ul>`
  )
}

// ========== /cancellation — CANCELLATION POLICY ==========
function cancellationPageHTML(): string {
  return legalLayout(
    'Cancellation Policy &amp; Notice of Right to Cancel — ITIN Credit Repair',
    'Your right to cancel ITIN credit repair services from RJ Business Solutions within 3 business days under CROA. Same rights for ITIN and SSN holders.',
    `<h1>Cancellation Policy &amp; Notice of Right to Cancel</h1>
    <p class="updated">Effective February 23, 2026 &bull; In accordance with 15 U.S.C. &sect; 1679e</p>

    <div class="croa-box">
      <h3>&#128221; Notice of Cancellation</h3>
      <p><strong>You may cancel this contract, without any penalty or obligation, at any time before midnight of the 3rd business day which begins after the date the contract is signed by you.</strong></p>
      <p>To cancel this contract, mail or deliver a signed, dated copy of this cancellation notice, or any other written notice, to:</p>
      <p><strong>RJ Business Solutions</strong><br>
      1342 NM 333<br>
      Tijeras, New Mexico 87059<br>
      Email: <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a></p>
      <p><em>I hereby cancel this transaction.</em></p>
      <p>[Date] ____________________</p>
      <p>[Signature] ____________________</p>
    </div>

    <h2>Cancellation Details</h2>
    <h3>3-Business-Day Right to Cancel (CROA &sect; 1679e)</h3>
    <p>Under the Credit Repair Organizations Act, you have the absolute right to cancel your contract with RJ Business Solutions for <strong>any reason</strong> within 3 business days of signing, without penalty or obligation of any kind.</p>

    <h3>How to Cancel</h3>
    <ul>
      <li><strong>Email:</strong> Send a written cancellation notice to <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a></li>
      <li><strong>Mail:</strong> Send a signed, dated cancellation notice to: RJ Business Solutions, 1342 NM 333, Tijeras, NM 87059</li>
    </ul>

    <h3>After the 3-Day Period</h3>
    <p>After the 3-business-day cancellation window, you may still cancel your service at any time. However, fees for services already fully performed are non-refundable, consistent with CROA provisions. Any fees collected for services not yet performed will be refunded within 10 business days.</p>

    <h3>Refund Policy</h3>
    <ul>
      <li><strong>Cancellation within 3 business days:</strong> Full refund of all fees paid, no questions asked.</li>
      <li><strong>90-Day Money-Back Guarantee:</strong> If we cannot demonstrate a single verified improvement within 90 days of active service, all monthly service fees (not the audit fee for completed audit) will be refunded.</li>
      <li><strong>Monitoring fees ($29.99/mo):</strong> MyFreeScoreNow monitoring is a third-party service. Cancellation of monitoring must be handled directly with MyFreeScoreNow.</li>
    </ul>

    <h3>No Work Before Contract</h3>
    <p>Pursuant to 15 U.S.C. &sect; 1679d(a)(2), no credit repair services will be provided before the end of the 3-business-day cancellation period following the date the contract is signed. This protects your right to cancel without having received services you would then be obligated to pay for.</p>`
  )
}

// ========== /privacy — PRIVACY POLICY ==========
function privacyPageHTML(): string {
  return legalLayout(
    'Privacy Policy — ITIN Credit Repair',
    'Privacy policy for RJ Business Solutions ITIN credit repair services. How we collect, use, and protect your personal information including ITIN data.',
    `<h1>Privacy Policy</h1>
    <p class="updated">Last Updated: February 23, 2026 &bull; Effective Date: February 23, 2026</p>

    <p>RJ Business Solutions ("we," "us," or "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website, use our ITIN or SSN credit repair services, or interact with us in any way.</p>

    <h2>1. Information We Collect</h2>
    <h3>1.1 Personal Information You Provide</h3>
    <ul>
      <li><strong>Contact Information:</strong> Full name, email address, phone number, mailing address</li>
      <li><strong>Identification:</strong> Individual Taxpayer Identification Number (ITIN) <strong>or</strong> Social Security Number (SSN) — used exclusively for credit bureau communication and dispute filing. We accept either identifier and do <strong>not</strong> require an SSN.</li>
      <li><strong>Financial Information:</strong> Credit report data (accessed through MyFreeScoreNow with your authorization), credit scores, account information relevant to credit repair</li>
      <li><strong>Payment Information:</strong> Credit/debit card details processed through Stripe (we do not store your full card number)</li>
      <li><strong>Identity Verification:</strong> Date of birth, ITIN or last four digits of SSN (only when required for credit bureau communication)</li>
    </ul>
    <h3>1.2 Automatically Collected Information</h3>
    <ul>
      <li>IP address and approximate geolocation</li>
      <li>Browser type and version</li>
      <li>Device information</li>
      <li>Pages visited and time spent on our site</li>
      <li>Referring URL and UTM parameters</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To provide credit repair services as described in your service agreement (for ITIN or SSN credit files)</li>
      <li>To communicate with credit bureaus and furnishers on your behalf using your ITIN or SSN as the identifying number</li>
      <li>To process payments securely through Stripe</li>
      <li>To send service-related communications (reports, updates, billing)</li>
      <li>To respond to your inquiries and provide customer support</li>
      <li>To comply with legal obligations and regulatory requirements</li>
      <li>To improve our services and website functionality</li>
    </ul>

    <h2>3. How We Share Your Information</h2>
    <p>We do <strong>not</strong> sell, rent, or trade your personal information — including your ITIN number. We share your information only in the following circumstances:</p>
    <ul>
      <li><strong>Credit Bureaus:</strong> TransUnion, Equifax, and Experian — as necessary to file disputes on your behalf with your written authorization. Your ITIN or SSN is transmitted to bureaus only for dispute filing and identity verification.</li>
      <li><strong>Creditors/Furnishers:</strong> As necessary to challenge inaccurate reporting on your behalf</li>
      <li><strong>Payment Processor:</strong> Stripe, Inc. — to process secure payments (<a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe Privacy Policy</a>)</li>
      <li><strong>Credit Monitoring:</strong> MyFreeScoreNow — you enroll directly with them using your ITIN or SSN; we access your reports with your authorization</li>
      <li><strong>Immigration Status:</strong> We do <strong>not</strong> collect, store, or share immigration or citizenship status information. Your ITIN is used solely for credit bureau identification and dispute filing.</li>
      <li><strong>Legal Requirements:</strong> When required by law, regulation, legal process, or enforceable governmental request</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We implement industry-standard security measures to protect your personal information, including:</p>
    <ul>
      <li>TLS/SSL encryption for all data transmitted to and from our website</li>
      <li>Encrypted storage of sensitive data</li>
      <li>Limited access to personal information on a need-to-know basis</li>
      <li>Regular security reviews and updates</li>
      <li>Stripe PCI-DSS compliant payment processing (we never store full card numbers)</li>
    </ul>

    <h2>5. Data Retention</h2>
    <ul>
      <li><strong>Service Records:</strong> Maintained for 2 years after service completion (CROA record retention requirement under 15 U.S.C. &sect; 1679c(c))</li>
      <li><strong>Payment Records:</strong> Maintained for 7 years for tax and legal compliance</li>
      <li><strong>Marketing Data:</strong> Until you opt out or request deletion</li>
      <li><strong>Telemarketing Records:</strong> Maintained for 5 years (TSR recordkeeping requirement under 16 C.F.R. &sect; 310.5)</li>
    </ul>

    <h2>6. Your Rights</h2>
    <h3>All Consumers</h3>
    <ul>
      <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
      <li><strong>Correction:</strong> Request correction of inaccurate personal information</li>
      <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
      <li><strong>Opt-Out:</strong> Opt out of marketing communications at any time</li>
    </ul>
    <h3>California Residents (CCPA/CPRA)</h3>
    <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):</p>
    <ul>
      <li>Right to know what personal information we collect, use, and disclose</li>
      <li>Right to delete your personal information</li>
      <li>Right to opt out of the sale of your personal information (we do not sell your data)</li>
      <li>Right to non-discrimination for exercising your privacy rights</li>
      <li>Right to correct inaccurate personal information</li>
      <li>Right to limit use of sensitive personal information</li>
    </ul>

    <h2>7. Cookies and Tracking</h2>
    <p>Our website may use cookies and similar tracking technologies to improve your experience. You can control cookie settings through your browser. We do not use cookies to collect personal financial information.</p>

    <h2>8. Children's Privacy</h2>
    <p>Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe we have collected information from your child, please contact us immediately.</p>

    <h2>9. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.</p>

    <h2>10. Contact Us</h2>
    <p>For privacy-related inquiries or to exercise your rights:<br>
    <strong>RJ Business Solutions</strong><br>
    1342 NM 333, Tijeras, New Mexico 87059<br>
    Email: <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a><br>
    Website: <a href="https://rickjeffersonsolutions.com" target="_blank" rel="noopener">rickjeffersonsolutions.com</a></p>`
  )
}

// ========== /terms — TERMS OF SERVICE ==========
function termsPageHTML(): string {
  return legalLayout(
    'Terms of Service — ITIN Credit Repair',
    'Terms of Service for RJ Business Solutions ITIN credit repair services. Service agreement for ITIN and SSN holders, billing, cancellation, and dispute resolution.',
    `<h1>Terms of Service</h1>
    <p class="updated">Last Updated: February 23, 2026 &bull; Effective Date: February 23, 2026</p>

    <p>These Terms of Service ("Terms") govern your use of the credit repair services provided by RJ Business Solutions ("Company," "we," "us," or "our"). By engaging our services, you agree to these Terms in their entirety.</p>

    <h2>1. Services Provided</h2>
    <p>RJ Business Solutions provides credit repair services for individuals identified by either a Social Security Number (SSN) or Individual Taxpayer Identification Number (ITIN), including but not limited to:</p>
    <ul>
      <li>Forensic 3-bureau ITIN or SSN credit audits (TransUnion, Equifax, Experian)</li>
      <li>Personalized ITIN-specific or SSN-specific credit restoration roadmaps</li>
      <li>Filing statute-specific disputes with credit bureaus and furnishers under the FCRA and ECOA</li>
      <li>Using bureau-specific ITIN dispute procedures (online, mail-in, or phone as required by each bureau)</li>
      <li>Monitoring dispute responses and filing follow-up disputes</li>
      <li>Monthly progress reports</li>
      <li>ITIN credit-building education and bilingual support (English &amp; Spanish)</li>
    </ul>
    <p>We are a credit repair organization as defined under the Credit Repair Organizations Act (15 U.S.C. &sect; 1679 et seq.). We are <strong>not</strong> a law firm, we do <strong>not</strong> provide legal advice, and we do <strong>not</strong> guarantee any specific results.</p>

    <h2>2. Eligibility</h2>
    <p>You must be at least 18 years old to use our services. You must hold either a valid Social Security Number (SSN) <strong>or</strong> a valid Individual Taxpayer Identification Number (ITIN) issued by the IRS. ITIN holders have the same eligibility and the same rights under federal law (FCRA, ECOA, CROA) as SSN holders. You must provide accurate and truthful information throughout the engagement.</p>

    <div class="highlight-box">
      <strong>ITIN Clients:</strong> Under the Equal Credit Opportunity Act (15 U.S.C. &sect; 1691), it is illegal to discriminate based on national origin. All three major credit bureaus accept ITINs. Our services, fees, and protections are identical for ITIN and SSN holders.
    </div>

    <h2>3. Required Credit Monitoring</h2>
    <p>Before we can begin any credit repair work, you must enroll in and maintain an active MyFreeScoreNow monitoring subscription ($29.99/month). MyFreeScoreNow accepts ITIN numbers for enrollment. This is a third-party service required for us to access your tri-bureau credit data. The monitoring fee is paid directly to MyFreeScoreNow and is separate from our service fees.</p>

    <h2>4. Fees and Billing</h2>
    <h3>4.1 Audit Fee</h3>
    <p>A one-time fee of $99.00 is charged for your forensic 3-bureau credit audit (SSN or ITIN) and personalized 10-Point Restoration Roadmap. This fee is for a <strong>completed, delivered product</strong> and is charged at the time of purchase via Stripe secure checkout. The completed audit and roadmap are delivered within 24–48 hours. ITIN audits use ITIN-specific bureau access procedures.</p>
    <h3>4.2 Monthly Service Fee</h3>
    <p>A monthly service fee of $99.00 covers dispute filing, tracking, follow-up, and progress reporting. <strong>This fee is charged only in months where verifiable progress has been documented</strong> (deletions, corrections, or verified score improvements). If no progress is made in a given month, no service fee is charged for that month.</p>
    <h3>4.3 No Advance Fees for Disputes</h3>
    <p>In compliance with CROA (15 U.S.C. &sect; 1679b(b)) and the TSR (16 C.F.R. &sect; 310.4(a)(2)), we do not charge fees for dispute services until those services have been fully performed and results documented.</p>

    <h2>5. Right to Cancel</h2>
    <div class="croa-box">
      <h3>&#128221; Your 3-Day Cancellation Right</h3>
      <p>Pursuant to 15 U.S.C. &sect; 1679e, you may cancel your contract with us <strong>for any reason, without penalty or obligation, within 3 business days</strong> of signing. See our <a href="/cancellation">Cancellation Policy</a> for full details and the Notice of Cancellation form.</p>
    </div>

    <h2>6. Client Responsibilities</h2>
    <ul>
      <li>Provide accurate and truthful information at all times, including your correct SSN or ITIN</li>
      <li>Maintain active MyFreeScoreNow credit monitoring throughout the engagement (ITIN accepted for enrollment)</li>
      <li>Respond promptly to requests for information or documentation</li>
      <li>Review all dispute letters and reports provided to you</li>
      <li>Not file additional disputes independently while we are actively working on your file (to avoid conflicting dispute processes)</li>
      <li>Notify us of any changes to your contact information</li>
    </ul>

    <h2>7. What We Do NOT Do</h2>
    <ul>
      <li>We do <strong>not</strong> guarantee specific credit score increases or removal of specific items</li>
      <li>We do <strong>not</strong> advise you to misrepresent your identity, use someone else's SSN, or create a "new" credit file — this includes never advising ITIN holders to use a fabricated SSN</li>
      <li>We do <strong>not</strong> advise you to dispute accurate, current, and verifiable information</li>
      <li>We do <strong>not</strong> engage in "credit profile number" (CPN) schemes — CPNs are illegal and often constitute identity fraud</li>
      <li>We do <strong>not</strong> provide legal advice or legal representation</li>
      <li>We do <strong>not</strong> charge for services before they are performed</li>
    </ul>

    <h2>8. 90-Day Money-Back Guarantee</h2>
    <p>If we are unable to show a single verified improvement (deletion, correction, or documented score increase) within 90 days of active service, we will refund all monthly service fees collected during that period. This guarantee does not apply to the initial audit fee (for the completed audit product) or to third-party monitoring fees.</p>

    <h2>9. Limitation of Liability</h2>
    <p>To the maximum extent permitted by law, RJ Business Solutions' total liability for any claim arising from or related to our services shall not exceed the total fees you have paid to us during the 12 months preceding the claim. We are not liable for actions taken by credit bureaus, creditors, or third-party service providers.</p>

    <h2>10. Dispute Resolution</h2>
    <p>Any dispute arising from these Terms or our services will first be addressed through good-faith negotiation. If negotiation is unsuccessful, disputes will be resolved through binding arbitration in Bernalillo County, New Mexico, in accordance with the rules of the American Arbitration Association. Nothing in this section limits your rights under CROA, the FCRA, or other applicable federal or state consumer protection laws.</p>

    <h2>11. Governing Law</h2>
    <p>These Terms are governed by and construed in accordance with federal law (including CROA, FCRA, FDCPA, and the FTC Act) and the laws of the State of New Mexico, without regard to conflict of law principles.</p>

    <h2>12. Severability</h2>
    <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>

    <h2>13. Changes to Terms</h2>
    <p>We reserve the right to modify these Terms at any time. Changes will be posted on this page. Your continued use of our services after changes constitutes acceptance of the modified Terms.</p>

    <h2>14. Contact</h2>
    <p><strong>RJ Business Solutions</strong><br>
    1342 NM 333, Tijeras, New Mexico 87059<br>
    Email: <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a><br>
    Website: <a href="https://rickjeffersonsolutions.com" target="_blank" rel="noopener">rickjeffersonsolutions.com</a></p>`
  )
}

// ========== FUNNEL PAGE HTML ==========
function basicFunnelHTML(stripeKey: string, mfsnUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean It Up | ITIN Credit Repair — Fix Your Credit With an ITIN Number | RJ Business Solutions</title>
  <meta name="description" content="ITIN credit repair for individuals without an SSN. Remove negative items from your ITIN credit file using FCRA, ECOA &amp; federal law. All 3 bureaus accept ITINs. 90-day money-back guarantee. $99 forensic audit.">
  <meta property="og:title" content="Clean It Up — ITIN Credit Repair | No SSN Required">
  <meta property="og:description" content="Have an ITIN? You have the SAME credit dispute rights as SSN holders under federal law. We fix ITIN credit files across all 3 bureaus. $99 to start.">
  <meta property="og:image" content="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Professional_ITIN_credit_repair_hero_banner_featur-1771876741852.png">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Clean It Up — ITIN Credit Repair | No SSN Required">
  <meta name="twitter:description" content="ITIN holders have FULL credit dispute rights under FCRA &amp; ECOA. We repair ITIN credit files across TransUnion, Equifax &amp; Experian. 90-day guarantee.">
  <meta name="twitter:image" content="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Professional_ITIN_credit_repair_hero_banner_featur-1771876741852.png">
  <meta name="keywords" content="ITIN credit repair, credit repair with ITIN number, ITIN credit score, fix credit without SSN, ITIN credit file disputes, ITIN TransUnion Equifax Experian, FCRA ITIN rights, ECOA credit protection, credit repair for immigrants, ITIN credit bureau disputes, Rick Jefferson ITIN credit expert, $99 ITIN credit audit">
  <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>&#x1f6e1;</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#030712;color:#fff;line-height:1.6;overflow-x:hidden}
    a{color:inherit;text-decoration:none}button{cursor:pointer;border:none;font-family:inherit}img{max-width:100%;height:auto;display:block}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes fadeInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
    @keyframes bounceY{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
    @keyframes particleMove{0%{transform:translate(0,0);opacity:.15}50%{opacity:.6}100%{transform:translate(var(--tx),var(--ty));opacity:.15}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,.4)}50%{box-shadow:0 0 0 16px rgba(236,72,153,0)}}
    @keyframes glow{0%,100%{filter:drop-shadow(0 0 8px rgba(59,130,246,.3))}50%{filter:drop-shadow(0 0 20px rgba(59,130,246,.6))}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes slideInStagger{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
    .ao{opacity:0;transform:translateY(30px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
    .ao.v{opacity:1;transform:translateY(0)}
    .ao.asl{transform:translateX(-40px)}.ao.asl.v{transform:translateX(0)}
    .ao.asr{transform:translateX(40px)}.ao.asr.v{transform:translateX(0)}
    .ao.asi{transform:scale(.85)}.ao.asi.v{transform:scale(1)}
    .s1{transition-delay:.1s}.s2{transition-delay:.2s}.s3{transition-delay:.25s}.s4{transition-delay:.35s}.s5{transition-delay:.45s}.s6{transition-delay:.55s}
    .ct{max-width:1200px;margin:0 auto;padding:0 1.5rem}
    .cs{max-width:960px;margin:0 auto;padding:0 1.5rem}
    .cx{max-width:720px;margin:0 auto;padding:0 1.5rem}
    .tc{text-align:center}
    /* ===== HERO ===== */
    .hero{position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#0c1445 0%,#1e1b4b 30%,#172554 60%,#0f172a 100%);padding:2rem 0 3rem;z-index:1}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 800px 600px at 20% 50%,rgba(59,130,246,.12),transparent),radial-gradient(ellipse 600px 400px at 80% 30%,rgba(6,182,212,.08),transparent);z-index:0}
    .hp{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    .hpd{position:absolute;width:3px;height:3px;background:rgba(96,165,250,.5);border-radius:50%;animation:particleMove var(--duration) linear infinite}
    .hero-logo{position:relative;z-index:2;margin-bottom:1.5rem;animation:fadeInUp .8s ease forwards}
    .hero-logo img{width:280px;height:auto;margin:0 auto;border-radius:.75rem;filter:drop-shadow(0 8px 32px rgba(59,130,246,.25))}
    .hc{position:relative;z-index:2;max-width:960px;margin:0 auto;text-align:center;padding:0 1.5rem}
    .ub{display:inline-flex;align-items:center;gap:.5rem;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.4);border-radius:999px;padding:.5rem 1.25rem;margin-bottom:1.5rem;animation:fadeInUp .8s ease .1s forwards;opacity:0}
    .ub i{color:#fbbf24;width:16px;height:16px}.ub span{color:#fca5a5;font-size:.875rem;font-weight:600}
    .hero h1{font-size:clamp(2.25rem,5.5vw,4rem);font-weight:900;line-height:1.1;margin-bottom:1.25rem;animation:fadeInUp .8s ease .2s forwards;opacity:0}
    .gt{display:block;margin-top:.5rem;background:linear-gradient(90deg,#60a5fa,#22d3ee,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero .st{font-size:clamp(1rem,2.2vw,1.25rem);color:#bfdbfe;max-width:680px;margin:0 auto 1.5rem;animation:fadeInUp .8s ease .35s forwards;opacity:0;line-height:1.7}
    .hero-img{width:100%;max-width:900px;margin:0 auto 2rem;border-radius:1rem;overflow:hidden;animation:fadeInUp .8s ease .25s forwards;opacity:0;box-shadow:0 16px 64px rgba(0,0,0,.5),0 0 0 1px rgba(59,130,246,.2)}
    .hero-img img{width:100%;height:auto}
    .vp{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;margin-bottom:2rem;animation:fadeInUp .8s ease .45s forwards;opacity:0}
    .vpi{background:rgba(30,58,138,.5);border:1px solid rgba(59,130,246,.3);color:#bfdbfe;padding:.45rem .9rem;border-radius:999px;font-size:.8rem;font-weight:600;white-space:nowrap;transition:all .3s}
    .vpi:hover{background:rgba(59,130,246,.3);border-color:rgba(96,165,250,.5);transform:translateY(-2px)}
    .cdw{background:rgba(30,58,138,.35);border:1px solid rgba(59,130,246,.35);border-radius:1.25rem;padding:1.25rem;max-width:360px;margin:0 auto 2rem;animation:fadeInUp .8s ease .5s forwards;opacity:0}
    .cdl{color:#93c5fd;font-size:.75rem;text-transform:uppercase;letter-spacing:.15em;margin-bottom:.6rem}
    .cdt{display:flex;justify-content:center;gap:.75rem}
    .cdb{text-align:center}
    .cdv{font-size:2.25rem;font-weight:900;color:#fff;width:3.75rem;height:3.75rem;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(220,38,38,.7),rgba(190,18,60,.5));border-radius:.75rem;margin-bottom:.25rem;border:1px solid rgba(239,68,68,.4)}
    .cdu{color:#fca5a5;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
    .cw{animation:fadeInUp .8s ease .6s forwards;opacity:0}
    .cb{display:inline-flex;align-items:center;gap:.75rem;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-weight:800;font-size:1.2rem;padding:1.2rem 2.5rem;border-radius:.875rem;box-shadow:0 8px 32px rgba(236,72,153,.35);transition:all .3s;position:relative;overflow:hidden;animation:pulse 2s infinite;text-transform:uppercase;letter-spacing:.03em}
    .cb::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#db2777,#be185d);opacity:0;transition:opacity .3s}
    .cb:hover::before{opacity:1}.cb:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(236,72,153,.5)}
    .cb span,.cb i{position:relative;z-index:1}.cb i{transition:transform .3s;width:20px;height:20px}.cb:hover i{transform:translateX(5px)}
    .cts{color:#93c5fd;font-size:.8rem;margin-top:1rem;opacity:.7}
    .sci{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);animation:bounceY 1.5s infinite;z-index:3}
    .sm{width:24px;height:40px;border:2px solid rgba(255,255,255,.3);border-radius:12px;display:flex;justify-content:center;padding-top:8px}
    .sd{width:4px;height:12px;background:rgba(255,255,255,.5);border-radius:2px}
    /* ===== SECTION IMAGE BLOCKS ===== */
    .sec-img{width:100%;max-width:900px;margin:0 auto;border-radius:1rem;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,0,.4),0 0 0 1px rgba(59,130,246,.15);transition:transform .5s cubic-bezier(.16,1,.3,1),box-shadow .5s}
    .sec-img:hover{transform:translateY(-4px) scale(1.005);box-shadow:0 20px 60px rgba(0,0,0,.5),0 0 0 1px rgba(59,130,246,.3)}
    .sec-img img{width:100%;height:auto}
    /* ===== PAIN POINTS ===== */
    .sp{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#030712 0%,#0a0f1f 100%)}
    .stt{font-size:clamp(2rem,4.5vw,3rem);font-weight:900;margin-bottom:1rem}
    .sts{font-size:1.1rem;color:#9ca3af;max-width:640px;margin:0 auto 3rem}
    .pg{display:grid;grid-template-columns:repeat(2,1fr);gap:1.25rem;margin-top:3rem}
    .pc{background:#111827;border:1px solid rgba(127,29,29,.3);border-radius:1.25rem;padding:1.75rem;transition:all .4s cubic-bezier(.16,1,.3,1)}
    .pc:hover{border-color:rgba(239,68,68,.5);transform:translateY(-6px);box-shadow:0 12px 40px rgba(239,68,68,.1)}
    .pc .iw{width:44px;height:44px;color:#ef4444;margin-bottom:.75rem}
    .pc h3{font-size:1rem;font-weight:700;color:#fff;margin-bottom:.4rem;line-height:1.4}
    .pc p{color:#9ca3af;font-size:.85rem}
    /* ===== FEATURES / VALUE ===== */
    .sf{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#0a0f1f 0%,#0a1128 50%,#0f172a 100%)}
    .fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.25rem;margin-bottom:3rem}
    .fc2{background:#111827;border:1px solid rgba(30,58,138,.4);border-radius:1.25rem;padding:1.5rem;transition:all .4s cubic-bezier(.16,1,.3,1)}
    .fc2:hover{border-color:rgba(59,130,246,.5);transform:translateY(-6px);box-shadow:0 12px 40px rgba(59,130,246,.1)}
    .fch{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:.75rem}
    .fc2 .iw{width:36px;height:36px;color:#60a5fa}
    .fv{color:#60a5fa;font-size:.75rem;font-weight:700;background:rgba(30,58,138,.4);padding:.2rem .65rem;border-radius:999px;white-space:nowrap}
    .fc2 h3{font-size:1rem;font-weight:700;color:#fff;margin-bottom:.4rem}
    .fc2 p{color:#9ca3af;font-size:.85rem;line-height:1.6}
    .vs{position:relative;z-index:2;background:linear-gradient(135deg,rgba(30,58,138,.4),rgba(6,78,59,.2));border:2px solid rgba(59,130,246,.35);border-radius:1.5rem;padding:2.5rem;text-align:center;margin-top:2rem}
    .vs .lb{color:#9ca3af;font-size:1.1rem;margin-bottom:.5rem}
    .vs .op{font-size:3rem;font-weight:900;color:#4b5563;text-decoration:line-through;margin-bottom:.35rem}
    .vs .nl{color:#d1d5db;margin-bottom:.35rem;font-size:1.1rem}
    .vs .ap{font-size:3.75rem;font-weight:900;color:#60a5fa;margin-bottom:.25rem}
    .vs .ap .pr{font-size:1.15rem;font-weight:600}
    .vs .pn{color:#9ca3af;font-size:.85rem;line-height:1.6}.vs .pn strong{color:#93c5fd}
    /* ===== HOW IT WORKS ===== */
    .ss{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#0f172a 0%,#030712 100%)}
    .stl{display:flex;flex-direction:column;gap:1.25rem}
    .sc{display:flex;gap:1.5rem;background:#111827;border:1px solid #1f2937;border-radius:1.25rem;padding:1.5rem;transition:all .4s cubic-bezier(.16,1,.3,1)}
    .sc:hover{border-color:rgba(59,130,246,.4);transform:translateX(6px);box-shadow:0 8px 32px rgba(59,130,246,.08)}
    .sn{font-size:2.25rem;font-weight:900;background:linear-gradient(135deg,#3b82f6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;min-width:3.5rem;flex-shrink:0;line-height:1;padding-top:.2rem}
    .sc h3{font-size:1rem;font-weight:700;color:#fff;margin-bottom:.4rem}
    .sc p{color:#9ca3af;font-size:.85rem;line-height:1.7}
    /* ===== COMPLIANCE ===== */
    .scp{position:relative;z-index:2;padding:5rem 0;background:rgba(23,37,84,.15);border-top:1px solid rgba(30,58,138,.3);border-bottom:1px solid rgba(30,58,138,.3)}
    .cpt{font-size:1.5rem;font-weight:700;text-align:center;margin-bottom:2rem}
    .cpg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
    .cpc{background:rgba(17,24,39,.6);border:1px solid rgba(30,58,138,.35);border-radius:.875rem;padding:1.25rem;transition:all .3s}
    .cpc:hover{border-color:rgba(59,130,246,.4);transform:translateY(-3px)}
    .cpc h4{color:#60a5fa;font-weight:700;margin-bottom:.4rem;font-size:.95rem}
    .cpc p{color:#9ca3af;font-size:.8rem;line-height:1.6}
    /* ===== FINAL CTA ===== */
    .sfc{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#030712 0%,#172554 100%);overflow:hidden}
    .sfc::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 600px 400px at 50% 60%,rgba(236,72,153,.08),transparent)}
    .fci{width:64px;height:64px;color:#60a5fa;margin:0 auto 1.5rem;animation:float 3s ease-in-out infinite}
    .gb{background:#111827;border:1px solid rgba(59,130,246,.35);border-radius:1.25rem;padding:2rem;margin-bottom:2.5rem}
    .gb .shi{width:48px;height:48px;color:#4ade80;margin:0 auto .75rem}
    .gb h3{font-size:1.25rem;font-weight:800;margin-bottom:.6rem}
    .gb p{color:#9ca3af;font-size:.9rem;line-height:1.6}
    .fn{color:#6b7280;font-size:.8rem;margin-top:1rem;line-height:1.6}
    .guarantee-img{max-width:320px;margin:0 auto 2rem;border-radius:1rem;overflow:hidden;animation:glow 3s ease-in-out infinite}
    .guarantee-img img{width:100%;height:auto;border-radius:1rem}
    .cta-banner-img{width:100%;max-width:880px;margin:0 auto 2.5rem;border-radius:1rem;overflow:hidden;box-shadow:0 16px 64px rgba(236,72,153,.2),0 0 0 1px rgba(236,72,153,.2)}
    .cta-banner-img img{width:100%;height:auto}
    /* ===== MODAL ===== */
    .mo{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;align-items:center;justify-content:center;padding:1.5rem}
    .mo.active{display:flex}
    .md{background:#111827;border:1px solid rgba(59,130,246,.4);border-radius:1.5rem;padding:2.5rem;max-width:520px;width:100%;position:relative;animation:scaleIn .3s ease;box-shadow:0 32px 80px rgba(0,0,0,.6)}
    .mc{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);color:#9ca3af;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;transition:background .3s}
    .mc:hover{background:rgba(255,255,255,.2);color:#fff}
    .md h2{font-size:1.5rem;font-weight:800;margin-bottom:.5rem}
    .md .ms{color:#9ca3af;font-size:.9rem;margin-bottom:1.5rem}
    .fg2{margin-bottom:1.25rem}
    .fg2 label{display:block;color:#d1d5db;font-size:.85rem;font-weight:600;margin-bottom:.4rem}
    .fg2 input{width:100%;padding:.875rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.75rem;color:#fff;font-size:1rem;transition:border-color .3s;outline:none}
    .fg2 input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
    .fg2 input::placeholder{color:#6b7280}
    .fs{width:100%;padding:1rem;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-weight:800;font-size:1.1rem;border-radius:.75rem;transition:all .3s;text-transform:uppercase;letter-spacing:.02em}
    .fs:hover{opacity:.9;transform:translateY(-1px)}.fs:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .fnt{text-align:center;color:#6b7280;font-size:.75rem;margin-top:1rem}
    .fsu{text-align:center;padding:2rem 0}
    .fsu .ci{width:64px;height:64px;color:#4ade80;margin:0 auto 1rem}
    .fsu h3{font-size:1.25rem;font-weight:700;margin-bottom:.5rem}
    .fsu p{color:#9ca3af;font-size:.9rem;line-height:1.6}
    .fsu .nsa{margin-top:1.5rem;display:flex;flex-direction:column;gap:.75rem;text-align:left}
    .fsu .nsi{display:flex;gap:.75rem;padding:.75rem;background:rgba(30,58,138,.15);border:1px solid rgba(59,130,246,.2);border-radius:.75rem}
    .fsu .nsn{width:28px;height:28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;flex-shrink:0}
    .fsu .nsi a{color:#60a5fa;font-weight:600;font-size:.9rem}
    .fsu .nsi span{color:#9ca3af;font-size:.85rem}
    /* ===== STICKY BAR ===== */
    .sb{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(17,24,39,.97);backdrop-filter:blur(16px);border-top:1px solid rgba(236,72,153,.3);padding:.75rem 1.5rem;z-index:900;justify-content:center;transform:translateY(100%);transition:transform .3s ease}
    .sb.v{transform:translateY(0)}.sb .cb{font-size:.95rem;padding:.8rem 1.75rem;width:100%;justify-content:center;animation:none}
    /* ===== FOOTER ===== */
    .ft{padding:3rem 0;background:#030712;border-top:1px solid #1f2937;text-align:center}
    .fl{width:240px;height:auto;margin:0 auto 1.5rem;border-radius:.75rem;filter:drop-shadow(0 4px 16px rgba(59,130,246,.15))}
    .ft p{color:#6b7280;font-size:.8rem;line-height:1.8}
    .ft a{color:#60a5fa}.ft a:hover{text-decoration:underline}
    /* ===== PROGRESS BAR ===== */
    .spots-bar{max-width:320px;margin:1rem auto 0;animation:fadeInUp .8s ease .55s forwards;opacity:0}
    .spots-text{font-size:.85rem;color:#fca5a5;font-weight:600;margin-bottom:.4rem}
    .spots-text em{color:#ef4444;font-style:normal;font-weight:800}
    .bar-track{height:10px;background:rgba(239,68,68,.15);border-radius:5px;overflow:hidden}
    .bar-fill{height:100%;width:50%;background:linear-gradient(90deg,#ef4444,#ec4899);border-radius:5px;transition:width 1s ease}
    .bar-label{font-size:.7rem;color:#6b7280;text-align:right;margin-top:.2rem}
    /* ===== RESPONSIVE ===== */
    @media(max-width:768px){
      .hero{padding:1.5rem 0 5rem}
      .hero-logo img{width:200px}
      .hero h1{font-size:2rem}
      .hero .st{font-size:.95rem}
      .hero-img{margin:0 auto 1.5rem}
      .vp{gap:.4rem}.vpi{font-size:.7rem;padding:.35rem .65rem}
      .cdv{font-size:1.75rem;width:3rem;height:3rem}
      .cb{font-size:1rem;padding:1rem 1.75rem;width:100%;justify-content:center}
      .sc{flex-direction:column;gap:.75rem}.sn{font-size:1.75rem}
      .fg{grid-template-columns:1fr}
      .pg{grid-template-columns:1fr}
      .vs .op{font-size:2.25rem}.vs .ap{font-size:2.75rem}
      .sb{display:flex}
      .sp,.sf,.ss,.sfc,.scp{padding:3.5rem 0}
      .sec-img{border-radius:.75rem}
      .guarantee-img{max-width:240px}
      .fl{width:180px}
    }
  </style>

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context":"https://schema.org",
    "@type":"Service",
    "name":"Clean It Up — ITIN Credit Repair Basic Plan",
    "provider":{"@type":"Organization","name":"RJ Business Solutions","url":"https://rickjeffersonsolutions.com","logo":"https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg","address":{"@type":"PostalAddress","streetAddress":"1342 NM 333","addressLocality":"Tijeras","addressRegion":"NM","postalCode":"87059","addressCountry":"US"}},
    "description":"ITIN credit repair targeting 1-5 negative items using federal law (FCRA, ECOA, CROA). ITIN holders have the same dispute rights as SSN holders. Pay only when progress is verified. 90-day money-back guarantee.",
    "offers":{"@type":"Offer","price":"99.00","priceCurrency":"USD","description":"One-time forensic 3-bureau ITIN/SSN credit audit fee"}
  }
  </script>
</head>
<body>

  <!-- ===== HERO SECTION ===== -->
  <section class="hero" id="hero">
    <div class="hp" id="particles"></div>

    <div class="hero-logo">
      <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions - Professional Credit Repair Services" title="RJ Business Solutions" width="280" height="auto" fetchpriority="high">
    </div>

    <div class="hc">
      <div class="ub"><i data-lucide="alert-triangle"></i><span>Limited Spots Available This Month — Only 12 Remaining</span></div>
      <h1>Have an ITIN? You Have<span class="gt">Full Credit Repair Rights</span></h1>
      <p class="st">All three credit bureaus — TransUnion, Equifax, and Experian — accept ITIN numbers. Under the FCRA and ECOA, you have the <strong>exact same dispute rights</strong> as SSN holders. We use federal law to challenge every inaccurate item on your ITIN credit file — and you don't pay a cent until something actually gets removed.</p>
    </div>

    <!-- HERO IMAGE -->
    <div class="hero-img">
      <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Professional_ITIN_credit_repair_hero_banner_featur-1771876741852.png" alt="ITIN credit repair hero banner featuring Rick Jefferson - fix your credit with an ITIN number, all 3 bureaus accept ITINs, FCRA and ECOA protected, $99 basic plan" title="ITIN Credit Repair by Rick Jefferson - No SSN Required, Full Federal Protection" width="1365" height="768" fetchpriority="high" loading="eager">
    </div>

    <div class="hc" style="padding-top:0">
      <div class="vp">
        <span class="vpi">&#10003; Works With ITIN — No SSN Needed</span>
        <span class="vpi">&#10003; All 3 Bureaus Accept ITINs</span>
        <span class="vpi">&#10003; FCRA + ECOA Protected</span>
        <span class="vpi">&#10003; No Pay Until Progress</span>
        <span class="vpi">&#10003; 90-Day Money Back</span>
        <span class="vpi">&#10003; Starts at $99</span>
      </div>
      <div class="cdw">
        <p class="cdl">&#9889; Enrollment Closes In</p>
        <div class="cdt">
          <div class="cdb"><div class="cdv" id="cd-h">23</div><div class="cdu">Hours</div></div>
          <div class="cdb"><div class="cdv" id="cd-m">59</div><div class="cdu">Minutes</div></div>
          <div class="cdb"><div class="cdv" id="cd-s">59</div><div class="cdu">Seconds</div></div>
        </div>
      </div>
      <div class="cw">
        <button class="cb" onclick="openModal()"><span>&#9654; Start My Basic Plan Now &#9654;</span><i data-lucide="arrow-right"></i></button>
      </div>
      <p class="cts">+ $29.99/mo credit monitoring required &bull; One-time $99 audit fee &bull; Only billed when progress is made</p>
      <div class="spots-bar">
        <p class="spots-text">Limited Spots Available This Month - <em>Only 12 Remaining</em></p>
        <div class="bar-track"><div class="bar-fill"></div></div>
        <p class="bar-label">12 of 24</p>
      </div>
    </div>
    <div class="sci"><div class="sm"><div class="sd"></div></div></div>
  </section>

  <!-- ===== PAIN POINTS SECTION ===== -->
  <section class="sp" id="problems">
    <div class="cs">
      <div class="tc ao">
        <h2 class="stt">Sound Familiar? ITIN Credit Holders Face These Every Day</h2>
        <p class="sts">Having an ITIN doesn't mean you have fewer rights — but the system makes it feel that way. We fix that.</p>
      </div>

      <!-- PAIN POINTS IMAGE -->
      <div class="sec-img ao s1">
        <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/ITIN_credit_problems_visualization_2x2_grid_with_R-1771876471341.png" alt="ITIN credit problems visualization 2x2 grid - told we cant help you with ITIN, collections on ITIN file, cant get approved for mortgage or auto loan, dont know how to dispute with ITIN number" title="ITIN Credit Repair Pain Points - Problems ITIN Holders Face Every Day" width="1024" height="1024" loading="lazy">
      </div>

      <div class="pg">
        <div class="pc ao s1"><div class="iw"><i data-lucide="x-circle"></i></div><h3>Told "we can't help you" because you have an ITIN</h3><p>Wrong. Under ECOA (15 U.S.C. § 1691), creditors cannot discriminate based on national origin. Your ITIN file has the same rights.</p></div>
        <div class="pc ao s2"><div class="iw"><i data-lucide="x-circle"></i></div><h3>Collections or errors reporting on your ITIN credit file</h3><p>Bureaus accept ITINs — and the FCRA requires them to investigate disputes from ITIN holders the same as SSN holders.</p></div>
        <div class="pc ao s3"><div class="iw"><i data-lucide="x-circle"></i></div><h3>Can't get approved for a mortgage, auto loan, or credit card</h3><p>Inaccurate negatives on your ITIN file block approvals. ITIN loans exist — but only if your report is clean.</p></div>
        <div class="pc ao s4"><div class="iw"><i data-lucide="x-circle"></i></div><h3>Don't know how to dispute with an ITIN number</h3><p>Bureaus have different ITIN dispute procedures. We know exactly how to file with TransUnion, Equifax, and Experian using your ITIN.</p></div>
      </div>
    </div>
  </section>

  <!-- ===== VALUE STACK / FEATURES ===== -->
  <section class="sf" id="features">
    <div class="ct">
      <div class="tc ao">
        <h2 class="stt">Everything You Get With The <span style="color:#60a5fa">ITIN Basic Plan</span></h2>
        <p class="sts">Credit repair built specifically for ITIN holders. We know the bureau-specific ITIN procedures, the federal laws that protect you, and exactly how to get results.</p>
      </div>

      <!-- VALUE STACK IMAGE -->
      <div class="sec-img ao s1" style="margin-bottom:3rem">
        <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Bilingual_support_split-screen_English_leftSpanis-1771876500803.png" alt="ITIN credit repair bilingual support - English and Spanish split screen showing full service in both languages, $872 total value for $99 monthly, forensic audit, restoration roadmap, disputes, progress reports" title="Bilingual ITIN Credit Repair - English and Spanish Support Included" width="1024" height="1024" loading="lazy">
      </div>

      <div class="fg">
        <div class="fc2 ao s1"><div class="fch"><div class="iw"><i data-lucide="file-text"></i></div><span class="fv">$199 Value</span></div><h3>Forensic 3-Bureau ITIN Credit Audit</h3><p>Your full ITIN credit file across TransUnion, Equifax, and Experian — every tradeline, inquiry, and public record reviewed against FCRA accuracy standards using your ITIN number.</p></div>
        <div class="fc2 ao s2"><div class="fch"><div class="iw"><i data-lucide="bar-chart-2"></i></div><span class="fv">$149 Value</span></div><h3>ITIN-Specific Restoration Roadmap</h3><p>Custom strategy built for ITIN credit files. We know which bureaus require mail-in disputes for ITIN holders vs. online, and we map your 30/60/90-day milestones accordingly.</p></div>
        <div class="fc2 ao s3"><div class="fch"><div class="iw"><i data-lucide="shield"></i></div><span class="fv">$297 Value</span></div><h3>Up to 15 Statute-Specific Disputes/Mo</h3><p>Personalized dispute letters citing FCRA §611, §623, §605 and ECOA protections — filed with each bureau using their ITIN-specific dispute procedures.</p></div>
        <div class="fc2 ao s4"><div class="fch"><div class="iw"><i data-lucide="trending-up"></i></div><span class="fv">$99 Value</span></div><h3>Monthly ITIN Credit Progress Reports</h3><p>Documentation of every bureau response, deletion, correction, and score change on your ITIN credit file delivered each billing cycle.</p></div>
        <div class="fc2 ao s5"><div class="fch"><div class="iw"><i data-lucide="mail"></i></div><span class="fv">$79 Value</span></div><h3>Bilingual Support (English &amp; Spanish)</h3><p>Direct access with guaranteed one-business-day response. Our team communicates in both English and Spanish to ensure nothing gets lost in translation.</p></div>
        <div class="fc2 ao s6"><div class="fch"><div class="iw"><i data-lucide="book-open"></i></div><span class="fv">$49 Value</span></div><h3>ITIN Credit Building Library</h3><p>How to build credit with an ITIN, secured cards that accept ITINs, ITIN mortgage readiness, utilization strategy, and credit maintenance protocols.</p></div>
      </div>

      <div class="vs ao asi">
        <p class="lb">Total Value of Everything Above</p>
        <p class="op">$872</p>
        <p class="nl">You Pay Just</p>
        <p class="ap">$99<span class="pr">/month</span></p>
        <p class="pn">+ $99 one-time audit fee + $29.99/mo monitoring<br><strong>Billed only when verifiable progress is made</strong></p>
        <div style="margin-top:1.5rem"><button class="cb" onclick="openModal()" style="font-size:1.1rem"><span>&#9654; Claim This Deal Now</span><i data-lucide="arrow-right"></i></button></div>
      </div>
    </div>
  </section>

  <!-- ===== HOW IT WORKS ===== -->
  <section class="ss" id="how-it-works">
    <div class="cs">
      <h2 class="stt tc ao" style="margin-bottom:2.5rem">How ITIN Credit Repair Works</h2>

      <!-- PROCESS WORKFLOW IMAGE -->
      <div class="sec-img ao s1" style="margin-bottom:3rem">
        <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/5-step_ITIN_credit_repair_workflow_horizontal_time-1771876767740.png" alt="5-step ITIN credit repair workflow - activate MyFreeScoreNow with ITIN, pay $99 audit fee, review ITIN credit audit, file ITIN-specific bureau disputes, pay only when progress is made" title="How ITIN Credit Repair Works - 5-Step Process Using FCRA and ECOA" width="1365" height="768" loading="lazy">
      </div>

      <div class="stl">
        <div class="sc ao asl s1"><div class="sn">01</div><div><h3>Activate MyFreeScoreNow Monitoring ($29.99/mo)</h3><p>Enroll using your ITIN — MyFreeScoreNow accepts ITIN numbers. This gives us live tri-bureau visibility into your ITIN credit file to track every deletion, change, and score movement.</p></div></div>
        <div class="sc ao asl s2"><div class="sn">02</div><div><h3>Pay Your One-Time Audit Fee ($99)</h3><p>We pull and analyze your complete ITIN credit file across all 3 bureaus. Your forensic audit + ITIN-specific restoration roadmap are delivered within 24–48 hours.</p></div></div>
        <div class="sc ao asl s3"><div class="sn">03</div><div><h3>Review Your ITIN Credit Audit &amp; Roadmap</h3><p>Before a single dispute goes out, you see exactly what's on your ITIN file, what's challengeable, and our strategy for each bureau's ITIN-specific dispute process.</p></div></div>
        <div class="sc ao asl s4"><div class="sn">04</div><div><h3>We File ITIN-Specific Bureau Disputes</h3><p>Personalized letters citing FCRA §611, §623, §605 and ECOA §1691 protections. Filed using each bureau's ITIN dispute procedures — some require mail-in, some accept online. We handle it all.</p></div></div>
        <div class="sc ao asl s5"><div class="sn">05</div><div><h3>You're Only Billed When Things Move</h3><p>Documented deletions, corrections, or verified score improvements on your ITIN credit file = your $99 monthly fee. Nothing moved? Not billed. Period.</p></div></div>
      </div>
    </div>
  </section>

  <!-- ===== COMPLIANCE SECTION ===== -->
  <section class="scp" id="compliance">
    <div class="cs">
      <h3 class="cpt ao">&#128274; ITIN Holders Have Full Federal Protection — Here's the Law</h3>

      <!-- COMPLIANCE IMAGE -->
      <div class="sec-img ao s1" style="margin-bottom:2rem">
        <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Federal_law_protection_badges_2x3_grid_for_ITIN_B-1771876776233.png" alt="Federal law protection badges for ITIN credit repair - ECOA national origin protection, FCRA same rights same law, CROA compliant, FDCPA enforced, TSR FTC CFPB aligned, state law compliant" title="ITIN Holders Have Full Federal Protection - ECOA, FCRA, CROA, FDCPA Compliance Badges" width="1024" height="768" loading="lazy">
      </div>

      <div class="cpg">
        <div class="cpc ao s1"><h4>ECOA Protected (15 U.S.C. &sect; 1691)</h4><p>The Equal Credit Opportunity Act prohibits discrimination based on national origin. Creditors and bureaus <strong>cannot</strong> treat your ITIN file differently than an SSN file.</p></div>
        <div class="cpc ao s2"><h4>FCRA — Same Rights, Same Law</h4><p>Under the FCRA, ITIN holders have the <strong>exact same</strong> dispute rights as SSN holders. §611, §623, §605 — all apply to your ITIN credit file. 30-day investigation windows enforced.</p></div>
        <div class="cpc ao s3"><h4>CROA Compliant</h4><p>Written contract provided. 3-day cancellation right honored. No advance fees charged until services are performed. Full consumer disclosure per 15 U.S.C. &sect; 1679c.</p></div>
        <div class="cpc ao s4"><h4>FDCPA Enforced</h4><p>Collection accounts on your ITIN file challenged under FDCPA. Debt validation rights (15 U.S.C. &sect; 1692g) cited. Collectors cannot discriminate based on ITIN status.</p></div>
        <div class="cpc ao s5"><h4>TSR + FTC + CFPB Aligned</h4><p>No advance fees per TSR. Section 5 FTC Act compliant. CFPB Regulation V and F procedures followed for all ITIN disputes.</p></div>
        <div class="cpc ao s6"><h4>State Law Compliant</h4><p>New Mexico Unfair Practices Act compliant. State cancellation rights honored. ITIN holders receive all applicable state protections.</p></div>
      </div>
      <p class="ao" style="text-align:center;margin-top:1.5rem;font-size:.8rem;color:#6b7280">Full legal disclosures: <a href="/legal" style="color:#60a5fa">Legal &amp; Compliance</a> &bull; <a href="/consumer-rights" style="color:#60a5fa">Consumer Rights</a> &bull; <a href="/cancellation" style="color:#60a5fa">Cancellation Policy</a></p>
    </div>
  </section>

  <!-- ===== FINAL CTA SECTION ===== -->
  <section class="sfc" id="final-cta">
    <div class="cx tc">

      <!-- CTA URGENCY BANNER IMAGE -->
      <div class="cta-banner-img ao">
        <img src="https://media.rickjeffersonsolutions.com/basic%20%20ITIN/Final_CTA_urgency_banner_full-width_Ocean_Drive_Pi-1771876505174.png" alt="ITIN credit repair enrollment CTA banner - ready to clean up your ITIN credit file, limited spots, $99 audit, 90-day money-back guarantee, start now" title="Start Your ITIN Credit Repair Now - Limited Spots Available" width="1365" height="768" loading="lazy">
      </div>

      <div class="ao">
        <h2 class="stt" style="margin-bottom:1.5rem">Ready to Clean Up Your <span style="color:#60a5fa">ITIN Credit File</span>?</h2>
        <p class="sts" style="margin-bottom:2rem">Your ITIN gives you credit rights under federal law. Start with your $99 audit — see exactly what's on your ITIN file across all 3 bureaus. Then watch us legally challenge every inaccurate item — and only pay when we get results.</p>
      </div>

      <!-- GUARANTEE SEAL IMAGE -->
      <div class="guarantee-img ao">
        <img src="https://media.rickjeffersonsolutions.com/basic/Professional_90-day_money-back_guarantee_seal_feat-1771867713569.png" alt="90-day money-back guarantee seal for credit repair services - no verified improvement equals full refund, no questions, no conditions - Rick Jefferson commitment" title="90-Day Money-Back Guarantee - Risk-Free Credit Repair Services" width="1024" height="1024" loading="lazy">
      </div>

      <div class="gb ao">
        <div class="shi"><i data-lucide="shield-check"></i></div>
        <h3>90-Day Money-Back Guarantee</h3>
        <p>If we can't show a single verified improvement in 90 days, you get every package fee back. No questions. No conditions. No runaround.</p>
      </div>

      <div class="ao">
        <button class="cb" onclick="openModal()" style="margin:0 auto;font-size:1.3rem;padding:1.4rem 3rem"><span>&#9654; START MY BASIC PLAN NOW &#9654;</span><i data-lucide="arrow-right"></i></button>
        <p class="fn" style="margin-top:1.25rem">$99 audit fee + $29.99/mo monitoring to start. Monthly $99 fee only charged when progress is verified.<br>Cancel anytime within 3 business days per CROA rights.</p>
      </div>
    </div>
  </section>

  <!-- ===== FOOTER ===== -->
  <footer class="ft">
    <div class="cx">
      <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" class="fl">
      <p><strong style="color:#d1d5db">RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br><a href="https://rickjeffersonsolutions.com" target="_blank">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a></p>
      <div style="margin:1.25rem auto;max-width:700px;padding:1rem;background:rgba(17,24,39,.8);border:1px solid #1f2937;border-radius:.75rem;text-align:left">
        <p style="color:#9ca3af;font-size:.7rem;line-height:1.7;margin:0">
          <strong style="color:#d1d5db">Federal Compliance Disclosures:</strong> RJ Business Solutions is a credit repair organization as defined under the Credit Repair Organizations Act (15 U.S.C. &sect; 1679 et seq.). We serve both SSN and ITIN holders. We are not a law firm, we are not attorneys, and we do not provide legal advice. You have the right to dispute inaccurate information on your credit report directly with the credit bureaus at no cost — whether identified by SSN or ITIN. Neither you nor any credit repair company has the right to have accurate, current, and verifiable information removed from your credit report. Results vary and are not guaranteed. You have the right to cancel your contract within 3 business days of signing without penalty (CROA &sect; 1679e). No fees are charged for credit repair services until such services have been fully performed (CROA &sect; 1679b(b); TSR 16 C.F.R. &sect; 310.4(a)(2)). The $99 audit fee is for a completed, delivered forensic audit product. Monthly service fees are charged only when verifiable progress is documented. All disputes are filed in accordance with the Fair Credit Reporting Act (15 U.S.C. &sect; 1681 et seq.) and the Equal Credit Opportunity Act (15 U.S.C. &sect; 1691 et seq.). ECOA prohibits discrimination based on national origin — ITIN holders receive identical dispute protections as SSN holders. Our services comply with the Fair Debt Collection Practices Act (15 U.S.C. &sect; 1692 et seq.), the FTC Telemarketing Sales Rule (16 C.F.R. Part 310), the Federal Trade Commission Act (15 U.S.C. &sect; 41 et seq.), and applicable CFPB regulations.
        </p>
        <p style="color:#9ca3af;font-size:.7rem;line-height:1.7;margin:.75rem 0 0">
          <strong style="color:#d1d5db">Regulatory Contacts:</strong> FTC: <a href="https://www.ftc.gov/complaint" target="_blank" style="color:#60a5fa">ftc.gov/complaint</a> | 1-877-FTC-HELP &bull; CFPB: <a href="https://www.consumerfinance.gov/complaint/" target="_blank" style="color:#60a5fa">consumerfinance.gov/complaint</a> | 1-855-411-CFPB &bull; NM Attorney General: <a href="https://www.nmag.gov" target="_blank" style="color:#60a5fa">nmag.gov</a> | 1-844-255-9210
        </p>
      </div>
      <p style="margin-top:.75rem"><a href="/legal">Legal Disclosures</a> &bull; <a href="/consumer-rights">Consumer Rights</a> &bull; <a href="/privacy">Privacy Policy</a> &bull; <a href="/terms">Terms of Service</a> &bull; <a href="/cancellation">Cancellation Policy</a></p>
      <p style="margin-top:.75rem">&copy; 2026 RJ Business Solutions. All rights reserved.<br>Credit repair services are performed in compliance with CROA, FCRA, ECOA, FDCPA, TSR, and applicable state regulations. ITIN holders have full credit dispute rights under federal law.</p>
    </div>
  </footer>

  <!-- ===== LEAD CAPTURE + STRIPE CHECKOUT MODAL ===== -->
  <div class="mo" id="leadModal">
    <div class="md">
      <button class="mc" onclick="closeModal()">&times;</button>
      <div id="formView">
        <h2>Start Your Basic Plan</h2>
        <p class="ms">Enter your info below. After submitting, you'll be directed to secure payment for your $99 forensic audit.</p>
        <form id="leadForm" onsubmit="handleSubmit(event)">
          <div class="fg2"><label for="name">Full Name *</label><input type="text" id="name" name="name" placeholder="John Smith" required></div>
          <div class="fg2"><label for="email">Email Address *</label><input type="email" id="email" name="email" placeholder="john@example.com" required></div>
          <div class="fg2"><label for="phone">Phone Number</label><input type="tel" id="phone" name="phone" placeholder="(555) 123-4567"></div>
          <button type="submit" class="fs" id="submitBtn">Claim My Spot — $99 Audit</button>
          <p class="fnt">&#128274; Your information is 100% secure and never shared.</p>
          <p class="fnt" style="margin-top:.5rem;line-height:1.5">By submitting, you acknowledge our <a href="/consumer-rights" target="_blank" style="color:#60a5fa">Consumer Rights Disclosure</a>, <a href="/terms" target="_blank" style="color:#60a5fa">Terms of Service</a>, and <a href="/privacy" target="_blank" style="color:#60a5fa">Privacy Policy</a>. You have the right to cancel within 3 business days of signing any contract (<a href="/cancellation" target="_blank" style="color:#60a5fa">Cancellation Policy</a>). No credit repair fees are charged until services are fully performed.</p>
        </form>
      </div>
      <div id="successView" style="display:none">
        <div class="fsu">
          <div class="ci"><i data-lucide="check-circle"></i></div>
          <h3>You're In!</h3>
          <p>Your info has been captured. Complete these two steps to begin your credit repair:</p>
          <div class="nsa">
            <div class="nsi"><div class="nsn">1</div><div><a href="${mfsnUrl}" target="_blank" id="mfsnLink">Activate MyFreeScoreNow Monitoring &rarr;</a><br><span>$29.99/mo — Required before audit begins</span></div></div>
            <div class="nsi"><div class="nsn">2</div><div><a href="#" onclick="startCheckout()" id="checkoutLink">Pay $99 Audit Fee (Secure Checkout) &rarr;</a><br><span>Stripe-secured payment — Audit delivered in 24–48 hours</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- STICKY CTA BAR -->
  <div class="sb" id="stickyBar"><button class="cb" onclick="openModal()" style="animation:none"><span>&#9654; Start My Basic Plan — $99</span><i data-lucide="arrow-right"></i></button></div>

  <script>
    let currentLeadId=null,currentEmail=null,currentName=null;
    document.addEventListener('DOMContentLoaded',function(){lucide.createIcons();initP();initAO();initSB();initImgLoad()});

    // Countdown Timer
    (function(){let h=23,m=59,s=59;const hE=document.getElementById('cd-h'),mE=document.getElementById('cd-m'),sE=document.getElementById('cd-s');setInterval(function(){if(s>0)s--;else if(m>0){m--;s=59}else if(h>0){h--;m=59;s=59}else{h=23;m=59;s=59}hE.textContent=String(h).padStart(2,'0');mE.textContent=String(m).padStart(2,'0');sE.textContent=String(s).padStart(2,'0')},1000)})();

    // Particles
    function initP(){const c=document.getElementById('particles');if(!c)return;for(let i=0;i<30;i++){const p=document.createElement('div');p.className='hpd';p.style.left=Math.random()*100+'%';p.style.top=Math.random()*100+'%';p.style.setProperty('--tx',(Math.random()*200-100)+'px');p.style.setProperty('--ty',(Math.random()*200-100)+'px');p.style.setProperty('--duration',(Math.random()*15+10)+'s');c.appendChild(p)}}

    // Animate On Scroll
    function initAO(){const o=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){en.target.classList.add('v')}})},{threshold:.08,rootMargin:'0px 0px -40px 0px'});document.querySelectorAll('.ao').forEach(function(el){o.observe(el)})}

    // Sticky Bar
    function initSB(){const b=document.getElementById('stickyBar'),h=document.getElementById('hero');if(!b||!h)return;window.addEventListener('scroll',function(){b.classList.toggle('v',h.getBoundingClientRect().bottom<0)},{ passive:true })}

    // Image load animation
    function initImgLoad(){document.querySelectorAll('.sec-img img, .hero-img img, .guarantee-img img, .cta-banner-img img').forEach(function(img){if(img.complete){img.style.opacity='1'}else{img.style.opacity='0';img.style.transition='opacity .6s ease';img.addEventListener('load',function(){img.style.opacity='1'})}})}

    // Modal
    function openModal(){document.getElementById('leadModal').classList.add('active');document.body.style.overflow='hidden'}
    function closeModal(){document.getElementById('leadModal').classList.remove('active');document.body.style.overflow=''}
    document.getElementById('leadModal')?.addEventListener('click',function(e){if(e.target===this)closeModal()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});

    // Lead Submission
    async function handleSubmit(e){
      e.preventDefault();
      const btn=document.getElementById('submitBtn');
      const name=document.getElementById('name').value.trim();
      const email=document.getElementById('email').value.trim();
      const phone=document.getElementById('phone').value.trim();
      btn.disabled=true;btn.textContent='Submitting...';
      try{
        const u=new URLSearchParams(window.location.search);
        const res=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,phone,plan:'basic',utm_source:u.get('utm_source'),utm_medium:u.get('utm_medium'),utm_campaign:u.get('utm_campaign')})});
        const data=await res.json();
        if(data.success){
          currentLeadId=data.data.leadId;currentEmail=email;currentName=name;
          document.getElementById('formView').style.display='none';
          document.getElementById('successView').style.display='block';
          lucide.createIcons();
        }else{alert(data.error||'Something went wrong.');btn.disabled=false;btn.textContent='Claim My Spot — $99 Audit'}
      }catch(err){alert('Network error. Please try again.');btn.disabled=false;btn.textContent='Claim My Spot — $99 Audit'}
    }

    // Stripe Checkout
    async function startCheckout(){
      try{
        const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:currentEmail,name:currentName,leadId:currentLeadId})});
        const data=await res.json();
        if(data.success&&data.checkoutUrl){window.location.href=data.checkoutUrl}
        else{alert('Payment system is being configured. Please contact us at rickjefferson@rickjeffersonsolutions.com to complete your enrollment.')}
      }catch(err){alert('Payment system error. Please contact us at rickjefferson@rickjeffersonsolutions.com')}
    }
  </script>
</body>
</html>`
}

export default app
