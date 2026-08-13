export type PackageCategoryId =
  | 'beauty'
  | 'hair'
  | 'skincare'
  | 'health-wellness'
  | 'birthday'
  | 'gift'
  | 'bridal'
  | 'self-care'
  | 'fashion'
  | 'luxury'
  | 'motherhood'
  | 'corporate-woman'
  | 'student'
  | 'seasonal'
  | 'shequeen-signature';

export type PackageTierId =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'vip';

export interface PackageCategory {
  id: PackageCategoryId;
  label: string;
  discoveryLabel: string;
  shortDescription: string;
  icon: string;
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  {
    id: 'beauty',
    label: 'Beauty Packages',
    discoveryLabel: 'Beauty & Glow',
    shortDescription: 'Complete makeup and beauty essentials for every look',
    icon: 'sparkles',
  },
  {
    id: 'hair',
    label: 'Hair Packages',
    discoveryLabel: 'Hair Care',
    shortDescription: 'Wigs, care, and styling solutions in one bundle',
    icon: 'scissors',
  },
  {
    id: 'skincare',
    label: 'Skincare Packages',
    discoveryLabel: 'Skincare',
    shortDescription: 'Targeted routines for glow, clarity, and healthy skin',
    icon: 'droplets',
  },
  {
    id: 'health-wellness',
    label: 'Health & Wellness Packages',
    discoveryLabel: 'Health & Wellness',
    shortDescription: 'Holistic wellness for body, mind, and energy',
    icon: 'heart-pulse',
  },
  {
    id: 'birthday',
    label: 'Birthday Packages',
    discoveryLabel: 'Birthday Gifts',
    shortDescription: 'Thoughtful birthday bundles she will love',
    icon: 'cake',
  },
  {
    id: 'gift',
    label: 'Gift Packages',
    discoveryLabel: 'Gift Packages',
    shortDescription: 'Ready-to-gift collections for any celebration',
    icon: 'gift',
  },
  {
    id: 'bridal',
    label: 'Bridal Packages',
    discoveryLabel: 'Bridal Packages',
    shortDescription: 'Everything for the bride, bridal party, and big day',
    icon: 'gem',
  },
  {
    id: 'self-care',
    label: 'Self-Care Packages',
    discoveryLabel: 'Self-Care',
    shortDescription: 'Pamper, recharge, and invest in yourself',
    icon: 'bath',
  },
  {
    id: 'fashion',
    label: 'Fashion Packages',
    discoveryLabel: 'Fashion',
    shortDescription: 'Curated style and accessories for every occasion',
    icon: 'shirt',
  },
  {
    id: 'luxury',
    label: 'Luxury Packages',
    discoveryLabel: 'Luxury Collections',
    shortDescription: 'Premium high-value collections for the discerning queen',
    icon: 'crown',
  },
  {
    id: 'motherhood',
    label: 'Motherhood Packages',
    discoveryLabel: "Mother's Packages",
    shortDescription: 'Care bundles for moms, moms-to-be, and baby moments',
    icon: 'baby',
  },
  {
    id: 'corporate-woman',
    label: 'Corporate Woman Packages',
    discoveryLabel: 'Boss Lady Collections',
    shortDescription: 'Polished essentials for the working professional',
    icon: 'briefcase',
  },
  {
    id: 'student',
    label: 'Student Packages',
    discoveryLabel: 'Student Packages',
    shortDescription: 'Campus-ready bundles on a student budget',
    icon: 'graduation-cap',
  },
  {
    id: 'seasonal',
    label: 'Seasonal Packages',
    discoveryLabel: 'Seasonal Packages',
    shortDescription: 'Timely collections for holidays and changing seasons',
    icon: 'sun',
  },
  {
    id: 'shequeen-signature',
    label: 'ShiQueen Signature Packages',
    discoveryLabel: 'ShiQueen Exclusives',
    shortDescription: 'Our flagship curated bundles — the best of ShiQueen',
    icon: 'star',
  },
];

