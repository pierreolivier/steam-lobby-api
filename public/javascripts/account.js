/**
 * Created by Pierre-Olivier on 09/08/2014.
 */

var clientAccounts = {};

function initAccounts() {
    var c = cookies();

    clientAccounts = {};

    for (var cookieName in c) {
        if (c.hasOwnProperty(cookieName)) {
            if (cookieName.indexOf('account_') != -1) {
                try {
                    var account = JSON.parse(c[cookieName]);

                    account.steamid = cookieName.substr(8);

                    clientAccounts[account.steamid] = account;
                } catch (e) {
                    $.cookie(cookieName, '', { expires: 0 });
                }
            }
        }
    }

    handleAccounts(clientAccounts);
}

function addAccount(steamid, name, cookie) {
    $.cookie('account_' + steamid, '{"name": "' + name + '", "cookie": "' + cookie + '"}', { expires: 30 });

    clientAccounts[steamid] = {steamid : steamid, name: name, cookie: cookie};

    handleAccounts(clientAccounts);
}

function switchAccount(steamid, click) {
    if (click) {
        $('#dl-menu').dlmenu("closeMenu");

        $('#accountMenu').hide();

        setTimeout(function () {
            $('#dl-menu').find('ul').removeClass('dl-subview');
            $('#accountMenu').removeAttr('style');
        }, 1000);
    }

    if (steamid in clientAccounts) {
        var account = clientAccounts[steamid];

        $.cookie("steamid", steamid, { expires: 30 });
        $.cookie("steam", account.cookie, { expires: 30 });

        showMessage('welcome ' + account.name + ' !', 2000);
    }
}

function clearAccounts() {
    var c = cookies();

    clientAccounts = {};

    for (var cookieName in c) {
        if (c.hasOwnProperty(cookieName)) {
            if (cookieName.indexOf('account_') != -1) {
                $.cookie(cookieName, '', { expires: 0 });
            }
        }
    }

    handleAccounts(clientAccounts);
}