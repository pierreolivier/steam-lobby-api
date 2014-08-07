function steamRequest(url, cb) {
    console.log(url);
    // console.log(new Error('dummy').stack);
    $.ajax({
        type: 'post',
        url: '/proxy',
        data: 'url=' + encodeURIComponent(url) + '&cookies=' + $.cookie('steam'),
        dataType: 'html',
        cache: false,
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
}

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
        data: 'username=' + username + '&password=' + password + '&emailauth=' + emailauth + '&captcha_gid=' + captchaGid + '&captcha=' + captcha,
        dataType: 'json',
        cache: false,
        success: function(json, statut){
            console.log(json);

            if (!json.success) {
                if (json.captcha_needed == true) {
                    captchaGid = json.captcha_gid;

                    $('#captcha_img').attr('src', 'https://steamcommunity.com/public/captcha.php?gid=' + json.captcha_gid).load(function () {
                        $('#captcha').show();
                    });
                } else {
                    $('#captcha').hide();
                }

                if (json.emailauth_needed == true) {
                    $('#steam_guard').show();
                } else {
                    $('#steam_guard').hide();
                }

                captchaGid = '-1';
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

    startUpdatePlayers();
}

function handlePlayers(players) {
    $('#playersPanel').empty();

    for (var i = 0 ; i < players.length ; i++) {
        var player = players[i];

        $('#playersPanel').append('<div class="playerElement"><div class="name"><a href="http://steamcommunity.com/' + player.profileUrl + '" target="_blank">' + player.name + '</a></div><div class="hours">' + player.hours + ' hours played</div><div class="rank">' + player.rank + 'th</div></div>');
    }
}