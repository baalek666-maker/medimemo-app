import { useState } from 'react'
import { Heart, Shield, Users, ChevronRight, ChevronLeft, Pill, Bell, FileText, Sparkles } from 'lucide-react'
import * as api from './api'
import { track } from './analytics'

interface OnboardingProps {
  onComplete: (profile: { isSenior: boolean; isCaregiver: boolean; firstMed?: any }) => void
}

const WELCOME_SLIDES = [
  {
    icon: Heart,
    title: 'Bienvenue dans MediMémo',
    subtitle: 'Le compagnon de vos médicaments',
    description: 'Plus jamais d\'oubli. MediMémo vous rappelle vos médicaments au bon moment, à la bonne dose.',
    color: 'from-rose-500 to-pink-600'
  },
  {
    icon: Bell,
    title: 'Rappels intelligents',
    subtitle: 'Notifications push, SMS, et email',
    description: 'Trois canaux de rappel pour que vous (ou votre proche) ne ratiez jamais une prise. Personnalisable selon vos besoins.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    icon: Users,
    title: 'Aidants connectés',
    subtitle: 'Vos proches sont prévenus',
    description: 'Configurez des aidants : ils reçoivent une alerte si une dose est oubliée. Tranquillité d\'esprit pour toute la famille.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: FileText,
    title: 'Rapport pour le médecin',
    subtitle: 'Un PDF en un clic',
    description: 'Générez un rapport d\'observance professionnel à montrer à votre médecin lors de la prochaine consultation.',
    color: 'from-amber-500 to-orange-600'
  }
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'slides' | 'profile' | 'first-med' | 'done'>('slides')
  const [slideIndex, setSlideIndex] = useState(0)
  const [profile, setProfile] = useState<'senior' | 'caregiver' | 'both' | null>(null)
  const [medName, setMedName] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medTime, setMedTime] = useState('08:00')
  const [medFrequency, setMedFrequency] = useState<'daily' | 'specific-days' | 'as-needed'>('daily')
  const [medNotes, setMedNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleNextSlide = () => {
    if (slideIndex < WELCOME_SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1)
      track('onboarding_slide_viewed', { slide: slideIndex + 1 })
    } else {
      setStep('profile')
      track('onboarding_profile_step')
    }
  }

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1)
    } else if (step === 'profile') {
      setStep('slides')
      setSlideIndex(WELCOME_SLIDES.length - 1)
    }
  }

  const handleProfileSelect = (selected: 'senior' | 'caregiver' | 'both') => {
    setProfile(selected)
    track('onboarding_profile_selected', { profile: selected })
    setStep('first-med')
  }

  const handleSkipFirstMed = () => {
    track('onboarding_first_med_skipped')
    setStep('done')
    onComplete({
      isSenior: profile === 'senior' || profile === 'both',
      isCaregiver: profile === 'caregiver' || profile === 'both'
    })
  }

  const handleSaveFirstMed = async () => {
    if (!medName.trim()) return
    setSaving(true)
    try {
      const uid = localStorage.getItem('medimemo_userId')
      if (!uid) throw new Error('No user ID')
      const med = await api.createMedication(uid, {
        name: medName.trim(),
        dose: medDose.trim() || '1 unite',
        time: medTime
      })
      track('onboarding_first_med_created', { name: medName })
      setStep('done')
      onComplete({
        isSenior: profile === 'senior' || profile === 'both',
        isCaregiver: profile === 'caregiver' || profile === 'both',
        firstMed: med
      })
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la création. Vous pourrez réessayer depuis l\'accueil.')
      setStep('done')
      onComplete({
        isSenior: profile === 'senior' || profile === 'both',
        isCaregiver: profile === 'caregiver' || profile === 'both'
      })
    } finally {
      setSaving(false)
    }
  }

  // --- Slides ---
  if (step === 'slides') {
    const slide = WELCOME_SLIDES[slideIndex]
    const Icon = slide.icon
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        <div className={`flex-1 bg-gradient-to-br ${slide.color} flex flex-col items-center justify-center p-8 text-white`}>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
            <Icon size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-center mb-3">{slide.title}</h1>
          <p className="text-lg text-white/90 text-center mb-6">{slide.subtitle}</p>
          <p className="text-base text-white/80 text-center max-w-md leading-relaxed">{slide.description}</p>
        </div>

        <div className="bg-white p-6">
          <div className="flex justify-center gap-2 mb-6">
            {WELCOME_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === slideIndex ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevSlide}
              disabled={slideIndex === 0}
              className="text-slate-400 px-4 py-2 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => {
                track('onboarding_slides_skipped')
                setStep('profile')
              }}
              className="text-slate-500 text-sm px-4 py-2"
            >
              Passer
            </button>
            <button
              onClick={handleNextSlide}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700"
            >
              {slideIndex === WELCOME_SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Profile selection ---
  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col">
        <button onClick={handlePrevSlide} className="text-slate-400 self-start mb-4">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Qui êtes-vous ?</h1>
          <p className="text-slate-600 mb-8">On personnalise l'expérience selon votre profil.</p>

          <div className="space-y-3">
            <button
              onClick={() => handleProfileSelect('senior')}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                  <Heart size={24} className="text-rose-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">Je prends des médicaments</div>
                  <div className="text-sm text-slate-600">Pour moi-même, je veux qu'on me rappelle</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleProfileSelect('caregiver')}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <Users size={24} className="text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">J'aide un proche</div>
                  <div className="text-sm text-slate-600">Parent, grand-parent, je veille sur lui/elle</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleProfileSelect('both')}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 text-left transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={24} className="text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 mb-1">Les deux</div>
                  <div className="text-sm text-slate-600">Je prends des médicaments ET j'aide un proche</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- First medication ---
  if (step === 'first-med') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex flex-col">
        <button onClick={() => setStep('profile')} className="text-slate-400 self-start mb-4">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
            <Pill size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Votre premier médicament</h1>
          <p className="text-slate-600 mb-8">Ajoutez le médicament que vous devez prendre pour démarrer.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom du médicament *</label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Ex : Doliprane, Kardégic, Levothyrox..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Dosage</label>
              <input
                type="text"
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="Ex : 1000mg, 1 comprimé..."
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Heure de prise</label>
              <input
                type="time"
                value={medTime}
                onChange={(e) => setMedTime(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fréquence</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'daily', label: 'Tous les jours' },
                  { value: 'specific-days', label: 'Certains jours' },
                  { value: 'as-needed', label: 'Au besoin' }
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMedFrequency(opt.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      medFrequency === opt.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-slate-200 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optionnel)</label>
              <textarea
                value={medNotes}
                onChange={(e) => setMedNotes(e.target.value)}
                placeholder="Ex : à prendre pendant le repas..."
                rows={2}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSkipFirstMed}
              className="flex-1 px-4 py-3 text-slate-600 font-medium"
            >
              Plus tard
            </button>
            <button
              onClick={handleSaveFirstMed}
              disabled={!medName.trim() || saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '...' : 'Continuer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Done screen (should not normally be rendered, but kept for safety) ---
  return null
}
