import { Router } from 'express';
import authRoutes from './auth';
import conferenceRoutes from './conferences';
import committeeRoutes from './committees';
import directiveRoutes from './directives';
import updateRoutes from './updates';
import noteRoutes from './notes';
import auditRoutes from './audit';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Auth routes
router.use('/auth', authRoutes);

// Conference routes
router.use('/conferences', conferenceRoutes);

// Committee routes
router.use('/committees', committeeRoutes);

// Directive routes
router.use('/directives', directiveRoutes);

// Crisis Update routes
router.use('/updates', updateRoutes);

// Crisis Note routes
router.use('/notes', noteRoutes);

// Audit routes
router.use('/audit', auditRoutes);

export default router;
