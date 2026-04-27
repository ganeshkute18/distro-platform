# QA Testing Checklist - Distro Platform

## Phase 1: Authentication & Sessions (48h)

### Login Flow
- [ ] Owner can login with valid credentials
- [ ] Staff can login with valid credentials
- [ ] Customer can login with valid credentials
- [ ] Invalid credentials show error
- [ ] Session persists after reload (48h validity)
- [ ] Logout clears session
- [ ] Auto-redirect to dashboard on valid session
- [ ] Dev account quick-fill works

### Customer Signup
- [ ] Signup page accessible
- [ ] All fields (name, email, password, phone, address) validated
- [ ] No email verification required
- [ ] Customer can login after signup
- [ ] Session set for 48h

## Phase 2: Navigation & Layout

### Owner Shell
- [ ] Sidebar navigation visible
- [ ] Mobile: bottom navigation appears
- [ ] All menu items accessible
- [ ] Notification bell icon present and clickable
- [ ] Logout works

### Staff Shell
- [ ] Sidebar/mobile nav present
- [ ] Order and inventory sections accessible
- [ ] Notification bell present
- [ ] Mobile responsive

### Customer Shell  
- [ ] Bottom navigation visible on mobile
- [ ] Catalog, Cart, Orders links work
- [ ] Profile accessible
- [ ] Notification bell present

## Phase 3: Product Management

### Browse Catalog (Customer)
- [ ] All products display with images
- [ ] Base64 images render correctly
- [ ] Search/filter works
- [ ] Add to cart functional
- [ ] Min/max order qty enforced
- [ ] Mobile: responsive grid

### Product Management (Owner)
- [ ] Create product form appears
- [ ] File picker works for product images
- [ ] Image compression works (< 200KB)
- [ ] Base64 stored in imageUrls
- [ ] Product list displays
- [ ] Edit product works
- [ ] Delete product works
- [ ] Mobile: forms responsive

## Phase 4: Order Management

### Customer: Place Order
- [ ] Add items to cart
- [ ] Quantity controls work
- [ ] Order summary shows correct totals
- [ ] Delivery date picker works (responsive)
- [ ] Delivery address field optional
- [ ] Notes field works
- [ ] Payment method toggle (COD/QR)
- [ ] QR payment: receipt upload works
- [ ] Receipt image compressed and shows preview
- [ ] Place order validates fields
- [ ] Order confirmation shown
- [ ] Mobile: all fields accessible

### Owner: Approve Orders
- [ ] Pending orders list shows
- [ ] Can approve orders
- [ ] Can reject orders with reason
- [ ] Rejection notification sent to customer (push + in-app)
- [ ] Order status updates

### Owner/Staff: Order Processing
- [ ] Order detail view accessible
- [ ] Can update status (PROCESSING → DISPATCHED → DELIVERED)
- [ ] Status history displays
- [ ] Invoice downloadable (PDF)
- [ ] QR receipt displays correctly
- [ ] Notifications trigger on each status change

## Phase 5: Notifications

### Push Notifications (Web Push)
- [ ] Service worker registration successful
- [ ] Push permission request shown
- [ ] Subscriptions saved to DB
- [ ] Order created → owner gets push
- [ ] Order approved → staff gets push
- [ ] Order dispatched → customer gets push
- [ ] Payment made → owner + customer get push
- [ ] Low stock alert → owner gets push
- [ ] Failed subscriptions cleaned up automatically
- [ ] Retry logic works for failed deliveries

### In-App Notifications
- [ ] Notification bell shows unread count
- [ ] Bell dropdown displays notifications
- [ ] Notifications paginated (20 per page)
- [ ] Can mark as read individually
- [ ] Can mark all as read
- [ ] Unread filter works
- [ ] Real-time updates via WebSocket

### Notification Types
- [ ] ORDER_PLACED: Owner receives
- [ ] ORDER_APPROVED: Staff receives
- [ ] ORDER_REJECTED: Customer receives
- [ ] ORDER_DISPATCHED: Customer receives
- [ ] ORDER_DELIVERED: Customer receives
- [ ] PAYMENT_RECEIVED: Owner receives
- [ ] PAYMENT_CONFIRMED: Customer receives
- [ ] LOW_STOCK: Owner receives

## Phase 6: Category Management (Owner)

### CRUD Operations
- [ ] List all categories
- [ ] Create new category
- [ ] Edit category name
- [ ] Delete category (with confirmation)
- [ ] List refreshes after changes
- [ ] Mobile: forms accessible

## Phase 7: Reports & Analytics (Owner)

### Sales Tab
- [ ] Date picker for range selection
- [ ] Clear dates button works
- [ ] Total revenue displays
- [ ] Orders delivered count shows
- [ ] Avg order value calculated
- [ ] Daily breakdown chart renders
- [ ] Mobile: responsive chart

