const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8000;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');

//used for session cookies encription
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');

//used for encription without cookies
const passportJWT = require('./config/passport-jwt-strategy');

//social authentication using google
const passportGoogle = require('./config/passport-google-oauth2-strategy');

//to store the session and prevent from restarting
const MongoStore = require('connect-mongo')(session);

//scss middleware to convert scss to css
const sassMiddleware = require('node-sass-middleware');

//middleware for the flash messages
const  flash = require('connect-flash');

//custom middleware made by us for the flash messages
const customMware = require('./config/middleware');

// setup the chat server to be used with socket.io
const chatServer = require('http').Server(app);
const chatSockets = require('./config/chat_sockets').chatSockets(chatServer);
chatServer.listen(5000);
console.log('chat server is listening on port 5000');


//middle wares
app.use(sassMiddleware({
    src: './assets/scss',
    dest: './assets/css',
    debug: true,
    outputStyle: 'extended',
    prefix: '/css'
}));

app.use(express.urlencoded());
app.use(cookieParser());


//use static(styling)
app.use(express.static('./assets'));

//make the upload path available to user
app.use('/uploads', express.static(__dirname + '/uploads'));

//use the layout before route as it'll be needing it 
app.use(expressLayouts);

//extract style and script from sub pages into layout
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);

//setup the view engine 
app.set('view engine', 'ejs');
app.set('views', './views');


//this is used to keep the session established for some time
//using mongo store to keep session live by storing in db
app.use(session({
    name: 'codeial',
    // TODO change the secret before deployment in production mode
    secret: 'blahsomething',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: (1000 * 60 * 100)
    },
    store: new MongoStore(
        {
            mongooseConnection: db,
            autoRemove: 'disabled'
        },
        function(err){
            console.log(err || 'connect-mongoDb setup ok');
        }
    )
}));



//passport js is used for authentication
app.use(passport.initialize());
app.use(passport.session());

app.use(passport.setAuthenticatedUser);

app.use(flash()); //below authentication as it uses its cookies
app.use(customMware.setFlash);


// use express router
app.use('/', require('./routes'));



app.listen(port, function(err){
    if(err){
        console.log(`There is an error in the server: ${err}`);
    }
    console.log(`Server is running on the port: ${port}`);
})