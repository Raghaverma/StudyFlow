// Habit model using Prisma Client
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = prisma.habit; 