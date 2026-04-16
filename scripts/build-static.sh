#!/bin/bash

# Build script for Capacitor iOS static export
# This script temporarily moves API routes out of the build path since
# Next.js static export doesn't support API routes.
# The API routes will still work on Vercel deployment.

set -e

echo "Starting Capacitor static build..."

# Create backup directory
mkdir -p .api-backup

# Move API routes out of the way
if [ -d "src/app/api" ]; then
    echo "Moving API routes to backup..."
    mv src/app/api .api-backup/
fi

# Run the static build
echo "Building static export..."
CAPACITOR_BUILD=true NEXT_PUBLIC_API_BASE_URL=https://bitelook.vercel.app npx next build

# Restore API routes
if [ -d ".api-backup/api" ]; then
    echo "Restoring API routes..."
    mv .api-backup/api src/app/
fi

# Cleanup
rmdir .api-backup 2>/dev/null || true

echo "Static build complete! Output in 'out/' directory."
