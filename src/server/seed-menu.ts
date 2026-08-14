import 'dotenv/config';
import mongoose from 'mongoose';
import { Category } from './models/Category';
import { MenuItem } from './models/MenuItem';
import { slugify } from './utils/helpers';

const categoryData = [
  ['Burgers', 'Signature burgers and house specials', 'https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Pizza', 'Freshly baked cheesy pizzas', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Pasta', 'Creamy and saucy pasta bowls', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Wraps & Rolls', 'Loaded wraps and rolls', 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Snacks & Starters', 'Crispy sides and starters', 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Sandwiches', 'Toasted sandwiches and melts', 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=900'],
  ['Drinks & Beverages', 'Refreshing drinks and coolers', 'https://images.pexels.com/photos/109275/pexels-photo-109275.jpeg?auto=compress&cs=tinysrgb&w=900'],
] as const;

const itemNames: Record<string, string[]> = {
  'Burgers': ['Classic Nihar Burger','Cheese Burst Burger','Double Cheese Burger','Crispy Chicken Burger','Spicy Chicken Burger','BBQ Smoke Burger','Mushroom Swiss Burger','Jalapeno Crunch Burger','Loaded Bacon Burger','Nihar Special Burger'],
  'Pizza': ['Margherita Pizza','Farmhouse Pizza','Chicken Tikka Pizza','BBQ Chicken Pizza','Peri Peri Chicken Pizza','Cheese Burst Pizza','Mexican Fiesta Pizza','Pepperoni Style Pizza','Paneer Tikka Pizza','Nihar Special Pizza'],
  'Pasta': ['Arrabbiata Pasta','Alfredo Pasta','Pink Sauce Pasta','Creamy Mushroom Pasta','Chicken Alfredo Pasta','Chicken Arrabbiata Pasta','Peri Peri Pasta','Pesto Pasta','Cheesy Baked Pasta','Nihar Special Pasta'],
  'Wraps & Rolls': ['Classic Chicken Wrap','Crispy Chicken Wrap','Peri Peri Chicken Wrap','Chicken Tikka Roll','Malai Chicken Roll','BBQ Chicken Roll','Paneer Tikka Wrap','Cheese Loaded Wrap','Spicy Mexican Wrap','Nihar Special Roll'],
  'Snacks & Starters': ['French Fries','Peri Peri Fries','Cheesy Fries','Chicken Nuggets','Chicken Strips','Chicken Wings','Mozzarella Sticks','Cheese Garlic Bread','Loaded Nachos','Crispy Onion Rings'],
  'Sandwiches': ['Classic Veg Sandwich','Cheese Grill Sandwich','Chicken Club Sandwich','Crispy Chicken Sandwich','Chicken Cheese Melt','BBQ Chicken Sandwich','Paneer Tikka Sandwich','Peri Peri Chicken Melt','Loaded Club Sandwich','Nihar Special Sandwich'],
  'Drinks & Beverages': ['Coke','Pepsi','Sprite','Mango Shake','Oreo Shake','Chocolate Shake','Cold Coffee','Iced Lemon Tea','Virgin Mojito','Blue Lagoon'],
};

const basePrices: Record<string, number> = {
  'Burgers': 179,
  'Pizza': 199,
  'Pasta': 189,
  'Wraps & Rolls': 149,
  'Snacks & Starters': 99,
  'Sandwiches': 129,
  'Drinks & Beverages': 69,
};

/**
 * Generates one deterministic, item-specific food image URL.
 * The prompt is built from the exact menu item/category so items never
 * intentionally fall back to the category's single generic image.
 */
function aiFoodImage(name: string, category: string): string {
  const prompt = [
    `ultra realistic professional food photography of ${name}`,
    `category ${category}`,
    'restaurant menu hero shot',
    'the exact food named in the prompt, appetizing and freshly prepared',
    'hyper realistic natural food textures, realistic ingredients, realistic steam and highlights where appropriate',
    'premium commercial food photography, cinematic soft lighting, shallow depth of field',
    'clean premium restaurant presentation, no people, no hands',
    'no text, no letters, no logo, no branding, no watermark, no packaging labels',
    'photorealistic, extremely detailed, sharp focus, 4K quality',
  ].join(', ');

  const seed = Array.from(name).reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) >>> 0), 2166136261);
  return `https://pollinations.ai/p/${encodeURIComponent(prompt)}?model=flux&width=1536&height=1024&seed=${seed}&nologo=true&enhance=true`;
}

const allSeedItemNames = Object.values(itemNames).flat();

/**
 * Existing installations already have menu rows, so changing the seed data
 * alone would not update their images. This migration updates only imageUrl
 * for the known seeded menu items and leaves prices, orders, availability,
 * reviews, categories, and every other field untouched.
 */
export async function updateMenuItemImages() {
  const operations = allSeedItemNames.map((name) => ({
    updateMany: {
      filter: { name },
      update: { $set: { imageUrl: aiFoodImage(name, Object.entries(itemNames).find(([, names]) => names.includes(name))?.[0] || 'Food') } },
    },
  }));

  if (operations.length > 0) {
    await MenuItem.bulkWrite(operations, { ordered: false });
    console.log(`✓ Updated unique food images for ${allSeedItemNames.length} menu items`);
  }
}

export async function seedMenuIfEmpty() {
  const existingItems = await MenuItem.countDocuments();

  // Existing AL NIHAR installations need their current 70 menu images updated
  // too. Do this before returning, without deleting/recreating menu data.
  if (existingItems > 0) {
    await updateMenuItemImages();
    return;
  }

  const existingCategories = await Category.countDocuments();
  if (existingCategories > 0) {
    await Category.deleteMany({});
  }

  const categories = await Category.insertMany(
    categoryData.map(([name, description, imageUrl], index) => ({
      name,
      slug: slugify(name),
      description,
      imageUrl,
      isActive: true,
      sortOrder: index + 1,
    })),
  );

  const categoryMap = new Map<string, mongoose.Types.ObjectId>(
    categories.map((category) => [category.name, category._id as mongoose.Types.ObjectId]),
  );
  const items: any[] = [];

  for (const [categoryName, names] of Object.entries(itemNames)) {
    const categoryId = categoryMap.get(categoryName);
    names.forEach((name, index) => {
      const price = basePrices[categoryName] + index * (categoryName === 'Drinks & Beverages' ? 15 : 10);
      items.push({
        name,
        description: `${name} prepared fresh at AL NIHAR with quality ingredients and our signature flavours.`,
        price,
        originalPrice: index % 3 === 0 ? price + 30 : null,
        categoryId,
        imageUrl: aiFoodImage(name, categoryName),
        isAvailable: true,
        isBestseller: index < 2,
        isFeatured: index === 0,
        isSpicy: /spicy|peri|jalapeno|mexican/i.test(name),
        sortOrder: index + 1,
      });
    });
  }

  await MenuItem.insertMany(items);
  console.log(`✓ Auto-seeded ${categories.length} categories and ${items.length} menu items with unique food images`);
}

if (process.argv[1]?.endsWith('seed-menu.ts')) {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not set');
  mongoose.connect(mongoUri)
    .then(seedMenuIfEmpty)
    .then(() => mongoose.disconnect())
    .catch((error) => {
      console.error('✗ Menu seed failed:', error?.message || error);
      process.exit(1);
    });
}
