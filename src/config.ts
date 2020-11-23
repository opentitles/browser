import dotenv from 'dotenv';

export const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  dotenv.config();
}

export const {
  RABBITMQ_URL,
  MONGO_URL,
  MONGO_DB_PROD,
  MONGO_DB_TEST,
  DEFAULT_USER_AGENT,
  REAL_USER_AGENT,
  DEFAULT_TIMEOUT,
  DEFAULT_COOLDOWN
} = process.env;