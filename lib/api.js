/**
 * Created by Pierre-Olivier on 06/08/2014.
 */
var request = require('request');

exports.getRsaKey = function(username, output) {
    var data = {form: {username: username, donotcache: ( new Date().getTime() )}};
    request.post('https://steamcommunity.com/mobilelogin/getrsakey/', data, function(error, response, body){
        output(JSON.parse(body));
    });
};

exports.login = function(username, encryptedPassword, emailauth, captchaGid, captchaText, timestamp, emailSteamid, output) {
    var jar = request.jar();
    var data = {
        username: username,
        password: encryptedPassword,
        twofactorcode: '',
        emailauth: emailauth,
        loginfriendlyname: 'Client mobile Steam',
        oauth_client_id: '',
        captchagid: captchaGid,
        captcha_text: captchaText,
        emailsteamid: emailSteamid,
        rsatimestamp: timestamp,
        remember_login: 'true',
        donotcache: ( new Date().getTime() )
    };

    request.post({
        url: 'https://steamcommunity.com/mobilelogin/dologin/',
        jar: jar,
        form: data,
        timeout: 10000
    }, function(error, response, body) {
        var json = JSON.parse(body);

        console.log(body);

        output(json, jar.getCookieString('https://steamcommunity.com/'));
    });
};

exports.loginSuccess = function (steamid, cookies) {
    return '{"success": true, "message": "login_success", "steamid": "' + steamid + '", "cookies": "' + cookies + '"}';
};

exports.loginErrorMessage = function (captchaNeeded, captchaGid, emailauthNeeded, emailDomain, emailSteamid) {
    if (captchaNeeded == undefined) {
        captchaNeeded = false;
    }
    if (emailauthNeeded == undefined) {
        emailauthNeeded = false;
    }
    return '{"success": false, "message": "user_action", "captcha_needed": ' + captchaNeeded + ', "captcha_gid": "' + captchaGid + '", "emailauth_needed": ' + emailauthNeeded + ', "emaildomain": "' + emailDomain + '", "emailsteamid": "' + emailSteamid +'"}';
};

exports.loginIncorrectMessage = function () {
    return '{"success": false, "message": "incorrect_login"}';
};

exports.isLogged = function(steamid, cookies, cb) {
    if (steamid == 'undefined') {
        steamid = '7611111111111111';
    }
    if (cookies == 'undefined') {
        cookies = '';
    }

    request.get({
        url: 'http://steamcommunity.com/profiles/' + steamid + '/home/',
        headers: {
            'Cookie': cookies
        }
    }, function(error, response, body) {
        if (response.req.path.indexOf("/login/home/") == -1) {
            cb(true);
        } else {
            cb(false);
        }
    });
};

exports.isLoggedMessage = function (logged) {
    return '{"success": ' + logged + '}';
};

exports.proxy = function(url, cookies, cb) {
    request.get({
        url: 'https://steamcommunity.com' + url,
        headers: {
            'Cookie': cookies
        }
    }, function(error, response, body) {
        cb(body);
    });
};
