function cssToggle(event, targetID, onClass, offClass) {
	document.getElementById(targetID).classList.toggle(offClass)
	document.getElementById(targetID).classList.toggle(onClass)
}

function quickSearch(e) {
	let input = e.value.toLowerCase()
	document.querySelectorAll("table#past_shows tr.link").forEach((row) => {
			if (row !== undefined) {
				if (row.dataset.searchable.toLowerCase().includes(input)) {
					row.classList.remove("hide")
				} else {
					row.classList.add("hide")
				}
			}
		}
	)
}

function sortTable(id, n, arrow_id) {
	var table, headings, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	table = document.getElementById(id);
	switching = true;
	// Set the sorting direction to ascending:
	dir = "asc";
	/* Make a loop that will continue until
	no switching has been done: */
	while (switching) {
		// Start by saying: no switching is done:
		switching = false;
		rows = table.rows;
		/* Loop through all table rows (except the
		first, which contains table headers): */
		for (i = 1; i < (rows.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;
			/* Get the two elements you want to compare,
			one from current row and one from the next: */
			x = rows[i].getElementsByTagName("TD")[n];
			y = rows[i + 1].getElementsByTagName("TD")[n];
			/* Check if the two rows should switch place,
			based on the direction, asc or desc: */
			if (dir === "asc") {
				if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} else if (dir === "desc") {
				if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch
			and mark that a switch has been done: */
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			// Each time a switch is done, increase this count by 1:
			switchcount++;
		} else {
			/* If no switching has been done AND the direction is "asc",
			set the direction to "desc" and run the while loop again. */
			if (switchcount === 0 && dir === "asc") {
				dir = "desc";
				switching = true;
			}
		}
	}

	headings = document.querySelectorAll("tr#header th span")
	headings.forEach(element => element.classList.remove(...element.classList))
	document.querySelector("#"+arrow_id).classList.add(dir)

	const params = new URLSearchParams(window.location.search)
	let q_col = params.get('col')
	let q_dir = params.get('dir')
	let qs;
	if (q_col === `${n}` && q_dir === "0") {
		qs = `?col=${n}&dir=1`
	} else {
		qs = `?col=${n}&dir=0`
	}

	history.pushState(null, '', window.location.pathname + qs)
}

document.addEventListener('DOMContentLoaded', function() {
	let arrow_ids = {
		0: "season_arrow",
		2: "show_arrow",
		4: "genre_arrow",
		5: "photos_arrow"
	}
	const params = new URLSearchParams(window.location.search)
	let col = params.get('col')
	let dir = params.get('dir')

	if (col !== null && dir !== null) {
		sortTable("past_shows", col, arrow_ids[col])
		if (dir === "1") {
			sortTable("past_shows", col, arrow_ids[col])
		}
	} else {
		col = 0
		sortTable("past_shows", col, arrow_ids[col])
		sortTable("past_shows", col, arrow_ids[col])
	}

}, false)

