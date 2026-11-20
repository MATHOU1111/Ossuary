# 🌙 Ossuary

Petit jeu multijoueur 2D en pixel art, façon Blablaland, dans une citadelle gothique de nuit.
On se balade, on grimpe partout, on discute, on fait des actions ; l'XP vient uniquement du temps passé en jeu (2 XP / 30 s, dans `ui.js` → `tickProgress`) et les pièces d'or des reliques.

---

## 1. Installation (une seule fois)

1. Installe **Node.js** (version 18 ou plus récente, prends la version « LTS ») : <https://nodejs.org>
2. Ouvre le dossier `nocturne` dans **VS Code** (`Fichier > Ouvrir le dossier…`).
3. Ouvre un terminal dans VS Code (`Terminal > Nouveau terminal`) et tape :

```bash
npm install
```

Ça télécharge la seule dépendance du projet (`ws`, pour le temps réel).

## 2. Lancer le jeu

```bash
npm run dev
```

Puis ouvre **<http://localhost:3000>** dans ton navigateur.

- `npm run dev` : redémarre le serveur tout seul quand tu modifies un fichier de `server/`.
  Pour le jeu (`public/`), il suffit de **recharger la page** (F5).
- `npm start` : lancement « normal », sans redémarrage automatique.
- `npm run build:single` : crée `dist/ossuary.html`, tout le jeu dans un seul fichier jouable sans serveur.
- Le terminal affiche aussi une adresse **« Sur le réseau »** (ex. `http://192.168.1.20:3000`) :
  les autres PC et téléphones de ta maison peuvent jouer avec cette adresse.
  Si ça ne marche pas, autorise Node.js dans le pare-feu Windows quand il le demande.
- Changer de port : `PORT=8080 npm start` (Mac/Linux) ou `set PORT=8080 && npm start` (Windows cmd).

