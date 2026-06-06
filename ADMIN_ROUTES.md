# Admin Dashboard Routes Reference

## Quick Navigation

### Main Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/admin` | Dashboard | Main dashboard with KPIs and overview |
| `/admin/products` | Products | Manage product inventory |
| `/admin/products/new` | New Product | Add a new product |
| `/admin/products/[id]` | Edit Product | Edit product details |
| `/admin/orders` | Orders | Manage customer orders |
| `/admin/customers` | Customers | Manage customer database |
| `/admin/analytics` | Analytics | Business intelligence and metrics |
| `/admin/settings` | Settings | Store configuration |

## Detailed Routes

### Dashboard (`/admin`)
**Description:** Main admin dashboard with overview of store performance  
**Features:**
- Revenue metrics
- Order statistics
- Customer count
- Inventory levels
- Recent orders table
- Top products ranking
- Quick action buttons

### Products Management

#### List Products (`/admin/products`)
**Description:** View and manage all products  
**Features:**
- Search by name or SKU
- View product details (name, SKU, category, price, stock, status)
- Edit button for each product
- Delete button for each product
- Stock status indicators
- Add product button

#### New Product (`/admin/products/new`)
**Description:** Create a new product  
**Features:**
- Product name, SKU, category
- Description
- Pricing and stock management
- Image upload
- Visibility controls
- Save button

#### Edit Product (`/admin/products/[id]`)
**Description:** Edit existing product  
**Parameters:**
- `[id]`: Product ID  
**Features:**
- All new product fields
- Pre-filled with current product data
- Delete option
- Last updated timestamp
- Save changes button

### Orders Management (`/admin/orders`)
**Description:** Manage and track all customer orders  
**Features:**
- Search by Order ID, customer name, or email
- Filter by order status (All, Pending, Processing, Shipped, Delivered, Cancelled)
- View order details:
  - Order ID
  - Customer name and email
  - Number of items
  - Total amount
  - Customer country
  - Order status
  - Order date
- View order details button
- Print invoice button
- Status badges with color coding

### Customers Management (`/admin/customers`)
**Description:** Manage customer relationships and loyalty  
**Features:**
- Search by name, email, or country
- Customer cards displaying:
  - Customer name and country
  - Loyalty tier (Bronze/Silver/Gold)
  - Total orders
  - Total spending
  - Email and phone
  - Last order date
- Email customer button
- Message customer button
- Delete customer button

### Analytics (`/admin/analytics`)
**Description:** Business intelligence and performance metrics  
**Sections:**

#### Key Metrics
- Monthly Revenue with % change
- Conversion Rate with % change
- Average Order Value with % change
- Repeat Customer Rate with % change

#### Top Markets by Country
- Ranking of countries by orders
- Revenue per country
- Growth percentage
- Order count
- Visual progress bars

#### Sales by Category
- Product category performance
- Sales count per category
- Revenue per category
- Percentage of total sales
- Visual breakdown

#### Monthly Trend
- Historical data table
- Monthly revenue tracking
- Order count by month
- New customers per month
- Average order value calculation

### Settings & Configuration (`/admin/settings`)

#### Currencies (`/admin/settings?tab=currencies`)
**Purpose:** Manage store currencies  
**Data:**
- Currency code (USD, EUR, GBP, CAD, AUD, JPY)
- Currency symbol
- Currency name
- Exchange rate (vs USD)
- Active/Inactive status

**Actions:**
- Add new currency
- Edit exchange rate
- Delete currency
- Enable/disable currency

#### Shipping Zones (`/admin/settings?tab=shipping`)
**Purpose:** Configure regional shipping rules  
**Default Zones:**
1. North America - $9.99, 3-5 days
2. Europe - €8.99, 5-7 days
3. Asia Pacific - $14.99, 7-10 days
4. Rest of World - $19.99, 10-15 days

**Actions:**
- Add shipping zone
- Edit zone settings (cost, free threshold, delivery time)
- Delete zone
- Configure countries per zone

#### Taxes & Duties (`/admin/settings?tab=taxes`)
**Purpose:** Manage regional tax compliance  
**Configured Regions:**
- United States (8.5% Sales Tax)
- Canada (13% HST)
- United Kingdom (20% VAT)
- EU (19% VAT)
- Australia (10% GST)

**Actions:**
- Add tax rate
- Edit tax rate per region
- Delete tax rate
- Enable/disable tax collection

#### Payment Methods (`/admin/settings?tab=payments`)
**Purpose:** Manage payment processors  
**Connected Methods:**
- Stripe (All currencies)
- PayPal (All currencies)
- Apple Pay
- Google Pay

**Actions:**
- View connected processor status
- Access processor settings
- Configure supported currencies

## Access Control

All admin routes require:
1. User to be authenticated via Firebase
2. User to have a valid session
3. If not authenticated, user is redirected to `/sign-in`

## Mobile Responsiveness

All admin pages are fully responsive:
- Desktop (1024px+): Full layout with sidebar
- Tablet (768px - 1023px): Optimized layout
- Mobile (< 768px): Mobile-first with collapsible sidebar

## Quick Links

### For Common Tasks

**Add a Product:**
1. Go to `/admin/products`
2. Click "Add Product" button
3. Fill in product details
4. Click "Save Changes"

**View Order Details:**
1. Go to `/admin/orders`
2. Click "View" button on desired order
3. See detailed order information

**Check Store Performance:**
1. Go to `/admin` (Dashboard)
2. Review KPI cards at the top
3. Check recent orders and top products

**Manage International Settings:**
1. Go to `/admin/settings`
2. Select appropriate tab (Currencies, Shipping, Taxes, Payments)
3. Add/edit/delete as needed

**View Regional Performance:**
1. Go to `/admin/analytics`
2. Scroll to "Top Markets by Country"
3. Review revenue and growth by region

---

**Note:** All routes are prefixed with `/admin` and require authentication.
