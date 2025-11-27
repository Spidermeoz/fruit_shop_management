// src/domain/settings/SettingGeneral.ts

export interface SettingGeneralProps {
  id?: number;
  websiteName?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  copyright?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export class SettingGeneral {
  private _props: SettingGeneralProps;

  private constructor(props: SettingGeneralProps) {
    this._props = props;
  }

  static create(props: SettingGeneralProps) {
    return new SettingGeneral(props);
  }

  get props(): Readonly<SettingGeneralProps> {
    return this._props;
  }
}