export const PACKAGE_NAME_TEMPLATES: Record<PackageCategoryId, string[]> = {
  beauty: [
    'Everyday Beauty Essentials Package',
    'Complete Makeup Starter Kit',
    'Professional Makeup Artist Package',
    'Glam Queen Package',
    'Bridal Beauty Package',
    'Bridal Party Package',
    'Natural Beauty Package',
    'Luxury Beauty Collection',
    'Beauty on a Budget Package',
    'Weekend Glow Package',
    'Party Ready Package',
    'Date Night Beauty Package',
    'Office Beauty Package',
    'Travel Beauty Package',
    'Nail Starter Package',
    'DIY Nail Salon Package',
    'Artificial Nails Package',
    'Gel Nail Package',
    'Luxury Nail Care Package',
    'Nail Maintenance Package',
    'Bridal Nail Package',
    'Professional Nail Technician Package',
    'Everyday Perfume Collection',
    'Luxury Fragrance Package',
    'Date Night Fragrance Package',
    'Travel Fragrance Package',
    'Signature Scent Package',
    'Perfume Gift Package',
  ],
  hair: [
    'Wig Starter Package',
    'Premium Wig Package',
    'Human Hair Wig Collection',
    'Wig Maintenance Package',
    'Hair Growth Package',
    'Hair Repair Package',
    'Natural Hair Care Package',
    'Braids Care Package',
    'Protective Styling Package',
    'Hair Treatment Package',
    'Luxury Hair Package',
    'Hair Styling Essentials Package',
    'Salon-at-Home Package',
  ],
  skincare: [
    'Daily Skincare Package',
    'Acne Treatment Package',
    'Brightening & Glow Package',
    'Anti-Aging Package',
    'Sensitive Skin Package',
    'Oily Skin Package',
    'Dry Skin Rescue Package',
    'Luxury Skincare Package',
    'Spa-at-Home Package',
    'Self-Care Package',
    'Weekend Facial Package',
    'Complete Skin Transformation Package',
  ],
  'health-wellness': [
    "Women's Wellness Package",
    'Self-Care & Wellness Package',
    'Fitness Essentials Package',
    'Weight Management Package',
    'Healthy Living Package',
    'Stress Relief Package',
    'Relaxation Package',
    'Sleep Support Package',
    'Energy Boost Package',
    'Immunity Support Package',
    'Holistic Wellness Package',
  ],
  birthday: [
    'Birthday Package',
    'Luxury Birthday Package',
    'ShiQueen Birthday Box',
  ],
  gift: [
    'Anniversary Gift Package',
    "Valentine's Package",
    "Mother's Day Package",
    "Women's Day Package",
    'Christmas Gift Package',
    'Easter Gift Package',
    'Graduation Gift Package',
    'Thank You Gift Package',
    'Appreciation Package',
    'Friendship Gift Package',
    'Corporate Gift Package',
    'Date Night Package',
    'Couples Gift Package',
    'Romantic Surprise Package',
  ],
  bridal: [
    'Bridal Beauty Package',
    'Bridal Party Package',
    'Bridal Nail Package',
    'Bride-to-Be Package',
    'Engagement Package',
    'Honeymoon Package',
    'ShiQueen Bridal Box',
  ],
  'self-care': [
    'Queen Essentials Package',
    'Glow Up Package',
    'Confidence Package',
    'Luxury Lifestyle Package',
    'Weekend Refresh Package',
    'Monthly Essentials Package',
    'Premium Subscription Package',
    'Ultimate Queen Package',
    'Spa-at-Home Package',
    'Self-Care Package',
  ],
  fashion: [
    'Casual Wear Package',
    'Office Wear Package',
    'Corporate Woman Package',
    'Weekend Fashion Package',
    'Luxury Fashion Package',
    'Travel Fashion Package',
    'Modest Fashion Package',
    'Activewear Package',
    'Vacation Fashion Package',
    'Influencer Fashion Package',
    'Jewelry Collection Package',
    'Luxury Accessories Package',
    'Handbag Collection Package',
    'Watch & Jewelry Package',
    'Fashion Accessories Bundle',
    'Complete Accessories Package',
  ],
  luxury: [
    'Bronze Queen Package',
    'Silver Queen Package',
    'Gold Queen Package',
    'Platinum Queen Package',
    'Diamond Queen Package',
    'VIP Queen Package',
    'Ultimate Luxury Queen Package',
    'Luxury Beauty Collection',
    'Luxury Hair Package',
    'Luxury Skincare Package',
    'Luxury Fashion Package',
    'Luxury Lifestyle Package',
  ],
  motherhood: [
    'New Mom Package',
    'Pregnancy Care Package',
    'Baby Shower Gift Package',
    'Postpartum Care Package',
    'Nursing Mom Package',
    'Mother & Baby Package',
  ],
  'corporate-woman': [
    'Working Woman Package',
    'Executive Woman Package',
    'Corporate Beauty Package',
    'Boss Lady Package',
    'Business Travel Package',
    'Office Wear Package',
    'Office Beauty Package',
  ],
  student: [
    'Campus Queen Package',
    'University Starter Package',
    'Hostel Essentials Package',
    'Student Beauty Package',
    'Freshers Package',
  ],
  seasonal: [
    'Back-to-School Package',
    'Holiday Travel Package',
    'Christmas Celebration Package',
    'New Year Glow Package',
    'Summer Beauty Package',
    'Rainy Season Care Package',
  ],
  'shequeen-signature': [
    'ShiQueen Starter Package',
    'ShiQueen Glow Package',
    'ShiQueen Beauty Box',
    'ShiQueen Wellness Box',
    'ShiQueen Luxury Box',
    'ShiQueen Birthday Box',
    'ShiQueen Bridal Box',
    'ShiQueen Self-Care Box',
    'ShiQueen Premium Box',
    'ShiQueen Royal Collection',
    "ShiQueen Queen's Choice Package",
    'ShiQueen Ultimate Queen Bundle',
  ],
};

