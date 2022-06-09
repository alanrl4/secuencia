const {DontCare} = require('./flipflop');

function FixedBinary(bitNumber, str) {
	return (new Array(bitNumber - str.length).fill('0').join('') + str).split(
		''
	);
}

function BitNumber(secuence) {
	const greatestNumber = secuence.reduce((prev, curr) =>
		prev > curr ? prev : curr
	);
	return greatestNumber.toString(2).length;
}

function TableRow({secuence, flipflop, current, next}) {
	const bitNumber = BitNumber(secuence);

	const o = {
		current: FixedBinary(bitNumber, current.toString(2)),
		next:
			next !== undefined
				? FixedBinary(bitNumber, next.toString(2))
				: DontCare(bitNumber),
	};

	flipflop.inputs(o, bitNumber);
	return o;
}

function Table(secuence, flipflop) {
	const table = [];
	for (let i = 0; i < Math.pow(2, BitNumber(secuence)); i++) {
		const currentIndex = secuence.indexOf(i);
		const next =
			currentIndex === -1
				? undefined
				: secuence[(currentIndex + 1) % secuence.length];

		table.push(TableRow({secuence, flipflop, current: i, next}));
	}
	return table;
}

module.exports = {Table, BitNumber, FixedBinary};
