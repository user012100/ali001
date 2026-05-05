document.addEventListener('DOMContentLoaded', function () {

    // Fade in
    var overlay = document.getElementById('fade-overlay');
    setTimeout(function () {
        overlay.style.opacity = '0';
    }, 50);

    // Clock
    function updateTime() {
        var d = new Date();
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var hour = d.getHours();
        var min = d.getMinutes();
        var sec = d.getSeconds();
        var ampm = hour >= 12 ? 'PM' : 'AM';
        var hour12 = hour % 12 || 12;
        if (min < 10) min = '0' + min;
        if (sec < 10) sec = '0' + sec;
        document.getElementById('datetime').textContent =
            days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate() +
            ' ' + hour12 + ':' + min + ':' + sec + ' ' + ampm;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Lightbox
    var lightbox = document.getElementById('lightbox');
    var lightboxContent = document.getElementById('lightbox-content');

    document.querySelectorAll('[data-lightbox-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var type = this.dataset.lightboxType;
            var src = this.dataset.lightboxSrc;
            var label = this.dataset.lightboxLabel;
            lightboxContent.innerHTML = '';
            if (type === 'image') {
                var img = document.createElement('img');
                img.src = src;
                img.alt = label;
                lightboxContent.appendChild(img);
            } else if (type === 'video') {
                var vid = document.createElement('video');
                vid.src = src;
                vid.controls = true;
                vid.autoplay = true;
                vid.loop = true;
                lightboxContent.appendChild(vid);
            }
            lightbox.hidden = false;
            document.getElementById('lightbox-close').focus();
        });
    });

    function closeLightbox() {
        lightbox.hidden = true;
        var vid = lightboxContent.querySelector('video');
        if (vid) vid.pause();
        lightboxContent.innerHTML = '';
    }

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
        if (e.target === this) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
    });

});
