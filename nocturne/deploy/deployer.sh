#!/bin/bash
# Déploiement d'Ossuary sur le serveur, appelé par GitHub Actions (.github/workflows/deployer.yml).
# Installé sur le serveur dans /usr/local/sbin/ossuary-deployer (appartient à root : un push ne peut pas le modifier),
# et autorisé pour l'utilisateur du runner par une règle sudo limitée à ce seul script.
#
# - copie le code du dépôt dans /opt/ossuary SANS toucher à .env, data/, node_modules/ ni public/films/ (les films du serveur) ;
# - garde la version en place dans /opt/ossuary.precedent ;
# - réinstalle les dépendances si package-lock.json a changé, redémarre le jeu ;
# - si le jeu ne répond pas dans les 20 secondes : retour automatique à la version précédente.
set -euo pipefail
APP=/opt/ossuary
PREC=/opt/ossuary.precedent
RUNNER_WORK=/home/mathis/actions-runner-ossuary/_work
EXCL=(--exclude '.git/' --exclude '.github/' --exclude '.env' --exclude 'data/' --exclude 'node_modules/' --exclude 'public/films/' --exclude 'dist/')

SRC=$(realpath -e "${1:?usage: ossuary-deployer <dossier du dépôt>}")
case "$SRC/" in "$RUNNER_WORK"/*) ;; *) echo "Source refusée : $SRC (doit être dans $RUNNER_WORK)"; exit 1 ;; esac
[ -f "$SRC/server/index.js" ] && [ -f "$SRC/package.json" ] || { echo "Ce dossier ne ressemble pas à Ossuary."; exit 1; }

installer() {   # $1 = dossier source ; copie le code, droits, dépendances
  rsync -a --delete "${EXCL[@]}" "$1/" "$APP/"
  chown -R ossuary:ossuary "$APP"
  if [ "${2:-}" = force ] || [ ! -d "$APP/node_modules" ] || ! cmp -s "$APP/package-lock.json" "$PREC/package-lock.json"; then
    echo "Installation des dépendances…"; (cd "$APP" && sudo -u ossuary -H npm ci --omit=dev --no-audit --no-fund)
  fi
}
repond() { for _ in $(seq 1 20); do sleep 1; curl -fs -m 2 http://127.0.0.1:3000/api/statut >/dev/null && return 0; done; return 1; }

echo "Sauvegarde de la version en place → $PREC"
mkdir -p "$PREC"; rsync -a --delete "${EXCL[@]}" "$APP/" "$PREC/"

echo "Copie de la nouvelle version → $APP"
installer "$SRC"
systemctl restart ossuary
if repond; then echo "✔ Ossuary déployé et en ligne."; exit 0; fi

echo "✖ Le jeu ne répond pas après la mise à jour. Derniers messages :"
journalctl -u ossuary -n 25 --no-pager -o cat || true
echo "↩ Retour à la version précédente…"
installer "$PREC" force
systemctl restart ossuary
repond && echo "Version précédente remise en ligne." || echo "La version précédente ne répond pas non plus : regarde journalctl -u ossuary."
exit 1
