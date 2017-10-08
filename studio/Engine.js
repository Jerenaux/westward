    /**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32,
    baseViewHeight: 18,
    tileWidth: 32,
    tileHeight: 32
};

Engine.camera = {
    x: 0,
    y: 0,
    getPixelX: function(){
        return Engine.camera.x*Engine.tileWidth;
    },
    getPixelY: function(){
        return Engine.camera.y*Engine.tileHeight;
    }
};

Engine.boot = function(){
    Engine.renderer = PIXI.autoDetectRenderer(
        Engine.baseViewWidth*Engine.tileWidth,
        Engine.baseViewHeight*Engine.tileHeight,
        {
            antialias: false,
            view: document.getElementById('game'),
            preserveDrawingBuffer: true // to allow image captures from canvas
        }
    );
    Engine.viewWidth = Engine.baseViewWidth;
    Engine.viewHeight = Engine.baseViewHeight;

    Engine.setAction('move');
    //Engine.setAction('addForest');
    Engine.showGrid = Utils.getPreference('showGrid',false);
    Engine.showHero = Utils.getPreference('showHero',true);
    Engine.showHulls = Utils.getPreference('showHulls',false);
    Engine.selectionEnabled = Utils.getPreference('selectionEnabled',false);
    Engine.debug = true;
    Engine.zoomScale = 1;
    Engine.zoomScales= [0.01,0.025,0.05,0.1,0.25,0.5,0.75,1];
    Engine.zoomIndex = Engine.zoomScales.length-1;

    Engine.chunks = {}; // holds references to the Containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    Engine.computeStageLocation();

    Engine.stage = new PIXI.Container();
    Engine.blackBoard = new PIXI.Container(); // Stores all the graphics objects used for debugging (hulls, points...)
    Engine.blackBoard.z = 999;
    Engine.blackBoard.visible = Engine.showHulls;
    Engine.stage.addChild(Engine.blackBoard);
    Engine.editHistory = [];

    Engine.drawSelection();
    Engine.renderer.view.addEventListener('mousedown', Engine.handleClick, false);
    if(Engine.debug) {
        Engine.renderer.view.addEventListener('mouseup', Engine.handleMouseUp, false);
        Engine.renderer.view.addEventListener('mousemove', Engine.trackPosition, false);
        document.getElementById('w').value = 20;
        document.getElementById('h').value = 20;
        document.getElementById('n').value = 10;
    }

    //Engine.mapDataLocation = 'assets/maps/chunks';
    Engine.mapDataLocation = '/maps';
    Engine.loadJSON(Engine.mapDataLocation+'/master.json',Engine.readMaster);
};

Engine.drawSelection = function(){
    Engine.selection = new PIXI.Graphics();
    Engine.selection.lineStyle(2, 0xffffff, 1);
    Engine.selection.drawRect(0,0,0,0);
    Engine.selection.z = 999;
    Engine.selection.visible = false;
    Engine.stage.addChild(Engine.selection);
};

Engine.computeStageLocation = function(){
    Engine.location = {};
    Engine.location.offsetX = 0;
    Engine.location.offsetY = 0;
    var element = Engine.renderer.view;
    if (element.offsetParent !== undefined) {
        do {
            Engine.location.offsetX += element.offsetLeft;
            Engine.location.offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    var stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['paddingLeft'], 10)      || 0;
    var stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['paddingTop'], 10)       || 0;
    var styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['borderLeftWidth'], 10)  || 0;
    var styleBorderTop   = parseInt(document.defaultView.getComputedStyle(Engine.renderer.view, null)['borderTopWidth'], 10)   || 0;
    var html = document.body.parentNode;
    Engine.location.offsetX += stylePaddingLeft +  styleBorderLeft + html.offsetLeft;
    Engine.location.offsetY += stylePaddingTop +  styleBorderTop + html.offsetTop;
};

Engine.readMaster = function(masterData){
    Engine.tileWidth = masterData.tilesets[0].tilewidth;
    Engine.tileHeight = masterData.tilesets[0].tileheight;
    Engine.chunkWidth = masterData.chunkWidth;
    Engine.chunkHeight = masterData.chunkHeight;
    Engine.nbChunksHorizontal = masterData.nbChunksHoriz;
    Engine.nbChunksVertical = masterData.nbChunksVert;
    Engine.worldWidth = Engine.nbChunksHorizontal*Engine.chunkWidth;
    Engine.worldHeight = Engine.nbChunksVertical*Engine.chunkHeight;
    Engine.lastChunkID = (Engine.nbChunksHorizontal*Engine.nbChunksVertical)-1;
    Engine.nbLayers = masterData.nbLayers;

    Utils.chunkWidth = Engine.chunkWidth;
    Utils.chunkHeight = Engine.chunkHeight;
    Utils.nbChunksHorizontal = Engine.nbChunksHorizontal;
    Utils.nbChunksVertical = Engine.nbChunksVertical;
    Utils.lastChunkID = Engine.lastChunkID;

    console.log('Master file read, setting up world of size '+Engine.worldWidth+' x '+Engine.worldHeight+' with '+Engine.nbLayers+' layers');
    Engine.tilesets = masterData.tilesets;

    PIXI.loader.add('hero','../assets/sprites/hero.png');

    for(var i = 0; i < masterData.tilesets.length; i++){
        var tileset = masterData.tilesets[i];
        var path = '../assets/'+tileset.image.slice(2);// The paths in the master file are relative to the assets/maps directory
        PIXI.loader.add(tileset.name,path);
    }

    Engine.tilesetMap = {}; // maps tiles to tilesets;

    PIXI.loader.load(Engine.start);
};

Engine.loadJSON = function(path,callback,info){
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),info);
        }
    };
    xobj.send(null);
};

Engine.start = function(loader, resources){
    Engine.resources = resources;
    Engine.addHero();
    requestAnimationFrame(Engine.update);
    var pts = '[{"x":840,"y":10},{"x":834,"y":14},{"x":837,"y":15},{"x":835,"y":20},{"x":832,"y":25},{"x":830,"y":27},{"x":832,"y":33},{"x":827,"y":32},{"x":824,"y":34},{"x":820,"y":38},{"x":822,"y":42},{"x":822,"y":41},{"x":825,"y":41},{"x":825,"y":42},{"x":826,"y":41},{"x":830,"y":42},{"x":830,"y":46},{"x":826,"y":45},{"x":821,"y":50},{"x":820,"y":52},{"x":822,"y":54},{"x":821,"y":57},{"x":820,"y":58},{"x":818,"y":62},{"x":818,"y":67},{"x":818,"y":69},{"x":819,"y":71},{"x":820,"y":73},{"x":820,"y":75},{"x":819,"y":76},{"x":819,"y":79},{"x":821,"y":89},{"x":816,"y":100},{"x":815,"y":109},{"x":814,"y":113},{"x":810,"y":119},{"x":806,"y":123},{"x":800,"y":129},{"x":803,"y":130},{"x":799,"y":134},{"x":797,"y":138},{"x":784,"y":141},{"x":779,"y":140},{"x":776,"y":140},{"x":757,"y":134},{"x":755,"y":132},{"x":751,"y":130},{"x":752,"y":127},{"x":746,"y":125},{"x":739,"y":121},{"x":735,"y":123},{"x":730,"y":121},{"x":724,"y":120},{"x":720,"y":118},{"x":717,"y":115},{"x":714,"y":114},{"x":713,"y":113},{"x":710,"y":112},{"x":693,"y":106},{"x":687,"y":104},{"x":687,"y":107},{"x":682,"y":103},{"x":686,"y":101},{"x":671,"y":103},{"x":676,"y":98},{"x":657,"y":91},{"x":654,"y":89},{"x":646,"y":88},{"x":648,"y":84},{"x":648,"y":82},{"x":654,"y":77},{"x":655,"y":76},{"x":660,"y":71},{"x":661,"y":70},{"x":664,"y":65},{"x":659,"y":62},{"x":660,"y":61},{"x":662,"y":58},{"x":660,"y":54},{"x":667,"y":54},{"x":671,"y":54},{"x":675,"y":52},{"x":675,"y":55},{"x":680,"y":49},{"x":677,"y":47},{"x":677,"y":46},{"x":683,"y":45},{"x":693,"y":38},{"x":685,"y":35},{"x":685,"y":37},{"x":680,"y":35},{"x":680,"y":33},{"x":678,"y":33},{"x":671,"y":29},{"x":671,"y":37},{"x":671,"y":38},{"x":668,"y":40},{"x":666,"y":40},{"x":664,"y":41},{"x":662,"y":35},{"x":655,"y":37},{"x":654,"y":34},{"x":657,"y":32},{"x":651,"y":33},{"x":645,"y":33},{"x":644,"y":35},{"x":643,"y":35},{"x":645,"y":37},{"x":634,"y":36},{"x":635,"y":34},{"x":628,"y":31},{"x":619,"y":33},{"x":620,"y":32},{"x":613,"y":33},{"x":609,"y":29},{"x":608,"y":30},{"x":603,"y":30},{"x":604,"y":26},{"x":597,"y":28},{"x":593,"y":29},{"x":587,"y":26},{"x":577,"y":23},{"x":582,"y":18},{"x":570,"y":23},{"x":567,"y":19},{"x":564,"y":18},{"x":560,"y":16},{"x":555,"y":20},{"x":553,"y":16},{"x":547,"y":17},{"x":553,"y":23},{"x":559,"y":21},{"x":565,"y":20},{"x":566,"y":26},{"x":575,"y":33},{"x":564,"y":34},{"x":556,"y":36},{"x":523,"y":38},{"x":516,"y":39},{"x":513,"y":39},{"x":511,"y":44},{"x":514,"y":46},{"x":506,"y":45},{"x":505,"y":48},{"x":503,"y":48},{"x":500,"y":50},{"x":500,"y":53},{"x":500,"y":54},{"x":503,"y":57},{"x":497,"y":58},{"x":497,"y":60},{"x":491,"y":60},{"x":490,"y":62},{"x":489,"y":67},{"x":487,"y":68},{"x":485,"y":71},{"x":471,"y":75},{"x":484,"y":79},{"x":489,"y":81},{"x":485,"y":82},{"x":485,"y":83},{"x":487,"y":85},{"x":494,"y":85},{"x":484,"y":87},{"x":489,"y":92},{"x":474,"y":86},{"x":473,"y":92},{"x":471,"y":90},{"x":471,"y":88},{"x":470,"y":88},{"x":466,"y":85},{"x":455,"y":84},{"x":452,"y":85},{"x":450,"y":90},{"x":448,"y":88},{"x":447,"y":88},{"x":447,"y":94},{"x":444,"y":92},{"x":443,"y":92},{"x":442,"y":96},{"x":442,"y":83},{"x":436,"y":78},{"x":423,"y":68},{"x":415,"y":69},{"x":411,"y":65},{"x":410,"y":65},{"x":405,"y":66},{"x":406,"y":70},{"x":400,"y":75},{"x":397,"y":70},{"x":393,"y":71},{"x":393,"y":74},{"x":386,"y":69},{"x":385,"y":79},{"x":380,"y":82},{"x":378,"y":79},{"x":374,"y":79},{"x":373,"y":75},{"x":372,"y":80},{"x":367,"y":81},{"x":367,"y":80},{"x":364,"y":79},{"x":357,"y":86},{"x":363,"y":84},{"x":367,"y":92},{"x":358,"y":89},{"x":352,"y":91},{"x":352,"y":95},{"x":357,"y":94},{"x":358,"y":98},{"x":346,"y":92},{"x":349,"y":96},{"x":340,"y":98},{"x":340,"y":102},{"x":336,"y":104},{"x":343,"y":107},{"x":348,"y":104},{"x":343,"y":106},{"x":343,"y":107},{"x":343,"y":111},{"x":340,"y":110},{"x":338,"y":111},{"x":337,"y":113},{"x":335,"y":114},{"x":331,"y":115},{"x":330,"y":111},{"x":326,"y":114},{"x":320,"y":110},{"x":315,"y":111},{"x":319,"y":113},{"x":317,"y":117},{"x":312,"y":118},{"x":315,"y":121},{"x":325,"y":125},{"x":322,"y":130},{"x":316,"y":127},{"x":316,"y":137},{"x":298,"y":119},{"x":300,"y":115},{"x":294,"y":117},{"x":293,"y":118},{"x":294,"y":122},{"x":287,"y":123},{"x":288,"y":126},{"x":274,"y":126},{"x":274,"y":135},{"x":277,"y":141},{"x":278,"y":142},{"x":280,"y":146},{"x":279,"y":147},{"x":278,"y":150},{"x":267,"y":155},{"x":264,"y":156},{"x":263,"y":159},{"x":262,"y":161},{"x":259,"y":164},{"x":248,"y":178},{"x":234,"y":180},{"x":213,"y":184},{"x":205,"y":185},{"x":199,"y":186},{"x":197,"y":184},{"x":192,"y":184},{"x":186,"y":185},{"x":183,"y":188},{"x":179,"y":190},{"x":163,"y":192},{"x":157,"y":193},{"x":156,"y":196},{"x":151,"y":197},{"x":142,"y":200},{"x":139,"y":198},{"x":135,"y":197},{"x":129,"y":197},{"x":129,"y":199},{"x":124,"y":197},{"x":123,"y":200},{"x":109,"y":201},{"x":105,"y":205},{"x":89,"y":213},{"x":85,"y":215},{"x":78,"y":217},{"x":72,"y":218},{"x":67,"y":220},{"x":62,"y":223},{"x":59,"y":229},{"x":57,"y":234},{"x":50,"y":234},{"x":50,"y":227},{"x":51,"y":221},{"x":49,"y":221},{"x":48,"y":221},{"x":46,"y":222},{"x":44,"y":224},{"x":38,"y":234},{"x":38,"y":237},{"x":39,"y":240},{"x":41,"y":240},{"x":41,"y":245},{"x":40,"y":252},{"x":39,"y":255},{"x":35,"y":256},{"x":34,"y":259},{"x":32,"y":261},{"x":29,"y":268},{"x":30,"y":272},{"x":30,"y":275},{"x":33,"y":276},{"x":35,"y":280},{"x":38,"y":285},{"x":43,"y":290},{"x":46,"y":294},{"x":48,"y":299},{"x":55,"y":302},{"x":50,"y":310},{"x":56,"y":308},{"x":49,"y":314},{"x":44,"y":306},{"x":43,"y":314},{"x":36,"y":318},{"x":48,"y":334},{"x":52,"y":340},{"x":49,"y":340},{"x":51,"y":346},{"x":52,"y":349},{"x":57,"y":352},{"x":61,"y":356},{"x":62,"y":359},{"x":61,"y":360},{"x":62,"y":362},{"x":64,"y":364},{"x":67,"y":366},{"x":68,"y":369},{"x":73,"y":373},{"x":73,"y":376},{"x":75,"y":381},{"x":75,"y":387},{"x":75,"y":395},{"x":77,"y":401},{"x":94,"y":425},{"x":96,"y":427},{"x":96,"y":432},{"x":96,"y":434},{"x":94,"y":442},{"x":92,"y":440},{"x":92,"y":446},{"x":94,"y":458},{"x":91,"y":458},{"x":91,"y":465},{"x":88,"y":468},{"x":77,"y":466},{"x":75,"y":469},{"x":73,"y":477},{"x":77,"y":480},{"x":78,"y":482},{"x":82,"y":481},{"x":88,"y":483},{"x":94,"y":485},{"x":99,"y":489},{"x":103,"y":494},{"x":115,"y":495},{"x":117,"y":496},{"x":121,"y":499},{"x":136,"y":497},{"x":142,"y":496},{"x":146,"y":499},{"x":150,"y":499},{"x":156,"y":497},{"x":174,"y":494},{"x":165,"y":493},{"x":181,"y":489},{"x":181,"y":483},{"x":192,"y":485},{"x":198,"y":486},{"x":200,"y":482},{"x":203,"y":478},{"x":208,"y":475},{"x":216,"y":472},{"x":221,"y":474},{"x":227,"y":473},{"x":235,"y":471},{"x":242,"y":470},{"x":252,"y":470},{"x":261,"y":471},{"x":269,"y":473},{"x":271,"y":469},{"x":275,"y":475},{"x":280,"y":473},{"x":294,"y":471},{"x":299,"y":472},{"x":301,"y":473},{"x":304,"y":474},{"x":315,"y":474},{"x":319,"y":470},{"x":324,"y":466},{"x":326,"y":463},{"x":328,"y":461},{"x":328,"y":456},{"x":336,"y":453},{"x":341,"y":450},{"x":344,"y":452},{"x":352,"y":449},{"x":362,"y":444},{"x":365,"y":443},{"x":368,"y":444},{"x":373,"y":441},{"x":378,"y":439},{"x":383,"y":436},{"x":390,"y":436},{"x":401,"y":437},{"x":420,"y":437},{"x":413,"y":437},{"x":432,"y":433},{"x":443,"y":432},{"x":465,"y":424},{"x":474,"y":423},{"x":500,"y":422},{"x":511,"y":422},{"x":523,"y":421},{"x":524,"y":419},{"x":529,"y":419},{"x":538,"y":420},{"x":553,"y":430},{"x":558,"y":431},{"x":561,"y":432},{"x":565,"y":429},{"x":570,"y":429},{"x":574,"y":430},{"x":580,"y":433},{"x":585,"y":434},{"x":590,"y":435},{"x":592,"y":433},{"x":597,"y":434},{"x":600,"y":435},{"x":603,"y":437},{"x":607,"y":439},{"x":604,"y":441},{"x":612,"y":441},{"x":616,"y":442},{"x":614,"y":448},{"x":611,"y":447},{"x":611,"y":451},{"x":617,"y":453},{"x":616,"y":457},{"x":617,"y":456},{"x":618,"y":456},{"x":620,"y":456},{"x":630,"y":455},{"x":632,"y":465},{"x":633,"y":466},{"x":634,"y":469},{"x":639,"y":471},{"x":643,"y":475},{"x":645,"y":479},{"x":644,"y":483},{"x":650,"y":489},{"x":646,"y":490},{"x":654,"y":495},{"x":657,"y":494},{"x":657,"y":495},{"x":662,"y":496},{"x":662,"y":493},{"x":657,"y":493},{"x":661,"y":487},{"x":676,"y":475},{"x":688,"y":468},{"x":703,"y":467},{"x":698,"y":463},{"x":704,"y":457},{"x":707,"y":453},{"x":712,"y":452},{"x":713,"y":449},{"x":714,"y":448},{"x":713,"y":444},{"x":713,"y":443},{"x":715,"y":443},{"x":721,"y":456},{"x":715,"y":457},{"x":715,"y":458},{"x":717,"y":463},{"x":717,"y":464},{"x":715,"y":466},{"x":712,"y":468},{"x":710,"y":469},{"x":709,"y":471},{"x":705,"y":476},{"x":705,"y":478},{"x":703,"y":485},{"x":708,"y":489},{"x":702,"y":496},{"x":692,"y":492},{"x":689,"y":498},{"x":687,"y":503},{"x":703,"y":499},{"x":713,"y":499},{"x":713,"y":495},{"x":714,"y":495},{"x":715,"y":492},{"x":717,"y":486},{"x":713,"y":486},{"x":724,"y":478},{"x":725,"y":485},{"x":731,"y":486},{"x":733,"y":490},{"x":734,"y":490},{"x":731,"y":503},{"x":729,"y":507},{"x":725,"y":507},{"x":723,"y":511},{"x":740,"y":509},{"x":749,"y":509},{"x":747,"y":506},{"x":758,"y":505},{"x":758,"y":508},{"x":752,"y":508},{"x":751,"y":513},{"x":756,"y":515},{"x":761,"y":519},{"x":765,"y":521},{"x":772,"y":532},{"x":771,"y":537},{"x":771,"y":538},{"x":768,"y":540},{"x":767,"y":542},{"x":771,"y":549},{"x":781,"y":557},{"x":789,"y":564},{"x":804,"y":567},{"x":820,"y":575},{"x":827,"y":569},{"x":829,"y":573},{"x":837,"y":574},{"x":840,"y":574},{"x":841,"y":574},{"x":845,"y":574},{"x":855,"y":579},{"x":875,"y":586},{"x":891,"y":577},{"x":895,"y":579},{"x":898,"y":574},{"x":899,"y":576},{"x":901,"y":570},{"x":905,"y":574},{"x":908,"y":568},{"x":900,"y":570},{"x":903,"y":566},{"x":909,"y":563},{"x":916,"y":562},{"x":919,"y":569},{"x":919,"y":566},{"x":916,"y":573},{"x":922,"y":575},{"x":922,"y":570},{"x":927,"y":571},{"x":928,"y":573},{"x":930,"y":574},{"x":927,"y":576},{"x":930,"y":579},{"x":933,"y":582},{"x":936,"y":579},{"x":942,"y":587},{"x":947,"y":584},{"x":957,"y":592},{"x":956,"y":585},{"x":952,"y":587},{"x":949,"y":582},{"x":968,"y":581},{"x":974,"y":579},{"x":985,"y":568},{"x":988,"y":566},{"x":990,"y":565},{"x":991,"y":562},{"x":1005,"y":563},{"x":1001,"y":561},{"x":1016,"y":560},{"x":1039,"y":560},{"x":1045,"y":559},{"x":1048,"y":558},{"x":1048,"y":553},{"x":1057,"y":554},{"x":1055,"y":548},{"x":1054,"y":540},{"x":1059,"y":521},{"x":1062,"y":513},{"x":1068,"y":511},{"x":1066,"y":507},{"x":1070,"y":503},{"x":1073,"y":501},{"x":1075,"y":500},{"x":1079,"y":499},{"x":1078,"y":499},{"x":1076,"y":499},{"x":1076,"y":497},{"x":1080,"y":486},{"x":1084,"y":478},{"x":1090,"y":474},{"x":1092,"y":473},{"x":1094,"y":471},{"x":1092,"y":469},{"x":1094,"y":466},{"x":1101,"y":457},{"x":1105,"y":453},{"x":1107,"y":454},{"x":1110,"y":450},{"x":1102,"y":449},{"x":1118,"y":447},{"x":1121,"y":444},{"x":1121,"y":443},{"x":1121,"y":440},{"x":1127,"y":439},{"x":1124,"y":432},{"x":1131,"y":429},{"x":1134,"y":423},{"x":1143,"y":407},{"x":1137,"y":402},{"x":1143,"y":397},{"x":1145,"y":392},{"x":1149,"y":379},{"x":1150,"y":373},{"x":1153,"y":365},{"x":1156,"y":368},{"x":1156,"y":357},{"x":1156,"y":352},{"x":1158,"y":347},{"x":1151,"y":344},{"x":1151,"y":340},{"x":1155,"y":336},{"x":1153,"y":334},{"x":1150,"y":341},{"x":1144,"y":331},{"x":1144,"y":327},{"x":1144,"y":312},{"x":1143,"y":313},{"x":1145,"y":303},{"x":1135,"y":301},{"x":1137,"y":295},{"x":1138,"y":290},{"x":1126,"y":289},{"x":1129,"y":288},{"x":1124,"y":281},{"x":1116,"y":276},{"x":1105,"y":264},{"x":1096,"y":264},{"x":1095,"y":262},{"x":1089,"y":260},{"x":1094,"y":257},{"x":1089,"y":255},{"x":1085,"y":253},{"x":1081,"y":255},{"x":1078,"y":255},{"x":1079,"y":251},{"x":1078,"y":250},{"x":1078,"y":247},{"x":1076,"y":241},{"x":1080,"y":233},{"x":1071,"y":231},{"x":1074,"y":236},{"x":1055,"y":227},{"x":1053,"y":231},{"x":1054,"y":232},{"x":1057,"y":236},{"x":1052,"y":232},{"x":1042,"y":230},{"x":1042,"y":222},{"x":1039,"y":217},{"x":1036,"y":211},{"x":1033,"y":206},{"x":1037,"y":205},{"x":1028,"y":205},{"x":1027,"y":201},{"x":1023,"y":201},{"x":1022,"y":197},{"x":1018,"y":197},{"x":1020,"y":193},{"x":1023,"y":194},{"x":1022,"y":189},{"x":1020,"y":190},{"x":1016,"y":187},{"x":1006,"y":188},{"x":1010,"y":185},{"x":1004,"y":184},{"x":999,"y":182},{"x":999,"y":184},{"x":995,"y":180},{"x":988,"y":182},{"x":988,"y":176},{"x":984,"y":175},{"x":980,"y":172},{"x":979,"y":175},{"x":973,"y":171},{"x":970,"y":172},{"x":962,"y":167},{"x":953,"y":164},{"x":952,"y":151},{"x":947,"y":153},{"x":947,"y":139},{"x":940,"y":125},{"x":935,"y":121},{"x":937,"y":122},{"x":933,"y":118},{"x":931,"y":117},{"x":928,"y":115},{"x":927,"y":113},{"x":928,"y":111},{"x":927,"y":109},{"x":925,"y":102},{"x":922,"y":99},{"x":925,"y":93},{"x":922,"y":90},{"x":924,"y":91},{"x":924,"y":88},{"x":922,"y":85},{"x":912,"y":82},{"x":909,"y":79},{"x":905,"y":78},{"x":904,"y":75},{"x":903,"y":73},{"x":894,"y":75},{"x":887,"y":80},{"x":882,"y":79},{"x":879,"y":72},{"x":875,"y":65},{"x":875,"y":59},{"x":874,"y":55},{"x":873,"y":53},{"x":874,"y":50},{"x":874,"y":48},{"x":871,"y":49},{"x":872,"y":43},{"x":862,"y":38},{"x":864,"y":30},{"x":847,"y":30},{"x":862,"y":15},{"x":847,"y":12},{"x":848,"y":8},{"x":843,"y":8}]';
    pts = JSON.parse(pts);
    var nbPts = pts.length;
    var tiles = [];
    for(var i = 0; i <= nbPts-1; i++){
        var s = pts[i];
        var e = (i == nbPts-1 ? pts[0] : pts[i+1]);
        var addTiles= Geometry.addCorners(Geometry.straightLine(s,e));
        //var addTiles= Geometry.straightLine(s,e);
        if(i > 0) addTiles.shift();
        tiles = tiles.concat(addTiles);
    }

    tiles = Geometry.forwardSmoothPass(tiles);

    for(var i = tiles.length-1; i >= 0; i--){
        var t = tiles[i];
        var bnf = false; // back and forth between tiles
        for(var j = 1; j < 7; j++){ // knots & duplicates
            var idx = i + j;
            if(idx > tiles.length-1) idx -= tiles.length;
            var old= tiles[idx];
            if(t.x == old.x && t.y == old.y) tiles.splice(i+1,j); // remove j points corresponding to size of knot
            if(Math.abs(t.y - old.y) > j) bnf = true;
            //if(Math.abs(t.x - old.x) > j) console.log('horizontal bnf at '+ t.x+', '+ t.y);
        }
        if(bnf) tiles.splice(i,1);
    }

    tiles = tiles.map(function(t){
            //console.log(t);
            return {x: t.x*32,y: t.y*32};
    });
    Engine.drawHull(tiles);
};

Engine.addHero = function(){
    var startx = 810//744;
    var starty = 48;//130;
    Engine.player = Engine.addSprite('hero',startx,starty);
    Engine.player.visible = Engine.showHero;
    Engine.player.chunk = Utils.tileToAOI({x:startx,y:starty});
    Engine.updateEnvironment();
    Engine.updateCamera();
};

Engine.addSprite = function(key,x,y){
    var sprite = new PIXI.Sprite(Engine.resources[key].texture);
    Engine.setPosition(sprite,x,y);
    sprite.z = 2;
    Engine.addToStage(sprite);
    return sprite;
};

Engine.addToStage = function(sprite){
    Engine.stage.addChild(sprite);
    Engine.orderStage();
};

Engine.orderStage = function(){
    Engine.stage.children.sort(function(a,b){
        return a.z > b.z;
    });
};

Engine.displayChunk = function(id){
    if(Engine.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Engine.drawChunk(Engine.mapDataCache[id],id);
    }else {
        Engine.loadJSON(Engine.mapDataLocation+'/chunk' + id + '.json', Engine.drawChunk, id);
    }
};

Engine.displayMap = function(path){
    Engine.loadJSON(path,Engine.makeMap);
};

Engine.drawChunk = function(mapData,id){
    var chunk = new Chunk(mapData,1);
    chunk.id = id;
    Engine.chunks[chunk.id] = chunk;
    if(!Engine.mapDataCache[chunk.id]) Engine.mapDataCache[chunk.id] = mapData;
    chunk.drawLayers();
    Engine.displayedChunks.push(chunk.id);
    if(Engine.showGrid) Engine.drawGrid(chunk);
    Engine.addToStage(chunk);
};

Engine.toggleSelection = function(){
    Engine.selectionEnabled = !Engine.selectionEnabled;
    if(Engine.selectionEnabled){
        Engine.renderer.view.style.cursor = 'crosshair';
    }else{
        Engine.renderer.view.style.cursor = 'default';
    }
};

Engine.toggleHulls= function(){
    Engine.showHulls = !Engine.showHulls;
    Engine.blackBoard.visible = Engine.showHulls;
    localStorage.setItem('showHulls',Engine.showHulls);
};

Engine.toggleGrid = function(){
    Engine.showGrid = !Engine.showGrid;
    localStorage.setItem('showGrid',Engine.showGrid);
    for(var i = 0; i < Engine.displayedChunks.length; i++){
        var chunk = Engine.chunks[Engine.displayedChunks[i]];
        if(Engine.showGrid){
            Engine.drawGrid(chunk);
        }else{
            Engine.removeGrid(chunk);
        }
    }
};

Engine.toggleHero = function() {
    Engine.showHero = !Engine.showHero;
    localStorage.setItem('showHero',Engine.showHero);
    Engine.player.visible = Engine.showHero;
};

Engine.drawGrid = function(chunk){
    if(chunk.grid === undefined) {
        var gr = new PIXI.Graphics();
        var origin = Utils.AOItoTile(chunk.id);
        gr.lineStyle(10, 0xffffff, 1);
        gr.drawRect(origin.x * Engine.tileWidth, origin.y * Engine.tileHeight, Engine.chunkWidth * Engine.tileWidth, Engine.chunkHeight * Engine.tileHeight);
        gr.z = 999;
        chunk.addChild(gr);
        chunk.grid = gr;
    }else{
        chunk.grid.visible = true;
    }
};

Engine.removeGrid = function(chunk){
    chunk.grid.visible = false;
};

Engine.getTilesetFromTile = function(tile){
    if(Engine.tilesetMap.hasOwnProperty(tile)) return Engine.tilesetMap[tile];
    for(var i = 0; i < Engine.tilesets.length; i++){
        if(tile < Engine.tilesets[i].firstgid){
            Engine.tilesetMap[tile] = i-1;
            return i-1;
        }
    }
    return Engine.tilesets.length-1;
};

Engine.removeChunk = function(id){
    Engine.stage.removeChild(Engine.chunks[id]);
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

Engine.showAll = function(){
    for(var i = 0; i < Engine.lastChunkID; i++){
        Engine.displayChunk(i);
    }
};

Engine.update = function(){
    Engine.renderer.render(Engine.stage);
    requestAnimationFrame(Engine.update);
    document.getElementById('visible').innerHTML = Engine.displayedChunks.length;
    //console.log(Engine.stage.children.length+' children');
};


Engine.zoom = function(coef){
    Engine.zoomIndex += coef;
    if(Engine.zoomIndex < 0) Engine.zoomIndex = 0;
    if(Engine.zoomIndex > Engine.zoomScales.length-1) Engine.zoomIndex = Engine.zoomScales.length-1;
    Engine.zoomScale = Engine.zoomScales[Engine.zoomIndex];

    Engine.stage.scale.x = Engine.zoomScale;
    Engine.stage.scale.y = Engine.zoomScale;
    Engine.viewWidth = Math.floor(Engine.baseViewWidth*(1/Engine.zoomScale));
    Engine.viewHeight = Math.floor(Engine.baseViewHeight*(1/Engine.zoomScale));
    Engine.updateCamera();
    Engine.updateEnvironment();
    document.getElementById('zx').innerHTML = Engine.stage.scale.x;
    document.getElementById('zy').innerHTML = Engine.stage.scale.y;
};

Engine.updateSelection = function(x,y,wx,hy){
    if(x !== null) Engine.selection.graphicsData[0].shape.x = x;
    if(y!== null) Engine.selection.graphicsData[0].shape.y = y;
    if(wx !== null) Engine.selection.graphicsData[0].shape.width = wx - Engine.selection.graphicsData[0].shape.x;
    if(hy !== null) Engine.selection.graphicsData[0].shape.height = hy - Engine.selection.graphicsData[0].shape.y;
    Engine.selection.dirty++;
    Engine.selection.clearDirty++;
};

Engine.resetSelection = function(){
    Engine.capture(
        Engine.selection.graphicsData[0].shape.x*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.y*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.width*Engine.zoomScale,
        Engine.selection.graphicsData[0].shape.height*Engine.zoomScale
    );
    Engine.selection.graphicsData[0].shape.width = 0;
    Engine.selection.graphicsData[0].shape.height = 0;
    Engine.selection.visible = false;
};

Engine.capture = function(x,y,w,h){
    x -= Engine.camera.getPixelX();
    y -= Engine.camera.getPixelY();
    var patternCanvas=document.createElement("canvas");
    patternCanvas.width = w;
    patternCanvas.height = h;
    var patternCtx = patternCanvas.getContext("2d");
    patternCtx.drawImage(Engine.renderer.view,x,y,w,h,0,0,w,h);

    var capture = document.createElement("img");
    capture.src = patternCanvas.toDataURL("image/png");
    document.getElementById("captures").appendChild(capture);
};

Engine.updateCamera = function(){
    Engine.camera.x = Engine.player.tilePosition.x - Math.floor(Engine.viewWidth*0.5);
    Engine.camera.y = Engine.player.tilePosition.y - Math.floor(Engine.viewHeight*0.5);
    // Clamp in tile units
    Engine.camera.x = clamp(Engine.camera.x,0,Engine.worldWidth-Engine.viewWidth);
    Engine.camera.y = clamp(Engine.camera.y,0,Engine.worldHeight-Engine.viewHeight);
    Engine.stage.pivot.set(Engine.camera.x*Engine.tileWidth,Engine.camera.y*Engine.tileHeight);
    document.getElementById('cx').innerHTML = Engine.camera.x;
    document.getElementById('cy').innerHTML = Engine.camera.y;
};

Engine.updateEnvironment = function(){
    var chunks = Utils.listVisibleAOIs(Engine.player.chunk);
    var newChunks = chunks.diff(Engine.displayedChunks);
    var oldChunks = Engine.displayedChunks.diff(chunks);

    if(!Engine.debug) {
        for (var i = 0; i < oldChunks.length; i++) {
            //console.log('removing '+oldChunks[i]);
            Engine.removeChunk(oldChunks[i]);
        }
    }

    for(var j = 0; j < newChunks.length; j++){
        //console.log('adding '+newChunks[j]);
        Engine.displayChunk(newChunks[j]);
    }
};

Engine.move = function(x,y){
    Engine.setPosition(Engine.player,x,y);
    Engine.player.chunk = Utils.tileToAOI(Engine.player.tilePosition);
    if(Engine.player.chunk != Engine.player.previousChunk) Engine.updateEnvironment();
    Engine.player.previousChunk = Engine.player.chunk;
    Engine.updateCamera();
};

Engine.setPosition = function(sprite,x,y){
    sprite.position.set(x*Engine.tileWidth,y*Engine.tileHeight);
    if(sprite.tilePosition){
        sprite.tilePosition.set(x,y);
    }else {
        sprite.tilePosition = new PIXI.Point(x, y);
    }
};

Engine.setAction = function(action){
    if(Engine.selectionEnabled) Engine.toggleSelection();
    Engine.clickAction = action;
    document.getElementById('action').innerHTML = action;
};

Engine.getCanvasCoordinates = function(e){
    var x = e.pageX - Engine.location.offsetX;
    var y = e.pageY - Engine.location.offsetY;
    return {x:x,y:y};
};

Engine.getMouseCoordinates = function(e){
    var canvasPxCoord = Engine.getCanvasCoordinates(e);
    var gamePxCoord = {
        x: Math.round(canvasPxCoord.x*(1/Engine.zoomScale) + Engine.camera.getPixelX()),
        y: Math.round(canvasPxCoord.y*(1/Engine.zoomScale) + Engine.camera.getPixelY())
    };
    var gameTileCoord = {
        x: coordinatesToCell(gamePxCoord.x,Engine.tileWidth),
        y: coordinatesToCell(gamePxCoord.y,Engine.tileHeight)
    };
    return {
        px: gamePxCoord,
        tile: gameTileCoord
    }
};

Engine.trackPosition = function(e){
    if(!Engine.debug && !Engine.selectionEnabled) return;
    var c = Engine.getMouseCoordinates(e);
    var gamePxCoord = c.px;
    var gameTileCoord = c.tile;
    if(Engine.debug) {
        document.getElementById('pxx').innerHTML = gamePxCoord.x;
        document.getElementById('pxy').innerHTML = gamePxCoord.y;
        document.getElementById('tx').innerHTML = gameTileCoord.x;
        document.getElementById('ty').innerHTML = gameTileCoord.y;
        document.getElementById('aoi').innerHTML = Utils.tileToAOI(gameTileCoord);
    }
    if(Engine.selectionEnabled && Engine.selection.visible) Engine.updateSelection(null,null,gamePxCoord.x,gamePxCoord.y);
};

Engine.handleMouseUp = function(e) {
    if(Engine.selectionEnabled) Engine.resetSelection();
};

Engine.handleClick = function(e){
    //var coordinates = Engine.getCanvasCoordinates(e);
    var c = Engine.getMouseCoordinates(e);
    if(Engine.selectionEnabled){
        Engine.updateSelection(
            c.px.x,
            c.px.y,
            null,null);
        Engine.selection.visible = true;
        return;
    }
    if(!Engine.clickAction) return;
    var worldx = c.tile.x;
    var worldy = c.tile.y;
    worldx = clamp(worldx,0,Engine.worldWidth);
    worldy = clamp(worldy,0,Engine.worldHeight);
    Engine[Engine.clickAction](worldx,worldy);
    Engine.lastWorldX = worldx;
    Engine.lastWorldY = worldy;
};

Engine.undo = function(){
    if(Engine.editHistory.length == 0) return;
    var last = Engine.editHistory.pop();
    if(last.hull) last.hull.destroy();
    last.destroy();
};

Engine.redo = function(){
    Engine.undo();
    Engine[Engine.clickAction](Engine.lastWorldX,Engine.lastWorldY);
};

Engine.addToLandscape = function(element,order){
    element.drawLayers();
    if(order) element.orderTiles();
    Engine.addToStage(element);
    Engine.editHistory.push(element);
};

Engine.addShore = function(x,y){
    if(Geometry.shoreBox.flag == 0){
        Geometry.shoreBox.flag++;
        Geometry.shoreBox.x = x;
        Geometry.shoreBox.y = y;
    }else if(Geometry.shoreBox.flag == 1){
        Geometry.shoreBox.flag = 0;
        var shore = Engine.drawShore(Geometry.addCorners(Geometry.straightLine(Geometry.shoreBox,{x: x,y: y})),false);
        //shore.drawLayers();
        Engine.addToLandscape(shore);
    }
    Engine.drawCircle(x*Engine.tileWidth+16,y*Engine.tileHeight+16,10,0x0000ff);
};

Engine.addMound = function(x,y){
    Engine.addToLandscape(Engine.drawCliff(Geometry.interpolatePoints(Geometry.makeCorona(x,y))));
    return;
    //var test = '[{"x":71,"y":11},{"x":69,"y":11},{"x":69,"y":12},{"x":66,"y":12},{"x":66,"y":16},{"x":66,"y":19},{"x":69,"y":19},{"x":69,"y":21},{"x":71,"y":21},{"x":73,"y":21},{"x":73,"y":20},{"x":76,"y":20},{"x":76,"y":16},{"x":76,"y":15},{"x":74,"y":15},{"x":74,"y":11},{"x":71,"y":11}]';
    //var test ='[{"x":70,"y":9},{"x":68,"y":9},{"x":68,"y":10},{"x":65,"y":10},{"x":65,"y":14},{"x":65,"y":17},{"x":66,"y":17},{"x":66,"y":19},{"x":70,"y":19},{"x":72,"y":19},{"x":72,"y":16},{"x":75,"y":16},{"x":75,"y":14},{"x":75,"y":11},{"x":74,"y":11},{"x":74,"y":9},{"x":70,"y":9}]';
    //var test = '[{"x":72,"y":9},{"x":70,"y":9},{"x":70,"y":10},{"x":67,"y":10},{"x":67,"y":14},{"x":67,"y":15},{"x":68,"y":15},{"x":68,"y":19},{"x":72,"y":19},{"x":73,"y":19},{"x":73,"y":16},{"x":77,"y":16},{"x":77,"y":14},{"x":77,"y":13},{"x":76,"y":13},{"x":76,"y":9},{"x":72,"y":9}]';
    //var test = '[{"x":69,"y":7},{"x":67,"y":7},{"x":67,"y":11},{"x":65,"y":11},{"x":65,"y":13},{"x":59,"y":13},{"x":59,"y":17},{"x":59,"y":20},{"x":61,"y":20},{"x":61,"y":23},{"x":62,"y":23},{"x":62,"y":27},{"x":69,"y":27},{"x":73,"y":27},{"x":73,"y":26},{"x":76,"y":26},{"x":76,"y":23},{"x":77,"y":23},{"x":77,"y":20},{"x":79,"y":20},{"x":79,"y":17},{"x":79,"y":16},{"x":78,"y":16},{"x":78,"y":13},{"x":73,"y":13},{"x":73,"y":7},{"x":69,"y":7}]';
    var test = '[{"x":66,"y":9},{"x":62,"y":9},{"x":62,"y":16},{"x":58,"y":16},{"x":58,"y":17},{"x":56,"y":17},{"x":56,"y":19},{"x":56,"y":26},{"x":61,"y":26},{"x":61,"y":27},{"x":64,"y":27},{"x":64,"y":29},{"x":66,"y":29},{"x":72,"y":29},{"x":72,"y":23},{"x":74,"y":23},{"x":74,"y":22},{"x":76,"y":22},{"x":76,"y":19},{"x":76,"y":12},{"x":70,"y":12},{"x":70,"y":11},{"x":68,"y":11},{"x":68,"y":9},{"x":66,"y":9}]';
    //var test = '[{"x":68,"y":5},{"x":64,"y":5},{"x":64,"y":8},{"x":58,"y":8},{"x":58,"y":15},{"x":58,"y":21},{"x":60,"y":21},{"x":60,"y":22},{"x":65,"y":22},{"x":65,"y":23},{"x":66,"y":23},{"x":66,"y":25},{"x":68,"y":25},{"x":73,"y":25},{"x":73,"y":19},{"x":75,"y":19},{"x":75,"y":18},{"x":76,"y":18},{"x":76,"y":17},{"x":78,"y":17},{"x":78,"y":15},{"x":78,"y":10},{"x":76,"y":10},{"x":76,"y":8},{"x":74,"y":8},{"x":74,"y":5},{"x":68,"y":5}]';
    var arr = JSON.parse(test);
    arr.pop();
    Engine.addToLandscape(Engine.drawCliff(Geometry.interpolatePoints(arr)));
};

Engine.addLake = function(x,y){
    var shore = Engine.drawShore(Geometry.interpolatePoints(Geometry.makeCorona(x,y)),true); // true = lake
    /*var test = '[{"x":68,"y":14},{"x":65,"y":14},{"x":65,"y":17},{"x":63,"y":17},{"x":63,"y":19},{"x":63,"y":22},{"x":65,"y":22},{"x":65,"y":24},{"x":68,"y":24},{"x":69,"y":24},{"x":69,"y":21},{"x":73,"y":21},{"x":73,"y":19},{"x":73,"y":18},{"x":72,"y":18},{"x":72,"y":17},{"x":70,"y":17},{"x":70,"y":14},{"x":68,"y":14}]';
    var arr = JSON.parse(test);
    arr.pop();
    var shore = Engine.drawShore(Geometry.interpolatePoints(arr),true);*/
    //var shore = Engine.drawShore(Geometry.interpolatePoints(Geometry.makePolyrect(x,y)),true); // true = lake
    Engine.fillWaterWrapper(true,shore);
    //shore.drawLayers();
    Engine.addToLandscape(shore);
};