**Tester le multijoueur tout seul** : ouvre deux fenêtres de navigateur (dont une en navigation privée) sur `http://localhost:3000`,
avec deux comptes différents (un même compte ne peut être connecté qu'à un seul endroit à la fois).

> Ouvrir directement `public/index.html` (double-clic) marche aussi : les comptes sont alors gardés dans le navigateur,
> et seuls les onglets du même navigateur se voient.

## 2 bis. Comptes, menu et boutique

Comme sur Blablaland, le jeu n'est **pas en plein écran** : c'est un site, avec le jeu (« le lecteur ») au milieu.

- **Barre du haut** : **Boutique** · **JOUER** (en gros, au centre) · **Profil**, et le compte à droite (connexion / déconnexion).
- **Colonne de gauche** : ton personnage animé, niveau, XP, or, et les raccourcis du compte (Garde-robe, Boutique, Carnet, Options du compte).
- **Colonne de droite** : joueurs en ligne, commandes, astuce. (Les colonnes se replient sur les petits écrans.)
- **Au centre**, une page à la fois : Accueil (nouveautés), Boutique, Profil (Garde-robe, Carnet, Compte) ou le lecteur.

En arrivant, **le jeu n'est pas lancé**. Un clic sur **JOUER** fait apparaître le lecteur avec un écran de chargement
(personnages, connexion au serveur…), puis la partie démarre. Jouer sans être connecté ouvre la fenêtre de connexion.
Pendant une partie, Boutique et Profil s'ouvrent à la place du lecteur : ton personnage reste dans le monde, et JOUER y ramène.
Pour arrêter : rouage en haut à droite du jeu → **Quitter la partie**.
Profil → **Compte** : son, changement de mot de passe (ferme les sessions ouvertes sur les autres appareils), déconnexion.

- Les comptes sont enregistrés par le serveur : dans **MongoDB** si `MONGODB_URI` est rempli dans le fichier `.env`
  (voir « Mise en production »), sinon dans `data/comptes.json` (pratique sur ton PC). Les mots de passe sont hachés (scrypt), jamais en clair.
- Chaque compte garde : pseudo, mot de passe haché, sessions, **rôle** (`joueur` ou `admin`), apparence (personnage, couleur, accessoire),
  options (son), progression (XP, niveau, or, objets, salles, reliques), amis / messages / clan.
- **Admins** : les pseudos listés dans `ADMINS=` (fichier `.env`) sont admin à chaque démarrage. Un admin voit **Administration**
  dans la colonne de gauche : liste des comptes (niveau, or, dernière visite, en jeu ou non) et bouton pour nommer / retirer un admin.
  Le rôle est vérifié par le serveur à chaque appel ; un joueur ne peut pas se le donner.
- Le serveur vérifie tout ce qui compte : pseudo affiché, couleur et accessoire portés, achats (prix, niveau, or).
  Un joueur ne peut pas se donner un objet ou se faire passer pour un autre. L'XP et les pièces d'or gagnés en jouant sont
  acceptés avec un plafond par sauvegarde (protection simple, pas une vraie anti-triche).
- La progression que tu avais avant les comptes (dans ce navigateur) est reprise automatiquement à la création
  du premier compte ; les objets achetés sont remboursés en pièces d'or.
- Mot de passe oublié : il n'y a pas encore de récupération ; supprime le compte (serveur arrêté) dans `data/comptes.json`,
  ou dans MongoDB : `db.joueurs.deleteOne({ _id: "pseudo-en-minuscules" })`.


## 2 ter. Le cinéma

Dépose un film dans `public/films/` sous le nom `film.mp4` (MP4 H.264 + AAC conseillé), puis recharge la page.
En jeu : depuis la Clairière des Lucioles, va à gauche jusqu'au **Cinéma en plein air** → va au projecteur (sur la souche, à droite de l'écran) et appuie sur E. L'écran est une toile tendue entre deux arbres, dont les racines grimpent sur les bords ; on s'assoit sur le grand tronc couché ou sur les plaids du premier rang.
**Séance commune** : le serveur garde l'horloge du film (en lecture ou non, à quelle seconde, en boucle ou non, dans `data/seance.json`). Tout le monde voit le même moment, même en arrivant en cours de film, et la position est recalée toutes les 3 s. **Seuls les admins** la pilotent depuis le projecteur : lancer, pause, ±10 s, barre de lecture, et **🔁 En boucle** pour un film qui tourne en continu. Les joueurs voient l'état de la séance et peuvent la rejoindre. On peut aussi choisir un film sur son ordinateur depuis la cabine : il n'est visible que par soi (bouton « Revenir à la séance commune »).

Changer le film en production : copie le fichier sur le serveur (il ne passe pas par git), puis relance la séance depuis le projecteur (avec un compte admin) :

```powershell
scp C:\chemin\vers\mon-film.mp4 mathis@192.168.1.133:/tmp/film.mp4
ssh mathis@192.168.1.133 "sudo install -o ossuary -g ossuary -m 644 /tmp/film.mp4 /opt/ossuary/public/films/film.mp4 && rm /tmp/film.mp4"
```

(Même chose pour des sous-titres : `film.srt`. Les déploiements automatiques ne touchent jamais à `public/films/`.)

Sous-titres : dépose `film.srt` (ou `film.vtt`) à côté du film, ils se chargent tout seuls. La cabine permet de les couper, de les décaler de ±0,5 s ou d'en choisir d'autres. Le minutage du film s'affiche sous l'écran.

Assis dans un fauteuil, une petite barre apparaît dans le coin de l'écran (survole l'écran pour la faire revenir) : plein écran, son du film (coupure + volume, mémorisé) et sous-titres. Double-clic sur l'écran : plein écran.

## 2 quater. Les affiches du cinéma

Au cinéma en plein air, un panneau en bois « PROCHAINEMENT » montre les affiches, l'enseigne est suspendue sous les branches au-dessus de l'écran, et il y a un chaudron à popcorn.
Tout vient de `config/affiches.json` (servi par le serveur sur `/api/affiches`, relu à chaque visite : pas besoin de redémarrer) :

