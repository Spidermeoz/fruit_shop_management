// src/application/settings/usecases/GetGeneralSettings.ts

import type { SettingGeneralRepository } from "../../../domain/settings/SettingGeneralRepository";

export class GetGeneralSettings {
  constructor(private repo: SettingGeneralRepository) {}

  async execute() {
    const setting = await this.repo.get();

    if (!setting) {
      throw new Error("General settings not found (id=1)");
    }

    return {
      id: setting.props.id,
      website_name: setting.props.websiteName ?? null,
      logo: setting.props.logo ?? null,
      phone: setting.props.phone ?? null,
      email: setting.props.email ?? null,
      address: setting.props.address ?? null,
      copyright: setting.props.copyright ?? null,
      created_at: setting.props.createdAt ?? null,
      updated_at: setting.props.updatedAt ?? null,
    };
  }
}
