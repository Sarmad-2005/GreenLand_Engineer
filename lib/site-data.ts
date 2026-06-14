export const categories = [
  {
    slug: 'primary-tillage',
    name: 'Primary Tillage',
    tagline: 'Breaking ground for every season.',
    description:
      'Heavy-duty disc harrows, rotavators, chisel ploughs and cultivators engineered for deep soil preparation across all terrain types and soil conditions.',
    image: '/products/tractor.png',
    images: [
      '/products/tractor.png',
      '/products/seeds-bag.png',
      '/products/crop-protection.png',
    ],
  },
  {
    slug: 'secondary-tillage',
    name: 'Secondary Tillage',
    tagline: 'Perfect seedbeds, every time.',
    description:
      'Laser land levellers, bed shapers, potato planters and ditchers for precise soil finishing, bed formation and land preparation before planting.',
    image: '/products/greenhouse.png',
    images: [
      '/products/greenhouse.png',
      '/products/fertilizer-sack.png',
      '/products/packaging-box.png',
    ],
  },
  {
    slug: 'seeding-planting',
    name: 'Seeding & Planting',
    tagline: 'Precision placement for maximum yield.',
    description:
      'Zero-till seed drills, multi-crop planters, DSR drills and vegetable transplanters for accurate, uniform seed and fertilizer placement.',
    image: '/products/seeds-bag.png',
    images: [
      '/products/seeds-bag.png',
      '/products/tractor.png',
      '/products/greenhouse.png',
    ],
  },
  {
    slug: 'harvesting-cutting',
    name: 'Harvesting & Cutting',
    tagline: 'Harvest more, lose less.',
    description:
      'Reapers, straw choppers, brush cutters and mowers for efficient harvesting of wheat, grass, olives and a wide variety of crops.',
    image: '/products/crop-protection.png',
    images: [
      '/products/crop-protection.png',
      '/products/tractor.png',
      '/products/seeds-bag.png',
    ],
  },
  {
    slug: 'post-harvest-processing',
    name: 'Post-Harvest Processing',
    tagline: 'From field to store, efficiently.',
    description:
      'Threshers, maize shellers, silage machines, seed graders and banana shredders for complete, reliable post-harvest processing on the farm.',
    image: '/products/packaging-box.png',
    images: [
      '/products/packaging-box.png',
      '/products/fertilizer-sack.png',
      '/products/greenhouse.png',
    ],
  },
  {
    slug: 'manual-walk-behind',
    name: 'Manual & Walk-Behind',
    tagline: 'Small farm, big results.',
    description:
      'Walk-behind tillers, hand seeders, vegetable transplanters and portable equipment purpose-built for smallholder and precision farming operations.',
    image: '/products/irrigation-pipe.png',
    images: [
      '/products/irrigation-pipe.png',
      '/products/seeds-bag.png',
      '/products/tractor.png',
    ],
  },
  {
    slug: 'others',
    name: 'Others',
    tagline: 'Versatile solutions for every need.',
    description:
      'Mini tractors, mechanical weeders, fertilizer spreaders and specialist equipment for diverse agricultural and horticultural requirements.',
    image: '/products/fertilizer-sack.png',
    images: [
      '/products/fertilizer-sack.png',
      '/products/greenhouse.png',
      '/products/packaging-box.png',
    ],
  },
]

export type Category = (typeof categories)[number]

export const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/blog', label: 'Blog' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
]

export const contactInfo = {
  phone: '+92 312 6611164',
  phones: ['+92 312 6611164', '+92 313 6611164', '+92 333 8887766'],
  email: 'hello@greenland.ag',
  officeAddress:
    'Green Land Engineers (Office), Circular Rd, Qazi Town Daska, 51010, Pakistan',
  factoryAddress:
    'Green Land Engineers (Factory), 78V5+R66, Punjab Small Industries Corporation, Pakistan',
  hours: 'Mon–Fri, 8:00 AM – 6:00 PM',
}

