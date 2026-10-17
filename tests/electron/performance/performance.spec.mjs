import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, getSongCell, login, navigateTo, test } from '../fixtures/katiesamp-test.mjs';

const numberFromEnvironment = (name, fallback) => {
    const value = Number.parseFloat(process.env[name] || '');
    return Number.isFinite(value) && value > 0 ? value : fallback;
};

const budgets = {
    idleCpuPercent: numberFromEnvironment('KATIESAMP_PERF_MAX_IDLE_CPU_PERCENT', 25),
    idlePrivateMb: numberFromEnvironment('KATIESAMP_PERF_MAX_IDLE_PRIVATE_MB', 600),
    idleWorkingSetMb: numberFromEnvironment('KATIESAMP_PERF_MAX_IDLE_MEMORY_MB', 850),
    largeLibraryLoadMs: numberFromEnvironment('KATIESAMP_PERF_MAX_LIBRARY_LOAD_MS', 30_000),
    largeLibraryPrivateMb: numberFromEnvironment('KATIESAMP_PERF_MAX_LIBRARY_PRIVATE_MB', 750),
    largeLibraryWorkingSetMb: numberFromEnvironment('KATIESAMP_PERF_MAX_LIBRARY_MEMORY_MB', 1_100),
    processCount: numberFromEnvironment('KATIESAMP_PERF_MAX_PROCESS_COUNT', 18),
    soakCpuPercent: numberFromEnvironment('KATIESAMP_PERF_MAX_SOAK_CPU_PERCENT', 35),
    soakGrowthMb: numberFromEnvironment('KATIESAMP_PERF_MAX_SOAK_GROWTH_MB', 160),
    soakPrivateMb: numberFromEnvironment('KATIESAMP_PERF_MAX_SOAK_PRIVATE_MB', 700),
    soakWorkingSetMb: numberFromEnvironment('KATIESAMP_PERF_MAX_SOAK_MEMORY_MB', 1_000),
    startupMs: numberFromEnvironment('KATIESAMP_PERF_MAX_STARTUP_MS', 20_000),
};

const round = (value) => Math.round(value * 100) / 100;

const sampleApplication = async (electronApp, startedAt) => {
    const metrics = await electronApp.evaluate(({ app }) => app.getAppMetrics());
    const totals = metrics.reduce(
        (result, metric) => {
            result.cpuPercent += metric.cpu?.percentCPUUsage || 0;
            result.privateMb += (metric.memory?.privateBytes || 0) / 1_024;
            result.workingSetMb += (metric.memory?.workingSetSize || 0) / 1_024;
            return result;
        },
        { cpuPercent: 0, privateMb: 0, workingSetMb: 0 },
    );

    return {
        cpuPercent: round(totals.cpuPercent),
        elapsedMs: Math.round(performance.now() - startedAt),
        privateMb: round(totals.privateMb),
        processCount: metrics.length,
        processes: metrics.map((metric) => ({
            cpuPercent: round(metric.cpu?.percentCPUUsage || 0),
            privateMb: round((metric.memory?.privateBytes || 0) / 1_024),
            type: metric.type,
            workingSetMb: round((metric.memory?.workingSetSize || 0) / 1_024),
        })),
        workingSetMb: round(totals.workingSetMb),
    };
};

const average = (values) =>
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const summarize = (samples) => ({
    averageCpuPercent: round(average(samples.map((sample) => sample.cpuPercent))),
    averageWorkingSetMb: round(average(samples.map((sample) => sample.workingSetMb))),
    maximumCpuPercent: round(Math.max(...samples.map((sample) => sample.cpuPercent))),
    maximumPrivateMb: round(Math.max(...samples.map((sample) => sample.privateMb))),
    maximumProcessCount: Math.max(...samples.map((sample) => sample.processCount)),
    maximumWorkingSetMb: round(Math.max(...samples.map((sample) => sample.workingSetMb))),
});

