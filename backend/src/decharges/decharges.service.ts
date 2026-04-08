import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { Repository } from 'typeorm';
import { Decharge } from './entities/decharge.entity';
import { DechargeItem } from './entities/decharge-item.entity';
import { CreateDechargeDto } from './dto/create-decharge.dto';
import { User } from 'src/users/entities/user.entity';
import { DechargeResponseDto } from './dto/decharge-response.dto';

@Injectable()
export class DechargesService {
    constructor(
        @InjectRepository(Decharge)
        private readonly dechargesRepository: Repository<Decharge>,
    ) { }

    private baseQuery() {
        return this.dechargesRepository
            .createQueryBuilder('decharge')
            .leftJoinAndSelect('decharge.items', 'item')
            .leftJoinAndSelect('decharge.createdBy', 'createdBy')
            .addSelect(['createdBy.id', 'createdBy.nom', 'createdBy.prenom', 'createdBy.email'])
            .orderBy('decharge.createdAt', 'DESC')
            .addOrderBy('item.id', 'ASC');
    }

    private async generateReferenceForCurrentYear(transactionalRepository: Repository<Decharge>): Promise<string> {
        const currentYear = new Date().getFullYear();
        const likePattern = `%/${currentYear}`;

        const rows = await transactionalRepository.query(
            `
      SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference, '/', 1) AS UNSIGNED)), 0) AS maxNumber
      FROM decharges
      WHERE reference LIKE ?
      FOR UPDATE
      `,
            [likePattern],
        );

        const currentMax = Number(rows?.[0]?.maxNumber || 0);
        const nextNumber = currentMax + 1;

        return `${nextNumber}/${currentYear}`;
    }

    private async getDechargeOrFail(id: number): Promise<Decharge> {
        const decharge = await this.baseQuery()
            .where('decharge.id = :id', { id })
            .getOne();

        if (!decharge) {
            throw new NotFoundException(`Décharge avec l'id "${id}" introuvable`);
        }

        return decharge;
    }

