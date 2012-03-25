var restify = require('restify');
var http = require('http');
var server = restify.createServer();

// Adding /games route to the web service
server.get('/jams', function(req, res) {
    var client = require('mysql').createClient({'host':'localhost','port':3306,'user':'root','password':'root'});
    client.query('USE band');
    getJams(client, res);
});

server.listen(8080);

getJams = function(client, res) {
    client.query(
	'select j.id as id, j.title as title, j.artist as artist, ut.display_name as player from jams as j left join jams_needs as jn on j.id = jn.jam left join user_types as ut on jn.type = ut.id',
	function selectCb(error, results, fields) {
	    if (error) {
		console.log('GetData Error: ' + error.message);
		client.end();
	     return;
	    }
      
	    var element;
	    var jams_players = {};
	    var jams = [];

	    for( var i = 0; i < results.length; i++ ) {
		element = results[i];
		var id = element['id'];
		
		if(!jams_players[id]) {
		    jams_players[id] = element['player'];
		} else {
		    jams_players[id] += (", " + element['player']);
		}
	    }
	    processList(0, results, jams, jams_players, client, res);
	});
};

processList = function (i, results, jams, jams_players, client, response) {
    console.log("Boo");
    var element = results[i];
    var id = element['id'];
    
    i++;
    
    var http = require('http');
    var options = {
	host: 'developer.echonest.com',   
	port: 80,   
	path: '/api/v4/artist/images?api_key=N6E4NIOVYMTHNDM8J&name=Eric+Clapton&format=json&results=1&start=0&license=cc-by-sa'
    };
    
    var req = http.get(options, function(res) {
	console.log("Got response: " + res.statusCode);
	res.on('data', function(chunk) {
	    var o = JSON.parse(chunk.toString("utf8"));
	    console.log(chunk.toString("utf8"));
	    console.log(i);
	    console.log(o.response.images[0].url);

	    if(!containsJam(jams, id)) {
		console.log("a");
		jams.push({
		    id: id,
		    title: element['title'],
		    artist: element['artist'],
		    needed: jams_players[id],
		    img: o.response.images[0].url
		});
		console.log(jams.length);
	    }
	    if (i < results.length) {
		processList(i, results, jams, jams_players, client, response)
	    } else {
		
		response.send({
		    code: 200,
		    body: {
			jams: jams
		    }
		});
		
		client.end();
	    }
	 });
    }).on('error', function(e) {  
	 console.log("Got error: " + e.message);   
    });
}

containsJam = function (a, id) {
    for (var i = 0; i < a.length; i++) {
       if (a[i].id === id) {
           return true;
       }
    }
    return false;
};
