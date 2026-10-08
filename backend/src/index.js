import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from './app.js';
import { User } from './models/index.js';

for (const key of ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET is too short. Use a long random string.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');

// Create the first administrator from .env if it does not exist yet.
const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
if (!(await User.exists({ email: adminEmail }))) {
  await User.create({
    name: process.env.ADMIN_NAME || 'Stowly Admin',
    email: adminEmail,
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
    role: 'ADMIN',
    status: 'APPROVED',
  });
  console.log(`Administrator created: ${adminEmail}`);
}

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => console.log(`Stowly API running on http://localhost:${port}`));
