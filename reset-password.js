const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const email = 'sales@raregreet.com';
const newPassword = 'Raregreet@2026';

const p = new PrismaClient();

bcrypt.hash(newPassword, 10)
  .then((hash) => p.business.update({ where: { email }, data: { passwordHash: hash } }))
  .then(() => {
    console.log('Password updated for', email);
    return p.$disconnect();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });