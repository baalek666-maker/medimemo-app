# MediMémo

**Application premium de rappels de médicaments pour seniors et aidants en France.**

On copie les leaders mondiaux (MyTherapy, Medisafe) en version française, plus simple, plus belle, et pensée pour les seniors et leurs aidants.

## Le problème

- 50 % des patients ne prennent pas leurs médicaments comme prescrits.
- En France, 1 personne sur 2 de plus de 65 ans est en polymédication (5+ médicaments).
- Les aidants familiaux (enfants, proches) vivent avec l'angoisse de l'oubli.
- Les apps existantes sont américaines ou allemandes, mal adaptées au système français, et de plus en plus agressives sur la monétisation.

## La solution

MediMémo = rappels de médicaments + suivi pour proches + base de médicaments française + design senior-friendly + monétisation premium claire.

## Marché validé

| Concurrent | Téléchargements | Avis | Note | Revenus estimés |
|---|---|---|---|---|
| **MyTherapy** | 5M+ (Android) | 234K | 4.6 | Plusieurs millions d'€/an |
| **Medisafe** | 5M+ (Android) | 243K | 2.9 | Plusieurs millions d'$/an |
| **Pill Reminder** | 1M+ | 40K+ | 4.3 | >100K€/mois estimé |
| **Mediteo** | 1M+ | 30K+ | 4.4 | Marché européen prouvé |

Sources : Google Play Store, modèles de monétisation freemium, levées de fonds connues (Medisafe ~50M$ leviés, SmartPatient/MyTherapy levée de série importante en 2021).

## Modèle économique

- **Gratuit** : 1 utilisateur, 3 médicaments, rappels basiques.
- **Premium Famille** : 9,99 €/mois ou 59,99 €/an
  - Médicaments illimités
  - Proches illimités
  - Notifications SMS/téléphone pour l'aidant
  - Rapports mensuels PDF
  - Base médicaments française avec photos
  - Support prioritaire

## Stack technique MVP

- **Frontend** : React + TypeScript + Vite + Tailwind CSS + PWA
- **Backend** : Node.js + Express + Prisma + SQLite
- **Mobile** : Capacitor pour iOS/Android
- **Auth** : simple email + code
- **Notifications** : Web Push + Capacitor Local Notifications

## Roadmap

1. Validation marché ✅
2. Maquettes & identité visuelle
3. MVP mobile-first
4. Tests avec 10 aidants
5. Itération & monétisation

## Lancer le projet

```bash
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```
