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
    params.append('line_items[0][price_data][product_data][name]', 'Forensic 3-Bureau Credit Audit')
    params.append('line_items[0][price_data][product_data][description]', 'Complete forensic audit across TransUnion, Equifax, and Experian + Personalized 10-Point Restoration Roadmap. Delivered within 5 business days.')
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
          'Forensic 3-Bureau Credit Audit Fee'
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
  <title>Payment Confirmed | Clean It Up — RJ Business Solutions</title>
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
    <p class="sub">Your $99 forensic credit audit fee has been received. Here's what happens next:</p>

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
          <p>If you haven't already, activate your MyFreeScoreNow monitoring so we can begin your audit.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div>
          <h3>Audit Delivered in 5 Business Days</h3>
          <p>Your complete forensic 3-bureau audit + personalized 10-Point Restoration Roadmap will be emailed to you.</p>
        </div>
      </div>
    </div>

    <a href="https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=49914" target="_blank" class="btn">
      Activate Monitoring Now <i data-lucide="external-link" style="width:18px;height:18px"></i>
    </a>

    <p class="footer">
      Questions? Email <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a><br>
      &copy; 2025 RJ Business Solutions
    </p>
  </div>
  <script>lucide.createIcons();</script>
</body>
</html>`
}

// ========== FUNNEL PAGE HTML ==========
function basicFunnelHTML(stripeKey: string, mfsnUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean It Up | Precision Credit Repair for 1-5 Negative Items | RJ Business Solutions</title>
  <meta name="description" content="Remove 1-5 negative items from your credit report using federal law. Pay only when progress is made. 90-day money-back guarantee. Start with a $99 forensic audit.">
  <meta property="og:title" content="Clean It Up — Precision Credit Repair | Basic Plan">
  <meta property="og:description" content="You're 1-5 items away from the credit score you deserve. Federal law backed credit repair starting at $99.">
  <meta property="og:image" content="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#030712;color:#fff;line-height:1.6;overflow-x:hidden}
    a{color:inherit;text-decoration:none}button{cursor:pointer;border:none;font-family:inherit}img{max-width:100%;height:auto}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes bounceY{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}
    @keyframes particleMove{0%{transform:translate(0,0);opacity:.2}50%{opacity:.8}100%{transform:translate(var(--tx),var(--ty));opacity:.2}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
    .ao{opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease}
    .ao.v{opacity:1;transform:translateY(0)}
    .ao.sl{transform:translateX(-30px)}.ao.sl.v{transform:translateX(0)}
    .ao.si{transform:scale(.85)}.ao.si.v{transform:scale(1)}
    .s1{transition-delay:.1s}.s2{transition-delay:.2s}.s3{transition-delay:.3s}.s4{transition-delay:.4s}.s5{transition-delay:.5s}.s6{transition-delay:.6s}
    .ct{max-width:1200px;margin:0 auto;padding:0 1.5rem}
    .cs{max-width:900px;margin:0 auto;padding:0 1.5rem}
    .cx{max-width:720px;margin:0 auto;padding:0 1.5rem}
    .tc{text-align:center}.fc{display:flex;align-items:center;justify-content:center}
    .hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#0c1445 0%,#1e1b4b 30%,#172554 60%,#0f172a 100%);padding:5rem 0 3rem;z-index:1}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 800px 600px at 20% 50%,rgba(59,130,246,.12),transparent),radial-gradient(ellipse 600px 400px at 80% 30%,rgba(6,182,212,.08),transparent)}
    .hp{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
    .hpd{position:absolute;width:3px;height:3px;background:rgba(96,165,250,.5);border-radius:50%;animation:particleMove var(--duration) linear infinite}
    .hc{position:relative;z-index:2;max-width:900px;margin:0 auto;text-align:center;padding:0 1.5rem}
    .ub{display:inline-flex;align-items:center;gap:.5rem;background:rgba(59,130,246,.15);border:1px solid rgba(96,165,250,.3);border-radius:999px;padding:.5rem 1.25rem;margin-bottom:2rem;animation:fadeInUp .8s ease forwards}
    .ub i{color:#fbbf24;width:16px;height:16px}.ub span{color:#93c5fd;font-size:.875rem;font-weight:500}
    .hero h1{font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:1.1;margin-bottom:1.5rem;animation:fadeInUp .8s ease .2s forwards;opacity:0}
    .gt{display:block;margin-top:.5rem;background:linear-gradient(90deg,#60a5fa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .hero .st{font-size:clamp(1.1rem,2.5vw,1.35rem);color:#bfdbfe;max-width:720px;margin:0 auto 2rem;animation:fadeInUp .8s ease .4s forwards;opacity:0;line-height:1.7}
    .vp{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-bottom:2.5rem;animation:fadeInUp .8s ease .5s forwards;opacity:0}
    .vpi{background:rgba(30,58,138,.5);border:1px solid rgba(59,130,246,.3);color:#bfdbfe;padding:.5rem 1rem;border-radius:999px;font-size:.875rem;font-weight:500;white-space:nowrap}
    .cdw{background:rgba(30,58,138,.35);border:1px solid rgba(59,130,246,.35);border-radius:1.25rem;padding:1.5rem;max-width:380px;margin:0 auto 2.5rem;animation:fadeInUp .8s ease .6s forwards;opacity:0}
    .cdl{color:#93c5fd;font-size:.8rem;text-transform:uppercase;letter-spacing:.15em;margin-bottom:.75rem}
    .cdt{display:flex;justify-content:center;gap:1rem}
    .cdb{text-align:center}
    .cdv{font-size:2.5rem;font-weight:900;color:#fff;width:4rem;height:4rem;display:flex;align-items:center;justify-content:center;background:rgba(30,64,175,.6);border-radius:.75rem;margin-bottom:.25rem}
    .cdu{color:#60a5fa;font-size:.7rem;text-transform:uppercase;letter-spacing:.1em}
    .cw{animation:fadeInUp .8s ease .7s forwards;opacity:0}
    .cb{display:inline-flex;align-items:center;gap:.75rem;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:800;font-size:1.25rem;padding:1.25rem 2.5rem;border-radius:.875rem;box-shadow:0 8px 32px rgba(59,130,246,.35);transition:all .3s;position:relative;overflow:hidden}
    .cb::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#2563eb,#0891b2);opacity:0;transition:opacity .3s}
    .cb:hover::before{opacity:1}.cb:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(59,130,246,.45)}
    .cb span,.cb i{position:relative;z-index:1}.cb i{transition:transform .3s;width:20px;height:20px}.cb:hover i{transform:translateX(4px)}
    .cts{color:#60a5fa;font-size:.85rem;margin-top:1rem;opacity:.8}
    .sci{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);animation:bounceY 1.5s infinite;z-index:3}
    .sm{width:24px;height:40px;border:2px solid rgba(255,255,255,.4);border-radius:12px;display:flex;justify-content:center;padding-top:8px}
    .sd{width:4px;height:12px;background:rgba(255,255,255,.6);border-radius:2px}
    .sp{position:relative;z-index:2;padding:6rem 0;background:#030712}
    .stt{font-size:clamp(2rem,4.5vw,3rem);font-weight:800;margin-bottom:1rem}
    .sts{font-size:1.15rem;color:#9ca3af;max-width:600px;margin:0 auto 3.5rem}
    .pg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}
    .pc{background:#111827;border:1px solid rgba(127,29,29,.3);border-radius:1.25rem;padding:1.75rem;transition:border-color .3s,transform .3s}
    .pc:hover{border-color:rgba(239,68,68,.4);transform:translateY(-4px)}
    .pc .iw{width:48px;height:48px;color:#ef4444;margin-bottom:1rem}
    .pc h3{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:.5rem;line-height:1.4}
    .pc p{color:#9ca3af;font-size:.9rem}
    .sf{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#030712 0%,#0a1128 50%,#0f172a 100%)}
    .fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin-bottom:3rem}
    .fc2{background:#111827;border:1px solid rgba(30,58,138,.4);border-radius:1.25rem;padding:1.75rem;transition:border-color .3s,transform .3s}
    .fc2:hover{border-color:rgba(59,130,246,.5);transform:translateY(-4px)}
    .fch{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1rem}
    .fc2 .iw{width:40px;height:40px;color:#60a5fa}
    .fv{color:#60a5fa;font-size:.8rem;font-weight:700;background:rgba(30,58,138,.4);padding:.25rem .75rem;border-radius:999px;white-space:nowrap}
    .fc2 h3{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:.5rem}
    .fc2 p{color:#9ca3af;font-size:.9rem;line-height:1.6}
    .vs{position:relative;z-index:2;background:linear-gradient(135deg,rgba(30,58,138,.4),rgba(6,78,59,.2));border:1px solid rgba(59,130,246,.35);border-radius:1.25rem;padding:2.5rem;text-align:center;margin-top:3rem}
    .vs .lb{color:#9ca3af;font-size:1.15rem;margin-bottom:.5rem}
    .vs .op{font-size:3.25rem;font-weight:900;color:#4b5563;text-decoration:line-through;margin-bottom:.5rem}
    .vs .nl{color:#d1d5db;margin-bottom:.5rem}
    .vs .ap{font-size:4rem;font-weight:900;color:#60a5fa;margin-bottom:.25rem}
    .vs .ap .pr{font-size:1.25rem;font-weight:600}
    .vs .pn{color:#9ca3af;font-size:.9rem;line-height:1.6}.vs .pn strong{color:#93c5fd}
    .ss{position:relative;z-index:2;padding:6rem 0;background:#030712}
    .sl{display:flex;flex-direction:column;gap:1.25rem}
    .sc{display:flex;gap:1.5rem;background:#111827;border:1px solid #1f2937;border-radius:1.25rem;padding:1.75rem;transition:border-color .3s,transform .3s}
    .sc:hover{border-color:rgba(59,130,246,.3);transform:translateX(4px)}
    .sn{font-size:2.5rem;font-weight:900;color:rgba(30,64,175,.6);min-width:4rem;flex-shrink:0;line-height:1;padding-top:.25rem}
    .sc h3{font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:.5rem}
    .sc p{color:#9ca3af;font-size:.9rem;line-height:1.7}
    .scp{position:relative;z-index:2;padding:4rem 0;background:rgba(23,37,84,.15);border-top:1px solid rgba(30,58,138,.3);border-bottom:1px solid rgba(30,58,138,.3)}
    .cpt{font-size:1.5rem;font-weight:700;text-align:center;margin-bottom:2rem}
    .cpg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
    .cpc{background:rgba(17,24,39,.6);border:1px solid rgba(30,58,138,.35);border-radius:.875rem;padding:1.5rem}
    .cpc h4{color:#60a5fa;font-weight:700;margin-bottom:.5rem;font-size:1rem}
    .cpc p{color:#9ca3af;font-size:.85rem;line-height:1.6}
    .sfc{position:relative;z-index:2;padding:6rem 0;background:linear-gradient(180deg,#030712 0%,#172554 100%)}
    .fci{width:64px;height:64px;color:#60a5fa;margin:0 auto 1.5rem;animation:float 3s ease-in-out infinite}
    .gb{background:#111827;border:1px solid rgba(59,130,246,.35);border-radius:1.25rem;padding:2rem;margin-bottom:2.5rem}
    .gb .shi{width:48px;height:48px;color:#4ade80;margin:0 auto .75rem}
    .gb h3{font-size:1.35rem;font-weight:800;margin-bottom:.75rem}
    .gb p{color:#9ca3af;font-size:.95rem;line-height:1.6}
    .fn{color:#6b7280;font-size:.8rem;margin-top:1rem;line-height:1.6}
    .mo{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:1000;align-items:center;justify-content:center;padding:1.5rem}
    .mo.active{display:flex}
    .md{background:#111827;border:1px solid rgba(59,130,246,.4);border-radius:1.5rem;padding:2.5rem;max-width:520px;width:100%;position:relative;animation:scaleIn .3s ease}
    .mc{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);color:#9ca3af;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;transition:background .3s}
    .mc:hover{background:rgba(255,255,255,.2);color:#fff}
    .md h2{font-size:1.5rem;font-weight:800;margin-bottom:.5rem}
    .md .ms{color:#9ca3af;font-size:.9rem;margin-bottom:1.75rem}
    .fg2{margin-bottom:1.25rem}
    .fg2 label{display:block;color:#d1d5db;font-size:.85rem;font-weight:600;margin-bottom:.4rem}
    .fg2 input{width:100%;padding:.875rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.75rem;color:#fff;font-size:1rem;transition:border-color .3s;outline:none}
    .fg2 input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
    .fg2 input::placeholder{color:#6b7280}
    .fs{width:100%;padding:1rem;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:800;font-size:1.1rem;border-radius:.75rem;transition:all .3s}
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
    .sb{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(17,24,39,.95);backdrop-filter:blur(12px);border-top:1px solid rgba(59,130,246,.3);padding:.875rem 1.5rem;z-index:900;justify-content:center;transform:translateY(100%);transition:transform .3s ease}
    .sb.v{transform:translateY(0)}.sb .cb{font-size:1rem;padding:.875rem 2rem;width:100%;justify-content:center}
    .ft{padding:3rem 0;background:#030712;border-top:1px solid #1f2937;text-align:center}
    .fl{width:160px;height:auto;margin:0 auto 1rem;border-radius:.5rem}
    .ft p{color:#6b7280;font-size:.8rem;line-height:1.8}
    .ft a{color:#60a5fa}.ft a:hover{text-decoration:underline}
    @media(max-width:768px){
      .hero{padding:4rem 0 6rem}.hero h1{font-size:2.25rem}.hero .st{font-size:1.05rem}
      .vp{gap:.5rem}.vpi{font-size:.75rem;padding:.4rem .75rem}
      .cdv{font-size:2rem;width:3.25rem;height:3.25rem}
      .cb{font-size:1.05rem;padding:1rem 1.75rem;width:100%;justify-content:center}
      .sc{flex-direction:column;gap:.75rem}.sn{font-size:2rem}
      .fg{grid-template-columns:1fr}
      .vs .op{font-size:2.5rem}.vs .ap{font-size:3rem}
      .sb{display:flex}
      .sp,.sf,.ss,.sfc{padding:4rem 0}
    }
  </style>
</head>
<body>
  <section class="hero" id="hero">
    <div class="hp" id="particles"></div>
    <div class="hc">
      <div class="ub"><i data-lucide="alert-triangle"></i><span>Limited Spots Available This Month — Only 12 Remaining</span></div>
      <h1>You're 1–5 Items Away From<span class="gt">The Credit Score You Deserve</span></h1>
      <p class="st">A few stubborn negative items shouldn't define your financial future. Our Basic Plan uses federal law to challenge every single one — and you don't pay a cent until something actually gets removed.</p>
      <div class="vp">
        <span class="vpi">&#10003; No Pay Until Progress</span>
        <span class="vpi">&#10003; 3-Bureau Coverage</span>
        <span class="vpi">&#10003; Federal Law Backed</span>
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
        <button class="cb" onclick="openModal()"><span>Start My Basic Plan — $99</span><i data-lucide="arrow-right"></i></button>
      </div>
      <p class="cts">+ $29.99/mo credit monitoring required &bull; One-time $99 audit fee &bull; Only billed when progress is made</p>
    </div>
    <div class="sci"><div class="sm"><div class="sd"></div></div></div>
  </section>

  <section class="sp" id="problems">
    <div class="cs">
      <div class="tc ao"><h2 class="stt">Does Any of This Sound Familiar?</h2></div>
      <div class="pg">
        <div class="pc ao s1"><div class="iw"><i data-lucide="x-circle"></i></div><h3>You paid off a collection months ago but it's STILL showing on your report</h3><p>Costing you 40-80 points you already earned back</p></div>
        <div class="pc ao s2"><div class="iw"><i data-lucide="x-circle"></i></div><h3>One late payment from 2 years ago is dragging your entire score down</h3><p>Blocking you from better interest rates and loan approvals</p></div>
        <div class="pc ao s3"><div class="iw"><i data-lucide="x-circle"></i></div><h3>You've tried disputing yourself but the bureau just says "verified"</h3><p>Generic disputes almost always get rejected — ours don't</p></div>
        <div class="pc ao s4"><div class="iw"><i data-lucide="x-circle"></i></div><h3>You don't know which items are legally removable and which aren't</h3><p>Without a forensic audit, you're guessing — we don't guess</p></div>
      </div>
    </div>
  </section>

  <section class="sf" id="features">
    <div class="ct">
      <div class="tc ao"><h2 class="stt">Everything You Get With The <span style="color:#60a5fa">Basic Plan</span></h2><p class="sts">This isn't a starter plan with starter results. This is precision credit repair for targeted situations.</p></div>
      <div class="fg">
        <div class="fc2 ao s1"><div class="fch"><div class="iw"><i data-lucide="file-text"></i></div><span class="fv">$199 Value</span></div><h3>Forensic 3-Bureau Credit Audit</h3><p>Every tradeline, inquiry, and public record across TransUnion, Equifax, and Experian reviewed against FCRA accuracy standards. Full written report delivered before any dispute is filed.</p></div>
        <div class="fc2 ao s2"><div class="fch"><div class="iw"><i data-lucide="bar-chart-2"></i></div><span class="fv">$149 Value</span></div><h3>Personalized 10-Point Restoration Roadmap</h3><p>A custom-built strategy document that shows exactly what we're targeting, in what order, and why — with 30/60/90-day score milestones specific to your file.</p></div>
        <div class="fc2 ao s3"><div class="fch"><div class="iw"><i data-lucide="shield"></i></div><span class="fv">$297 Value</span></div><h3>Up to 15 Statute-Specific Disputes/Month</h3><p>Personalized dispute letters citing FCRA Sections 611, 623, and 605 — not template letters. Tracked and followed up on every 30-day response window without exception.</p></div>
        <div class="fc2 ao s4"><div class="fch"><div class="iw"><i data-lucide="trending-up"></i></div><span class="fv">$99 Value</span></div><h3>Monthly Progress Reports</h3><p>Complete documentation of every bureau response, deletion, correction, score change, and active investigation status delivered at the end of every billing cycle.</p></div>
        <div class="fc2 ao s5"><div class="fch"><div class="iw"><i data-lucide="mail"></i></div><span class="fv">$79 Value</span></div><h3>Priority Email Support</h3><p>Direct access to our team for questions, document requests, and status updates with a guaranteed one-business-day response time.</p></div>
        <div class="fc2 ao s6"><div class="fch"><div class="iw"><i data-lucide="book-open"></i></div><span class="fv">$49 Value</span></div><h3>Credit Education Resource Library</h3><p>Ongoing access to our full education library covering scoring mechanics, utilization strategy, payment history optimization, and maintenance protocols.</p></div>
      </div>
      <div class="vs ao si"><p class="lb">Total Value of Everything Above</p><p class="op">$872</p><p class="nl">You Pay Just</p><p class="ap">$99<span class="pr">/month</span></p><p class="pn">+ $99 one-time audit fee + $29.99/mo monitoring<br><strong>Billed only when verifiable progress is made</strong></p></div>
    </div>
  </section>

  <section class="ss" id="how-it-works">
    <div class="cs">
      <h2 class="stt tc ao" style="margin-bottom:3rem">How The Basic Plan Works</h2>
      <div class="sl">
        <div class="sc ao sl s1"><div class="sn">01</div><div><h3>Activate Your MyFreeScoreNow Monitoring ($29.99/mo)</h3><p>Enroll using our link. This gives us live tri-bureau visibility into your file — the real-time intelligence we need to track every deletion, every change, every score movement. Required before any work begins. Non-negotiable.</p></div></div>
        <div class="sc ao sl s2"><div class="sn">02</div><div><h3>Pay Your One-Time Audit Fee ($99)</h3><p>This covers your complete forensic 3-bureau credit audit — every tradeline, inquiry, and public record reviewed against FCRA accuracy standards — plus your personalized 10-Point Restoration Roadmap. You receive both within 5 business days.</p></div></div>
        <div class="sc ao sl s3"><div class="sn">03</div><div><h3>Review Your Audit Report & Roadmap</h3><p>Before a single dispute goes out, you see exactly what we found, exactly what we're targeting, and what the realistic outcome looks like for your file. No surprises. No black boxes.</p></div></div>
        <div class="sc ao sl s4"><div class="sn">04</div><div><h3>We File Statute-Specific Disputes — Up to 15/Month</h3><p>Personalized letters citing specific FCRA violations go to the bureaus. We track every 30-day response window. We re-dispute with escalated arguments when bureaus push back. We don't stop at the first "verified" response.</p></div></div>
        <div class="sc ao sl s5"><div class="sn">05</div><div><h3>You're Only Billed When Things Move</h3><p>At the end of each month, if we have documented deletions, corrections, or verified score improvements — your $99 monthly fee is charged. If nothing moved that month, you are not billed. Simple as that.</p></div></div>
      </div>
    </div>
  </section>

  <section class="scp" id="compliance">
    <div class="cs">
      <h3 class="cpt ao">&#128274; 100% Federally Compliant — Your Rights Are Protected</h3>
      <div class="cpg">
        <div class="cpc ao s1"><h4>CROA Compliant</h4><p>Written contract provided. 3-day cancellation right honored. No advance fees for future dispute work.</p></div>
        <div class="cpc ao s2"><h4>FCRA Backed</h4><p>Every dispute cites specific FCRA sections. Your Section 611, 623, and 604 rights fully enforced.</p></div>
        <div class="cpc ao s3"><h4>FTC & CFPB Aligned</h4><p>Telemarketing Sales Rule compliant. CFPB dispute standards applied to every bureau interaction.</p></div>
      </div>
    </div>
  </section>

  <section class="sfc" id="final-cta">
    <div class="cx tc">
      <div class="ao"><div class="fci"><i data-lucide="award"></i></div><h2 class="stt" style="margin-bottom:1.5rem">Ready to Remove Those <span style="color:#60a5fa">1–5 Items</span> For Good?</h2><p class="sts" style="margin-bottom:2.5rem">Start with your $99 audit. See exactly what's dragging your score down. Then watch us legally eliminate it — and only pay when we do.</p></div>
      <div class="gb ao"><div class="shi"><i data-lucide="shield-check"></i></div><h3>90-Day Money-Back Guarantee</h3><p>If we can't show a single verified improvement in 90 days, you get every package fee back. No questions. No conditions. No runaround.</p></div>
      <div class="ao"><button class="cb" onclick="openModal()" style="margin:0 auto"><span>Start My Basic Plan Now</span><i data-lucide="arrow-right"></i></button><p class="fn">$99 audit fee + $29.99/mo monitoring to start. Monthly $99 fee only charged when progress is verified. Cancel anytime within 3 business days per CROA rights.</p></div>
    </div>
  </section>

  <footer class="ft">
    <div class="cx">
      <img src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg" alt="RJ Business Solutions" class="fl">
      <p><strong style="color:#d1d5db">RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br><a href="https://rickjeffersonsolutions.com" target="_blank">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rjbizsolution23@gmail.com">rjbizsolution23@gmail.com</a></p>
      <p style="margin-top:1rem">&copy; 2025 RJ Business Solutions. All rights reserved.<br>Credit repair services are performed in compliance with CROA, FCRA, and applicable state regulations.</p>
    </div>
  </footer>

  <!-- Lead Capture + Stripe Checkout Modal -->
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
        </form>
      </div>
      <div id="successView" style="display:none">
        <div class="fsu">
          <div class="ci"><i data-lucide="check-circle"></i></div>
          <h3>You're In!</h3>
          <p>Your info has been captured. Complete these two steps to begin your credit repair:</p>
          <div class="nsa">
            <div class="nsi"><div class="nsn">1</div><div><a href="${mfsnUrl}" target="_blank" id="mfsnLink">Activate MyFreeScoreNow Monitoring &rarr;</a><br><span>$29.99/mo — Required before audit begins</span></div></div>
            <div class="nsi"><div class="nsn">2</div><div><a href="#" onclick="startCheckout()" id="checkoutLink">Pay $99 Audit Fee (Secure Checkout) &rarr;</a><br><span>Stripe-secured payment — Audit delivered in 5 business days</span></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="sb" id="stickyBar"><button class="cb" onclick="openModal()"><span>Start My Basic Plan — $99</span><i data-lucide="arrow-right"></i></button></div>

  <script>
    let currentLeadId=null,currentEmail=null,currentName=null;
    document.addEventListener('DOMContentLoaded',function(){lucide.createIcons();initP();initAO();initSB()});
    (function(){let h=23,m=59,s=59;const hE=document.getElementById('cd-h'),mE=document.getElementById('cd-m'),sE=document.getElementById('cd-s');setInterval(function(){if(s>0)s--;else if(m>0){m--;s=59}else if(h>0){h--;m=59;s=59}else{h=23;m=59;s=59}hE.textContent=String(h).padStart(2,'0');mE.textContent=String(m).padStart(2,'0');sE.textContent=String(s).padStart(2,'0')},1000)})();
    function initP(){const c=document.getElementById('particles');if(!c)return;for(let i=0;i<25;i++){const p=document.createElement('div');p.className='hpd';p.style.left=Math.random()*100+'%';p.style.top=Math.random()*100+'%';p.style.setProperty('--tx',(Math.random()*200-100)+'px');p.style.setProperty('--ty',(Math.random()*200-100)+'px');p.style.setProperty('--duration',(Math.random()*15+10)+'s');c.appendChild(p)}}
    function initAO(){const o=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting)en.target.classList.add('v')})},{threshold:.1,rootMargin:'0px 0px -50px 0px'});document.querySelectorAll('.ao').forEach(function(el){o.observe(el)})}
    function initSB(){const b=document.getElementById('stickyBar'),h=document.getElementById('hero');if(!b||!h)return;window.addEventListener('scroll',function(){b.classList.toggle('v',h.getBoundingClientRect().bottom<0)})}
    function openModal(){document.getElementById('leadModal').classList.add('active');document.body.style.overflow='hidden'}
    function closeModal(){document.getElementById('leadModal').classList.remove('active');document.body.style.overflow=''}
    document.getElementById('leadModal')?.addEventListener('click',function(e){if(e.target===this)closeModal()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
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
