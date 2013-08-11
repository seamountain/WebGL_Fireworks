import "js/web.jsx";
import "Timer.jsx";
import "mvq.jsx/lib/mvq.jsx";

class _Main {
  static function main(args : string[]) : void {
    var canvas = dom.id("world") as HTMLCanvasElement;

    var gl = canvas.getContext("experimental-webgl") as WebGLRenderingContext;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, (dom.id("v-shader") as HTMLScriptElement).text); // called per vertex
    gl.compileShader(vs);
    if (! gl.getShaderParameter(vs, gl.COMPILE_STATUS) as boolean) {
      dom.window.alert("failed to compile vertex shader:\n" + gl.getShaderInfoLog(vs));
      return;
    }

    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, (dom.id("f-shader") as HTMLScriptElement).text); // called per pixel
    gl.compileShader(fs);
    if (! gl.getShaderParameter(fs, gl.COMPILE_STATUS) as boolean) {
      dom.window.alert("failed to compile fragment shader:\n" + gl.getShaderInfoLog(fs));
      return;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    //var projectionMatrix = M44.frustum(-0.8, 0.8, -0.8, 0.8, 7, 1000);
    //gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'projectionMatrix'), false, projectionMatrix.array());

    var vertexBuf = gl.createBuffer();
    // bufferをアクティブにする
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
    // データを中に入れる bufferの中に入れる
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
           1.0,   1.0,  0.0,
          -1.0,   1.0,  0.0,
           1.0,  -1.0,  0.0,
          -1.0,  -1.0,  0.0
          ]), gl.STATIC_DRAW);

    var vertexLoc = gl.getAttribLocation(prog, 'vertex');
    // ここでつなげる
    gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);
    //データを流せるようにする
    gl.enableVertexAttribArray(vertexLoc);

    // texture座標用
    var textureBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuf);
    var textureCoordinates  = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
        ]);
    //現在bindされているbuffer(現在アクティブなbuffer)
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);

    var texCoordLoc= gl.getAttribLocation(prog, 'vTextureCoord');
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    //花火データ作成
    var weight = [0.1];
    var origPosition = [[0.5, 0.5, 0.5]];
    var color = [1.0, 1.0, 1.0];
    var posX = 0.5 - Math.random() * 1.5;
    var posY = 0.5 - Math.random() * 1.5;
    //for (var i = 0; i < 30; i++) {
      //weight.push(0.5 - Math.random() * 2);
      //origPosition.push(
          //[posX, 0, 0, 0.01 * Math.random(), 0.01 * Math.random()]
          //);
    //}

    var positions = origPosition;
    function createData() : void {
      origPosition = [[0.5, 0.5, 0.5]];
      color = [Math.random(), Math.random(), Math.random()];
      posX = 0.5 - Math.random() * 1.5;
      posY = 0.5 - Math.random() * 1.5;
      for (var i = 0; i < 30; i++) {
        //weight.push(0.5 - Math.random() * 2);
        origPosition.push(
          [posX, posY, 0, 0.01 * Math.random(), 0.01 * Math.random()]
        );
      }
      positions = origPosition;
    }

    // update
    var UPDATE_FPS = 50;
    // 放物線を描かせたい
    var g = -0.025;
    var dt = 0;
    // 関数自体をsetやclearするのではなく、
    // アップデート関数は回しっぱなしで、登録するデータを入れ替えて表示させる
    function update() : void {
    //function update(f:number) : void {
      var timeoutTimer = Timer.setTimeout(update, 1000 / UPDATE_FPS);
      //var timeoutTimer = Timer.requestAnimationFrame(update);
      var over = 0;
      dt++;
      for (var i = 0; i < positions.length; i++) {
        positions[i][3] = positions[i][3]; //vx
        positions[i][4] += g * dt / 10000; //vy
        positions[i][0] += positions[i][3];
        positions[i][1] += positions[i][4];
        if (positions[i][1] < -1) {
          over++;
        }
      }
      if (over >= positions.length * 0.8) {
        Timer.clearTimeout(timeoutTimer);
        //Timer.cancelAnimationFrame(timeoutTimer);
      }
    }

    // render
    var positionLoc = gl.getUniformLocation(prog, 'position');
    var alphaLoc = gl.getUniformLocation(prog, 'alpha');
    var texture = gl.createTexture();
    var img = dom.createElement("img") as HTMLImageElement;
    img.addEventListener("load", (e) -> {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 画像の上下反転
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      //以下のtexParameteriが必要。画面の大きさによって必要になる
      //表示されなかったのはミップマップの仕組みが原因
      //上記のようにgenerateMipmapを使って、違うレベル(サイズ)のミップマップを生成して、表示させることも出来る
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      //こっち使う時は注意！レベル1以外のレベルののtextureが使われると、表示されない！
      //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    });
    img.src = 'snow.png';

    var scaleLoc = gl.getUniformLocation(prog, 'scale');
    var scale = 1.0;
    gl.uniform3fv(scaleLoc, new Float32Array([scale, scale, scale]));

    var colorLoc = gl.getUniformLocation(prog, 'color');

    function render(f:number) : void {
      var timer = Timer.requestAnimationFrame(render);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      ////gl.enable(gl.DEPTH_TEST);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

      ////雪
      scale = 0.01;
      //scale = 1;
      gl.uniform3fv(scaleLoc, new Float32Array([scale, scale, scale]));
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // ただの四角
      //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //var varray = new Float32Array([
          //// (1)
          //-1,  1,  1, // 左上の頂点 (x :  左右, y : 上下, z : 手前億) - 図を見ながら座標をうつとよい
          //-1, -1,  1, // 左下の頂点
          //1,  1,  1, // 以下略
          //1, -1,  1
          //]);
      //var vbuf = gl.createBuffer();
      //gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
      //gl.bufferData(gl.ARRAY_BUFFER, varray, gl.STATIC_DRAW);
      //gl.vertexAttribPointer(0 [> attrib index <], 3, gl.FLOAT, false, 0, 0);
      //gl.enableVertexAttribArray(0);

      var over = 0;
      for (var i = 0; i < positions.length; i++) {
        // 色
        gl.uniform3fv(colorLoc, color);
        // 位置
        gl.uniform3f(positionLoc, positions[i][0], positions[i][1], positions[i][2]);
        gl.uniform1f(alphaLoc, 0.95);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (positions[i][1] < -1) {
          over++;
        }
        if (over >= positions.length * 0.8) {
          Timer.cancelAnimationFrame(timer);
        }
        log positions[i];
      }
    }

    var raf = (dom.window.location.hash == "#raf");
    log "use native RAF: " + raf as string;
    Timer.useNativeRAF(raf);

    //update();
    //render(0);

    canvas.addEventListener("click", (e) -> {
      //weight = [0.1];
      //origPosition = [[0.5, 0.5, 0.5]];
      //posX = 0.5 - Math.random() * 1.5;
      //posY = 0.5 - Math.random() * 1.5;
      createData();
      update();
      render(0);
      log "clicked";
      log e;
    });
  }
}
