/**
 * Created by Pierre-Olivier on 06/08/2014.
 */

CACHE_TIMEOUT = 600000;

function Player(profileUrl, name) {
    this.profileUrl = profileUrl;
    this.name = name;
    this.hours = '0';
    this.steamid = '';
    this.rank = '';
    this.friends = [];
    this.lastUpdateHours = 0;
    this.lastUpdateFriends = 0;
    this.lastUpdateRank = 0;
    this.order = 0;
    this.client = false;
    this.clientLoaded = false;
}

Player.prototype.fromCache = function (hours, order, rank) {
    this.hours = hours;
    this.order = order;
    this.rank = rank;

    this.lastUpdateHours = 9007199254740992;
    this.lastUpdateFriends = 9007199254740992;
    this.lastUpdateRank = 9007199254740992;
};

Player.prototype.updateHours = function (cb) {
    var instance = this;

    if (time() - this.lastUpdateHours > CACHE_TIMEOUT) {
        steamRequest(instance.profileUrl + "/games?tab=all", function (html) {
            var divGame = html.split("\"appid\":204300");
            if (divGame.length > 1) {
                var h5DivGame = divGame[1].split("\",\"last_played");
                if (h5DivGame.length > 0) {
                    var h5HoursPlayed = h5DivGame[0].split("hours_forever\":\"");
                    if (h5HoursPlayed.length > 1) {
                        instance.hours = h5HoursPlayed[1];
                    }
                }
            }

            instance.lastUpdateHours = time();

            cb(true);
        });
    } else {
        cb(false);
    }
};

Player.prototype.updateSteamId = function (cb) {
    var instance = this;

    if (this.steamid == '') {
        if (this.profileUrl.indexOf("/profiles/") != -1) {
            var arguments = this.profileUrl.split("/");

            this.steamid = arguments[arguments.length - 1];

            cb();
        } else {
            steamRequest(instance.profileUrl, function (html) {
                var arrayStart = html.split("steamid\":\"");
                if (arrayStart.length > 1) {
                    var arrayEnd = arrayStart[1].split("\"");

                    if (arrayEnd.length > 0) {
                        instance.steamid = arrayEnd[0];
                    }
                }

                cb();
            });
        }
    } else {
        cb();
    }
};

Player.prototype.updateRank = function (cb) {
    var instance = this;

    if (time() - this.lastUpdateRank > CACHE_TIMEOUT) {
        this.getSteamid(function (steamid) {
            steamRequest('/stats/204300/leaderboards/397491/?xml=1&steamid=' + steamid, function (html) {
                var xmlDoc = $.parseXML(html);

                if (instance.rank = $(xmlDoc).find("steamid:contains(" + steamid + ")").siblings('rank').length > 0) {
                    instance.rank = $(xmlDoc).find("steamid:contains(" + steamid + ")").siblings('rank')[0].innerHTML;

                    instance.lastUpdateRank = time();
                }

                cb(true);
            });
        });
    } else {
        cb(false);
    }
};

Player.prototype.updateFriends = function (cb) {
    var instance = this;

    if (time() - this.lastUpdateFriends > CACHE_TIMEOUT) {
        steamRequest(instance.profileUrl + "/friends", function (html) {
            var divId = 'memberList';
            if (instance.client) {
                divId = 'friendListForm';

                if (!instance.clientLoaded) {
                    var htmlDoc = $(html);

                    var nameSelect = htmlDoc.find('a.whiteLink');
                    if (nameSelect.length > 0) {
                        instance.name = nameSelect[0].innerHTML;

                        showMessage('welcome ' + instance.name + ' !', 2000);
                    }

                    var profileUrlSelect = htmlDoc.find('div.profile_small_header_texture a');
                    if (profileUrlSelect.length > 0) {
                        instance.profileUrl = profileUrlSelect[0].href.substr(26);
                    }

                    instance.clientLoaded = true;

                    setTimeout(startUpdatePlayers, 2000);
                }
            }

            var friends = [];

            var divMemberList = html.split("id=\"" + divId + "\">");
            if (divMemberList.length > 1) {
                var friendBlocks = divMemberList[1].split("friendBlockLinkOverlay\" href=\"");

                for (var i = 1; i < friendBlocks.length; i++) {
                    var friendBlockLink = friendBlocks[i].split("\">");

                    friends.push(friendBlockLink[0].substr(26));
                }
            }

            instance.friends = friends;

            instance.lastUpdateFriends = time();

            cb(true);
        });
    } else {
        cb(false);
    }
};

Player.prototype.getHours = function (cb) {
    var instance = this;

    this.updateHours(function (updated) {
        cb(instance.hours);
    });
};

Player.prototype.getSteamid = function (cb) {
    var instance = this;

    this.updateSteamId(function () {
        cb(instance.steamid);
    });
};

Player.prototype.getRank = function (cb) {
    var instance = this;

    this.updateRank(function (updated) {
        cb(instance.rank);
    });
};

Player.prototype.getFriends = function (cb) {
    var instance = this;

    this.updateFriends(function (updated) {
        cb(instance.friends);
    });
};

Player.prototype.serialize = function() {
    var json = "{";

    json += "\"profile_url\":\"" + this.profileUrl + "\",";
    json += "\"name\":\"" + this.name + "\",";
    json += "\"hours\":\"" + this.hours + "\",";
    json += "\"rank\":\"" + this.rank + "\",";
    json += "\"order\":\"" + this.order + "\"";

    json += "}";

    return json;
};
