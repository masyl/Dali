/*

	htmlMap - html to data mapping

*/
(function ($) {

	var options = {
		types: {}
	};
	function htmlMapFn(_options) {
		var obj = [];
		$.extend(options, _options);
		$(this).filter("[data-obj]").each(function(e){
			var _obj,
				$this = $(this);
			$this.addClass("htmlMapped");
			_obj = map($this);
			obj.push(_obj);
		});
		return obj;
	}

	function htmlMap(_options) {
		$.extend(options, _options);
	}

	function map($root) {
		var obj,
			typeId,
			type;
		typeId = $root.data("obj");
		type = options.types[typeId];
		function mapResolver(name) {
			var $node,
				value;
			$node = $("[data-attr=" + name + "]", $root);
			if ($node.length) {
				value= $node.html();
			} else {
				$node = $("[data-obj=" + name + "]", $root);
				if ($node.length) {
					value = $node.htmlMap();
				} else {
					value = $root.attr(name);
				}
			}
			return value;
		}
		obj = type.call($root, mapResolver);
		return obj;
	}


	$.fn.htmlMap = htmlMapFn;
	$.htmlMap = htmlMap;

})(jQuery);
