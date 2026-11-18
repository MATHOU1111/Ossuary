# Personnages en feuilles de sprites

Un personnage dessiné à la main = un dossier ici (`public/skins/<nom>/`) + un appel `defineSpriteSkin` à la fin de `public/js/sprites.js`
+ une ligne dans la liste `SKINS` de `public/js/regles.js`.

## Les images
- Une **bande horizontale** PNG par animation : `idle.png`, `run.png`, `attack.png`, `hurt.png`…
- Cellules **carrées de 96×96** (réglable avec `cell`), fond transparent, toutes de la même taille.
- Le personnage **regarde à droite** (le jeu le retourne pour la gauche).
- Les **pieds** sont toujours à la même ligne dans la cellule (ici : la ligne 82 ; réglable avec `y0`, `h`, `ox`, `oy`).
- Les images affichées sont celles de la zone `y0` → `y0 + h` de chaque cellule (ici 40 → 88) : tout dessin doit y tenir.

## Ce que le jeu en fait
| animation | utilisée pour |
|---|---|
| `idle` | à l'arrêt, saluer, émotions, grimper |
| `run` | marcher et courir (le rythme suit la vitesse au sol) ; deux images servent au saut (`air`) |
| `attack` | touche X ; `t: [...]` donne l'instant de départ de chaque image |
| `hurt` | touche C (tomber) |
| `crouch` | une image d'une autre animation qui sert pour s'asseoir, glisser, se réceptionner |

Manque une animation ? Le jeu retombe sur `idle`. Rien d'autre à écrire.

## Couleur du joueur
`tint: ['#1a1932', …]` liste les couleurs d'origine à remplacer : elles prennent la teinte choisie par le joueur
(la luminosité du dessin est conservée). Sans `tint`, le personnage garde ses couleurs.

## Limites
Les accessoires (couronne, écharpe…) ne s'affichent pas sur ces personnages, et le sabre à dégainer (R) n'existe que pour les personnages dessinés par le code.

## Exemple : le Nécromancien (`necro/`)
Ses planches d'origine avaient des cellules de 96 px (128 px pour l'attaque et l'apparition) : elles ont été recalées dans des cellules de **128×128** (`cell: 128`, `y0: 16`, `h: 66`, `ox: 68`, `oy: 64`).
L'animation d'attaque d'origine (47 images) a été raccourcie à 19 images, et l'idle (50) à 25. `spawn.png` (apparition, 20 images) est fournie mais pas encore utilisée.
