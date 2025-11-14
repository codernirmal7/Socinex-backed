// src/features/conversions/conversion.routes.ts
import { Router } from 'express';
import { ConversionController } from './conversion.controller';
import { requestConversionValidator, conversionIdValidator } from './conversion.validator';
import { validate } from '../../middleware/validation.middleware';
import { protect } from '../../middleware/auth.middleware';

const router = Router();
const c = new ConversionController();

router.get('/rate', c.getRate);
router.use(protect);
router.post('/request', requestConversionValidator, validate, c.requestConversion);
router.get('/history', c.getConversionHistory);
router.get('/:id', conversionIdValidator, validate, c.getConversionById);

export default router;
