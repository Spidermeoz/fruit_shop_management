import { Op, Transaction } from "sequelize";
import type { NotificationRepository } from "../../domain/notifications/NotificationRepository";
import type {
  CreateNotificationInput,
  MarkAllNotificationsReadResult,
  MarkNotificationReadResult,
  NotificationCreateResult,
  NotificationListFilter,
  NotificationListItem,
  NotificationListResult,
  NotificationRecord,
} from "../../domain/notifications/types";

type NotificationModels = {
  Notification: any;
  NotificationRecipient: any;
  User?: any;
  Role?: any;
  Branch?: any;
  UserBranch?: any;
};

const toBaseRecord = (row: any): NotificationRecord => ({
  id: Number(row.id),
  eventKey: String(row.event_key),
  category: row.category,
  severity: row.severity,
  title: row.title,
  message: row.message,
  entityType: row.entity_type ?? null,
  entityId:
    row.entity_id !== null && row.entity_id !== undefined
      ? Number(row.entity_id)
      : null,
  actorUserId:
    row.actor_user_id !== null && row.actor_user_id !== undefined
      ? Number(row.actor_user_id)
      : null,
  branchId:
    row.branch_id !== null && row.branch_id !== undefined
      ? Number(row.branch_id)
      : null,
  targetUrl: row.target_url ?? null,
  metaJson: row.meta_json ?? null,
  dedupeKey: row.dedupe_key ?? null,
  status: row.status,
  deleted: !!row.deleted,
  deletedAt: row.deleted_at ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const uniqNumberArray = (values?: number[]) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

export class SequelizeNotificationRepository implements NotificationRepository {
  constructor(private readonly models: NotificationModels) {}

  private async resolveRecipientUserIds(
    input: CreateNotificationInput,
    transaction?: Transaction,
  ): Promise<number[]> {
    const explicitUserIds = uniqNumberArray(input.recipientUserIds);
    const explicitRoleIds = uniqNumberArray(input.recipientRoleIds);
    const explicitBranchIds = uniqNumberArray(
      input.recipientBranchIds?.length
        ? input.recipientBranchIds
        : input.branchId
          ? [Number(input.branchId)]
          : [],
    );
    const excludeUserIds = uniqNumberArray(input.excludeUserIds);

    const recipients = new Set<number>(explicitUserIds);

    if (
      this.models.User &&
      (explicitRoleIds.length > 0 ||
        explicitBranchIds.length > 0 ||
        input.deliverToAllInternalUsers === true ||
        input.includeSuperAdmins === true)
    ) {
      const userWhere: any = {
        deleted: 0,
        status: "active",
        role_id: { [Op.not]: null },
      };

      if (explicitRoleIds.length > 0) {
        userWhere.role_id = { [Op.in]: explicitRoleIds };
      }

      if (explicitBranchIds.length > 0) {
        userWhere[Op.or] = [
          { default_branch_id: { [Op.in]: explicitBranchIds } },
        ];
      }

      const directUsers = await this.models.User.findAll({
        where: userWhere,
        attributes: ["id", "role_id", "default_branch_id"],
        transaction,
      });

      for (const user of directUsers) {
        recipients.add(Number(user.id));
      }

      if (explicitBranchIds.length > 0 && this.models.UserBranch) {
        const userBranches = await this.models.UserBranch.findAll({
          where: {
            branch_id: { [Op.in]: explicitBranchIds },
          },
          attributes: ["user_id"],
          transaction,
        });

        for (const row of userBranches) {
          const userId = Number(row.user_id);
          if (Number.isFinite(userId) && userId > 0) {
            recipients.add(userId);
          }
        }
      }

      if (input.includeSuperAdmins === true && this.models.Role) {
        const superAdminRole = await this.models.Role.findOne({
          where: { code: "super_admin", deleted: 0 },
          attributes: ["id"],
          transaction,
        });

        if (superAdminRole) {
          const users = await this.models.User.findAll({
            where: {
              deleted: 0,
              status: "active",
              role_id: Number(superAdminRole.id),
            },
            attributes: ["id"],
            transaction,
          });

          for (const user of users) {
            recipients.add(Number(user.id));
          }
        }
      }

      if (
        recipients.size === 0 &&
        input.deliverToAllInternalUsers === true &&
        this.models.User
      ) {
        const users = await this.models.User.findAll({
          where: {
            deleted: 0,
            status: "active",
            role_id: { [Op.not]: null },
          },
          attributes: ["id"],
          transaction,
        });

        for (const user of users) {
          recipients.add(Number(user.id));
        }
      }
    }

    for (const excludedUserId of excludeUserIds) {
      recipients.delete(excludedUserId);
    }

    return Array.from(recipients).filter(
      (value) => Number.isFinite(value) && value > 0,
    );
  }

  async create(
    input: CreateNotificationInput,
    transaction?: Transaction,
  ): Promise<NotificationCreateResult> {
    const dedupeKey = input.dedupeKey ?? null;

    if (dedupeKey) {
      const existed = await this.models.Notification.findOne({
        where: {
          dedupe_key: dedupeKey,
          deleted: 0,
        },
        transaction,
      });

      if (existed) {
        const recipientCount = await this.models.NotificationRecipient.count({
          where: { notification_id: existed.id },
          transaction,
        });

        return {
          ...toBaseRecord(existed),
          recipientCount: Number(recipientCount || 0),
        };
      }
    }

    const created = await this.models.Notification.create(
      {
        event_key: input.eventKey,
        category: input.category ?? "system",
        severity: input.severity ?? "info",
        title: input.title,
        message: input.message,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        actor_user_id: input.actorUserId ?? null,
        branch_id: input.branchId ?? null,
        target_url: input.targetUrl ?? null,
        meta_json: input.metaJson ?? null,
        dedupe_key: dedupeKey,
        status: input.status ?? "active",
        deleted: 0,
        deleted_at: null,
      },
      { transaction },
    );

    const recipientUserIds = await this.resolveRecipientUserIds(
      input,
      transaction,
    );

    if (recipientUserIds.length > 0) {
      await this.models.NotificationRecipient.bulkCreate(
        recipientUserIds.map((userId) => ({
          notification_id: created.id,
          user_id: userId,
          is_read: 0,
          read_at: null,
          is_hidden: 0,
          hidden_at: null,
        })),
        {
          ignoreDuplicates: true,
          transaction,
        },
      );
    }

    return {
      ...toBaseRecord(created),
      recipientCount: recipientUserIds.length,
    };
  }

  async findByIdForUser(
    notificationId: number,
    userId: number,
  ): Promise<NotificationListItem | null> {
    const recipient = await this.models.NotificationRecipient.findOne({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
    });

    if (!recipient) return null;

    const notification = await this.models.Notification.findOne({
      where: {
        id: notificationId,
        deleted: 0,
      },
    });

    if (!notification) return null;

    const actorUserId =
      notification.actor_user_id !== null &&
      notification.actor_user_id !== undefined
        ? Number(notification.actor_user_id)
        : null;
    const branchId =
      notification.branch_id !== null && notification.branch_id !== undefined
        ? Number(notification.branch_id)
        : null;

    const actor =
      actorUserId && this.models.User
        ? await this.models.User.findByPk(actorUserId, {
            attributes: ["id", "full_name", "avatar"],
          })
        : null;

    const branch =
      branchId && this.models.Branch
        ? await this.models.Branch.findByPk(branchId, {
            attributes: ["id", "name", "code"],
          })
        : null;

    return {
      ...toBaseRecord(notification),
      recipientId: Number(recipient.id),
      userId: Number(recipient.user_id),
      isRead: !!recipient.is_read,
      readAt: recipient.read_at ?? null,
      isHidden: !!recipient.is_hidden,
      hiddenAt: recipient.hidden_at ?? null,
      actorName: actor?.full_name ?? null,
      actorAvatar: actor?.avatar ?? null,
      branchName: branch?.name ?? null,
      branchCode: branch?.code ?? null,
    };
  }

  async listForUser(
    filter: NotificationListFilter,
  ): Promise<NotificationListResult> {
    const page = Math.max(1, Number(filter.page ?? 1));
    const limit = Math.max(1, Math.min(100, Number(filter.limit ?? 20)));
    const offset = (page - 1) * limit;

    const notificationWhere: any = {
      deleted: 0,
    };

    if (filter.category && filter.category !== "all") {
      notificationWhere.category = filter.category;
    }

    if (filter.severity && filter.severity !== "all") {
      notificationWhere.severity = filter.severity;
    }

    const q = String(filter.q ?? "").trim();
    if (q) {
      notificationWhere[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { message: { [Op.like]: `%${q}%` } },
        { event_key: { [Op.like]: `%${q}%` } },
      ];
    }

    let allowedNotificationIds: number[] | null = null;
    if (
      Object.keys(notificationWhere).length > 1 ||
      notificationWhere[Op.or] !== undefined
    ) {
      const matchedNotifications = await this.models.Notification.findAll({
        where: notificationWhere,
        attributes: ["id"],
      });

      allowedNotificationIds = matchedNotifications
        .map((row: any) => Number(row.id))
        .filter((value: number) => Number.isFinite(value) && value > 0);

      if (allowedNotificationIds?.length === 0) {
        return {
          rows: [],
          count: 0,
          page,
          limit,
        };
      }
    }

    const recipientWhere: any = {
      user_id: filter.userId,
      is_hidden: 0,
    };

    if (filter.unreadOnly === true) {
      recipientWhere.is_read = 0;
    }

    if (allowedNotificationIds) {
      recipientWhere.notification_id = { [Op.in]: allowedNotificationIds };
    }

    const recipientsResult =
      await this.models.NotificationRecipient.findAndCountAll({
        where: recipientWhere,
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

    const notificationIds = Array.from(
      new Set(
        (recipientsResult.rows ?? [])
          .map((row: any) => Number(row.notification_id))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    if (notificationIds.length === 0) {
      return {
        rows: [],
        count: Number(recipientsResult.count || 0),
        page,
        limit,
      };
    }

    const notifications = await this.models.Notification.findAll({
      where: {
        id: { [Op.in]: notificationIds },
        deleted: 0,
      },
      order: [["created_at", "DESC"]],
    });

    const notificationMap = new Map<number, any>(
      notifications.map((row: any) => [Number(row.id), row]),
    );

    const actorIds = Array.from(
      new Set(
        notifications
          .map((row: any) => Number(row.actor_user_id))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    const branchIds = Array.from(
      new Set(
        notifications
          .map((row: any) => Number(row.branch_id))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    );

    const actorMap = new Map<number, any>();
    if (actorIds.length > 0 && this.models.User) {
      const actors = await this.models.User.findAll({
        where: { id: { [Op.in]: actorIds } },
        attributes: ["id", "full_name", "avatar"],
      });

      for (const actor of actors) {
        actorMap.set(Number(actor.id), actor);
      }
    }

    const branchMap = new Map<number, any>();
    if (branchIds.length > 0 && this.models.Branch) {
      const branches = await this.models.Branch.findAll({
        where: { id: { [Op.in]: branchIds } },
        attributes: ["id", "name", "code"],
      });

      for (const branch of branches) {
        branchMap.set(Number(branch.id), branch);
      }
    }

    const rows = (recipientsResult.rows ?? [])
      .map((recipient: any) => {
        const notification = notificationMap.get(
          Number(recipient.notification_id),
        );
        if (!notification) return null;

        const actor = actorMap.get(Number(notification.actor_user_id));
        const branch = branchMap.get(Number(notification.branch_id));

        return {
          ...toBaseRecord(notification),
          recipientId: Number(recipient.id),
          userId: Number(recipient.user_id),
          isRead: !!recipient.is_read,
          readAt: recipient.read_at ?? null,
          isHidden: !!recipient.is_hidden,
          hiddenAt: recipient.hidden_at ?? null,
          actorName: actor?.full_name ?? null,
          actorAvatar: actor?.avatar ?? null,
          branchName: branch?.name ?? null,
          branchCode: branch?.code ?? null,
        } as NotificationListItem;
      })
      .filter(Boolean) as NotificationListItem[];

    return {
      rows,
      count: Number(recipientsResult.count || 0),
      page,
      limit,
    };
  }

  async countUnreadForUser(userId: number): Promise<number> {
    const count = await this.models.NotificationRecipient.count({
      where: {
        user_id: userId,
        is_read: 0,
        is_hidden: 0,
      },
    });

    return Number(count || 0);
  }

  async markRead(
    notificationId: number,
    userId: number,
    transaction?: Transaction,
  ): Promise<MarkNotificationReadResult | null> {
    const recipient = await this.models.NotificationRecipient.findOne({
      where: {
        notification_id: notificationId,
        user_id: userId,
      },
      transaction,
    });

    if (!recipient) {
      return null;
    }

    const now = new Date();

    if (!recipient.is_read) {
      await this.models.NotificationRecipient.update(
        {
          is_read: 1,
          read_at: now,
        },
        {
          where: { id: recipient.id },
          transaction,
        },
      );
    }

    return {
      notificationId,
      userId,
      isRead: true,
      readAt: recipient.read_at ?? now,
    };
  }

  async markAllRead(
    userId: number,
    notificationIds?: number[] | null,
    transaction?: Transaction,
  ): Promise<MarkAllNotificationsReadResult> {
    const where: any = {
      user_id: userId,
      is_read: 0,
      is_hidden: 0,
    };

    const normalizedIds = uniqNumberArray(notificationIds ?? []);
    if (normalizedIds.length > 0) {
      where.notification_id = { [Op.in]: normalizedIds };
    }

    const [affected] = await this.models.NotificationRecipient.update(
      {
        is_read: 1,
        read_at: new Date(),
      },
      {
        where,
        transaction,
      },
    );

    return {
      userId,
      affected: Number(affected || 0),
    };
  }
}
