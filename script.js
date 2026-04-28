window.addEventListener('DOMContentLoaded', function () {
    (function() {

    var description = document.getElementById('description'),
        previousDisplay;

    window.onload = function() {
       previousDisplay = description.style.display;
       description.style.display = 'none';
    };

})();
    function getWindowScale() {
        if (window.innerWidth <= 700) {
            return 0.8;
        }
        return 1;
    }

    var overlay = document.getElementById('fade-overlay');
    setTimeout(function () {
        overlay.style.opacity = '0';
    }, 50);

    document.getElementById('restartBtnMenu').onclick = function () {
        overlay.style.opacity = '1';
        setTimeout(function () {
            location.reload();
        }, 1000);
    };

    var zIndex = 100;
    var openWindows = [];
    var defaultWindowPositions = [
        { top: 100, left: 170 },
        { top: 170, left: 340 },
        { top: 250, left: 220 },
        { top: 320, left: 400 }
    ];

    var folderContents = {
        websites: [
            { label: "[untold]", icon: "https://ali001.com/functions/assets/apple-touch-icon.png", url: "https://ali001.com/functions" },
            { label: "Gossip", icon: "", url: "https://ali001.com/links" },
            { label: "Persistence of Color", icon: "", url: "https://ali001.com/persistence-of-color" },
            { label: "Cult of the Ugly", icon: "", url: "https://user012100.github.io/spread" },
            { label: "Thoughts on Interaction of Color", icon: "", url: "https://user012100.github.io/manuscript" },
            { label: "Joanna Istanbul", icon: "", url: "https://joannaistanbul.com" },
            { label: "Nick Lambrou", icon: "images/icons/nl.png", url: "https://nlambrou.com" },
        ],
        artwork: [
            { label: "dinoboy-no-angel.jpg", icon: "images/artwork/dinoboy-no-angel.jpg", type: "image", url: "images/artwork/dinoboy-no-angel.jpg" },
            { label: "computerwife-canvas.mp4", icon: "images/artwork/computerwife-canvas.png", type: "video", url: "images/artwork/computerwife-canvas.mp4" }
        ],
    };

    function updateTime() {
        var d = new Date();
        var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var day = days[d.getDay()];
        var month = months[d.getMonth()];
        var date = d.getDate();
        var hour = d.getHours();
        var min = d.getMinutes();
        var sec = d.getSeconds();
        var ampm = 'AM';
        if (hour >= 12) {
            ampm = 'PM';
        }
        var hour12 = hour % 12;
        if (hour12 === 0) {
            hour12 = 12;
        }
        if (min < 10) min = "0" + min;
        if (sec < 10) sec = "0" + sec;
        var timeStr = day + " " + month + " " + date + " " + hour12 + ":" + min + ":" + sec + " " + ampm;
        document.getElementById('datetime').textContent = timeStr;
    }
    setInterval(updateTime, 1000);
    updateTime();

    function getNextWindowPos(app) {
        if (app === "p5-spaceship" || app === "spaceship.pde") {
            return { top: 20, left: 20 };
        }
        if (app === "music player") {
            return { top: 20, left: window.innerWidth - 520 };
        }

        var defaultWidth = 370;
        var defaultHeight = 250;

        var centerTop = (window.innerHeight - defaultHeight) / 2;
        var centerLeft = (window.innerWidth - defaultWidth) / 2;

        var offsetRange = 40;
        var randomOffsetTop = Math.floor(Math.random() * offsetRange * 2) - offsetRange;
        var randomOffsetLeft = Math.floor(Math.random() * offsetRange * 2) - offsetRange;

        var top = Math.max(20, centerTop + randomOffsetTop);
        var left = Math.max(20, centerLeft + randomOffsetLeft);

        return { top: top, left: left };
    }

    function closeWindowByApp(app) {
        var newOpen = [];
        for (var i = 0; i < openWindows.length; i++) {
            if (openWindows[i] !== app) {
                newOpen.push(openWindows[i]);
            }
        }
        openWindows = newOpen;
        var winEl = document.getElementById('window-' + app.replace(/\s/g, '-'));
        if (winEl) {
            if (winEl.p5instance && winEl.p5instance.remove) {
                winEl.p5instance.remove();
            }
            winEl.remove();
        }
        updateTaskbarTabs();
    }

    function makeWindow(app, forcePos, options) {
        if (document.getElementById('window-' + app.replace(/\s/g, '-'))) {
            focusWindow(app);
            return;
        }
        openWindows.push(app);
        var isMusicPlayer = (app === "music player");
        var isTerminal = (app === "terminal");
        var isVideoPlayer = (app === "video player");
        var isImageWindow = app.indexOf("image-") === 0;
        var isVideoWindow = app.indexOf("video-") === 0;
        var isP5Window = app.indexOf("p5-") === 0;
        var isFolder = folderContents.hasOwnProperty(app);

        var win = document.createElement('div');
        win.className = 'window';
        if (isMusicPlayer) win.className += ' music-player-window';
        if (isTerminal) win.className += ' terminal-window';
        if (isVideoPlayer) win.className += ' video-player-window';
        if (isFolder) win.className += ' folder-window';
        win.id = 'window-' + app.replace(/\s/g, '-');
        win.setAttribute('data-app', app);
        win.style.zIndex = zIndex + 1;
        zIndex = zIndex + 1;

        var pos = getNextWindowPos(app);
        if (isImageWindow || isVideoWindow || isP5Window) {
            win.style.width = '500px';
            if (isP5Window) {
                win.style.height = '737px';
                win.style.minHeight = '737px';
                win.style.maxHeight = '737px';
            } else {
                win.style.height = '537px';
                win.style.minHeight = '537px';
                win.style.maxHeight = '537px';
            }
            win.style.minWidth = '500px';
            win.style.maxWidth = '500px';
            win.style.top = pos.top + 'px';
            win.style.left = pos.left + 'px';
        } else if (window.innerWidth <= 700) {
            win.style.top = "12px";
            win.style.left = "auto";
            win.style.right = "12px";
        } else if (isMusicPlayer && forcePos !== false) {
            win.style.top = pos.top + "px";
            win.style.left = "auto";
            win.style.right = "20px";
        } else {
            win.style.top = pos.top + 'px';
            win.style.left = pos.left + 'px';
        }
        if (isVideoPlayer) {
            win.style.width = "400px";
            win.style.minWidth = "350px";
            win.style.maxWidth = "650px";
        }

        var windowTitle = app;
        if ((isImageWindow || isVideoWindow || isP5Window) && options && options.label) {
            windowTitle = options.label;
        }

        var contentHTML = "";
        if (isImageWindow) {
            contentHTML = '<div class="window-content" style="padding:0;display:flex;justify-content:center;align-items:center;height:500px;">' +
                '<img src="' + options.imgUrl + '" alt="' + options.label + '" width="500" height="500" style="display:block;"/>' +
                '</div>';
        } else if (isVideoWindow) {
            contentHTML = '<div class="window-content" style="padding:0;display:flex;justify-content:center;align-items:center;height:500px;">' +
                '<video src="' + options.videoUrl + '" width="500" height="500" style="display:block;object-fit:contain;background:#111;" autoplay loop muted playsinline></video>' +
                '</div>';
        } else if (isP5Window) {
            contentHTML = '<div class="window-content" style="padding:0;display:flex;justify-content:center;align-items:center;height:700px;">' +
                '<div id="p5-sketch-container-' + app.replace(/\s/g, '-') + '" style="width:500px;height:700px;display:flex;align-items:center;justify-content:center;background:#222;"></div>' +
                '</div>';
        } else {
            var className = "";
            if (isMusicPlayer) className = "music-player-content";
            if (isTerminal) className = "terminal-content";
            if (isVideoPlayer) className = "video-player-content";
            contentHTML = '<div class="window-content ' + className + '">' + getWindowContent(app) + '</div>';
        }

        win.innerHTML =
            '<div class="window-gradient"></div>' +
            '<div class="window-header" onmousedown="startDrag(event, this.parentElement)">' +
            windowTitle +
            '<span class="window-controls"><button type="button" class="close-btn-window">✕</button></span></div>' +
            contentHTML;

        document.body.appendChild(win);

        win.querySelector('.close-btn-window').addEventListener('click', function (e) {
            e.stopPropagation();
            if (win.p5instance && win.p5instance.remove) {
                win.p5instance.remove();
            }
            closeWindowByApp(app);
        });
        win.addEventListener('mousedown', function () {
            win.style.zIndex = zIndex + 1;
            zIndex = zIndex + 1;
        });
        updateTaskbarTabs();

        if (isTerminal) {
            var codeBox = win.querySelector('.terminal-code');
            if (codeBox) codeBox.textContent = codeSnippets.html;
            var tabs = win.querySelectorAll('.terminal-tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].addEventListener('click', function () {
                    for (var j = 0; j < tabs.length; j++) {
                        tabs[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    codeBox.textContent = codeSnippets[this.dataset.tab];
                });
            }
        }
        if (isMusicPlayer) {
            setTimeout(function () { initVisualizer(win); }, 250);
        }
        if (isVideoPlayer) {
            var resizer = win.querySelector('.video-player-resizer');
            var startX, startWidth;
            resizer.addEventListener('mousedown', function (e) {
                e.preventDefault();
                startX = e.clientX;
                startWidth = parseInt(document.defaultView.getComputedStyle(win).width, 10);
                win.classList.add('resizing');
                document.documentElement.addEventListener('mousemove', doDrag, false);
                document.documentElement.addEventListener('mouseup', stopDrag, false);
            });
            function doDrag(e) {
                var newWidth = startWidth + (e.clientX - startX);
                if (newWidth < 350) newWidth = 350;
                if (newWidth > 650) newWidth = 650;
                win.style.width = newWidth + 'px';
            }
            function stopDrag() {
                win.classList.remove('resizing');
                document.documentElement.removeEventListener('mousemove', doDrag, false);
                document.documentElement.removeEventListener('mouseup', stopDrag, false);
            }
        }
        if (isP5Window) {
            var container = win.querySelector('#p5-sketch-container-' + app.replace(/\s/g, '-'));
            var sketchName = app.replace(/^p5-/, '');
            var sketchFn = null;
            if (sketchName === "spaceship") sketchFn = window.spaceshipSketch;
            if (sketchFn) {
                if (window.p5 && window.p5.prototype && window.p5.prototype.remove) {
                    win.p5instance = new window.p5(sketchFn, container);
                } else {
                    var script = document.createElement('script');
                    script.src = "https://cdn.jsdelivr.net/npm/p5@1.9.2/lib/p5.min.js";
                    script.onload = function () {
                        setTimeout(function () {
                            win.p5instance = new window.p5(sketchFn, container);
                        }, 100);
                    };
                    document.head.appendChild(script);
                }
            } else {
                container.innerHTML = '<div style="color:#ff327d;font-size:1.1rem;padding:12px;">Sketch not found.</div>';
            }
        }
    }

    function focusWindow(app) {
        var win = document.getElementById('window-' + app.replace(/\s/g, '-'));
        if (win) {
            win.style.zIndex = zIndex + 1;
            zIndex = zIndex + 1;
            win.classList.add('window-flash');
            setTimeout(function () { win.classList.remove('window-flash'); }, 180);
        }
    }

    function updateTaskbarTabs() {
        var container = document.getElementById('openWindows');
        container.innerHTML = '';
        var maxTabs = 9;
        var toDisplay = [];
        for (var i = openWindows.length - maxTabs; i < openWindows.length; i++) {
            if (i >= 0) toDisplay.push(openWindows[i]);
        }
        for (var k = 0; k < toDisplay.length; k++) {
            var app = toDisplay[k];
            var iconUrl = "images/icons/folder.png";
            var label = app;
            var found = false;
            for (var folder in folderContents) {
                for (var q = 0; q < folderContents[folder].length; q++) {
                    var item = folderContents[folder][q];
                    var match = false;
                    if (item.label === app) match = true;
                    if (("image-" + (item.label && item.label.replace(/\s/g, '-').replace(/[^\w\-]/g, ''))) === app) match = true;
                    if (("video-" + (item.label && item.label.replace(/\s/g, '-').replace(/[^\w\-]/g, ''))) === app) match = true;
                    if (("p5-" + (item.sketch && item.sketch.replace(/\s/g, '-').replace(/[^\w\-]/g, ''))) === app) match = true;
                    if (match) {
                        iconUrl = item.icon || iconUrl;
                        label = item.label || label;
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) {
                if (app === "music player") iconUrl = "images/icons/music-player.png";
                if (app === "terminal") iconUrl = "images/icons/terminal.png";
                if (app === "video player") iconUrl = "images/icons/video-player.png";
                if (app === "about.txt") iconUrl = "images/icons/about.png";
            }
            var tab = document.createElement('div');
            tab.className = 'taskbar-tab';
            tab.setAttribute('data-app', app);
            tab.innerHTML =
                '<img src="' + iconUrl + '" class="icon-img" />' +
                '<span class="tab-label">' + label + '</span>' +
                '<button class="close-btn" type="button" title="Close">✕</button>';
            (function(appId) {
                tab.querySelector('.close-btn').addEventListener('click', function (e) {
                    e.stopPropagation();
                    closeWindowByApp(appId);
                });
            })(app);
            tab.onclick = (function (ap) {
                return function () { focusWindow(ap); };
            })(app);
            container.appendChild(tab);
        }
        container.scrollLeft = container.scrollWidth;
    }

    var desktopIcons = document.querySelectorAll('.icon');
    for (var i = 0; i < desktopIcons.length; i++) {
        desktopIcons[i].addEventListener('click', function () {
        this.classList.remove('bounce');
        void this.offsetWidth;
        this.classList.add('bounce');

        var app = this.dataset.app;

        if (document.getElementById('window-' + app.replace(/\s/g, '-'))) {
            focusWindow(app);
        } else {
            makeWindow(app);
        }
    });
    }

    setTimeout(function () {
        var musicIcon = document.querySelector('.icon[data-app="music player"]');
        if (musicIcon) {
            musicIcon.classList.remove('bounce');
            void musicIcon.offsetWidth;
            musicIcon.classList.add('bounce');
            musicIcon.addEventListener('animationend', function handler() {
                musicIcon.classList.remove('bounce');
                musicIcon.removeEventListener('animationend', handler);
            });
        }
    }, 1800);

    window.startDrag = function (e, win) {
        e.preventDefault();
        win.style.zIndex = zIndex + 1;
        zIndex = zIndex + 1;
        var sx = e.clientX, sy = e.clientY;
        var rect = win.getBoundingClientRect();
        var scale = getWindowScale();
        function move(ev) {
            var newLeft = (rect.left + (ev.clientX - sx)) / scale;
            var newTop = (rect.top + (ev.clientY - sy)) / scale;
            var winW = win.offsetWidth;
            var winH = win.offsetHeight;
            var vpW = window.innerWidth / scale;
            var vpH = window.innerHeight / scale;
            var minVisible = 15;
            if (newLeft + minVisible < 0) newLeft = -minVisible;
            if (newTop + minVisible < 0) newTop = -minVisible;
            if (newLeft + winW - minVisible > vpW) newLeft = vpW - winW + minVisible;
            if (newTop + winH - minVisible > vpH) newTop = vpH - winH + minVisible;
            win.style.left = (newLeft * scale) + "px";
            win.style.top = (newTop * scale) + "px";
            win.style.right = "auto";
        }
        function up() {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('touchend', up);
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
        document.addEventListener('touchmove', function (ev) {
            if (ev.touches.length === 1) move(ev.touches[0]);
        });
        document.addEventListener('touchend', up);
    };

    window.addEventListener('resize', function () {
        for (var i = 0; i < openWindows.length; i++) {
            var app = openWindows[i];
            var win = document.getElementById('window-' + app.replace(/\s/g, '-'));
            if (!win) continue;
            var winRect = win.getBoundingClientRect();
            var winW = win.offsetWidth, winH = win.offsetHeight;
            var vpW = window.innerWidth, vpH = window.innerHeight;
            var minVisible = 15;
            var left = winRect.left, top = winRect.top;
            var changed = false;
            if (left + minVisible < 0) { left = -minVisible; changed = true; }
            if (top + minVisible < 0) { top = -minVisible; changed = true; }
            if (left + winW - minVisible > vpW) { left = vpW - winW + minVisible; changed = true; }
            if (top + winH - minVisible > vpH) { top = vpH - winH + minVisible; changed = true; }
            if (changed) {
                win.style.left = left + 'px';
                win.style.top = top + 'px';
                win.style.right = "auto";
            }
        }
    });

    var startMenu = document.getElementById('startMenu');
    function toggleStartMenu() {
        if (startMenu.style.display === 'block') {
            startMenu.style.display = 'none';
        } else {
            startMenu.style.display = 'block';
        }
    }
    window.toggleStartMenu = toggleStartMenu;
    document.getElementById('homeButton').addEventListener('click', function (e) {
        e.stopPropagation();
        toggleStartMenu();
    });
    document.addEventListener('mousedown', function (e) {
        if (
            startMenu.style.display === 'block' &&
            !startMenu.contains(e.target) &&
            e.target.id !== "homeButton"
        ) {
            startMenu.style.display = 'none';
        }
    });
    var startMenuFolders = document.querySelectorAll('.start-menu-folder');
    for (var i = 0; i < startMenuFolders.length; i++) {
        startMenuFolders[i].addEventListener('click', function () {
            var app = this.dataset.app;
            
            if (document.getElementById('window-' + app.replace(/\s/g, '-'))) {
                focusWindow(app);
            } else {
                makeWindow(app);
            }
            startMenu.style.display = 'none';
        });
    }

    var codeSnippets = {
        html: '',
        css: '',
        js: ''
    };

    Promise.all([
        fetch('./index.html').then(res => res.text()),
        fetch('./style.css').then(res => res.text()),
        fetch('./script.js').then(res => res.text())
    ]).then(([html, css, js]) => {
        codeSnippets.html = html;
        codeSnippets.css = css;
        codeSnippets.js = js;
    });

    function getWindowContent(app) {
        if (folderContents[app]) {
            var html = '<div class="folder-grid">';
            for (var i = 0; i < folderContents[app].length; i++) {
                var item = folderContents[app][i];
                if (item.type === "p5") {
                    html += '<div class="icon" onclick="window.openP5Window(\'' + item.sketch + '\', \'' + item.label + '\')">' +
                        '<img src="' + item.icon + '" class="icon-img" />' +
                        '<div class="icon-label">' + item.label + '</div>' +
                        '</div>';
                } else if (item.type === "image") {
                    html += '<div class="icon" onclick="window.openImageWindow(\'' + item.url + '\', \'' + item.label + '\')">' +
                        '<img src="' + item.icon + '" class="icon-img" />' +
                        '<div class="icon-label">' + item.label + '</div>' +
                        '</div>';
                } else if (item.type === "video") {
                    html += '<div class="icon" onclick="window.openVideoWindow(\'' + item.url + '\', \'' + item.label + '\')">' +
                        '<img src="' + item.icon + '" class="icon-img" />' +
                        '<div class="icon-label">' + item.label + '</div>' +
                        '</div>';
                } else {
                    html += '<div class="icon" onclick="window.open(\'' + item.url + '\', \'_blank\')">' +
                        '<img src="' + item.icon + '" class="icon-img" />' +
                        '<div class="icon-label">' + item.label + '</div>' +
                        '</div>';
                }
            }
            html += '</div>';
            return html;
        }
        if (app === "music player") {
            return '<div class="music-player-visualizer-container" style="position:relative;">' +
                '<canvas id="music-visualizer" width="370" height="189"></canvas>' +
                '<div id="music-visualizer-fade" style="pointer-events:none; position:absolute;top:0;left:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity 0.5s;"></div>' +
                '</div>' +
                '<iframe class="soundcloud-embed" id="sc-widget" width="100%" height="100%" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/2024019159&color=%23ff5500&auto_play=true&hide_related=true&show_comments=true&show_user=true&show_reposts=false&show_teaser=false&visual=true" frameborder="0"></iframe>';
        }
        if (app === "video player") {
            return '<div class="video-player-resizer"></div>' +
                '<iframe class="video-player-embed" src="https://www.youtube.com/embed/videoseries?si=hD47nG1nlfz5Phfx&amp;list=PLvoACP_yh07Uw7ElH7BECcKqQ4c49FKBm" allow="autoplay; encrypted-media" allowfullscreen frameborder="0" tabindex="0"></iframe>';
        }
        if (app === "terminal") {
            return '<div class="terminal-tabs">' +
                '<button class="terminal-tab active" data-tab="html">HTML</button>' +
                '<button class="terminal-tab" data-tab="css">CSS</button>' +
                '<button class="terminal-tab" data-tab="js">JS</button>' +
                '<div class="terminal-tab-divider"></div>' +
                '</div>' +
                '<div class="terminal-code" id="terminalCode"></div>';
        }
        if (app === "about.txt") {
            return "my name is ali salifov, and im a multimedia artist based in new york. i like music, digital art, movies, books, zines. feel free to look around and explore my projects!";
        }
        return "[" + app + " content goes here]";
    }

    window.openImageWindow = function (imgUrl, label) {
        var appId = 'image-' + label.replace(/\s/g, '-').replace(/[^\w\-]/g, '');
        if (document.getElementById('window-' + appId)) {
            focusWindow(appId);
            return;
        }
        makeWindow(appId, false, { imgUrl: imgUrl, label: label });
    };
    window.openVideoWindow = function (videoUrl, label) {
        var appId = 'video-' + label.replace(/\s/g, '-').replace(/[^\w\-]/g, '');
        if (document.getElementById('window-' + appId)) {
            focusWindow(appId);
            return;
        }
        makeWindow(appId, false, { videoUrl: videoUrl, label: label });
    };
    window.openP5Window = function (sketchName, label) {
        var appId = 'p5-' + sketchName.replace(/\s/g, '-').replace(/[^\w\-]/g, '');
        if (document.getElementById('window-' + appId)) {
            focusWindow(appId);
            return;
        }
        makeWindow(appId, false, { label: label });
    };

    function initVisualizer(win) {
        var visCanvas = win.querySelector('#music-visualizer');
        var fadeOverlay = win.querySelector('#music-visualizer-fade');
        if (!visCanvas) return;
        var VIS_WIDTH = 370;
        var VIS_HEIGHT = 189;
        var NUM_CIRCLES = 10;
        var ctx = visCanvas.getContext('2d');
        var animationSpeed = 1;
        var animationTarget = 1;
        var animationEase = 0.12;
        function getSimpleColor(isSolid) {
            if (isSolid) return 'rgba(0,0,0,0.95)';
            var hue = Math.floor(Math.random() * 360);
            var sat = Math.floor(80 + Math.random() * 20);
            var light = Math.floor(40 + Math.random() * 30);
            var alpha = 0.7 + Math.random() * 0.16;
            return "hsla(" + hue + "," + sat + "%," + light + "%," + alpha + ")";
        }
        function drawSimpleGradient(ctx, x, y, r, color) {
            var grad = ctx.createRadialGradient(x, y, r * 0.05, x, y, r);
            grad.addColorStop(0, color.split(',').slice(0, 3).join(',') + ',1)');
            grad.addColorStop(1, color.split(',').slice(0, 3).join(',') + ',0)');
            return grad;
        }
        function Circle() { this.reset(); }
        Circle.prototype.reset = function () {
            this.x = VIS_WIDTH / 2 + (Math.random() - 0.5) * (VIS_WIDTH * 0.7);
            this.y = VIS_HEIGHT / 2 + (Math.random() - 0.5) * (VIS_HEIGHT * 0.65);
            this.r0 = 18 + Math.random() * 44;
            this.r = this.r0;
            this.vx = (Math.random() - 0.5) * 0.27;
            this.vy = (Math.random() - 0.5) * 0.23;
            this.fadeType = "fade";
            if (Math.random() < 0.25) this.fadeType = "solid";
            this.age = 0;
            this.lifetime = 140 + Math.random() * 80;
            this.color = getSimpleColor(this.fadeType === "solid");
            this.hasGradient = (this.fadeType !== "solid") && (Math.random() > 0.4);
            this.gradient = null;
        };
        Circle.prototype.update = function (speed) {
            this.x += this.vx * speed;
            this.y += this.vy * speed;
            this.age += speed;
            if (
                this.x < -this.r || this.x > VIS_WIDTH + this.r ||
                this.y < -this.r || this.y > VIS_HEIGHT + this.r ||
                this.age > this.lifetime
            ) this.reset();
        };
        Circle.prototype.draw = function (ctx) {
            var t = this.age / this.lifetime;
            var fade = 1;
            if (t < 0.15) fade = t / 0.15;
            else if (t > 0.85) fade = (1 - t) / 0.15;
            fade = Math.max(0, Math.min(1, fade));
            ctx.save();
            if (this.hasGradient) {
                var grad = drawSimpleGradient(ctx, this.x, this.y, this.r, this.color);
                ctx.globalAlpha = fade;
                ctx.fillStyle = grad;
            } else {
                ctx.globalAlpha = fade;
                ctx.fillStyle = this.color;
            }
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        var circles = [];
        for (var i = 0; i < NUM_CIRCLES; ++i) circles.push(new Circle());
        function render() {
            animationSpeed += (animationTarget - animationSpeed) * animationEase;
            ctx.clearRect(0, 0, VIS_WIDTH, VIS_HEIGHT);
            for (var j = 0; j < circles.length; j++) {
                circles[j].update(animationSpeed);
                circles[j].draw(ctx);
            }
            requestAnimationFrame(render);
        }
        render();
        function setFadeOverlay(visible) {
            if (!fadeOverlay) return;
            if (visible) {
                fadeOverlay.style.opacity = "1";
            } else {
                fadeOverlay.style.opacity = "0";
            }
        }
        function pauseVisualizer() { animationTarget = 0; setFadeOverlay(true); }
        function playVisualizer() { animationTarget = 1; setFadeOverlay(false); }
        function setupSoundCloudWidget() {
            if (!window.SC || !window.SC.Widget) {
                var script = document.createElement('script');
                script.src = "https://w.soundcloud.com/player/api.js";
                script.onload = setupSoundCloudWidget;
                document.head.appendChild(script);
                return;
            }
            var iframe = win.querySelector('#sc-widget');
            if (!iframe) iframe = win.querySelector('.soundcloud-embed');
            if (!iframe) return;
            var widget = window.SC.Widget(iframe);
            widget.bind(window.SC.Widget.Events.PLAY, playVisualizer);
            widget.bind(window.SC.Widget.Events.PAUSE, pauseVisualizer);
            widget.isPaused(function (paused) {
                if (paused) pauseVisualizer();
                else playVisualizer();
            });
        }
        setupSoundCloudWidget();
    }

    setTimeout(function () { makeWindow("music player", true); }, 2000);

    window.spaceshipSketch = function (p) {
        var counter = 0;
        var enemies = 0;
        var waves = 1;
        var x_pos;
        var spaceship, spaceship_left, spaceship_right, bg_img, invader_1, invader_2, invader_3, explosion;
        var character;
        var tile1, tile2;
        var invader;
        p.preload = function () {
            invader_1 = p.loadImage('images/games/spaceship/invader_1.png');
            invader_2 = p.loadImage('images/games/spaceship/invader_2.png');
            invader_3 = p.loadImage('images/games/spaceship/invader_3.png');
            spaceship = p.loadImage('images/games/spaceship/spaceship.png');
            spaceship_left = p.loadImage('images/games/spaceship/spaceship_left.png');
            spaceship_right = p.loadImage('images/games/spaceship/spaceship_right.png');
            bg_img = p.loadImage('images/games/spaceship/background.jpg');
            explosion = p.loadImage('images/games/spaceship/explosion.png');
        };
        p.setup = function () {
            p.createCanvas(500, 700);
            if (explosion) explosion.resize(50, 50);
            if (bg_img) bg_img.resize(500, 700);
            character = new Player(625, 50, 3);
            tile1 = new BgTile(0, 3);
            tile2 = new BgTile(-700, 3);
            invader = new Enemy(250, -100, 4.2);
            x_pos = 225;
            p.noSmooth();
        };
        p.draw = function () {
            if (!bg_img || !invader_1 || !invader_2 || !invader_3 || !spaceship || !spaceship_left || !spaceship_right || !explosion) {
                p.background(34);
                p.fill('#ff327d');
                p.textAlign(p.CENTER);
                p.textSize(18);
                p.text("Error: missing assets in /images/games/spaceship/\n(check JS console)", p.width / 2, p.height / 2 - 10);
                return;
            }
            tile1.scroll();
            tile2.scroll();
            character.display();
            invader.spawnEnemy(x_pos);
            p.fill(255);
            p.textAlign(p.LEFT);
            p.textFont('VT323');
            if (counter === 0) {
                p.textSize(28);
                p.text("PRESS ANY BUTTON TO START", 110, 300);
                p.text("USE ARROWS OR 'A/D' TO DODGE", 90, 330);
            } else if (counter === 1) {
                x_pos = character.get_position();
            } else if (counter === 2) {
                p.textSize(28);
                p.text("YOU EXPLODED!", 183, 270);
                p.text("YOUR SCORE: " + enemies, 176, 300);
                p.text("PRESS 'SPACEBAR'", 163, 360);
                p.text("TO PLAY AGAIN", 178, 390);
            }
        };
        function Enemy(x, y, v) {
            this.x_pos = x;
            this.y_pos = y;
            this.speed = v;
        }
        Enemy.prototype.spawnEnemy = function (ship_pos) {
            if (counter === 2) {
                this.x_pos = 250;
                this.y_pos = -100;
                this.speed = 4.2;
            } else if (counter === 1) {
                if (waves % 3 === 1) {
                    p.image(invader_1, this.x_pos, this.y_pos, 44, 32);
                } else if (waves % 3 === 2) {
                    p.image(invader_2, this.x_pos, this.y_pos, 44, 32);
                } else if (waves % 3 === 0) {
                    p.image(invader_3, this.x_pos, this.y_pos, 44, 32);
                }
                this.y_pos += this.speed;
                if (this.y_pos >= 720) {
                    if ((enemies !== 0) && (enemies % 10 === 0)) {
                        waves++;
                    }
                    this.y_pos = -50;
                    this.x_pos = Math.floor(p.random(25, 425));
                    this.speed = p.random(5 + waves, 7 + waves);
                    enemies++;
                } else if (this.y_pos >= 622 && this.y_pos <= 655) {
                    if ((ship_pos >= this.x_pos && ship_pos <= (this.x_pos + 44)) ||
                        ((ship_pos + 50) >= this.x_pos && ship_pos <= (this.x_pos + 44))) {
                        counter = 2;
                    }
                }
            }
        };
        function BgTile(y, v) {
            this.y_pos = y;
            this.speed = v;
        }
        BgTile.prototype.scroll = function () {
            p.image(bg_img, 0, this.y_pos);
            this.y_pos += this.speed;
            if (this.y_pos >= 700) {
                this.y_pos = -700;
            } else if (counter === 2) {
                this.speed = 0;
            } else {
                this.speed = 3;
            }
        };
        function Player(y, s, v) {
            this.x_pos = 225;
            this.y_pos = y;
            this.size = s;
            this.speed = v;
            this.direction = "neutral";
        }
        Player.prototype.display = function () {
            if (this.direction === "neutral") {
                p.image(spaceship, this.x_pos, this.y_pos, this.size, this.size);
            } else if (this.direction === "right") {
                p.image(spaceship_left, this.x_pos, this.y_pos, this.size, this.size);
            } else if (this.direction === "left") {
                p.image(spaceship_right, this.x_pos, this.y_pos, this.size, this.size);
            }
            if (counter === 2) {
                p.image(explosion, this.x_pos, this.y_pos, this.size, this.size);
            }
            this.move();
        };
        Player.prototype.move = function () {
            if (this.direction === "left" && this.x_pos > 25) {
                this.x_pos -= this.speed;
            } else if (this.direction === "right" && this.x_pos < 425) {
                this.x_pos += this.speed;
            }
        };
        Player.prototype.pressed = function (left, right) {
            if (left) {
                this.direction = "left";
            } else if (right) {
                this.direction = "right";
            }
        };
        Player.prototype.released = function (left, right) {
            if (left || right) {
                this.direction = "neutral";
            }
        };
        Player.prototype.get_position = function () {
            return this.x_pos;
        };
        p.keyPressed = function () {
            if (counter === 0) {
                counter = 1;
            } else if (counter === 1) {
                character.pressed((p.key === 'a' || p.keyCode === p.LEFT_ARROW), (p.key === 'd' || p.keyCode === p.RIGHT_ARROW));
            } else if (counter === 2) {
                if (p.key === ' ') {
                    counter = 1;
                    enemies = 0;
                    waves = 1;
                }
            }
        };
        p.keyReleased = function () {
            character.released((p.key === 'a' || p.keyCode === p.LEFT_ARROW), (p.key === 'd' || p.keyCode === p.RIGHT_ARROW));
        };
    };
});