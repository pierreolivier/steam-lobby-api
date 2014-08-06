/**
 * Created by Pierre-Olivier on 06/08/2014.
 */

function updatePlayers() {
    steamRequest('/profiles/' + $.cookie('steamid') + '/friends/players/', function (html) {
        var memberDivStart = html.split('<div id="memberList">');
        if (memberDivStart.length > 1) {
            var childrenDivMemberList = memberDivStart[1].split('div class="listOptions">');
            if (childrenDivMemberList.length > 0) {
                var result = childrenDivMemberList[0].trim();
                result = result.substring(0, result.length - 6);

                var tokens = result.split("linkFriend_");

                var currentPlayers = [];
                for (var i = 1; i < tokens.length; i++) {
                    if (i > 5) {
                        break;
                    }

                    var connectionTokens = tokens[i].split("href=\"");
                    var linkTokens = connectionTokens[1].split("\">");
                    var nameTokens = linkTokens[1].split("</a><br />");
                    var profileUrl = linkTokens[0].substr(26);
                    var name = nameTokens[0];

                    var player = new Player(profileUrl, name);

                    currentPlayers.push(player);
                }

                console.log(currentPlayers);
            }
        }
    });
}