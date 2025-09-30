// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => new PrismaClient();

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = global.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}
