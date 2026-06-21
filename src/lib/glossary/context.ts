import { getContext, setContext } from 'svelte';

const GLOSSARY_KEY = Symbol('glossary-enabled');

/** Enable glossary tooltips for the current component subtree (study/learning surfaces). */
export function setGlossaryEnabled(enabled: boolean): void {
	setContext(GLOSSARY_KEY, enabled);
}

/** True when the current subtree renders inside a learning context. Defaults to false. */
export function glossaryEnabled(): boolean {
	return getContext<boolean>(GLOSSARY_KEY) ?? false;
}
