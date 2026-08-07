import { InteriorProject } from '../types';

export const INTERIOR_SERVICES = [
  {
    id: 'srv-kitchen',
    title: 'Modular Kitchens',
    tagline: 'Ergonomic, Waterproof & Luxury Kitchen Designs',
    description: 'Custom acrylic, PVC, marine ply & factory-finished tandem box modular kitchens with soft-close hardware.',
    icon: 'UtensilsCrossed',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    features: ['BWP 710 Marine Plywood', 'Soft-close Blum / Ebco Hardware', 'Quartz & Granite Countertops', 'Chimney & Hob Integration']
  },
  {
    id: 'srv-ceiling',
    title: 'False Ceiling & Lighting',
    tagline: 'Architectural Gypsum & CNC Wood Ceilings',
    description: 'Gyproc plasterboard false ceilings with warm COB profile LED lighting, magnetic track lights & chandelier accents.',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    features: ['Gyproc Saint-Gobain Boards', 'Energy Efficient Profile LED', 'CNC Lattice Wood Patterns', 'Acoustic Sound Insulation']
  },
  {
    id: 'srv-wardrobe',
    title: 'Custom Wardrobes & Storage',
    tagline: 'Sliding & Floor-to-Ceiling Storage Solutions',
    description: 'Space-saving sliding glass wardrobes, lacquered glass shutters, walk-in closets with integrated LED strip lighting.',
    icon: 'DoorClosed',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    features: ['Floor-to-Ceiling Height', 'Lacquered & Tinted Glass', 'Internal Drawer Accessories', 'Digital Lock Vaults']
  },
  {
    id: 'srv-living',
    title: 'Living Room Interiors',
    tagline: 'Modern TV Units, Fluted Panels & Marble Louvers',
    description: 'Transform your main living area into an opulent entertainment haven featuring Italian marble walls & acoustic panels.',
    icon: 'Tv',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    features: ['Fluted Charcoal Panels', 'Floating TV Units', 'Ambient RGB Cove Lighting', 'Custom Sectional Sofa Design']
  },
  {
    id: 'srv-bedroom',
    title: 'Master & Guest Bedrooms',
    tagline: 'Cozy Headboards, Dressing Units & Study Nooks',
    description: 'Full bedroom makeovers with upholstered padded headboards, vanity mirrors, study desks and ambient dimmable lamps.',
    icon: 'Bed',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80',
    features: ['Cushioned Wall Padding', 'Concealed Cable Routing', 'Ergonomic Workstations', 'Wardrobe Loft Units']
  },
  {
    id: 'srv-office',
    title: 'Commercial & Office Design',
    tagline: 'Productive Workspaces, Reception & Executive Cabins',
    description: 'Turnkey commercial workspace interior fit-outs for retail showrooms, corporate offices & clinics in Kovilpatti.',
    icon: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    features: ['Ergonomic Mesh Seating', 'Glass Partition Walls', 'Brand Color Schemes', 'Modular Work Desks']
  },
  {
    id: 'srv-const',
    title: 'Turnkey Civil Construction Works',
    tagline: 'Residential Building, Elevations & Renovations',
    description: 'End-to-end building construction, 3D elevation designs, structural masonry, flooring, plumbing & electrical works.',
    icon: 'Building2',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    features: ['3D Elevation Rendering', 'Quality Tested Concrete & Steel', 'Granite & Vitrified Flooring', 'Strict Timeline Guarantee']
  }
];

export const BEFORE_AFTER_DATA = [
  {
    id: 'ba-1',
    title: 'Luxury Villa Living Room Renovation',
    location: 'Kovilpatti Main Road',
    beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    description: 'Converted an outdated dated room into a sleek contemporary living hall with charcoal fluted paneling and Italian marble accents.'
  },
  {
    id: 'ba-2',
    title: 'Modern L-Shaped Modular Kitchen Upgrade',
    location: 'Kathiresan Kovil Street',
    beforeImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    description: 'Replaced traditional wooden shelves with BWP Marine Ply acrylic high-gloss tandem drawers and quartz stone countertop.'
  }
];

