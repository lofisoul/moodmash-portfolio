//global vars

var widgetWidth = '100%';
var widgetHeight = 385;
var widgetUrl = "https://embed.spotify.com/?uri=";
var artists = [];
var thinArr = [];
var inTownEvents = [];
var userCity = '';
var genPlaylist = [];


function cityLaunch(e) {
    //$('*[data-emo="Productive"]').click();
    //hide the music stuff since user hasn't asked for a playlist yet
    $("#page2").hide();

    e.preventDefault();

    //set the user city
    userCity = $('#city').val().trim();

    //hide the login screen (you can animate this)
    $('#app-login').hide()

    //show the selection screen
    $('#app-main').show();
    $("#new-log-in").hide();
}

function genPlaylists(e) {
    e.preventDefault();
    //JN: topic should be OK to be locally scoped
    var topic = $(this).attr("data-emo");
    console.log("genPlaylists: topic = " + topic);
    var limit = 5 //Set Max results -> Could be an option FEATURE
    var queryUrl = "https://api.spotify.com/v1/search?q=" + topic + "&type=playlist&limit=" + limit;
    $.ajax({
        context: this,
        url: queryUrl,
        headers: { "Authorization": "Bearer " + access_token },
        method: "GET"
    }).done(function(response) {
        results = response.playlists.items;
        console.log("genPlaylists results -->");
        console.log(results);
        var max = 5;
        var min = 1;
        var num = parseInt(Math.random() * (max - min) + min);
        genPlaylist = results[num];
        console.log("genPlaylist -->")
        console.log(genPlaylist);
        var href = genPlaylist.href;
        console.log("genPlaylist.href = " + href);
        var uri = genPlaylist.uri;
        console.log("uri = " + uri);
        grabArtist(href);
        launchPlayer(uri, href);
    }); // end of done function response
}

function launchPlayer(uri, href) {
    //borrowed this code from above:
    // build this: <iframe src="" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>
    var widget = $("<iframe>");
    var playlistUrl = href;
    var playlistUri = uri;

    widget.attr({
        "width": widgetWidth, // see global variables
        "height": widgetHeight, // see global variables
        "frameborder": 0,
        "allowtransparency": "true",
        "src": widgetUrl + playlistUri // build url
    });
    console.log(widget);
    $("#widget-container").html(widget);
}


function reupSpotify() {
    $('.modal').addClass('activate');
}

function grabArtist(url) {
    console.log("grabArtist(url): " + url);
    $.ajax({
        context: this,
        url: url,
        headers: { "Authorization": "Bearer " + access_token },
        method: "GET"
    }).done(function(response) {
        console.log("grabArtist ajax call -->");
        console.log(response);
        for (i = 0; i < response.tracks.items.length; i++) {
            var artist = response.tracks.items[i].track.artists[0].name;
            artists.push(artist);
            //removing duplicates
            $.each(artists, function(i, el) {
                if ($.inArray(el, thinArr) === -1) thinArr.push(el);
            });
        }

    }).fail(function(jqXHR) {
        console.log('failing!');
        reupSpotify();
    });

    console.log("thinArr from grabArtist(): - - - - - - - - -");
    console.log(thinArr);

    searchShows(thinArr);
}

function searchShows(arr) {
    console.log("searchShows has been called");
    console.log("What's the array in searchShows? -->");
    //console.log(arr);
    $('#artist-events').append('<h3>Upcoming Shows in ' + userCity + '</h3>');
    //console.log("searchShows i is: " + arr[i]);

    //looping over thinned out artist array
    for (i = 0; i < arr.length; i++) {
        console.log("We are inside searchShows for loop on item #" + i);
        var queryUrl = "https://rest.bandsintown.com/artists/" + arr[i] + "/events?app_id=MoodMash"; // to add date range format is "&date=2017-03-01,2017-12-31";
        $.ajax({
            url: queryUrl,
            method: "GET"
        }).done(function(response) {
            eventListings = response;
            console.log("EVENT LISTINGS - - - - - - - - - - - - - - - - - - - -");
            //console.log(eventListings);

            for (i = 0; i < eventListings.length; i++) {

                if (eventListings[i].venue.city === userCity) {
                    var artistName = eventListings[i].lineup[0];
                    console.log("searchShows: artistName: " + artistName);

                    var convertedDate = moment(eventListings[i].datetime).format("MM/DD/YY" + ", " + "hh:mmA");
                    console.log("searchShows: convertedDate: " + convertedDate);

                    var venue = eventListings[i].venue.name;
                    console.log("searchShows: venue: " + venue);

                    var artistDiv = $('<div class="event-div">');
                    //JN: May want to structure this more
                    $(artistDiv).append('<h4>' + artistName + '</h4><div>Venue: ' + venue + '</div><div>Date: ' + convertedDate + '</div>');
                    if(artistDiv.length === 0) {
                      $(artistDiv).append('Sorry no shows near you.')
                    } else {
                      $('#artist-events').append(artistDiv);
                    }
                } else {}
            }
        }); // end of done function
    }
}

