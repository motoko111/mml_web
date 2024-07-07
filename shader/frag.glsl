
precision highp float;
precision highp int;

varying vec2 vTexCoord;

uniform sampler2D u_tex;
uniform float u_time;
uniform vec2 u_resolution;

  void main() {
    vec2 uv = vTexCoord;
    vec4 color = texture2D(u_tex, uv);
  
      // ゲームボーイ風の緑色のトーンに変換
    float gray = (color.r + color.g + color.b) / 3.0;
    vec3 greenTone = vec3(1.0, 2, 3) * gray;
    greenTone = color.rgb;
    
    // 走査線を生成
    float line = step(0.5, fract(vTexCoord.y * u_resolution.y / 2.0));
    line = 1;

    // グロー効果を生成
    float distanceToCenter = length(vTexCoord - vec2(0.5, 0.5));
    float glow = smoothstep(0.4, 0.9, distanceToCenter);
    glow = 1;
    
    // 走査線とグローを適用
    greenTone *= line * (1.0 - glow * 0.5);

    // ゲームボーイカラーのパレットに色を合わせる
    vec3 finalColor = greenTone;
    
    gl_FragColor = vec4(finalColor, color.a);
  }