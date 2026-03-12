# Slack Notifications Setup Guide

## Overview

The CuraLive CI/CD pipeline is configured to send real-time notifications to Slack when tests pass or fail. This guide walks you through setting up the webhook.

## Prerequisites

- Access to your Slack workspace (as an admin or with app management permissions)
- Access to the GitHub repository settings
- A Slack channel where you want to receive notifications (e.g., #engineering, #deployments)

## Step-by-Step Setup

### 1. Create a Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter App Name: `CuraLive CI/CD`
5. Select your workspace
6. Click **"Create App"**

### 2. Enable Incoming Webhooks

1. In the left sidebar, click **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to ON
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., #engineering)
5. Click **"Allow"**
6. Copy the **Webhook URL** (looks like `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)

### 3. Add Webhook to GitHub Secrets

1. Go to your GitHub repository: https://github.com/davecameron187-sys/curalive-platform
2. Click **Settings** (top right)
3. In the left sidebar, click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**
5. Name: `SLACK_WEBHOOK_URL`
6. Value: Paste the webhook URL from Step 2
7. Click **"Add secret"**

### 4. Test the Integration

1. Make a commit and push to `main` or `develop` branch
2. Go to the **Actions** tab in GitHub
3. Watch the test suite run
4. When complete, check your Slack channel for a notification

## Notification Format

**On Success:**
```
✅ Chorus.AI Test Suite Passed
All Tests Passed ✨
Branch: main | Tests: 760 passed
```

**On Failure:**
```
❌ Chorus.AI Test Suite Failed
Test Suite Failed 🚨
Branch: main | Commit: abc123def456
```

## Troubleshooting

### Webhook URL not working
- Verify the URL is copied correctly (no extra spaces)
- Check that the Slack channel still exists
- Regenerate a new webhook URL if needed

### Notifications not appearing
- Verify the secret is added correctly in GitHub Settings → Secrets
- Check that the GitHub Actions workflow file is correct (`.github/workflows/test.yml`)
- Look at the Actions tab to see if the workflow ran successfully

### Wrong channel receiving notifications
- Delete the old webhook from Slack API
- Create a new webhook pointing to the correct channel
- Update the GitHub secret with the new webhook URL

## Customizing Notifications

To modify the notification format, edit `.github/workflows/test.yml`:

```yaml
- name: Notify Slack on success
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Your custom message here",
        "blocks": [...]
      }
```

## Security Notes

- Never commit the webhook URL to the repository
- Always use GitHub Secrets to store sensitive values
- Webhook URLs should be treated like API keys
- Rotate webhooks periodically for security

## Support

For issues with Slack webhooks, see [Slack API Documentation](https://api.slack.com/messaging/webhooks)

For GitHub Actions issues, see [GitHub Actions Documentation](https://docs.github.com/en/actions)
