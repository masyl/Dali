/*

	Dali App - Lightweight App API

	See readme.txt for documentation

*/
(function ($, Dali) {

	var extend = Dali.Utils.extend;

	Dali.App = function (_options) {
		var app, mvc, Controller;

		// Shortcut variable for the app
		app = this;

		// Create a new instance of the mvc class
		app.mvc = mvc = new Dali.MVC({});

		// Environ will containt application environment variables
		// and be accessible in the templates as "app"
		app.environ = {};
		app.model = {};

		app.start = function(environ) {
			extend(this.environ, environ);
		};

		app.route = function(url) {
			
		}
	};



})(this.jQuery, this.Dali);

