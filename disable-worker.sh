#!/bin/bash

# Load API token
source .env

# Get account ID
ACCOUNT_ID=$(curl -s "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Account ID: $ACCOUNT_ID"

# Get zone ID for seyahatmarket.com
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=seyahatmarket.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Zone ID: $ZONE_ID"

# List all routes for the worker
echo "Listing all routes..."
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[] | {id: .id, pattern: .pattern, script: .script}'
