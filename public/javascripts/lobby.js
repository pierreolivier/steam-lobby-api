/**
 * Created by Pierre-Olivier on 06/08/2014.
 */
var clientPlayer = null;

var updateEnable = false;
var cachePlayers = {};
var currentPlayers = [];

function createClientPlayer() {
    clientPlayer = new Player('/profiles/' + $.cookie("steamid"), 'me');
    clientPlayer.client = true;
    clientPlayer.updateFriends(dummy);
}

function startUpdatePlayers() {
    if (!updateEnable)
    updateEnable = true;

    async.whilst(
        function () { return updateEnable; },
        function (callback) {
            updatePlayers();

            setTimeout(callback, 5000);
        }, function (err) {
            // 5 seconds have passed
        }
    );
}

function stopUpdatePlayers() {
    updateEnable = false;
}

function addCachePlayer(player) {
    if (!(player.profileUrl in cachePlayers)) {
        cachePlayers[player.profileUrl] = player;

        return player;
    } else {
        return cachePlayers[player.profileUrl];
    }
}

function updatePlayers() {
    steamRequest('/profiles/' + $.cookie('steamid') + '/friends/players/', function (html) {
        var memberDivStart = html.split('<div id="memberList">');
        if (memberDivStart.length > 1) {
            var childrenDivMemberList = memberDivStart[1].split('div class="listOptions">');
            if (childrenDivMemberList.length > 0) {
                var result = childrenDivMemberList[0].trim();
                result = result.substring(0, result.length - 6);

                var tokens = result.split("linkFriend_");

                var players = [];
                for (var i = 1; i < tokens.length; i++) {
                    if (i > 5) {
                        break;
                    }

                    var connectionTokens = tokens[i].split("href=\"");
                    var linkTokens = connectionTokens[1].split("\">");
                    var nameTokens = linkTokens[1].split("</a><br />");
                    var profileUrl = linkTokens[0].substr(26);
                    var name = nameTokens[0];

                    var player = addCachePlayer(new Player(profileUrl, name));

                    players.push(player);
                }

                currentPlayers = players;

                async.each(players, function(player, cb) {
                    player.updateFriends(function (updated) {
                        cb();
                    });
                }, function (err) {
                    updatePremades();

                    console.log('update premades');
                });

                async.each(players, function(player, cb) {
                    async.parallel([
                        function(cb2){
                            player.updateHours(function (updated) {
                                cb2();
                            });
                        },
                        function(cb2){
                            player.updateRank(function (updated) {
                                cb2();
                            });
                        }
                    ],
                    function(err, results){
                        cb();
                    });

                }, function (err) {
                    console.log('update lobby');
                });
            }
        }
    });
}

function updatePremades() {
    var players = currentPlayers;

    clientPlayer.getFriends(function (clientFriends) {
        var i, j, k;

        var friends = [];
        for (i = 0; i < players.length + 1; i++) {
            friends[i] = [];
        }

        friends[0][0] = 0;
        for(i = 0 ; i < players.length ; i++) {
            var profileUrl = players[i].profileUrl;
            if(clientFriends.contains(profileUrl)) {
                friends[0][i + 1] = 1;
                friends[i + 1][0] = 1;
            } else {
                friends[0][i + 1] = 0;
                friends[i + 1][0] = 0;
            }
        }

        for(i = 0 ; i < players.length ; i++) {
            for(j = 0 ; j < players.length ; j++) {
                if(players[i].friends.contains(players[j].profileUrl)) {
                    friends[i + 1][j + 1] = 1;
                } else {
                    friends[i + 1][j + 1] = 0;
                }
            }
        }

        for(i = 1 ; i < players.length + 1 ; i++) {
            for(j = 1 ; j < players.length + 1 ; j++) {
                if(friends[i][j] == 1) {
                    friends[j][i] = 1;
                }
            }
        }

        var premades = [];
        var duoqsTemp = [];
        var duoqs = [];

        for ( i = 0 ; i < friends.length ; i++ ) { // for each player
            for ( j = i ; j < friends.length ; j++ ) { // check if each others are friends
                if ( j != i && friends[i][j] == 1) {
                    for ( k = j ; k < friends.length ; k++ ) { // if too players are friends, check if a third can be friend
                        if ( k != j && k != i && friends[j][k] == 1 && friends[i][k] == 1) {
                            // new premade
                            premades.push([i, j, k]);
                        }
                    }

                    // if duoq is not generated thanks to a premade
                    if (!duoqInPremade(premades, i, j)) {
                        duoqsTemp.push([i, j]);
                    } else {
                        console.log('useless duoq');
                    }
                }
            }
        }

        for (i = 0 ; i < duoqsTemp.length ; i++) {
            for (j = i ; j < duoqsTemp.length ; j++) {
                if (j != i) {
                    if (duoqsTemp[j][0] == duoqsTemp[i][0]) {
                        premades.push([duoqsTemp[i][0], duoqsTemp[i][1], duoqsTemp[j][1]]);
                    } else if (duoqsTemp[j][1] == duoqsTemp[i][0]) {
                        premades.push([duoqsTemp[i][0], duoqsTemp[i][1], duoqsTemp[j][0]]);
                    } else if (duoqsTemp[j][0] == duoqsTemp[i][1]) {
                        premades.push([duoqsTemp[i][0], duoqsTemp[i][1], duoqsTemp[j][1]]);
                    } else if (duoqsTemp[j][1] == duoqsTemp[i][1]) {
                        premades.push([duoqsTemp[i][0], duoqsTemp[i][1], duoqsTemp[j][0]]);
                    }
                }
            }
        }

        // clean duoqs
        for (i = 0 ; i < duoqsTemp.length ; i++) {
            if (!duoqInPremade(premades, duoqsTemp[i][0], duoqsTemp[i][1])) {
                duoqs.push([duoqsTemp[i][0], duoqsTemp[i][1]]);
            }
        }

        // show premades
        for (i = 0 ; i < premades.length ; i++) {
            console.log("premade : " + getPlayerName(premades[i][0]) + ", " + getPlayerName(premades[i][1]) + " and " + getPlayerName(premades[i][2]));
            //document.getElementById('teams_list').innerHTML += "premade : " + getPlayerName(premades[i][0]) + ", " + getPlayerName(premades[i][1]) + " and " + getPlayerName(premades[i][2]) + "<br />";
        }

        // show duoqs
        for (i = 0 ; i < duoqs.length ; i++) {
            console.log("duoq : " + getPlayerName(duoqs[i][0]) + " and " + getPlayerName(duoqs[i][1]));
            //document.getElementById('teams_list').innerHTML += "duoq : " + getPlayerName(duoqs[i][0]) + " and " + getPlayerName(duoqs[i][1]) + "<br />";
        }
    });
}

function duoqInPremade(premades, player1, player2) {
    for (var i = 0; i < premades.length ; i++) {
        if ( premades[i].contains(player1) && premades[i].contains(player2) ) {
            return true;
        }
    }

    return false;
}

function getPlayerName(index) {
    if(index == 0) {
        return "me";
    } else {
        if (index - 1 < currentPlayers.length) {
            return currentPlayers[index - 1].name;
        } else {
            return "error";
        }
    }
}