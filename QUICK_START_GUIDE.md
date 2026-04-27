# DistroPro Quick Testing Guide for Owners

## 📋 Overview (5 Minutes to Understand)

DistroPro has **3 different account types**. You'll test each one to see how they work.

---

## 🧑‍💼 What Each Role Does

### 1️⃣ OWNER Account (Your Main Account)

**You Do This**:
- ✅ Create products (what customers can buy)
- ✅ Set prices
- ✅ Approve/Reject orders
- ✅ Manage staff
- ✅ View analytics & reports
- ✅ Handle inventory

**Key Screens**:
- Dashboard (sales overview)
- Products (add/edit)
- Orders (pending approval)
- Inventory (stock levels)
- Staff (team management)
- Reports (sales data)

**Time to Approve Order**: Should take <2 minutes per order

---

### 2️⃣ STAFF Account (Your Workers)

**Staff Do This**:
- 📦 Process approved orders (pack items)
- 📮 Update order status (processing → dispatched → delivered)
- 📊 Update inventory (when stock changes)
- 💰 Record payments
- ❌ **Cannot**: Approve orders, create products, manage staff

**Key Tasks**:
1. Check "Orders to Process" dashboard
2. Pack the items
3. Mark "Processing" in app
4. Move to dispatch area
5. Mark "Dispatched" when sent
6. Mark "Delivered" when customer receives

**Daily Workflow**: Process 10-20 orders, update inventory, verify payments

---

### 3️⃣ CUSTOMER Account (Your Buyers)

**Customers Do This**:
- 🛍️ Browse products
- 🛒 Add to cart
- 📦 Place orders
- 📍 Choose delivery date & address
- 💳 Pay (cash/transfer/digital)
- 📱 Track order status

**Key Screens**:
- Catalog (products)
- Cart (items before order)
- Checkout (place order)
- My Orders (track status)
- Notifications (order updates)

---

## 🔄 Complete Order Flow (What You'll See)

```
CUSTOMER Places Order
    ↓
You (OWNER) See: "Pending Approval" ← ACTION NEEDED
    ├─ ✅ Approve It
    │     ↓
    │  STAFF Sees: "Orders to Process"
    │     ↓
    │  Staff Updates: Processing → Dispatched → Delivered
    │     ↓
    │  CUSTOMER Sees: Order status changes in real-time
    │     ↓
    │  REVENUE RECORDED ✅
    │
    └─ ❌ Reject It
          ↓
       CUSTOMER Sees: "Order Rejected - Reason: [...]"
       ↓
       Order Ends (No further steps)
```

---

## 📝 What to Test in Each Account

### Owner Account - Test This

1. **Products**:
   - [ ] Create a product (milk, bread, etc.)
   - [ ] Add price & images
   - [ ] Make it "Featured"
   - [ ] Edit the product

2. **Orders**:
   - [ ] See pending orders
   - [ ] Click to view details
   - [ ] Approve an order
   - [ ] Reject an order (provide reason)

3. **Inventory**:
   - [ ] View stock levels
   - [ ] See how stock changes after approval

4. **Staff**:
   - [ ] Add a staff member
   - [ ] See their activity

5. **Dashboard**:
   - [ ] Check metrics (total sales, pending orders, etc.)
   - [ ] See order timeline

---

### Staff Account - Test This

1. **Dashboard**:
   - [ ] See "Orders to Process"
   - [ ] See inventory alerts

2. **Order Processing**:
   - [ ] Click order to pack
   - [ ] Mark "Processing"
   - [ ] Update to "Dispatched"
   - [ ] Update to "Delivered"

3. **Inventory**:
   - [ ] Update stock levels
   - [ ] See reserved vs available stock
   - [ ] Check low-stock alerts

4. **Payments**:
   - [ ] See payment status
   - [ ] Verify payment receipt (if available)

---

### Customer Account - Test This

1. **Browsing**:
   - [ ] See all products
   - [ ] Search for a product
   - [ ] Click to see details

2. **Shopping**:
   - [ ] Add product to cart
   - [ ] Change quantity
   - [ ] Remove item

3. **Ordering**:
   - [ ] Proceed to checkout
   - [ ] Choose delivery date
   - [ ] Confirm address
   - [ ] Choose payment method
   - [ ] Place order ✅

4. **Tracking**:
   - [ ] See order in "My Orders"
   - [ ] Watch status change:
     - PENDING (waiting for owner approval)
     - APPROVED (owner said yes)
     - PROCESSING (staff packing)
     - DISPATCHED (on its way)
     - DELIVERED (customer has it)

