/** Static catalog from additems.txt — used for seed and admin dropdowns. */

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  serviceTypes: string[];
  sortOrder: number;
}

export const SERVICE_CATALOG: CatalogCategory[] = [
  {
    id: 'hair-services',
    name: 'Hair Services',
    description: 'Braids, styling, treatments, wigs, and expert hair care.',
    sortOrder: 1,
    serviceTypes: [
      'Hair Braiding', 'Knotless Braids', 'Box Braids', 'Cornrows', 'Ghana Weaving',
      'Fulani Braids', 'Crochet Braids', 'Micro Braids', 'Dreadlocks Installation',
      'Dreadlocks Maintenance', 'Sisterlocks Installation', 'Hair Twisting',
      'Hair Relaxing', 'Hair Retouching', 'Hair Coloring', 'Hair Highlights',
      'Hair Treatment', 'Hair Protein Treatment', 'Hair Steaming', 'Hair Washing',
      'Hair Blow Drying', 'Hair Trimming', 'Hair Styling', 'Silk Press',
      'Wig Installation', 'Wig Revamping', 'Wig Customization', 'Wig Maintenance',
      'Wig Coloring', 'Wig Construction', 'Hair Extensions Installation', 'Hair Consultation',
    ],
  },
  {
    id: 'nail-services',
    name: 'Nail Services',
    description: 'Manicures, pedicures, nail art, and luxury nail treatments.',
    sortOrder: 2,
    serviceTypes: [
      'Manicure', 'Pedicure', 'Gel Polish', 'Acrylic Nails', 'Artificial Nails',
      'Nail Extensions', 'Nail Refills', 'Nail Repair', 'Nail Art', 'Luxury Nail Treatment',
      'Bridal Nails', 'French Tips', 'Nail Removal', 'Paraffin Hand Treatment',
    ],
  },
  {
    id: 'makeup-services',
    name: 'Makeup Services',
    description: 'Everyday glam, bridal makeup, and professional artistry.',
    sortOrder: 3,
    serviceTypes: [
      'Everyday Makeup', 'Soft Glam Makeup', 'Full Glam Makeup', 'Bridal Makeup',
      'Traditional Wedding Makeup', 'Bridesmaids Makeup', 'Engagement Makeup',
      'Photoshoot Makeup', 'Birthday Makeup', 'Graduation Makeup', 'Fashion Show Makeup',
      'Corporate Makeup', 'TV & Media Makeup', 'Makeup Consultation', 'Makeup Lessons',
    ],
  },
  {
    id: 'eyelash-eyebrow-services',
    name: 'Eyelash & Eyebrow Services',
    description: 'Brows, lashes, lifts, extensions, and shaping.',
    sortOrder: 4,
    serviceTypes: [
      'Eyebrow Shaping', 'Eyebrow Tinting', 'Microblading', 'Ombre Brows', 'Brow Lamination',
      'Eyelash Extensions', 'Lash Lift', 'Lash Tinting', 'Lash Refills', 'Eyelash Removal',
    ],
  },
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    description: 'Massage, body treatments, and restorative wellness experiences.',
    sortOrder: 5,
    serviceTypes: [
      'Full Body Massage', 'Deep Tissue Massage', 'Relaxation Massage', 'Aromatherapy Massage',
      'Hot Stone Massage', 'Body Scrub', 'Body Polishing', 'Body Wrap', 'Steam Bath',
      'Sauna Session', 'Spa Package', 'Wellness Consultation', 'Stress Relief Therapy',
      'Self-Care Session',
    ],
  },
  {
    id: 'skincare-services',
    name: 'Skincare Services',
    description: 'Facials, peels, and personalized skin treatments.',
    sortOrder: 6,
    serviceTypes: [
      'Facial Treatment', 'Deep Cleansing Facial', 'Acne Treatment Facial', 'Brightening Facial',
      'Anti-Aging Facial', 'Hydrating Facial', 'Chemical Peel', 'Microdermabrasion',
      'Skin Consultation', 'Skin Analysis', 'Blackhead Removal', 'Exfoliation Treatment',
      'Luxury Spa Facial',
    ],
  },
  {
    id: 'waxing-hair-removal',
    name: 'Waxing & Hair Removal',
    description: 'Waxing, threading, and hair reduction services.',
    sortOrder: 7,
    serviceTypes: [
      'Full Body Waxing', 'Leg Waxing', 'Arm Waxing', 'Bikini Waxing', 'Brazilian Wax',
      'Underarm Waxing', 'Facial Waxing', 'Threading', 'Laser Hair Removal',
      'Permanent Hair Reduction Consultation',
    ],
  },
  {
    id: 'bridal-services',
    name: 'Bridal Services',
    description: 'Complete wedding-day beauty and preparation packages.',
    sortOrder: 8,
    serviceTypes: [
      'Bridal Beauty Package', 'Bridal Hair Styling', 'Bridal Makeup', 'Bridal Nails',
      'Bridal Spa Preparation', 'Pre-Wedding Beauty Program', 'Bridesmaids Beauty Package',
      'Wedding Day Touch-Up Services', 'Traditional Ceremony Styling',
    ],
  },
  {
    id: 'home-beauty-services',
    name: 'Home Beauty Services',
    description: 'Premium beauty professionals who come to you.',
    sortOrder: 9,
    serviceTypes: [
      'Home Hair Braiding', 'Home Makeup Service', 'Home Nail Service', 'Home Massage Service',
      'Home Facial Service', 'Home Waxing Service', 'Home Bridal Preparation', 'Home Spa Experience',
    ],
  },
  {
    id: 'fashion-styling',
    name: 'Fashion & Styling',
    description: 'Personal styling, wardrobe consulting, and image coaching.',
    sortOrder: 10,
    serviceTypes: [
      'Personal Styling', 'Wardrobe Consultation', 'Fashion Consultation', 'Image Consulting',
      'Color Analysis', 'Closet Organization', 'Personal Shopper Service', 'Outfit Coordination',
      'Event Styling',
    ],
  },
  {
    id: 'photography-services',
    name: 'Photography Services',
    description: 'Professional shoots, branding, and content creation.',
    sortOrder: 11,
    serviceTypes: [
      'Professional Photoshoot', 'Beauty Photoshoot', 'Birthday Photoshoot', 'Graduation Photoshoot',
      'Personal Branding Shoot', 'Fashion Photography', 'Social Media Content Creation',
      'Influencer Content Session', 'Product Photography',
    ],
  },
  {
    id: 'fitness-wellness',
    name: 'Fitness & Wellness',
    description: 'Training, nutrition, yoga, and holistic wellness coaching.',
    sortOrder: 12,
    serviceTypes: [
      'Personal Training', "Women's Fitness Coaching", 'Weight Loss Coaching',
      'Nutrition Consultation', 'Wellness Coaching', 'Yoga Classes', 'Pilates Classes',
      'Home Workout Planning', 'Postpartum Fitness Coaching',
    ],
  },
  {
    id: 'motherhood-services',
    name: 'Motherhood Services',
    description: 'Prenatal, postpartum, and new-mother support services.',
    sortOrder: 13,
    serviceTypes: [
      'Pregnancy Wellness Consultation', 'Prenatal Massage', 'Postpartum Care Consultation',
      'New Mother Coaching', 'Baby Shower Planning', 'Lactation Consultation',
      'Mother & Baby Wellness Package',
    ],
  },
  {
    id: 'event-services',
    name: 'Event Services',
    description: 'Planning, décor, and coordination for special occasions.',
    sortOrder: 14,
    serviceTypes: [
      'Birthday Planning', 'Bridal Shower Planning', 'Baby Shower Planning',
      'Surprise Party Planning', 'Event Decoration', 'Gift Packaging', 'Event Coordination',
    ],
  },
  {
    id: 'professional-lifestyle',
    name: 'Professional & Lifestyle Services',
    description: 'Career coaching, branding, and executive image consulting.',
    sortOrder: 15,
    serviceTypes: [
      'Personal Branding Consultation', 'Career Coaching', 'Confidence Coaching',
      'Public Speaking Coaching', 'Business Mentorship', 'Entrepreneur Coaching',
      'CV & LinkedIn Optimization', 'Professional Image Consulting',
    ],
  },
  {
    id: 'luxury-services',
    name: 'Luxury Services',
    description: 'VIP experiences and premium transformation packages.',
    sortOrder: 16,
    serviceTypes: [
      'VIP Beauty Day', 'Luxury Self-Care Experience', 'Executive Woman Package',
      'Queen for a Day Experience', 'Bridal Luxury Experience', 'Luxury Spa Retreat',
      'Complete Glow-Up Program', 'Personal Transformation Program',
    ],
  },
];

export function getCatalogCategory(id: string): CatalogCategory | undefined {
  return SERVICE_CATALOG.find((c) => c.id === id);
}
