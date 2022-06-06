export function SearchButton({ buttonText, onClick }) {
	return (
		<button
			className='border-none outline-none ml-4 text-fuchsia-900 p-4 rounded-3xl cursor-pointer text-sm font-medium bg-fuchsia-400 w-60 tracking-tight hover:opacity-70 transition-opacity'
			onClick={onClick}>
			{buttonText}
		</button>
	);
}
