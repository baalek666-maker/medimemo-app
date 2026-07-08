import { useEffect } from 'react'

// === SEO Landing Pages ===

interface LandingPage {
  slug: string
  title: string
  h1: string
  metaDescription: string
  keywords: string[]
  heroEmoji: string
  painPoints: string[]
  ctaText: string
  faq: { q: string; a: string }[]
}

const PAGES: LandingPage[] = [
  {
    slug: 'rappel-antibiotique',
    title: 'Rappel d’antibiotique ne jamais oublier sa cure | MediMémo',
    h1: 'N’oubliez plus jamais votre cure d’antibiotiques',
    metaDescription: 'Application gratuite de rappel d’antibiotiques. Soyez alerté à l’heure exacte pour ne jamais sauter une dose. Compatible iPhone et Android.',
    keywords: ['rappel antibiotique', 'oubli antibiotique', 'pilulier antibiotique', 'notification medicament'],
    heroEmoji: '💊',
    painPoints: [
      'Oublier une prise d’antibiotique rend le traitement inefficace',
      'Les bactéries deviennent résistantes si la cure n’est pas respectée',
      'Difficile de se rappeler à quelle heure prendre chaque dose',
    ],
    ctaText: 'Créer mon rappel d’antibiotique gratuitement',
    faq: [
      { q: 'Que faire si j’oublie une dose d’antibiotique ?', a: 'Prenez-la dès que vous y pensez, sauf si c’est presque l’heure de la suivante. Ne doublez jamais la dose.' },
      { q: 'Combien de temps faut-il prendre un antibiotique ?', a: 'La durée varie selon l’infection (5 à 14 jours généralement). Il faut toujours terminer la prescription.' },
      { q: 'L’application est-elle gratuite ?', a: 'Oui, MediMémo est gratuit. Créez vos rappels, recevez des notifications et suivez vos traitements sans limite.' },
    ],
  },
  {
    slug: 'rappel-medicament-personne-agee',
    title: 'Rappel médicament personne âgée | MediMémo',
    h1: 'Aidez vos parents à ne plus jamais oublier leurs médicaments',
    metaDescription: 'Application de rappel de médicaments pour seniors. L’aidant est prévenu en cas d’oubli. Simple, fiable, 100% français.',
    keywords: ['rappel medicament senior', 'pilulier personne agee', 'aidant parent'],
    heroEmoji: '👴',
    painPoints: [
      'Un senior sur 3 oublie au moins une prise de médicament par semaine',
      'Les oublis entraînent hospitalisations et complications',
      'Vous, aidant, vivez dans l’angoisse de ne pas savoir si le traitement est suivi',
    ],
    ctaText: 'Surveiller le traitement de mes parents',
    faq: [
      { q: 'Comment être prévenu si mon parent oublie un médicament ?', a: 'Vous êtes désigné comme aidant. Si la prise n’est pas confirmée, vous recevez une alerte par SMS.' },
      { q: 'Mes parents savent-ils utiliser un smartphone ?', a: 'MediMémo est ultra-simple : gros boutons, notifications claires, aucune manipulation compliquée.' },
      { q: 'Puis-je gérer plusieurs personnes ?', a: 'Oui ! Ajoutez autant de profils que nécessaire. Pour les EHPAD, découvrez notre version professionnelle.' },
    ],
  },
  {
    slug: 'pilulier-electronique',
    title: 'Pilulier électronique sur téléphone | MediMémo',
    h1: 'Votre pilulier intelligent, toujours dans votre poche',
    metaDescription: 'Transformez votre téléphone en pilulier électronique. Rappels à l’heure, suivi des prises, alertes aidant. Gratuit et sans matériel.',
    keywords: ['pilulier electronique', 'pilulier connecte', 'pilulier smartphone'],
    heroEmoji: '📱',
    painPoints: [
      'Les piluliers physiques coûtent cher et sont encombrants',
      'Ils ne préviennent pas l’aidant en cas d’oubli',
      'Ils ne s’adaptent pas aux changements de traitement',
    ],
    ctaText: 'Créer mon pilulier digital gratuitement',
    faq: [
      { q: 'Faut-il acheter un matériel spécifique ?', a: 'Non ! MediMémo transforme votre smartphone en pilulier intelligent.' },
      { q: 'MediMémo remplace-t-il un pilulier physique ?', a: 'MediMémo complète votre pilulier avec des rappels à l’heure exacte.' },
      { q: 'L’application fonctionne-t-elle hors ligne ?', a: 'Les rappels fonctionnent même sans connexion internet grâce aux notifications locales.' },
    ],
  },
  {
    slug: 'rappel-pilule-contraceptive',
    title: 'Rappel pilule contraceptive - Ne jamais l’oublier | MediMémo',
    h1: 'Plus jamais d’oubli de pilule contraceptive',
    metaDescription: 'Application gratuite de rappel de pilule contraceptive. Notification quotidienne à l’heure exacte. Compatible iPhone et Android.',
    keywords: ['rappel pilule contraceptive', 'oubli pilule', 'application pilule'],
    heroEmoji: '🌸',
    painPoints: [
      'Un oubli de pilule peut entraîner une grossesse non désirée',
      'Le stress de se demander ai-je pris ma pilule chaque matin',
      'Difficile de garder le même horaire tous les jours',
    ],
    ctaText: 'Créer mon rappel de pilule gratuitement',
    faq: [
      { q: 'Que faire en cas d’oubli de pilule ?', a: 'Si moins de 12h se sont écoulées, prenez-la immédiatement. Au-delà, consultez votre pharmacien.' },
      { q: 'Puis-je mettre plusieurs alarmes ?', a: 'Oui, vous pouvez configurer plusieurs rappels par jour.' },
      { q: 'Mes données sont-elles privées ?', a: 'Absolument. Vos données de santé sont chiffrées et ne sont jamais partagées. Conforme RGPD.' },
    ],
  },
  {
    slug: 'suivi-traitement-chronique',
    title: 'Suivi traitement chronique - Diabète, hypertension | MediMémo',
    h1: 'Gérez votre traitement chronique sans effort',
    metaDescription: 'Application de suivi de traitement chronique. Diabète, hypertension, cholestérol : ne ratez plus aucune prise. Statistiques et rapports pour votre médecin.',
    keywords: ['suivi traitement chronique', 'rappel medicament diabete', 'suivi medicament hypertension'],
    heroEmoji: '🩺',
    painPoints: [
      'Les traitements chroniques impliquent 3 à 8 médicaments différents par jour',
      'Difficile de savoir ce que l’on a pris ou non',
      'Votre médecin a besoin d’un suivi précis de votre observance',
    ],
    ctaText: 'Démarrer le suivi de mon traitement',
    faq: [
      { q: 'Puis-je générer un rapport pour mon médecin ?', a: 'Oui ! MediMémo génère un rapport PDF de votre observance sur 30 jours.' },
      { q: 'Combien de médicaments puis-je ajouter ?', a: 'Aucune limite. Ajoutez tous vos médicaments avec leurs horaires.' },
      { q: 'L’application est-elle adaptée au diabète ?', a: 'Oui, MediMémo est idéale pour le suivi des antidiabétiques oraux et de l’insuline.' },
    ],
  },
]

