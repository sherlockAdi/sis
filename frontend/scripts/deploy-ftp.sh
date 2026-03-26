#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${DIST_DIR:-dist}"

if [[ -f ".env.ftp" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.ftp"
  set +a
fi

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: $name" >&2
    exit 1
  fi
}

if ! command -v lftp >/dev/null 2>&1; then
  echo "lftp is required for FTP deploy." >&2
  echo "Install (macOS): brew install lftp" >&2
  exit 1
fi

require_env FTP_HOST
require_env FTP_USER
require_env FTP_PASS
require_env FTP_REMOTE_DIR

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Build output not found: $DIST_DIR" >&2
  echo "Run: npm run build" >&2
  exit 1
fi

FTP_PORT="${FTP_PORT:-}"
FTP_PROTOCOL="${FTP_PROTOCOL:-ftp}"   # ftp | ftps
FTP_PARALLEL="${FTP_PARALLEL:-4}"
FTP_DELETE="${FTP_DELETE:-1}"         # 1 = delete removed files on remote
FTP_INSECURE_TLS="${FTP_INSECURE_TLS:-0}" # 1 = do not verify TLS certificate (ftps only)

LFTP_TLS_SETTINGS=""
if [[ "$FTP_PROTOCOL" == "ftps" ]]; then
  LFTP_TLS_SETTINGS=$(
    cat <<'EOF'
set ftp:ssl-force true;
set ftp:ssl-protect-data true;
EOF
  )
  if [[ "$FTP_INSECURE_TLS" == "1" ]]; then
    LFTP_TLS_SETTINGS+=$'\n''set ssl:verify-certificate false;'
  fi
fi

LFTP_PORT_PART=""
if [[ -n "$FTP_PORT" ]]; then
  LFTP_PORT_PART=":$FTP_PORT"
fi

DELETE_FLAG=""
if [[ "$FTP_DELETE" == "1" ]]; then
  DELETE_FLAG="--delete"
fi

echo "Deploying '$DIST_DIR/' -> '${FTP_PROTOCOL}://${FTP_HOST}${LFTP_PORT_PART}${FTP_REMOTE_DIR}'"

# Notes:
# - mirror -R uploads local -> remote
# - --only-newer avoids re-uploading unchanged files (best effort)
# - --parallel improves speed
lftp -e "
set cmd:fail-exit true;
set net:max-retries 2;
set net:reconnect-interval-base 2;
set ftp:passive-mode true;
${LFTP_TLS_SETTINGS}
open -u \"${FTP_USER}\",\"${FTP_PASS}\" ${FTP_PROTOCOL}://${FTP_HOST}${LFTP_PORT_PART};
mkdir -p \"${FTP_REMOTE_DIR}\";
cd \"${FTP_REMOTE_DIR}\";
mirror -R ${DELETE_FLAG} --only-newer --parallel=${FTP_PARALLEL} \"${DIST_DIR}\" .;
bye;
"

echo "FTP deploy complete."
