const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8000;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');


//middle wares
app.use(express.urlencoded());
app.use(cookieParser());


//use static(styling)
app.use(express.static('./assets'));

//use the layout before route as it'll be needing it 
app.use(expressLayouts);

//extract style and script from sub pages into layout
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);


// use express router
app.use('/', require('./routes'));

//setup the view engine 
app.set('view engine', 'ejs');
app.set('views', './views');


app.listen(port, function(err){
    if(err){
        console.log(`There is an error in the server: ${err}`);
    }
    console.log(`Server is running on the port: ${port}`);
})