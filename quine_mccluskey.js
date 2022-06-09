const {Table, BitNumber} = require('./generate_tables');
const {FlipFlop} = require('./flipflop');

function GetMinterms(table, elemExtractor) {
	const primeImplicantsChart = {};
	const minterms = table
		.filter((v) => ['1', 'x'].includes(elemExtractor(v)))
		.map((v) => {
			const current = v.current;
			const name = current.join('');
			const dontCare = elemExtractor(v) === 'x';
			primeImplicantsChart[name] = {
				dontCare,
				elem: [],
			};
			return {
				dontCare,
				name: [name],
				val: current,
				oneCount: current.reduce(
					(prev, current) => (current === '1' ? prev + 1 : prev),
					0
				),
			};
		})
		.sort((a, b) => a.oneCount - b.oneCount);

	const mintermsByOneCount = {};
	minterms.forEach((v) => {
		if (!mintermsByOneCount[v.oneCount]) {
			mintermsByOneCount[v.oneCount] = [];
		}
		mintermsByOneCount[v.oneCount].push({name: v.name, val: v.val});
	});

	return {minterms, primeImplicantsChart, mintermsByOneCount};
}

function PrimeImplicants(minterms, primes) {
	const table = {...minterms};
	const nextMinterms = {};
	const nextPrimes = [...primes];

	const keys = Object.keys(table);
	const groups = Object.values(table);
	for (let i = 0; i < groups.length - 1; i++) {
		const group = groups[i];
		group.forEach((v) => {
			const nextGroups = groups[i + 1];
			let combinedCount = 0;
			nextGroups.forEach((nextV) => {
				const newVal = [...v.val];
				let changeCount = 0;
				for (let j = 0; j < newVal.length; j++) {
					if (newVal[j] !== nextV.val[j]) {
						changeCount++;
						newVal[j] = 'x';
					}
					if (changeCount > 1) {
						return;
					}
				}

				if (!nextMinterms[keys[i]]) {
					nextMinterms[keys[i]] = [];
				}

				combinedCount++;
				nextV.combined = true;
				v.combined = true;
				if (
					!nextMinterms[keys[i]].find(
						(_v) => _v.val.join('') === newVal.join('')
					)
				) {
					nextMinterms[keys[i]].push({
						name: [...v.name, ...nextV.name],
						val: newVal,
					});
				}
			});

			if (combinedCount === 0) {
				nextPrimes.push({name: v.name, val: v.val});
			}
		});
	}

	if (groups.length > 0) {
		groups[groups.length - 1].forEach((v) => {
			if (!v.combined) {
				nextPrimes.push(v);
			}
		});
	}

	if (Object.keys(nextMinterms).length > 0) {
		return PrimeImplicants(nextMinterms, nextPrimes);
	} else {
		const finalPrimes = [];

		nextPrimes.forEach((v, i) => {
			let cprimes = 0;
			nextPrimes.forEach((prime, j) => {
				let c = 0;
				if (i !== j) {
					v.name.forEach((name) => {
						if (prime.name.find((valName) => valName === name)) {
							c++;
						}
					});
				}
				if (c >= v.name.length) {
					cprimes++;
				}
			});
			if (cprimes === 0) {
				finalPrimes.push(v);
			}
		});

		return finalPrimes;
	}
}