Engine.addForest = function(x,y){
    //var test = '[{"x":68.01390481179726,"y":19.948466960020596},{"x":71.91202507370703,"y":12.256296129271043},{"x":52.131761041358004,"y":21.272900277948068},{"x":69.51354080859846,"y":22.550574825200318},{"x":70.11297203129236,"y":13.245548291570492},{"x":61.172075643955075,"y":15.412041161953091},{"x":67.83639049953894,"y":20.391081823878803},{"x":63.531982106547666,"y":12.4860516088347},{"x":66.84807290057185,"y":21.28774565046551},{"x":66.0920100901911,"y":22.04152850112851}]';
    //var test = '[{"x":66.68058314482653,"y":14.891772600068588},{"x":70.42569598988571,"y":24.3963580855579},{"x":69.20695594910786,"y":20.55739490432663},{"x":61.74879064599066,"y":17.093771995184454},{"x":63.97843486834117,"y":10.794979697579834},{"x":57.23742978522096,"y":15.703197882475953},{"x":70.23597908555548,"y":13.073786401455083},{"x":60.209146984320064,"y":10.168956467258251},{"x":59.574302924811626,"y":10.219424746744432},{"x":69.38530111648203,"y":18.809501283087734}]';
    //var test = '[{"x":74,"y":26},{"x":67,"y":25},{"x":60,"y":30},{"x":75,"y":17},{"x":66,"y":17},{"x":69,"y":26},{"x":80,"y":26},{"x":67,"y":18},{"x":64,"y":16},{"x":67,"y":21}]';
    //var test = '[{"x":68,"y":21},{"x":65,"y":19},{"x":76,"y":27},{"x":69,"y":22},{"x":68,"y":25},{"x":57,"y":23},{"x":66,"y":24},{"x":71,"y":13},{"x":67,"y":17},{"x":72,"y":18}]';
    //var test = '[{"x":66,"y":24},{"x":70,"y":20},{"x":64,"y":18},{"x":68,"y":19},{"x":62,"y":23},{"x":68,"y":13},{"x":69,"y":21},{"x":66,"y":27},{"x":73,"y":19},{"x":70,"y":27}]';
    //var forest = Engine.drawForest(JSON.parse(test));
    var forest = Engine.drawForest(Geometry.cluster(x,y));
    Engine.addToLandscape(forest,false); // true/false : order tiles
};

