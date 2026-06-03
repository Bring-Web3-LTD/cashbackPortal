#!/usr/bin/env bash
# Deploy the portal (iframe content) and/or the dev-wrapper shell.
#
# Usage:
#   ./deploy.sh            # deploy both portal and wrapper
#   ./deploy.sh portal     # deploy the portal app only
#   ./deploy.sh wrapper    # deploy the dev-wrapper shell only
#
# Deploy targets (S3 bucket + CloudFront distribution id) are read from
# .env.deploy, which is gitignored. See .env.deploy.example for the template.
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env.deploy ]]; then
  echo "error: dev-wrapper/.env.deploy not found." >&2
  echo "       Copy .env.deploy.example to .env.deploy and fill in the values." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env.deploy
set +a

deploy_target() {
  local dist_dir="$1" bucket="$2" distribution="$3"
  aws s3 sync "$dist_dir" "s3://$bucket" --delete \
    --exclude index.html \
    --cache-control "public,max-age=31536000,immutable"
  aws s3 cp "$dist_dir/index.html" "s3://$bucket/index.html" \
    --cache-control "no-cache" \
    --content-type "text/html; charset=utf-8"
  aws cloudfront create-invalidation --distribution-id "$distribution" --paths "/*"
}

deploy_portal() {
  : "${PORTAL_BUCKET:?set PORTAL_BUCKET in .env.deploy}"
  : "${PORTAL_DIST:?set PORTAL_DIST in .env.deploy}"
  echo "==> Building and deploying portal -> $PORTAL_BUCKET"
  yarn --cwd .. build
  deploy_target ../dist "$PORTAL_BUCKET" "$PORTAL_DIST"
}

deploy_wrapper() {
  : "${WRAPPER_BUCKET:?set WRAPPER_BUCKET in .env.deploy}"
  : "${WRAPPER_DIST:?set WRAPPER_DIST in .env.deploy}"
  echo "==> Building and deploying wrapper -> $WRAPPER_BUCKET"
  yarn build
  deploy_target dist "$WRAPPER_BUCKET" "$WRAPPER_DIST"
}

case "${1:-all}" in
  portal) deploy_portal ;;
  wrapper) deploy_wrapper ;;
  all) deploy_portal; deploy_wrapper ;;
  *) echo "usage: $0 [portal|wrapper|all]" >&2; exit 2 ;;
esac

echo "Done."
