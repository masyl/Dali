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

		// TODO: STATEFULL CONTROLLER
		this.Controller = function (id, _handler, actions) {
			var c = this;
			c.actions = {};
			c.open = _handler;
			c.model = {};
			if (actions) {
				extend(c.actions, actions);
			}
			c.act = function (action, callback) {
				c.actions[action].call(c);
				if (callback) {
					callback.call(c);
				}
			};
			c.run = function (model, view, outputHandler) {
				c.model = model;
				c.open(this.model, view, callback);
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
			view = (_view) ? new mvc.View(_view) : null;
			mvc.controllers[_controller].run(model, view, outputHandler);
		}
	};

})(this.jQuery, this.Dali);

