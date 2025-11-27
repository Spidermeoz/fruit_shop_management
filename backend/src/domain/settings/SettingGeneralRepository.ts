// src/domain/settings/SettingGeneralRepository.ts

import { SettingGeneral } from "./SettingGeneral";

export type UpdateSettingGeneralInput = Partial<{
  websiteName: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  copyright: string | null;
}>;

export interface SettingGeneralRepository {
  get(): Promise<SettingGeneral | null>;
  update(patch: UpdateSettingGeneralInput): Promise<SettingGeneral>;
}
