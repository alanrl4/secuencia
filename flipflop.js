function DontCare(bitNumber) {
	return new Array(bitNumber).fill('x');
}

function FlipFlopD({q, next_q}) {
	return next_q;
}

function FlipFlopT({q, next_q}) {
	if (next_q === 'x') {
		return 'x';
	}

	return q !== next_q ? '1' : '0';
}

function FlipFlopJK_J({q, next_q}) {
	if (q === '0' && next_q === '0') {
		return '0';
	}

	if (q === '0' && next_q === '1') {
		return '1';
	}

	return 'x';
}

function FlipFlopJK_K({q, next_q}) {
	if (q === '1' && next_q === '0') {
		return '1';
	}

	if (q === '1' && next_q === '1') {
		return '0';
	}

	return 'x';
}

function FlipFlopJK(qs) {
	return [FlipFlopJK_J(qs), FlipFlopJK_K(qs)];
}

function FlipFlop(type) {
	const r = {
		type,
	};

	switch (type) {
		case 'd':
			r['inputs'] = (o, bitNumber) => {
				o['d'] = DontCare(bitNumber);
				for (let i = 0; i < bitNumber; i++) {
					o['d'][i] = FlipFlopD({
						q: o.current[i],
						next_q: o.next[i],
					});
				}
			};

			r['elemExtractor'] = (i) => (v) => {
				return v.d[i];
			};
			break;
		case 't':
			r['inputs'] = (o, bitNumber) => {
				o['t'] = DontCare(bitNumber);
				for (let i = 0; i < bitNumber; i++) {
					o['t'][i] = FlipFlopT({
						q: o.current[i],
						next_q: o.next[i],
					});
				}
			};

			r['elemExtractor'] = (i) => (v) => {
				return v.t[i];
			};
			break;
		case 'jk':
			r['inputs'] = (o, bitNumber) => {
				o['j'] = DontCare(bitNumber);
				o['k'] = DontCare(bitNumber);
				for (let i = 0; i < bitNumber; i++) {
					const [j, k] = FlipFlopJK({
						q: o.current[i],
						next_q: o.next[i],
					});
					o['j'][i] = j;
					o['k'][i] = k;
				}
			};

			r['elemExtractorJ'] = (i) => (v) => {
				return v.j[i];
			};

			r['elemExtractorK'] = (i) => (v) => {
				return v.k[i];
			};
			break;
	}

	return r;
}

module.exports = {FlipFlop, DontCare};