function EssentialImplicants(primeImplicants, primeImplicantsChart) {
	const essentialImplicants = [];
	const mintermsChart = {...primeImplicantsChart};
	const implicantsChart = {};

	primeImplicants.forEach((implicant) => {
		const implicantName = implicant.val.join('');
		implicantsChart[implicantName] = [];
		implicant.name.forEach((name) => {
			mintermsChart[name].elem.push(implicant);
			implicantsChart[implicantName].push(name);
		});
	});

	// Delete de Dont Cares
	Object.keys(mintermsChart).forEach((k) => {
		if (mintermsChart[k] && mintermsChart[k].dontCare) {
			delete mintermsChart[k];
			Object.keys(implicantsChart).forEach((key) => {
				implicantsChart[key] = implicantsChart[key].filter(
					(v) => v !== k
				);
				if (implicantsChart[key].length === 0) {
					delete implicantsChart[key];
				}
			});
		}
	});

	// Delete essential prime implicants rows and columns
	Object.keys(mintermsChart).forEach((k) => {
		if (mintermsChart[k]) {
			const minterm = {...mintermsChart[k]};
			if (minterm.elem.length === 1) {
				essentialImplicants.push(...minterm.elem.map((v) => v.val));
				minterm.elem[0].name.forEach((name) => {
					if (mintermsChart[name]) {
						delete mintermsChart[name];
						Object.keys(implicantsChart).forEach((key) => {
							implicantsChart[key] = implicantsChart[key].filter(
								(v) => v !== name
							);
							if (implicantsChart[key].length === 0) {
								delete implicantsChart[key];
							}
						});
					}
				});
			}
		}
	});

	if (Object.keys(implicantsChart).length > 0) {
		// Delete implicants which are covered completely
		// by any other implicants
		Object.keys(implicantsChart).forEach((key) => {
			let minterms = implicantsChart[key];
			Object.keys(implicantsChart).forEach((k) => {
				if (k !== key && implicantsChart[k]) {
					minterms = minterms.filter(
						(v) => !implicantsChart[k].includes(v)
					);
				}
			});
			if (minterms.length === 0) {
				delete implicantsChart[key];
			}
		});
	}

	essentialImplicants.push(
		...Object.keys(implicantsChart).map((v) => v.split(''))
	);

	return essentialImplicants;
}

function EssentialImplicantsToString(essentialImplicants) {
	// if (essentialImplicants.length === 0) {
	// 	return 'x';
	// }
	return essentialImplicants
		.map((implicant) => {
			const name = implicant
				.map((v, i) =>
					v === 'x'
						? ''
						: `Q${implicant.length - 1 - i}${v === '1' ? '' : "'"}`
				)
				.filter((v) => v !== '');
			if (name.length === 0) {
				return '1';
			} else {
				return name.join(' ');
			}
		})
		.join(' + ');
}

function QuineMcCluskey(table, elemExtractor) {
	const {mintermsByOneCount, primeImplicantsChart} = GetMinterms(
		table,
		elemExtractor
	);

	const primeImplicants = PrimeImplicants(mintermsByOneCount, []).map(
		(v) => ({
			...v,
			intName: v.name.map((val) => parseInt(val, 2)),
		})
	);

	const essentialImplicants = EssentialImplicants(
		primeImplicants,
		primeImplicantsChart
	);

	return EssentialImplicantsToString(essentialImplicants);
}

function PrintTable(table) {
	let elems = [
		Object.keys(table[0])
			.map((v) => v.toUpperCase())
			.join('\t\t'),
	];
	table.forEach((row) => {
		elems.push(
			Object.values(row)
				.map((v) => v.join(''))
				.join('\t\t')
		);
	});

	console.log(elems.join('\n'));
}

const [, , ff, strSecuence] = process.argv;
const sequence = [...new Set(strSecuence.split(',').map((v) => parseInt(v)))];
const flipflop = FlipFlop(ff);
let table = Table(sequence, flipflop);

const bitNumber = BitNumber(sequence);

console.log('SEQUENCE: ', sequence.join(','));
console.log('FLIP FLOP: ', ff.toUpperCase());
console.log('TABLE: ');
PrintTable(table);
console.log('\nRESULTS: ');
for (let i = 0; i < bitNumber; i++) {
	if (ff === 'jk') {
		console.log(
			`\tJ${bitNumber - 1 - i}`,
			'=',
			QuineMcCluskey(table, flipflop.elemExtractorJ(i))
		);
		console.log(
			`\tK${bitNumber - 1 - i}`,
			'=',
			QuineMcCluskey(table, flipflop.elemExtractorK(i))
		);
	} else {
		console.log(
			`\t${ff.toUpperCase()}${bitNumber - 1 - i}`,
			'=',
			QuineMcCluskey(table, flipflop.elemExtractor(i))
		);
	}
}