```json
{ "cinema": "CINE OSSUARY", "bandeau": "SEANCES TOUS LES SOIRS A MINUIT",
  "affiches": [ { "titre": "…", "sortie": "12 décembre", "genre": "…", "resume": "…",
                  "image": "affiches/mon-film.jpg", "couleur": "#7a1a2a", "motif": "lune" } ] }
```

- `image` : une image dans `public/affiches/` (portrait 2:3 conseillé). Laisse vide pour une affiche pixel art générée avec `couleur` + `motif` (lune, corbeau, masque, lanterne, chateau).
- Les 2 premières affiches vont sur le panneau ; toutes apparaissent dans le programme (touche E devant le panneau). `cinema` est le nom écrit sur l'enseigne ; `bandeau` n'est plus affiché.
- Ce fichier est prévu pour être modifié par la future interface d'administration.

## 2 quinquies. Les catacombes (la partie en 3D)

Salle du trône → portrait → Caveau → grille des **Catacombes**. On y passe en vue à la première personne
(flèches ou ZQSD pour avancer et tourner, E pour remonter quand on est à la porte).

- **5 reliques** y sont cachées chaque jour, aux mêmes endroits pour tous les joueurs, et changent de place le lendemain.
  Chacune rapporte des pièces d'or, avec un bonus pour les 5.
- Une relique trouvée pour la première fois est exposée pour toujours sur son socle, dans le Caveau.
- **Le Gardien**, un spectre, fait sa ronde : s'il te touche, tu repars de l'entrée. On l'entend approcher (battements de cœur).
- Les autres joueurs présents sont visibles en 3D, et la carte en haut à droite se dessine au fil de l'exploration.
- Réglages en tête de `catacombes.js` : `CAT_SEED` (forme du labyrinthe), `FP_SPEED`, `GHOST_SPEED`, `RELIC_XP`, `RELIC_SHARDS`.

## 2 sexies. Le supermarché (courses envoyées au drive)

À gauche du cinéma : **Le Marché**, une supérette en bois. On entre par la porte vitrée et on arrive dans
**Le Supermarché**, en 3D (flèches ou ZQSD). Code : `public/js/marche.js` (salles et 3D) et `public/js/courses.js` (caddie, rayons, caisse).

- Devant un rayon, **E** ouvre la liste des produits : + / − pour remplir le caddie. On peut aussi chercher dans tout le magasin.
- Le caddie est gardé dans le navigateur du joueur : on peut sortir et revenir le finir plus tard.
- À une **caisse**, E récapitule le caddie, puis :
  - **Envoyer au drive avec Claude** ouvre claude.ai avec la liste toute prête. Le connecteur **Carrefour** officiel de Claude
    (à activer une fois : Paramètres → Connecteurs → Carrefour) remplit le vrai panier drive. On choisit ensuite son créneau et on paie sur carrefour.fr ;
  - **Copier la liste**, et les liens ↗ qui cherchent chaque produit sur carrefour.fr, pour faire sans Claude.
- Pourquoi passer par Claude : le serveur Carrefour qui sait remplir un panier n'accepte que Claude (il refuse les autres applications).
  Le jeu ne peut donc pas remplir le panier directement, et ne demande jamais les identifiants Carrefour des joueurs.
- **Le catalogue** est dans `config/supermarche.json` : nom du drive (`magasin`), rayons et produits (nom, format, prix **indicatif**, rayon).
  Il est relu à chaque visite, sans redémarrer. Les vrais prix et la disponibilité sont ceux du drive au moment de commander.
- Le plan du magasin (une lettre par case) est la grille `MAP` en tête de la partie 3D de `marche.js`.

## 3. Organisation du projet

