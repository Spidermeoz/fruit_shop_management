// src/infrastructure/repositories/SequelizeSettingGeneralRepository.ts

import {
  SettingGeneralRepository,
  UpdateSettingGeneralInput,
} from "../../domain/settings/SettingGeneralRepository";
import { SettingGeneral } from "../../domain/settings/SettingGeneral";

export class SequelizeSettingGeneralRepository
  implements SettingGeneralRepository
{
  constructor(private models: { SettingGeneral: any }) {}

  async get(): Promise<SettingGeneral | null> {
    const row = await this.models.SettingGeneral.findOne({ where: { id: 1 } });

    if (!row) return null;

    return SettingGeneral.create({
      id: row.id,
      websiteName: row.website_name,
      logo: row.logo,
      phone: row.phone,
      email: row.email,
      address: row.address,
      copyright: row.copyright,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async update(patch: UpdateSettingGeneralInput): Promise<SettingGeneral> {
    const row = await this.models.SettingGeneral.findOne({ where: { id: 1 } });

    if (!row) {
      throw new Error("settings_general record (id=1) not found");
    }

    await row.update({
      website_name: patch.websiteName,
      logo: patch.logo,
      phone: patch.phone,
      email: patch.email,
      address: patch.address,
      copyright: patch.copyright,
    });

    await row.reload();

    return SettingGeneral.create({
      id: row.id,
      websiteName: row.website_name,
      logo: row.logo,
      phone: row.phone,
      email: row.email,
      address: row.address,
      copyright: row.copyright,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
