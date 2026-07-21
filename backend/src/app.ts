import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import { errorHandler, ApiError } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';
import authRoutes from './routes/authRoutes';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: '*', // Customize this for production
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new ApiError('Too many requests, please try again later.', 429));
  },
});
app.use('/api/', limiter);

// Register API Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  sendSuccess(res, 'Server is healthy', {
    uptime: process.uptime(),
    timestamp: new Date(),
    env: process.env.NODE_ENV,
  });
});

// Fallback for 404 - Route Not Found
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(`Route ${req.originalUrl} not found`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
