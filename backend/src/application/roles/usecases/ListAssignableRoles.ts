import type { RoleRepository } from "../../../domain/roles/RoleRepository";

export type ListAssignableRolesInput = {
  actorRoleCode?: string | null;
  actorLevel?: number | null;
  actorIsSuperAdmin?: boolean;
};

const mapRoleView = (role: any) => ({
  id: role.props.id!,
  code: role.props.code,
  scope: role.props.scope,
  level: role.props.level,
  isAssignable: role.props.isAssignable,
  isProtected: role.props.isProtected,
  title: role.props.title,
  description: role.props.description ?? null,
  permissions: role.props.permissions ?? {},
  deleted: !!role.props.deleted,
  deletedAt: role.props.deletedAt ?? null,
  createdAt: role.props.createdAt ?? null,
  updatedAt: role.props.updatedAt ?? null,
});

export class ListAssignableRoles {
  constructor(private repo: RoleRepository) {}

  async execute(input: ListAssignableRolesInput) {
    const rows = await this.repo.listAssignable({
      actorRoleCode: input.actorRoleCode ?? null,
      actorLevel:
        input.actorLevel === null || input.actorLevel === undefined
          ? null
          : Number(input.actorLevel),
      actorIsSuperAdmin: input.actorIsSuperAdmin === true,
    });

    return rows.map(mapRoleView);
  }
}