export const PORTFOLIO_PROJECTS: InteriorProject[] = [
  {
    id: 'proj-1',
    title: 'The Royal Residence - 4BHK Villa',
    category: 'Modular Kitchen',
    location: 'Kovilpatti, TN',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    description: 'Turnkey interior design including acrylic modular kitchen, cove false ceiling and customized teak wood doors.',
    completionYear: '2026'
  },
  {
    id: 'proj-2',
    title: 'Contemporary Apartment False Ceiling',
    category: 'False Ceiling',
    location: 'Nalattinputhur, Kovilpatti',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    description: 'Multi-layer Gyproc false ceiling with warm white magnetic track lighting and ambient LED strips.',
    completionYear: '2025'
  },
  {
    id: 'proj-3',
    title: 'Master Bedroom Wardrobes & Vanity Unit',
    category: 'Wardrobe',
    location: 'Ettayapuram Road',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    description: 'Tinted glass sliding wardrobe with sensor activated interior lighting and concealed jewelry safe.',
    completionYear: '2026'
  },
  {
    id: 'proj-4',
    title: 'Modern Office Reception & Workstations',
    category: 'Office',
    location: 'Main Road, Kovilpatti',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    description: 'Acoustic wall panelling, ergonomic dual monitor desks, and marble front reception desk.',
    completionYear: '2025'
  },
  {
    id: 'proj-5',
    title: '2-Story Modern Independent Residence',
    category: 'Construction',
    location: 'Kavilpatti Town',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    description: 'Full civil construction from foundation to final paint coat using Asian Paints Apex Ultima exterior finish.',
    completionYear: '2026'
  }
];

export const INTERIOR_PACKAGES = [
  {
    id: 'pkg-std',
    name: 'Essential Home Package',
    target: '2BHK Apartments / Small Homes',
    price: '₹2.8 Lakhs onwards',
    features: [
      'Basic Modular Kitchen (Commercial Ply + Laminate)',
      'Basic Gypsum False Ceiling in Hall',
      '2 Standard Swing Door Wardrobes',
      'Asian Paints Tractor Emulsion Paint',
      '1 Year Warranty & Free Service'
    ],
    recommended: false
  },
  {
    id: 'pkg-prm',
    name: 'Styleo Premium Package',
    target: '3BHK Villas & Modern Homes',
    price: '₹5.5 Lakhs onwards',
    features: [
      'BWP 710 Marine Ply Modular Kitchen with Soft Close',
      'Full House Designer False Ceiling with Profile LED',
      'Sliding Wardrobes with Loft Storage',
      'Fluted Charcoal TV Unit Wall',
      'Asian Paints Royale Silk Finish Paints',
      '5 Years Warranty'
    ],
    recommended: true
  },
  {
    id: 'pkg-lux',
    name: 'Luxury Royal Package',
    target: 'Custom Luxury Villas & Turnkey',
    price: '₹9.5 Lakhs onwards',
    features: [
      'High-Gloss Acrylic / Lacquered Glass Kitchen',
      'Italian Marble Wall Accent & CNC Ceiling Details',
      'Walk-In Glass Closets with Auto Sensor LED',
      'Teak Wood Doors & Premium Designer Hardware',
      'Turnkey Civil & Plumbing Integration',
      '10 Years Warranty & Annual Maintenance'
    ],
    recommended: false
  }
];

export const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Dr. R. Shanmugam',
    location: 'Kovilpatti',
    text: 'S. Madasamy sir and team at Styleo Interiors executed our 3BHK villa modular kitchen and false ceiling flawlessly. The finish was as promised and completed within budget.',
    rating: 5,
    role: 'Home Owner'
  },
  {
    id: 't-2',
    name: 'K. Balakrishnan',
    location: 'Ettayapuram Road',
    text: 'Being an Asian Paints Authorized Dealer, RJ Paints supplied authentic Apex Ultima paints for our commercial building project at competitive prices. Highly recommended!',
    rating: 5,
    role: 'Civil Contractor'
  },
  {
    id: 't-3',
    name: 'M. Priya & Family',
    location: 'Kovilpatti',
    text: 'The before/after transformation of our living room was astonishing. Their 3D design matching the final outcome was 100% accurate.',
    rating: 5,
    role: 'Villa Owner'
  }
];

export const DESIGN_PROCESS_STEPS = [
  { step: '01', title: 'Free Consultation', desc: 'Discuss your vision, budget, site dimensions & layout preferences.' },
  { step: '02', title: '3D Photorealistic Design', desc: 'Visualize exact materials, colors, false ceiling LED layout before execution.' },
  { step: '03', title: 'Material Selection', desc: 'Choose from Asian Paints shades, marine ply, acrylics & hardware at our Kovilpatti showroom.' },
  { step: '04', title: 'Precision Execution', desc: 'Skilled carpenters, electricians, masons & painters work under expert supervision.' },
  { step: '05', title: 'Handover & Warranty', desc: 'Thorough quality inspection, deep cleaning, and handing over key with warranty card.' }
];
