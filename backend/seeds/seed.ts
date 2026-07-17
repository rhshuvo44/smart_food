import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, OrderStatus, PaymentStatus } from '@smartfood/shared';
import { env } from '../src/config/env.js';
import { User } from '../src/models/user.model.js';
import { Restaurant } from '../src/models/restaurant.model.js';
import { MenuItem } from '../src/models/menu-item.model.js';
import { Order } from '../src/models/order.model.js';
import { Payment } from '../src/models/payment.model.js';
import { Delivery } from '../src/models/delivery.model.js';
import { DeliveryZone } from '../src/models/delivery-zone.model.js';
import { UserAddress } from '../src/models/user-address.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Priority: 1) process.env (set by dev:mem or dev-start.ts), 2) .mongodb-uri file in backend root (written by dev-start.ts), 3) .mongodb-uri file in seeds dir, 4) env config default
const ROOT_URI_FILE = path.resolve(__dirname, '..', '.mongodb-uri');
const SEEDS_URI_FILE = path.resolve(__dirname, '.mongodb-uri');

let MONGODB_URI: string;
if (process.env.MONGODB_URI) {
  MONGODB_URI = process.env.MONGODB_URI;
  console.log(`[seed] Using URI from process.env.MONGODB_URI: ${MONGODB_URI}`);
} else {
  try {
    MONGODB_URI = fs.readFileSync(ROOT_URI_FILE, 'utf-8').trim();
    console.log(`[seed] Using URI from backend root .mongodb-uri file: ${MONGODB_URI}`);
  } catch {
    try {
      MONGODB_URI = fs.readFileSync(SEEDS_URI_FILE, 'utf-8').trim();
      console.log(`[seed] Using URI from seeds .mongodb-uri file: ${MONGODB_URI}`);
    } catch {
      MONGODB_URI = env.MONGODB_URI;
      console.log(`[seed] Using URI from env config: ${MONGODB_URI}`);
    }
  }
}