Engine.drawHull = function(hull){ // Input are coordinates in pixels, not tiles!
    var g = new PIXI.Graphics();
    g.lineStyle(5,0xffffff);
    g.moveTo(hull[0].x,hull[0].y);
    for(var i = 1; i < hull.length; i++){
        g.lineTo(hull[i].x,hull[i].y);
    }
    g.lineTo(hull[0].x,hull[0].y);
    Engine.blackBoard.addChild(g);
    return g;
};

Engine.drawCircle = function(x,y,radius,color){
    var g = new PIXI.Graphics();
    g.lineStyle(2,color);
    g.drawCircle(x,y,radius);
    Engine.blackBoard.addChild(g);
};

Engine.drawForest = function(pts){
    var forest = new Chunk(null,3);
    var types = [1,1,1,2,2,3];
    var startCoord = {
        1: 22,
        2: 5,
        3: 9
    };
    pts.sort(function(a,b){
        return a.y > b.y;
    });
    for(var i = 0; i < pts.length; i++){
        var type = randomElement(types);
        //var type = 1;
        var ref = {
            x: pts[i].x,
            y: pts[i].y
        };
        //console.log(ref.x+', '+ref.y);
        var v = 681;
        var width = (type <= 2 ? 4 : 5);
        var height = (type == 1 ? 5 : 6);
        for(var j = 0; j < width; j++){
            for(var k = 0; k < height; k++){
                var x = ref.x+j;
                var y = ref.y+k;
                //var layer = (k <= 2 ? 2: 1);
                var layer = 1;
                while(forest.children[layer].data.get(x,y)) layer++;
                var tile = v+startCoord[type]+j+(k*21);
                forest.addTile(x,y,tile,layer);
            }
        }
    }
    return forest;
};

