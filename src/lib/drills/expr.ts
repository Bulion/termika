/**
 * A tiny safe arithmetic evaluator for multi-input drill formulas (e.g. "distance / speed * 60").
 * Supports numbers, named variables, + - * /, parentheses and unary +/-. No JS eval, no globals.
 */
export function evaluateExpr(expr: string, scope: Record<string, number>): number {
	let pos = 0;

	const skip = () => {
		while (pos < expr.length && expr[pos] === ' ') pos += 1;
	};

	function parseExpression(): number {
		let value = parseTerm();
		skip();
		while (expr[pos] === '+' || expr[pos] === '-') {
			const op = expr[pos++];
			const rhs = parseTerm();
			value = op === '+' ? value + rhs : value - rhs;
			skip();
		}
		return value;
	}

	function parseTerm(): number {
		let value = parseFactor();
		skip();
		while (expr[pos] === '*' || expr[pos] === '/') {
			const op = expr[pos++];
			const rhs = parseFactor();
			value = op === '*' ? value * rhs : value / rhs;
			skip();
		}
		return value;
	}

	function parseFactor(): number {
		skip();
		if (expr[pos] === '(') {
			pos += 1;
			const value = parseExpression();
			skip();
			if (expr[pos] !== ')') throw new Error(`expected ")" at ${pos} in "${expr}"`);
			pos += 1;
			return value;
		}
		if (expr[pos] === '-') {
			pos += 1;
			return -parseFactor();
		}
		if (expr[pos] === '+') {
			pos += 1;
			return parseFactor();
		}
		const numMatch = /^[0-9]+(\.[0-9]+)?/.exec(expr.slice(pos));
		if (numMatch) {
			pos += numMatch[0].length;
			return Number(numMatch[0]);
		}
		const idMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(expr.slice(pos));
		if (idMatch) {
			pos += idMatch[0].length;
			const value = scope[idMatch[0]];
			if (value === undefined) throw new Error(`unknown variable "${idMatch[0]}"`);
			return value;
		}
		throw new Error(`unexpected token at ${pos} in "${expr}"`);
	}

	const result = parseExpression();
	skip();
	if (pos !== expr.length) throw new Error(`unexpected trailing input in "${expr}"`);
	return result;
}
