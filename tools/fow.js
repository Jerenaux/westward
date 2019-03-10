var CustomPipeline = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,

    initialize:
    //https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson5
        function CustomPipeline(game,nbr) {
            Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
                game: game,
                renderer: game.renderer,
                fragShader:
                `precision mediump float;
varying vec2 outTexCoord;
uniform sampler2D uMainSampler;
uniform float rects[`+nbr+`];

vec3 makeRect(vec2 st,vec4 coords, vec3 col){
    vec2 blur = vec2(0.1);
    // bottom-left
    vec2 ps = vec2(coords.x,coords.y);
    vec2 bl = smoothstep(ps,ps+blur,st);
    float pct = bl.x * bl.y;
    // top-right
    ps = vec2(coords.z,coords.w);
    vec2 tr = 1.0-smoothstep(ps,ps+blur,st);
    pct *= tr.x * tr.y;
    return vec3(pct)*col;
}
vec3 mr(vec2 st,vec4 coords, vec3 col){
    return vec3(st.x);
}
void main(){
    vec2 st = outTexCoord;
    
    vec3 color = vec3(0.0);
    const int nbr = `+nbr+`;
    for(int i = 0; i < nbr; i+=4){
        vec4 r = vec4(rects[i],rects[i+1],rects[i+2],rects[i+3]);
       color += makeRect(st,r,vec3(1.0)); 
    }
vec4 fcolor = texture2D(uMainSampler, outTexCoord);
    gl_FragColor = fcolor*vec4(color,1.0);
}`
            });
        }

});

var config = {
    type: Phaser.WEBGL,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var time = 0;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('volcano', 'assets/pics/bw-face.png');
    this.load.image('hotdog', 'assets/sprites/hotdog.png');
}

function create() {
    var volcano = this.add.sprite(400, 300, 'volcano');
    var hotdog = this.add.image(400, 300, 'hotdog').setScrollFactor(0);
    volcano.setInteractive({draggable:true});
    volcano.on('drag',function (pointer, dragX, dragY) {

        this.x = dragX;
        this.y = dragY;

    });

    var rects =  [0.1,0.1,0.3,0.3,0.1,0.3,0.3,0.5,0.3,0.3,0.5,0.5];
    var customPipeline = game.renderer.addPipeline('Custom', new CustomPipeline(game,rects.length));
    customPipeline.setFloat1v('rects', rects);

    volcano.setPipeline('Custom');

}

function update() {
}
