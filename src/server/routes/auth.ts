import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { success, error } from '../utils/helpers';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: any) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return error(res, 'Name, email, and password are required', 400);
    if (password.length < 6) return error(res, 'Password must be at least 6 characters', 400);

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return error(res, 'Email already registered', 409);

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'customer';

    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword, phone: phone || '', role });
    const token = generateToken(String(user._id), user.role);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return success(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    }, 'Account created successfully', 201);
  } catch (e: any) {
    return error(res, e.message || 'Registration failed', 500);
  }
});

router.post('/login', async (req: AuthRequest, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return error(res, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, 'Invalid credentials', 401);

    const token = generateToken(String(user._id), user.role);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return success(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    }, 'Login successful');
  } catch (e: any) {
    return error(res, e.message || 'Login failed', 500);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return error(res, 'User not found', 404);
    return success(res, { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { name, phone }, { new: true }).select('-password');
    if (!user) return error(res, 'User not found', 404);
    return success(res, { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }, 'Profile updated');
  } catch (e: any) {
    return error(res, e.message, 500);
  }
});

export default router;
