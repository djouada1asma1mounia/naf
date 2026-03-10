import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }


    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.get<string[]>(PERMISSIONS_KEY, context.getHandler());

        if (!requiredPermissions) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.permissions) {
            throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource');
        }

        const hasPermission = requiredPermissions.every(permission => user.permissions.some(p => p.name === permission));

        if (!hasPermission) {
            throw new ForbiddenException('Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource');
        }

        return true;
    }

}