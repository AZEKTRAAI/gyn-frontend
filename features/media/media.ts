/**
 * Media manifest — all image slots for the site.
 * Pages import slot IDs from here; never hardcode paths in pages.
 *
 * shortcut: when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set, replace src values
 *   with Cloudinary public IDs and use next-cloudinary <CldImage> instead of next/image.
 */

export interface MediaEntry {
  src: string
  alt: string
  width: number
  height: number
}

/** Speakers for SISM 2026 */
export const SPEAKERS: Record<string, MediaEntry> = {
  'speaker.julie-victoire': {
    src: '/media/speakers/julie-victoire.webp',
    alt: 'Julie Victoire, International Youth Advocate',
    width: 400, height: 400,
  },
  'speaker.dr-mohd-farid': {
    src: '/media/speakers/dr-mohd-farid-bin-atan.webp',
    alt: 'Dr Mohd Farid bin Atan, Deputy Director UNIMAS',
    width: 400, height: 400,
  },
  'speaker.ayman-hermansson': {
    src: '/media/speakers/ayman-william-hermansson.webp',
    alt: 'Ayman William Hermansson, Assistant Professor Heriot-Watt University Malaysia',
    width: 400, height: 400,
  },
  'speaker.syed-bilal': {
    src: '/media/speakers/syed-bilal-qasim.webp',
    alt: 'Syed Bilal Qasim, CEO Techsol Space',
    width: 400, height: 400,
  },
  'speaker.sapargulay': {
    src: '/media/speakers/sapargulay-mahtumov.webp',
    alt: 'Sapargulay Mahtumov, Youth Coordinator MySDG Academy',
    width: 400, height: 400,
  },
  'speaker.jasmine-cannon': {
    src: '/media/speakers/jasmine-cannon-ikurusi.webp',
    alt: 'Jasmine Cannon-Ikurusi, CEO The Sapphire Academy',
    width: 400, height: 400,
  },
  'speaker.ashley-blake': {
    src: '/media/speakers/ashley-blake.webp',
    alt: 'Ashley Blake, Head of Partnership vrCAVE Canada',
    width: 400, height: 400,
  },
  'speaker.arumita-mitra': {
    src: '/media/speakers/arumita-mitra.webp',
    alt: 'Arumita Mitra, Founder Sudhamta Foundation India',
    width: 400, height: 400,
  },
}

/** Advisory board */
export const ADVISORY: Record<string, MediaEntry> = {
  'advisory.wenbo-li': {
    src: '/media/advisory-board/wenbo-li.webp',
    alt: 'Wenbo Li, CEO Poly-Gamma, China',
    width: 400, height: 400,
  },
  'advisory.sura-fitiani': {
    src: '/media/advisory-board/sura-fitiani.webp',
    alt: 'Sura Fitiani, Intersect Innovation Hub, Palestine',
    width: 400, height: 400,
  },
  'advisory.dr-salah': {
    src: '/media/advisory-board/dr-salah.webp',
    alt: 'Dr. Salah, Senior Government Official, Oman',
    width: 400, height: 400,
  },
  'advisory.sidra-riaz': {
    src: '/media/advisory-board/sidra-riaz.webp',
    alt: 'Sidra Riaz, Presidential Doctoral Fellow Florida University',
    width: 400, height: 400,
  },
  'advisory.dr-mona': {
    src: '/media/advisory-board/dr-mona-al-kadi.webp',
    alt: 'Dr. Mona Al Kadi, Life Transformative Coach, UAE',
    width: 400, height: 400,
  },
  'advisory.mr-elam': {
    src: '/media/advisory-board/mr-elam.webp',
    alt: 'Mr. Elam, CEO Axxon Group, UK',
    width: 400, height: 400,
  },
  'advisory.dr-suman-roy': {
    src: '/media/advisory-board/dr-suman-roy.webp',
    alt: 'Dr. Suman Roy, UN SDG Advocate',
    width: 400, height: 400,
  },
  'advisory.ashley-blake': {
    src: '/media/advisory-board/ashley-blake.webp',
    alt: 'Ashley Blake, Head of Partnership vrCAVE Canada',
    width: 400, height: 400,
  },
}