    private escapeHtml(value?: string): string {
        if (!value) {
            return '';
        }

        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private async getLogoDataUri(): Promise<string | null> {
        const candidatePaths = [
            path.join(process.cwd(), 'uploads', 'LogoNAFTAL.svg.png'),
            path.join(process.cwd(), 'backend', 'uploads', 'LogoNAFTAL.svg.png'),
            path.join(process.cwd(), 'uploads', 'File_Logo_NAFTAL.svg'),
            path.join(process.cwd(), 'backend', 'uploads', 'File_Logo_NAFTAL.svg'),
        ];

        for (const logoPath of candidatePaths) {
            try {
                const content = await readFile(logoPath);
                const ext = path.extname(logoPath).toLowerCase();
                const mimeType = ext === '.svg' ? 'image/svg+xml' : 'image/png';
                return `data:${mimeType};base64,${content.toString('base64')}`;
            } catch {
                // Try next candidate path.
            }
        }

        return null;
    }

    private buildDechargeHtml(decharge: Decharge, logoDataUri: string | null): string {
        const createdAt = new Date(decharge.createdAt);
        const date = createdAt.toLocaleDateString('fr-FR');
        const [referenceNumber = '-', referenceYear = String(createdAt.getFullYear())] =
            (decharge.reference || '').split('/');
        const isHard = decharge.maintenanceType === 'HARD';
        const isSoft = decharge.maintenanceType === 'SOFT';

        const itemRows = [...decharge.items];

        const rowsHtml = itemRows
            .map(
                (item) => `
                            <tr>
                                <td class="col-designation">${this.escapeHtml(item.designation)}</td>
                                <td class="col-qt">${item.quantity > 0 ? item.quantity : ''}</td>
                                <td class="col-marque">${this.escapeHtml(item.marque)}</td>
                                <td class="col-serie">${this.escapeHtml(item.numeroSerie)}</td>
                                <td class="col-inv">${this.escapeHtml(item.numeroInventaire)}</td>
                            </tr>
                        `,
            )
            .join('');

        return `
            <!doctype html>
            <html lang="fr">
                <head>
                    <meta charset="utf-8" />
                    <style>
                        @page { size: A4; margin: 12mm; }
                        * { box-sizing: border-box; }
                        body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; margin: 0; }
                        .sheet { width: 100%; }
                        .top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                        .logo { min-height: 56px; display: flex; align-items: center; }
                        .logo-img { width: 190px; max-height: 56px; object-fit: contain; }
                        .org { margin-top: 4px; font-size: 12px; line-height: 1.4; }
                        .title {
                            text-align: center;
                            font-size: 58px;
                            font-weight: 800;
                            font-style: italic;
                            letter-spacing: 1px;
                            margin: 8px 0 2px;
                            text-decoration: underline;
                            text-underline-offset: 6px;
                            text-decoration-thickness: 2px;
                        }
                        .ref { text-align: center; font-size: 24px; margin-bottom: 40px; }
                        .line {
                            margin: 8px 0;
                            font-size: 15px;
                            line-height: 1.5;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            gap: 12px;
                        }
                        .line-text { flex: 1; }
                        .intro-text { word-spacing: -1px; }
                        .intro-text-top, .intro-text-bottom { display: block; }
                        .checks-group { white-space: nowrap; }
                        .checks { margin-left: 10px; }
                        .doc-table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            margin-top: 10px;
                            table-layout: fixed;
                            border: 1px solid #000;
                            font-size: 12px;
                            color: #111;
                        }
                        .doc-table th,
                        .doc-table td {
                            padding: 8px 10px;
                            vertical-align: middle;
                            line-height: 1.3;
                            border: 0;
                        }
                        .doc-table tbody td {
                            padding: 4px 10px;
                            line-height: 1.15;
                        }
                        .doc-table thead th {
                            font-size: 13px;
                            font-weight: 700;
                            border-bottom: 1px solid #000;
                        }
                        .col-designation { text-align: left; width: 34%; }
                        .col-qt { text-align: center; width: 8%; }
                        .col-marque,
                        .col-serie,
                        .col-inv { text-align: center; }
                        .col-marque { width: 20%; }
                        .col-serie { width: 18%; }
                        .col-inv { width: 20%; }
                        .field { margin-top: 12px; font-size: 15px; }
                        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
                        .sig { width: 45%; }
                        .sig-title {
                            font-size: 16px;
                            font-weight: 700;
                            display: inline-block;
                            border-bottom: 1px solid #000;
                            padding-bottom: 2px;
                            margin-bottom: 8px;
                        }
                        .sig-subtitle {
                            font-size: 12px;
                            font-weight: 700;
                            margin-top: 2px;
                        }
                        .sig-line { margin: 8px 0; font-size: 14px; }
                        .name { font-size: 18px; font-weight: 700; margin-top: 28px; }
                    </style>
                </head>
                <body>
                    <div class="sheet">
                        <div class="top">
                            <div>
                                <div class="logo">${logoDataUri
                ? `<img class="logo-img" src="${logoDataUri}" alt="Logo Naftal" />`
                : 'NAFTAL'}</div>
                                <div class="org">
                                    Branche Commercialisation<br />
                                    District Commercialisation Alger<br />
                                    SCE S&amp;R &nbsp;&nbsp;&nbsp; DPT INFORMATIQUE
                                </div>
                            </div>
                            <div style="font-size:14px; margin-top:8px;">El Mohammadia le : <strong>${this.escapeHtml(date)}</strong></div>
                        </div>

                        <div class="title">DECHARGE</div>
                        <div class="ref">N <strong>${this.escapeHtml(referenceNumber)}</strong> /<strong>${this.escapeHtml(referenceYear)}</strong></div>

                        <div class="line">
                            <div class="line-text">
                                <span class="intro-text intro-text-top">Je soussigné: Reconnais avoir reçu à ce jour du DPT Informatique</span>
                                <span class="intro-text intro-text-bottom">Alger le matériel ci-dessous:</span>
                            </div>
                            <div class="checks-group">
                                <span class="checks">[${isHard ? 'x' : ' '}] HARD</span>
                                <span class="checks">[${isSoft ? 'x' : ' '}] SOFT</span>
                            </div>
                        </div>

                        <table class="doc-table">
                            <thead>
                                <tr>
                                    <th class="col-designation">Désignation</th>
                                    <th class="col-qt">QT</th>
                                    <th class="col-marque">Marque/Type</th>
                                    <th class="col-serie">N SERIE</th>
                                    <th class="col-inv">N INV</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>

                        <div class="field"><strong>Observation:</strong> ${this.escapeHtml(decharge.observation)}</div>
                        <div class="field"><strong>Destinataire:</strong> ${this.escapeHtml(decharge.destinataire)}</div>

                        <div class="signatures">
                            <div class="sig">
                                <div class="sig-title">LE RESPONSABLE</div>
                                <div class="sig-subtitle">LE CHEF DE SERVICE S&amp;R</div>
                            </div>
                            <div class="sig">
                                <div class="sig-title">LE RECEPTIONNAIRE</div>
                                <div class="sig-line"><strong>NOM:</strong> ${this.escapeHtml(decharge.receptionnaireNom)}</div>
                                <div class="sig-line"><strong>PRENOM:</strong> ${this.escapeHtml(decharge.receptionnairePrenom)}</div>
                                <div class="sig-line"><strong>FONCTION:</strong> ${this.escapeHtml(decharge.receptionnaireFonction)}</div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `;
    }

    async create(createDechargeDto: CreateDechargeDto, userId?: string) {
        return this.dechargesRepository.manager.transaction(async (manager) => {
            const dechargeRepository = manager.getRepository(Decharge);
            const itemRepository = manager.getRepository(DechargeItem);
            const userRepository = manager.getRepository(User);

            const reference = await this.generateReferenceForCurrentYear(dechargeRepository);

            let createdBy: User | undefined;
            if (userId) {
                const user = await userRepository.findOne({ where: { id: userId } });
                createdBy = user || undefined;
            }

            const decharge = dechargeRepository.create({
                reference,
                maintenanceType: createDechargeDto.maintenanceType,
                observation: createDechargeDto.observation,
                destinataire: createDechargeDto.destinataire,
                receptionnaireNom: createDechargeDto.receptionnaireNom,
                receptionnairePrenom: createDechargeDto.receptionnairePrenom,
                receptionnaireFonction: createDechargeDto.receptionnaireFonction,
                createdBy,
            });

            const savedDecharge = await dechargeRepository.save(decharge);

            const items = createDechargeDto.items.map((item) =>
                itemRepository.create({
                    designation: item.designation,
                    quantity: item.quantity,
                    marque: item.marque,
                    numeroSerie: item.numeroSerie,
                    numeroInventaire: item.numeroInventaire,
                    decharge: savedDecharge,
                }),
            );

            await itemRepository.save(items);

            const created = await this.baseQuery()
                .where('decharge.id = :id', { id: savedDecharge.id })
                .getOne();

            return {
                data: created as DechargeResponseDto,
                message: 'Décharge créée avec succès',
            };
        });
    }

    async findAll(): Promise<{ data: DechargeResponseDto[]; message: string }> {
        const data = await this.baseQuery().getMany();

        return {
            data: data as DechargeResponseDto[],
            message: 'Liste des décharges récupérée avec succès',
        };
    }

    async findOne(id: number): Promise<{ data: DechargeResponseDto; message: string }> {
        const decharge = await this.getDechargeOrFail(id);

        return {
            data: decharge as DechargeResponseDto,
            message: 'Décharge récupérée avec succès',
        };
    }

    async generatePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
        const decharge = await this.getDechargeOrFail(id);
        const logoDataUri = await this.getLogoDataUri();
        const html = this.buildDechargeHtml(decharge, logoDataUri);

        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle' });

            const buffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm',
                },
            });

            return {
                buffer,
                filename: `decharge-${decharge.reference.replace('/', '-')}.pdf`,
            };
        } finally {
            await browser.close();
        }
    }

    async remove(id: number): Promise<{ message: string }> {
        const decharge = await this.dechargesRepository.findOne({ where: { id } });

        if (!decharge) {
            throw new NotFoundException(`Décharge avec l'id "${id}" introuvable`);
        }

        await this.dechargesRepository.remove(decharge);

        return {
            message: 'Décharge supprimée avec succès',
        };
    }
}
