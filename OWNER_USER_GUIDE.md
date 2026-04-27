# DistroPro Owner User Guide

## 📱 Welcome to DistroPro

DistroPro is a smart distribution and agency management platform designed to help you efficiently manage your B2B distribution business. This guide will walk you through all features available to agency owners.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Product Management](#product-management)
4. [Inventory Management](#inventory-management)
5. [Order Management](#order-management)
6. [Staff Management](#staff-management)
7. [Business Reports & Analytics](#business-reports--analytics)
8. [Settings & Customization](#settings--customization)
9. [Notifications & Alerts](#notifications--alerts)
10. [Best Practices for Efficiency](#best-practices-for-efficiency)

---

## Getting Started

### Login & First Steps

1. **Open DistroPro** on your browser or mobile device
2. **Sign in** with your owner email and password
3. **You'll see** the Owner Dashboard with 4 main sections
4. **Accept notifications** when prompted to receive real-time updates

### Dashboard Tour (5 minutes)

The dashboard gives you a 360° view of your business:

- **Key Metrics**: Total sales, pending orders, low stock items, active customers
- **Quick Actions**: Create products, add staff, approve orders, view reports
- **Recent Activity**: Latest orders, updates, and system alerts
- **Sales Graph**: Visual representation of sales trends

---

## Dashboard Overview

### What You See

The Owner Dashboard provides real-time insights:

```
📊 Your Agency Dashboard
├── 💰 Total Sales (This Month)
├── 📦 Pending Orders (Awaiting Approval)
├── ⚠️ Low Stock Items (Requiring Attention)
├── 👥 Active Customers
├── 📈 Top 5 Products (Best Sellers)
└── 📅 Sales Trend (Last 30 Days)
```

### Key Sections

| Section | Purpose | Action |
|---------|---------|--------|
| **Pending Orders** | Orders waiting for your approval | Click to review and approve/reject |
| **Stock Alerts** | Products below minimum stock | Click to view & replenish inventory |
| **Recent Orders** | Last 10 orders placed | Click for details |
| **Team Activity** | Staff actions and updates | Monitor staff efficiency |
| **Quick Stats** | Revenue, customers, products | Track business health |

---

## Product Management

### Adding New Products

**Why**: Customers can only buy products you've added to your catalog.

**Steps**:

1. Navigate to **Products** section
2. Click **"+ Add Product"** button
3. Fill in product details:
   - **Product Name**: e.g., "Fresh Milk - 1L"
   - **Category**: e.g., "Dairy", "FMCG", "Beverages"
   - **SKU** (Stock Keeping Unit): e.g., "MILK-1L-001"
   - **Description**: What customers need to know
   - **Price** (in ₹): Set selling price
   - **Unit Type**: BOX, CRATE, PACKET, PIECE, DOZEN, KG, LITRE
   - **Quantity per Unit**: e.g., if DOZEN → 12 pieces
4. **Upload Images**: Add 1-4 product photos (e.g., product angle, packaging)
   - Images are compressed automatically
   - Recommended: Clear, well-lit product photos
5. Click **"Save Product"**

### Editing Products

1. Go to **Products** → Find the product
2. Click **"Edit"** icon
3. Modify any details (except SKU)
4. Click **"Save Changes"**

**Note**: You cannot edit SKU once created (helps with inventory tracking)

### Featured Products

**Why**: Highlight bestsellers or promotional items

**To Feature a Product**:

1. Go to **Products**
2. Click the **⭐ Star** icon on the product
3. Featured products appear at the top of customer's catalog
4. Click again to remove from featured

### Managing Categories

As an owner, you can organize products into categories:

1. Go to **Settings** → **Categories**
2. View all your categories
3. Categories help customers browse efficiently

---

## Inventory Management

### Real-Time Stock Tracking

**Why**: Never miss a sale due to stockouts. Know exactly what's available.

### Stock Status Overview

Navigate to **Inventory** to see:

- **Total Stock**: Total units available
- **Reserved Stock**: Units in pending orders (awaiting approval)
- **Available Stock**: Ready to sell (Total - Reserved)
- **Low Stock Threshold**: Alert level you set

```
Example:
Product: Fresh Milk
├─ Total Stock: 100 units
├─ Reserved: 20 units (in pending orders)
├─ Available: 80 units (ready to sell)
└─ Threshold: 30 units
```

### Updating Stock Levels

**When You Receive New Stock**:

1. Go to **Inventory**
2. Find the product
3. Click **"Update Stock"**
4. Enter new quantity
5. System automatically adjusts available stock
6. Click **"Save"**

### Low Stock Alerts

**How Alerts Work**:

- You set a **minimum threshold** for each product (e.g., 30 units)
- When stock falls below this → **Red warning** appears
- You receive **push notifications** on your phone
- A summary shows in your **Dashboard**

**To Set Thresholds**:

1. Go to **Inventory**
2. Click product → **"Edit Threshold"**
3. Set minimum level (e.g., 30 units)
4. Save
5. **System will alert you** when approaching this level

### Reserved Stock Concept

**What is Reserved Stock?**

When a customer places an order but it's awaiting your approval:
- Units are "reserved" (not available for other customers)
- Shown separately so you know real available stock
- When you **approve** → Reserved becomes "Sold"
- When you **reject** → Reserved becomes available again

**Example Workflow**:
```
Product: Fresh Yogurt (100 units)
Customer A orders 20 units → Reserved: 20, Available: 80
Customer B orders 15 units → Reserved: 35, Available: 65
↓ You approve A's order
Customer A's 20 reserved → marked as SOLD
New Reserved: 15, Available: 85
```

---

## Order Management

### Approval Workflow

This is your **core responsibility** as owner. Every order needs your approval or rejection.

### Order Lifecycle

```
Customer Places Order
    ↓
PENDING_APPROVAL (⏳ You Review)
    ├─ ✅ APPROVED (Moves to Staff Processing)
    └─ ❌ REJECTED (Cancelled, Stock Freed Up)
         ↓
    PROCESSING (Staff prepares)
         ↓
    DISPATCHED (Out for delivery)
         ↓
    DELIVERED (Customer received)
         ↓
    [COMPLETED]
```

### Reviewing & Approving Orders

**New orders appear in**:
1. **Dashboard** → "Pending Orders" section
2. **Orders** → "Pending Approval" tab

**To Review an Order**:

1. Click on the order
2. See:
   - **Customer Details**: Name, phone, address
   - **Ordered Items**: Products, quantities, prices
   - **Total Amount**: Including delivery date preference
3. **Choose**:
   - ✅ **"Approve Order"** → Move to processing
   - ❌ **"Reject Order"** → Provide rejection reason (e.g., "Out of stock", "Cannot deliver")
4. **Confirmation message** and order status updates

### Why Reject an Order?

- ⚠️ **Out of stock** (New customer order, but existing customer priority)
- 📍 **Cannot deliver** (Address outside service area)
- 🎯 **Suspicious order** (Unusual pattern, payment issues)
- 🔄 **Duplicate order** (Customer placed twice by mistake)

**Customer receives email notification** of approval/rejection.

### Bulk Order Management

If you have multiple pending orders:

1. Go to **Orders** → **"Pending Approval"** tab
2. Use **Filters**:
   - By customer name
   - By date range
   - By amount
3. **Search** specific orders
4. Review and approve quickly

### Order Details & Tracking

Click any order to see:

- 📋 **Order ID**: Unique reference
- 👤 **Customer Info**: Contact details
- 📦 **Items**: What they ordered
- 💵 **Payment Status**: Pending, received, etc.
- 📍 **Delivery Address**: Where order goes
- 📅 **Timeline**: When ordered, approved, dispatched, delivered
- ✍️ **Notes**: Any special instructions

---

## Staff Management

### Adding Staff Members

**Why**: Delegate order processing, inventory updates, and customer support.

**To Add a Staff Member**:

1. Go to **Settings** → **Team Management**
2. Click **"+ Add Staff Member"**
3. Enter:
   - **Full Name**
   - **Email Address** (they'll use to login)
   - **Phone Number**
4. System generates a **temporary password**
5. Share email & password with staff member
6. They can **change password** on first login

### Staff Roles & Permissions

**Your staff members can**:
- ✅ View pending orders
- ✅ Update order status (Processing → Dispatched → Delivered)
- ✅ Manage inventory (add/update stock)
- ✅ View low stock alerts
- ✅ Process payments & receipts

**Staff CANNOT**:
- ❌ Approve/reject orders (Owner only)
- ❌ Create new products (Owner only)
- ❌ Add new staff members (Owner only)
- ❌ Access financial reports (Owner only)

### Managing Staff

1. Go to **Settings** → **Team Management**
2. See all staff members
3. **Actions available**:
   - 👁️ **View Details**: See their activity
   - 🔑 **Reset Password**: If they forget
   - ❌ **Remove**: Deactivate their account

---

## Business Reports & Analytics

### Why Reports Matter

**Data = Decisions**. Use reports to:
- Identify top-selling products
- Understand customer buying patterns
- Monitor revenue trends
- Plan inventory better
- Make data-driven business decisions

### Available Reports

#### 1. Sales Summary Report

**What It Shows**: Total revenue for a date range

**Access**: Reports → **Sales Summary**

**Steps**:
1. Select **"From Date"** and **"To Date"**
2. Click **"Generate Report"**
3. See:
   - 💰 Total revenue
   - 📦 Total orders processed
   - 📊 Average order value
   - 📈 Daily/weekly/monthly breakdown

**Use Case**: "How much did I sell last month?" / "Month-on-month growth?"

#### 2. Top Products Report

**What It Shows**: Your best-selling products

**Access**: Reports → **Top Products**

**Steps**:
1. Select date range
2. Click **"Generate"**
3. See top 10 products by:
   - Quantity sold
   - Revenue generated
   - Profit margin

**Use Case**: "Which products should I stock more?" / "What's my revenue driver?"

#### 3. Low Stock Report

**What It Shows**: Products below minimum threshold

**Access**: Reports → **Low Stock Items**

**Instant view of**:
- Product name
- Current stock
- Threshold level
- Last updated
- Action button to update stock

**Use Case**: "What should I reorder today?" / "Avoid stockouts"

#### 4. Pending Orders Report

**What It Shows**: All orders waiting for approval

**Access**: Reports → **Pending Orders**

**Quick overview of**:
- Number of pending orders
- Total amount pending
- Average approval time
- By customer / by date

**Use Case**: "How many orders are waiting?" / "Which customers are most active?"

#### 5. Customer Frequency Report

**What It Shows**: How often customers buy

**Access**: Reports → **Customer Frequency**

**Insights**:
- Most frequent customers (repeat buyers)
- One-time customers
- Inactive customers (dormant accounts)
- Lifetime value per customer

**Use Case**: "Who are my loyal customers?" / "Focus retention on repeat buyers"

#### 6. Dashboard View

**Quick Stats** without detailed reports:

- 📊 Revenue this month
- 📦 Orders this month
- 👥 New customers
- ⚠️ Stock alerts
- 🔄 Repeat customer rate

---

## Settings & Customization

### Agency Settings

Customize how your agency appears to customers.

**Access**: Settings → **Agency Profile**

### Branding Your Store

1. **Company Logo**: Upload your agency's logo
   - Shows in staff/customer portals
   - Should be clear, recognizable
   - Recommended size: 200×200px
   - Accepted formats: PNG, JPG

2. **Company Name**: Your official business name
   - Appears in invoices
   - Shown to customers
   - Used in communications

3. **Contact Information**:
   - Phone number
   - Email
   - Business address
   - Website (if any)

4. **Delivery Information**:
   - Delivery zones (areas you serve)
   - Delivery charges
   - Estimated delivery time
   - Special instructions

### Payment Settings

**Configure how customers pay**:

1. Go to **Settings** → **Payment Options**
2. Enable payment methods:
   - ✅ Cash on Delivery
   - ✅ Bank Transfer
   - ✅ UPI / Digital Wallets
3. Add account details for each method
4. Customers will see these options during checkout

### Notification Preferences

**Control alerts you receive**:

1. **Order Notifications**: New orders, approvals needed
2. **Stock Alerts**: When stock falls below threshold
3. **Payment Notifications**: Payment received, failed
4. **System Alerts**: Important updates, issues

Toggle on/off based on preference.

---

## Notifications & Alerts

### Real-Time Alerts

DistroPro keeps you informed automatically:

### Types of Notifications

| Alert | When | Action |
|-------|------|--------|
| **New Order** | Customer places order | Review & approve |
| **Low Stock** | Stock below threshold | Reorder products |
| **Order Dispatched** | Staff marks order shipped | Inform customer |
| **Payment Received** | Customer uploads receipt | Verify & confirm |
| **System Alert** | Important issue | Check immediately |

### Push Notifications

**Enable on Mobile**:

1. Allow notifications when prompted
2. Go to **Settings** → **Notifications** → **Enable Push**
3. Receive instant alerts even when app is closed
4. Never miss an important order

### Managing Notifications

1. Go to **Notifications** tab (bell icon)
2. See all recent alerts
3. Click to mark as read
4. Go to settings to customize which alerts you want

---

## Best Practices for Efficiency

### Daily Workflow

**Morning (8-9 AM)**:
1. ✅ Open Dashboard
2. 📋 Review pending orders (from last 12 hours)
3. ⚠️ Check low stock alerts
4. ✅ Approve/reject orders
5. 📞 Brief your staff

**Throughout Day**:
6. 🔔 Monitor notifications
7. ✅ Approve new orders as they come
8. 📦 Check inventory updates from staff

**End of Day (5-6 PM)**:
9. 📊 Review today's orders processed
10. 📈 Quick look at sales
11. 🔜 Plan tomorrow's actions

### Order Approval Tips

- ⏱️ **Approve ASAP**: Faster approval = faster delivery = happy customers
- 🎯 **Spot Check**: Review 10% of orders for fraud patterns
- 💬 **Add Notes**: If rejecting, be specific (helps customer improve)
- 📊 **Set Goals**: Try to approve 95%+ of orders (high approval rate = good reputation)

### Inventory Management Tips

- 🗓️ **Weekly Stock Check**: Review low-stock report every week
- 📈 **Forecast Demand**: Use top products report to plan orders
- 🔄 **Reorder Early**: Don't wait for zero stock alert
- 🎯 **Set Smart Thresholds**: Not too high (capital tied up), not too low (stockouts)

### Business Growth Tips

- 👥 **Analyze Customers**: Use frequency report to identify VIPs
- 📊 **Study Trends**: Which products are growing? Double down
- 🎁 **Incentivize Repeat Buyers**: Offer loyalty on top customers
- ⏱️ **Track KPIs**: 
  - Approval rate (target: 95%+)
  - Average order value
  - Repeat customer %
  - Inventory turnover

### Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **Customers complaining about delays** | Approve orders faster (within 1 hour) |
| **Frequent stockouts** | Increase low-stock threshold or increase reorder quantity |
| **Too many rejections** | Plan better, maintain higher inventory levels |
| **Staff errors in inventory** | Train staff on proper stock updates, check logs |
| **Lost sales** | Check if products are featured, analyze competitor pricing |

---

## Customer Support Features

### Communication Tools

**Built into DistroPro**:

1. **Order Messages**: Add notes to orders
2. **Notifications**: Automated order status updates
3. **Invoice PDF**: Send professional invoices to customers
4. **Email Notifications**: System sends on your behalf

### Handling Issues

**Customer says order is late?**
1. Check order timeline in system
2. See expected vs actual delivery date
3. Contact staff/courier if needed
4. Update status in system
5. Notify customer of resolution

**Customer says items are missing?**
1. Check what was ordered vs what was supposed to be delivered
2. View staff notes from packing
3. Offer replacement or refund
4. Update order notes with resolution

---

## Troubleshooting

### Common Questions

**Q: Why can't I see a customer's order?**
- A: You can only see orders for your agency. Customer might belong to different agency.

**Q: Order shows "Available" but customer can't see it?**
- A: Product must be "Active" and "Featured" or in customer's category filters.

**Q: Staff says inventory won't update?**
- A: Check internet connection. Refresh page. Contact support if issue persists.

**Q: Why did I reject an order but stock wasn't freed?**
- A: Stock is freed automatically. Refresh page to see updated inventory.

---

## Need Help?

📞 **Contact Developer**: Ganesh Kute
- 📱 Phone: [8830065088](tel:8830065088)
- 📧 Email: [ganeshyuvraj18@gmail.com](mailto:ganeshyuvraj18@gmail.com)

---

## Summary

As an owner, your key responsibilities are:

1. ✅ **Set Up Business**: Add products, categories, teams
2. ✅ **Approve Orders**: Daily approval of customer orders
3. ✅ **Monitor Inventory**: Keep stock levels healthy
4. ✅ **Manage Staff**: Add and oversee team members
5. ✅ **Analyze Data**: Use reports to make business decisions
6. ✅ **Optimize**: Improve order approval rate, reduce stockouts, grow revenue

DistroPro handles the complexity. You focus on growing your business. 🚀

---

**Version**: 1.0 | **Last Updated**: April 2026