```
nocturne/
├── server/
│   ├── index.js        Serveur : sert le jeu + relaie positions, chat et actions (WebSocket /ws)
│   ├── config.js       Réglages lus dans .env (MongoDB, admins, port…) — modèle : .env.example
│   ├── stockage.js     Où sont rangés comptes et clans : MongoDB ou data/comptes.json
│   ├── comptes.js      Comptes joueurs : inscription, connexion, progression, achats, options, rôles et routes admin
│   └── social.js       Amis, messages privés, clans
├── deploy/             Exemples pour le serveur : service systemd et configuration nginx
├── config/
│   └── affiches.json   Les affiches du cinéma (titre, date de sortie, résumé, image…)
├── public/             Tout ce qui tourne dans le navigateur
│   ├── index.html      La page : zone de jeu, panneau du bas, écran de connexion, menu, aide
│   ├── films/          Dépose ici ton film : film.mp4 (voir LISEZ-MOI.txt)
│   ├── affiches/       Images des affiches (voir LISEZ-MOI.txt)
│   ├── css/style.css   Style des fenêtres (boutique, aide), du chat, de la carte XP et du rouage
│   └── js/             Le jeu, découpé dans l'ordre de chargement :
│       ├── core.js       Canvas 384×216, utilitaires, couleurs, police pixel
│       ├── audio.js      Le son, généré par le navigateur : ambiances, musique, bruitages
│       ├── world.js      Outils de dessin communs + la salle du trône
│       ├── chateau.js    « Le Château » : porte-donjon gothique, chaîne à grimper, porte vers la salle du trône
│       ├── place.js      « La Clairière des Lucioles » (salle d'arrivée) : forêt de nuit, lune, fanions, fontaine, grand chêne à grimper (caméra verticale), tableau d'accueil, bancs
│       ├── portes.js     Les portes entre salles (arche lumineuse)
│       ├── sommet.js     « Le Sommet » : la cime du grand chêne (la lune, la forêt à perte de vue, la rivière d'argent)
│       ├── affiches.js   Les affiches du cinéma : chargement, dessin en pixel art, fiche et programme
│       ├── caveau.js     Le trône qui se soulève + « Le Caveau » en dessous (vide pour l'instant)
│       ├── catacombes.js « Les Catacombes » : labyrinthe en 3D (vue à la première personne), reliques du jour, le Gardien
│       ├── critters.js   Les petites bêtes : chats, chauves-souris, rats, papillons de nuit
│       ├── cinema.js     « Le Cinéma en plein air » : écran entre deux arbres, racines, gradin, projecteur (vidéo synchronisée, sous-titres)
│       ├── scaphandre.js Le personnage « Prospecteur » (combinaison, hublot, carte)
│       ├── sprites.js    Chargeur de personnages en feuilles de sprites PNG (public/skins/) + « Ancien (dessiné) »
│       ├── character.js  Le petit encapuchonné : animations, rendu pixel par pixel, accessoires
│       ├── physics.js    Marche, saut, plateformes, escalade
│       ├── state.js      Joueur, PNJ (Morwen, Aldric, Ysolde, Bertrand, Lysandre), répliques et trajets
│       ├── regles.js     Catalogue de la boutique + règles des comptes (partagé avec le serveur)
│       ├── ui.js         XP, niveaux, actions, chat, panneau
│       ├── compte.js     Le compte côté navigateur : connexion, sauvegarde de la progression
│       ├── hud.js        Interface en jeu : barre du bas pixel art (chat, petit menu Objets / Actions, niveau / XP / or), rouage des options en haut à droite
│       ├── interact.js   Touche E : traverser une porte, parler à un PNJ
│       ├── phoenix.js    La monture : le phénix noir (vol, ailes, queue de braise)
│       ├── net.js        Connexion au serveur (ou entre onglets en local)
│       ├── input.js      Clavier et saisie du chat
│       ├── game.js       Boucle de jeu : mise à jour + rendu de chaque image
│       ├── menu.js       Le site autour du jeu : barre du haut, colonnes, pages (accueil, boutique, profil), connexion, chargement de la partie
│       └── main.js       Taille du lecteur (selon la colonne du centre), boucle principale
├── tools/build-single.js  Génère dist/ossuary.html (tout le jeu en un seul fichier)
├── data/               Les comptes joueurs (comptes.json, créé automatiquement : à sauvegarder !)
└── package.json
```

