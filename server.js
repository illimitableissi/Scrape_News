var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
// Set Handlebars.
var exphbs = require("express-handlebars");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


var MONGODB_URI = process.env.MONGODB_URI || "mongodb://192.168.99.100/mongoHeadlines"

mongoose.connect(MONGODB_URI,{ useNewUrlParser: true });

// main page
app.get('/', (req, res)=>{
    // look for existing articles in database
    db.Article.find({})
    .sort({timestamp: -1})
    .then((dbArticle)=>{
        if (dbArticle.length == 0) {
            // if no articles found, render index
            res.render('index');
        }
        else {
            // if there are existing articles, show articles
            res.redirect('/');
        }
    })
    .catch((err)=>{
        res.json(err);
    });
});

// saved articles page
app.get('/saved', (req, res)=>{
    db.Article.find({saved: true})
    .then((dbArticle)=>{
        let articleObj = {article: dbArticle};

        // render page with articles found
        res.render('saved', articleObj);
    })
    .catch((err)=>{
        res.json(err);
    });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.echojs.com").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
  
      // Now, we grab every h2 within an article tag, and do the following:
      $("article h2").each(function(i, element) {
        // Save an empty result object
        var result = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("h2")
          .text();
        result.summary = $(this)
          .children("p")
          .text();
        result.link = $(this)
          .children("a")
          .attr("href");
  
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
      console.log("Scrape Complete");
    });
  });

  
  app.post("/saved/:id", function(req, res) {
	db.Article.findById(req.params.id, function(err, data) {
		if (data.issaved) {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: false, status: "Save Article"}}, {new: true}, function(err, data) {
				res.redirect("/");
			});
		}
		else {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: true, status: "Saved"}}, {new: true}, function(err, data) {
				res.redirect("/saved");
			});
		}
	});
});


app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });

