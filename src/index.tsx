import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// ========== API ROUTES ==========

// Lead capture endpoint
app.post('/api/leads', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, plan } = body

    if (!name || !email) {
      return c.json({ success: false, error: 'Name and email are required' }, 400)
    }

    // In production, this would save to D1 database or send to CRM
    console.log('New lead captured:', { name, email, phone, plan, timestamp: new Date().toISOString() })

    return c.json({
      success: true,
      message: 'Your information has been received! We\'ll be in touch within 24 hours.',
      data: { name, email, plan: plan || 'basic' }
    })
  } catch (err) {
    return c.json({ success: false, error: 'Invalid request' }, 400)
  }
})

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// ========== FUNNEL PAGE ==========
app.get('/', (c) => {
  return c.html(basicFunnelHTML())
})

// Redirect /basic to root
app.get('/basic', (c) => c.redirect('/'))

function basicFunnelHTML(): string {
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

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

  <style>
    /* ===== RESET & BASE ===== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #030712;
      color: #fff;
      line-height: 1.6;
      overflow-x: hidden;
    }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; border: none; font-family: inherit; }
    img { max-width: 100%; height: auto; }

    /* ===== ANIMATIONS ===== */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes bounceY {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(10px); }
    }
    @keyframes particleMove {
      0% { transform: translate(0, 0); opacity: 0.2; }
      50% { opacity: 0.8; }
      100% { transform: translate(var(--tx), var(--ty)); opacity: 0.2; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .animate-on-scroll.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .animate-on-scroll.slide-left {
      transform: translateX(-30px);
    }
    .animate-on-scroll.slide-left.visible {
      transform: translateX(0);
    }
    .animate-on-scroll.slide-right {
      transform: translateX(30px);
    }
    .animate-on-scroll.slide-right.visible {
      transform: translateX(0);
    }
    .animate-on-scroll.scale-in {
      transform: scale(0.85);
    }
    .animate-on-scroll.scale-in.visible {
      transform: scale(1);
    }
    .stagger-1 { transition-delay: 0.1s; }
    .stagger-2 { transition-delay: 0.2s; }
    .stagger-3 { transition-delay: 0.3s; }
    .stagger-4 { transition-delay: 0.4s; }
    .stagger-5 { transition-delay: 0.5s; }
    .stagger-6 { transition-delay: 0.6s; }

    /* ===== LAYOUT ===== */
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .container-sm { max-width: 900px; margin: 0 auto; padding: 0 1.5rem; }
    .container-xs { max-width: 720px; margin: 0 auto; padding: 0 1.5rem; }
    .text-center { text-align: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }

    /* ===== HERO SECTION ===== */
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, #0c1445 0%, #1e1b4b 30%, #172554 60%, #0f172a 100%);
      padding: 5rem 0 3rem;
    }
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 800px 600px at 20% 50%, rgba(59,130,246,0.12), transparent),
        radial-gradient(ellipse 600px 400px at 80% 30%, rgba(6,182,212,0.08), transparent);
    }
    .hero-particles {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .hero-particle {
      position: absolute;
      width: 3px;
      height: 3px;
      background: rgba(96, 165, 250, 0.5);
      border-radius: 50%;
      animation: particleMove var(--duration) linear infinite;
    }
    .hero-content {
      position: relative;
      z-index: 10;
      max-width: 900px;
      margin: 0 auto;
      text-align: center;
      padding: 0 1.5rem;
    }

    /* Urgency Banner */
    .urgency-banner {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(59,130,246,0.15);
      border: 1px solid rgba(96,165,250,0.3);
      border-radius: 999px;
      padding: 0.5rem 1.25rem;
      margin-bottom: 2rem;
      animation: fadeInUp 0.8s ease forwards;
    }
    .urgency-banner i { color: #fbbf24; width: 16px; height: 16px; }
    .urgency-banner span { color: #93c5fd; font-size: 0.875rem; font-weight: 500; }

    /* Headlines */
    .hero h1 {
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.8s ease 0.2s forwards;
      opacity: 0;
    }
    .hero h1 .gradient-text {
      display: block;
      margin-top: 0.5rem;
      background: linear-gradient(90deg, #60a5fa, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero .subtitle {
      font-size: clamp(1.1rem, 2.5vw, 1.35rem);
      color: #bfdbfe;
      max-width: 720px;
      margin: 0 auto 2rem;
      animation: fadeInUp 0.8s ease 0.4s forwards;
      opacity: 0;
      line-height: 1.7;
    }

    /* Value Pills */
    .value-pills {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2.5rem;
      animation: fadeInUp 0.8s ease 0.5s forwards;
      opacity: 0;
    }
    .value-pill {
      background: rgba(30,58,138,0.5);
      border: 1px solid rgba(59,130,246,0.3);
      color: #bfdbfe;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }

    /* Countdown Timer */
    .countdown-wrap {
      background: rgba(30,58,138,0.35);
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 1.25rem;
      padding: 1.5rem;
      max-width: 380px;
      margin: 0 auto 2.5rem;
      animation: fadeInUp 0.8s ease 0.6s forwards;
      opacity: 0;
    }
    .countdown-label {
      color: #93c5fd;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 0.75rem;
    }
    .countdown-timer {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    .countdown-block {
      text-align: center;
    }
    .countdown-value {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fff;
      width: 4rem;
      height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(30,64,175,0.6);
      border-radius: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .countdown-unit {
      color: #60a5fa;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* CTA Button */
    .cta-wrap {
      animation: fadeInUp 0.8s ease 0.7s forwards;
      opacity: 0;
    }
    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
      padding: 1.25rem 2.5rem;
      border-radius: 0.875rem;
      box-shadow: 0 8px 32px rgba(59,130,246,0.35);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .cta-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #2563eb, #0891b2);
      opacity: 0;
      transition: opacity 0.3s;
    }
    .cta-btn:hover::before { opacity: 1; }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(59,130,246,0.45); }
    .cta-btn span, .cta-btn i { position: relative; z-index: 1; }
    .cta-btn i {
      transition: transform 0.3s;
      width: 20px;
      height: 20px;
    }
    .cta-btn:hover i { transform: translateX(4px); }

    .cta-subtext {
      color: #60a5fa;
      font-size: 0.85rem;
      margin-top: 1rem;
      opacity: 0.8;
    }

    /* Scroll Indicator */
    .scroll-indicator {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      animation: bounceY 1.5s infinite;
    }
    .scroll-mouse {
      width: 24px;
      height: 40px;
      border: 2px solid rgba(255,255,255,0.4);
      border-radius: 12px;
      display: flex;
      justify-content: center;
      padding-top: 8px;
    }
    .scroll-dot {
      width: 4px;
      height: 12px;
      background: rgba(255,255,255,0.6);
      border-radius: 2px;
    }

    /* ===== PROBLEM SECTION ===== */
    .section-problems {
      padding: 6rem 0;
      background: #030712;
    }
    .section-title {
      font-size: clamp(2rem, 4.5vw, 3rem);
      font-weight: 800;
      margin-bottom: 1rem;
    }
    .section-subtitle {
      font-size: 1.15rem;
      color: #9ca3af;
      max-width: 600px;
      margin: 0 auto 3.5rem;
    }
    .problems-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .problem-card {
      background: #111827;
      border: 1px solid rgba(127,29,29,0.3);
      border-radius: 1.25rem;
      padding: 1.75rem;
      transition: border-color 0.3s, transform 0.3s;
    }
    .problem-card:hover {
      border-color: rgba(239,68,68,0.4);
      transform: translateY(-4px);
    }
    .problem-card .icon-wrap {
      width: 48px;
      height: 48px;
      color: #ef4444;
      margin-bottom: 1rem;
    }
    .problem-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    .problem-card p {
      color: #9ca3af;
      font-size: 0.9rem;
    }

    /* ===== WHAT YOU GET SECTION ===== */
    .section-features {
      padding: 6rem 0;
      background: linear-gradient(180deg, #030712 0%, rgba(23,37,84,0.2) 100%);
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .feature-card {
      background: #111827;
      border: 1px solid rgba(30,58,138,0.4);
      border-radius: 1.25rem;
      padding: 1.75rem;
      transition: border-color 0.3s, transform 0.3s;
    }
    .feature-card:hover {
      border-color: rgba(59,130,246,0.5);
      transform: translateY(-4px);
    }
    .feature-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .feature-card .icon-wrap {
      width: 40px;
      height: 40px;
      color: #60a5fa;
    }
    .feature-value {
      color: #60a5fa;
      font-size: 0.8rem;
      font-weight: 700;
      background: rgba(30,58,138,0.4);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      white-space: nowrap;
    }
    .feature-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .feature-card p {
      color: #9ca3af;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    /* Value Stack */
    .value-stack {
      background: linear-gradient(135deg, rgba(30,58,138,0.3), rgba(6,78,59,0.15));
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 1.25rem;
      padding: 2.5rem;
      text-align: center;
    }
    .value-stack .label { color: #9ca3af; font-size: 1.15rem; margin-bottom: 0.5rem; }
    .value-stack .original-price {
      font-size: 3.25rem;
      font-weight: 900;
      color: #4b5563;
      text-decoration: line-through;
      margin-bottom: 0.5rem;
    }
    .value-stack .now-label { color: #d1d5db; margin-bottom: 0.5rem; }
    .value-stack .actual-price {
      font-size: 4rem;
      font-weight: 900;
      color: #60a5fa;
      margin-bottom: 0.25rem;
    }
    .value-stack .actual-price .period { font-size: 1.25rem; font-weight: 600; }
    .value-stack .price-note {
      color: #9ca3af;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .value-stack .price-note strong { color: #93c5fd; }

    /* ===== HOW IT WORKS ===== */
    .section-steps {
      padding: 6rem 0;
      background: #030712;
    }
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .step-card {
      display: flex;
      gap: 1.5rem;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 1.25rem;
      padding: 1.75rem;
      transition: border-color 0.3s, transform 0.3s;
    }
    .step-card:hover {
      border-color: rgba(59,130,246,0.3);
      transform: translateX(4px);
    }
    .step-number {
      font-size: 2.5rem;
      font-weight: 900;
      color: rgba(30,64,175,0.6);
      min-width: 4rem;
      flex-shrink: 0;
      line-height: 1;
      padding-top: 0.25rem;
    }
    .step-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .step-card p {
      color: #9ca3af;
      font-size: 0.9rem;
      line-height: 1.7;
    }

    /* ===== COMPLIANCE SECTION ===== */
    .section-compliance {
      padding: 4rem 0;
      background: rgba(23,37,84,0.15);
      border-top: 1px solid rgba(30,58,138,0.3);
      border-bottom: 1px solid rgba(30,58,138,0.3);
    }
    .compliance-title {
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 2rem;
    }
    .compliance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .compliance-card {
      background: rgba(17,24,39,0.6);
      border: 1px solid rgba(30,58,138,0.35);
      border-radius: 0.875rem;
      padding: 1.5rem;
    }
    .compliance-card h4 {
      color: #60a5fa;
      font-weight: 700;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    .compliance-card p {
      color: #9ca3af;
      font-size: 0.85rem;
      line-height: 1.6;
    }

    /* ===== FINAL CTA ===== */
    .section-final-cta {
      padding: 6rem 0;
      background: linear-gradient(180deg, #030712 0%, #172554 100%);
    }
    .final-cta-icon {
      width: 64px;
      height: 64px;
      color: #60a5fa;
      margin: 0 auto 1.5rem;
      animation: float 3s ease-in-out infinite;
    }
    .guarantee-box {
      background: #111827;
      border: 1px solid rgba(59,130,246,0.35);
      border-radius: 1.25rem;
      padding: 2rem;
      margin-bottom: 2.5rem;
    }
    .guarantee-box .shield-icon {
      width: 48px;
      height: 48px;
      color: #4ade80;
      margin: 0 auto 0.75rem;
    }
    .guarantee-box h3 {
      font-size: 1.35rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
    }
    .guarantee-box p {
      color: #9ca3af;
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .final-note {
      color: #6b7280;
      font-size: 0.8rem;
      margin-top: 1rem;
      line-height: 1.6;
    }

    /* ===== LEAD FORM MODAL ===== */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: #111827;
      border: 1px solid rgba(59,130,246,0.4);
      border-radius: 1.5rem;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
      position: relative;
      animation: scaleIn 0.3s ease;
    }
    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255,255,255,0.1);
      color: #9ca3af;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: background 0.3s;
    }
    .modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
    .modal h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }
    .modal .modal-sub {
      color: #9ca3af;
      font-size: 0.9rem;
      margin-bottom: 1.75rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      color: #d1d5db;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .form-group input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 0.75rem;
      color: #fff;
      font-size: 1rem;
      transition: border-color 0.3s;
      outline: none;
    }
    .form-group input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
    }
    .form-group input::placeholder { color: #6b7280; }
    .form-submit {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: #fff;
      font-weight: 800;
      font-size: 1.1rem;
      border-radius: 0.75rem;
      transition: all 0.3s;
    }
    .form-submit:hover { opacity: 0.9; transform: translateY(-1px); }
    .form-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .form-note {
      text-align: center;
      color: #6b7280;
      font-size: 0.75rem;
      margin-top: 1rem;
    }
    .form-success {
      text-align: center;
      padding: 2rem 0;
    }
    .form-success .check-icon {
      width: 64px;
      height: 64px;
      color: #4ade80;
      margin: 0 auto 1rem;
    }
    .form-success h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .form-success p {
      color: #9ca3af;
      font-size: 0.9rem;
    }

    /* ===== STICKY BOTTOM BAR (Mobile) ===== */
    .sticky-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(17,24,39,0.95);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(59,130,246,0.3);
      padding: 0.875rem 1.5rem;
      z-index: 900;
      justify-content: center;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    .sticky-bar.visible { transform: translateY(0); }
    .sticky-bar .cta-btn {
      font-size: 1rem;
      padding: 0.875rem 2rem;
      width: 100%;
      justify-content: center;
    }

    /* ===== FOOTER ===== */
    .footer {
      padding: 3rem 0;
      background: #030712;
      border-top: 1px solid #1f2937;
      text-align: center;
    }
    .footer-logo {
      width: 160px;
      height: auto;
      margin: 0 auto 1rem;
      border-radius: 0.5rem;
    }
    .footer p {
      color: #6b7280;
      font-size: 0.8rem;
      line-height: 1.8;
    }
    .footer a { color: #60a5fa; }
    .footer a:hover { text-decoration: underline; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
      .hero { padding: 4rem 0 6rem; }
      .hero h1 { font-size: 2.25rem; }
      .hero .subtitle { font-size: 1.05rem; }
      .value-pills { gap: 0.5rem; }
      .value-pill { font-size: 0.75rem; padding: 0.4rem 0.75rem; }
      .countdown-value { font-size: 2rem; width: 3.25rem; height: 3.25rem; }
      .cta-btn { font-size: 1.05rem; padding: 1rem 1.75rem; width: 100%; justify-content: center; }
      .step-card { flex-direction: column; gap: 0.75rem; }
      .step-number { font-size: 2rem; }
      .features-grid { grid-template-columns: 1fr; }
      .value-stack .original-price { font-size: 2.5rem; }
      .value-stack .actual-price { font-size: 3rem; }
      .sticky-bar { display: flex; }
      .section-problems, .section-features, .section-steps, .section-final-cta {
        padding: 4rem 0;
      }
    }
  </style>
</head>
<body>

  <!-- ============ HERO SECTION ============ -->
  <section class="hero" id="hero">
    <div class="hero-particles" id="particles"></div>

    <div class="hero-content">
      <!-- Urgency Banner -->
      <div class="urgency-banner">
        <i data-lucide="alert-triangle"></i>
        <span>Limited Spots Available This Month — Only 12 Remaining</span>
      </div>

      <!-- Headline -->
      <h1>
        You're 1–5 Items Away From
        <span class="gradient-text">The Credit Score You Deserve</span>
      </h1>

      <!-- Subtitle -->
      <p class="subtitle">
        A few stubborn negative items shouldn't define your financial future.
        Our Basic Plan uses federal law to challenge every single one —
        and you don't pay a cent until something actually gets removed.
      </p>

      <!-- Value Pills -->
      <div class="value-pills">
        <span class="value-pill">&#10003; No Pay Until Progress</span>
        <span class="value-pill">&#10003; 3-Bureau Coverage</span>
        <span class="value-pill">&#10003; Federal Law Backed</span>
        <span class="value-pill">&#10003; 90-Day Money Back</span>
        <span class="value-pill">&#10003; Starts at $99</span>
      </div>

      <!-- Countdown Timer -->
      <div class="countdown-wrap">
        <p class="countdown-label">&#9889; Enrollment Closes In</p>
        <div class="countdown-timer">
          <div class="countdown-block">
            <div class="countdown-value" id="cd-hours">23</div>
            <div class="countdown-unit">Hours</div>
          </div>
          <div class="countdown-block">
            <div class="countdown-value" id="cd-minutes">59</div>
            <div class="countdown-unit">Minutes</div>
          </div>
          <div class="countdown-block">
            <div class="countdown-value" id="cd-seconds">59</div>
            <div class="countdown-unit">Seconds</div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrap">
        <button class="cta-btn" onclick="openModal()">
          <span>Start My Basic Plan — $99</span>
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
      <p class="cta-subtext">
        + $29.99/mo credit monitoring required &bull; One-time $99 audit fee &bull;
        Only billed when progress is made
      </p>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator">
      <div class="scroll-mouse"><div class="scroll-dot"></div></div>
    </div>
  </section>

  <!-- ============ PROBLEM SECTION ============ -->
  <section class="section-problems" id="problems">
    <div class="container-sm">
      <div class="text-center animate-on-scroll">
        <h2 class="section-title">Does Any of This Sound Familiar?</h2>
      </div>

      <div class="problems-grid">
        <div class="problem-card animate-on-scroll stagger-1">
          <div class="icon-wrap"><i data-lucide="x-circle"></i></div>
          <h3>You paid off a collection months ago but it's STILL showing on your report</h3>
          <p>Costing you 40-80 points you already earned back</p>
        </div>
        <div class="problem-card animate-on-scroll stagger-2">
          <div class="icon-wrap"><i data-lucide="x-circle"></i></div>
          <h3>One late payment from 2 years ago is dragging your entire score down</h3>
          <p>Blocking you from better interest rates and loan approvals</p>
        </div>
        <div class="problem-card animate-on-scroll stagger-3">
          <div class="icon-wrap"><i data-lucide="x-circle"></i></div>
          <h3>You've tried disputing yourself but the bureau just says "verified"</h3>
          <p>Generic disputes almost always get rejected — ours don't</p>
        </div>
        <div class="problem-card animate-on-scroll stagger-4">
          <div class="icon-wrap"><i data-lucide="x-circle"></i></div>
          <h3>You don't know which items are legally removable and which aren't</h3>
          <p>Without a forensic audit, you're guessing — we don't guess</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ WHAT YOU GET SECTION ============ -->
  <section class="section-features" id="features">
    <div class="container">
      <div class="text-center animate-on-scroll">
        <h2 class="section-title">
          Everything You Get With The
          <span style="color: #60a5fa;">Basic Plan</span>
        </h2>
        <p class="section-subtitle">
          This isn't a starter plan with starter results.
          This is precision credit repair for targeted situations.
        </p>
      </div>

      <div class="features-grid">
        <div class="feature-card animate-on-scroll stagger-1">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="file-text"></i></div>
            <span class="feature-value">$199 Value</span>
          </div>
          <h3>Forensic 3-Bureau Credit Audit</h3>
          <p>Every tradeline, inquiry, and public record across TransUnion, Equifax, and Experian reviewed against FCRA accuracy standards. Full written report delivered before any dispute is filed.</p>
        </div>
        <div class="feature-card animate-on-scroll stagger-2">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="bar-chart-2"></i></div>
            <span class="feature-value">$149 Value</span>
          </div>
          <h3>Personalized 10-Point Restoration Roadmap</h3>
          <p>A custom-built strategy document that shows exactly what we're targeting, in what order, and why — with 30/60/90-day score milestones specific to your file.</p>
        </div>
        <div class="feature-card animate-on-scroll stagger-3">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="shield"></i></div>
            <span class="feature-value">$297 Value</span>
          </div>
          <h3>Up to 15 Statute-Specific Disputes/Month</h3>
          <p>Personalized dispute letters citing FCRA Sections 611, 623, and 605 — not template letters. Tracked and followed up on every 30-day response window without exception.</p>
        </div>
        <div class="feature-card animate-on-scroll stagger-4">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="trending-up"></i></div>
            <span class="feature-value">$99 Value</span>
          </div>
          <h3>Monthly Progress Reports</h3>
          <p>Complete documentation of every bureau response, deletion, correction, score change, and active investigation status delivered at the end of every billing cycle.</p>
        </div>
        <div class="feature-card animate-on-scroll stagger-5">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="mail"></i></div>
            <span class="feature-value">$79 Value</span>
          </div>
          <h3>Priority Email Support</h3>
          <p>Direct access to our team for questions, document requests, and status updates with a guaranteed one-business-day response time.</p>
        </div>
        <div class="feature-card animate-on-scroll stagger-6">
          <div class="feature-card-header">
            <div class="icon-wrap"><i data-lucide="book-open"></i></div>
            <span class="feature-value">$49 Value</span>
          </div>
          <h3>Credit Education Resource Library</h3>
          <p>Ongoing access to our full education library covering scoring mechanics, utilization strategy, payment history optimization, and maintenance protocols.</p>
        </div>
      </div>

      <!-- Value Stack -->
      <div class="value-stack animate-on-scroll scale-in">
        <p class="label">Total Value of Everything Above</p>
        <p class="original-price">$872</p>
        <p class="now-label">You Pay Just</p>
        <p class="actual-price">$99<span class="period">/month</span></p>
        <p class="price-note">
          + $99 one-time audit fee + $29.99/mo monitoring<br>
          <strong>Billed only when verifiable progress is made</strong>
        </p>
      </div>
    </div>
  </section>

  <!-- ============ HOW IT WORKS ============ -->
  <section class="section-steps" id="how-it-works">
    <div class="container-sm">
      <h2 class="section-title text-center animate-on-scroll" style="margin-bottom: 3rem;">
        How The Basic Plan Works
      </h2>

      <div class="steps-list">
        <div class="step-card animate-on-scroll slide-left stagger-1">
          <div class="step-number">01</div>
          <div>
            <h3>Activate Your MyFreeScoreNow Monitoring ($29.99/mo)</h3>
            <p>Enroll using our link. This gives us live tri-bureau visibility into your file — the real-time intelligence we need to track every deletion, every change, every score movement. Required before any work begins. Non-negotiable.</p>
          </div>
        </div>
        <div class="step-card animate-on-scroll slide-left stagger-2">
          <div class="step-number">02</div>
          <div>
            <h3>Pay Your One-Time Audit Fee ($99)</h3>
            <p>This covers your complete forensic 3-bureau credit audit — every tradeline, inquiry, and public record reviewed against FCRA accuracy standards — plus your personalized 10-Point Restoration Roadmap. You receive both within 5 business days.</p>
          </div>
        </div>
        <div class="step-card animate-on-scroll slide-left stagger-3">
          <div class="step-number">03</div>
          <div>
            <h3>Review Your Audit Report & Roadmap</h3>
            <p>Before a single dispute goes out, you see exactly what we found, exactly what we're targeting, and what the realistic outcome looks like for your file. No surprises. No black boxes.</p>
          </div>
        </div>
        <div class="step-card animate-on-scroll slide-left stagger-4">
          <div class="step-number">04</div>
          <div>
            <h3>We File Statute-Specific Disputes — Up to 15/Month</h3>
            <p>Personalized letters citing specific FCRA violations go to the bureaus. We track every 30-day response window. We re-dispute with escalated arguments when bureaus push back. We don't stop at the first "verified" response.</p>
          </div>
        </div>
        <div class="step-card animate-on-scroll slide-left stagger-5">
          <div class="step-number">05</div>
          <div>
            <h3>You're Only Billed When Things Move</h3>
            <p>At the end of each month, if we have documented deletions, corrections, or verified score improvements — your $99 monthly fee is charged. If nothing moved that month, you are not billed. Simple as that.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ COMPLIANCE SECTION ============ -->
  <section class="section-compliance" id="compliance">
    <div class="container-sm">
      <h3 class="compliance-title animate-on-scroll">
        &#128274; 100% Federally Compliant — Your Rights Are Protected
      </h3>
      <div class="compliance-grid">
        <div class="compliance-card animate-on-scroll stagger-1">
          <h4>CROA Compliant</h4>
          <p>Written contract provided. 3-day cancellation right honored. No advance fees for future dispute work.</p>
        </div>
        <div class="compliance-card animate-on-scroll stagger-2">
          <h4>FCRA Backed</h4>
          <p>Every dispute cites specific FCRA sections. Your Section 611, 623, and 604 rights fully enforced.</p>
        </div>
        <div class="compliance-card animate-on-scroll stagger-3">
          <h4>FTC & CFPB Aligned</h4>
          <p>Telemarketing Sales Rule compliant. CFPB dispute standards applied to every bureau interaction.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ FINAL CTA ============ -->
  <section class="section-final-cta" id="final-cta">
    <div class="container-xs text-center">
      <div class="animate-on-scroll">
        <div class="final-cta-icon"><i data-lucide="award"></i></div>
        <h2 class="section-title" style="margin-bottom: 1.5rem;">
          Ready to Remove Those
          <span style="color: #60a5fa;">1–5 Items</span> For Good?
        </h2>
        <p class="section-subtitle" style="margin-bottom: 2.5rem;">
          Start with your $99 audit. See exactly what's dragging your score down.
          Then watch us legally eliminate it — and only pay when we do.
        </p>
      </div>

      <!-- Guarantee -->
      <div class="guarantee-box animate-on-scroll">
        <div class="shield-icon"><i data-lucide="shield-check"></i></div>
        <h3>90-Day Money-Back Guarantee</h3>
        <p>If we can't show a single verified improvement in 90 days, you get every package fee back. No questions. No conditions. No runaround.</p>
      </div>

      <!-- Final CTA -->
      <div class="animate-on-scroll">
        <button class="cta-btn" onclick="openModal()" style="margin: 0 auto;">
          <span>Start My Basic Plan Now</span>
          <i data-lucide="arrow-right"></i>
        </button>
        <p class="final-note">
          $99 audit fee + $29.99/mo monitoring to start.
          Monthly $99 fee only charged when progress is verified.
          Cancel anytime within 3 business days per CROA rights.
        </p>
      </div>
    </div>
  </section>

  <!-- ============ FOOTER ============ -->
  <footer class="footer">
    <div class="container-xs">
      <img
        src="https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg"
        alt="RJ Business Solutions"
        class="footer-logo"
      >
      <p>
        <strong style="color: #d1d5db;">RJ Business Solutions</strong><br>
        1342 NM 333, Tijeras, New Mexico 87059<br>
        <a href="https://rickjeffersonsolutions.com" target="_blank">rickjeffersonsolutions.com</a>
        &bull;
        <a href="mailto:rjbizsolution23@gmail.com">rjbizsolution23@gmail.com</a>
      </p>
      <p style="margin-top: 1rem;">
        &copy; 2025 RJ Business Solutions. All rights reserved.<br>
        Credit repair services are performed in compliance with the Credit Repair Organizations Act (CROA),<br>
        Fair Credit Reporting Act (FCRA), and applicable state regulations.
      </p>
    </div>
  </footer>

  <!-- ============ LEAD CAPTURE MODAL ============ -->
  <div class="modal-overlay" id="leadModal">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()">&times;</button>

      <div id="formView">
        <h2>Start Your Basic Plan</h2>
        <p class="modal-sub">Enter your info below and we'll get you started with your forensic credit audit within 24 hours.</p>

        <form id="leadForm" onsubmit="handleSubmit(event)">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" placeholder="John Smith" required>
          </div>
          <div class="form-group">
            <label for="email">Email Address *</label>
            <input type="email" id="email" name="email" placeholder="john@example.com" required>
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" placeholder="(555) 123-4567">
          </div>
          <button type="submit" class="form-submit" id="submitBtn">
            Claim My Spot — $99 Audit
          </button>
          <p class="form-note">
            &#128274; Your information is 100% secure and never shared.
          </p>
        </form>
      </div>

      <div id="successView" style="display: none;">
        <div class="form-success">
          <div class="check-icon"><i data-lucide="check-circle"></i></div>
          <h3>You're In!</h3>
          <p>Check your email for next steps including your MyFreeScoreNow monitoring enrollment link. Your forensic credit audit will begin within 24 hours of activation.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ============ STICKY MOBILE BAR ============ -->
  <div class="sticky-bar" id="stickyBar">
    <button class="cta-btn" onclick="openModal()">
      <span>Start My Basic Plan — $99</span>
      <i data-lucide="arrow-right"></i>
    </button>
  </div>

  <!-- ============ SCRIPTS ============ -->
  <script>
    // Initialize Lucide icons
    document.addEventListener('DOMContentLoaded', function() {
      lucide.createIcons();
      initParticles();
      initScrollAnimations();
      initStickyBar();
    });

    // === COUNTDOWN TIMER ===
    (function() {
      let hours = 23, minutes = 59, seconds = 59;
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-minutes');
      const sEl = document.getElementById('cd-seconds');

      setInterval(function() {
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        hEl.textContent = String(hours).padStart(2, '0');
        mEl.textContent = String(minutes).padStart(2, '0');
        sEl.textContent = String(seconds).padStart(2, '0');
      }, 1000);
    })();

    // === PARTICLE BACKGROUND ===
    function initParticles() {
      const container = document.getElementById('particles');
      if (!container) return;
      for (let i = 0; i < 25; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
        particle.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');
        particle.style.setProperty('--duration', (Math.random() * 15 + 10) + 's');
        container.appendChild(particle);
      }
    }

    // === SCROLL ANIMATIONS (Intersection Observer) ===
    function initScrollAnimations() {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
        observer.observe(el);
      });
    }

    // === STICKY BAR (show after scrolling past hero) ===
    function initStickyBar() {
      const bar = document.getElementById('stickyBar');
      const hero = document.getElementById('hero');
      if (!bar || !hero) return;

      window.addEventListener('scroll', function() {
        const heroBottom = hero.getBoundingClientRect().bottom;
        if (heroBottom < 0) {
          bar.classList.add('visible');
        } else {
          bar.classList.remove('visible');
        }
      });
    }

    // === MODAL CONTROLS ===
    function openModal() {
      document.getElementById('leadModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      document.getElementById('leadModal').classList.remove('active');
      document.body.style.overflow = '';
    }
    // Close on overlay click
    document.getElementById('leadModal')?.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    // === FORM SUBMISSION ===
    async function handleSubmit(e) {
      e.preventDefault();
      const btn = document.getElementById('submitBtn');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();

      btn.disabled = true;
      btn.textContent = 'Submitting...';

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, plan: 'basic' })
        });
        const data = await res.json();

        if (data.success) {
          document.getElementById('formView').style.display = 'none';
          document.getElementById('successView').style.display = 'block';
          lucide.createIcons();
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
          btn.disabled = false;
          btn.textContent = 'Claim My Spot — $99 Audit';
        }
      } catch (err) {
        alert('Network error. Please check your connection and try again.');
        btn.disabled = false;
        btn.textContent = 'Claim My Spot — $99 Audit';
      }
    }
  </script>
</body>
</html>`
}

export default app
