<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import MasteryGauge from '$lib/components/MasteryGauge.svelte';
	import { loadContent } from '$lib/content';
	import type { ContentLocale } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import type { Subject } from '$lib/content/taxonomy';
	import { exportState, importState, parseBackup } from '$lib/engine/backup';
	import { db } from '$lib/engine/db';
	import type { MockResultRow } from '$lib/engine/db';
	import { computeMasteryFromStates, type MasterySummary } from '$lib/mastery/mastery';
	import Seo from '$lib/components/Seo.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');
	const dotColors = [
		'var(--color-sky)',
		'var(--color-sun)',
		'var(--color-lift)',
		'var(--color-sink)'
	];

	let subjects: Subject[] = [];
	let mastery = $state<MasterySummary>({ subjects: [], overallReadinessPct: 0 });
	let exams = $state<MockResultRow[]>([]);
	let reviewsCount = $state(0);
	let examsCount = $state(0);
	let importError = $state(false);
	let revealBars = $state(false);
	let fileInput: HTMLInputElement;

	const encouragement = $derived(
		mastery.overallReadinessPct >= 80
			? m.enc_high()
			: mastery.overallReadinessPct >= 65
				? m.enc_mid()
				: m.enc_low()
	);

	async function refresh() {
		revealBars = false;
		const content = await loadContent();
		subjects = content.subjects;
		const rows = await db.cardState.bulkGet(content.items.map((i) => i.id));
		const states = rows
			.filter((row): row is NonNullable<typeof row> => Boolean(row))
			.map((row) => ({ itemId: row.itemId, state: row.state }));
		mastery = computeMasteryFromStates(content.items, states, content.subjects);
		exams = (await db.mockResults.orderBy('finishedAt').reverse().toArray()).slice(0, 10);
		reviewsCount = await db.reviewLogs.count();
		examsCount = await db.mockResults.count();
		// Render bars at 0 first, then grow them to their value so the fill animates in.
		setTimeout(() => {
			revealBars = true;
		}, 80);
	}

	onMount(refresh);

	function subjectName(subjectId: string): string {
		const subject = subjects.find((s) => s.id === subjectId);
		return subject ? resolveText(subject.name, locale()) : subjectId;
	}

	async function exportProgress() {
		const data = await exportState(db);
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'termika-backup.json';
		link.click();
		URL.revokeObjectURL(url);
	}

	async function onImportFile(event: Event) {
		importError = false;
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			await importState(db, parseBackup(await file.text()));
			await refresh();
		} catch {
			importError = true;
		} finally {
			fileInput.value = '';
		}
	}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat(locale(), { dateStyle: 'short', timeStyle: 'short' }).format(
			date
		);
	}
</script>

<Seo title={`${m.dashboard_title()} · ${m.app_name()}`} description={m.seo_desc_dashboard()} />

