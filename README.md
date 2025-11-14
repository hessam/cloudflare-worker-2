# Cloudflare Worker - Performance Optimization

High-performance HTML optimization worker for seyahatmarket.com that implements advanced performance optimizations without WordPress plugins.

## Features

- ✅ Non-render-blocking CSS loading
- ✅ Image optimization with fetchpriority="high" for LCP images
- ✅ Preconnect hints for critical external domains
- ✅ Aggressive caching headers
- ✅ Resource preload hints
- ✅ Gravity Forms compatibility
- ✅ Admin bar removal for non-logged users

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API Token:**
   Add your Cloudflare API token to `.env` file:
   ```
   CLOUDFLARE_API_TOKEN=your_token_here
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## Deployment

### Option 1: Using npm script (recommended)
```bash
npm run deploy
```

### Option 2: Direct wrangler command
```bash
wrangler deploy
```

### Option 3: Using deploy script directly
```bash
./deploy.sh
```

## Development

Start local development server:
```bash
npm run dev
```

## Routes

The worker is configured for:
- `seyahatmarket.com/*`
- `www.seyahatmarket.com/*`

## Performance Optimizations

### CSS Optimization
- Converts render-blocking CSS to non-blocking with `media="print"` + `onload` swap
- Preserves critical Gravity Forms styles

### Image Optimization
- Adds `fetchpriority="high"` to LCP-critical images
- Elementor images and non-lazy images get priority

### Caching Strategy
- Images: 1 year cache
- CSS/JS/Fonts: 1 month cache
- HTML: 1 hour cache

### Resource Hints
- Preconnect to Google Fonts and payment gateways
- Preload critical theme and plugin resources

## Security

- API tokens are stored in `.env` file (gitignored)
- Never commit sensitive credentials to version control
