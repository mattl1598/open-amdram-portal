function quickSearch(e, results, startEmpty=false) {
	console.log(" ")
	let input = e.value.toLowerCase()
	document.querySelectorAll(results).forEach((row) => {
			if (row !== undefined) {
				let extra = (startEmpty && input === "")
				if (row.dataset.searchable.toLowerCase().includes(input) && !extra) {
					row.classList.remove("hide")
					row.style.order = (row.dataset.searchable.toLowerCase().indexOf(input))
					console.log(row.style.order)
				} else {
					row.classList.add("hide")
					row.style.order = 100000
				}
			}
		}
	)
}