Les fichiers de `public/js/` sont des scripts classiques chargés dans l'ordre par `index.html` :
une variable déclarée dans un fichier est visible dans les suivants.

## 4. Où modifier quoi

| Je veux…                                   | Fichier          | Chercher                          |
|--------------------------------------------|------------------|-----------------------------------|
| Ajouter / déplacer une plateforme          | `world.js`       | `plats`                           |
| Ajouter une zone d'escalade                | `world.js`       | `climbs`                          |
| Changer les répliques des PNJ              | `state.js`       | `LINES_BY`                        |
| Ajouter une action (bouton + animation)    | `ui.js` + `character.js` | `ACTIONS` puis `anim(`    |
| Ajouter un objet ou une couleur en boutique| `regles.js`      | `BOUTIQUE` (le serveur suit tout seul) |
| Carte du monde (salles, liaisons, vignettes) | `carte.js`    | `MAP_NODES`, `MAP_LINKS`, `mapThumb` |
| Or de départ, couleurs de base         | `regles.js`      | `ECLATS_DEPART`, `COULEURS_BASE`  |
| Dessiner un nouvel accessoire              | `character.js`   | `e.acc ===`                       |
| Régler l'XP gagnée / la courbe de niveaux  | `ui.js`          | `gainXP(`, `const need`           |
| Vitesse, hauteur de saut                   | `physics.js`     | `max = 80`, `e.vy = -285`         |
| Couleurs de capuche de départ              | `character.js`   | `SKINS`                           |
| Ajouter une porte vers une autre salle     | `portes.js` + la salle | `portals`                   |
| Faire parler un PNJ (touche E)             | `state.js`       | `p.talk`                          |
| Vitesse de vol / dessin du phénix          | `phoenix.js`     | `stepMount`, `phxDraw`            |
| Relier une salle au-dessus / en dessous    | `sommet.js`      | `.up = `, `down:`                 |
| Changer la musique d'une salle             | `audio.js`       | `SONGS`                           |
| Régler les ambiances (vent, pluie…)        | `audio.js`       | `AMB`                             |
| Réactiver les ambiances (coupées)          | `audio.js`       | `const AMBIANCE = false`          |
| Ajouter un bruitage                        | `audio.js`       | `const sfx`                       |
| Placer un chat / des chauves-souris        | `critters.js`    | `makeCat(`, `makeBats(`           |
| Faire voyager un PNJ entre deux salles     | `state.js`       | `ai.roam`                         |
| Affiches et prochaines sorties             | `config/affiches.json` | (lu à chaud, sans redémarrer) |
| Changer le film projeté                    | `public/films/` + `cinema.js` | `FILM_FILE`          |
| Sous-titres chargés par défaut             | `public/films/` + `cinema.js` | `SUBS_FILES`         |
| Taille / position de l'écran de cinéma     | `cinema.js`      | `SCREEN`                          |

⚠️ Si tu ajoutes une salle, une action ou un accessoire, ajoute aussi son identifiant dans les listes
`ROOMS` ou `ACTIONS` en haut de `server/index.js`, sinon le serveur l'ignorera (les accessoires, eux, viennent de `regles.js`).

## 5. Contrôles

