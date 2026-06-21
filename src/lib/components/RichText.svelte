<script lang="ts">
	import { parseRichText } from '$lib/text/rich-text';
	import { renderFormula } from '$lib/text/katex';
	import { glossaryEnabled } from '$lib/glossary/context';
	import { findGlossaryMatches } from '$lib/glossary/data';
	import { getLocale } from '$lib/paraglide/runtime';
	import GlossaryTerm from './GlossaryTerm.svelte';

	let { text }: { text: string } = $props();

	const enabled = glossaryEnabled();
	const segments = $derived(parseRichText(text));

	type Item =
		| { kind: 'sub' | 'sup' | 'formula' | 'text'; text: string }
		| { kind: 'term'; text: string; definition: string };

	const items = $derived.by((): Item[] => {
		const locale = getLocale() === 'pl' ? 'pl' : 'en';
		const out: Item[] = [];
		const used = new Set<string>();
		for (const seg of segments) {
			if (seg.kind === 'normal' && enabled) {
				for (const part of findGlossaryMatches(seg.text, locale, used)) {
					if (typeof part === 'string') out.push({ kind: 'text', text: part });
					else out.push({ kind: 'term', text: part.term, definition: part.definition });
				}
			} else {
				out.push({ kind: seg.kind === 'normal' ? 'text' : seg.kind, text: seg.text });
			}
		}
		return out;
	});
</script>

{#each items as item, i (i)}{#if item.kind === 'sub'}<sub>{item.text}</sub
		>{:else if item.kind === 'sup'}<sup>{item.text}</sup>{:else if item.kind === 'formula'}<span
			class="formula">{@html renderFormula(item.text)}</span
		>{:else if item.kind === 'term'}<GlossaryTerm
			term={item.text}
			definition={item.definition}
		/>{:else}{item.text}{/if}{/each}

<style>
	.formula {
		display: inline-block;
		max-width: 100%;
		overflow-x: auto;
		vertical-align: bottom;
		padding: 0.1em var(--space-1);
		border: var(--border-width-sm) solid var(--color-formula-border);
		border-radius: var(--radius-sm);
		background: var(--color-formula-bg);
		color: var(--color-formula-ink);
		white-space: nowrap;
	}
</style>
