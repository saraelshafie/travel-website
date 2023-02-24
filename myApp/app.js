//package imports

const { render } = require("ejs");
var express = require("express");
var fs = require("fs");
var path = require("path");
var MongoClient = require("mongodb").MongoClient;
const session = require("express-session");
const { isNull } = require("util");
const store = new session();




//server
var app = express();


if (process.env.PORT) {
  app.listen(process.env.PORT, function () { console.log('Server started') })
  
  
}
else {
  app.listen(3000,function() {console.log('Server started on port 3000')})
}

var destinations = ["annapurna", "bali", "rome", "paris", "inca", "santorini"];

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "innvoters",
    saveUninitialized: false,
    resave: false,
  })
);

app.locals.msg = "";
app.locals.login_msg = "";
app.locals.msgd = "";

/*------------------------------- HELPERS -----------------------------------*/

async function connect() {
  var client = await MongoClient.connect("mongodb://127.0.0.1:27017");
  return client.db("myDB");
}

async function insertUser(u, p) {
  let db = await connect();
  db.collection("myCollection").insertOne({ username: u, password: p, list: [] });
}

async function checkUserTaken(username) {
  var db = await connect();
  var arr = await db.collection("myCollection").find({ username: username }).toArray();
  return arr.length !== 0;
}

// async function checkDestinationTaken(dest) {
//   var db = await connect();
//   var arr = await db
//     .collection("wanttogo")
//     .find({ destination: dest })
//     .toArray();
//   return arr.length !== 0;
// }

async function checkCorrectCredentials(username, password) {
  var db = await connect();
  var arr = await db
    .collection("myCollection")
    .find({ username: username, password: password })
    .toArray();

  return arr.length === 1;
}
function sessionAuth(req, res, name) {
  if (!req.session.sessionID) {
    res.redirect("login");
  } else {
    res.render(name);
  }
}

async function updateWantToGo(req, res, dest) {
  var db = await connect();
  var username = req.session.sessionID;

  var user = await db.collection("myCollection").findOne({ username: username });
  var list = user.list;

  if (list.includes(dest)) {
    res.render(dest, {
      msgd: "Destination already added in your want to go list",
    });
  } else {
    list.push(dest);

    db.collection("myCollection").updateOne(
      { username: username },
      { $set: { list: list } }
    );
  }
}

/*---------------------------------------- POST -------------------------------------------*/

app.post("/annapurna", async (req, res) =>
  updateWantToGo(req, res, "annapurna")
);

app.post("/bali", async (req, res) => {
  updateWantToGo(req, res, "bali");
});

app.post("/paris", async (req, res) => {
  updateWantToGo(req, res, "paris");
});

app.post("/rome", async (req, res) => {
  updateWantToGo(req, res, "rome");
});

app.post("/inca", async (req, res) => {
  updateWantToGo(req, res, "inca");
});

app.post("/santorini", async (req, res) => {
  updateWantToGo(req, res, "santorini");
});

app.post("/register", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username === "" || password === "")
    res.render("registration", { msg: "Fields cannot be empty" });
  else {
    let taken = await checkUserTaken(username);

    if (taken) {
      res.render("registration", { msg: "This username is already taken!" });
    } else {
      insertUser(username, password);

      res.render("login", { login_msg: "Registration Successful" });
    }
    // res.redirect('/home')
  }
});

app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  if (username === "" || password === "")
    res.render("login", { login_msg: "Fields cannot be empty" });
  else {
    let valid = await checkCorrectCredentials(username, password);

    if (valid) {
      req.session.authenticated = true;

      req.session.sessionID = username;
      res.redirect("/home");
    } else res.render("login", { login_msg: "Incorrect username or password" });

  }
});

app.post("/search", (req, res) => {
  var searchKey = req.body.Search.toLowerCase();

  var resultsArr = [];

  for (d of destinations) 
    if (d.includes(searchKey)) resultsArr.push(d);
      var notFound = resultsArr.length === 0;

  res.render("searchresults", { resultsArr: resultsArr, notFound: notFound });
});


/*--------------------------------------------------- GET -----------------------------------------------------------*/

app.get("/", (req, res) => res.redirect("login"));

app.get("/registration", (req, res) => res.render("registration"));

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/home", (req, res) => {
  sessionAuth(req, res, "home");
});

app.get("/hiking", (req, res) => {
  sessionAuth(req, res, "hiking");
});

app.get("/cities", (req, res) => {
  sessionAuth(req, res, "cities");
});
app.get("/islands", (req, res) => {
  sessionAuth(req, res, "islands");
});

app.get("/inca", (req, res) => {
  sessionAuth(req, res, "inca");
});
app.get("/annapurna", (req, res) => {
  sessionAuth(req, res, "annapurna");
});

app.get("/paris", (req, res) => {
  sessionAuth(req, res, "paris");
});
app.get("/rome", (req, res) => {
  //res.render("rome");
  sessionAuth(req, res, "rome");
});

app.get("/bali", (req, res) => {
  sessionAuth(req, res, "bali");
});

app.get("/santorini", (req, res) => {
  sessionAuth(req, res, "santorini");
});

app.get("/wanttogo", async (req, res) => {
  if (!req.session.sessionID) {
    res.redirect("login");
  } else {
    var db = await connect();
    var username = req.session.sessionID;
    var user = await db.collection("myCollection").findOne({ username: username });
    var list = user.list;

    res.render("wanttogo", { wantArr: list });
  }
});

app.get("/searchresults", (req, res) => {

  if (!req.session.sessionID)
    res.redirect("login");
  else
    res.render("searchresults", { resultsArr: [], notFound: false });
  });


function upperCase(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}
