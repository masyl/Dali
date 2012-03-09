// Create an web server
var port = 3000,
	express = require('express'),
	app = express.createServer();

// Configure the server's default settings
app.configure(function () {
	app.set("view engine",  "dali");
	app.use(express.static(__dirname + '/public'));
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

app.get("/", function (req, res) {
	var menu = {
		item1: {
			items: {
				itemA: {
					items: {
						"leaf": {
							label: "Ax"
						}
					}
				},
				itemB: {
					items: {
						"leaf": {
							label: "Bx"
						}
					}
				},
				itemC: {
					items: {
						"leaf": {
							label: "Cx"
						}
					}
				}
			}
		},
		item2: {
			items: {
				itemA: {
					items: {
						"leaf": {
							label: "Ax"
						}
					}
				},
				itemB: {
					items: {
						"leaf": {
							label: "Bx"
						}
					}
				},
				itemC: {
					items: {
						"leaf1": {
							label: "Cx"
						},
						"leaf2": {
							label: "Cx1"
						},
						"leaf3": {
							label: "Cx2"
						},
						"leaf5": {
							label: "Cx3"
						}
					}
				}
			}
		},
		item3: {
			items: {
				itemA: {
					items: {
						"leaf": {
							label: "Ax"
						}
					}
				},
				itemB: {
					items: {
						"leaf": {
							label: "Bx"
						}
					}
				},
				itemC: {
					items: {
						"leaf": {
							label: "Cx"
						}
					}
				}
			}
		}
	}
	res.render("index", {
		menu: menu
	});
});

// Listen for requests
app.listen(port);
console.log("Workbench static site started on port: " + port);
