function confirm_delete(args) {
	if (confirm("Are you sure you want to delete this?")) {
		window.location.href += args
	}
}