(function () {
  'use strict';

  /*! js-cookie v3.0.5 | MIT */
  /* eslint-disable no-var */
  function assign (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        target[key] = source[key];
      }
    }
    return target
  }
  /* eslint-enable no-var */

  /* eslint-disable no-var */
  var defaultConverter = {
    read: function (value) {
      if (value[0] === '"') {
        value = value.slice(1, -1);
      }
      return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent)
    },
    write: function (value) {
      return encodeURIComponent(value).replace(
        /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
        decodeURIComponent
      )
    }
  };
  /* eslint-enable no-var */

  /* eslint-disable no-var */

  function init (converter, defaultAttributes) {
    function set (name, value, attributes) {
      if (typeof document === 'undefined') {
        return
      }

      attributes = assign({}, defaultAttributes, attributes);

      if (typeof attributes.expires === 'number') {
        attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
      }
      if (attributes.expires) {
        attributes.expires = attributes.expires.toUTCString();
      }

      name = encodeURIComponent(name)
        .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)
        .replace(/[()]/g, escape);

      var stringifiedAttributes = '';
      for (var attributeName in attributes) {
        if (!attributes[attributeName]) {
          continue
        }

        stringifiedAttributes += '; ' + attributeName;

        if (attributes[attributeName] === true) {
          continue
        }

        // Considers RFC 6265 section 5.2:
        // ...
        // 3.  If the remaining unparsed-attributes contains a %x3B (";")
        //     character:
        // Consume the characters of the unparsed-attributes up to,
        // not including, the first %x3B (";") character.
        // ...
        stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
      }

      return (document.cookie =
        name + '=' + converter.write(value, name) + stringifiedAttributes)
    }

    function get (name) {
      if (typeof document === 'undefined' || (arguments.length && !name)) {
        return
      }

      // To prevent the for loop in the first place assign an empty array
      // in case there are no cookies at all.
      var cookies = document.cookie ? document.cookie.split('; ') : [];
      var jar = {};
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split('=');
        var value = parts.slice(1).join('=');

        try {
          var found = decodeURIComponent(parts[0]);
          jar[found] = converter.read(value, found);

          if (name === found) {
            break
          }
        } catch (e) {}
      }

      return name ? jar[name] : jar
    }

    return Object.create(
      {
        set,
        get,
        remove: function (name, attributes) {
          set(
            name,
            '',
            assign({}, attributes, {
              expires: -1
            })
          );
        },
        withAttributes: function (attributes) {
          return init(this.converter, assign({}, this.attributes, attributes))
        },
        withConverter: function (converter) {
          return init(assign({}, this.converter, converter), this.attributes)
        }
      },
      {
        attributes: { value: Object.freeze(defaultAttributes) },
        converter: { value: Object.freeze(converter) }
      }
    )
  }

  var api = init(defaultConverter, { path: '/' });

  function goHome() {
    api.remove("gameInfo");
    location.assign("../homePage/homePage.html");
  }

  function logOut(status) {
    // if (status) socket.disconnect();
    api.remove("name");
    location.assign("../index.html");
  }
  /* error defiened */
  const errorForm = document.getElementById("errorForm");
  function error(err, url = null, go = null) {
    document.getElementById("errorMessange").innerText = err;
    errorForm.style.display = "block";
    console.log(err);

    document.getElementById("errorFormClose").addEventListener("click", () => {
      if (url == null) {
        if (go == "home") goHome();
        else if (go == "logout") logOut();
      } else location.assign(url);
    });
  }
  document.getElementById("errorFormClose").addEventListener("click", () => {
    errorForm.style.display = "none";
  });

  // pos = tank.pos;
  // this.type = gl.TRIANGLE_STRIP;
  // index = tank.index;
  // this.numOfV = 4;
  let canvas,
    gl,
    shd = {},
    massTex = {},
    massPrim = {},
    createdElements = {};
  const def = {
    pos: new Float32Array([1, 1, 1, 0, 1, -1, 1, 1, -1, -1, 0, 1, -1, 1, 0, 0]),
    index: new Uint16Array([0, 1, 3, 2]),
    type: "triangle",
  };

  function initGl() {
    canvas = document.getElementById("canva");

    if (canvas == undefined) {
      console.log(`aaaaa Canvas`);
      error("canvas is not defined", "../homePage/homePage.html");
    }
    gl = canvas.getContext("webgl2");
    if (gl == undefined) {
      console.log(`aaaaa GL`);
      error("gl is not defined", "../homePage/homePage.html");
    }

    const shdText = [
      `#version 300 es
precision highp float;
in vec2 in_pos;
in vec2 in_tex;

out vec2 texCoord;

uniform vec2 screenSize;
uniform vec2 pos;
uniform vec2 scale;
uniform float angle;

void main(){
  vec2 tmp = vec2(
    in_pos.x * scale.x * cos(angle) + in_pos.y * scale.y * sin(angle) + pos.x,
    in_pos.y * scale.y * cos(angle) - in_pos.x * scale.x * sin(angle) + pos.y);
    // cos(angle) + sin(angle),
    // cos(angle)  - sin(angle));
  gl_Position = vec4(tmp.x * 2.0 / screenSize.x , tmp.y * 2.0 / screenSize.y, 1, 1);
  //gl_Position = vec4(tmp.x / 700.0 * 2.0 - 1.0, tmp.y / 500.0 * 2.0 - 1.0, 0, 1);
  texCoord = in_tex;
}`,
      `#version 300 es
precision highp float;
out vec4 out_color;

uniform sampler2D uSampler;
in vec2 texCoord;
  void main(){

    vec4 color = texture(uSampler, texCoord);
    if (color.rgba == vec4(1, 1,1 , 1))
      discard;
    else
      out_color = color;
}`,
    ];
    const shader = [
      gl.createShader(gl.VERTEX_SHADER),
      gl.createShader(gl.FRAGMENT_SHADER),
    ];

    gl.shaderSource(shader[0], shdText[0]);
    gl.compileShader(shader[0]);
    if (!gl.getShaderParameter(shader[0], gl.COMPILE_STATUS)) {
      const Buf = gl.getShaderInfoLog(shader[0]);
      console.log(Buf);
    }
    gl.shaderSource(shader[1], shdText[1]);
    gl.compileShader(shader[1]);
    if (!gl.getShaderParameter(shader[1], gl.COMPILE_STATUS)) {
      const Buf = gl.getShaderInfoLog(shader[1]);
      console.log(Buf);
    }
    shd.prg = gl.createProgram();

    gl.attachShader(shd.prg, shader[0]);
    gl.attachShader(shd.prg, shader[1]);

    gl.linkProgram(shd.prg);
    if (!gl.getProgramParameter(shd.prg, gl.LINK_STATUS)) {
      const Buf = gl.getProgramInfoLog(shd.prg);
      console.log(Buf);
    }

    shd.locScreenSize = gl.getUniformLocation(shd.prg, "screenSize");
    shd.locPos = gl.getUniformLocation(shd.prg, "pos");
    shd.locScale = gl.getUniformLocation(shd.prg, "scale");
    shd.locAngle = gl.getUniformLocation(shd.prg, "angle");

    shd.in_pos = gl.getAttribLocation(shd.prg, "in_pos");
    shd.in_tex = gl.getAttribLocation(shd.prg, "in_tex");

    gl.useProgram(shd.prg);
  }

  function createTex(name, url) {
    this.type = gl.TEXTURE_2D;
    this.texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (typeof url == "string") {
      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );

        if (
          (Math.log(image.width) / Math.log(2)) % 1 === 0 &&
          (Math.log(image.height) / Math.log(2)) % 1 === 0
        ) {
          gl.generateMipmap(gl.TEXTURE_2D);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
      };
      image.src = url;

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([128, 128, 128, 255])
      );
    } else
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array(url)
      );

    this.loc = gl.getUniformLocation(shd.prg, "uSampler");

    this.apply = function () {
      gl.activeTexture(gl.TEXTURE0);

      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.uniform1i(this.loc, 0);
    };
    massTex[name] = this;
  }
  function createPrim(name, pos, index, type) {
    this.type = type;
    this.VA = gl.createVertexArray();
    gl.bindVertexArray(this.VA);

    this.VB = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.VB);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    this.numOfV = pos.length;

    if (index) {
      this.IB = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IB);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Int16Array(index),
        gl.STATIC_DRAW
      );
      this.numOfV = index.length;
    }
    gl.vertexAttribPointer(shd.in_pos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(shd.in_pos);

    gl.vertexAttribPointer(shd.in_tex, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(shd.in_tex);

    this.draw = function (pos, angle, scale) {
      gl.uniform2fv(shd.locScreenSize, [
        gl.canvas.clientWidth,
        gl.canvas.clientHeight,
      ]);
      gl.uniform2fv(shd.locPos, [pos.x, pos.y]);
      if (scale != null) gl.uniform2fv(shd.locScale, [scale.x, scale.y]);
      gl.uniform1f(shd.locAngle, angle);

      gl.bindVertexArray(this.VA);
      if (this.IB != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IB);
        gl.drawElements(this.type, this.numOfV, gl.UNSIGNED_SHORT, 0);
      } else gl.drawArrays(this.type, 0, this.numOfV);
    };

    massPrim[name] = this;
    return this;
  }
  function _createTank() {
    if (!massPrim["tank"])
      this.prim = new createPrim(
        "tank",
        def.pos,
        def.index,
        /*gl.TRIANGLES */
        gl.TRIANGLE_STRIP
      );
    else this.prim = massTex["tank"];

    if (!massTex["tank"]) this.tex = new createTex("tank", "./tank_blue.png");
    else this.tex = massPrim["tank"];

    this.polosa = new createPrim("polosa", def.pos, def.index, gl.TRIANGLE_STRIP);

    this.draw = function (info, userPos) {
      this.tex.apply();
      this.prim.draw(
        { x: info.pos.x - userPos.x, y: info.pos.y - userPos.y },
        info.angle,
        info.scale
      );
      const a = Math.sqrt(
        info.scale.x * info.scale.x + info.scale.y * info.scale.y
      );
      this.polosa.draw(
        { x: info.pos.x - userPos.x, y: info.pos.y - userPos.y + a },
        info.angle,
        { x: 12, y: 1 }
      );
      this.polosa.draw(
        { x: info.pos.x - userPos.x, y: info.pos.y - userPos.y - a },
        info.angle,
        { x: 12, y: 1 }
      );
    };
    createdElements["tank"] = this;
    return this;
  }
  function createTank() {
    return new _createTank();
  }
  function _createBullet() {
    if (!massPrim["bullet"])
      this.prim = new createPrim(
        "bullet",
        def.pos,
        def.index,
        /*gl.TRIANGLES */
        gl.TRIANGLE_STRIP
      );
    else this.prim = massTex["bullet"];

    if (!massTex["bullet"]) this.tex = new createTex("bullet", "./bullet.jpg");
    else this.tex = massPrim["bullet"];

    this.draw = function (info, userPos) {
      this.tex.apply();
      this.prim.draw(
        { x: info.pos.x - userPos.x, y: info.pos.y - userPos.y },
        info.angle,
        info.scale
      );
    };
    createdElements["bullet"] = this;
    return this;
  }
  function createBullet() {
    return new _createBullet();
  }
  function drawAll(drawElements) {
    let userPos = drawElements[0].info.pos;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawElements.forEach((element) => {
      createdElements[element.name].draw(element.info, userPos);
    });
  }

  const PACKET_TYPES = Object.create(null); // no Map = no polyfill
  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  const PACKET_TYPES_REVERSE = Object.create(null);
  Object.keys(PACKET_TYPES).forEach(key => {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  const ERROR_PACKET = { type: "error", data: "parser error" };

  const withNativeBlob$1 = typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
          Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
  const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
  // ArrayBuffer.isView method is not defined in IE10
  const isView$1 = obj => {
      return typeof ArrayBuffer.isView === "function"
          ? ArrayBuffer.isView(obj)
          : obj && obj.buffer instanceof ArrayBuffer;
  };
  const encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob$1 && data instanceof Blob) {
          if (supportsBinary) {
              return callback(data);
          }
          else {
              return encodeBlobAsBase64(data, callback);
          }
      }
      else if (withNativeArrayBuffer$2 &&
          (data instanceof ArrayBuffer || isView$1(data))) {
          if (supportsBinary) {
              return callback(data);
          }
          else {
              return encodeBlobAsBase64(new Blob([data]), callback);
          }
      }
      // plain string
      return callback(PACKET_TYPES[type] + (data || ""));
  };
  const encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function () {
          const content = fileReader.result.split(",")[1];
          callback("b" + (content || ""));
      };
      return fileReader.readAsDataURL(data);
  };

  // imported from https://github.com/socketio/base64-arraybuffer
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  // Use a lookup table to find the index.
  const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
      lookup$1[chars.charCodeAt(i)] = i;
  }
  const decode$1 = (base64) => {
      let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
      if (base64[base64.length - 1] === '=') {
          bufferLength--;
          if (base64[base64.length - 2] === '=') {
              bufferLength--;
          }
      }
      const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
      for (i = 0; i < len; i += 4) {
          encoded1 = lookup$1[base64.charCodeAt(i)];
          encoded2 = lookup$1[base64.charCodeAt(i + 1)];
          encoded3 = lookup$1[base64.charCodeAt(i + 2)];
          encoded4 = lookup$1[base64.charCodeAt(i + 3)];
          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }
      return arraybuffer;
  };

  const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
  const decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
          return {
              type: "message",
              data: mapBinary(encodedPacket, binaryType)
          };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
          return {
              type: "message",
              data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
          };
      }
      const packetType = PACKET_TYPES_REVERSE[type];
      if (!packetType) {
          return ERROR_PACKET;
      }
      return encodedPacket.length > 1
          ? {
              type: PACKET_TYPES_REVERSE[type],
              data: encodedPacket.substring(1)
          }
          : {
              type: PACKET_TYPES_REVERSE[type]
          };
  };
  const decodeBase64Packet = (data, binaryType) => {
      if (withNativeArrayBuffer$1) {
          const decoded = decode$1(data);
          return mapBinary(decoded, binaryType);
      }
      else {
          return { base64: true, data }; // fallback for old browsers
      }
  };
  const mapBinary = (data, binaryType) => {
      switch (binaryType) {
          case "blob":
              return data instanceof ArrayBuffer ? new Blob([data]) : data;
          case "arraybuffer":
          default:
              return data; // assuming the data is already an ArrayBuffer
      }
  };

  const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
  const encodePayload = (packets, callback) => {
      // some packets may be added to the array while encoding, so the initial length must be saved
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;
      packets.forEach((packet, i) => {
          // force base64 encoding for binary packets
          encodePacket(packet, false, encodedPacket => {
              encodedPackets[i] = encodedPacket;
              if (++count === length) {
                  callback(encodedPackets.join(SEPARATOR));
              }
          });
      });
  };
  const decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
          const decodedPacket = decodePacket(encodedPackets[i], binaryType);
          packets.push(decodedPacket);
          if (decodedPacket.type === "error") {
              break;
          }
      }
      return packets;
  };
  const protocol$1 = 4;

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(obj) {
    if (obj) return mixin(obj);
  }

  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.on =
  Emitter.prototype.addEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
      .push(fn);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.once = function(event, fn){
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.off =
  Emitter.prototype.removeListener =
  Emitter.prototype.removeAllListeners =
  Emitter.prototype.removeEventListener = function(event, fn){
    this._callbacks = this._callbacks || {};

    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }

    // specific event
    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this;

    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }

    // Remove event specific arrays for event types that no
    // one is subscribed for to avoid memory leak.
    if (callbacks.length === 0) {
      delete this._callbacks['$' + event];
    }

    return this;
  };

  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */

  Emitter.prototype.emit = function(event){
    this._callbacks = this._callbacks || {};

    var args = new Array(arguments.length - 1)
      , callbacks = this._callbacks['$' + event];

    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }

    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };

  // alias used for reserved events (protected method)
  Emitter.prototype.emitReserved = Emitter.prototype.emit;

  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter.prototype.listeners = function(event){
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };

  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */

  Emitter.prototype.hasListeners = function(event){
    return !! this.listeners(event).length;
  };

  const globalThisShim = (() => {
      if (typeof self !== "undefined") {
          return self;
      }
      else if (typeof window !== "undefined") {
          return window;
      }
      else {
          return Function("return this")();
      }
  })();

  function pick(obj, ...attr) {
      return attr.reduce((acc, k) => {
          if (obj.hasOwnProperty(k)) {
              acc[k] = obj[k];
          }
          return acc;
      }, {});
  }
  // Keep a reference to the real timeout functions so they can be used when overridden
  const NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
  const NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
  function installTimerFunctions(obj, opts) {
      if (opts.useNativeTimers) {
          obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
          obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
      }
      else {
          obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
          obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
      }
  }
  // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
  const BASE64_OVERHEAD = 1.33;
  // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
  function byteLength(obj) {
      if (typeof obj === "string") {
          return utf8Length(obj);
      }
      // arraybuffer or blob
      return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }
  function utf8Length(str) {
      let c = 0, length = 0;
      for (let i = 0, l = str.length; i < l; i++) {
          c = str.charCodeAt(i);
          if (c < 0x80) {
              length += 1;
          }
          else if (c < 0x800) {
              length += 2;
          }
          else if (c < 0xd800 || c >= 0xe000) {
              length += 3;
          }
          else {
              i++;
              length += 4;
          }
      }
      return length;
  }

  class TransportError extends Error {
      constructor(reason, description, context) {
          super(reason);
          this.description = description;
          this.context = context;
          this.type = "TransportError";
      }
  }
  class Transport extends Emitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} opts - options
       * @protected
       */
      constructor(opts) {
          super();
          this.writable = false;
          installTimerFunctions(this, opts);
          this.opts = opts;
          this.query = opts.query;
          this.socket = opts.socket;
      }
      /**
       * Emits an error.
       *
       * @param {String} reason
       * @param description
       * @param context - the error context
       * @return {Transport} for chaining
       * @protected
       */
      onError(reason, description, context) {
          super.emitReserved("error", new TransportError(reason, description, context));
          return this;
      }
      /**
       * Opens the transport.
       */
      open() {
          this.readyState = "opening";
          this.doOpen();
          return this;
      }
      /**
       * Closes the transport.
       */
      close() {
          if (this.readyState === "opening" || this.readyState === "open") {
              this.doClose();
              this.onClose();
          }
          return this;
      }
      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       */
      send(packets) {
          if (this.readyState === "open") {
              this.write(packets);
          }
      }
      /**
       * Called upon open
       *
       * @protected
       */
      onOpen() {
          this.readyState = "open";
          this.writable = true;
          super.emitReserved("open");
      }
      /**
       * Called with data.
       *
       * @param {String} data
       * @protected
       */
      onData(data) {
          const packet = decodePacket(data, this.socket.binaryType);
          this.onPacket(packet);
      }
      /**
       * Called with a decoded packet.
       *
       * @protected
       */
      onPacket(packet) {
          super.emitReserved("packet", packet);
      }
      /**
       * Called upon close.
       *
       * @protected
       */
      onClose(details) {
          this.readyState = "closed";
          super.emitReserved("close", details);
      }
      /**
       * Pauses the transport, in order not to lose packets during an upgrade.
       *
       * @param onPause
       */
      pause(onPause) { }
  }

  // imported from https://github.com/unshiftio/yeast
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''), length = 64, map = {};
  let seed = 0, i = 0, prev;
  /**
   * Return a string representing the specified number.
   *
   * @param {Number} num The number to convert.
   * @returns {String} The string representation of the number.
   * @api public
   */
  function encode$1(num) {
      let encoded = '';
      do {
          encoded = alphabet[num % length] + encoded;
          num = Math.floor(num / length);
      } while (num > 0);
      return encoded;
  }
  /**
   * Yeast: A tiny growing id generator.
   *
   * @returns {String} A unique id.
   * @api public
   */
  function yeast() {
      const now = encode$1(+new Date());
      if (now !== prev)
          return seed = 0, prev = now;
      return now + '.' + encode$1(seed++);
  }
  //
  // Map each character to its index.
  //
  for (; i < length; i++)
      map[alphabet[i]] = i;

  // imported from https://github.com/galkn/querystring
  /**
   * Compiles a querystring
   * Returns string representation of the object
   *
   * @param {Object}
   * @api private
   */
  function encode(obj) {
      let str = '';
      for (let i in obj) {
          if (obj.hasOwnProperty(i)) {
              if (str.length)
                  str += '&';
              str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
          }
      }
      return str;
  }
  /**
   * Parses a simple querystring into an object
   *
   * @param {String} qs
   * @api private
   */
  function decode(qs) {
      let qry = {};
      let pairs = qs.split('&');
      for (let i = 0, l = pairs.length; i < l; i++) {
          let pair = pairs[i].split('=');
          qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
  }

  // imported from https://github.com/component/has-cors
  let value = false;
  try {
      value = typeof XMLHttpRequest !== 'undefined' &&
          'withCredentials' in new XMLHttpRequest();
  }
  catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
  }
  const hasCORS = value;

  // browser shim for xmlhttprequest module
  function XHR(opts) {
      const xdomain = opts.xdomain;
      // XMLHttpRequest can be disabled on IE
      try {
          if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
              return new XMLHttpRequest();
          }
      }
      catch (e) { }
      if (!xdomain) {
          try {
              return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
          }
          catch (e) { }
      }
  }

  function empty() { }
  const hasXHR2 = (function () {
      const xhr = new XHR({
          xdomain: false,
      });
      return null != xhr.responseType;
  })();
  class Polling extends Transport {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @package
       */
      constructor(opts) {
          super(opts);
          this.polling = false;
          if (typeof location !== "undefined") {
              const isSSL = "https:" === location.protocol;
              let port = location.port;
              // some user agents have empty `location.port`
              if (!port) {
                  port = isSSL ? "443" : "80";
              }
              this.xd =
                  (typeof location !== "undefined" &&
                      opts.hostname !== location.hostname) ||
                      port !== opts.port;
              this.xs = opts.secure !== isSSL;
          }
          /**
           * XHR supports binary
           */
          const forceBase64 = opts && opts.forceBase64;
          this.supportsBinary = hasXHR2 && !forceBase64;
      }
      get name() {
          return "polling";
      }
      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @protected
       */
      doOpen() {
          this.poll();
      }
      /**
       * Pauses polling.
       *
       * @param {Function} onPause - callback upon buffers are flushed and transport is paused
       * @package
       */
      pause(onPause) {
          this.readyState = "pausing";
          const pause = () => {
              this.readyState = "paused";
              onPause();
          };
          if (this.polling || !this.writable) {
              let total = 0;
              if (this.polling) {
                  total++;
                  this.once("pollComplete", function () {
                      --total || pause();
                  });
              }
              if (!this.writable) {
                  total++;
                  this.once("drain", function () {
                      --total || pause();
                  });
              }
          }
          else {
              pause();
          }
      }
      /**
       * Starts polling cycle.
       *
       * @private
       */
      poll() {
          this.polling = true;
          this.doPoll();
          this.emitReserved("poll");
      }
      /**
       * Overloads onData to detect payloads.
       *
       * @protected
       */
      onData(data) {
          const callback = (packet) => {
              // if its the first message we consider the transport open
              if ("opening" === this.readyState && packet.type === "open") {
                  this.onOpen();
              }
              // if its a close packet, we close the ongoing requests
              if ("close" === packet.type) {
                  this.onClose({ description: "transport closed by the server" });
                  return false;
              }
              // otherwise bypass onData and handle the message
              this.onPacket(packet);
          };
          // decode payload
          decodePayload(data, this.socket.binaryType).forEach(callback);
          // if an event did not trigger closing
          if ("closed" !== this.readyState) {
              // if we got data we're not polling
              this.polling = false;
              this.emitReserved("pollComplete");
              if ("open" === this.readyState) {
                  this.poll();
              }
          }
      }
      /**
       * For polling, send a close packet.
       *
       * @protected
       */
      doClose() {
          const close = () => {
              this.write([{ type: "close" }]);
          };
          if ("open" === this.readyState) {
              close();
          }
          else {
              // in case we're trying to close while
              // handshaking is in progress (GH-164)
              this.once("open", close);
          }
      }
      /**
       * Writes a packets payload.
       *
       * @param {Array} packets - data packets
       * @protected
       */
      write(packets) {
          this.writable = false;
          encodePayload(packets, (data) => {
              this.doWrite(data, () => {
                  this.writable = true;
                  this.emitReserved("drain");
              });
          });
      }
      /**
       * Generates uri for connection.
       *
       * @private
       */
      uri() {
          let query = this.query || {};
          const schema = this.opts.secure ? "https" : "http";
          let port = "";
          // cache busting is forced
          if (false !== this.opts.timestampRequests) {
              query[this.opts.timestampParam] = yeast();
          }
          if (!this.supportsBinary && !query.sid) {
              query.b64 = 1;
          }
          // avoid port if default for schema
          if (this.opts.port &&
              (("https" === schema && Number(this.opts.port) !== 443) ||
                  ("http" === schema && Number(this.opts.port) !== 80))) {
              port = ":" + this.opts.port;
          }
          const encodedQuery = encode(query);
          const ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return (schema +
              "://" +
              (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
              port +
              this.opts.path +
              (encodedQuery.length ? "?" + encodedQuery : ""));
      }
      /**
       * Creates a request.
       *
       * @param {String} method
       * @private
       */
      request(opts = {}) {
          Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
          return new Request(this.uri(), opts);
      }
      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @private
       */
      doWrite(data, fn) {
          const req = this.request({
              method: "POST",
              data: data,
          });
          req.on("success", fn);
          req.on("error", (xhrStatus, context) => {
              this.onError("xhr post error", xhrStatus, context);
          });
      }
      /**
       * Starts a poll cycle.
       *
       * @private
       */
      doPoll() {
          const req = this.request();
          req.on("data", this.onData.bind(this));
          req.on("error", (xhrStatus, context) => {
              this.onError("xhr poll error", xhrStatus, context);
          });
          this.pollXhr = req;
      }
  }
  class Request extends Emitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @package
       */
      constructor(uri, opts) {
          super();
          installTimerFunctions(this, opts);
          this.opts = opts;
          this.method = opts.method || "GET";
          this.uri = uri;
          this.async = false !== opts.async;
          this.data = undefined !== opts.data ? opts.data : null;
          this.create();
      }
      /**
       * Creates the XHR object and sends the request.
       *
       * @private
       */
      create() {
          const opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
          opts.xdomain = !!this.opts.xd;
          opts.xscheme = !!this.opts.xs;
          const xhr = (this.xhr = new XHR(opts));
          try {
              xhr.open(this.method, this.uri, this.async);
              try {
                  if (this.opts.extraHeaders) {
                      xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                      for (let i in this.opts.extraHeaders) {
                          if (this.opts.extraHeaders.hasOwnProperty(i)) {
                              xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                          }
                      }
                  }
              }
              catch (e) { }
              if ("POST" === this.method) {
                  try {
                      xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                  }
                  catch (e) { }
              }
              try {
                  xhr.setRequestHeader("Accept", "*/*");
              }
              catch (e) { }
              // ie6 check
              if ("withCredentials" in xhr) {
                  xhr.withCredentials = this.opts.withCredentials;
              }
              if (this.opts.requestTimeout) {
                  xhr.timeout = this.opts.requestTimeout;
              }
              xhr.onreadystatechange = () => {
                  if (4 !== xhr.readyState)
                      return;
                  if (200 === xhr.status || 1223 === xhr.status) {
                      this.onLoad();
                  }
                  else {
                      // make sure the `error` event handler that's user-set
                      // does not throw in the same tick and gets caught here
                      this.setTimeoutFn(() => {
                          this.onError(typeof xhr.status === "number" ? xhr.status : 0);
                      }, 0);
                  }
              };
              xhr.send(this.data);
          }
          catch (e) {
              // Need to defer since .create() is called directly from the constructor
              // and thus the 'error' event can only be only bound *after* this exception
              // occurs.  Therefore, also, we cannot throw here at all.
              this.setTimeoutFn(() => {
                  this.onError(e);
              }, 0);
              return;
          }
          if (typeof document !== "undefined") {
              this.index = Request.requestsCount++;
              Request.requests[this.index] = this;
          }
      }
      /**
       * Called upon error.
       *
       * @private
       */
      onError(err) {
          this.emitReserved("error", err, this.xhr);
          this.cleanup(true);
      }
      /**
       * Cleans up house.
       *
       * @private
       */
      cleanup(fromError) {
          if ("undefined" === typeof this.xhr || null === this.xhr) {
              return;
          }
          this.xhr.onreadystatechange = empty;
          if (fromError) {
              try {
                  this.xhr.abort();
              }
              catch (e) { }
          }
          if (typeof document !== "undefined") {
              delete Request.requests[this.index];
          }
          this.xhr = null;
      }
      /**
       * Called upon load.
       *
       * @private
       */
      onLoad() {
          const data = this.xhr.responseText;
          if (data !== null) {
              this.emitReserved("data", data);
              this.emitReserved("success");
              this.cleanup();
          }
      }
      /**
       * Aborts the request.
       *
       * @package
       */
      abort() {
          this.cleanup();
      }
  }
  Request.requestsCount = 0;
  Request.requests = {};
  /**
   * Aborts pending requests when unloading the window. This is needed to prevent
   * memory leaks (e.g. when using IE) and to ensure that no spurious error is
   * emitted.
   */
  if (typeof document !== "undefined") {
      // @ts-ignore
      if (typeof attachEvent === "function") {
          // @ts-ignore
          attachEvent("onunload", unloadHandler);
      }
      else if (typeof addEventListener === "function") {
          const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
          addEventListener(terminationEvent, unloadHandler, false);
      }
  }
  function unloadHandler() {
      for (let i in Request.requests) {
          if (Request.requests.hasOwnProperty(i)) {
              Request.requests[i].abort();
          }
      }
  }

  const nextTick = (() => {
      const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
      if (isPromiseAvailable) {
          return (cb) => Promise.resolve().then(cb);
      }
      else {
          return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
      }
  })();
  const WebSocket = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
  const usingBrowserWebSocket = true;
  const defaultBinaryType = "arraybuffer";

  // detect ReactNative environment
  const isReactNative = typeof navigator !== "undefined" &&
      typeof navigator.product === "string" &&
      navigator.product.toLowerCase() === "reactnative";
  class WS extends Transport {
      /**
       * WebSocket transport constructor.
       *
       * @param {Object} opts - connection options
       * @protected
       */
      constructor(opts) {
          super(opts);
          this.supportsBinary = !opts.forceBase64;
      }
      get name() {
          return "websocket";
      }
      doOpen() {
          if (!this.check()) {
              // let probe timeout
              return;
          }
          const uri = this.uri();
          const protocols = this.opts.protocols;
          // React Native only supports the 'headers' option, and will print a warning if anything else is passed
          const opts = isReactNative
              ? {}
              : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
          if (this.opts.extraHeaders) {
              opts.headers = this.opts.extraHeaders;
          }
          try {
              this.ws =
                  usingBrowserWebSocket && !isReactNative
                      ? protocols
                          ? new WebSocket(uri, protocols)
                          : new WebSocket(uri)
                      : new WebSocket(uri, protocols, opts);
          }
          catch (err) {
              return this.emitReserved("error", err);
          }
          this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
          this.addEventListeners();
      }
      /**
       * Adds event listeners to the socket
       *
       * @private
       */
      addEventListeners() {
          this.ws.onopen = () => {
              if (this.opts.autoUnref) {
                  this.ws._socket.unref();
              }
              this.onOpen();
          };
          this.ws.onclose = (closeEvent) => this.onClose({
              description: "websocket connection closed",
              context: closeEvent,
          });
          this.ws.onmessage = (ev) => this.onData(ev.data);
          this.ws.onerror = (e) => this.onError("websocket error", e);
      }
      write(packets) {
          this.writable = false;
          // encodePacket efficient as it uses WS framing
          // no need for encodePayload
          for (let i = 0; i < packets.length; i++) {
              const packet = packets[i];
              const lastPacket = i === packets.length - 1;
              encodePacket(packet, this.supportsBinary, (data) => {
                  // always create a new object (GH-437)
                  const opts = {};
                  // Sometimes the websocket has already been closed but the browser didn't
                  // have a chance of informing us about it yet, in that case send will
                  // throw an error
                  try {
                      if (usingBrowserWebSocket) {
                          // TypeError is thrown when passing the second argument on Safari
                          this.ws.send(data);
                      }
                  }
                  catch (e) {
                  }
                  if (lastPacket) {
                      // fake drain
                      // defer to next tick to allow Socket to clear writeBuffer
                      nextTick(() => {
                          this.writable = true;
                          this.emitReserved("drain");
                      }, this.setTimeoutFn);
                  }
              });
          }
      }
      doClose() {
          if (typeof this.ws !== "undefined") {
              this.ws.close();
              this.ws = null;
          }
      }
      /**
       * Generates uri for connection.
       *
       * @private
       */
      uri() {
          let query = this.query || {};
          const schema = this.opts.secure ? "wss" : "ws";
          let port = "";
          // avoid port if default for schema
          if (this.opts.port &&
              (("wss" === schema && Number(this.opts.port) !== 443) ||
                  ("ws" === schema && Number(this.opts.port) !== 80))) {
              port = ":" + this.opts.port;
          }
          // append timestamp to URI
          if (this.opts.timestampRequests) {
              query[this.opts.timestampParam] = yeast();
          }
          // communicate binary support capabilities
          if (!this.supportsBinary) {
              query.b64 = 1;
          }
          const encodedQuery = encode(query);
          const ipv6 = this.opts.hostname.indexOf(":") !== -1;
          return (schema +
              "://" +
              (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
              port +
              this.opts.path +
              (encodedQuery.length ? "?" + encodedQuery : ""));
      }
      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @private
       */
      check() {
          return !!WebSocket;
      }
  }

  const transports = {
      websocket: WS,
      polling: Polling,
  };

  // imported from https://github.com/galkn/parseuri
  /**
   * Parses a URI
   *
   * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
   *
   * See:
   * - https://developer.mozilla.org/en-US/docs/Web/API/URL
   * - https://caniuse.com/url
   * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
   *
   * History of the parse() method:
   * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
   * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
   * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api private
   */
  const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  const parts = [
      'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
  ];
  function parse(str) {
      const src = str, b = str.indexOf('['), e = str.indexOf(']');
      if (b != -1 && e != -1) {
          str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
      }
      let m = re.exec(str || ''), uri = {}, i = 14;
      while (i--) {
          uri[parts[i]] = m[i] || '';
      }
      if (b != -1 && e != -1) {
          uri.source = src;
          uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
          uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
          uri.ipv6uri = true;
      }
      uri.pathNames = pathNames(uri, uri['path']);
      uri.queryKey = queryKey(uri, uri['query']);
      return uri;
  }
  function pathNames(obj, path) {
      const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
      if (path.slice(0, 1) == '/' || path.length === 0) {
          names.splice(0, 1);
      }
      if (path.slice(-1) == '/') {
          names.splice(names.length - 1, 1);
      }
      return names;
  }
  function queryKey(uri, query) {
      const data = {};
      query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
          if ($1) {
              data[$1] = $2;
          }
      });
      return data;
  }

  let Socket$1 = class Socket extends Emitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri - uri or options
       * @param {Object} opts - options
       */
      constructor(uri, opts = {}) {
          super();
          this.writeBuffer = [];
          if (uri && "object" === typeof uri) {
              opts = uri;
              uri = null;
          }
          if (uri) {
              uri = parse(uri);
              opts.hostname = uri.host;
              opts.secure = uri.protocol === "https" || uri.protocol === "wss";
              opts.port = uri.port;
              if (uri.query)
                  opts.query = uri.query;
          }
          else if (opts.host) {
              opts.hostname = parse(opts.host).host;
          }
          installTimerFunctions(this, opts);
          this.secure =
              null != opts.secure
                  ? opts.secure
                  : typeof location !== "undefined" && "https:" === location.protocol;
          if (opts.hostname && !opts.port) {
              // if no port is specified manually, use the protocol default
              opts.port = this.secure ? "443" : "80";
          }
          this.hostname =
              opts.hostname ||
                  (typeof location !== "undefined" ? location.hostname : "localhost");
          this.port =
              opts.port ||
                  (typeof location !== "undefined" && location.port
                      ? location.port
                      : this.secure
                          ? "443"
                          : "80");
          this.transports = opts.transports || ["polling", "websocket"];
          this.writeBuffer = [];
          this.prevBufferLen = 0;
          this.opts = Object.assign({
              path: "/engine.io",
              agent: false,
              withCredentials: false,
              upgrade: true,
              timestampParam: "t",
              rememberUpgrade: false,
              addTrailingSlash: true,
              rejectUnauthorized: true,
              perMessageDeflate: {
                  threshold: 1024,
              },
              transportOptions: {},
              closeOnBeforeunload: true,
          }, opts);
          this.opts.path =
              this.opts.path.replace(/\/$/, "") +
                  (this.opts.addTrailingSlash ? "/" : "");
          if (typeof this.opts.query === "string") {
              this.opts.query = decode(this.opts.query);
          }
          // set on handshake
          this.id = null;
          this.upgrades = null;
          this.pingInterval = null;
          this.pingTimeout = null;
          // set on heartbeat
          this.pingTimeoutTimer = null;
          if (typeof addEventListener === "function") {
              if (this.opts.closeOnBeforeunload) {
                  // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                  // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                  // closed/reloaded)
                  this.beforeunloadEventListener = () => {
                      if (this.transport) {
                          // silently close the transport
                          this.transport.removeAllListeners();
                          this.transport.close();
                      }
                  };
                  addEventListener("beforeunload", this.beforeunloadEventListener, false);
              }
              if (this.hostname !== "localhost") {
                  this.offlineEventListener = () => {
                      this.onClose("transport close", {
                          description: "network connection lost",
                      });
                  };
                  addEventListener("offline", this.offlineEventListener, false);
              }
          }
          this.open();
      }
      /**
       * Creates transport of the given type.
       *
       * @param {String} name - transport name
       * @return {Transport}
       * @private
       */
      createTransport(name) {
          const query = Object.assign({}, this.opts.query);
          // append engine.io protocol identifier
          query.EIO = protocol$1;
          // transport name
          query.transport = name;
          // session id if we already have one
          if (this.id)
              query.sid = this.id;
          const opts = Object.assign({}, this.opts.transportOptions[name], this.opts, {
              query,
              socket: this,
              hostname: this.hostname,
              secure: this.secure,
              port: this.port,
          });
          return new transports[name](opts);
      }
      /**
       * Initializes transport to use and starts probe.
       *
       * @private
       */
      open() {
          let transport;
          if (this.opts.rememberUpgrade &&
              Socket.priorWebsocketSuccess &&
              this.transports.indexOf("websocket") !== -1) {
              transport = "websocket";
          }
          else if (0 === this.transports.length) {
              // Emit error on next tick so it can be listened to
              this.setTimeoutFn(() => {
                  this.emitReserved("error", "No transports available");
              }, 0);
              return;
          }
          else {
              transport = this.transports[0];
          }
          this.readyState = "opening";
          // Retry with the next transport if the transport is disabled (jsonp: false)
          try {
              transport = this.createTransport(transport);
          }
          catch (e) {
              this.transports.shift();
              this.open();
              return;
          }
          transport.open();
          this.setTransport(transport);
      }
      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @private
       */
      setTransport(transport) {
          if (this.transport) {
              this.transport.removeAllListeners();
          }
          // set up transport
          this.transport = transport;
          // set up transport listeners
          transport
              .on("drain", this.onDrain.bind(this))
              .on("packet", this.onPacket.bind(this))
              .on("error", this.onError.bind(this))
              .on("close", (reason) => this.onClose("transport close", reason));
      }
      /**
       * Probes a transport.
       *
       * @param {String} name - transport name
       * @private
       */
      probe(name) {
          let transport = this.createTransport(name);
          let failed = false;
          Socket.priorWebsocketSuccess = false;
          const onTransportOpen = () => {
              if (failed)
                  return;
              transport.send([{ type: "ping", data: "probe" }]);
              transport.once("packet", (msg) => {
                  if (failed)
                      return;
                  if ("pong" === msg.type && "probe" === msg.data) {
                      this.upgrading = true;
                      this.emitReserved("upgrading", transport);
                      if (!transport)
                          return;
                      Socket.priorWebsocketSuccess = "websocket" === transport.name;
                      this.transport.pause(() => {
                          if (failed)
                              return;
                          if ("closed" === this.readyState)
                              return;
                          cleanup();
                          this.setTransport(transport);
                          transport.send([{ type: "upgrade" }]);
                          this.emitReserved("upgrade", transport);
                          transport = null;
                          this.upgrading = false;
                          this.flush();
                      });
                  }
                  else {
                      const err = new Error("probe error");
                      // @ts-ignore
                      err.transport = transport.name;
                      this.emitReserved("upgradeError", err);
                  }
              });
          };
          function freezeTransport() {
              if (failed)
                  return;
              // Any callback called by transport should be ignored since now
              failed = true;
              cleanup();
              transport.close();
              transport = null;
          }
          // Handle any error that happens while probing
          const onerror = (err) => {
              const error = new Error("probe error: " + err);
              // @ts-ignore
              error.transport = transport.name;
              freezeTransport();
              this.emitReserved("upgradeError", error);
          };
          function onTransportClose() {
              onerror("transport closed");
          }
          // When the socket is closed while we're probing
          function onclose() {
              onerror("socket closed");
          }
          // When the socket is upgraded while we're probing
          function onupgrade(to) {
              if (transport && to.name !== transport.name) {
                  freezeTransport();
              }
          }
          // Remove all listeners on the transport and on self
          const cleanup = () => {
              transport.removeListener("open", onTransportOpen);
              transport.removeListener("error", onerror);
              transport.removeListener("close", onTransportClose);
              this.off("close", onclose);
              this.off("upgrading", onupgrade);
          };
          transport.once("open", onTransportOpen);
          transport.once("error", onerror);
          transport.once("close", onTransportClose);
          this.once("close", onclose);
          this.once("upgrading", onupgrade);
          transport.open();
      }
      /**
       * Called when connection is deemed open.
       *
       * @private
       */
      onOpen() {
          this.readyState = "open";
          Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
          this.emitReserved("open");
          this.flush();
          // we check for `readyState` in case an `open`
          // listener already closed the socket
          if ("open" === this.readyState && this.opts.upgrade) {
              let i = 0;
              const l = this.upgrades.length;
              for (; i < l; i++) {
                  this.probe(this.upgrades[i]);
              }
          }
      }
      /**
       * Handles a packet.
       *
       * @private
       */
      onPacket(packet) {
          if ("opening" === this.readyState ||
              "open" === this.readyState ||
              "closing" === this.readyState) {
              this.emitReserved("packet", packet);
              // Socket is live - any packet counts
              this.emitReserved("heartbeat");
              switch (packet.type) {
                  case "open":
                      this.onHandshake(JSON.parse(packet.data));
                      break;
                  case "ping":
                      this.resetPingTimeout();
                      this.sendPacket("pong");
                      this.emitReserved("ping");
                      this.emitReserved("pong");
                      break;
                  case "error":
                      const err = new Error("server error");
                      // @ts-ignore
                      err.code = packet.data;
                      this.onError(err);
                      break;
                  case "message":
                      this.emitReserved("data", packet.data);
                      this.emitReserved("message", packet.data);
                      break;
              }
          }
      }
      /**
       * Called upon handshake completion.
       *
       * @param {Object} data - handshake obj
       * @private
       */
      onHandshake(data) {
          this.emitReserved("handshake", data);
          this.id = data.sid;
          this.transport.query.sid = data.sid;
          this.upgrades = this.filterUpgrades(data.upgrades);
          this.pingInterval = data.pingInterval;
          this.pingTimeout = data.pingTimeout;
          this.maxPayload = data.maxPayload;
          this.onOpen();
          // In case open handler closes socket
          if ("closed" === this.readyState)
              return;
          this.resetPingTimeout();
      }
      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @private
       */
      resetPingTimeout() {
          this.clearTimeoutFn(this.pingTimeoutTimer);
          this.pingTimeoutTimer = this.setTimeoutFn(() => {
              this.onClose("ping timeout");
          }, this.pingInterval + this.pingTimeout);
          if (this.opts.autoUnref) {
              this.pingTimeoutTimer.unref();
          }
      }
      /**
       * Called on `drain` event
       *
       * @private
       */
      onDrain() {
          this.writeBuffer.splice(0, this.prevBufferLen);
          // setting prevBufferLen = 0 is very important
          // for example, when upgrading, upgrade packet is sent over,
          // and a nonzero prevBufferLen could cause problems on `drain`
          this.prevBufferLen = 0;
          if (0 === this.writeBuffer.length) {
              this.emitReserved("drain");
          }
          else {
              this.flush();
          }
      }
      /**
       * Flush write buffers.
       *
       * @private
       */
      flush() {
          if ("closed" !== this.readyState &&
              this.transport.writable &&
              !this.upgrading &&
              this.writeBuffer.length) {
              const packets = this.getWritablePackets();
              this.transport.send(packets);
              // keep track of current length of writeBuffer
              // splice writeBuffer and callbackBuffer on `drain`
              this.prevBufferLen = packets.length;
              this.emitReserved("flush");
          }
      }
      /**
       * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
       * long-polling)
       *
       * @private
       */
      getWritablePackets() {
          const shouldCheckPayloadSize = this.maxPayload &&
              this.transport.name === "polling" &&
              this.writeBuffer.length > 1;
          if (!shouldCheckPayloadSize) {
              return this.writeBuffer;
          }
          let payloadSize = 1; // first packet type
          for (let i = 0; i < this.writeBuffer.length; i++) {
              const data = this.writeBuffer[i].data;
              if (data) {
                  payloadSize += byteLength(data);
              }
              if (i > 0 && payloadSize > this.maxPayload) {
                  return this.writeBuffer.slice(0, i);
              }
              payloadSize += 2; // separator + packet type
          }
          return this.writeBuffer;
      }
      /**
       * Sends a message.
       *
       * @param {String} msg - message.
       * @param {Object} options.
       * @param {Function} callback function.
       * @return {Socket} for chaining.
       */
      write(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
      }
      send(msg, options, fn) {
          this.sendPacket("message", msg, options, fn);
          return this;
      }
      /**
       * Sends a packet.
       *
       * @param {String} type: packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} fn - callback function.
       * @private
       */
      sendPacket(type, data, options, fn) {
          if ("function" === typeof data) {
              fn = data;
              data = undefined;
          }
          if ("function" === typeof options) {
              fn = options;
              options = null;
          }
          if ("closing" === this.readyState || "closed" === this.readyState) {
              return;
          }
          options = options || {};
          options.compress = false !== options.compress;
          const packet = {
              type: type,
              data: data,
              options: options,
          };
          this.emitReserved("packetCreate", packet);
          this.writeBuffer.push(packet);
          if (fn)
              this.once("flush", fn);
          this.flush();
      }
      /**
       * Closes the connection.
       */
      close() {
          const close = () => {
              this.onClose("forced close");
              this.transport.close();
          };
          const cleanupAndClose = () => {
              this.off("upgrade", cleanupAndClose);
              this.off("upgradeError", cleanupAndClose);
              close();
          };
          const waitForUpgrade = () => {
              // wait for upgrade to finish since we can't send packets while pausing a transport
              this.once("upgrade", cleanupAndClose);
              this.once("upgradeError", cleanupAndClose);
          };
          if ("opening" === this.readyState || "open" === this.readyState) {
              this.readyState = "closing";
              if (this.writeBuffer.length) {
                  this.once("drain", () => {
                      if (this.upgrading) {
                          waitForUpgrade();
                      }
                      else {
                          close();
                      }
                  });
              }
              else if (this.upgrading) {
                  waitForUpgrade();
              }
              else {
                  close();
              }
          }
          return this;
      }
      /**
       * Called upon transport error
       *
       * @private
       */
      onError(err) {
          Socket.priorWebsocketSuccess = false;
          this.emitReserved("error", err);
          this.onClose("transport error", err);
      }
      /**
       * Called upon transport close.
       *
       * @private
       */
      onClose(reason, description) {
          if ("opening" === this.readyState ||
              "open" === this.readyState ||
              "closing" === this.readyState) {
              // clear timers
              this.clearTimeoutFn(this.pingTimeoutTimer);
              // stop event from firing again for transport
              this.transport.removeAllListeners("close");
              // ensure transport won't stay open
              this.transport.close();
              // ignore further transport communication
              this.transport.removeAllListeners();
              if (typeof removeEventListener === "function") {
                  removeEventListener("beforeunload", this.beforeunloadEventListener, false);
                  removeEventListener("offline", this.offlineEventListener, false);
              }
              // set ready state
              this.readyState = "closed";
              // clear session id
              this.id = null;
              // emit close event
              this.emitReserved("close", reason, description);
              // clean buffers after, so users can still
              // grab the buffers on `close` event
              this.writeBuffer = [];
              this.prevBufferLen = 0;
          }
      }
      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} upgrades - server upgrades
       * @private
       */
      filterUpgrades(upgrades) {
          const filteredUpgrades = [];
          let i = 0;
          const j = upgrades.length;
          for (; i < j; i++) {
              if (~this.transports.indexOf(upgrades[i]))
                  filteredUpgrades.push(upgrades[i]);
          }
          return filteredUpgrades;
      }
  };
  Socket$1.protocol = protocol$1;

  /**
   * URL parser.
   *
   * @param uri - url
   * @param path - the request path of the connection
   * @param loc - An object meant to mimic window.location.
   *        Defaults to window.location.
   * @public
   */
  function url(uri, path = "", loc) {
      let obj = uri;
      // default to window.location
      loc = loc || (typeof location !== "undefined" && location);
      if (null == uri)
          uri = loc.protocol + "//" + loc.host;
      // relative path support
      if (typeof uri === "string") {
          if ("/" === uri.charAt(0)) {
              if ("/" === uri.charAt(1)) {
                  uri = loc.protocol + uri;
              }
              else {
                  uri = loc.host + uri;
              }
          }
          if (!/^(https?|wss?):\/\//.test(uri)) {
              if ("undefined" !== typeof loc) {
                  uri = loc.protocol + "//" + uri;
              }
              else {
                  uri = "https://" + uri;
              }
          }
          // parse
          obj = parse(uri);
      }
      // make sure we treat `localhost:80` and `localhost` equally
      if (!obj.port) {
          if (/^(http|ws)$/.test(obj.protocol)) {
              obj.port = "80";
          }
          else if (/^(http|ws)s$/.test(obj.protocol)) {
              obj.port = "443";
          }
      }
      obj.path = obj.path || "/";
      const ipv6 = obj.host.indexOf(":") !== -1;
      const host = ipv6 ? "[" + obj.host + "]" : obj.host;
      // define unique id
      obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
      // define href
      obj.href =
          obj.protocol +
              "://" +
              host +
              (loc && loc.port === obj.port ? "" : ":" + obj.port);
      return obj;
  }

  const withNativeArrayBuffer = typeof ArrayBuffer === "function";
  const isView = (obj) => {
      return typeof ArrayBuffer.isView === "function"
          ? ArrayBuffer.isView(obj)
          : obj.buffer instanceof ArrayBuffer;
  };
  const toString = Object.prototype.toString;
  const withNativeBlob = typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
          toString.call(Blob) === "[object BlobConstructor]");
  const withNativeFile = typeof File === "function" ||
      (typeof File !== "undefined" &&
          toString.call(File) === "[object FileConstructor]");
  /**
   * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
   *
   * @private
   */
  function isBinary(obj) {
      return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
          (withNativeBlob && obj instanceof Blob) ||
          (withNativeFile && obj instanceof File));
  }
  function hasBinary(obj, toJSON) {
      if (!obj || typeof obj !== "object") {
          return false;
      }
      if (Array.isArray(obj)) {
          for (let i = 0, l = obj.length; i < l; i++) {
              if (hasBinary(obj[i])) {
                  return true;
              }
          }
          return false;
      }
      if (isBinary(obj)) {
          return true;
      }
      if (obj.toJSON &&
          typeof obj.toJSON === "function" &&
          arguments.length === 1) {
          return hasBinary(obj.toJSON(), true);
      }
      for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
              return true;
          }
      }
      return false;
  }

  /**
   * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
   *
   * @param {Object} packet - socket.io event packet
   * @return {Object} with deconstructed packet and list of buffers
   * @public
   */
  function deconstructPacket(packet) {
      const buffers = [];
      const packetData = packet.data;
      const pack = packet;
      pack.data = _deconstructPacket(packetData, buffers);
      pack.attachments = buffers.length; // number of binary 'attachments'
      return { packet: pack, buffers: buffers };
  }
  function _deconstructPacket(data, buffers) {
      if (!data)
          return data;
      if (isBinary(data)) {
          const placeholder = { _placeholder: true, num: buffers.length };
          buffers.push(data);
          return placeholder;
      }
      else if (Array.isArray(data)) {
          const newData = new Array(data.length);
          for (let i = 0; i < data.length; i++) {
              newData[i] = _deconstructPacket(data[i], buffers);
          }
          return newData;
      }
      else if (typeof data === "object" && !(data instanceof Date)) {
          const newData = {};
          for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                  newData[key] = _deconstructPacket(data[key], buffers);
              }
          }
          return newData;
      }
      return data;
  }
  /**
   * Reconstructs a binary packet from its placeholder packet and buffers
   *
   * @param {Object} packet - event packet with placeholders
   * @param {Array} buffers - binary buffers to put in placeholder positions
   * @return {Object} reconstructed packet
   * @public
   */
  function reconstructPacket(packet, buffers) {
      packet.data = _reconstructPacket(packet.data, buffers);
      delete packet.attachments; // no longer useful
      return packet;
  }
  function _reconstructPacket(data, buffers) {
      if (!data)
          return data;
      if (data && data._placeholder === true) {
          const isIndexValid = typeof data.num === "number" &&
              data.num >= 0 &&
              data.num < buffers.length;
          if (isIndexValid) {
              return buffers[data.num]; // appropriate buffer (should be natural order anyway)
          }
          else {
              throw new Error("illegal attachments");
          }
      }
      else if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
              data[i] = _reconstructPacket(data[i], buffers);
          }
      }
      else if (typeof data === "object") {
          for (const key in data) {
              if (Object.prototype.hasOwnProperty.call(data, key)) {
                  data[key] = _reconstructPacket(data[key], buffers);
              }
          }
      }
      return data;
  }

  /**
   * These strings must not be used as event names, as they have a special meaning.
   */
  const RESERVED_EVENTS$1 = [
      "connect",
      "connect_error",
      "disconnect",
      "disconnecting",
      "newListener",
      "removeListener", // used by the Node.js EventEmitter
  ];
  /**
   * Protocol version.
   *
   * @public
   */
  const protocol = 5;
  var PacketType;
  (function (PacketType) {
      PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
      PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
      PacketType[PacketType["EVENT"] = 2] = "EVENT";
      PacketType[PacketType["ACK"] = 3] = "ACK";
      PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
      PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
      PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  /**
   * A socket.io Encoder instance
   */
  class Encoder {
      /**
       * Encoder constructor
       *
       * @param {function} replacer - custom replacer to pass down to JSON.parse
       */
      constructor(replacer) {
          this.replacer = replacer;
      }
      /**
       * Encode a packet as a single string if non-binary, or as a
       * buffer sequence, depending on packet type.
       *
       * @param {Object} obj - packet object
       */
      encode(obj) {
          if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
              if (hasBinary(obj)) {
                  return this.encodeAsBinary({
                      type: obj.type === PacketType.EVENT
                          ? PacketType.BINARY_EVENT
                          : PacketType.BINARY_ACK,
                      nsp: obj.nsp,
                      data: obj.data,
                      id: obj.id,
                  });
              }
          }
          return [this.encodeAsString(obj)];
      }
      /**
       * Encode packet as string.
       */
      encodeAsString(obj) {
          // first is type
          let str = "" + obj.type;
          // attachments if we have them
          if (obj.type === PacketType.BINARY_EVENT ||
              obj.type === PacketType.BINARY_ACK) {
              str += obj.attachments + "-";
          }
          // if we have a namespace other than `/`
          // we append it followed by a comma `,`
          if (obj.nsp && "/" !== obj.nsp) {
              str += obj.nsp + ",";
          }
          // immediately followed by the id
          if (null != obj.id) {
              str += obj.id;
          }
          // json data
          if (null != obj.data) {
              str += JSON.stringify(obj.data, this.replacer);
          }
          return str;
      }
      /**
       * Encode packet as 'buffer sequence' by removing blobs, and
       * deconstructing packet into object with placeholders and
       * a list of buffers.
       */
      encodeAsBinary(obj) {
          const deconstruction = deconstructPacket(obj);
          const pack = this.encodeAsString(deconstruction.packet);
          const buffers = deconstruction.buffers;
          buffers.unshift(pack); // add packet info to beginning of data list
          return buffers; // write all the buffers
      }
  }
  // see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
  function isObject(value) {
      return Object.prototype.toString.call(value) === "[object Object]";
  }
  /**
   * A socket.io Decoder instance
   *
   * @return {Object} decoder
   */
  class Decoder extends Emitter {
      /**
       * Decoder constructor
       *
       * @param {function} reviver - custom reviver to pass down to JSON.stringify
       */
      constructor(reviver) {
          super();
          this.reviver = reviver;
      }
      /**
       * Decodes an encoded packet string into packet JSON.
       *
       * @param {String} obj - encoded packet
       */
      add(obj) {
          let packet;
          if (typeof obj === "string") {
              if (this.reconstructor) {
                  throw new Error("got plaintext data when reconstructing a packet");
              }
              packet = this.decodeString(obj);
              const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
              if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
                  packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
                  // binary packet's json
                  this.reconstructor = new BinaryReconstructor(packet);
                  // no attachments, labeled binary but no binary data to follow
                  if (packet.attachments === 0) {
                      super.emitReserved("decoded", packet);
                  }
              }
              else {
                  // non-binary full packet
                  super.emitReserved("decoded", packet);
              }
          }
          else if (isBinary(obj) || obj.base64) {
              // raw binary data
              if (!this.reconstructor) {
                  throw new Error("got binary data when not reconstructing a packet");
              }
              else {
                  packet = this.reconstructor.takeBinaryData(obj);
                  if (packet) {
                      // received final buffer
                      this.reconstructor = null;
                      super.emitReserved("decoded", packet);
                  }
              }
          }
          else {
              throw new Error("Unknown type: " + obj);
          }
      }
      /**
       * Decode a packet String (JSON data)
       *
       * @param {String} str
       * @return {Object} packet
       */
      decodeString(str) {
          let i = 0;
          // look up type
          const p = {
              type: Number(str.charAt(0)),
          };
          if (PacketType[p.type] === undefined) {
              throw new Error("unknown packet type " + p.type);
          }
          // look up attachments if type binary
          if (p.type === PacketType.BINARY_EVENT ||
              p.type === PacketType.BINARY_ACK) {
              const start = i + 1;
              while (str.charAt(++i) !== "-" && i != str.length) { }
              const buf = str.substring(start, i);
              if (buf != Number(buf) || str.charAt(i) !== "-") {
                  throw new Error("Illegal attachments");
              }
              p.attachments = Number(buf);
          }
          // look up namespace (if any)
          if ("/" === str.charAt(i + 1)) {
              const start = i + 1;
              while (++i) {
                  const c = str.charAt(i);
                  if ("," === c)
                      break;
                  if (i === str.length)
                      break;
              }
              p.nsp = str.substring(start, i);
          }
          else {
              p.nsp = "/";
          }
          // look up id
          const next = str.charAt(i + 1);
          if ("" !== next && Number(next) == next) {
              const start = i + 1;
              while (++i) {
                  const c = str.charAt(i);
                  if (null == c || Number(c) != c) {
                      --i;
                      break;
                  }
                  if (i === str.length)
                      break;
              }
              p.id = Number(str.substring(start, i + 1));
          }
          // look up json data
          if (str.charAt(++i)) {
              const payload = this.tryParse(str.substr(i));
              if (Decoder.isPayloadValid(p.type, payload)) {
                  p.data = payload;
              }
              else {
                  throw new Error("invalid payload");
              }
          }
          return p;
      }
      tryParse(str) {
          try {
              return JSON.parse(str, this.reviver);
          }
          catch (e) {
              return false;
          }
      }
      static isPayloadValid(type, payload) {
          switch (type) {
              case PacketType.CONNECT:
                  return isObject(payload);
              case PacketType.DISCONNECT:
                  return payload === undefined;
              case PacketType.CONNECT_ERROR:
                  return typeof payload === "string" || isObject(payload);
              case PacketType.EVENT:
              case PacketType.BINARY_EVENT:
                  return (Array.isArray(payload) &&
                      (typeof payload[0] === "number" ||
                          (typeof payload[0] === "string" &&
                              RESERVED_EVENTS$1.indexOf(payload[0]) === -1)));
              case PacketType.ACK:
              case PacketType.BINARY_ACK:
                  return Array.isArray(payload);
          }
      }
      /**
       * Deallocates a parser's resources
       */
      destroy() {
          if (this.reconstructor) {
              this.reconstructor.finishedReconstruction();
              this.reconstructor = null;
          }
      }
  }
  /**
   * A manager of a binary event's 'buffer sequence'. Should
   * be constructed whenever a packet of type BINARY_EVENT is
   * decoded.
   *
   * @param {Object} packet
   * @return {BinaryReconstructor} initialized reconstructor
   */
  class BinaryReconstructor {
      constructor(packet) {
          this.packet = packet;
          this.buffers = [];
          this.reconPack = packet;
      }
      /**
       * Method to be called when binary data received from connection
       * after a BINARY_EVENT packet.
       *
       * @param {Buffer | ArrayBuffer} binData - the raw binary data received
       * @return {null | Object} returns null if more binary data is expected or
       *   a reconstructed packet object if all buffers have been received.
       */
      takeBinaryData(binData) {
          this.buffers.push(binData);
          if (this.buffers.length === this.reconPack.attachments) {
              // done with buffer list
              const packet = reconstructPacket(this.reconPack, this.buffers);
              this.finishedReconstruction();
              return packet;
          }
          return null;
      }
      /**
       * Cleans up binary packet reconstruction variables.
       */
      finishedReconstruction() {
          this.reconPack = null;
          this.buffers = [];
      }
  }

  var parser = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Decoder: Decoder,
    Encoder: Encoder,
    get PacketType () { return PacketType; },
    protocol: protocol
  });

  function on(obj, ev, fn) {
      obj.on(ev, fn);
      return function subDestroy() {
          obj.off(ev, fn);
      };
  }

  /**
   * Internal events.
   * These events can't be emitted by the user.
   */
  const RESERVED_EVENTS = Object.freeze({
      connect: 1,
      connect_error: 1,
      disconnect: 1,
      disconnecting: 1,
      // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
      newListener: 1,
      removeListener: 1,
  });
  /**
   * A Socket is the fundamental class for interacting with the server.
   *
   * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log("connected");
   * });
   *
   * // send an event to the server
   * socket.emit("foo", "bar");
   *
   * socket.on("foobar", () => {
   *   // an event was received from the server
   * });
   *
   * // upon disconnection
   * socket.on("disconnect", (reason) => {
   *   console.log(`disconnected due to ${reason}`);
   * });
   */
  class Socket extends Emitter {
      /**
       * `Socket` constructor.
       */
      constructor(io, nsp, opts) {
          super();
          /**
           * Whether the socket is currently connected to the server.
           *
           * @example
           * const socket = io();
           *
           * socket.on("connect", () => {
           *   console.log(socket.connected); // true
           * });
           *
           * socket.on("disconnect", () => {
           *   console.log(socket.connected); // false
           * });
           */
          this.connected = false;
          /**
           * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
           * be transmitted by the server.
           */
          this.recovered = false;
          /**
           * Buffer for packets received before the CONNECT packet
           */
          this.receiveBuffer = [];
          /**
           * Buffer for packets that will be sent once the socket is connected
           */
          this.sendBuffer = [];
          /**
           * The queue of packets to be sent with retry in case of failure.
           *
           * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
           * @private
           */
          this._queue = [];
          /**
           * A sequence to generate the ID of the {@link QueuedPacket}.
           * @private
           */
          this._queueSeq = 0;
          this.ids = 0;
          this.acks = {};
          this.flags = {};
          this.io = io;
          this.nsp = nsp;
          if (opts && opts.auth) {
              this.auth = opts.auth;
          }
          this._opts = Object.assign({}, opts);
          if (this.io._autoConnect)
              this.open();
      }
      /**
       * Whether the socket is currently disconnected
       *
       * @example
       * const socket = io();
       *
       * socket.on("connect", () => {
       *   console.log(socket.disconnected); // false
       * });
       *
       * socket.on("disconnect", () => {
       *   console.log(socket.disconnected); // true
       * });
       */
      get disconnected() {
          return !this.connected;
      }
      /**
       * Subscribe to open, close and packet events
       *
       * @private
       */
      subEvents() {
          if (this.subs)
              return;
          const io = this.io;
          this.subs = [
              on(io, "open", this.onopen.bind(this)),
              on(io, "packet", this.onpacket.bind(this)),
              on(io, "error", this.onerror.bind(this)),
              on(io, "close", this.onclose.bind(this)),
          ];
      }
      /**
       * Whether the Socket will try to reconnect when its Manager connects or reconnects.
       *
       * @example
       * const socket = io();
       *
       * console.log(socket.active); // true
       *
       * socket.on("disconnect", (reason) => {
       *   if (reason === "io server disconnect") {
       *     // the disconnection was initiated by the server, you need to manually reconnect
       *     console.log(socket.active); // false
       *   }
       *   // else the socket will automatically try to reconnect
       *   console.log(socket.active); // true
       * });
       */
      get active() {
          return !!this.subs;
      }
      /**
       * "Opens" the socket.
       *
       * @example
       * const socket = io({
       *   autoConnect: false
       * });
       *
       * socket.connect();
       */
      connect() {
          if (this.connected)
              return this;
          this.subEvents();
          if (!this.io["_reconnecting"])
              this.io.open(); // ensure open
          if ("open" === this.io._readyState)
              this.onopen();
          return this;
      }
      /**
       * Alias for {@link connect()}.
       */
      open() {
          return this.connect();
      }
      /**
       * Sends a `message` event.
       *
       * This method mimics the WebSocket.send() method.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
       *
       * @example
       * socket.send("hello");
       *
       * // this is equivalent to
       * socket.emit("message", "hello");
       *
       * @return self
       */
      send(...args) {
          args.unshift("message");
          this.emit.apply(this, args);
          return this;
      }
      /**
       * Override `emit`.
       * If the event is in `events`, it's emitted normally.
       *
       * @example
       * socket.emit("hello", "world");
       *
       * // all serializable datastructures are supported (no need to call JSON.stringify)
       * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
       *
       * // with an acknowledgement from the server
       * socket.emit("hello", "world", (val) => {
       *   // ...
       * });
       *
       * @return self
       */
      emit(ev, ...args) {
          if (RESERVED_EVENTS.hasOwnProperty(ev)) {
              throw new Error('"' + ev.toString() + '" is a reserved event name');
          }
          args.unshift(ev);
          if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
              this._addToQueue(args);
              return this;
          }
          const packet = {
              type: PacketType.EVENT,
              data: args,
          };
          packet.options = {};
          packet.options.compress = this.flags.compress !== false;
          // event ack callback
          if ("function" === typeof args[args.length - 1]) {
              const id = this.ids++;
              const ack = args.pop();
              this._registerAckCallback(id, ack);
              packet.id = id;
          }
          const isTransportWritable = this.io.engine &&
              this.io.engine.transport &&
              this.io.engine.transport.writable;
          const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
          if (discardPacket) ;
          else if (this.connected) {
              this.notifyOutgoingListeners(packet);
              this.packet(packet);
          }
          else {
              this.sendBuffer.push(packet);
          }
          this.flags = {};
          return this;
      }
      /**
       * @private
       */
      _registerAckCallback(id, ack) {
          var _a;
          const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
          if (timeout === undefined) {
              this.acks[id] = ack;
              return;
          }
          // @ts-ignore
          const timer = this.io.setTimeoutFn(() => {
              delete this.acks[id];
              for (let i = 0; i < this.sendBuffer.length; i++) {
                  if (this.sendBuffer[i].id === id) {
                      this.sendBuffer.splice(i, 1);
                  }
              }
              ack.call(this, new Error("operation has timed out"));
          }, timeout);
          this.acks[id] = (...args) => {
              // @ts-ignore
              this.io.clearTimeoutFn(timer);
              ack.apply(this, [null, ...args]);
          };
      }
      /**
       * Emits an event and waits for an acknowledgement
       *
       * @example
       * // without timeout
       * const response = await socket.emitWithAck("hello", "world");
       *
       * // with a specific timeout
       * try {
       *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
       * } catch (err) {
       *   // the server did not acknowledge the event in the given delay
       * }
       *
       * @return a Promise that will be fulfilled when the server acknowledges the event
       */
      emitWithAck(ev, ...args) {
          // the timeout flag is optional
          const withErr = this.flags.timeout !== undefined || this._opts.ackTimeout !== undefined;
          return new Promise((resolve, reject) => {
              args.push((arg1, arg2) => {
                  if (withErr) {
                      return arg1 ? reject(arg1) : resolve(arg2);
                  }
                  else {
                      return resolve(arg1);
                  }
              });
              this.emit(ev, ...args);
          });
      }
      /**
       * Add the packet to the queue.
       * @param args
       * @private
       */
      _addToQueue(args) {
          let ack;
          if (typeof args[args.length - 1] === "function") {
              ack = args.pop();
          }
          const packet = {
              id: this._queueSeq++,
              tryCount: 0,
              pending: false,
              args,
              flags: Object.assign({ fromQueue: true }, this.flags),
          };
          args.push((err, ...responseArgs) => {
              if (packet !== this._queue[0]) {
                  // the packet has already been acknowledged
                  return;
              }
              const hasError = err !== null;
              if (hasError) {
                  if (packet.tryCount > this._opts.retries) {
                      this._queue.shift();
                      if (ack) {
                          ack(err);
                      }
                  }
              }
              else {
                  this._queue.shift();
                  if (ack) {
                      ack(null, ...responseArgs);
                  }
              }
              packet.pending = false;
              return this._drainQueue();
          });
          this._queue.push(packet);
          this._drainQueue();
      }
      /**
       * Send the first packet of the queue, and wait for an acknowledgement from the server.
       * @param force - whether to resend a packet that has not been acknowledged yet
       *
       * @private
       */
      _drainQueue(force = false) {
          if (!this.connected || this._queue.length === 0) {
              return;
          }
          const packet = this._queue[0];
          if (packet.pending && !force) {
              return;
          }
          packet.pending = true;
          packet.tryCount++;
          this.flags = packet.flags;
          this.emit.apply(this, packet.args);
      }
      /**
       * Sends a packet.
       *
       * @param packet
       * @private
       */
      packet(packet) {
          packet.nsp = this.nsp;
          this.io._packet(packet);
      }
      /**
       * Called upon engine `open`.
       *
       * @private
       */
      onopen() {
          if (typeof this.auth == "function") {
              this.auth((data) => {
                  this._sendConnectPacket(data);
              });
          }
          else {
              this._sendConnectPacket(this.auth);
          }
      }
      /**
       * Sends a CONNECT packet to initiate the Socket.IO session.
       *
       * @param data
       * @private
       */
      _sendConnectPacket(data) {
          this.packet({
              type: PacketType.CONNECT,
              data: this._pid
                  ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data)
                  : data,
          });
      }
      /**
       * Called upon engine or manager `error`.
       *
       * @param err
       * @private
       */
      onerror(err) {
          if (!this.connected) {
              this.emitReserved("connect_error", err);
          }
      }
      /**
       * Called upon engine `close`.
       *
       * @param reason
       * @param description
       * @private
       */
      onclose(reason, description) {
          this.connected = false;
          delete this.id;
          this.emitReserved("disconnect", reason, description);
      }
      /**
       * Called with socket packet.
       *
       * @param packet
       * @private
       */
      onpacket(packet) {
          const sameNamespace = packet.nsp === this.nsp;
          if (!sameNamespace)
              return;
          switch (packet.type) {
              case PacketType.CONNECT:
                  if (packet.data && packet.data.sid) {
                      this.onconnect(packet.data.sid, packet.data.pid);
                  }
                  else {
                      this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                  }
                  break;
              case PacketType.EVENT:
              case PacketType.BINARY_EVENT:
                  this.onevent(packet);
                  break;
              case PacketType.ACK:
              case PacketType.BINARY_ACK:
                  this.onack(packet);
                  break;
              case PacketType.DISCONNECT:
                  this.ondisconnect();
                  break;
              case PacketType.CONNECT_ERROR:
                  this.destroy();
                  const err = new Error(packet.data.message);
                  // @ts-ignore
                  err.data = packet.data.data;
                  this.emitReserved("connect_error", err);
                  break;
          }
      }
      /**
       * Called upon a server event.
       *
       * @param packet
       * @private
       */
      onevent(packet) {
          const args = packet.data || [];
          if (null != packet.id) {
              args.push(this.ack(packet.id));
          }
          if (this.connected) {
              this.emitEvent(args);
          }
          else {
              this.receiveBuffer.push(Object.freeze(args));
          }
      }
      emitEvent(args) {
          if (this._anyListeners && this._anyListeners.length) {
              const listeners = this._anyListeners.slice();
              for (const listener of listeners) {
                  listener.apply(this, args);
              }
          }
          super.emit.apply(this, args);
          if (this._pid && args.length && typeof args[args.length - 1] === "string") {
              this._lastOffset = args[args.length - 1];
          }
      }
      /**
       * Produces an ack callback to emit with an event.
       *
       * @private
       */
      ack(id) {
          const self = this;
          let sent = false;
          return function (...args) {
              // prevent double callbacks
              if (sent)
                  return;
              sent = true;
              self.packet({
                  type: PacketType.ACK,
                  id: id,
                  data: args,
              });
          };
      }
      /**
       * Called upon a server acknowlegement.
       *
       * @param packet
       * @private
       */
      onack(packet) {
          const ack = this.acks[packet.id];
          if ("function" === typeof ack) {
              ack.apply(this, packet.data);
              delete this.acks[packet.id];
          }
      }
      /**
       * Called upon server connect.
       *
       * @private
       */
      onconnect(id, pid) {
          this.id = id;
          this.recovered = pid && this._pid === pid;
          this._pid = pid; // defined only if connection state recovery is enabled
          this.connected = true;
          this.emitBuffered();
          this.emitReserved("connect");
          this._drainQueue(true);
      }
      /**
       * Emit buffered events (received and emitted).
       *
       * @private
       */
      emitBuffered() {
          this.receiveBuffer.forEach((args) => this.emitEvent(args));
          this.receiveBuffer = [];
          this.sendBuffer.forEach((packet) => {
              this.notifyOutgoingListeners(packet);
              this.packet(packet);
          });
          this.sendBuffer = [];
      }
      /**
       * Called upon server disconnect.
       *
       * @private
       */
      ondisconnect() {
          this.destroy();
          this.onclose("io server disconnect");
      }
      /**
       * Called upon forced client/server side disconnections,
       * this method ensures the manager stops tracking us and
       * that reconnections don't get triggered for this.
       *
       * @private
       */
      destroy() {
          if (this.subs) {
              // clean subscriptions to avoid reconnections
              this.subs.forEach((subDestroy) => subDestroy());
              this.subs = undefined;
          }
          this.io["_destroy"](this);
      }
      /**
       * Disconnects the socket manually. In that case, the socket will not try to reconnect.
       *
       * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
       *
       * @example
       * const socket = io();
       *
       * socket.on("disconnect", (reason) => {
       *   // console.log(reason); prints "io client disconnect"
       * });
       *
       * socket.disconnect();
       *
       * @return self
       */
      disconnect() {
          if (this.connected) {
              this.packet({ type: PacketType.DISCONNECT });
          }
          // remove socket from pool
          this.destroy();
          if (this.connected) {
              // fire events
              this.onclose("io client disconnect");
          }
          return this;
      }
      /**
       * Alias for {@link disconnect()}.
       *
       * @return self
       */
      close() {
          return this.disconnect();
      }
      /**
       * Sets the compress flag.
       *
       * @example
       * socket.compress(false).emit("hello");
       *
       * @param compress - if `true`, compresses the sending data
       * @return self
       */
      compress(compress) {
          this.flags.compress = compress;
          return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
       * ready to send messages.
       *
       * @example
       * socket.volatile.emit("hello"); // the server may or may not receive it
       *
       * @returns self
       */
      get volatile() {
          this.flags.volatile = true;
          return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
       * given number of milliseconds have elapsed without an acknowledgement from the server:
       *
       * @example
       * socket.timeout(5000).emit("my-event", (err) => {
       *   if (err) {
       *     // the server did not acknowledge the event in the given delay
       *   }
       * });
       *
       * @returns self
       */
      timeout(timeout) {
          this.flags.timeout = timeout;
          return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * @example
       * socket.onAny((event, ...args) => {
       *   console.log(`got ${event}`);
       * });
       *
       * @param listener
       */
      onAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.push(listener);
          return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * @example
       * socket.prependAny((event, ...args) => {
       *   console.log(`got event ${event}`);
       * });
       *
       * @param listener
       */
      prependAny(listener) {
          this._anyListeners = this._anyListeners || [];
          this._anyListeners.unshift(listener);
          return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`got event ${event}`);
       * }
       *
       * socket.onAny(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAny(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAny();
       *
       * @param listener
       */
      offAny(listener) {
          if (!this._anyListeners) {
              return this;
          }
          if (listener) {
              const listeners = this._anyListeners;
              for (let i = 0; i < listeners.length; i++) {
                  if (listener === listeners[i]) {
                      listeners.splice(i, 1);
                      return this;
                  }
              }
          }
          else {
              this._anyListeners = [];
          }
          return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */
      listenersAny() {
          return this._anyListeners || [];
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.onAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */
      onAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.push(listener);
          return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.prependAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */
      prependAnyOutgoing(listener) {
          this._anyOutgoingListeners = this._anyOutgoingListeners || [];
          this._anyOutgoingListeners.unshift(listener);
          return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`sent event ${event}`);
       * }
       *
       * socket.onAnyOutgoing(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAnyOutgoing(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAnyOutgoing();
       *
       * @param [listener] - the catch-all listener (optional)
       */
      offAnyOutgoing(listener) {
          if (!this._anyOutgoingListeners) {
              return this;
          }
          if (listener) {
              const listeners = this._anyOutgoingListeners;
              for (let i = 0; i < listeners.length; i++) {
                  if (listener === listeners[i]) {
                      listeners.splice(i, 1);
                      return this;
                  }
              }
          }
          else {
              this._anyOutgoingListeners = [];
          }
          return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */
      listenersAnyOutgoing() {
          return this._anyOutgoingListeners || [];
      }
      /**
       * Notify the listeners for each packet sent
       *
       * @param packet
       *
       * @private
       */
      notifyOutgoingListeners(packet) {
          if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
              const listeners = this._anyOutgoingListeners.slice();
              for (const listener of listeners) {
                  listener.apply(this, packet.data);
              }
          }
      }
  }

  /**
   * Initialize backoff timer with `opts`.
   *
   * - `min` initial timeout in milliseconds [100]
   * - `max` max timeout [10000]
   * - `jitter` [0]
   * - `factor` [2]
   *
   * @param {Object} opts
   * @api public
   */
  function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
  }
  /**
   * Return the backoff duration.
   *
   * @return {Number}
   * @api public
   */
  Backoff.prototype.duration = function () {
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
          var rand = Math.random();
          var deviation = Math.floor(rand * this.jitter * ms);
          ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
  };
  /**
   * Reset the number of attempts.
   *
   * @api public
   */
  Backoff.prototype.reset = function () {
      this.attempts = 0;
  };
  /**
   * Set the minimum duration
   *
   * @api public
   */
  Backoff.prototype.setMin = function (min) {
      this.ms = min;
  };
  /**
   * Set the maximum duration
   *
   * @api public
   */
  Backoff.prototype.setMax = function (max) {
      this.max = max;
  };
  /**
   * Set the jitter
   *
   * @api public
   */
  Backoff.prototype.setJitter = function (jitter) {
      this.jitter = jitter;
  };

  class Manager extends Emitter {
      constructor(uri, opts) {
          var _a;
          super();
          this.nsps = {};
          this.subs = [];
          if (uri && "object" === typeof uri) {
              opts = uri;
              uri = undefined;
          }
          opts = opts || {};
          opts.path = opts.path || "/socket.io";
          this.opts = opts;
          installTimerFunctions(this, opts);
          this.reconnection(opts.reconnection !== false);
          this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
          this.reconnectionDelay(opts.reconnectionDelay || 1000);
          this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
          this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
          this.backoff = new Backoff({
              min: this.reconnectionDelay(),
              max: this.reconnectionDelayMax(),
              jitter: this.randomizationFactor(),
          });
          this.timeout(null == opts.timeout ? 20000 : opts.timeout);
          this._readyState = "closed";
          this.uri = uri;
          const _parser = opts.parser || parser;
          this.encoder = new _parser.Encoder();
          this.decoder = new _parser.Decoder();
          this._autoConnect = opts.autoConnect !== false;
          if (this._autoConnect)
              this.open();
      }
      reconnection(v) {
          if (!arguments.length)
              return this._reconnection;
          this._reconnection = !!v;
          return this;
      }
      reconnectionAttempts(v) {
          if (v === undefined)
              return this._reconnectionAttempts;
          this._reconnectionAttempts = v;
          return this;
      }
      reconnectionDelay(v) {
          var _a;
          if (v === undefined)
              return this._reconnectionDelay;
          this._reconnectionDelay = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
          return this;
      }
      randomizationFactor(v) {
          var _a;
          if (v === undefined)
              return this._randomizationFactor;
          this._randomizationFactor = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
          return this;
      }
      reconnectionDelayMax(v) {
          var _a;
          if (v === undefined)
              return this._reconnectionDelayMax;
          this._reconnectionDelayMax = v;
          (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
          return this;
      }
      timeout(v) {
          if (!arguments.length)
              return this._timeout;
          this._timeout = v;
          return this;
      }
      /**
       * Starts trying to reconnect if reconnection is enabled and we have not
       * started reconnecting yet
       *
       * @private
       */
      maybeReconnectOnOpen() {
          // Only try to reconnect if it's the first time we're connecting
          if (!this._reconnecting &&
              this._reconnection &&
              this.backoff.attempts === 0) {
              // keeps reconnection from firing twice for the same reconnection loop
              this.reconnect();
          }
      }
      /**
       * Sets the current transport `socket`.
       *
       * @param {Function} fn - optional, callback
       * @return self
       * @public
       */
      open(fn) {
          if (~this._readyState.indexOf("open"))
              return this;
          this.engine = new Socket$1(this.uri, this.opts);
          const socket = this.engine;
          const self = this;
          this._readyState = "opening";
          this.skipReconnect = false;
          // emit `open`
          const openSubDestroy = on(socket, "open", function () {
              self.onopen();
              fn && fn();
          });
          // emit `error`
          const errorSub = on(socket, "error", (err) => {
              self.cleanup();
              self._readyState = "closed";
              this.emitReserved("error", err);
              if (fn) {
                  fn(err);
              }
              else {
                  // Only do this if there is no fn to handle the error
                  self.maybeReconnectOnOpen();
              }
          });
          if (false !== this._timeout) {
              const timeout = this._timeout;
              if (timeout === 0) {
                  openSubDestroy(); // prevents a race condition with the 'open' event
              }
              // set timer
              const timer = this.setTimeoutFn(() => {
                  openSubDestroy();
                  socket.close();
                  // @ts-ignore
                  socket.emit("error", new Error("timeout"));
              }, timeout);
              if (this.opts.autoUnref) {
                  timer.unref();
              }
              this.subs.push(function subDestroy() {
                  clearTimeout(timer);
              });
          }
          this.subs.push(openSubDestroy);
          this.subs.push(errorSub);
          return this;
      }
      /**
       * Alias for open()
       *
       * @return self
       * @public
       */
      connect(fn) {
          return this.open(fn);
      }
      /**
       * Called upon transport open.
       *
       * @private
       */
      onopen() {
          // clear old subs
          this.cleanup();
          // mark as open
          this._readyState = "open";
          this.emitReserved("open");
          // add new subs
          const socket = this.engine;
          this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), on(this.decoder, "decoded", this.ondecoded.bind(this)));
      }
      /**
       * Called upon a ping.
       *
       * @private
       */
      onping() {
          this.emitReserved("ping");
      }
      /**
       * Called with data.
       *
       * @private
       */
      ondata(data) {
          try {
              this.decoder.add(data);
          }
          catch (e) {
              this.onclose("parse error", e);
          }
      }
      /**
       * Called when parser fully decodes a packet.
       *
       * @private
       */
      ondecoded(packet) {
          // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
          nextTick(() => {
              this.emitReserved("packet", packet);
          }, this.setTimeoutFn);
      }
      /**
       * Called upon socket error.
       *
       * @private
       */
      onerror(err) {
          this.emitReserved("error", err);
      }
      /**
       * Creates a new socket for the given `nsp`.
       *
       * @return {Socket}
       * @public
       */
      socket(nsp, opts) {
          let socket = this.nsps[nsp];
          if (!socket) {
              socket = new Socket(this, nsp, opts);
              this.nsps[nsp] = socket;
          }
          else if (this._autoConnect && !socket.active) {
              socket.connect();
          }
          return socket;
      }
      /**
       * Called upon a socket close.
       *
       * @param socket
       * @private
       */
      _destroy(socket) {
          const nsps = Object.keys(this.nsps);
          for (const nsp of nsps) {
              const socket = this.nsps[nsp];
              if (socket.active) {
                  return;
              }
          }
          this._close();
      }
      /**
       * Writes a packet.
       *
       * @param packet
       * @private
       */
      _packet(packet) {
          const encodedPackets = this.encoder.encode(packet);
          for (let i = 0; i < encodedPackets.length; i++) {
              this.engine.write(encodedPackets[i], packet.options);
          }
      }
      /**
       * Clean up transport subscriptions and packet buffer.
       *
       * @private
       */
      cleanup() {
          this.subs.forEach((subDestroy) => subDestroy());
          this.subs.length = 0;
          this.decoder.destroy();
      }
      /**
       * Close the current socket.
       *
       * @private
       */
      _close() {
          this.skipReconnect = true;
          this._reconnecting = false;
          this.onclose("forced close");
          if (this.engine)
              this.engine.close();
      }
      /**
       * Alias for close()
       *
       * @private
       */
      disconnect() {
          return this._close();
      }
      /**
       * Called upon engine close.
       *
       * @private
       */
      onclose(reason, description) {
          this.cleanup();
          this.backoff.reset();
          this._readyState = "closed";
          this.emitReserved("close", reason, description);
          if (this._reconnection && !this.skipReconnect) {
              this.reconnect();
          }
      }
      /**
       * Attempt a reconnection.
       *
       * @private
       */
      reconnect() {
          if (this._reconnecting || this.skipReconnect)
              return this;
          const self = this;
          if (this.backoff.attempts >= this._reconnectionAttempts) {
              this.backoff.reset();
              this.emitReserved("reconnect_failed");
              this._reconnecting = false;
          }
          else {
              const delay = this.backoff.duration();
              this._reconnecting = true;
              const timer = this.setTimeoutFn(() => {
                  if (self.skipReconnect)
                      return;
                  this.emitReserved("reconnect_attempt", self.backoff.attempts);
                  // check again for the case socket closed in above events
                  if (self.skipReconnect)
                      return;
                  self.open((err) => {
                      if (err) {
                          self._reconnecting = false;
                          self.reconnect();
                          this.emitReserved("reconnect_error", err);
                      }
                      else {
                          self.onreconnect();
                      }
                  });
              }, delay);
              if (this.opts.autoUnref) {
                  timer.unref();
              }
              this.subs.push(function subDestroy() {
                  clearTimeout(timer);
              });
          }
      }
      /**
       * Called upon successful reconnect.
       *
       * @private
       */
      onreconnect() {
          const attempt = this.backoff.attempts;
          this._reconnecting = false;
          this.backoff.reset();
          this.emitReserved("reconnect", attempt);
      }
  }

  /**
   * Managers cache.
   */
  const cache = {};
  function lookup(uri, opts) {
      if (typeof uri === "object") {
          opts = uri;
          uri = undefined;
      }
      opts = opts || {};
      const parsed = url(uri, opts.path || "/socket.io");
      const source = parsed.source;
      const id = parsed.id;
      const path = parsed.path;
      const sameNamespace = cache[id] && path in cache[id]["nsps"];
      const newConnection = opts.forceNew ||
          opts["force new connection"] ||
          false === opts.multiplex ||
          sameNamespace;
      let io;
      if (newConnection) {
          io = new Manager(source, opts);
      }
      else {
          if (!cache[id]) {
              cache[id] = new Manager(source, opts);
          }
          io = cache[id];
      }
      if (parsed.query && !opts.query) {
          opts.query = parsed.queryKey;
      }
      return io.socket(parsed.path, opts);
  }
  // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
  // namespace (e.g. `io.connect(...)`), for backward compatibility
  Object.assign(lookup, {
      Manager,
      Socket,
      io: lookup,
      connect: lookup,
  });

  /* eslint-disable no-unused-vars */


  let name, gameId;

  /* socket */
  const socket = lookup();
  async function socketInit() {
    socket.on("connection", () => {
      console.log(socket.id);
    });
    socket.on("error", (...err) => error(...err));
    socket.on("gameConnect", (pos) => {
      console.log(socket.id);
      createTank();
      createBullet();
      //new createTank(pos);
    });
    socket.on("sessionUpdate", (...args) => drawAll(...args));

    socket.emit("userConnect", name, gameId);
  }

  function initUser() {
    gameId = api.get("gameInfo");
    name = api.get("name");
    if (name == undefined) error("Game ID undefined", "../index.html", "logout");
    if (gameId == undefined) error("Game ID undefined", "../index.html", "home");
  }
  const keys = {};
  const keyDown = (e) => {
    if (e.code == "Space" && !keys[e.code]) socket.emit("sessionShot", gameId);

    if (e.code == "KeyW" && !keys[e.code])
      socket.emit("sessionBeginMoveFront", gameId);

    if (e.code == "KeyS" && !keys[e.code])
      socket.emit("sessionBeginMoveBack", gameId);

    if (e.code == "KeyD" && !keys[e.code])
      socket.emit("sessionBeginRotateLeft", gameId);

    if (e.code == "KeyA" && !keys[e.code])
      socket.emit("sessionBeginRotateRight", gameId);

    keys[e.code] = true;
  };

  const keyUp = (e) => {
    if (e.code == "KeyW" && keys[e.code])
      socket.emit("sessionStopMoveFront", gameId);

    if (e.code == "KeyS" && keys[e.code])
      socket.emit("sessionStopMoveBack", gameId);

    if (e.code == "KeyD" && keys[e.code])
      socket.emit("sessionStopRotateLeft", gameId);

    if (e.code == "KeyA" && keys[e.code])
      socket.emit("sessionStopRotateRight", gameId);

    keys[e.code] = false;
  };

  window.addEventListener("load", async () => {
    console.log(`aaaaa ${name}`);
    initUser();
    console.log(`aaaaa ${name} ${gameId}`);
    initGl();
    await socketInit();
    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("keyup", keyUp, false);
  });

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2pzLWNvb2tpZS9kaXN0L2pzLmNvb2tpZS5tanMiLCIuLi8uLi9zcmMvdG9vbHMvdG9vbHMuanMiLCIuLi8uLi9zcmMvZ2FtZS9hbmltLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2NvbW1vbnMuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vZW5jb2RlUGFja2V0LmJyb3dzZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vY29udHJpYi9iYXNlNjQtYXJyYXlidWZmZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vZGVjb2RlUGFja2V0LmJyb3dzZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLXBhcnNlci9idWlsZC9lc20vaW5kZXguanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlci9pbmRleC5tanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vZ2xvYmFsVGhpcy5icm93c2VyLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3V0aWwuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0LmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIveWVhc3QuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9wYXJzZXFzLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIvaGFzLWNvcnMuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vdHJhbnNwb3J0cy94bWxodHRwcmVxdWVzdC5icm93c2VyLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvcG9sbGluZy5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5icm93c2VyLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2Vic29ja2V0LmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvaW5kZXguanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9wYXJzZXVyaS5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9zb2NrZXQuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vdXJsLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2lzLWJpbmFyeS5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9iaW5hcnkuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vaW5kZXguanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vb24uanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vc29ja2V0LmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIvYmFja28yLmpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL21hbmFnZXIuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vaW5kZXguanMiLCIuLi8uLi9zcmMvZ2FtZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEganMtY29va2llIHYzLjAuNSB8IE1JVCAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tdmFyICovXG5mdW5jdGlvbiBhc3NpZ24gKHRhcmdldCkge1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgZm9yICh2YXIga2V5IGluIHNvdXJjZSkge1xuICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldFxufVxuLyogZXNsaW50LWVuYWJsZSBuby12YXIgKi9cblxuLyogZXNsaW50LWRpc2FibGUgbm8tdmFyICovXG52YXIgZGVmYXVsdENvbnZlcnRlciA9IHtcbiAgcmVhZDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlWzBdID09PSAnXCInKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlLnNsaWNlKDEsIC0xKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoLyglW1xcZEEtRl17Mn0pKy9naSwgZGVjb2RlVVJJQ29tcG9uZW50KVxuICB9LFxuICB3cml0ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkucmVwbGFjZShcbiAgICAgIC8lKDJbMzQ2QkZdfDNbQUMtRl18NDB8NVtCREVdfDYwfDdbQkNEXSkvZyxcbiAgICAgIGRlY29kZVVSSUNvbXBvbmVudFxuICAgIClcbiAgfVxufTtcbi8qIGVzbGludC1lbmFibGUgbm8tdmFyICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLXZhciAqL1xuXG5mdW5jdGlvbiBpbml0IChjb252ZXJ0ZXIsIGRlZmF1bHRBdHRyaWJ1dGVzKSB7XG4gIGZ1bmN0aW9uIHNldCAobmFtZSwgdmFsdWUsIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgYXR0cmlidXRlcyA9IGFzc2lnbih7fSwgZGVmYXVsdEF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpO1xuXG4gICAgaWYgKHR5cGVvZiBhdHRyaWJ1dGVzLmV4cGlyZXMgPT09ICdudW1iZXInKSB7XG4gICAgICBhdHRyaWJ1dGVzLmV4cGlyZXMgPSBuZXcgRGF0ZShEYXRlLm5vdygpICsgYXR0cmlidXRlcy5leHBpcmVzICogODY0ZTUpO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlcy5leHBpcmVzKSB7XG4gICAgICBhdHRyaWJ1dGVzLmV4cGlyZXMgPSBhdHRyaWJ1dGVzLmV4cGlyZXMudG9VVENTdHJpbmcoKTtcbiAgICB9XG5cbiAgICBuYW1lID0gZW5jb2RlVVJJQ29tcG9uZW50KG5hbWUpXG4gICAgICAucmVwbGFjZSgvJSgyWzM0NkJdfDVFfDYwfDdDKS9nLCBkZWNvZGVVUklDb21wb25lbnQpXG4gICAgICAucmVwbGFjZSgvWygpXS9nLCBlc2NhcGUpO1xuXG4gICAgdmFyIHN0cmluZ2lmaWVkQXR0cmlidXRlcyA9ICcnO1xuICAgIGZvciAodmFyIGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgaWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHN0cmluZ2lmaWVkQXR0cmlidXRlcyArPSAnOyAnICsgYXR0cmlidXRlTmFtZTtcblxuICAgICAgaWYgKGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPT09IHRydWUpIHtcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gQ29uc2lkZXJzIFJGQyA2MjY1IHNlY3Rpb24gNS4yOlxuICAgICAgLy8gLi4uXG4gICAgICAvLyAzLiAgSWYgdGhlIHJlbWFpbmluZyB1bnBhcnNlZC1hdHRyaWJ1dGVzIGNvbnRhaW5zIGEgJXgzQiAoXCI7XCIpXG4gICAgICAvLyAgICAgY2hhcmFjdGVyOlxuICAgICAgLy8gQ29uc3VtZSB0aGUgY2hhcmFjdGVycyBvZiB0aGUgdW5wYXJzZWQtYXR0cmlidXRlcyB1cCB0byxcbiAgICAgIC8vIG5vdCBpbmNsdWRpbmcsIHRoZSBmaXJzdCAleDNCIChcIjtcIikgY2hhcmFjdGVyLlxuICAgICAgLy8gLi4uXG4gICAgICBzdHJpbmdpZmllZEF0dHJpYnV0ZXMgKz0gJz0nICsgYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXS5zcGxpdCgnOycpWzBdO1xuICAgIH1cblxuICAgIHJldHVybiAoZG9jdW1lbnQuY29va2llID1cbiAgICAgIG5hbWUgKyAnPScgKyBjb252ZXJ0ZXIud3JpdGUodmFsdWUsIG5hbWUpICsgc3RyaW5naWZpZWRBdHRyaWJ1dGVzKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0IChuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgfHwgKGFyZ3VtZW50cy5sZW5ndGggJiYgIW5hbWUpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBUbyBwcmV2ZW50IHRoZSBmb3IgbG9vcCBpbiB0aGUgZmlyc3QgcGxhY2UgYXNzaWduIGFuIGVtcHR5IGFycmF5XG4gICAgLy8gaW4gY2FzZSB0aGVyZSBhcmUgbm8gY29va2llcyBhdCBhbGwuXG4gICAgdmFyIGNvb2tpZXMgPSBkb2N1bWVudC5jb29raWUgPyBkb2N1bWVudC5jb29raWUuc3BsaXQoJzsgJykgOiBbXTtcbiAgICB2YXIgamFyID0ge307XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb29raWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcGFydHMgPSBjb29raWVzW2ldLnNwbGl0KCc9Jyk7XG4gICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5zbGljZSgxKS5qb2luKCc9Jyk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBmb3VuZCA9IGRlY29kZVVSSUNvbXBvbmVudChwYXJ0c1swXSk7XG4gICAgICAgIGphcltmb3VuZF0gPSBjb252ZXJ0ZXIucmVhZCh2YWx1ZSwgZm91bmQpO1xuXG4gICAgICAgIGlmIChuYW1lID09PSBmb3VuZCkge1xuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5hbWUgPyBqYXJbbmFtZV0gOiBqYXJcbiAgfVxuXG4gIHJldHVybiBPYmplY3QuY3JlYXRlKFxuICAgIHtcbiAgICAgIHNldCxcbiAgICAgIGdldCxcbiAgICAgIHJlbW92ZTogZnVuY3Rpb24gKG5hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgc2V0KFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgJycsXG4gICAgICAgICAgYXNzaWduKHt9LCBhdHRyaWJ1dGVzLCB7XG4gICAgICAgICAgICBleHBpcmVzOiAtMVxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgd2l0aEF0dHJpYnV0ZXM6IGZ1bmN0aW9uIChhdHRyaWJ1dGVzKSB7XG4gICAgICAgIHJldHVybiBpbml0KHRoaXMuY29udmVydGVyLCBhc3NpZ24oe30sIHRoaXMuYXR0cmlidXRlcywgYXR0cmlidXRlcykpXG4gICAgICB9LFxuICAgICAgd2l0aENvbnZlcnRlcjogZnVuY3Rpb24gKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gaW5pdChhc3NpZ24oe30sIHRoaXMuY29udmVydGVyLCBjb252ZXJ0ZXIpLCB0aGlzLmF0dHJpYnV0ZXMpXG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBhdHRyaWJ1dGVzOiB7IHZhbHVlOiBPYmplY3QuZnJlZXplKGRlZmF1bHRBdHRyaWJ1dGVzKSB9LFxuICAgICAgY29udmVydGVyOiB7IHZhbHVlOiBPYmplY3QuZnJlZXplKGNvbnZlcnRlcikgfVxuICAgIH1cbiAgKVxufVxuXG52YXIgYXBpID0gaW5pdChkZWZhdWx0Q29udmVydGVyLCB7IHBhdGg6ICcvJyB9KTtcbi8qIGVzbGludC1lbmFibGUgbm8tdmFyICovXG5cbmV4cG9ydCB7IGFwaSBhcyBkZWZhdWx0IH07XG4iLCJpbXBvcnQgQ29va2llcyBmcm9tIFwianMtY29va2llXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ29Ib21lKCkge1xyXG4gIENvb2tpZXMucmVtb3ZlKFwiZ2FtZUluZm9cIik7XHJcbiAgbG9jYXRpb24uYXNzaWduKFwiLi4vaG9tZVBhZ2UvaG9tZVBhZ2UuaHRtbFwiKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ091dChzdGF0dXMpIHtcclxuICAvLyBpZiAoc3RhdHVzKSBzb2NrZXQuZGlzY29ubmVjdCgpO1xyXG4gIENvb2tpZXMucmVtb3ZlKFwibmFtZVwiKTtcclxuICBsb2NhdGlvbi5hc3NpZ24oXCIuLi9pbmRleC5odG1sXCIpO1xyXG59XHJcbi8qIGVycm9yIGRlZmllbmVkICovXHJcbmNvbnN0IGVycm9yRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXJyb3JGb3JtXCIpO1xyXG5leHBvcnQgZnVuY3Rpb24gZXJyb3IoZXJyLCB1cmwgPSBudWxsLCBnbyA9IG51bGwpIHtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVycm9yTWVzc2FuZ2VcIikuaW5uZXJUZXh0ID0gZXJyO1xyXG4gIGVycm9yRm9ybS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xyXG4gIGNvbnNvbGUubG9nKGVycik7XHJcblxyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXJyb3JGb3JtQ2xvc2VcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgIGlmICh1cmwgPT0gbnVsbCkge1xyXG4gICAgICBpZiAoZ28gPT0gXCJob21lXCIpIGdvSG9tZSgpO1xyXG4gICAgICBlbHNlIGlmIChnbyA9PSBcImxvZ291dFwiKSBsb2dPdXQoKTtcclxuICAgIH0gZWxzZSBsb2NhdGlvbi5hc3NpZ24odXJsKTtcclxuICB9KTtcclxufVxyXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVycm9yRm9ybUNsb3NlXCIpLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgZXJyb3JGb3JtLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdHJpYW5nbGVBcmVhKHRyaWFuZ2xlKSB7XHJcbiAgY29uc3QgUzAgPVxyXG4gICAgICAoKHRyaWFuZ2xlWzBdLnkgKyB0cmlhbmdsZVsxXS55KSAvIDIpICogKHRyaWFuZ2xlWzBdLnggLSB0cmlhbmdsZVsxXS54KSxcclxuICAgIFMxID1cclxuICAgICAgKCh0cmlhbmdsZVsxXS55ICsgdHJpYW5nbGVbMl0ueSkgLyAyKSAqICh0cmlhbmdsZVsxXS54IC0gdHJpYW5nbGVbMl0ueCksXHJcbiAgICBTMiA9XHJcbiAgICAgICgodHJpYW5nbGVbMl0ueSArIHRyaWFuZ2xlWzBdLnkpIC8gMikgKiAodHJpYW5nbGVbMl0ueCAtIHRyaWFuZ2xlWzBdLngpO1xyXG5cclxuICByZXR1cm4gUzAgKyBTMSArIFMyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNQb2ludEluc2lkZVRyaWFuZ2xlKHRyaWFuZ2xlLCBwb2ludCkge1xyXG4gIGNvbnN0IFMwID0gdHJpYW5nbGVBcmVhKFt0cmlhbmdsZVswXSwgdHJpYW5nbGVbMV0sIHBvaW50XSksXHJcbiAgICBTMSA9IHRyaWFuZ2xlQXJlYShbdHJpYW5nbGVbMV0sIHRyaWFuZ2xlWzJdLCBwb2ludF0pLFxyXG4gICAgUzIgPSB0cmlhbmdsZUFyZWEoW3RyaWFuZ2xlWzJdLCB0cmlhbmdsZVswXSwgcG9pbnRdKTtcclxuICBpZiAoUzAgKyBTMSArIFMyID4gMCkgcmV0dXJuIHRydWU7XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBpc1BvaW50SW5zaWRlUmVjdGFuZ2xlKHJlY3RhbmdsZSwgcG9pbnQpIHtcclxuICBjb25zdCBTMCA9IHRyaWFuZ2xlQXJlYShbcmVjdGFuZ2xlWzBdLCByZWN0YW5nbGVbMV0sIHBvaW50XSksXHJcbiAgICBTMSA9IHRyaWFuZ2xlQXJlYShbcmVjdGFuZ2xlWzFdLCByZWN0YW5nbGVbMl0sIHBvaW50XSksXHJcbiAgICBTMiA9IHRyaWFuZ2xlQXJlYShbcmVjdGFuZ2xlWzJdLCByZWN0YW5nbGVbM10sIHBvaW50XSksXHJcbiAgICBTMyA9IHRyaWFuZ2xlQXJlYShbcmVjdGFuZ2xlWzNdLCByZWN0YW5nbGVbMF0sIHBvaW50XSk7XHJcbiAgaWYgKFMwICsgUzEgKyBTMiArIFMzID4gMCkgcmV0dXJuIHRydWU7XHJcbiAgLy8gY29uc3QgdHJpYW5nbGVTID0gdHJpYW5nbGVBcmVhKHRyaWFuZ2xlKSxcclxuICAvLyAgIFMwID0gdHJpYW5nbGVBcmVhKFt0cmlhbmdsZVswXSwgdHJpYW5nbGVbMV0sIHBvaW50XSksXHJcbiAgLy8gICBTMSA9IHRyaWFuZ2xlQXJlYShbdHJpYW5nbGVbMV0sIHRyaWFuZ2xlWzJdLCBwb2ludF0pLFxyXG4gIC8vICAgUzIgPSB0cmlhbmdsZUFyZWEoW3RyaWFuZ2xlWzJdLCB0cmlhbmdsZVswXSwgcG9pbnRdKTtcclxuICAvLyBpZiAodHJpYW5nbGVTIDwgUzAgKyBTMSArIFMyKSByZXR1cm4gdHJ1ZTtcclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuIiwiaW1wb3J0IHsgZXJyb3IgfSBmcm9tIFwiLi4vdG9vbHMvdG9vbHMuanNcIjtcclxuXHJcbi8vIHBvcyA9IHRhbmsucG9zO1xyXG4vLyB0aGlzLnR5cGUgPSBnbC5UUklBTkdMRV9TVFJJUDtcclxuLy8gaW5kZXggPSB0YW5rLmluZGV4O1xyXG4vLyB0aGlzLm51bU9mViA9IDQ7XHJcbmxldCBjYW52YXMsXHJcbiAgZ2wsXHJcbiAgc2hkID0ge30sXHJcbiAgbWFzc1RleCA9IHt9LFxyXG4gIG1hc3NQcmltID0ge30sXHJcbiAgY3JlYXRlZEVsZW1lbnRzID0ge307XHJcblxyXG5jb25zdCB3YWxsID0ge1xyXG4gIHBvczogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMSwgMSwgMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgMCwgLTEsIDEsIDEsIDBdKSxcclxufTtcclxuY29uc3QgZGVmID0ge1xyXG4gIHBvczogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMSwgMCwgMSwgLTEsIDEsIDEsIC0xLCAtMSwgMCwgMSwgLTEsIDEsIDAsIDBdKSxcclxuICBpbmRleDogbmV3IFVpbnQxNkFycmF5KFswLCAxLCAzLCAyXSksXHJcbiAgdHlwZTogXCJ0cmlhbmdsZVwiLFxyXG59O1xyXG5jb25zdCB0YW5rID0ge1xyXG4gIC8vcG9zOiBuZXcgRmxvYXQzMkFycmF5KFs0LCA0LCAxLCAxLCA0LCAtNCwgMCwgMSwgLTQsIC00LCAwLCAwLCAtNCwgNCwgMSwgMF0pLFxyXG4gIC8vIHBvczogbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgLy8gICAwLjUsIDAuNSwgMSwgMSwgMC41LCAtMC41LCAwLCAxLCAtMC41LCAtMC41LCAwLCAwLCAtMC41LCAwLjUsIDEsIDAsXHJcbiAgLy8gXSksXHJcbiAgcG9zOiBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAgIDIwLCAyMCwgMSwgMCwgMjAsIC0yMCwgMSwgMSwgLTIwLCAtMjAsIDAsIDEsIC0yMCwgMjAsIDAsIDAsXHJcbiAgXSksXHJcbiAgaW5kZXg6IG5ldyBVaW50MTZBcnJheShbMCwgMSwgMywgMl0pLFxyXG4gIHR5cGU6IFwidHJpYW5nbGVcIixcclxufTtcclxuY29uc3QgYnVsbGV0ID0ge1xyXG4gIC8vcG9zOiBuZXcgRmxvYXQzMkFycmF5KFs0LCA0LCAxLCAxLCA0LCAtNCwgMCwgMSwgLTQsIC00LCAwLCAwLCAtNCwgNCwgMSwgMF0pLFxyXG4gIC8vIHBvczogbmV3IEZsb2F0MzJBcnJheShbXHJcbiAgLy8gICAwLjUsIDAuNSwgMSwgMSwgMC41LCAtMC41LCAwLCAxLCAtMC41LCAtMC41LCAwLCAwLCAtMC41LCAwLjUsIDEsIDAsXHJcbiAgLy8gXSksXHJcbiAgcG9zOiBuZXcgRmxvYXQzMkFycmF5KFsyLCA2LCAxLCAwLCAyLCAtNiwgMSwgMSwgLTIsIC02LCAwLCAxLCAtMiwgNiwgMCwgMF0pLFxyXG4gIGluZGV4OiBuZXcgVWludDE2QXJyYXkoWzAsIDEsIDMsIDJdKSxcclxuICB0eXBlOiBcInRyaWFuZ2xlXCIsXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdEdsKCkge1xyXG4gIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2FudmFcIik7XHJcblxyXG4gIGlmIChjYW52YXMgPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgYWFhYWEgQ2FudmFzYCk7XHJcbiAgICBlcnJvcihcImNhbnZhcyBpcyBub3QgZGVmaW5lZFwiLCBcIi4uL2hvbWVQYWdlL2hvbWVQYWdlLmh0bWxcIik7XHJcbiAgfVxyXG4gIGdsID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbDJcIik7XHJcbiAgaWYgKGdsID09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc29sZS5sb2coYGFhYWFhIEdMYCk7XHJcbiAgICBlcnJvcihcImdsIGlzIG5vdCBkZWZpbmVkXCIsIFwiLi4vaG9tZVBhZ2UvaG9tZVBhZ2UuaHRtbFwiKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNoZFRleHQgPSBbXHJcbiAgICBgI3ZlcnNpb24gMzAwIGVzXHJcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcclxuaW4gdmVjMiBpbl9wb3M7XHJcbmluIHZlYzIgaW5fdGV4O1xyXG5cclxub3V0IHZlYzIgdGV4Q29vcmQ7XHJcblxyXG51bmlmb3JtIHZlYzIgc2NyZWVuU2l6ZTtcclxudW5pZm9ybSB2ZWMyIHBvcztcclxudW5pZm9ybSB2ZWMyIHNjYWxlO1xyXG51bmlmb3JtIGZsb2F0IGFuZ2xlO1xyXG5cclxudm9pZCBtYWluKCl7XHJcbiAgdmVjMiB0bXAgPSB2ZWMyKFxyXG4gICAgaW5fcG9zLnggKiBzY2FsZS54ICogY29zKGFuZ2xlKSArIGluX3Bvcy55ICogc2NhbGUueSAqIHNpbihhbmdsZSkgKyBwb3MueCxcclxuICAgIGluX3Bvcy55ICogc2NhbGUueSAqIGNvcyhhbmdsZSkgLSBpbl9wb3MueCAqIHNjYWxlLnggKiBzaW4oYW5nbGUpICsgcG9zLnkpO1xyXG4gICAgLy8gY29zKGFuZ2xlKSArIHNpbihhbmdsZSksXHJcbiAgICAvLyBjb3MoYW5nbGUpICAtIHNpbihhbmdsZSkpO1xyXG4gIGdsX1Bvc2l0aW9uID0gdmVjNCh0bXAueCAqIDIuMCAvIHNjcmVlblNpemUueCAsIHRtcC55ICogMi4wIC8gc2NyZWVuU2l6ZS55LCAxLCAxKTtcclxuICAvL2dsX1Bvc2l0aW9uID0gdmVjNCh0bXAueCAvIDcwMC4wICogMi4wIC0gMS4wLCB0bXAueSAvIDUwMC4wICogMi4wIC0gMS4wLCAwLCAxKTtcclxuICB0ZXhDb29yZCA9IGluX3RleDtcclxufWAsXHJcbiAgICBgI3ZlcnNpb24gMzAwIGVzXHJcbnByZWNpc2lvbiBoaWdocCBmbG9hdDtcclxub3V0IHZlYzQgb3V0X2NvbG9yO1xyXG5cclxudW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XHJcbmluIHZlYzIgdGV4Q29vcmQ7XHJcbiAgdm9pZCBtYWluKCl7XHJcblxyXG4gICAgdmVjNCBjb2xvciA9IHRleHR1cmUodVNhbXBsZXIsIHRleENvb3JkKTtcclxuICAgIGlmIChjb2xvci5yZ2JhID09IHZlYzQoMSwgMSwxICwgMSkpXHJcbiAgICAgIGRpc2NhcmQ7XHJcbiAgICBlbHNlXHJcbiAgICAgIG91dF9jb2xvciA9IGNvbG9yO1xyXG59YCxcclxuICBdO1xyXG4gIGNvbnN0IHNoYWRlciA9IFtcclxuICAgIGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKSxcclxuICAgIGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpLFxyXG4gIF07XHJcblxyXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXJbMF0sIHNoZFRleHRbMF0pO1xyXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyWzBdKTtcclxuICBpZiAoIWdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXJbMF0sIGdsLkNPTVBJTEVfU1RBVFVTKSkge1xyXG4gICAgY29uc3QgQnVmID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXJbMF0pO1xyXG4gICAgY29uc29sZS5sb2coQnVmKTtcclxuICB9XHJcbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlclsxXSwgc2hkVGV4dFsxXSk7XHJcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXJbMV0pO1xyXG4gIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlclsxXSwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICBjb25zdCBCdWYgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlclsxXSk7XHJcbiAgICBjb25zb2xlLmxvZyhCdWYpO1xyXG4gIH1cclxuICBzaGQucHJnID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG5cclxuICBnbC5hdHRhY2hTaGFkZXIoc2hkLnByZywgc2hhZGVyWzBdKTtcclxuICBnbC5hdHRhY2hTaGFkZXIoc2hkLnByZywgc2hhZGVyWzFdKTtcclxuXHJcbiAgZ2wubGlua1Byb2dyYW0oc2hkLnByZyk7XHJcbiAgaWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHNoZC5wcmcsIGdsLkxJTktfU1RBVFVTKSkge1xyXG4gICAgY29uc3QgQnVmID0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coc2hkLnByZyk7XHJcbiAgICBjb25zb2xlLmxvZyhCdWYpO1xyXG4gIH1cclxuXHJcbiAgc2hkLmxvY1NjcmVlblNpemUgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hkLnByZywgXCJzY3JlZW5TaXplXCIpO1xyXG4gIHNoZC5sb2NQb3MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oc2hkLnByZywgXCJwb3NcIik7XHJcbiAgc2hkLmxvY1NjYWxlID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoZC5wcmcsIFwic2NhbGVcIik7XHJcbiAgc2hkLmxvY0FuZ2xlID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoZC5wcmcsIFwiYW5nbGVcIik7XHJcblxyXG4gIHNoZC5pbl9wb3MgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGQucHJnLCBcImluX3Bvc1wiKTtcclxuICBzaGQuaW5fdGV4ID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oc2hkLnByZywgXCJpbl90ZXhcIik7XHJcblxyXG4gIGdsLnVzZVByb2dyYW0oc2hkLnByZyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVRleChuYW1lLCB1cmwpIHtcclxuICB0aGlzLnR5cGUgPSBnbC5URVhUVVJFXzJEO1xyXG4gIHRoaXMudGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcclxuXHJcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlKTtcclxuICBpZiAodHlwZW9mIHVybCA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xyXG4gICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgMCxcclxuICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgIGdsLlJHQkEsXHJcbiAgICAgICAgZ2wuVU5TSUdORURfQllURSxcclxuICAgICAgICBpbWFnZVxyXG4gICAgICApO1xyXG5cclxuICAgICAgaWYgKFxyXG4gICAgICAgIChNYXRoLmxvZyhpbWFnZS53aWR0aCkgLyBNYXRoLmxvZygyKSkgJSAxID09PSAwICYmXHJcbiAgICAgICAgKE1hdGgubG9nKGltYWdlLmhlaWdodCkgLyBNYXRoLmxvZygyKSkgJSAxID09PSAwXHJcbiAgICAgICkge1xyXG4gICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpO1xyXG4gICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgaW1hZ2Uuc3JjID0gdXJsO1xyXG5cclxuICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgIDAsXHJcbiAgICAgIGdsLlJHQkEsXHJcbiAgICAgIDEsXHJcbiAgICAgIDEsXHJcbiAgICAgIDAsXHJcbiAgICAgIGdsLlJHQkEsXHJcbiAgICAgIGdsLlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgIG5ldyBVaW50OEFycmF5KFsxMjgsIDEyOCwgMTI4LCAyNTVdKVxyXG4gICAgKTtcclxuICB9IGVsc2VcclxuICAgIGdsLnRleEltYWdlMkQoXHJcbiAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgIDAsXHJcbiAgICAgIGdsLlJHQkEsXHJcbiAgICAgIDEsXHJcbiAgICAgIDEsXHJcbiAgICAgIDAsXHJcbiAgICAgIGdsLlJHQkEsXHJcbiAgICAgIGdsLlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgIG5ldyBVaW50OEFycmF5KHVybClcclxuICAgICk7XHJcblxyXG4gIHRoaXMubG9jID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHNoZC5wcmcsIFwidVNhbXBsZXJcIik7XHJcblxyXG4gIHRoaXMuYXBwbHkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBnbC5hY3RpdmVUZXh0dXJlKGdsLlRFWFRVUkUwKTtcclxuXHJcbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0aGlzLnRleHR1cmUpO1xyXG5cclxuICAgIGdsLnVuaWZvcm0xaSh0aGlzLmxvYywgMCk7XHJcbiAgfTtcclxuICBtYXNzVGV4W25hbWVdID0gdGhpcztcclxufVxyXG5mdW5jdGlvbiBjcmVhdGVQcmltKG5hbWUsIHBvcywgaW5kZXgsIHR5cGUpIHtcclxuICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gIHRoaXMuVkEgPSBnbC5jcmVhdGVWZXJ0ZXhBcnJheSgpO1xyXG4gIGdsLmJpbmRWZXJ0ZXhBcnJheSh0aGlzLlZBKTtcclxuXHJcbiAgdGhpcy5WQiA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLlZCKTtcclxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgcG9zLCBnbC5TVEFUSUNfRFJBVyk7XHJcbiAgdGhpcy5udW1PZlYgPSBwb3MubGVuZ3RoO1xyXG5cclxuICBpZiAoaW5kZXgpIHtcclxuICAgIHRoaXMuSUIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuSUIpO1xyXG4gICAgZ2wuYnVmZmVyRGF0YShcclxuICAgICAgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXHJcbiAgICAgIG5ldyBJbnQxNkFycmF5KGluZGV4KSxcclxuICAgICAgZ2wuU1RBVElDX0RSQVdcclxuICAgICk7XHJcbiAgICB0aGlzLm51bU9mViA9IGluZGV4Lmxlbmd0aDtcclxuICB9XHJcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGQuaW5fcG9zLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDE2LCAwKTtcclxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGQuaW5fcG9zKTtcclxuXHJcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGQuaW5fdGV4LCAyLCBnbC5GTE9BVCwgZmFsc2UsIDE2LCA4KTtcclxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGQuaW5fdGV4KTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKHBvcywgYW5nbGUsIHNjYWxlKSB7XHJcbiAgICBnbC51bmlmb3JtMmZ2KHNoZC5sb2NTY3JlZW5TaXplLCBbXHJcbiAgICAgIGdsLmNhbnZhcy5jbGllbnRXaWR0aCxcclxuICAgICAgZ2wuY2FudmFzLmNsaWVudEhlaWdodCxcclxuICAgIF0pO1xyXG4gICAgZ2wudW5pZm9ybTJmdihzaGQubG9jUG9zLCBbcG9zLngsIHBvcy55XSk7XHJcbiAgICBpZiAoc2NhbGUgIT0gbnVsbCkgZ2wudW5pZm9ybTJmdihzaGQubG9jU2NhbGUsIFtzY2FsZS54LCBzY2FsZS55XSk7XHJcbiAgICBnbC51bmlmb3JtMWYoc2hkLmxvY0FuZ2xlLCBhbmdsZSk7XHJcblxyXG4gICAgZ2wuYmluZFZlcnRleEFycmF5KHRoaXMuVkEpO1xyXG4gICAgaWYgKHRoaXMuSUIgIT0gbnVsbCkge1xyXG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0aGlzLklCKTtcclxuICAgICAgZ2wuZHJhd0VsZW1lbnRzKHRoaXMudHlwZSwgdGhpcy5udW1PZlYsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcclxuICAgIH0gZWxzZSBnbC5kcmF3QXJyYXlzKHRoaXMudHlwZSwgMCwgdGhpcy5udW1PZlYpO1xyXG4gIH07XHJcblxyXG4gIG1hc3NQcmltW25hbWVdID0gdGhpcztcclxuICByZXR1cm4gdGhpcztcclxufVxyXG5mdW5jdGlvbiBfY3JlYXRlVGFuaygpIHtcclxuICBpZiAoIW1hc3NQcmltW1widGFua1wiXSlcclxuICAgIHRoaXMucHJpbSA9IG5ldyBjcmVhdGVQcmltKFxyXG4gICAgICBcInRhbmtcIixcclxuICAgICAgZGVmLnBvcyxcclxuICAgICAgZGVmLmluZGV4LFxyXG4gICAgICAvKmdsLlRSSUFOR0xFUyAqL1xyXG4gICAgICBnbC5UUklBTkdMRV9TVFJJUFxyXG4gICAgKTtcclxuICBlbHNlIHRoaXMucHJpbSA9IG1hc3NUZXhbXCJ0YW5rXCJdO1xyXG5cclxuICBpZiAoIW1hc3NUZXhbXCJ0YW5rXCJdKSB0aGlzLnRleCA9IG5ldyBjcmVhdGVUZXgoXCJ0YW5rXCIsIFwiLi90YW5rX2JsdWUucG5nXCIpO1xyXG4gIGVsc2UgdGhpcy50ZXggPSBtYXNzUHJpbVtcInRhbmtcIl07XHJcblxyXG4gIHRoaXMucG9sb3NhID0gbmV3IGNyZWF0ZVByaW0oXCJwb2xvc2FcIiwgZGVmLnBvcywgZGVmLmluZGV4LCBnbC5UUklBTkdMRV9TVFJJUCk7XHJcblxyXG4gIHRoaXMuZHJhdyA9IGZ1bmN0aW9uIChpbmZvLCB1c2VyUG9zKSB7XHJcbiAgICB0aGlzLnRleC5hcHBseSgpO1xyXG4gICAgdGhpcy5wcmltLmRyYXcoXHJcbiAgICAgIHsgeDogaW5mby5wb3MueCAtIHVzZXJQb3MueCwgeTogaW5mby5wb3MueSAtIHVzZXJQb3MueSB9LFxyXG4gICAgICBpbmZvLmFuZ2xlLFxyXG4gICAgICBpbmZvLnNjYWxlXHJcbiAgICApO1xyXG4gICAgY29uc3QgYSA9IE1hdGguc3FydChcclxuICAgICAgaW5mby5zY2FsZS54ICogaW5mby5zY2FsZS54ICsgaW5mby5zY2FsZS55ICogaW5mby5zY2FsZS55XHJcbiAgICApO1xyXG4gICAgdGhpcy5wb2xvc2EuZHJhdyhcclxuICAgICAgeyB4OiBpbmZvLnBvcy54IC0gdXNlclBvcy54LCB5OiBpbmZvLnBvcy55IC0gdXNlclBvcy55ICsgYSB9LFxyXG4gICAgICBpbmZvLmFuZ2xlLFxyXG4gICAgICB7IHg6IDEyLCB5OiAxIH1cclxuICAgICk7XHJcbiAgICB0aGlzLnBvbG9zYS5kcmF3KFxyXG4gICAgICB7IHg6IGluZm8ucG9zLnggLSB1c2VyUG9zLngsIHk6IGluZm8ucG9zLnkgLSB1c2VyUG9zLnkgLSBhIH0sXHJcbiAgICAgIGluZm8uYW5nbGUsXHJcbiAgICAgIHsgeDogMTIsIHk6IDEgfVxyXG4gICAgKTtcclxuICB9O1xyXG4gIGNyZWF0ZWRFbGVtZW50c1tcInRhbmtcIl0gPSB0aGlzO1xyXG4gIHJldHVybiB0aGlzO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUYW5rKCkge1xyXG4gIHJldHVybiBuZXcgX2NyZWF0ZVRhbmsoKTtcclxufVxyXG5mdW5jdGlvbiBfY3JlYXRlQnVsbGV0KCkge1xyXG4gIGlmICghbWFzc1ByaW1bXCJidWxsZXRcIl0pXHJcbiAgICB0aGlzLnByaW0gPSBuZXcgY3JlYXRlUHJpbShcclxuICAgICAgXCJidWxsZXRcIixcclxuICAgICAgZGVmLnBvcyxcclxuICAgICAgZGVmLmluZGV4LFxyXG4gICAgICAvKmdsLlRSSUFOR0xFUyAqL1xyXG4gICAgICBnbC5UUklBTkdMRV9TVFJJUFxyXG4gICAgKTtcclxuICBlbHNlIHRoaXMucHJpbSA9IG1hc3NUZXhbXCJidWxsZXRcIl07XHJcblxyXG4gIGlmICghbWFzc1RleFtcImJ1bGxldFwiXSkgdGhpcy50ZXggPSBuZXcgY3JlYXRlVGV4KFwiYnVsbGV0XCIsIFwiLi9idWxsZXQuanBnXCIpO1xyXG4gIGVsc2UgdGhpcy50ZXggPSBtYXNzUHJpbVtcImJ1bGxldFwiXTtcclxuXHJcbiAgdGhpcy5kcmF3ID0gZnVuY3Rpb24gKGluZm8sIHVzZXJQb3MpIHtcclxuICAgIHRoaXMudGV4LmFwcGx5KCk7XHJcbiAgICB0aGlzLnByaW0uZHJhdyhcclxuICAgICAgeyB4OiBpbmZvLnBvcy54IC0gdXNlclBvcy54LCB5OiBpbmZvLnBvcy55IC0gdXNlclBvcy55IH0sXHJcbiAgICAgIGluZm8uYW5nbGUsXHJcbiAgICAgIGluZm8uc2NhbGVcclxuICAgICk7XHJcbiAgfTtcclxuICBjcmVhdGVkRWxlbWVudHNbXCJidWxsZXRcIl0gPSB0aGlzO1xyXG4gIHJldHVybiB0aGlzO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCdWxsZXQoKSB7XHJcbiAgcmV0dXJuIG5ldyBfY3JlYXRlQnVsbGV0KCk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGRyYXdBbGwoZHJhd0VsZW1lbnRzKSB7XHJcbiAgbGV0IHVzZXJQb3MgPSBkcmF3RWxlbWVudHNbMF0uaW5mby5wb3M7XHJcbiAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuY2FudmFzLndpZHRoLCBnbC5jYW52YXMuaGVpZ2h0KTtcclxuICBnbC5jbGVhckNvbG9yKDEsIDEsIDAsIDEpO1xyXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xyXG5cclxuICBkcmF3RWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4ge1xyXG4gICAgY3JlYXRlZEVsZW1lbnRzW2VsZW1lbnQubmFtZV0uZHJhdyhlbGVtZW50LmluZm8sIHVzZXJQb3MpO1xyXG4gIH0pO1xyXG59XHJcbiIsImNvbnN0IFBBQ0tFVF9UWVBFUyA9IE9iamVjdC5jcmVhdGUobnVsbCk7IC8vIG5vIE1hcCA9IG5vIHBvbHlmaWxsXG5QQUNLRVRfVFlQRVNbXCJvcGVuXCJdID0gXCIwXCI7XG5QQUNLRVRfVFlQRVNbXCJjbG9zZVwiXSA9IFwiMVwiO1xuUEFDS0VUX1RZUEVTW1wicGluZ1wiXSA9IFwiMlwiO1xuUEFDS0VUX1RZUEVTW1wicG9uZ1wiXSA9IFwiM1wiO1xuUEFDS0VUX1RZUEVTW1wibWVzc2FnZVwiXSA9IFwiNFwiO1xuUEFDS0VUX1RZUEVTW1widXBncmFkZVwiXSA9IFwiNVwiO1xuUEFDS0VUX1RZUEVTW1wibm9vcFwiXSA9IFwiNlwiO1xuY29uc3QgUEFDS0VUX1RZUEVTX1JFVkVSU0UgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuT2JqZWN0LmtleXMoUEFDS0VUX1RZUEVTKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgUEFDS0VUX1RZUEVTX1JFVkVSU0VbUEFDS0VUX1RZUEVTW2tleV1dID0ga2V5O1xufSk7XG5jb25zdCBFUlJPUl9QQUNLRVQgPSB7IHR5cGU6IFwiZXJyb3JcIiwgZGF0YTogXCJwYXJzZXIgZXJyb3JcIiB9O1xuZXhwb3J0IHsgUEFDS0VUX1RZUEVTLCBQQUNLRVRfVFlQRVNfUkVWRVJTRSwgRVJST1JfUEFDS0VUIH07XG4iLCJpbXBvcnQgeyBQQUNLRVRfVFlQRVMgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuLy8gQXJyYXlCdWZmZXIuaXNWaWV3IG1ldGhvZCBpcyBub3QgZGVmaW5lZCBpbiBJRTEwXG5jb25zdCBpc1ZpZXcgPSBvYmogPT4ge1xuICAgIHJldHVybiB0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgPyBBcnJheUJ1ZmZlci5pc1ZpZXcob2JqKVxuICAgICAgICA6IG9iaiAmJiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgZW5jb2RlUGFja2V0ID0gKHsgdHlwZSwgZGF0YSB9LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUJsb2IgJiYgZGF0YSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiZcbiAgICAgICAgKGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcoZGF0YSkpKSB7XG4gICAgICAgIGlmIChzdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZUJsb2JBc0Jhc2U2NChuZXcgQmxvYihbZGF0YV0pLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcGxhaW4gc3RyaW5nXG4gICAgcmV0dXJuIGNhbGxiYWNrKFBBQ0tFVF9UWVBFU1t0eXBlXSArIChkYXRhIHx8IFwiXCIpKTtcbn07XG5jb25zdCBlbmNvZGVCbG9iQXNCYXNlNjQgPSAoZGF0YSwgY2FsbGJhY2spID0+IHtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY29udGVudCA9IGZpbGVSZWFkZXIucmVzdWx0LnNwbGl0KFwiLFwiKVsxXTtcbiAgICAgICAgY2FsbGJhY2soXCJiXCIgKyAoY29udGVudCB8fCBcIlwiKSk7XG4gICAgfTtcbiAgICByZXR1cm4gZmlsZVJlYWRlci5yZWFkQXNEYXRhVVJMKGRhdGEpO1xufTtcbmV4cG9ydCBkZWZhdWx0IGVuY29kZVBhY2tldDtcbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2Jhc2U2NC1hcnJheWJ1ZmZlclxuY29uc3QgY2hhcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG4vLyBVc2UgYSBsb29rdXAgdGFibGUgdG8gZmluZCB0aGUgaW5kZXguXG5jb25zdCBsb29rdXAgPSB0eXBlb2YgVWludDhBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyBbXSA6IG5ldyBVaW50OEFycmF5KDI1Nik7XG5mb3IgKGxldCBpID0gMDsgaSA8IGNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgbG9va3VwW2NoYXJzLmNoYXJDb2RlQXQoaSldID0gaTtcbn1cbmV4cG9ydCBjb25zdCBlbmNvZGUgPSAoYXJyYXlidWZmZXIpID0+IHtcbiAgICBsZXQgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheWJ1ZmZlciksIGksIGxlbiA9IGJ5dGVzLmxlbmd0aCwgYmFzZTY0ID0gJyc7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAzKSB7XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1tieXRlc1tpXSA+PiAyXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzWygoYnl0ZXNbaV0gJiAzKSA8PCA0KSB8IChieXRlc1tpICsgMV0gPj4gNCldO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpICsgMV0gJiAxNSkgPDwgMikgfCAoYnl0ZXNbaSArIDJdID4+IDYpXTtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2kgKyAyXSAmIDYzXTtcbiAgICB9XG4gICAgaWYgKGxlbiAlIDMgPT09IDIpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyAnPSc7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxlbiAlIDMgPT09IDEpIHtcbiAgICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMikgKyAnPT0nO1xuICAgIH1cbiAgICByZXR1cm4gYmFzZTY0O1xufTtcbmV4cG9ydCBjb25zdCBkZWNvZGUgPSAoYmFzZTY0KSA9PiB7XG4gICAgbGV0IGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1LCBsZW4gPSBiYXNlNjQubGVuZ3RoLCBpLCBwID0gMCwgZW5jb2RlZDEsIGVuY29kZWQyLCBlbmNvZGVkMywgZW5jb2RlZDQ7XG4gICAgaWYgKGJhc2U2NFtiYXNlNjQubGVuZ3RoIC0gMV0gPT09ICc9Jykge1xuICAgICAgICBidWZmZXJMZW5ndGgtLTtcbiAgICAgICAgaWYgKGJhc2U2NFtiYXNlNjQubGVuZ3RoIC0gMl0gPT09ICc9Jykge1xuICAgICAgICAgICAgYnVmZmVyTGVuZ3RoLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgYXJyYXlidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZmVyTGVuZ3RoKSwgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheWJ1ZmZlcik7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgICAgIGVuY29kZWQxID0gbG9va3VwW2Jhc2U2NC5jaGFyQ29kZUF0KGkpXTtcbiAgICAgICAgZW5jb2RlZDIgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDEpXTtcbiAgICAgICAgZW5jb2RlZDMgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDIpXTtcbiAgICAgICAgZW5jb2RlZDQgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSArIDMpXTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XG4gICAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheWJ1ZmZlcjtcbn07XG4iLCJpbXBvcnQgeyBFUlJPUl9QQUNLRVQsIFBBQ0tFVF9UWVBFU19SRVZFUlNFIH0gZnJvbSBcIi4vY29tbW9ucy5qc1wiO1xuaW1wb3J0IHsgZGVjb2RlIH0gZnJvbSBcIi4vY29udHJpYi9iYXNlNjQtYXJyYXlidWZmZXIuanNcIjtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuY29uc3QgZGVjb2RlUGFja2V0ID0gKGVuY29kZWRQYWNrZXQsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAodHlwZW9mIGVuY29kZWRQYWNrZXQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgZGF0YTogbWFwQmluYXJ5KGVuY29kZWRQYWNrZXQsIGJpbmFyeVR5cGUpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHR5cGUgPSBlbmNvZGVkUGFja2V0LmNoYXJBdCgwKTtcbiAgICBpZiAodHlwZSA9PT0gXCJiXCIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6IFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgZGF0YTogZGVjb2RlQmFzZTY0UGFja2V0KGVuY29kZWRQYWNrZXQuc3Vic3RyaW5nKDEpLCBiaW5hcnlUeXBlKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBwYWNrZXRUeXBlID0gUEFDS0VUX1RZUEVTX1JFVkVSU0VbdHlwZV07XG4gICAgaWYgKCFwYWNrZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBFUlJPUl9QQUNLRVQ7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVkUGFja2V0Lmxlbmd0aCA+IDFcbiAgICAgICAgPyB7XG4gICAgICAgICAgICB0eXBlOiBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXSxcbiAgICAgICAgICAgIGRhdGE6IGVuY29kZWRQYWNrZXQuc3Vic3RyaW5nKDEpXG4gICAgICAgIH1cbiAgICAgICAgOiB7XG4gICAgICAgICAgICB0eXBlOiBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXVxuICAgICAgICB9O1xufTtcbmNvbnN0IGRlY29kZUJhc2U2NFBhY2tldCA9IChkYXRhLCBiaW5hcnlUeXBlKSA9PiB7XG4gICAgaWYgKHdpdGhOYXRpdmVBcnJheUJ1ZmZlcikge1xuICAgICAgICBjb25zdCBkZWNvZGVkID0gZGVjb2RlKGRhdGEpO1xuICAgICAgICByZXR1cm4gbWFwQmluYXJ5KGRlY29kZWQsIGJpbmFyeVR5cGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHsgYmFzZTY0OiB0cnVlLCBkYXRhIH07IC8vIGZhbGxiYWNrIGZvciBvbGQgYnJvd3NlcnNcbiAgICB9XG59O1xuY29uc3QgbWFwQmluYXJ5ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBzd2l0Y2ggKGJpbmFyeVR5cGUpIHtcbiAgICAgICAgY2FzZSBcImJsb2JcIjpcbiAgICAgICAgICAgIHJldHVybiBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgPyBuZXcgQmxvYihbZGF0YV0pIDogZGF0YTtcbiAgICAgICAgY2FzZSBcImFycmF5YnVmZmVyXCI6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZGF0YTsgLy8gYXNzdW1pbmcgdGhlIGRhdGEgaXMgYWxyZWFkeSBhbiBBcnJheUJ1ZmZlclxuICAgIH1cbn07XG5leHBvcnQgZGVmYXVsdCBkZWNvZGVQYWNrZXQ7XG4iLCJpbXBvcnQgZW5jb2RlUGFja2V0IGZyb20gXCIuL2VuY29kZVBhY2tldC5qc1wiO1xuaW1wb3J0IGRlY29kZVBhY2tldCBmcm9tIFwiLi9kZWNvZGVQYWNrZXQuanNcIjtcbmNvbnN0IFNFUEFSQVRPUiA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApOyAvLyBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGVsaW1pdGVyI0FTQ0lJX2RlbGltaXRlZF90ZXh0XG5jb25zdCBlbmNvZGVQYXlsb2FkID0gKHBhY2tldHMsIGNhbGxiYWNrKSA9PiB7XG4gICAgLy8gc29tZSBwYWNrZXRzIG1heSBiZSBhZGRlZCB0byB0aGUgYXJyYXkgd2hpbGUgZW5jb2RpbmcsIHNvIHRoZSBpbml0aWFsIGxlbmd0aCBtdXN0IGJlIHNhdmVkXG4gICAgY29uc3QgbGVuZ3RoID0gcGFja2V0cy5sZW5ndGg7XG4gICAgY29uc3QgZW5jb2RlZFBhY2tldHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHBhY2tldHMuZm9yRWFjaCgocGFja2V0LCBpKSA9PiB7XG4gICAgICAgIC8vIGZvcmNlIGJhc2U2NCBlbmNvZGluZyBmb3IgYmluYXJ5IHBhY2tldHNcbiAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgZmFsc2UsIGVuY29kZWRQYWNrZXQgPT4ge1xuICAgICAgICAgICAgZW5jb2RlZFBhY2tldHNbaV0gPSBlbmNvZGVkUGFja2V0O1xuICAgICAgICAgICAgaWYgKCsrY291bnQgPT09IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVuY29kZWRQYWNrZXRzLmpvaW4oU0VQQVJBVE9SKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbmNvbnN0IGRlY29kZVBheWxvYWQgPSAoZW5jb2RlZFBheWxvYWQsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IGVuY29kZWRQYXlsb2FkLnNwbGl0KFNFUEFSQVRPUik7XG4gICAgY29uc3QgcGFja2V0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZW5jb2RlZFBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVjb2RlZFBhY2tldCA9IGRlY29kZVBhY2tldChlbmNvZGVkUGFja2V0c1tpXSwgYmluYXJ5VHlwZSk7XG4gICAgICAgIHBhY2tldHMucHVzaChkZWNvZGVkUGFja2V0KTtcbiAgICAgICAgaWYgKGRlY29kZWRQYWNrZXQudHlwZSA9PT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGFja2V0cztcbn07XG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA0O1xuZXhwb3J0IHsgZW5jb2RlUGFja2V0LCBlbmNvZGVQYXlsb2FkLCBkZWNvZGVQYWNrZXQsIGRlY29kZVBheWxvYWQgfTtcbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICAodGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICBmdW5jdGlvbiBvbigpIHtcbiAgICB0aGlzLm9mZihldmVudCwgb24pO1xuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBvbi5mbiA9IGZuO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVtb3ZlIGV2ZW50IHNwZWNpZmljIGFycmF5cyBmb3IgZXZlbnQgdHlwZXMgdGhhdCBub1xuICAvLyBvbmUgaXMgc3Vic2NyaWJlZCBmb3IgdG8gYXZvaWQgbWVtb3J5IGxlYWsuXG4gIGlmIChjYWxsYmFja3MubGVuZ3RoID09PSAwKSB7XG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcblxuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICB9XG5cbiAgaWYgKGNhbGxiYWNrcykge1xuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBjYWxsYmFja3NbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBhbGlhcyB1c2VkIGZvciByZXNlcnZlZCBldmVudHMgKHByb3RlY3RlZCBtZXRob2QpXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0UmVzZXJ2ZWQgPSBFbWl0dGVyLnByb3RvdHlwZS5lbWl0O1xuXG4vKipcbiAqIFJldHVybiBhcnJheSBvZiBjYWxsYmFja3MgZm9yIGBldmVudGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHJldHVybiB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdO1xufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0aGlzIGVtaXR0ZXIgaGFzIGBldmVudGAgaGFuZGxlcnMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHJldHVybiAhISB0aGlzLmxpc3RlbmVycyhldmVudCkubGVuZ3RoO1xufTtcbiIsImV4cG9ydCBjb25zdCBnbG9iYWxUaGlzU2hpbSA9ICgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xuICAgIH1cbn0pKCk7XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4vZ2xvYmFsVGhpcy5qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIHBpY2sob2JqLCAuLi5hdHRyKSB7XG4gICAgcmV0dXJuIGF0dHIucmVkdWNlKChhY2MsIGspID0+IHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgYWNjW2tdID0gb2JqW2tdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xufVxuLy8gS2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgcmVhbCB0aW1lb3V0IGZ1bmN0aW9ucyBzbyB0aGV5IGNhbiBiZSB1c2VkIHdoZW4gb3ZlcnJpZGRlblxuY29uc3QgTkFUSVZFX1NFVF9USU1FT1VUID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0O1xuY29uc3QgTkFUSVZFX0NMRUFSX1RJTUVPVVQgPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dDtcbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsVGltZXJGdW5jdGlvbnMob2JqLCBvcHRzKSB7XG4gICAgaWYgKG9wdHMudXNlTmF0aXZlVGltZXJzKSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBOQVRJVkVfU0VUX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gTkFUSVZFX0NMRUFSX1RJTUVPVVQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG9iai5zZXRUaW1lb3V0Rm4gPSBnbG9iYWxUaGlzLnNldFRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICAgICAgb2JqLmNsZWFyVGltZW91dEZuID0gZ2xvYmFsVGhpcy5jbGVhclRpbWVvdXQuYmluZChnbG9iYWxUaGlzKTtcbiAgICB9XG59XG4vLyBiYXNlNjQgZW5jb2RlZCBidWZmZXJzIGFyZSBhYm91dCAzMyUgYmlnZ2VyIChodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQpXG5jb25zdCBCQVNFNjRfT1ZFUkhFQUQgPSAxLjMzO1xuLy8gd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgYG5ldyBCbG9iKFtvYmpdKS5zaXplYCwgYnV0IGl0IGlzbid0IHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydCBmdW5jdGlvbiBieXRlTGVuZ3RoKG9iaikge1xuICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB1dGY4TGVuZ3RoKG9iaik7XG4gICAgfVxuICAgIC8vIGFycmF5YnVmZmVyIG9yIGJsb2JcbiAgICByZXR1cm4gTWF0aC5jZWlsKChvYmouYnl0ZUxlbmd0aCB8fCBvYmouc2l6ZSkgKiBCQVNFNjRfT1ZFUkhFQUQpO1xufVxuZnVuY3Rpb24gdXRmOExlbmd0aChzdHIpIHtcbiAgICBsZXQgYyA9IDAsIGxlbmd0aCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdHIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGMgPCAweDgwKSB7XG4gICAgICAgICAgICBsZW5ndGggKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjIDwgMHg4MDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweGQ4MDAgfHwgYyA+PSAweGUwMDApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgbGVuZ3RoICs9IDQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxlbmd0aDtcbn1cbiIsImltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucyB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmNsYXNzIFRyYW5zcG9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHJlYXNvbiwgZGVzY3JpcHRpb24sIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIocmVhc29uKTtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnR5cGUgPSBcIlRyYW5zcG9ydEVycm9yXCI7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFRyYW5zcG9ydCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFRyYW5zcG9ydCBhYnN0cmFjdCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gb3B0cy5xdWVyeTtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSBvcHRzLnNvY2tldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uXG4gICAgICogQHBhcmFtIGRlc2NyaXB0aW9uXG4gICAgICogQHBhcmFtIGNvbnRleHQgLSB0aGUgZXJyb3IgY29udGV4dFxuICAgICAqIEByZXR1cm4ge1RyYW5zcG9ydH0gZm9yIGNoYWluaW5nXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRXJyb3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkge1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBuZXcgVHJhbnNwb3J0RXJyb3IocmVhc29uLCBkZXNjcmlwdGlvbiwgY29udGV4dCkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3BlbnMgdGhlIHRyYW5zcG9ydC5cbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5pbmdcIjtcbiAgICAgICAgdGhpcy5kb09wZW4oKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlcyB0aGUgdHJhbnNwb3J0LlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBcIm9wZW5pbmdcIiB8fCB0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICB0aGlzLmRvQ2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBtdWx0aXBsZSBwYWNrZXRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gcGFja2V0c1xuICAgICAqL1xuICAgIHNlbmQocGFja2V0cykge1xuICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09PSBcIm9wZW5cIikge1xuICAgICAgICAgICAgdGhpcy53cml0ZShwYWNrZXRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWlnaHQgaGFwcGVuIGlmIHRoZSB0cmFuc3BvcnQgd2FzIHNpbGVudGx5IGNsb3NlZCBpbiB0aGUgYmVmb3JldW5sb2FkIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBvcGVuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25PcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YVxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbkRhdGEoZGF0YSkge1xuICAgICAgICBjb25zdCBwYWNrZXQgPSBkZWNvZGVQYWNrZXQoZGF0YSwgdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSk7XG4gICAgICAgIHRoaXMub25QYWNrZXQocGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggYSBkZWNvZGVkIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvblBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwicGFja2V0XCIsIHBhY2tldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGNsb3NlLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uQ2xvc2UoZGV0YWlscykge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCBkZXRhaWxzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGF1c2VzIHRoZSB0cmFuc3BvcnQsIGluIG9yZGVyIG5vdCB0byBsb3NlIHBhY2tldHMgZHVyaW5nIGFuIHVwZ3JhZGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb25QYXVzZVxuICAgICAqL1xuICAgIHBhdXNlKG9uUGF1c2UpIHsgfVxufVxuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdW5zaGlmdGlvL3llYXN0XG4ndXNlIHN0cmljdCc7XG5jb25zdCBhbHBoYWJldCA9ICcwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ei1fJy5zcGxpdCgnJyksIGxlbmd0aCA9IDY0LCBtYXAgPSB7fTtcbmxldCBzZWVkID0gMCwgaSA9IDAsIHByZXY7XG4vKipcbiAqIFJldHVybiBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHNwZWNpZmllZCBudW1iZXIuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG51bSBUaGUgbnVtYmVyIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBudW1iZXIuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlKG51bSkge1xuICAgIGxldCBlbmNvZGVkID0gJyc7XG4gICAgZG8ge1xuICAgICAgICBlbmNvZGVkID0gYWxwaGFiZXRbbnVtICUgbGVuZ3RoXSArIGVuY29kZWQ7XG4gICAgICAgIG51bSA9IE1hdGguZmxvb3IobnVtIC8gbGVuZ3RoKTtcbiAgICB9IHdoaWxlIChudW0gPiAwKTtcbiAgICByZXR1cm4gZW5jb2RlZDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBpbnRlZ2VyIHZhbHVlIHNwZWNpZmllZCBieSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge051bWJlcn0gVGhlIGludGVnZXIgdmFsdWUgcmVwcmVzZW50ZWQgYnkgdGhlIHN0cmluZy5cbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGUoc3RyKSB7XG4gICAgbGV0IGRlY29kZWQgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVjb2RlZCA9IGRlY29kZWQgKiBsZW5ndGggKyBtYXBbc3RyLmNoYXJBdChpKV07XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVkO1xufVxuLyoqXG4gKiBZZWFzdDogQSB0aW55IGdyb3dpbmcgaWQgZ2VuZXJhdG9yLlxuICpcbiAqIEByZXR1cm5zIHtTdHJpbmd9IEEgdW5pcXVlIGlkLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHllYXN0KCkge1xuICAgIGNvbnN0IG5vdyA9IGVuY29kZSgrbmV3IERhdGUoKSk7XG4gICAgaWYgKG5vdyAhPT0gcHJldilcbiAgICAgICAgcmV0dXJuIHNlZWQgPSAwLCBwcmV2ID0gbm93O1xuICAgIHJldHVybiBub3cgKyAnLicgKyBlbmNvZGUoc2VlZCsrKTtcbn1cbi8vXG4vLyBNYXAgZWFjaCBjaGFyYWN0ZXIgdG8gaXRzIGluZGV4LlxuLy9cbmZvciAoOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgbWFwW2FscGhhYmV0W2ldXSA9IGk7XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9xdWVyeXN0cmluZ1xuLyoqXG4gKiBDb21waWxlcyBhIHF1ZXJ5c3RyaW5nXG4gKiBSZXR1cm5zIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShvYmopIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcmJztcbiAgICAgICAgICAgIHN0ciArPSBlbmNvZGVVUklDb21wb25lbnQoaSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuLyoqXG4gKiBQYXJzZXMgYSBzaW1wbGUgcXVlcnlzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHFzKSB7XG4gICAgbGV0IHFyeSA9IHt9O1xuICAgIGxldCBwYWlycyA9IHFzLnNwbGl0KCcmJyk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbGV0IHBhaXIgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBxcnlbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHFyeTtcbn1cbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2NvbXBvbmVudC9oYXMtY29yc1xubGV0IHZhbHVlID0gZmFsc2U7XG50cnkge1xuICAgIHZhbHVlID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbn1cbmNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBYTUxIdHRwIHN1cHBvcnQgaXMgZGlzYWJsZWQgaW4gSUUgdGhlbiBpdCB3aWxsIHRocm93XG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gY3JlYXRlXG59XG5leHBvcnQgY29uc3QgaGFzQ09SUyA9IHZhbHVlO1xuIiwiLy8gYnJvd3NlciBzaGltIGZvciB4bWxodHRwcmVxdWVzdCBtb2R1bGVcbmltcG9ydCB7IGhhc0NPUlMgfSBmcm9tIFwiLi4vY29udHJpYi9oYXMtY29ycy5qc1wiO1xuaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gWEhSKG9wdHMpIHtcbiAgICBjb25zdCB4ZG9tYWluID0gb3B0cy54ZG9tYWluO1xuICAgIC8vIFhNTEh0dHBSZXF1ZXN0IGNhbiBiZSBkaXNhYmxlZCBvbiBJRVxuICAgIHRyeSB7XG4gICAgICAgIGlmIChcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgWE1MSHR0cFJlcXVlc3QgJiYgKCF4ZG9tYWluIHx8IGhhc0NPUlMpKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHsgfVxuICAgIGlmICgheGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBnbG9iYWxUaGlzW1tcIkFjdGl2ZVwiXS5jb25jYXQoXCJPYmplY3RcIikuam9pbihcIlhcIildKFwiTWljcm9zb2Z0LlhNTEhUVFBcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi90cmFuc3BvcnQuanNcIjtcbmltcG9ydCB7IHllYXN0IH0gZnJvbSBcIi4uL2NvbnRyaWIveWVhc3QuanNcIjtcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuLi9jb250cmliL3BhcnNlcXMuanNcIjtcbmltcG9ydCB7IGVuY29kZVBheWxvYWQsIGRlY29kZVBheWxvYWQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgWEhSIGFzIFhNTEh0dHBSZXF1ZXN0IH0gZnJvbSBcIi4veG1saHR0cHJlcXVlc3QuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFsVGhpcy5qc1wiO1xuZnVuY3Rpb24gZW1wdHkoKSB7IH1cbmNvbnN0IGhhc1hIUjIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCh7XG4gICAgICAgIHhkb21haW46IGZhbHNlLFxuICAgIH0pO1xuICAgIHJldHVybiBudWxsICE9IHhoci5yZXNwb25zZVR5cGU7XG59KSgpO1xuZXhwb3J0IGNsYXNzIFBvbGxpbmcgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFhIUiBQb2xsaW5nIGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIHRoaXMucG9sbGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb25zdCBpc1NTTCA9IFwiaHR0cHM6XCIgPT09IGxvY2F0aW9uLnByb3RvY29sO1xuICAgICAgICAgICAgbGV0IHBvcnQgPSBsb2NhdGlvbi5wb3J0O1xuICAgICAgICAgICAgLy8gc29tZSB1c2VyIGFnZW50cyBoYXZlIGVtcHR5IGBsb2NhdGlvbi5wb3J0YFxuICAgICAgICAgICAgaWYgKCFwb3J0KSB7XG4gICAgICAgICAgICAgICAgcG9ydCA9IGlzU1NMID8gXCI0NDNcIiA6IFwiODBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMueGQgPVxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSAhPT0gbG9jYXRpb24uaG9zdG5hbWUpIHx8XG4gICAgICAgICAgICAgICAgICAgIHBvcnQgIT09IG9wdHMucG9ydDtcbiAgICAgICAgICAgIHRoaXMueHMgPSBvcHRzLnNlY3VyZSAhPT0gaXNTU0w7XG4gICAgICAgIH1cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFhIUiBzdXBwb3J0cyBiaW5hcnlcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGZvcmNlQmFzZTY0ID0gb3B0cyAmJiBvcHRzLmZvcmNlQmFzZTY0O1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gaGFzWEhSMiAmJiAhZm9yY2VCYXNlNjQ7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJwb2xsaW5nXCI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBzb2NrZXQgKHRyaWdnZXJzIHBvbGxpbmcpLiBXZSB3cml0ZSBhIFBJTkcgbWVzc2FnZSB0byBkZXRlcm1pbmVcbiAgICAgKiB3aGVuIHRoZSB0cmFuc3BvcnQgaXMgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIHRoaXMucG9sbCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgcG9sbGluZy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uUGF1c2UgLSBjYWxsYmFjayB1cG9uIGJ1ZmZlcnMgYXJlIGZsdXNoZWQgYW5kIHRyYW5zcG9ydCBpcyBwYXVzZWRcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIHBhdXNlKG9uUGF1c2UpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzaW5nXCI7XG4gICAgICAgIGNvbnN0IHBhdXNlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJwYXVzZWRcIjtcbiAgICAgICAgICAgIG9uUGF1c2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZyB8fCAhdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgbGV0IHRvdGFsID0gMDtcbiAgICAgICAgICAgIGlmICh0aGlzLnBvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcInBvbGxDb21wbGV0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAtLXRvdGFsIHx8IHBhdXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXVzZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBwb2xsaW5nIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBwb2xsKCkge1xuICAgICAgICB0aGlzLnBvbGxpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmRvUG9sbCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE92ZXJsb2FkcyBvbkRhdGEgdG8gZGV0ZWN0IHBheWxvYWRzLlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gKHBhY2tldCkgPT4ge1xuICAgICAgICAgICAgLy8gaWYgaXRzIHRoZSBmaXJzdCBtZXNzYWdlIHdlIGNvbnNpZGVyIHRoZSB0cmFuc3BvcnQgb3BlblxuICAgICAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgJiYgcGFja2V0LnR5cGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbk9wZW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIGl0cyBhIGNsb3NlIHBhY2tldCwgd2UgY2xvc2UgdGhlIG9uZ29pbmcgcmVxdWVzdHNcbiAgICAgICAgICAgIGlmIChcImNsb3NlXCIgPT09IHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNsb3NlKHsgZGVzY3JpcHRpb246IFwidHJhbnNwb3J0IGNsb3NlZCBieSB0aGUgc2VydmVyXCIgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIGJ5cGFzcyBvbkRhdGEgYW5kIGhhbmRsZSB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBkZWNvZGUgcGF5bG9hZFxuICAgICAgICBkZWNvZGVQYXlsb2FkKGRhdGEsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUpLmZvckVhY2goY2FsbGJhY2spO1xuICAgICAgICAvLyBpZiBhbiBldmVudCBkaWQgbm90IHRyaWdnZXIgY2xvc2luZ1xuICAgICAgICBpZiAoXCJjbG9zZWRcIiAhPT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBnb3QgZGF0YSB3ZSdyZSBub3QgcG9sbGluZ1xuICAgICAgICAgICAgdGhpcy5wb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxDb21wbGV0ZVwiKTtcbiAgICAgICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wb2xsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBGb3IgcG9sbGluZywgc2VuZCBhIGNsb3NlIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMud3JpdGUoW3sgdHlwZTogXCJjbG9zZVwiIH1dKTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpbiBjYXNlIHdlJ3JlIHRyeWluZyB0byBjbG9zZSB3aGlsZVxuICAgICAgICAgICAgLy8gaGFuZHNoYWtpbmcgaXMgaW4gcHJvZ3Jlc3MgKEdILTE2NClcbiAgICAgICAgICAgIHRoaXMub25jZShcIm9wZW5cIiwgY2xvc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHBhY2tldHMgcGF5bG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHBhY2tldHMgLSBkYXRhIHBhY2tldHNcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGVuY29kZVBheWxvYWQocGFja2V0cywgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZG9Xcml0ZShkYXRhLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy53cml0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBsZXQgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJodHRwc1wiIDogXCJodHRwXCI7XG4gICAgICAgIGxldCBwb3J0ID0gXCJcIjtcbiAgICAgICAgLy8gY2FjaGUgYnVzdGluZyBpcyBmb3JjZWRcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLm9wdHMudGltZXN0YW1wUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIHF1ZXJ5W3RoaXMub3B0cy50aW1lc3RhbXBQYXJhbV0gPSB5ZWFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSAmJiAhcXVlcnkuc2lkKSB7XG4gICAgICAgICAgICBxdWVyeS5iNjQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIC8vIGF2b2lkIHBvcnQgaWYgZGVmYXVsdCBmb3Igc2NoZW1hXG4gICAgICAgIGlmICh0aGlzLm9wdHMucG9ydCAmJlxuICAgICAgICAgICAgKChcImh0dHBzXCIgPT09IHNjaGVtYSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA0NDMpIHx8XG4gICAgICAgICAgICAgICAgKFwiaHR0cFwiID09PSBzY2hlbWEgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0KSAhPT0gODApKSkge1xuICAgICAgICAgICAgcG9ydCA9IFwiOlwiICsgdGhpcy5vcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgY29uc3QgaXB2NiA9IHRoaXMub3B0cy5ob3N0bmFtZS5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgICAgIHJldHVybiAoc2NoZW1hICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgKGlwdjYgPyBcIltcIiArIHRoaXMub3B0cy5ob3N0bmFtZSArIFwiXVwiIDogdGhpcy5vcHRzLmhvc3RuYW1lKSArXG4gICAgICAgICAgICBwb3J0ICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIChlbmNvZGVkUXVlcnkubGVuZ3RoID8gXCI/XCIgKyBlbmNvZGVkUXVlcnkgOiBcIlwiKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmVxdWVzdChvcHRzID0ge30pIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihvcHRzLCB7IHhkOiB0aGlzLnhkLCB4czogdGhpcy54cyB9LCB0aGlzLm9wdHMpO1xuICAgICAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcy51cmkoKSwgb3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxlZCB1cG9uIGZsdXNoLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZG9Xcml0ZShkYXRhLCBmbikge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLnJlcXVlc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oXCJzdWNjZXNzXCIsIGZuKTtcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgKHhoclN0YXR1cywgY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwieGhyIHBvc3QgZXJyb3JcIiwgeGhyU3RhdHVzLCBjb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBhIHBvbGwgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRvUG9sbCgpIHtcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5yZXF1ZXN0KCk7XG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgdGhpcy5vbkRhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsICh4aHJTdGF0dXMsIGNvbnRleHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcInhociBwb2xsIGVycm9yXCIsIHhoclN0YXR1cywgY29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBvbGxYaHIgPSByZXE7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlcXVlc3QgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJpLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5vcHRzID0gb3B0cztcbiAgICAgICAgdGhpcy5tZXRob2QgPSBvcHRzLm1ldGhvZCB8fCBcIkdFVFwiO1xuICAgICAgICB0aGlzLnVyaSA9IHVyaTtcbiAgICAgICAgdGhpcy5hc3luYyA9IGZhbHNlICE9PSBvcHRzLmFzeW5jO1xuICAgICAgICB0aGlzLmRhdGEgPSB1bmRlZmluZWQgIT09IG9wdHMuZGF0YSA/IG9wdHMuZGF0YSA6IG51bGw7XG4gICAgICAgIHRoaXMuY3JlYXRlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIFhIUiBvYmplY3QgYW5kIHNlbmRzIHRoZSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBjcmVhdGUoKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBwaWNrKHRoaXMub3B0cywgXCJhZ2VudFwiLCBcInBmeFwiLCBcImtleVwiLCBcInBhc3NwaHJhc2VcIiwgXCJjZXJ0XCIsIFwiY2FcIiwgXCJjaXBoZXJzXCIsIFwicmVqZWN0VW5hdXRob3JpemVkXCIsIFwiYXV0b1VucmVmXCIpO1xuICAgICAgICBvcHRzLnhkb21haW4gPSAhIXRoaXMub3B0cy54ZDtcbiAgICAgICAgb3B0cy54c2NoZW1lID0gISF0aGlzLm9wdHMueHM7XG4gICAgICAgIGNvbnN0IHhociA9ICh0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdChvcHRzKSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmksIHRoaXMuYXN5bmMpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrICYmIHhoci5zZXREaXNhYmxlSGVhZGVyQ2hlY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgaW4gdGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5leHRyYUhlYWRlcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihpLCB0aGlzLm9wdHMuZXh0cmFIZWFkZXJzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIGlmIChcIlBPU1RcIiA9PT0gdGhpcy5tZXRob2QpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcIiovKlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgIC8vIGllNiBjaGVja1xuICAgICAgICAgICAgaWYgKFwid2l0aENyZWRlbnRpYWxzXCIgaW4geGhyKSB7XG4gICAgICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRoaXMub3B0cy53aXRoQ3JlZGVudGlhbHM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLnJlcXVlc3RUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSB0aGlzLm9wdHMucmVxdWVzdFRpbWVvdXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICg0ICE9PSB4aHIucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmICgyMDAgPT09IHhoci5zdGF0dXMgfHwgMTIyMyA9PT0geGhyLnN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uTG9hZCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbWFrZSBzdXJlIHRoZSBgZXJyb3JgIGV2ZW50IGhhbmRsZXIgdGhhdCdzIHVzZXItc2V0XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvZXMgbm90IHRocm93IGluIHRoZSBzYW1lIHRpY2sgYW5kIGdldHMgY2F1Z2h0IGhlcmVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKHR5cGVvZiB4aHIuc3RhdHVzID09PSBcIm51bWJlclwiID8geGhyLnN0YXR1cyA6IDApO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeGhyLnNlbmQodGhpcy5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTmVlZCB0byBkZWZlciBzaW5jZSAuY3JlYXRlKCkgaXMgY2FsbGVkIGRpcmVjdGx5IGZyb20gdGhlIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAvLyBhbmQgdGh1cyB0aGUgJ2Vycm9yJyBldmVudCBjYW4gb25seSBiZSBvbmx5IGJvdW5kICphZnRlciogdGhpcyBleGNlcHRpb25cbiAgICAgICAgICAgIC8vIG9jY3Vycy4gIFRoZXJlZm9yZSwgYWxzbywgd2UgY2Fubm90IHRocm93IGhlcmUgYXQgYWxsLlxuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMub25FcnJvcihlKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSBSZXF1ZXN0LnJlcXVlc3RzQ291bnQrKztcbiAgICAgICAgICAgIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5pbmRleF0gPSB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVycm9yLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkVycm9yKGVycikge1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVyciwgdGhpcy54aHIpO1xuICAgICAgICB0aGlzLmNsZWFudXAodHJ1ZSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFucyB1cCBob3VzZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2xlYW51cChmcm9tRXJyb3IpIHtcbiAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgPT09IHR5cGVvZiB0aGlzLnhociB8fCBudWxsID09PSB0aGlzLnhocikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGVtcHR5O1xuICAgICAgICBpZiAoZnJvbUVycm9yKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMueGhyLmFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgZGVsZXRlIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5pbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54aHIgPSBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBsb2FkLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLnhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgIGlmIChkYXRhICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImRhdGFcIiwgZGF0YSk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBYm9ydHMgdGhlIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGFib3J0KCkge1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG59XG5SZXF1ZXN0LnJlcXVlc3RzQ291bnQgPSAwO1xuUmVxdWVzdC5yZXF1ZXN0cyA9IHt9O1xuLyoqXG4gKiBBYm9ydHMgcGVuZGluZyByZXF1ZXN0cyB3aGVuIHVubG9hZGluZyB0aGUgd2luZG93LiBUaGlzIGlzIG5lZWRlZCB0byBwcmV2ZW50XG4gKiBtZW1vcnkgbGVha3MgKGUuZy4gd2hlbiB1c2luZyBJRSkgYW5kIHRvIGVuc3VyZSB0aGF0IG5vIHNwdXJpb3VzIGVycm9yIGlzXG4gKiBlbWl0dGVkLlxuICovXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICh0eXBlb2YgYXR0YWNoRXZlbnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGF0dGFjaEV2ZW50KFwib251bmxvYWRcIiwgdW5sb2FkSGFuZGxlcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3QgdGVybWluYXRpb25FdmVudCA9IFwib25wYWdlaGlkZVwiIGluIGdsb2JhbFRoaXMgPyBcInBhZ2VoaWRlXCIgOiBcInVubG9hZFwiO1xuICAgICAgICBhZGRFdmVudExpc3RlbmVyKHRlcm1pbmF0aW9uRXZlbnQsIHVubG9hZEhhbmRsZXIsIGZhbHNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1bmxvYWRIYW5kbGVyKCkge1xuICAgIGZvciAobGV0IGkgaW4gUmVxdWVzdC5yZXF1ZXN0cykge1xuICAgICAgICBpZiAoUmVxdWVzdC5yZXF1ZXN0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgUmVxdWVzdC5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgZ2xvYmFsVGhpc1NoaW0gYXMgZ2xvYmFsVGhpcyB9IGZyb20gXCIuLi9nbG9iYWxUaGlzLmpzXCI7XG5leHBvcnQgY29uc3QgbmV4dFRpY2sgPSAoKCkgPT4ge1xuICAgIGNvbnN0IGlzUHJvbWlzZUF2YWlsYWJsZSA9IHR5cGVvZiBQcm9taXNlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFByb21pc2UucmVzb2x2ZSA9PT0gXCJmdW5jdGlvblwiO1xuICAgIGlmIChpc1Byb21pc2VBdmFpbGFibGUpIHtcbiAgICAgICAgcmV0dXJuIChjYikgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihjYik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gKGNiLCBzZXRUaW1lb3V0Rm4pID0+IHNldFRpbWVvdXRGbihjYiwgMCk7XG4gICAgfVxufSkoKTtcbmV4cG9ydCBjb25zdCBXZWJTb2NrZXQgPSBnbG9iYWxUaGlzLldlYlNvY2tldCB8fCBnbG9iYWxUaGlzLk1veldlYlNvY2tldDtcbmV4cG9ydCBjb25zdCB1c2luZ0Jyb3dzZXJXZWJTb2NrZXQgPSB0cnVlO1xuZXhwb3J0IGNvbnN0IGRlZmF1bHRCaW5hcnlUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlIH0gZnJvbSBcIi4uL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgeWVhc3QgfSBmcm9tIFwiLi4vY29udHJpYi95ZWFzdC5qc1wiO1xuaW1wb3J0IHsgcGljayB9IGZyb20gXCIuLi91dGlsLmpzXCI7XG5pbXBvcnQgeyBkZWZhdWx0QmluYXJ5VHlwZSwgbmV4dFRpY2ssIHVzaW5nQnJvd3NlcldlYlNvY2tldCwgV2ViU29ja2V0LCB9IGZyb20gXCIuL3dlYnNvY2tldC1jb25zdHJ1Y3Rvci5qc1wiO1xuaW1wb3J0IHsgZW5jb2RlUGFja2V0IH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbi8vIGRldGVjdCBSZWFjdE5hdGl2ZSBlbnZpcm9ubWVudFxuY29uc3QgaXNSZWFjdE5hdGl2ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB0eXBlb2YgbmF2aWdhdG9yLnByb2R1Y3QgPT09IFwic3RyaW5nXCIgJiZcbiAgICBuYXZpZ2F0b3IucHJvZHVjdC50b0xvd2VyQ2FzZSgpID09PSBcInJlYWN0bmF0aXZlXCI7XG5leHBvcnQgY2xhc3MgV1MgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIC8qKlxuICAgICAqIFdlYlNvY2tldCB0cmFuc3BvcnQgY29uc3RydWN0b3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIGNvbm5lY3Rpb24gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKG9wdHMpO1xuICAgICAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gIW9wdHMuZm9yY2VCYXNlNjQ7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJ3ZWJzb2NrZXRcIjtcbiAgICB9XG4gICAgZG9PcGVuKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hlY2soKSkge1xuICAgICAgICAgICAgLy8gbGV0IHByb2JlIHRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB1cmkgPSB0aGlzLnVyaSgpO1xuICAgICAgICBjb25zdCBwcm90b2NvbHMgPSB0aGlzLm9wdHMucHJvdG9jb2xzO1xuICAgICAgICAvLyBSZWFjdCBOYXRpdmUgb25seSBzdXBwb3J0cyB0aGUgJ2hlYWRlcnMnIG9wdGlvbiwgYW5kIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIGFueXRoaW5nIGVsc2UgaXMgcGFzc2VkXG4gICAgICAgIGNvbnN0IG9wdHMgPSBpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICA/IHt9XG4gICAgICAgICAgICA6IHBpY2sodGhpcy5vcHRzLCBcImFnZW50XCIsIFwicGVyTWVzc2FnZURlZmxhdGVcIiwgXCJwZnhcIiwgXCJrZXlcIiwgXCJwYXNzcGhyYXNlXCIsIFwiY2VydFwiLCBcImNhXCIsIFwiY2lwaGVyc1wiLCBcInJlamVjdFVuYXV0aG9yaXplZFwiLCBcImxvY2FsQWRkcmVzc1wiLCBcInByb3RvY29sVmVyc2lvblwiLCBcIm9yaWdpblwiLCBcIm1heFBheWxvYWRcIiwgXCJmYW1pbHlcIiwgXCJjaGVja1NlcnZlcklkZW50aXR5XCIpO1xuICAgICAgICBpZiAodGhpcy5vcHRzLmV4dHJhSGVhZGVycykge1xuICAgICAgICAgICAgb3B0cy5oZWFkZXJzID0gdGhpcy5vcHRzLmV4dHJhSGVhZGVycztcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy53cyA9XG4gICAgICAgICAgICAgICAgdXNpbmdCcm93c2VyV2ViU29ja2V0ICYmICFpc1JlYWN0TmF0aXZlXG4gICAgICAgICAgICAgICAgICAgID8gcHJvdG9jb2xzXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpKVxuICAgICAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53cy5iaW5hcnlUeXBlID0gdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSB8fCBkZWZhdWx0QmluYXJ5VHlwZTtcbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgc29ja2V0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLndzLm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53cy5fc29ja2V0LnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLndzLm9uY2xvc2UgPSAoY2xvc2VFdmVudCkgPT4gdGhpcy5vbkNsb3NlKHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIndlYnNvY2tldCBjb25uZWN0aW9uIGNsb3NlZFwiLFxuICAgICAgICAgICAgY29udGV4dDogY2xvc2VFdmVudCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMud3Mub25tZXNzYWdlID0gKGV2KSA9PiB0aGlzLm9uRGF0YShldi5kYXRhKTtcbiAgICAgICAgdGhpcy53cy5vbmVycm9yID0gKGUpID0+IHRoaXMub25FcnJvcihcIndlYnNvY2tldCBlcnJvclwiLCBlKTtcbiAgICB9XG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIC8vIGVuY29kZVBhY2tldCBlZmZpY2llbnQgYXMgaXQgdXNlcyBXUyBmcmFtaW5nXG4gICAgICAgIC8vIG5vIG5lZWQgZm9yIGVuY29kZVBheWxvYWRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYWNrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXQgPSBwYWNrZXRzW2ldO1xuICAgICAgICAgICAgY29uc3QgbGFzdFBhY2tldCA9IGkgPT09IHBhY2tldHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGVuY29kZVBhY2tldChwYWNrZXQsIHRoaXMuc3VwcG9ydHNCaW5hcnksIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBvYmplY3QgKEdILTQzNylcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRzID0ge307XG4gICAgICAgICAgICAgICAgaWYgKCF1c2luZ0Jyb3dzZXJXZWJTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhY2tldC5vcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbXByZXNzID0gcGFja2V0Lm9wdGlvbnMuY29tcHJlc3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5wZXJNZXNzYWdlRGVmbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVuID0gXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICBcInN0cmluZ1wiID09PSB0eXBlb2YgZGF0YSA/IEJ1ZmZlci5ieXRlTGVuZ3RoKGRhdGEpIDogZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGVuIDwgdGhpcy5vcHRzLnBlck1lc3NhZ2VEZWZsYXRlLnRocmVzaG9sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcHJlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBTb21ldGltZXMgdGhlIHdlYnNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCBidXQgdGhlIGJyb3dzZXIgZGlkbid0XG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBhIGNoYW5jZSBvZiBpbmZvcm1pbmcgdXMgYWJvdXQgaXQgeWV0LCBpbiB0aGF0IGNhc2Ugc2VuZCB3aWxsXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNpbmdCcm93c2VyV2ViU29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUeXBlRXJyb3IgaXMgdGhyb3duIHdoZW4gcGFzc2luZyB0aGUgc2Vjb25kIGFyZ3VtZW50IG9uIFNhZmFyaVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsYXN0UGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZha2UgZHJhaW5cbiAgICAgICAgICAgICAgICAgICAgLy8gZGVmZXIgdG8gbmV4dCB0aWNrIHRvIGFsbG93IFNvY2tldCB0byBjbGVhciB3cml0ZUJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuc2V0VGltZW91dEZuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMud3MgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMud3MuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMud3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHVyaSgpIHtcbiAgICAgICAgbGV0IHF1ZXJ5ID0gdGhpcy5xdWVyeSB8fCB7fTtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5vcHRzLnNlY3VyZSA/IFwid3NzXCIgOiBcIndzXCI7XG4gICAgICAgIGxldCBwb3J0ID0gXCJcIjtcbiAgICAgICAgLy8gYXZvaWQgcG9ydCBpZiBkZWZhdWx0IGZvciBzY2hlbWFcbiAgICAgICAgaWYgKHRoaXMub3B0cy5wb3J0ICYmXG4gICAgICAgICAgICAoKFwid3NzXCIgPT09IHNjaGVtYSAmJiBOdW1iZXIodGhpcy5vcHRzLnBvcnQpICE9PSA0NDMpIHx8XG4gICAgICAgICAgICAgICAgKFwid3NcIiA9PT0gc2NoZW1hICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCkgIT09IDgwKSkpIHtcbiAgICAgICAgICAgIHBvcnQgPSBcIjpcIiArIHRoaXMub3B0cy5wb3J0O1xuICAgICAgICB9XG4gICAgICAgIC8vIGFwcGVuZCB0aW1lc3RhbXAgdG8gVVJJXG4gICAgICAgIGlmICh0aGlzLm9wdHMudGltZXN0YW1wUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIHF1ZXJ5W3RoaXMub3B0cy50aW1lc3RhbXBQYXJhbV0gPSB5ZWFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbW11bmljYXRlIGJpbmFyeSBzdXBwb3J0IGNhcGFiaWxpdGllc1xuICAgICAgICBpZiAoIXRoaXMuc3VwcG9ydHNCaW5hcnkpIHtcbiAgICAgICAgICAgIHF1ZXJ5LmI2NCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgY29uc3QgaXB2NiA9IHRoaXMub3B0cy5ob3N0bmFtZS5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgICAgIHJldHVybiAoc2NoZW1hICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgKGlwdjYgPyBcIltcIiArIHRoaXMub3B0cy5ob3N0bmFtZSArIFwiXVwiIDogdGhpcy5vcHRzLmhvc3RuYW1lKSArXG4gICAgICAgICAgICBwb3J0ICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIChlbmNvZGVkUXVlcnkubGVuZ3RoID8gXCI/XCIgKyBlbmNvZGVkUXVlcnkgOiBcIlwiKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZlYXR1cmUgZGV0ZWN0aW9uIGZvciBXZWJTb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIHRoaXMgdHJhbnNwb3J0IGlzIGF2YWlsYWJsZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNoZWNrKCkge1xuICAgICAgICByZXR1cm4gISFXZWJTb2NrZXQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgUG9sbGluZyB9IGZyb20gXCIuL3BvbGxpbmcuanNcIjtcbmltcG9ydCB7IFdTIH0gZnJvbSBcIi4vd2Vic29ja2V0LmpzXCI7XG5leHBvcnQgY29uc3QgdHJhbnNwb3J0cyA9IHtcbiAgICB3ZWJzb2NrZXQ6IFdTLFxuICAgIHBvbGxpbmc6IFBvbGxpbmcsXG59O1xuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZ2Fsa24vcGFyc2V1cmlcbi8qKlxuICogUGFyc2VzIGEgVVJJXG4gKlxuICogTm90ZTogd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgdGhlIGJ1aWx0LWluIFVSTCBvYmplY3QsIGJ1dCBpdCBpc24ndCBzdXBwb3J0ZWQgb24gYWxsIHBsYXRmb3Jtcy5cbiAqXG4gKiBTZWU6XG4gKiAtIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9VUkxcbiAqIC0gaHR0cHM6Ly9jYW5pdXNlLmNvbS91cmxcbiAqIC0gaHR0cHM6Ly93d3cucmZjLWVkaXRvci5vcmcvcmZjL3JmYzM5ODYjYXBwZW5kaXgtQlxuICpcbiAqIEhpc3Rvcnkgb2YgdGhlIHBhcnNlKCkgbWV0aG9kOlxuICogLSBmaXJzdCBjb21taXQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9zb2NrZXQuaW8tY2xpZW50L2NvbW1pdC80ZWUxZDVkOTRiMzkwNmE5YzA1MmI0NTlmMWE4MThiMTVmMzhmOTFjXG4gKiAtIGV4cG9ydCBpbnRvIGl0cyBvd24gbW9kdWxlOiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vZW5naW5lLmlvLWNsaWVudC9jb21taXQvZGUyYzU2MWU0NTY0ZWZlYjc4ZjFiZGIxYmEzOWVmODFiMjgyMmNiM1xuICogLSByZWltcG9ydDogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2VuZ2luZS5pby1jbGllbnQvY29tbWl0L2RmMzIyNzdjM2Y2ZDYyMmVlYzVlZDA5ZjQ5M2NhZTNmMzM5MWQyNDJcbiAqXG4gKiBAYXV0aG9yIFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPiAoTUlUIGxpY2Vuc2UpXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuY29uc3QgcmUgPSAvXig/Oig/IVteOkBcXC8/I10rOlteOkBcXC9dKkApKGh0dHB8aHR0cHN8d3N8d3NzKTpcXC9cXC8pPygoPzooKFteOkBcXC8/I10qKSg/OjooW146QFxcLz8jXSopKT8pP0ApPygoPzpbYS1mMC05XXswLDR9Oil7Miw3fVthLWYwLTldezAsNH18W146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLztcbmNvbnN0IHBhcnRzID0gW1xuICAgICdzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnYW5jaG9yJ1xuXTtcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgICBjb25zdCBzcmMgPSBzdHIsIGIgPSBzdHIuaW5kZXhPZignWycpLCBlID0gc3RyLmluZGV4T2YoJ10nKTtcbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgYikgKyBzdHIuc3Vic3RyaW5nKGIsIGUpLnJlcGxhY2UoLzovZywgJzsnKSArIHN0ci5zdWJzdHJpbmcoZSwgc3RyLmxlbmd0aCk7XG4gICAgfVxuICAgIGxldCBtID0gcmUuZXhlYyhzdHIgfHwgJycpLCB1cmkgPSB7fSwgaSA9IDE0O1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgdXJpW3BhcnRzW2ldXSA9IG1baV0gfHwgJyc7XG4gICAgfVxuICAgIGlmIChiICE9IC0xICYmIGUgIT0gLTEpIHtcbiAgICAgICAgdXJpLnNvdXJjZSA9IHNyYztcbiAgICAgICAgdXJpLmhvc3QgPSB1cmkuaG9zdC5zdWJzdHJpbmcoMSwgdXJpLmhvc3QubGVuZ3RoIC0gMSkucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuYXV0aG9yaXR5ID0gdXJpLmF1dGhvcml0eS5yZXBsYWNlKCdbJywgJycpLnJlcGxhY2UoJ10nLCAnJykucmVwbGFjZSgvOy9nLCAnOicpO1xuICAgICAgICB1cmkuaXB2NnVyaSA9IHRydWU7XG4gICAgfVxuICAgIHVyaS5wYXRoTmFtZXMgPSBwYXRoTmFtZXModXJpLCB1cmlbJ3BhdGgnXSk7XG4gICAgdXJpLnF1ZXJ5S2V5ID0gcXVlcnlLZXkodXJpLCB1cmlbJ3F1ZXJ5J10pO1xuICAgIHJldHVybiB1cmk7XG59XG5mdW5jdGlvbiBwYXRoTmFtZXMob2JqLCBwYXRoKSB7XG4gICAgY29uc3QgcmVneCA9IC9cXC97Miw5fS9nLCBuYW1lcyA9IHBhdGgucmVwbGFjZShyZWd4LCBcIi9cIikuc3BsaXQoXCIvXCIpO1xuICAgIGlmIChwYXRoLnNsaWNlKDAsIDEpID09ICcvJyB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBuYW1lcy5zcGxpY2UoMCwgMSk7XG4gICAgfVxuICAgIGlmIChwYXRoLnNsaWNlKC0xKSA9PSAnLycpIHtcbiAgICAgICAgbmFtZXMuc3BsaWNlKG5hbWVzLmxlbmd0aCAtIDEsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXM7XG59XG5mdW5jdGlvbiBxdWVyeUtleSh1cmksIHF1ZXJ5KSB7XG4gICAgY29uc3QgZGF0YSA9IHt9O1xuICAgIHF1ZXJ5LnJlcGxhY2UoLyg/Ol58JikoW14mPV0qKT0/KFteJl0qKS9nLCBmdW5jdGlvbiAoJDAsICQxLCAkMikge1xuICAgICAgICBpZiAoJDEpIHtcbiAgICAgICAgICAgIGRhdGFbJDFdID0gJDI7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YTtcbn1cbiIsImltcG9ydCB7IHRyYW5zcG9ydHMgfSBmcm9tIFwiLi90cmFuc3BvcnRzL2luZGV4LmpzXCI7XG5pbXBvcnQgeyBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIGJ5dGVMZW5ndGggfSBmcm9tIFwiLi91dGlsLmpzXCI7XG5pbXBvcnQgeyBkZWNvZGUgfSBmcm9tIFwiLi9jb250cmliL3BhcnNlcXMuanNcIjtcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIi4vY29udHJpYi9wYXJzZXVyaS5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5pbXBvcnQgeyBwcm90b2NvbCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5leHBvcnQgY2xhc3MgU29ja2V0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogU29ja2V0IGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSB1cmkgLSB1cmkgb3Igb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBbXTtcbiAgICAgICAgaWYgKHVyaSAmJiBcIm9iamVjdFwiID09PSB0eXBlb2YgdXJpKSB7XG4gICAgICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICAgICAgdXJpID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXJpKSB7XG4gICAgICAgICAgICB1cmkgPSBwYXJzZSh1cmkpO1xuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSA9IHVyaS5ob3N0O1xuICAgICAgICAgICAgb3B0cy5zZWN1cmUgPSB1cmkucHJvdG9jb2wgPT09IFwiaHR0cHNcIiB8fCB1cmkucHJvdG9jb2wgPT09IFwid3NzXCI7XG4gICAgICAgICAgICBvcHRzLnBvcnQgPSB1cmkucG9ydDtcbiAgICAgICAgICAgIGlmICh1cmkucXVlcnkpXG4gICAgICAgICAgICAgICAgb3B0cy5xdWVyeSA9IHVyaS5xdWVyeTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvcHRzLmhvc3QpIHtcbiAgICAgICAgICAgIG9wdHMuaG9zdG5hbWUgPSBwYXJzZShvcHRzLmhvc3QpLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLnNlY3VyZSA9XG4gICAgICAgICAgICBudWxsICE9IG9wdHMuc2VjdXJlXG4gICAgICAgICAgICAgICAgPyBvcHRzLnNlY3VyZVxuICAgICAgICAgICAgICAgIDogdHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIFwiaHR0cHM6XCIgPT09IGxvY2F0aW9uLnByb3RvY29sO1xuICAgICAgICBpZiAob3B0cy5ob3N0bmFtZSAmJiAhb3B0cy5wb3J0KSB7XG4gICAgICAgICAgICAvLyBpZiBubyBwb3J0IGlzIHNwZWNpZmllZCBtYW51YWxseSwgdXNlIHRoZSBwcm90b2NvbCBkZWZhdWx0XG4gICAgICAgICAgICBvcHRzLnBvcnQgPSB0aGlzLnNlY3VyZSA/IFwiNDQzXCIgOiBcIjgwXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ob3N0bmFtZSA9XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lIHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiA/IGxvY2F0aW9uLmhvc3RuYW1lIDogXCJsb2NhbGhvc3RcIik7XG4gICAgICAgIHRoaXMucG9ydCA9XG4gICAgICAgICAgICBvcHRzLnBvcnQgfHxcbiAgICAgICAgICAgICAgICAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2F0aW9uLnBvcnRcbiAgICAgICAgICAgICAgICAgICAgPyBsb2NhdGlvbi5wb3J0XG4gICAgICAgICAgICAgICAgICAgIDogdGhpcy5zZWN1cmVcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCI0NDNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOiBcIjgwXCIpO1xuICAgICAgICB0aGlzLnRyYW5zcG9ydHMgPSBvcHRzLnRyYW5zcG9ydHMgfHwgW1wicG9sbGluZ1wiLCBcIndlYnNvY2tldFwiXTtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICB0aGlzLm9wdHMgPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgICAgIHBhdGg6IFwiL2VuZ2luZS5pb1wiLFxuICAgICAgICAgICAgYWdlbnQ6IGZhbHNlLFxuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiBmYWxzZSxcbiAgICAgICAgICAgIHVwZ3JhZGU6IHRydWUsXG4gICAgICAgICAgICB0aW1lc3RhbXBQYXJhbTogXCJ0XCIsXG4gICAgICAgICAgICByZW1lbWJlclVwZ3JhZGU6IGZhbHNlLFxuICAgICAgICAgICAgYWRkVHJhaWxpbmdTbGFzaDogdHJ1ZSxcbiAgICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZSxcbiAgICAgICAgICAgIHBlck1lc3NhZ2VEZWZsYXRlOiB7XG4gICAgICAgICAgICAgICAgdGhyZXNob2xkOiAxMDI0LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zcG9ydE9wdGlvbnM6IHt9LFxuICAgICAgICAgICAgY2xvc2VPbkJlZm9yZXVubG9hZDogdHJ1ZSxcbiAgICAgICAgfSwgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cy5wYXRoID1cbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSArXG4gICAgICAgICAgICAgICAgKHRoaXMub3B0cy5hZGRUcmFpbGluZ1NsYXNoID8gXCIvXCIgOiBcIlwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdHMucXVlcnkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5xdWVyeSA9IGRlY29kZSh0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNldCBvbiBoYW5kc2hha2VcbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXBncmFkZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnBpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXQgPSBudWxsO1xuICAgICAgICAvLyBzZXQgb24gaGVhcnRiZWF0XG4gICAgICAgIHRoaXMucGluZ1RpbWVvdXRUaW1lciA9IG51bGw7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmNsb3NlT25CZWZvcmV1bmxvYWQpIHtcbiAgICAgICAgICAgICAgICAvLyBGaXJlZm94IGNsb3NlcyB0aGUgY29ubmVjdGlvbiB3aGVuIHRoZSBcImJlZm9yZXVubG9hZFwiIGV2ZW50IGlzIGVtaXR0ZWQgYnV0IG5vdCBDaHJvbWUuIFRoaXMgZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmVzIGV2ZXJ5IGJyb3dzZXIgYmVoYXZlcyB0aGUgc2FtZSAobm8gXCJkaXNjb25uZWN0XCIgZXZlbnQgYXQgdGhlIFNvY2tldC5JTyBsZXZlbCB3aGVuIHRoZSBwYWdlIGlzXG4gICAgICAgICAgICAgICAgLy8gY2xvc2VkL3JlbG9hZGVkKVxuICAgICAgICAgICAgICAgIHRoaXMuYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaWxlbnRseSBjbG9zZSB0aGUgdHJhbnNwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5ob3N0bmFtZSAhPT0gXCJsb2NhbGhvc3RcIikge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJuZXR3b3JrIGNvbm5lY3Rpb24gbG9zdFwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0cmFuc3BvcnQgb2YgdGhlIGdpdmVuIHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY3JlYXRlVHJhbnNwb3J0KG5hbWUpIHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICAvLyBhcHBlbmQgZW5naW5lLmlvIHByb3RvY29sIGlkZW50aWZpZXJcbiAgICAgICAgcXVlcnkuRUlPID0gcHJvdG9jb2w7XG4gICAgICAgIC8vIHRyYW5zcG9ydCBuYW1lXG4gICAgICAgIHF1ZXJ5LnRyYW5zcG9ydCA9IG5hbWU7XG4gICAgICAgIC8vIHNlc3Npb24gaWQgaWYgd2UgYWxyZWFkeSBoYXZlIG9uZVxuICAgICAgICBpZiAodGhpcy5pZClcbiAgICAgICAgICAgIHF1ZXJ5LnNpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdHMudHJhbnNwb3J0T3B0aW9uc1tuYW1lXSwgdGhpcy5vcHRzLCB7XG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgIHNvY2tldDogdGhpcyxcbiAgICAgICAgICAgIGhvc3RuYW1lOiB0aGlzLmhvc3RuYW1lLFxuICAgICAgICAgICAgc2VjdXJlOiB0aGlzLnNlY3VyZSxcbiAgICAgICAgICAgIHBvcnQ6IHRoaXMucG9ydCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgdHJhbnNwb3J0c1tuYW1lXShvcHRzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZXMgdHJhbnNwb3J0IHRvIHVzZSBhbmQgc3RhcnRzIHByb2JlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvcGVuKCkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0O1xuICAgICAgICBpZiAodGhpcy5vcHRzLnJlbWVtYmVyVXBncmFkZSAmJlxuICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyAmJlxuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnRzLmluZGV4T2YoXCJ3ZWJzb2NrZXRcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBcIndlYnNvY2tldFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKDAgPT09IHRoaXMudHJhbnNwb3J0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIEVtaXQgZXJyb3Igb24gbmV4dCB0aWNrIHNvIGl0IGNhbiBiZSBsaXN0ZW5lZCB0b1xuICAgICAgICAgICAgdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgXCJObyB0cmFuc3BvcnRzIGF2YWlsYWJsZVwiKTtcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gdGhpcy50cmFuc3BvcnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICAvLyBSZXRyeSB3aXRoIHRoZSBuZXh0IHRyYW5zcG9ydCBpZiB0aGUgdHJhbnNwb3J0IGlzIGRpc2FibGVkIChqc29ucDogZmFsc2UpXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuc2hpZnQoKTtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgICAgIHRoaXMuc2V0VHJhbnNwb3J0KHRyYW5zcG9ydCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0LiBEaXNhYmxlcyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzZXRUcmFuc3BvcnQodHJhbnNwb3J0KSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zcG9ydCkge1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydFxuICAgICAgICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydDtcbiAgICAgICAgLy8gc2V0IHVwIHRyYW5zcG9ydCBsaXN0ZW5lcnNcbiAgICAgICAgdHJhbnNwb3J0XG4gICAgICAgICAgICAub24oXCJkcmFpblwiLCB0aGlzLm9uRHJhaW4uYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcInBhY2tldFwiLCB0aGlzLm9uUGFja2V0LmJpbmQodGhpcykpXG4gICAgICAgICAgICAub24oXCJlcnJvclwiLCB0aGlzLm9uRXJyb3IuYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcImNsb3NlXCIsIChyZWFzb24pID0+IHRoaXMub25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCByZWFzb24pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvYmVzIGEgdHJhbnNwb3J0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0cmFuc3BvcnQgbmFtZVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcHJvYmUobmFtZSkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQobmFtZSk7XG4gICAgICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBjb25zdCBvblRyYW5zcG9ydE9wZW4gPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwicGluZ1wiLCBkYXRhOiBcInByb2JlXCIgfV0pO1xuICAgICAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJwYWNrZXRcIiwgKG1zZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoXCJwb25nXCIgPT09IG1zZy50eXBlICYmIFwicHJvYmVcIiA9PT0gbXNnLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGluZ1wiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRyYW5zcG9ydClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IFwid2Vic29ja2V0XCIgPT09IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5wYXVzZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zcG9ydC5zZW5kKFt7IHR5cGU6IFwidXBncmFkZVwiIH1dKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZVwiLCB0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBncmFkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgZXJyLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBmcmVlemVUcmFuc3BvcnQoKSB7XG4gICAgICAgICAgICBpZiAoZmFpbGVkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIC8vIEFueSBjYWxsYmFjayBjYWxsZWQgYnkgdHJhbnNwb3J0IHNob3VsZCBiZSBpZ25vcmVkIHNpbmNlIG5vd1xuICAgICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBIYW5kbGUgYW55IGVycm9yIHRoYXQgaGFwcGVucyB3aGlsZSBwcm9iaW5nXG4gICAgICAgIGNvbnN0IG9uZXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihcInByb2JlIGVycm9yOiBcIiArIGVycik7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBlcnJvci50cmFuc3BvcnQgPSB0cmFuc3BvcnQubmFtZTtcbiAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlRXJyb3JcIiwgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICBmdW5jdGlvbiBvblRyYW5zcG9ydENsb3NlKCkge1xuICAgICAgICAgICAgb25lcnJvcihcInRyYW5zcG9ydCBjbG9zZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV2hlbiB0aGUgc29ja2V0IGlzIGNsb3NlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9uY2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwic29ja2V0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgdXBncmFkZWQgd2hpbGUgd2UncmUgcHJvYmluZ1xuICAgICAgICBmdW5jdGlvbiBvbnVwZ3JhZGUodG8pIHtcbiAgICAgICAgICAgIGlmICh0cmFuc3BvcnQgJiYgdG8ubmFtZSAhPT0gdHJhbnNwb3J0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgICBmcmVlemVUcmFuc3BvcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBvbiB0aGUgdHJhbnNwb3J0IGFuZCBvbiBzZWxmXG4gICAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgICAgICB0cmFuc3BvcnQucmVtb3ZlTGlzdGVuZXIoXCJlcnJvclwiLCBvbmVycm9yKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwib3BlblwiLCBvblRyYW5zcG9ydE9wZW4pO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICB0cmFuc3BvcnQub25jZShcImNsb3NlXCIsIG9uVHJhbnNwb3J0Q2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJjbG9zZVwiLCBvbmNsb3NlKTtcbiAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkaW5nXCIsIG9udXBncmFkZSk7XG4gICAgICAgIHRyYW5zcG9ydC5vcGVuKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIGNvbm5lY3Rpb24gaXMgZGVlbWVkIG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uT3BlbigpIHtcbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSBcIndlYnNvY2tldFwiID09PSB0aGlzLnRyYW5zcG9ydC5uYW1lO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcIm9wZW5cIik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgLy8gd2UgY2hlY2sgZm9yIGByZWFkeVN0YXRlYCBpbiBjYXNlIGFuIGBvcGVuYFxuICAgICAgICAvLyBsaXN0ZW5lciBhbHJlYWR5IGNsb3NlZCB0aGUgc29ja2V0XG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlICYmIHRoaXMub3B0cy51cGdyYWRlKSB7XG4gICAgICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgICAgICBjb25zdCBsID0gdGhpcy51cGdyYWRlcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucHJvYmUodGhpcy51cGdyYWRlc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBhIHBhY2tldC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25QYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgLy8gU29ja2V0IGlzIGxpdmUgLSBhbnkgcGFja2V0IGNvdW50c1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoZWFydGJlYXRcIik7XG4gICAgICAgICAgICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhbmRzaGFrZShKU09OLnBhcnNlKHBhY2tldC5kYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJwaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzZXRQaW5nVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbmRQYWNrZXQoXCJwb25nXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9uZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImVycm9yXCI6XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcInNlcnZlciBlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBlcnIuY29kZSA9IHBhY2tldC5kYXRhO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkYXRhXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJtZXNzYWdlXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gaGFuZHNoYWtlIGNvbXBsZXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGhhbmRzaGFrZSBvYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uSGFuZHNoYWtlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoYW5kc2hha2VcIiwgZGF0YSk7XG4gICAgICAgIHRoaXMuaWQgPSBkYXRhLnNpZDtcbiAgICAgICAgdGhpcy50cmFuc3BvcnQucXVlcnkuc2lkID0gZGF0YS5zaWQ7XG4gICAgICAgIHRoaXMudXBncmFkZXMgPSB0aGlzLmZpbHRlclVwZ3JhZGVzKGRhdGEudXBncmFkZXMpO1xuICAgICAgICB0aGlzLnBpbmdJbnRlcnZhbCA9IGRhdGEucGluZ0ludGVydmFsO1xuICAgICAgICB0aGlzLnBpbmdUaW1lb3V0ID0gZGF0YS5waW5nVGltZW91dDtcbiAgICAgICAgdGhpcy5tYXhQYXlsb2FkID0gZGF0YS5tYXhQYXlsb2FkO1xuICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAvLyBJbiBjYXNlIG9wZW4gaGFuZGxlciBjbG9zZXMgc29ja2V0XG4gICAgICAgIGlmIChcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucmVzZXRQaW5nVGltZW91dCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGFuZCByZXNldHMgcGluZyB0aW1lb3V0IHRpbWVyIGJhc2VkIG9uIHNlcnZlciBwaW5ncy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcmVzZXRQaW5nVGltZW91dCgpIHtcbiAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRGbih0aGlzLnBpbmdUaW1lb3V0VGltZXIpO1xuICAgICAgICB0aGlzLnBpbmdUaW1lb3V0VGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uQ2xvc2UoXCJwaW5nIHRpbWVvdXRcIik7XG4gICAgICAgIH0sIHRoaXMucGluZ0ludGVydmFsICsgdGhpcy5waW5nVGltZW91dCk7XG4gICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICB0aGlzLnBpbmdUaW1lb3V0VGltZXIudW5yZWYoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gYGRyYWluYCBldmVudFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkRyYWluKCkge1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyLnNwbGljZSgwLCB0aGlzLnByZXZCdWZmZXJMZW4pO1xuICAgICAgICAvLyBzZXR0aW5nIHByZXZCdWZmZXJMZW4gPSAwIGlzIHZlcnkgaW1wb3J0YW50XG4gICAgICAgIC8vIGZvciBleGFtcGxlLCB3aGVuIHVwZ3JhZGluZywgdXBncmFkZSBwYWNrZXQgaXMgc2VudCBvdmVyLFxuICAgICAgICAvLyBhbmQgYSBub256ZXJvIHByZXZCdWZmZXJMZW4gY291bGQgY2F1c2UgcHJvYmxlbXMgb24gYGRyYWluYFxuICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICBpZiAoMCA9PT0gdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRmx1c2ggd3JpdGUgYnVmZmVycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZmx1c2goKSB7XG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LndyaXRhYmxlICYmXG4gICAgICAgICAgICAhdGhpcy51cGdyYWRpbmcgJiZcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXRzID0gdGhpcy5nZXRXcml0YWJsZVBhY2tldHMoKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnNlbmQocGFja2V0cyk7XG4gICAgICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIGN1cnJlbnQgbGVuZ3RoIG9mIHdyaXRlQnVmZmVyXG4gICAgICAgICAgICAvLyBzcGxpY2Ugd3JpdGVCdWZmZXIgYW5kIGNhbGxiYWNrQnVmZmVyIG9uIGBkcmFpbmBcbiAgICAgICAgICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IHBhY2tldHMubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJmbHVzaFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbnN1cmUgdGhlIGVuY29kZWQgc2l6ZSBvZiB0aGUgd3JpdGVCdWZmZXIgaXMgYmVsb3cgdGhlIG1heFBheWxvYWQgdmFsdWUgc2VudCBieSB0aGUgc2VydmVyIChvbmx5IGZvciBIVFRQXG4gICAgICogbG9uZy1wb2xsaW5nKVxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBnZXRXcml0YWJsZVBhY2tldHMoKSB7XG4gICAgICAgIGNvbnN0IHNob3VsZENoZWNrUGF5bG9hZFNpemUgPSB0aGlzLm1heFBheWxvYWQgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0Lm5hbWUgPT09IFwicG9sbGluZ1wiICYmXG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCA+IDE7XG4gICAgICAgIGlmICghc2hvdWxkQ2hlY2tQYXlsb2FkU2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXI7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHBheWxvYWRTaXplID0gMTsgLy8gZmlyc3QgcGFja2V0IHR5cGVcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyaXRlQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gdGhpcy53cml0ZUJ1ZmZlcltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBwYXlsb2FkU2l6ZSArPSBieXRlTGVuZ3RoKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgPiAwICYmIHBheWxvYWRTaXplID4gdGhpcy5tYXhQYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXIuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXlsb2FkU2l6ZSArPSAyOyAvLyBzZXBhcmF0b3IgKyBwYWNrZXQgdHlwZVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyaXRlQnVmZmVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIG1lc3NhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJuIHtTb2NrZXR9IGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICB3cml0ZShtc2csIG9wdGlvbnMsIGZuKSB7XG4gICAgICAgIHRoaXMuc2VuZFBhY2tldChcIm1lc3NhZ2VcIiwgbXNnLCBvcHRpb25zLCBmbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBzZW5kKG1zZywgb3B0aW9ucywgZm4pIHtcbiAgICAgICAgdGhpcy5zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGU6IHBhY2tldCB0eXBlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzZW5kUGFja2V0KHR5cGUsIGRhdGEsIG9wdGlvbnMsIGZuKSB7XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBkYXRhKSB7XG4gICAgICAgICAgICBmbiA9IGRhdGE7XG4gICAgICAgICAgICBkYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBvcHRpb25zKSB7XG4gICAgICAgICAgICBmbiA9IG9wdGlvbnM7XG4gICAgICAgICAgICBvcHRpb25zID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJjbG9zaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fCBcImNsb3NlZFwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgb3B0aW9ucy5jb21wcmVzcyA9IGZhbHNlICE9PSBvcHRpb25zLmNvbXByZXNzO1xuICAgICAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGFja2V0Q3JlYXRlXCIsIHBhY2tldCk7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIucHVzaChwYWNrZXQpO1xuICAgICAgICBpZiAoZm4pXG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJmbHVzaFwiLCBmbik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSBjb25uZWN0aW9uLlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25DbG9zZShcImZvcmNlZCBjbG9zZVwiKTtcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGNsZWFudXBBbmRDbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub2ZmKFwidXBncmFkZVwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRlRXJyb3JcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgICAgIGNsb3NlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHdhaXRGb3JVcGdyYWRlID0gKCkgPT4ge1xuICAgICAgICAgICAgLy8gd2FpdCBmb3IgdXBncmFkZSB0byBmaW5pc2ggc2luY2Ugd2UgY2FuJ3Qgc2VuZCBwYWNrZXRzIHdoaWxlIHBhdXNpbmcgYSB0cmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMub25jZShcInVwZ3JhZGVcIiwgY2xlYW51cEFuZENsb3NlKTtcbiAgICAgICAgICAgIHRoaXMub25jZShcInVwZ3JhZGVFcnJvclwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fCBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcImNsb3NpbmdcIjtcbiAgICAgICAgICAgIGlmICh0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcImRyYWluXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudXBncmFkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yVXBncmFkZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy51cGdyYWRpbmcpIHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yVXBncmFkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IGVycm9yXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uRXJyb3IoZXJyKSB7XG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICB0aGlzLm9uQ2xvc2UoXCJ0cmFuc3BvcnQgZXJyb3JcIiwgZXJyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IGNsb3NlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbkNsb3NlKHJlYXNvbiwgZGVzY3JpcHRpb24pIHtcbiAgICAgICAgaWYgKFwib3BlbmluZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUgfHxcbiAgICAgICAgICAgIFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGNsZWFyIHRpbWVyc1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXRGbih0aGlzLnBpbmdUaW1lb3V0VGltZXIpO1xuICAgICAgICAgICAgLy8gc3RvcCBldmVudCBmcm9tIGZpcmluZyBhZ2FpbiBmb3IgdHJhbnNwb3J0XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJjbG9zZVwiKTtcbiAgICAgICAgICAgIC8vIGVuc3VyZSB0cmFuc3BvcnQgd29uJ3Qgc3RheSBvcGVuXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgLy8gaWdub3JlIGZ1cnRoZXIgdHJhbnNwb3J0IGNvbW11bmljYXRpb25cbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZW1vdmVFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKFwiYmVmb3JldW5sb2FkXCIsIHRoaXMuYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsIHRoaXMub2ZmbGluZUV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCByZWFkeSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgICAgIC8vIGNsZWFyIHNlc3Npb24gaWRcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgLy8gZW1pdCBjbG9zZSBldmVudFxuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIC8vIGNsZWFuIGJ1ZmZlcnMgYWZ0ZXIsIHNvIHVzZXJzIGNhbiBzdGlsbFxuICAgICAgICAgICAgLy8gZ3JhYiB0aGUgYnVmZmVycyBvbiBgY2xvc2VgIGV2ZW50XG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgICAgICB0aGlzLnByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpbHRlcnMgdXBncmFkZXMsIHJldHVybmluZyBvbmx5IHRob3NlIG1hdGNoaW5nIGNsaWVudCB0cmFuc3BvcnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gdXBncmFkZXMgLSBzZXJ2ZXIgdXBncmFkZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZpbHRlclVwZ3JhZGVzKHVwZ3JhZGVzKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlcmVkVXBncmFkZXMgPSBbXTtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICBjb25zdCBqID0gdXBncmFkZXMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgaWYgKH50aGlzLnRyYW5zcG9ydHMuaW5kZXhPZih1cGdyYWRlc1tpXSkpXG4gICAgICAgICAgICAgICAgZmlsdGVyZWRVcGdyYWRlcy5wdXNoKHVwZ3JhZGVzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmlsdGVyZWRVcGdyYWRlcztcbiAgICB9XG59XG5Tb2NrZXQucHJvdG9jb2wgPSBwcm90b2NvbDtcbiIsImltcG9ydCB7IHBhcnNlIH0gZnJvbSBcImVuZ2luZS5pby1jbGllbnRcIjtcbi8qKlxuICogVVJMIHBhcnNlci5cbiAqXG4gKiBAcGFyYW0gdXJpIC0gdXJsXG4gKiBAcGFyYW0gcGF0aCAtIHRoZSByZXF1ZXN0IHBhdGggb2YgdGhlIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSBsb2MgLSBBbiBvYmplY3QgbWVhbnQgdG8gbWltaWMgd2luZG93LmxvY2F0aW9uLlxuICogICAgICAgIERlZmF1bHRzIHRvIHdpbmRvdy5sb2NhdGlvbi5cbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVybCh1cmksIHBhdGggPSBcIlwiLCBsb2MpIHtcbiAgICBsZXQgb2JqID0gdXJpO1xuICAgIC8vIGRlZmF1bHQgdG8gd2luZG93LmxvY2F0aW9uXG4gICAgbG9jID0gbG9jIHx8ICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgbG9jYXRpb24pO1xuICAgIGlmIChudWxsID09IHVyaSlcbiAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgXCIvL1wiICsgbG9jLmhvc3Q7XG4gICAgLy8gcmVsYXRpdmUgcGF0aCBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiB1cmkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgaWYgKFwiL1wiID09PSB1cmkuY2hhckF0KDApKSB7XG4gICAgICAgICAgICBpZiAoXCIvXCIgPT09IHVyaS5jaGFyQXQoMSkpIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MuaG9zdCArIHVyaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIS9eKGh0dHBzP3x3c3M/KTpcXC9cXC8vLnRlc3QodXJpKSkge1xuICAgICAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBsb2MpIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyBcIi8vXCIgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmkgPSBcImh0dHBzOi8vXCIgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcGFyc2VcbiAgICAgICAgb2JqID0gcGFyc2UodXJpKTtcbiAgICB9XG4gICAgLy8gbWFrZSBzdXJlIHdlIHRyZWF0IGBsb2NhbGhvc3Q6ODBgIGFuZCBgbG9jYWxob3N0YCBlcXVhbGx5XG4gICAgaWYgKCFvYmoucG9ydCkge1xuICAgICAgICBpZiAoL14oaHR0cHx3cykkLy50ZXN0KG9iai5wcm90b2NvbCkpIHtcbiAgICAgICAgICAgIG9iai5wb3J0ID0gXCI4MFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKC9eKGh0dHB8d3MpcyQvLnRlc3Qob2JqLnByb3RvY29sKSkge1xuICAgICAgICAgICAgb2JqLnBvcnQgPSBcIjQ0M1wiO1xuICAgICAgICB9XG4gICAgfVxuICAgIG9iai5wYXRoID0gb2JqLnBhdGggfHwgXCIvXCI7XG4gICAgY29uc3QgaXB2NiA9IG9iai5ob3N0LmluZGV4T2YoXCI6XCIpICE9PSAtMTtcbiAgICBjb25zdCBob3N0ID0gaXB2NiA/IFwiW1wiICsgb2JqLmhvc3QgKyBcIl1cIiA6IG9iai5ob3N0O1xuICAgIC8vIGRlZmluZSB1bmlxdWUgaWRcbiAgICBvYmouaWQgPSBvYmoucHJvdG9jb2wgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgb2JqLnBvcnQgKyBwYXRoO1xuICAgIC8vIGRlZmluZSBocmVmXG4gICAgb2JqLmhyZWYgPVxuICAgICAgICBvYmoucHJvdG9jb2wgK1xuICAgICAgICAgICAgXCI6Ly9cIiArXG4gICAgICAgICAgICBob3N0ICtcbiAgICAgICAgICAgIChsb2MgJiYgbG9jLnBvcnQgPT09IG9iai5wb3J0ID8gXCJcIiA6IFwiOlwiICsgb2JqLnBvcnQpO1xuICAgIHJldHVybiBvYmo7XG59XG4iLCJjb25zdCB3aXRoTmF0aXZlQXJyYXlCdWZmZXIgPSB0eXBlb2YgQXJyYXlCdWZmZXIgPT09IFwiZnVuY3Rpb25cIjtcbmNvbnN0IGlzVmlldyA9IChvYmopID0+IHtcbiAgICByZXR1cm4gdHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gQXJyYXlCdWZmZXIuaXNWaWV3KG9iailcbiAgICAgICAgOiBvYmouYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXI7XG59O1xuY29uc3QgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuY29uc3Qgd2l0aE5hdGl2ZUJsb2IgPSB0eXBlb2YgQmxvYiA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgKHR5cGVvZiBCbG9iICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHRvU3RyaW5nLmNhbGwoQmxvYikgPT09IFwiW29iamVjdCBCbG9iQ29uc3RydWN0b3JdXCIpO1xuY29uc3Qgd2l0aE5hdGl2ZUZpbGUgPSB0eXBlb2YgRmlsZSA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgKHR5cGVvZiBGaWxlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHRvU3RyaW5nLmNhbGwoRmlsZSkgPT09IFwiW29iamVjdCBGaWxlQ29uc3RydWN0b3JdXCIpO1xuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgb2JqIGlzIGEgQnVmZmVyLCBhbiBBcnJheUJ1ZmZlciwgYSBCbG9iIG9yIGEgRmlsZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNCaW5hcnkob2JqKSB7XG4gICAgcmV0dXJuICgod2l0aE5hdGl2ZUFycmF5QnVmZmVyICYmIChvYmogaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciB8fCBpc1ZpZXcob2JqKSkpIHx8XG4gICAgICAgICh3aXRoTmF0aXZlQmxvYiAmJiBvYmogaW5zdGFuY2VvZiBCbG9iKSB8fFxuICAgICAgICAod2l0aE5hdGl2ZUZpbGUgJiYgb2JqIGluc3RhbmNlb2YgRmlsZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGhhc0JpbmFyeShvYmosIHRvSlNPTikge1xuICAgIGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKGhhc0JpbmFyeShvYmpbaV0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXNCaW5hcnkob2JqKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG9iai50b0pTT04gJiZcbiAgICAgICAgdHlwZW9mIG9iai50b0pTT04gPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgICBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBoYXNCaW5hcnkob2JqLnRvSlNPTigpLCB0cnVlKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpICYmIGhhc0JpbmFyeShvYmpba2V5XSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbiIsImltcG9ydCB7IGlzQmluYXJ5IH0gZnJvbSBcIi4vaXMtYmluYXJ5LmpzXCI7XG4vKipcbiAqIFJlcGxhY2VzIGV2ZXJ5IEJ1ZmZlciB8IEFycmF5QnVmZmVyIHwgQmxvYiB8IEZpbGUgaW4gcGFja2V0IHdpdGggYSBudW1iZXJlZCBwbGFjZWhvbGRlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0IC0gc29ja2V0LmlvIGV2ZW50IHBhY2tldFxuICogQHJldHVybiB7T2JqZWN0fSB3aXRoIGRlY29uc3RydWN0ZWQgcGFja2V0IGFuZCBsaXN0IG9mIGJ1ZmZlcnNcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY29uc3RydWN0UGFja2V0KHBhY2tldCkge1xuICAgIGNvbnN0IGJ1ZmZlcnMgPSBbXTtcbiAgICBjb25zdCBwYWNrZXREYXRhID0gcGFja2V0LmRhdGE7XG4gICAgY29uc3QgcGFjayA9IHBhY2tldDtcbiAgICBwYWNrLmRhdGEgPSBfZGVjb25zdHJ1Y3RQYWNrZXQocGFja2V0RGF0YSwgYnVmZmVycyk7XG4gICAgcGFjay5hdHRhY2htZW50cyA9IGJ1ZmZlcnMubGVuZ3RoOyAvLyBudW1iZXIgb2YgYmluYXJ5ICdhdHRhY2htZW50cydcbiAgICByZXR1cm4geyBwYWNrZXQ6IHBhY2ssIGJ1ZmZlcnM6IGJ1ZmZlcnMgfTtcbn1cbmZ1bmN0aW9uIF9kZWNvbnN0cnVjdFBhY2tldChkYXRhLCBidWZmZXJzKSB7XG4gICAgaWYgKCFkYXRhKVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICBpZiAoaXNCaW5hcnkoZGF0YSkpIHtcbiAgICAgICAgY29uc3QgcGxhY2Vob2xkZXIgPSB7IF9wbGFjZWhvbGRlcjogdHJ1ZSwgbnVtOiBidWZmZXJzLmxlbmd0aCB9O1xuICAgICAgICBidWZmZXJzLnB1c2goZGF0YSk7XG4gICAgICAgIHJldHVybiBwbGFjZWhvbGRlcjtcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBjb25zdCBuZXdEYXRhID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBuZXdEYXRhW2ldID0gX2RlY29uc3RydWN0UGFja2V0KGRhdGFbaV0sIGJ1ZmZlcnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJvYmplY3RcIiAmJiAhKGRhdGEgaW5zdGFuY2VvZiBEYXRlKSkge1xuICAgICAgICBjb25zdCBuZXdEYXRhID0ge307XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgIG5ld0RhdGFba2V5XSA9IF9kZWNvbnN0cnVjdFBhY2tldChkYXRhW2tleV0sIGJ1ZmZlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdEYXRhO1xuICAgIH1cbiAgICByZXR1cm4gZGF0YTtcbn1cbi8qKlxuICogUmVjb25zdHJ1Y3RzIGEgYmluYXJ5IHBhY2tldCBmcm9tIGl0cyBwbGFjZWhvbGRlciBwYWNrZXQgYW5kIGJ1ZmZlcnNcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0IC0gZXZlbnQgcGFja2V0IHdpdGggcGxhY2Vob2xkZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBidWZmZXJzIC0gYmluYXJ5IGJ1ZmZlcnMgdG8gcHV0IGluIHBsYWNlaG9sZGVyIHBvc2l0aW9uc1xuICogQHJldHVybiB7T2JqZWN0fSByZWNvbnN0cnVjdGVkIHBhY2tldFxuICogQHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25zdHJ1Y3RQYWNrZXQocGFja2V0LCBidWZmZXJzKSB7XG4gICAgcGFja2V0LmRhdGEgPSBfcmVjb25zdHJ1Y3RQYWNrZXQocGFja2V0LmRhdGEsIGJ1ZmZlcnMpO1xuICAgIGRlbGV0ZSBwYWNrZXQuYXR0YWNobWVudHM7IC8vIG5vIGxvbmdlciB1c2VmdWxcbiAgICByZXR1cm4gcGFja2V0O1xufVxuZnVuY3Rpb24gX3JlY29uc3RydWN0UGFja2V0KGRhdGEsIGJ1ZmZlcnMpIHtcbiAgICBpZiAoIWRhdGEpXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIGlmIChkYXRhICYmIGRhdGEuX3BsYWNlaG9sZGVyID09PSB0cnVlKSB7XG4gICAgICAgIGNvbnN0IGlzSW5kZXhWYWxpZCA9IHR5cGVvZiBkYXRhLm51bSA9PT0gXCJudW1iZXJcIiAmJlxuICAgICAgICAgICAgZGF0YS5udW0gPj0gMCAmJlxuICAgICAgICAgICAgZGF0YS5udW0gPCBidWZmZXJzLmxlbmd0aDtcbiAgICAgICAgaWYgKGlzSW5kZXhWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcnNbZGF0YS5udW1dOyAvLyBhcHByb3ByaWF0ZSBidWZmZXIgKHNob3VsZCBiZSBuYXR1cmFsIG9yZGVyIGFueXdheSlcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgYXR0YWNobWVudHNcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFbaV0gPSBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtpXSwgYnVmZmVycyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgZGF0YVtrZXldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFba2V5XSwgYnVmZmVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59XG4iLCJpbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGRlY29uc3RydWN0UGFja2V0LCByZWNvbnN0cnVjdFBhY2tldCB9IGZyb20gXCIuL2JpbmFyeS5qc1wiO1xuaW1wb3J0IHsgaXNCaW5hcnksIGhhc0JpbmFyeSB9IGZyb20gXCIuL2lzLWJpbmFyeS5qc1wiO1xuLyoqXG4gKiBUaGVzZSBzdHJpbmdzIG11c3Qgbm90IGJlIHVzZWQgYXMgZXZlbnQgbmFtZXMsIGFzIHRoZXkgaGF2ZSBhIHNwZWNpYWwgbWVhbmluZy5cbiAqL1xuY29uc3QgUkVTRVJWRURfRVZFTlRTID0gW1xuICAgIFwiY29ubmVjdFwiLFxuICAgIFwiY29ubmVjdF9lcnJvclwiLFxuICAgIFwiZGlzY29ubmVjdFwiLFxuICAgIFwiZGlzY29ubmVjdGluZ1wiLFxuICAgIFwibmV3TGlzdGVuZXJcIixcbiAgICBcInJlbW92ZUxpc3RlbmVyXCIsIC8vIHVzZWQgYnkgdGhlIE5vZGUuanMgRXZlbnRFbWl0dGVyXG5dO1xuLyoqXG4gKiBQcm90b2NvbCB2ZXJzaW9uLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGNvbnN0IHByb3RvY29sID0gNTtcbmV4cG9ydCB2YXIgUGFja2V0VHlwZTtcbihmdW5jdGlvbiAoUGFja2V0VHlwZSkge1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkNPTk5FQ1RcIl0gPSAwXSA9IFwiQ09OTkVDVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkRJU0NPTk5FQ1RcIl0gPSAxXSA9IFwiRElTQ09OTkVDVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkVWRU5UXCJdID0gMl0gPSBcIkVWRU5UXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQUNLXCJdID0gM10gPSBcIkFDS1wiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkNPTk5FQ1RfRVJST1JcIl0gPSA0XSA9IFwiQ09OTkVDVF9FUlJPUlwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkJJTkFSWV9FVkVOVFwiXSA9IDVdID0gXCJCSU5BUllfRVZFTlRcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJCSU5BUllfQUNLXCJdID0gNl0gPSBcIkJJTkFSWV9BQ0tcIjtcbn0pKFBhY2tldFR5cGUgfHwgKFBhY2tldFR5cGUgPSB7fSkpO1xuLyoqXG4gKiBBIHNvY2tldC5pbyBFbmNvZGVyIGluc3RhbmNlXG4gKi9cbmV4cG9ydCBjbGFzcyBFbmNvZGVyIHtcbiAgICAvKipcbiAgICAgKiBFbmNvZGVyIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXBsYWNlciAtIGN1c3RvbSByZXBsYWNlciB0byBwYXNzIGRvd24gdG8gSlNPTi5wYXJzZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHJlcGxhY2VyKSB7XG4gICAgICAgIHRoaXMucmVwbGFjZXIgPSByZXBsYWNlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIGEgcGFja2V0IGFzIGEgc2luZ2xlIHN0cmluZyBpZiBub24tYmluYXJ5LCBvciBhcyBhXG4gICAgICogYnVmZmVyIHNlcXVlbmNlLCBkZXBlbmRpbmcgb24gcGFja2V0IHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gcGFja2V0IG9iamVjdFxuICAgICAqL1xuICAgIGVuY29kZShvYmopIHtcbiAgICAgICAgaWYgKG9iai50eXBlID09PSBQYWNrZXRUeXBlLkVWRU5UIHx8IG9iai50eXBlID09PSBQYWNrZXRUeXBlLkFDSykge1xuICAgICAgICAgICAgaWYgKGhhc0JpbmFyeShvYmopKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW5jb2RlQXNCaW5hcnkoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5FVkVOVFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVFxuICAgICAgICAgICAgICAgICAgICAgICAgOiBQYWNrZXRUeXBlLkJJTkFSWV9BQ0ssXG4gICAgICAgICAgICAgICAgICAgIG5zcDogb2JqLm5zcCxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogb2JqLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBvYmouaWQsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt0aGlzLmVuY29kZUFzU3RyaW5nKG9iaildO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgcGFja2V0IGFzIHN0cmluZy5cbiAgICAgKi9cbiAgICBlbmNvZGVBc1N0cmluZyhvYmopIHtcbiAgICAgICAgLy8gZmlyc3QgaXMgdHlwZVxuICAgICAgICBsZXQgc3RyID0gXCJcIiArIG9iai50eXBlO1xuICAgICAgICAvLyBhdHRhY2htZW50cyBpZiB3ZSBoYXZlIHRoZW1cbiAgICAgICAgaWYgKG9iai50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVCB8fFxuICAgICAgICAgICAgb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgc3RyICs9IG9iai5hdHRhY2htZW50cyArIFwiLVwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGlmIHdlIGhhdmUgYSBuYW1lc3BhY2Ugb3RoZXIgdGhhbiBgL2BcbiAgICAgICAgLy8gd2UgYXBwZW5kIGl0IGZvbGxvd2VkIGJ5IGEgY29tbWEgYCxgXG4gICAgICAgIGlmIChvYmoubnNwICYmIFwiL1wiICE9PSBvYmoubnNwKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLm5zcCArIFwiLFwiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IHRoZSBpZFxuICAgICAgICBpZiAobnVsbCAhPSBvYmouaWQpIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmouaWQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8ganNvbiBkYXRhXG4gICAgICAgIGlmIChudWxsICE9IG9iai5kYXRhKSB7XG4gICAgICAgICAgICBzdHIgKz0gSlNPTi5zdHJpbmdpZnkob2JqLmRhdGEsIHRoaXMucmVwbGFjZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBwYWNrZXQgYXMgJ2J1ZmZlciBzZXF1ZW5jZScgYnkgcmVtb3ZpbmcgYmxvYnMsIGFuZFxuICAgICAqIGRlY29uc3RydWN0aW5nIHBhY2tldCBpbnRvIG9iamVjdCB3aXRoIHBsYWNlaG9sZGVycyBhbmRcbiAgICAgKiBhIGxpc3Qgb2YgYnVmZmVycy5cbiAgICAgKi9cbiAgICBlbmNvZGVBc0JpbmFyeShvYmopIHtcbiAgICAgICAgY29uc3QgZGVjb25zdHJ1Y3Rpb24gPSBkZWNvbnN0cnVjdFBhY2tldChvYmopO1xuICAgICAgICBjb25zdCBwYWNrID0gdGhpcy5lbmNvZGVBc1N0cmluZyhkZWNvbnN0cnVjdGlvbi5wYWNrZXQpO1xuICAgICAgICBjb25zdCBidWZmZXJzID0gZGVjb25zdHJ1Y3Rpb24uYnVmZmVycztcbiAgICAgICAgYnVmZmVycy51bnNoaWZ0KHBhY2spOyAvLyBhZGQgcGFja2V0IGluZm8gdG8gYmVnaW5uaW5nIG9mIGRhdGEgbGlzdFxuICAgICAgICByZXR1cm4gYnVmZmVyczsgLy8gd3JpdGUgYWxsIHRoZSBidWZmZXJzXG4gICAgfVxufVxuLy8gc2VlIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzg1MTEyODEvY2hlY2staWYtYS12YWx1ZS1pcy1hbi1vYmplY3QtaW4tamF2YXNjcmlwdFxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIjtcbn1cbi8qKlxuICogQSBzb2NrZXQuaW8gRGVjb2RlciBpbnN0YW5jZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gZGVjb2RlclxuICovXG5leHBvcnQgY2xhc3MgRGVjb2RlciBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIERlY29kZXIgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJldml2ZXIgLSBjdXN0b20gcmV2aXZlciB0byBwYXNzIGRvd24gdG8gSlNPTi5zdHJpbmdpZnlcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihyZXZpdmVyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucmV2aXZlciA9IHJldml2ZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYW4gZW5jb2RlZCBwYWNrZXQgc3RyaW5nIGludG8gcGFja2V0IEpTT04uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb2JqIC0gZW5jb2RlZCBwYWNrZXRcbiAgICAgKi9cbiAgICBhZGQob2JqKSB7XG4gICAgICAgIGxldCBwYWNrZXQ7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ290IHBsYWludGV4dCBkYXRhIHdoZW4gcmVjb25zdHJ1Y3RpbmcgYSBwYWNrZXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWNrZXQgPSB0aGlzLmRlY29kZVN0cmluZyhvYmopO1xuICAgICAgICAgICAgY29uc3QgaXNCaW5hcnlFdmVudCA9IHBhY2tldC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDtcbiAgICAgICAgICAgIGlmIChpc0JpbmFyeUV2ZW50IHx8IHBhY2tldC50eXBlID09PSBQYWNrZXRUeXBlLkJJTkFSWV9BQ0spIHtcbiAgICAgICAgICAgICAgICBwYWNrZXQudHlwZSA9IGlzQmluYXJ5RXZlbnQgPyBQYWNrZXRUeXBlLkVWRU5UIDogUGFja2V0VHlwZS5BQ0s7XG4gICAgICAgICAgICAgICAgLy8gYmluYXJ5IHBhY2tldCdzIGpzb25cbiAgICAgICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBuZXcgQmluYXJ5UmVjb25zdHJ1Y3RvcihwYWNrZXQpO1xuICAgICAgICAgICAgICAgIC8vIG5vIGF0dGFjaG1lbnRzLCBsYWJlbGVkIGJpbmFyeSBidXQgbm8gYmluYXJ5IGRhdGEgdG8gZm9sbG93XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC5hdHRhY2htZW50cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbm9uLWJpbmFyeSBmdWxsIHBhY2tldFxuICAgICAgICAgICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImRlY29kZWRcIiwgcGFja2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0JpbmFyeShvYmopIHx8IG9iai5iYXNlNjQpIHtcbiAgICAgICAgICAgIC8vIHJhdyBiaW5hcnkgZGF0YVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJnb3QgYmluYXJ5IGRhdGEgd2hlbiBub3QgcmVjb25zdHJ1Y3RpbmcgYSBwYWNrZXRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYWNrZXQgPSB0aGlzLnJlY29uc3RydWN0b3IudGFrZUJpbmFyeURhdGEob2JqKTtcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlY2VpdmVkIGZpbmFsIGJ1ZmZlclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlOiBcIiArIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVjb2RlIGEgcGFja2V0IFN0cmluZyAoSlNPTiBkYXRhKVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICAgICAqIEByZXR1cm4ge09iamVjdH0gcGFja2V0XG4gICAgICovXG4gICAgZGVjb2RlU3RyaW5nKHN0cikge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIC8vIGxvb2sgdXAgdHlwZVxuICAgICAgICBjb25zdCBwID0ge1xuICAgICAgICAgICAgdHlwZTogTnVtYmVyKHN0ci5jaGFyQXQoMCkpLFxuICAgICAgICB9O1xuICAgICAgICBpZiAoUGFja2V0VHlwZVtwLnR5cGVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gcGFja2V0IHR5cGUgXCIgKyBwLnR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgYXR0YWNobWVudHMgaWYgdHlwZSBiaW5hcnlcbiAgICAgICAgaWYgKHAudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfRVZFTlQgfHxcbiAgICAgICAgICAgIHAudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgd2hpbGUgKHN0ci5jaGFyQXQoKytpKSAhPT0gXCItXCIgJiYgaSAhPSBzdHIubGVuZ3RoKSB7IH1cbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkpO1xuICAgICAgICAgICAgaWYgKGJ1ZiAhPSBOdW1iZXIoYnVmKSB8fCBzdHIuY2hhckF0KGkpICE9PSBcIi1cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIklsbGVnYWwgYXR0YWNobWVudHNcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLmF0dGFjaG1lbnRzID0gTnVtYmVyKGJ1Zik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBuYW1lc3BhY2UgKGlmIGFueSlcbiAgICAgICAgaWYgKFwiL1wiID09PSBzdHIuY2hhckF0KGkgKyAxKSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlICgrK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAoXCIsXCIgPT09IGMpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGlmIChpID09PSBzdHIubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAubnNwID0gc3RyLnN1YnN0cmluZyhzdGFydCwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwLm5zcCA9IFwiL1wiO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgaWRcbiAgICAgICAgY29uc3QgbmV4dCA9IHN0ci5jaGFyQXQoaSArIDEpO1xuICAgICAgICBpZiAoXCJcIiAhPT0gbmV4dCAmJiBOdW1iZXIobmV4dCkgPT0gbmV4dCkge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlICgrK2kpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjID0gc3RyLmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBpZiAobnVsbCA9PSBjIHx8IE51bWJlcihjKSAhPSBjKSB7XG4gICAgICAgICAgICAgICAgICAgIC0taTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpID09PSBzdHIubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHAuaWQgPSBOdW1iZXIoc3RyLnN1YnN0cmluZyhzdGFydCwgaSArIDEpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGpzb24gZGF0YVxuICAgICAgICBpZiAoc3RyLmNoYXJBdCgrK2kpKSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0gdGhpcy50cnlQYXJzZShzdHIuc3Vic3RyKGkpKTtcbiAgICAgICAgICAgIGlmIChEZWNvZGVyLmlzUGF5bG9hZFZhbGlkKHAudHlwZSwgcGF5bG9hZCkpIHtcbiAgICAgICAgICAgICAgICBwLmRhdGEgPSBwYXlsb2FkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBwYXlsb2FkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cbiAgICB0cnlQYXJzZShzdHIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHN0ciwgdGhpcy5yZXZpdmVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBpc1BheWxvYWRWYWxpZCh0eXBlLCBwYXlsb2FkKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzT2JqZWN0KHBheWxvYWQpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkRJU0NPTk5FQ1Q6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBheWxvYWQgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUX0VSUk9SOlxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIiB8fCBpc09iamVjdChwYXlsb2FkKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5FVkVOVDpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfRVZFTlQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIChBcnJheS5pc0FycmF5KHBheWxvYWQpICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcGF5bG9hZFswXSA9PT0gXCJudW1iZXJcIiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBwYXlsb2FkWzBdID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgUkVTRVJWRURfRVZFTlRTLmluZGV4T2YocGF5bG9hZFswXSkgPT09IC0xKSkpO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkFDSzpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfQUNLOlxuICAgICAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KHBheWxvYWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlYWxsb2NhdGVzIGEgcGFyc2VyJ3MgcmVzb3VyY2VzXG4gICAgICovXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yLmZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKTtcbiAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3RvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59XG4vKipcbiAqIEEgbWFuYWdlciBvZiBhIGJpbmFyeSBldmVudCdzICdidWZmZXIgc2VxdWVuY2UnLiBTaG91bGRcbiAqIGJlIGNvbnN0cnVjdGVkIHdoZW5ldmVyIGEgcGFja2V0IG9mIHR5cGUgQklOQVJZX0VWRU5UIGlzXG4gKiBkZWNvZGVkLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXRcbiAqIEByZXR1cm4ge0JpbmFyeVJlY29uc3RydWN0b3J9IGluaXRpYWxpemVkIHJlY29uc3RydWN0b3JcbiAqL1xuY2xhc3MgQmluYXJ5UmVjb25zdHJ1Y3RvciB7XG4gICAgY29uc3RydWN0b3IocGFja2V0KSB7XG4gICAgICAgIHRoaXMucGFja2V0ID0gcGFja2V0O1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5yZWNvblBhY2sgPSBwYWNrZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiBiaW5hcnkgZGF0YSByZWNlaXZlZCBmcm9tIGNvbm5lY3Rpb25cbiAgICAgKiBhZnRlciBhIEJJTkFSWV9FVkVOVCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0J1ZmZlciB8IEFycmF5QnVmZmVyfSBiaW5EYXRhIC0gdGhlIHJhdyBiaW5hcnkgZGF0YSByZWNlaXZlZFxuICAgICAqIEByZXR1cm4ge251bGwgfCBPYmplY3R9IHJldHVybnMgbnVsbCBpZiBtb3JlIGJpbmFyeSBkYXRhIGlzIGV4cGVjdGVkIG9yXG4gICAgICogICBhIHJlY29uc3RydWN0ZWQgcGFja2V0IG9iamVjdCBpZiBhbGwgYnVmZmVycyBoYXZlIGJlZW4gcmVjZWl2ZWQuXG4gICAgICovXG4gICAgdGFrZUJpbmFyeURhdGEoYmluRGF0YSkge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMucHVzaChiaW5EYXRhKTtcbiAgICAgICAgaWYgKHRoaXMuYnVmZmVycy5sZW5ndGggPT09IHRoaXMucmVjb25QYWNrLmF0dGFjaG1lbnRzKSB7XG4gICAgICAgICAgICAvLyBkb25lIHdpdGggYnVmZmVyIGxpc3RcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHJlY29uc3RydWN0UGFja2V0KHRoaXMucmVjb25QYWNrLCB0aGlzLmJ1ZmZlcnMpO1xuICAgICAgICAgICAgdGhpcy5maW5pc2hlZFJlY29uc3RydWN0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm4gcGFja2V0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbnMgdXAgYmluYXJ5IHBhY2tldCByZWNvbnN0cnVjdGlvbiB2YXJpYWJsZXMuXG4gICAgICovXG4gICAgZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZWNvblBhY2sgPSBudWxsO1xuICAgICAgICB0aGlzLmJ1ZmZlcnMgPSBbXTtcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gb24ob2JqLCBldiwgZm4pIHtcbiAgICBvYmoub24oZXYsIGZuKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gc3ViRGVzdHJveSgpIHtcbiAgICAgICAgb2JqLm9mZihldiwgZm4pO1xuICAgIH07XG59XG4iLCJpbXBvcnQgeyBQYWNrZXRUeXBlIH0gZnJvbSBcInNvY2tldC5pby1wYXJzZXJcIjtcbmltcG9ydCB7IG9uIH0gZnJvbSBcIi4vb24uanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIsIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbi8qKlxuICogSW50ZXJuYWwgZXZlbnRzLlxuICogVGhlc2UgZXZlbnRzIGNhbid0IGJlIGVtaXR0ZWQgYnkgdGhlIHVzZXIuXG4gKi9cbmNvbnN0IFJFU0VSVkVEX0VWRU5UUyA9IE9iamVjdC5mcmVlemUoe1xuICAgIGNvbm5lY3Q6IDEsXG4gICAgY29ubmVjdF9lcnJvcjogMSxcbiAgICBkaXNjb25uZWN0OiAxLFxuICAgIGRpc2Nvbm5lY3Rpbmc6IDEsXG4gICAgLy8gRXZlbnRFbWl0dGVyIHJlc2VydmVkIGV2ZW50czogaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9ldmVudHMuaHRtbCNldmVudHNfZXZlbnRfbmV3bGlzdGVuZXJcbiAgICBuZXdMaXN0ZW5lcjogMSxcbiAgICByZW1vdmVMaXN0ZW5lcjogMSxcbn0pO1xuLyoqXG4gKiBBIFNvY2tldCBpcyB0aGUgZnVuZGFtZW50YWwgY2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggdGhlIHNlcnZlci5cbiAqXG4gKiBBIFNvY2tldCBiZWxvbmdzIHRvIGEgY2VydGFpbiBOYW1lc3BhY2UgKGJ5IGRlZmF1bHQgLykgYW5kIHVzZXMgYW4gdW5kZXJseWluZyB7QGxpbmsgTWFuYWdlcn0gdG8gY29tbXVuaWNhdGUuXG4gKlxuICogQGV4YW1wbGVcbiAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gKlxuICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKFwiY29ubmVjdGVkXCIpO1xuICogfSk7XG4gKlxuICogLy8gc2VuZCBhbiBldmVudCB0byB0aGUgc2VydmVyXG4gKiBzb2NrZXQuZW1pdChcImZvb1wiLCBcImJhclwiKTtcbiAqXG4gKiBzb2NrZXQub24oXCJmb29iYXJcIiwgKCkgPT4ge1xuICogICAvLyBhbiBldmVudCB3YXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyXG4gKiB9KTtcbiAqXG4gKiAvLyB1cG9uIGRpc2Nvbm5lY3Rpb25cbiAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICogICBjb25zb2xlLmxvZyhgZGlzY29ubmVjdGVkIGR1ZSB0byAke3JlYXNvbn1gKTtcbiAqIH0pO1xuICovXG5leHBvcnQgY2xhc3MgU29ja2V0IGV4dGVuZHMgRW1pdHRlciB7XG4gICAgLyoqXG4gICAgICogYFNvY2tldGAgY29uc3RydWN0b3IuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaW8sIG5zcCwgb3B0cykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgc29ja2V0IGlzIGN1cnJlbnRseSBjb25uZWN0ZWQgdG8gdGhlIHNlcnZlci5cbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgICAgICpcbiAgICAgICAgICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmNvbm5lY3RlZCk7IC8vIHRydWVcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5jb25uZWN0ZWQpOyAvLyBmYWxzZVxuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBXaGV0aGVyIHRoZSBjb25uZWN0aW9uIHN0YXRlIHdhcyByZWNvdmVyZWQgYWZ0ZXIgYSB0ZW1wb3JhcnkgZGlzY29ubmVjdGlvbi4gSW4gdGhhdCBjYXNlLCBhbnkgbWlzc2VkIHBhY2tldHMgd2lsbFxuICAgICAgICAgKiBiZSB0cmFuc21pdHRlZCBieSB0aGUgc2VydmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWNvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJ1ZmZlciBmb3IgcGFja2V0cyByZWNlaXZlZCBiZWZvcmUgdGhlIENPTk5FQ1QgcGFja2V0XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEJ1ZmZlciBmb3IgcGFja2V0cyB0aGF0IHdpbGwgYmUgc2VudCBvbmNlIHRoZSBzb2NrZXQgaXMgY29ubmVjdGVkXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIgPSBbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBxdWV1ZSBvZiBwYWNrZXRzIHRvIGJlIHNlbnQgd2l0aCByZXRyeSBpbiBjYXNlIG9mIGZhaWx1cmUuXG4gICAgICAgICAqXG4gICAgICAgICAqIFBhY2tldHMgYXJlIHNlbnQgb25lIGJ5IG9uZSwgZWFjaCB3YWl0aW5nIGZvciB0aGUgc2VydmVyIGFja25vd2xlZGdlbWVudCwgaW4gb3JkZXIgdG8gZ3VhcmFudGVlIHRoZSBkZWxpdmVyeSBvcmRlci5cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHNlcXVlbmNlIHRvIGdlbmVyYXRlIHRoZSBJRCBvZiB0aGUge0BsaW5rIFF1ZXVlZFBhY2tldH0uXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9xdWV1ZVNlcSA9IDA7XG4gICAgICAgIHRoaXMuaWRzID0gMDtcbiAgICAgICAgdGhpcy5hY2tzID0ge307XG4gICAgICAgIHRoaXMuZmxhZ3MgPSB7fTtcbiAgICAgICAgdGhpcy5pbyA9IGlvO1xuICAgICAgICB0aGlzLm5zcCA9IG5zcDtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5hdXRoKSB7XG4gICAgICAgICAgICB0aGlzLmF1dGggPSBvcHRzLmF1dGg7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdHMpO1xuICAgICAgICBpZiAodGhpcy5pby5fYXV0b0Nvbm5lY3QpXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgc29ja2V0IGlzIGN1cnJlbnRseSBkaXNjb25uZWN0ZWRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmRpc2Nvbm5lY3RlZCk7IC8vIGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsICgpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5kaXNjb25uZWN0ZWQpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZ2V0IGRpc2Nvbm5lY3RlZCgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmNvbm5lY3RlZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3Vic2NyaWJlIHRvIG9wZW4sIGNsb3NlIGFuZCBwYWNrZXQgZXZlbnRzXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN1YkV2ZW50cygpIHtcbiAgICAgICAgaWYgKHRoaXMuc3VicylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgaW8gPSB0aGlzLmlvO1xuICAgICAgICB0aGlzLnN1YnMgPSBbXG4gICAgICAgICAgICBvbihpbywgXCJvcGVuXCIsIHRoaXMub25vcGVuLmJpbmQodGhpcykpLFxuICAgICAgICAgICAgb24oaW8sIFwicGFja2V0XCIsIHRoaXMub25wYWNrZXQuYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJlcnJvclwiLCB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJjbG9zZVwiLCB0aGlzLm9uY2xvc2UuYmluZCh0aGlzKSksXG4gICAgICAgIF07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIFNvY2tldCB3aWxsIHRyeSB0byByZWNvbm5lY3Qgd2hlbiBpdHMgTWFuYWdlciBjb25uZWN0cyBvciByZWNvbm5lY3RzLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIHRydWVcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICAgICAqICAgaWYgKHJlYXNvbiA9PT0gXCJpbyBzZXJ2ZXIgZGlzY29ubmVjdFwiKSB7XG4gICAgICogICAgIC8vIHRoZSBkaXNjb25uZWN0aW9uIHdhcyBpbml0aWF0ZWQgYnkgdGhlIHNlcnZlciwgeW91IG5lZWQgdG8gbWFudWFsbHkgcmVjb25uZWN0XG4gICAgICogICAgIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyBmYWxzZVxuICAgICAqICAgfVxuICAgICAqICAgLy8gZWxzZSB0aGUgc29ja2V0IHdpbGwgYXV0b21hdGljYWxseSB0cnkgdG8gcmVjb25uZWN0XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gdHJ1ZVxuICAgICAqIH0pO1xuICAgICAqL1xuICAgIGdldCBhY3RpdmUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuc3VicztcbiAgICB9XG4gICAgLyoqXG4gICAgICogXCJPcGVuc1wiIHRoZSBzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKHtcbiAgICAgKiAgIGF1dG9Db25uZWN0OiBmYWxzZVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgKi9cbiAgICBjb25uZWN0KCkge1xuICAgICAgICBpZiAodGhpcy5jb25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5zdWJFdmVudHMoKTtcbiAgICAgICAgaWYgKCF0aGlzLmlvW1wiX3JlY29ubmVjdGluZ1wiXSlcbiAgICAgICAgICAgIHRoaXMuaW8ub3BlbigpOyAvLyBlbnN1cmUgb3BlblxuICAgICAgICBpZiAoXCJvcGVuXCIgPT09IHRoaXMuaW8uX3JlYWR5U3RhdGUpXG4gICAgICAgICAgICB0aGlzLm9ub3BlbigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIHtAbGluayBjb25uZWN0KCl9LlxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBgbWVzc2FnZWAgZXZlbnQuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtaW1pY3MgdGhlIFdlYlNvY2tldC5zZW5kKCkgbWV0aG9kLlxuICAgICAqXG4gICAgICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0L3NlbmRcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnNlbmQoXCJoZWxsb1wiKTtcbiAgICAgKlxuICAgICAqIC8vIHRoaXMgaXMgZXF1aXZhbGVudCB0b1xuICAgICAqIHNvY2tldC5lbWl0KFwibWVzc2FnZVwiLCBcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgc2VuZCguLi5hcmdzKSB7XG4gICAgICAgIGFyZ3MudW5zaGlmdChcIm1lc3NhZ2VcIik7XG4gICAgICAgIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRlIGBlbWl0YC5cbiAgICAgKiBJZiB0aGUgZXZlbnQgaXMgaW4gYGV2ZW50c2AsIGl0J3MgZW1pdHRlZCBub3JtYWxseS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqXG4gICAgICogLy8gYWxsIHNlcmlhbGl6YWJsZSBkYXRhc3RydWN0dXJlcyBhcmUgc3VwcG9ydGVkIChubyBuZWVkIHRvIGNhbGwgSlNPTi5zdHJpbmdpZnkpXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCAxLCBcIjJcIiwgeyAzOiBbXCI0XCJdLCA1OiBVaW50OEFycmF5LmZyb20oWzZdKSB9KTtcbiAgICAgKlxuICAgICAqIC8vIHdpdGggYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlclxuICAgICAqIHNvY2tldC5lbWl0KFwiaGVsbG9cIiwgXCJ3b3JsZFwiLCAodmFsKSA9PiB7XG4gICAgICogICAvLyAuLi5cbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGVtaXQoZXYsIC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKFJFU0VSVkVEX0VWRU5UUy5oYXNPd25Qcm9wZXJ0eShldikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCInICsgZXYudG9TdHJpbmcoKSArICdcIiBpcyBhIHJlc2VydmVkIGV2ZW50IG5hbWUnKTtcbiAgICAgICAgfVxuICAgICAgICBhcmdzLnVuc2hpZnQoZXYpO1xuICAgICAgICBpZiAodGhpcy5fb3B0cy5yZXRyaWVzICYmICF0aGlzLmZsYWdzLmZyb21RdWV1ZSAmJiAhdGhpcy5mbGFncy52b2xhdGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkVG9RdWV1ZShhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIHR5cGU6IFBhY2tldFR5cGUuRVZFTlQsXG4gICAgICAgICAgICBkYXRhOiBhcmdzLFxuICAgICAgICB9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucyA9IHt9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucy5jb21wcmVzcyA9IHRoaXMuZmxhZ3MuY29tcHJlc3MgIT09IGZhbHNlO1xuICAgICAgICAvLyBldmVudCBhY2sgY2FsbGJhY2tcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLmlkcysrO1xuICAgICAgICAgICAgY29uc3QgYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyQWNrQ2FsbGJhY2soaWQsIGFjayk7XG4gICAgICAgICAgICBwYWNrZXQuaWQgPSBpZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc1RyYW5zcG9ydFdyaXRhYmxlID0gdGhpcy5pby5lbmdpbmUgJiZcbiAgICAgICAgICAgIHRoaXMuaW8uZW5naW5lLnRyYW5zcG9ydCAmJlxuICAgICAgICAgICAgdGhpcy5pby5lbmdpbmUudHJhbnNwb3J0LndyaXRhYmxlO1xuICAgICAgICBjb25zdCBkaXNjYXJkUGFja2V0ID0gdGhpcy5mbGFncy52b2xhdGlsZSAmJiAoIWlzVHJhbnNwb3J0V3JpdGFibGUgfHwgIXRoaXMuY29ubmVjdGVkKTtcbiAgICAgICAgaWYgKGRpc2NhcmRQYWNrZXQpIHtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5ub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpO1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQocGFja2V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZEJ1ZmZlci5wdXNoKHBhY2tldCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVnaXN0ZXJBY2tDYWxsYmFjayhpZCwgYWNrKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IChfYSA9IHRoaXMuZmxhZ3MudGltZW91dCkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogdGhpcy5fb3B0cy5hY2tUaW1lb3V0O1xuICAgICAgICBpZiAodGltZW91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmFja3NbaWRdID0gYWNrO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLmlvLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hY2tzW2lkXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZW5kQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VuZEJ1ZmZlcltpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQnVmZmVyLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY2suY2FsbCh0aGlzLCBuZXcgRXJyb3IoXCJvcGVyYXRpb24gaGFzIHRpbWVkIG91dFwiKSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB0aGlzLmFja3NbaWRdID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHRoaXMuaW8uY2xlYXJUaW1lb3V0Rm4odGltZXIpO1xuICAgICAgICAgICAgYWNrLmFwcGx5KHRoaXMsIFtudWxsLCAuLi5hcmdzXSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVtaXRzIGFuIGV2ZW50IGFuZCB3YWl0cyBmb3IgYW4gYWNrbm93bGVkZ2VtZW50XG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIHdpdGhvdXQgdGltZW91dFxuICAgICAqIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc29ja2V0LmVtaXRXaXRoQWNrKFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTtcbiAgICAgKlxuICAgICAqIC8vIHdpdGggYSBzcGVjaWZpYyB0aW1lb3V0XG4gICAgICogdHJ5IHtcbiAgICAgKiAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc29ja2V0LnRpbWVvdXQoMTAwMCkuZW1pdFdpdGhBY2soXCJoZWxsb1wiLCBcIndvcmxkXCIpO1xuICAgICAqIH0gY2F0Y2ggKGVycikge1xuICAgICAqICAgLy8gdGhlIHNlcnZlciBkaWQgbm90IGFja25vd2xlZGdlIHRoZSBldmVudCBpbiB0aGUgZ2l2ZW4gZGVsYXlcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIGEgUHJvbWlzZSB0aGF0IHdpbGwgYmUgZnVsZmlsbGVkIHdoZW4gdGhlIHNlcnZlciBhY2tub3dsZWRnZXMgdGhlIGV2ZW50XG4gICAgICovXG4gICAgZW1pdFdpdGhBY2soZXYsIC4uLmFyZ3MpIHtcbiAgICAgICAgLy8gdGhlIHRpbWVvdXQgZmxhZyBpcyBvcHRpb25hbFxuICAgICAgICBjb25zdCB3aXRoRXJyID0gdGhpcy5mbGFncy50aW1lb3V0ICE9PSB1bmRlZmluZWQgfHwgdGhpcy5fb3B0cy5hY2tUaW1lb3V0ICE9PSB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBhcmdzLnB1c2goKGFyZzEsIGFyZzIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAod2l0aEVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnMSA/IHJlamVjdChhcmcxKSA6IHJlc29sdmUoYXJnMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShhcmcxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZW1pdChldiwgLi4uYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIHBhY2tldCB0byB0aGUgcXVldWUuXG4gICAgICogQHBhcmFtIGFyZ3NcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9hZGRUb1F1ZXVlKGFyZ3MpIHtcbiAgICAgICAgbGV0IGFjaztcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICAgICAgICBpZDogdGhpcy5fcXVldWVTZXErKyxcbiAgICAgICAgICAgIHRyeUNvdW50OiAwLFxuICAgICAgICAgICAgcGVuZGluZzogZmFsc2UsXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgZmxhZ3M6IE9iamVjdC5hc3NpZ24oeyBmcm9tUXVldWU6IHRydWUgfSwgdGhpcy5mbGFncyksXG4gICAgICAgIH07XG4gICAgICAgIGFyZ3MucHVzaCgoZXJyLCAuLi5yZXNwb25zZUFyZ3MpID0+IHtcbiAgICAgICAgICAgIGlmIChwYWNrZXQgIT09IHRoaXMuX3F1ZXVlWzBdKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhY2tldCBoYXMgYWxyZWFkeSBiZWVuIGFja25vd2xlZGdlZFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhhc0Vycm9yID0gZXJyICE9PSBudWxsO1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC50cnlDb3VudCA+IHRoaXMuX29wdHMucmV0cmllcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGFjaykge1xuICAgICAgICAgICAgICAgICAgICBhY2sobnVsbCwgLi4ucmVzcG9uc2VBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWNrZXQucGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RyYWluUXVldWUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2gocGFja2V0KTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIHRoZSBmaXJzdCBwYWNrZXQgb2YgdGhlIHF1ZXVlLCBhbmQgd2FpdCBmb3IgYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gZm9yY2UgLSB3aGV0aGVyIHRvIHJlc2VuZCBhIHBhY2tldCB0aGF0IGhhcyBub3QgYmVlbiBhY2tub3dsZWRnZWQgeWV0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmFpblF1ZXVlKGZvcmNlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCB8fCB0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB0aGlzLl9xdWV1ZVswXTtcbiAgICAgICAgaWYgKHBhY2tldC5wZW5kaW5nICYmICFmb3JjZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhY2tldC5wZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgcGFja2V0LnRyeUNvdW50Kys7XG4gICAgICAgIHRoaXMuZmxhZ3MgPSBwYWNrZXQuZmxhZ3M7XG4gICAgICAgIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBwYWNrZXQuYXJncyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcGFja2V0KHBhY2tldCkge1xuICAgICAgICBwYWNrZXQubnNwID0gdGhpcy5uc3A7XG4gICAgICAgIHRoaXMuaW8uX3BhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYG9wZW5gLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbm9wZW4oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hdXRoID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5hdXRoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VuZENvbm5lY3RQYWNrZXQoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbmRDb25uZWN0UGFja2V0KHRoaXMuYXV0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBDT05ORUNUIHBhY2tldCB0byBpbml0aWF0ZSB0aGUgU29ja2V0LklPIHNlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NlbmRDb25uZWN0UGFja2V0KGRhdGEpIHtcbiAgICAgICAgdGhpcy5wYWNrZXQoe1xuICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5DT05ORUNULFxuICAgICAgICAgICAgZGF0YTogdGhpcy5fcGlkXG4gICAgICAgICAgICAgICAgPyBPYmplY3QuYXNzaWduKHsgcGlkOiB0aGlzLl9waWQsIG9mZnNldDogdGhpcy5fbGFzdE9mZnNldCB9LCBkYXRhKVxuICAgICAgICAgICAgICAgIDogZGF0YSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBvciBtYW5hZ2VyIGBlcnJvcmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmVycm9yKGVycikge1xuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYGNsb3NlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICBkZWxldGUgdGhpcy5pZDtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkaXNjb25uZWN0XCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBzb2NrZXQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25wYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IHNhbWVOYW1lc3BhY2UgPSBwYWNrZXQubnNwID09PSB0aGlzLm5zcDtcbiAgICAgICAgaWYgKCFzYW1lTmFtZXNwYWNlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVDpcbiAgICAgICAgICAgICAgICBpZiAocGFja2V0LmRhdGEgJiYgcGFja2V0LmRhdGEuc2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25jb25uZWN0KHBhY2tldC5kYXRhLnNpZCwgcGFja2V0LmRhdGEucGlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdF9lcnJvclwiLCBuZXcgRXJyb3IoXCJJdCBzZWVtcyB5b3UgYXJlIHRyeWluZyB0byByZWFjaCBhIFNvY2tldC5JTyBzZXJ2ZXIgaW4gdjIueCB3aXRoIGEgdjMueCBjbGllbnQsIGJ1dCB0aGV5IGFyZSBub3QgY29tcGF0aWJsZSAobW9yZSBpbmZvcm1hdGlvbiBoZXJlOiBodHRwczovL3NvY2tldC5pby9kb2NzL3YzL21pZ3JhdGluZy1mcm9tLTIteC10by0zLTAvKVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkVWRU5UOlxuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkJJTkFSWV9FVkVOVDpcbiAgICAgICAgICAgICAgICB0aGlzLm9uZXZlbnQocGFja2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5BQ0s6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0FDSzpcbiAgICAgICAgICAgICAgICB0aGlzLm9uYWNrKHBhY2tldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRElTQ09OTkVDVDpcbiAgICAgICAgICAgICAgICB0aGlzLm9uZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1RfRVJST1I6XG4gICAgICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKHBhY2tldC5kYXRhLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBlcnIuZGF0YSA9IHBhY2tldC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBzZXJ2ZXIgZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmV2ZW50KHBhY2tldCkge1xuICAgICAgICBjb25zdCBhcmdzID0gcGFja2V0LmRhdGEgfHwgW107XG4gICAgICAgIGlmIChudWxsICE9IHBhY2tldC5pZCkge1xuICAgICAgICAgICAgYXJncy5wdXNoKHRoaXMuYWNrKHBhY2tldC5pZCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0RXZlbnQoYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIucHVzaChPYmplY3QuZnJlZXplKGFyZ3MpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbWl0RXZlbnQoYXJncykge1xuICAgICAgICBpZiAodGhpcy5fYW55TGlzdGVuZXJzICYmIHRoaXMuX2FueUxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycy5zbGljZSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdXBlci5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICBpZiAodGhpcy5fcGlkICYmIGFyZ3MubGVuZ3RoICYmIHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RPZmZzZXQgPSBhcmdzW2FyZ3MubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUHJvZHVjZXMgYW4gYWNrIGNhbGxiYWNrIHRvIGVtaXQgd2l0aCBhbiBldmVudC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYWNrKGlkKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBsZXQgc2VudCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgZG91YmxlIGNhbGxiYWNrc1xuICAgICAgICAgICAgaWYgKHNlbnQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgc2VudCA9IHRydWU7XG4gICAgICAgICAgICBzZWxmLnBhY2tldCh7XG4gICAgICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5BQ0ssXG4gICAgICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgICAgIGRhdGE6IGFyZ3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBzZXJ2ZXIgYWNrbm93bGVnZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmFjayhwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgYWNrID0gdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIGlmIChcImZ1bmN0aW9uXCIgPT09IHR5cGVvZiBhY2spIHtcbiAgICAgICAgICAgIGFjay5hcHBseSh0aGlzLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gc2VydmVyIGNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY29ubmVjdChpZCwgcGlkKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZWNvdmVyZWQgPSBwaWQgJiYgdGhpcy5fcGlkID09PSBwaWQ7XG4gICAgICAgIHRoaXMuX3BpZCA9IHBpZDsgLy8gZGVmaW5lZCBvbmx5IGlmIGNvbm5lY3Rpb24gc3RhdGUgcmVjb3ZlcnkgaXMgZW5hYmxlZFxuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZW1pdEJ1ZmZlcmVkKCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY29ubmVjdFwiKTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSh0cnVlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW1pdCBidWZmZXJlZCBldmVudHMgKHJlY2VpdmVkIGFuZCBlbWl0dGVkKS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZW1pdEJ1ZmZlcmVkKCkge1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIuZm9yRWFjaCgoYXJncykgPT4gdGhpcy5lbWl0RXZlbnQoYXJncykpO1xuICAgICAgICB0aGlzLnJlY2VpdmVCdWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyLmZvckVhY2goKHBhY2tldCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5ub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpO1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQocGFja2V0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc2VuZEJ1ZmZlciA9IFtdO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgZGlzY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kaXNjb25uZWN0KCkge1xuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5vbmNsb3NlKFwiaW8gc2VydmVyIGRpc2Nvbm5lY3RcIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGZvcmNlZCBjbGllbnQvc2VydmVyIHNpZGUgZGlzY29ubmVjdGlvbnMsXG4gICAgICogdGhpcyBtZXRob2QgZW5zdXJlcyB0aGUgbWFuYWdlciBzdG9wcyB0cmFja2luZyB1cyBhbmRcbiAgICAgKiB0aGF0IHJlY29ubmVjdGlvbnMgZG9uJ3QgZ2V0IHRyaWdnZXJlZCBmb3IgdGhpcy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3Vicykge1xuICAgICAgICAgICAgLy8gY2xlYW4gc3Vic2NyaXB0aW9ucyB0byBhdm9pZCByZWNvbm5lY3Rpb25zXG4gICAgICAgICAgICB0aGlzLnN1YnMuZm9yRWFjaCgoc3ViRGVzdHJveSkgPT4gc3ViRGVzdHJveSgpKTtcbiAgICAgICAgICAgIHRoaXMuc3VicyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlvW1wiX2Rlc3Ryb3lcIl0odGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERpc2Nvbm5lY3RzIHRoZSBzb2NrZXQgbWFudWFsbHkuIEluIHRoYXQgY2FzZSwgdGhlIHNvY2tldCB3aWxsIG5vdCB0cnkgdG8gcmVjb25uZWN0LlxuICAgICAqXG4gICAgICogSWYgdGhpcyBpcyB0aGUgbGFzdCBhY3RpdmUgU29ja2V0IGluc3RhbmNlIG9mIHRoZSB7QGxpbmsgTWFuYWdlcn0sIHRoZSBsb3ctbGV2ZWwgY29ubmVjdGlvbiB3aWxsIGJlIGNsb3NlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oKTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKHJlYXNvbikgPT4ge1xuICAgICAqICAgLy8gY29uc29sZS5sb2cocmVhc29uKTsgcHJpbnRzIFwiaW8gY2xpZW50IGRpc2Nvbm5lY3RcIlxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogc29ja2V0LmRpc2Nvbm5lY3QoKTtcbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQoeyB0eXBlOiBQYWNrZXRUeXBlLkRJU0NPTk5FQ1QgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIHNvY2tldCBmcm9tIHBvb2xcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZCkge1xuICAgICAgICAgICAgLy8gZmlyZSBldmVudHNcbiAgICAgICAgICAgIHRoaXMub25jbG9zZShcImlvIGNsaWVudCBkaXNjb25uZWN0XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Ige0BsaW5rIGRpc2Nvbm5lY3QoKX0uXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzY29ubmVjdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBjb21wcmVzcyBmbGFnLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuY29tcHJlc3MoZmFsc2UpLmVtaXQoXCJoZWxsb1wiKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21wcmVzcyAtIGlmIGB0cnVlYCwgY29tcHJlc3NlcyB0aGUgc2VuZGluZyBkYXRhXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgY29tcHJlc3MoY29tcHJlc3MpIHtcbiAgICAgICAgdGhpcy5mbGFncy5jb21wcmVzcyA9IGNvbXByZXNzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIG1vZGlmaWVyIGZvciBhIHN1YnNlcXVlbnQgZXZlbnQgZW1pc3Npb24gdGhhdCB0aGUgZXZlbnQgbWVzc2FnZSB3aWxsIGJlIGRyb3BwZWQgd2hlbiB0aGlzIHNvY2tldCBpcyBub3RcbiAgICAgKiByZWFkeSB0byBzZW5kIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQudm9sYXRpbGUuZW1pdChcImhlbGxvXCIpOyAvLyB0aGUgc2VydmVyIG1heSBvciBtYXkgbm90IHJlY2VpdmUgaXRcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHNlbGZcbiAgICAgKi9cbiAgICBnZXQgdm9sYXRpbGUoKSB7XG4gICAgICAgIHRoaXMuZmxhZ3Mudm9sYXRpbGUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIG1vZGlmaWVyIGZvciBhIHN1YnNlcXVlbnQgZXZlbnQgZW1pc3Npb24gdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBlcnJvciB3aGVuIHRoZVxuICAgICAqIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHdpdGhvdXQgYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlcjpcbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnRpbWVvdXQoNTAwMCkuZW1pdChcIm15LWV2ZW50XCIsIChlcnIpID0+IHtcbiAgICAgKiAgIGlmIChlcnIpIHtcbiAgICAgKiAgICAgLy8gdGhlIHNlcnZlciBkaWQgbm90IGFja25vd2xlZGdlIHRoZSBldmVudCBpbiB0aGUgZ2l2ZW4gZGVsYXlcbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHNlbGZcbiAgICAgKi9cbiAgICB0aW1lb3V0KHRpbWVvdXQpIHtcbiAgICAgICAgdGhpcy5mbGFncy50aW1lb3V0ID0gdGltZW91dDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0Lm9uQW55KChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYGdvdCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb25BbnkobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suIFRoZSBsaXN0ZW5lciBpcyBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5wcmVwZW5kQW55KChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYGdvdCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgcHJlcGVuZEFueShsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBjYXRjaEFsbExpc3RlbmVyID0gKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uQW55KGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gcmVtb3ZlIGEgc3BlY2lmaWMgbGlzdGVuZXJcbiAgICAgKiBzb2NrZXQub2ZmQW55KGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gb3IgcmVtb3ZlIGFsbCBsaXN0ZW5lcnNcbiAgICAgKiBzb2NrZXQub2ZmQW55KCk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvZmZBbnkobGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hbnlMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIgPT09IGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdGhhdCBhcmUgbGlzdGVuaW5nIGZvciBhbnkgZXZlbnQgdGhhdCBpcyBzcGVjaWZpZWQuIFRoaXMgYXJyYXkgY2FuIGJlIG1hbmlwdWxhdGVkLFxuICAgICAqIGUuZy4gdG8gcmVtb3ZlIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBsaXN0ZW5lcnNBbnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay5cbiAgICAgKlxuICAgICAqIE5vdGU6IGFja25vd2xlZGdlbWVudHMgc2VudCB0byB0aGUgc2VydmVyIGFyZSBub3QgaW5jbHVkZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5vbkFueU91dGdvaW5nKChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYHNlbnQgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9uQW55T3V0Z29pbmcobGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuIFRoZSBldmVudCBuYW1lIGlzIHBhc3NlZCBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlXG4gICAgICogY2FsbGJhY2suIFRoZSBsaXN0ZW5lciBpcyBhZGRlZCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaXN0ZW5lcnMgYXJyYXkuXG4gICAgICpcbiAgICAgKiBOb3RlOiBhY2tub3dsZWRnZW1lbnRzIHNlbnQgdG8gdGhlIHNlcnZlciBhcmUgbm90IGluY2x1ZGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQucHJlcGVuZEFueU91dGdvaW5nKChldmVudCwgLi4uYXJncykgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coYHNlbnQgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIHByZXBlbmRBbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy51bnNoaWZ0KGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBjYXRjaEFsbExpc3RlbmVyID0gKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH1cbiAgICAgKlxuICAgICAqIHNvY2tldC5vbkFueU91dGdvaW5nKGNhdGNoQWxsTGlzdGVuZXIpO1xuICAgICAqXG4gICAgICogLy8gcmVtb3ZlIGEgc3BlY2lmaWMgbGlzdGVuZXJcbiAgICAgKiBzb2NrZXQub2ZmQW55T3V0Z29pbmcoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyBvciByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAqIHNvY2tldC5vZmZBbnlPdXRnb2luZygpO1xuICAgICAqXG4gICAgICogQHBhcmFtIFtsaXN0ZW5lcl0gLSB0aGUgY2F0Y2gtYWxsIGxpc3RlbmVyIChvcHRpb25hbClcbiAgICAgKi9cbiAgICBvZmZBbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXIgPT09IGxpc3RlbmVyc1tpXSkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBsaXN0ZW5pbmcgZm9yIGFueSBldmVudCB0aGF0IGlzIHNwZWNpZmllZC4gVGhpcyBhcnJheSBjYW4gYmUgbWFuaXB1bGF0ZWQsXG4gICAgICogZS5nLiB0byByZW1vdmUgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGxpc3RlbmVyc0FueU91dGdvaW5nKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE5vdGlmeSB0aGUgbGlzdGVuZXJzIGZvciBlYWNoIHBhY2tldCBzZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCkge1xuICAgICAgICBpZiAodGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgJiYgdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5zbGljZSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBwYWNrZXQuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvKipcbiAqIEluaXRpYWxpemUgYmFja29mZiB0aW1lciB3aXRoIGBvcHRzYC5cbiAqXG4gKiAtIGBtaW5gIGluaXRpYWwgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgWzEwMF1cbiAqIC0gYG1heGAgbWF4IHRpbWVvdXQgWzEwMDAwXVxuICogLSBgaml0dGVyYCBbMF1cbiAqIC0gYGZhY3RvcmAgWzJdXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAqIEBhcGkgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBCYWNrb2ZmKG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICB0aGlzLm1zID0gb3B0cy5taW4gfHwgMTAwO1xuICAgIHRoaXMubWF4ID0gb3B0cy5tYXggfHwgMTAwMDA7XG4gICAgdGhpcy5mYWN0b3IgPSBvcHRzLmZhY3RvciB8fCAyO1xuICAgIHRoaXMuaml0dGVyID0gb3B0cy5qaXR0ZXIgPiAwICYmIG9wdHMuaml0dGVyIDw9IDEgPyBvcHRzLmppdHRlciA6IDA7XG4gICAgdGhpcy5hdHRlbXB0cyA9IDA7XG59XG4vKipcbiAqIFJldHVybiB0aGUgYmFja29mZiBkdXJhdGlvbi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5kdXJhdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbXMgPSB0aGlzLm1zICogTWF0aC5wb3codGhpcy5mYWN0b3IsIHRoaXMuYXR0ZW1wdHMrKyk7XG4gICAgaWYgKHRoaXMuaml0dGVyKSB7XG4gICAgICAgIHZhciByYW5kID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgdmFyIGRldmlhdGlvbiA9IE1hdGguZmxvb3IocmFuZCAqIHRoaXMuaml0dGVyICogbXMpO1xuICAgICAgICBtcyA9IChNYXRoLmZsb29yKHJhbmQgKiAxMCkgJiAxKSA9PSAwID8gbXMgLSBkZXZpYXRpb24gOiBtcyArIGRldmlhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGgubWluKG1zLCB0aGlzLm1heCkgfCAwO1xufTtcbi8qKlxuICogUmVzZXQgdGhlIG51bWJlciBvZiBhdHRlbXB0cy5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmF0dGVtcHRzID0gMDtcbn07XG4vKipcbiAqIFNldCB0aGUgbWluaW11bSBkdXJhdGlvblxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldE1pbiA9IGZ1bmN0aW9uIChtaW4pIHtcbiAgICB0aGlzLm1zID0gbWluO1xufTtcbi8qKlxuICogU2V0IHRoZSBtYXhpbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0TWF4ID0gZnVuY3Rpb24gKG1heCkge1xuICAgIHRoaXMubWF4ID0gbWF4O1xufTtcbi8qKlxuICogU2V0IHRoZSBqaXR0ZXJcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRKaXR0ZXIgPSBmdW5jdGlvbiAoaml0dGVyKSB7XG4gICAgdGhpcy5qaXR0ZXIgPSBqaXR0ZXI7XG59O1xuIiwiaW1wb3J0IHsgU29ja2V0IGFzIEVuZ2luZSwgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBuZXh0VGljaywgfSBmcm9tIFwiZW5naW5lLmlvLWNsaWVudFwiO1xuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSBcIi4vc29ja2V0LmpzXCI7XG5pbXBvcnQgKiBhcyBwYXJzZXIgZnJvbSBcInNvY2tldC5pby1wYXJzZXJcIjtcbmltcG9ydCB7IG9uIH0gZnJvbSBcIi4vb24uanNcIjtcbmltcG9ydCB7IEJhY2tvZmYgfSBmcm9tIFwiLi9jb250cmliL2JhY2tvMi5qc1wiO1xuaW1wb3J0IHsgRW1pdHRlciwgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuZXhwb3J0IGNsYXNzIE1hbmFnZXIgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3Rvcih1cmksIG9wdHMpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm5zcHMgPSB7fTtcbiAgICAgICAgdGhpcy5zdWJzID0gW107XG4gICAgICAgIGlmICh1cmkgJiYgXCJvYmplY3RcIiA9PT0gdHlwZW9mIHVyaSkge1xuICAgICAgICAgICAgb3B0cyA9IHVyaTtcbiAgICAgICAgICAgIHVyaSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICAgICAgb3B0cy5wYXRoID0gb3B0cy5wYXRoIHx8IFwiL3NvY2tldC5pb1wiO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICBpbnN0YWxsVGltZXJGdW5jdGlvbnModGhpcywgb3B0cyk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uKG9wdHMucmVjb25uZWN0aW9uICE9PSBmYWxzZSk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uQXR0ZW1wdHMob3B0cy5yZWNvbm5lY3Rpb25BdHRlbXB0cyB8fCBJbmZpbml0eSk7XG4gICAgICAgIHRoaXMucmVjb25uZWN0aW9uRGVsYXkob3B0cy5yZWNvbm5lY3Rpb25EZWxheSB8fCAxMDAwKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heChvcHRzLnJlY29ubmVjdGlvbkRlbGF5TWF4IHx8IDUwMDApO1xuICAgICAgICB0aGlzLnJhbmRvbWl6YXRpb25GYWN0b3IoKF9hID0gb3B0cy5yYW5kb21pemF0aW9uRmFjdG9yKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwLjUpO1xuICAgICAgICB0aGlzLmJhY2tvZmYgPSBuZXcgQmFja29mZih7XG4gICAgICAgICAgICBtaW46IHRoaXMucmVjb25uZWN0aW9uRGVsYXkoKSxcbiAgICAgICAgICAgIG1heDogdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heCgpLFxuICAgICAgICAgICAgaml0dGVyOiB0aGlzLnJhbmRvbWl6YXRpb25GYWN0b3IoKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMudGltZW91dChudWxsID09IG9wdHMudGltZW91dCA/IDIwMDAwIDogb3B0cy50aW1lb3V0KTtcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHRoaXMudXJpID0gdXJpO1xuICAgICAgICBjb25zdCBfcGFyc2VyID0gb3B0cy5wYXJzZXIgfHwgcGFyc2VyO1xuICAgICAgICB0aGlzLmVuY29kZXIgPSBuZXcgX3BhcnNlci5FbmNvZGVyKCk7XG4gICAgICAgIHRoaXMuZGVjb2RlciA9IG5ldyBfcGFyc2VyLkRlY29kZXIoKTtcbiAgICAgICAgdGhpcy5fYXV0b0Nvbm5lY3QgPSBvcHRzLmF1dG9Db25uZWN0ICE9PSBmYWxzZTtcbiAgICAgICAgaWYgKHRoaXMuX2F1dG9Db25uZWN0KVxuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbih2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb247XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbiA9ICEhdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbkF0dGVtcHRzKHYpIHtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXkodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXk7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWluKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmFuZG9taXphdGlvbkZhY3Rvcih2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yO1xuICAgICAgICB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0Sml0dGVyKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXlNYXgodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXg7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5TWF4ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWF4KHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGltZW91dCh2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aW1lb3V0O1xuICAgICAgICB0aGlzLl90aW1lb3V0ID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyB0cnlpbmcgdG8gcmVjb25uZWN0IGlmIHJlY29ubmVjdGlvbiBpcyBlbmFibGVkIGFuZCB3ZSBoYXZlIG5vdFxuICAgICAqIHN0YXJ0ZWQgcmVjb25uZWN0aW5nIHlldFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtYXliZVJlY29ubmVjdE9uT3BlbigpIHtcbiAgICAgICAgLy8gT25seSB0cnkgdG8gcmVjb25uZWN0IGlmIGl0J3MgdGhlIGZpcnN0IHRpbWUgd2UncmUgY29ubmVjdGluZ1xuICAgICAgICBpZiAoIXRoaXMuX3JlY29ubmVjdGluZyAmJlxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uICYmXG4gICAgICAgICAgICB0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPT09IDApIHtcbiAgICAgICAgICAgIC8vIGtlZXBzIHJlY29ubmVjdGlvbiBmcm9tIGZpcmluZyB0d2ljZSBmb3IgdGhlIHNhbWUgcmVjb25uZWN0aW9uIGxvb3BcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQgYHNvY2tldGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIG9wdGlvbmFsLCBjYWxsYmFja1xuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBvcGVuKGZuKSB7XG4gICAgICAgIGlmICh+dGhpcy5fcmVhZHlTdGF0ZS5pbmRleE9mKFwib3BlblwiKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBFbmdpbmUodGhpcy51cmksIHRoaXMub3B0cyk7XG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLnNraXBSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgLy8gZW1pdCBgb3BlbmBcbiAgICAgICAgY29uc3Qgb3BlblN1YkRlc3Ryb3kgPSBvbihzb2NrZXQsIFwib3BlblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLm9ub3BlbigpO1xuICAgICAgICAgICAgZm4gJiYgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGVtaXQgYGVycm9yYFxuICAgICAgICBjb25zdCBlcnJvclN1YiA9IG9uKHNvY2tldCwgXCJlcnJvclwiLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBzZWxmLmNsZWFudXAoKTtcbiAgICAgICAgICAgIHNlbGYuX3JlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgZG8gdGhpcyBpZiB0aGVyZSBpcyBubyBmbiB0byBoYW5kbGUgdGhlIGVycm9yXG4gICAgICAgICAgICAgICAgc2VsZi5tYXliZVJlY29ubmVjdE9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZhbHNlICE9PSB0aGlzLl90aW1lb3V0KSB7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gdGhpcy5fdGltZW91dDtcbiAgICAgICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgb3BlblN1YkRlc3Ryb3koKTsgLy8gcHJldmVudHMgYSByYWNlIGNvbmRpdGlvbiB3aXRoIHRoZSAnb3BlbicgZXZlbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCB0aW1lclxuICAgICAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgb3BlblN1YkRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBzb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgc29ja2V0LmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJ0aW1lb3V0XCIpKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aW1lci51bnJlZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdWJzLnB1c2goZnVuY3Rpb24gc3ViRGVzdHJveSgpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdWJzLnB1c2gob3BlblN1YkRlc3Ryb3kpO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChlcnJvclN1Yik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Igb3BlbigpXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY29ubmVjdChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5vcGVuKGZuKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ub3BlbigpIHtcbiAgICAgICAgLy8gY2xlYXIgb2xkIHN1YnNcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIC8vIG1hcmsgYXMgb3BlblxuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgLy8gYWRkIG5ldyBzdWJzXG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChvbihzb2NrZXQsIFwicGluZ1wiLCB0aGlzLm9ucGluZy5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImRhdGFcIiwgdGhpcy5vbmRhdGEuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJlcnJvclwiLCB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJjbG9zZVwiLCB0aGlzLm9uY2xvc2UuYmluZCh0aGlzKSksIG9uKHRoaXMuZGVjb2RlciwgXCJkZWNvZGVkXCIsIHRoaXMub25kZWNvZGVkLmJpbmQodGhpcykpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBwaW5nLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBpbmcoKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGluZ1wiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kYXRhKGRhdGEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZGVjb2Rlci5hZGQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMub25jbG9zZShcInBhcnNlIGVycm9yXCIsIGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHBhcnNlciBmdWxseSBkZWNvZGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRlY29kZWQocGFja2V0KSB7XG4gICAgICAgIC8vIHRoZSBuZXh0VGljayBjYWxsIHByZXZlbnRzIGFuIGV4Y2VwdGlvbiBpbiBhIHVzZXItcHJvdmlkZWQgZXZlbnQgbGlzdGVuZXIgZnJvbSB0cmlnZ2VyaW5nIGEgZGlzY29ubmVjdGlvbiBkdWUgdG8gYSBcInBhcnNlIGVycm9yXCJcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzb2NrZXQgZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBzb2NrZXQgZm9yIHRoZSBnaXZlbiBgbnNwYC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NvY2tldH1cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc29ja2V0KG5zcCwgb3B0cykge1xuICAgICAgICBsZXQgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgIGlmICghc29ja2V0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBuZXcgU29ja2V0KHRoaXMsIG5zcCwgb3B0cyk7XG4gICAgICAgICAgICB0aGlzLm5zcHNbbnNwXSA9IHNvY2tldDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9hdXRvQ29ubmVjdCAmJiAhc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc29ja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNvY2tldCBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzb2NrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kZXN0cm95KHNvY2tldCkge1xuICAgICAgICBjb25zdCBuc3BzID0gT2JqZWN0LmtleXModGhpcy5uc3BzKTtcbiAgICAgICAgZm9yIChjb25zdCBuc3Agb2YgbnNwcykge1xuICAgICAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgICAgICBpZiAoc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcml0ZXMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcGFja2V0KHBhY2tldCkge1xuICAgICAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IHRoaXMuZW5jb2Rlci5lbmNvZGUocGFja2V0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbmdpbmUud3JpdGUoZW5jb2RlZFBhY2tldHNbaV0sIHBhY2tldC5vcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbiB1cCB0cmFuc3BvcnQgc3Vic2NyaXB0aW9ucyBhbmQgcGFja2V0IGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2xlYW51cCgpIHtcbiAgICAgICAgdGhpcy5zdWJzLmZvckVhY2goKHN1YkRlc3Ryb3kpID0+IHN1YkRlc3Ryb3koKSk7XG4gICAgICAgIHRoaXMuc3Vicy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmRlY29kZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgY3VycmVudCBzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbG9zZSgpIHtcbiAgICAgICAgdGhpcy5za2lwUmVjb25uZWN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jbG9zZShcImZvcmNlZCBjbG9zZVwiKTtcbiAgICAgICAgaWYgKHRoaXMuZW5naW5lKVxuICAgICAgICAgICAgdGhpcy5lbmdpbmUuY2xvc2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIGNsb3NlKClcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jbG9zZShyZWFzb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiY2xvc2VcIiwgcmVhc29uLCBkZXNjcmlwdGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3Rpb24gJiYgIXRoaXMuc2tpcFJlY29ubmVjdCkge1xuICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0IGEgcmVjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICByZWNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLl9yZWNvbm5lY3RpbmcgfHwgdGhpcy5za2lwUmVjb25uZWN0KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5iYWNrb2ZmLmF0dGVtcHRzID49IHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzKSB7XG4gICAgICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2ZhaWxlZFwiKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgZGVsYXkgPSB0aGlzLmJhY2tvZmYuZHVyYXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5za2lwUmVjb25uZWN0KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfYXR0ZW1wdFwiLCBzZWxmLmJhY2tvZmYuYXR0ZW1wdHMpO1xuICAgICAgICAgICAgICAgIC8vIGNoZWNrIGFnYWluIGZvciB0aGUgY2FzZSBzb2NrZXQgY2xvc2VkIGluIGFib3ZlIGV2ZW50c1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBzZWxmLm9wZW4oKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZWNvbm5lY3RpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9lcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbnJlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBkZWxheSk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLmF1dG9VbnJlZikge1xuICAgICAgICAgICAgICAgIHRpbWVyLnVucmVmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN1YnMucHVzaChmdW5jdGlvbiBzdWJEZXN0cm95KCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzdWNjZXNzZnVsIHJlY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25yZWNvbm5lY3QoKSB7XG4gICAgICAgIGNvbnN0IGF0dGVtcHQgPSB0aGlzLmJhY2tvZmYuYXR0ZW1wdHM7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RcIiwgYXR0ZW1wdCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgdXJsIH0gZnJvbSBcIi4vdXJsLmpzXCI7XG5pbXBvcnQgeyBNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgU29ja2V0IH0gZnJvbSBcIi4vc29ja2V0LmpzXCI7XG4vKipcbiAqIE1hbmFnZXJzIGNhY2hlLlxuICovXG5jb25zdCBjYWNoZSA9IHt9O1xuZnVuY3Rpb24gbG9va3VwKHVyaSwgb3B0cykge1xuICAgIGlmICh0eXBlb2YgdXJpID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgIHVyaSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgY29uc3QgcGFyc2VkID0gdXJsKHVyaSwgb3B0cy5wYXRoIHx8IFwiL3NvY2tldC5pb1wiKTtcbiAgICBjb25zdCBzb3VyY2UgPSBwYXJzZWQuc291cmNlO1xuICAgIGNvbnN0IGlkID0gcGFyc2VkLmlkO1xuICAgIGNvbnN0IHBhdGggPSBwYXJzZWQucGF0aDtcbiAgICBjb25zdCBzYW1lTmFtZXNwYWNlID0gY2FjaGVbaWRdICYmIHBhdGggaW4gY2FjaGVbaWRdW1wibnNwc1wiXTtcbiAgICBjb25zdCBuZXdDb25uZWN0aW9uID0gb3B0cy5mb3JjZU5ldyB8fFxuICAgICAgICBvcHRzW1wiZm9yY2UgbmV3IGNvbm5lY3Rpb25cIl0gfHxcbiAgICAgICAgZmFsc2UgPT09IG9wdHMubXVsdGlwbGV4IHx8XG4gICAgICAgIHNhbWVOYW1lc3BhY2U7XG4gICAgbGV0IGlvO1xuICAgIGlmIChuZXdDb25uZWN0aW9uKSB7XG4gICAgICAgIGlvID0gbmV3IE1hbmFnZXIoc291cmNlLCBvcHRzKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmICghY2FjaGVbaWRdKSB7XG4gICAgICAgICAgICBjYWNoZVtpZF0gPSBuZXcgTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xuICAgICAgICB9XG4gICAgICAgIGlvID0gY2FjaGVbaWRdO1xuICAgIH1cbiAgICBpZiAocGFyc2VkLnF1ZXJ5ICYmICFvcHRzLnF1ZXJ5KSB7XG4gICAgICAgIG9wdHMucXVlcnkgPSBwYXJzZWQucXVlcnlLZXk7XG4gICAgfVxuICAgIHJldHVybiBpby5zb2NrZXQocGFyc2VkLnBhdGgsIG9wdHMpO1xufVxuLy8gc28gdGhhdCBcImxvb2t1cFwiIGNhbiBiZSB1c2VkIGJvdGggYXMgYSBmdW5jdGlvbiAoZS5nLiBgaW8oLi4uKWApIGFuZCBhcyBhXG4vLyBuYW1lc3BhY2UgKGUuZy4gYGlvLmNvbm5lY3QoLi4uKWApLCBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eVxuT2JqZWN0LmFzc2lnbihsb29rdXAsIHtcbiAgICBNYW5hZ2VyLFxuICAgIFNvY2tldCxcbiAgICBpbzogbG9va3VwLFxuICAgIGNvbm5lY3Q6IGxvb2t1cCxcbn0pO1xuLyoqXG4gKiBQcm90b2NvbCB2ZXJzaW9uLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IHsgcHJvdG9jb2wgfSBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuLyoqXG4gKiBFeHBvc2UgY29uc3RydWN0b3JzIGZvciBzdGFuZGFsb25lIGJ1aWxkLlxuICpcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IHsgTWFuYWdlciwgU29ja2V0LCBsb29rdXAgYXMgaW8sIGxvb2t1cCBhcyBjb25uZWN0LCBsb29rdXAgYXMgZGVmYXVsdCwgfTtcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXHJcblxyXG5pbXBvcnQgeyBlcnJvciwgZ29Ib21lIH0gZnJvbSBcIi4vdG9vbHMvdG9vbHMuanNcIjtcclxuXHJcbmltcG9ydCB7IGluaXRHbCwgZHJhd0FsbCwgY3JlYXRlVGFuaywgY3JlYXRlQnVsbGV0IH0gZnJvbSBcIi4vZ2FtZS9hbmltLmpzXCI7XHJcbmltcG9ydCBDb29raWVzIGZyb20gXCJqcy1jb29raWVcIjtcclxuaW1wb3J0IHsgaW8gfSBmcm9tIFwic29ja2V0LmlvLWNsaWVudFwiO1xyXG5cclxubGV0IG5hbWUsIGdhbWVJZDtcclxuXHJcbi8qIHNvY2tldCAqL1xyXG5jb25zdCBzb2NrZXQgPSBpbygpO1xyXG5hc3luYyBmdW5jdGlvbiBzb2NrZXRJbml0KCkge1xyXG4gIHNvY2tldC5vbihcImNvbm5lY3Rpb25cIiwgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coc29ja2V0LmlkKTtcclxuICB9KTtcclxuICBzb2NrZXQub24oXCJlcnJvclwiLCAoLi4uZXJyKSA9PiBlcnJvciguLi5lcnIpKTtcclxuICBzb2NrZXQub24oXCJnYW1lQ29ubmVjdFwiLCAocG9zKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhzb2NrZXQuaWQpO1xyXG4gICAgY3JlYXRlVGFuaygpO1xyXG4gICAgY3JlYXRlQnVsbGV0KCk7XHJcbiAgICAvL25ldyBjcmVhdGVUYW5rKHBvcyk7XHJcbiAgfSk7XHJcbiAgc29ja2V0Lm9uKFwic2Vzc2lvblVwZGF0ZVwiLCAoLi4uYXJncykgPT4gZHJhd0FsbCguLi5hcmdzKSk7XHJcblxyXG4gIHNvY2tldC5lbWl0KFwidXNlckNvbm5lY3RcIiwgbmFtZSwgZ2FtZUlkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFVzZXIoKSB7XHJcbiAgZ2FtZUlkID0gQ29va2llcy5nZXQoXCJnYW1lSW5mb1wiKTtcclxuICBuYW1lID0gQ29va2llcy5nZXQoXCJuYW1lXCIpO1xyXG4gIGlmIChuYW1lID09IHVuZGVmaW5lZCkgZXJyb3IoXCJHYW1lIElEIHVuZGVmaW5lZFwiLCBcIi4uL2luZGV4Lmh0bWxcIiwgXCJsb2dvdXRcIik7XHJcbiAgaWYgKGdhbWVJZCA9PSB1bmRlZmluZWQpIGVycm9yKFwiR2FtZSBJRCB1bmRlZmluZWRcIiwgXCIuLi9pbmRleC5odG1sXCIsIFwiaG9tZVwiKTtcclxufVxyXG5jb25zdCBrZXlzID0ge307XHJcbmNvbnN0IGtleURvd24gPSAoZSkgPT4ge1xyXG4gIGlmIChlLmNvZGUgPT0gXCJTcGFjZVwiICYmICFrZXlzW2UuY29kZV0pIHNvY2tldC5lbWl0KFwic2Vzc2lvblNob3RcIiwgZ2FtZUlkKTtcclxuXHJcbiAgaWYgKGUuY29kZSA9PSBcIktleVdcIiAmJiAha2V5c1tlLmNvZGVdKVxyXG4gICAgc29ja2V0LmVtaXQoXCJzZXNzaW9uQmVnaW5Nb3ZlRnJvbnRcIiwgZ2FtZUlkKTtcclxuXHJcbiAgaWYgKGUuY29kZSA9PSBcIktleVNcIiAmJiAha2V5c1tlLmNvZGVdKVxyXG4gICAgc29ja2V0LmVtaXQoXCJzZXNzaW9uQmVnaW5Nb3ZlQmFja1wiLCBnYW1lSWQpO1xyXG5cclxuICBpZiAoZS5jb2RlID09IFwiS2V5RFwiICYmICFrZXlzW2UuY29kZV0pXHJcbiAgICBzb2NrZXQuZW1pdChcInNlc3Npb25CZWdpblJvdGF0ZUxlZnRcIiwgZ2FtZUlkKTtcclxuXHJcbiAgaWYgKGUuY29kZSA9PSBcIktleUFcIiAmJiAha2V5c1tlLmNvZGVdKVxyXG4gICAgc29ja2V0LmVtaXQoXCJzZXNzaW9uQmVnaW5Sb3RhdGVSaWdodFwiLCBnYW1lSWQpO1xyXG5cclxuICBrZXlzW2UuY29kZV0gPSB0cnVlO1xyXG59O1xyXG5cclxuY29uc3Qga2V5VXAgPSAoZSkgPT4ge1xyXG4gIGlmIChlLmNvZGUgPT0gXCJLZXlXXCIgJiYga2V5c1tlLmNvZGVdKVxyXG4gICAgc29ja2V0LmVtaXQoXCJzZXNzaW9uU3RvcE1vdmVGcm9udFwiLCBnYW1lSWQpO1xyXG5cclxuICBpZiAoZS5jb2RlID09IFwiS2V5U1wiICYmIGtleXNbZS5jb2RlXSlcclxuICAgIHNvY2tldC5lbWl0KFwic2Vzc2lvblN0b3BNb3ZlQmFja1wiLCBnYW1lSWQpO1xyXG5cclxuICBpZiAoZS5jb2RlID09IFwiS2V5RFwiICYmIGtleXNbZS5jb2RlXSlcclxuICAgIHNvY2tldC5lbWl0KFwic2Vzc2lvblN0b3BSb3RhdGVMZWZ0XCIsIGdhbWVJZCk7XHJcblxyXG4gIGlmIChlLmNvZGUgPT0gXCJLZXlBXCIgJiYga2V5c1tlLmNvZGVdKVxyXG4gICAgc29ja2V0LmVtaXQoXCJzZXNzaW9uU3RvcFJvdGF0ZVJpZ2h0XCIsIGdhbWVJZCk7XHJcblxyXG4gIGtleXNbZS5jb2RlXSA9IGZhbHNlO1xyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIGFzeW5jICgpID0+IHtcclxuICBjb25zb2xlLmxvZyhgYWFhYWEgJHtuYW1lfWApO1xyXG4gIGluaXRVc2VyKCk7XHJcbiAgY29uc29sZS5sb2coYGFhYWFhICR7bmFtZX0gJHtnYW1lSWR9YCk7XHJcbiAgaW5pdEdsKCk7XHJcbiAgYXdhaXQgc29ja2V0SW5pdCgpO1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBrZXlEb3duLCBmYWxzZSk7XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBrZXlVcCwgZmFsc2UpO1xyXG59KTtcclxuIl0sIm5hbWVzIjpbIkNvb2tpZXMiLCJ3aXRoTmF0aXZlQmxvYiIsIndpdGhOYXRpdmVBcnJheUJ1ZmZlciIsImlzVmlldyIsImxvb2t1cCIsImRlY29kZSIsInByb3RvY29sIiwiZ2xvYmFsVGhpcyIsImVuY29kZSIsIlhNTEh0dHBSZXF1ZXN0IiwiU29ja2V0IiwiUkVTRVJWRURfRVZFTlRTIiwiRW5naW5lIiwiaW8iXSwibWFwcGluZ3MiOiI7OztFQUFBO0VBQ0E7RUFDQSxTQUFTLE1BQU0sRUFBRSxNQUFNLEVBQUU7RUFDekIsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUM3QyxJQUFJLElBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5QixJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksTUFBTSxFQUFFO0VBQzVCLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztFQUNoQyxLQUFLO0VBQ0wsR0FBRztFQUNILEVBQUUsT0FBTyxNQUFNO0VBQ2YsQ0FBQztFQUNEO0FBQ0E7RUFDQTtFQUNBLElBQUksZ0JBQWdCLEdBQUc7RUFDdkIsRUFBRSxJQUFJLEVBQUUsVUFBVSxLQUFLLEVBQUU7RUFDekIsSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7RUFDMUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqQyxLQUFLO0VBQ0wsSUFBSSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUM7RUFDaEUsR0FBRztFQUNILEVBQUUsS0FBSyxFQUFFLFVBQVUsS0FB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Q0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUU7RUFDOUQsTUFBTSxJQUFJLENBQUMsS0FBSztFQUNoQixNQUFNLElBQUksQ0FBQyxLQUFLO0VBQ2hCLEtBQUssQ0FBQztFQUNOLElBQUksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUk7RUFDdkIsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7RUFDL0QsS0FBSyxDQUFDO0VBQ04sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7RUFDcEIsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUNsRSxNQUFNLElBQUksQ0FBQyxLQUFLO0VBQ2hCLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDckIsS0FBSyxDQUFDO0VBQ04sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7RUFDcEIsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtFQUNsRSxNQUFNLElBQUksQ0FBQyxLQUFLO0VBQ2hCLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDckIsS0FBSyxDQUFDO0VBQ04sR0FBRyxDQUFDO0VBQ0osRUFBRSxlQUFlLENBQUMsTUFBTSxDQUFDLEdB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QUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBLE1BQU0sRUFBRSxHQUFHLHFQQUFxUCxDQUFDO0VBQ2pRLE1BQU0sS0FBSyxHQUFHO0VBQ2QsSUFBSSxRQUFRLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUTtFQUNqSixDQUFDLENBQUM7RUFDSyxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUU7RUFDM0IsSUFBSSxNQUFNLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDaEUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7RUFDNUIsUUFBUSxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDMUcsS0FBSztFQUNMLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0VBQ2pELElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRTtFQUNoQixRQUFRLEdBQUcsQ0FBQyxL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QUFJLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDdkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hEO0VBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDdkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xEO0VBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDdkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ25EO0VBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztFQUN0QixDQUFDLENBQUM7QUFDRjtFQUNBLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLO0VBQ3JCLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUN0QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDaEQ7RUFDQSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7RUFDdEMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9DO0VBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0VBQ3RDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNqRDtFQUNBLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztFQUN0QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbEQ7RUFDQSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0VBQ3ZCLENBQUMsQ0FBQztBQUNGO0VBQ0EsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxZQUFZO0VBQzVDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDL0IsRUFBRSxRQUFRLEVBQUUsQ0FBQztFQUNiLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN6QyxFQUFFLE1BQU0sRUFBRSxDQUFDO0VBQ1gsRUFBRSxNQUFNLFVBQVUsRUFBRSxDQUFDO0VBQ3JCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7RUFDckQsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztFQUNqRCxDQUFDLENBQUM7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwzLDQsNSw2LDcsOCw5LDEwLDExLDEyLDEzLDE0LDE1LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDI3LDI4LDI5LDMwXX0=
