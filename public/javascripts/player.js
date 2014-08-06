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

                        instance.lastUpdateHours = time();

                        cb();
                    }
                }
            }
        });
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

                        cb();
                    }
                }
            });
        }
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

                cb();
            });
        });
    }
};

Player.prototype.updateFriends = function () {
    var instance = this;

    if (time() - this.lastUpdateFriends > CACHE_TIMEOUT) {
        steamRequest(instance.profileUrl + "/friends", function (html) {
            var friends = [];

            var divMemberList = html.split("id=\"memberList\">");
            if (divMemberList.length > 1) {
                var friendBlocks = divMemberList[1].split("friendBlockLinkOverlay\" href=\"");

                for (var i = 1; i < friendBlocks.length; i++) {
                    var friendBlockLink = friendBlocks[i].split("\">");

                    friends.push(friendBlockLink[0].substr(26));
                }
            }

            instance.friends = friends;

            instance.lastUpdateFriends = time();

            console.log(friends);
        });
    }
};

Player.prototype.getHours = function (cb) {
    var instance = this;

    this.updateHours(function () {
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

    this.updateRank(function () {
        cb(instance.rank);
    });
};

Player.prototype.getFriends = function (cb) {
    var instance = this;

    this.updateFriends(function () {
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
