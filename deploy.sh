#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check if token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN not found in .env file"
    echo "Please add your Cloudflare API token to .env file:"
    echo "CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

echo "🚀 Deploying Cloudflare Worker..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
