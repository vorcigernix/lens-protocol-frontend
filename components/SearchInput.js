export function SearchInput({
	placeholder,
	onChange,
	value,
	onKeyDown = null,
}) {
	return (
		<input
			placeholder={placeholder}
			onChange={onChange}
			value={value}
			className='outline-none py-4 px-5 text-base rounded-3xl border-2 border-slate-200 bg-slate-50 w-80 transition-all focus:bg-white focus:border-slate-300'
			onKeyDown={onKeyDown}
		/>
	);
}
