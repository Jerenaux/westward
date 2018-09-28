
var VIEW_WIDTH = 32;
var VIEW_HEIGHT = 18;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var config = {
    //type: (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ? Phaser.CANVAS : Phaser.AUTO),
    type: Phaser.WEBGL,
    width: VIEW_WIDTH*TILE_WIDTH,
    height: VIEW_HEIGHT*TILE_HEIGHT,
    parent: 'game',
    scene: [Boot, UI, Engine]
};

var game = new Phaser.Game(config);



function detectBrowser(){
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    if(isOpera) return 'Opera';

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if(isFirefox) return 'Firefox';

    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
    if(isSafari) return 'Safari';

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    if(isIE) return 'IE';

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    if(isEdge) return 'Edge';

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    if(isChrome) return 'Chrome';

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    if(isBlink) return 'Blink';

    return 'unknown';
}