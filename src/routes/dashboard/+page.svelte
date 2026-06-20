<script lang="ts">
	import { onMount } from 'svelte';
	import MasteryGauge from '$lib/components/MasteryGauge.svelte';
	import { loadContent } from '$lib/content';
	import type { ContentLocale } from '$lib/content/schema';
	import { resolveText } from '$lib/content/schema';
	import type { Subject } from '$lib/content/taxonomy';
	import { exportState, importState, parseBackup } from '$lib/engine/backup';
	import { db } from '$lib/engine/db';
	import type { MockResultRow } from '$lib/engine/db';
	import { computeMasteryFromStates, type MasterySummary } from '$lib/mastery/mastery';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = (): ContentLocale => (getLocale() === 'pl' ? 'pl' : 'en');

	let subjects: Subject[] = [];
	let mastery = $state<MasterySummary>({ subjects: [], overallReadinessPct: 0 });
	let exams = $state<MockResultRow[]>([]);
	let importError = $state(false);
	let fileInput: HTMLInputElement;

	async function refresh() {
		const content = await loadContent();
		subjects = content.subjects;
		const rows = await db.cardState.bulkGet(content.items.map((i) => i.id));
		const states = rows
			.filter((row): row is NonNullable<typeof row> => Boolean(row))
			.map((row) => ({ itemId: row.itemId, state: row.state }));
		mastery = computeMasteryFromStates(content.items, states, content.subjects);
		exams = (await db.mockResults.orderBy('finishedAt').reverse().toArray()).slice(0, 10);
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

<svelte:head><title>{m.dashboard_title()} · {m.app_name()}</title></svelte:head>

<main class="dashboard">
	<h1>{m.dashboard_title()}</h1>

	<section class="readiness">
		<MasteryGauge pct={mastery.overallReadinessPct} label={m.dashboard_readiness()} />
	</section>

	<section>
		<h2>{m.dashboard_subjects()}</h2>
		<ul class="subjects">
			{#each mastery.subjects as subject (subject.subjectId)}
				<li class="subject">
					<div class="row">
						<span>{subjectName(subject.subjectId)}</span>
						<span class="meta"
							>{m.dashboard_mastered({ mastered: subject.mastered, total: subject.total })}</span
						>
					</div>
					<div class="bar">
						<div class="bar-fill" style:width={`${subject.readinessPct}%`}></div>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section>
		<h2>{m.dashboard_exam_history()}</h2>
		{#if exams.length === 0}
			<p class="muted">{m.dashboard_no_exams()}</p>
		{:else}
			<ul class="exams">
				{#each exams as exam (exam.id)}
					<li class:pass={exam.passed}>
						<span>{subjectName(exam.subjectId ?? '')}</span>
						<span class="meta">{exam.scorePct}% · {formatDate(exam.finishedAt)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="backup">
		<button type="button" class="action" onclick={exportProgress}>{m.dashboard_export()}</button>
		<button type="button" class="action" onclick={() => fileInput.click()}>
			{m.dashboard_import()}
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="application/json"
			class="visually-hidden"
			onchange={onImportFile}
		/>
		{#if importError}<p class="error" role="alert">{m.dashboard_import_error()}</p>{/if}
	</section>
</main>

<style>
	.dashboard {
		max-width: 44rem;
		margin: 0 auto;
		padding: var(--space-6) var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	h2 {
		font-size: 1.25rem;
	}

	.subjects,
	.exams {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.subject .row,
	.exams li {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
	}

	.meta {
		font-family: var(--font-mono);
		color: var(--color-ink-soft);
		font-size: 0.9rem;
	}

	.bar {
		margin-top: var(--space-2);
		height: 0.75rem;
		background: var(--color-surface);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		background: var(--color-lift);
		transition: width 500ms ease;
	}

	.exams li.pass .meta {
		color: color-mix(in srgb, var(--color-lift) 70%, var(--color-ink));
	}

	.muted {
		color: var(--color-ink-soft);
	}

	.backup {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		align-items: center;
	}

	.action {
		padding: var(--space-3) var(--space-4);
		color: var(--color-on-accent);
		background: var(--color-sky);
		border: var(--border-width) solid var(--color-outline);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
	}

	.error {
		color: color-mix(in srgb, var(--color-sink) 75%, var(--color-ink));
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
