import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { StatsFiltersDto } from './dto/stats-filters.dto';
import { StatistiqueService } from './statistique.service';

@Controller('statistique')
@UseGuards(JwtAuthGuard)
export class StatistiqueController {
    constructor(private readonly statistiqueService: StatistiqueService) { }

    @Get('overview')
    async getOverview(@Query() filters: StatsFiltersDto) {
        return this.statistiqueService.getOverview(filters);
    }

    @Get('materials')
    async getMaterialsStats(@Query() filters: StatsFiltersDto) {
        return {
            data: await this.statistiqueService.getMaterialsStats(filters),
            message: 'Statistiques des matériels récupérées avec succès',
            filters,
        };
    }

    @Get('interventions')
    async getInterventionsStats(@Query() filters: StatsFiltersDto) {
        return {
            data: await this.statistiqueService.getInterventionsStats(filters),
            message: 'Statistiques des interventions récupérées avec succès',
            filters,
        };
    }

    @Get('decharges')
    async getDechargesStats(@Query() filters: StatsFiltersDto) {
        return {
            data: await this.statistiqueService.getDechargesStats(filters),
            message: 'Statistiques des décharges récupérées avec succès',
            filters,
        };
    }

    @Get('users')
    async getUsersStats(@Query() filters: StatsFiltersDto) {
        return {
            data: await this.statistiqueService.getUsersStats(filters),
            message: 'Statistiques des utilisateurs récupérées avec succès',
            filters,
        };
    }
}
