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

const imageSets: Record<string, string[]> = {
  'Burgers': [
    '109400','1639562','2874981','3915906','5175569','5639467','20185767','28272159','109400','1639562',
  ],
  'Pizza': [
    '315755','2619967','19260826','19260786','8487848','315755','2619967','19260826','19260786','8487848',
  ],
  'Pasta': [
    '1279330','2703468','3807044','7626700','8108071','6748831','8963444','9292152','1279330','2703468',
  ],
  'Wraps & Rolls': [
    '461198','13292629','29535635','9624298','5175629','461198','13292629','29535635','9624298','5175629',
  ],
  'Snacks & Starters': [
    '1583884','4109234','8254056','11485199','12946719','16108600','19784555','8862763','1583884','4109234',
  ],
  'Sandwiches': [
    '1600711','1603898','15076691','25819519','12318097','1600711','1603898','15076691','25819519','12318097',
  ],
  'Drinks & Beverages': [
    '109275','3908198','6463664','109275','3908198','6463664','109275','3908198','6463664','109275',
  ],
};

function imageForItem(category: string, index: number): string {
  const images = imageSets[category] || [];
  const photoId = images[index % images.length];
  // Direct Pexels CDN JPEG. Query variants give each menu row a distinct URL
  // while keeping the source image reliable and immediately renderable.
  const crop = index % 3 === 0 ? '1200&h=900' : index % 3 === 1 ? '1100&h=1000' : '1000&h=1200';
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${crop}&fit=crop&q=90`;
}

const allSeedItemNames = Object.values(itemNames).flat();

export async function updateMenuItemImages() {
  const operations = Object.entries(itemNames).flatMap(([category, names]) =>
    names.map((name, index) => ({
      updateMany: {
        filter: { name },
        update: { $set: { imageUrl: imageForItem(category, index) } },
      },
    })),
  );

  if (operations.length > 0) {
    await MenuItem.bulkWrite(operations, { ordered: false });
    console.log(`✓ Updated working Pexels images for ${allSeedItemNames.length} menu items`);
  }
}

export async function seedMenuIfEmpty() {
  const existingItems = await MenuItem.countDocuments();

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
        imageUrl: imageForItem(categoryName, index),
        isAvailable: true,
        isBestseller: index < 2,
        isFeatured: index === 0,
        isSpicy: /spicy|peri|jalapeno|mexican/i.test(name),
        sortOrder: index + 1,
      });
    });
  }

  await MenuItem.insertMany(items);
  console.log(`✓ Auto-seeded ${categories.length} categories and ${items.length} menu items with working Pexels images`);
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
