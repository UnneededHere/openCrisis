import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

export default router;
