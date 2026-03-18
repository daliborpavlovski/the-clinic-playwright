import type { Reporter, FullResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Stub Slack reporter — posts test summary to a Slack webhook on completion.
 * Set SLACK_WEBHOOK env var to enable.
 */
class SlackReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private total = 0;

  onTestEnd(_test: any, result: any) {
    this.total++;
    if (result.status === 'passed') this.passed++;
    else if (result.status === 'failed') this.failed++;
  }

  async onEnd(result: FullResult) {
    const webhookUrl = process.env.SLACK_WEBHOOK;
    if (!webhookUrl) return;

    const icon = result.status === 'passed' ? ':white_check_mark:' : ':x:';
    const message = {
      text: `${icon} *The Clinic App Tests* — ${result.status.toUpperCase()}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: [
              `${icon} *The Clinic App E2E Tests — ${result.status.toUpperCase()}*`,
              `✓ Passed: *${this.passed}*  ✗ Failed: *${this.failed}*  Total: *${this.total}*`,
              `Branch: \`${process.env.GITHUB_REF_NAME || 'local'}\``,
            ].join('\n'),
          },
        },
      ],
    };

    const body = JSON.stringify(message);
    const url = new URL(webhookUrl);

    await new Promise<void>((resolve) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', resolve);
        }
      );
      req.on('error', () => resolve());
      req.write(body);
      req.end();
    });
  }
}

export default SlackReporter;
