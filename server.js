const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const logger = require("morgan");
const request = require("request");
const axios = require("axios");
//require models
const db = require("./models");
const PORT = 3000;


var app = express();
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

app.get("/scrape", function(req, res) {
    axios.get("http://quotes.toscrape.com/").then(function(response) {

      var $ = cheerio.load(response.data);
  
      $("div").each(function(i, element) {
        var result = {};

        result.title = $(this)
          .children("span")
          .text();
  
        db.Quote.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            return res.json(err);
          });
      });
  
      res.send("Scrape Complete");
    });
  });

app.get("/quotes", function(req, res) {
    db.Quote.find({})
      .then(function(dbArticle) {
        res.json(dbArticle);
        console.log(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

app.get("/quotes/:id", function(req, res) {
    db.Quote.findOne({ _id: req.params.id })
      .populate("note")
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json(err);
      });
  });

app.post("/quotes/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Quote.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {

        res.json(err);
      });
  });

app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  