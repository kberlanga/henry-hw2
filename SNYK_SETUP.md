# Snyk Security Setup Guide

This document explains how to configure and use Snyk for automated security vulnerability detection in the CloudTech Monitoring project.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Usage](#usage)
- [Understanding Results](#understanding-results)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

Snyk is a security platform that helps find, fix, and prevent vulnerabilities in your code, dependencies, containers, and infrastructure as code.

Our implementation includes:
- **Snyk Open Source**: Scans npm dependencies for known vulnerabilities
- **Snyk Code**: Static Application Security Testing (SAST) for your source code
- **Automated Monitoring**: Daily scans and continuous tracking
- **GitHub Integration**: Results appear in Security tab and PR comments

## ✨ Features

### 1. Automated Scanning
- ✅ Runs on every push to main/develop/feature branches
- ✅ Checks all pull requests
- ✅ Daily scheduled scans at 2 AM UTC
- ✅ Real-time vulnerability detection

### 2. Multiple Scan Types
- **Open Source Dependencies**: Identifies vulnerable packages in package.json
- **Code Analysis**: Detects security issues in your JavaScript code
- **Continuous Monitoring**: Tracks vulnerabilities over time

### 3. GitHub Integration
- Results uploaded to GitHub Security tab
- Automated PR comments with vulnerability summaries
- SARIF format for Code Scanning alerts

### 4. Severity Levels
- 🔴 **Critical**: Immediate action required
- 🟠 **High**: Should be fixed soon
- 🟡 **Medium**: Fix when possible
- 🟢 **Low**: Monitor and consider fixing

## 🚀 Setup Instructions

### Step 1: Create Snyk Account

1. Go to [https://snyk.io/](https://snyk.io/)
2. Sign up with your GitHub account
3. Authorize Snyk to access your repositories

### Step 2: Get Snyk API Token

1. Log into your Snyk account
2. Navigate to **Account Settings** (click your profile icon)
3. Scroll to **API Token** section
4. Click **Show** to reveal your token
5. Copy the token (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SNYK_TOKEN`
5. Value: Paste your Snyk API token
6. Click **Add secret**

### Step 4: Enable GitHub Code Scanning (Optional)

1. Go to **Settings** → **Security** → **Code scanning**
2. Enable Code scanning alerts
3. This allows Snyk results to appear in the Security tab

### Step 5: Commit and Push

The workflow is already configured! Just commit your changes:

```bash
git add .github/workflows/snyk-security.yml .snyk SNYK_SETUP.md
git commit -m "feat: add Snyk security scanning"
git push origin develop
```

## ⚙️ Configuration

### Workflow File

Location: `.github/workflows/snyk-security.yml`

Key configurations:
```yaml
# Trigger conditions
on:
  push:
    branches: [main, master, develop, 'feat/**']
  pull_request:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Snyk Policy File

Location: `.snyk`

Customize scanning behavior:
```yaml
# Ignore specific vulnerabilities
ignore:
  SNYK-VULN-ID:
    - '*':
      reason: 'Explain why it is safe to ignore'
      expires: '2025-12-31T00:00:00.000Z'

# Severity threshold
language-settings:
  javascript:
    severity-threshold: high  # Options: low, medium, high, critical
```

### Severity Threshold

You can adjust what triggers failures:
- `low`: Report all vulnerabilities
- `medium`: Ignore low severity
- `high`: Only report high and critical (current setting)
- `critical`: Only report critical

Edit in `.github/workflows/snyk-security.yml`:
```yaml
args: --severity-threshold=high
```

## 📊 Usage

### Viewing Results

#### 1. GitHub Actions
- Go to **Actions** tab in your repository
- Click on the latest **Snyk Security Scan** workflow
- View logs and download artifacts

#### 2. GitHub Security Tab
- Go to **Security** → **Code scanning alerts**
- View all detected vulnerabilities
- Filter by severity, status, etc.

#### 3. PR Comments
When you create a pull request, Snyk automatically comments with:
- Number of vulnerabilities by severity
- Quick summary of findings
- Link to detailed results

#### 4. Snyk Dashboard
- Visit [https://app.snyk.io/](https://app.snyk.io/)
- View all monitored projects
- Track vulnerability trends over time

### Artifacts

Each scan produces downloadable artifacts:
- `snyk-code.sarif`: Code analysis results
- `snyk-opensoure.json`: Dependency vulnerabilities (JSON)
- `snyk-report.md`: Human-readable summary

### Manual Scan (Local)

Install Snyk CLI:
```bash
npm install -g snyk
```

Authenticate:
```bash
snyk auth
```

Run scans:
```bash
# Test dependencies
snyk test

# Test code
snyk code test

# Monitor project
snyk monitor
```

## 🔍 Understanding Results

### Vulnerability Format

```json
{
  "title": "Prototype Pollution",
  "severity": "high",
  "packageName": "lodash",
  "version": "4.17.11",
  "fixedIn": ["4.17.12"],
  "from": ["cloudtech-monitoring@1.0.0", "lodash@4.17.11"]
}
```

### Key Fields
- **title**: Name of the vulnerability
- **severity**: Risk level (critical/high/medium/low)
- **packageName**: Affected package
- **version**: Current vulnerable version
- **fixedIn**: Versions with the fix
- **from**: Dependency path

### CVSS Score

Snyk uses CVSS (Common Vulnerability Scoring System):
- **0.0**: None
- **0.1-3.9**: Low
- **4.0-6.9**: Medium
- **7.0-8.9**: High
- **9.0-10.0**: Critical

## 🛡️ Best Practices

### 1. Fix High and Critical First
Focus on vulnerabilities with highest severity and easy fixes:
```bash
snyk fix --severity=high
```

### 2. Keep Dependencies Updated
Regularly update to latest secure versions:
```bash
npm audit fix
npm update
```

### 3. Review Automated PRs
Snyk can create PRs to fix vulnerabilities:
1. Enable in Snyk dashboard
2. Review and test before merging
3. Automated dependency updates

### 4. Don't Ignore Without Reason
When ignoring vulnerabilities:
- Document the reason clearly
- Set expiration dates
- Review periodically

### 5. Monitor Transitive Dependencies
Pay attention to vulnerabilities in nested dependencies:
```bash
snyk test --show-vulnerable-paths=all
```

### 6. Use Snyk in Development
Integrate Snyk into your workflow:
```bash
# Add to pre-commit hook
npm run snyk:test

# Add to package.json
"scripts": {
  "snyk:test": "snyk test",
  "snyk:monitor": "snyk monitor"
}
```

## 🔧 Troubleshooting

### Issue: "SNYK_TOKEN not found"

**Solution**: Make sure the secret is properly configured:
1. Check spelling: Must be exactly `SNYK_TOKEN`
2. Verify in Settings → Secrets → Actions
3. Re-add the secret if necessary

### Issue: "API rate limit exceeded"

**Solution**: 
- Snyk free tier has limits
- Reduce scan frequency in workflow
- Upgrade Snyk plan if needed

### Issue: "Too many vulnerabilities"

**Solution**:
1. Start with critical and high severity
2. Update dependencies: `npm update`
3. Use `npm audit fix` for automated fixes
4. Consider ignoring low-risk items with justification

### Issue: "False positives"

**Solution**:
1. Review the vulnerability details
2. Check if it applies to your usage
3. Add to `.snyk` ignore list with reason:
```yaml
ignore:
  SNYK-JS-PACKAGE-ID:
    - '*':
      reason: 'Not exploitable in our usage'
      expires: '2025-12-31T00:00:00.000Z'
```

### Issue: "Scan takes too long"

**Solution**:
- Exclude unnecessary directories in `.snyk`
- Run fewer scan types
- Use `continue-on-error` for non-critical jobs

### Issue: "SARIF upload failed"

**Solution**:
1. Ensure GitHub Advanced Security is enabled
2. Check repository permissions
3. Verify SARIF file is valid JSON

## 📚 Additional Resources

- [Snyk Documentation](https://docs.snyk.io/)
- [Snyk CLI Commands](https://docs.snyk.io/snyk-cli/cli-reference)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Snyk GitHub Action](https://github.com/snyk/actions)
- [CVE Database](https://cve.mitre.org/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

## 🆘 Support

- **Snyk Support**: [https://support.snyk.io/](https://support.snyk.io/)
- **Community**: [https://github.com/snyk/snyk/discussions](https://github.com/snyk/snyk/discussions)
- **Status**: [https://status.snyk.io/](https://status.snyk.io/)

## 📝 Changelog

- **2025-10-02**: Initial Snyk security setup
  - Added automated workflow
  - Configured dependency and code scanning
  - Added daily scheduled scans
  - Integrated with GitHub Security

---

**Last Updated**: October 2, 2025  
**Maintained By**: DevSecOps Team