export async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed in production');
    process.exit(1);
  }

  const SEED_PASSWORD = process.env.SEED_PASSWORD || `Seed_${crypto.randomUUID().split('-')[0]}!`;

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Delivery.deleteMany({}),
    DeliveryZone.deleteMany({}),
    UserAddress.deleteMany({}),
  ]);

  console.log('Data cleared. Seeding...');

  // ── Users ──────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const [, ownerUser, ownerUser2, customerUser, , driverUser] = await User.create([
    {
      email: 'admin@smartfood.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    },
    {
      email: 'owner@smartfood.com',
      passwordHash,
      firstName: 'Restaurant',
      lastName: 'Owner',
      role: UserRole.RESTAURANT_OWNER,
      isEmailVerified: true,
    },
    {
      email: 'owner2@smartfood.com',
      passwordHash,
      firstName: 'Second',
      lastName: 'Owner',
      role: UserRole.RESTAURANT_OWNER,
      isEmailVerified: true,
    },
    {
      email: 'customer@smartfood.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    },
    {
      email: 'customer2@smartfood.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
    },
    {
      email: 'driver@smartfood.com',
      passwordHash,
      firstName: 'Delivery',
      lastName: 'Driver',
      role: UserRole.DELIVERY_DRIVER,
      isEmailVerified: true,
    },
  ]);

  console.log(`Users created: ${await User.countDocuments()}`);

  // ── Delivery Zones ──────────────────────────────────────────────
  await DeliveryZone.create([
    {
      name: 'Downtown',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [-73.990, 40.745],
          [-73.980, 40.745],
          [-73.980, 40.755],
          [-73.990, 40.755],
          [-73.990, 40.745],
        ]],
      },
      baseFee: 2.99,
      feePerKm: 0.5,
      estimatedMinutes: 20,
      isActive: true,
    },
    {
      name: 'Suburbs',
      boundary: {
        type: 'Polygon',
        coordinates: [[
          [-74.010, 40.725],
          [-74.000, 40.725],
          [-74.000, 40.735],
          [-74.010, 40.735],
          [-74.010, 40.725],
        ]],
      },
      baseFee: 5.99,
      feePerKm: 0.75,
      estimatedMinutes: 35,
      isActive: true,
    },
  ]);

  console.log(`Delivery zones created: ${await DeliveryZone.countDocuments()}`);

  // ── Restaurants ─────────────────────────────────────────────────
  const [restaurant1, restaurant2] = await Restaurant.create([
    {
      ownerId: ownerUser._id,
      name: 'Pizza Paradise',
      description: 'Authentic Italian pizzas made with fresh ingredients.',
      cuisine: ['Italian', 'Pizza', 'Pasta'],
      address: {
        type: 'Point',
        coordinates: [-73.985, 40.748],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          formatted: '123 Main St, New York, NY 10001',
        },
      },
      phone: '+1-212-555-0101',
      email: 'info@pizzaparadise.com',
      businessHours: [
        { dayOfWeek: 0, openTime: '11:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 1, openTime: '11:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 2, openTime: '11:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 3, openTime: '11:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 4, openTime: '11:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 5, openTime: '11:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 6, openTime: '12:00', closeTime: '21:00', isClosed: false },
      ],
      deliveryRadius: 10,
      deliveryFee: 3.99,
      minimumOrder: 15,
      rating: 4.5,
      isActive: true,
      isApproved: true,
    },
    {
      ownerId: ownerUser2._id,
      name: 'Burger House',
      description: 'Gourmet burgers and craft fries.',
      cuisine: ['American', 'Burgers', 'Fast Food'],
      address: {
        type: 'Point',
        coordinates: [-73.975, 40.758],
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'US',
          formatted: '456 Oak Ave, New York, NY 10002',
        },
      },
      phone: '+1-212-555-0202',
      email: 'hello@burgerhouse.com',
      businessHours: [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 1, openTime: '10:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 2, openTime: '10:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 3, openTime: '10:00', closeTime: '23:00', isClosed: false },
        { dayOfWeek: 4, openTime: '10:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 5, openTime: '10:00', closeTime: '00:00', isClosed: false },
        { dayOfWeek: 6, openTime: '11:00', closeTime: '22:00', isClosed: false },
      ],
      deliveryRadius: 8,
      deliveryFee: 2.99,
      minimumOrder: 12,
      rating: 4.2,
      isActive: true,
      isApproved: true,
    },
  ]);

  console.log(`Restaurants created: ${await Restaurant.countDocuments()}`);

  // ── Menu Items ──────────────────────────────────────────────────
  const [pizza1, , pasta1] = await MenuItem.create([
    {
      restaurantId: restaurant1._id,
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, tomato sauce, basil on a thin crust.',
      price: 1299,
      currency: 'USD',
      category: 'Pizza',
      isAvailable: true,
      preparationTime: 20,
      dietaryTags: ['vegetarian'],
    },
    {
      restaurantId: restaurant1._id,
      name: 'Pepperoni Pizza',
      description: 'Classic pepperoni with melted mozzarella cheese.',
      price: 1499,
      currency: 'USD',
      category: 'Pizza',
      isAvailable: true,
      preparationTime: 20,
      dietaryTags: [],
    },
    {
      restaurantId: restaurant1._id,
      name: 'Spaghetti Carbonara',
      description: 'Creamy egg-based sauce with pancetta and parmesan.',
      price: 1399,
      currency: 'USD',
      category: 'Pasta',
      isAvailable: true,
      preparationTime: 15,
      dietaryTags: [],
    },
    {
      restaurantId: restaurant2._id,
      name: 'Classic Cheeseburger',
      description: 'Angus beef patty with cheddar, lettuce, tomato, and special sauce.',
      price: 1099,
      currency: 'USD',
      category: 'Burgers',
      isAvailable: true,
      preparationTime: 12,
      dietaryTags: [],
    },
    {
      restaurantId: restaurant2._id,
      name: 'Bacon BBQ Burger',
      description: 'Smoked bacon, BBQ sauce, onion rings, and aged cheddar.',
      price: 1399,
      currency: 'USD',
      category: 'Burgers',
      isAvailable: true,
      preparationTime: 15,
      dietaryTags: [],
    },
    {
      restaurantId: restaurant2._id,
      name: 'Truffle Parmesan Fries',
      description: 'Hand-cut fries tossed in truffle oil with parmesan.',
      price: 699,
      currency: 'USD',
      category: 'Sides',
      isAvailable: true,
      preparationTime: 8,
      dietaryTags: ['vegetarian'],
    },
  ]);

  console.log(`Menu items created: ${await MenuItem.countDocuments()}`);

  // ── Orders ──────────────────────────────────────────────────────
  const [order1] = await Order.create([
    {
      customerId: customerUser._id,
      restaurantId: restaurant1._id,
      items: [
        {
          menuItemId: String(pizza1._id),
          name: 'Margherita Pizza',
          quantity: 1,
          unitPrice: 1299,
          totalPrice: 1299,
        },
        {
          menuItemId: String(pasta1._id),
          name: 'Spaghetti Carbonara',
          quantity: 2,
          unitPrice: 1399,
          totalPrice: 2798,
        },
      ],
      subtotal: 4097,
      tax: 328,
      deliveryFee: 399,
      total: 4824,
      status: OrderStatus.DELIVERED,
      deliveryAddress: {
        type: 'Point',
        coordinates: [-73.98, 40.75],
        address: {
          street: '789 Pine St',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'US',
          formatted: '789 Pine St, New York, NY 10003',
        },
      },
      driverId: driverUser._id,
      estimatedDeliveryTime: new Date(Date.now() - 3600000),
      actualDeliveryTime: new Date(Date.now() - 3300000),
    },
  ]);

  console.log(`Orders created: ${await Order.countDocuments()}`);

  // ── Payments ────────────────────────────────────────────────────
  await Payment.create([
    {
      orderId: order1._id,
      customerId: customerUser._id,
      amount: 4824,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      paymentMethod: 'card',
    },
  ]);

  console.log(`Payments created: ${await Payment.countDocuments()}`);

  // ── Deliveries ──────────────────────────────────────────────────
  await Delivery.create([
    {
      orderId: order1._id,
      driverId: driverUser._id,
      driverName: 'Delivery Driver',
      driverPhone: '+1-212-555-0303',
      status: 'delivered',
      estimatedArrival: new Date(Date.now() - 3600000),
      lastUpdated: new Date(Date.now() - 3300000),
      trackingHistory: [
        { status: 'assigned', timestamp: new Date(Date.now() - 7200000) },
        { status: 'picked_up', timestamp: new Date(Date.now() - 6000000) },
        { status: 'in_transit', timestamp: new Date(Date.now() - 5400000) },
        { status: 'delivered', timestamp: new Date(Date.now() - 3300000) },
      ],
    },
  ]);

  console.log(`Deliveries created: ${await Delivery.countDocuments()}`);

  // ── User Addresses ──────────────────────────────────────────────
  await UserAddress.create([
    {
      userId: customerUser._id,
      label: 'Home',
      address: {
        street: '789 Pine St',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        country: 'US',
        formatted: '789 Pine St, New York, NY 10003',
      },
      isDefault: true,
      geoPoint: { type: 'Point', coordinates: [-73.98, 40.75] },
    },
    {
      userId: customerUser._id,
      label: 'Work',
      address: {
        street: '350 Fifth Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10118',
        country: 'US',
        formatted: '350 Fifth Ave, New York, NY 10118',
      },
      isDefault: false,
      geoPoint: { type: 'Point', coordinates: [-73.985, 40.748] },
    },
  ]);

  console.log(`User addresses created: ${await UserAddress.countDocuments()}`);

  console.log('\n✓ Seed complete!');
  console.log(`  Admin login:    admin@smartfood.com / ${SEED_PASSWORD}`);
  console.log(`  Owner login:    owner@smartfood.com / ${SEED_PASSWORD}`);
  console.log(`  Customer login: customer@smartfood.com / ${SEED_PASSWORD}`);
  console.log(`  Driver login:   driver@smartfood.com / ${SEED_PASSWORD}`);

  await mongoose.disconnect();
  process.exit(0);
}

// Run only when executed directly (not when imported programmatically)
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMainModule) {
  seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
