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

		app.routes = [];

		app.start = function(environ) {
			extend(this.environ, environ);
		};

		/**
		 * Find a controller using available route handlers
		 * @param location
		 */
		function matchController(location) {
			var i, routes, route, controller;
			routes = app.routes;
			console.log("routes: ", routes);
			for (i=0; i < routes.length; i = i + 1) {
				route = routes[i];
				console.log("route: ", route);
				// todo: add support for arguments
				if (typeof(route) === "function") {
					controller = route(location, {}, app)
				} else {
					throw("invalidRouteHandler", "Invalid route handler");
				}
				if (controller) return controller;
			}
			return false;
		}

		app.route = function(location) {
			var model, view, controller;
			controller = matchController(location);
			if (controller) {
				console.log("route found:", controller);
				// Try to get a default view
				// todo: resolve default view
				view = "";
				// todo: inject app level model
				model = {
					app: app,
					location: location
	// todo: add support for params
	//				params: $.url.parse(ui.url).params
				};

				function output(source) {
					//debugger;
				}

				app.mvc.run(model, view, controller, output);
			}
		}
	};
	// Helper that returns a route handler that will match using
	// a parfect match on the quesrystring path attribute
	Dali.App.Route = function (path, controller) {
		var handler;
		handler = function(location, args, app) {
			if (location.pathname === path) return controller;
			return false;
		};
		return handler;
	}



})(this.jQuery, this.Dali);

