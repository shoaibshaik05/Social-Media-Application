const express = require('express');
const app = express();
const port = 8000;


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