<main class="dashboard fade-in">
	<header class="head">
		<div>
			<span class="eyebrow">{m.dashboard_eyebrow()}</span>
			<h1>{m.dashboard_title()}</h1>
		</div>
		<div class="head-actions">
			<button type="button" class="btn btn--ghost lift" onclick={() => fileInput.click()}>
				{m.dashboard_import()}
			</button>
			<button type="button" class="btn btn--primary lift" onclick={exportProgress}>
				{m.dashboard_export()}
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="application/json"
				class="visually-hidden"
				onchange={onImportFile}
			/>
		</div>
	</header>

	{#if importError}<p class="error" role="alert">{m.dashboard_import_error()}</p>{/if}

	<div class="grid">
		<div class="col">
			<section class="card vario-card">
				<span class="chip">{m.dashboard_vario()}</span>
				<h2>{m.dashboard_readiness()}</h2>
				<MasteryGauge pct={mastery.overallReadinessPct} label={m.dashboard_readiness()} />
				<p class="encouragement">
					<span class="bobbing" aria-hidden="true">🪂</span>
					{encouragement}
				</p>
			</section>

			<div class="stats">
				<div class="stat stat--blue">
					<span class="stat-value">{reviewsCount}</span>
					<span class="stat-label">{m.stat_reviews()}</span>
				</div>
				<div class="stat stat--yellow">
					<span class="stat-value">{examsCount}</span>
					<span class="stat-label">{m.stat_exams()}</span>
				</div>
			</div>
		</div>

		<div class="col">
			<section class="card">
				<h2>{m.dashboard_subjects()}</h2>
				<ul class="subjects">
					{#each mastery.subjects as subject, i (subject.subjectId)}
						<li class="subject">
							<div class="row">
								<span class="subject-name">
									<span class="dot" style:background={dotColors[i % dotColors.length]}></span>
									{subjectName(subject.subjectId)}
								</span>
								<span class="meta">{subject.readinessPct}%</span>
							</div>
							<div class="bar">
								<div
									class="bar-fill wind-streak"
									style:width={`${revealBars ? subject.readinessPct : 0}%`}
								></div>
							</div>
							<span class="meta sub-meta">
								{m.dashboard_mastered({ mastered: subject.mastered, total: subject.total })}
							</span>
						</li>
					{/each}
				</ul>
			</section>

			<section class="card">
				<div class="card-head">
					<h2>{m.dashboard_exam_history()}</h2>
					<a class="btn btn--yellow lift" href={resolve('/exam')}>{m.sim_exam()}</a>
				</div>
				{#if exams.length === 0}
					<p class="muted">{m.dashboard_no_exams()}</p>
				{:else}
					<ul class="exams">
						{#each exams as exam (exam.id)}
							<li>
								<span class="badge-icon" class:pass={exam.passed}>{exam.passed ? '✓' : '✗'}</span>
								<div class="exam-info">
									<span class="exam-title">{subjectName(exam.subjectId ?? '')}</span>
									<span class="meta">{formatDate(exam.finishedAt)}</span>
								</div>
								<div class="exam-score">
									<span class="result-chip" class:pass={exam.passed}>
										{exam.passed ? m.exam_pass_chip() : m.exam_fail_chip()}
									</span>
									<span class="score">{exam.scorePct}%</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	</div>
</main>

<style>
	.dashboard {
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-4);
	}

	.eyebrow {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-ink-soft);
	}

	.head h1 {
		margin: var(--space-1) 0 0;
	}

	.head-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.btn {
		padding: var(--space-2) var(--space-5);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 0.95rem;
		text-decoration: none;
		color: var(--color-ink);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-pill);
		box-shadow: var(--shadow-card);
	}

	.btn--primary {
		color: var(--color-on-accent);
		background: var(--color-sky);
	}

	.btn--yellow {
		color: var(--color-on-accent);
		background: var(--color-sun);
	}

	.grid {
		display: grid;
		gap: var(--space-6);
		grid-template-columns: 1fr;
	}

	@media (width >= 60rem) {
		.grid {
			grid-template-columns: 5fr 7fr;
		}
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-card);
	}

	.vario-card {
		position: relative;
		align-items: center;
		text-align: center;
	}

	.chip {
		align-self: flex-start;
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-on-accent);
		background: var(--color-sun);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	h2 {
		font-size: 1.25rem;
		margin: 0;
	}

	.encouragement {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-weight: 700;
		margin: 0;
	}

	.stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-6);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.stat--blue {
		background: var(--color-answer);
	}

	.stat--yellow {
		color: var(--color-on-accent);
		background: var(--color-sun);
	}

	.stat-value {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 2.25rem;
	}

	.stat-label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
	}

	.subjects,
	.exams {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.subject .row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-2);
	}

	.subject-name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-family: var(--font-display);
		font-weight: 700;
	}

	.dot {
		width: 0.85rem;
		height: 0.85rem;
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: 50%;
	}

	.meta {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		font-size: 0.85rem;
	}

	.sub-meta {
		display: block;
		margin-top: var(--space-1);
	}

	.bar {
		height: 1.25rem;
		background: var(--color-track);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background-color: var(--color-sky);
		border-right: var(--border-width-sm) solid var(--color-outline);
		transition: width 1s ease;
	}

	.exams li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--color-surface);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card-sm);
	}

	.badge-icon {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		font-weight: 800;
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.badge-icon.pass {
		color: var(--color-on-accent);
		background: var(--color-lift);
	}

	.exam-info {
		display: flex;
		flex-direction: column;
		margin-right: auto;
	}

	.exam-title {
		font-family: var(--font-display);
		font-weight: 700;
	}

	.exam-score {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--space-1);
	}

	.result-chip {
		padding: 0.05rem var(--space-2);
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 0.7rem;
		color: var(--color-on-sink);
		background: var(--color-sink-bg);
		border: var(--border-width-sm) solid var(--color-outline);
		border-radius: var(--radius-pill);
	}

	.result-chip.pass {
		color: var(--color-on-accent);
		background: var(--color-lift);
	}

	.score {
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1.1rem;
	}

	.muted {
		color: var(--color-ink-soft);
	}

	.error {
		color: var(--color-sink);
		font-weight: 700;
		margin: 0;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