/** Ambassadors */
export const AMBASSADORS: Record<string, MediaEntry & { country: string }> = {
  'ambassador.helga-tongi': {
    src: '/media/ambassadors/helga-tongi.webp',
    alt: 'Helga Tongi, GYN Ambassador, USA',
    country: 'USA',
    width: 400, height: 400,
  },
  'ambassador.yara-shamas': {
    src: '/media/ambassadors/yara-shamas.webp',
    alt: 'Yara Shamas, GYN Ambassador, Lebanon',
    country: 'Lebanon',
    width: 400, height: 400,
  },
  'ambassador.patee': {
    src: '/media/ambassadors/patee.webp',
    alt: 'Patee, GYN Ambassador, Thailand',
    country: 'Thailand',
    width: 400, height: 400,
  },
  'ambassador.kritika-ghimire': {
    src: '/media/ambassadors/kritika-ghimire.webp',
    alt: 'Kritika Ghimire, GYN Ambassador, Nepal',
    country: 'Nepal',
    width: 400, height: 400,
  },
  'ambassador.lim-pei-en': {
    src: '/media/ambassadors/lim-pei-en.webp',
    alt: 'Lim Pei En, GYN Ambassador, Malaysia',
    country: 'Malaysia',
    width: 400, height: 400,
  },
  'ambassador.dr-righteous': {
    src: '/media/ambassadors/dr-righteous.webp',
    alt: 'Dr Righteous, GYN Ambassador, Nigeria',
    country: 'Nigeria',
    width: 400, height: 400,
  },
  'ambassador.md-nafi': {
    src: '/media/ambassadors/md-nafi.webp',
    alt: 'Md Nafi, GYN Ambassador, Bangladesh',
    country: 'Bangladesh',
    width: 400, height: 400,
  },
  'ambassador.diba': {
    src: '/media/ambassadors/diba.webp',
    alt: 'Diba, GYN Ambassador, Australia',
    country: 'Australia',
    width: 400, height: 400,
  },
  'ambassador.casey': {
    src: '/media/ambassadors/casey.webp',
    alt: 'Casey, GYN Ambassador, USA',
    country: 'USA',
    width: 400, height: 400,
  },
  'ambassador.ashif': {
    src: '/media/ambassadors/ashif.webp',
    alt: 'Ashif, GYN Ambassador, India',
    country: 'India',
    width: 400, height: 400,
  },
  'ambassador.boling': {
    src: '/media/ambassadors/boling.webp',
    alt: 'Boling, GYN Ambassador, Laos',
    country: 'Laos',
    width: 400, height: 400,
  },
  'ambassador.abdul-ahad': {
    src: '/media/ambassadors/abdul-ahad.webp',
    alt: 'Abdul Ahad, GYN Ambassador, Pakistan',
    country: 'Pakistan',
    width: 400, height: 400,
  },
}

/** Gallery photos from FutureMinds Summit Thailand 2026 */
export const GALLERY: MediaEntry[] = [
  { src: '/media/gallery/fmst-dsc01881-1.webp', alt: 'Delegates at FutureMinds Summit Thailand, Bangkok 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc01894-1.webp', alt: 'Panel session at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc01945-1.webp', alt: 'Workshop session at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc01960-1.webp', alt: 'Delegates collaborating at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc01976-1.webp', alt: 'Summit activity at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc01989-1.webp', alt: 'Group discussion at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc02120-1.webp', alt: 'Cultural evening at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc02142-1.webp', alt: 'Delegates at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc02159-1.webp', alt: 'Certification ceremony at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc02172-1.webp', alt: 'Group photo at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc02243-1.webp', alt: 'Summit session at FutureMinds Summit Thailand 2026', width: 768, height: 512 },
  { src: '/media/gallery/fmst-dsc03736-1.webp', alt: 'Sightseeing in Bangkok with FutureMinds Summit Thailand 2026 delegates', width: 768, height: 512 },
]

/** Logos */
export const LOGOS: Record<string, MediaEntry> = {
  'logo.gyn': {
    src: '/media/logos/gyn-logo.png',
    alt: 'Global Youth Network',
    width: 240, height: 72,
  },
  'logo.sdg': {
    src: '/media/logos/sdg-logo.png',
    alt: 'United Nations Sustainable Development Goals',
    width: 200, height: 200,
  },
  'logo.unu-global-health': {
    src: '/media/logos/unu-global-health-logo.png',
    alt: 'United Nations University – International Institute for Global Health',
    width: 300, height: 80,
  },
}

export const PARTNERS: MediaEntry[] = [
  { src: '/media/partners/opportunities-radar.png', alt: 'Opportunities Radar', width: 200, height: 60 },
  { src: '/media/partners/axxon.png', alt: 'Axxon Group', width: 200, height: 60 },
  { src: '/media/partners/oc.png', alt: 'Partner', width: 200, height: 60 },
  { src: '/media/partners/tehgzr.png', alt: 'Partner', width: 200, height: 60 },
  { src: '/media/partners/tss.png', alt: 'Partner', width: 200, height: 60 },
  { src: '/media/partners/logo-n.png', alt: 'Partner', width: 200, height: 60 },
]
