# Guide d'Installation et de Déploiement sur un Nouveau Serveur

**Système de Gestion de Parc Informatique NAFTAL**

Ce guide détaille pas à pas la procédure d'installation et de configuration de l'application sur un serveur Windows, ainsi que sa mise à disposition sur le réseau local (LAN) pour l'ensemble des postes clients.

---

## 1. Prérequis Système

Installez les logiciels suivants sur la machine hôte (serveur) :

1. **Node.js (Version LTS 20 ou supérieure)**
   * Télécharger depuis : [https://nodejs.org/](https://nodejs.org/)
   * Vérifier l'installation dans l'invite de commandes (**CMD**) :
     ```cmd
     node -v
     npm -v
     ```

2. **MySQL Server (Version 8.0 ou supérieure)**
   * Lors de la configuration de l'instance (**Type and Networking**) :
     * Sélectionner le profil : **Server Computer**
     * Port par défaut : `3306`
   * Définir le mot de passe du superutilisateur `root` sur : `root` (ou conserver celui que vous définirez).

---

## 2. Configuration et Restauration de la Base de Données

1. Ouvrez l'invite de commandes (**CMD**) et connectez-vous au moteur MySQL :
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   ```
   *(Saisissez le mot de passe `root`)*

2. Créez la base de données :
   ```sql
   CREATE DATABASE naftal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

3. Importez les schémas et données via le fichier `dump.sql` (situé à la racine du projet) :
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p naftal < dump.sql
   ```

4. Attribuez les privilèges complets (Rôle Administrateur et Permissions) :
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p naftal
   ```
   Exécutez les requêtes suivantes dans l'interface interactive :
   ```sql
   -- Affecter le rôle Admin (ID = 1) au compte principal
   UPDATE users SET roleId = 1 WHERE email = 'rachid.lounas@natfal.dz';

   -- Assigner l'intégralité des permissions système
   INSERT IGNORE INTO users_permissions_permissions (usersId, permissionsId) 
   SELECT 'cb0660d2-8271-45da-801f-6d851bc4535a', id FROM permissions;

   EXIT;
   ```

---

## 3. Identification de l'Adresse IP du Serveur

Pour permettre l'accès réseau depuis les autres postes de travail :

1. Dans **CMD**, exécutez :
   ```cmd
   ipconfig
   ```
2. Notez l'adresse **IPv4** de la carte réseau active (exemple : `192.168.1.100`).
   > **Recommandation :** Attribuez une adresse IP statique (fixe) à la carte réseau du serveur afin d'éviter tout changement d'adresse après redémarrage.

---

## 4. Déploiement des Composants Applicatifs

### A. Configuration du Backend (NestJS)

1. Rendez-vous dans le dossier `backend/`.
2. Créez ou ajustez le fichier `.env` avec les valeurs suivantes :
   ```env
   PORT=3001
   HOST=localhost
   DB_PORT=3306
   USERNAMEDB=root
   PASSWORD=root
   DATABASE=naftal

   JWT_ACCESS_SECRET=super_secret_access_key_naftal_2026
   JWT_REFRESH_SECRET=super_secret_refresh_key_naftal_2026
   ```
3. Installez les dépendances et compilez le binaire de production :
   ```cmd
   cd backend
   npm install
   npm run build
   ```

### B. Configuration du Frontend (React)

1. Rendez-vous dans le dossier `frontend/`.
2. Modifiez le fichier `.env` pour pointer vers l'adresse IP du serveur sur le réseau (et non `localhost`) :
   ```env
   REACT_APP_API_URL=http://192.168.1.100:3001
   PORT=3000
   ```
   *(Remplacez `192.168.1.100` par l'IP réelle du serveur identifiée à l'étape 3).*
3. Installez les paquets et générez le livrable statique :
   ```cmd
   cd ../frontend
   npm install
   npm run build
   ```

---

## 5. Configuration du Pare-feu Windows (Firewall)

Les ports `3000` (interface web) et `3001` (API backend) doivent être autorisés en trafic entrant :

1. Ouvrez **PowerShell** en tant qu'administrateur (**Exécuter en tant qu'administrateur**).
2. Exécutez les directives d'ouverture de ports :
   ```powershell
   New-NetFirewallRule -DisplayName "Naftal Frontend 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Naftal Backend 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

---

## 6. Exécution en Arrière-plan via PM2

1. Revenez à la racine du projet et exécutez le script d'automatisation :
   ```cmd
   script-run.bat
   ```
   *Alternativement, exécutez manuellement les commandes suivantes :*
   ```cmd
   cd backend
   npx pm2 start dist/main.js --name backend
   npx pm2 save

   cd ../frontend
   npx pm2 start node --name frontend -- node_modules/serve/build/main.js -s build -l 3000
   npx pm2 save
   ```

2. Pour auditer l'état des services en exécution :
   ```cmd
   npx pm2 status
   ```

---

## 7. Démarrage Automatique au Lancement de Windows

1. Appuyez sur **Touche Windows + R**, saisissez :
   ```text
   shell:startup
   ```
2. Créez un raccourci ou copiez le fichier **`start-naftal.bat`** dans ce répertoire.
   > **Note :** Vérifiez que le chemin d'accès absolu spécifié à l'intérieur de `start-naftal.bat` correspond bien à l'emplacement réel du projet sur ce nouveau serveur.

---

## 8. Accès à la Plateforme

* **En local (sur la machine serveur) :**
  * URL : `http://localhost:3000`
* **Depuis tout autre poste connecté au réseau local :**
  * URL : `http://192.168.1.100:3000` *(en adaptant l'IP)*
