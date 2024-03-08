const FlexSlider = {
	// total no of items
	num_items: document.querySelectorAll(".carousel-item").length,

	// position of current item in view
	current: 1,

	init: function() {
		// set CSS order of each item initially
		document.querySelectorAll(".carousel-item").forEach(function(element, index) {
			element.style.order = (index + 1).toString(10);
		});

		this.addEvents();
	},

	addEvents: function() {
		console.log("events");
		// click on move item button
		document.querySelector("#carousel-container-outer").addEventListener('click', () => {
			this.gotoNext();
		});

		// after each item slides in, slider container fires transitionend event
		document.querySelector("#carousel-container").addEventListener('transitionend', () => {
			this.changeOrder();
		});
	},

	changeOrder: function() {
		// change current position
		if(this.current === this.num_items)
			this.current = 1;
		else
			this.current++;

		let order = 1;

		// change order from current position till last
		for(let i=this.current; i<=this.num_items; i++) {
			document.querySelector(".carousel-item[data-position='" + i + "']").style.order = order.toString(10);
			order++;
		}

		// change order from first position till current
		for(let i=1; i<this.current; i++) {
			document.querySelector(".carousel-item[data-position='" + i + "']").style.order = order.toString(10);
			order++;
		}

		// translate back to 0 from -100%
		// we don't need transitionend to fire for this translation, so remove transition CSS
		document.querySelector("#carousel-container").classList.remove('carousel-container-transition');
		document.querySelector("#carousel-container").style.transform = 'translateX(0)';
	},

	gotoNext: function() {
		console.log("click")
		// translate from 0 to -100%
		// we need transitionend to fire for this translation, so add transition CSS
		document.querySelector("#carousel-container").classList.add('carousel-container-transition');
		let item = document.querySelector(".carousel-item[style*='order: 3;']")
		let style = window.getComputedStyle(item)
		let width = 0 - item.offsetWidth - parseInt(style.marginLeft, 10) - parseInt(style.marginRight, 10);
		document.querySelector("#carousel-container").style.transform = `translateX(calc(${width}px))`;
	}
};

FlexSlider.init();

window.setInterval(function(){
  document.querySelector("#carousel-container-outer").click()
}, 5000);