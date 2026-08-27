import { ROLES } from "../utils/constants";
import axiosInstance from "./axios";

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const isObjectRecord = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

const pickFirstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const parseLoginResponse = (payload = {}) => {
  const root = isObjectRecord(payload) ? payload : {};
  const dataNode = isObjectRecord(root.data) ? root.data : null;
  const nestedDataNode = isObjectRecord(dataNode?.data) ? dataNode.data : null;

  const accessToken = pickFirstDefined(
    root.accessToken,
    root.token,
    dataNode?.accessToken,
    dataNode?.token,
    nestedDataNode?.accessToken,
    nestedDataNode?.token,
  );

  const userData = pickFirstDefined(
    dataNode?.user,
    root.user,
    nestedDataNode?.user,
    nestedDataNode,
    dataNode,
  );

  return {
    accessToken,
    data: isObjectRecord(userData) ? userData : null,
    message: root.message || dataNode?.message,
  };
};

export { ROLES };

const splitFullName = (fullName = "") => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const normalizeUserSummary = (summary, detail) => {
  const fullName = detail?.fullName || summary?.fullName || "";
  const { firstName, lastName } = splitFullName(fullName);
  const role = detail?.role || summary?.role || null;
  const department = detail?.department || summary?.department || null;

  return {
    id: detail?.id || summary?.id,
    firstName,
    lastName,
    email: detail?.email || "",
    username: detail?.email ? String(detail.email).split("@")[0] : "",
    role: role?.name || role?.code || null,
    roleId: role?.id || null,
    department: department?.name || "",
    departmentId: department?.id || null,
    permissions: detail?.permissions || [],
    permissionIds: (detail?.permissions || [])
      .map((permission) => permission?.id)
      .filter((id) => id != null),
    active: true,
    createdAt: detail?.createdAt
      ? new Date(detail.createdAt).toISOString().split("T")[0]
      : "-",
  };
};

const mapCreateRegisterPayload = (payload = {}) => ({
  email: payload.email,
  nom: payload.lastName || payload.nom,
  prenom: payload.firstName || payload.prenom,
  roleId: Number(payload.roleId),
  departmentId: Number(payload.departmentId),
  password: payload.password,
  password_confirmed: payload.confirmPassword || payload.password_confirmed,
});

const mapUpdatePayload = (payload = {}) => {
  const mapped = {
    nom: payload.lastName || payload.nom,
    prenom: payload.firstName || payload.prenom,
    email: payload.email,
  };

  if (payload.departmentId !== undefined && payload.departmentId !== "") {
    mapped.departmentId = Number(payload.departmentId);
  }

  if (payload.roleId !== undefined && payload.roleId !== "") {
    mapped.roleId = Number(payload.roleId);
  }

  if (payload.password) {
    mapped.password = payload.password;
  }

  return mapped;
};

const resolveBackendPermissionIds = async (permissionSelections = []) => {
  if (!Array.isArray(permissionSelections) || permissionSelections.length === 0)
    return [];

  const response = await axiosInstance.get("/permissions");
  const backendPermissions = response?.data?.data || [];

  const resolvedIds = [];
  const unresolvedNames = [];

  permissionSelections.forEach((selection) => {
    const numericId = Number(selection?.id);
    if (!Number.isNaN(numericId) && numericId > 0) {
      const exists = backendPermissions.some(
        (permission) => Number(permission.id) === numericId,
      );
      if (exists) {
        resolvedIds.push(numericId);
        return;
      }
    }

    const normalizedName = String(selection?.name || "")
      .trim()
      .toLowerCase();
    if (!normalizedName) return;

    const byName = backendPermissions.find(
      (permission) =>
        String(permission?.name || "")
          .trim()
          .toLowerCase() === normalizedName,
    );
    if (byName?.id) {
      resolvedIds.push(Number(byName.id));
    } else {
      unresolvedNames.push(selection.name);
    }
  });

  if (unresolvedNames.length > 0) {
    throw new Error(
      `Permissions introuvables côté backend: ${unresolvedNames.join(", ")}`,
    );
  }

  return Array.from(new Set(resolvedIds));
};

const extractPermissionIdsFromUser = (user = {}) => {
  if (!Array.isArray(user?.permissions)) return [];
  return user.permissions
    .map((permission) => Number(permission?.id))
    .filter((id) => !Number.isNaN(id));
};

const hasAllRequestedPermissions = (user = {}, requestedIds = []) => {
  if (!Array.isArray(requestedIds) || requestedIds.length === 0) return true;
  const currentIds = new Set(extractPermissionIdsFromUser(user));
  return requestedIds.every((id) => currentIds.has(Number(id)));
};

