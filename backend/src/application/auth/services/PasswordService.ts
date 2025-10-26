// src/application/auth/services/PasswordService.ts

export interface PasswordService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
