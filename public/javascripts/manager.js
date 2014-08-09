var captchaGid = '-1';
var emailSteamid = '';

function steamRequest(url, cb) {
    console.log(url);
    // console.log(new Error('dummy').stack);
    $.ajax({
        type: 'post',
        url: '/proxy',
        data: 'url=' + encodeURIComponent(url) + '&cookies=' + $.cookie('steam'),
        dataType: 'html',
        cache: false,
        timeout: 15000,
        success: function(html, statut){
            cb(html);
        }
    });
}

function time() {
    return new Date().getTime();
}

function dummy() {
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
};

function login() {
    var form = document.forms['logon'];

    var username = form.elements['username'].value;
    var password = form.elements['password'].value;
    var emailauth = form.elements['emailauth'].value;
    var captcha = form.elements['captcha'].value;

    $('#steamGuard').val('');
    $('#steamCaptcha').val('');

    username = username.replace( /[^\x00-\x7F]/g, '' );
    password = password.replace( /[^\x00-\x7F]/g, '' );

    $.ajax({
        type: 'post',
        url: '/login',
        data: 'username=' + username + '&password=' + password + '&emailauth=' + emailauth + '&captcha_gid=' + getCaptchaGid() + '&captcha=' + encodeURIComponent(captcha) + '&emailsteamid=' + emailSteamid,
        dataType: 'json',
        cache: false,
        success: function(json, statut){
            console.log(json);

            if (!json.success) {
                if (json.captcha_needed == true) {
                    setCaptchaGid(json.captcha_gid);

                    $('#captcha_img').attr('src', 'https://steamcommunity.com/public/captcha.php?gid=' + getCaptchaGid()).load(function () {
                        $('#captcha').show();
                    });
                } else {
                    $('#captcha').hide();
                }

                if (json.emailauth_needed == true) {
                    emailSteamid = json.emailsteamid;
                    $('#steam_guard').show();
                } else {
                    $('#steam_guard').hide();
                }

                if (json.message == "incorrect_login") {
                    showMessage("Incorrect !");
                } else if (json.message == "user_action" && json.captcha_needed) {
                    showMessage("Enter the characters!");
                } else if (json.message == "user_action" && json.emailauth_needed) {
                    showMessage("Enter the guard code!");
                }
            } else {
                $.cookie("steamid", json.steamid, { expires: 30 });
                $.cookie("steam", json.cookies, { expires: 30 });

                $('#steam_guard').hide();
                $('#captcha').hide();

                $('#loginPanel').hide();

                logged();
            }
        }
    });
}

function logout() {
    stopUpdatePlayers();

    $.cookie('steamid', '', { expires: 0 });
    $.cookie('steam', '', { expires: 0 });

    location.reload();
}

function logged() {
    createClientPlayer();
}

function handleNoGameStarted() {
    $('#playersPanel').find('.backgroundElement').show();
    $('#playersContent').empty();

    $('#premadesPanel').find('.backgroundElement').show();
    $('#premadesContent').empty();

    showMessage("No game started");
}

function handlePlayers(players) {
    if (players.length > 0) {
        $('#playersPanel').find('.backgroundElement').hide();

        hideMessage();
    } else {
        $('#playersPanel').find('.backgroundElement').show();

        showMessage("Empty lobby");
    }

    $('#playersContent').empty();
    for (var i = 0 ; i < players.length ; i++) {
        var player = players[i];

        var hoursPlayed = "private profile";
        if (player.hours != "0") {
            hoursPlayed = player.hours + ' hours played';
        }

        $('#playersContent').append('<div class="playerElement"><div class="name"><a href="http://steamcommunity.com' + player.profileUrl + '" target="_blank">' + player.name + '</a></div><div class="hours">' + hoursPlayed + '</div><div class="rank">' + player.rank + 'th</div></div>');
    }
}

function handlePremades(premades) {
    if (premades.length > 0) {
        $('#premadesPanel').find('.backgroundElement').hide();
    } else {
        $('#premadesPanel').find('.backgroundElement').show();
    }

    $('#premadesContent').empty();
    for (var i = 0 ; i < premades.length ; i++) {
        $('#premadesContent').append(premades[i] + '<br /><br />');
    }
}

function handleRecentlyPlayedWith(players) {
    if (players.length > 0) {
        $('#recentlyPlayedWithPanel').find('.backgroundElement').hide();
    } else {
        $('#recentlyPlayedWithPanel').find('.backgroundElement').show();
    }

    $('#recentlyPlayedWithContent').empty();
    for (var i = players.length - 1 ; i >= 0 ; i--) {
        var player = players[i];

        var hoursPlayed = "private profile";
        if (player.hours != "0") {
            hoursPlayed = player.hours + ' hours played';
        }

        $('#recentlyPlayedWithContent').append('<div class="playerElement"><div class="name"><a href="http://steamcommunity.com' + player.profileUrl + '" target="_blank">' + player.name + '</a></div><div class="hours">' + hoursPlayed + '</div><div class="rank">' + player.rank + 'th</div></div>');
    }
}

function showMessage(message, time) {
    $('#footer').empty();

    $('#footer').append(message);

    $('#footer').animate({bottom:'0px'}, 300, function () {
        if (time > 0) {
            setTimeout(hideMessage, time);
        }
    });
}

function hideMessage() {
    $('#footer').animate({bottom:'-40px'}, 300, function () {

    });
}

function setCaptchaGid(gid) {
    captchaGid = gid;
}

function getCaptchaGid() {
    return captchaGid;
}

function setLobbyPanel(click) {
    if (click) {
        $('#dl-menu').find('button').click();
    }

    $('#lobbyPanel').show();
    $('#recentlyPlayedWithPanel').hide();
}

function setRecentlyPlayedWithPanel(click) {
    if (click) {
        $('#dl-menu').find('button').click();
    }

    handleRecentlyPlayedWith(recentlyPlayedWith);

    $('#lobbyPanel').hide();
    $('#recentlyPlayedWithPanel').show();
}