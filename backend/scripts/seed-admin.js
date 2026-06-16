require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL = 'admin@splitgeo.com';
const ADMIN_PASSWORD = 'Admin@SplitGeo2026!';
const ADMIN_NAME = 'Superusuario';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log('Usuario existente actualizado a admin.');
    } else {
      console.log('El superusuario ya existe, no se hizo nada.');
    }
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, passwordHash, role: 'admin' });
  console.log('Superusuario creado exitosamente.');
  console.log('  Email:    admin@splitgeo.com');
  console.log('  Password: Admin@SplitGeo2026!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
