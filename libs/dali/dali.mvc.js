/*

	Dali MVC - Ligthweight Model-View-Controller API

	See readme.txt for documentation

*/

(function ($, Dali) {

	var extend = Dali.Utils.extend;

	/**
	 * Lightweight MVC api built around Dali
	 * Especially usefull with jQuery mobile
	 * @param _options
	 */
	Dali.MVC = function (_options) {
		var mvc = this;

		this.options = {};

		extend(this.options, _options);

		// Keep a reference to either the global dali instance
		// or the one provided in options
		this.dali = this.options.dali || dali;
		this.controllers = {};

		this.Model = function (model) {
			$.extend(this, model);
		};

		this.View = function (id) {

			this.render = function(model) {
				return this.template.render(model);
			};

			this.resolve = function(id) {
				return $("script#view-" + this.id).html();
			};

			this.id = id;
			this.root = $("#" + this.id);
			this.source = this.resolve(id);
			this.template = mvc.dali.add(this.id, this.source);
		};

		this.Controller = function (id, _handler) {
			var handler = _handler;
			this.run = function (model, view, outputHandler) {
				handler(model, view, callback);
				function callback (output) {
					outputHandler(output);
				}
			};
		};

		this.register = function(controllers) {
			extend(this.controllers, controllers);
		};

		this.run = function (_model, _view, _controller, outputHandler) {
			var model, view;
			model = new mvc.Model(_model);
			view = new mvc.View(_view);
			mvc.controllers[_controller].run(model, view, outputHandler);
		}
	};

})(this.jQuery, this.Dali);