### Top Products Tab
- [ ] Products ranked by sales
- [ ] Revenue and quantity shown
- [ ] Date filters work
- [ ] Mobile: table scrollable

### Low Stock Tab
- [ ] Products below threshold shown
- [ ] Quantities display
- [ ] Updates reflect new inventory

### Pending Orders Tab
- [ ] Pending orders listed
- [ ] Click to view details
- [ ] Pagination works

## Phase 8: Settings & Profile

### Owner: Company Settings
- [ ] Logo upload with file picker
- [ ] Image compressed (< 200KB)
- [ ] QR code upload works
- [ ] QR displays in checkout
- [ ] UPI ID field works
- [ ] All settings save

### Owner: Profile
- [ ] Name editable
- [ ] Email display
- [ ] Phone editable
- [ ] Profile photo upload (file picker)

### Staff: Profile
- [ ] Name, phone editable
- [ ] Photo upload works
- [ ] Changes persist

### Customer: Profile
- [ ] All fields (name, email, phone, address) editable
- [ ] Photo upload works
- [ ] Mobile: form responsive

## Phase 9: Mobile Responsiveness

### General Layout
- [ ] All pages render without horizontal scroll
- [ ] Touch targets 44px+ minimum
- [ ] Text readable without zoom
- [ ] Images scale correctly
- [ ] Bottom nav sticky on mobile

### Date Picker (Mobile)
- [ ] Calendar pops up correctly
- [ ] Month navigation works
- [ ] Day selection responsive
- [ ] Clear button accessible
- [ ] Closes after selection

### Forms (Mobile)
- [ ] Input fields full width
- [ ] Labels clear
- [ ] Error messages visible
- [ ] Buttons easily tappable
- [ ] File pickers work

### Images (Mobile)
- [ ] Product images load
- [ ] QR codes visible
- [ ] Receipt previews fit screen
- [ ] Logo displays correctly

## Phase 10: Payment Integration

### COD (Cash on Delivery)
- [ ] Order places with COD
- [ ] Payment status: PENDING
- [ ] Can be marked paid later

### QR Payment
- [ ] QR code displays
- [ ] Receipt upload required
- [ ] File compression works
- [ ] Payment proof shows in order
- [ ] Payment event triggers
- [ ] Notifications sent (payment.made)
- [ ] Order updates to PAID

## Phase 11: Permission & Access Control

### Owner Routes
- [ ] /owner/* routes accessible
- [ ] Non-owners redirected
- [ ] Cannot access staff/customer routes

### Staff Routes
- [ ] /staff/* routes accessible
- [ ] Non-staff redirected
- [ ] Can view assigned orders only
- [ ] Cannot access owner/customer routes

### Customer Routes
- [ ] /customer/profile accessible
- [ ] /catalog accessible
- [ ] /cart accessible
- [ ] /orders shows only own orders
- [ ] Cannot access owner/staff routes

## Phase 12: Email & Agencies

### Agencies (if applicable)
- [ ] Agency creation works
- [ ] Logo upload for agencies
- [ ] Products linked to agencies
- [ ] Agency filter in catalog

## Phase 13: Data Validation

### Forms
- [ ] Required fields enforced
- [ ] Email format validated
- [ ] Numeric fields reject non-numbers
- [ ] Min/max validations work
- [ ] File size limits enforced (<200KB images)

### Orders
- [ ] Stock validation before order
- [ ] Min/max order qty checked
- [ ] Price calculation correct (unit + tax)
- [ ] Delivery date cannot be past

## Phase 14: Performance

- [ ] Pages load in < 3s
- [ ] Images optimized (Base64 < 200KB)
- [ ] Pagination works (no lazy load lag)
- [ ] Notifications load smoothly
- [ ] Charts render without lag

## Phase 15: Error Handling

- [ ] Network errors shown to user
- [ ] Invalid tokens redirect to login
- [ ] 404s show proper message
- [ ] 500s show error boundary
- [ ] Toast notifications appear for actions
- [ ] Push subscription failures don't crash app

## Test Accounts

```
Owner:
Email: owner@distro.com
Password: Password@123

Staff:
Email: staff@distro.com
Password: Password@123

Customer:
Email: customer@distro.com
Password: Password@123
```

## Test Data Needed

- [ ] Sample products with images
- [ ] Sample categories
- [ ] QR code image for payment
- [ ] Orders in various states
- [ ] Low stock products

## Browser & Device Testing

### Desktop
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

### Mobile
- [ ] iPhone 12+ (iOS 15+)
- [ ] Samsung Android (11+)
- [ ] Responsive design mode (DevTools)

## Sign-off

- [ ] All critical paths tested
- [ ] No regression issues
- [ ] Mobile experience acceptable
- [ ] Notifications functional
- [ ] Ready for production

---

**Last Updated:** 2026-04-27
**Status:** Ready for QA