export const socialLinks = [
  { key: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/923126611164' },
  { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/GreenlandEngineer' },
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/GreenlandEngineers' },
  { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@GreenlandEngineers' },
  { key: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/@greenlandengineers' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/greenlandengineers' },
] as const

export const stats = [
  { value: 20, suffix: '+', label: 'Years of Innovation' },
  { value: 60, suffix: '+', label: 'Countries Served' },
  { value: 80, suffix: '+', label: 'Machinery Models' },
  { value: 100, suffix: '%', label: 'ISO Certified' },
]

export const mission = [
  {
    key: 'mission',
    label: 'Mission',
    body: 'Our mission is to provide top-quality, technologically advanced agricultural farm implements worldwide, with a strong sense of responsibility and exceptional quality.',
  },
  {
    key: 'vision',
    label: 'Vision',
    body: 'Our vision is to provide farmers with affordable, high-quality agricultural solutions that meet international standards and can withstand harsh conditions.',
  },
  {
    key: 'values',
    label: 'Values',
    body: 'Customer-focused innovation and exceptional quality drive our business, as we prioritize the needs of farmers and uphold responsibility towards the environment and society.',
  },
  {
    key: 'goal',
    label: 'Goal',
    body: 'Our goal is to provide farmers efficient agricultural solutions that ensure our implements meet international standards and can withstand harsh conditions.',
  },
  {
    key: 'strategies',
    label: 'Strategies',
    body: 'Continuous research and development to innovate and improve our agricultural solutions, collaborating with global partners to ensure the highest quality standards.',
  },
] as const

export type Mission = (typeof mission)[number]

const productNames: Record<string, string[]> = {
  'primary-tillage': [
    'Super Seeder (Coulter Disc Type)',
    'Rotavator Machine (Export Model)',
    'Gobal Disc Harrow',
    'Tandem Disc Harrow',
    'Disc Plough (Pipe Frame)',
    'Post Hole Digger Machine',
    'Mould Board Plough (Chisel Model)',
    'Mould Board Plough (Regular Model)',
    'Chisel Plough (3 Tines)',
    'Chisel Plough (5 Tines)',
    'Mini Power Tiller',
    'Cultivator Machine',
    'Cultivator (Spring Pipe Cover Type)',
    'Cultivator (Z-Frame Machine)',
  ],
  'secondary-tillage': [
    'Laser Land Leveller Machine',
    'Garlic Bed Shaper With Seed Placement Pointer',
    'Bed Shaper Planter With Fertilizer System (Dibbler Type — Maize/Cotton)',
    'Multi-Crop Bed Shaper Cum Planter',
    'Automatic Potato Planter Machine',
    'Vegetable Ridger With Row Markers',
    'Border Disc',
    'Single Bed Shaper',
    'Border / Ditcher Blade',
    'Bed Shaper',
    'Ditcher With Press System',
    'Ditcher With Side Disc',
  ],
  'seeding-planting': [
    'Super Seeder (Coulter Disc Type)',
    'Zero Tillage Seed Drill',
    'Multi-Crop No Till Planter',
    'Bed Shaper Planter With Fertilizer System (Dibbler Type — Maize/Cotton)',
    'Direct Seeding Rice Drill (DSR)',
    'Multi-Crop Bed Shaper Cum Planter',
    'Seed Drill (Rabi Model)',
    'Automatic Potato Planter Machine',
    'Rice Drum Seeder',
    'Vegetable Seedling Transplanter',
    'Hand Push Seeder',
    'Portable Seeder',
    'Vegetable Seeder (Rollers Type)',
    'Vegetable Seeder (Spoon Type)',
    'Fertilizer Spreader',
  ],
  'harvesting-cutting': [
    'Wheat Straw Chopper Machine',
    'Mini Tractor With 2-Type Reaper',
    'Multi-Purpose Reaper Machine',
    'Reaper Machine (Export Model)',
    'Barseem Harvester Machine',
    'Lawn Grass Mower Machine',
    'Multi-Purpose Walking Type Reaper',
    'Back Pack Weeder & Brush Cutter',
    'Brush Cutter (Shoulder Type)',
    'Olive / Fruit Harvester',
    'Automatic Potato Digger',
  ],
  'post-harvest-processing': [
    'Wheat Straw Chopper Machine',
    'Silage Machine (Conveyor Type)',
    'Banana Shredder Machine',
    'Maize Sheller',
    'Seed Grader Cleaner Machine',
    'Wheat Thresher Machine',
  ],
  'manual-walk-behind': [
    'Rice Drum Seeder',
    'Vegetable Seedling Transplanter',
    'Hand Push Seeder',
    'Portable Seeder',
    'Vegetable Seeder (Rollers Type)',
    'Vegetable Seeder (Spoon Type)',
    'Mechanical Rice Weeder',
    'Mini Power Tiller',
    'Multi-Purpose Walking Type Reaper',
    'Back Pack Weeder & Brush Cutter',
    'Brush Cutter (Shoulder Type)',
    'Olive / Fruit Harvester',
  ],
  others: [
    'Mini Tractor With 2-Type Reaper',
    'Manual Cono Weeder',
    'Mechanical Rice Weeder',
    'Fertilizer Spreader',
  ],
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function getCategoryProducts(slug: string) {
  const cat = getCategory(slug)
  if (!cat) return []
  const names = productNames[slug] ?? []
  return names.map((name, i) => ({
    slug: name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    name,
    description:
      i % 2 === 0
        ? 'Precision-engineered for peak field performance and durability.'
        : 'Trusted by farmers across 60+ countries for consistent, reliable results.',
    image: cat.image,
    images: cat.images,
  }))
}

export const blogPosts = [
  {
    slug: 'zero-tillage-benefits',
    title: 'Why Zero Tillage Is Transforming Modern Farming',
    excerpt:
      'How no-till seed drills are cutting fuel costs, preserving soil structure and boosting yields across diverse cropping systems.',
    author: 'Engr. Tariq Mahmood',
    date: 'June 8, 2026',
    tag: 'Technology',
    image: '/products/seeds-bag.png',
    featured: true,
  },
  {
    slug: 'disc-harrow-selection-guide',
    title: 'Disc Harrow vs Tandem Disc: Choosing the Right Tool',
    excerpt:
      'A field-tested guide to matching disc harrow type to your soil conditions, crop residue levels and tractor horsepower.',
    author: 'Engr. Aisha Raza',
    date: 'June 2, 2026',
    tag: 'Product Guides',
    image: '/products/tractor.png',
    featured: false,
  },
  {
    slug: 'bed-shaper-planting-precision',
    title: 'Bed Shaping for Higher Vegetable Yields',
    excerpt:
      'How raised-bed cultivation with our bed shaper planters improves drainage, root development and marketable yield.',
    author: 'Engr. Tariq Mahmood',
    date: 'May 25, 2026',
    tag: 'Farming Tips',
    image: '/products/greenhouse.png',
    featured: false,
  },
  {
    slug: 'export-model-machinery',
    title: 'Green Land Engineers Expands Export Range',
    excerpt:
      'Our export-model rotavators and reapers are now certified for markets in Africa, Southeast Asia and Eastern Europe.',
    author: 'Green Land Engineers Team',
    date: 'May 14, 2026',
    tag: 'Company News',
    image: '/products/packaging-box.png',
    featured: false,
  },
  {
    slug: 'post-harvest-loss-reduction',
    title: 'Cutting Post-Harvest Losses With the Right Thresher',
    excerpt:
      'Selecting the correct thresher drum speed and clearance can reduce grain losses by up to 40% — a complete technical guide.',
    author: 'Engr. Aisha Raza',
    date: 'May 5, 2026',
    tag: 'Technology',
    image: '/products/fertilizer-sack.png',
    featured: false,
  },
]

export const blogTags = ['Technology', 'Product Guides', 'Farming Tips', 'Company News']

export const newsTypes = ['All', 'Meeting Notes', 'Announcements', 'Events', 'Press']

export const newsEntries = [
  {
    date: 'June 10, 2026',
    type: 'Meeting Notes',
    title: 'Production Line Review — Q2 2026',
    summary:
      'Reviewed output targets for rotavators and disc harrows. Confirmed export model line running at 96% capacity with new QC checkpoint installed.',
    image: '/products/tractor.png',
  },
  {
    date: 'June 8, 2026',
    type: 'Announcements',
    title: 'ISO 9001:2015 Recertification Achieved',
    summary:
      'Green Land Engineers has successfully recertified under ISO 9001:2015 across all manufacturing and assembly facilities.',
    image: '/products/packaging-box.png',
  },
  {
    date: 'June 5, 2026',
    type: 'Events',
    title: 'AgriMach 2026 — Lahore Exhibition',
    summary:
      'We will be exhibiting our full primary tillage and seeding range at AgriMach 2026. Visit us at Hall B, Booth 108.',
    image: '/products/seeds-bag.png',
  },
  {
    date: 'June 3, 2026',
    type: 'Meeting Notes',
    title: 'R&D Review — New Bed Shaper Variants',
    summary:
      'Engineering team presented three new bed shaper configurations for garlic, onion and potato crops entering field trials this season.',
    image: '/products/fertilizer-sack.png',
  },
  {
    date: 'May 30, 2026',
    type: 'Press',
    title: 'Featured in Pakistan Agriculture Journal',
    summary:
      'Our Zero Tillage Seed Drill was recognised as a top innovation for water and fuel conservation in rainfed farming systems.',
    image: '/products/irrigation-pipe.png',
  },
  {
    date: 'May 27, 2026',
    type: 'Announcements',
    title: 'DSR Drill Now Available Nationwide',
    summary:
      'Our Direct Seeding Rice (DSR) Drill is now available through our dealer network across all major rice-growing regions.',
    image: '/products/greenhouse.png',
  },
  {
    date: 'May 22, 2026',
    type: 'Meeting Notes',
    title: 'Export Logistics Planning — Africa & SE Asia',
    summary:
      'Coordinated container scheduling for the next export cycle covering five new partner countries in West Africa and Southeast Asia.',
    image: '/products/packaging-box.png',
  },
  {
    date: 'May 18, 2026',
    type: 'Events',
    title: 'Farmer Field Day — Sheikhupura',
    summary:
      'Hosted 150 local farmers for hands-on demonstrations of our bed shaper planters and reaper machines in rice-wheat cropping systems.',
    image: '/products/crop-protection.png',
  },
]
