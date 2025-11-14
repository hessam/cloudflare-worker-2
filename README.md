# Cloudflare Worker - HTML Optimizer (Account 2)

High-performance HTML optimization worker for Cloudflare's second account. This worker optimizes HTML pages by removing unnecessary elements, merging styles, and applying performance best practices.

## 🚀 Quick Setup for New Account

### 1. Configure Your Domains
Edit `wrangler.toml` and uncomment the routes section:
```toml
routes = [
  "yoursite.com/*",
  "www.yoursite.com/*"
]
```

### 2. Set API Token for Second Account
```bash
export CLOUDFLARE_API_TOKEN="your-second-account-token"
```

### 3. Deploy
```bash
npm install
npm test
npm run deploy
```

## 📋 Features

- ✅ **Removes unused elements**: Admin bar CSS, duplicate resources, empty meta tags
- ✅ **Merges inline styles**: Combines multiple `<style>` tags with minification
- ✅ **Smart filtering**: Skips admin pages, bots, non-HTML requests
- ✅ **Performance limits**: Circuit breakers prevent excessive CPU usage
- ✅ **Preserves critical resources**: Doesn't touch analytics, GTM, critical CSS

## 🔧 Configuration

### Per-Site Customization
The worker is designed to be configurable per site. You can modify these settings in `index.js`:

```javascript
// Adjust these values for your sites
this.maxMergedSize = 50000;    // Max 50KB merged styles
this.maxProcessed = 200;       // Max 200 elements processed
const circuitBreaker = 50;     // Max 50ms processing time
```

### Skip Conditions
Currently skips:
- `/wp-admin/` pages
- `/wp-login.php`
- URLs with `preview=true`
- `.xml` and `.json` files
- `/api/` endpoints
- Bot user agents

## 🧪 Testing

```bash
# Run validation tests
npm test

# Start local development server
npm run dev

# Test with curl
curl http://localhost:8787 -v
```

## 📊 Monitoring

After deployment, monitor your worker:
```bash
# View live logs
wrangler tail

# Check deployments
wrangler deployments list
```

## 🔄 Differences from Account 1

This repo is a fork of the original worker with these differences:
- Worker name: `cloudflare-worker-2`
- Separate GitHub repository
- Independent deployment and configuration
- Can have different optimization rules if needed

## 📚 Documentation

- `test.js` - Validation tests
- `README.md` - This file
- Original repo: https://github.com/hessam/cloudflare-worker-1

## 🚀 Deployment Checklist

- [ ] Configure routes in `wrangler.toml`
- [ ] Set `CLOUDFLARE_API_TOKEN` for second account
- [ ] Run `npm test` - all tests pass
- [ ] Deploy with `npm run deploy`
- [ ] Verify deployment with `wrangler deployments list`
- [ ] Test live site for `X-Optimized` header
- [ ] Monitor with `wrangler tail`

## 🆘 Troubleshooting

**403 Errors**: Sites may have Cloudflare security enabled - test in browser
**No Optimization**: Check routes are configured and active
**Errors**: Run `wrangler tail` to see live logs

## 📞 Support

Based on the original worker from Account 1. See the original repo for detailed documentation and troubleshooting guides.
