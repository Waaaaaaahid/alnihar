import { Router } from 'express';
import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import { success, error, slugify } from '../utils/helpers';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ CATEGORIES ============
router.get('/categories', async (_req, res: any) => {
  try {
    const cats = await Category.find().sort({ sortOrder: 1, createdAt: 1 });
    return success(res, cats);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.post('/categories', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { name, description, imageUrl, isActive, sortOrder } = req.body;
    if (!name) return error(res, 'Name is required', 400);
    const cat = await Category.create({ name, slug: slugify(name), description: description || '', imageUrl: imageUrl || '', isActive: isActive !== false, sortOrder: sortOrder || 0 });
    return success(res, cat, 'Category created', 201);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/categories/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const updates = { ...req.body };
    if (updates.name) updates.slug = slugify(updates.name);
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!cat) return error(res, 'Category not found', 404);
    return success(res, cat, 'Category updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

router.delete('/categories/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await MenuItem.updateMany({ categoryId: req.params.id }, { categoryId: null });
    return success(res, null, 'Category deleted');
  } catch (e: any) { return error(res, e.message, 500); }
});

// ============ MENU ITEMS ============
router.get('/menu', async (req, res: any) => {
  try {
    const { categoryId, featured, bestseller } = req.query;
    const filter: any = {};
    if (categoryId) filter.categoryId = categoryId;
    if (featured === 'true') filter.isFeatured = true;
    if (bestseller === 'true') filter.isBestseller = true;
    const items = await MenuItem.find(filter).populate('category').sort({ sortOrder: 1, createdAt: 1 });
    return success(res, items);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.get('/menu/:id', async (req, res: any) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('category');
    if (!item) return error(res, 'Item not found', 404);
    return success(res, item);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.post('/menu', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const item = await MenuItem.create(req.body);
    return success(res, item, 'Menu item created', 201);
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/menu/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return error(res, 'Item not found', 404);
    return success(res, item, 'Item updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

router.delete('/menu/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: any) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    return success(res, null, 'Item deleted');
  } catch (e: any) { return error(res, e.message, 500); }
});

export default router;
