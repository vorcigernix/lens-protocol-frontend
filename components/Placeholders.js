export function Placeholders({ number }) {
	const rows = [];
	for (let i = 0; i < number; i++) {
		rows.push(
			<div
				className='bg-slate-200 h-28 w-full mt-3 rounded-md animate-pulse '
				key={i}
			/>
		);
	}
	return rows;
}