export const PACKAGE_TIERS: { id: PackageTierId; label: string }[] = [
  { id: 'bronze', label: 'Bronze Queen' },
  { id: 'silver', label: 'Silver Queen' },
  { id: 'gold', label: 'Gold Queen' },
  { id: 'platinum', label: 'Platinum Queen' },
  { id: 'diamond', label: 'Diamond Queen' },
  { id: 'vip', label: 'VIP Queen' },
];

export const DEFAULT_HIGHLIGHTS: Record<PackageCategoryId, string[]> = {
  beauty: [
    'Everything you need for a complete beauty routine',
    'Curated for your look, occasion, or skill level',
    'Better value than buying products separately',
  ],
  hair: [
    'Complete hair care or styling solution in one order',
    'Ideal for wigs, natural hair, or protective styles',
    'Save time choosing compatible products',
  ],
  skincare: [
    'A full routine matched to your skin goals',
    'Professional-grade products working together',
    'Visible results without the guesswork',
  ],
  'health-wellness': [
    'Holistic support for your wellness goals',
    'Curated for energy, balance, or relaxation',
    'A complete self-investment in one bundle',
  ],
  birthday: [
    'A ready-made gift she will remember',
    'Thoughtfully curated for birthday celebrations',
    'Premium presentation without the hassle',
  ],
  gift: [
    'Perfect for celebrations and special moments',
    'Beautifully curated — ready to give',
    'Shows you chose with care, not convenience',
  ],
  bridal: [
    'Everything for the bride and bridal party',
    'Curated for weddings, engagements, and honeymoons',
    'Look flawless from ceremony to celebration',
  ],
  'self-care': [
    'Invest in rest, glow, and confidence',
    'A complete pamper session at home',
    'Because you deserve the full experience',
  ],
  fashion: [
    'A coordinated look from head to toe',
    'Style essentials for your lifestyle',
    'Curated pieces that work together',
  ],
  luxury: [
    'Our most premium curated collection',
    'Exceptional quality for the discerning queen',
    'The ultimate complete luxury experience',
  ],
  motherhood: [
    'Support for every stage of motherhood',
    'Gentle, practical essentials in one bundle',
    'Perfect for moms and moms-to-be',
  ],
  'corporate-woman': [
    'Polished essentials for the professional woman',
    'Look confident from office to after-hours',
    'Curated for busy working lifestyles',
  ],
  student: [
    'Campus-ready essentials on a student budget',
    'Everything a queen needs away from home',
    'Smart value for university life',
  ],
  seasonal: [
    'Timely essentials for the season ahead',
    'Curated for holidays and changing weather',
    'Stay prepared without overthinking',
  ],
  'shequeen-signature': [
    'Our flagship ShiQueen curated collection',
    'The best of beauty, wellness, and lifestyle',
    'The complete queen experience in one bundle',
  ],
};

export const SHOP_BY_PURPOSE_IDS: PackageCategoryId[] = [
  'gift',
  'bridal',
  'self-care',
  'corporate-woman',
  'student',
  'shequeen-signature',
];

const categoryMap = new Map(PACKAGE_CATEGORIES.map((c) => [c.id, c]));

export function getPackageCategory(id?: PackageCategoryId | string): PackageCategory | undefined {
  if (!id) return undefined;
  return categoryMap.get(id as PackageCategoryId);
}

export function getPackageCategoryLabel(id?: PackageCategoryId | string): string {
  return getPackageCategory(id)?.label ?? 'Uncategorized';
}

export function getPackageCategoryDiscoveryLabel(id?: PackageCategoryId | string): string {
  const cat = getPackageCategory(id);
  return cat?.discoveryLabel ?? cat?.label ?? 'Bundles';
}

export function getPackageNameTemplates(categoryId: PackageCategoryId): string[] {
  return PACKAGE_NAME_TEMPLATES[categoryId] ?? [];
}

export function getPackageTierLabel(tier?: PackageTierId | string): string {
  if (!tier) return '';
  return PACKAGE_TIERS.find((t) => t.id === tier)?.label ?? tier;
}

export function getDefaultHighlights(categoryId?: PackageCategoryId): string[] {
  if (!categoryId) {
    return [
      'Carefully curated product selection',
      'Complete solution — not individual picks',
      'Special package pricing',
    ];
  }
  return DEFAULT_HIGHLIGHTS[categoryId] ?? [];
}

export function isValidPackageCategory(id: string): id is PackageCategoryId {
  return categoryMap.has(id as PackageCategoryId);
}
