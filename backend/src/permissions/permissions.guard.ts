import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }


    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());

        if (!requiredPermissions) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const hasPermission = requiredPermissions.every(permission => user.permissions.some(p => p.name === permission))

        if (!hasPermission) {
            throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource');
        }

        return true;
    }

}