#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# BiblioFlow – Initialize Git repository with GitFlow branches
# Autora: Isabella UCC | juanguillermomarinco@gmail.com
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "🚀 Initializing BiblioFlow Git repository..."

# Configure author
git config user.name "Isabella UCC"
git config user.email "juanguillermomarinco@gmail.com"

# Init if not already a repo
if [ ! -d ".git" ]; then
  git init
  echo "✓ Git repository initialized"
fi

# Initial commit on main
git add .
git commit -m "chore: initial project structure

BiblioFlow - Sistema Integral de Gestión Bibliotecaria
Clean Architecture + Microservices + GitFlow

Autora: Isabella UCC
Co-Authored-By: Claude <noreply@anthropic.com>"

# Rename to main (in case default is master)
git branch -M main
echo "✓ main branch created"

# Create develop branch (GitFlow base)
git checkout -b develop
git push -u origin develop 2>/dev/null || echo "  (remote not set yet, push manually)"
echo "✓ develop branch created"

# Return to main
git checkout main

echo ""
echo "✅ Repository initialized with GitFlow structure!"
echo ""
echo "Next steps:"
echo "  1. Create remote:  gh repo create juanguillermomarinco/biblioflow --private"
echo "  2. Push to GitHub: git remote add origin https://github.com/juanguillermomarinco/biblioflow.git"
echo "                     git push -u origin main"
echo "                     git push -u origin develop"
echo "  3. Set branch protection rules for main and develop in GitHub settings"
