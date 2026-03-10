export class RoleSummaryDto {
    id: number;
    name: string;
}

export class UserSummaryDto {
    id: string;
    fullName: string;
    role: RoleSummaryDto;
}

export class PermissionDto {
    id: number;
    name: string;
}

export class UserDetailDto {
    id: string;
    fullName: string;
    email: string;
    role: RoleSummaryDto;
    permissions: PermissionDto[];
    createdAt: Date;
    updatedAt: Date;
}