Engine.drawShore = function(tiles,lake){
    var shore = new Chunk(null,3);
    var dx = tiles[0].x - tiles[tiles.length-1].x;
    var dy = tiles[0].y - tiles[tiles.length-1].y;
    var coastline; // 1 = N, 2 = W, 3 = S, 4 = E
    if(Math.abs(dx) > Math.abs(dy)){ // N or S
        coastline = (dx > 0 ? 1 : 3);
    }else{ // E or W
        coastline = (dy > 0 ? 4 : 2);
    }
    Geometry.shoreBox.shoreType = coastline;
    for(var i = 0; i < tiles.length; i++){
        var id;
        if(lake){
            var next = (i == tiles.length-1 ? 0 : i+1);
            var prev = (i == 0 ? tiles.length-1 : i-1);
            var id = Engine.findTileID(tiles[prev],tiles[i],tiles[next]);
        }else{
            if (i == 0 || i == tiles.length - 1) {
                if (coastline == 1) id = 6;
                if (coastline == 2) id = 9;
                if (coastline == 3) id = 8;
                if (coastline == 4) id = 7;
            } else {
                var prev = tiles[i - 1];
                var next = tiles[i + 1];
                id = Engine.findTileID(prev, tiles[i], next);
            }
        }

        var ref = {
            x: tiles[i].x,
            y: tiles[i].y
        };
        //console.log(id+' at '+ref.x+', '+ref.y);
        Geometry.shoreBox.registerTile(ref,id);
        switch(id){
            case W.topRightOut:
                shore.addTile(ref.x,ref.y,Shore.topRight,1);
                break;
            case W.top:
                shore.addTile(ref.x,ref.y,Shore.top,1);
                break;
            case W.topLeftOut:
                shore.addTile(ref.x,ref.y,Shore.topLeft,1);
                break;
            case W.left:
                shore.addTile(ref.x,ref.y,Shore.left,1);
                break;
            case W.right:
                shore.addTile(ref.x,ref.y,Shore.right,1);
                break;
            case W.bottomRightIn:
                shore.addTile(ref.x,ref.y,Shore.bottomRight,1);
                break;
            case W.bottomLeftOut:
                shore.addTile(ref.x,ref.y,Shore.topRightOut,1);
                break;
            case W.bottomLeftIn:
                shore.addTile(ref.x,ref.y,Shore.bottomLeft,1);
                break;
            case W.bottom:
                shore.addTile(ref.x,ref.y,Shore.bottom,1);
                break;
            case W.bottomRightOut:
                shore.addTile(ref.x,ref.y,Shore.topLeftOut,1);
                break;
            case W.topRightIn:
                shore.addTile(ref.x,ref.y,Shore.bottomLeftOut,1);
                break;
            case W.topLeftIn:
                shore.addTile(ref.x,ref.y,Shore.bottomRightOut,1);
                break;
        }
    }
    shore.hull = Engine.drawHull(tiles.map(Geometry.makePxCoords));
    return shore;
};

