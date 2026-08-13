import 'dotenv/config';
import mongoose from 'mongoose';
import { Category } from './models/Category';
import { MenuItem } from './models/MenuItem';
import { Coupon } from './models/Coupon';
import { Review } from './models/Review';
import { RestaurantSettings } from './models/RestaurantSettings';
import { User } from './models/User';
import bcrypt from 'bcryptjs';
import { slugify } from './utils/helpers';

const CATEGORIES = [
  { name: 'Burgers', description: 'Classic premium beef burgers', imageUrl: 'https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 1 },
  { name: 'Smashed Burgers', description: 'Thin crispy smashed patties', imageUrl: 'https://images.pexels.com/photos/8880746/pexels-photo-8880746.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 2 },
  { name: 'Chicken Burgers', description: 'Crispy fried chicken burgers', imageUrl: 'https://images.pexels.com/photos/11354487/pexels-photo-11354487.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 3 },
  { name: 'Buff Burgers', description: 'Premium buffalo meat burgers', imageUrl: 'https://images.pexels.com/photos/14133038/pexels-photo-14133038.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 4 },
  { name: 'Double Patty Burgers', description: 'Stacked double patty monsters', imageUrl: 'https://images.pexels.com/photos/12325274/pexels-photo-12325274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 5 },
  { name: 'Loaded Fries', description: 'Fries loaded with cheese and toppings', imageUrl: 'https://images.pexels.com/photos/20535803/pexels-photo-20535803.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 6 },
  { name: 'Classic Fries', description: 'Golden crispy fries', imageUrl: 'https://images.pexels.com/photos/8272619/pexels-photo-8272619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 7 },
  { name: 'Dips', description: 'Signature sauces and dips', imageUrl: 'https://images.pexels.com/photos/29908848/pexels-photo-29908848.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 8 },
  { name: 'Shakes', description: 'Thick creamy milkshakes', imageUrl: 'https://images.pexels.com/photos/18142621/pexels-photo-18142621.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 9 },
  { name: 'Cold Coffee', description: 'Refreshing iced coffee', imageUrl: 'https://images.pexels.com/photos/4869290/pexels-photo-4869290.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 10 },
  { name: 'Mojitos', description: 'Fresh mint mojitos', imageUrl: 'https://images.pexels.com/photos/4051265/pexels-photo-4051265.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 11 },
  { name: 'Beverages', description: 'Soft drinks and sodas', imageUrl: 'https://images.pexels.com/photos/4113632/pexels-photo-4113632.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', sortOrder: 12 },
];

const MENU_ITEMS = [
  // Burgers
  { name: 'Classic Nihar Burger', description: 'Juicy beef patty, melted cheddar, fresh lettuce, tomato, pickles, and our signature house sauce on a toasted brioche bun.', price: 220, originalPrice: 280, categoryName: 'Burgers', imageUrl: 'https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 1 },
  { name: 'Big Nihar Special', description: 'Double-layered beef patty with extra cheese, caramelized onions, smoked bacon, and bold Nihar special sauce.', price: 320, originalPrice: 380, categoryName: 'Burgers', imageUrl: 'https://images.pexels.com/photos/18713424/pexels-photo-18713424.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 2 },
  { name: 'Cheese Bomb Burger', description: 'Loaded with triple cheese blend — cheddar, mozzarella, and pepper jack — on a classic beef patty.', price: 260, originalPrice: null, categoryName: 'Burgers', imageUrl: 'https://images.pexels.com/photos/19247575/pexels-photo-19247575.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Bacon Deluxe', description: 'Smoky bacon strips, beef patty, sharp cheddar, crisp lettuce, and bourbon-glazed onions.', price: 290, originalPrice: 340, categoryName: 'Burgers', imageUrl: 'https://images.pexels.com/photos/28902882/pexels-photo-28902882.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: true, isSpicy: false, sortOrder: 4 },
  { name: 'Spicy Inferno Burger', description: 'Fiery ghost pepper sauce, jalapeños, pepper jack cheese, and a bold beef patty for the brave.', price: 240, originalPrice: null, categoryName: 'Burgers', imageUrl: 'https://images.pexels.com/photos/11022623/pexels-photo-11022623.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: true, sortOrder: 5 },
  // Smashed
  { name: 'Classic Smashed', description: 'Thin crispy-edged smashed patty with American cheese, pickles, and house sauce. Old-school style.', price: 200, originalPrice: 250, categoryName: 'Smashed Burgers', imageUrl: 'https://images.pexels.com/photos/29250659/pexels-photo-29250659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Double Smashed Cheese', description: 'Two smashed patties, double cheese, grilled onions, and tangy sauce stacked tall.', price: 280, originalPrice: 330, categoryName: 'Smashed Burgers', imageUrl: 'https://images.pexels.com/photos/15146667/pexels-photo-15146667.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Smashed Patty Melt', description: 'Smashed patty with caramelized onions and melted Swiss on toasted buttery bread.', price: 250, originalPrice: null, categoryName: 'Smashed Burgers', imageUrl: 'https://images.pexels.com/photos/38026242/pexels-photo-38026242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  // Chicken
  { name: 'Crispy Chicken Classic', description: 'Buttermilk-fried chicken fillet, fresh lettuce, pickles, and creamy mayo on a soft bun.', price: 230, originalPrice: 280, categoryName: 'Chicken Burgers', imageUrl: 'https://images.pexels.com/photos/11354487/pexels-photo-11354487.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Spicy Chicken Crunch', description: 'Crispy chicken with ghost pepper glaze, jalapeños, and cooling ranch slaw.', price: 250, originalPrice: null, categoryName: 'Chicken Burgers', imageUrl: 'https://images.pexels.com/photos/12664796/pexels-photo-12664796.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: true, sortOrder: 2 },
  { name: 'Grilled Chicken Deluxe', description: 'Grilled marinated chicken breast, avocado, lettuce, tomato, and chipotle mayo.', price: 270, originalPrice: 320, categoryName: 'Chicken Burgers', imageUrl: 'https://images.pexels.com/photos/10935114/pexels-photo-10935114.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Chicken Cheese Bomb', description: 'Crispy chicken patty loaded with molten cheese sauce and crunchy onions.', price: 240, originalPrice: null, categoryName: 'Chicken Burgers', imageUrl: 'https://images.pexels.com/photos/11299738/pexels-photo-11299738.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Buff
  { name: 'Buff Classic', description: 'Premium buffalo meat patty with cheddar, lettuce, tomato, and signature sauce.', price: 280, originalPrice: null, categoryName: 'Buff Burgers', imageUrl: 'https://images.pexels.com/photos/14133038/pexels-photo-14133038.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Buff Peppercorn', description: 'Buffalo patty with cracked black pepper, caramelized onions, and creamy peppercorn sauce.', price: 320, originalPrice: 380, categoryName: 'Buff Burgers', imageUrl: 'https://images.pexels.com/photos/10895168/pexels-photo-10895168.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Buff Smokehouse', description: 'Smoky buffalo patty, bacon jam, gouda cheese, and crispy onion strings.', price: 350, originalPrice: null, categoryName: 'Buff Burgers', imageUrl: 'https://images.pexels.com/photos/8029532/pexels-photo-8029532.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 3 },
  // Double Patty
  { name: 'Monster Double', description: 'Two beef patties, double cheese, bacon, lettuce, and Nihar special sauce. Big and bold.', price: 380, originalPrice: 450, categoryName: 'Double Patty Burgers', imageUrl: 'https://images.pexels.com/photos/12325274/pexels-photo-12325274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Double Cheese Deluxe', description: 'Two patties, four cheese blend, grilled onions, and garlic aioli.', price: 360, originalPrice: null, categoryName: 'Double Patty Burgers', imageUrl: 'https://images.pexels.com/photos/10761390/pexels-photo-10761390.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Triple Threat', description: 'Three smashed patties, triple cheese, and smoky bacon. Not for the faint of heart.', price: 420, originalPrice: 500, categoryName: 'Double Patty Burgers', imageUrl: 'https://images.pexels.com/photos/10922925/pexels-photo-10922925.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Bacon Double King', description: 'Double bacon, double patty, double cheese, and bourbon BBQ glaze.', price: 400, originalPrice: null, categoryName: 'Double Patty Burgers', imageUrl: 'https://images.pexels.com/photos/15010309/pexels-photo-15010309.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Loaded Fries
  { name: 'Cheese Loaded Fries', description: 'Crispy fries smothered in molten cheese sauce, herbs, and parmesan.', price: 180, originalPrice: 220, categoryName: 'Loaded Fries', imageUrl: 'https://images.pexels.com/photos/20535803/pexels-photo-20535803.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Bacon Cheese Fries', description: 'Fries loaded with cheese, crispy bacon bits, and spring onions.', price: 220, originalPrice: null, categoryName: 'Loaded Fries', imageUrl: 'https://images.pexels.com/photos/20535802/pexels-photo-20535802.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Chilli Cheese Fries', description: 'Spicy chilli con carne over fries, topped with cheddar and jalapeños.', price: 240, originalPrice: null, categoryName: 'Loaded Fries', imageUrl: 'https://images.pexels.com/photos/21823086/pexels-photo-21823086.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: true, sortOrder: 3 },
  { name: 'Overloaded Fries', description: 'Cheese, bacon, jalapeños, sour cream, and house sauce. The works.', price: 260, originalPrice: 300, categoryName: 'Loaded Fries', imageUrl: 'https://images.pexels.com/photos/17429244/pexels-photo-17429244.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Classic Fries
  { name: 'Regular Fries', description: 'Golden crispy fries lightly salted. The perfect side.', price: 90, originalPrice: null, categoryName: 'Classic Fries', imageUrl: 'https://images.pexels.com/photos/8272619/pexels-photo-8272619.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 1 },
  { name: 'Peri Peri Fries', description: 'Crispy fries tossed in our bold peri peri seasoning.', price: 110, originalPrice: null, categoryName: 'Classic Fries', imageUrl: 'https://images.pexels.com/photos/19297802/pexels-photo-19297802.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: true, sortOrder: 2 },
  { name: 'Cheesy Fries', description: 'Classic fries topped with melted cheddar and herbs.', price: 130, originalPrice: null, categoryName: 'Classic Fries', imageUrl: 'https://images.pexels.com/photos/14512778/pexels-photo-14512778.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  // Dips
  { name: 'Nihar Special Sauce', description: 'Our signature house sauce. Creamy, tangy, and addictive.', price: 30, originalPrice: null, categoryName: 'Dips', imageUrl: 'https://images.pexels.com/photos/29908848/pexels-photo-29908848.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 1 },
  { name: 'Spicy Chipotle Dip', description: 'Smoky chipotle mayo with a kick of heat.', price: 40, originalPrice: null, categoryName: 'Dips', imageUrl: 'https://images.pexels.com/photos/1435901/pexels-photo-1435901.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: true, sortOrder: 2 },
  { name: 'Garlic Aioli', description: 'Creamy roasted garlic aioli dip.', price: 35, originalPrice: null, categoryName: 'Dips', imageUrl: 'https://images.pexels.com/photos/1435901/pexels-photo-1435901.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Cheese Sauce Dip', description: 'Rich molten cheese sauce for fries and burgers.', price: 50, originalPrice: null, categoryName: 'Dips', imageUrl: 'https://images.pexels.com/photos/18530635/pexels-photo-18530635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Shakes
  { name: 'Classic Chocolate Shake', description: 'Thick chocolate milkshake topped with whipped cream and chocolate drizzle.', price: 160, originalPrice: null, categoryName: 'Shakes', imageUrl: 'https://images.pexels.com/photos/18142621/pexels-photo-18142621.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Strawberry Cream Shake', description: 'Fresh strawberry milkshake with cream and cookie crumble.', price: 170, originalPrice: null, categoryName: 'Shakes', imageUrl: 'https://images.pexels.com/photos/13252531/pexels-photo-13252531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Oreo Cookie Shake', description: 'Crushed Oreo blended into a thick vanilla shake with whipped cream.', price: 180, originalPrice: 220, categoryName: 'Shakes', imageUrl: 'https://images.pexels.com/photos/20066464/pexels-photo-20066464.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Vanilla Bean Shake', description: 'Classic vanilla bean milkshake, rich and creamy.', price: 150, originalPrice: null, categoryName: 'Shakes', imageUrl: 'https://images.pexels.com/photos/2559025/pexels-photo-2559025.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Cold Coffee
  { name: 'Classic Cold Coffee', description: 'Chilled coffee blended with milk and ice cream. Smooth and rich.', price: 120, originalPrice: null, categoryName: 'Cold Coffee', imageUrl: 'https://images.pexels.com/photos/4869290/pexels-photo-4869290.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: true, isSpicy: false, sortOrder: 1 },
  { name: 'Hazelnut Cold Coffee', description: 'Cold coffee with rich hazelnut flavor and whipped cream topping.', price: 140, originalPrice: null, categoryName: 'Cold Coffee', imageUrl: 'https://images.pexels.com/photos/4728009/pexels-photo-4728009.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Mocha Cold Coffee', description: 'Espresso blended with chocolate, milk, and ice. Perfect blend.', price: 150, originalPrice: null, categoryName: 'Cold Coffee', imageUrl: 'https://images.pexels.com/photos/18142624/pexels-photo-18142624.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Caramel Cold Coffee', description: 'Cold coffee with caramel syrup and a drizzle of caramel on top.', price: 140, originalPrice: null, categoryName: 'Cold Coffee', imageUrl: 'https://images.pexels.com/photos/4869289/pexels-photo-4869289.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Mojitos
  { name: 'Classic Lime Mojito', description: 'Fresh lime, mint leaves, soda, and ice. Refreshing and zesty.', price: 90, originalPrice: null, categoryName: 'Mojitos', imageUrl: 'https://images.pexels.com/photos/4051265/pexels-photo-4051265.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: true, isFeatured: false, isSpicy: false, sortOrder: 1 },
  { name: 'Watermelon Mojito', description: 'Fresh watermelon chunks with mint, lime, and soda.', price: 110, originalPrice: null, categoryName: 'Mojitos', imageUrl: 'https://images.pexels.com/photos/30591641/pexels-photo-30591641.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: true, isSpicy: false, sortOrder: 2 },
  { name: 'Berry Mojito', description: 'Mixed berries with mint, lime, and sparkling soda.', price: 110, originalPrice: null, categoryName: 'Mojitos', imageUrl: 'https://images.pexels.com/photos/4051220/pexels-photo-4051220.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Mint Cooler', description: 'Extra mint and lime with a splash of ginger ale.', price: 100, originalPrice: null, categoryName: 'Mojitos', imageUrl: 'https://images.pexels.com/photos/7259054/pexels-photo-7259054.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
  // Beverages
  { name: 'Coca Cola', description: 'Chilled 330ml Coca Cola can.', price: 60, originalPrice: null, categoryName: 'Beverages', imageUrl: 'https://images.pexels.com/photos/4113632/pexels-photo-4113632.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 1 },
  { name: 'Sprite', description: 'Chilled 330ml Sprite can.', price: 60, originalPrice: null, categoryName: 'Beverages', imageUrl: 'https://images.pexels.com/photos/11969600/pexels-photo-11969600.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 2 },
  { name: 'Cold Coffee Can', description: 'Ready-to-drink cold coffee can.', price: 80, originalPrice: null, categoryName: 'Beverages', imageUrl: 'https://images.pexels.com/photos/4389662/pexels-photo-4389662.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 3 },
  { name: 'Sparkling Water', description: 'Chilled sparkling water with lime.', price: 70, originalPrice: null, categoryName: 'Beverages', imageUrl: 'https://images.pexels.com/photos/34947111/pexels-photo-34947111.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', isBestseller: false, isFeatured: false, isSpicy: false, sortOrder: 4 },
];

const COUPONS = [
  { code: 'NIHAR10', description: '10% off your order', discountType: 'percentage', discountValue: 10, minOrder: 200, maxDiscount: 100, isActive: true, expiresAt: new Date(Date.now() + 365 * 86400000), usageLimit: 1000, usedCount: 0 },
  { code: 'WELCOME50', description: 'Rs 50 off on orders above 300', discountType: 'fixed', discountValue: 50, minOrder: 300, maxDiscount: null, isActive: true, expiresAt: new Date(Date.now() + 365 * 86400000), usageLimit: 500, usedCount: 0 },
  { code: 'FEAST20', description: '20% off on orders above 500', discountType: 'percentage', discountValue: 20, minOrder: 500, maxDiscount: 150, isActive: true, expiresAt: new Date(Date.now() + 180 * 86400000), usageLimit: 200, usedCount: 0 },
];

const REVIEWS = [
  { name: 'Arjun Mehta', rating: 5, comment: 'Best burger in Mumbai, hands down. The Big Nihar Special is a beast — juicy, cheesy, and the sauce is unreal.', isApproved: true },
  { name: 'Priya Sharma', rating: 5, comment: 'The smashed burgers are crispy perfection. Paired with cheese loaded fries and a chocolate shake. Heavenly.', isApproved: true },
  { name: 'Rohan Verma', rating: 4, comment: 'Great food and quick delivery. The Monster Double is massive — could barely finish it. Will order again.', isApproved: true },
  { name: 'Sneha Kapoor', rating: 5, comment: 'AL Nihar has the best chicken burger in the city. The crispy chicken classic is so crunchy and fresh.', isApproved: true },
  { name: 'Karan Singh', rating: 5, comment: 'Buff Smokehouse burger is a game changer. Smoky, juicy, and the bacon jam is incredible. 10/10.', isApproved: true },
  { name: 'Ananya Gupta', rating: 4, comment: 'Love the loaded fries and mojitos. Perfect combo for a weekend treat. Delivery is always on time.', isApproved: true },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) { console.error('MONGO_URI not set'); process.exit(1); }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('Connected!\n');

  // Create admin user if none exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@alnihar.com', password: hashed, phone: '+91 98765 43210', role: 'admin' });
    console.log('✓ Created admin user: admin@alnihar.com / admin123');
  } else {
    console.log('• Admin user already exists');
  }

  // Seed categories
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    for (const c of CATEGORIES) {
      await Category.create({ ...c, slug: slugify(c.name), isActive: true });
    }
    console.log(`✓ Seeded ${CATEGORIES.length} categories`);
  } else {
    console.log(`• Categories already exist (${catCount})`);
  }

  // Seed menu items
  const itemCount = await MenuItem.countDocuments();
  if (itemCount === 0) {
    for (const item of MENU_ITEMS) {
      const cat = await Category.findOne({ name: item.categoryName });
      await MenuItem.create({
        name: item.name,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        categoryId: cat?._id || null,
        imageUrl: item.imageUrl,
        isAvailable: true,
        isBestseller: item.isBestseller,
        isFeatured: item.isFeatured,
        isSpicy: item.isSpicy,
        sortOrder: item.sortOrder,
      });
    }
    console.log(`✓ Seeded ${MENU_ITEMS.length} menu items`);
  } else {
    console.log(`• Menu items already exist (${itemCount})`);
  }

  // Seed coupons
  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    await Coupon.insertMany(COUPONS);
    console.log(`✓ Seeded ${COUPONS.length} coupons`);
  } else {
    console.log(`• Coupons already exist (${couponCount})`);
  }

  // Seed reviews
  const reviewCount = await Review.countDocuments();
  if (reviewCount === 0) {
    await Review.insertMany(REVIEWS);
    console.log(`✓ Seeded ${REVIEWS.length} reviews`);
  } else {
    console.log(`• Reviews already exist (${reviewCount})`);
  }

  // Seed settings
  const settings = await RestaurantSettings.findOne();
  if (!settings) {
    await RestaurantSettings.create({
      heroImageUrl: 'https://images.pexels.com/photos/18987002/pexels-photo-18987002.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      storyImageUrl: 'https://images.pexels.com/photos/5779781/pexels-photo-5779781.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    });
    console.log('✓ Seeded restaurant settings');
  } else {
    console.log('• Restaurant settings already exist');
  }

  console.log('\n✅ Seed complete!');
  console.log('Admin login: admin@alnihar.com / admin123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((e) => { console.error('Seed failed:', e); process.exit(1); });
