/*

	Episodes
	htmlMap Sample App

*/
(function ($) {


	function EpisodesApp() {
		var App, Route, app, mvc, controllers, Controller;

		// Create a new App from the Dali app class
		App = EpisodesApp;
		app = new Dali.App();

		// Create a few shortcut vars for convenience
		mvc = app.mvc;
		controllers = {};
		Controller = mvc.Controller;
		Route = Dali.App.Route;


		/**
		 * Attach jQuery.mobile pages to the mvc controllers
		 */
		// TODO: Attach to hashchange instead
		/*
		function attach() {
			$("[data-role='page'][data-controller]").live('pagebeforeshow', function (event, ui) {
				var page, controller, view, model;
				page = $(this);
				controller = page.data("controller");
				view = page.data("view");
				model = {
					app: app.environ,
					params: $.url.parse(ui.url).params
				};
				mvc.run(model, view, controller, output);

				function output(source) {
					page.html(source)
						.parent()
						.page()
						.page("refresh");
				}
			});
		}
		*/

		function initHtmlMap() {
			/**
			 * Define the type of object to be loaded from the html
			 */
			$.htmlMap({
				types: {
					"episodes": function(map) {
						return new App.Episodes(map("episode"));
					},
					"episode": function(map) {
						var episode = new App.Episode(map("id"), map("title"), map("description"));
						episode.videoLength = map("videoLength");
						return episode;
					}
				}
			});
		}

		app.bind = function() {
			/**
			 * Event for showing selected episode
			 */
			$(window).delegate("[data-episode]", "click", function(e) {
				e.preventDefault();
				var $this = $(this),
					episodeId = $this.data("episode"),
					episode = app.environ.episodes.get(episodeId) || {};
				var data = {
					"episode": episode
				};
			});
		};


		/**
		 * Define controllers
		 */
		// This controlle handler the homepage
		controllers.home = new Controller("home", function(model, view, callback) {
			this.isOpen = true;
			model.episodes = app.model.episodes;
			var episodeDetails = controllers.episodeDetails;
			if (episodeDetails.isOpen) {
				episodeDetails.act("close");
			} else {
				this.act("show", callback);
			}
		}, {
			show: function(callback) {
				$(".episodeList").html(dali.get("view-episodeList").render(this.model));
			}
		});

		// TODO: The controller must have an running instance and be statefull like a widget!!!
		// Controler to show more details on an episode, when the user clicks on an epidose
		controllers.episodeDetails = new Controller("episodeDetails", function(model, view, callback) {
			if (!controllers.home.isOpen) {
				// todo: this should be done on the already initialized instance ?
				controllers.home.run({}, "", function() {});
			}
			this.isOpen = true;
			this.act("show", callback);
		}, {
			show: function(callback) {
				var model = this.model,
					episodeId = model.location.search.substring(1);
				model.episodes = app.model.episodes;
				model.episode = model.episodes.get(episodeId);
				$(".episodeDetails")
						.hide()
						.html(dali.get("view-episodeDetails").render(model))
						.fadeIn(300);
			},
			close: function(callback) {
				$(".episodeDetails").fadeOut(200);
			}
		});

		// Define all the routes and match them to controllers
		app.routes.push(
				Route("/", "home"),
				Route("/episode", "episodeDetails")
		);


		/**
		 * Start the application
		 */
		app.start = function () {

			// Register all controllers with the mvc
			mvc.register(controllers);

			// Load the episode data from the html
			initHtmlMap();
			app.model.episodes = $("#allEpisodes").htmlMap()[0];

			// Add the templates
			// todo: refactor as app.views.push(View("..."));
			dali.add("view-episodeList", $("#view-episodeList").html());
			dali.add("view-episodeDetails", $("#view-episodeDetails").html());

			function go(location) {
				var hash = location.hash;
				var _location = (hash[1] === "!") ? Location(hash.substring(2)) : location;
				console.log(hash);
				console.log("location: ", _location);
				app.route(_location);

			}

			$(window).bind( 'hashchange', function() {
				go(window.location);
			});
			go(window.location);

//			app.render();
//			app.bind();
			//attach();
		};

		return app;
	}

	// TODO: move to dali.app
	function Location(path) {
		var a = document.createElement("a");
		a.href = path;
		return {
			hash: a.hash,
			host: a.host,
			hostname: a.hostname,
			pathname: a.pathname,
			protocol: a.protocol,
			port: a.port,
			search: a.search
		};
	}

	/**
	 * Collection of episodes
	 * @constructor
	 * @param episodes
	 */
	EpisodesApp.Episodes = function (episodes) {
		var items = episodes;
		this.all = function () {
			return items;
		};
		this.get = function (id) {
			for (var i in items) {
				if (items[i].id == id) return items[i];
			}
			return null;
		};
	};

	/**
	 * The Episode class
	 * @constructor
	 * @param id
	 * @param title
	 * @param description
	 */
	EpisodesApp.Episode = function (id, title, description) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.videoLength = "";
	};

	// Expose the app to the global scope
	window.EpisodesApp = EpisodesApp;


})(jQuery);