5. **Notifications**:
   - [ ] See alerts as order status changes

---

## 🔐 Account Credentials (Example)

| Role | Email | Password | Login URL |
|------|-------|----------|-----------|
| **Owner** | owner@distro.com | Password@123 | (login page) |
| **Staff** | staff@distro.com | Password@123 | (login page) |
| **Customer** | customer@distro.com | Password@123 | (login page) |

---

## 🎯 Key Things to Understand

### ⏱️ Order Approval Process
- Customer orders → You (owner) get notification
- You have <1 hour to approve/reject
- If approved: Stock is "reserved" (locked for this order)
- If rejected: Stock becomes available again
- **Your action speed = Customer happiness**

### 📦 Inventory Concept
```
Total Stock: 100 units
Reserved (in orders): -20 units
Available (can sell): 80 units
Low Threshold: 30 units
Status: ✅ Healthy (80 > 30)
```

### 💰 Payment Methods
- **Cash on Delivery**: Customer pays driver
- **Bank Transfer**: Customer sends money first
- **Digital**: UPI/Google Pay (instant)

### 🚀 Order Lifecycle Speed
```
Typical Flow:
├─ Customer orders: 10:00 AM
├─ You approve: 10:05 AM ✅
├─ Staff packs: 10:30 AM ✅
├─ Dispatched: 2:00 PM ✅
├─ Delivered: 4:30 PM ✅
└─ Total time: 6.5 hours
```

---

## 📱 Dashboard Highlights

### Owner Dashboard Shows
- Total sales this month
- Pending orders (awaiting your approval)
- Low stock items (need reorder)
- Recent orders
- Top selling products

### Staff Dashboard Shows
- Orders to process
- Inventory alerts
- Payment queue
- Today's completed orders

### Customer Dashboard Shows
- My orders (all orders ever placed)
- Order status
- Repeat quick order button
- Notifications

---

## ⚠️ Important Rules

### Owner Can Do
- ✅ Approve/Reject orders
- ✅ Create products
- ✅ Add staff
- ✅ View reports

### Owner CANNOT Do
- ❌ Process orders (staff does this)
- ❌ Pack items (staff does this)

### Staff Can Do
- ✅ Process orders
- ✅ Update inventory
- ✅ Verify payments

### Staff CANNOT Do
- ❌ Approve orders (only owner)
- ❌ Create products (only owner)

### Customer Can Do
- ✅ Browse & order
- ✅ Track delivery
- ✅ Pay

### Customer CANNOT Do
- ❌ See other customer's orders
- ❌ Modify orders after placing

---

## 🔄 Suggested Testing Sequence

### 5-Minute Quick Test

1. **Login as Owner**
   - Go to Products
   - Create 1 test product
   - Set price ₹100

2. **Login as Customer**
   - Find that product
   - Add to cart
   - Place order

3. **Go back to Owner**
   - Check "Pending Approval"
   - You'll see the order
   - Approve it ✅

4. **Login as Staff**
   - Check "Orders to Process"
   - See the order
   - Mark Processing → Dispatched → Delivered

5. **Login as Customer**
   - Check "My Orders"
   - Watch status change LIVE
   - Order is now DELIVERED ✅

**Total Time**: 5 minutes to understand the entire flow!

---

## 🧪 What You'll Learn

After testing all 3 accounts, you'll understand:

✅ How customers buy products
✅ How you approve orders
✅ How staff processes them
✅ How inventory works
✅ How order status updates
✅ What each role sees on their dashboard
✅ The complete order-to-delivery workflow

---

## 🚀 Next Steps

1. **First**: Test the flow above (5 minutes)
2. **Then**: Invite real staff member to use Staff account
3. **Finally**: Invite real customers to use platform

---

## 📞 Quick Help

**Stuck?** 
- Check notifications (bell icon)
- Look at order details
- Try another account to see different perspective

**Need Support?**
- 📱 Phone: [8830065088](tel:8830065088)
- 📧 Email: [ganeshyuvraj18@gmail.com](mailto:ganeshyuvraj18@gmail.com)

---

## ✅ You're Ready!

That's all you need to know to test DistroPro. 

**Start with a simple order from customer → owner approval → staff delivery and you'll understand everything!**

Happy testing! 🎉

---

**Quick Reference**: Save this page. Show it to your staff. Share with your customers.

**Version**: 1.0 | **Date**: April 2026
