import { ChevronLeft } from 'lucide-react'

type LegalPage = 'cgv' | 'cgu' | 'mentions' | 'privacy' | 'contact'

export function LegalPage({ page, onBack }: { page: LegalPage; onBack: () => void }) {
  const data = LEGAL_PAGES[page]
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
        <h1 className="text-base font-semibold text-slate-900">{data.title}</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 prose prose-slate">
        <p className="text-xs text-slate-400">Derniere mise a jour : {data.updatedAt}</p>
        {data.content}
      </div>
    </div>
  )
}

const LEGAL_PAGES: Record<LegalPage, { title: string; updatedAt: string; content: JSX.Element }> = {
  cgv: {
    title: 'Conditions Generales de Vente',
    updatedAt: '1er janvier 2026',
    content: (
      <div className="space-y-4 text-sm text-slate-700">
        <h2 className="text-lg font-semibold">Article 1 - Objet</h2>
        <p>Les presentes conditions generales de vente (CGV) regissent les relations entre MediMemo (ci-apres "l'editeur") et toute personne (ci-apres "le client") beneficiant d'un abonnement Premium a l'application MediMemo.</p>
        <h2 className="text-lg font-semibold">Article 2 - Prix</h2>
        <p>L'abonnement Premium est propose au tarif de 59,99 EUR TTC par an. Ce tarif peut evoluer ; le client en sera informe prealablement. Le paiement s'effectue par carte bancaire via notre prestataire securise Stripe.</p>
        <h2 className="text-lg font-semibold">Article 3 - Duree et renouvellement</h2>
        <p>L'abonnement est souscrit pour une duree d'un (1) an. Il est renouvele automatiquement a l'echance, sauf resiliation par le client avant la date de renouvellement via son espace personnel.</p>
        <h2 className="text-lg font-semibold">Article 4 - Droit de retractation</h2>
        <p>Conformement a l'article L.221-18 du Code de la consommation, le client dispose d'un delai de 14 jours a compter de la souscription pour se retracter, par email a support@medimemo.fr. Le remboursement integral est effectue sous 14 jours.</p>
        <h2 className="text-lg font-semibold">Article 5 - Resiliation</h2>
        <p>Le client peut resilier son abonnement a tout moment depuis son espace personnel. La resiliation prend effet a la fin de la periode d'abonnement en cours ; aucun remboursement partiel n'est effectue, sauf cas de retractation.</p>
        <h2 className="text-lg font-semibold">Article 6 - Service client</h2>
        <p>Pour toute question : support@medimemo.fr. Delai de reponse : 48h ouvrables.</p>
      </div>
    ),
  },
  cgu: {
    title: "Conditions Generales d'Utilisation",
    updatedAt: '1er janvier 2026',
    content: (
      <div className="space-y-4 text-sm text-slate-700">
        <h2 className="text-lg font-semibold">1. Acceptation</h2>
        <p>L'utilisation de l'application MediMemo implique l'acceptation pleine et entiere des presentes CGU.</p>
        <h2 className="text-lg font-semibold">2. Description du service</h2>
        <p>MediMemo est une application d'aide au suivi des prises de medicaments, dediee aux seniors et a leurs aidants. MediMemo n'est pas un dispositif medical ; elle ne se substitue en aucun cas a un avis medical ou pharmaceutique.</p>
        <h2 className="text-lg font-semibold">3. Responsabilite de l'utilisateur</h2>
        <p>L'utilisateur s'engage a fournir des informations exactes sur ses traitements medicamenteux. Toute erreur dans la saisie releve de la seule responsabilite de l'utilisateur. En cas de doute sur un medicament ou une interaction, consulter un professionnel de sante.</p>
        <h2 className="text-lg font-semibold">4. Limitation de responsabilite</h2>
        <p>MediMemo ne saurait etre tenue responsable d'un oubli de prise ou d'une erreur de posologie. L'application est un outil d'aide, non un substitut de vigilance medicale.</p>
        <h2 className="text-lg font-semibold">5. Propriete intellectuelle</h2>
        <p>L'ensemble des contenus (textes, logos, code) est protege par le droit d'auteur. Toute reproduction non autorisee est interdite.</p>
        <h2 className="text-lg font-semibold">6. Donnees personnelles</h2>
        <p>Le traitement des donnees personnelles est decrit dans notre Politique de confidentialite.</p>
        <h2 className="text-lg font-semibold">7. Suspension de service</h2>
        <p>MediMemo se reserve le droit de suspendre l'acces en cas d'usage frauduleux ou de non-paiement.</p>
      </div>
    ),
  },
  mentions: {
    title: 'Mentions legales',
    updatedAt: '1er janvier 2026',
    content: (
      <div className="space-y-4 text-sm text-slate-700">
        <h2 className="text-lg font-semibold">Editeur</h2>
        <p>MediMemo SAS<br/>Capital social : 10 000 EUR<br/>Siege social : Paris, France<br/>RCS Paris : 900 000 000<br/>TVA intracommunautaire : FR00 000000000<br/>Email : contact@medimemo.fr<br/>Telephone : 01 00 00 00 00</p>
        <h2 className="text-lg font-semibold">Hebergeur</h2>
        <p>Render Services, Inc.<br/>525 Brannan Street, San Francisco, CA 94107, USA</p>
        <h2 className="text-lg font-semibold">Directeur de la publication</h2>
        <p>Yoann Leveque, President de MediMemo SAS</p>
        <h2 className="text-lg font-semibold">Propriete intellectuelle</h2>
        <p>L'ensemble du site et de l'application MediMemo est protege par la legislation francaise et internationale sur le droit d'auteur et la propriete intellectuelle.</p>
      </div>
    ),
  },
  privacy: {
    title: 'Politique de confidentialite',
    updatedAt: '1er janvier 2026',
    content: (
      <div className="space-y-4 text-sm text-slate-700">
        <h2 className="text-lg font-semibold">Donnees collectees</h2>
        <p>MediMemo collecte les donnees strictement necessaires : email, nom (optionnel), liste de medicaments (nom, dosage, horaires), numero de telephone des aidants (optionnel), historique des prises.</p>
        <h2 className="text-lg font-semibold">Finalites</h2>
        <p>Les donnees sont utilisees pour :<br/>- Afficher vos rappels de prise<br/>- Vous envoyer des notifications push<br/>- Permettre a vos aidants d'etre informes en cas d'oubli<br/>- Facturer et gerer votre abonnement Premium<br/>- Ameliorer le service (donnees anonymisees)</p>
        <h2 className="text-lg font-semibold">Base legale</h2>
        <p>Le traitement est fonde sur l'execution du contrat (CGU) et votre consentement (notifications, aidants).</p>
        <h2 className="text-lg font-semibold">Duree de conservation</h2>
        <p>Les donnees sont conservees tant que votre compte est actif. Apres suppression, elles sont effacees sous 30 jours (sauvegardes comprises).</p>
        <h2 className="text-lg font-semibold">Vos droits (RGPD)</h2>
        <p>Conformement au RGPD, vous disposez a tout moment d'un droit d'acces, de rectification, d'effacement, de portabilite et d'opposition. Exercez vos droits depuis l'onglet Reglages de l'application ou par email a rgpd@medimemo.fr.</p>
        <h2 className="text-lg font-semibold">Sous-traitants</h2>
        <p>Stripe (paiement), Resend (emails), Twilio (SMS), Posthog (analytics anonymisees), Vercel (hebergement frontend). Tous conformes RGPD.</p>
        <h2 className="text-lg font-semibold">Reclamation CNIL</h2>
        <p>Vous pouvez introduire une reclamation aupres de la CNIL (www.cnil.fr).</p>
      </div>
    ),
  },
  contact: {
    title: 'Nous contacter',
    updatedAt: '1er janvier 2026',
    content: (
      <div className="space-y-4 text-sm text-slate-700">
        <p>Notre equipe est a votre disposition :</p>
        <p><strong>Support general :</strong> support@medimemo.fr<br/>Delai de reponse : 48h ouvrables</p>
        <p><strong>Demandes RGPD :</strong> rgpd@medimemo.fr<br/>Delai de reponse : 30 jours maximum</p>
        <p><strong>Partenariats B2B (EHPAD) :</strong> pro@medimemo.fr</p>
        <p><strong>Courrier :</strong> MediMemo SAS, Paris, France</p>
      </div>
    ),
  },
}
