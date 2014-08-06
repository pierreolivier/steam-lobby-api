function steamRequest(url, cb) {
    $.ajax({
        type: 'post',
        url: '/proxy',
        data: 'url=' + url + '&cookies=' + $.cookie('steam'),
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