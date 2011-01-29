/*

	jquery.dali

	Template rendering engine

	See readme.txt for documentation

*/
(function($, Dali){

	/*
	Extend jQuery with the StoreLocator application
	*/
	$.dali = new Dali({});
	$.fn.extend({
		dali: function (environParam, options) {
			this.each(function () {
				$.dali.add(this.id, $(this).html());
			});
		}
	});

})(jQuery, Dali);
