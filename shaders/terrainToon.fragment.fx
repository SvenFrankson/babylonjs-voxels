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

   vec3 color = vColor.rgb;
   color.r = round(color.r * 4.) / 4.;
   color.g = round(color.g * 4.) / 4.;
   color.b = round(color.b * 4.) / 4.;

   float dx = vPositionW.x - floor(vPositionW.x);
   float dz = vPositionW.z - floor(vPositionW.z);

   if (dx < 0.03 || dx > 0.97) {
      color = vec3(0., 0., 0.);
   }
   if (dz < 0.03 || dz > 0.97) {
      color = vec3(0., 0., 0.);
   }

   float dx16 = (vPositionW.x / 16. - floor(vPositionW.x / 16.));
   float dz16 = (vPositionW.z / 16. - floor(vPositionW.z / 16.));

   if (dx16 < 0.03 / 16. || dx16 > (1. - 0.03 / 16.)) {
      color = vec3(1., 0., 0.);
   }
   if (dz16 < 0.03 / 16. || dz16 > (1. - 0.03 / 16.)) {
      color = vec3(1., 0., 0.);
   }
   
   if (level == 0) {
      float dy = vPositionW.y - floor(vPositionW.y);
      if (vNormalW.y > 0.8 && (dy < 0.1 || dy > 0.9)) {
         lightFactor *= 1.3;
      }
   }
   else if (level == 1) {
      float dy = vPositionW.y - floor(vPositionW.y);
      if (vNormalW.y > 0.7 && (dy < 0.1 || dy > 0.9)) {
         lightFactor *= 1.3;
      }
   }
   else {
      if (vNormalW.y > 0.9) {
         lightFactor *= 1.3;
      }
      else if (vNormalW.y > 0.8) {
         lightFactor *= 1. + 0.3 * ((vNormalW.y - 0.8) * 10.);
      }
   }

   lightFactor = round(lightFactor * 12.) / 12.;

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