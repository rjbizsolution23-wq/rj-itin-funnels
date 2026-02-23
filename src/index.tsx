import { Hono } from 'hono'
import { cors } from 'hono/cors'

// ═══════════════════════════════════════════════════════════════
// RJ BUSINESS SOLUTIONS — ITIN MULTI-LANGUAGE FUNNEL SYSTEM
// 5 Languages: EN, ES, PT, FR, HT | 3 Plans: Basic, Pro, Premium
// ═══════════════════════════════════════════════════════════════

type Bindings = {
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
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
  const pid = PLANS[plan as keyof typeof PLANS]?.mfsnPid || '49914'
  const aid = c.env?.MFSN_AID || 'RickJeffersonSolutions'
  return `https://myfreescorenow.com/enroll/?AID=${aid}&PID=${pid}`
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
.hero{position:relative;min-height:85vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0c1445,#1e1b4b 30%,#172554 60%,#0f172a);padding:4rem 0 5rem;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 800px 600px at 20% 50%,rgba(59,130,246,.1),transparent),radial-gradient(ellipse 600px 400px at 80% 30%,rgba(6,182,212,.07),transparent)}
.hero-logo{margin-bottom:1.5rem;animation:fadeInUp .8s ease forwards}
.hero-logo img{width:280px;height:auto;margin:0 auto;border-radius:.75rem;filter:drop-shadow(0 8px 32px rgba(59,130,246,.2))}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.4);border-radius:999px;padding:.45rem 1.1rem;margin-bottom:1.25rem;color:#6ee7b7;font-size:.82rem;font-weight:600}
.hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;line-height:1.15;margin-bottom:1rem}
.hero .sub{font-size:clamp(.95rem,2vw,1.15rem);color:#bfdbfe;max-width:700px;margin:0 auto 2rem;line-height:1.7}

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
.bio-img{width:200px;height:200px;border-radius:1rem;background:linear-gradient(135deg,#1e3a5f,#172554);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:5rem}
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
  .bio-img{width:150px;height:150px}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .hero-logo img{width:200px}
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
function pageLayout(locale: string, title: string, content: string): string {
  const T = (key: string) => t(locale, key)
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | RJ Business Solutions</title>
  <meta name="description" content="${T('hero_sub').replace(/<[^>]*>/g, '').substring(0, 160)}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛡️</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
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
        <a href="/${locale}/legal">${T('nav_legal')}</a>
      </div>
    </div>
  </nav>

  ${content}

  <!-- FOOTER -->
  <footer class="footer">
    <div class="cx">
      <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" class="footer-logo" style="height:36px;margin:0 auto 1rem;border-radius:4px">
      <p><strong style="color:#d1d5db">RJ Business Solutions</strong><br>1342 NM 333, Tijeras, New Mexico 87059<br><a href="https://rickjeffersonsolutions.com">rickjeffersonsolutions.com</a> &bull; <a href="mailto:rickjefferson@rickjeffersonsolutions.com">rickjefferson@rickjeffersonsolutions.com</a></p>
      <div class="footer-links">
        <a href="/${locale}/legal">${T('nav_legal')}</a> &bull;
        <a href="/${locale}/privacy">${T('nav_privacy')}</a> &bull;
        <a href="/${locale}/terms">${T('nav_terms')}</a>
      </div>
      <p style="margin-top:.5rem">&copy; 2026 RJ Business Solutions. All rights reserved.</p>
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

  return pageLayout(locale, T('site_title'), `
  <!-- HERO -->
  <section class="hero">
    <div class="cx tc" style="position:relative;z-index:2">
      <div class="hero-logo">
        <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" width="280">
      </div>
      <div class="hero-badge">⭐ ${T('hero_badge')}</div>
      <h1>${T('hero_title')}</h1>
      <p class="sub">${T('hero_sub')}</p>
      <a href="#plans" class="btn-primary">${T('hero_cta')} →</a>
      <p style="color:#6b7280;font-size:.78rem;margin-top:1rem">${T('spots_left')}</p>
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

  <!-- PLAN CARDS -->
  <section id="plans" style="padding:5rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)">
    <div class="ct tc">
      <h2 class="stt ao">${T('plans_title')}</h2>
      <p class="sts ao">${T('plans_sub')}</p>

      <div class="plans-grid">
        <!-- BASIC -->
        <div class="plan-card ao s1">
          <div class="plan-name" style="color:#3b82f6">${T('plan_basic')}</div>
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
          <a href="/${locale}/basic" class="plan-btn" style="background:linear-gradient(135deg,#3b82f6,#2563eb)">${T('plan_start')} ${T('plan_basic')} →</a>
          <p class="plan-notes">$99 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>

        <!-- PROFESSIONAL (Featured) -->
        <div class="plan-card featured ao s2">
          <div class="plan-tag">${T('plan_pro_tag')}</div>
          <div class="plan-name" style="color:#8b5cf6">${T('plan_pro')}</div>
          <div class="plan-target">${T('plan_pro_target')}</div>
          <div class="plan-price">$149<span>${T('plan_per_month')}</span></div>
          <p class="plan-desc">${T('plan_pro_desc')}</p>
          <ul class="plan-features">
            <li>${T('feat_audit')}</li>
            <li>${T('feat_roadmap')}</li>
            <li>${T('up_to')} 25 ${T('feat_disputes')}</li>
            <li>${T('feat_reports')}</li>
            <li>${T('feat_support')}</li>
            <li>${T('feat_library')}</li>
            <li>${T('feat_analyst')}</li>
            <li>${T('feat_creditor')}</li>
          </ul>
          <a href="/${locale}/professional" class="plan-btn" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)">${T('plan_start')} ${T('plan_pro')} →</a>
          <p class="plan-notes">$149 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>

        <!-- PREMIUM -->
        <div class="plan-card ao s3">
          <div class="plan-name" style="color:#f59e0b">${T('plan_premium')}</div>
          <div class="plan-target">${T('plan_premium_target')}</div>
          <div class="plan-price">$199<span>${T('plan_per_month')}</span></div>
          <p class="plan-desc">${T('plan_premium_desc')}</p>
          <ul class="plan-features">
            <li>${T('feat_audit')}</li>
            <li>${T('feat_roadmap')}</li>
            <li>${T('up_to')} 40 ${T('feat_disputes')}</li>
            <li>${T('feat_reports')}</li>
            <li>${T('feat_support')}</li>
            <li>${T('feat_library')}</li>
            <li>${T('feat_analyst')}</li>
            <li>${T('feat_priority')}</li>
            <li>${T('feat_creditor')}</li>
            <li>${T('feat_goodwill')}</li>
          </ul>
          <a href="/${locale}/premium" class="plan-btn" style="background:linear-gradient(135deg,#f59e0b,#d97706)">${T('plan_start')} ${T('plan_premium')} →</a>
          <p class="plan-notes">$199 ${T('plan_audit_fee')} + ${T('plan_monitoring')}</p>
        </div>
      </div>
      <p class="ao" style="color:#4ade80;font-weight:700;margin-top:1.5rem;font-size:.95rem">✓ ${T('plan_guarantee')} &bull; ✓ ${T('plan_no_pay')}</p>
    </div>
  </section>

  <!-- ITIN RIGHTS -->
  <section class="rights">
    <div class="cs tc">
      <h2 class="stt ao">${T('rights_title')}</h2>
      <p class="sts ao">${T('rights_sub')}</p>
      <div class="rights-grid">
        <div class="right-card ao s1"><h4>ECOA (15 U.S.C. § 1691)</h4><p>${T('rights_ecoa')}</p></div>
        <div class="right-card ao s2"><h4>FCRA (15 U.S.C. § 1681)</h4><p>${T('rights_fcra')}</p></div>
        <div class="right-card ao s3"><h4>CROA (15 U.S.C. § 1679)</h4><p>${T('rights_croa')}</p></div>
        <div class="right-card ao s4"><h4>FDCPA (15 U.S.C. § 1692)</h4><p>${T('rights_fdcpa')}</p></div>
      </div>
    </div>
  </section>

  <!-- RICK BIO -->
  <section class="bio">
    <div class="cs">
      <div class="bio-card ao">
        <div class="bio-img">👨‍💼</div>
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
        <div style="font-size:3rem;margin-bottom:.75rem">🛡️</div>
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

  <!-- COMPLIANCE FOOTER -->
  <section class="comp-footer">
    <div class="ct">
      <h3 style="text-align:center;font-size:1.1rem;font-weight:700;color:#9ca3af;margin-bottom:1rem">${T('comp_title')}</h3>
      <p style="text-align:center;color:#6b7280;font-size:.78rem;margin-bottom:1.5rem">${T('comp_notice')}</p>
      <div class="comp-grid">
        <div class="comp-item"><h4>CROA</h4><p>${T('comp_croa')}</p></div>
        <div class="comp-item"><h4>FCRA</h4><p>${T('comp_fcra')}</p></div>
        <div class="comp-item"><h4>ECOA</h4><p>${T('comp_ecoa')}</p></div>
        <div class="comp-item"><h4>FDCPA</h4><p>${T('comp_fdcpa')}</p></div>
        <div class="comp-item"><h4>TSR / FTC / CFPB</h4><p>${T('comp_tsr')}</p></div>
        <div class="comp-item"><h4>Identity Policy</h4><p>${T('comp_identity')}</p></div>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:.75rem;margin-top:1rem">${T('comp_contact')} <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
    </div>
  </section>
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

  const features = [
    T('feat_audit'),
    T('feat_roadmap'),
    `${T('up_to')} ${cfg.disputes} ${T('feat_disputes')}`,
    T('feat_reports'),
    T('feat_support'),
    T('feat_library'),
  ]
  if (plan === 'professional' || plan === 'premium') {
    features.push(T('feat_analyst'), T('feat_creditor'))
  }
  if (plan === 'premium') {
    features.push(T('feat_priority'), T('feat_goodwill'))
  }

  return pageLayout(locale, `${planName} Plan — ${T('site_title')}`, `
  <!-- PLAN HERO -->
  <section class="hero" style="min-height:auto;padding:4rem 0">
    <div class="cx tc" style="position:relative;z-index:2">
      <div class="hero-logo">
        <img src="https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg" alt="RJ Business Solutions" width="240">
      </div>
      <div style="display:inline-block;background:${cfg.color}22;border:1px solid ${cfg.color}66;padding:.35rem 1rem;border-radius:999px;margin-bottom:1rem">
        <span style="color:${cfg.color};font-weight:700;font-size:.85rem">${T(targetKey)}</span>
      </div>
      <h1 style="font-size:clamp(1.75rem,4vw,3rem)">${planName} <span class="gt">ITIN Credit Repair</span></h1>
      <p class="sub">${T(descKey)}</p>
      <div style="font-size:3.5rem;font-weight:900;margin:1rem 0">$${cfg.price}<span style="font-size:1rem;color:#9ca3af">${T('plan_per_month')}</span></div>
      <button class="btn-primary" onclick="document.getElementById('leadModal').classList.add('active')">${T('plan_start')} ${planName} →</button>
      <p style="color:#6b7280;font-size:.78rem;margin-top:1rem">$${cfg.price} ${T('plan_audit_fee')} + ${T('plan_monitoring')} &bull; ${T('plan_no_pay')}</p>
    </div>
  </section>

  <!-- FEATURES -->
  <section style="padding:4rem 0;background:linear-gradient(180deg,#0a0f1f,#0f172a)">
    <div class="cs">
      <h2 class="stt tc ao">${T('includes')}</h2>
      <div style="margin-top:2rem">
        ${features.map((f, i) => `
        <div class="ao s${Math.min(i+1,4)}" style="display:flex;align-items:center;gap:1rem;background:#111827;border:1px solid #1f2937;border-radius:.75rem;padding:1rem 1.5rem;margin-bottom:.75rem">
          <span style="color:#4ade80;font-weight:700;font-size:1.25rem">✓</span>
          <span style="font-size:.95rem;font-weight:600">${f}</span>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- ITIN RIGHTS -->
  <section class="rights">
    <div class="cs tc">
      <h2 class="stt ao">${T('rights_title')}</h2>
      <p class="sts ao">${T('rights_sub')}</p>
      <div class="rights-grid">
        <div class="right-card ao s1"><h4>ECOA</h4><p>${T('rights_ecoa')}</p></div>
        <div class="right-card ao s2"><h4>FCRA</h4><p>${T('rights_fcra')}</p></div>
        <div class="right-card ao s3"><h4>CROA</h4><p>${T('rights_croa')}</p></div>
        <div class="right-card ao s4"><h4>FDCPA</h4><p>${T('rights_fdcpa')}</p></div>
      </div>
    </div>
  </section>

  <!-- RICK BIO -->
  <section class="bio">
    <div class="cs">
      <div class="bio-card ao">
        <div class="bio-img">👨‍💼</div>
        <div class="bio-content">
          <h3>${T('bio_title')}</h3>
          <div class="role">${T('bio_role')}</div>
          <p>${T('bio_p1')}</p>
          <blockquote>${T('bio_p3')}</blockquote>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="faq">
    <div class="cs">
      <h2 class="stt tc ao">${T('faq_title')}</h2>
      <div style="margin-top:2rem">
        ${[1,2,3,5,6].map(n => `
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
        <div style="font-size:3rem;margin-bottom:.75rem">🛡️</div>
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

  <!-- COMPLIANCE FOOTER -->
  <section class="comp-footer">
    <div class="ct">
      <h3 style="text-align:center;font-size:1rem;font-weight:700;color:#9ca3af;margin-bottom:1rem">${T('comp_title')}</h3>
      <p style="text-align:center;color:#6b7280;font-size:.75rem;margin-bottom:1rem">${T('comp_notice')}</p>
      <div class="comp-grid">
        <div class="comp-item"><h4>CROA</h4><p>${T('comp_croa')}</p></div>
        <div class="comp-item"><h4>FCRA</h4><p>${T('comp_fcra')}</p></div>
        <div class="comp-item"><h4>ECOA</h4><p>${T('comp_ecoa')}</p></div>
        <div class="comp-item"><h4>FDCPA</h4><p>${T('comp_fdcpa')}</p></div>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:.72rem;margin-top:1rem">${T('comp_contact')} <a href="mailto:rickjefferson@rickjeffersonsolutions.com" style="color:#60a5fa">rickjefferson@rickjeffersonsolutions.com</a></p>
    </div>
  </section>

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
// API ROUTES
// ═══════════════════════════════════════════════════════════════
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy', project: 'rj-itin-funnels', timestamp: new Date().toISOString(), locales: SUPPORTED_LOCALES, plans: Object.keys(PLANS) })
})

app.post('/api/leads', async (c) => {
  try {
    const { name, email, phone, plan, locale } = await c.req.json()
    if (!name || !email) return c.json({ success: false, error: 'Name and email required' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ success: false, error: 'Invalid email' }, 400)
    console.log(`[LEAD] ${name} <${email}> plan=${plan||'basic'} locale=${locale||'en'}`)
    const mfsnUrl = getMfsnUrl(c, plan || 'basic')
    return c.json({ success: true, data: { leadId: Date.now(), name, email, plan: plan || 'basic', mfsnUrl } })
  } catch (err) { return c.json({ success: false, error: 'Server error' }, 500) }
})

app.post('/api/checkout', async (c) => {
  try {
    const { email, name, leadId, plan } = await c.req.json()
    const planKey = (plan || 'basic') as keyof typeof PLANS
    const cfg = PLANS[planKey] || PLANS.basic
    if (!c.env.STRIPE_SECRET_KEY) return c.json({ success: false, error: 'Payment not configured' }, 503)
    const params = new URLSearchParams()
    params.append('mode', 'payment')
    params.append('success_url', `${c.req.header('origin') || 'https://rj-itin-funnels.pages.dev'}/en/success?plan=${planKey}`)
    params.append('cancel_url', `${c.req.header('origin') || 'https://rj-itin-funnels.pages.dev'}/en/${planKey}?canceled=true`)
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
    if (session.error) return c.json({ success: false, error: 'Payment session failed' }, 500)
    return c.json({ success: true, checkoutUrl: session.url, sessionId: session.id })
  } catch (err) { return c.json({ success: false, error: 'Checkout error' }, 500) }
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
}

// Fallback redirects for non-locale paths
app.get('/basic', (c) => c.redirect(`/${detectLocale(c)}/basic`))
app.get('/professional', (c) => c.redirect(`/${detectLocale(c)}/professional`))
app.get('/premium', (c) => c.redirect(`/${detectLocale(c)}/premium`))
app.get('/legal', (c) => c.redirect(`/${detectLocale(c)}/legal`))
app.get('/privacy', (c) => c.redirect(`/${detectLocale(c)}/privacy`))
app.get('/terms', (c) => c.redirect(`/${detectLocale(c)}/terms`))
app.get('/success', (c) => c.redirect(`/${detectLocale(c)}/success`))

export default app
