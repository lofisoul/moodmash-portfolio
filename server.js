var express = require('express');
var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

//spotify app ID
var client_id = 'e47bbc49931e47c9b58e0418a2d7f472';
var client_secret = '3e6111715f0a44eb871a290db9f148bf';
//local testing
var redirect_uri = 'http://localhost:9000/callback';
//heroku deployment
//var redirect_uri = 'https://moodmash.herokuapp.com/callback';
var user_id = '';

var PORT = process.env.PORT || 9000;
var app = express();

app.use(express.static(__dirname));


console.log(this);

app.get('/login', function(req,res){
  //auth flow step 1
  var state = '';
  var scope = 'user-read-private';
  // var querystring = 'https://accounts.spotify.com/authorize/?clien_id='+client_id+'&response_type=code&redirect_uri='+redirect_uri;
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));

});

app.get('/callback', function(req, res) {

  var code = req.query.code;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    json: true
  };
  console.log(authOptions);


  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

      var access_token = body.access_token,
      refresh_token = body.refresh_token;

      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      // log token to console for lazy fun
      //WORKING IN THE SERVER MORE
      request.get(options, function(error, response, body) {
        console.log(body.id);
        user_id = body.id;
        //if user id is in firebase -> cool! skip zip code step
        //else
          //create user Object
          //store id
          //run get zip code
      });

      // send the token to the browser. yay!
      //# on end ... and it will stay on page
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }));
      }

      else {
        res.redirect('/#' +
        querystring.stringify({
        error: 'invalid_token'
      }));
    }
  });
});

console.log('Spotify App running on port: 9000');


// Connection to PORT
app.listen(PORT, function() {
  console.log(`Listening On Port: ${PORT}`);
});
