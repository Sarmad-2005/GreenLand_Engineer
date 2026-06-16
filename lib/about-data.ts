// Content for the About page, taken verbatim from the official company profile
// (Greenland Web Content). Kept here so the section components stay markup-only and
// the copy is easy to maintain in one place.

export const aboutHero = {
  eyebrow: 'About Green Land Engineers',
  tagline: 'A complete range of standard agricultural implements',
  title: 'Cultivating better farming since 1975',
  intro:
    'Green Land Engineers has a proven & innovative history over more than five decades of recognized working experience in manufacturing agricultural equipment.',
  whoWeAre:
    "Green Land Engineers is a leading business that effectively and competently makes farm machinery less complicated and convenient for its farmers. It is one of Pakistan's pioneering companies, manufacturing a vast range of high-quality agricultural farm machinery and components that meet the unique requirements of each farmer. Our heavy-duty equipment has been providing the most successful & advanced farming experiences to local and international farmers since 1975 — and we constantly endeavor to stay at the forefront of innovation in the agriculture sector.",
}

export const aboutFacts = [
  { value: 'Est. 1975', label: 'Daska, Sialkot' },
  { value: '45+ years', label: 'Of manufacturing' },
  { value: 'ISO', label: '9001 & 14001 certified' },
] as const

export const historyParagraphs = [
  'Green Land Engineers was established in 1975 with a small manufacturing facility in Daska (Sialkot). Over time, we expanded our facilities and grew our range of equipment to cater to the evolving demands of the market.',
  'Today we are a manufacturer and supplier of a wide range of high-quality agriculture implements, farm machinery, tools and parts that suit the basic requirements of each farmer. Our heavy-duty implements enable the most efficient farming in the region, with consistently good output.',
  'We have steadily strengthened the transition from traditional methods to modernized machinery, striving further toward sustainable development with continuous and diligent effort.',
]

export const ourTeam =
  'Our team has been expanding since our inception, alongside our evolving geographical footprint. Each employee brings specific expertise in their field. Together, we make sure our customers spend in the right direction — where they get the best returns — while building loyalty at every touch-point.'

export const aboutVision =
  "To be renowned as Pakistan's foremost advanced and value-added manufacturer of agricultural equipment for sustainable agriculture farming and social wellbeing."

export const aboutMission =
  "Green Land Engineers' roadmap is to produce new designs for efficiently functional agriculture machinery based on geological, field-specific patterns."

// icon is resolved to a lucide-react component inside the section (keeps this file
// free of React imports), keyed by `icon`.
export const aboutValues = [
  {
    key: 'getting-it-done',
    icon: 'hammer',
    title: 'Getting it done',
    body: 'Our “Getting it done” attitude pushes us to actively pursue new, more reliable solutions with functionality & cost-effectiveness for our farmers. We roll up our sleeves to meet their challenges, keep our promises, and achieve results.',
  },
  {
    key: 'passion',
    icon: 'heart',
    title: 'Passion',
    body: 'Our passion is to equip farmers to produce the food needed to feed the planet. We are dedicated to the achievement of our farmers, partners and peers, and share a passion for delivering value from a leading position in the agricultural industry of Pakistan.',
  },
  {
    key: 'transparency',
    icon: 'scale',
    title: 'Transparency',
    body: 'We value feedback. We are committed to providing the required, complete information openly and sincerely to our farmers and partners.',
  },
  {
    key: 'professional',
    icon: 'award',
    title: 'Professional',
    body: 'We research, listen, innovate and continuously improve with honest roles and commitments. We offer quality in everything we do, we are proud of what we do, and we keep true to our values.',
  },
] as const

export type AboutValue = (typeof aboutValues)[number]

export const certifications = [
  {
    name: 'ISO 9001:2015',
    caption: 'Quality Management certified company',
    logo: '/certifications/iso-9001.jpg',
    width: 199,
    height: 203,
  },
  {
    name: 'ISO 14001:2015',
    caption: 'Environmental Management certified',
    logo: '/certifications/iso-14001.jpg',
    width: 216,
    height: 222,
  },
  {
    name: 'PARC Certified',
    caption: 'Certified by Pakistan Agricultural Research Council',
    logo: '/certifications/parc.jpg',
    width: 211,
    height: 302,
  },
] as const

// Research & Development partners shown as a logo marquee. Intrinsic width/height
// are the source pixel dimensions so next/image keeps each logo's aspect ratio.
export const partners = [
  { name: 'Pakistan Agricultural Research Council (PARC)', logo: '/partners/parc.jpg', width: 225, height: 225 },
  { name: 'National Agricultural Research Council (NARC)', logo: '/partners/narc.jpg', width: 225, height: 225 },
  { name: 'University of Agriculture Faisalabad', logo: '/partners/uaf.jpg', width: 192, height: 216 },
  { name: 'Rice Research Institute, Kala Shah Kaku (RRI)', logo: '/partners/rri.jpg', width: 225, height: 225 },
  { name: 'South Asian Conservation Agriculture Network (SACAN)', logo: '/partners/sacan.jpg', width: 275, height: 100 },
  { name: 'USAID', logo: '/partners/usaid.jpg', width: 264, height: 198 },
  { name: 'Engro Fertilizer (Spirit Project)', logo: '/partners/engro.png', width: 225, height: 225 },
  { name: 'CIMMYT', logo: '/partners/cimmyt.png', width: 225, height: 225 },
  { name: 'ICARDA', logo: '/partners/icarda.jpg', width: 213, height: 173 },
  { name: 'PARC Agrotech Company (PATCO)', logo: '/partners/patco.jpg', width: 225, height: 225 },
  { name: 'UN ESCAP / CSAM', logo: '/partners/escap-csam.jpg', width: 441, height: 97 },
] as const

export type Partner = (typeof partners)[number]

// Listed in the company profile but without a logo — shown as a closing text note.
export const additionalPartners = ['FO & S', 'PATTA'] as const