`←` `→` / `Q` `D` marcher · `Maj` courir · `↓` en courant : glissade · `Espace` sauter · `X` attaquer · `C` tomber · `R` dégainer / rengainer (l'Ancien) · `↑` / `Z` grimper · `↓` / `S` descendre
`F` phénix noir (voler avec les flèches) · `M` couper / remettre le son · `Entrée` parler · `1` à `8` actions · `E` interagir (porte, trappe, PNJ) ou saluer

## 6. Ce qui reste à faire (prochaines étapes)

- **Anti-triche complet** : le serveur vérifie les achats et l'apparence, mais fait encore confiance au navigateur
  pour l'XP gagnée (avec un plafond). À terme, c'est le serveur qui calculera l'XP.
- **Mot de passe oublié / admin plus complet** : réinitialiser un mot de passe, gérer les affiches depuis la page Administration.
- **PNJ partagés** : chaque joueur a aujourd'hui ses propres PNJ ; à terme c'est le serveur qui les fera vivre.
- **Grand nombre de joueurs** : les comptes sont chargés en mémoire au démarrage (très bien jusqu'à quelques milliers) ;
  au-delà, il faudra lire les comptes dans MongoDB à la demande.

## Social : amis, messages privés, clans
Touche **O** (ou le bouton à gauche de la carte). Nécessite le serveur (`npm start`) : la version « un seul fichier » est hors ligne.
- **Amis** : demande par pseudo, acceptation / refus, statut en ligne et salle où se trouve l'ami.
- **Messages** : conversations privées ; un message envoyé à quelqu'un de hors ligne l'attend (25 max) à sa prochaine connexion. Dans le chat du jeu : `/mp pseudo message`, `/r message` (répondre).
- **Clan** : nom (3-16) + étiquette (2-4), 20 membres max, le chef invite et exclut, chat privé du clan (`/c message` dans le chat du jeu).
- Code : `server/social.js` (règles et sauvegarde dans `data/comptes.json`), `public/js/social.js` (panneau), messages `{ type: 'soc', a: … }` sur le WebSocket.

## 7. Mise en production (serveur avec MongoDB)

Exemple pour un serveur **Linux (Ubuntu / Debian)** où MongoDB tourne déjà. Remplace `ossuary.fr` par ton domaine
et les `MOT_DE_PASSE` par de vrais mots de passe.

**1. Créer une base et un utilisateur MongoDB pour le jeu** (sur le serveur, dans `mongosh` connecté en admin) :

```js
use ossuary
db.createUser({ user: "ossuary", pwd: "MOT_DE_PASSE", roles: [{ role: "readWrite", db: "ossuary" }] })
```

Le jeu ne peut alors lire / écrire que sa propre base. Vérifie que MongoDB n'écoute que localement
(`bindIp: 127.0.0.1` dans `/etc/mongod.conf`) et que le port 27017 n'est pas ouvert sur Internet.

**2. Installer Node.js 18+ et copier le jeu** :

```bash
sudo apt install -y nodejs npm            # ou la version LTS depuis https://nodejs.org (node -v doit afficher 18 ou plus)
sudo useradd --system --create-home ossuary
sudo mkdir -p /opt/ossuary && sudo chown ossuary: /opt/ossuary
# copie le dossier du projet dans /opt/ossuary (git clone, scp, rsync… sans node_modules), puis :
cd /opt/ossuary && sudo -u ossuary npm ci --omit=dev
```

**3. Créer le fichier `.env`** (copie de `.env.example`) :

```bash
sudo -u ossuary cp .env.example .env && sudo -u ossuary nano .env && sudo chmod 600 .env
```

```ini
MONGODB_URI=mongodb://ossuary:MOT_DE_PASSE@127.0.0.1:27017/ossuary?authSource=ossuary
MONGODB_DB=ossuary
ADMINS=TonPseudo
PORT=3000
HOST=127.0.0.1
TRUST_PROXY=1
```

(Si le mot de passe MongoDB contient des caractères spéciaux comme `@ : / ? #`, encode-les : `@` → `%40`, etc.)

**4. Premier lancement, pour vérifier** : `sudo -u ossuary npm start`.
Le terminal doit afficher `Ossuary est lancé ! (… compte·s, MongoDB (base « ossuary »))`.
Si tu as copié ton `data/comptes.json` dans `/opt/ossuary/data/`, les comptes sont **repris automatiquement** dans MongoDB
au premier démarrage (seulement si la base est vide). Ctrl+C pour arrêter.

**5. Le faire tourner en permanence** (redémarre tout seul, et au démarrage du serveur) :

```bash
sudo cp deploy/ossuary.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now ossuary
sudo journalctl -u ossuary -f        # voir les messages du jeu
```

**6. Nom de domaine + HTTPS avec nginx** : fais pointer le domaine (enregistrement A) vers l'IP du serveur, puis :

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/ossuary     # remplace ossuary.fr dedans
sudo ln -s /etc/nginx/sites-available/ossuary /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ossuary.fr -d www.ossuary.fr
sudo ufw allow 'Nginx Full'                 # si le pare-feu ufw est actif ; ne pas ouvrir 3000 ni 27017
```

HTTPS est indispensable en ligne : sans lui, les mots de passe et les jetons de session circulent en clair.

**7. Devenir admin** : crée ton compte sur le site avec le pseudo mis dans `ADMINS` (ou, s'il existe déjà, redémarre :
`sudo systemctl restart ossuary`). « Administration » apparaît dans la colonne de gauche ; tu peux y nommer d'autres admins.

**8. Sauvegardes** (une par nuit, gardées 14 jours) — `sudo crontab -e` puis ajoute :

```
0 4 * * * mongodump --uri="mongodb://ossuary:MOT_DE_PASSE@127.0.0.1:27017/ossuary?authSource=ossuary" --archive=/var/backups/ossuary-$(date +\%F).gz --gzip && find /var/backups -name 'ossuary-*.gz' -mtime +14 -delete
```

Restaurer : `mongorestore --uri="…" --archive=/var/backups/ossuary-AAAA-MM-JJ.gz --gzip --drop`.

**Mettre à jour le jeu** : recopie les fichiers, `npm ci --omit=dev`, puis `sudo systemctl restart ossuary`
(le jeu enregistre tout dans MongoDB avant de s'arrêter).

## 8. Déploiement automatique (GitHub Actions)

À chaque `git push` sur `main`, GitHub lance `.github/workflows/deployer.yml` (à la racine du dépôt, un niveau au-dessus de ce dossier) **sur le serveur lui-même**
(runner auto-hébergé, étiquette `ossuary`) : vérification du code, puis `/usr/local/sbin/ossuary-deployer`
(copie de [deploy/deployer.sh](deploy/deployer.sh), appartenant à root). Ce script :

- copie le code dans `/opt/ossuary` sans toucher à `.env`, `data/`, `node_modules/` ni `public/films/` ;
- garde la version précédente dans `/opt/ossuary.precedent` ;
- réinstalle les dépendances si `package-lock.json` a changé, redémarre le service ;
- si le jeu ne répond pas dans les 20 s, **revient tout seul à la version précédente** (le job GitHub apparaît alors en échec).

Le dépôt GitHub doit rester **privé** : un runner auto-hébergé exécute le code des workflows sur ton serveur.

Mise en place (une fois, sur le serveur) :

```bash
# 1. le script de déploiement (root) + une règle sudo limitée à ce seul script
sudo install -o root -g root -m 755 deploy/deployer.sh /usr/local/sbin/ossuary-deployer
echo 'mathis ALL=(root) NOPASSWD: /usr/local/sbin/ossuary-deployer' | sudo tee /etc/sudoers.d/ossuary-deployer >/dev/null
sudo chmod 440 /etc/sudoers.d/ossuary-deployer && sudo visudo -c

# 2. un runner dédié au dépôt (à côté de celui d'un autre projet, sans le toucher)
#    jeton : GitHub → dépôt → Settings → Actions → Runners → New self-hosted runner (Linux x64)
mkdir ~/actions-runner-ossuary && cd ~/actions-runner-ossuary
tar xzf ~/actions-runner/actions-runner-linux-x64-*.tar.gz
./config.sh --url https://github.com/UTILISATEUR/DEPOT --token LE_JETON --name serveur-ossuary --labels ossuary --unattended
sudo ./svc.sh install && sudo ./svc.sh start
```

Si `deploy/deployer.sh` change dans le dépôt, il faut le recopier à la main (étape 1) : un push ne peut pas modifier un script qui tourne en root.
