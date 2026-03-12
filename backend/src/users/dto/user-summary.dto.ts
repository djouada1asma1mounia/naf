export class RoleSummaryDto {
    id: number;
    name: string;
}

export class DepartmentSummaryDto {
    id: number;
    name: string;
}

export class UserSummaryDto {
    id: string;
    fullName: string;
    role: RoleSummaryDto;
    department: DepartmentSummaryDto;
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
    department: DepartmentSummaryDto;
    permissions: PermissionDto[];
    createdAt: Date;
    updatedAt: Date;
}
