// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');  
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

const mongo = require("mongodb").MongoClient;
const db_url = "mongodb://"+process.env.USER+":"+process.env.PASSWORD+"@ds153609.mlab.com:53609/rafascardb";
const base_url = "https://flashy-coal.glitch.me/";

app.get("/:url", function (request, response) {
  const url = request.params.url;
  
  mongo.connect(db_url, function(err, db) {
    if(err) throw err;
    
    const query = {short_url: base_url+url};
    findUrl(db, query, function(err, doc) {
      // If url exists on database, redirect
      if(doc) {
        response.redirect(doc.original_url);
      }
      // If it doesn't exist, return json with error message
      else {
        response.send({"error": "This url is not on the database."});
      }
      db.close();
    });
  });
  
});

const validUrl = require('valid-url');
app.get("/new/*", function(request, response) {
  const url = request.params[0];
  
  // Check if url is valid
  if(validUrl.isUri(url)) {
    // If valid url, check if it exists on database
    mongo.connect(db_url, function(err, db) {
      if(err) throw err;

      const query = {original_url: url};
      findUrl(db, query, function(err, doc) {
        // If url exists on database, return json
        if(doc) {
          response.send(doc);
          db.close();
        }
        // If it doesn't exist, add to database and return json
        else {
          createShortUrl(db, url, function(err, doc) {
            if(err) throw err;
            
            delete doc._id;
            response.send(doc);
            db.close();
          });
        }
      });
    });
  }
  // If url is invalid, return json with error message
  else {
    response.send({"error": "Wrong url format, make sure you have a valid protocol and real site."});
  }
  
});

function findUrl(db, query, callback) {
  const collection = db.collection("urlshortener");
  
  collection.find(query, {_id: false}).toArray(function(err, docs) {
    if(err) return callback(err);
    
    return callback(null, docs[0]);
  });
}

function createShortUrl(db, url, callback) {
  const collection = db.collection("urlshortener");
  
  collection.count({}, function(err, count) {
    if(err) return callback(err);
    
    const short_url = base_url+count;
    const obj = {original_url: url, short_url: short_url};
    
    collection.insert(obj, function(err, doc) {
      if(err) return callback(err);
      
      return callback(null, obj);
    });
  });
  
}