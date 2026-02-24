import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import userAuthRoutes from './routes/auth/userAuth.js';
import adminAuthRoutes from './routes/auth/adminAuth.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.DOMAIN,
].filter(Boolean);

// CORS configuration:
// - development: allow all origins
// - production/other: restrict to configured domains
app.use(
  cors(
    NODE_ENV === 'development'
      ? {
          origin: true, // reflect request origin (allows all)
          credentials: true,
        }
      : {
          origin: allowedOrigins.length > 0 ? allowedOrigins : 'http://localhost:3000',
          credentials: true,
        }
  )
);

// Simple API request logger (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      console.log(`[API] ${method} ${originalUrl} ${status} - ${duration}ms`);
    });
    next();
  });
}

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth/user', userAuthRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
