#version 300 es
precision highp float;
 
uniform vec3 lightInvDirW;
uniform vec3 terrainColors[13];
uniform vec3 globalColor;
uniform vec3 planetPos;
uniform int useSeaLevelTexture;
uniform sampler2D seaLevelTexture;
uniform int useVertexColor;
uniform sampler2D voidTexture;
uniform sampler2D dirtSideTexture;
uniform sampler2D dirtTopTexture;
uniform sampler2D grassTexture;
uniform sampler2D rockTexture;
uniform sampler2D woodTexture;
uniform sampler2D sandTexture;
uniform sampler2D leafTexture;
uniform sampler2D iceTexture;

in vec3 vPositionW;
in vec3 vNormalW;
in vec2 vUv;
in vec2 vUv2;
in vec4 vColor;

out vec4 outColor;
 
void main() {
   float sunLightFactor = max(dot(vNormalW, lightInvDirW), 0.0);

   float lightFactor = sunLightFactor * 0.8 + 0.2;

   lightFactor = round(lightFactor * 6.) / 6.;

   int h = int(round(vPositionW.y * 2.));
   float dy = vPositionW.y - floor(vPositionW.y);
   if (dy > 0.1 && dy < 0.9) {
      lightFactor *= 0.6;
   }

   vec3 color = vec3(1., 1., 1.);
   
   outColor = vec4(color * lightFactor, 1.);
}