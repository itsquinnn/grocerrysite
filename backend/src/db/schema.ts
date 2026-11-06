import { pgTable, uuid, text, integer, boolean, real, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// =============================================================================
// 1. DELIVERY PARTNERS
// =============================================================================
export const deliveryPartners = pgTable('delivery_partners', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  status: text('status').notNull().default('offline'), // 'online' | 'offline' | 'busy' | 'on_delivery'
  vehicleType: text('vehicle_type').notNull().default('bike'), // 'bike' | 'scooter' | 'bicycle' | 'van'
  vehicleNumber: text('vehicle_number'),
  drivingLicenseNo: text('driving_license_no'),
  isVerified: boolean('is_verified').notNull().default(true),
  rating: real('rating').notNull().default(5.0),
  totalRatingsCount: integer('total_ratings_count').notNull().default(0),
  completedDeliveriesCount: integer('completed_deliveries_count').notNull().default(0),
  cancelledDeliveriesCount: integer('cancelled_deliveries_count').notNull().default(0),
  totalEarnedPaise: integer('total_earned_paise').notNull().default(0),
  currentLatitude: doublePrecision('current_latitude'),
  currentLongitude: doublePrecision('current_longitude'),
  lastLocationUpdatedAt: timestamp('last_location_updated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 2. DELIVERY SHIFTS (Working Hours & Logs)
// =============================================================================
export const deliveryShifts = pgTable('delivery_shifts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  deliveryPartnerId: uuid('delivery_partner_id').notNull().references(() => deliveryPartners.id, { onDelete: 'cascade' }),
  clockInAt: timestamp('clock_in_at', { withTimezone: true }).notNull().defaultNow(),
  clockOutAt: timestamp('clock_out_at', { withTimezone: true }),
  totalMinutes: integer('total_minutes').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'completed'
  deliveriesCompleted: integer('deliveries_completed').notNull().default(0),
  earningsPaise: integer('earnings_paise').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 3. DELIVERY REVIEWS & RATINGS (User Feedback for Delivery Partners)
// =============================================================================
export const deliveryReviews = pgTable('delivery_reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  deliveryPartnerId: uuid('delivery_partner_id').notNull().references(() => deliveryPartners.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1 to 5
  reviewText: text('review_text'),
  deliverySpeedRating: integer('delivery_speed_rating'), // 1 to 5
  communicationRating: integer('communication_rating'), // 1 to 5
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 4. DELIVERY ASSIGNMENTS (Admin Order Assignment & Status Lifecycle)
// =============================================================================
export const deliveryAssignments = pgTable('delivery_assignments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid('order_id').notNull(),
  deliveryPartnerId: uuid('delivery_partner_id').notNull().references(() => deliveryPartners.id, { onDelete: 'cascade' }),
  assignedByAdminId: uuid('assigned_by_admin_id'),
  status: text('status').notNull().default('assigned'), // 'assigned' | 'accepted' | 'declined' | 'arrived_store' | 'picked_up' | 'in_transit' | 'delivered'
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  declinedAt: timestamp('declined_at', { withTimezone: true }),
  pickedUpAt: timestamp('picked_up_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  deliveryNotes: text('delivery_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 5. ACCOUNTS & SELLER ONBOARDING (Chunk 1)
// =============================================================================
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  username: text('username').unique(),
  passwordHash: text('password_hash'),
  provider: text('provider').notNull().default('email'),
  providerId: text('provider_id'),
  name: text('name'),
  phone: text('phone'),
  gender: text('gender'),
  profileImage: text('profile_image'),
  role: text('role').notNull().default('customer'), // 'customer' | 'seller' | 'admin' | 'delivery_man'
  sellerStatus: text('seller_status').notNull().default('none'), // 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'
  storeName: text('store_name'),
  sellerPhone: text('seller_phone'),
  sellerDescription: text('seller_description'),
  sellerApprovedAt: timestamp('seller_approved_at', { withTimezone: true }),
  referralCode: text('referral_code').unique(),
  status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'deactivated'
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// 6. PRODUCTS & MARKETPLACE SELLER LISTINGS (Chunk 1)
// =============================================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid('seller_id').references(() => accounts.id, { onDelete: 'set null' }),
  productCode: text('product_code'),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  price: integer('price').notNull(), // NPR in paisa or whole rupees as per catalog
  originalPrice: integer('original_price'),
  unit: text('unit').default('1 Piece'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  categoryId: uuid('category_id'),
  subcategory: text('subcategory'),
  imageUrl: text('image_url'),
  images: text('images').array(),
  approvalStatus: text('approval_status').notNull().default('listed'), // 'listed' | 'pending' | 'rejected'
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  pickupAddress: text('pickup_address'),
  pickupPhone: text('pickup_phone'),
  pickupTime: text('pickup_time'),
  isActive: boolean('is_active').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