const createChart = (samples, width = 900, height = 260) => {
    const padding = 34;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maximumElapsed = Math.max(...samples.map((sample) => sample.elapsedMs), 1);
    const maximumMemory = Math.max(...samples.map((sample) => sample.workingSetMb), 1);
    const points = samples
        .map((sample) => {
            const x = padding + (sample.elapsedMs / maximumElapsed) * chartWidth;
            const y = padding + chartHeight - (sample.workingSetMb / maximumMemory) * chartHeight;
            return `${round(x)},${round(y)}`;
        })
        .join(' ');

    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Working set memory over time">
<rect width="${width}" height="${height}" fill="#f7faf9" />
<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#718096" />
<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#718096" />
<polyline points="${points}" fill="none" stroke="#075e54" stroke-width="4" />
<text x="${padding}" y="20" font-family="sans-serif" font-size="14">Working set MB - peak ${round(maximumMemory)}</text>
<text x="${width - padding}" y="${height - 8}" text-anchor="end" font-family="sans-serif" font-size="12">${Math.round(maximumElapsed / 1_000)} seconds</text>
</svg>`;
};

const attachReport = async ({ details = {}, samples, testInfo }) => {
    const summary = summarize(samples);
    const report = {
        budgets,
        details,
        generatedAt: new Date().toISOString(),
        samples,
        summary,
    };
    const reportDirectory = testInfo.outputPath('performance');
    await mkdir(reportDirectory, { recursive: true });
    const jsonPath = path.join(reportDirectory, 'report.json');
    const htmlPath = path.join(reportDirectory, 'report.html');
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(
        htmlPath,
        `<!doctype html><meta charset="utf-8"><title>KatiesAmp performance report</title>
<style>body{font:16px system-ui;margin:2rem;color:#173b38}table{border-collapse:collapse}td,th{border:1px solid #aac5c1;padding:.5rem;text-align:right}th:first-child,td:first-child{text-align:left}</style>
<h1>KatiesAmp performance report</h1>${createChart(samples)}
<table><tbody>${Object.entries(summary)
            .map(([key, value]) => `<tr><th>${key}</th><td>${value}</td></tr>`)
            .join('')}</tbody></table>`,
    );
    await testInfo.attach('performance-report-json', {
        contentType: 'application/json',
        path: jsonPath,
    });
    await testInfo.attach('performance-report-chart', {
        contentType: 'text/html',
        path: htmlPath,
    });
    return summary;
};

const collectSamples = async ({ count, electronApp, intervalMs, startedAt }) => {
    const samples = [];
    for (let index = 0; index < count; index += 1) {
        if (index > 0) await new Promise((resolve) => setTimeout(resolve, intervalMs));
        samples.push(await sampleApplication(electronApp, startedAt));
    }
    return samples;
};

test('@full @performance-release stays inside startup and idle resource budgets', async ({
    electronApp,
    launchDurationMs,
    page,
}, testInfo) => {
    await login(page);
    await page.waitForTimeout(3_000);
    const startedAt = performance.now();
    const samples = await collectSamples({
        count: 5,
        electronApp,
        intervalMs: 1_000,
        startedAt,
    });
    const summary = await attachReport({
        details: {
            executable: process.env.KATIESAMP_EXECUTABLE_PATH || 'development Electron runtime',
            launchDurationMs: round(launchDurationMs),
            scenario: 'startup-and-idle',
        },
        samples,
        testInfo,
    });

    expect(launchDurationMs, 'time from process launch to DOM-ready window').toBeLessThanOrEqual(
        budgets.startupMs,
    );
    expect(summary.maximumWorkingSetMb, 'peak idle working set').toBeLessThanOrEqual(
        budgets.idleWorkingSetMb,
    );
    expect(summary.maximumPrivateMb, 'peak idle private memory').toBeLessThanOrEqual(
        budgets.idlePrivateMb,
    );
    expect(summary.averageCpuPercent, 'average idle CPU').toBeLessThanOrEqual(
        budgets.idleCpuPercent,
    );
    expect(summary.maximumProcessCount, 'Electron process count').toBeLessThanOrEqual(
        budgets.processCount,
    );
});

test.describe('large library performance', () => {
    test.describe.configure({ timeout: 120_000 });
    test.use({ mockSongCount: 10_000 });

    test('@nightly loads and virtualizes a 10,000-track library', async ({
        electronApp,
        page,
    }, testInfo) => {
        await login(page);
        const loadStartedAt = performance.now();
        await navigateTo(page, '/library/songs');
        await expect(getSongCell(page, 'Automation Track 1')).toBeVisible({ timeout: 60_000 });
        const libraryLoadMs = performance.now() - loadStartedAt;
        await page.waitForTimeout(2_000);
        const samples = await collectSamples({
            count: 5,
            electronApp,
            intervalMs: 1_000,
            startedAt: loadStartedAt,
        });
        const summary = await attachReport({
            details: {
                libraryLoadMs: round(libraryLoadMs),
                scenario: 'large-library',
                trackCount: 10_000,
            },
            samples,
            testInfo,
        });

        expect(
            libraryLoadMs,
            'time to first visible track in a 10,000-track library',
        ).toBeLessThanOrEqual(budgets.largeLibraryLoadMs);
        expect(summary.maximumWorkingSetMb, 'large-library working set').toBeLessThanOrEqual(
            budgets.largeLibraryWorkingSetMb,
        );
        expect(summary.maximumPrivateMb, 'large-library private memory').toBeLessThanOrEqual(
            budgets.largeLibraryPrivateMb,
        );
        expect(summary.maximumProcessCount, 'Electron process count').toBeLessThanOrEqual(
            budgets.processCount,
        );
    });
});

test('@nightly keeps resource growth bounded during a playback and navigation soak', async ({
    electronApp,
    page,
}, testInfo) => {
    const soakMinutes = numberFromEnvironment('KATIESAMP_PERF_SOAK_MINUTES', 2);
    const soakDurationMs = soakMinutes * 60_000;
    test.setTimeout(soakDurationMs + 180_000);
    await login(page);
    await navigateTo(page, '/library/songs');
    await expect(getSongCell(page, 'Automation Track 1')).toBeVisible({ timeout: 30_000 });
    await getSongCell(page, 'Automation Track 1').dblclick();

    const playTrack = async (trackNumber) => {
        const song = getSongCell(page, `Automation Track ${trackNumber}`);
        await expect(song).toBeVisible({ timeout: 30_000 });
        await song.dblclick();

        const confirmation = page.getByRole('dialog', {
            name: 'Discard the current queue?',
        });
        const confirmationOpened = await confirmation
            .waitFor({ state: 'visible', timeout: 5_000 })
            .then(() => true)
            .catch(() => false);
        if (!confirmationOpened) return;

        await confirmation.getByRole('checkbox', { name: 'Do not show this again' }).check();
        await confirmation.getByRole('button', { exact: true, name: 'Confirm' }).click();
        await expect(confirmation).toBeHidden({ timeout: 10_000 });
    };

    const startedAt = performance.now();
    const samples = [];
    let nextInteractionAt = 30_000;
    let interactionIndex = 0;
    while (performance.now() - startedAt < soakDurationMs) {
        const elapsedMs = performance.now() - startedAt;
        if (elapsedMs >= nextInteractionAt) {
            const trackNumber = (interactionIndex % 5) + 2;
            await navigateTo(page, '/library/songs');
            await playTrack(trackNumber);
            interactionIndex += 1;
            nextInteractionAt += 30_000;
        }
        samples.push(await sampleApplication(electronApp, startedAt));
        await page.waitForTimeout(5_000);
    }

    const summary = await attachReport({
        details: { scenario: 'playback-soak', soakMinutes },
        samples,
        testInfo,
    });
    const comparisonWindow = Math.min(5, Math.floor(samples.length / 2));
    const initialWorkingSetMb = average(
        samples.slice(0, comparisonWindow).map((sample) => sample.workingSetMb),
    );
    const finalWorkingSetMb = average(
        samples.slice(-comparisonWindow).map((sample) => sample.workingSetMb),
    );
    const workingSetGrowthMb = round(finalWorkingSetMb - initialWorkingSetMb);

    expect(summary.maximumWorkingSetMb, 'soak-test peak working set').toBeLessThanOrEqual(
        budgets.soakWorkingSetMb,
    );
    expect(summary.maximumPrivateMb, 'soak-test peak private memory').toBeLessThanOrEqual(
        budgets.soakPrivateMb,
    );
    expect(summary.averageCpuPercent, 'soak-test average CPU').toBeLessThanOrEqual(
        budgets.soakCpuPercent,
    );
    expect(workingSetGrowthMb, 'working-set growth during the soak').toBeLessThanOrEqual(
        budgets.soakGrowthMb,
    );
    expect(summary.maximumProcessCount, 'Electron process count').toBeLessThanOrEqual(
        budgets.processCount,
    );
});
