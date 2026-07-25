import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import logger from './utils/logger';
import { errorHandler, ApiError } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';
import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import itemRoutes from './routes/itemRoutes';
import customerRoutes from './routes/customerRoutes';
import billRoutes from './routes/billRoutes';
import reportRoutes from './routes/reportRoutes';
import storeRoutes from './routes/storeRoutes';

const app = express();

// Load Swagger Specs
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger/swagger.yaml'));

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compress all responses
app.use(compression());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// HTTP request logger streamed to Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan(morganFormat, { stream: morganStream }));

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new ApiError('Too many requests, please try again later.', 429));
  },
});
app.use('/api/', limiter);

// 1. PUBLIC ENDPOINTS (Health Check & Swagger Documentation)
app.get('/api/health', (req: Request, res: Response) => {
  sendSuccess(res, 'Server is healthy', {
    uptime: process.uptime(),
    timestamp: new Date(),
    env: process.env.NODE_ENV,
    swaggerDocs: '/api-docs',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 2. FEATURE ROUTERS
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/items', itemRoutes);
app.use('/api', reportRoutes);

// Fallback for 404 - Route Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(`Route ${req.originalUrl} not found`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
