#!/usr/bin/env bash
set -euo pipefail

# Optional override:
#   SECURITY_OUT_DIR=/path/to/out ./scripts/security_scan.sh
#
# Default:
#   ~/SecurityScans/<repo_name>/<timestamp>/

timestamp="$(date +%Y%m%d_%H%M%S)"

# Determine repo name
repo_dir_name="$(basename "$(pwd)")"
repo_name="$repo_dir_name"
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  remote_url="$(git remote get-url origin 2>/dev/null || true)"
  # Extract last path component without .git (works for https and ssh)
  if [[ -n "${remote_url}" ]]; then
    repo_name="$(basename "${remote_url}")"
    repo_name="${repo_name%.git}"
  fi
fi

base_dir="${HOME}/SecurityScans/${repo_name}"
out_dir="${SECURITY_OUT_DIR:-${base_dir}/${timestamp}}"
latest_link="${base_dir}/latest"

mkdir -p "${out_dir}"

# Point latest -> current run dir (best effort; not fatal if it fails)
ln -snf "${out_dir}" "${latest_link}" 2>/dev/null || true

echo "[*] Output directory: ${out_dir}"
echo "[*] Repo: ${repo_name}"

echo "[*] gitleaks"
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect -v --redact --source . > "${out_dir}/GITLEAKS.txt" 2>&1 || true
else
  echo "gitleaks not installed. Install: brew install gitleaks" > "${out_dir}/GITLEAKS.txt"
fi

echo "[*] npm audit"
if [ -f package.json ] && command -v npm >/dev/null 2>&1; then
  npm audit --audit-level=moderate > "${out_dir}/NPM_AUDIT.txt" 2>&1 || true
else
  echo "npm audit skipped (no package.json or npm missing)" > "${out_dir}/NPM_AUDIT.txt"
fi

echo "[*] semgrep"
if command -v semgrep >/dev/null 2>&1; then
  semgrep scan --config p/ci --error > "${out_dir}/SEMGREP.txt" 2>&1 || \
  semgrep scan --config p/ci > "${out_dir}/SEMGREP.txt" 2>&1 || true
else
  echo "semgrep not installed. Install: brew install semgrep" > "${out_dir}/SEMGREP.txt"
fi

echo "[*] trivy"
if command -v trivy >/dev/null 2>&1; then
  trivy fs --scanners vuln,misconfig,secret --severity HIGH,CRITICAL --format table --output "${out_dir}/TRIVY.txt" . 2>&1 || true
else
  echo "trivy not installed. Install: brew install trivy" > "${out_dir}/TRIVY.txt"
fi

echo "[*] Done. Outputs in: ${out_dir}"
echo "[*] Latest symlink: ${latest_link}"
