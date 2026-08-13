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

export async function seedMenuIfEmpty() {
  const existingItems = await MenuItem.countDocuments();
  if (existingItems > 0) {
    return;
  }

  // Only seed when the menu is empty. Existing menu/order data is never reset on startup.
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

  const categoryMap = new Map(categories.map((category) => [category.name, category._id]));
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
        imageUrl: categoryData.find((c) => c[0] === categoryName)?.[2] || '',
        isAvailable: true,
        isBestseller: index < 2,
        isFeatured: index === 0,
        isSpicy: /spicy|peri|jalapeno|mexican/i.test(name),
        sortOrder: index + 1,
      });
    });
  }

  await MenuItem.insertMany(items);
  console.log(`✓ Auto-seeded ${categories.length} categories and ${items.length} menu items`);
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