export const authAPI = {
  /** POST /auth/login → { accessToken, data, message } */
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      const payload = response?.data || {};
      return parseLoginResponse(payload);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Identifiants incorrects."));
    }
  },

  /** POST /auth/register */
  register: async (payload) => {
    try {
      const response = await axiosInstance.post(
        "/auth/register",
        mapCreateRegisterPayload(payload),
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Erreur lors de l’inscription."));
    }
  },

  /** GET /users */
  getUsers: async () => {
    try {
      const response = await axiosInstance.get("/users");
      const summaries = response?.data?.data || [];

      const users = await Promise.all(
        summaries.map(async (summary) => {
          try {
            const detailResponse = await axiosInstance.get(
              `/users/${summary.id}`,
            );
            const detail = detailResponse?.data?.data;
            return normalizeUserSummary(summary, detail);
          } catch {
            return normalizeUserSummary(summary, null);
          }
        }),
      );

      return users;
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Erreur lors du chargement des utilisateurs."),
      );
    }
  },

  /** GET /users/:id */
  getUserById: async (id) => {
    try {
      const [summaryResponse, detailResponse] = await Promise.all([
        axiosInstance.get("/users"),
        axiosInstance.get(`/users/${id}`),
      ]);

      const summary = (summaryResponse?.data?.data || []).find(
        (item) => String(item.id) === String(id),
      );
      return normalizeUserSummary(summary, detailResponse?.data?.data || null);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Utilisateur non trouvé"));
    }
  },

  /** POST /auth/register */
  createUser: async (data) => {
    try {
      const resolvedRoleId = Number(data.roleId);
      if (
        !resolvedRoleId ||
        Number.isNaN(resolvedRoleId) ||
        resolvedRoleId <= 0
      ) {
        throw new Error("Veuillez sélectionner un rôle backend valide.");
      }

      await axiosInstance.post(
        "/auth/register",
        mapCreateRegisterPayload({
          ...data,
          roleId: resolvedRoleId,
        }),
      );

      const requestedPermissionIds = await resolveBackendPermissionIds(
        data.permissionSelections || [],
      );

      const users = await authAPI.getUsers();
      const createdUser = users.find(
        (user) =>
          String(user?.email || "").toLowerCase() ===
          String(data.email || "").toLowerCase(),
      );

      if (!createdUser?.id) {
        throw new Error("Utilisateur créé mais introuvable après création.");
      }

      if (requestedPermissionIds.length > 0) {
        await authAPI.updateUser(createdUser.id, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roleId: resolvedRoleId,
          departmentId: data.departmentId,
          permissionSelections: data.permissionSelections || [],
        });
      }

      const persisted = await authAPI.getUserById(createdUser.id);
      if (!hasAllRequestedPermissions(persisted, requestedPermissionIds)) {
        throw new Error(
          "Les permissions n'ont pas été persistées correctement en base de données.",
        );
      }

      return {
        data: persisted,
        permissionsApplied: requestedPermissionIds.length > 0,
      };
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Erreur lors de la création de l’utilisateur."),
      );
    }
  },

  /** PATCH /users/:id */
  updateUser: async (id, data) => {
    try {
      const mapped = mapUpdatePayload(data);
      if (
        mapped.roleId !== undefined &&
        (!mapped.roleId || Number(mapped.roleId) <= 0)
      ) {
        throw new Error("Veuillez sélectionner un rôle backend valide.");
      }

      const requestedPermissionIds = Array.isArray(data.permissionSelections)
        ? await resolveBackendPermissionIds(data.permissionSelections)
        : [];

      if (Array.isArray(data.permissionSelections)) {
        mapped.permissionIds = requestedPermissionIds;
      }

      await axiosInstance.patch(`/users/${id}`, mapped);

      const persisted = await authAPI.getUserById(id);
      if (!hasAllRequestedPermissions(persisted, requestedPermissionIds)) {
        throw new Error(
          "Les permissions mises à jour ne sont pas persistées correctement en base de données.",
        );
      }

      return persisted;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Erreur lors de la mise à jour de l’utilisateur.",
        ),
      );
    }
  },

  /** DELETE /users/:id */
  deleteUser: async (id) => {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Erreur lors de la suppression de l’utilisateur.",
        ),
      );
    }
  },

  /** POST /auth/change-password */
  changePassword: async ({
    currentPassword,
    newPassword,
    confirmNewPassword,
  }) => {
    try {
      const response = await axiosInstance.post("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Erreur lors du changement de mot de passe."),
      );
    }
  },
};
