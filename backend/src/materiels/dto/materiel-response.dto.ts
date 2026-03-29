export class ProprietaireResponseDto {
    id: string;
    nom: string;
    prenom: string;
    email: string;
}

export class MaterielResponseDto {
    numeroSerie: string;
    etat: string;
    proprietaire: ProprietaireResponseDto;
    marque?: string;
    modele?: string;
    dateEntree?: string;
    categorie?: any;
    department?: any;
}
