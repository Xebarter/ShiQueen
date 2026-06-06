# Admin Dashboard Guide

## Overview

The admin dashboard provides comprehensive management tools for your international ecommerce platform. It's accessible at `/admin` and requires user authentication to access.

## Authentication

- Admin access is controlled through Firebase Authentication
- Only authenticated users can access the admin dashboard
- Users are automatically redirected to `/sign-in` if not authenticated

## Dashboard Sections

### 1. **Dashboard Home** (`/admin`)

The main dashboard provides a comprehensive overview of your store's performance:

**Key Metrics:**
- **Total Revenue**: Total sales for the period
- **Total Orders**: Number of orders received
- **Active Customers**: Number of registered customers
- **Products in Stock**: Total inventory count

**Quick Views:**
- Recent orders with status tracking
- Top-performing products by sales
- Quick action buttons to manage store

### 2. **Products Management** (`/admin/products`)

Complete product inventory management system:

**Features:**
- View all products with SKU, category, price, and stock levels
- Search products by name or SKU
- Real-time stock status indicators:
  - Active: Green (stock available)
  - Low Stock: Amber (< 15 units)
  - Out of Stock: Red (0 units)
- Edit individual products
- Delete products from inventory
- Add new products via the "Add Product" button

**Product Editor** (`/admin/products/[id]`):
- Basic Information: Name, SKU, Category, Description
- Pricing & Inventory: Set prices and manage stock levels
- Product Images: Upload and manage product photos
- Visibility: Control whether product is published/draft/hidden

### 3. **Orders Management** (`/admin/orders`)

Manage customer orders across all regions:

**Features:**
- View all orders with customer details
- Search by Order ID, customer name, or email
- Filter by order status:
  - Pending: Awaiting processing
  - Processing: Being prepared for shipment
  - Shipped: In transit to customer
  - Delivered: Successfully received
  - Cancelled: Order cancelled
- View shipping country for each order
- Quick actions to view order details or print invoice

**International Support:**
- Display customer location/country
- Track orders across multiple shipping zones
- Support for multi-currency pricing

### 4. **Customers Management** (`/admin/customers`)

Customer database and relationship management:

**Features:**
- View all customers with contact information
- Search by name, email, or country
- Customer cards display:
  - Contact details (email, phone)
  - Order history (total orders and spending)
  - Loyalty tier (Bronze/Silver/Gold)
  - Last order date
- Quick actions: Email, Message, Delete
- Tier-based customer segmentation

**Loyalty Tiers:**
- **Bronze**: New customers (1+ orders)
- **Silver**: Regular customers (3+ orders, $500+ spent)
- **Gold**: VIP customers (5+ orders, $1000+ spent)

### 5. **Analytics** (`/admin/analytics`)

Comprehensive business intelligence and performance metrics:

**Key Metrics:**
- Monthly Revenue tracking
- Conversion Rate analysis
- Average Order Value
- Repeat Customer Rate

**Geographic Analysis:**
- **Top Markets by Country**: Revenue and order volume by country
- Growth percentages for each region
- International market performance comparison

**Sales Analysis:**
- **Sales by Category**: Product category performance breakdown
- Revenue contribution by category
- Sales volume and percentage of total

**Trends:**
- Monthly trends with revenue, order count, and new customers
- Average order value calculations
- Historical data for growth analysis

### 6. **Settings & Configuration** (`/admin/settings`)

Manage all international ecommerce operations:

#### **Currencies Tab**
- Manage supported currencies for your store
- Add/remove currencies
- Set exchange rates for currency conversion
- Enable/disable currencies
- Supported currencies: USD, EUR, GBP, CAD, AUD, JPY (expandable)

#### **Shipping Zones Tab**
Configure regional shipping rules:

**Default Shipping Zones:**
1. **North America** (US, Canada, Mexico)
   - Base cost: $9.99
   - Free shipping over: $100
   - Estimated delivery: 3-5 days

