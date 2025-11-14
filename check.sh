#!/bin/bash

echo "🔍 Cloudflare Worker Diagnostics"
echo "=================================="

# Test URL - replace with your actual domain
TEST_URL="https://seyahatmarket.com"
WORKER_URL="https://cloudflare-worker-2.seyahat.workers.dev"

echo ""
echo "📊 Testing: $TEST_URL"
echo "🔧 Worker URL: $WORKER_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to check response headers
check_headers() {
    echo ""
    echo "🔍 Checking Response Headers:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Get headers
    HEADERS=$(curl -s -I "$TEST_URL" | head -20)

    # Check cache status
    CACHE_STATUS=$(echo "$HEADERS" | grep -i "cf-cache-status" | awk '{print $2}')
    if [ "$CACHE_STATUS" = "BYPASS" ]; then
        echo "❌ cf-cache-status: BYPASS - Worker optimizations may not apply!"
        echo "   💡 Fix: Check Cloudflare Page Rules/Cache Rules"
    elif [ "$CACHE_STATUS" = "HIT" ]; then
        echo "✅ cf-cache-status: HIT - Good caching!"
    elif [ "$CACHE_STATUS" = "MISS" ]; then
        echo "⚠️ cf-cache-status: MISS - First request, try again"
    else
        echo "ℹ️ cf-cache-status: $CACHE_STATUS"
    fi

    # Check worker headers
    WORKER_OPTIMIZED=$(echo "$HEADERS" | grep -i "x-optimized-by")
    if [ -n "$WORKER_OPTIMIZED" ]; then
        echo "✅ Worker Active: $(echo "$WORKER_OPTIMIZED" | awk '{print $2}')"
    else
        echo "❌ Worker Not Active - Check deployment"
    fi

    WORKER_CACHE=$(echo "$HEADERS" | grep -i "x-worker-cache")
    if [ -n "$WORKER_CACHE" ]; then
        echo "✅ Worker Cache: $(echo "$WORKER_CACHE" | awk '{print $2}')"
    fi
}

# Function to check HTML content
check_html() {
    echo ""
    echo "🔍 Checking Worker Direct URL:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if worker is working directly
    WORKER_HTML=$(curl -s "$WORKER_URL")
    if echo "$WORKER_HTML" | grep -q "Worker processed this page"; then
        echo "✅ Worker is ACTIVE and processing HTML!"
    else
        echo "❌ Worker is NOT processing HTML - check deployment"
        return
    fi

    echo ""
    echo "🔍 Checking Live Site HTML Optimizations:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Get HTML content from live site
    HTML=$(curl -s "$TEST_URL")

    # Check preconnect hints
    PRECONNECT_COUNT=$(echo "$HTML" | grep -c "preconnect")
    if [ "$PRECONNECT_COUNT" -ge 3 ]; then
        echo "✅ Preconnect hints: $PRECONNECT_COUNT found (GOOD!)"
    else
        echo "❌ Preconnect hints: $PRECONNECT_COUNT found (should be 3+)"
    fi

    # Check font optimization
    FONT_PRELOAD=$(echo "$HTML" | grep -c "preload.*font")
    if [ "$FONT_PRELOAD" -ge 1 ]; then
        echo "✅ Font preload: $FONT_PRELOAD found (GOOD!)"
    else
        echo "❌ Font preload: $FONT_PRELOAD found (should be 1+)"
    fi

    # Check for render-blocking fonts
    FONT_BLOCKING=$(echo "$HTML" | grep -c "fonts.googleapis.com/css.*rel=.stylesheet.")
    if [ "$FONT_BLOCKING" -eq 0 ]; then
        echo "✅ Render-blocking fonts: FIXED (none found)"
    else
        echo "❌ Render-blocking fonts: $FONT_BLOCKING still blocking"
    fi

    # Check image optimizations
    FETCHPRIORITY_HIGH=$(echo "$HTML" | grep -c 'fetchpriority="high"')
    if [ "$FETCHPRIORITY_HIGH" -ge 10 ]; then
        echo "✅ fetchpriority high: $FETCHPRIORITY_HIGH images (GOOD!)"
    else
        echo "⚠️ fetchpriority high: $FETCHPRIORITY_HIGH images (aim for 10+)"
    fi

    LAZY_LOADING=$(echo "$HTML" | grep -c 'loading="lazy"')
    if [ "$LAZY_LOADING" -ge 5 ]; then
        echo "✅ Lazy loading: $LAZY_LOADING images (GOOD!)"
    else
        echo "⚠️ Lazy loading: $LAZY_LOADING images (aim for 5+)"
    fi

    # Check script deferral
    DEFERRED_SCRIPTS=$(echo "$HTML" | grep -c "defer")
    if [ "$DEFERRED_SCRIPTS" -ge 10 ]; then
        echo "✅ Deferred scripts: $DEFERRED_SCRIPTS (EXCELLENT!)"
    else
        echo "⚠️ Deferred scripts: $DEFERRED_SCRIPTS (aim for 10+)"
    fi
}

# Function to run Lighthouse check
check_lighthouse() {
    echo ""
    echo "🔍 Lighthouse Performance Check:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if command -v lighthouse &> /dev/null; then
        echo "⏳ Running Lighthouse audit..."
        lighthouse "$TEST_URL" --output=json --output-path=./lighthouse-result.json --quiet --chrome-flags="--headless"

        # Extract key metrics
        SCORE=$(jq '.categories.performance.score * 100' lighthouse-result.json 2>/dev/null)
        FCP=$(jq '.audits["first-contentful-paint"].displayValue' lighthouse-result.json 2>/dev/null | tr -d '"')
        LCP=$(jq '.audits["largest-contentful-paint"].displayValue' lighthouse-result.json 2>/dev/null | tr -d '"')

        if [ -n "$SCORE" ]; then
            echo "📊 Performance Score: $SCORE/100"
            echo "⚡ First Contentful Paint: $FCP"
            echo "🎯 Largest Contentful Paint: $LCP"
        else
            echo "❌ Lighthouse failed - check manually"
        fi

        # Cleanup
        rm -f lighthouse-result.json
    else
        echo "ℹ️ Lighthouse not installed - install with: npm install -g lighthouse"
        echo "   Or check manually at: https://pagespeed.web.dev/"
    fi
}

# Run all checks
check_headers
check_html
check_lighthouse

echo ""
echo "📋 Summary & Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if echo "$WORKER_HTML" | grep -q "Worker processed this page"; then
    echo "✅ Worker deployed successfully and IS working!"
    echo "✅ HTML processing and optimizations are implemented"
    echo "❌ But optimizations not applied to live site"
    echo ""
    echo "🔧 ROUTING ISSUE: Worker not applied to domain routes"
    echo "   Go to: https://dash.cloudflare.com/ → Workers → Routes"
    echo "   Add routes: seyahatmarket.com/* and www.seyahatmarket.com/*"
    echo "   Assign to: cloudflare-worker-2"
else
    echo "❌ Worker deployment failed - check wrangler logs"
fi
echo ""
echo "🔧 After fixing routing:"
echo "   1. Purge Cloudflare cache: Caching → Purge Everything"
echo "   2. Wait 5-10 minutes for propagation"
echo "   3. Run this script again to verify"
echo ""
echo "🎯 Expected Results After Fix:"
echo "   ✅ cf-cache-status: HIT or DYNAMIC (not BYPASS)"
echo "   ✅ Preconnect hints: 4+ found"
echo "   ✅ Font preload: 2+ found"
echo "   ✅ Image fetchpriority: properly formatted (no extra text)"
echo "   ✅ Performance Score: 70+ (up from 50)"