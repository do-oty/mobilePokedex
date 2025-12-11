#!/bin/bash
# Script to remove secrets from git history

SECRET_FILES="android/app/google-services.json android/app/debug.keystore ios/.xcode.env"

# Get the first commit (before secrets were added)
FIRST_COMMIT=$(git log --reverse --pretty=format:%H | head -1)

# Create a backup branch
git branch backup-before-secret-removal

# Use git filter-branch alternative: rewrite each commit
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch $SECRET_FILES" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "Secrets removed from git history. Run 'git push --force --all' to update remote."

