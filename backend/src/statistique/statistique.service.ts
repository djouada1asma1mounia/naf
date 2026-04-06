import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { Decharge } from 'src/decharges/entities/decharge.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Intervention } from 'src/interventions/entities/intervention.entity';
import { Materiel } from 'src/materiels/entities/materiel.entity';
import { ServiceEntity } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { StatsFiltersDto } from './dto/stats-filters.dto';

type NamedCount = { name: string; value: number };
type MonthlyInterventionStat = {
    month: string;
    total: number;
    hard: number;
    soft: number;
    aFaire: number;
    enCours: number;
    termine: number;
};
type MonthlyDechargeStat = {
    month: string;
    total: number;
    hard: number;
    soft: number;
};

@Injectable()
export class StatistiqueService {
    constructor(
        @InjectRepository(Materiel)
        private readonly materielsRepository: Repository<Materiel>,
        @InjectRepository(Intervention)
        private readonly interventionsRepository: Repository<Intervention>,
        @InjectRepository(Decharge)
        private readonly dechargesRepository: Repository<Decharge>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Department)
        private readonly departmentsRepository: Repository<Department>,
        @InjectRepository(ServiceEntity)
        private readonly servicesRepository: Repository<ServiceEntity>,
    ) { }

    private parseCount(value: unknown): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }

    private mapNamedCounts(rows: Array<{ name?: string; value?: string | number }>): NamedCount[] {
        return rows.map((row) => ({
            name: row.name || 'Non renseigné',
            value: this.parseCount(row.value),
        }));
    }

    private createMaterialsFiltersQuery(filters: StatsFiltersDto): SelectQueryBuilder<Materiel> {
        const qb = this.materielsRepository
            .createQueryBuilder('materiel')
            .leftJoin('materiel.categorie', 'categorie')
            .leftJoin('materiel.service', 'service')
            .leftJoin('service.department', 'department')
            .leftJoin('materiel.subsidiary', 'subsidiary')
            .leftJoin('materiel.proprietaire', 'proprietaire');

        if (filters.startDate) {
            qb.andWhere('materiel.dateEntree >= :startDate', { startDate: filters.startDate });
        }

        if (filters.endDate) {
            qb.andWhere('materiel.dateEntree <= :endDate', { endDate: filters.endDate });
        }

        if (filters.categoryId) {
            qb.andWhere('categorie.id = :categoryId', { categoryId: filters.categoryId });
        }

        if (filters.serviceId) {
            qb.andWhere('service.id = :serviceId', { serviceId: filters.serviceId });
        }

        if (filters.departmentId) {
            qb.andWhere('department.id = :departmentId', { departmentId: filters.departmentId });
        }

        if (filters.subsidiaryCode) {
            qb.andWhere('subsidiary.code = :subsidiaryCode', {
                subsidiaryCode: filters.subsidiaryCode,
            });
        }

        if (filters.ownerId) {
            qb.andWhere('proprietaire.id = :ownerId', { ownerId: filters.ownerId });
        }

        if (filters.materialStatuses?.length) {
            qb.andWhere('materiel.etat IN (:...materialStatuses)', {
                materialStatuses: filters.materialStatuses,
            });
        }

        return qb;
    }

    private createInterventionsFiltersQuery(filters: StatsFiltersDto): SelectQueryBuilder<Intervention> {
        const qb = this.interventionsRepository.createQueryBuilder('intervention');

        if (filters.startDate) {
            qb.andWhere('intervention.createdAt >= :startDate', {
                startDate: `${filters.startDate} 00:00:00`,
            });
        }

        if (filters.endDate) {
            qb.andWhere('intervention.createdAt <= :endDate', {
                endDate: `${filters.endDate} 23:59:59`,
            });
        }

        if (filters.destinataire) {
            qb.andWhere('intervention.destinataire = :destinataire', {
                destinataire: filters.destinataire,
            });
        }

        if (filters.interventionTypes?.length) {
            qb.andWhere('intervention.interventionType IN (:...interventionTypes)', {
                interventionTypes: filters.interventionTypes,
            });
        }

        if (filters.interventionStatuses?.length) {
            qb.andWhere('intervention.status IN (:...interventionStatuses)', {
                interventionStatuses: filters.interventionStatuses,
            });
        }

        return qb;
    }

    private createDechargesFiltersQuery(filters: StatsFiltersDto): SelectQueryBuilder<Decharge> {
        const qb = this.dechargesRepository.createQueryBuilder('decharge');

        if (filters.startDate) {
            qb.andWhere('decharge.createdAt >= :startDate', {
                startDate: `${filters.startDate} 00:00:00`,
            });
        }

        if (filters.endDate) {
            qb.andWhere('decharge.createdAt <= :endDate', {
                endDate: `${filters.endDate} 23:59:59`,
            });
        }

        if (filters.destinataire) {
            qb.andWhere('decharge.destinataire = :destinataire', {
                destinataire: filters.destinataire,
            });
        }

        if (filters.dechargeTypes?.length) {
            qb.andWhere('decharge.maintenanceType IN (:...dechargeTypes)', {
                dechargeTypes: filters.dechargeTypes,
            });
        }

        return qb;
    }

    async getMaterialsStats(filters: StatsFiltersDto) {
        const top = filters.top ?? 10;

        const totalMaterials = await this.createMaterialsFiltersQuery(filters).getCount();

        const byStatus = this.mapNamedCounts(
            await this.createMaterialsFiltersQuery(filters)
                .select('materiel.etat', 'name')
                .addSelect('COUNT(materiel.numeroSerie)', 'value')
                .groupBy('materiel.etat')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byCategory = this.mapNamedCounts(
            await this.createMaterialsFiltersQuery(filters)
                .select("COALESCE(categorie.name, 'Non classé')", 'name')
                .addSelect('COUNT(materiel.numeroSerie)', 'value')
                .groupBy('categorie.id')
                .addGroupBy('categorie.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byDepartment = this.mapNamedCounts(
            await this.createMaterialsFiltersQuery(filters)
                .select("COALESCE(department.name, 'Sans département')", 'name')
                .addSelect('COUNT(materiel.numeroSerie)', 'value')
                .groupBy('department.id')
                .addGroupBy('department.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byService = this.mapNamedCounts(
            await this.createMaterialsFiltersQuery(filters)
                .select("COALESCE(service.name, 'Sans service')", 'name')
                .addSelect('COUNT(materiel.numeroSerie)', 'value')
                .groupBy('service.id')
                .addGroupBy('service.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const bySubsidiary = this.mapNamedCounts(
            await this.createMaterialsFiltersQuery(filters)
                .select("COALESCE(subsidiary.name, 'Sans filiale')", 'name')
                .addSelect('COUNT(materiel.numeroSerie)', 'value')
                .groupBy('subsidiary.code')
                .addGroupBy('subsidiary.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const topOwners = await this.createMaterialsFiltersQuery(filters)
            .select("COALESCE(CONCAT(proprietaire.nom, ' ', proprietaire.prenom), 'Sans propriétaire')", 'name')
            .addSelect('COUNT(materiel.numeroSerie)', 'value')
            .groupBy('proprietaire.id')
            .addGroupBy('proprietaire.nom')
            .addGroupBy('proprietaire.prenom')
            .orderBy('value', 'DESC')
            .limit(top)
            .getRawMany();

        const unassigned = await this.createMaterialsFiltersQuery(filters)
            .select('SUM(CASE WHEN service.id IS NULL THEN 1 ELSE 0 END)', 'withoutService')
            .addSelect('SUM(CASE WHEN proprietaire.id IS NULL THEN 1 ELSE 0 END)', 'withoutOwner')
            .addSelect('SUM(CASE WHEN subsidiary.code IS NULL THEN 1 ELSE 0 END)', 'withoutSubsidiary')
            .getRawOne();

        const warranty = await this.createMaterialsFiltersQuery(filters)
            .select('SUM(CASE WHEN materiel.finGarontie IS NOT NULL AND materiel.finGarontie < CURDATE() THEN 1 ELSE 0 END)', 'expired')
            .addSelect(
                'SUM(CASE WHEN materiel.finGarontie IS NOT NULL AND materiel.finGarontie BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END)',
                'expiringIn30Days',
            )
            .addSelect(
                'SUM(CASE WHEN materiel.finGarontie IS NOT NULL AND materiel.finGarontie BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY) THEN 1 ELSE 0 END)',
                'expiringIn90Days',
            )
            .getRawOne();

        return {
            totalMaterials,
            byStatus,
            byCategory,
            byDepartment,
            byService,
            bySubsidiary,
            topOwners: this.mapNamedCounts(topOwners),
            quality: {
                withoutService: this.parseCount(unassigned?.withoutService),
                withoutOwner: this.parseCount(unassigned?.withoutOwner),
                withoutSubsidiary: this.parseCount(unassigned?.withoutSubsidiary),
            },
            warranty: {
                expired: this.parseCount(warranty?.expired),
                expiringIn30Days: this.parseCount(warranty?.expiringIn30Days),
                expiringIn90Days: this.parseCount(warranty?.expiringIn90Days),
            },
        };
    }

    async getInterventionsStats(filters: StatsFiltersDto) {
        const top = filters.top ?? 10;
        const months = filters.months ?? 12;

        const totalInterventions = await this.createInterventionsFiltersQuery(filters).getCount();

        const byStatus = this.mapNamedCounts(
            await this.createInterventionsFiltersQuery(filters)
                .select('intervention.status', 'name')
                .addSelect('COUNT(intervention.id)', 'value')
                .groupBy('intervention.status')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byType = this.mapNamedCounts(
            await this.createInterventionsFiltersQuery(filters)
                .select('intervention.interventionType', 'name')
                .addSelect('COUNT(intervention.id)', 'value')
                .groupBy('intervention.interventionType')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byDestinataire = this.mapNamedCounts(
            await this.createInterventionsFiltersQuery(filters)
                .select("COALESCE(intervention.destinataire, 'Non renseigné')", 'name')
                .addSelect('COUNT(intervention.id)', 'value')
                .groupBy('intervention.destinataire')
                .orderBy('value', 'DESC')
                .limit(top)
                .getRawMany(),
        );

        const byInterventionnaire = this.mapNamedCounts(
            await this.createInterventionsFiltersQuery(filters)
                .select(
                    "COALESCE(CONCAT(intervention.interventionnaireNom, ' ', intervention.interventionnairePrenom), 'Non renseigné')",
                    'name',
                )
                .addSelect('COUNT(intervention.id)', 'value')
                .groupBy('intervention.interventionnaireNom')
                .addGroupBy('intervention.interventionnairePrenom')
                .orderBy('value', 'DESC')
                .limit(top)
                .getRawMany(),
        );

        const monthlyRaw = await this.createInterventionsFiltersQuery(filters)
            .select("DATE_FORMAT(intervention.createdAt, '%Y-%m')", 'month')
            .addSelect('COUNT(intervention.id)', 'total')
            .addSelect("SUM(CASE WHEN intervention.interventionType = 'HARD' THEN 1 ELSE 0 END)", 'hard')
            .addSelect("SUM(CASE WHEN intervention.interventionType = 'SOFT' THEN 1 ELSE 0 END)", 'soft')
            .addSelect("SUM(CASE WHEN intervention.status = 'A_FAIRE' THEN 1 ELSE 0 END)", 'aFaire')
            .addSelect("SUM(CASE WHEN intervention.status = 'EN_COURS' THEN 1 ELSE 0 END)", 'enCours')
            .addSelect("SUM(CASE WHEN intervention.status = 'TERMINE' THEN 1 ELSE 0 END)", 'termine')
            .groupBy("DATE_FORMAT(intervention.createdAt, '%Y-%m')")
            .orderBy('month', 'DESC')
            .limit(months)
            .getRawMany();

        const byMonth: MonthlyInterventionStat[] = monthlyRaw
            .map((row) => ({
                month: row.month,
                total: this.parseCount(row.total),
                hard: this.parseCount(row.hard),
                soft: this.parseCount(row.soft),
                aFaire: this.parseCount(row.aFaire),
                enCours: this.parseCount(row.enCours),
                termine: this.parseCount(row.termine),
            }))
            .reverse();

        const itemsSummary = await this.createInterventionsFiltersQuery(filters)
            .leftJoin('intervention.items', 'item')
            .select('COALESCE(SUM(item.quantity), 0)', 'totalItemsQuantity')
            .addSelect('COUNT(item.id)', 'totalItems')
            .addSelect('COUNT(DISTINCT intervention.id)', 'interventionCount')
            .getRawOne();

        const interventionCount = this.parseCount(itemsSummary?.interventionCount);
        const totalItems = this.parseCount(itemsSummary?.totalItems);

        return {
            totalInterventions,
            byStatus,
            byType,
            byDestinataire,
            byInterventionnaire,
            byMonth,
            items: {
                totalItems,
                totalItemsQuantity: this.parseCount(itemsSummary?.totalItemsQuantity),
                averageItemsPerIntervention:
                    interventionCount > 0 ? Number((totalItems / interventionCount).toFixed(2)) : 0,
            },
        };
    }

    async getDechargesStats(filters: StatsFiltersDto) {
        const top = filters.top ?? 10;
        const months = filters.months ?? 12;

        const totalDecharges = await this.createDechargesFiltersQuery(filters).getCount();

        const byType = this.mapNamedCounts(
            await this.createDechargesFiltersQuery(filters)
                .select('decharge.maintenanceType', 'name')
                .addSelect('COUNT(decharge.id)', 'value')
                .groupBy('decharge.maintenanceType')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byDestinataire = this.mapNamedCounts(
            await this.createDechargesFiltersQuery(filters)
                .select("COALESCE(decharge.destinataire, 'Non renseigné')", 'name')
                .addSelect('COUNT(decharge.id)', 'value')
                .groupBy('decharge.destinataire')
                .orderBy('value', 'DESC')
                .limit(top)
                .getRawMany(),
        );

        const monthlyRaw = await this.createDechargesFiltersQuery(filters)
            .select("DATE_FORMAT(decharge.createdAt, '%Y-%m')", 'month')
            .addSelect('COUNT(decharge.id)', 'total')
            .addSelect("SUM(CASE WHEN decharge.maintenanceType = 'HARD' THEN 1 ELSE 0 END)", 'hard')
            .addSelect("SUM(CASE WHEN decharge.maintenanceType = 'SOFT' THEN 1 ELSE 0 END)", 'soft')
            .groupBy("DATE_FORMAT(decharge.createdAt, '%Y-%m')")
            .orderBy('month', 'DESC')
            .limit(months)
            .getRawMany();

        const byMonth: MonthlyDechargeStat[] = monthlyRaw
            .map((row) => ({
                month: row.month,
                total: this.parseCount(row.total),
                hard: this.parseCount(row.hard),
                soft: this.parseCount(row.soft),
            }))
            .reverse();

        const itemsSummary = await this.createDechargesFiltersQuery(filters)
            .leftJoin('decharge.items', 'item')
            .select('COALESCE(SUM(item.quantity), 0)', 'totalItemsQuantity')
            .addSelect('COUNT(item.id)', 'totalItems')
            .addSelect('COUNT(DISTINCT decharge.id)', 'dechargeCount')
            .getRawOne();

        const dechargeCount = this.parseCount(itemsSummary?.dechargeCount);
        const totalItems = this.parseCount(itemsSummary?.totalItems);

        return {
            totalDecharges,
            byType,
            byDestinataire,
            byMonth,
            items: {
                totalItems,
                totalItemsQuantity: this.parseCount(itemsSummary?.totalItemsQuantity),
                averageItemsPerDecharge:
                    dechargeCount > 0 ? Number((totalItems / dechargeCount).toFixed(2)) : 0,
            },
        };
    }

    async getUsersStats(filters: StatsFiltersDto) {
        const usersBase = this.usersRepository.createQueryBuilder('user')
            .leftJoin('user.role', 'role')
            .leftJoin('user.department', 'department');

        if (filters.startDate) {
            usersBase.andWhere('user.createdAt >= :startDate', {
                startDate: `${filters.startDate} 00:00:00`,
            });
        }

        if (filters.endDate) {
            usersBase.andWhere('user.createdAt <= :endDate', {
                endDate: `${filters.endDate} 23:59:59`,
            });
        }

        if (filters.departmentId) {
            usersBase.andWhere('department.id = :departmentId', {
                departmentId: filters.departmentId,
            });
        }

        const totalUsers = await usersBase.clone().getCount();

        const byRole = this.mapNamedCounts(
            await usersBase
                .clone()
                .select("COALESCE(role.name, 'Sans rôle')", 'name')
                .addSelect('COUNT(user.id)', 'value')
                .groupBy('role.id')
                .addGroupBy('role.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const byDepartment = this.mapNamedCounts(
            await usersBase
                .clone()
                .select("COALESCE(department.name, 'Sans département')", 'name')
                .addSelect('COUNT(user.id)', 'value')
                .groupBy('department.id')
                .addGroupBy('department.name')
                .orderBy('value', 'DESC')
                .getRawMany(),
        );

        const totalDepartments = await this.departmentsRepository.count();
        const totalServices = await this.servicesRepository.count();

        return {
            totalUsers,
            byRole,
            byDepartment,
            structure: {
                totalDepartments,
                totalServices,
            },
        };
    }

    async getOverview(filters: StatsFiltersDto) {
        const [materials, interventions, decharges, users] = await Promise.all([
            this.getMaterialsStats(filters),
            this.getInterventionsStats(filters),
            this.getDechargesStats(filters),
            this.getUsersStats(filters),
        ]);

        return {
            data: {
                materials,
                interventions,
                decharges,
                users,
            },
            message: 'Statistiques globales récupérées avec succès',
            filters,
        };
    }
}
