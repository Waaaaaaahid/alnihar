import { Router } from 'express';
import { TableBooking } from '../models/TableBooking';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import { success, error } from '../utils/helpers';

const router = Router();

function bookingNumber() { return `ALN-T${Date.now().toString().slice(-8)}`; }
function validPhone(v: unknown) { return typeof v === 'string' && /^[0-9+()\-\s]{7,20}$/.test(v.trim()); }
function validDate(v: unknown) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime()); }
function validTime(v: unknown) { return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v); }

router.post('/', authMiddleware, async (req: AuthRequest, res: any) => {
  try {
    const { customerName, customerPhone, customerEmail, date, time, guests, notes } = req.body;
    if (typeof customerName !== 'string' || !customerName.trim() || customerName.trim().length > 100) return error(res, 'Invalid name', 400);
    if (!validPhone(customerPhone)) return error(res, 'Invalid phone number', 400);
    if (customerEmail && (typeof customerEmail !== 'string' || customerEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))) return error(res, 'Invalid email address', 400);
    if (!validDate(date) || !validTime(time)) return error(res, 'Invalid date or time', 400);
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) return error(res, 'Guests must be between 1 and 20', 400);
    if (notes && (typeof notes !== 'string' || notes.length > 500)) return error(res, 'Invalid notes', 400);

    const existing = await TableBooking.countDocuments({ date, time, status: { $in: ['pending', 'confirmed', 'seated'] } });
    if (existing >= 20) return error(res, 'That time slot is currently full. Please choose another time.', 409);

    const booking = await TableBooking.create({
      bookingNumber: bookingNumber(),
      customerName: customerName.trim(), customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || '', date, time, guests: guestCount,
      notes: notes?.trim() || '', userId: req.userId,
    });
    return success(res, booking, 'Table booking request received', 201);
  } catch (e: any) { return error(res, e.message || 'Failed to create booking', 500); }
});

router.get('/mine', authMiddleware, async (req: AuthRequest, res: any) => {
  try { return success(res, await TableBooking.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100)); }
  catch (e: any) { return error(res, e.message, 500); }
});

router.get('/', authMiddleware, adminMiddleware, async (_req, res: any) => {
  try { return success(res, await TableBooking.find().sort({ date: 1, time: 1, createdAt: -1 }).limit(500)); }
  catch (e: any) { return error(res, e.message, 500); }
});

router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res: any) => {
  try {
    const valid = ['pending', 'confirmed', 'seated', 'completed', 'cancelled'];
    if (!valid.includes(req.body.status)) return error(res, 'Invalid booking status', 400);
    const booking = await TableBooking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!booking) return error(res, 'Booking not found', 404);
    return success(res, booking, 'Booking status updated');
  } catch (e: any) { return error(res, e.message, 500); }
});

router.put('/:id/table', authMiddleware, adminMiddleware, async (req, res: any) => {
  try {
    const tableNumber = typeof req.body.tableNumber === 'string' ? req.body.tableNumber.trim().slice(0, 30) : '';
    const booking = await TableBooking.findByIdAndUpdate(req.params.id, { tableNumber }, { new: true });
    if (!booking) return error(res, 'Booking not found', 404);
    return success(res, booking, 'Table assigned');
  } catch (e: any) { return error(res, e.message, 500); }
});

export default router;
