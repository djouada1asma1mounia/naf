export class DepartmentManagerSummaryDto {
    id: string;
    fullName: string;
}

export class DepartmentResponseDto {
    id: number;
    name: string;
    code: string;
    manager?: DepartmentManagerSummaryDto | null;
}
