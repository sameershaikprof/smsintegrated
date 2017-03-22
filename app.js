var express               = require("express"),
    mongoose              = require("mongoose"),
    passport              = require("passport"),
    bodyParser            = require("body-parser"),
    User                  = require("./models/user"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose")

var client = require('twilio')(
  "ACc3df0860bd965207f98b5718b894d277",
  "e2f30f1ab8e5600129890b76d2dd7d78"
);
mongoose.connect("mongodb://iot:iot@ds133340.mlab.com:33340/iotdb");


var app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(require("express-session")({
    secret: "Rusty is the best and cutest dog in the world",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//============
// ROUTES
//============

app.get("/", function(req, res){
    res.render("home");
});

app.get("/secret",isLoggedIn, function(req, res){
   res.render("secret");
});

app.get("/humidity",function(req,res){

  res.render("humidity");
});
app.get("/temp",function(req,res){

  res.render("temp");
});
app.get("/about",function(req,res){

  res.render("about");
});

// Auth Routes

//show sign up form
app.get("/register", function(req, res){
   res.render("register");
});
//handling user sign up
app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/secret");
           client.messages.create({
  from: "+19164093941",
  to: "+919581280457",
  body: "Hey,Some one registered into our system!"
}, function(err, message) {
  if(err) {
    console.error(err.message);
  }
});
        });
    });
});

// LOGIN ROUTES
//render login form
app.get("/login", function(req, res){
   res.render("login");
});
//login logic
//middleware
app.post("/login", passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login"
}) ,function(req, res){

});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
           client.messages.create({
  from: "+19164093941",
  to: "+919581280457",
  body: "Logged out from the system!"
}, function(err, message) {
  if(err) {
    console.error(err.message);
  }
});
        });




function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


var server=app.listen(process.env.PORT||3000, process.env.IP, function(){
    console.log("server started.......");
});

var io = require("socket.io").listen(server);

io.on("connection", function(socket){
  console.log("Client Connected");
  
  socket.on("dh11Reading", function(reading){
    // Received a new reading from the Pi. Send it along to the webpage
    console.log("DH11 Reading: " + reading) // This prints out to the Heroku server log
    io.emit("newDH11Reading", reading); // This sends it along to all of the other clients connected.
  })
   
  socket.on("stateChanged", function(state){
    console.log("State Changed: " + state);
    io.emit("updateState", state);
  });

  });