// ------------------------------------------------------------ CLICK EVENTS -----
//--------------------------------------------------------------------------------

$('#add-city').on('click', cityLaunch);
$('#emotions').on('click', '.btn-mood', genPlaylists);
$('#showsInTown').on('click', function(){
  $('#artist-events').slideToggle();
  $('#artist-events h3').remove();
  $('.event-div').each(function() {
    $(this).remove();
  })
  grabArtist(thinArr);
})
$('#diff').on('click', function(){
  $('#drawer').removeClass('active');
})
$(".btn-mood").on("click", function() {

    $("#drawer").addClass('active');

    $("#artist-events").empty();
    $("#playlist-items").empty();

    artists = [];

    topic = $(this).attr("data-emo");
    var listArr = [];
    // leaving this as playlist instead of artist because jason got the spotify authorization
    var queryUrl = "https://api.spotify.com/v1/search?q=" + topic + "&type=playlist";

    $("#moodDiv").empty();
    $("#moodDiv").append(this.getAttribute("data-emo"));
    $("#playlist-items").empty();

    //TH NOTE- BEGINNNIG of Firebase stuff========================================================
    var moodRef = firebase.database();
    var mood = this.getAttribute("data-emo");

    moodRef.ref().push({
        city: userCity,
        userMood: mood
    }); // end of moodRef push

    moodRef.ref().orderByChild('city').equalTo(userCity).limitToLast(3).on('child_added', function(snapshot) {
        var currentCity = snapshot.val().city;
        var cityMood = (snapshot.val().userMood + " | "); // TH note--all that empty space is to put space between words. I'm sure there's a more elgant way but going for quick and dirty
        $("#recent-moods").html(cityMood);
    });
    //TH NOTE --end of firebase stuff============

});


// ------------------------------------------------------------ FIREBASE -------
//------------------------------------------------------------------------------

//NOTE--TH:  I've changed the firebase database to one in my own account so I can see what's happening
// Initialize Firebase
var config = {
    apiKey: "AIzaSyBqVF2q_52BDrEYtc0QNmd6u_3kaKjNotA",
    authDomain: "moodmash-9186e.firebaseapp.com",
    databaseURL: "https://moodmash-9186e.firebaseio.com",
    storageBucket: "moodmash-9186e.appspot.com",
    messagingSenderId: "37101892502"
};
firebase.initializeApp(config);
//END of TH Firebase config stuff

//initialize the database
var database = firebase.database();

//set a ref to child -> moods
var btnRef = database.ref('moodList');

//click counter set to 0 globally ... within the click function reset it to the value being targeted
var clickCounter = 0;

//this function takes clicked element and adds ref/key to datatbase AND SHOULD UPDATE THE TIMES CLICKED
function countClicks(e) {
    e.preventDefault();
}

$("#item-buttons").on("click", ".topic-item", countClicks);

//THIS GETS THE ACCESS TOKEN DURING SESSION
function getTokenFromServer() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

//RENDER TOKEN
var token = getTokenFromServer();
var access_token = token.access_token;

//check if you got that token!
function tokenCheck() {
    //this function should run on page refresh!
    if (jQuery.isEmptyObject(token)) {
        //you are NOT authorized and can't use the app!
        return;
    } else {
        //will launch the next window
        $('#app-intro').hide();
        $('#app-login').show();
    }
}

$(document).ready(function() {
    tokenCheck();
});