2. **Europe** (UK, France, Germany, Spain, Italy)
   - Base cost: €8.99
   - Free shipping over: €75
   - Estimated delivery: 5-7 days

3. **Asia Pacific** (Australia, Japan, Singapore, South Korea)
   - Base cost: $14.99
   - Free shipping over: $150
   - Estimated delivery: 7-10 days

4. **Rest of World** (All other countries)
   - Base cost: $19.99
   - Free shipping over: $200
   - Estimated delivery: 10-15 days

**Customize:**
- Edit existing zones
- Create new shipping zones
- Set base shipping costs
- Configure free shipping thresholds
- Set estimated delivery times

#### **Taxes & Duties Tab**
Regional tax compliance:

**Configured Tax Regions:**
- **United States**: 8.5% Sales Tax
- **Canada**: 13% HST (Harmonized Sales Tax)
- **United Kingdom**: 20% VAT (Value Added Tax)
- **EU**: 19% VAT (varies by country)
- **Australia**: 10% GST (Goods and Services Tax)

**Features:**
- Add/edit tax rates by region
- Support for different tax types (Sales Tax, VAT, GST, HST)
- Enable/disable tax rates
- Automatic tax calculation based on customer location

#### **Payment Methods Tab**
Connected payment processors:

**Supported Payment Methods:**
- **Stripe**: Full currency and region support
- **PayPal**: Multi-currency support
- **Apple Pay**: iOS/Safari support
- **Google Pay**: Android/Chrome support

**Features:**
- View connected payment processors
- Manage payment method settings
- Access payment processor dashboards
- Configure supported currencies per method

## Key Features

### International Operations Support

1. **Multi-Currency**
   - Display prices in customer's local currency
   - Automatic exchange rate conversion
   - Support for 6+ major currencies

2. **Multi-Region**
   - Separate shipping zones with custom rates
   - Region-specific tax calculations
   - Local payment methods

3. **Global Analytics**
   - Track sales by country
   - Monitor regional performance
   - Identify top markets

### Customer Management

1. **Loyalty Program**
   - Three-tier membership system
   - Automatic tier assignment based on spending
   - Tier-based discounts and benefits

2. **Customer Intelligence**
   - Track customer lifetime value
   - Monitor order history
   - Identify repeat customers

### Order Processing

1. **Order Status Tracking**
   - Real-time order status updates
   - Customer visibility into shipment status
   - Estimated delivery times

2. **Order Management**
   - Print invoices
   - View detailed order information
   - Track international orders

## Navigation

**Main Menu (Sidebar):**
- Dashboard
- Products
- Orders
- Customers
- Analytics
- Settings

**Mobile Support:**
- Responsive design for tablet/mobile
- Toggle sidebar with menu button
- Full functionality on all devices

## Best Practices

### Product Management
- Keep SKUs unique and descriptive
- Update stock levels in real-time
- Use consistent category naming
- Add product images for better customer experience

### Order Management
- Process orders within 24 hours
- Update customers on shipment status
- Monitor orders by region
- Track international shipping times

### Customer Service
- Monitor customer loyalty tier
- Engage high-value customers
- Use email/messaging for promotions
- Track customer satisfaction

### International Operations
- Update exchange rates regularly (daily recommended)
- Monitor tax compliance in each region
- Review shipping costs quarterly
- Track regional performance metrics

## Security Notes

- Admin dashboard requires authentication
- Only authenticated users can access
- All changes are logged for audit purposes
- Regular backups are recommended
- Use strong passwords for admin accounts

## API Integration (Coming Soon)

The admin dashboard is designed to integrate with:
- Firebase Firestore for data storage
- Firebase Auth for user management
- Analytics API for metrics
- Payment gateway APIs

## Support

For questions about the admin dashboard:
1. Check the main README.md
2. Review this guide
3. Refer to Firebase documentation
4. Contact your development team

---

**Last Updated**: January 2024  
**Version**: 1.0
