import type { Profile as ProfileRow } from '@prisma/client';
import { decrypt, decryptJson, encrypt, encryptJson } from '@/lib/crypto/aes';
import { prisma } from '@/lib/db/prisma';
import type { BirthDate } from '@/lib/numerology/types';

export interface ProfileInput {
  fullName: string;
  dob: BirthDate;
  timezone: string;
  locale: 'id' | 'en';
}

export interface DecryptedProfile {
  id: string;
  userId: string;
  fullName: string;
  dob: BirthDate;
  timezone: string;
  locale: 'id' | 'en';
  createdAt: Date;
  updatedAt: Date;
}

export async function createProfile(userId: string, input: ProfileInput): Promise<DecryptedProfile> {
  const row = await prisma.profile.create({
    data: {
      userId,
      nameEncrypted: encrypt(input.fullName),
      dobEncrypted: encryptJson(input.dob),
      timezone: input.timezone,
      locale: input.locale,
    },
  });
  return decryptRow(row);
}

export async function getProfileByUserId(userId: string): Promise<DecryptedProfile | null> {
  const row = await prisma.profile.findUnique({ where: { userId } });
  return row ? decryptRow(row) : null;
}

function decryptRow(row: ProfileRow): DecryptedProfile {
  const locale = row.locale === 'en' ? 'en' : 'id';
  return {
    id: row.id,
    userId: row.userId,
    fullName: decrypt(row.nameEncrypted),
    dob: decryptJson<BirthDate>(row.dobEncrypted),
    timezone: row.timezone,
    locale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
