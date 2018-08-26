// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
var mongojs = require("mongojs");
var path = require("path");

// Requiring Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scraping tools with axios, request and  cheerio
var cheerio = require("cheerio");
var axios = require("axios");
var request = require("request");

// Set mongoose to leverage built in Promises
mongoose.Promise = Promise;

// Define port
var port = process.env.PORT || 3000

// Initialize express
var app = express();

// Config middleware

// Use morgan logger for logging request
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false}));
// Use express.static to serve the public folder aas a static directory
app.use(express.static("public"));

// Set Handlebars
var exphbs = require("express-handlebars");

app.set('view engine', 'jade');

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    partialsDir: path.join(__dirname, "/views/layouts/partials")
}));
// Connect to the Mongo DB
mongoose.connect("mongodb://heroku_jmv816f9:5j1nd4taq42hi29bfm5hobeujd@ds133192.mlab.com:33192/heroku_jmv816f9");

var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged into the db through mongoose, log success message
db.once("open", function() {
    console.log("Mongoose Connection Successful");
});

// Routes

// A GET route for scraping the democracynow website
app.get("/", function(req, res) {
    Article.find({"saved": false}, function(error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    });
});

app.get("/saved", function(req, res) {
    Article.find({"saved": true}).populate("notes").exec(function(error, articles) {
        var hbsObject = {
            articles: articles
        };
        res.render("saved", hbsObject);
    });
});

// A get request to scrape the democracy now website
app.get("/scrape", function(req, res) {
    // Grab the body of the html with request
    request("https://www.nytimes.com/", function(error, response, html) {
        // Then load the into cheerio and save it to $ for shorthand selector
        var $ = cheerio.load(htmlj);
        // Grab every h2 withing an article tag and do following:
        $("article").each(function(i, element) {

            // Save an empty result object 
            var result = {};

            // Add the title and summary of every link, and save them as properties of the result object
            result.title = $(this).children("h2").text();
            result.summary = $(this).children(".summary").text();
            result.link = $(this).children("h2").children("a").attr("href");

            // Using our Article model, create a new entry
            // tHis effectively passes the result object to the entry (and the title link)
            var entry = new Article(result);

            // Save the entry to the db
            entry.save(function(err, doc) {
                // Log any errors 
                if (err) {
                    console.log(err);
                    // Else log the doc
                } else {
                    console.log(doc);
                }
            });
        });
        // response for finished scrape text
            res.send("Scrape Complete");
    });
});

// Getting the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    // Grab every doc in the Articles array
    Article.find({}, function(error, doc) {
        // Log any errors 
        if (error) {
            console.log(error);
            // else send the doc to the browser as a json object
        } else {
            res.json(doc);
        }
    });
});

// Grab article by its ObjectId
app.get("/articles/:id", function(req, res) {
    // using the id passed in the id parameter, prepare query that will find matching one in db
    Article.findOne({ "_id": req.params.id })
    // populate all of the notes associated with it
    .populate("note")
    // Execute the query
    .exec(function(error, doc) {
        // log any errors
        if (error) {
            console.log(error);
            // else send the doc to the browser as a json object
        } else {
            res.json(doc);
        }
    });
});

// Save an article
app.post("/articles/save/:id", function(req, res) {
    // Use the article id to find and update its saved boolean
    Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": true})
    // Execute the query
    .exec(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
            // else send the doc to the browser as a json object
        } else {
            res.json(doc);
        }
    });
});

// Delete an article
app.post("/articles/delete/:id", function(req, res){
    // Use the article id to find and update its saved boolean
    Article.findOneAndUpdate({ "_id": req.params.id }, {"saved": false, "notes": []})
    // Execute the above query
    .exec(function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
            // else send the doc to the browser as a json object
        } else {
            res.json(doc);
        }
    });
});

// Create a new note
app.post("/notes/save/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    var newNote = new Note({
        body: req.body.text,
        article: req.params.id
    });
    console.log(req.body)
    // Save the new note to the db
    newNote.save(function(error, note) {
        // Log any errors
        if (error) {
            console.log(error);
            // else use the atricle id to find and upddate it's notes
        } else {
            Article.findOneAndUpdate({"_id": req.params.id}, {$push: { "notes": note } })
            // execute the query
            .exec(function(err) {
                // log any errors 
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    res.send(note);
                }
            });
        }
    });
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function(req, res) {
    // Use the note id to find and delete 
    Note.findOneAndRemove({"_id": req.params.note_id }, function(err) {
        // Log any errors
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            Article.findOneAndUpdate({ "_id": req.params.article_id }, {$pull: {"notes": req.params.id}})
            // execute the query
            .exec(function(err) {
                // Log any errors
                if (err) {
                    console.log(err);
                } else {
                    // Send note to browser
                    res.send("Note Deleted");
                }
            });
        }
    });
});

// Listen on Port
app.listen(port, function() {
    console.log("App running on port: " + port);
});
   
       
   



