# 🔒 Snyk Quick Reference

## 🚀 Quick Setup (5 minutes)

### 1. Get Snyk Token
1. Go to [snyk.io](https://snyk.io) → Login/Sign up with GitHub
2. Click profile → **Account Settings** → **API Token**
3. Copy your token

### 2. Add to GitHub
1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SNYK_TOKEN`
4. Value: [paste your token]
5. Click **Add secret**

### 3. Done! ✅
Push your code and Snyk will automatically scan on every:
- Push to main/develop/feat branches
- Pull request
- Daily at 2 AM UTC

## 📋 NPM Scripts

```bash
# Check for vulnerabilities (high severity+)
npm run security:check

# Monitor project in Snyk dashboard
npm run security:monitor

# Scan your source code for security issues
npm run security:code
```

## 🔍 View Results

| Location | What You See |
|----------|--------------|
| **GitHub Actions** | Full scan logs and artifacts |
| **Security Tab** | All vulnerabilities with details |
| **PR Comments** | Quick summary of findings |
| **Snyk Dashboard** | Trends and historical data |

## 🎯 Severity Levels

| Level | Icon | Action |
|-------|------|--------|
| Critical | 🔴 | Fix immediately |
| High | 🟠 | Fix within days |
| Medium | 🟡 | Fix when possible |
| Low | 🟢 | Monitor |

## 🛠️ Common Commands

```bash
# Install Snyk CLI globally
npm install -g snyk

# Authenticate
snyk auth

# Test dependencies
snyk test

# Test source code
snyk code test

# Fix vulnerabilities automatically
snyk fix

# Monitor project (sends results to dashboard)
snyk monitor

# Get help
snyk --help
```

## 🔧 Quick Fixes

### Update vulnerable package
```bash
npm update [package-name]
```

### Auto-fix with npm
```bash
npm audit fix
```

### Fix with Snyk
```bash
snyk fix
```

## 📊 Understanding Output

```
✗ High severity vulnerability found in lodash
  Prototype Pollution [SNYK-JS-LODASH-567746]
  Introduced through: lodash@4.17.11
  Fixed in: 4.17.12
  
  Fix: npm update lodash
```

**What this means:**
- **Package**: lodash version 4.17.11 is vulnerable
- **Issue**: Prototype Pollution attack possible
- **Fix**: Update to version 4.17.12 or higher

## 🚫 Ignoring Vulnerabilities

Only ignore if you have a good reason!

### Temporary ignore (in .snyk file)
```yaml
ignore:
  SNYK-JS-PACKAGE-ID:
    - '*':
      reason: 'Not exploitable in our use case'
      expires: '2025-12-31T00:00:00.000Z'
```

### CLI ignore
```bash
snyk ignore --id=SNYK-JS-PACKAGE-ID --reason="Reason here" --expiry=2025-12-31
```

## 📈 Best Practices

1. ✅ Fix Critical and High severity first
2. ✅ Keep dependencies updated regularly
3. ✅ Review Snyk PRs promptly
4. ✅ Don't ignore without documentation
5. ✅ Run locally before pushing
6. ✅ Enable Snyk in IDE (VS Code extension available)

## ⚡ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Token not found" | Check `SNYK_TOKEN` secret is set correctly |
| "Too many vulns" | Start with `--severity-threshold=critical` |
| "Rate limit" | Free tier has limits, reduce scan frequency |
| "False positive" | Add to `.snyk` ignore list with reason |

## 🔗 Useful Links

- **Docs**: [docs.snyk.io](https://docs.snyk.io/)
- **Dashboard**: [app.snyk.io](https://app.snyk.io/)
- **VS Code Extension**: Search "Snyk Security" in Extensions
- **Status**: [status.snyk.io](https://status.snyk.io/)

## 📞 Need Help?

1. Check [SNYK_SETUP.md](../SNYK_SETUP.md) for detailed guide
2. Visit [Snyk Support](https://support.snyk.io/)
3. Ask in [GitHub Discussions](https://github.com/snyk/snyk/discussions)

---

**Pro Tip**: Enable Snyk VS Code extension for real-time vulnerability detection while coding! 🚀