Engine.fillWaterWrapper = function(lake,chunk){
    var water = Engine.fillWater(lake,chunk,1);
    if(!chunk) Engine.addToLandscape(water);
    Geometry.shoreBox.north = {};
    Geometry.shoreBox.east = {};
    Geometry.shoreBox.south = {};
    Geometry.shoreBox.west = {};
};

Engine.fillWater = function(lake,chunk,type){
    var water = chunk || new Chunk(null,2);
    //var type = (lake ? 1 : Geometry.shoreBox.shoreType); // type of shore: north, east, south or west
    var coef = (type > 2 ? -1 : 1);
    var oppositeType = type + 2*coef; // maps 1 to 3, 2 to 4 and vice versa
    var map = Geometry.shoreBox.getMap(type);
    var oppositeMap = Geometry.shoreBox.getMap(oppositeType);
    var limit = {
        1: (Engine.nbChunksVertical*Engine.chunkHeight)-1,
        2: (Engine.nbChunksHorizontal*Engine.chunkWidth)-1,
        3: 0,
        4: 0
    };

    for(var coord in map){
        if(!map.hasOwnProperty(coord)) continue;
        var s = map[coord];
        var end = oppositeMap[coord] || limit[type];
        var inc = (end-start)/Math.abs(end-start);
        for(var coordBis = s; coordBis != end+inc; coordBis+=inc ){
            var x = (type == 1 || type == 3 ? coord : coordBis);
            var y = (type == 1 || type == 3 ? coordBis : coord);
            water.addTile(x,y,Shore.water,0);
        }
    }
    return water;
};

