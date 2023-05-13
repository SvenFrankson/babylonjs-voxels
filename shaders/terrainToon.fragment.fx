#version 300 es
precision highp float;
 
uniform vec3 lightInvDirW;
uniform int level;

in vec3 vPositionW;
in vec3 vNormalW;
in vec2 vUv;
in vec4 vColor;

out vec4 outColor;
 
void main() {
   float sunLightFactor = (dot(vNormalW, lightInvDirW) + 1.) * 0.5;

   float lightFactor = sunLightFactor / 1.3;

   vec3 color = vec3(1., 1., 1.);

   int h = int(round(vPositionW.y * 2.));
   float dx = vPositionW.x - floor(vPositionW.x);
   float dy = vPositionW.y - floor(vPositionW.y);
   float dz = vPositionW.z - floor(vPositionW.z);
   
   if (level == 0) {
      if (vNormalW.y > 0.8 && (dy < 0.1 || dy > 0.9)) {
         lightFactor *= 1.3;
      }
   }
   else {
      if (vNormalW.y > 0.7 && (dy < 0.1 || dy > 0.9)) {
         lightFactor *= 1.3;
      }
   }

   lightFactor = round(lightFactor * 24.) / 24.;

   /*
   if (dx < 0.02 || dx > 0.98) {
      lightFactor *= 0.6;
   }
   if (dz < 0.02 || dz > 0.98) {
      lightFactor *= 0.6;
   }
   */

   
   outColor = vec4(color * lightFactor, 1.);
}