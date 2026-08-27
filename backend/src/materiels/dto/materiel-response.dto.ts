export class ProprietaireResponseDto {
    id: string;
    nom: string;
    prenom: string;
    email: string;
}

export class MaterielResponseDto {
    numeroSerie: string;
    numeroInventaire?: string;
    etat: string;
    proprietaire?: ProprietaireResponseDto;
    marque?: string;
    modele?: string;
    dateEntree?: string;
    finGarontie?: string;
    categorie?: any;
    service?: any;
    department?: any;
    subsidiary?: any;
    utilisateur?: string;
}
