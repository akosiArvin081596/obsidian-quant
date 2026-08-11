#!/bin/sh
# Reclaim the Next.js build cache (.next/cache) after a deploy.
#
# WHY THIS EXISTS
# ---------------
# /usr/local/bin/deploy-obsidian.sh never cleans anything, and one directory on
# this box grows without bound. Measured on the VPS:
#
#   .next              491M
#   .next/cache        480M   <- effectively all of it
#   .next/cache/webpack 480M  <- effectively all of THAT
#   .next/server         6.5M
#   .next/static         2.9M
#
# So the actual build output is ~11M and the webpack filesystem cache is ~480M of
# accumulated cruft from every deploy that ever ran here. It is not self-pruning:
# webpack keeps stale entries across builds, and nothing else removes them. On a
# shared host that is already at 82% of a 96G root and runs many unrelated
# services, that is real headroom being sat on for no benefit.
#
# node_modules (792M) is deliberately NOT touched: `npm ci` already deletes and
# recreates it on every deploy, so it churns but does not grow. The cache is the
# only part that only ever gets bigger.
#
# RUN THIS *AFTER* `npm run build`, NOT BEFORE
# --------------------------------------------
# Either ordering costs exactly one warm build, but only one of them actually
# frees disk:
#
#   Prune BEFORE the build - the build that runs seconds later regenerates the
#     cache from scratch, so the deploy ENDS at the same ~480M it started at.
#     You pay for a cold build and reclaim nothing in steady state. Strictly the
#     worse trade, and the intuitive-looking one, which is why it is called out
#     here.
#
#   Prune AFTER the build - the build that just ran got the full benefit of the
#     warm cache, and the footprint then drops to ~11M and STAYS there for the
#     whole idle window between deploys, which is exactly when the other services
#     on this box need the headroom. The cost is that the NEXT build starts cold.
#
# Peak usage during a build is identical either way; only the idle footprint
# differs, and pruning after the build is the only ordering that lowers it.
# Deploys here are infrequent and a cold `next build` costs on the order of a
# minute, so trading that for ~480M of permanent headroom is worth it. If you
# would rather keep most builds warm and merely cap the growth, set
# PRUNE_IF_OVER_MB (see below) instead of moving the call.
#
# Placement matters for a second reason: deploy-obsidian.sh runs `set -euo
# pipefail`, so calling this immediately after `npm run build` means a FAILED
# build aborts the script before the prune and leaves the cache intact, keeping
# the retry warm. That is the behaviour you want.
#
# WIRING IT IN (owner step, root-owned and edited by hand, outside this repo)
# --------------------------------------------------------------------------
# Add one line to /usr/local/bin/deploy-obsidian.sh, directly after the build:
#
#     npm run build                       # prisma generate && next build
#     /var/www/obsidian-quant/deploy/prune-next-cache.sh      # <-- add this
#
# It is committed executable, so the checkout is enough - no chmod on the host.
# Dry-run it once first:  DRY_RUN=1 /var/www/obsidian-quant/deploy/prune-next-cache.sh
#
# SAFETY
# ------
# This only ever removes $APP_DIR/.next/cache. It NEVER touches .next/ itself:
# that holds the compiled server/static output the running `next start` is
# serving, and deleting it takes the site down until the next successful build.
# The script refuses to run if the resolved path does not end in /.next/cache.
#
# One caveat if it ever appears: .next/cache/images is the next/image optimizer's
# RUNTIME output (not present today - the cache is all webpack). Clearing it is
# safe, but images get re-optimised on demand afterwards. That is another reason
# to run this inside the deploy window, where pm2 is reloading anyway, instead of
# from a midday cron.
#
# Env knobs:
#   APP_DIR           app root (default /var/www/obsidian-quant; or pass as $1)
#   PRUNE_IF_OVER_MB  only prune when the cache exceeds this many MB (default 0 =
#                     always). Set e.g. 250 to keep most builds warm while still
#                     bounding growth.
#   DRY_RUN=1         report what would be removed, remove nothing.

set -eu

APP_DIR="${1:-${APP_DIR:-/var/www/obsidian-quant}}"
PRUNE_IF_OVER_MB="${PRUNE_IF_OVER_MB:-0}"
DRY_RUN="${DRY_RUN:-0}"

log() { echo "[prune-next-cache] $*"; }

# Guard against an empty/rooted APP_DIR turning the rm below into something
# catastrophic.
case "$APP_DIR" in
    "" | "/")
        log "ERROR: refusing to operate on APP_DIR='$APP_DIR'"
        exit 1
        ;;
esac

CACHE_DIR="$APP_DIR/.next/cache"

# Belt and braces: whatever the caller passed, the thing we delete must be a
# .next/cache. If this ever fails, the bug is in APP_DIR, not here.
case "$CACHE_DIR" in
    */.next/cache) ;;
    *)
        log "ERROR: refusing to delete '$CACHE_DIR' - not a .next/cache path"
        exit 1
        ;;
esac

# Idempotent / safe to re-run: nothing to do is a success, not an error. This is
# the normal path on a first deploy, or on any run after the previous one.
if [ ! -e "$CACHE_DIR" ]; then
    log "nothing to do: $CACHE_DIR does not exist"
    exit 0
fi

if [ -L "$CACHE_DIR" ]; then
    log "ERROR: $CACHE_DIR is a symlink; refusing to follow it out of the tree"
    exit 1
fi

if [ ! -d "$CACHE_DIR" ]; then
    log "ERROR: $CACHE_DIR exists but is not a directory; leaving it alone"
    exit 1
fi

# Size before. Tolerate du racing a concurrent build rather than aborting the
# deploy over a bookkeeping number.
SIZE_MB="$(du -sm "$CACHE_DIR" 2>/dev/null | awk 'NR==1{print $1}')"
[ -n "${SIZE_MB:-}" ] || SIZE_MB=0

if [ "$PRUNE_IF_OVER_MB" -gt 0 ] && [ "$SIZE_MB" -le "$PRUNE_IF_OVER_MB" ]; then
    log "keeping cache: ${SIZE_MB}MB is at or under the ${PRUNE_IF_OVER_MB}MB threshold"
    exit 0
fi

if [ "$DRY_RUN" != "0" ]; then
    log "DRY RUN: would remove $CACHE_DIR and reclaim ~${SIZE_MB}MB"
    exit 0
fi

rm -rf "$CACHE_DIR"

# next build recreates .next/cache on its own; we deliberately do not recreate it
# here, so an empty directory is never mistaken for a warm cache.
if [ -e "$CACHE_DIR" ]; then
    log "ERROR: $CACHE_DIR still present after removal"
    exit 1
fi

log "reclaimed ${SIZE_MB}MB from $CACHE_DIR (.next build output left untouched)"
