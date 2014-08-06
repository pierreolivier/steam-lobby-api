var express = require('express');
var router = express.Router();
var api = require('../lib/api');
var crypto = require('../lib/steam/rsa');

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { title: 'Steam Login' });
});

router.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var emailauth = req.body.emailauth;
    var captchaGid = req.body.captcha_gid;
    var captcha = req.body.captcha;

    api.getRsaKey(username, function(json) {
        if (json.success == true) {
            var pubKey = crypto.RSA.getPublicKey( json.publickey_mod, json.publickey_exp );
            username = username.replace( /[^\x00-\x7F]/g, '' );
            password = password.replace( /[^\x00-\x7F]/g, '' );
            var encryptedPassword = crypto.RSA.encrypt( password, pubKey );

            api.login(username, encryptedPassword, emailauth, captchaGid, captcha, json.timestamp, function(json, cookies) {
                if (json.success) {
                    var steamid = json.transfer_parameters.steamid;

                    res.send(api.loginSuccess(steamid, cookies));
                } else {
                    if (json.captcha_needed == true || json.emailauth_needed == true) {
                        res.send(api.loginErrorMessage(json.captcha_needed, json.captcha_gid, json.emailauth_needed, json.emaildomain));
                    } else {
                        res.send(api.loginIncorrectMessage());
                    }
                }
            });
        }
    });
});

router.post('/is_logged', function(req, res) {
    var steamid = req.body.steamid;
    var cookies = req.body.cookies;

    api.isLogged(steamid, cookies, function(logged) {
        res.send(api.isLoggedMessage(logged));
    });
});

router.post('/players', function(req, res) {
    var steamid = req.body.steamid;
    var cookies = req.body.cookies;

    api.lobby(steamid, cookies, function(html) {
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
                    var profileUrl = linkTokens[0];
                    var name = nameTokens[0];

                    currentPlayers.push(name);
                }

                res.send(currentPlayers);
            }
        }
    });
});

module.exports = router;
