const TRANSLATIONS = {
  en: {
    nav_features: 'Features',
    nav_about: 'About',
    nav_pricing: 'Pricing',
    login: 'Log In',
    get_started: 'Get Started',
    hero_h1: 'Manage Your Business with Confidence',
    hero_p: "The all-in-one platform to streamline operations, boost productivity, and drive growth. From HR to Accounting, we've got you covered.",
    start_trial: 'Start Free Trial',
    watch_demo: 'Watch Demo',
    no_card: 'No credit card required',
    free_trial: '14-day free trial',
    everything_title: 'Everything You Need',
    everything_sub: 'Powerful tools integrated into one seamless ecosystem.',
    features: [
      { title: 'Advanced Analytics', text: 'Gain deep insights into your business performance with real-time dashboards and custom reports.' },
      { title: 'Financial Management', text: 'Track income, expenses, and cash flow. Generate invoices and manage payments effortlessly.' },
      { title: 'HR & Payroll', text: 'Manage employee data, attendance, leave, and payroll processing in one centralized system.' },
      { title: 'Inventory Control', text: 'Keep track of stock levels, manage warehouses, and automate reordering to prevent stockouts.' },
      { title: 'Project Management', text: 'Plan, execute, and track projects. Assign tasks, set deadlines, and collaborate with your team.' },
      { title: 'And Much More...', text: 'CRM, Supplier Management, Document Control, and many other features to run your business.' }
    ],
    about_title: 'Empowering Rwandan Businesses',
    about_p: 'BusinessOS is dedicated to providing local enterprises with world-class management tools tailored for the Rwandan market.',
    stat_users: 'Active Users',
    stat_uptime: 'Uptime',
    stat_support: 'Support',
    about_benefits: [
      'Localized for Rwandan Tax Compliance',
      'Seamless Mobile Money Integration',
      'Dedicated Local Support Team'
    ],
    pricing_title: 'Simple, Transparent Pricing',
    pricing_sub: 'Choose the plan that fits your business size. All prices in FRW.',
    plans: [
      { title: 'Starter', price: '25,000', text: 'Perfect for small shops and startups', features: ['Up to 3 Users', 'Basic Inventory', 'Sales Tracking'] },
      { title: 'Professional', price: '75,000', text: 'Ideal for growing businesses', features: ['Up to 15 Users', 'Full HR & Payroll', 'Multi-Warehouse', 'Advanced Analytics'], featured: true },
      { title: 'Enterprise', price: '150,000', text: 'For large scale operations', features: ['Unlimited Users', 'Custom Integrations', 'Dedicated Manager', '24/7 Priority Support'] }
    ],
    contact_sales: 'Contact Sales',
    choose_plan: 'Choose Plan',
    cta_h2: 'Ready to Transform Your Business?',
    cta_p: 'Join hundreds of Rwandan companies using BusinessOS to grow faster.',
    footer_about: 'Empowering businesses with intelligent software solutions.',
    footer_newsletter: 'Subscribe to our newsletter',
    newsletter_placeholder: 'Email address',
    copyright: '© 2026 BusinessOS. All rights reserved.'
  },
  rw: {
    nav_features: 'Ibiranga',
    nav_about: 'Ibyerekeye',
    nav_pricing: 'Ibiciro',
    login: 'Injira',
    get_started: 'Tangira',
    hero_h1: 'Gucunga ubucuruzi bwawe wizeye .',
    hero_p: "Urubuga rumwe rukomatanyije rugufasha koroshya imirimo, kongera umusaruro, no guteza imbere iterambere. Guhera ku micungire y’abakozi (HR) kugeza ku ibaruramari, byose turabigushyigikiye.",
    start_trial: 'Tangira igerageza k’ubuntu',
    watch_demo: 'Reba uko ikora (Demo)',
    no_card: 'Nta karita yo kwishyura isabwa',
    free_trial: 'Igerageza ry’iminsi 14 ku buntu',
    everything_title: 'Ibikenewe Byose',
    everything_sub: 'Ibikoresho bikomeye byinjijwe mu buryo bumwe butunganijwe.',
    features: [
      { title: 'Isesengura rihanitse', text: 'Gira ishusho y’imikorere y’ubucuruzi bwawe uko biri mu gihe nyacyo n’ibyegeranyo byihariye.' },
      { title: 'Imicungire y’Imari', text: 'Kurikirana inyungu winjiza, amafaranga asohoka, n’imizenguruko y’amafaranga. Kora inyemezabwishyu (invoices) kandi ucunge ubwishyu byoroshye kandi vuba' },
      { title: 'Abakozi & Umushahara', text: 'Cunga amakuru y’abakozi, ibikorwa, ibiruhuko, n’imishahara byose hamwe.' },
      { title: 'Imicungire y’Uruziga rw’Ibicuruzwa', text: 'Genzura stock, ucunge ububiko, kandi utezimbere gusubira mu igurishwa.' },
      { title: 'Imicungire y’Imishinga', text: 'Tegeka, shyira mu bikorwa, kandi ukurikirane imishinga. Tanga inshingano, shyiraho igihe ntarengwa, kandi mukorane.' },
      { title: 'N’ibindi byinshi...', text: 'CRM, Imicungire y’Abatanga, Igenzura ry’inyandiko, n’ibindi byinshi.' }
    ],
    about_title: 'Gushyigikira Amabanki y’u Rwanda',
    about_p: 'BusinessOS yashyiriweho gutanga ibikoresho by’imicungire bifatika ku masosiyete yo mu Rwanda.',
    stat_users: 'Abakoresha B’akazi',
    stat_uptime: 'Igihe cyo Gukora',
    stat_support: 'Ubushobozi bwo Gufasha',
    about_benefits: [
      'Biteguye gukurikiza imisoro y’u Rwanda',
      'Guhuza Mobile Money byoroshye',
      'Itsinda ry’Ubunyamwuga bw’aho'
    ],
    pricing_title: 'Ibiciro Byoroshye kandi Bisobanutse',
    pricing_sub: 'Hitamo gahunda ijyanye n’ubunini bw’ubucuruzi bwawe. Ibiciro byose mu FRW.',
    plans: [
      { title: 'Gutangira', price: '25,000', text: 'Byiza ku amaduka mato n’abatangizi', features: ['Abakoresha 3', 'Stock Yibanze', 'Kurikira Kugurisha'] },
      { title: 'Umwuga', price: '75,000', text: 'Byiza ku bacuruzi barimo gukura', features: ['Abakoresha 15', 'HR & Umushahara Byuzuye', 'Imbuga Nini', 'Isesengura rihanitse'], featured: true },
      { title: 'Enterprise', price: '150,000', text: 'Kuri ibikorwa binini', features: ['Abakoresha Batagira Icyiciro', 'Guhuza Byihariye', 'Umuyobozi Wawe', 'Inkunga 24/7'] }
    ],
    contact_sales: 'Vugana n’Ubucuruzi',
    choose_plan: 'Hitamo Gahunda',
    cta_h2: 'Witeguye guhindura ubucuruzi bwawe?',
    cta_p: 'Ukwishyira hamwe n’ibigo byinshi byo mu Rwanda bikoresha BusinessOS kugira ngo bikure vuba.',
    footer_about: 'Guteza imbere ubucuruzi hakoreshejwe software y’ubwenge.',
    footer_newsletter: 'Iyandikishe kuri newsletter yacu',
    newsletter_placeholder: 'Aderesi imeyili',
    copyright: '© 2026 BusinessOS. Uburenganzira bwose burabitswe.'
  },
  fr: {
    nav_features: 'Fonctionnalités',
    nav_about: 'À propos',
    nav_pricing: 'Tarifs',
    login: 'Se connecter',
    get_started: 'Commencer',
    hero_h1: 'Gérez votre entreprise en toute confiance',
    hero_p: "La plateforme tout-en-un pour rationaliser les opérations, accroître la productivité et stimuler la croissance. De la RH à la comptabilité, nous avons ce dont vous avez besoin.",
    start_trial: 'Essai gratuit',
    watch_demo: 'Voir la démo',
    no_card: "Aucune carte de crédit requise",
    free_trial: 'Essai gratuit de 14 jours',
    everything_title: 'Tout ce dont vous avez besoin',
    everything_sub: 'Des outils puissants intégrés dans un écosystème fluide.',
    features: [
      { title: 'Analytique avancée', text: 'Obtenez des informations approfondies sur les performances de votre entreprise avec des tableaux de bord en temps réel et des rapports personnalisés.' },
      { title: 'Gestion financière', text: 'Suivez les revenus, les dépenses et la trésorerie. Générez des factures et gérez les paiements facilement.' },
      { title: 'RH & Paie', text: 'Gérez les données des employés, la présence, les congés et la paie dans un système centralisé.' },
      { title: 'Gestion des stocks', text: 'Suivez les niveaux de stock, gérez les entrepôts et automatisez les réapprovisionnements.' },
      { title: 'Gestion de projet', text: 'Planifiez, exécutez et suivez les projets. Attribuez des tâches, fixez des délais et collaborez.' },
      { title: 'Et bien plus...', text: 'CRM, gestion des fournisseurs, contrôle documentaire et bien d’autres fonctionnalités.' }
    ],
    about_title: 'Soutenir les entreprises rwandaises',
    about_p: 'BusinessOS est dédié à fournir des outils de gestion de classe mondiale adaptés au marché rwandais.',
    stat_users: 'Utilisateurs actifs',
    stat_uptime: 'Disponibilité',
    stat_support: 'Support',
    about_benefits: [
      'Conforme aux règles fiscales du Rwanda',
      'Intégration Mobile Money transparente',
      'Équipe locale de support dédiée'
    ],
    pricing_title: 'Tarifs simples et transparents',
    pricing_sub: 'Choisissez le plan adapté à la taille de votre entreprise. Tous les prix en FRW.',
    plans: [
      { title: 'Starter', price: '25,000', text: 'Parfait pour les petites boutiques et les startups', features: ['Jusqu’à 3 utilisateurs', 'Gestion de stock basique', 'Suivi des ventes'] },
      { title: 'Professionnel', price: '75,000', text: 'Idéal pour les entreprises en croissance', features: ['Jusqu’à 15 utilisateurs', 'RH & paie complète', 'Multi-entrepôt', 'Analytique avancée'], featured: true },
      { title: 'Enterprise', price: '150,000', text: 'Pour les opérations à grande échelle', features: ['Utilisateurs illimités', 'Intégrations personnalisées', 'Gestionnaire dédié', 'Support 24/7'] }
    ],
    contact_sales: 'Contacter les ventes',
    choose_plan: 'Choisir le plan',
    cta_h2: 'Prêt à transformer votre entreprise ?',
    cta_p: 'Rejoignez des centaines d’entreprises rwandaises qui utilisent BusinessOS pour croître plus rapidement.',
    footer_about: 'Renforcer les entreprises grâce à des solutions logicielles intelligentes.',
    footer_newsletter: 'Abonnez-vous à notre newsletter',
    newsletter_placeholder: 'Adresse e-mail',
    copyright: '© 2026 BusinessOS. Tous droits réservés.'
  }
};

export const SUPPORTED_LOCALES = ['en', 'rw', 'fr'];

export function getLocale() {
  const l = localStorage.getItem('locale') || 'en';
  return TRANSLATIONS[l] ? l : 'en';
}

export function setLocale(locale) {
  if (!TRANSLATIONS[locale]) return;
  localStorage.setItem('locale', locale);
}

export default TRANSLATIONS;
