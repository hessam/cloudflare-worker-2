# GitHub Repository Setup for Cloudflare Worker 2

## 🚀 Step-by-Step Guide

### 1. Create New GitHub Repository
1. Go to https://github.com/new
2. Repository name: `cloudflare-worker-2`
3. Description: "HTML optimization worker for Cloudflare Account 2"
4. Make it **Private** or **Public** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 2. Push This Code to GitHub
```bash
# Copy the repository URL from GitHub
# Example: https://github.com/yourusername/cloudflare-worker-2.git

cd /workspaces/cloudflare-worker-2
git remote add origin https://github.com/YOUR_USERNAME/cloudflare-worker-2.git
git branch -M main
git push -u origin main
```

### 3. Set Up Second Cloudflare Account
1. Go to https://dash.cloudflare.com
2. **Sign in with your second account** (different email)
3. Create API token for this account:
   - Profile → API Tokens → Create Token
   - Use "Edit Cloudflare Workers" template
   - Copy the token

### 4. Configure Domains for Second Account
Edit `wrangler.toml` and add your domains:
```toml
routes = [
  "yoursite.com/*",
  "www.yoursite.com/*"
]
```

### 5. Deploy to Second Account
```bash
# Set the API token for the second account
export CLOUDFLARE_API_TOKEN="your-second-account-token-here"

# Install dependencies
npm install

# Test the code
npm test

# Deploy to second account
npm run deploy
```

### 6. Verify Deployment
```bash
# Check deployment status
wrangler deployments list

# Monitor live logs
wrangler tail

# Test your site
curl -I https://yoursite.com
# Should see: X-Optimized: cf-worker-v2
```

## 📁 Repository Structure

After setup, your repo will have:
```
cloudflare-worker-2/
├── index.js              # Worker code
├── wrangler.toml         # Cloudflare config
├── package.json          # Dependencies
├── test.js              # Validation tests
├── README.md            # Documentation
└── GITHUB-SETUP.md      # This setup guide
```

## 🔄 Managing Multiple Accounts

### Option 1: Separate Repos (Current Approach)
- `cloudflare-worker-1` → Account 1
- `cloudflare-worker-2` → Account 2
- Each has independent configuration
- Easy to customize per account

### Option 2: Single Repo with Branches
- Main branch for Account 1
- `account-2` branch for Account 2
- Use different `wrangler.toml` files
- Switch branches to deploy to different accounts

### Option 3: Environment Variables
- Single repo with multiple `wrangler.*.toml` files
- Use `wrangler deploy --config wrangler.account2.toml`
- Set different API tokens per environment

## 🛠️ Customization for Second Account

### Different Optimization Rules
If your second account's sites need different rules, modify `index.js`:

```javascript
// Example: Different limits for second account
this.maxMergedSize = 30000;    // Smaller limit
this.maxProcessed = 150;       // Fewer elements

// Different skip conditions
if (url.includes('/admin/') ||  // Different admin path
    url.includes('/custom-preview')) {
  return false;
}
```

### Site-Specific Configuration
Add per-domain logic:
```javascript
function shouldOptimize(request) {
  const url = request.url.toLowerCase();
  const hostname = new URL(request.url).hostname;
  
  // Different rules for different sites
  if (hostname === 'site1.com') {
    // Custom rules for site1
  } else if (hostname === 'site2.com') {
    // Custom rules for site2
  }
  
  // ... rest of logic
}
```

## 🔐 Security Notes

- **Keep API tokens secure** - never commit them to GitHub
- **Use environment variables** for tokens in CI/CD
- **Create separate tokens** per account/environment
- **Rotate tokens regularly** in Cloudflare dashboard

## 🚀 CI/CD Setup (Optional)

For automated deployments, add GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy Worker
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 📊 Monitoring Multiple Workers

```bash
# Check both workers
wrangler deployments list --account-id ACCOUNT_1_ID
wrangler deployments list --account-id ACCOUNT_2_ID

# Monitor logs (run in separate terminals)
wrangler tail --account-id ACCOUNT_1_ID
wrangler tail --account-id ACCOUNT_2_ID
```

## 🆘 Troubleshooting

### "Repository already exists"
- Choose a different name like `cloudflare-worker-account2`

### "Authentication failed"
- Double-check your API token
- Make sure you're using the token for the correct account
- Try regenerating the token

### "Routes not working"
- Verify domains are added to Cloudflare
- Check DNS is active (orange cloud)
- Wait 1-2 minutes after deployment

### "Worker not optimizing"
- Check `wrangler tail` for errors
- Verify routes in `wrangler.toml`
- Test in browser (curl may trigger security challenges)

## 📞 Support

- Original worker: https://github.com/hessam/cloudflare-worker-1
- Cloudflare Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

---

## ✅ Quick Checklist

- [ ] Created GitHub repo `cloudflare-worker-2`
- [ ] Pushed code: `git push -u origin main`
- [ ] Created API token for second account
- [ ] Configured routes in `wrangler.toml`
- [ ] Set `CLOUDFLARE_API_TOKEN`
- [ ] Ran `npm test` - all passed
- [ ] Deployed: `npm run deploy`
- [ ] Verified: `wrangler deployments list`
- [ ] Tested site: `curl -I https://yoursite.com`

**Ready to deploy!** 🎉
