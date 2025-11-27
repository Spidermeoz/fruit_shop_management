// src/application/settings/usecases/UpdateGeneralSettings.ts

import type {
  SettingGeneralRepository,
  UpdateSettingGeneralInput,
} from "../../../domain/settings/SettingGeneralRepository";

export class UpdateGeneralSettings {
  constructor(private repo: SettingGeneralRepository) {}

  async execute(patch: UpdateSettingGeneralInput) {
    const updated = await this.repo.update(patch);

    return {
      id: updated.props.id,
      website_name: updated.props.websiteName ?? null,
      logo: updated.props.logo ?? null,
      phone: updated.props.phone ?? null,
      email: updated.props.email ?? null,
      address: updated.props.address ?? null,
      copyright: updated.props.copyright ?? null,
      created_at: updated.props.createdAt ?? null,
      updated_at: updated.props.updatedAt ?? null,
    };
  }
}
