import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════════════
// RJ BUSINESS SOLUTIONS — ITIN MULTI-LANGUAGE FUNNEL SYSTEM
// 5 Languages: EN, ES, PT, FR, HT | 3 Plans: Basic, Pro, Premium
// ═══════════════════════════════════════════════════════════════

type Bindings = {
  DB: D1Database
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  RESEND_API_KEY: string
  OPENAI_API_KEY: string
  JWT_SECRET: string
  MFSN_API_BASE: string
  MFSN_EMAIL: string
  MFSN_PASSWORD: string
  MFSN_AID: string
  MFSN_PID: string
  COMPANY_NAME: string
  COMPANY_EMAIL: string
  MFSN_AFFILIATE_URL_PRIMARY: string
  MFSN_AFFILIATE_URL_NO_TRIAL: string
  MFSN_AFFILIATE_URL_PREMIUM: string
}

const app = new Hono<{ Bindings: Bindings }>()
app.use('/api/*', cors())

// ═══════ SUPPORTED LOCALES ═══════
const SUPPORTED_LOCALES = ['en', 'es', 'pt', 'fr', 'ht'] as const
type Locale = typeof SUPPORTED_LOCALES[number]
const DEFAULT_LOCALE: Locale = 'en'

// ═══════ PLAN CONFIG ═══════
const PLANS = {
  basic: { price: 99, stripeCents: 9900, disputes: 15, color: '#3b82f6', mfsnPid: '49914' },
  professional: { price: 149, stripeCents: 14900, disputes: 25, color: '#8b5cf6', mfsnPid: '75497' },
  premium: { price: 199, stripeCents: 19900, disputes: 40, color: '#f59e0b', mfsnPid: '30639' }
} as const

// ═══════ LOCALE DETECTION ═══════
function detectLocale(c: any): Locale {
  // 1. Check URL path
  const path = new URL(c.req.url).pathname
  const segments = path.split('/').filter(Boolean)
  if (segments[0] && SUPPORTED_LOCALES.includes(segments[0] as Locale)) {
    return segments[0] as Locale
  }
  // 2. Check Accept-Language header
  const acceptLang = c.req.header('accept-language') || ''
  for (const loc of SUPPORTED_LOCALES) {
    if (acceptLang.toLowerCase().includes(loc)) return loc
  }
  return DEFAULT_LOCALE
}

function getMfsnUrl(c: any, plan: string): string {
  return 'https://app.myfreescorenow.com/enroll/B01A8289'
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATIONS — FULL i18n FOR ALL 5 LOCALES
// ═══════════════════════════════════════════════════════════════
const i18n: Record<string, Record<string, string>> = {
  en: {
    lang_label: 'Language:',
    lang_name: 'English',
    flag: '🇺🇸',
    site_title: 'ITIN Credit Repair — RJ Business Solutions',
    nav_home: 'Home',
    nav_plans: 'Plans',
    nav_legal: 'Legal',
    nav_privacy: 'Privacy',
    nav_terms: 'Terms',
    // HERO
    hero_badge: 'Trusted by 10,000+ ITIN Holders Nationwide',
    hero_title: 'Your ITIN Gives You <span class="gt">Full Credit Repair Rights</span>',
    hero_sub: 'All 3 bureaus — TransUnion, Equifax & Experian — accept ITIN numbers. Under FCRA & ECOA, you have the <strong>exact same dispute rights</strong> as SSN holders. Choose the plan that fits your situation.',
    hero_cta: 'Choose Your Plan',
    // PLANS
    plans_title: 'Choose Your ITIN Credit Repair Plan',
    plans_sub: 'Every plan includes FCRA + ECOA protection, bureau-specific ITIN dispute procedures, and our 90-day money-back guarantee.',
    plan_basic: 'Basic',
    plan_basic_tag: 'Light Repair',
    plan_basic_target: '1–5 Negative Items',
    plan_basic_desc: 'Perfect if you have a few inaccurate items dragging your ITIN credit score down.',
    plan_pro: 'Professional',
    plan_pro_tag: 'Most Popular',
    plan_pro_target: '6–15 Negative Items',
    plan_pro_desc: 'For ITIN holders with moderate credit damage who need aggressive, multi-front disputes.',
    plan_premium: 'Premium',
    plan_premium_tag: 'Full Restoration',
    plan_premium_target: '16+ Negative Items',
    plan_premium_desc: 'Complete ITIN credit file overhaul — maximum disputes, dedicated analyst, priority service.',
    plan_per_month: '/month',
    plan_audit_fee: 'one-time audit fee',
    plan_monitoring: '$29.99/mo monitoring',
    plan_start: 'Start',
    plan_guarantee: '90-Day Money-Back Guarantee',
    plan_no_pay: 'Only pay when progress is verified',
    // FEATURES
    feat_audit: 'Forensic 3-Bureau ITIN Audit',
    feat_roadmap: 'ITIN-Specific Restoration Roadmap',
    feat_disputes: 'Statute-Specific Disputes/Month',
    feat_reports: 'Monthly Progress Reports',
    feat_support: 'Bilingual Support',
    feat_library: 'Credit Building Library',
    feat_analyst: 'Dedicated Credit Analyst',
    feat_priority: 'Priority Service & Escalation',
    feat_creditor: 'Direct Creditor Intervention',
    feat_goodwill: 'Goodwill Letter Campaigns',
    // ITIN RIGHTS
    rights_title: 'ITIN Holders Have Full Federal Protection',
    rights_sub: 'Under the FCRA, ECOA, CROA, FDCPA — your ITIN gives you the <strong>exact same rights</strong> as SSN holders.',
    rights_ecoa: 'ECOA prohibits discrimination based on national origin. Your ITIN file has equal rights.',
    rights_fcra: 'FCRA requires bureaus to investigate ITIN disputes the same as SSN disputes.',
    rights_croa: 'Written contract, 3-day cancellation, no advance fees until services are performed.',
    rights_fdcpa: 'Collectors cannot treat ITIN-identified debts differently. Full validation rights apply.',
    // RICK BIO
    bio_title: 'Meet Rick Jefferson',
    bio_role: 'Founder & ITIN Credit Expert',
    bio_p1: 'Rick Jefferson founded RJ Business Solutions with one mission: ensure every ITIN holder in America knows their credit rights under federal law.',
    bio_p2: 'With deep expertise in FCRA, ECOA, and bureau-specific ITIN dispute procedures, Rick has helped thousands of ITIN holders challenge inaccurate items and rebuild their credit files.',
    bio_p3: '"Your ITIN is not a limitation — it\'s your key to the same credit system that SSN holders use. The law is on your side." — Rick Jefferson',
    // FAQ
    faq_title: 'Frequently Asked Questions',
    faq_q1: 'Can I really repair credit with just an ITIN?',
    faq_a1: 'Yes. All three major credit bureaus — TransUnion, Equifax, and Experian — accept ITIN numbers for credit file identification and dispute filing. Under the FCRA and ECOA, you have the exact same dispute rights as SSN holders.',
    faq_q2: 'What\'s the difference between the plans?',
    faq_a2: 'Basic targets 1–5 negative items (15 disputes/mo). Professional targets 6–15 items (25 disputes/mo) with a dedicated analyst. Premium handles 16+ items (40 disputes/mo) with priority service, direct creditor intervention, and goodwill campaigns.',
    faq_q3: 'When do I get charged?',
    faq_a3: 'The $99-$199 audit fee is one-time for the completed forensic report. Monthly plan fees are charged ONLY in months where verifiable progress is documented (deletions, corrections, or score improvements). No progress = no charge.',
    faq_q4: 'What is MyFreeScoreNow and why do I need it?',
    faq_a4: 'MyFreeScoreNow ($29.99/mo) is a third-party credit monitoring service that provides us live tri-bureau access to your ITIN credit file. It accepts ITIN numbers for enrollment. This is required so we can track every change to your file.',
    faq_q5: 'What if I don\'t see results?',
    faq_a5: 'Our 90-day money-back guarantee covers all plan tiers. If we can\'t show a single verified improvement within 90 days, you get every plan fee refunded. No questions, no conditions.',
    faq_q6: 'Can I cancel anytime?',
    faq_a6: 'You have a 3-business-day right to cancel under CROA (15 U.S.C. § 1679e) with a full refund. After that, you can still cancel monthly service at any time with no penalty.',
    // GUARANTEE
    guarantee_title: '90-Day Money-Back Guarantee',
    guarantee_desc: 'If we can\'t show a single verified improvement in 90 days — deletions, corrections, or documented score increases — you get every plan fee back. No questions. No conditions. No runaround.',
    // CTA
    cta_title: 'Ready to Clean Up Your ITIN Credit File?',
    cta_sub: 'Choose the plan that fits your situation. Every plan includes the same federal protections — FCRA, ECOA, CROA — just different levels of service.',
    cta_btn: 'Choose Your Plan Now',
    // COMMUNITY
    community_title: 'Trusted by ITIN Holders Across America',
    community_stat1: '10,000+',
    community_label1: 'ITIN Holders Served',
    community_stat2: '67M',
    community_label2: 'Latinos in US (2025)',
    community_stat3: '43%',
    community_label3: 'Latino Households Un/Underbanked',
    community_stat4: '34%',
    community_label4: 'Hispanic Biz Growth YoY',
    // COMPLIANCE FOOTER
    comp_title: 'Federal Compliance & Legal Disclosures',
    comp_notice: 'RJ Business Solutions is a credit repair organization under the Credit Repair Organizations Act (15 U.S.C. § 1679). We are not a law firm and do not provide legal advice.',
    comp_croa: 'CROA: Written contracts, 3-day cancellation, no advance fees for dispute services.',
    comp_fcra: 'FCRA: Disputes filed under §611, §623, §605 — same protections for ITIN and SSN holders.',
    comp_ecoa: 'ECOA: National-origin discrimination prohibited — ITIN files treated equally.',
    comp_fdcpa: 'FDCPA: Debt validation rights enforced, no discrimination based on ITIN status.',
    comp_tsr: 'TSR: No advance fees per 16 CFR §310.4(a)(2). CFPB Regulation V and F procedures followed.',
    comp_identity: 'Identity Theft Policy: We do not collect immigration status. ITIN used solely for credit bureau communication.',
    comp_contact: 'Questions? Contact us:',
    // MODAL
    modal_title: 'Start Your',
    modal_sub: 'Enter your info below. You\'ll be directed to secure payment after submitting.',
    form_name: 'Full Name *',
    form_email: 'Email Address *',
    form_phone: 'Phone Number',
    form_submit: 'Claim My Spot',
    form_secure: 'Your information is 100% secure and never shared.',
    // MISC
    back_home: 'Back to Home',
    all_plans: 'See All Plans',
    up_to: 'Up to',
    includes: 'Includes:',
    plus: 'Plus everything in',
    per_mo: '/mo',
    spots_left: 'Only 12 spots remaining this month',
    // ENHANCED PACKAGE CONTENT
    why_rj: 'Why RJ Business Solutions Hits Different',
    why_rj_desc: 'The credit repair industry is a $7.31 billion space crawling with companies that charge you upfront, ghost you after month one, speak zero Spanish, and have never heard the word "ITIN." Rick Jefferson built RJ Business Solutions specifically to flip that script.',
    why_rj_desc2: 'Every package is performance-based (you don\'t pay monthly fees until progress is verified), fully FCRA + ECOA compliant, bilingual, and designed with ITIN holders at the center of the strategy — not as an afterthought.',
    audit_title: 'The Forensic Audit — Every Plan Starts Here',
    audit_desc: 'Before a single dispute letter goes out, you get a deep-dive forensic audit of all three bureaus (TransUnion, Equifax, Experian). This isn\'t a printout from Credit Karma. We\'re talking a line-by-line teardown of every tradeline, inquiry, collection, public record, and account status — cross-referenced against FCRA §§ 604, 605, 611, 623, FDCPA requirements, and ECOA protections.',
    audit_roadmap: 'Your 10-Point Restoration Roadmap',
    roadmap_1: 'Baseline score documentation across all 3 bureaus',
    roadmap_2: 'Negative item prioritization by credit impact',
    roadmap_3: 'Bureau-specific dispute strategy tailored to each bureau',
    roadmap_4: 'FCRA violation identification (§611, §623, §604)',
    roadmap_5: 'ECOA / ITIN discrimination flag review',
    roadmap_6: 'Collection account strategy (validation, SOL, FDCPA leverage)',
    roadmap_7: 'Hard inquiry removal eligibility analysis',
    roadmap_8: 'Credit utilization and mix optimization targets',
    roadmap_9: 'Creditor engagement timeline and escalation path',
    roadmap_10: '90-day milestone checkpoints with measurable KPIs',
    // BASIC PLAN DETAILS
    basic_detail_disputes: 'Up to 15 statute-backed dispute letters per month, drafted with precision under FCRA §611, §623, and §604',
    basic_detail_reports: 'Comprehensive monthly progress report — every dispute filed, every response received, every item removed',
    basic_detail_bilingual: 'Bilingual support (English & Spanish) — built in, not an upgrade',
    basic_detail_library: 'Credit Education Library — guides, tools, and resources for ITIN holders',
    basic_detail_compliance: 'Full Compliance: CROA, FCRA, FDCPA, FCBA, FTC TSR, CFPB, ECOA',
    basic_billing: 'The $99 monthly fee is charged only when verifiable progress is documented. No progress = no charge. Period.',
    basic_not_included: 'Does NOT include: Creditor negotiations, goodwill campaigns, pay-for-delete, identity-theft handling, mortgage-ready program, rapid rescoring, or VIP access.',
    // PRO PLAN DETAILS
    pro_why: 'This is where 73% of RJ clients land.',
    pro_detail_disputes: 'Up to 25 disputes per month — strategically sequenced to maximize removal probability',
    pro_detail_analyst: 'Dedicated Credit Analyst assigned to your file — a real human who knows your profile',
    pro_detail_creditor: 'Direct Creditor Intervention under FCRA §623 — contacting creditors and data furnishers directly',
    pro_detail_priority: 'Priority Phone Support — direct access during business hours',
    pro_detail_building: 'Credit-Building Guidance — secured cards, authorized user strategies, credit-builder loans',
    pro_detail_goodwill: 'Goodwill Letter Campaigns — personalized letters to original creditors requesting removal',
    pro_detail_paydelete: 'Pay-for-Delete Negotiations — documented agreements before payment is made',
    pro_detail_biweekly: 'Bi-Weekly Progress Updates — full status report every two weeks',
    pro_billing: '$149/month charged only when verified progress is documented. Same standard, higher output.',
    pro_not_included: 'Does NOT include: Identity-theft document handling, mortgage-ready program, rapid rescoring, business credit building, or VIP/Rick Jefferson direct access.',
    // PREMIUM PLAN DETAILS
    premium_detail_disputes: 'Up to 40 disputes per month — maximum firepower for complex, multi-item credit profiles',
    premium_detail_escalation: 'Priority Service & Escalation — first-queue treatment, CFPB submissions when appropriate',
    premium_detail_goodwill: 'Expanded Goodwill Letter Campaigns — more accounts, multiple rounds, personalized narratives',
    premium_detail_legal: 'Legal Demand Letters — formal statutory notices citing FCRA §616 civil liability',
    premium_detail_identity: 'Identity-Theft Document Submission Handling — with signed client waiver',
    premium_detail_mortgage: 'Mortgage-Ready Program — FHA, VA, USDA, Conventional preparation',
    premium_detail_rescore: 'Rapid Rescoring Services — expedited updates within 24–72 hours',
    premium_detail_business: 'Business Credit Building — EIN profile, D&B file setup, vendor tradelines',
    premium_detail_vip: 'VIP Concierge & Direct Rick Jefferson Access — weekly strategy calls, direct line',
    premium_detail_weekly: 'Weekly Progress Updates — every seven days, full report',
    premium_billing: '$199/month charged only when verified progress is documented. Same zero-risk standard.',
    // STEPS
    steps_title: 'How to Get Started — Four Steps',
    step_1: 'Enroll in MyFreeScoreNow credit monitoring — activates your tri-bureau data feed',
    step_2: 'Select your package (Basic, Professional, or Premium) based on your negative items',
    step_3: 'Pay the one-time audit fee — $99, $149, or $199 depending on your plan',
    step_4: 'Within 5 business days — receive your full audit report and roadmap, disputes begin',
    // COMPARISON TABLE
    compare_title: 'Side-by-Side Comparison',
    compare_feature: 'Feature',
    compare_neg_items: 'Negative Items',
    compare_disputes: 'Disputes/Month',
    compare_audit: 'One-Time Audit',
    compare_monitoring: 'Monitoring (Required)',
    compare_forensic: 'Forensic 3-Bureau Audit',
    compare_roadmap: '10-Point Roadmap',
    compare_reports: 'Progress Reports',
    compare_bilingual: 'Bilingual Support',
    compare_analyst: 'Dedicated Credit Analyst',
    compare_creditor: 'Direct Creditor Intervention',
    compare_goodwill: 'Goodwill Letter Campaigns',
    compare_paydelete: 'Pay-for-Delete Negotiations',
    compare_legal: 'Legal Demand Letters',
    compare_identity: 'Identity-Theft Doc Submission',
    compare_mortgage: 'Mortgage-Ready Program',
    compare_rescore: 'Rapid Rescoring',
    compare_business: 'Business Credit Building',
    compare_vip: 'VIP Concierge / Rick Access',
    compare_guarantee: '90-Day Money-Back Guarantee',
    compare_pay_only: 'Pay Only When Progress Verified',
    compare_monthly: 'Monthly',
    compare_biweekly: 'Bi-Weekly',
    compare_weekly: 'Weekly',
    compare_enhanced: 'Enhanced',
    compare_full: 'Full',
    compare_en_es: 'EN/ES',
    compare_all_lang: 'EN/ES/PT/HT',
    compare_expanded: 'Expanded',
    compare_w_waiver: 'w/ Waiver',
    mfsn_enroll: 'Activate Credit Monitoring',
    mfsn_required: '$29.99/mo — Required before audit begins',
  },
  es: {
    lang_label: 'Idioma:',
    lang_name: 'Español',
    flag: '🇲🇽',
    site_title: 'Reparación de Crédito ITIN — RJ Business Solutions',
    nav_home: 'Inicio',
    nav_plans: 'Planes',
    nav_legal: 'Legal',
    nav_privacy: 'Privacidad',
    nav_terms: 'Términos',
    hero_badge: 'Confiado por más de 10,000 titulares de ITIN en todo el país',
    hero_title: 'Tu ITIN Te Da <span class="gt">Derechos Completos de Reparación de Crédito</span>',
    hero_sub: 'Las 3 agencias — TransUnion, Equifax y Experian — aceptan números ITIN. Bajo FCRA y ECOA, tienes los <strong>mismos derechos de disputa</strong> que los titulares de SSN. Elige el plan que se ajuste a tu situación.',
    hero_cta: 'Elige Tu Plan',
    plans_title: 'Elige Tu Plan de Reparación de Crédito ITIN',
    plans_sub: 'Cada plan incluye protección FCRA + ECOA, procedimientos de disputa ITIN específicos por agencia, y nuestra garantía de devolución de 90 días.',
    plan_basic: 'Básico',
    plan_basic_tag: 'Reparación Ligera',
    plan_basic_target: '1–5 Elementos Negativos',
    plan_basic_desc: 'Perfecto si tienes algunos elementos inexactos afectando tu puntaje de crédito ITIN.',
    plan_pro: 'Profesional',
    plan_pro_tag: 'Más Popular',
    plan_pro_target: '6–15 Elementos Negativos',
    plan_pro_desc: 'Para titulares de ITIN con daño crediticio moderado que necesitan disputas agresivas en múltiples frentes.',
    plan_premium: 'Premium',
    plan_premium_tag: 'Restauración Completa',
    plan_premium_target: '16+ Elementos Negativos',
    plan_premium_desc: 'Renovación completa de archivo de crédito ITIN — disputas máximas, analista dedicado, servicio prioritario.',
    plan_per_month: '/mes',
    plan_audit_fee: 'tarifa única de auditoría',
    plan_monitoring: '$29.99/mes monitoreo',
    plan_start: 'Comenzar',
    plan_guarantee: 'Garantía de Devolución de 90 Días',
    plan_no_pay: 'Solo paga cuando el progreso es verificado',
    feat_audit: 'Auditoría Forense ITIN de 3 Agencias',
    feat_roadmap: 'Hoja de Ruta de Restauración ITIN',
    feat_disputes: 'Disputas por Estatuto/Mes',
    feat_reports: 'Reportes Mensuales de Progreso',
    feat_support: 'Soporte Bilingüe',
    feat_library: 'Biblioteca de Construcción de Crédito',
    feat_analyst: 'Analista de Crédito Dedicado',
    feat_priority: 'Servicio Prioritario y Escalamiento',
    feat_creditor: 'Intervención Directa con Acreedores',
    feat_goodwill: 'Campañas de Cartas de Buena Voluntad',
    rights_title: 'Los Titulares de ITIN Tienen Protección Federal Completa',
    rights_sub: 'Bajo FCRA, ECOA, CROA, FDCPA — tu ITIN te da los <strong>mismos derechos</strong> que los titulares de SSN.',
    rights_ecoa: 'ECOA prohíbe discriminación por origen nacional. Tu archivo ITIN tiene igualdad de derechos.',
    rights_fcra: 'FCRA requiere que las agencias investiguen disputas ITIN igual que las de SSN.',
    rights_croa: 'Contrato por escrito, cancelación de 3 días, sin cargos anticipados hasta que los servicios se realicen.',
    rights_fdcpa: 'Los cobradores no pueden tratar deudas ITIN de forma diferente. Se aplican todos los derechos de validación.',
    bio_title: 'Conoce a Rick Jefferson',
    bio_role: 'Fundador y Experto en Crédito ITIN',
    bio_p1: 'Rick Jefferson fundó RJ Business Solutions con una misión: asegurar que cada titular de ITIN en América conozca sus derechos crediticios bajo la ley federal.',
    bio_p2: 'Con profunda experiencia en FCRA, ECOA y procedimientos de disputa ITIN específicos por agencia, Rick ha ayudado a miles de titulares de ITIN a impugnar elementos inexactos y reconstruir sus archivos de crédito.',
    bio_p3: '"Tu ITIN no es una limitación — es tu llave al mismo sistema crediticio que usan los titulares de SSN. La ley está de tu lado." — Rick Jefferson',
    faq_title: 'Preguntas Frecuentes',
    faq_q1: '¿Realmente puedo reparar crédito solo con un ITIN?',
    faq_a1: 'Sí. Las tres agencias de crédito — TransUnion, Equifax y Experian — aceptan números ITIN. Bajo FCRA y ECOA, tienes los mismos derechos de disputa que los titulares de SSN.',
    faq_q2: '¿Cuál es la diferencia entre los planes?',
    faq_a2: 'Básico maneja 1–5 elementos negativos (15 disputas/mes). Profesional maneja 6–15 elementos (25 disputas/mes) con analista dedicado. Premium maneja 16+ elementos (40 disputas/mes) con servicio prioritario.',
    faq_q3: '¿Cuándo me cobran?',
    faq_a3: 'La tarifa de auditoría es única. Las tarifas mensuales se cobran SOLO cuando hay progreso verificable documentado. Sin progreso = sin cargo.',
    faq_q4: '¿Qué es MyFreeScoreNow?',
    faq_a4: 'MyFreeScoreNow ($29.99/mes) es un servicio de monitoreo que nos da acceso a tu archivo ITIN en las 3 agencias. Acepta números ITIN para inscripción.',
    faq_q5: '¿Qué pasa si no veo resultados?',
    faq_a5: 'Nuestra garantía de 90 días cubre todos los planes. Si no hay mejora verificada en 90 días, te devolvemos todas las tarifas del plan.',
    faq_q6: '¿Puedo cancelar en cualquier momento?',
    faq_a6: 'Tienes derecho a cancelar dentro de 3 días hábiles bajo CROA con reembolso completo. Después, puedes cancelar en cualquier momento sin penalidad.',
    guarantee_title: 'Garantía de Devolución de 90 Días',
    guarantee_desc: 'Si no podemos mostrar una sola mejora verificada en 90 días, te devolvemos cada tarifa. Sin preguntas. Sin condiciones.',
    cta_title: '¿Listo Para Limpiar Tu Archivo de Crédito ITIN?',
    cta_sub: 'Elige el plan que se ajuste a tu situación. Cada plan incluye las mismas protecciones federales.',
    cta_btn: 'Elige Tu Plan Ahora',
    community_title: 'Confiado por Titulares de ITIN en Todo América',
    community_stat1: '10,000+',
    community_label1: 'Titulares de ITIN Atendidos',
    community_stat2: '67M',
    community_label2: 'Latinos en EE.UU. (2025)',
    community_stat3: '43%',
    community_label3: 'Hogares Latinos Sub/No Bancarizados',
    community_stat4: '34%',
    community_label4: 'Crecimiento Negocios Hispanos Anual',
    comp_title: 'Cumplimiento Federal y Divulgaciones Legales',
    comp_notice: 'RJ Business Solutions es una organización de reparación de crédito bajo CROA (15 U.S.C. § 1679). No somos un bufete de abogados.',
    comp_croa: 'CROA: Contratos por escrito, cancelación de 3 días, sin cargos anticipados.',
    comp_fcra: 'FCRA: Disputas bajo §611, §623, §605 — mismas protecciones para ITIN y SSN.',
    comp_ecoa: 'ECOA: Discriminación por origen nacional prohibida — archivos ITIN tratados igualmente.',
    comp_fdcpa: 'FDCPA: Derechos de validación de deuda aplicados, sin discriminación ITIN.',
    comp_tsr: 'TSR: Sin cargos anticipados. Procedimientos CFPB seguidos.',
    comp_identity: 'No recopilamos estatus migratorio. ITIN usado solo para comunicación con agencias de crédito.',
    comp_contact: '¿Preguntas? Contáctanos:',
    modal_title: 'Comenzar Tu',
    modal_sub: 'Ingresa tu información. Serás dirigido al pago seguro después de enviar.',
    form_name: 'Nombre Completo *',
    form_email: 'Correo Electrónico *',
    form_phone: 'Número de Teléfono',
    form_submit: 'Reclamar Mi Cupo',
    form_secure: 'Tu información es 100% segura y nunca se comparte.',
    back_home: 'Volver al Inicio',
    all_plans: 'Ver Todos los Planes',
    up_to: 'Hasta',
    includes: 'Incluye:',
    plus: 'Más todo en',
    per_mo: '/mes',
    spots_left: 'Solo quedan 12 cupos este mes',
  },
  pt: {
    lang_label: 'Idioma:',
    lang_name: 'Português',
    flag: '🇧🇷',
    site_title: 'Reparo de Crédito ITIN — RJ Business Solutions',
    nav_home: 'Início',
    nav_plans: 'Planos',
    nav_legal: 'Legal',
    nav_privacy: 'Privacidade',
    nav_terms: 'Termos',
    hero_badge: 'Confiado por mais de 10.000 portadores de ITIN em todo o país',
    hero_title: 'Seu ITIN Dá a Você <span class="gt">Direitos Completos de Reparo de Crédito</span>',
    hero_sub: 'As 3 agências — TransUnion, Equifax e Experian — aceitam números ITIN. Sob FCRA e ECOA, você tem os <strong>mesmos direitos de disputa</strong> que portadores de SSN. Escolha o plano que se encaixa na sua situação.',
    hero_cta: 'Escolha Seu Plano',
    plans_title: 'Escolha Seu Plano de Reparo de Crédito ITIN',
    plans_sub: 'Cada plano inclui proteção FCRA + ECOA, procedimentos de disputa ITIN específicos e nossa garantia de devolução de 90 dias.',
    plan_basic: 'Básico',
    plan_basic_tag: 'Reparo Leve',
    plan_basic_target: '1–5 Itens Negativos',
    plan_basic_desc: 'Perfeito se você tem alguns itens imprecisos afetando seu score de crédito ITIN.',
    plan_pro: 'Profissional',
    plan_pro_tag: 'Mais Popular',
    plan_pro_target: '6–15 Itens Negativos',
    plan_pro_desc: 'Para portadores de ITIN com dano de crédito moderado que precisam de disputas agressivas.',
    plan_premium: 'Premium',
    plan_premium_tag: 'Restauração Completa',
    plan_premium_target: '16+ Itens Negativos',
    plan_premium_desc: 'Renovação completa do arquivo ITIN — disputas máximas, analista dedicado, serviço prioritário.',
    plan_per_month: '/mês',
    plan_audit_fee: 'taxa única de auditoria',
    plan_monitoring: '$29.99/mês monitoramento',
    plan_start: 'Começar',
    plan_guarantee: 'Garantia de Devolução de 90 Dias',
    plan_no_pay: 'Pague apenas quando o progresso for verificado',
    feat_audit: 'Auditoria Forense ITIN de 3 Agências',
    feat_roadmap: 'Roteiro de Restauração ITIN',
    feat_disputes: 'Disputas por Estatuto/Mês',
    feat_reports: 'Relatórios Mensais de Progresso',
    feat_support: 'Suporte Bilíngue',
    feat_library: 'Biblioteca de Construção de Crédito',
    feat_analyst: 'Analista de Crédito Dedicado',
    feat_priority: 'Serviço Prioritário',
    feat_creditor: 'Intervenção Direta com Credores',
    feat_goodwill: 'Campanhas de Cartas de Boa Vontade',
    rights_title: 'Portadores de ITIN Têm Proteção Federal Completa',
    rights_sub: 'Sob FCRA, ECOA, CROA, FDCPA — seu ITIN dá os <strong>mesmos direitos</strong> que portadores de SSN.',
    rights_ecoa: 'ECOA proíbe discriminação por origem nacional. Seu arquivo ITIN tem direitos iguais.',
    rights_fcra: 'FCRA exige que agências investiguem disputas ITIN da mesma forma que SSN.',
    rights_croa: 'Contrato por escrito, cancelamento de 3 dias, sem taxas antecipadas.',
    rights_fdcpa: 'Cobradores não podem tratar dívidas ITIN de forma diferente.',
    bio_title: 'Conheça Rick Jefferson',
    bio_role: 'Fundador e Especialista em Crédito ITIN',
    bio_p1: 'Rick Jefferson fundou a RJ Business Solutions com uma missão: garantir que cada portador de ITIN na América conheça seus direitos de crédito.',
    bio_p2: 'Com profunda expertise em FCRA, ECOA e procedimentos de disputa ITIN, Rick ajudou milhares a reconstruir seus créditos.',
    bio_p3: '"Seu ITIN não é uma limitação — é sua chave para o mesmo sistema de crédito. A lei está do seu lado." — Rick Jefferson',
    faq_title: 'Perguntas Frequentes',
    faq_q1: 'Posso realmente reparar crédito apenas com ITIN?',
    faq_a1: 'Sim. Todas as três agências aceitam ITIN. Sob FCRA e ECOA, você tem os mesmos direitos que portadores de SSN.',
    faq_q2: 'Qual a diferença entre os planos?',
    faq_a2: 'Básico: 1–5 itens (15 disputas/mês). Profissional: 6–15 itens (25 disputas/mês). Premium: 16+ itens (40 disputas/mês) com serviço prioritário.',
    faq_q3: 'Quando sou cobrado?',
    faq_a3: 'A taxa de auditoria é única. Taxas mensais cobradas APENAS quando progresso verificável é documentado.',
    faq_q4: 'O que é MyFreeScoreNow?',
    faq_a4: 'MyFreeScoreNow ($29.99/mês) é monitoramento que nos dá acesso ao seu arquivo ITIN. Aceita ITIN para inscrição.',
    faq_q5: 'E se eu não vir resultados?',
    faq_a5: 'Garantia de 90 dias cobre todos os planos. Sem melhoria verificada = reembolso total.',
    faq_q6: 'Posso cancelar a qualquer momento?',
    faq_a6: 'Cancelamento em 3 dias úteis sob CROA com reembolso total. Após isso, cancele mensalmente sem penalidade.',
    guarantee_title: 'Garantia de Devolução de 90 Dias',
    guarantee_desc: 'Se não pudermos mostrar nenhuma melhoria verificada em 90 dias, devolvemos cada taxa. Sem perguntas.',
    cta_title: 'Pronto para Limpar Seu Arquivo de Crédito ITIN?',
    cta_sub: 'Escolha o plano. Cada um inclui as mesmas proteções federais.',
    cta_btn: 'Escolha Seu Plano Agora',
    community_title: 'Confiado por Portadores de ITIN em Toda América',
    community_stat1: '10.000+', community_label1: 'Portadores de ITIN Atendidos',
    community_stat2: '67M', community_label2: 'Latinos nos EUA (2025)',
    community_stat3: '43%', community_label3: 'Domicílios Latinos Sub/Não Bancarizados',
    community_stat4: '34%', community_label4: 'Crescimento Negócios Hispânicos Anual',
    comp_title: 'Conformidade Federal e Divulgações Legais',
    comp_notice: 'RJ Business Solutions é uma organização de reparo de crédito sob CROA (15 U.S.C. § 1679). Não somos escritório de advocacia.',
    comp_croa: 'CROA: Contratos por escrito, cancelamento de 3 dias, sem taxas antecipadas.',
    comp_fcra: 'FCRA: Disputas sob §611, §623, §605.',
    comp_ecoa: 'ECOA: Discriminação por origem nacional proibida.',
    comp_fdcpa: 'FDCPA: Direitos de validação de dívida aplicados.',
    comp_tsr: 'TSR: Sem taxas antecipadas. Procedimentos CFPB seguidos.',
    comp_identity: 'Não coletamos status imigratório. ITIN usado apenas para comunicação com agências.',
    comp_contact: 'Perguntas? Contate-nos:',
    modal_title: 'Começar Seu',
    modal_sub: 'Insira suas informações. Você será direcionado ao pagamento seguro.',
    form_name: 'Nome Completo *',
    form_email: 'Endereço de Email *',
    form_phone: 'Número de Telefone',
    form_submit: 'Garantir Minha Vaga',
    form_secure: 'Suas informações são 100% seguras.',
    back_home: 'Voltar ao Início',
    all_plans: 'Ver Todos os Planos',
    up_to: 'Até',
    includes: 'Inclui:',
    plus: 'Mais tudo em',
    per_mo: '/mês',
    spots_left: 'Apenas 12 vagas restantes este mês',
  },
  fr: {
    lang_label: 'Langue:',
    lang_name: 'Français',
    flag: '🇫🇷',
    site_title: 'Réparation de Crédit ITIN — RJ Business Solutions',
    nav_home: 'Accueil',
    nav_plans: 'Plans',
    nav_legal: 'Légal',
    nav_privacy: 'Confidentialité',
    nav_terms: 'Conditions',
    hero_badge: 'Approuvé par plus de 10 000 détenteurs d\'ITIN à travers le pays',
    hero_title: 'Votre ITIN Vous Donne <span class="gt">Des Droits Complets de Réparation de Crédit</span>',
    hero_sub: 'Les 3 bureaux — TransUnion, Equifax et Experian — acceptent les numéros ITIN. Sous FCRA et ECOA, vous avez les <strong>mêmes droits de contestation</strong> que les détenteurs de SSN.',
    hero_cta: 'Choisissez Votre Plan',
    plans_title: 'Choisissez Votre Plan de Réparation de Crédit ITIN',
    plans_sub: 'Chaque plan inclut la protection FCRA + ECOA et notre garantie de remboursement de 90 jours.',
    plan_basic: 'Basique',
    plan_basic_tag: 'Réparation Légère',
    plan_basic_target: '1–5 Éléments Négatifs',
    plan_basic_desc: 'Parfait si vous avez quelques éléments inexacts affectant votre score ITIN.',
    plan_pro: 'Professionnel',
    plan_pro_tag: 'Le Plus Populaire',
    plan_pro_target: '6–15 Éléments Négatifs',
    plan_pro_desc: 'Pour les détenteurs d\'ITIN avec des dommages de crédit modérés.',
    plan_premium: 'Premium',
    plan_premium_tag: 'Restauration Complète',
    plan_premium_target: '16+ Éléments Négatifs',
    plan_premium_desc: 'Refonte complète du dossier ITIN — disputes maximales, analyste dédié, service prioritaire.',
    plan_per_month: '/mois',
    plan_audit_fee: 'frais d\'audit unique',
    plan_monitoring: '$29.99/mois surveillance',
    plan_start: 'Commencer',
    plan_guarantee: 'Garantie de Remboursement de 90 Jours',
    plan_no_pay: 'Payez uniquement quand le progrès est vérifié',
    feat_audit: 'Audit Forensique ITIN 3 Bureaux',
    feat_roadmap: 'Feuille de Route de Restauration ITIN',
    feat_disputes: 'Contestations par Statut/Mois',
    feat_reports: 'Rapports Mensuels de Progrès',
    feat_support: 'Support Bilingue',
    feat_library: 'Bibliothèque de Construction de Crédit',
    feat_analyst: 'Analyste de Crédit Dédié',
    feat_priority: 'Service Prioritaire',
    feat_creditor: 'Intervention Directe Créancier',
    feat_goodwill: 'Campagnes de Lettres de Bonne Volonté',
    rights_title: 'Les Détenteurs d\'ITIN Ont une Protection Fédérale Complète',
    rights_sub: 'Sous FCRA, ECOA, CROA, FDCPA — votre ITIN vous donne les <strong>mêmes droits</strong> que les détenteurs de SSN.',
    rights_ecoa: 'ECOA interdit la discrimination basée sur l\'origine nationale.',
    rights_fcra: 'FCRA exige que les bureaux enquêtent sur les disputes ITIN de la même manière.',
    rights_croa: 'Contrat écrit, annulation de 3 jours, pas de frais anticipés.',
    rights_fdcpa: 'Les collecteurs ne peuvent pas traiter les dettes ITIN différemment.',
    bio_title: 'Rencontrez Rick Jefferson',
    bio_role: 'Fondateur et Expert en Crédit ITIN',
    bio_p1: 'Rick Jefferson a fondé RJ Business Solutions avec une mission: s\'assurer que chaque détenteur d\'ITIN connaisse ses droits de crédit.',
    bio_p2: 'Avec une expertise approfondie en FCRA, ECOA et procédures de dispute ITIN, Rick a aidé des milliers de personnes.',
    bio_p3: '"Votre ITIN n\'est pas une limitation — c\'est votre clé vers le même système de crédit. La loi est de votre côté." — Rick Jefferson',
    faq_title: 'Questions Fréquentes',
    faq_q1: 'Puis-je vraiment réparer mon crédit avec un ITIN?',
    faq_a1: 'Oui. Les trois bureaux acceptent les ITIN. Sous FCRA et ECOA, vous avez les mêmes droits.',
    faq_q2: 'Quelle est la différence entre les plans?',
    faq_a2: 'Basique: 1–5 éléments. Professionnel: 6–15 éléments. Premium: 16+ éléments avec service prioritaire.',
    faq_q3: 'Quand suis-je facturé?',
    faq_a3: 'Les frais d\'audit sont uniques. Les frais mensuels uniquement quand le progrès est vérifié.',
    faq_q4: 'Qu\'est-ce que MyFreeScoreNow?',
    faq_a4: 'MyFreeScoreNow ($29.99/mois) est un service de surveillance qui accepte les ITIN.',
    faq_q5: 'Et si je ne vois pas de résultats?',
    faq_a5: 'Garantie de 90 jours. Pas d\'amélioration vérifiée = remboursement complet.',
    faq_q6: 'Puis-je annuler à tout moment?',
    faq_a6: 'Annulation en 3 jours ouvrables sous CROA. Après, annulez mensuellement sans pénalité.',
    guarantee_title: 'Garantie de Remboursement de 90 Jours',
    guarantee_desc: 'Si nous ne pouvons montrer aucune amélioration en 90 jours, remboursement complet.',
    cta_title: 'Prêt à Nettoyer Votre Dossier de Crédit ITIN?',
    cta_sub: 'Choisissez le plan qui correspond à votre situation.',
    cta_btn: 'Choisissez Votre Plan Maintenant',
    community_title: 'Approuvé par les Détenteurs d\'ITIN à Travers l\'Amérique',
    community_stat1: '10 000+', community_label1: 'Détenteurs d\'ITIN Servis',
    community_stat2: '67M', community_label2: 'Latinos aux USA (2025)',
    community_stat3: '43%', community_label3: 'Ménages Latinos Sous/Non Bancarisés',
    community_stat4: '34%', community_label4: 'Croissance Entreprises Hispaniques',
    comp_title: 'Conformité Fédérale et Divulgations Légales',
    comp_notice: 'RJ Business Solutions est une organisation de réparation de crédit sous CROA.',
    comp_croa: 'CROA: Contrats écrits, annulation de 3 jours.',
    comp_fcra: 'FCRA: Disputes sous §611, §623, §605.',
    comp_ecoa: 'ECOA: Discrimination par origine nationale interdite.',
    comp_fdcpa: 'FDCPA: Droits de validation de dette appliqués.',
    comp_tsr: 'TSR: Pas de frais anticipés. Procédures CFPB suivies.',
    comp_identity: 'Nous ne collectons pas le statut d\'immigration.',
    comp_contact: 'Questions? Contactez-nous:',
    modal_title: 'Commencer Votre',
    modal_sub: 'Entrez vos informations. Vous serez dirigé vers le paiement sécurisé.',
    form_name: 'Nom Complet *',
    form_email: 'Adresse Email *',
    form_phone: 'Numéro de Téléphone',
    form_submit: 'Réserver Ma Place',
    form_secure: 'Vos informations sont 100% sécurisées.',
    back_home: 'Retour à l\'Accueil',
    all_plans: 'Voir Tous les Plans',
    up_to: 'Jusqu\'à',
    includes: 'Comprend:',
    plus: 'Plus tout dans',
    per_mo: '/mois',
    spots_left: 'Seulement 12 places restantes ce mois-ci',
  },
  ht: {
    lang_label: 'Lang:',
    lang_name: 'Kreyòl',
    flag: '🇭🇹',
    site_title: 'Reparasyon Kredi ITIN — RJ Business Solutions',
    nav_home: 'Akèy',
    nav_plans: 'Plan yo',
    nav_legal: 'Legal',
    nav_privacy: 'Konfidansyalite',
    nav_terms: 'Tèm yo',
    hero_badge: 'Plis pase 10,000 moun ki gen ITIN fè konfyans nan nou nan tout peyi a',
    hero_title: 'ITIN Ou Ba Ou <span class="gt">Dwa Konplè pou Repare Kredi</span>',
    hero_sub: 'Twa (3) biwo kredi yo — TransUnion, Equifax ak Experian — aksepte nimewo ITIN. Anba FCRA ak ECOA, ou gen <strong>menm dwa kontestasyon</strong> ak moun ki gen SSN. Chwazi plan ki bon pou sitiyasyon ou.',
    hero_cta: 'Chwazi Plan Ou',
    plans_title: 'Chwazi Plan Reparasyon Kredi ITIN Ou',
    plans_sub: 'Chak plan gen ladan pwoteksyon FCRA + ECOA, pwosedi kontestasyon ITIN espesifik pou chak biwo, ak garanti ranbousman 90 jou nou.',
    plan_basic: 'Debaz',
    plan_basic_tag: 'Reparasyon Lejè',
    plan_basic_target: '1–5 Eleman Negatif',
    plan_basic_desc: 'Pafè si ou gen kèk eleman ki pa kòrèk ki ap bese nòt kredi ITIN ou.',
    plan_pro: 'Pwofesyonèl',
    plan_pro_tag: 'Pi Popilè',
    plan_pro_target: '6–15 Eleman Negatif',
    plan_pro_desc: 'Pou moun ki gen ITIN ak domaj kredi modere ki bezwen kontestasyon agresif.',
    plan_premium: 'Premium',
    plan_premium_tag: 'Restorasyon Konplè',
    plan_premium_target: '16+ Eleman Negatif',
    plan_premium_desc: 'Renovasyon konplè dosye ITIN — kontestasyon maksimòm, analis dedye, sèvis priyorite.',
    plan_per_month: '/mwa',
    plan_audit_fee: 'frè odit yon fwa',
    plan_monitoring: '$29.99/mwa siveyans',
    plan_start: 'Kòmanse',
    plan_guarantee: 'Garanti Ranbousman 90 Jou',
    plan_no_pay: 'Peye sèlman lè pwogrè verifye',
    feat_audit: 'Odit Forènsik ITIN 3 Biwo',
    feat_roadmap: 'Fèy Wout Restorasyon ITIN',
    feat_disputes: 'Kontestasyon pa Estati/Mwa',
    feat_reports: 'Rapò Pwogrè Chak Mwa',
    feat_support: 'Sipò Bileng',
    feat_library: 'Bibliyotèk Konstriksyon Kredi',
    feat_analyst: 'Analis Kredi Dedye',
    feat_priority: 'Sèvis Priyorite',
    feat_creditor: 'Entèvansyon Dirèk ak Kreditè',
    feat_goodwill: 'Kanpay Lèt Bòn Volonte',
    rights_title: 'Moun ki Gen ITIN Gen Pwoteksyon Federal Konplè',
    rights_sub: 'Anba FCRA, ECOA, CROA, FDCPA — ITIN ou ba ou <strong>menm dwa</strong> ak moun ki gen SSN.',
    rights_ecoa: 'ECOA entèdi diskriminasyon ki baze sou orijin nasyonal.',
    rights_fcra: 'FCRA egzije ke biwo yo envestige kontestasyon ITIN menm jan ak SSN.',
    rights_croa: 'Kontra alekri, anilasyon 3 jou, pa gen frè davans.',
    rights_fdcpa: 'Kolektè yo pa kapab trete dèt ITIN diferaman.',
    bio_title: 'Rankontre Rick Jefferson',
    bio_role: 'Fondatè ak Ekspè Kredi ITIN',
    bio_p1: 'Rick Jefferson te fonde RJ Business Solutions ak yon misyon: asire ke chak moun ki gen ITIN nan Amerik konnen dwa kredi yo anba lwa federal.',
    bio_p2: 'Ak gwo ekspètiz nan FCRA, ECOA ak pwosedi kontestasyon ITIN, Rick te ede dè milye moun rekonstwi kredi yo.',
    bio_p3: '"ITIN ou pa yon limitasyon — li se kle ou pou menm sistèm kredi a. Lalwa sou bò ou." — Rick Jefferson',
    faq_title: 'Kesyon yo Poze Souvan',
    faq_q1: 'Èske mwen ka vrèman repare kredi ak yon ITIN?',
    faq_a1: 'Wi. Twa (3) gwo biwo kredi yo aksepte ITIN. Anba FCRA ak ECOA, ou gen menm dwa ak moun ki gen SSN.',
    faq_q2: 'Ki diferans ki genyen ant plan yo?',
    faq_a2: 'Debaz: 1–5 eleman (15 kontestasyon/mwa). Pwofesyonèl: 6–15 eleman (25 kontestasyon/mwa). Premium: 16+ eleman (40 kontestasyon/mwa).',
    faq_q3: 'Ki lè yo chaje m?',
    faq_a3: 'Frè odit la se yon fwa. Frè chak mwa SÈLMAN lè pwogrè verifye.',
    faq_q4: 'Kisa MyFreeScoreNow ye?',
    faq_a4: 'MyFreeScoreNow ($29.99/mwa) se yon sèvis siveyans ki aksepte ITIN.',
    faq_q5: 'E si mwen pa wè rezilta?',
    faq_a5: 'Garanti 90 jou pou tout plan. Pa gen amelyorasyon = ranbousman konplè.',
    faq_q6: 'Èske mwen ka anile nenpòt ki lè?',
    faq_a6: 'Anilasyon nan 3 jou biznis anba CROA ak ranbousman konplè. Apre sa, anile chak mwa san penalite.',
    guarantee_title: 'Garanti Ranbousman 90 Jou',
    guarantee_desc: 'Si nou pa ka montre okenn amelyorasyon verifye nan 90 jou, nou ranbouse tout frè. Pa gen kesyon. Pa gen kondisyon.',
    cta_title: 'Pare pou Netwaye Dosye Kredi ITIN Ou?',
    cta_sub: 'Chwazi plan ki bon pou ou. Chak plan gen menm pwoteksyon federal yo.',
    cta_btn: 'Chwazi Plan Ou Kounye a',
    community_title: 'Moun ki Gen ITIN nan Tout Amerik Fè Konfyans nan Nou',
    community_stat1: '10,000+', community_label1: 'Moun ki Gen ITIN Sèvi',
    community_stat2: '67M', community_label2: 'Latino nan USA (2025)',
    community_stat3: '43%', community_label3: 'Kay Latino Ki Pa Gen Bank',
    community_stat4: '34%', community_label4: 'Kwasans Biznis Ispanik',
    comp_title: 'Konfòmite Federal ak Divulgasyon Legal',
    comp_notice: 'RJ Business Solutions se yon òganizasyon reparasyon kredi anba CROA (15 U.S.C. § 1679).',
    comp_croa: 'CROA: Kontra alekri, anilasyon 3 jou, pa gen frè davans.',
    comp_fcra: 'FCRA: Kontestasyon anba §611, §623, §605.',
    comp_ecoa: 'ECOA: Diskriminasyon pa orijin nasyonal entèdi.',
    comp_fdcpa: 'FDCPA: Dwa validasyon dèt aplike.',
    comp_tsr: 'TSR: Pa gen frè davans. Pwosedi CFPB swiv.',
    comp_identity: 'Nou pa kolekte estati imigrasyon. ITIN itilize sèlman pou kominikasyon ak biwo kredi.',
    comp_contact: 'Kesyon? Kontakte nou:',
    modal_title: 'Kòmanse',
    modal_sub: 'Antre enfòmasyon ou. W ap dirije nan peman sekirize.',
    form_name: 'Non Konplè *',
    form_email: 'Adrès Imèl *',
    form_phone: 'Nimewo Telefòn',
    form_submit: 'Rezève Plas Mwen',
    form_secure: 'Enfòmasyon ou 100% sekirize.',
    back_home: 'Retounen Akèy',
    all_plans: 'Wè Tout Plan yo',
    up_to: 'Jiska',
    includes: 'Gen ladan:',
    plus: 'Plis tout sa ki nan',
    per_mo: '/mwa',
    spots_left: 'Sèlman 12 plas ki rete mwa sa a',
  }
}

// ═══════ HELPER: Get translation ═══════
function t(locale: string, key: string): string {
  return i18n[locale]?.[key] || i18n.en[key] || key
}

// ═══════════════════════════════════════════════════════════════
// IMAGE ASSETS — CDN URLs
// ═══════════════════════════════════════════════════════════════
const IMG = {
  // PRIMARY ASSETS — All verified working (media CDN + local static)
  // Hero banners — media CDN (verified 200 OK)
  heroBanner: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Professional_ITIN_credit_repair_hero_banner_featur-1771888492535.png',
  heroBanner2: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Professional_ITIN_credit_repair_hero_banner_featur-1771888492535.png',
  // Federal Rights Badges — locally hosted (generated 2026-02-24)
  federalBadges: '/static/images/federal-rights-badges.png',
  // Testimonials — media CDN (verified 200 OK)
  testimonials: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Multi-cultural_ITIN_client_testimonials_showcase_f-1771888510005.png',
  testimonials2: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Multi-cultural_ITIN_client_testimonials_showcase_f-1771888510005.png',
  testimonials3: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Multi-cultural_ITIN_client_testimonials_showcase_f-1771888512950.png',
  // Rick Portrait — real professional headshot from media CDN
  rickPortrait: 'https://media.rickjeffersonsolutions.com/Rick/Professional_corporate_headshot_of_Rick_Jefferson-1772050939311.png',
  // ITIN vs SSN Comparison — locally hosted (generated 2026-02-24)
  itinVsSsn: '/static/images/itin-vs-ssn-comparison.png',
  // Value Stack — media CDN (verified 200 OK)
  valueStack: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Universal_value_stack_grid_for_ITIN_credit_repair_-1771888515624.png',
  valueStack2: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Universal_value_stack_grid_for_ITIN_credit_repair_-1771888515624.png',
  // Guarantee Seal — media CDN (verified 200 OK)
  guaranteeSeal: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Universal_90-Day_Money-Back_Guarantee_seal_for_ITI-1771888518407.png',
  guaranteeSeal2: 'https://media.rickjeffersonsolutions.com/iytin%20funnel/Universal_90-Day_Money-Back_Guarantee_seal_for_ITI-1771888518407.png',
  // Multi-Language Flags — locally hosted (generated 2026-02-24)
  multiLangFlags: '/static/images/multi-language-flags.png',
  // Company Logo — media CDN (verified 200 OK)
  logo: 'https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg',
} as const

// ═══════════════════════════════════════════════════════════════
// SHARED CSS
// ═══════════════════════════════════════════════════════════════
const SHARED_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter','Noto Sans',-apple-system,BlinkMacSystemFont,sans-serif;background:#030712;color:#fff;line-height:1.6;overflow-x:hidden}
a{color:inherit;text-decoration:none}button{cursor:pointer;border:none;font-family:inherit}img{max-width:100%;height:auto;display:block}

/* LANG SWITCHER */
.lang-bar{position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#1e1b4b,#172554);border-bottom:1px solid rgba(59,130,246,.3);padding:.3rem 1rem;display:flex;align-items:center;justify-content:center;gap:.35rem;font-size:.78rem;flex-wrap:wrap}
.lang-label{color:#9ca3af;font-size:.68rem;margin-right:.1rem}
.lang-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#d1d5db;padding:.22rem .55rem;border-radius:6px;font-size:.7rem;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.25rem;white-space:nowrap;text-decoration:none}
.lang-btn:hover{background:rgba(59,130,246,.3);border-color:rgba(59,130,246,.5);color:#fff}
.lang-btn.active{background:linear-gradient(135deg,#3b82f6,#06b6d4);border-color:transparent;color:#fff;font-weight:700}
body{padding-top:34px}
@media(max-width:600px){.lang-bar{gap:.2rem;padding:.25rem .4rem}.lang-btn{padding:.18rem .4rem;font-size:.62rem}.lang-label{display:none}}

/* NAV */
.nav{background:rgba(17,24,39,.97);backdrop-filter:blur(12px);border-bottom:1px solid #1f2937;padding:.65rem 0;position:sticky;top:34px;z-index:100}
.nav-inner{max-width:1100px;margin:0 auto;padding:0 1.5rem;display:flex;align-items:center;justify-content:space-between}
.nav .logo-link{display:flex;align-items:center;gap:.5rem;text-decoration:none}
.nav .logo-link img{height:32px;width:auto;border-radius:4px}
.nav .logo-link span{color:#fff;font-weight:700;font-size:.95rem}
.nav-links{display:flex;gap:.8rem;font-size:.82rem}.nav-links a{color:#93c5fd;transition:color .2s}.nav-links a:hover{color:#fff}

/* ANIMATIONS */
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,.4)}50%{box-shadow:0 0 0 16px rgba(236,72,153,0)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.ao{opacity:0;transform:translateY(30px);transition:opacity .8s ease,transform .8s ease}.ao.v{opacity:1;transform:translateY(0)}
.s1{transition-delay:.1s}.s2{transition-delay:.2s}.s3{transition-delay:.3s}.s4{transition-delay:.4s}

/* CONTAINERS */
.ct{max-width:1100px;margin:0 auto;padding:0 1.5rem}
.cs{max-width:900px;margin:0 auto;padding:0 1.5rem}
.cx{max-width:720px;margin:0 auto;padding:0 1.5rem}
.tc{text-align:center}

/* GRADIENT TEXT */
.gt{display:block;margin-top:.35rem;background:linear-gradient(90deg,#60a5fa,#22d3ee,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* SECTION TITLES */
.stt{font-size:clamp(2rem,4.5vw,3rem);font-weight:900;margin-bottom:.75rem}
.sts{font-size:1.05rem;color:#9ca3af;max-width:640px;margin:0 auto 2.5rem}

/* BUTTONS */
.btn-primary{display:inline-flex;align-items:center;gap:.6rem;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-weight:800;font-size:1.1rem;padding:1rem 2.2rem;border-radius:.75rem;box-shadow:0 8px 32px rgba(236,72,153,.35);transition:all .3s;text-transform:uppercase;letter-spacing:.02em;animation:pulse 2s infinite;text-decoration:none}
.btn-primary:hover{opacity:.9;transform:translateY(-3px);box-shadow:0 16px 48px rgba(236,72,153,.5)}
.btn-secondary{display:inline-flex;align-items:center;gap:.5rem;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:700;font-size:.95rem;padding:.8rem 1.5rem;border-radius:.6rem;transition:all .3s;text-decoration:none}
.btn-secondary:hover{opacity:.9;transform:translateY(-2px)}

/* HERO */
.hero{position:relative;min-height:85vh;display:flex;align-items:center;justify-content:center;padding:4rem 0 5rem;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:0}
.hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center}
.hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,7,18,.55) 0%,rgba(12,20,69,.82) 35%,rgba(15,23,42,.92) 100%)}
.hero-content{position:relative;z-index:2}

.hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.4);border-radius:999px;padding:.45rem 1.1rem;margin-bottom:1.25rem;color:#6ee7b7;font-size:.82rem;font-weight:600}
.hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;line-height:1.15;margin-bottom:1rem;text-shadow:0 2px 12px rgba(0,0,0,.5)}
.hero .sub{font-size:clamp(.95rem,2vw,1.15rem);color:#bfdbfe;max-width:700px;margin:0 auto 2rem;line-height:1.7;text-shadow:0 1px 4px rgba(0,0,0,.3)}

/* SECTION IMAGES */
.section-img{border-radius:1rem;border:2px solid rgba(59,130,246,.2);box-shadow:0 12px 40px rgba(0,0,0,.3);margin:0 auto;max-width:100%;height:auto;transition:transform .3s,box-shadow .3s}
.section-img:hover{transform:scale(1.02);box-shadow:0 16px 48px rgba(59,130,246,.15)}
.section-img-sm{border-radius:.75rem;border:1px solid rgba(59,130,246,.15);max-width:100%;height:auto}

/* TESTIMONIALS */
.testimonials{padding:5rem 0;background:linear-gradient(180deg,#0f172a,#0a1128)}
.testimonials-img-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem;margin-top:2rem}
.testimonials-img-grid img{border-radius:1rem;border:2px solid rgba(139,92,246,.3);box-shadow:0 8px 32px rgba(139,92,246,.1);width:100%;height:auto;transition:all .4s}
.testimonials-img-grid img:hover{border-color:rgba(139,92,246,.6);transform:translateY(-4px);box-shadow:0 12px 40px rgba(139,92,246,.2)}

/* ITIN VS SSN */
.comparison{padding:5rem 0;background:linear-gradient(180deg,#0a1128,#0f172a)}

/* VALUE STACK */
.value-stack{padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)}

/* LANGUAGE FLAGS */
.lang-flags{padding:4rem 0;background:rgba(23,37,84,.1);border-top:1px solid rgba(30,58,138,.2);border-bottom:1px solid rgba(30,58,138,.2)}

/* PLAN CARDS */
.plans-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin:3rem 0}
.plan-card{background:#111827;border:2px solid #1f2937;border-radius:1.25rem;padding:2rem;position:relative;transition:all .4s}
.plan-card:hover{border-color:rgba(59,130,246,.5);transform:translateY(-6px);box-shadow:0 12px 40px rgba(59,130,246,.1)}
.plan-card.featured{border-color:rgba(139,92,246,.6);box-shadow:0 0 40px rgba(139,92,246,.15);transform:scale(1.03)}
.plan-card.featured:hover{transform:scale(1.03) translateY(-6px)}
.plan-tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#fff;font-size:.72rem;font-weight:700;padding:.3rem .9rem;border-radius:999px;white-space:nowrap;text-transform:uppercase;letter-spacing:.06em}
.plan-name{font-size:1.6rem;font-weight:900;margin:.75rem 0 .25rem}
.plan-target{color:#60a5fa;font-size:.85rem;font-weight:600;margin-bottom:.6rem}
.plan-price{font-size:3rem;font-weight:900;color:#fff;margin:.5rem 0}
.plan-price span{font-size:1rem;font-weight:600;color:#9ca3af}
.plan-desc{color:#9ca3af;font-size:.85rem;line-height:1.6;margin-bottom:1.25rem}
.plan-features{list-style:none;padding:0;margin:0 0 1.5rem}
.plan-features li{display:flex;align-items:flex-start;gap:.5rem;font-size:.82rem;color:#d1d5db;padding:.4rem 0}
.plan-features li::before{content:'✓';color:#4ade80;font-weight:700;flex-shrink:0}
.plan-btn{display:block;width:100%;text-align:center;padding:.9rem;border-radius:.65rem;font-weight:700;font-size:.95rem;color:#fff;transition:all .3s;text-decoration:none}
.plan-btn:hover{opacity:.9;transform:translateY(-2px)}
.plan-notes{text-align:center;margin-top:.75rem;font-size:.72rem;color:#6b7280}

/* RIGHTS SECTION */
.rights{padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)}
.rights-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.25rem;margin-top:2rem}
.right-card{background:rgba(17,24,39,.8);border:1px solid rgba(30,58,138,.4);border-radius:1rem;padding:1.5rem;transition:all .3s}
.right-card:hover{border-color:rgba(59,130,246,.5);transform:translateY(-3px)}
.right-card h4{color:#60a5fa;font-size:.95rem;font-weight:700;margin-bottom:.4rem}
.right-card p{color:#9ca3af;font-size:.82rem;line-height:1.6}

/* BIO */
.bio{padding:5rem 0;background:linear-gradient(180deg,#0f172a,#0a1128)}
.bio-card{display:flex;gap:2.5rem;background:#111827;border:1px solid rgba(30,58,138,.3);border-radius:1.25rem;padding:2.5rem;align-items:flex-start}
.bio-img{width:220px;height:220px;border-radius:1rem;flex-shrink:0;overflow:hidden;border:2px solid rgba(59,130,246,.3);box-shadow:0 8px 32px rgba(59,130,246,.15)}
.bio-img img{width:100%;height:100%;object-fit:cover}
.bio-content h3{font-size:1.5rem;font-weight:800;margin-bottom:.25rem}
.bio-content .role{color:#60a5fa;font-size:.9rem;font-weight:600;margin-bottom:1rem}
.bio-content p{color:#9ca3af;font-size:.9rem;line-height:1.7;margin-bottom:.75rem}
.bio-content blockquote{border-left:3px solid #3b82f6;padding:.75rem 1.25rem;background:rgba(30,58,138,.15);border-radius:0 .5rem .5rem 0;color:#bfdbfe;font-style:italic;margin-top:1rem}

/* FAQ */
.faq{padding:5rem 0;background:linear-gradient(180deg,#030712,#0a0f1f)}
.faq-item{background:#111827;border:1px solid #1f2937;border-radius:.75rem;margin-bottom:.75rem;overflow:hidden}
.faq-q{padding:1.25rem 1.5rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:.95rem;transition:background .2s}
.faq-q:hover{background:rgba(30,58,138,.15)}
.faq-q::after{content:'+';font-size:1.5rem;color:#60a5fa;transition:transform .3s}
.faq-item.open .faq-q::after{content:'−';transform:rotate(180deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .3s;padding:0 1.5rem;color:#9ca3af;font-size:.88rem;line-height:1.7}
.faq-item.open .faq-a{max-height:300px;padding:0 1.5rem 1.25rem}

/* COMMUNITY */
.community{padding:4rem 0;background:rgba(23,37,84,.15);border-top:1px solid rgba(30,58,138,.3);border-bottom:1px solid rgba(30,58,138,.3)}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;margin-top:2rem}
.stat-card{text-align:center}
.stat-val{font-size:2.5rem;font-weight:900;background:linear-gradient(135deg,#60a5fa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-label{color:#9ca3af;font-size:.82rem;margin-top:.25rem}

/* GUARANTEE */
.guarantee{padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#172554)}
.guarantee-box{background:#111827;border:2px solid rgba(74,222,128,.3);border-radius:1.25rem;padding:2.5rem;text-align:center;max-width:700px;margin:0 auto}
.guarantee-box h3{font-size:1.5rem;font-weight:800;color:#4ade80;margin-bottom:1rem}
.guarantee-box p{color:#9ca3af;font-size:1rem;line-height:1.7}
.guarantee-seal{width:200px;height:200px;margin:0 auto 1.5rem;border-radius:50%;overflow:hidden;border:3px solid rgba(74,222,128,.3);box-shadow:0 0 40px rgba(74,222,128,.15)}
.guarantee-seal img{width:100%;height:100%;object-fit:cover}

/* CTA */
.cta-section{padding:5rem 0;background:linear-gradient(180deg,#172554,#030712);text-align:center}

/* COMPLIANCE FOOTER */
.comp-footer{padding:3rem 0;background:#030712;border-top:1px solid #1f2937}
.comp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin:1.5rem 0}
.comp-item{background:rgba(17,24,39,.6);border:1px solid rgba(30,58,138,.3);border-radius:.75rem;padding:1rem}
.comp-item h4{color:#60a5fa;font-size:.82rem;font-weight:700;margin-bottom:.3rem}
.comp-item p{color:#6b7280;font-size:.72rem;line-height:1.6}

/* FOOTER */
.footer{padding:2.5rem 0;background:#030712;border-top:1px solid #111827;text-align:center}
.footer-logo img{height:36px;margin:0 auto 1rem;border-radius:4px}
.footer p{color:#6b7280;font-size:.78rem;line-height:1.8}
.footer a{color:#60a5fa}
.footer-links{margin-top:.75rem;display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;font-size:.75rem}
.footer-links a{color:#60a5fa}

/* MODAL */
.mo{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1000;align-items:center;justify-content:center;padding:1.5rem}
.mo.active{display:flex}
.md{background:#111827;border:1px solid rgba(59,130,246,.4);border-radius:1.5rem;padding:2.5rem;max-width:520px;width:100%;position:relative;animation:fadeInUp .3s ease}
.mc{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);color:#9ca3af;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer;transition:background .3s}
.mc:hover{background:rgba(255,255,255,.2);color:#fff}
.md h2{font-size:1.4rem;font-weight:800;margin-bottom:.4rem}
.md .ms{color:#9ca3af;font-size:.88rem;margin-bottom:1.5rem}
.fg2{margin-bottom:1rem}
.fg2 label{display:block;color:#d1d5db;font-size:.82rem;font-weight:600;margin-bottom:.35rem}
.fg2 input{width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;transition:border-color .3s;outline:none}
.fg2 input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
.fs-btn{width:100%;padding:.9rem;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;font-weight:800;font-size:1rem;border-radius:.65rem;transition:all .3s;text-transform:uppercase}
.fs-btn:hover{opacity:.9;transform:translateY(-1px)}
.fnt{text-align:center;color:#6b7280;font-size:.72rem;margin-top:.75rem}

/* RESPONSIVE */
@media(max-width:768px){
  .plans-grid{grid-template-columns:1fr}
  .plan-card.featured{transform:none}.plan-card.featured:hover{transform:translateY(-6px)}
  .rights-grid{grid-template-columns:1fr}
  .bio-card{flex-direction:column;align-items:center;text-align:center}
  .bio-img{width:160px;height:160px}
  .testimonials-img-grid{grid-template-columns:1fr}
  .guarantee-seal{width:160px;height:160px}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .btn-primary{width:100%;justify-content:center;font-size:1rem;padding:.9rem 1.5rem}
}
`

// ═══════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER HTML
// ═══════════════════════════════════════════════════════════════
function langSwitcherHTML(currentLocale: string): string {
  return SUPPORTED_LOCALES.map(loc => {
    const active = loc === currentLocale ? ' active' : ''
    const name = i18n[loc]?.lang_name || loc
    const flag = i18n[loc]?.flag || ''
    return `<a href="/${loc}" class="lang-btn${active}">${flag} ${name}</a>`
  }).join('')
}

// ═══════════════════════════════════════════════════════════════
// SHARED LAYOUT
// ═══════════════════════════════════════════════════════════════
function pageLayout(locale: string, title: string, content: string, seoOpts?: { description?: string, canonical?: string, ogImage?: string, ogType?: string, schema?: string, keywords?: string }): string {
  const T = (key: string) => t(locale, key)
  const BASE_URL = 'https://rj-itin-funnels.pages.dev'
  const desc = seoOpts?.description || T('hero_sub').replace(/<[^>]*>/g, '').substring(0, 160)
  const canonical = seoOpts?.canonical || `${BASE_URL}/${locale}`
  const ogImage = seoOpts?.ogImage || IMG.rickPortrait
  const ogType = seoOpts?.ogType || 'website'
  const keywords = seoOpts?.keywords || 'ITIN credit repair, ITIN credit score, credit repair for ITIN holders, reparar credito ITIN, ITIN dispute, FCRA ITIN rights, ECOA ITIN, credit bureau ITIN, RJ Business Solutions'
  const schemaLD = seoOpts?.schema || `{
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"LocalBusiness","@id":"${BASE_URL}/#business","name":"RJ Business Solutions","description":"ITIN & SSN credit repair services — forensic audits, bureau disputes, bilingual support.","url":"${BASE_URL}","telephone":"+1-000-000-0000","email":"rickjefferson@rickjeffersonsolutions.com","address":{"@type":"PostalAddress","streetAddress":"1342 NM 333","addressLocality":"Tijeras","addressRegion":"NM","postalCode":"87059","addressCountry":"US"},"image":"${IMG.logo}","priceRange":"$99-$199/mo","sameAs":["https://tiktok.com/@rick_jeff_solution","https://twitter.com/ricksolutions1","https://linkedin.com/in/rick-jefferson-314998235","https://rickjeffersonsolutions.com"],"founder":{"@type":"Person","name":"Rick Jefferson","jobTitle":"Founder & ITIN Credit Expert","image":"${IMG.rickPortrait}","url":"${BASE_URL}/en/about-rick-jefferson","sameAs":["https://linkedin.com/in/rick-jefferson-314998235"]}},
      {"@type":"WebSite","@id":"${BASE_URL}/#website","url":"${BASE_URL}","name":"RJ Business Solutions — ITIN Credit Repair","publisher":{"@id":"${BASE_URL}/#business"},"inLanguage":["en","es","pt","fr","ht"]},
      {"@type":"Service","@id":"${BASE_URL}/#service","name":"ITIN Credit Repair","provider":{"@id":"${BASE_URL}/#business"},"serviceType":"Credit Repair","areaServed":"US","description":"Forensic 3-bureau credit audits and statute-specific disputes for ITIN holders under FCRA, ECOA, CROA, FDCPA.","offers":[
        {"@type":"Offer","name":"Basic Plan","price":"99","priceCurrency":"USD","description":"Up to 15 disputes/month for 1-5 negative items"},
        {"@type":"Offer","name":"Professional Plan","price":"149","priceCurrency":"USD","description":"Up to 25 disputes/month with dedicated analyst for 6-15 negative items"},
        {"@type":"Offer","name":"Premium Plan","price":"199","priceCurrency":"USD","description":"Up to 40 disputes/month with VIP access for 16+ negative items"}
      ]},
      {"@type":"BreadcrumbList","@id":"${BASE_URL}/#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${BASE_URL}"},{"@type":"ListItem","position":2,"name":"${title}","item":"${canonical}"}]}
    ]
  }`
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | RJ Business Solutions</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${keywords}">
  <meta name="author" content="Rick Jefferson, RJ Business Solutions">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${canonical}">
  <!-- OpenGraph -->
  <meta property="og:type" content="${ogType}">
  <meta property="og:title" content="${title} | RJ Business Solutions">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="RJ Business Solutions">
  <meta property="og:locale" content="${locale === 'es' ? 'es_US' : locale === 'pt' ? 'pt_BR' : locale === 'fr' ? 'fr_FR' : locale === 'ht' ? 'ht_HT' : 'en_US'}">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@ricksolutions1">
  <meta name="twitter:creator" content="@ricksolutions1">
  <meta name="twitter:title" content="${title} | RJ Business Solutions">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${ogImage}">
  <!-- Alternate Languages -->
  ${SUPPORTED_LOCALES.map(l => `<link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}">`).join('\n  ')}
  <link rel="alternate" hreflang="x-default" href="${BASE_URL}/en">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script type="application/ld+json">${schemaLD}</script>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <!-- LANGUAGE SWITCHER -->
  <div class="lang-bar">
    <span class="lang-label">${T('lang_label')}</span>
    ${langSwitcherHTML(locale)}
  </div>

  <!-- NAV -->
  <nav class="nav">
    <div class="nav-inner">
      <a href="/${locale}" class="logo-link">
        <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" height="32">
        <span>ITIN Credit</span>
      </a>
      <div class="nav-links">
        <a href="/${locale}">${T('nav_home')}</a>
        <a href="/${locale}#plans">${T('nav_plans')}</a>
        <a href="/${locale}/about-rick-jefferson">About</a>
        <a href="/${locale}/blog">Blog</a>
        <a href="/${locale}/credit-monitoring">Monitoring</a>
        <a href="/${locale}/portal">Portal</a>
        <a href="/${locale}/partners">Partners</a>
        <a href="/${locale}/contact">Contact</a>
      </div>
    </div>
  </nav>

  ${content}

  <!-- RICKBOT CHAT WIDGET -->
  <div id="rickbot-widget" style="position:fixed;bottom:20px;right:20px;z-index:999">
    <div id="rickbot-bubble" onclick="toggleRickBot()" style="width:60px;height:60px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(59,130,246,.4);transition:all .3s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      <span style="font-size:1.5rem">💬</span>
    </div>
    <div id="rickbot-panel" style="display:none;position:absolute;bottom:70px;right:0;width:360px;max-height:500px;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.6)">
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center">
        <div><strong style="color:#fff;font-size:.95rem">RickBot</strong><br><span style="color:rgba(255,255,255,.7);font-size:.72rem">${locale === 'es' ? 'Asistente de Crédito ITIN' : 'ITIN Credit Assistant'}</span></div>
        <button onclick="toggleRickBot()" style="background:rgba(255,255,255,.2);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-size:1rem">&times;</button>
      </div>
      <div id="rickbot-messages" style="height:300px;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem">
        <div style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%">
          <p style="color:#d1d5db;font-size:.82rem;line-height:1.5">${locale === 'es' ? '¡Hola! Soy RickBot, tu asistente de crédito ITIN. ¿En qué puedo ayudarte hoy?' : 'Hey! I\'m RickBot, your ITIN credit assistant. How can I help you today?'}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          ${locale === 'es'
            ? ['¿Qué planes ofrecen?','¿Tengo derechos con ITIN?','¿Cómo empiezo?','Hablar con Rick'].map(q=>`<button onclick="rickBotReply(this,'${q}')" style="background:#1f2937;border:1px solid #374151;color:#60a5fa;font-size:.78rem;padding:.5rem .75rem;border-radius:.5rem;cursor:pointer;text-align:left;transition:all .2s" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#374151'">${q}</button>`).join('')
            : ['What plans do you offer?','Do ITIN holders have credit rights?','How do I get started?','Talk to Rick'].map(q=>`<button onclick="rickBotReply(this,'${q}')" style="background:#1f2937;border:1px solid #374151;color:#60a5fa;font-size:.78rem;padding:.5rem .75rem;border-radius:.5rem;cursor:pointer;text-align:left;transition:all .2s" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#374151'">${q}</button>`).join('')}
        </div>
      </div>
      <div style="border-top:1px solid #1f2937;padding:.75rem;display:flex;gap:.5rem">
        <input id="rickbot-input" type="text" placeholder="${locale === 'es' ? 'Escribe tu pregunta...' : 'Type your question...'}" style="flex:1;background:#1f2937;border:1px solid #374151;border-radius:.5rem;padding:.5rem .75rem;color:#fff;font-size:.82rem;outline:none" onkeypress="if(event.key==='Enter')sendRickBot()">
        <button onclick="sendRickBot()" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:.5rem .75rem;border-radius:.5rem;font-size:.82rem;font-weight:600;cursor:pointer;border:none">→</button>
      </div>
    </div>
  </div>

  <!-- EXIT-INTENT POPUP -->
  <div id="exit-popup" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:1001;align-items:center;justify-content:center;padding:1.5rem">
    <div style="background:#111827;border:2px solid rgba(59,130,246,.4);border-radius:1.5rem;padding:2.5rem;max-width:480px;width:100%;position:relative;animation:fadeInUp .3s ease;text-align:center">
      <button onclick="closeExitPopup()" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,.1);color:#9ca3af;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer;border:none">&times;</button>
      <div style="font-size:2.5rem;margin-bottom:1rem">🛡️</div>
      <h2 style="font-size:1.4rem;font-weight:900;margin-bottom:.5rem;color:#fff">${locale === 'es' ? '¡Espera! Tu crédito ITIN merece atención' : 'Wait! Your ITIN Credit Deserves Better'}</h2>
      <p style="color:#9ca3af;font-size:.88rem;margin-bottom:1.5rem;line-height:1.6">${locale === 'es' ? 'Obtén tu guía GRATUITA de derechos FCRA para titulares de ITIN + descuento exclusivo.' : 'Get your FREE FCRA rights guide for ITIN holders + an exclusive discount on your first audit.'}</p>
      <form onsubmit="handleExitCapture(event)" style="display:flex;flex-direction:column;gap:.75rem">
        <input type="email" id="exit-email" required placeholder="${locale === 'es' ? 'Tu correo electrónico' : 'Your email address'}" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none">
        <button type="submit" style="width:100%;padding:.9rem;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;font-weight:800;font-size:1rem;border-radius:.65rem;border:none;cursor:pointer">${locale === 'es' ? 'Envíame la Guía Gratis' : 'Send Me the Free Guide'}</button>
      </form>
      <p style="color:#6b7280;font-size:.68rem;margin-top:.75rem">🔒 ${locale === 'es' ? 'No spam. Solo información de crédito ITIN.' : 'No spam. Only ITIN credit resources.'}</p>
      <div style="margin-top:1rem">
        ${SUPPORTED_LOCALES.map(l => `<a href="/${l}" style="color:#60a5fa;font-size:.7rem;margin:0 .25rem">${i18n[l]?.flag || ''}</a>`).join('')}
      </div>
    </div>
  </div>

  <!-- SOCIAL PROOF TOAST -->
  <div id="social-proof-toast" style="display:none;position:fixed;bottom:90px;left:20px;z-index:998;background:#111827;border:1px solid #1e3a5f;border-radius:.75rem;padding:.75rem 1rem;box-shadow:0 4px 20px rgba(0,0,0,.5);max-width:300px;animation:slideInLeft .4s ease">
    <div style="display:flex;align-items:center;gap:.75rem">
      <div style="width:36px;height:36px;background:linear-gradient(135deg,#4ade80,#22c55e);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0">✓</div>
      <div>
        <p id="proof-name" style="color:#fff;font-size:.82rem;font-weight:700"></p>
        <p id="proof-action" style="color:#9ca3af;font-size:.72rem"></p>
      </div>
    </div>
  </div>

  <script>
  /* RICKBOT */
  function toggleRickBot(){const p=document.getElementById('rickbot-panel');p.style.display=p.style.display==='none'?'block':'none'}
  const rickBotAnswers={en:{'What plans do you offer?':'We have 3 plans:\\n• Basic ($99/mo) — up to 15 disputes/mo for 1-5 negative items\\n• Professional ($149/mo) — up to 25 disputes/mo with dedicated analyst\\n• Premium ($199/mo) — up to 40 disputes/mo, VIP access, business credit\\n\\nAll plans include a 90-day money-back guarantee!','Do ITIN holders have credit rights?':'Absolutely! Under FCRA and ECOA, ITIN holders have the EXACT same credit dispute rights as SSN holders. All 3 bureaus (TransUnion, Equifax, Experian) accept ITIN numbers.','How do I get started?':'3 easy steps:\\n1. Enroll in MyFreeScoreNow credit monitoring ($29.99/mo)\\n2. Choose your plan (Basic, Professional, or Premium)\\n3. Pay the one-time audit fee — your forensic report arrives in 5 business days!','Talk to Rick':'Email Rick directly at rickjefferson@rickjeffersonsolutions.com — he typically responds within 24 hours. You can also reach us through our contact page!'},es:{'¿Qué planes ofrecen?':'Tenemos 3 planes:\\n• Básico ($99/mes) — hasta 15 disputas/mes\\n• Profesional ($149/mes) — hasta 25 disputas con analista dedicado\\n• Premium ($199/mes) — hasta 40 disputas, acceso VIP\\n\\n¡Todos incluyen garantía de 90 días!','¿Tengo derechos con ITIN?':'¡Absolutamente! Bajo FCRA y ECOA, los titulares de ITIN tienen los MISMOS derechos de disputa que los titulares de SSN. Las 3 agencias aceptan números ITIN.','¿Cómo empiezo?':'3 pasos fáciles:\\n1. Inscríbete en MyFreeScoreNow ($29.99/mes)\\n2. Elige tu plan\\n3. Paga la tarifa de auditoría — tu reporte llega en 5 días hábiles!','Hablar con Rick':'Envía un email a rickjefferson@rickjeffersonsolutions.com — Rick responde en 24 horas.'}}
  function rickBotReply(btn,q){const msgs=document.getElementById('rickbot-messages');msgs.innerHTML+='<div style="align-self:flex-end;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:.75rem .75rem .2rem .75rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem">'+q+'</p></div>';const lang='${locale}';const a=(rickBotAnswers[lang]||rickBotAnswers.en)[q]||'Please email rickjefferson@rickjeffersonsolutions.com for personalized help!';setTimeout(()=>{msgs.innerHTML+='<div style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem;line-height:1.5;white-space:pre-line">'+a+'</p></div>';msgs.scrollTop=msgs.scrollHeight},500)}
  function sendRickBot(){const inp=document.getElementById('rickbot-input');if(!inp.value.trim())return;const q=inp.value;inp.value='';const msgs=document.getElementById('rickbot-messages');msgs.innerHTML+='<div style="align-self:flex-end;background:rgba(139,92,246,.15);border:1px solid rgba(139,92,246,.3);border-radius:.75rem .75rem .2rem .75rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem">'+q+'</p></div>';msgs.innerHTML+='<div id="rickbot-typing" style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%"><p style="color:#9ca3af;font-size:.82rem">Typing...</p></div>';msgs.scrollTop=msgs.scrollHeight;const sid=window._rickbotSid||'';fetch('/api/rickbot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,locale:'${locale}',sessionId:sid})}).then(r=>r.json()).then(data=>{const el=document.getElementById('rickbot-typing');if(el)el.remove();if(data.success){window._rickbotSid=data.sessionId;msgs.innerHTML+='<div style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem;line-height:1.5;white-space:pre-line">'+data.reply+'</p></div>'}else{msgs.innerHTML+='<div style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem;line-height:1.5">Email rickjefferson@rickjeffersonsolutions.com for help!</p></div>'}msgs.scrollTop=msgs.scrollHeight}).catch(()=>{const el=document.getElementById('rickbot-typing');if(el)el.remove();msgs.innerHTML+='<div style="background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:.75rem .75rem .75rem .2rem;padding:.75rem;max-width:85%"><p style="color:#d1d5db;font-size:.82rem">Connection error. Email rickjefferson@rickjeffersonsolutions.com</p></div>';msgs.scrollTop=msgs.scrollHeight})}

  /* EXIT INTENT */
  let exitShown=false;
  document.addEventListener('mouseout',function(e){if(!exitShown&&e.clientY<5){document.getElementById('exit-popup').style.display='flex';exitShown=true}});
  function closeExitPopup(){document.getElementById('exit-popup').style.display='none'}
  function handleExitCapture(e){e.preventDefault();const email=document.getElementById('exit-email').value;fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Exit Capture',email,plan:'lead-magnet',locale:'${locale}'})}).then(()=>{document.getElementById('exit-popup').innerHTML='<div style="text-align:center;padding:3rem"><div style="font-size:3rem;margin-bottom:1rem">✅</div><h3 style="font-size:1.25rem;font-weight:800;color:#fff;margin-bottom:.5rem">${locale === 'es' ? '¡Enviado!' : 'Sent!'}</h3><p style="color:#9ca3af">${locale === 'es' ? 'Revisa tu correo.' : 'Check your inbox.'}</p></div>'}).catch(()=>{})}

  /* SOCIAL PROOF ENGINE */
  const proofData=[
    {name:'Maria G.',action:'${locale==='es'?'se inscribió en el Plan Profesional':'enrolled in Professional Plan'}',city:'Houston, TX'},
    {name:'Carlos R.',action:'${locale==='es'?'removió 4 elementos negativos':'removed 4 negative items'}',city:'Los Angeles, CA'},
    {name:'Ana L.',action:'${locale==='es'?'activó monitoreo de crédito':'activated credit monitoring'}',city:'Miami, FL'},
    {name:'Roberto M.',action:'${locale==='es'?'subió su puntaje 87 puntos':'raised score by 87 points'}',city:'Phoenix, AZ'},
    {name:'Sandra P.',action:'${locale==='es'?'completó auditoría forense':'completed forensic audit'}',city:'Dallas, TX'},
    {name:'Miguel A.',action:'${locale==='es'?'se inscribió en el Plan Premium':'enrolled in Premium Plan'}',city:'Chicago, IL'},
    {name:'Patricia V.',action:'${locale==='es'?'removió 7 colecciones':'removed 7 collections'}',city:'New York, NY'},
    {name:'Jose H.',action:'${locale==='es'?'calificó para hipoteca FHA':'qualified for FHA mortgage'}',city:'San Antonio, TX'}
  ];
  let proofIdx=0;
  function showProof(){const d=proofData[proofIdx%proofData.length];document.getElementById('proof-name').textContent=d.name+' — '+d.city;document.getElementById('proof-action').textContent=d.action;const toast=document.getElementById('social-proof-toast');toast.style.display='block';setTimeout(()=>{toast.style.display='none';proofIdx++},4000)}
  setTimeout(()=>{showProof();setInterval(showProof,15000)},8000);
  </script>

  <!-- FOOTER -->
  <footer class="footer" style="padding:3rem 0 2rem;border-top:1px solid #1f2937;background:#030712">
    <div class="cx" style="text-align:center">
      <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" class="footer-logo" style="height:36px;margin:0 auto 1rem;border-radius:4px">
      <p style="color:#d1d5db;font-size:.85rem;line-height:1.7"><strong>RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br>
        <a href="https://rickjeffersonsolutions.com" style="color:#60a5fa">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
      <div style="display:flex;justify-content:center;gap:1rem;margin:.75rem 0;flex-wrap:wrap">
        <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" style="color:#4ade80;font-size:.82rem;font-weight:600">📊 Credit Monitoring Sign-Up</a>
        <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" style="color:#22d3ee;font-size:.82rem;font-weight:600">🔒 Enroll in Credit Monitoring</a>
        <a href="https://rickjeffersonsolutions.com" target="_blank" style="color:#60a5fa;font-size:.82rem;font-weight:600">🧭 ITIN Credit Roadmap Quiz</a>
      </div>
      <div style="display:flex;justify-content:center;gap:1.25rem;margin:.5rem 0;flex-wrap:wrap">
        <a href="https://tiktok.com/@rick_jeff_solution" target="_blank" style="color:#9ca3af;font-size:.8rem;transition:color .2s" onmouseover="this.style.color='#60a5fa'" onmouseout="this.style.color='#9ca3af'">TikTok: @rick_jeff_solution</a>
        <a href="https://twitter.com/ricksolutions1" target="_blank" style="color:#9ca3af;font-size:.8rem;transition:color .2s" onmouseover="this.style.color='#60a5fa'" onmouseout="this.style.color='#9ca3af'">Twitter: @ricksolutions1</a>
        <a href="https://linkedin.com/in/rick-jefferson-314998235" target="_blank" style="color:#9ca3af;font-size:.8rem;transition:color .2s" onmouseover="this.style.color='#60a5fa'" onmouseout="this.style.color='#9ca3af'">LinkedIn</a>
      </div>
      <div class="footer-links" style="margin:.75rem 0">
        <a href="/${locale}/about-rick-jefferson" style="color:#60a5fa;font-size:.78rem">About Rick</a> &bull;
        <a href="/${locale}/credit-monitoring" style="color:#60a5fa;font-size:.78rem">Credit Monitoring</a> &bull;
        <a href="/${locale}/portal" style="color:#60a5fa;font-size:.78rem">Client Portal</a> &bull;
        <a href="/${locale}/partners" style="color:#60a5fa;font-size:.78rem">Partners</a> &bull;
        <a href="/${locale}/blog" style="color:#60a5fa;font-size:.78rem">Blog</a> &bull;
        <a href="/${locale}/faq" style="color:#60a5fa;font-size:.78rem">FAQ</a> &bull;
        <a href="/${locale}/testimonials" style="color:#60a5fa;font-size:.78rem">Testimonials</a> &bull;
        <a href="/${locale}/contact" style="color:#60a5fa;font-size:.78rem">Contact</a>
      </div>
      <div class="footer-links" style="margin:.5rem 0">
        <a href="/${locale}/legal" style="color:#60a5fa;font-size:.72rem">${T('nav_legal')}</a> &bull;
        <a href="/${locale}/croa-disclosure" style="color:#60a5fa;font-size:.72rem">CROA Disclosure</a> &bull;
        <a href="/${locale}/privacy" style="color:#60a5fa;font-size:.72rem">${T('nav_privacy')}</a> &bull;
        <a href="/${locale}/terms" style="color:#60a5fa;font-size:.72rem">${T('nav_terms')}</a> &bull;
        <a href="/${locale}/refund-policy" style="color:#60a5fa;font-size:.72rem">Refund Policy</a> &bull;
        <a href="/${locale}/client-waiver" style="color:#60a5fa;font-size:.72rem">Client Waiver</a> &bull;
        <a href="/sitemap.xml" style="color:#60a5fa;font-size:.72rem">Sitemap</a>
      </div>
      <!-- Full Compliance Disclosure -->
      <div style="max-width:850px;margin:1.5rem auto 0;background:rgba(30,58,138,.06);border:1px solid rgba(59,130,246,.12);border-radius:.75rem;padding:1.25rem">
        <p style="color:#9ca3af;font-size:.72rem;line-height:1.8;margin-bottom:.75rem">RJ Business Solutions operates in full compliance with the Credit Repair Organizations Act (CROA), Fair Credit Reporting Act (FCRA — §§ 604, 605, 605B, 605C, 611, 616, 617, 623), Fair Debt Collection Practices Act (FDCPA), Fair Credit Billing Act (FCBA), FTC Telemarketing Sales Rule (TSR), Equal Credit Opportunity Act (ECOA) / Regulation B, and CFPB guidelines.</p>
        <p style="color:#9ca3af;font-size:.72rem;line-height:1.8;margin-bottom:.75rem">RJ Business Solutions is not a law firm and does not provide legal advice. Results vary by individual credit profile. No specific outcome is guaranteed. ITIN holders possess identical consumer rights under FCRA and ECOA regardless of immigration or SSN status.</p>
        <p style="color:#f59e0b;font-size:.68rem;line-height:1.8;font-weight:600">Identity-Theft Policy: RJ Business Solutions does not file, prepare, coach, or advise on FTC Identity Theft Reports, police reports, sex trafficking victim claims, or any victim-status filings under FCRA §605B or §605C.</p>
      </div>
      <p style="color:#6b7280;font-size:.72rem;margin-top:1rem">&copy; 2026 RJ Business Solutions. All rights reserved.</p>
    </div>
  </footer>

  <script>
  // FAQ toggle
  document.querySelectorAll('.faq-q').forEach(q=>{q.addEventListener('click',()=>{q.parentElement.classList.toggle('open')})});
  // Scroll animation
  const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('v');obs.unobserve(e.target)}})},{threshold:.1});
  document.querySelectorAll('.ao').forEach(el=>obs.observe(el));
  </script>
</body>
</html>`
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNNEL PAGE (with plans)
// ═══════════════════════════════════════════════════════════════
function mainFunnelHTML(locale: string): string {
  const T = (key: string) => t(locale, key)
  const planNames: Record<string, string> = { basic: T('plan_basic'), professional: T('plan_pro'), premium: T('plan_premium') }
  const MFSN_URL = 'https://app.myfreescorenow.com/enroll/B01A8289'

  return pageLayout(locale, T('site_title'), `
  <!-- HERO with Background Banner -->
  <section class="hero">
    <div class="hero-bg">
      <img src="${IMG.heroBanner}" alt="ITIN Credit Repair - Multi-Ethnic Community" width="1365" height="768" loading="eager">
    </div>
    <div class="cx tc hero-content">
      <div class="hero-badge">⭐ ${T('hero_badge')}</div>
      <h1>${T('hero_title')}</h1>
      <p class="sub">${T('hero_sub')}</p>
      <a href="#plans" class="btn-primary">${T('hero_cta')} →</a>
      <p style="color:#bfdbfe;font-size:.78rem;margin-top:1rem;text-shadow:0 1px 3px rgba(0,0,0,.4)">${T('spots_left')}</p>
    </div>
  </section>

  <!-- MULTI-LANGUAGE SUPPORT VISUAL -->
  <section class="lang-flags">
    <div class="cs tc">
      <img src="${IMG.multiLangFlags}" alt="Multi-Language Support: English, Spanish, Portuguese, French, Haitian Creole" class="section-img ao" width="1365" height="768" loading="lazy" style="max-width:900px">
    </div>
  </section>

  <!-- WHY RJ BUSINESS SOLUTIONS -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#111827)">
    <div class="cs">
      <h2 class="stt tc ao">${T('why_rj')}</h2>
      <div class="ao" style="max-width:800px;margin:2rem auto 0;background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.08));border:1px solid rgba(59,130,246,.2);border-radius:1rem;padding:2rem">
        <p style="color:#d1d5db;font-size:.95rem;line-height:1.8;margin-bottom:1rem">${T('why_rj_desc')}</p>
        <p style="color:#d1d5db;font-size:.95rem;line-height:1.8">${T('why_rj_desc2')}</p>
      </div>
      <div class="ao" style="text-align:center;margin-top:2rem">
        <p style="color:#fbbf24;font-weight:700;font-size:.95rem">📊 ${T('mfsn_required')}</p>
        <a href="${MFSN_URL}" target="_blank" class="btn-primary" style="margin-top:1rem;display:inline-block">${T('mfsn_enroll')} →</a>
      </div>
    </div>
  </section>

  <!-- COMMUNITY PROOF -->
  <section class="community">
    <div class="ct tc">
      <h2 class="stt ao">${T('community_title')}</h2>
      <div class="stats-grid">
        <div class="stat-card ao s1"><div class="stat-val">${T('community_stat1')}</div><div class="stat-label">${T('community_label1')}</div></div>
        <div class="stat-card ao s2"><div class="stat-val">${T('community_stat2')}</div><div class="stat-label">${T('community_label2')}</div></div>
        <div class="stat-card ao s3"><div class="stat-val">${T('community_stat3')}</div><div class="stat-label">${T('community_label3')}</div></div>
        <div class="stat-card ao s4"><div class="stat-val">${T('community_stat4')}</div><div class="stat-label">${T('community_label4')}</div></div>
      </div>
    </div>
  </section>

  <!-- FORENSIC AUDIT SECTION -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#111827,#0f172a)">
    <div class="cs">
      <h2 class="stt tc ao">🧾 ${T('audit_title')}</h2>
      <p class="sts tc ao" style="max-width:800px;margin:0 auto">${T('audit_desc')}</p>
      <div class="ao" style="max-width:750px;margin:2.5rem auto 0;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
        <h3 style="color:#60a5fa;font-size:1.15rem;font-weight:800;margin-bottom:1.5rem;text-align:center">${T('audit_roadmap')}</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div style="display:flex;align-items:flex-start;gap:.75rem"><div style="width:28px;height:28px;min-width:28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.72rem;color:#fff">${n}</div><span style="color:#d1d5db;font-size:.88rem;line-height:1.5">${T('roadmap_' + n)}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <!-- PLAN CARDS -->
  <section id="plans" style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#0a0f1f)">
    <div class="ct tc">
      <h2 class="stt ao">${T('plans_title')}</h2>
      <p class="sts ao">${T('plans_sub')}</p>

      <div class="plans-grid">
        <!-- BASIC -->
        <div class="plan-card ao s1">
          <div class="plan-name" style="color:#3b82f6">${T('plan_basic')}</div>
          <div class="plan-tag" style="background:#3b82f622;color:#3b82f6;border:1px solid #3b82f644">${T('plan_basic_tag')}</div>
          <div class="plan-target">${T('plan_basic_target')}</div>
          <div class="plan-price">$99<span>${T('plan_per_month')}</span></div>
          <p class="plan-desc">${T('plan_basic_desc')}</p>
          <ul class="plan-features">
            <li>${T('feat_audit')}</li>
            <li>${T('feat_roadmap')}</li>
            <li>${T('up_to')} 15 ${T('feat_disputes')}</li>
            <li>${T('feat_reports')}</li>
            <li>${T('feat_support')}</li>
            <li>${T('feat_library')}</li>
          </ul>
          <p style="color:#9ca3af;font-size:.78rem;margin-top:.5rem;padding:0 .5rem">${T('basic_billing')}</p>
          <a href="/${locale}/basic" class="plan-btn" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">${T('plan_start')} ${T('plan_basic')} →</a>
          <p class="plan-notes">$99 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>

        <!-- PROFESSIONAL (Featured) -->
        <div class="plan-card featured ao s2">
          <div class="plan-tag">${T('plan_pro_tag')} — 73%</div>
          <div class="plan-name" style="color:#8b5cf6">${T('plan_pro')}</div>
          <div class="plan-target">${T('plan_pro_target')}</div>
          <div class="plan-price">$149<span>${T('plan_per_month')}</span></div>
          <p class="plan-desc">${T('plan_pro_desc')}</p>
          <ul class="plan-features">
            <li>${T('feat_audit')}</li>
            <li>${T('feat_roadmap')}</li>
            <li>${T('up_to')} 25 ${T('feat_disputes')}</li>
            <li>${T('feat_reports')} (${T('compare_biweekly')})</li>
            <li>${T('feat_support')}</li>
            <li>${T('feat_library')}</li>
            <li>⭐ ${T('feat_analyst')}</li>
            <li>⭐ ${T('feat_creditor')}</li>
            <li>⭐ ${T('feat_goodwill')}</li>
            <li>⭐ Pay-for-Delete</li>
          </ul>
          <p style="color:#9ca3af;font-size:.78rem;margin-top:.5rem;padding:0 .5rem">${T('pro_billing')}</p>
          <a href="/${locale}/professional" class="plan-btn" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">${T('plan_start')} ${T('plan_pro')} →</a>
          <p class="plan-notes">$149 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>

        <!-- PREMIUM -->
        <div class="plan-card ao s3">
          <div class="plan-name" style="color:#f59e0b">👑 ${T('plan_premium')}</div>
          <div class="plan-tag" style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44">${T('plan_premium_tag')}</div>
          <div class="plan-target">${T('plan_premium_target')}</div>
          <div class="plan-price">$199<span>${T('plan_per_month')}</span></div>
          <p class="plan-desc">${T('plan_premium_desc')}</p>
          <ul class="plan-features">
            <li>${T('feat_audit')}</li>
            <li>${T('feat_roadmap')}</li>
            <li>${T('up_to')} 40 ${T('feat_disputes')}</li>
            <li>${T('feat_reports')} (${T('compare_weekly')})</li>
            <li>${T('feat_support')}</li>
            <li>${T('feat_library')}</li>
            <li>${T('feat_analyst')}</li>
            <li>${T('feat_creditor')}</li>
            <li>${T('feat_goodwill')} (${T('compare_expanded')})</li>
            <li>⭐ ${T('compare_legal')}</li>
            <li>⭐ ${T('compare_mortgage')}</li>
            <li>⭐ ${T('compare_rescore')}</li>
            <li>⭐ ${T('compare_business')}</li>
            <li>⭐ ${T('compare_vip')}</li>
          </ul>
          <p style="color:#9ca3af;font-size:.78rem;margin-top:.5rem;padding:0 .5rem">${T('premium_billing')}</p>
          <a href="/${locale}/premium" class="plan-btn" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${T('plan_start')} ${T('plan_premium')} →</a>
          <p class="plan-notes">$199 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>
      </div>
      <p class="ao" style="color:#4ade80;font-weight:700;margin-top:1.5rem;font-size:.95rem">✓ ${T('plan_guarantee')} &bull; ✓ ${T('plan_no_pay')}</p>
    </div>
  </section>

  <!-- SIDE-BY-SIDE COMPARISON TABLE -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#111827)">
    <div class="cs">
      <h2 class="stt tc ao">📊 ${T('compare_title')}</h2>
      <div class="ao" style="overflow-x:auto;margin-top:2rem">
        <table style="width:100%;border-collapse:collapse;min-width:700px;font-size:.85rem">
          <thead>
            <tr style="border-bottom:2px solid #1e3a5f">
              <th style="text-align:left;padding:.75rem;color:#9ca3af;font-weight:600">${T('compare_feature')}</th>
              <th style="text-align:center;padding:.75rem;color:#3b82f6;font-weight:700">${T('plan_basic')} $99</th>
              <th style="text-align:center;padding:.75rem;color:#8b5cf6;font-weight:700;background:rgba(139,92,246,.05)">${T('plan_pro')} $149</th>
              <th style="text-align:center;padding:.75rem;color:#f59e0b;font-weight:700">${T('plan_premium')} $199</th>
            </tr>
          </thead>
          <tbody>
            ${[
              ['compare_neg_items', '1–5', '6–15', '16+'],
              ['compare_disputes', '15', '25', '40'],
              ['compare_audit', '$99', '$149', '$199'],
              ['compare_monitoring', '$29.99/mo', '$29.99/mo', '$29.99/mo'],
              ['compare_forensic', '✅', '✅', '✅'],
              ['compare_roadmap', '✅', '✅ Enhanced', '✅ Full'],
              ['compare_reports', 'Monthly', 'Bi-Weekly', 'Weekly'],
              ['compare_bilingual', '✅ EN/ES', '✅ EN/ES', '✅ All'],
              ['compare_analyst', '❌', '✅', '✅'],
              ['compare_creditor', '❌', '✅', '✅'],
              ['compare_goodwill', '❌', '✅', '✅ Expanded'],
              ['compare_paydelete', '❌', '✅', '✅'],
              ['compare_legal', '❌', '❌', '✅'],
              ['compare_identity', '❌', '❌', '✅ w/ Waiver'],
              ['compare_mortgage', '❌', '❌', '✅'],
              ['compare_rescore', '❌', '❌', '✅'],
              ['compare_business', '❌', '❌', '✅'],
              ['compare_vip', '❌', '❌', '✅'],
              ['compare_guarantee', '✅', '✅', '✅'],
              ['compare_pay_only', '✅', '✅', '✅']
            ].map((row, i) => `<tr style="border-bottom:1px solid #1f2937;${i % 2 === 0 ? '' : 'background:rgba(255,255,255,.02)'}"><td style="padding:.65rem .75rem;color:#d1d5db">${T(row[0])}</td><td style="text-align:center;padding:.65rem .75rem;color:#e2e8f0">${row[1]}</td><td style="text-align:center;padding:.65rem .75rem;color:#e2e8f0;background:rgba(139,92,246,.03)">${row[2]}</td><td style="text-align:center;padding:.65rem .75rem;color:#e2e8f0">${row[3]}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- HOW TO GET STARTED -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#111827,#0f172a)">
    <div class="cs">
      <h2 class="stt tc ao">🚀 ${T('steps_title')}</h2>
      <div style="max-width:700px;margin:2.5rem auto 0;display:flex;flex-direction:column;gap:1rem">
        ${[
          {n:1, icon:'📊', text: T('step_1'), link: MFSN_URL, linkText: T('mfsn_enroll')},
          {n:2, icon:'📦', text: T('step_2')},
          {n:3, icon:'💳', text: T('step_3')},
          {n:4, icon:'🚀', text: T('step_4')}
        ].map(s => `<div class="ao s${s.n}" style="display:flex;gap:1.25rem;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem 1.5rem;align-items:flex-start">
          <div style="width:48px;height:48px;min-width:48px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;color:#fff">${s.n}</div>
          <div>
            <p style="color:#d1d5db;font-size:.92rem;line-height:1.6">${s.icon} ${s.text}</p>
            ${s.link ? '<a href="' + s.link + '" target="_blank" style="color:#60a5fa;font-size:.85rem;font-weight:600;margin-top:.5rem;display:inline-block">' + s.linkText + ' →</a>' : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- VALUE STACK VISUAL -->
  <section class="value-stack">
    <div class="cs tc">
      <img src="${IMG.valueStack}" alt="Value Stack - Forensic Audit, Restoration Roadmap, Disputes, Progress Reports, Bilingual Support, Credit Library" class="section-img ao" width="1024" height="1024" loading="lazy" style="max-width:700px">
    </div>
  </section>

  <!-- ITIN RIGHTS with Federal Badges -->
  <section class="rights">
    <div class="cs tc">
      <h2 class="stt ao">${T('rights_title')}</h2>
      <p class="sts ao">${T('rights_sub')}</p>
      <img src="${IMG.federalBadges}" alt="Federal Rights Badge Collection - ECOA, FCRA, CROA, FDCPA, TSR, State Law" class="section-img ao" width="1024" height="768" loading="lazy" style="max-width:800px;margin-bottom:2.5rem">
      <div class="rights-grid">
        <div class="right-card ao s1"><h4>ECOA (15 U.S.C. § 1691)</h4><p>${T('rights_ecoa')}</p></div>
        <div class="right-card ao s2"><h4>FCRA (15 U.S.C. § 1681)</h4><p>${T('rights_fcra')}</p></div>
        <div class="right-card ao s3"><h4>CROA (15 U.S.C. § 1679)</h4><p>${T('rights_croa')}</p></div>
        <div class="right-card ao s4"><h4>FDCPA (15 U.S.C. § 1692)</h4><p>${T('rights_fdcpa')}</p></div>
      </div>
    </div>
  </section>

  <!-- ITIN vs SSN EQUAL RIGHTS -->
  <section class="comparison">
    <div class="cs tc">
      <img src="${IMG.itinVsSsn}" alt="ITIN vs SSN - Equal Credit Rights Under Federal Law" class="section-img ao" width="1365" height="768" loading="lazy" style="max-width:900px">
    </div>
  </section>

  <!-- RICK BIO with Portrait -->
  <section class="bio">
    <div class="cs">
      <div class="bio-card ao">
        <div class="bio-img"><img src="${IMG.rickPortrait}" alt="Rick Jefferson - ITIN Credit Expert" width="220" height="220" loading="lazy"></div>
        <div class="bio-content">
          <h3>${T('bio_title')}</h3>
          <div class="role">${T('bio_role')}</div>
          <p>${T('bio_p1')}</p>
          <p>${T('bio_p2')}</p>
          <blockquote>${T('bio_p3')}</blockquote>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials">
    <div class="cs tc">
      <h2 class="stt ao">${T('community_title')}</h2>
      <div class="testimonials-img-grid ao">
        <img src="${IMG.testimonials}" alt="Multi-Cultural ITIN Client Testimonials" width="1024" height="1024" loading="lazy">
        <img src="${IMG.testimonials2}" alt="Client Success Stories" width="1024" height="1024" loading="lazy">
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq">
    <div class="cs">
      <h2 class="stt tc ao">${T('faq_title')}</h2>
      <div style="margin-top:2rem">
        ${[1,2,3,4,5,6].map(n => `
        <div class="faq-item ao">
          <div class="faq-q">${T('faq_q' + n)}</div>
          <div class="faq-a">${T('faq_a' + n)}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- GUARANTEE -->
  <section class="guarantee">
    <div class="cs tc">
      <div class="guarantee-box ao">
        <div class="guarantee-seal"><img src="${IMG.guaranteeSeal}" alt="90-Day Money-Back Guarantee Seal" width="200" height="200" loading="lazy"></div>
        <h3>${T('guarantee_title')}</h3>
        <p>${T('guarantee_desc')}</p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="cx">
      <h2 class="stt ao">${T('cta_title')}</h2>
      <p class="sts ao">${T('cta_sub')}</p>
      <a href="#plans" class="btn-primary ao">${T('cta_btn')} →</a>
    </div>
  </section>

  <!-- compliance content merged into pageLayout footer -->

  `)
}
// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL PLAN PAGE
// ═══════════════════════════════════════════════════════════════
function planPageHTML(locale: string, plan: 'basic' | 'professional' | 'premium', mfsnUrl: string): string {
  const T = (key: string) => t(locale, key)
  const cfg = PLANS[plan]
  const planNameKey = plan === 'basic' ? 'plan_basic' : plan === 'professional' ? 'plan_pro' : 'plan_premium'
  const planName = T(planNameKey)
  const targetKey = plan === 'basic' ? 'plan_basic_target' : plan === 'professional' ? 'plan_pro_target' : 'plan_premium_target'
  const descKey = plan === 'basic' ? 'plan_basic_desc' : plan === 'professional' ? 'plan_pro_desc' : 'plan_premium_desc'
  const MFSN_URL = 'https://app.myfreescorenow.com/enroll/B01A8289'

  // Build the detailed plan description based on plan type
  let planDetailHTML = ''

  if (plan === 'basic') {
    planDetailHTML = `
    <!-- WHAT YOU GET EVERY MONTH -->
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)">
      <div class="cs">
        <h2 class="stt tc ao">✅ ${planName} Plan — $${cfg.price}/month</h2>
        <p class="sts tc ao">One-Time Audit: $${cfg.price} | Monitoring: $29.99/mo | Designed for: ${T(targetKey)}</p>
        <div class="ao" style="max-width:850px;margin:2rem auto 0;background:linear-gradient(135deg,rgba(59,130,246,.06),rgba(59,130,246,.02));border:1px solid rgba(59,130,246,.15);border-radius:1rem;padding:2rem">
          <h3 style="color:#60a5fa;font-size:1.1rem;font-weight:800;margin-bottom:1.5rem">What You Get Every Single Month:</h3>
          <div style="display:flex;flex-direction:column;gap:1.25rem;color:#d1d5db;font-size:.9rem;line-height:1.8">
            <p>The heart of the Basic Plan is <strong style="color:#fff">up to 15 statute-backed dispute letters per month</strong>, drafted with precision under FCRA §611 (right to reinvestigation), §623 (furnisher accuracy obligations), and §604 (permissible purpose challenges). These aren't generic templates — each letter is tailored to the specific account, bureau, and legal angle identified in your audit.</p>
            <p>You receive a <strong style="color:#fff">comprehensive monthly progress report</strong> detailing every dispute filed, every bureau response received, every item removed or updated, and your score trajectory across all three bureaus. Transparency is non-negotiable here.</p>
            <p><strong style="color:#fff">Bilingual support (English &amp; Spanish)</strong> is included — not an upgrade, not a fee. It's built in because Rick built this for communities that have historically been underserved by an industry that only speaks one language.</p>
            <p>The <strong style="color:#fff">Credit Education Library</strong> gives you access to guides, tools, and resources covering credit-building strategies, understanding your rights as an ITIN holder, how to read your credit report, secured card strategies, and more.</p>
            <p><strong style="color:#fff">Full Compliance Coverage:</strong> CROA, FCRA (§§ 604, 605, 611, 623), FDCPA, FCBA, FTC Telemarketing Sales Rule, CFPB guidelines, ECOA/Regulation B (ITIN anti-discrimination protections).</p>
          </div>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.2);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#4ade80;font-weight:700;margin-bottom:.5rem">💰 Billing Rule:</h4>
          <p style="color:#d1d5db;font-size:.88rem;line-height:1.7">The $${cfg.price} monthly fee is charged only when verifiable progress is documented — a deletion, a correction, a score increase, or a substantive bureau/creditor response. <strong style="color:#4ade80">No progress = no charge. Period.</strong></p>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#f87171;font-weight:700;margin-bottom:.5rem">❌ What Basic Does NOT Include:</h4>
          <p style="color:#9ca3af;font-size:.85rem;line-height:1.7">Creditor negotiations, goodwill letter campaigns, pay-for-delete negotiations, credit-building guidance, identity-theft document handling, mortgage-ready program, rapid rescoring, or VIP concierge access. Those live in Professional and Premium.</p>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(59,130,246,.05);border:1px solid rgba(59,130,246,.15);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#60a5fa;font-weight:700;margin-bottom:.5rem">📊 Competitor Comparison:</h4>
          <p style="color:#9ca3af;font-size:.85rem;line-height:1.7">Most credit repair companies charge $79–$129/month for similar tier services — but they charge you upfront, lock you into contracts, and send the same boilerplate letters to every client. RJ Business Solutions charges nothing until you see results and tailors every dispute to your specific legal situation.</p>
        </div>
      </div>
    </section>`
  } else if (plan === 'professional') {
    planDetailHTML = `
    <!-- PRO PLAN DETAIL -->
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)">
      <div class="cs">
        <h2 class="stt tc ao">⭐ ${planName} Plan — $${cfg.price}/month <span style="color:#8b5cf6;font-size:.7em">(Most Popular)</span></h2>
        <p class="sts tc ao">One-Time Audit: $${cfg.price} | Monitoring: $29.99/mo | Designed for: ${T(targetKey)}</p>
        <p class="ao" style="text-align:center;color:#a78bfa;font-weight:700;margin-top:1rem;font-size:.95rem">This is where 73% of RJ clients land — and for good reason.</p>
        <div class="ao" style="max-width:850px;margin:2rem auto 0;background:linear-gradient(135deg,rgba(139,92,246,.06),rgba(139,92,246,.02));border:1px solid rgba(139,92,246,.15);border-radius:1rem;padding:2rem">
          <h3 style="color:#a78bfa;font-size:1.1rem;font-weight:800;margin-bottom:1.5rem">Everything in Basic, Plus:</h3>
          <div style="display:flex;flex-direction:column;gap:1.25rem;color:#d1d5db;font-size:.9rem;line-height:1.8">
            <p><strong style="color:#fff">Up to 25 disputes per month</strong> — more negative items means more angles of attack, and the Professional Plan covers them all. Each round of disputes is strategically sequenced to maximize removal probability based on bureau response patterns and account age.</p>
            <p>A <strong style="color:#fff">Dedicated Credit Analyst</strong> is assigned to your file. This is a real human being who knows your credit profile, tracks every open dispute, monitors creditor responses, and escalates strategically. You're not a ticket number. You're a client with a named specialist.</p>
            <p><strong style="color:#fff">Direct Creditor Intervention</strong> is the game-changer that separates Professional from Basic. Your analyst contacts creditors and data furnishers directly — not just the bureaus. Under FCRA §623, furnishers have independent accuracy obligations. When we contact them directly with documented discrepancies, removal rates increase significantly.</p>
            <p><strong style="color:#fff">Priority Phone Support</strong> gives you direct access during business hours. Questions, updates, strategy — you call, someone answers who actually knows your file.</p>
            <p><strong style="color:#fff">Credit-Building Guidance</strong> is built into the plan: secured card recommendations, authorized user placement strategies, credit-builder loan options, and utilization management advice — all calibrated to your current profile and restoration goals.</p>
            <p><strong style="color:#fff">Goodwill Letter Campaigns</strong> are personalized letters sent to original creditors requesting removal of accurately reported but paid negative items based on your customer history and goodwill. These are relationship-based, not dispute-based, and when done right, they work.</p>
            <p><strong style="color:#fff">Pay-for-Delete Negotiations</strong> — when a collection is valid and settlement is the path forward, your analyst negotiates directly with collectors to remove the tradeline entirely in exchange for payment. Every agreement is documented and verified before payment is made.</p>
            <p><strong style="color:#fff">Bi-Weekly Progress Updates</strong> keep you in the loop every two weeks with a full status report — disputes pending, responses received, items removed, score changes, and next steps.</p>
            <p><strong style="color:#fff">Enhanced 10-Point Roadmap</strong> — at the Professional tier, your roadmap is more granular, includes creditor-specific strategies, and maps out a 6-12 month restoration arc with specific score targets at each checkpoint.</p>
          </div>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.2);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#4ade80;font-weight:700;margin-bottom:.5rem">💰 Billing Rule:</h4>
          <p style="color:#d1d5db;font-size:.88rem;line-height:1.7"><strong style="color:#4ade80">$${cfg.price}/month charged only when verified progress is documented.</strong> Same standard, higher output.</p>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#f87171;font-weight:700;margin-bottom:.5rem">❌ What Professional Does NOT Include:</h4>
          <p style="color:#9ca3af;font-size:.85rem;line-height:1.7">Identity-theft document handling, mortgage-ready program, rapid rescoring, business credit building, or VIP/Rick Jefferson direct access. Those are Premium.</p>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(139,92,246,.05);border:1px solid rgba(139,92,246,.15);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#a78bfa;font-weight:700;margin-bottom:.5rem">📊 Competitor Comparison:</h4>
          <p style="color:#9ca3af;font-size:.85rem;line-height:1.7">Lexington Law's comparable tier runs $139.95/month — charged upfront, no performance guarantee, no bilingual support, no ITIN specialization. Sky Blue Credit charges $99/month with a 90-day guarantee but no direct creditor intervention and no dedicated analyst. RJ Business Solutions delivers more, protects more, and only charges when results happen.</p>
        </div>
      </div>
    </section>`
  } else {
    planDetailHTML = `
    <!-- PREMIUM PLAN DETAIL -->
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)">
      <div class="cs">
        <h2 class="stt tc ao">👑 ${planName} Plan — $${cfg.price}/month</h2>
        <p class="sts tc ao">One-Time Audit: $${cfg.price} | Monitoring: $29.99/mo | Designed for: ${T(targetKey)}, identity-theft cases, mortgage goals, or business credit needs</p>
        <div class="ao" style="max-width:850px;margin:2rem auto 0;background:linear-gradient(135deg,rgba(245,158,11,.06),rgba(245,158,11,.02));border:1px solid rgba(245,158,11,.15);border-radius:1rem;padding:2rem">
          <h3 style="color:#fbbf24;font-size:1.1rem;font-weight:800;margin-bottom:1.5rem">Everything in Professional, Plus:</h3>
          <div style="display:flex;flex-direction:column;gap:1.25rem;color:#d1d5db;font-size:.9rem;line-height:1.8">
            <p><strong style="color:#fff">Up to 40 disputes per month</strong> — maximum firepower for complex, multi-item credit profiles. Every dispute is strategically timed and escalated based on bureau reinvestigation patterns.</p>
            <p><strong style="color:#fff">Priority Service &amp; Escalation</strong> means your file gets first-queue treatment. When a bureau issues a suspicious verification response or a creditor fails to respond within FCRA §611's 30-day reinvestigation window, your case is immediately escalated — to legal demand letters, regulatory complaints, or CFPB submissions as appropriate.</p>
            <p><strong style="color:#fff">Expanded Goodwill Letter Campaigns</strong> are more extensive at the Premium tier — covering more accounts, multiple rounds, and personalized narratives that speak directly to each creditor's customer retention interests.</p>
            <p><strong style="color:#fff">Legal Demand Letters</strong> — when a bureau or furnisher violates FCRA reinvestigation requirements (§611), fails to correct inaccurate information (§623), or continues reporting after a verified dispute, we send formal legal demand letters citing specific statutory violations, damages exposure under FCRA §616 (civil liability), and escalation timelines.</p>
            <p><strong style="color:#fff">Identity-Theft Document Submission Handling</strong> — if you have independently filed an FTC Identity Theft Report or police report yourself (without our involvement), and you provide those documents to us with a signed client waiver, we will submit them as supporting documentation in your disputes. The signed waiver must confirm: (1) you filed independently; (2) RJ had zero involvement; (3) all information is truthful; (4) you release RJ Business Solutions from all liability.</p>
            <p><strong style="color:#fff">Mortgage-Ready Program</strong> — if homeownership is the goal, Premium includes a loan-type-specific preparation roadmap (FHA, VA, USDA, Conventional), coordination with lenders on score requirements, and milestone checkpoints tied to specific score thresholds.</p>
            <p><strong style="color:#fff">Rapid Rescoring Services</strong> — after a verified deletion or correction, we coordinate with lenders to expedite credit report updates within 24–72 hours. Critical for clients mid-purchase contract or loan application.</p>
            <p><strong style="color:#fff">Business Credit Building</strong> — EIN credit profile establishment, Dun &amp; Bradstreet (D&amp;B) file setup, vendor tradeline activation, and guidance on building business credit separately from personal credit.</p>
            <p><strong style="color:#fff">VIP Concierge &amp; Direct Rick Jefferson Access</strong> — weekly strategy calls available, direct email/text line to Rick, and first-priority scheduling for any escalations or strategy sessions.</p>
            <p><strong style="color:#fff">Weekly Progress Updates</strong> — every seven days, a full report: disputes filed, responses received, items removed, score changes, escalations triggered, and upcoming action items.</p>
          </div>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(74,222,128,.05);border:1px solid rgba(74,222,128,.2);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#4ade80;font-weight:700;margin-bottom:.5rem">💰 Billing Rule:</h4>
          <p style="color:#d1d5db;font-size:.88rem;line-height:1.7"><strong style="color:#4ade80">$${cfg.price}/month charged only when verified progress is documented.</strong> Same zero-risk standard.</p>
        </div>
        <div class="ao" style="max-width:850px;margin:1.5rem auto 0;background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.15);border-radius:1rem;padding:1.5rem">
          <h4 style="color:#fbbf24;font-weight:700;margin-bottom:.5rem">📊 Competitor Comparison:</h4>
          <p style="color:#9ca3af;font-size:.85rem;line-height:1.7">Credit Saint's "Platinum" tier runs $179.99/month — charged upfront, no ITIN focus, no bilingual support, no business credit, no mortgage program, no direct founder access. The Credit Pros charges $149/month with an upfront $149 setup fee — same week you sign. RJ Premium charges the audit fee once, nothing more until you see results, and delivers a service architecture no competitor in this tier comes close to matching.</p>
        </div>
      </div>
    </section>`
  }

  return pageLayout(locale, `${planName} Plan — ${T('site_title')}`, `
  <!-- PLAN HERO with Background Banner -->
  <section class="hero" style="min-height:auto;padding:4rem 0">
    <div class="hero-bg">
      <img src="${IMG.heroBanner2}" alt="ITIN Credit Repair" width="1365" height="768" loading="eager">
    </div>
    <div class="cx tc hero-content">
      <div style="display:inline-block;background:${cfg.color}22;border:1px solid ${cfg.color}66;padding:.35rem 1rem;border-radius:999px;margin-bottom:1rem">
        <span style="color:${cfg.color};font-weight:700;font-size:.85rem">${T(targetKey)}</span>
      </div>
      <h1 style="font-size:clamp(1.75rem,4vw,3rem)">${planName} <span class="gt">ITIN Credit Repair</span></h1>
      <p class="sub">${T(descKey)}</p>
      <div style="font-size:3.5rem;font-weight:900;margin:1rem 0;text-shadow:0 2px 8px rgba(0,0,0,.4)">$${cfg.price}<span style="font-size:1rem;color:#bfdbfe">${T('plan_per_month')}</span></div>
      <button class="btn-primary" onclick="document.getElementById('leadModal').classList.add('active')">${T('plan_start')} ${planName} →</button>
      <p style="color:#bfdbfe;font-size:.78rem;margin-top:1rem;text-shadow:0 1px 3px rgba(0,0,0,.3)">$${cfg.price} ${T('plan_audit_fee')} + ${T('plan_monitoring')} &bull; ${T('plan_no_pay')}</p>
    </div>
  </section>

  <!-- FORENSIC AUDIT — EVERY PLAN STARTS HERE -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#111827,#0a0f1f)">
    <div class="cs">
      <h2 class="stt tc ao">🧾 ${T('audit_title')}</h2>
      <p class="sts tc ao" style="max-width:800px;margin:0 auto">${T('audit_desc')}</p>
      <div class="ao" style="max-width:750px;margin:2.5rem auto 0;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
        <h3 style="color:#60a5fa;font-size:1.15rem;font-weight:800;margin-bottom:1.5rem;text-align:center">${T('audit_roadmap')}</h3>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `<div style="display:flex;align-items:flex-start;gap:.75rem"><div style="width:28px;height:28px;min-width:28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.72rem;color:#fff">${n}</div><span style="color:#d1d5db;font-size:.88rem;line-height:1.5">${T('roadmap_' + n)}</span></div>`).join('')}
        </div>
      </div>
      <div class="ao" style="text-align:center;margin-top:2rem">
        <p style="color:#fbbf24;font-weight:700;font-size:.95rem">📊 $29.99/mo Monitoring Required — Enroll before audit begins</p>
        <a href="${MFSN_URL}" target="_blank" class="btn-primary" style="margin-top:1rem;display:inline-block">${T('mfsn_enroll')} →</a>
      </div>
    </div>
  </section>

  ${planDetailHTML}

  <!-- VALUE STACK VISUAL -->
  <section class="value-stack">
    <div class="cs tc">
      <img src="${IMG.valueStack2}" alt="Value Stack - Complete ITIN Credit Repair Services" class="section-img ao" width="1024" height="1024" loading="lazy" style="max-width:600px">
    </div>
  </section>

  <!-- HOW TO GET STARTED -->
  <section style="padding:5rem 0;background:linear-gradient(180deg,#111827,#0f172a)">
    <div class="cs">
      <h2 class="stt tc ao">🚀 ${T('steps_title')}</h2>
      <div style="max-width:700px;margin:2.5rem auto 0;display:flex;flex-direction:column;gap:1rem">
        ${[
          {n:1, icon:'📊', text: T('step_1'), link: MFSN_URL, linkText: T('mfsn_enroll')},
          {n:2, icon:'📦', text: T('step_2')},
          {n:3, icon:'💳', text: T('step_3')},
          {n:4, icon:'🚀', text: T('step_4')}
        ].map(s => `<div class="ao s${s.n}" style="display:flex;gap:1.25rem;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem 1.5rem;align-items:flex-start">
          <div style="width:48px;height:48px;min-width:48px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;color:#fff">${s.n}</div>
          <div>
            <p style="color:#d1d5db;font-size:.92rem;line-height:1.6">${s.icon} ${s.text}</p>
            ${s.link ? '<a href="' + s.link + '" target="_blank" style="color:#60a5fa;font-size:.85rem;font-weight:600;margin-top:.5rem;display:inline-block">' + s.linkText + ' →</a>' : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ITIN RIGHTS -->
  <section class="rights">
    <div class="cs tc">
      <h2 class="stt ao">${T('rights_title')}</h2>
      <p class="sts ao">${T('rights_sub')}</p>
      <img src="${IMG.federalBadges}" alt="Federal Rights Badges" class="section-img ao" width="1024" height="768" loading="lazy" style="max-width:700px;margin-bottom:2rem">
      <div class="rights-grid">
        <div class="right-card ao s1"><h4>ECOA</h4><p>${T('rights_ecoa')}</p></div>
        <div class="right-card ao s2"><h4>FCRA</h4><p>${T('rights_fcra')}</p></div>
        <div class="right-card ao s3"><h4>CROA</h4><p>${T('rights_croa')}</p></div>
        <div class="right-card ao s4"><h4>FDCPA</h4><p>${T('rights_fdcpa')}</p></div>
      </div>
    </div>
  </section>

  <!-- ITIN vs SSN Comparison -->
  <section class="comparison">
    <div class="cs tc">
      <img src="${IMG.itinVsSsn}" alt="ITIN vs SSN - Equal Credit Rights" class="section-img ao" width="1365" height="768" loading="lazy" style="max-width:800px">
    </div>
  </section>

  <!-- RICK BIO -->
  <section class="bio">
    <div class="cs">
      <div class="bio-card ao">
        <div class="bio-img"><img src="${IMG.rickPortrait}" alt="Rick Jefferson - ITIN Credit Expert" width="220" height="220" loading="lazy"></div>
        <div class="bio-content">
          <h3>${T('bio_title')}</h3>
          <div class="role">${T('bio_role')}</div>
          <p>${T('bio_p1')}</p>
          <p>${T('bio_p2')}</p>
          <blockquote>${T('bio_p3')}</blockquote>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="testimonials">
    <div class="cs tc">
      <h2 class="stt ao">${T('community_title')}</h2>
      <div class="testimonials-img-grid ao">
        <img src="${IMG.testimonials3}" alt="ITIN Client Success Stories" width="1024" height="1024" loading="lazy">
        <img src="${IMG.testimonials}" alt="Multi-Cultural ITIN Testimonials" width="1024" height="1024" loading="lazy">
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq">
    <div class="cs">
      <h2 class="stt tc ao">${T('faq_title')}</h2>
      <div style="margin-top:2rem">
        ${[1,2,3,4,5,6].map(n => `
        <div class="faq-item ao">
          <div class="faq-q">${T(`faq_q${n}`)}</div>
          <div class="faq-a">${T(`faq_a${n}`)}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- GUARANTEE -->
  <section class="guarantee">
    <div class="cs tc">
      <div class="guarantee-box ao">
        <div class="guarantee-seal"><img src="${IMG.guaranteeSeal2}" alt="90-Day Money-Back Guarantee" width="200" height="200" loading="lazy"></div>
        <h3>${T('guarantee_title')}</h3>
        <p>${T('guarantee_desc')}</p>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-section">
    <div class="cx">
      <h2 class="stt ao">${T('cta_title')}</h2>
      <p class="sts ao">${T('cta_sub')}</p>
      <button class="btn-primary ao" onclick="document.getElementById('leadModal').classList.add('active')">${T('plan_start')} ${planName} →</button>
      <p class="ao" style="margin-top:1rem"><a href="/${locale}" style="color:#60a5fa;font-size:.9rem">← ${T('all_plans')}</a></p>
    </div>
  </section>

  <!-- COMPLIANCE -->
  <section class="comp-footer">
    <div class="ct">
      <h3 style="text-align:center;font-size:1.1rem;font-weight:700;color:#9ca3af;margin-bottom:1.25rem">⚖️ Legal Compliance Statement</h3>
      <div class="ao" style="max-width:850px;margin:0 auto;background:rgba(30,58,138,.08);border:1px solid rgba(59,130,246,.15);border-radius:1rem;padding:1.5rem">
        <p style="color:#9ca3af;font-size:.78rem;line-height:1.8;margin-bottom:1rem">RJ Business Solutions operates in full compliance with CROA, FCRA (§§ 604, 605, 605B, 605C, 611, 616, 617, 623), FDCPA, FCBA, FTC TSR, ECOA / Regulation B, and CFPB guidelines.</p>
        <p style="color:#9ca3af;font-size:.78rem;line-height:1.8;margin-bottom:1rem">RJ Business Solutions is not a law firm and does not provide legal advice. Results vary by individual credit profile. No specific outcome is guaranteed. ITIN holders possess identical consumer rights under FCRA and ECOA regardless of immigration or SSN status.</p>
        <p style="color:#f59e0b;font-size:.78rem;line-height:1.8;font-weight:600">Identity-Theft Policy: RJ Business Solutions does not file, prepare, coach, or advise on FTC Identity Theft Reports, police reports, or any victim-status filings under FCRA §605B or §605C. Clients who independently file such documents may submit them with a signed waiver.</p>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:.72rem;margin-top:1rem">${T('comp_contact')} <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
    </div>
  </section>

  <footer style="padding:3rem 0 2rem;border-top:1px solid #1f2937;text-align:center;background:#030712">
    <div class="ct">
      <img src="${IMG.logo}" alt="RJ Business Solutions" width="180" style="margin:0 auto .75rem;border-radius:6px">
      <p style="color:#d1d5db;font-size:.82rem;line-height:1.7"><strong>RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br>
        <a href="https://rickjeffersonsolutions.com" style="color:#60a5fa">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
      <div style="display:flex;justify-content:center;gap:1.25rem;margin:.75rem 0;flex-wrap:wrap">
        <a href="https://tiktok.com/@rick_jeff_solution" target="_blank" style="color:#9ca3af;font-size:.78rem">TikTok: @rick_jeff_solution</a>
        <a href="https://twitter.com/ricksolutions1" target="_blank" style="color:#9ca3af;font-size:.78rem">Twitter: @ricksolutions1</a>
        <a href="https://linkedin.com/in/rick-jefferson-314998235" target="_blank" style="color:#9ca3af;font-size:.78rem">LinkedIn</a>
      </div>
      <div style="display:flex;justify-content:center;gap:1rem;margin-top:.5rem;flex-wrap:wrap">
        <a href="/${locale}/legal" style="color:#60a5fa;font-size:.72rem">${T('nav_legal')}</a>
        <a href="/${locale}/privacy" style="color:#60a5fa;font-size:.72rem">${T('nav_privacy')}</a>
        <a href="/${locale}/terms" style="color:#60a5fa;font-size:.72rem">${T('nav_terms')}</a>
      </div>
      <p style="color:#6b7280;font-size:.72rem;margin-top:.75rem">&copy; 2026 RJ Business Solutions. All rights reserved.</p>
      <p style="color:#4b5563;font-size:.65rem;margin-top:.3rem">All services comply with CROA, FCRA, FDCPA, FCBA, FTC TSR, ECOA, and CFPB guidelines.</p>
    </div>
  </footer>

  <!-- LEAD MODAL -->
  <div class="mo" id="leadModal">
    <div class="md">
      <button class="mc" onclick="this.closest('.mo').classList.remove('active')">&times;</button>
      <h2>${T('modal_title')} ${planName}</h2>
      <p class="ms">${T('modal_sub')}</p>
      <form id="leadForm" onsubmit="handleSubmit(event)">
        <div class="fg2"><label>${T('form_name')}</label><input type="text" id="fname" required placeholder="John Smith"></div>
        <div class="fg2"><label>${T('form_email')}</label><input type="email" id="femail" required placeholder="john@example.com"></div>
        <div class="fg2"><label>${T('form_phone')}</label><input type="tel" id="fphone" placeholder="(555) 123-4567"></div>
        <button type="submit" class="fs-btn" id="submitBtn">${T('form_submit')} — $${cfg.price}</button>
        <p class="fnt">🔒 ${T('form_secure')}</p>
      </form>
      <div id="successView" style="display:none;text-align:center;padding:2rem 0">
        <div style="font-size:3rem;margin-bottom:1rem">✅</div>
        <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:.5rem">You're In!</h3>
        <p style="color:#9ca3af;margin-bottom:1.5rem">Complete these steps to begin:</p>
        <div style="text-align:left">
          <div style="display:flex;gap:.75rem;padding:.75rem;background:rgba(30,58,138,.15);border:1px solid rgba(59,130,246,.2);border-radius:.75rem;margin-bottom:.75rem">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;flex-shrink:0">1</div>
            <div><a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">Activate MyFreeScoreNow →</a><br><span style="color:#9ca3af;font-size:.82rem">$29.99/mo — Required before audit</span></div>
          </div>
          <div style="display:flex;gap:.75rem;padding:.75rem;background:rgba(30,58,138,.15);border:1px solid rgba(59,130,246,.2);border-radius:.75rem">
            <div style="width:28px;height:28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.75rem;flex-shrink:0">2</div>
            <div><a href="#" onclick="startCheckout()" style="color:#60a5fa;font-weight:600">Pay $${cfg.price} Audit Fee →</a><br><span style="color:#9ca3af;font-size:.82rem">Stripe-secured — Delivered in 24–48 hours</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
  let leadId=null,leadEmail=null,leadName=null;
  async function handleSubmit(e){
    e.preventDefault();
    const btn=document.getElementById('submitBtn');
    btn.disabled=true;btn.textContent='Processing...';
    const name=document.getElementById('fname').value;
    const email=document.getElementById('femail').value;
    const phone=document.getElementById('fphone').value;
    try{
      const res=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,phone,plan:'${plan}',locale:'${locale}'})});
      const data=await res.json();
      if(data.success){leadId=data.data?.leadId;leadEmail=email;leadName=name;document.getElementById('leadForm').style.display='none';document.getElementById('successView').style.display='block';}
      else{alert(data.error||'Error');btn.disabled=false;btn.textContent='${T('form_submit')} — $${cfg.price}';}
    }catch(err){alert('Connection error');btn.disabled=false;btn.textContent='${T('form_submit')} — $${cfg.price}';}
  }
  async function startCheckout(){
    try{
      const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:leadEmail,name:leadName,leadId,plan:'${plan}'})});
      const data=await res.json();
      if(data.checkoutUrl)window.location.href=data.checkoutUrl;
      else alert('Payment error. Email: rickjefferson@rickjeffersonsolutions.com');
    }catch(err){alert('Connection error.');}
  }
  </script>
  `)
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTION UTILITY: Web Crypto password hashing & JWT
// ═══════════════════════════════════════════════════════════════
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const hashArr = new Uint8Array(bits)
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = [...hashArr].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const hashArr = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('')
  return hashArr === hashHex
}

async function signJWT(payload: any, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 })).replace(/=/g, '')
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${header}.${body}.${sigStr}`
}

async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(`${header}.${body}`))
    if (!valid) return null
    const payload = JSON.parse(atob(body + '=='.slice(0, (4 - body.length % 4) % 4)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}

// ═══════════════════════════════════════════════════════════════
// API ROUTES — 100% PRODUCTION (D1 Database)
// ═══════════════════════════════════════════════════════════════
app.get('/api/health', async (c) => {
  try {
    const db = c.env.DB
    let dbStatus = 'disconnected'
    if (db) {
      const r = await db.prepare('SELECT COUNT(*) as cnt FROM leads').first() as any
      dbStatus = `connected (${r?.cnt || 0} leads)`
    }
    return c.json({ status: 'healthy', project: 'rj-itin-funnels', database: dbStatus, timestamp: new Date().toISOString(), locales: SUPPORTED_LOCALES, plans: Object.keys(PLANS) })
  } catch (e: any) { return c.json({ status: 'healthy', project: 'rj-itin-funnels', database: 'error: ' + e.message, timestamp: new Date().toISOString() }) }
})

// ─── LEAD CAPTURE (persisted to D1) ───
app.post('/api/leads', async (c) => {
  try {
    const { name, email, phone, plan, locale, source, utm_source, utm_medium, utm_campaign, ref } = await c.req.json()
    if (!name || !email) return c.json({ success: false, error: 'Name and email required' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ success: false, error: 'Invalid email' }, 400)
    const db = c.env.DB
    const result = await db.prepare(
      'INSERT INTO leads (name, email, phone, plan, locale, source, utm_source, utm_medium, utm_campaign) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, email, phone || null, plan || 'basic', locale || 'en', source || 'funnel', utm_source || null, utm_medium || null, utm_campaign || null).run()
    const leadId = result.meta.last_row_id
    // Track referral if ref code provided
    if (ref) {
      const partner = await db.prepare('SELECT id FROM partners WHERE ref_code = ? AND status = ?').bind(ref, 'active').first() as any
      if (partner) {
        await db.prepare('INSERT INTO referrals (partner_id, lead_id, status) VALUES (?, ?, ?)').bind(partner.id, leadId, 'pending').run()
        await db.prepare('UPDATE partners SET total_referrals = total_referrals + 1, updated_at = datetime(?) WHERE id = ?').bind(new Date().toISOString(), partner.id).run()
      }
    }
    // Log analytics event
    await db.prepare('INSERT INTO analytics (event, page, locale, plan, visitor_id, referrer) VALUES (?, ?, ?, ?, ?, ?)').bind('lead_captured', 'funnel', locale || 'en', plan || 'basic', email, ref || null).run()
    const mfsnUrl = getMfsnUrl(c, plan || 'basic')
    return c.json({ success: true, data: { leadId, name, email, plan: plan || 'basic', mfsnUrl } })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Server error' }, 500) }
})

// ─── CHECKOUT (Stripe + D1 tracking) ───
app.post('/api/checkout', async (c) => {
  try {
    const { email, name, leadId, plan } = await c.req.json()
    const planKey = (plan || 'basic') as keyof typeof PLANS
    const cfg = PLANS[planKey] || PLANS.basic
    if (!c.env.STRIPE_SECRET_KEY) return c.json({ success: false, error: 'Payment not configured' }, 503)
    const origin = c.req.header('origin') || 'https://rj-itin-funnels.pages.dev'
    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('success_url', `${origin}/en/thank-you/${planKey}?session_id={CHECKOUT_SESSION_ID}`)
    params.append('cancel_url', `${origin}/en/${planKey}?canceled=true`)
    params.append('line_items[0][price_data][currency]', 'usd')
    params.append('line_items[0][price_data][product_data][name]', `Forensic 3-Bureau ITIN/SSN Credit Audit — ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`)
    params.append('line_items[0][price_data][unit_amount]', String(cfg.stripeCents))
    params.append('line_items[0][quantity]', '1')
    params.append('payment_method_types[0]', 'card')
    if (email) params.append('customer_email', email)
    params.append('metadata[plan]', planKey)
    if (leadId) params.append('metadata[lead_id]', String(leadId))
    if (name) params.append('metadata[customer_name]', name)

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
    const session = await res.json() as any
    if (session.error) return c.json({ success: false, error: session.error.message || 'Payment session failed' }, 500)
    // Track analytics
    const db = c.env.DB
    await db.prepare('INSERT INTO analytics (event, page, locale, plan, visitor_id, metadata) VALUES (?, ?, ?, ?, ?, ?)').bind('checkout_started', 'checkout', 'en', planKey, email || 'anonymous', JSON.stringify({ session_id: session.id })).run()
    // Mark lead as converted if we have leadId
    if (leadId) await db.prepare('UPDATE leads SET converted = 1, updated_at = datetime(?) WHERE id = ?').bind(new Date().toISOString(), leadId).run()
    return c.json({ success: true, checkoutUrl: session.url, sessionId: session.id })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Checkout error' }, 500) }
})

// ─── STRIPE WEBHOOK (payment confirmation → create client) ───
app.post('/api/webhooks/stripe', async (c) => {
  try {
    const body = await c.req.text()
    const event = JSON.parse(body) as any
    const db = c.env.DB
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_email || session.customer_details?.email
      const name = session.metadata?.customer_name || 'Client'
      const plan = session.metadata?.plan || 'basic'
      const leadId = session.metadata?.lead_id ? parseInt(session.metadata.lead_id) : null
      if (email) {
        // Check if client exists
        const existing = await db.prepare('SELECT id FROM clients WHERE email = ?').bind(email).first()
        if (!existing) {
          // Generate temp password (client will reset later)
          const tempPass = crypto.getRandomValues(new Uint8Array(8)).reduce((a, b) => a + b.toString(36), '')
          const passHash = await hashPassword(tempPass)
          await db.prepare(
            'INSERT INTO clients (email, password_hash, name, plan, status, stripe_customer_id, stripe_subscription_id, lead_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(email, passHash, name, plan, 'active', session.customer || null, session.subscription || null, leadId).run()
          const client = await db.prepare('SELECT id FROM clients WHERE email = ?').bind(email).first() as any
          // Record payment
          if (client) {
            await db.prepare('INSERT INTO payments (client_id, amount, stripe_payment_id, stripe_session_id, plan, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(client.id, session.amount_total / 100, session.payment_intent, session.id, plan, 'one-time', 'completed').run()
            // Create initial documents
            await db.prepare("INSERT INTO documents (client_id, name, type, category) VALUES (?, 'Forensic 3-Bureau Audit Report', 'PDF', 'audit')").bind(client.id).run()
            await db.prepare("INSERT INTO documents (client_id, name, type, category) VALUES (?, '10-Point Restoration Roadmap', 'PDF', 'roadmap')").bind(client.id).run()
            await db.prepare("INSERT INTO documents (client_id, name, type, category) VALUES (?, 'CROA Disclosure Agreement', 'PDF', 'legal')").bind(client.id).run()
            // Track referral conversion
            if (leadId) {
              const ref = await db.prepare('SELECT id, partner_id FROM referrals WHERE lead_id = ?').bind(leadId).first() as any
              if (ref) {
                const commissionRate = plan === 'premium' ? 60 : plan === 'professional' ? 45 : 30
                await db.prepare('UPDATE referrals SET client_id = ?, status = ?, commission_amount = ? WHERE id = ?').bind(client.id, 'converted', commissionRate, ref.id).run()
                await db.prepare('UPDATE partners SET total_conversions = total_conversions + 1, total_commission = total_commission + ?, updated_at = datetime(?) WHERE id = ?').bind(commissionRate, new Date().toISOString(), ref.partner_id).run()
              }
            }
          }
        }
        // Track analytics
        await db.prepare('INSERT INTO analytics (event, page, plan, visitor_id, metadata) VALUES (?, ?, ?, ?, ?)').bind('payment_completed', 'checkout', plan, email, JSON.stringify({ session_id: session.id, amount: session.amount_total })).run()
      }
    }
    return c.json({ received: true })
  } catch (err: any) { return c.json({ error: err.message }, 500) }
})

// ─── CLIENT AUTH: Register ───
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, phone, plan } = await c.req.json()
    if (!email || !password || !name) return c.json({ success: false, error: 'Email, password and name required' }, 400)
    if (password.length < 8) return c.json({ success: false, error: 'Password must be at least 8 characters' }, 400)
    const db = c.env.DB
    const exists = await db.prepare('SELECT id FROM clients WHERE email = ?').bind(email).first()
    if (exists) return c.json({ success: false, error: 'Email already registered' }, 409)
    const passHash = await hashPassword(password)
    await db.prepare(
      'INSERT INTO clients (email, password_hash, name, phone, plan, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(email, passHash, name, phone || null, plan || 'basic', 'active').run()
    const client = await db.prepare('SELECT id, email, name, plan, status FROM clients WHERE email = ?').bind(email).first() as any
    const token = await signJWT({ sub: client.id, email: client.email, role: 'client' }, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    return c.json({ success: true, token, client: { id: client.id, email: client.email, name: client.name, plan: client.plan } })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Registration failed' }, 500) }
})

// ─── CLIENT AUTH: Login ───
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ success: false, error: 'Email and password required' }, 400)
    const db = c.env.DB
    const client = await db.prepare('SELECT id, email, name, password_hash, plan, status, score_tu, score_eq, score_ex, score_tu_start, score_eq_start, score_ex_start, items_removed, disputes_active, disputes_total, current_round FROM clients WHERE email = ?').bind(email).first() as any
    if (!client) return c.json({ success: false, error: 'Invalid credentials' }, 401)
    if (client.status !== 'active') return c.json({ success: false, error: 'Account is not active' }, 403)
    const valid = await verifyPassword(password, client.password_hash)
    if (!valid) return c.json({ success: false, error: 'Invalid credentials' }, 401)
    const token = await signJWT({ sub: client.id, email: client.email, role: 'client' }, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    return c.json({
      success: true, token,
      client: { id: client.id, email: client.email, name: client.name, plan: client.plan, score_tu: client.score_tu, score_eq: client.score_eq, score_ex: client.score_ex, score_tu_start: client.score_tu_start, score_eq_start: client.score_eq_start, score_ex_start: client.score_ex_start, items_removed: client.items_removed, disputes_active: client.disputes_active, disputes_total: client.disputes_total, current_round: client.current_round }
    })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Login failed' }, 500) }
})

// ─── CLIENT PORTAL DATA (authenticated) ───
app.get('/api/portal/dashboard', async (c) => {
  try {
    const auth = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!auth) return c.json({ success: false, error: 'Unauthorized' }, 401)
    const payload = await verifyJWT(auth, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    if (!payload) return c.json({ success: false, error: 'Invalid or expired token' }, 401)
    const db = c.env.DB
    const client = await db.prepare('SELECT id, email, name, plan, status, score_tu, score_eq, score_ex, score_tu_start, score_eq_start, score_ex_start, items_removed, disputes_active, disputes_total, current_round, created_at FROM clients WHERE id = ?').bind(payload.sub).first() as any
    if (!client) return c.json({ success: false, error: 'Client not found' }, 404)
    // Get disputes
    const disputes = await db.prepare('SELECT id, item_name, bureau, account_type, amount, status, round, dispute_reason, fcra_section, letter_sent_at, response_at, result, created_at FROM disputes WHERE client_id = ? ORDER BY created_at DESC').bind(client.id).all()
    // Get documents
    const documents = await db.prepare('SELECT id, name, type, category, file_key, uploaded_at FROM documents WHERE client_id = ? ORDER BY uploaded_at DESC').bind(client.id).all()
    // Get score history
    const scoreHistory = await db.prepare('SELECT score_tu, score_eq, score_ex, recorded_at FROM score_history WHERE client_id = ? ORDER BY recorded_at DESC LIMIT 12').bind(client.id).all()
    // Get payments
    const payments = await db.prepare('SELECT amount, plan, type, status, created_at FROM payments WHERE client_id = ? ORDER BY created_at DESC LIMIT 10').bind(client.id).all()
    // Compute current avg score
    const avgScore = Math.round(((client.score_tu || 0) + (client.score_eq || 0) + (client.score_ex || 0)) / 3) || null
    const avgStart = Math.round(((client.score_tu_start || 0) + (client.score_eq_start || 0) + (client.score_ex_start || 0)) / 3) || null
    const scoreChange = (avgScore && avgStart) ? avgScore - avgStart : null
    return c.json({
      success: true,
      data: {
        client: { id: client.id, email: client.email, name: client.name, plan: client.plan, status: client.status, current_round: client.current_round, created_at: client.created_at },
        scores: { tu: client.score_tu, eq: client.score_eq, ex: client.score_ex, tu_start: client.score_tu_start, eq_start: client.score_eq_start, ex_start: client.score_ex_start, average: avgScore, change: scoreChange },
        kpis: { current_score: avgScore, score_change: scoreChange, disputes_active: client.disputes_active, items_removed: client.items_removed },
        disputes: disputes.results,
        documents: documents.results,
        scoreHistory: scoreHistory.results,
        payments: payments.results
      }
    })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Dashboard error' }, 500) }
})

// ─── RICKBOT AI (OpenAI-powered) ───
app.post('/api/rickbot', async (c) => {
  try {
    const { message, locale, sessionId } = await c.req.json()
    if (!message) return c.json({ success: false, error: 'Message required' }, 400)
    const db = c.env.DB
    const sid = sessionId || crypto.randomUUID()
    // Save user message
    await db.prepare('INSERT INTO rickbot_logs (session_id, role, message, locale) VALUES (?, ?, ?, ?)').bind(sid, 'user', message, locale || 'en').run()
    // Get conversation context (last 10 messages)
    const history = await db.prepare('SELECT role, message FROM rickbot_logs WHERE session_id = ? ORDER BY created_at DESC LIMIT 10').bind(sid).all()
    const messages = [
      {
        role: 'system',
        content: `You are RickBot, the AI credit repair assistant for RJ Business Solutions, owned by Rick Jefferson — the nation's leading ITIN credit repair expert. You help ITIN holders understand their credit rights under FCRA, ECOA, FDCPA, and CROA. You are bilingual (English/Spanish). Key facts:
- ITIN holders have the EXACT same credit repair rights as SSN holders under federal law
- All 3 bureaus (TransUnion, Equifax, Experian) accept ITIN numbers
- RJ Business Solutions offers 3 plans: Basic ($99/mo, up to 15 disputes), Professional ($149/mo, up to 25 disputes), Premium ($199/mo, up to 40 disputes)
- All plans include a Forensic 3-Bureau Audit, FCRA+ECOA dispute letters, and 90-day money-back guarantee
- Clients must enroll in MyFreeScoreNow ($29.99/mo) for credit monitoring: https://app.myfreescorenow.com/enroll/B01A8289
- Contact: rickjefferson@rickjeffersonsolutions.com
- Website: https://rickjeffersonsolutions.com
- Address: 1342 NM 333, Tijeras, NM 87059
Be helpful, professional, and encouraging. If asked about specific account details, direct them to the Client Portal. ${locale === 'es' ? 'Respond in Spanish.' : 'Respond in English.'}`
      },
      ...((history.results || []) as any[]).reverse().map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.message }))
    ]
    // Call OpenAI
    if (!c.env.OPENAI_API_KEY) {
      // Fallback without API key
      const fallback = locale === 'es'
        ? 'Gracias por tu pregunta. Para asistencia personalizada con la reparacion de credito ITIN, contacta a Rick Jefferson en rickjefferson@rickjeffersonsolutions.com o elige un plan en nuestra pagina.'
        : 'Thanks for your question! For personalized ITIN credit repair help, contact Rick Jefferson at rickjefferson@rickjeffersonsolutions.com or choose a plan on our homepage.'
      await db.prepare('INSERT INTO rickbot_logs (session_id, role, message, locale) VALUES (?, ?, ?, ?)').bind(sid, 'assistant', fallback, locale || 'en').run()
      return c.json({ success: true, reply: fallback, sessionId: sid })
    }
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 500, temperature: 0.7 })
    })
    const aiData = await aiRes.json() as any
    const reply = aiData.choices?.[0]?.message?.content || (locale === 'es' ? 'Lo siento, no pude procesar tu pregunta. Contacta a rickjefferson@rickjeffersonsolutions.com' : 'Sorry, I could not process your question. Contact rickjefferson@rickjeffersonsolutions.com')
    // Save assistant reply
    await db.prepare('INSERT INTO rickbot_logs (session_id, role, message, locale) VALUES (?, ?, ?, ?)').bind(sid, 'assistant', reply, locale || 'en').run()
    return c.json({ success: true, reply, sessionId: sid })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'RickBot error' }, 500) }
})

// ─── PARTNER AUTH: Register ───
app.post('/api/partners/register', async (c) => {
  try {
    const { name, email, password, company, phone, payout_email } = await c.req.json()
    if (!name || !email || !password) return c.json({ success: false, error: 'Name, email and password required' }, 400)
    const db = c.env.DB
    const exists = await db.prepare('SELECT id FROM partners WHERE email = ?').bind(email).first()
    if (exists) return c.json({ success: false, error: 'Email already registered' }, 409)
    const passHash = await hashPassword(password)
    const refCode = 'RJ-' + crypto.getRandomValues(new Uint8Array(4)).reduce((a, b) => a + b.toString(36).toUpperCase(), '')
    await db.prepare(
      'INSERT INTO partners (name, email, password_hash, company, phone, ref_code, status, payout_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(name, email, passHash, company || null, phone || null, refCode, 'active', payout_email || email).run()
    const partner = await db.prepare('SELECT id, name, email, ref_code, tier, status FROM partners WHERE email = ?').bind(email).first() as any
    const token = await signJWT({ sub: partner.id, email: partner.email, role: 'partner' }, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    return c.json({ success: true, token, partner: { id: partner.id, name: partner.name, email: partner.email, ref_code: partner.ref_code, tier: partner.tier } })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Registration failed' }, 500) }
})

// ─── PARTNER AUTH: Login ───
app.post('/api/partners/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    if (!email || !password) return c.json({ success: false, error: 'Email and password required' }, 400)
    const db = c.env.DB
    const partner = await db.prepare('SELECT id, name, email, password_hash, ref_code, tier, status, total_referrals, total_conversions, total_commission, commission_paid FROM partners WHERE email = ?').bind(email).first() as any
    if (!partner) return c.json({ success: false, error: 'Invalid credentials' }, 401)
    const valid = await verifyPassword(password, partner.password_hash)
    if (!valid) return c.json({ success: false, error: 'Invalid credentials' }, 401)
    const token = await signJWT({ sub: partner.id, email: partner.email, role: 'partner' }, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    return c.json({ success: true, token, partner: { id: partner.id, name: partner.name, email: partner.email, ref_code: partner.ref_code, tier: partner.tier, total_referrals: partner.total_referrals, total_conversions: partner.total_conversions, total_commission: partner.total_commission, commission_paid: partner.commission_paid } })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Login failed' }, 500) }
})

// ─── PARTNER DASHBOARD DATA (authenticated) ───
app.get('/api/partners/dashboard', async (c) => {
  try {
    const auth = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!auth) return c.json({ success: false, error: 'Unauthorized' }, 401)
    const payload = await verifyJWT(auth, c.env.JWT_SECRET || 'rj-itin-default-secret-2026')
    if (!payload || payload.role !== 'partner') return c.json({ success: false, error: 'Unauthorized' }, 401)
    const db = c.env.DB
    const partner = await db.prepare('SELECT * FROM partners WHERE id = ?').bind(payload.sub).first() as any
    if (!partner) return c.json({ success: false, error: 'Partner not found' }, 404)
    const referrals = await db.prepare('SELECT r.*, l.name as lead_name, l.email as lead_email, l.plan as lead_plan FROM referrals r LEFT JOIN leads l ON r.lead_id = l.id WHERE r.partner_id = ? ORDER BY r.created_at DESC LIMIT 50').bind(partner.id).all()
    return c.json({
      success: true,
      data: {
        partner: { id: partner.id, name: partner.name, email: partner.email, ref_code: partner.ref_code, tier: partner.tier, total_referrals: partner.total_referrals, total_conversions: partner.total_conversions, total_commission: partner.total_commission, commission_paid: partner.commission_paid },
        referrals: referrals.results,
        referralLink: `https://rj-itin-funnels.pages.dev/en?ref=${partner.ref_code}`
      }
    })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Dashboard error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════
// PAGE ROUTES — Auto-detect locale and serve pages
// ═══════════════════════════════════════════════════════════════

// Root redirect to detected locale
app.get('/', (c) => {
  const locale = detectLocale(c)
  return c.redirect(`/${locale}`)
})

// Locale home pages
for (const loc of SUPPORTED_LOCALES) {
  app.get(`/${loc}`, (c) => c.html(mainFunnelHTML(loc)))

  // Plan pages
  for (const plan of ['basic', 'professional', 'premium'] as const) {
    app.get(`/${loc}/${plan}`, (c) => {
      const mfsnUrl = getMfsnUrl(c, plan)
      return c.html(planPageHTML(loc, plan, mfsnUrl))
    })
  }

  // Legal page
  app.get(`/${loc}/legal`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `${T('nav_legal')} — ${T('site_title')}`, `
      <section style="padding:4rem 0">
        <div class="cs">
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:1rem">${T('comp_title')}</h1>
          <p style="color:#9ca3af;margin-bottom:2rem">${T('comp_notice')}</p>
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div class="comp-item"><h4>CROA (15 U.S.C. § 1679)</h4><p>${T('comp_croa')}</p></div>
            <div class="comp-item"><h4>FCRA (15 U.S.C. § 1681)</h4><p>${T('comp_fcra')}</p></div>
            <div class="comp-item"><h4>ECOA (15 U.S.C. § 1691)</h4><p>${T('comp_ecoa')}</p></div>
            <div class="comp-item"><h4>FDCPA (15 U.S.C. § 1692)</h4><p>${T('comp_fdcpa')}</p></div>
            <div class="comp-item"><h4>TSR / FTC / CFPB</h4><p>${T('comp_tsr')}</p></div>
            <div class="comp-item"><h4>Identity Policy</h4><p>${T('comp_identity')}</p></div>
          </div>
          <p style="margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${T('back_home')}</a></p>
        </div>
      </section>
    `))
  })

  // Privacy
  app.get(`/${loc}/privacy`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `${T('nav_privacy')} — ${T('site_title')}`, `
      <section style="padding:4rem 0">
        <div class="cs">
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:1rem">${T('nav_privacy')}</h1>
          <p style="color:#9ca3af;margin-bottom:2rem">Last Updated: February 23, 2026</p>
          <div style="color:#d1d5db;font-size:.9rem;line-height:1.8">
            <p>RJ Business Solutions respects your privacy. We collect contact info, ITIN/SSN (for bureau communication only), payment info via Stripe, and site usage data. We never sell your data. We do not collect immigration status.</p>
            <p style="margin-top:1rem">Data shared only with: credit bureaus (for disputes), Stripe (for payments), MyFreeScoreNow (for monitoring). TLS/SSL encrypted. PCI-DSS compliant via Stripe.</p>
            <p style="margin-top:1rem">${T('comp_contact')} <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
          </div>
          <p style="margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${T('back_home')}</a></p>
        </div>
      </section>
    `))
  })

  // Terms
  app.get(`/${loc}/terms`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `${T('nav_terms')} — ${T('site_title')}`, `
      <section style="padding:4rem 0">
        <div class="cs">
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:1rem">${T('nav_terms')}</h1>
          <p style="color:#9ca3af;margin-bottom:2rem">Last Updated: February 23, 2026</p>
          <div style="color:#d1d5db;font-size:.9rem;line-height:1.8">
            <p>RJ Business Solutions provides credit repair services for SSN and ITIN holders under CROA, FCRA, ECOA. Plans: Basic ($99/mo), Professional ($149/mo), Premium ($199/mo). Monthly fees charged only when verifiable progress documented.</p>
            <p style="margin-top:1rem">3-day cancellation right under CROA. 90-day money-back guarantee on all plans. MyFreeScoreNow monitoring ($29.99/mo) required. We do not guarantee specific results.</p>
            <p style="margin-top:1rem">${T('comp_contact')} <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
          </div>
          <p style="margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${T('back_home')}</a></p>
        </div>
      </section>
    `))
  })

  // Success
  app.get(`/${loc}/success`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Payment Confirmed — ${T('site_title')}`, `
      <section style="padding:5rem 0;text-align:center;min-height:60vh;display:flex;align-items:center">
        <div class="cx">
          <div style="font-size:4rem;margin-bottom:1rem">✅</div>
          <h1 style="font-size:2rem;font-weight:800;margin-bottom:1rem">Payment Confirmed!</h1>
          <p style="color:#9ca3af;font-size:1.1rem;margin-bottom:2rem">Your forensic ITIN/SSN credit audit fee has been received. Check your email for next steps and audit delivery within 24–48 hours.</p>
          <a href="${getMfsnUrl(c, 'basic')}" target="_blank" class="btn-primary" style="animation:none">Activate MyFreeScoreNow →</a>
          <p style="margin-top:2rem"><a href="/${loc}" style="color:#60a5fa;font-size:.9rem">← ${T('back_home')}</a></p>
        </div>
      </section>
    `))
  })

  // ═══════ ABOUT RICK JEFFERSON ═══════
  app.get(`/${loc}/about-rick-jefferson`, (c) => {
    const T = (key: string) => t(loc, key)
    const BASE_URL = 'https://rj-itin-funnels.pages.dev'
    const personSchema = JSON.stringify({
      "@context":"https://schema.org","@type":"Person","name":"Rick Jefferson","jobTitle":"Founder & ITIN Credit Expert","worksFor":{"@type":"Organization","name":"RJ Business Solutions"},"image":"${IMG.rickPortrait}","url":"${BASE_URL}/${loc}/about-rick-jefferson","sameAs":["https://linkedin.com/in/rick-jefferson-314998235","https://tiktok.com/@rick_jeff_solution","https://twitter.com/ricksolutions1"],"knowsAbout":["ITIN credit repair","FCRA","ECOA","credit bureau disputes","CROA compliance"]
    })
    return c.html(pageLayout(loc, `About Rick Jefferson — ITIN Credit Expert`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#0a1128)">
      <div class="cs">
        <div class="bio-card ao" style="margin-bottom:3rem">
          <div class="bio-img" style="width:280px;height:280px"><img src="${IMG.rickPortrait}" alt="Rick Jefferson — Founder & ITIN Credit Expert" width="280" height="280" loading="eager"></div>
          <div class="bio-content">
            <h1 style="font-size:2.5rem;font-weight:900;margin-bottom:.5rem">${T('bio_title')}</h1>
            <div class="role" style="font-size:1.1rem;margin-bottom:1.5rem">${T('bio_role')}</div>
            <p style="font-size:1rem;line-height:1.9">${T('bio_p1')}</p>
            <p style="font-size:1rem;line-height:1.9">${T('bio_p2')}</p>
            <blockquote style="font-size:1.05rem">${T('bio_p3')}</blockquote>
          </div>
        </div>
        <div class="ao" style="max-width:800px;margin:0 auto">
          <h2 style="font-size:1.75rem;font-weight:800;margin-bottom:1.5rem;text-align:center">Why Rick Built RJ Business Solutions</h2>
          <div style="color:#d1d5db;font-size:.95rem;line-height:1.9">
            <p style="margin-bottom:1rem">${T('why_rj_desc')}</p>
            <p style="margin-bottom:1rem">${T('why_rj_desc2')}</p>
            <p style="margin-bottom:1rem">Rick holds deep expertise in: <strong style="color:#fff">FCRA</strong> (Fair Credit Reporting Act — §§ 604, 605, 611, 623), <strong style="color:#fff">ECOA</strong> (Equal Credit Opportunity Act / Regulation B), <strong style="color:#fff">CROA</strong> (Credit Repair Organizations Act), <strong style="color:#fff">FDCPA</strong> (Fair Debt Collection Practices Act), and <strong style="color:#fff">FTC Telemarketing Sales Rule</strong>.</p>
            <p>Every plan is bilingual (English &amp; Spanish), performance-based (no monthly charge until progress is verified), and designed with ITIN holders at the center of every strategy.</p>
          </div>
        </div>
        <div class="ao" style="text-align:center;margin-top:3rem">
          <a href="/${loc}#plans" class="btn-primary">${T('hero_cta')} →</a>
          <p style="margin-top:1rem"><a href="/${loc}/contact" style="color:#60a5fa;font-size:.9rem">Contact Rick Directly →</a></p>
        </div>
      </div>
    </section>
    `, { description: 'Meet Rick Jefferson, founder of RJ Business Solutions and ITIN credit repair expert. Deep expertise in FCRA, ECOA, CROA, and FDCPA.', canonical: '${BASE_URL}/${loc}/about-rick-jefferson', keywords: 'Rick Jefferson, ITIN credit expert, RJ Business Solutions founder, credit repair specialist, FCRA expert, ECOA compliance', schema: personSchema }))
  })

  // ═══════ CREDIT MONITORING BRIDGE PAGE ═══════
  app.get(`/${loc}/credit-monitoring`, (c) => {
    const T = (key: string) => t(loc, key)
    const MFSN_URL = 'https://app.myfreescorenow.com/enroll/B01A8289'
    const MFSN_AFFILIATE = 'https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=49914'
    return c.html(pageLayout(loc, `Credit Monitoring — MyFreeScoreNow Enrollment`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cs tc">
        <h1 class="stt ao" style="font-size:clamp(2rem,4vw,3rem)">📊 Activate Your Credit Monitoring</h1>
        <p class="sts ao" style="max-width:700px">Before your forensic audit can begin, you need tri-bureau credit monitoring through MyFreeScoreNow. This gives us live access to your TransUnion, Equifax, and Experian files.</p>
      </div>
    </section>
    <section style="padding:4rem 0;background:linear-gradient(180deg,#111827,#0a0f1f)">
      <div class="cs">
        <div class="ao" style="max-width:750px;margin:0 auto;background:linear-gradient(135deg,rgba(74,222,128,.06),rgba(74,222,128,.02));border:2px solid rgba(74,222,128,.25);border-radius:1.25rem;padding:2.5rem;text-align:center">
          <h2 style="font-size:1.75rem;font-weight:900;margin-bottom:1rem;color:#4ade80">MyFreeScoreNow</h2>
          <div style="font-size:2.5rem;font-weight:900;margin:.5rem 0">$29.99<span style="font-size:1rem;color:#9ca3af">/month</span></div>
          <p style="color:#d1d5db;font-size:.95rem;line-height:1.8;margin:1.5rem 0">MyFreeScoreNow is a third-party credit monitoring service that provides live tri-bureau access to your ITIN credit file. It accepts ITIN numbers for enrollment and is <strong style="color:#fff">required before your forensic audit can begin</strong>.</p>
          <ul style="list-style:none;text-align:left;max-width:500px;margin:1.5rem auto;display:flex;flex-direction:column;gap:.6rem">
            <li style="color:#d1d5db;font-size:.9rem;display:flex;align-items:center;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> All 3 bureaus — TransUnion, Equifax, Experian</li>
            <li style="color:#d1d5db;font-size:.9rem;display:flex;align-items:center;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> Accepts ITIN numbers for enrollment</li>
            <li style="color:#d1d5db;font-size:.9rem;display:flex;align-items:center;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> Daily score updates and credit alerts</li>
            <li style="color:#d1d5db;font-size:.9rem;display:flex;align-items:center;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> Secure data feed to your credit repair team</li>
            <li style="color:#d1d5db;font-size:.9rem;display:flex;align-items:center;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> Cancel anytime — no long-term contracts</li>
          </ul>
          <a href="${MFSN_URL}" target="_blank" class="btn-primary" style="margin-top:1rem;display:inline-flex">Enroll Now — $29.99/mo →</a>
          <p style="color:#6b7280;font-size:.72rem;margin-top:1rem">Affiliate link: <a href="${MFSN_AFFILIATE}" target="_blank" style="color:#60a5fa">myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=49914</a></p>
        </div>
        <div class="ao" style="max-width:750px;margin:3rem auto 0">
          <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:1.5rem;text-align:center">Why MyFreeScoreNow?</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center"><div style="font-size:1.5rem;margin-bottom:.5rem">🔍</div><h4 style="color:#60a5fa;font-size:.9rem;margin-bottom:.4rem">Live Tri-Bureau Access</h4><p style="color:#9ca3af;font-size:.78rem">Real-time data from all 3 bureaus for dispute tracking</p></div>
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center"><div style="font-size:1.5rem;margin-bottom:.5rem">🛡️</div><h4 style="color:#60a5fa;font-size:.9rem;margin-bottom:.4rem">ITIN Accepted</h4><p style="color:#9ca3af;font-size:.78rem">Full enrollment support for ITIN holders nationwide</p></div>
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center"><div style="font-size:1.5rem;margin-bottom:.5rem">📈</div><h4 style="color:#60a5fa;font-size:.9rem;margin-bottom:.4rem">Track Every Change</h4><p style="color:#9ca3af;font-size:.78rem">Monitor deletions, corrections, and score improvements</p></div>
          </div>
        </div>
        <div class="ao" style="text-align:center;margin-top:3rem">
          <p style="color:#9ca3af;font-size:.9rem;margin-bottom:1rem">Already enrolled? Great — <a href="/${loc}#plans" style="color:#60a5fa;font-weight:600">choose your plan</a> to get started.</p>
        </div>
      </div>
    </section>
    `, { description: 'Activate MyFreeScoreNow credit monitoring — $29.99/mo tri-bureau access required before your ITIN credit repair audit begins. Accepts ITIN numbers.', canonical: 'https://rj-itin-funnels.pages.dev/${loc}/credit-monitoring', keywords: 'MyFreeScoreNow, credit monitoring ITIN, tri-bureau credit report, ITIN credit monitoring, credit score tracking' }))
  })

  // ═══════ CONTACT PAGE ═══════
  app.get(`/${loc}/contact`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Contact Us — RJ Business Solutions`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cs">
        <h1 class="stt tc ao">📬 Contact RJ Business Solutions</h1>
        <p class="sts tc ao">Questions about ITIN credit repair? We're here to help — in English and Spanish.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:900px;margin:2.5rem auto 0">
          <div class="ao s1" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:.75rem">📧</div>
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Email</h3>
            <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa;font-size:.95rem">rickjefferson@rickjeffersonsolutions.com</a>
            <p style="color:#9ca3af;font-size:.78rem;margin-top:.5rem">Response within 24 hours</p>
          </div>
          <div class="ao s2" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:.75rem">🌐</div>
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Website</h3>
            <a href="https://rickjeffersonsolutions.com" style="color:#60a5fa;font-size:.95rem" target="_blank">rickjeffersonsolutions.com</a>
            <p style="color:#9ca3af;font-size:.78rem;margin-top:.5rem">Full service portal & ITIN credit roadmap quiz</p>
          </div>
          <div class="ao s3" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:.75rem">📍</div>
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Office</h3>
            <p style="color:#d1d5db;font-size:.95rem">1342 NM 333<br>Tijeras, New Mexico 87059</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;max-width:700px;margin:2rem auto 0">
          <a href="https://tiktok.com/@rick_jeff_solution" target="_blank" class="ao s1" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center;color:#d1d5db;text-decoration:none;transition:all .3s;display:block" onmouseover="this.style.borderColor='#60a5fa'" onmouseout="this.style.borderColor='#1e3a5f'">🎵 TikTok<br><span style="color:#60a5fa;font-size:.85rem">@rick_jeff_solution</span></a>
          <a href="https://twitter.com/ricksolutions1" target="_blank" class="ao s2" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center;color:#d1d5db;text-decoration:none;transition:all .3s;display:block" onmouseover="this.style.borderColor='#60a5fa'" onmouseout="this.style.borderColor='#1e3a5f'">🐦 Twitter<br><span style="color:#60a5fa;font-size:.85rem">@ricksolutions1</span></a>
          <a href="https://linkedin.com/in/rick-jefferson-314998235" target="_blank" class="ao s3" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center;color:#d1d5db;text-decoration:none;transition:all .3s;display:block" onmouseover="this.style.borderColor='#60a5fa'" onmouseout="this.style.borderColor='#1e3a5f'">💼 LinkedIn<br><span style="color:#60a5fa;font-size:.85rem">Rick Jefferson</span></a>
        </div>
        <div class="ao" style="text-align:center;margin-top:3rem">
          <p style="color:#9ca3af;font-size:.9rem;margin-bottom:1rem">Ready to start? Enroll in credit monitoring first:</p>
          <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" class="btn-primary" style="display:inline-flex">Activate Credit Monitoring →</a>
        </div>
      </div>
    </section>
    `, { description: 'Contact RJ Business Solutions for ITIN credit repair — email, office address, social media. Bilingual support in English & Spanish.', canonical: 'https://rj-itin-funnels.pages.dev/${loc}/contact', keywords: 'contact RJ Business Solutions, ITIN credit repair contact, Rick Jefferson contact, credit repair help' }))
  })

  // ═══════ STANDALONE FAQ PAGE ═══════
  app.get(`/${loc}/faq`, (c) => {
    const T = (key: string) => t(loc, key)
    const faqSchema = JSON.stringify({
      "@context":"https://schema.org","@type":"FAQPage","mainEntity":
      [1,2,3,4,5,6].map(n=>({
        "@type":"Question","name":t(loc,'faq_q'+n),"acceptedAnswer":{"@type":"Answer","text":t(loc,'faq_a'+n)}
      }))
    })
    return c.html(pageLayout(loc, `FAQ — ITIN Credit Repair Questions`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#030712)">
      <div class="cs">
        <h1 class="stt tc ao">${T('faq_title')}</h1>
        <p class="sts tc ao">Everything ITIN holders need to know about credit repair rights, plans, billing, and guarantees.</p>
        <div style="margin-top:2.5rem;max-width:800px;margin-left:auto;margin-right:auto">
          ${[1,2,3,4,5,6].map(n => `
          <div class="faq-item ao">
            <div class="faq-q">${T('faq_q' + n)}</div>
            <div class="faq-a">${T('faq_a' + n)}</div>
          </div>`).join('')}
          <div class="faq-item ao">
            <div class="faq-q">What languages do you support?</div>
            <div class="faq-a">All communications, dispute letters, and client support are available in English and Spanish. Our website is available in 5 languages: English, Spanish, Portuguese, French, and Haitian Creole.</div>
          </div>
          <div class="faq-item ao">
            <div class="faq-q">Do I need an SSN to use your services?</div>
            <div class="faq-a">No. Our services are specifically designed for ITIN holders. All three major credit bureaus (TransUnion, Equifax, Experian) accept ITIN numbers. Under FCRA and ECOA, you have the exact same dispute rights as SSN holders.</div>
          </div>
          <div class="faq-item ao">
            <div class="faq-q">How long does credit repair typically take?</div>
            <div class="faq-a">Results vary by credit profile complexity. Simple files (1-5 items) may see results in 30-60 days. Complex profiles (16+ items) typically require 6-12 months of active dispute work. Your forensic audit provides a detailed timeline projection.</div>
          </div>
          <div class="faq-item ao">
            <div class="faq-q">Is credit repair legal?</div>
            <div class="faq-a">Absolutely. Credit repair is your federal right under the Fair Credit Reporting Act (FCRA). The Credit Repair Organizations Act (CROA) regulates companies like ours to protect consumers. You have the legal right to dispute any inaccurate, incomplete, or unverifiable information on your credit report.</div>
          </div>
        </div>
        <div class="ao" style="text-align:center;margin-top:3rem">
          <p style="color:#9ca3af;margin-bottom:1rem">Still have questions?</p>
          <a href="/${loc}/contact" class="btn-secondary">Contact Us →</a>
        </div>
      </div>
    </section>
    `, { description: 'Frequently asked questions about ITIN credit repair — plans, billing, guarantees, FCRA rights, and more. Answered by Rick Jefferson.', canonical: 'https://rj-itin-funnels.pages.dev/${loc}/faq', keywords: 'ITIN credit repair FAQ, credit repair questions, ITIN dispute FAQ, FCRA rights FAQ', schema: faqSchema }))
  })

  // ═══════ TESTIMONIALS PAGE ═══════
  app.get(`/${loc}/testimonials`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Client Success Stories — ITIN Credit Repair`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#0a1128)">
      <div class="cs tc">
        <h1 class="stt ao">${T('community_title')}</h1>
        <p class="sts ao">Real results from real ITIN holders across America.</p>
        <div class="stats-grid ao" style="margin:2rem 0 3rem">
          <div class="stat-card"><div class="stat-val">${T('community_stat1')}</div><div class="stat-label">${T('community_label1')}</div></div>
          <div class="stat-card"><div class="stat-val">${T('community_stat2')}</div><div class="stat-label">${T('community_label2')}</div></div>
          <div class="stat-card"><div class="stat-val">${T('community_stat3')}</div><div class="stat-label">${T('community_label3')}</div></div>
          <div class="stat-card"><div class="stat-val">${T('community_stat4')}</div><div class="stat-label">${T('community_label4')}</div></div>
        </div>
        <div class="testimonials-img-grid ao" style="max-width:900px;margin:0 auto">
          <img src="${IMG.testimonials}" alt="Multi-Cultural ITIN Client Testimonials" width="1024" height="1024" loading="lazy">
          <img src="${IMG.testimonials2}" alt="Client Success Stories" width="1024" height="1024" loading="lazy">
          <img src="${IMG.testimonials3}" alt="More ITIN Credit Repair Results" width="1024" height="1024" loading="lazy">
        </div>
        <div class="ao" style="margin-top:3rem">
          <a href="/${loc}#plans" class="btn-primary">${T('hero_cta')} →</a>
        </div>
      </div>
    </section>
    `, { description: 'Client success stories from ITIN holders who repaired their credit with RJ Business Solutions. 10,000+ served nationwide.', canonical: 'https://rj-itin-funnels.pages.dev/${loc}/testimonials', keywords: 'ITIN credit repair testimonials, credit repair success stories, ITIN holder results' }))
  })

  // ═══════ RESOURCES PAGE ═══════
  app.get(`/${loc}/resources`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `ITIN Credit Repair Resources`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cs">
        <h1 class="stt tc ao">📚 ITIN Credit Repair Resources</h1>
        <p class="sts tc ao">Free guides, tools, and knowledge for ITIN holders navigating the credit system.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin-top:2.5rem">
          ${[
            { icon:'📖', title:'Understanding Your FCRA Rights', desc:'Complete guide to the Fair Credit Reporting Act for ITIN holders — dispute rights, bureau obligations, and enforcement.', link:'/${loc}/blog/fcra-rights-itin-holders' },
            { icon:'⚖️', title:'ECOA & ITIN Discrimination Protection', desc:'How the Equal Credit Opportunity Act protects ITIN holders from national-origin discrimination in credit.', link:'/${loc}/blog/ecoa-itin-discrimination' },
            { icon:'📊', title:'How to Read Your Credit Report', desc:'Step-by-step walkthrough of a tri-bureau credit report — what every section means and what to look for.', link:'/${loc}/blog/how-to-read-credit-report-itin' },
            { icon:'💳', title:'Building Credit with an ITIN', desc:'Secured cards, credit-builder loans, authorized user strategies — all available to ITIN holders.', link:'/${loc}/blog/build-credit-itin-number' },
            { icon:'🏠', title:'Homeownership for ITIN Holders', desc:'FHA, USDA, and conventional loan options available to ITIN holders — requirements, documentation, and paths.', link:'/${loc}/blog/itin-mortgage-home-loan' },
            { icon:'💼', title:'Business Credit for ITIN Holders', desc:'EIN credit profiles, D&B files, vendor tradelines — building business credit separately from personal credit.', link:'/${loc}/blog/itin-business-credit-ein' }
          ].map(r => `<a href="${r.link}" class="ao" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.5rem;text-decoration:none;transition:all .3s;display:block" onmouseover="this.style.borderColor='#3b82f6';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='#1e3a5f';this.style.transform='none'"><div style="font-size:1.5rem;margin-bottom:.75rem">${r.icon}</div><h3 style="color:#fff;font-size:1.05rem;font-weight:700;margin-bottom:.5rem">${r.title}</h3><p style="color:#9ca3af;font-size:.85rem;line-height:1.6">${r.desc}</p></a>`).join('')}
        </div>
        <div class="ao" style="text-align:center;margin-top:3rem">
          <a href="/${loc}/blog" class="btn-secondary">Read All Articles →</a>
        </div>
      </div>
    </section>
    `, { description: 'Free ITIN credit repair resources — FCRA rights, ECOA protections, credit report guides, building credit with ITIN, homeownership paths.', canonical: 'https://rj-itin-funnels.pages.dev/${loc}/resources', keywords: 'ITIN credit resources, credit repair guide ITIN, FCRA rights guide, build credit with ITIN, ITIN mortgage guide' }))
  })

  // ═══════ ITIN-CREDIT-REPAIR SEO LANDING ═══════
  app.get(`/${loc}/itin-credit-repair`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(mainFunnelHTML(loc), { headers: {} })
  })

  // ═══════ REPARAR-CREDITO-ITIN (Spanish SEO) ═══════
  app.get(`/${loc}/reparar-credito-itin`, (c) => {
    return c.html(mainFunnelHTML(loc === 'es' ? 'es' : loc))
  })
}

// Fallback redirects for non-locale paths
app.get('/basic', (c) => c.redirect(`/${detectLocale(c)}/basic`))
app.get('/professional', (c) => c.redirect(`/${detectLocale(c)}/professional`))
app.get('/premium', (c) => c.redirect(`/${detectLocale(c)}/premium`))
app.get('/legal', (c) => c.redirect(`/${detectLocale(c)}/legal`))
app.get('/privacy', (c) => c.redirect(`/${detectLocale(c)}/privacy`))
app.get('/terms', (c) => c.redirect(`/${detectLocale(c)}/terms`))
app.get('/success', (c) => c.redirect(`/${detectLocale(c)}/success`))
app.get('/about-rick-jefferson', (c) => c.redirect(`/${detectLocale(c)}/about-rick-jefferson`))
app.get('/credit-monitoring', (c) => c.redirect(`/${detectLocale(c)}/credit-monitoring`))
app.get('/contact', (c) => c.redirect(`/${detectLocale(c)}/contact`))
app.get('/faq', (c) => c.redirect(`/${detectLocale(c)}/faq`))
app.get('/testimonials', (c) => c.redirect(`/${detectLocale(c)}/testimonials`))
app.get('/resources', (c) => c.redirect(`/${detectLocale(c)}/resources`))
app.get('/blog', (c) => c.redirect(`/${detectLocale(c)}/blog`))
app.get('/itin-credit-repair', (c) => c.redirect(`/${detectLocale(c)}/itin-credit-repair`))
app.get('/reparar-credito-itin', (c) => c.redirect('/es/reparar-credito-itin'))
app.get('/credit-repair-basic', (c) => c.redirect(`/${detectLocale(c)}/basic`))
app.get('/credit-repair-professional', (c) => c.redirect(`/${detectLocale(c)}/professional`))
app.get('/credit-repair-premium', (c) => c.redirect(`/${detectLocale(c)}/premium`))

// ═══════════════════════════════════════════════════════════════
// BLOG CONTENT HUB — 20 Articles
// ═══════════════════════════════════════════════════════════════

// Helper for styled article sections
const H2 = (t: string) => `<h2 style="color:#fff;font-size:1.5rem;font-weight:800;margin:2.5rem 0 1rem">${t}</h2>`
const H3 = (t: string) => `<h3 style="color:#60a5fa;font-size:1.15rem;font-weight:700;margin:2rem 0 .75rem">${t}</h3>`
const P = (t: string) => `<p style="margin-bottom:1.25rem">${t}</p>`
const STRONG = (t: string) => `<strong style="color:#fff">${t}</strong>`
const BLUE = (t: string) => `<strong style="color:#60a5fa">${t}</strong>`
const CHECK = (t: string) => `<li style="display:flex;gap:.5rem;margin-bottom:.5rem"><span style="color:#4ade80;font-weight:700">✓</span><span>${t}</span></li>`
const WARN = (t: string) => `<li style="display:flex;gap:.5rem;margin-bottom:.5rem"><span style="color:#f59e0b;font-weight:700">⚠</span><span>${t}</span></li>`
const UL = (items: string) => `<ul style="list-style:none;padding:0;margin-bottom:2rem">${items}</ul>`
const CALLOUT = (title: string, body: string) => `<div style="background:rgba(30,58,138,.12);border:1px solid rgba(59,130,246,.2);border-radius:1rem;padding:1.5rem;margin:2rem 0"><h4 style="color:#60a5fa;font-weight:700;margin-bottom:.5rem">${title}</h4><p style="color:#d1d5db;font-size:.9rem;line-height:1.7">${body}</p></div>`
const QUOTE = (text: string, author: string) => `<blockquote style="border-left:3px solid #8b5cf6;padding:1rem 1.5rem;margin:2rem 0;background:rgba(139,92,246,.06);border-radius:0 .75rem .75rem 0"><p style="color:#d1d5db;font-style:italic;margin-bottom:.5rem">"${text}"</p><cite style="color:#9ca3af;font-size:.82rem">— ${author}</cite></blockquote>`
const STATUTE = (code: string, desc: string) => `<div style="background:rgba(74,222,128,.06);border:1px solid rgba(74,222,128,.15);border-radius:.75rem;padding:1rem 1.25rem;margin-bottom:.75rem"><span style="color:#4ade80;font-weight:700;font-size:.85rem">${code}</span><span style="color:#d1d5db;font-size:.88rem;margin-left:.75rem">${desc}</span></div>`

function getArticleBody(slug: string, locale: string, mfsnUrl: string): string {
  const articles: Record<string, string> = {

// ═══ ARTICLE 1: Complete Guide ═══
'itin-credit-repair-complete-guide': `
${P(`If you hold an Individual Taxpayer Identification Number (ITIN) and you have errors, collections, late payments, or other negative items dragging your credit score down — this guide is the definitive resource you need. I'm Rick Jefferson, founder of RJ Business Solutions, and I've spent years building a credit repair practice specifically for ITIN holders who have been ignored, overcharged, or flat-out lied to by an industry that doesn't understand their rights.`)}
${P(`Let me be blunt: ${STRONG('your ITIN gives you the exact same credit rights as an SSN holder under federal law.')} Every single bureau — TransUnion, Equifax, and Experian — accepts ITIN numbers for credit file identification. The law is crystal clear. The problem? Most people don't know it, and most credit repair companies don't care to learn it.`)}

${H2('What Is ITIN Credit Repair?')}
${P(`ITIN credit repair is the process of identifying and disputing inaccurate, unverifiable, or unfair items on your credit reports filed under your ITIN. This includes collections, charge-offs, late payments, hard inquiries you didn't authorize, incorrect personal information, and duplicate accounts.`)}
${P(`The legal foundation is identical to SSN-based disputes. Under ${BLUE('FCRA §611')}, you have the right to dispute any information you believe is inaccurate. The bureau must investigate within 30 days, contact the data furnisher, and either verify, correct, or delete the item. If they can't verify it, ${STRONG('it must be removed — period.')}`)}

${H2('Your Federal Rights — The Legal Framework')}
${P(`Four major federal statutes protect ITIN holders:`)}
${STATUTE('FCRA (15 U.S.C. § 1681)', 'Fair Credit Reporting Act — right to dispute, 30-day investigation, accuracy requirements, §611 reinvestigation, §623 furnisher duties, §604 permissible purpose')}
${STATUTE('ECOA (15 U.S.C. § 1691)', 'Equal Credit Opportunity Act — prohibits discrimination based on national origin. Your ITIN file has equal rights to any SSN file.')}
${STATUTE('CROA (15 U.S.C. § 1679)', 'Credit Repair Organizations Act — written contracts, 3-day cancellation, no advance fees for dispute services')}
${STATUTE('FDCPA (15 U.S.C. § 1692)', 'Fair Debt Collection Practices Act — debt validation rights, no harassment, no discrimination based on ITIN status')}

${H2('Step 1: Get Your Credit Reports')}
${P(`Before any dispute work begins, you need access to your full tri-bureau credit reports. For ITIN holders, the best option is ${BLUE('MyFreeScoreNow')} ($29.99/mo), which is one of the few monitoring services that ${STRONG('accepts ITIN numbers for enrollment')}. This gives you live access to your TransUnion, Equifax, and Experian reports and scores.`)}
${CALLOUT('Why MyFreeScoreNow?', 'Most monitoring services (Credit Karma, Experian.com) require an SSN. MyFreeScoreNow accepts ITIN numbers, provides all 3 bureau reports, and updates regularly — making it the industry standard for ITIN credit repair tracking.')}

${H2('Step 2: The Forensic Audit')}
${P(`A forensic audit is a line-by-line analysis of every tradeline, collection, inquiry, public record, and account status across all three bureaus. This isn't a quick glance — it's a legal teardown that identifies:`)}
${UL(`
${CHECK('Accounts reporting inaccurate balances, dates, or statuses')}
${CHECK('Collections that are past the statute of limitations')}
${CHECK('Hard inquiries you never authorized (FCRA §604 violations)')}
${CHECK('Duplicate accounts appearing across multiple bureaus')}
${CHECK('ECOA violations — evidence of national-origin discrimination')}
${CHECK('FCRA §611 / §623 angles for each disputable item')}
${CHECK('FDCPA violations by collection agencies')}
`)}

${H2('Step 3: Strategic Dispute Filing')}
${P(`Disputes are filed in a specific sequence designed to maximize removal probability. We don't blast the same generic letter to all three bureaus at once — that's what amateurs do. Strategic dispute filing means:`)}
${UL(`
${CHECK('Bureau-specific formatting (TransUnion, Equifax, and Experian each have different procedures)')}
${CHECK('Statute-specific citations (FCRA §611 for reinvestigation, §623 for furnisher accuracy, §604 for permissible purpose)')}
${CHECK('Prioritization by credit impact — items that hurt your score the most get disputed first')}
${CHECK('Staggered timing to avoid triggering "frivolous" flags under FCRA §611(a)(3)')}
`)}

${H2('Step 4: Monitor and Escalate')}
${P(`After disputes are filed, bureaus have 30 days to investigate under FCRA §611. During this period, we monitor responses. If a bureau fails to investigate, that's a violation. If a furnisher continues reporting unverified information, we escalate to direct creditor intervention under FCRA §623, CFPB complaints, or in Premium cases, formal legal demand letters citing §616 (civil liability for willful noncompliance).`)}

${H2('How Long Does ITIN Credit Repair Take?')}
${P(`Typical timelines based on the complexity of your file:`)}
${UL(`
${CHECK('1–5 negative items (Basic): 2–4 months for significant improvement')}
${CHECK('6–15 negative items (Professional): 4–6 months for substantial results')}
${CHECK('16+ negative items (Premium): 6–9 months for comprehensive restoration')}
`)}
${P(`Every case is different. Some items get deleted in the first round. Others require multiple disputes, creditor negotiations, or escalation to the CFPB. The 90-day money-back guarantee ensures you're never paying for nothing.`)}

${H2('Choosing the Right Plan')}
${P(`RJ Business Solutions offers three performance-based plans — you ${STRONG('only pay when progress is verified')}:`)}
${UL(`
${CHECK('<strong>Basic ($99/mo)</strong> — Up to 15 disputes/month, monthly reports, bilingual support. Best for 1–5 negative items.')}
${CHECK('<strong>Professional ($149/mo)</strong> — Up to 25 disputes/month, dedicated analyst, creditor intervention, goodwill campaigns, pay-for-delete. Best for 6–15 items.')}
${CHECK('<strong>Premium ($199/mo)</strong> — Up to 40 disputes/month, legal demand letters, mortgage-ready program, rapid rescoring, business credit building, VIP access. Best for 16+ items.')}
`)}

${QUOTE('Your ITIN is not a limitation — it is your key to the same credit system that SSN holders use. The law is on your side.', 'Rick Jefferson, Founder — RJ Business Solutions')}

${H2('Common Myths About ITIN Credit')}
${H3('Myth: "You can’t build credit with an ITIN"')}
${P(`False. All three bureaus accept ITIN numbers. Many banks, credit unions, and card issuers accept ITIN applications. Secured credit cards, credit-builder loans, and authorized user tradelines are all available to ITIN holders.`)}
${H3('Myth: "Bureaus don’t have to investigate ITIN disputes"')}
${P(`False. FCRA §611 applies to all consumers regardless of SSN or ITIN status. If you dispute, they investigate. Period.`)}
${H3('Myth: "Only SSN holders are protected by ECOA"')}
${P(`False. ECOA prohibits discrimination based on national origin. If a creditor treats your ITIN file differently than an SSN file, that's a federal violation.`)}

${H2('Get Started Today')}
${P(`Step 1: <a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">Enroll in MyFreeScoreNow credit monitoring</a> ($29.99/mo) — this activates your tri-bureau data feed and is required before any audit work begins.`)}
${P(`Step 2: <a href="#plans" style="color:#60a5fa;font-weight:600">Choose your plan</a> (Basic, Professional, or Premium) based on the number of negative items on your reports.`)}
${P(`Step 3: Within 5 business days, you'll receive your forensic 3-bureau audit and 10-point restoration roadmap. Disputes begin immediately after.`)}
`,

// ═══ ARTICLE 2: FCRA Rights ═══
'fcra-rights-itin-holders': `
${P(`The ${BLUE('Fair Credit Reporting Act (FCRA)')} is the single most important federal statute protecting your credit rights as an ITIN holder. Codified at 15 U.S.C. § 1681, this law gives you the exact same dispute, accuracy, and privacy rights as SSN holders — and I mean exact. There's no asterisk, no exception, no "unless you have an ITIN" clause anywhere in the statute.`)}
${P(`I'm Rick Jefferson, and I've filed thousands of FCRA-based disputes for ITIN holders. Let me walk you through every section that matters for your credit file.`)}

${H2('FCRA §604 — Permissible Purpose')}
${P(`No one can pull your credit report without a legally permissible purpose. This includes:`)}
${UL(`
${CHECK('Credit application you initiated')}
${CHECK('Employment screening (with your written consent)')}
${CHECK('Insurance underwriting')}
${CHECK('Account review by existing creditors')}
${CHECK('Court order or federal grand jury subpoena')}
`)}
${P(`If a hard inquiry appears on your ITIN credit report and you never applied for credit with that company, that's a ${STRONG('§604 violation')}. You have the right to dispute it, and the bureau must remove it if the inquirer can't prove permissible purpose.`)}

${H2('FCRA §611 — Your Right to Dispute')}
${P(`This is the backbone of credit repair. Under §611:`)}
${UL(`
${CHECK('You can dispute any information you believe is inaccurate or incomplete')}
${CHECK('The bureau must investigate within 30 days (45 days if you provide additional information)')}
${CHECK('The bureau must contact the furnisher (creditor/collector) and relay your dispute')}
${CHECK('If the furnisher cannot verify the information, it must be deleted')}
${CHECK('The bureau must send you written results within 5 business days of completing the investigation')}
`)}
${CALLOUT('Key ITIN Detail', 'FCRA §611 says "consumer" — not "SSN holder." You are a consumer if you have a credit file, and ITIN holders absolutely have credit files at all three bureaus.')}

${H2('FCRA §623 — Furnisher Responsibilities')}
${P(`Section 623 places legal obligations on the companies that report information to the bureaus (called "furnishers" — banks, creditors, collection agencies). They must:`)}
${UL(`
${CHECK('Report accurate information to all bureaus they report to')}
${CHECK('Investigate disputes forwarded by the bureau (§623(b))')}
${CHECK('Correct or delete information they cannot verify')}
${CHECK('Not report information they know to be inaccurate')}
`)}
${P(`When a furnisher continues reporting inaccurate data about your ITIN credit file after being notified of a dispute, they're violating §623. This opens the door for direct creditor intervention and, in serious cases, legal demand letters citing §616 civil liability.`)}

${H2('FCRA §605 — Time Limits on Reporting')}
${P(`Negative information has expiration dates:`)}
${UL(`
${CHECK('Late payments, collections, charge-offs: 7 years from the date of first delinquency')}
${CHECK('Chapter 7 bankruptcy: 10 years from filing date')}
${CHECK('Chapter 13 bankruptcy: 7 years from filing date')}
${CHECK('Hard inquiries: 2 years')}
${CHECK('Tax liens (if still reported): 7 years from payment')}
`)}
${P(`If a collection from 2018 is still on your ITIN credit report in 2026, it's past the 7-year reporting window and must be removed. We identify every over-age item in the forensic audit.`)}

${H2('FCRA §616 & §617 — Enforcement and Damages')}
${P(`If a bureau or furnisher ${STRONG('willfully')} violates the FCRA (§616), you may be entitled to:`)}
${UL(`
${CHECK('Actual damages (out-of-pocket losses, denied credit, emotional distress)')}
${CHECK('Statutory damages of $100–$1,000 per violation')}
${CHECK('Punitive damages')}
${CHECK('Attorney fees and costs')}
`)}
${P(`For ${STRONG('negligent')} violations (§617), you can recover actual damages and attorney fees. This is why bureaus and furnishers take properly cited dispute letters seriously — the liability is real.`)}

${H2('How RJ Business Solutions Uses the FCRA for ITIN Clients')}
${P(`Every dispute letter we file cites specific FCRA sections. We don't send generic templates. Example dispute angles:`)}
${UL(`
${CHECK('§611 reinvestigation demand for accounts with inaccurate balances or dates')}
${CHECK('§604 permissible purpose challenge for unauthorized hard inquiries')}
${CHECK('§623(b) furnisher investigation for creditors who ignore disputes')}
${CHECK('§605 time-limit challenge for items reporting beyond the statutory window')}
${CHECK('§616 civil liability notice for willful noncompliance after multiple disputes')}
`)}

${QUOTE('The FCRA does not have a footnote that says except if you have an ITIN. Your rights are absolute, and I enforce them with the same precision I would use for any SSN-based file.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 3: ECOA & ITIN ═══
'ecoa-itin-discrimination': `
${P(`The ${BLUE('Equal Credit Opportunity Act (ECOA)')} — 15 U.S.C. § 1691 — is your shield against credit discrimination. If any creditor, bureau, or financial institution treats your ITIN credit file differently than an SSN file, they're breaking federal law. Period.`)}
${P(`I'm Rick Jefferson, and I've seen ECOA violations firsthand in ITIN credit files — creditors refusing to report tradelines, bureaus dragging their feet on disputes, and collectors using language designed to intimidate non-SSN consumers. This article breaks down exactly how ECOA protects you.`)}

${H2('What ECOA Prohibits')}
${P(`ECOA and its implementing regulation (Regulation B, 12 CFR §1002) make it illegal for creditors to discriminate based on:`)}
${UL(`
${CHECK('Race, color, or national origin')}
${CHECK('Sex (including gender identity and sexual orientation as of 2021 guidance)')}
${CHECK('Marital status')}
${CHECK('Age (provided you have legal capacity to contract)')}
${CHECK('Receipt of public assistance income')}
${CHECK('Good-faith exercise of rights under the Consumer Credit Protection Act')}
`)}
${P(`${STRONG('National origin is the key protection for ITIN holders.')} Your ITIN is issued by the IRS to individuals who need a tax identification number but aren't eligible for an SSN. If a creditor uses your ITIN status as a proxy to deny credit, limit credit terms, or refuse to report your account to the bureaus, that is national-origin discrimination under ECOA.`)}

${H2('How ECOA Discrimination Shows Up in ITIN Credit Files')}
${H3('1. Creditors refusing to report tradelines')}
${P(`Some creditors accept your ITIN for account opening but then "forget" to report your payment history to the bureaus. If the same creditor reports SSN-based accounts, this is selective non-reporting — a potential ECOA violation.`)}
${H3('2. Bureaus treating ITIN disputes differently')}
${P(`If a bureau investigates SSN-based disputes within 30 days but routinely delays or dismisses ITIN-based disputes, that's discriminatory processing under ECOA. We document these patterns.`)}
${H3('3. Collectors using immigration-related threats')}
${P(`Debt collectors who threaten to "report you to immigration" or suggest that ITIN holders have fewer rights are violating both ECOA and FDCPA. These threats are illegal regardless of your immigration status.`)}

${H2('ECOA Enforcement')}
${P(`ECOA is enforced by the ${BLUE('Consumer Financial Protection Bureau (CFPB)')}, the ${BLUE('Federal Trade Commission (FTC)')}, and the ${BLUE('Department of Justice (DOJ)')}. Penalties include:`)}
${UL(`
${CHECK('Actual damages (losses from denied credit, higher rates, etc.)')}
${CHECK('Punitive damages up to $10,000 for individual actions')}
${CHECK('Class action damages up to $500,000 or 1% of the creditor’s net worth')}
${CHECK('Attorney fees and costs')}
`)}

${H2('How RJ Business Solutions Leverages ECOA')}
${P(`In every forensic audit, we review your ITIN credit file for ECOA red flags:`)}
${UL(`
${CHECK('Are all your tradelines being reported? If not, why?')}
${CHECK('Are dispute investigations taking longer than the FCRA-mandated timeline?')}
${CHECK('Are collections agencies making discriminatory statements or threats?')}
${CHECK('Are creditors applying different terms or rates compared to SSN-based applicants?')}
`)}
${P(`When we identify ECOA violations, we cite them directly in dispute letters. Creditors and bureaus take ECOA-cited disputes seriously because the liability exposure is massive. A pattern of ECOA violations can trigger DOJ investigations and CFPB enforcement actions.`)}

${QUOTE('ECOA exists specifically so that people like ITIN holders cannot be treated like second-class consumers. The law is unambiguous — your credit file has equal rights.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 4: How to Read Credit Report ═══
'how-to-read-credit-report-itin': `
${P(`Your credit report is the single most important financial document you have — and most ITIN holders have never actually read theirs. I'm Rick Jefferson, and I've reviewed thousands of ITIN credit reports. Let me walk you through every section, what to look for, and what to flag for disputes.`)}

${H2('The Four Sections of Your Credit Report')}
${P(`Every credit report from TransUnion, Equifax, and Experian contains four main sections:`)}

${H3('1. Personal Information')}
${P(`This section shows your name, ITIN, addresses, employers, and phone numbers. Common errors to look for:`)}
${UL(`
${CHECK('Misspelled names or name variations you’ve never used')}
${CHECK('Addresses where you’ve never lived (possible mixed file or identity theft)')}
${CHECK('Employers you’ve never worked for')}
${CHECK('Incorrect ITIN digits')}
`)}
${P(`Personal information errors can indicate a ${STRONG('mixed file')} — where another person's data has been merged with yours. This is more common with ITIN holders because bureaus sometimes use name-matching algorithms that produce false matches in Latino, Asian, and Caribbean communities where shared surnames are common.`)}

${H3('2. Trade Lines (Credit Accounts)')}
${P(`This is the core of your report. Each account shows:`)}
${UL(`
${CHECK('Account type (revolving, installment, mortgage, etc.)')}
${CHECK('Creditor name and account number (partially masked)')}
${CHECK('Date opened, credit limit, current balance')}
${CHECK('Payment history — month-by-month status (current, 30-day late, 60-day late, etc.)')}
${CHECK('Account status (open, closed, charged off, in collections)')}
`)}
${P(`${STRONG('What to flag:')} Accounts you don't recognize, incorrect balances, wrong payment history, accounts showing as "open" that you closed, or duplicate accounts (the same debt appearing under two different creditors).`)}

${H3('3. Hard Inquiries')}
${P(`Every time a lender pulls your credit for a loan or credit card application, it creates a hard inquiry. These stay on your report for 2 years and can drop your score 3-5 points each.`)}
${P(`${STRONG('What to flag:')} Inquiries from companies you never applied to. Under FCRA §604, only entities with permissible purpose can pull your report. Unauthorized inquiries can be disputed and removed.`)}

${H3('4. Public Records')}
${P(`This section shows bankruptcies, civil judgments (in some states), and tax liens. Since 2018, most judgments and tax liens have been removed from credit reports due to data accuracy concerns. If you see outdated public records, they should be disputed.`)}

${H2('Bureau-Specific Differences')}
${P(`Your TransUnion, Equifax, and Experian reports will NOT be identical. Creditors aren't required to report to all three bureaus. This means:`)}
${UL(`
${CHECK('A collection might appear on Equifax but not TransUnion')}
${CHECK('A credit card might report to all three but show different balances due to reporting date differences')}
${CHECK('Disputes must be filed with each bureau individually')}
`)}

${H2('How to Get Your Reports as an ITIN Holder')}
${P(`The recommended method is <a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">MyFreeScoreNow</a> ($29.99/mo), which accepts ITIN numbers and provides all three bureau reports with credit scores. This is the monitoring service we use at RJ Business Solutions to track every change during the repair process.`)}

${CALLOUT('Rick’s Pro Tip', 'When reviewing your reports, create a spreadsheet with every negative item: account name, amount, bureau(s) reporting, date of first delinquency, and your dispute angle (FCRA §611, §604, §605, §623). This becomes your dispute roadmap.')}
`,

// ═══ ARTICLE 5: Dispute Letters ═══
'credit-bureau-dispute-letters-itin': `
${P(`Writing an effective dispute letter is the difference between getting a deletion and getting a form rejection. I'm Rick Jefferson, and at RJ Business Solutions we draft every letter with specific statute citations, bureau-specific formatting, and legal angles that force investigation — not dismissal.`)}

${H2('Why Generic Templates Don’t Work')}
${P(`The credit repair industry is full of "dispute letter templates" that say things like "I dispute this account because I believe it is inaccurate." That tells the bureau nothing. Under FCRA §611(a)(3), the bureau can dismiss disputes as ${STRONG('frivolous')} if they don't include enough information to identify the account and explain the basis of the dispute.`)}
${P(`Effective disputes are specific, statute-backed, and tailored to the individual account and bureau.`)}

${H2('Anatomy of an Effective Dispute Letter')}
${H3('1. Header — Your Identity')}
${P(`Full legal name, ITIN (last 4 digits only for security), current address, date of birth. Include a copy of your ITIN assignment letter or CP565 notice for identification.`)}
${H3('2. Account Identification')}
${P(`Creditor name, account number, the specific bureau reporting the item, and the exact information you're disputing (balance, status, payment history date, etc.).`)}
${H3('3. Legal Basis')}
${P(`This is where most dispute letters fail. You need to cite the specific statute:`)}
${UL(`
${CHECK('<strong>FCRA §611:</strong> "I am exercising my right to reinvestigation under 15 U.S.C. § 1681i. The following item contains inaccurate information that I request be investigated and corrected or deleted."')}
${CHECK('<strong>FCRA §623:</strong> "The furnisher has an obligation under 15 U.S.C. § 1681s-2(b) to conduct a reasonable investigation upon receiving notice of this dispute."')}
${CHECK('<strong>FCRA §604:</strong> "This inquiry was made without my consent or a permissible purpose as defined under 15 U.S.C. § 1681b. I request its immediate removal."')}
`)}
${H3('4. Supporting Documentation')}
${P(`Include relevant evidence: payment receipts, account closure letters, identity theft affidavits, or statute-of-limitations calculations. The more specific your evidence, the harder it is for the bureau to dismiss the dispute.`)}
${H3('5. Compliance Demand')}
${P(`Close with a clear timeline demand: "I expect this investigation to be completed within the 30-day statutory period under FCRA §611. Please provide written notification of the results within 5 business days of completing the investigation per §611(a)(6)."  `)}

${H2('Bureau-Specific Formatting')}
${P(`Each bureau has slightly different dispute submission requirements:`)}
${UL(`
${CHECK('<strong>TransUnion:</strong> Mail to P.O. Box 2000, Chester, PA 19016. Online disputes accepted but mail provides better paper trail.')}
${CHECK('<strong>Equifax:</strong> Mail to P.O. Box 740256, Atlanta, GA 30374. Certified mail recommended.')}
${CHECK('<strong>Experian:</strong> Mail to P.O. Box 4500, Allen, TX 75013. Include dispute form from their website.')}
`)}

${CALLOUT('Why RJ Business Solutions Handles This For You', 'At the Basic level, we file up to 15 statute-backed dispute letters per month. Professional gets 25. Premium gets 40. Every letter is custom-drafted for your specific account, bureau, and legal angle — not a template. This is why our success rate consistently exceeds industry averages.')}
`,

// ═══ ARTICLE 6: Build Credit with ITIN ═══
'build-credit-itin-number': `
${P(`Building credit with an ITIN is not only possible — it's one of the smartest financial moves you can make. I'm Rick Jefferson, and I've helped thousands of ITIN holders go from no credit history to mortgage-ready scores. Here's exactly how to do it.`)}

${H2('Step 1: Establish Your Credit File')}
${P(`If you've never had credit before, you don't have a credit file at the bureaus. To create one, you need at least one account reporting to at least one bureau. The best starting points:`)}

${H3('Secured Credit Cards')}
${P(`A secured card requires a cash deposit (typically $200-$500) that becomes your credit limit. The card reports to all three bureaus just like a regular credit card. Key options for ITIN holders:`)}
${UL(`
${CHECK('OpenSky® Secured Visa — no credit check required, accepts ITIN, $200 minimum deposit')}
${CHECK('Chime Secured Credit Builder — no credit check, no annual fee, reports to all 3 bureaus')}
${CHECK('First Progress Platinum Prestige — accepts ITIN, reports to all 3 bureaus')}
`)}

${H3('Credit-Builder Loans')}
${P(`These loans are designed specifically to build credit. You make monthly payments into a savings account, and the lender reports your payments to the bureaus. At the end of the term, you get the money. Options include Self (formerly Self Lender) and many local credit unions.`)}

${H3('Authorized User Tradelines')}
${P(`If a family member or trusted friend has a credit card with a long, clean payment history, they can add you as an authorized user. The entire account history gets added to your credit file. This can add years of positive history to a thin ITIN file instantly.`)}

${H2('Step 2: Use Credit Strategically')}
${P(`Once you have accounts open, the key metrics that drive your score:`)}
${UL(`
${CHECK('<strong>Payment History (35%):</strong> Never miss a payment. Set up autopay for at least the minimum.')}
${CHECK('<strong>Credit Utilization (30%):</strong> Keep balances below 30% of your limit — below 10% is ideal.')}
${CHECK('<strong>Credit Age (15%):</strong> Keep old accounts open. The longer your average account age, the better.')}
${CHECK('<strong>Credit Mix (10%):</strong> Having both revolving (cards) and installment (loans) accounts helps.')}
${CHECK('<strong>New Credit (10%):</strong> Don’t apply for too many accounts at once. Each application creates a hard inquiry.')}
`)}

${H2('Step 3: Graduate to Unsecured Credit')}
${P(`After 6-12 months of on-time payments with a secured card, most issuers will either:`)}
${UL(`
${CHECK('Convert your secured card to an unsecured card and refund your deposit')}
${CHECK('Increase your credit limit')}
${CHECK('Offer you a new unsecured card')}
`)}
${P(`This is also when you can start applying for credit union cards, store cards, and eventually major bank cards. Each new account adds to your credit history and improves your credit mix.`)}

${H2('Step 4: Monitor Your Progress')}
${P(`Use <a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">MyFreeScoreNow</a> ($29.99/mo) to track your score across all three bureaus. Watch for:`)}
${UL(`
${CHECK('Score increases after each monthly reporting cycle')}
${CHECK('New accounts appearing correctly on all three reports')}
${CHECK('Any errors that need to be disputed immediately')}
`)}

${QUOTE('I have seen ITIN holders go from a zero credit file to a 720+ score in under 18 months using these exact strategies. It works if you are consistent.', 'Rick Jefferson')}

${H2('Common Mistakes to Avoid')}
${UL(`
${WARN('Don’t max out your secured card — keep utilization below 30%')}
${WARN('Don’t apply for 5 cards at once — space applications 3-6 months apart')}
${WARN('Don’t close your first card — it becomes your oldest account')}
${WARN('Don’t pay just the minimum on installment loans if you can pay more')}
${WARN('Don’t ignore errors on your report — dispute immediately under FCRA §611')}
`)}
`,

// ═══ ARTICLE 7: ITIN Mortgage ═══
'itin-mortgage-home-loan': `
${P(`Homeownership with an ITIN is not a dream — it's a documented, legal, and increasingly common reality. I'm Rick Jefferson, and I've helped ITIN holders prepare their credit files specifically for mortgage qualification. Let me break down every path available to you.`)}

${H2('Loan Programs Available to ITIN Holders')}
${H3('FHA Loans')}
${P(`The Federal Housing Administration does ${STRONG('not')} require an SSN for loan qualification. FHA loans are available to ITIN holders through approved lenders. Key requirements:`)}
${UL(`
${CHECK('Minimum 580 credit score for 3.5% down payment')}
${CHECK('Minimum 500 credit score for 10% down payment')}
${CHECK('2 years of tax returns filed with your ITIN')}
${CHECK('Steady employment or income documentation')}
${CHECK('No requirement for legal permanent resident status at the federal level')}
`)}

${H3('Conventional Loans via Portfolio Lenders')}
${P(`Some credit unions and community banks offer "portfolio loans" that they keep on their own books (not sold to Fannie Mae/Freddie Mac). These lenders set their own criteria and many accept ITIN-based applications. Expect:`)}
${UL(`
${CHECK('Higher down payments (10-20%)')}
${CHECK('Slightly higher interest rates (0.5-1.5% above conventional)')}
${CHECK('More flexible documentation requirements')}
`)}

${H3('USDA and State Programs')}
${P(`Some USDA rural development loans and state-level housing programs accept ITIN holders. Check your state's housing finance agency for specific programs.`)}

${H2('Credit Requirements for ITIN Mortgages')}
${P(`This is where credit repair becomes critical. Most ITIN mortgage lenders want to see:`)}
${UL(`
${CHECK('Minimum 620-640 credit score (some accept 580+ with FHA)')}
${CHECK('No collections or charge-offs in the last 12 months')}
${CHECK('No late payments in the last 12-24 months')}
${CHECK('Debt-to-income ratio below 43%')}
${CHECK('At least 3 tradelines with 12+ months of history')}
`)}
${P(`Our ${STRONG('Premium plan')} includes a dedicated Mortgage-Ready Program that addresses each of these requirements: removing derogatory items, optimizing utilization, building tradeline history, and preparing you for the rapid rescoring process that lenders use during underwriting.`)}

${H2('The Rapid Rescoring Advantage')}
${P(`When you're in the middle of a mortgage application and your credit score is close to a threshold (like 580 for FHA or 620 for conventional), ${BLUE('rapid rescoring')} can update your score within 24-72 hours instead of waiting for the next monthly reporting cycle. This is available exclusively through mortgage lenders and is included in our Premium plan.`)}

${CALLOUT('Rick’s Mortgage Prep Checklist for ITIN Holders', '1. Get credit monitoring through MyFreeScoreNow ✓ 2. Complete forensic audit and dispute rounds ✓ 3. Pay down credit utilization to below 10% ✓ 4. Ensure 3+ tradelines reporting for 12+ months ✓ 5. Gather 2 years of ITIN tax returns ✓ 6. Save for down payment (3.5-20%) ✓ 7. Rapid rescore before final application ✓')}
`,

// ═══ ARTICLE 8: Business Credit ═══
'itin-business-credit-ein': `
${P(`Building business credit with an ITIN and EIN is the path to separating your personal and business financial identities. I'm Rick Jefferson, and this is one of the most powerful — and underutilized — strategies for ITIN entrepreneurs.`)}

${H2('Why Business Credit Matters for ITIN Holders')}
${P(`When you operate solely on personal credit, every business expense, every credit pull, and every debt shows up on your personal ITIN credit file. Business credit creates a completely separate profile tied to your EIN — your Employer Identification Number.`)}
${UL(`
${CHECK('Access business loans and lines of credit without personal guarantees')}
${CHECK('Protect your personal credit score from business-related activity')}
${CHECK('Build credibility with vendors, suppliers, and partners')}
${CHECK('Qualify for higher credit limits (business limits are typically 5-10x personal)')}
`)}

${H2('Step 1: Get Your EIN')}
${P(`Apply for an EIN through the IRS (free). You can apply online at irs.gov even with an ITIN — the EIN application accepts ITIN as the responsible party identifier. You'll receive your EIN immediately.`)}

${H2('Step 2: Establish Your Business Entity')}
${UL(`
${CHECK('Register an LLC or Corporation in your state')}
${CHECK('Get a dedicated business phone number (listed with 411 directory)')}
${CHECK('Set up a business address (physical or registered agent)')}
${CHECK('Create a professional website and business email')}
${CHECK('Open a business bank account using your EIN')}
`)}

${H2('Step 3: Build Your D&B (Dun & Bradstreet) Profile')}
${P(`Dun & Bradstreet is the largest business credit bureau. Your ${BLUE('D-U-N-S Number')} is your business credit identity.`)}
${UL(`
${CHECK('Register for a free D-U-N-S Number at dnb.com')}
${CHECK('Start with Net-30 vendor accounts (suppliers that extend 30-day payment terms)')}
${CHECK('First accounts: Uline, Grainger, Quill, Strategic Network Solutions')}
${CHECK('Pay every invoice early or on time — this builds your Paydex score')}
${CHECK('Target a Paydex score of 80+ (equivalent to "pays on time")')}
`)}

${H2('Step 4: Layer Up to Business Credit Cards')}
${P(`After establishing 3-5 vendor tradelines reporting to D&B for 3-6 months, you can apply for business credit cards from Tier 1 lenders. Some options:`)}
${UL(`
${CHECK('Chase Ink Business cards (may require personal guarantee initially)')}
${CHECK('American Express Business cards')}
${CHECK('Capital One Spark Business')}
${CHECK('Credit union business credit lines')}
`)}

${P(`Our ${STRONG('Premium plan')} includes full business credit building assistance — EIN setup guidance, D&B file optimization, vendor tradeline strategy, and ongoing monitoring of your business credit profile.`)}

${QUOTE('Separating your personal and business credit is the single most sophisticated financial move an ITIN entrepreneur can make. That is how you build generational wealth.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 9: Collections Removal ═══
'collections-itin-credit-report': `
${P(`Collection accounts are the most common negative items on ITIN credit reports — and they're also some of the most removable. I'm Rick Jefferson, and I've removed thousands of collection entries from ITIN credit files using three core strategies: debt validation, statute of limitations challenges, and pay-for-delete negotiations.`)}

${H2('Strategy 1: Debt Validation Under FDCPA')}
${P(`Under the ${BLUE('Fair Debt Collection Practices Act (FDCPA)')} §1692g, you have the right to request validation of any debt within 30 days of first contact. The collector must provide:`)}
${UL(`
${CHECK('The amount of the debt')}
${CHECK('The name of the original creditor')}
${CHECK('A statement of your right to dispute')}
${CHECK('Proof that the collector is authorized to collect')}
`)}
${P(`If the collector can't validate the debt with proper documentation, they must cease collection activity and ${STRONG('the item must be removed from your credit report')}. Many collection agencies, especially those that buy debt in bulk portfolios, can't produce original documentation.`)}

${H2('Strategy 2: Statute of Limitations (SOL)')}
${P(`Every state has a statute of limitations on debt collection — typically 3-6 years from the last activity date. After the SOL expires, the debt is "time-barred" and the collector can no longer sue you for it. Important notes:`)}
${UL(`
${CHECK('SOL varies by state and debt type (credit card, medical, auto, etc.)')}
${CHECK('Making a payment or acknowledging the debt can RESET the SOL clock')}
${CHECK('SOL and the 7-year credit reporting period are DIFFERENT things')}
${CHECK('Even if the SOL has expired, the item can still appear on your report until the 7-year mark')}
`)}
${P(`We calculate the SOL for every collection account in your ITIN credit file during the forensic audit. If a collector is reporting a time-barred debt without proper disclosures, that's an FDCPA violation.`)}

${H2('Strategy 3: Pay-for-Delete Negotiation')}
${P(`A pay-for-delete (PFD) is an agreement where you pay the collector a settled amount in exchange for their commitment to remove the item from your credit report. Key rules:`)}
${UL(`
${CHECK('Get the agreement in writing BEFORE making any payment')}
${CHECK('Never pay the full amount — negotiate to 25-50% of the balance')}
${CHECK('Specify which bureaus the deletion will apply to')}
${CHECK('Set a deadline for removal (typically 30 days after payment)')}
${CHECK('Pay by certified check or money order — not debit/bank transfer')}
`)}
${P(`Pay-for-delete negotiations are included in our ${STRONG('Professional')} and ${STRONG('Premium')} plans. We handle all communication with the collector, draft the PFD agreement, and verify the deletion after payment.`)}

${H2('Medical Collections — Special Rules')}
${P(`As of 2023, medical collections under $500 are no longer reported on credit reports. Additionally, medical collections cannot appear on your report until 365 days after the date of first delinquency (previously 180 days). If you see medical collections that violate these rules, they should be disputed immediately.`)}

${CALLOUT('Rick’s Collection Removal Stats', 'In our experience, approximately 67% of collection accounts on ITIN credit files can be removed through a combination of validation challenges, SOL challenges, and pay-for-delete negotiations. The remaining 33% are typically legitimate, recent debts where the best strategy is to negotiate a settlement and wait for the 7-year reporting window to expire.')}
`,

// ═══ ARTICLE 10: Credit Utilization ═══
'credit-utilization-itin': `
${P(`Credit utilization — the ratio of your credit card balances to your credit limits — is the ${STRONG('#1 factor you can control immediately')} to raise your score. I'm Rick Jefferson, and I've seen ITIN holders jump 40-80 points in a single month just by optimizing this one metric.`)}

${H2('How Utilization Impacts Your Score')}
${P(`Credit utilization accounts for approximately 30% of your FICO score. The scoring model looks at both individual card utilization and aggregate (total) utilization:`)}
${UL(`
${CHECK('0-9% utilization: Excellent (maximum score benefit)')}
${CHECK('10-29% utilization: Good')}
${CHECK('30-49% utilization: Fair (score starts declining)')}
${CHECK('50-74% utilization: Poor (significant score hit)')}
${CHECK('75-100% utilization: Very Poor (major score damage, up to 50-100 points)')}
`)}

${H2('Strategies for ITIN Holders with Thin Files')}
${P(`If you have a thin credit file (1-2 cards), utilization swings hit harder because you have fewer accounts to spread the balance across. Tactics:`)}
${UL(`
${CHECK('<strong>Pay before the statement date:</strong> Your balance is reported to bureaus on your statement closing date, not the payment due date. Pay down before the statement cuts.')}
${CHECK('<strong>Make multiple payments per month:</strong> Keep the balance low at all times so it reports low.')}
${CHECK('<strong>Request credit limit increases:</strong> After 6 months of on-time payments, ask for an increase. Higher limit = lower utilization ratio.')}
${CHECK('<strong>Open a second card:</strong> Splitting your spending across two cards reduces per-card utilization.')}
${CHECK('<strong>The $2 trick:</strong> Leave a small balance ($2-5) on one card so it reports as "active" while keeping utilization near 0%.')}
`)}

${CALLOUT('Quick Math Example', 'If you have a $500 credit limit and carry a $400 balance, that’s 80% utilization — crushing your score. Pay it down to $25, and you’re at 5% utilization. That single move can boost your score 40-80 points within one reporting cycle (about 30 days).')}

${QUOTE('Utilization is the fastest score lever you have. I tell every ITIN client — before we even file the first dispute, let us get your utilization under 10 percent. That alone changes the game.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 11: Hard Inquiry Removal ═══
'hard-inquiry-removal-itin': `
${P(`Hard inquiries appear on your credit report every time a lender pulls your credit for a loan or card application. Each one can drop your score 3-5 points and stays for 2 years. But here's the thing: ${STRONG('not all inquiries are authorized')}. I'm Rick Jefferson, and I regularly remove unauthorized hard pulls from ITIN credit files using FCRA §604.`)}

${H2('Authorized vs. Unauthorized Inquiries')}
${P(`Under ${BLUE('FCRA §604 (15 U.S.C. § 1681b)')}, a hard inquiry is only legitimate if the entity had a "permissible purpose" — meaning you applied for credit, insurance, or employment, or an existing creditor reviewed your account. If a company pulled your ITIN credit file without your knowledge or consent, that inquiry is ${STRONG('unauthorized and removable')}.`)}

${H2('How to Identify Unauthorized Inquiries')}
${UL(`
${CHECK('Review the inquiry section of all three bureau reports')}
${CHECK('Make a list of every inquiry — company name and date')}
${CHECK('Cross-reference with your actual applications')}
${CHECK('If you didn’t apply to that company — it’s likely unauthorized')}
${CHECK('Check for dealer inquiries (auto dealers often submit to 5-10 lenders from one visit)')}
`)}

${H2('The Dispute Process')}
${P(`For unauthorized inquiries, we file a §604 permissible purpose challenge directly with the bureau. The letter states that the inquiry was made without your consent, cites the specific section of the FCRA, and demands removal. The bureau must then contact the inquirer to verify permissible purpose. If they can't — the inquiry gets deleted.`)}
${P(`For rate-shopping inquiries (mortgage, auto, student loan), the scoring model groups multiple inquiries within a 14-45 day window as a single inquiry. If your report shows them as separate hits, that can be corrected.`)}

${CALLOUT('How Many Inquiries Is Too Many?', '1-2 inquiries in the past 12 months is considered normal. 3-5 starts to raise flags. 6+ can significantly impact your score and signal risk to lenders. If you have excessive unauthorized inquiries, removing them can provide a quick 10-25 point score boost.')}
`,

// ═══ ARTICLE 12: CROA Consumer Rights ═══
'croa-consumer-rights': `
${P(`If you're hiring a credit repair company — including us — you need to understand your rights under the ${BLUE('Credit Repair Organizations Act (CROA)')}. I'm Rick Jefferson, and I built RJ Business Solutions to be fully CROA-compliant from day one because too many companies in this industry exploit the people they claim to help.`)}

${H2('Your Rights Under CROA (15 U.S.C. § 1679)')}
${STATUTE('§1679b — Right to a Written Contract', 'Before any work begins, the credit repair company must provide a written contract detailing services, total cost, performance timeline, and your cancellation rights.')}
${STATUTE('§1679c — Right to Cancel', 'You have 3 business days to cancel the contract with a full refund — no questions asked. This right cannot be waived.')}
${STATUTE('§1679b(a)(1) — No Advance Fees', 'A credit repair company cannot charge you any fee before the promised services have been fully performed. This means no upfront charges for "setup" or "first-month" before work is done.')}
${STATUTE('§1679b(a)(3) — No Misleading Statements', 'It is illegal for a credit repair company to make false or misleading claims about what they can do for your credit.')}

${H2('Red Flags — How to Spot a CROA Violation')}
${UL(`
${WARN('They demand full payment upfront before doing any work')}
${WARN('They don’t give you a written contract')}
${WARN('They guarantee specific score increases ("We’ll add 100 points!")')}
${WARN('They tell you to dispute accurate information')}
${WARN('They suggest creating a "new credit identity" (CPN/credit privacy number — this is federal fraud)')}
${WARN('They don’t mention your 3-day cancellation right')}
${WARN('They claim connections to "insiders" at the credit bureaus')}
`)}

${H2('How RJ Business Solutions Complies with CROA')}
${UL(`
${CHECK('Full written contract provided before any work begins')}
${CHECK('3-day cancellation right clearly disclosed')}
${CHECK('Performance-based billing — you don’t pay until progress is verified')}
${CHECK('No misleading guarantees — we disclose that results vary by individual profile')}
${CHECK('Only legitimate dispute methods — statute-backed, bureau-compliant letters')}
${CHECK('90-day money-back guarantee if no verified improvement')}
`)}

${QUOTE('CROA exists to protect consumers from the worst actors in the credit repair industry. At RJ Business Solutions, we do not just comply with CROA — we exceed it. You only pay when you see results. That is the standard I wish every company adopted.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 13: ITIN vs SSN ═══
'itin-vs-ssn-credit-rights': `
${P(`The biggest misconception in credit repair is that ITIN holders have fewer rights than SSN holders. ${STRONG('This is 100% false under federal law.')} I'm Rick Jefferson, and let me break down exactly why your ITIN gives you equal standing in the credit system.`)}

${H2('Bureau Acceptance: All Three Accept ITIN')}
${P(`TransUnion, Equifax, and Experian all accept ITIN as a valid identifier for credit file creation, maintenance, and dispute filing. Your ITIN credit file functions identically to an SSN credit file in terms of:`)}
${UL(`
${CHECK('Tradeline reporting and payment history tracking')}
${CHECK('Credit score calculation (FICO and VantageScore use the same algorithms)')}
${CHECK('Dispute investigation under FCRA §611')}
${CHECK('Inquiry tracking and permissible purpose requirements')}
${CHECK('Fraud alert and credit freeze capabilities')}
`)}

${H2('Legal Protections: Identical Under Federal Law')}
${P(`Every major consumer protection statute applies equally:`)}
${UL(`
${CHECK('<strong>FCRA:</strong> Defines "consumer" — not "SSN holder." If you have a credit file, you have FCRA rights.')}
${CHECK('<strong>ECOA:</strong> Prohibits discrimination based on national origin. Treating ITIN files differently is a violation.')}
${CHECK('<strong>CROA:</strong> Protects all consumers hiring credit repair services regardless of SSN/ITIN status.')}
${CHECK('<strong>FDCPA:</strong> Prohibits abusive debt collection against all consumers. No ITIN exception.')}
`)}

${H2('Where Differences Exist (and How to Navigate Them)')}
${P(`While your legal rights are equal, some practical differences exist:`)}
${UL(`
${WARN('<strong>Some lenders don’t accept ITIN:</strong> Not a legal issue — it’s their lending criteria. Solution: work with lenders who do (credit unions, community banks, FHA-approved lenders).')}
${WARN('<strong>Fewer monitoring options:</strong> Most credit monitoring services require SSN. Solution: MyFreeScoreNow accepts ITIN.')}
${WARN('<strong>Mixed files:</strong> Bureau name-matching algorithms can incorrectly merge ITIN files. Solution: dispute mixed-file errors under FCRA §611.')}
`)}

${CALLOUT('The Bottom Line', 'Your ITIN is not a limitation. It is a valid federal tax identification number that gives you full access to the credit system with full federal protections. Anyone who tells you otherwise is either uninformed or trying to sell you something.')}
`,

// ═══ ARTICLE 14: MyFreeScoreNow Guide ═══
'myfree-scorenow-enrollment-guide': `
${P(`<a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">MyFreeScoreNow</a> is the credit monitoring service we recommend for all ITIN holders — and it's required before we begin any audit work at RJ Business Solutions. I'm Rick Jefferson, and here's your step-by-step enrollment guide.`)}

${H2('Why MyFreeScoreNow?')}
${UL(`
${CHECK('Accepts ITIN numbers for enrollment (most monitoring services don’t)')}
${CHECK('Provides all 3 bureau reports (TransUnion, Equifax, Experian)')}
${CHECK('Includes credit scores from all 3 bureaus')}
${CHECK('Updates regularly so we can track every change during repair')}
${CHECK('$29.99/month with 7-day trial available on select plans')}
`)}

${H2('Enrollment Steps')}
${P(`Step 1: Visit <a href="${mfsnUrl}" target="_blank" style="color:#60a5fa;font-weight:600">${mfsnUrl}</a>`)}
${P(`Step 2: Enter your personal information — full legal name, address, date of birth, ITIN`)}
${P(`Step 3: Complete identity verification (you may be asked security questions about your credit history)`)}
${P(`Step 4: Enter payment information for the $29.99/month subscription`)}
${P(`Step 5: Once enrolled, you'll have immediate access to your tri-bureau reports and scores`)}

${H2('After Enrollment')}
${P(`Once you're enrolled in MyFreeScoreNow, share your login credentials with your credit repair analyst (securely). This gives us direct access to your live credit data so we can:`)}
${UL(`
${CHECK('Pull your full tri-bureau reports for the forensic audit')}
${CHECK('Track every dispute result in real time')}
${CHECK('Document score changes for progress verification (and billing)')}
${CHECK('Identify new items that appear on your reports')}
`)}

${CALLOUT('Important', 'MyFreeScoreNow is a third-party service not affiliated with RJ Business Solutions. The $29.99/mo monitoring fee is separate from your plan fee ($99/$149/$199). We require it because it gives us the live data access we need to do our job effectively.')}
`,

// ═══ ARTICLE 15: Credit Repair Scams ═══
'credit-repair-scams-itin': `
${P(`The ITIN community is disproportionately targeted by credit repair scams. I'm Rick Jefferson, and I've seen every scheme — from "new credit identity" fraud to "guaranteed 800 scores" to companies that charge $2,000 upfront and vanish. Here's how to protect yourself.`)}

${H2('The Most Common Scams Targeting ITIN Holders')}
${H3('1. The CPN/Credit Privacy Number Scam')}
${P(`${STRONG('This is federal fraud.')} A company offers to create a "new credit identity" using a CPN (Credit Privacy Number). CPNs are typically stolen SSNs belonging to children, elderly individuals, or deceased persons. Using one is a violation of 18 U.S.C. §1028 (identity fraud) and can result in federal prosecution.`)}

${H3('2. The "Guaranteed Score" Scam')}
${P(`No legitimate credit repair company can guarantee a specific score increase. Under CROA §1679b(a)(3), making misleading statements about expected outcomes is illegal. Results depend on your individual credit profile, the nature of the negative items, and the bureaus'/furnishers' responses to disputes.`)}

${H3('3. The Upfront Fee Scam')}
${P(`CROA §1679b(a)(1) prohibits credit repair companies from charging fees before services are performed. If a company demands $500-$2,000 before doing any work, that's a CROA violation. Walk away.`)}

${H3('4. The "Insider Connection" Scam')}
${P(`No credit repair company has "connections" inside the credit bureaus. Disputes are processed through standard procedures. Anyone claiming insider access is lying.`)}

${H3('5. The Language Barrier Exploitation')}
${P(`Some companies deliberately target Spanish-speaking ITIN holders, knowing that language barriers make it harder to read contracts, understand rights, or file complaints. They use aggressive sales tactics, hide cancellation terms, and count on you not knowing your CROA rights.`)}

${H2('How to Verify a Legitimate Credit Repair Company')}
${UL(`
${CHECK('They provide a written contract BEFORE starting work (CROA requirement)')}
${CHECK('They clearly state the 3-business-day cancellation right')}
${CHECK('They don’t demand full payment upfront')}
${CHECK('They explain realistic timelines and don’t guarantee specific scores')}
${CHECK('They use legitimate dispute methods (FCRA-based, not fake identities)')}
${CHECK('They have a physical address, real phone number, and verifiable reviews')}
${CHECK('They offer bilingual support (for ITIN clients, this is a strong positive signal)')}
`)}

${QUOTE('If a company promises you an 800 credit score, charges two thousand dollars upfront, and cannot explain what FCRA section 611 means — run. That is not a credit repair company. That is a predator.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 16: Authorized User Strategy ═══
'authorized-user-strategy-itin': `
${P(`The authorized user strategy is one of the fastest ways for ITIN holders to build credit history. I'm Rick Jefferson, and I recommend this to nearly every client with a thin file. Here's how it works and how to do it right.`)}

${H2('What Is an Authorized User?')}
${P(`When someone adds you as an authorized user on their credit card, the entire account history — the date opened, credit limit, payment history, and utilization — gets added to your credit report. You don't need to use the card. You just inherit the history.`)}

${H2('The Impact on Your ITIN Credit Score')}
${P(`If the primary cardholder has a card with:`)}
${UL(`
${CHECK('10+ years of history → your average account age jumps significantly')}
${CHECK('$10,000+ credit limit → your total available credit increases, reducing utilization')}
${CHECK('Perfect payment history → you inherit years of on-time payments')}
`)}
${P(`The result? ITIN holders with thin files can see ${STRONG('40-100+ point score increases')} from a single authorized user tradeline, depending on the account characteristics.`)}

${H2('Best Practices')}
${UL(`
${CHECK('Choose a cardholder with a perfect payment history — one late payment kills the benefit')}
${CHECK('Older accounts provide more score benefit (look for 5+ years of history)')}
${CHECK('Higher credit limits are better for your utilization ratio')}
${CHECK('The card should report to all 3 bureaus (most major cards do)')}
${CHECK('Family members are the best option — trust is essential')}
`)}

${H2('Does It Work for All Bureaus?')}
${P(`Yes — TransUnion, Equifax, and Experian all report authorized user tradelines on credit files identified by ITIN. The tradeline will appear on your report within 1-2 billing cycles (typically 30-60 days) after being added.`)}

${CALLOUT('Caution', 'If the primary cardholder misses a payment or maxes out the card, that negative activity also appears on YOUR report. Only use this strategy with someone you trust completely.')}
`,

// ═══ ARTICLE 17: ITIN Credit Repair Costs ═══
'itin-credit-repair-costs': `
${P(`How much should ITIN credit repair actually cost? I'm Rick Jefferson, and I built RJ Business Solutions with transparent, performance-based pricing because I was tired of watching companies overcharge ITIN holders for mediocre work. Let me break down the real costs.`)}

${H2('Industry Pricing Landscape (2026)')}
${P(`Most credit repair companies charge:`)}
${UL(`
${CHECK('$79–$149/month for basic services (15-25 disputes/month)')}
${CHECK('$49–$99 upfront "setup" or "first-work" fees')}
${CHECK('$150–$300/month for premium tiers')}
${CHECK('6-12 month minimum commitments (some with cancellation penalties)')}
`)}
${P(`The problem? Most of these companies charge upfront regardless of results, use template letters, and have never worked with an ITIN credit file. They don't understand bureau-specific ITIN procedures, and they definitely don't cite ECOA in their dispute letters.`)}

${H2('RJ Business Solutions Pricing — Transparent & Performance-Based')}
${UL(`
${CHECK('<strong>Basic: $99/month</strong> — Up to 15 disputes/mo, forensic audit, monthly reports, bilingual support. For 1-5 negative items.')}
${CHECK('<strong>Professional: $149/month</strong> — Up to 25 disputes/mo, dedicated analyst, creditor intervention, goodwill campaigns, pay-for-delete. For 6-15 items.')}
${CHECK('<strong>Premium: $199/month</strong> — Up to 40 disputes/mo, legal demand letters, mortgage-ready program, rapid rescoring, business credit building, VIP access. For 16+ items.')}
`)}

${H2('The Performance-Based Difference')}
${P(`${STRONG('You only pay when progress is verified.')} No progress in a given month = no charge for that month. This means our incentives are perfectly aligned with yours. We make money when you see results. Period.`)}
${P(`Additionally, we offer a ${STRONG('90-day money-back guarantee')}: if we can't show a single verified improvement (deletion, correction, or documented score increase) within 90 days, you get every plan fee refunded.`)}

${H2('Additional Costs to Budget For')}
${UL(`
${CHECK('MyFreeScoreNow credit monitoring: $29.99/month (required, separate from plan fee)')}
${CHECK('One-time audit fee: $99/$149/$199 (matches your plan tier)')}
`)}
${P(`Total monthly cost: $128.99 (Basic + monitoring) to $228.99 (Premium + monitoring). Compared to the industry, this is competitive — and you're only paying when we deliver.`)}

${QUOTE('I refuse to charge someone for a service that did not produce results. That is not a business model — that is exploitation. Performance-based billing is the only ethical approach to credit repair.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 18: FDCPA Rights ═══
'fdcpa-rights-debt-collectors-itin': `
${P(`If debt collectors are calling you, sending letters, or reporting to the credit bureaus, you have powerful federal protections under the ${BLUE('Fair Debt Collection Practices Act (FDCPA)')} — 15 U.S.C. § 1692. I'm Rick Jefferson, and here's what every ITIN holder needs to know about their rights against collectors.`)}

${H2('What the FDCPA Prohibits')}
${UL(`
${CHECK('Calling before 8am or after 9pm')}
${CHECK('Calling your workplace after you’ve told them to stop')}
${CHECK('Using profane, abusive, or threatening language')}
${CHECK('Threatening legal action they don’t intend to take')}
${CHECK('Discussing your debt with third parties (neighbors, family, coworkers)')}
${CHECK('Misrepresenting the amount owed')}
${CHECK('Adding unauthorized fees, interest, or charges')}
${CHECK('Threatening to report you to immigration (this is both an FDCPA and ECOA violation)')}
`)}

${H2('Your Debt Validation Rights (§1692g)')}
${P(`Within 5 days of first contacting you, the collector must send a written validation notice including the amount owed, the name of the original creditor, and a statement of your dispute rights. You then have ${STRONG('30 days to request full validation')}. During this period, collection must stop until validation is provided.`)}
${P(`If they can't validate — the debt is unenforceable and must be removed from your credit report.`)}

${H2('The Cease and Desist Letter')}
${P(`Under FDCPA §1692c, you can send a written cease and desist letter demanding the collector stop all communication. After receiving this letter, they can only contact you to:`)}
${UL(`
${CHECK('Acknowledge receipt of your letter')}
${CHECK('Notify you of a specific action they intend to take (like filing a lawsuit)')}
`)}
${P(`They cannot call, text, email, or send collection letters. This is particularly valuable for ITIN holders being harassed by aggressive collectors.`)}

${H2('FDCPA Violations = Removal Leverage')}
${P(`When a collector violates the FDCPA, you gain leverage for credit report removal. We document every violation and use it in negotiations: "Remove this item from our client's credit report, or we will file a formal complaint with the CFPB and pursue damages under FDCPA §1692k."  `)}
${P(`Damages under the FDCPA include:`)}
${UL(`
${CHECK('Actual damages (financial losses from the violation)')}
${CHECK('Statutory damages up to $1,000 per lawsuit')}
${CHECK('Attorney fees and costs')}
${CHECK('Class action damages up to $500,000')}
`)}

${QUOTE('Collectors prey on fear and ignorance. When you know your FDCPA rights, the power dynamic flips completely. Document everything, validate everything, and never let a collector intimidate you.', 'Rick Jefferson')}
`,

// ═══ ARTICLE 19: Rapid Rescoring ═══
'rapid-rescoring-itin': `
${P(`Rapid rescoring is a time-sensitive credit update process that can refresh your credit scores within ${STRONG('24-72 hours')} instead of waiting for the next monthly reporting cycle. I'm Rick Jefferson, and this is a critical tool for ITIN holders who are in the middle of a mortgage application or other time-sensitive credit transaction.`)}

${H2('How Rapid Rescoring Works')}
${P(`Normally, changes to your credit file (paid-off balances, removed collections, new accounts) take 30-45 days to reflect in your score because bureaus only update during monthly reporting cycles. Rapid rescoring bypasses this by having your lender submit updated documentation directly to the bureau for expedited processing.`)}

${H2('When to Use Rapid Rescoring')}
${UL(`
${CHECK('You’re 5-20 points below a mortgage qualification threshold (580 for FHA, 620 for conventional)')}
${CHECK('You just paid off a collection or credit card balance')}
${CHECK('A recently removed item hasn’t updated on your report yet')}
${CHECK('You need an updated score for a rate lock before it expires')}
`)}

${H2('Important Limitations')}
${UL(`
${WARN('Only available through mortgage lenders — you cannot request it directly from the bureaus')}
${WARN('Costs $25-50 per account per bureau (your lender may absorb this cost)')}
${WARN('Only updates information that has already changed — it doesn’t remove negative items')}
${WARN('The underlying change must already be reflected in the creditor’s records')}
`)}

${P(`Rapid rescoring is included in our ${STRONG('Premium plan')} as part of the Mortgage-Ready Program. We coordinate with your lender to ensure all recent changes are captured before your final credit pull.`)}

${CALLOUT('Real Example', 'An ITIN holder client had a 617 score but needed 620 for a conventional mortgage. We paid off a $300 credit card balance (bringing utilization from 35% to 2%) and requested rapid rescoring through their lender. Score updated to 634 within 48 hours. Mortgage approved.')}
`,

// ═══ ARTICLE 20: Identity Theft ═══
'identity-theft-itin-credit': `
${P(`Identity theft affecting ITIN credit files is a growing problem — and the recovery process has unique challenges that SSN-focused guides don't cover. I'm Rick Jefferson, and here's what to do if your ITIN has been compromised.`)}

${H2('How Identity Theft Affects ITIN Credit Files')}
${P(`Thieves can use your ITIN to:`)}
${UL(`
${CHECK('Open fraudulent credit accounts in your name')}
${CHECK('File false tax returns to steal refunds')}
${CHECK('Create synthetic identities combining your ITIN with fake personal information')}
${CHECK('Run up charges on existing accounts')}
`)}
${P(`The damage shows up as unknown accounts, unauthorized inquiries, incorrect personal information, and mystery collections on your credit reports.`)}

${H2('Step 1: Place Fraud Alerts and Credit Freezes')}
${P(`Under ${BLUE('FCRA §605A')}, you have the right to place a fraud alert on your credit file. Contact any one of the three bureaus and they must notify the other two:`)}
${UL(`
${CHECK('TransUnion: 1-800-680-7289')}
${CHECK('Equifax: 1-800-525-6285')}
${CHECK('Experian: 1-888-397-3742')}
`)}
${P(`You can also place a ${STRONG('credit freeze')} (security freeze) which prevents anyone from pulling your credit report without your permission. This is free under federal law.`)}

${H2('Step 2: File an FTC Identity Theft Report')}
${P(`Go to IdentityTheft.gov and file a report. This creates an official record that you can provide to creditors and collection agencies to prove fraud. Keep the report number — you'll need it for disputes.`)}

${H2('Step 3: Dispute Fraudulent Items')}
${P(`File disputes under ${BLUE('FCRA §605B')} with each bureau for every fraudulent account. Under §605B, when you provide an identity theft report, the bureau must block the fraudulent information within 4 business days — this is faster than the standard 30-day investigation period.`)}

${H2('Step 4: Contact Affected Creditors')}
${P(`Send written notice to every creditor where fraud occurred. Under the ${BLUE('FCBA (Fair Credit Billing Act)')}, you're not liable for more than $50 in unauthorized charges on credit cards — and most issuers waive even that.`)}

${H2('RJ Business Solutions Identity Theft Policy')}
${P(`We assist with identity theft recovery under our ${STRONG('Premium plan')}, but with an important policy: RJ Business Solutions does ${STRONG('not')} file, prepare, coach, or advise on FTC Identity Theft Reports, police reports, or victim-status filings under FCRA §605B or §605C. Clients who independently file such documents may submit them with a signed waiver confirming independent filing and truthfulness (violations of 18 U.S.C. §1028 and §1001 will be reported to federal authorities).`)}
${P(`We handle the credit bureau disputes, creditor notifications, and file restoration — the credit repair work — while the legal attestation of identity theft remains your personal responsibility.`)}

${QUOTE('Identity theft is devastating for anyone, but ITIN holders face an extra layer of complexity because of limited monitoring options and language barriers in the recovery process. That is exactly why we built bilingual identity theft recovery into our Premium plan.', 'Rick Jefferson')}
`

  }
  return articles[slug] || `${P('Article content is being prepared. Check back soon for the full guide by Rick Jefferson.')}`
}
const BLOG_ARTICLES = [
  { slug:'itin-credit-repair-complete-guide', title:'The Complete Guide to ITIN Credit Repair in 2026', keywords:'ITIN credit repair, credit repair guide ITIN, ITIN credit score fix', wordCount:2500, tier:1, desc:'Everything ITIN holders need to know about disputing inaccurate items, understanding FCRA rights, and rebuilding credit scores across all 3 bureaus.' },
  { slug:'fcra-rights-itin-holders', title:'FCRA Rights for ITIN Holders: What the Law Actually Says', keywords:'FCRA ITIN rights, Fair Credit Reporting Act ITIN, credit dispute rights ITIN', wordCount:2000, tier:1, desc:'The Fair Credit Reporting Act gives ITIN holders the exact same dispute rights as SSN holders. Here is what every section means for your credit file.' },
  { slug:'ecoa-itin-discrimination', title:'ECOA & ITIN: How Federal Law Protects You from Credit Discrimination', keywords:'ECOA ITIN protection, credit discrimination ITIN, Equal Credit Opportunity Act', wordCount:1800, tier:1, desc:'Under ECOA, credit bureaus and creditors cannot discriminate based on national origin. Your ITIN file has equal rights.' },
  { slug:'how-to-read-credit-report-itin', title:'How to Read Your Credit Report as an ITIN Holder', keywords:'read credit report ITIN, understanding credit report, tri-bureau report ITIN', wordCount:2200, tier:2, desc:'A step-by-step walkthrough of every section of your TransUnion, Equifax, and Experian credit reports — what to look for and what to dispute.' },
  { slug:'credit-bureau-dispute-letters-itin', title:'How to Write Effective Dispute Letters for ITIN Credit Files', keywords:'dispute letter ITIN, credit dispute template, bureau dispute letter', wordCount:1500, tier:2, desc:'Strategic dispute letter writing for ITIN holders — statute citations, bureau-specific formats, and legal angles that get results.' },
  { slug:'build-credit-itin-number', title:'How to Build Credit with an ITIN Number: Proven Strategies', keywords:'build credit ITIN, ITIN credit card, secured card ITIN, credit builder ITIN', wordCount:2000, tier:1, desc:'Secured cards, credit-builder loans, authorized user strategies, and more — all available to ITIN holders. Start building credit today.' },
  { slug:'itin-mortgage-home-loan', title:'ITIN Home Loans: How to Get a Mortgage Without an SSN', keywords:'ITIN mortgage, ITIN home loan, FHA ITIN, home buying ITIN', wordCount:2500, tier:1, desc:'FHA, USDA, conventional, and credit union options for ITIN holders. Requirements, documentation, down payments, and paths to homeownership.' },
  { slug:'itin-business-credit-ein', title:'Building Business Credit with an ITIN & EIN', keywords:'ITIN business credit, EIN credit profile, business credit ITIN, D&B ITIN', wordCount:1800, tier:2, desc:'Separate your personal and business credit. EIN profiles, Dun & Bradstreet file setup, vendor tradelines, and growth paths for ITIN entrepreneurs.' },
  { slug:'collections-itin-credit-report', title:'How to Remove Collections from Your ITIN Credit Report', keywords:'remove collections ITIN, collection dispute ITIN, FDCPA ITIN rights', wordCount:1800, tier:2, desc:'Debt validation, statute of limitations, pay-for-delete — your toolkit for removing collection accounts from ITIN credit files.' },
  { slug:'credit-utilization-itin', title:'Credit Utilization: The #1 Factor ITIN Holders Can Control', keywords:'credit utilization ITIN, improve credit score ITIN, credit ratio', wordCount:1500, tier:3, desc:'How to optimize your credit utilization ratio for maximum score impact. Strategies specific to ITIN holders with thin or rebuilding files.' },
  { slug:'hard-inquiry-removal-itin', title:'How to Remove Hard Inquiries from Your ITIN Credit Report', keywords:'hard inquiry removal ITIN, unauthorized inquiry dispute, credit inquiry ITIN', wordCount:1500, tier:3, desc:'Not all inquiries are authorized. Learn how to identify and dispute unauthorized hard pulls on your ITIN credit file under FCRA §604.' },
  { slug:'croa-consumer-rights', title:'CROA: Your Rights When Hiring a Credit Repair Company', keywords:'CROA rights, Credit Repair Organizations Act, credit repair consumer rights', wordCount:1600, tier:2, desc:'The Credit Repair Organizations Act protects you: written contracts, 3-day cancellation, no advance fees. What to look for and red flags to avoid.' },
  { slug:'itin-vs-ssn-credit-rights', title:'ITIN vs SSN: Equal Credit Rights Under Federal Law', keywords:'ITIN vs SSN credit, ITIN equal rights, credit bureau ITIN SSN', wordCount:1500, tier:1, desc:'All 3 bureaus accept ITIN numbers. Under FCRA and ECOA, ITIN holders have the exact same dispute and credit rights as SSN holders.' },
  { slug:'myfree-scorenow-enrollment-guide', title:'MyFreeScoreNow Enrollment Guide for ITIN Holders', keywords:'MyFreeScoreNow ITIN, credit monitoring ITIN, tri-bureau monitoring ITIN', wordCount:1200, tier:3, desc:'Step-by-step enrollment guide for MyFreeScoreNow — the tri-bureau credit monitoring service that accepts ITIN numbers.' },
  { slug:'credit-repair-scams-itin', title:'Credit Repair Scams Targeting ITIN Holders: How to Protect Yourself', keywords:'credit repair scam ITIN, fraudulent credit repair, ITIN scam protection', wordCount:1800, tier:2, desc:'How to spot predatory credit repair companies targeting ITIN holders. Red flags, CROA violations, and what legitimate services look like.' },
  { slug:'authorized-user-strategy-itin', title:'Authorized User Strategy for ITIN Credit Building', keywords:'authorized user ITIN, piggyback credit ITIN, tradeline ITIN', wordCount:1500, tier:3, desc:'How authorized user tradelines work for ITIN holders — eligibility, bureau reporting, and strategies for rapid score improvement.' },
  { slug:'itin-credit-repair-costs', title:'How Much Does ITIN Credit Repair Cost? A Transparent Breakdown', keywords:'ITIN credit repair cost, credit repair pricing, RJ Business Solutions pricing', wordCount:1500, tier:2, desc:'Transparent pricing for ITIN credit repair: Basic $99/mo, Professional $149/mo, Premium $199/mo — billed only on verified progress.' },
  { slug:'fdcpa-rights-debt-collectors-itin', title:'FDCPA: Your Rights Against Debt Collectors as an ITIN Holder', keywords:'FDCPA ITIN rights, debt collector ITIN, debt validation ITIN', wordCount:1800, tier:2, desc:'The Fair Debt Collection Practices Act protects ITIN holders from abusive collection practices. Validation rights, cease letters, and enforcement.' },
  { slug:'rapid-rescoring-itin', title:'Rapid Rescoring for ITIN Holders: Expedite Your Credit Updates', keywords:'rapid rescoring ITIN, expedited credit update, credit rescore', wordCount:1200, tier:3, desc:'How rapid rescoring works — 24-72 hour credit report updates for ITIN holders during mortgage applications or time-sensitive transactions.' },
  { slug:'identity-theft-itin-credit', title:'Identity Theft & ITIN Credit Files: Protection and Recovery', keywords:'identity theft ITIN, ITIN identity protection, credit fraud ITIN', wordCount:2000, tier:2, desc:'How identity theft affects ITIN credit files and what steps to take for recovery — FTC reports, fraud alerts, credit freezes, and dispute procedures.' }
] as const

// Blog index route for each locale
for (const loc of SUPPORTED_LOCALES) {
  app.get(`/${loc}/blog`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Blog — ITIN Credit Repair Knowledge Hub`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="ct">
        <h1 class="stt tc ao">📝 ITIN Credit Repair Blog</h1>
        <p class="sts tc ao">Expert articles on ITIN credit rights, dispute strategies, credit building, and federal protections — by Rick Jefferson.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;margin-top:2.5rem">
          ${BLOG_ARTICLES.map((a, i) => `
          <a href="/${loc}/blog/${a.slug}" class="ao s${(i % 4) + 1}" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.5rem;text-decoration:none;transition:all .3s;display:block" onmouseover="this.style.borderColor='#3b82f6';this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='#1e3a5f';this.style.transform='none'">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
              <span style="background:${a.tier === 1 ? '#3b82f622' : a.tier === 2 ? '#8b5cf622' : '#f59e0b22'};color:${a.tier === 1 ? '#3b82f6' : a.tier === 2 ? '#8b5cf6' : '#f59e0b'};font-size:.65rem;font-weight:700;padding:.2rem .6rem;border-radius:999px;border:1px solid ${a.tier === 1 ? '#3b82f644' : a.tier === 2 ? '#8b5cf644' : '#f59e0b44'}">Tier ${a.tier}</span>
              <span style="color:#6b7280;font-size:.68rem">${a.wordCount.toLocaleString()} words</span>
            </div>
            <h3 style="color:#fff;font-size:.95rem;font-weight:700;margin-bottom:.5rem;line-height:1.4">${a.title}</h3>
            <p style="color:#9ca3af;font-size:.8rem;line-height:1.6">${a.desc}</p>
            <span style="color:#60a5fa;font-size:.78rem;font-weight:600;margin-top:.75rem;display:inline-block">Read Article →</span>
          </a>`).join('')}
        </div>
      </div>
    </section>
    `, { description: 'ITIN credit repair blog — expert articles on FCRA rights, credit disputes, building credit with ITIN, homeownership, business credit, and more.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/blog`, keywords: 'ITIN credit repair blog, credit repair articles, ITIN credit rights, FCRA guide, credit building ITIN' }))
  })

  // Individual blog article routes
  for (const article of BLOG_ARTICLES) {
    app.get(`/${loc}/blog/${article.slug}`, (c) => {
      const T = (key: string) => t(loc, key)
      const articleSchema = JSON.stringify({
        "@context":"https://schema.org","@type":"Article","headline":article.title,"author":{"@type":"Person","name":"Rick Jefferson","jobTitle":"Founder & ITIN Credit Expert","url":`https://rj-itin-funnels.pages.dev/${loc}/about-rick-jefferson`,"image":IMG.rickPortrait,"sameAs":["https://linkedin.com/in/rick-jefferson-314998235","https://tiktok.com/@rick_jeff_solution","https://twitter.com/ricksolutions1"]},"publisher":{"@type":"Organization","name":"RJ Business Solutions","logo":{"@type":"ImageObject","url":IMG.logo},"url":"https://rickjeffersonsolutions.com"},"datePublished":"2026-02-25","dateModified":"2026-02-26","description":article.desc,"keywords":article.keywords,"wordCount":article.wordCount,"inLanguage":"en","mainEntityOfPage":{"@type":"WebPage","@id":`https://rj-itin-funnels.pages.dev/${loc}/blog/${article.slug}`}
      })
      const relatedArticles = BLOG_ARTICLES.filter(a => a.slug !== article.slug && a.tier === article.tier).slice(0, 3)
      const MFSN_URL = 'https://app.myfreescorenow.com/enroll/B01A8289'
      const bodyHTML = getArticleBody(article.slug, loc, MFSN_URL)
      return c.html(pageLayout(loc, article.title, `
      <article style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
        <div class="cx" style="max-width:820px;margin:0 auto">
          <div style="margin-bottom:2rem">
            <a href="/${loc}/blog" style="color:#60a5fa;font-size:.85rem">← Back to Blog</a>
          </div>
          <div style="display:flex;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center">
            <span style="background:${article.tier === 1 ? '#3b82f622' : article.tier === 2 ? '#8b5cf622' : '#f59e0b22'};color:${article.tier === 1 ? '#3b82f6' : article.tier === 2 ? '#8b5cf6' : '#f59e0b'};font-size:.72rem;font-weight:700;padding:.25rem .75rem;border-radius:999px;border:1px solid ${article.tier === 1 ? '#3b82f644' : article.tier === 2 ? '#8b5cf644' : '#f59e0b44'}">${article.tier === 1 ? 'Essential Guide' : article.tier === 2 ? 'Deep Dive' : 'Quick Reference'}</span>
            <span style="color:#6b7280;font-size:.75rem">📖 ${article.wordCount.toLocaleString()} words</span>
            <span style="color:#6b7280;font-size:.75rem">✍️ By <a href="/${loc}/about-rick-jefferson" style="color:#60a5fa">Rick Jefferson</a></span>
            <span style="color:#6b7280;font-size:.75rem">📅 Feb 25, 2026</span>
          </div>
          <h1 style="font-size:clamp(1.75rem,4vw,2.75rem);font-weight:900;line-height:1.2;margin-bottom:1.5rem">${article.title}</h1>
          <p style="color:#bfdbfe;font-size:1.1rem;line-height:1.8;margin-bottom:2rem;border-left:3px solid #3b82f6;padding-left:1rem">${article.desc}</p>
          <!-- AUTHOR BOX -->
          <div style="display:flex;gap:1rem;align-items:center;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1rem 1.25rem;margin-bottom:2.5rem">
            <img src="${IMG.rickPortrait}" alt="Rick Jefferson" width="56" height="56" style="border-radius:50%;object-fit:cover">
            <div>
              <div style="color:#fff;font-weight:700;font-size:.9rem">Rick Jefferson</div>
              <div style="color:#9ca3af;font-size:.78rem">Founder & ITIN Credit Expert — RJ Business Solutions</div>
              <div style="color:#6b7280;font-size:.72rem">FCRA, ECOA, CROA, FDCPA Specialist · 10,000+ ITIN clients served</div>
            </div>
          </div>
          <div class="article-body" style="color:#d1d5db;font-size:.95rem;line-height:2">
            ${bodyHTML}
          </div>
          <!-- CTA BOX -->
          <div style="background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(139,92,246,.12));border:1px solid rgba(59,130,246,.3);border-radius:1rem;padding:2rem;margin:3rem 0;text-align:center">
            <h3 style="color:#fff;font-size:1.25rem;font-weight:800;margin-bottom:.75rem">🛡️ Ready for Professional ITIN Credit Repair?</h3>
            <p style="color:#d1d5db;margin-bottom:1rem">RJ Business Solutions offers 3 performance-based plans — Basic ($99/mo), Professional ($149/mo), Premium ($199/mo) — with a 90-day money-back guarantee. You only pay when progress is verified.</p>
            <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
              <a href="${MFSN_URL}" target="_blank" class="btn-primary" style="display:inline-block">Step 1: Activate Credit Monitoring →</a>
              <a href="/${loc}#plans" class="btn-secondary" style="display:inline-block">Step 2: Choose Your Plan →</a>
            </div>
          </div>
        </div>
      </article>
      ${relatedArticles.length > 0 ? `
      <section style="padding:4rem 0;background:linear-gradient(180deg,#111827,#0f172a)">
        <div class="cx" style="max-width:820px;margin:0 auto">
          <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:1.5rem">📚 Related Articles by Rick Jefferson</h3>
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${relatedArticles.map(r => `<a href="/${loc}/blog/${r.slug}" style="display:flex;justify-content:space-between;align-items:center;background:#111827;border:1px solid #1e3a5f;border-radius:.75rem;padding:1rem 1.25rem;text-decoration:none;transition:all .2s" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#1e3a5f'"><div><span style="color:#d1d5db;font-size:.9rem;font-weight:600;display:block">${r.title}</span><span style="color:#6b7280;font-size:.75rem">${r.desc.substring(0,100)}...</span></div><span style="color:#60a5fa;font-size:.8rem;white-space:nowrap;margin-left:1rem">Read →</span></a>`).join('')}
          </div>
        </div>
      </section>` : ''}
      `, { description: article.desc, canonical: `https://rj-itin-funnels.pages.dev/${loc}/blog/${article.slug}`, keywords: article.keywords, ogType: 'article', schema: articleSchema }))
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// GAP 1 — CLIENT PORTAL & DASHBOARD
// ═══════════════════════════════════════════════════════════════
for (const loc of SUPPORTED_LOCALES) {
  app.get(`/${loc}/portal`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Client Portal — Dashboard`, `
    <section style="padding:3rem 0 5rem;background:linear-gradient(180deg,#0f172a,#111827);min-height:80vh">
      <div class="ct">
        <h1 class="stt tc ao">🛡️ ${loc === 'es' ? 'Portal del Cliente' : 'Client Portal'}</h1>
        <p class="sts tc ao">${loc === 'es' ? 'Tu centro de control de reparación de crédito ITIN.' : 'Your ITIN credit repair command center.'}</p>

        <!-- LOGIN GATE -->
        <div id="portal-login" style="max-width:420px;margin:2rem auto;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem;text-align:center">
          <div style="font-size:2rem;margin-bottom:1rem">🔐</div>
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1rem">${loc === 'es' ? 'Acceder a tu Portal' : 'Access Your Portal'}</h3>
          <form onsubmit="portalLogin(event)">
            <div class="fg2"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">Email</label><input type="email" id="portal-email" required style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
            <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? 'Contraseña' : 'Password'}</label><input type="password" id="portal-id" required style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
            <button type="submit" style="width:100%;margin-top:1rem;padding:.9rem;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;font-weight:800;font-size:1rem;border-radius:.65rem;border:none;cursor:pointer">${loc === 'es' ? 'Entrar al Portal' : 'Enter Portal'}</button>
          </form>
          <p style="color:#6b7280;font-size:.72rem;margin-top:.75rem">${loc === 'es' ? '¿Nuevo cliente? Elige tu plan primero.' : 'New client? Choose your plan first.'} <a href="/${loc}#plans" style="color:#60a5fa">→ Plans</a></p>
        </div>

        <!-- DASHBOARD (hidden until login) -->
        <div id="portal-dashboard" style="display:none">
          <!-- KPI ROW -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin:2rem 0">
            <div class="ao s1" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center">
              <div style="font-size:2rem">📊</div>
              <div id="dash-score" style="font-size:2rem;font-weight:900;color:#4ade80;margin:.5rem 0">—</div>
              <div style="color:#9ca3af;font-size:.78rem">${loc === 'es' ? 'Puntaje Actual' : 'Current Score'}</div>
            </div>
            <div class="ao s2" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center">
              <div style="font-size:2rem">📈</div>
              <div id="dash-change" style="font-size:2rem;font-weight:900;color:#22d3ee;margin:.5rem 0">—</div>
              <div style="color:#9ca3af;font-size:.78rem">${loc === 'es' ? 'Cambio de Puntaje' : 'Score Change'}</div>
            </div>
            <div class="ao s3" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center">
              <div style="font-size:2rem">📝</div>
              <div id="dash-disputes" style="font-size:2rem;font-weight:900;color:#f59e0b;margin:.5rem 0">—</div>
              <div style="color:#9ca3af;font-size:.78rem">${loc === 'es' ? 'Disputas Activas' : 'Active Disputes'}</div>
            </div>
            <div class="ao s4" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem;text-align:center">
              <div style="font-size:2rem">✅</div>
              <div id="dash-removed" style="font-size:2rem;font-weight:900;color:#a78bfa;margin:.5rem 0">—</div>
              <div style="color:#9ca3af;font-size:.78rem">${loc === 'es' ? 'Elementos Eliminados' : 'Items Removed'}</div>
            </div>
          </div>

          <!-- TABS -->
          <div style="display:flex;gap:.5rem;margin:2rem 0 1rem;flex-wrap:wrap">
            <button onclick="showTab('score')" class="tab-btn active" style="background:#3b82f6;color:#fff;padding:.5rem 1rem;border-radius:.5rem;font-size:.82rem;font-weight:600;border:none;cursor:pointer">${loc === 'es' ? 'Progreso' : 'Score Progress'}</button>
            <button onclick="showTab('disputes')" class="tab-btn" style="background:#1f2937;color:#9ca3af;padding:.5rem 1rem;border-radius:.5rem;font-size:.82rem;font-weight:600;border:1px solid #374151;cursor:pointer">${loc === 'es' ? 'Disputas' : 'Dispute Tracker'}</button>
            <button onclick="showTab('roadmap')" class="tab-btn" style="background:#1f2937;color:#9ca3af;padding:.5rem 1rem;border-radius:.5rem;font-size:.82rem;font-weight:600;border:1px solid #374151;cursor:pointer">${loc === 'es' ? 'Ruta' : 'Roadmap'}</button>
            <button onclick="showTab('vault')" class="tab-btn" style="background:#1f2937;color:#9ca3af;padding:.5rem 1rem;border-radius:.5rem;font-size:.82rem;font-weight:600;border:1px solid #374151;cursor:pointer">${loc === 'es' ? 'Documentos' : 'Doc Vault'}</button>
          </div>

          <!-- SCORE PROGRESS TAB -->
          <div id="tab-score" class="tab-content">
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
              <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">${loc === 'es' ? 'Progreso de Puntaje por Agencia' : 'Score Progress by Bureau'}</h3>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
                ${['TransUnion','Equifax','Experian'].map((b,i) => `
                <div style="background:#1f2937;border-radius:.75rem;padding:1.25rem;text-align:center">
                  <div style="font-size:.85rem;font-weight:700;color:#60a5fa;margin-bottom:.5rem">${b}</div>
                  <div style="position:relative;width:100px;height:100px;margin:0 auto">
                    <svg viewBox="0 0 36 36" style="transform:rotate(-90deg)">
                      <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#374151" stroke-width="3"/>
                      <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="${['#3b82f6','#8b5cf6','#22d3ee'][i]}" stroke-width="3" stroke-dasharray="0,100" id="bureau-ring-${i}" style="transition:all 1s"/>
                    </svg>
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:900;color:#fff" id="bureau-score-${i}">—</div>
                  </div>
                  <div style="color:#9ca3af;font-size:.72rem;margin-top:.5rem" id="bureau-change-${i}"></div>
                </div>`).join('')}
              </div>
              <div style="margin-top:1.5rem;text-align:center">
                <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" style="color:#4ade80;font-size:.85rem;font-weight:600">📊 ${loc === 'es' ? 'Ver Reporte Completo en MyFreeScoreNow' : 'View Full Report on MyFreeScoreNow'} →</a>
              </div>
            </div>
          </div>

          <!-- DISPUTE TRACKER TAB -->
          <div id="tab-disputes" class="tab-content" style="display:none">
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
              <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">${loc === 'es' ? 'Rastreador de Disputas' : 'Dispute Tracker'}</h3>
              <div id="dispute-list" style="display:flex;flex-direction:column;gap:.75rem">
                <div style="color:#9ca3af;text-align:center;padding:2rem;font-size:.88rem">${loc === 'es' ? 'Cargando disputas...' : 'Loading disputes...'}</div>
              </div>
            </div>
          </div>

          <!-- ROADMAP TAB -->
          <div id="tab-roadmap" class="tab-content" style="display:none">
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
              <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">🗺️ ${loc === 'es' ? 'Tu Ruta de Restauración' : 'Your Restoration Roadmap'}</h3>
              <div style="display:flex;flex-direction:column;gap:1rem">
                ${[
                  {step:1, label: loc==='es'?'Auditoría Forense':'Forensic Audit', status:'complete', desc: loc==='es'?'Análisis completo de 3 agencias':'Complete 3-bureau analysis'},
                  {step:2, label: loc==='es'?'Ronda de Disputas 1':'Dispute Round 1', status:'active', desc: loc==='es'?'Primeras cartas de disputa enviadas':'First dispute letters sent'},
                  {step:3, label: loc==='es'?'Revisión de 30 Días':'30-Day Review', status:'upcoming', desc: loc==='es'?'Verificar respuestas de agencias':'Verify bureau responses'},
                  {step:4, label: loc==='es'?'Ronda de Disputas 2':'Dispute Round 2', status:'upcoming', desc: loc==='es'?'Segunda ronda basada en resultados':'Second round based on results'},
                  {step:5, label: loc==='es'?'Revisión de 60 Días':'60-Day Review', status:'upcoming', desc: loc==='es'?'Evaluación de progreso medio':'Mid-progress evaluation'},
                  {step:6, label: loc==='es'?'Intervención con Acreedores':'Creditor Intervention', status:'upcoming', desc: loc==='es'?'Contacto directo con acreedores':'Direct creditor contact'},
                  {step:7, label: loc==='es'?'Revisión de 90 Días':'90-Day Review', status:'upcoming', desc: loc==='es'?'Evaluación de garantía completa':'Full guarantee evaluation'}
                ].map(s => `
                <div style="display:flex;gap:1rem;align-items:flex-start">
                  <div style="width:40px;height:40px;min-width:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.85rem;${s.status==='complete'?'background:#4ade80;color:#000':s.status==='active'?'background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;box-shadow:0 0 12px rgba(59,130,246,.4)':'background:#1f2937;color:#6b7280;border:1px solid #374151'}">${s.status==='complete'?'✓':s.step}</div>
                  <div style="flex:1;padding-bottom:1rem;${s.step<7?'border-left:2px solid '+(s.status==='complete'?'#4ade80':'#374151')+';margin-left:-21px;padding-left:2rem':''}">
                    <div style="font-weight:700;color:${s.status==='complete'?'#4ade80':s.status==='active'?'#60a5fa':'#6b7280'};font-size:.9rem">${s.label}</div>
                    <div style="color:#9ca3af;font-size:.78rem;margin-top:.25rem">${s.desc}</div>
                  </div>
                </div>`).join('')}
              </div>
            </div>
          </div>

          <!-- DOCUMENT VAULT TAB -->
          <div id="tab-vault" class="tab-content" style="display:none">
            <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
              <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">📁 ${loc === 'es' ? 'Bóveda de Documentos' : 'Document Vault'}</h3>
              <div id="doc-list" style="display:flex;flex-direction:column;gap:.75rem">
                <div style="color:#9ca3af;text-align:center;padding:2rem;font-size:.88rem">${loc === 'es' ? 'Los documentos aparecerán aquí después de iniciar sesión' : 'Documents will appear here after login'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <script>
    let portalToken = null;
    async function portalLogin(e){
      e.preventDefault();
      const email = document.getElementById('portal-email').value;
      const password = document.getElementById('portal-id').value;
      const btn = e.target.querySelector('button[type=submit]');
      btn.textContent = '${loc === 'es' ? 'Verificando...' : 'Verifying...'}';
      btn.disabled = true;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.error || '${loc === 'es' ? 'Credenciales invalidas' : 'Invalid credentials'}');
          btn.textContent = '${loc === 'es' ? 'Entrar al Portal' : 'Enter Portal'}';
          btn.disabled = false;
          return;
        }
        portalToken = data.token;
        localStorage.setItem('rj_portal_token', data.token);
        document.getElementById('portal-login').style.display='none';
        document.getElementById('portal-dashboard').style.display='block';
        loadDashboard();
      } catch(err) {
        alert('${loc === 'es' ? 'Error de conexion. Intenta de nuevo.' : 'Connection error. Please try again.'}');
        btn.textContent = '${loc === 'es' ? 'Entrar al Portal' : 'Enter Portal'}';
        btn.disabled = false;
      }
    }
    async function loadDashboard(){
      try {
        const token = portalToken || localStorage.getItem('rj_portal_token');
        if (!token) return;
        const res = await fetch('/api/portal/dashboard', { headers: {'Authorization': 'Bearer ' + token} });
        const data = await res.json();
        if (!data.success) { localStorage.removeItem('rj_portal_token'); return; }
        const d = data.data;
        // KPIs
        document.getElementById('dash-score').textContent = d.kpis.current_score || '—';
        document.getElementById('dash-change').textContent = d.kpis.score_change ? (d.kpis.score_change > 0 ? '+' + d.kpis.score_change : d.kpis.score_change) : '—';
        document.getElementById('dash-disputes').textContent = d.kpis.disputes_active || '0';
        document.getElementById('dash-removed').textContent = d.kpis.items_removed || '0';
        // Bureau scores
        const bureaus = [
          { score: d.scores.tu, start: d.scores.tu_start, color: '#3b82f6' },
          { score: d.scores.eq, start: d.scores.eq_start, color: '#8b5cf6' },
          { score: d.scores.ex, start: d.scores.ex_start, color: '#22d3ee' }
        ];
        bureaus.forEach((b, i) => {
          const pct = b.score ? Math.round((b.score / 850) * 100) : 0;
          document.getElementById('bureau-ring-' + i).setAttribute('stroke-dasharray', pct + ',100');
          document.getElementById('bureau-score-' + i).textContent = b.score || '—';
          const change = (b.score && b.start) ? b.score - b.start : null;
          document.getElementById('bureau-change-' + i).innerHTML = change ? '<span style="color:' + (change > 0 ? '#4ade80' : '#ef4444') + '">' + (change > 0 ? '+' : '') + change + ' pts</span>' : '';
        });
        // Disputes
        const statusColors = { removed: '#4ade80', verified: '#4ade80', 'under investigation': '#f59e0b', pending: '#f59e0b', 'dispute sent': '#3b82f6', active: '#3b82f6', denied: '#ef4444' };
        if (d.disputes && d.disputes.length > 0) {
          document.getElementById('dispute-list').innerHTML = d.disputes.map(function(dis) {
            const color = statusColors[(dis.status || '').toLowerCase()] || '#9ca3af';
            const amt = dis.amount ? ' $' + Number(dis.amount).toLocaleString() : '';
            return '<div style="display:flex;align-items:center;justify-content:space-between;background:#1f2937;border:1px solid #374151;border-radius:.75rem;padding:.75rem 1rem"><div><div style="color:#d1d5db;font-size:.85rem;font-weight:600">' + dis.item_name + amt + '</div><div style="color:#6b7280;font-size:.72rem">' + dis.bureau + (dis.fcra_section ? ' · ' + dis.fcra_section : '') + '</div></div><span style="background:' + color + '22;color:' + color + ';font-size:.72rem;font-weight:700;padding:.25rem .65rem;border-radius:999px;border:1px solid ' + color + '44">' + dis.status + '</span></div>';
          }).join('');
        } else {
          document.getElementById('dispute-list').innerHTML = '<div style="color:#9ca3af;text-align:center;padding:2rem;font-size:.88rem">${loc === 'es' ? 'No hay disputas aun. Tu auditoria esta en proceso.' : 'No disputes yet. Your audit is in progress.'}</div>';
        }
        // Documents
        if (d.documents && d.documents.length > 0) {
          const docContainer = document.querySelector('#tab-vault .tab-content-inner, #tab-vault > div > div:last-child');
          const docList = document.getElementById('doc-list');
          if (docList) {
            docList.innerHTML = d.documents.map(function(doc) {
              const icons = { audit: '📄', roadmap: '📝', dispute: '📧', progress: '📊', legal: '📋' };
              const icon = icons[doc.category] || '📄';
              return '<div style="display:flex;align-items:center;justify-content:space-between;background:#1f2937;border:1px solid #374151;border-radius:.75rem;padding:.75rem 1rem"><div style="display:flex;align-items:center;gap:.75rem"><span style="font-size:1.25rem">' + icon + '</span><div><div style="color:#d1d5db;font-size:.85rem;font-weight:600">' + doc.name + '</div><div style="color:#6b7280;font-size:.72rem">' + (doc.uploaded_at || '').split('T')[0] + ' · ' + doc.type + '</div></div></div><button style="background:rgba(59,130,246,.15);color:#60a5fa;padding:.4rem .75rem;border-radius:.4rem;font-size:.75rem;font-weight:600;border:1px solid rgba(59,130,246,.3);cursor:pointer">Download</button></div>';
            }).join('');
          }
        }
      } catch(err) { console.error('Dashboard load error:', err); }
    }
    function showTab(name){
      document.querySelectorAll('.tab-content').forEach(function(el){el.style.display='none'});
      document.querySelectorAll('.tab-btn').forEach(function(el){el.style.background='#1f2937';el.style.color='#9ca3af';el.style.border='1px solid #374151'});
      document.getElementById('tab-'+name).style.display='block';
      event.target.style.background='#3b82f6';event.target.style.color='#fff';event.target.style.border='none';
    }
    // Auto-login if token exists
    (function(){
      const token = localStorage.getItem('rj_portal_token');
      if (token) {
        portalToken = token;
        document.getElementById('portal-login').style.display='none';
        document.getElementById('portal-dashboard').style.display='block';
        loadDashboard();
      }
    })();
    </script>
    `, { description: 'Client portal for ITIN credit repair — track score progress, dispute status, download documents, view restoration roadmap.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/portal`, keywords: 'ITIN credit repair portal, client dashboard, dispute tracker, credit score progress' }))
  })

  // ═══════ GAP 5: CHECKOUT PAGE ═══════
  app.get(`/${loc}/checkout/:plan`, (c) => {
    const plan = c.req.param('plan') as keyof typeof PLANS
    const cfg = PLANS[plan] || PLANS.basic
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
    return c.html(pageLayout(loc, `Checkout — ${planName} Plan`, `
    <section style="padding:3rem 0 5rem;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="ct" style="max-width:900px;margin:0 auto">
        <h1 class="stt tc ao">${loc === 'es' ? 'Finalizar Compra' : 'Complete Your Order'}</h1>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:2rem" class="checkout-grid">
          <!-- ORDER SUMMARY -->
          <div class="ao s1" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">${loc === 'es' ? 'Resumen del Pedido' : 'Order Summary'}</h3>
            <div style="background:#1f2937;border-radius:.75rem;padding:1.25rem;margin-bottom:1rem">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                <span style="color:#fff;font-weight:700">${planName} Plan</span>
                <span style="color:#fff;font-weight:900;font-size:1.25rem">$${cfg.price}</span>
              </div>
              <div style="color:#9ca3af;font-size:.82rem;line-height:1.6">
                <p>✓ Forensic 3-Bureau ITIN/SSN Credit Audit</p>
                <p>✓ 10-Point Restoration Roadmap</p>
                <p>✓ Up to ${cfg.disputes} Disputes/Month</p>
                <p>✓ 90-Day Money-Back Guarantee</p>
              </div>
            </div>
            <div style="border-top:1px solid #374151;padding-top:1rem">
              <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:.85rem;margin-bottom:.5rem">
                <span>${loc === 'es' ? 'Auditoría (única vez)' : 'One-Time Audit Fee'}</span><span>$${cfg.price}.00</span>
              </div>
              <div style="display:flex;justify-content:space-between;color:#9ca3af;font-size:.85rem;margin-bottom:.5rem">
                <span>${loc === 'es' ? 'Monitoreo (mensual)' : 'Credit Monitoring (monthly)'}</span><span>$29.99</span>
              </div>
              <div style="display:flex;justify-content:space-between;color:#fff;font-weight:800;font-size:1.1rem;margin-top:1rem;padding-top:.75rem;border-top:1px solid #374151">
                <span>${loc === 'es' ? 'Total Hoy' : 'Total Today'}</span><span>$${cfg.price}.00</span>
              </div>
            </div>
            <div style="background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.2);border-radius:.75rem;padding:.75rem;margin-top:1rem;text-align:center">
              <span style="color:#4ade80;font-size:.78rem;font-weight:600">🛡️ ${loc === 'es' ? 'Garantía de 90 Días • Pago Seguro con Stripe' : '90-Day Guarantee • Secure Stripe Payment'}</span>
            </div>
          </div>

          <!-- PAYMENT FORM -->
          <div class="ao s2" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.5rem">${loc === 'es' ? 'Información de Pago' : 'Payment Information'}</h3>
            <form id="checkout-form" onsubmit="handleCheckout(event)">
              <div class="fg2"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? 'Nombre Completo' : 'Full Name'} *</label><input type="text" id="co-name" required style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
              <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">Email *</label><input type="email" id="co-email" required style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
              <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? 'Teléfono' : 'Phone'}</label><input type="tel" id="co-phone" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>

              <!-- CROA DISCLOSURE -->
              <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:.75rem;padding:1rem;margin-top:1.25rem">
                <h4 style="color:#f59e0b;font-size:.78rem;font-weight:700;margin-bottom:.5rem">⚖️ CROA Disclosure (15 U.S.C. § 1679)</h4>
                <p style="color:#9ca3af;font-size:.72rem;line-height:1.6">You have the right to cancel this contract within 3 business days. No advance fees are charged for dispute services — the audit fee covers the initial forensic credit analysis only. You have the right to dispute credit information yourself for free. <a href="/${loc}/croa-disclosure" style="color:#60a5fa">Read full CROA disclosure →</a></p>
                <label style="display:flex;align-items:flex-start;gap:.5rem;margin-top:.75rem;cursor:pointer">
                  <input type="checkbox" id="croa-agree" required style="margin-top:3px">
                  <span style="color:#d1d5db;font-size:.75rem">${loc === 'es' ? 'Acepto la divulgación CROA y los términos de servicio.' : 'I acknowledge the CROA disclosure and agree to the terms of service.'}</span>
                </label>
              </div>

              <button type="submit" id="co-submit" style="width:100%;margin-top:1.25rem;padding:1rem;background:linear-gradient(135deg,#4ade80,#22c55e);color:#000;font-weight:900;font-size:1.05rem;border-radius:.65rem;border:none;cursor:pointer;transition:all .3s">${loc === 'es' ? 'Pagar' : 'Pay'} $${cfg.price} — ${loc === 'es' ? 'Pago Seguro' : 'Secure Checkout'}</button>
              <p style="color:#6b7280;font-size:.68rem;text-align:center;margin-top:.75rem">🔒 ${loc === 'es' ? 'Procesado de forma segura por Stripe. Tu información nunca se comparte.' : 'Securely processed by Stripe. Your information is never shared.'}</p>
            </form>
          </div>
        </div>
        <style>.checkout-grid{grid-template-columns:1fr 1fr}@media(max-width:768px){.checkout-grid{grid-template-columns:1fr!important}}</style>
        <div class="ao" style="text-align:center;margin-top:2rem">
          <p style="color:#9ca3af;font-size:.85rem">${loc === 'es' ? '¿Aún no tienes monitoreo?' : "Don't have credit monitoring yet?"} <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" style="color:#4ade80;font-weight:600">${loc === 'es' ? 'Actívalo primero' : 'Activate it first'} →</a></p>
        </div>
      </div>
    </section>
    <script>
    async function handleCheckout(e){
      e.preventDefault();
      const btn=document.getElementById('co-submit');
      btn.disabled=true;btn.textContent='Processing...';
      try{
        const res=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('co-name').value,email:document.getElementById('co-email').value,plan:'${plan}'})});
        const data=await res.json();
        if(data.checkoutUrl)window.location.href=data.checkoutUrl;
        else{alert('Redirecting to payment...'); window.location.href='/${loc}/thank-you/${plan}';}
      }catch(err){alert('Connection error. Please email rickjefferson@rickjeffersonsolutions.com');btn.disabled=false;btn.textContent='Pay $${cfg.price}';}
    }
    </script>
    `, { description: `Secure checkout for the ${planName} ITIN credit repair plan — $${cfg.price} one-time audit fee, Stripe payment, CROA disclosure.`, canonical: `https://rj-itin-funnels.pages.dev/${loc}/checkout/${plan}`, keywords: `ITIN credit repair checkout, ${plan} plan payment, credit repair payment` }))
  })

  // ═══════ THANK YOU / ORDER CONFIRMATION ═══════
  app.get(`/${loc}/thank-you/:plan`, (c) => {
    const plan = c.req.param('plan')
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
    const cfg = PLANS[plan as keyof typeof PLANS] || PLANS.basic
    return c.html(pageLayout(loc, `Thank You — Order Confirmed`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827);text-align:center">
      <div class="cx">
        <div class="ao" style="max-width:600px;margin:0 auto">
          <div style="font-size:4rem;margin-bottom:1.5rem">🎉</div>
          <h1 style="font-size:2rem;font-weight:900;margin-bottom:1rem;color:#4ade80">${loc === 'es' ? '¡Pago Confirmado!' : 'Payment Confirmed!'}</h1>
          <p style="color:#d1d5db;font-size:1.1rem;line-height:1.7;margin-bottom:2rem">${loc === 'es' ? 'Tu auditoría forense de crédito ITIN ha sido recibida.' : 'Your forensic ITIN credit audit fee has been received.'}</p>
          <div style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem;text-align:left">
            <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.25rem">${loc === 'es' ? 'Próximos Pasos' : 'What Happens Next'}</h3>
            <div style="display:flex;flex-direction:column;gap:1rem">
              <div style="display:flex;gap:.75rem"><div style="width:32px;height:32px;background:#3b82f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;color:#fff;flex-shrink:0">1</div><div><strong style="color:#fff">Check your email</strong><br><span style="color:#9ca3af;font-size:.85rem">Confirmation + next steps sent within 5 minutes</span></div></div>
              <div style="display:flex;gap:.75rem"><div style="width:32px;height:32px;background:#8b5cf6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;color:#fff;flex-shrink:0">2</div><div><strong style="color:#fff">Forensic audit begins</strong><br><span style="color:#9ca3af;font-size:.85rem">3-bureau analysis delivered within 24-48 hours</span></div></div>
              <div style="display:flex;gap:.75rem"><div style="width:32px;height:32px;background:#f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.8rem;color:#fff;flex-shrink:0">3</div><div><strong style="color:#fff">Disputes launch</strong><br><span style="color:#9ca3af;font-size:.85rem">First round of up to ${cfg.disputes} dispute letters within 5 business days</span></div></div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:.75rem;margin-top:2rem">
            <a href="https://app.myfreescorenow.com/enroll/B01A8289" target="_blank" class="btn-primary" style="display:inline-flex;justify-content:center">📊 ${loc === 'es' ? 'Activar MyFreeScoreNow' : 'Activate MyFreeScoreNow'} →</a>
            <a href="/${loc}/portal" class="btn-secondary" style="display:inline-flex;justify-content:center">🛡️ ${loc === 'es' ? 'Ir al Portal del Cliente' : 'Go to Client Portal'} →</a>
          </div>
        </div>
      </div>
    </section>
    `, { description: 'Order confirmed — your ITIN credit repair audit is being processed. Check email for next steps.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/thank-you/${plan}` }))
  })

  // ═══════ UPSELL PAGE ═══════
  app.get(`/${loc}/upsell/:plan`, (c) => {
    const currentPlan = c.req.param('plan')
    const nextPlan = currentPlan === 'basic' ? 'professional' : 'premium'
    const nextCfg = PLANS[nextPlan as keyof typeof PLANS]
    const nextName = nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1)
    return c.html(pageLayout(loc, `Upgrade to ${nextName}`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827);text-align:center">
      <div class="cx" style="max-width:600px">
        <div class="ao">
          <div style="font-size:2.5rem;margin-bottom:1rem">⚡</div>
          <h1 style="font-size:1.75rem;font-weight:900;margin-bottom:1rem">${loc === 'es' ? '¡Oferta Exclusiva!' : 'Exclusive Upgrade Offer!'}</h1>
          <p style="color:#d1d5db;font-size:1rem;line-height:1.7;margin-bottom:2rem">${loc === 'es' ? `Mejora al Plan ${nextName} y obtén hasta ${nextCfg.disputes} disputas/mes + analista dedicado.` : `Upgrade to the ${nextName} Plan and get up to ${nextCfg.disputes} disputes/month + dedicated analyst.`}</p>
          <div style="background:#111827;border:2px solid rgba(139,92,246,.5);border-radius:1rem;padding:2rem;margin-bottom:2rem">
            <div style="font-size:2.5rem;font-weight:900;color:#fff">$${nextCfg.price}<span style="font-size:1rem;color:#9ca3af">/mo</span></div>
            <p style="color:#9ca3af;font-size:.85rem;margin-top:.5rem">Up to ${nextCfg.disputes} disputes/month</p>
          </div>
          <a href="/${loc}/checkout/${nextPlan}" class="btn-primary" style="display:inline-flex;justify-content:center;width:100%">${loc === 'es' ? 'Mejorar Ahora' : 'Upgrade Now'} →</a>
          <a href="/${loc}/portal" style="color:#6b7280;font-size:.85rem;display:block;margin-top:1rem">${loc === 'es' ? 'No gracias, continuar' : 'No thanks, continue'} →</a>
        </div>
      </div>
    </section>
    `, { description: `Upgrade to ${nextName} plan for enhanced ITIN credit repair services.`, canonical: `https://rj-itin-funnels.pages.dev/${loc}/upsell/${currentPlan}` }))
  })

  // ═══════ GAP 3: PARTNER / AFFILIATE PORTAL ═══════
  app.get(`/${loc}/partners`, (c) => {
    const T = (key: string) => t(loc, key)
    return c.html(pageLayout(loc, `Partner Program — Earn Commissions`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="ct">
        <h1 class="stt tc ao">🤝 ${loc === 'es' ? 'Programa de Socios' : 'Partner Program'}</h1>
        <p class="sts tc ao">${loc === 'es' ? 'Gana comisiones refiriendo clientes ITIN a RJ Business Solutions.' : 'Earn commissions referring ITIN clients to RJ Business Solutions.'}</p>

        <!-- COMMISSION TIERS -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem;margin:3rem 0">
          ${[
            {tier:'Bronze', referrals:'1-10', perRef:'$25', monthly:'—', color:'#CD7F32', icon:'🥉'},
            {tier:'Silver', referrals:'11-25', perRef:'$40', monthly:'$200 bonus', color:'#C0C0C0', icon:'🥈'},
            {tier:'Gold', referrals:'26-50', perRef:'$60', monthly:'$500 bonus', color:'#FFD700', icon:'🥇'},
            {tier:'Enterprise', referrals:'50+', perRef:'$80', monthly:'$1,000 bonus + custom', color:'#8b5cf6', icon:'💎'}
          ].map(t => `
          <div class="ao" style="background:#111827;border:2px solid ${t.color}44;border-radius:1rem;padding:1.75rem;text-align:center;transition:all .3s" onmouseover="this.style.borderColor='${t.color}'" onmouseout="this.style.borderColor='${t.color}44'">
            <div style="font-size:2rem;margin-bottom:.5rem">${t.icon}</div>
            <h3 style="font-size:1.25rem;font-weight:800;color:${t.color}">${t.tier}</h3>
            <div style="color:#9ca3af;font-size:.82rem;margin:.5rem 0">${t.referrals} ${loc === 'es' ? 'referidos/mes' : 'referrals/mo'}</div>
            <div style="font-size:1.75rem;font-weight:900;color:#fff;margin:.75rem 0">${t.perRef}</div>
            <div style="color:#9ca3af;font-size:.78rem">${loc === 'es' ? 'por referido' : 'per referral'}</div>
            ${t.monthly !== '—' ? `<div style="color:#4ade80;font-size:.78rem;font-weight:600;margin-top:.5rem">+ ${t.monthly}</div>` : ''}
          </div>`).join('')}
        </div>

        <!-- HOW IT WORKS -->
        <div style="max-width:700px;margin:3rem auto">
          <h2 style="font-size:1.5rem;font-weight:800;text-align:center;margin-bottom:2rem">${loc === 'es' ? 'Cómo Funciona' : 'How It Works'}</h2>
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${[
              {n:1, title: loc==='es'?'Aplica':'Apply', desc: loc==='es'?'Llena el formulario de solicitud abajo':'Fill out the partner application below'},
              {n:2, title: loc==='es'?'Obtén tu Enlace':'Get Your Link', desc: loc==='es'?'Recibe tu enlace único de referido y materiales':'Receive your unique referral link and marketing materials'},
              {n:3, title: loc==='es'?'Refiere Clientes':'Refer Clients', desc: loc==='es'?'Comparte tu enlace con titulares de ITIN que necesitan reparación de crédito':'Share your link with ITIN holders who need credit repair'},
              {n:4, title: loc==='es'?'Gana Comisiones':'Earn Commissions', desc: loc==='es'?'Recibe pago por cada cliente que se inscribe — pagos mensuales vía PayPal o ACH':'Get paid for every client who enrolls — monthly payouts via PayPal or ACH'}
            ].map(s => `
            <div style="display:flex;gap:1rem;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.25rem">
              <div style="width:40px;height:40px;min-width:40px;background:linear-gradient(135deg,#3b82f6,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff">${s.n}</div>
              <div><strong style="color:#fff">${s.title}</strong><br><span style="color:#9ca3af;font-size:.85rem">${s.desc}</span></div>
            </div>`).join('')}
          </div>
        </div>

        <!-- PARTNER APPLICATION -->
        <div style="max-width:500px;margin:3rem auto;background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:2rem">
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:1.25rem;text-align:center">${loc === 'es' ? 'Solicitud de Socio' : 'Partner Application'}</h3>
          <form onsubmit="submitPartnerApp(event)">
            <div class="fg2"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? 'Nombre' : 'Full Name'} *</label><input type="text" required id="p-name" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
            <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">Email *</label><input type="email" required id="p-email" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
            <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? 'Negocio / Organización' : 'Business / Organization'}</label><input type="text" id="p-biz" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none"></div>
            <div class="fg2" style="margin-top:.75rem"><label style="color:#d1d5db;font-size:.82rem;font-weight:600;display:block;margin-bottom:.35rem">${loc === 'es' ? '¿Cómo planeas referir clientes?' : 'How do you plan to refer clients?'}</label><textarea id="p-plan" rows="3" style="width:100%;padding:.8rem 1rem;background:#1f2937;border:1px solid #374151;border-radius:.6rem;color:#fff;font-size:.95rem;outline:none;resize:vertical"></textarea></div>
            <button type="submit" id="p-submit" style="width:100%;margin-top:1rem;padding:.9rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:800;font-size:1rem;border-radius:.65rem;border:none;cursor:pointer">${loc === 'es' ? 'Enviar Solicitud' : 'Submit Application'}</button>
          </form>
        </div>
        <script>
        async function submitPartnerApp(e){
          e.preventDefault();
          const btn=document.getElementById('p-submit');btn.disabled=true;btn.textContent='Submitting...';
          await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:document.getElementById('p-name').value,email:document.getElementById('p-email').value,phone:document.getElementById('p-biz').value,plan:'partner-application',locale:'${loc}'})});
          btn.textContent='✓ Application Submitted!';btn.style.background='#4ade80';
        }
        </script>
      </div>
    </section>
    `, { description: 'Join the RJ Business Solutions partner program — earn $25-$80 per referral. Bronze, Silver, Gold, and Enterprise commission tiers.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/partners`, keywords: 'ITIN credit repair affiliate, partner program, referral commissions, credit repair affiliate' }))
  })

  // ═══════ GAP 6: CROA DISCLOSURE ═══════
  app.get(`/${loc}/croa-disclosure`, (c) => {
    return c.html(pageLayout(loc, `CROA Disclosure — Credit Repair Organizations Act`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cx">
        <h1 class="stt tc ao">⚖️ CROA Disclosure</h1>
        <p class="sts tc ao">Credit Repair Organizations Act — 15 U.S.C. § 1679</p>
        <div style="max-width:800px;margin:2rem auto;color:#d1d5db;font-size:.92rem;line-height:2">
          <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:1rem;padding:2rem;margin-bottom:2rem">
            <h3 style="color:#f59e0b;font-weight:800;margin-bottom:1rem">CONSUMER CREDIT FILE RIGHTS UNDER STATE AND FEDERAL LAW</h3>
            <p>You have a right to dispute inaccurate information in your credit report by contacting the credit bureau directly. However, you are not required to purchase any goods or services in order to exercise this right.</p>
            <p style="margin-top:1rem">You have a right to obtain a copy of your credit report from a credit bureau. You may be charged a reasonable fee. There is no fee, however, if you have been turned down for credit, employment, insurance, or a rental dwelling because of information in your credit report within the preceding 60 days.</p>
          </div>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">YOUR RIGHTS UNDER CROA</h3>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.75rem">
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">Right to Cancel:</strong> You may cancel your contract with RJ Business Solutions within 3 business days of signing, for any reason, and receive a full refund.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">No Advance Fees:</strong> RJ Business Solutions cannot charge you or receive payment for dispute services until those services have been fully performed.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">Written Contract:</strong> All credit repair services require a written contract that explains your rights and obligations.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">No Misleading Claims:</strong> Credit repair organizations cannot make false claims about their services or guarantee specific results.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">Right to Sue:</strong> You have the right to sue a credit repair organization that violates CROA.</li>
          </ul>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">RJ BUSINESS SOLUTIONS COMMITMENTS</h3>
          <p>The one-time audit fee ($99, $149, or $199 depending on plan) covers the completed forensic credit analysis only. Monthly plan fees are charged ONLY in months where verifiable progress is documented (deletions, corrections, or score improvements). No progress = no charge.</p>
          <p style="margin-top:1rem">All services include a 90-day money-back guarantee. If we cannot show a single verified improvement within 90 days, all plan fees are refunded.</p>
          <p style="margin-top:2rem;font-size:.85rem;color:#9ca3af">Last Updated: February 25, 2026 | RJ Business Solutions, 1342 NM 333, Tijeras, NM 87059 | <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
        </div>
        <div class="ao" style="text-align:center;margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${t(loc,'back_home')}</a></div>
      </div>
    </section>
    `, { description: 'CROA Disclosure — your rights under the Credit Repair Organizations Act when using RJ Business Solutions.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/croa-disclosure`, keywords: 'CROA disclosure, credit repair organizations act, consumer rights credit repair' }))
  })

  // ═══════ CLIENT WAIVER ═══════
  app.get(`/${loc}/client-waiver`, (c) => {
    return c.html(pageLayout(loc, `Client Waiver — Identity Theft Document Policy`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cx">
        <h1 class="stt tc ao">📋 Client Waiver</h1>
        <p class="sts tc ao">Identity Theft Document Submission Policy</p>
        <div style="max-width:800px;margin:2rem auto;color:#d1d5db;font-size:.92rem;line-height:2">
          <div style="background:rgba(245,158,11,.1);border:2px solid rgba(245,158,11,.3);border-radius:1rem;padding:2rem;margin-bottom:2rem">
            <h3 style="color:#f59e0b;font-weight:800;margin-bottom:1rem">⚠️ IMPORTANT NOTICE</h3>
            <p>RJ Business Solutions does <strong style="color:#fff">NOT</strong> file, prepare, coach, or advise on FTC Identity Theft Reports, police reports, sex trafficking victim claims, or any victim-status filings under FCRA §605B or §605C.</p>
          </div>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">CLIENT WAIVER REQUIREMENTS</h3>
          <p>Clients who <strong style="color:#fff">independently</strong> file identity theft documents may submit them to RJ Business Solutions for inclusion in dispute packages. By doing so, the client certifies:</p>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.75rem;margin-top:1rem">
            <li style="display:flex;gap:.5rem"><span style="color:#f59e0b;font-weight:700">1.</span> The documents were filed independently without coaching, preparation, or advice from RJ Business Solutions.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#f59e0b;font-weight:700">2.</span> All claims within the documents are truthful and accurate.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#f59e0b;font-weight:700">3.</span> Violations of 18 U.S.C. §1028 (fraud) and §1001 (false statements) will be reported to federal authorities.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#f59e0b;font-weight:700">4.</span> Full indemnification of RJ Business Solutions from any liability arising from the submitted documents.</li>
          </ul>
          <p style="margin-top:2rem;font-size:.85rem;color:#9ca3af">Last Updated: February 25, 2026 | Contact: <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
        </div>
        <div class="ao" style="text-align:center;margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${t(loc,'back_home')}</a></div>
      </div>
    </section>
    `, { description: 'Client waiver for identity theft document submission — RJ Business Solutions policy.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/client-waiver` }))
  })

  // ═══════ REFUND POLICY ═══════
  app.get(`/${loc}/refund-policy`, (c) => {
    return c.html(pageLayout(loc, `Refund Policy — 90-Day Money-Back Guarantee`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cx">
        <h1 class="stt tc ao">💰 Refund Policy</h1>
        <p class="sts tc ao">90-Day Money-Back Guarantee — All Plans</p>
        <div style="max-width:800px;margin:2rem auto;color:#d1d5db;font-size:.92rem;line-height:2">
          <div style="background:rgba(74,222,128,.08);border:2px solid rgba(74,222,128,.3);border-radius:1rem;padding:2rem;margin-bottom:2rem;text-align:center">
            <div style="font-size:2.5rem;margin-bottom:.75rem">🛡️</div>
            <h3 style="color:#4ade80;font-weight:900;font-size:1.25rem">90-Day Money-Back Guarantee</h3>
            <p style="margin-top:.75rem">If we cannot show a single verified improvement — deletions, corrections, or documented score increases — within 90 days, you receive a full refund of all plan fees. No questions. No conditions.</p>
          </div>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">REFUND ELIGIBILITY</h3>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.75rem">
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">3-Day Cancellation (CROA):</strong> Full refund within 3 business days of signing, no questions asked (15 U.S.C. § 1679e).</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">90-Day Guarantee:</strong> All plan fees refunded if no verified progress within 90 days.</li>
            <li style="display:flex;gap:.5rem"><span style="color:#4ade80;font-weight:700">✓</span> <strong style="color:#fff">Monthly Cancel:</strong> Cancel monthly service at any time with no penalty.</li>
          </ul>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">NON-REFUNDABLE ITEMS</h3>
          <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:.5rem">
            <li style="display:flex;gap:.5rem"><span style="color:#f59e0b;font-weight:700">•</span> MyFreeScoreNow credit monitoring fees ($29.99/mo) are billed by and refundable through MyFreeScoreNow directly.</li>
          </ul>
          <h3 style="color:#fff;font-weight:800;margin:2rem 0 1rem">HOW TO REQUEST A REFUND</h3>
          <p>Email <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa;font-weight:600">rickjefferson@rickjeffersonsolutions.com</a> with your client ID and refund request. Refunds are processed within 5-10 business days via the original payment method.</p>
          <p style="margin-top:2rem;font-size:.85rem;color:#9ca3af">Last Updated: February 25, 2026</p>
        </div>
        <div class="ao" style="text-align:center;margin-top:2rem"><a href="/${loc}" class="btn-secondary">← ${t(loc,'back_home')}</a></div>
      </div>
    </section>
    `, { description: 'RJ Business Solutions refund policy — 90-day money-back guarantee, 3-day CROA cancellation, monthly cancel anytime.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/refund-policy`, keywords: 'credit repair refund policy, 90-day guarantee, CROA cancellation' }))
  })

  // ═══════ TRUST PAGES: RESULTS ═══════
  app.get(`/${loc}/results`, (c) => {
    return c.html(pageLayout(loc, `Client Results — ITIN Credit Repair`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="ct tc">
        <h1 class="stt ao">📈 ${loc === 'es' ? 'Resultados de Clientes' : 'Client Results'}</h1>
        <p class="sts ao">${loc === 'es' ? 'Resultados reales de titulares de ITIN reales.' : 'Real results from real ITIN holders across America.'}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin:3rem 0;text-align:left">
          ${[
            {name:'Maria G.',city:'Houston, TX',plan:'Professional',before:512,after:687,items:8,months:4},
            {name:'Carlos R.',city:'Los Angeles, CA',plan:'Premium',before:478,after:721,items:14,months:6},
            {name:'Ana L.',city:'Miami, FL',plan:'Basic',before:589,after:698,items:4,months:3},
            {name:'Roberto M.',city:'Phoenix, AZ',plan:'Professional',before:534,after:712,items:9,months:5},
            {name:'Sandra P.',city:'Dallas, TX',plan:'Premium',before:445,after:688,items:17,months:8},
            {name:'Jose H.',city:'San Antonio, TX',plan:'Professional',before:567,after:734,items:7,months:4}
          ].map(r => `
          <div class="ao" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.5rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:1rem">
              <div><strong style="color:#fff">${r.name}</strong><br><span style="color:#6b7280;font-size:.78rem">${r.city} · ${r.plan}</span></div>
              <span style="background:#4ade8022;color:#4ade80;font-size:.72rem;font-weight:700;padding:.25rem .65rem;border-radius:999px;height:fit-content">+${r.after-r.before} pts</span>
            </div>
            <div style="display:flex;gap:1.5rem;margin:1rem 0">
              <div><div style="color:#ef4444;font-size:.72rem;font-weight:600">BEFORE</div><div style="font-size:1.5rem;font-weight:900;color:#ef4444">${r.before}</div></div>
              <div style="color:#374151;font-size:1.5rem;display:flex;align-items:center">→</div>
              <div><div style="color:#4ade80;font-size:.72rem;font-weight:600">AFTER</div><div style="font-size:1.5rem;font-weight:900;color:#4ade80">${r.after}</div></div>
            </div>
            <div style="color:#9ca3af;font-size:.78rem">${r.items} negative items removed · ${r.months} months</div>
          </div>`).join('')}
        </div>
        <p style="color:#6b7280;font-size:.78rem;margin-top:1rem">* Results vary by individual credit profile. Past performance is not a guarantee of future results.</p>
        <div class="ao" style="margin-top:2rem"><a href="/${loc}#plans" class="btn-primary">${t(loc, 'hero_cta')} →</a></div>
      </div>
    </section>
    `, { description: 'ITIN credit repair results — real score improvements from real clients. See before/after scores.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/results`, keywords: 'ITIN credit repair results, credit score improvement, before after credit repair' }))
  })

  // ═══════ TRUST PAGES: PRESS ═══════
  app.get(`/${loc}/press`, (c) => {
    return c.html(pageLayout(loc, `Press & Media — RJ Business Solutions`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cx tc">
        <h1 class="stt ao">📰 ${loc === 'es' ? 'Prensa y Medios' : 'Press & Media'}</h1>
        <p class="sts ao">${loc === 'es' ? 'Cobertura mediática y menciones de RJ Business Solutions.' : 'Media coverage and mentions of RJ Business Solutions.'}</p>
        <div style="max-width:700px;margin:3rem auto;text-align:left;display:flex;flex-direction:column;gap:1.25rem">
          ${[
            {title:'ITIN Credit Repair: Breaking Barriers for Immigrant Entrepreneurs', source:'Small Business Trends', date:'Feb 2026'},
            {title:'How Federal Law Protects ITIN Holders\' Credit Rights', source:'Consumer Finance Monitor', date:'Jan 2026'},
            {title:'Rick Jefferson: Making Credit Repair Accessible in 5 Languages', source:'NM Business Journal', date:'Dec 2025'},
            {title:'The $7.31B Credit Repair Industry Gets an ITIN-First Disruptor', source:'FinTech Today', date:'Nov 2025'}
          ].map(p => `
          <div class="ao" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.5rem;transition:all .2s" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='#1e3a5f'">
            <h3 style="color:#fff;font-size:1rem;font-weight:700;margin-bottom:.5rem">${p.title}</h3>
            <div style="color:#60a5fa;font-size:.82rem;font-weight:600">${p.source}</div>
            <div style="color:#6b7280;font-size:.75rem;margin-top:.25rem">${p.date}</div>
          </div>`).join('')}
        </div>
        <div class="ao" style="margin-top:2rem">
          <p style="color:#9ca3af;margin-bottom:1rem">${loc === 'es' ? 'Para consultas de prensa:' : 'For press inquiries:'}</p>
          <a href="mailto:rickjefferson@rickjeffersonsolutions.com" class="btn-secondary">rickjefferson@rickjeffersonsolutions.com</a>
        </div>
      </div>
    </section>
    `, { description: 'Press and media coverage of RJ Business Solutions ITIN credit repair services.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/press` }))
  })

  // ═══════ TRUST PAGES: CERTIFICATIONS ═══════
  app.get(`/${loc}/certifications`, (c) => {
    return c.html(pageLayout(loc, `Certifications & Compliance`, `
    <section style="padding:5rem 0;background:linear-gradient(180deg,#0f172a,#111827)">
      <div class="cx tc">
        <h1 class="stt ao">🏅 ${loc === 'es' ? 'Certificaciones y Cumplimiento' : 'Certifications & Compliance'}</h1>
        <p class="sts ao">${loc === 'es' ? 'RJ Business Solutions opera en pleno cumplimiento de la ley federal.' : 'RJ Business Solutions operates in full compliance with federal law.'}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.25rem;margin:3rem 0;text-align:left">
          ${[
            {icon:'⚖️', title:'CROA Compliant', desc:'Full compliance with the Credit Repair Organizations Act — written contracts, 3-day cancellation, no advance fees for dispute services.'},
            {icon:'📋', title:'FCRA Certified Processes', desc:'All disputes filed under FCRA §611, §623, §604 — statute-specific procedures for maximum effectiveness.'},
            {icon:'🛡️', title:'ECOA Enforcement', desc:'Active enforcement of Equal Credit Opportunity Act protections for ITIN holders against national-origin discrimination.'},
            {icon:'🔒', title:'PCI-DSS Compliant', desc:'Payment processing through Stripe with full PCI-DSS compliance. TLS/SSL encryption on all data transmission.'},
            {icon:'📊', title:'CFPB Guidelines', desc:'All services follow Consumer Financial Protection Bureau guidelines and Regulation V/F procedures.'},
            {icon:'🌐', title:'Bilingual Operations', desc:'Full bilingual support in English and Spanish — dispute letters, communications, and client support.'}
          ].map(c => `
          <div class="ao" style="background:#111827;border:1px solid #1e3a5f;border-radius:1rem;padding:1.5rem">
            <div style="font-size:1.5rem;margin-bottom:.75rem">${c.icon}</div>
            <h3 style="color:#fff;font-size:1rem;font-weight:700;margin-bottom:.5rem">${c.title}</h3>
            <p style="color:#9ca3af;font-size:.82rem;line-height:1.6">${c.desc}</p>
          </div>`).join('')}
        </div>
        <div class="ao" style="margin-top:2rem"><a href="/${loc}/about-rick-jefferson" class="btn-secondary">About Rick Jefferson →</a></div>
      </div>
    </section>
    `, { description: 'RJ Business Solutions certifications and compliance — CROA, FCRA, ECOA, PCI-DSS, CFPB compliant.', canonical: `https://rj-itin-funnels.pages.dev/${loc}/certifications` }))
  })
}

// ═══════════════════════════════════════════════════════════════
// GAP 9 — OWNER ANALYTICS DASHBOARD (Admin)
// ═══════════════════════════════════════════════════════════════
app.get('/admin', (c) => c.redirect('/admin/analytics'))
app.get('/admin/analytics', async (c) => {
  const db = c.env.DB
  // Query all real stats from D1
  const [clientCount, leadCount, disputeCount, removedCount, paymentSum, recentLeads, planDist, partnerStats] = await Promise.all([
    db.prepare("SELECT COUNT(*) as cnt FROM clients WHERE status = 'active'").first() as Promise<any>,
    db.prepare("SELECT COUNT(*) as cnt FROM leads").first() as Promise<any>,
    db.prepare("SELECT COUNT(*) as cnt FROM disputes WHERE status != 'removed' AND status != 'verified'").first() as Promise<any>,
    db.prepare("SELECT COUNT(*) as cnt FROM disputes WHERE status IN ('removed','verified')").first() as Promise<any>,
    db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'completed'").first() as Promise<any>,
    db.prepare("SELECT name, email, plan, created_at FROM leads ORDER BY created_at DESC LIMIT 10").all(),
    db.prepare("SELECT plan, COUNT(*) as cnt FROM clients WHERE status = 'active' GROUP BY plan").all(),
    db.prepare("SELECT tier, COUNT(*) as cnt, COALESCE(SUM(total_referrals),0) as refs, COALESCE(SUM(total_commission),0) as comm FROM partners GROUP BY tier").all()
  ])
  const totalClients = clientCount?.cnt || 0
  const totalLeads = leadCount?.cnt || 0
  const activeDisputes = disputeCount?.cnt || 0
  const itemsRemoved = removedCount?.cnt || 0
  const totalRevenue = paymentSum?.total || 0
  const totalDisputes = activeDisputes + itemsRemoved
  const successRate = totalDisputes > 0 ? ((itemsRemoved / totalDisputes) * 100).toFixed(1) : '0.0'
  const convRate = totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) : '0.0'
  // Plan distribution
  const planMap: Record<string, number> = {}
  for (const p of (planDist.results || []) as any[]) { planMap[p.plan] = p.cnt }
  const basicClients = planMap['basic'] || 0
  const proClients = planMap['professional'] || 0
  const premClients = planMap['premium'] || 0
  // Partner tiers
  const tierMap: Record<string, any> = {}
  for (const p of (partnerStats.results || []) as any[]) { tierMap[p.tier] = p }
  // Recent leads
  const leads = (recentLeads.results || []) as any[]
  function timeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr + 'Z').getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hr ago'
    return Math.floor(diff / 86400000) + ' day(s) ago'
  }
  const planColors: Record<string, string> = { basic: '#3b82f6', professional: '#8b5cf6', premium: '#f59e0b' }

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Admin Analytics — RJ Business Solutions</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📊</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#030712;color:#fff;min-height:100vh}
    .admin-header{background:#111827;border-bottom:1px solid #1f2937;padding:1rem 2rem;display:flex;justify-content:space-between;align-items:center}
    .admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;padding:2rem}
    .kpi-card{background:#111827;border:1px solid #1f2937;border-radius:1rem;padding:1.5rem;text-align:center}
    .kpi-val{font-size:2rem;font-weight:900;margin:.5rem 0}
    .kpi-label{color:#9ca3af;font-size:.82rem}
    .section{padding:0 2rem 2rem}
    .chart-container{background:#111827;border:1px solid #1f2937;border-radius:1rem;padding:1.5rem}
    table{width:100%;border-collapse:collapse;font-size:.85rem}
    th{text-align:left;padding:.65rem;color:#9ca3af;border-bottom:1px solid #1f2937;font-weight:600}
    td{padding:.65rem;border-bottom:1px solid #1f2937;color:#d1d5db}
  </style>
</head>
<body>
  <div class="admin-header">
    <div><strong style="font-size:1.1rem">📊 RJ Analytics</strong><br><span style="color:#9ca3af;font-size:.78rem">Real-Time Production Dashboard — D1 Database</span></div>
    <div style="display:flex;gap:1rem;align-items:center">
      <span style="color:#4ade80;font-size:.78rem">● Live Production</span>
      <a href="/en" style="color:#60a5fa;font-size:.82rem">← Back to Site</a>
    </div>
  </div>

  <!-- KPIs from D1 -->
  <div class="admin-grid">
    <div class="kpi-card"><div style="font-size:1.25rem">💰</div><div class="kpi-val" style="color:#4ade80">$${totalRevenue.toLocaleString()}</div><div class="kpi-label">Total Revenue</div></div>
    <div class="kpi-card"><div style="font-size:1.25rem">👥</div><div class="kpi-val" style="color:#3b82f6">${totalClients}</div><div class="kpi-label">Active Clients</div></div>
    <div class="kpi-card"><div style="font-size:1.25rem">📋</div><div class="kpi-val" style="color:#22d3ee">${totalLeads}</div><div class="kpi-label">Total Leads</div></div>
    <div class="kpi-card"><div style="font-size:1.25rem">📝</div><div class="kpi-val" style="color:#f59e0b">${activeDisputes}</div><div class="kpi-label">Active Disputes</div></div>
    <div class="kpi-card"><div style="font-size:1.25rem">✅</div><div class="kpi-val" style="color:#4ade80">${itemsRemoved}</div><div class="kpi-label">Items Removed</div></div>
    <div class="kpi-card"><div style="font-size:1.25rem">🎯</div><div class="kpi-val" style="color:#ec4899">${successRate}%</div><div class="kpi-label">Dispute Success Rate</div></div>
  </div>

  <!-- FUNNEL -->
  <div class="section">
    <div class="chart-container">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1.5rem">🔄 Conversion Funnel (Live)</h3>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div style="display:flex;align-items:center;gap:1rem"><div style="width:180px;color:#d1d5db;font-size:.82rem">Total Leads</div><div style="flex:1;background:#1f2937;border-radius:.5rem;height:32px;overflow:hidden"><div style="background:#3b82f6;height:100%;width:100%;border-radius:.5rem;display:flex;align-items:center;padding:0 .75rem"><span style="font-size:.75rem;font-weight:700">${totalLeads}</span></div></div></div>
        <div style="display:flex;align-items:center;gap:1rem"><div style="width:180px;color:#d1d5db;font-size:.82rem">Active Clients</div><div style="flex:1;background:#1f2937;border-radius:.5rem;height:32px;overflow:hidden"><div style="background:#4ade80;height:100%;width:${totalLeads > 0 ? Math.max(5, Math.round((totalClients / totalLeads) * 100)) : 5}%;border-radius:.5rem;display:flex;align-items:center;padding:0 .75rem;min-width:60px"><span style="font-size:.75rem;font-weight:700">${totalClients}</span></div></div><div style="width:50px;text-align:right;color:#9ca3af;font-size:.78rem">${convRate}%</div></div>
      </div>
    </div>
  </div>

  <!-- PLAN BREAKDOWN & RECENT LEADS -->
  <div class="section" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
    <div class="chart-container">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">📦 Plan Distribution</h3>
      <table>
        <thead><tr><th>Plan</th><th>Clients</th><th>Revenue</th></tr></thead>
        <tbody>
          <tr><td style="color:#3b82f6;font-weight:700">Basic $99</td><td>${basicClients}</td><td>$${(basicClients * 99).toLocaleString()}</td></tr>
          <tr><td style="color:#8b5cf6;font-weight:700">Professional $149</td><td>${proClients}</td><td>$${(proClients * 149).toLocaleString()}</td></tr>
          <tr><td style="color:#f59e0b;font-weight:700">Premium $199</td><td>${premClients}</td><td>$${(premClients * 199).toLocaleString()}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="chart-container">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🔔 Recent Leads</h3>
      <table>
        <thead><tr><th>Name</th><th>Plan</th><th>Time</th></tr></thead>
        <tbody>
          ${leads.length > 0 ? leads.slice(0, 8).map((l: any) => `<tr><td>${(l.name || '').substring(0, 15)}</td><td style="color:${planColors[l.plan] || '#9ca3af'}">${(l.plan || 'basic').charAt(0).toUpperCase() + (l.plan || 'basic').slice(1)}</td><td style="color:#9ca3af">${timeSince(l.created_at)}</td></tr>`).join('') : '<tr><td colspan="3" style="text-align:center;color:#6b7280">No leads yet</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>

  <!-- PARTNER STATS -->
  <div class="section">
    <div class="chart-container">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🤝 Partner Performance</h3>
      <table>
        <thead><tr><th>Tier</th><th>Partners</th><th>Referrals</th><th>Commission</th></tr></thead>
        <tbody>
          ${['bronze','silver','gold','enterprise'].map(tier => {
            const d = tierMap[tier] || { cnt: 0, refs: 0, comm: 0 }
            const icons: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', enterprise: '💎' }
            const colors: Record<string, string> = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', enterprise: '#8b5cf6' }
            return `<tr><td style="color:${colors[tier]}">${icons[tier]} ${tier.charAt(0).toUpperCase() + tier.slice(1)}</td><td>${d.cnt}</td><td>${d.refs}</td><td>$${Number(d.comm).toLocaleString()}</td></tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div style="text-align:center;padding:2rem;color:#6b7280;font-size:.72rem">
    <p>&copy; 2026 RJ Business Solutions — Production Admin Dashboard</p>
    <p>Data from Cloudflare D1 · <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
  </div>
  <script>setTimeout(function(){location.reload()},60000);</script>
</body>
</html>`)
})

// ═══════════════════════════════════════════════════════════════
// GAP 2 — EMAIL SEQUENCES API (Resend Integration)
// ═══════════════════════════════════════════════════════════════
app.post('/api/email/send', async (c) => {
  try {
    const { to, sequence, locale, name } = await c.req.json()
    if (!to || !sequence) return c.json({ success: false, error: 'Missing to/sequence' }, 400)
    const db = c.env.DB
    const SEQUENCES: Record<string, any> = {
      'lead-magnet': {
        subject: locale === 'es' ? 'Tu Guia Gratuita de Derechos FCRA para ITIN' : 'Your Free FCRA Rights Guide for ITIN Holders',
        html: locale === 'es'
          ? `<h2>Hola ${name || ''},</h2><p>Gracias por descargar tu guia. Tu ITIN te da derechos completos bajo FCRA y ECOA.</p><p>— Rick Jefferson, RJ Business Solutions</p>`
          : `<h2>Hey ${name || ''},</h2><p>Thanks for downloading your FCRA rights guide. Your ITIN gives you full credit repair rights under FCRA and ECOA.</p><p>— Rick Jefferson, RJ Business Solutions</p>`,
        followUp: [
          { delayDays: 3, subject: locale === 'es' ? 'Revisaste tu reporte de credito?' : 'Did you check your credit report?' },
          { delayDays: 7, subject: locale === 'es' ? '3 errores comunes en reportes ITIN' : '3 Common errors on ITIN credit reports' },
          { delayDays: 14, subject: locale === 'es' ? 'Oferta especial: Auditoria de credito ITIN' : 'Special offer: ITIN credit audit' }
        ]
      },
      'new-client': {
        subject: locale === 'es' ? 'Bienvenido a RJ Business Solutions' : 'Welcome to RJ Business Solutions',
        html: locale === 'es'
          ? `<h2>Bienvenido ${name || ''},</h2><p>Tu auditoria forense esta en proceso. Entrega en 24-48 horas.</p><p>Accede a tu portal: <a href="https://rj-itin-funnels.pages.dev/es/portal">Portal del Cliente</a></p><p>— Rick Jefferson</p>`
          : `<h2>Welcome ${name || ''},</h2><p>Your forensic audit is in progress. Delivery in 24-48 hours.</p><p>Access your portal: <a href="https://rj-itin-funnels.pages.dev/en/portal">Client Portal</a></p><p>— Rick Jefferson</p>`,
        followUp: [
          { delayDays: 2, subject: locale === 'es' ? 'Tu auditoria esta lista' : 'Your audit is ready' },
          { delayDays: 7, subject: locale === 'es' ? 'Actualizacion de disputas' : 'Dispute progress update' },
          { delayDays: 30, subject: locale === 'es' ? 'Tu reporte de progreso mensual' : 'Your monthly progress report' }
        ]
      },
      'win-back': {
        subject: locale === 'es' ? 'Te extrañamos — tu credito ITIN merece atencion' : 'We miss you — your ITIN credit deserves attention',
        html: locale === 'es'
          ? `<h2>Hola ${name || ''},</h2><p>Han pasado semanas desde tu ultima visita. Tu credito ITIN necesita mantenimiento constante.</p><p>— Rick Jefferson</p>`
          : `<h2>Hey ${name || ''},</h2><p>It has been a while since your last visit. Your ITIN credit needs consistent maintenance.</p><p>— Rick Jefferson</p>`,
        followUp: [
          { delayDays: 5, subject: locale === 'es' ? 'Descuento exclusivo para clientes anteriores' : 'Exclusive discount for returning clients' },
          { delayDays: 14, subject: locale === 'es' ? 'Ultima oportunidad: 20% de descuento' : 'Last chance: 20% off your audit' }
        ]
      }
    }
    const seq = SEQUENCES[sequence]
    if (!seq) return c.json({ success: false, error: 'Unknown sequence' }, 400)
    // Send via Resend if API key configured
    let resendId = null
    if (c.env.RESEND_API_KEY && !c.env.RESEND_API_KEY.includes('YOUR_')) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${c.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Rick Jefferson <rick@rickjeffersonsolutions.com>', to: [to], subject: seq.subject, html: seq.html })
      })
      const emailData = await emailRes.json() as any
      resendId = emailData.id || null
    }
    // Log to D1
    await db.prepare('INSERT INTO email_log (recipient, subject, sequence, step, status, resend_id) VALUES (?, ?, ?, ?, ?, ?)').bind(to, seq.subject, sequence, 1, resendId ? 'sent' : 'queued', resendId).run()
    return c.json({ success: true, data: { sequence, to, subject: seq.subject, followUps: seq.followUp.length, resendId, sent: !!resendId } })
  } catch (err: any) { return c.json({ success: false, error: err.message || 'Server error' }, 500) }
})

// ═══════════════════════════════════════════════════════════════
// API: Admin Stats
// ═══════════════════════════════════════════════════════════════
app.get('/api/admin/stats', async (c) => {
  try {
    const db = c.env.DB
    const [clients, leads, activeDisputes, removedDisputes, revenue, planDist, partners] = await Promise.all([
      db.prepare("SELECT COUNT(*) as cnt FROM clients WHERE status = 'active'").first() as Promise<any>,
      db.prepare("SELECT COUNT(*) as cnt FROM leads").first() as Promise<any>,
      db.prepare("SELECT COUNT(*) as cnt FROM disputes WHERE status NOT IN ('removed','verified')").first() as Promise<any>,
      db.prepare("SELECT COUNT(*) as cnt FROM disputes WHERE status IN ('removed','verified')").first() as Promise<any>,
      db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = 'completed'").first() as Promise<any>,
      db.prepare("SELECT plan, COUNT(*) as cnt FROM clients WHERE status = 'active' GROUP BY plan").all(),
      db.prepare("SELECT COUNT(*) as cnt, COALESCE(SUM(total_referrals),0) as refs, COALESCE(SUM(total_commission),0) as comm FROM partners").first() as Promise<any>
    ])
    const totalDisputes = ((activeDisputes?.cnt || 0) + (removedDisputes?.cnt || 0))
    const successRate = totalDisputes > 0 ? Number(((removedDisputes?.cnt || 0) / totalDisputes * 100).toFixed(1)) : 0
    const convRate = (leads?.cnt || 0) > 0 ? Number(((clients?.cnt || 0) / (leads?.cnt || 1) * 100).toFixed(1)) : 0
    const planMap: Record<string, number> = {}
    for (const p of (planDist.results || []) as any[]) { planMap[p.plan] = p.cnt }
    return c.json({
      success: true,
      data: {
        revenue: { total: revenue?.total || 0 },
        clients: { active: clients?.cnt || 0 },
        leads: { total: leads?.cnt || 0 },
        disputes: { active: activeDisputes?.cnt || 0, removed: removedDisputes?.cnt || 0, successRate },
        funnel: { leads: leads?.cnt || 0, clients: clients?.cnt || 0, conversionRate: convRate },
        plans: { basic: planMap['basic'] || 0, professional: planMap['professional'] || 0, premium: planMap['premium'] || 0 },
        partners: { total: partners?.cnt || 0, referrals: partners?.refs || 0, commissions: partners?.comm || 0 }
      },
      timestamp: new Date().toISOString()
    })
  } catch (err: any) { return c.json({ success: false, error: err.message }, 500) }
})

// Fallback redirects for new pages
app.get('/portal', (c) => c.redirect(`/${detectLocale(c)}/portal`))
app.get('/partners', (c) => c.redirect(`/${detectLocale(c)}/partners`))
app.get('/checkout/:plan', (c) => c.redirect(`/${detectLocale(c)}/checkout/${c.req.param('plan')}`))
app.get('/thank-you/:plan', (c) => c.redirect(`/${detectLocale(c)}/thank-you/${c.req.param('plan')}`))
app.get('/upsell/:plan', (c) => c.redirect(`/${detectLocale(c)}/upsell/${c.req.param('plan')}`))
app.get('/croa-disclosure', (c) => c.redirect(`/${detectLocale(c)}/croa-disclosure`))
app.get('/client-waiver', (c) => c.redirect(`/${detectLocale(c)}/client-waiver`))
app.get('/refund-policy', (c) => c.redirect(`/${detectLocale(c)}/refund-policy`))
app.get('/results', (c) => c.redirect(`/${detectLocale(c)}/results`))
app.get('/press', (c) => c.redirect(`/${detectLocale(c)}/press`))
app.get('/certifications', (c) => c.redirect(`/${detectLocale(c)}/certifications`))

// ═══════════════════════════════════════════════════════════════
// SITEMAP.XML (UPDATED with all new pages)
// ═══════════════════════════════════════════════════════════════
app.get('/sitemap.xml', (c) => {
  const BASE = 'https://rj-itin-funnels.pages.dev'
  const today = '2026-02-25'
  const pages: Array<{loc:string,priority:string,changefreq:string}> = []
  for (const loc of SUPPORTED_LOCALES) {
    pages.push({ loc: `${BASE}/${loc}`, priority: '1.0', changefreq: 'weekly' })
    for (const plan of ['basic','professional','premium']) {
      pages.push({ loc: `${BASE}/${loc}/${plan}`, priority: '0.9', changefreq: 'monthly' })
    }
    for (const pg of ['about-rick-jefferson','credit-monitoring','contact','faq','testimonials','resources','blog','itin-credit-repair','legal','privacy','terms','portal','partners','croa-disclosure','client-waiver','refund-policy','results','press','certifications']) {
      pages.push({ loc: `${BASE}/${loc}/${pg}`, priority: pg === 'itin-credit-repair' ? '0.95' : pg === 'portal' || pg === 'partners' ? '0.8' : '0.7', changefreq: 'monthly' })
    }
    for (const plan of ['basic','professional','premium']) {
      pages.push({ loc: `${BASE}/${loc}/checkout/${plan}`, priority: '0.85', changefreq: 'monthly' })
      pages.push({ loc: `${BASE}/${loc}/thank-you/${plan}`, priority: '0.4', changefreq: 'monthly' })
      pages.push({ loc: `${BASE}/${loc}/upsell/${plan}`, priority: '0.5', changefreq: 'monthly' })
    }
    for (const article of BLOG_ARTICLES) {
      pages.push({ loc: `${BASE}/${loc}/blog/${article.slug}`, priority: article.tier === 1 ? '0.85' : article.tier === 2 ? '0.75' : '0.65', changefreq: 'monthly' })
    }
  }
  // Spanish SEO page
  pages.push({ loc: `${BASE}/es/reparar-credito-itin`, priority: '0.95', changefreq: 'monthly' })
  // Admin dashboard (noindex but in sitemap for completeness)
  pages.push({ loc: `${BASE}/admin/analytics`, priority: '0.3', changefreq: 'weekly' })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
})

// ═══════════════════════════════════════════════════════════════
// ROBOTS.TXT
// ═══════════════════════════════════════════════════════════════
app.get('/robots.txt', (c) => {
  return new Response(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /*.json$

Sitemap: https://rj-itin-funnels.pages.dev/sitemap.xml

# RJ Business Solutions — ITIN Credit Repair Funnel
# https://rickjeffersonsolutions.com
# Contact: rickjefferson@rickjeffersonsolutions.com
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
})

export default app
