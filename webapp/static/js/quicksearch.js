function quickSearch(e, results, startEmpty=false) {
	let input = e.value.toLowerCase()
	document.querySelectorAll(results).forEach((row) => {
			if (row !== undefined) {
				extra = (startEmpty && input === "")
				if (row.dataset.searchable.toLowerCase().includes(input) && !extra) {
					row.classList.remove("hide")
				} else {
					row.classList.add("hide")
				}
			}
		}
	)
}