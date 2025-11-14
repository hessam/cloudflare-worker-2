#!/bin/bash

source .env

ZONE_ID="6c7c438b30a47158617368cdb3619c9d"

# Delete first route
echo "Deleting route: www.seyahatmarket.com/*"
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes/768e98683aae4180adbe62ce34a55c18" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "Deleting route: seyahatmarket.com/*"
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes/76fa00188c2a4cb68bceefd0f5e40eae" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Worker routes deleted. Checking remaining routes..."
curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result'
