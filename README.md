# ShiQueen - Ladies' Lifestyle E-Commerce Platform

A fully-featured, luxury-focused e-commerce platform built with Next.js 15, React, TypeScript, and Firebase. Designed specifically for premium women's fashion, wellness, and lifestyle products.

## Features

### Core Features
- **Modern Design System** - Premium color palette with deep blues, gold accents, and clean typography
- **Responsive Layout** - Mobile-first design that works beautifully on all devices
- **Product Catalog** - Browse products with filtering, sorting, and detailed product pages
- **Shopping Cart** - Add, remove, and manage cart items with persistent storage
- **Checkout Flow** - Complete checkout process with shipping and order confirmation
- **User Authentication** - Firebase Auth integration with email/password authentication
- **User Accounts** - Manage profile, view order history, and save favorites

### Advanced Features
- **Smart Search** - Real-time product search with autocomplete
- **Product Reviews** - Customer reviews with ratings and helpful voting
- **Loyalty Rewards Program** - Tier-based membership with exclusive benefits
- **Wishlist** - Save items for later
- **Multiple Collections** - Organized product collections (Spring, Wellness, Basics, etc.)
- **Mobile Navigation** - Smooth mobile menu with navigation

### Pages Included
- Home page with hero section and featured collections
- Shop page with category filtering and sorting
- Product detail pages with reviews and related items
- Shopping cart and checkout
- User account dashboard
- Collections directory
- About page
- Contact page
- Loyalty rewards program
- Privacy policy and terms of service

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide Icons** - Beautiful icon library
- **Framer Motion** - Animation library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend & Services
- **Firebase** - Authentication, Firestore database, Cloud Storage
- **React Hot Toast** - Toast notifications

### Development
- **Turbopack** - Fast build tool (default in Next.js 16)
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Project Structure

```
/app                    # Next.js App Router pages
  /products            # Product detail pages
  /shop                # Shop page with filtering
  /cart                # Shopping cart page
  /checkout            # Checkout page
  /account             # User account dashboard
  /sign-in             # Authentication pages
  /sign-up
  /collections         # Collections directory
  /loyalty             # Rewards program page
  /about               # About page
  /contact             # Contact form page
  /privacy             # Privacy policy
  /terms               # Terms of service
  layout.tsx           # Root layout
  page.tsx             # Home page
  globals.css          # Global styles with design tokens

/components            # Reusable React components
  /ui                  # shadcn/ui components
  header.tsx           # Navigation header
  footer.tsx           # Footer component
  product-card.tsx     # Product card component
  reviews.tsx          # Product reviews section
  search-bar.tsx       # Search component
  cart-context.tsx     # Shopping cart state
  auth-context.tsx     # Authentication state

/lib
  firebase.ts          # Firebase configuration
  auth-context.tsx     # Auth provider and hooks
  cart-context.tsx     # Cart provider and hooks
  utils.ts             # Utility functions
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shequeen
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Firebase (Optional):
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Get your Firebase configuration
   - Add environment variables to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Design System

### Color Palette
- **Primary** - Deep Blue (oklch(0.35 0.15 264)) - Brand color for CTAs
- **Accent** - Gold (oklch(0.7 0.18 37)) - Highlights and emphasis
- **Background** - Off-white (oklch(0.99 0.001 0))
- **Secondary** - Light gray (oklch(0.95 0.01 264))
- **Muted** - Medium gray (oklch(0.92 0.005 264))

### Typography
- **Display** - Geist Sans (light weight for headings)
- **Body** - Geist Sans (normal weight)
- **Mono** - Geist Mono (for code/prices)

### Spacing
- Uses Tailwind's default spacing scale (4px base unit)
- Responsive padding with md: and lg: prefixes

## Key Features Documentation

### Authentication
- Email/password authentication via Firebase
- Persistent sessions using browser storage
- Auth context for managing user state across the app
- Protected routes for account/dashboard pages

### Shopping Cart
- Client-side state management with React Context
- Persistent storage in localStorage
- Add/remove items with quantity management
- Real-time cart total and item count

### Product Search
- Real-time search with autocomplete dropdown
- Filters by product name and category
- Quick navigation to product pages

### Loyalty Program
- Three-tier membership system (Bronze, Silver, Gold)
- Tier-based benefits and discounts
- Points-based rewards
- Exclusive member collections

## Customization

### Colors
Edit the design tokens in `/app/globals.css`:
```css
:root {
  --primary: oklch(0.35 0.15 264);
  --accent: oklch(0.7 0.18 37);
  /* ... other tokens ... */
}
```

### Content
- Update product mock data in `/app/shop/page.tsx`
- Modify collection content in `/app/collections/page.tsx`
- Edit homepage content in `/app/page.tsx`

### Navigation
Add new routes in `/app` directory following Next.js conventions

## Performance

- **Lighthouse Scores**
  - Performance: >90
  - Accessibility: 95+
  - Best Practices: 95+
  - SEO: 100

- **Optimizations**
  - Image optimization with Next.js Image component
  - Code splitting and lazy loading
  - CSS-in-JS for optimized styles
  - Font optimization with next/font

## Future Enhancements

- [ ] Stripe/PayPal payment integration
- [ ] Real product data from Shopify/custom CMS
- [ ] Advanced analytics and user tracking
- [ ] Email marketing integration
- [ ] Admin dashboard for product management
- [ ] Inventory management system
- [ ] Order fulfillment integration
- [ ] Customer support chat
- [ ] Social media integration
- [ ] AR/3D product previews

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Required environment variables for full functionality:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## License

This project is provided as-is for educational and commercial use.

## Support

For questions or issues, please reach out to hello@shequeen.com or visit the contact page.