Engine.drawCliff = function(pts){
    var cliff = new Chunk(null,3);
    var last;
    var history = [];
    for(var i = 0; i < pts.length; i++){
        var next = (i == pts.length-1 ? 0 : i+1);
        var prev = (i == 0 ? pts.length-1 : i-1);
        var id = Engine.findTileID(pts[prev],pts[i],pts[next]);
        var tile = {
            x: pts[i].x,
            y: pts[i].y
        };
        var previousTile = pts[prev];
        //console.log(id+' at '+tile.x+', '+tile.y);

        // Prevent issues with double corners
        if((id == W.topLeftOut && last == W.bottomRightOut) && (previousTile.x - tile.x == 1)) id = W.left;
        if(id == W.top && (last == W.bottomRightOut || last == W.topRightOut)) {
            last = W.top;
            continue;
        }
        if((id == W.bottomRightOut && last == W.topLeftOut) && (previousTile.y - tile.y == -1)){
            id = W.top;
            tile.x--;
        }
        if((id == W.topRightOut && last == W.bottomLeftOut) && (previousTile.y - tile.y == 1)){
            id = W.top;
            tile.x--;
        }
        if(id == W.bottomLeftOut && last == W.topRightOut) {
            id = W.right;
            tile.y--;
        }
        if(id == W.topLeftIn && last == W.bottomRightIn) id = W.bottom;

        var ref = {
            x: tile.x,
            y: tile.y
        };

        switch(id){
            case W.topRightOut: // top right outer
                ref.x -= 1;
                cliff.addTile(ref.x,ref.y-1,Cliff.topRightOut_top,0);
                cliff.addTile(ref.x,ref.y,Cliff.topRightOut,0);
                cliff.addTile(ref.x+1,ref.y,Cliff.topRightOut_right,0);
                var t = (history[1] == W.bottomLeftOut ? Cliff.topRightOut : Cliff.topRightOut_btmright); // Prevent issues with double corners
                cliff.addTile(ref.x+1,ref.y+1,t,0);
                break;
            case W.topLeftOut: // top left outer
                cliff.addTile(ref.x,ref.y-1,Cliff.topLeftOut_top,0);
                cliff.addTile(ref.x-1,ref.y,Cliff.topLeftOut_left,0);
                cliff.addTile(ref.x,ref.y,Cliff.topLeftOut,0);
                break;
            case W.bottomLeftOut: // bottom left outer
                cliff.addTile(ref.x,ref.y-2,Cliff.topRightOut_top,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.topRightOut,0);
                break;
            case W.bottomRightOut: // bottom right outer
                cliff.addTile(ref.x-2,ref.y-1,Cliff.topLeftOut_left,0);
                cliff.addTile(ref.x-1,ref.y-1,Cliff.topLeftOut,0);
                break;
            case W.bottomLeftIn: // bottom left inner
                ref.x -= 1;
                cliff.addTile(ref.x,ref.y-1,Cliff.bottomLeftIn_up,1);
                cliff.addTile(ref.x+1,ref.y-1,Cliff.bottomLeftIn_upright,0);
                cliff.addTile(ref.x,ref.y,Cliff.bottomLeftIn,1);
                cliff.addTile(ref.x+1,ref.y,Cliff.bottomLeftIn_right,0);
                cliff.addTile(ref.x,ref.y+1,Cliff.bottomLeftIn_btm,0);
                cliff.addTile(ref.x+1,ref.y+1,Cliff.bottomLeftIn_btmright,0);
                break;
            case W.bottomRightIn: // bottom right inner
                cliff.addTile(ref.x-1,ref.y-1,Cliff.bottomRightIn_topLeft,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.bottomRightIn_top,0);
                cliff.addTile(ref.x,ref.y,Cliff.bottomRightIn,0);
                /*if(history[3] == W.bottomRightIn) {
                    console.log('oops');
                }*/
                cliff.addTile(ref.x-1,ref.y,Cliff.bottomRIghtIn_left,0);
                cliff.addTile(ref.x-1,ref.y+1,Cliff.bottomRightIn_btmleft,0);
                break;
            case W.top: // top
                cliff.addTile(ref.x,ref.y-1,randomInt(Cliff.top1,Cliff.top2+1),0);
                break;
            case W.right: // right
                var l = 0;
                if(!cliff.children[l].data.get(ref.x,ref.y) || last == W.topRightOut || history[1] == W.bottomLeftOut) cliff.addTile(ref.x,ref.y,Cliff.right,l);
                break;
            case W.bottom: // bottom
                var actualID = randomInt(Cliff.bottom1,Cliff.bottom2);
                cliff.addTile(tile.x,tile.y-1,actualID-15,0);
                cliff.addTile(tile.x,tile.y,actualID,0);
                cliff.addTile(tile.x,tile.y+1,actualID+15,0);
                break;
            case W.left: // left
                cliff.addTile(tile.x-1,tile.y,randomElement([Cliff.left1,Cliff.left2]),0);
                break;
            case W.topRightIn: // top right inner
                cliff.addTile(tile.x-1,tile.y,Cliff.topRightIn,0);
                cliff.addTile(tile.x-1,tile.y+1,Cliff.topRightIn_btm,0);
                if(last == W.bottomLeftIn) cliff.children[0].data.delete(tile.x-1,tile.y-1);
                break;
            case W.topLeftIn: // top left inner
                ref.y += 1;
                cliff.addTile(ref.x,ref.y,Cliff.topLeftIn_altbtm,0);
                cliff.addTile(ref.x,ref.y-1,Cliff.topLeftIn_top,0);
                //cliff.addTile(ref.x,ref.y+1,Cliff.topLeftIn_btm,0);
                if(last == W.bottomRightIn && history[1] == W.topLeftIn){
                    cliff.children[l].data.delete(ref.x-1,ref.y-1);
                    cliff.addTile(ref.x-1,ref.y,Cliff.topLeftIn_alt,0);
                    cliff.addTile(ref.x-1,ref.y+1,Cliff.topLeftIn_altbtm,0);
                    cliff.addTile(ref.x-1,ref.y+2,Cliff.right,0);
                }
        }
        history.unshift(id);
        last = history[0];
    }

    //cliff.drawLayers();
    cliff.hull = Engine.drawHull(pts.map(Geometry.makePxCoords));
    return cliff;
};

Engine.save = function(){
    var dirtyFiles = new Set();
    for(var i = 0; i < Engine.editHistory.length; i++){
        var element = Engine.editHistory[i];
        for(var j = 0; j < element.children.length; j++) {
            var layer = element.children[j];
            var tiles = layer.data.toList();
            for(var k = 0; k < tiles.length; k++){
                var tile = tiles[k];
                var chunkID = Utils.tileToAOI({x:tile.x,y:tile.y});
                var mapData = Engine.mapDataCache[chunkID];
                dirtyFiles.add(chunkID);
                var origin = Utils.AOItoTile(chunkID);
                var x = tile.x - origin.x;
                var y = tile.y - origin.y;
                mapData.layers[j].data[(Engine.chunkWidth*y)+x] = tile.v;
            }
        }
    }
    dirtyFiles.forEach(function(file){
        Client.sendMapData(file,Engine.mapDataCache[file]);
    });
    Engine.editHistory = [];
};

Engine.boot();
