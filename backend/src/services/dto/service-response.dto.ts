export class ServiceResponseDto {
    id: number;
    name: string;
    code: string;
    department: {
        id: number;
        name: string;
        code: string;
    };
}
