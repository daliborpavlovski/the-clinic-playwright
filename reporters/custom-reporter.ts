import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
  timestamp: string;
  byTag: Record<string, { passed: number; failed: number }>;
  failures: { title: string; error: string }[];
}

/**
 * Custom Playwright reporter that:
 * 1. Prints a tag-based summary (e.g. @smoke: 8 passed, 0 failed)
 * 2. Writes test-summary.json for downstream consumption (Slack, dashboards, etc.)
 */
class ClinicReporter implements Reporter {
  private summary: TestSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
    timestamp: new Date().toISOString(),
    byTag: {},
    failures: [],
  };

  private startTime = Date.now();

  onBegin(_config: FullConfig, suite: Suite) {
    const total = suite.allTests().length;
    console.log(`\n  [ClinicReporter] Starting ${total} tests…\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.summary.total++;

    if (result.status === 'passed') this.summary.passed++;
    else if (result.status === 'failed') this.summary.failed++;
    else if (result.status === 'skipped') this.summary.skipped++;

    if (result.retry > 0 && result.status === 'passed') this.summary.flaky++;

    // Track by tag
    const tags = test.tags ?? [];
    for (const tag of tags) {
      if (!this.summary.byTag[tag]) {
        this.summary.byTag[tag] = { passed: 0, failed: 0 };
      }
      if (result.status === 'passed') this.summary.byTag[tag].passed++;
      else if (result.status === 'failed') this.summary.byTag[tag].failed++;
    }

    if (result.status === 'failed') {
      const errorMsg = result.errors?.[0]?.message?.slice(0, 200) ?? 'No error message';
      this.summary.failures.push({
        title: test.titlePath().join(' › '),
        error: errorMsg,
      });
    }
  }

  onEnd(result: FullResult) {
    this.summary.duration = Date.now() - this.startTime;

    const { passed, failed, skipped, flaky, total, byTag, failures } = this.summary;
    const status = result.status === 'passed' ? '✅ PASSED' : '❌ FAILED';
    const dur = (this.summary.duration / 1000).toFixed(1);

    console.log('\n' + '─'.repeat(60));
    console.log(`  ${status} — ${passed}/${total} passed  |  ${failed} failed  |  ${skipped} skipped  |  ${flaky} flaky  (${dur}s)`);

    if (Object.keys(byTag).length > 0) {
      console.log('\n  By tag:');
      for (const [tag, counts] of Object.entries(byTag)) {
        console.log(`    ${tag}: ${counts.passed} passed, ${counts.failed} failed`);
      }
    }

    if (failures.length > 0) {
      console.log(`\n  Failures (${failures.length}):`);
      for (const f of failures.slice(0, 5)) {
        console.log(`    ✗ ${f.title}`);
        console.log(`      ${f.error.split('\n')[0]}`);
      }
    }

    console.log('─'.repeat(60) + '\n');

    // Write JSON summary
    try {
      const outDir = 'test-results';
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, 'test-summary.json'),
        JSON.stringify(this.summary, null, 2)
      );
    } catch {
      // Non-fatal
    }
  }
}

export default ClinicReporter;
