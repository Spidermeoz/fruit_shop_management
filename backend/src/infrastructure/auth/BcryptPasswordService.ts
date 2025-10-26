// src/infrastructure/auth/BcryptPasswordService.ts
import bcrypt from "bcryptjs";
import type { PasswordService } from "../../application/auth/services/PasswordService";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

export class BcryptPasswordService implements PasswordService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