export function LandingPageView({ slug, onSignup }: { slug: string; onSignup: () => void }) {
  const page = PAGES.find((p) => p.slug === slug)

  useEffect(() => {
    if (page) {
      document.title = page.title
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', page.metaDescription)
    }
  }, [page])

  if (!page) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="text-6xl mb-6">{page.heroEmoji}</div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
          {page.h1}
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
          {page.metaDescription}
        </p>
        <button
          onClick={onSignup}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          {page.ctaText}
        </button>
        <p className="text-sm text-slate-400 mt-3">Gratuit - Sans pub - 100% français</p>
      </div>

      <div className="bg-white py-12">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Un problème que beaucoup partagent
          </h2>
          <div className="space-y-4">
            {page.painPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-50 rounded-2xl p-4">
                <span className="text-2xl shrink-0">{"\u26a0\ufe0f"}</span>
                <p className="text-slate-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-600 py-16 text-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">La solution MediMémo</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature emoji="\u{1F514}" title="Rappels précis" text="Notification à l’heure exacte de chaque prise" />
            <Feature emoji="\u{1F468}\u200d\u{1F469}\u200d\u{1F466}" title="Aidant prévenu" text="Alerte automatique si une dose est oubliée" />
            <Feature emoji="\u{1F4CA}" title="Suivi complet" text="Statistiques et rapport pour votre médecin" />
          </div>
          <button
            onClick={onSignup}
            className="mt-8 bg-white text-blue-600 font-bold px-8 py-4 rounded-2xl shadow-lg hover:bg-blue-50 transition"
          >
            {page.ctaText}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {page.faq.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-2">{item.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white py-12 text-center">
        <div className="max-w-md mx-auto px-6">
          <p className="text-xl font-bold text-slate-900 mb-4">
            Prêt à ne plus jamais oublier vos médicaments ?
          </p>
          <button
            onClick={onSignup}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transition w-full"
          >
            Commencer gratuitement
          </button>
          <p className="text-sm text-slate-400 mt-3">
            Plus de 10 000 personnes utilisent déjà MediMémo
          </p>
        </div>
      </div>

      <footer className="bg-slate-800 py-8">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">
            MediMémo — Rappel de médicaments pour seniors, aidants et patients chroniques.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            {page.keywords.join(' · ')}
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-blue-100">{text}</p>
    </div>
  )
}

export { PAGES as SEO_PAGES }
