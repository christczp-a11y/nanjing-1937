var e=e=>e.replace(/\/\/NJAIR-[AB]-BEGIN[\s\S]*?\/\/NJAIR-[AB]-END\n?/g,``);function t(t){let n=e(t.getFragmentShader()),r=`uniform float airSat;`,i=`    if (skyBelow < 0.0) outputColor.rgb = min(outputColor.rgb, vec3(0.5));`,a=`//NJAIR-C-BEGIN
  float airHc = max((length(vCameraPosition) - ATMOSPHERE.bottom_radius) / METER_TO_LENGTH_UNIT, 0.0);
  float airHp = max((length(positionECEF) - ATMOSPHERE.bottom_radius) / METER_TO_LENGTH_UNIT, 0.0);
  float airDist = length(positionECEF - vCameraPosition) / METER_TO_LENGTH_UNIT;
  // (wave 6h) the valley's dust layer, integrated along the ray: the density exp(-h / H) summed from the eye to the point over the straight line (exact for an exponential layer),
  // as the length of air at the layer's base density that it is worth. A camera high over the land looking down passes little of it, one at the ground looking to the horizon a lot.
  float airE0 = exp(-airHc / uAirH), airE1 = exp(-airHp / uAirH), airDh = airHp - airHc;
  float airPath = abs(airDh) > 2.0 ? airDist * uAirH * abs(airE0 - airE1) / abs(airDh) : airDist * airE0;
  float aK = airK + uAirExtra * clamp((airPath - uAirD0) / (uAirD1 - uAirD0), 0.0, 6.0);
//NJAIR-C-END`;return n.includes(`//NJAIR-C-BEGIN`)?n=n.replace(/\/\/NJAIR-C-BEGIN[\s\S]*?\/\/NJAIR-C-END/,a):n.includes(`vec3(airK)`)&&(n=n.replace(`vec3 airT = pow(max(transmittance, vec3(1e-4)), vec3(airK));`,a+`
  vec3 airT = pow(max(transmittance, vec3(1e-4)), vec3(aK));`).replace(`radiance = radiance * airT + airI * min(airS, vec3(airK));`,`radiance = radiance * airT + airI * min(airS, vec3(aK));`)),!n.includes(r)||!n.includes(`vec3(aK)`)||!n.includes(i)?(console.warn(`nightsky: the aerial perspective shader is not the one patched for the air; the moon sky and the depth haze are not applied`),!1):(n.includes(`uniform float uMoonSky;`)||(n=n.replace(r,r+`
uniform float uMoonSky;
uniform float uAirExtra;
uniform float uAirD0;
uniform float uAirD1;
uniform float uAirH;`)),n=n.replace(`radiance = radiance * airT + airI * min(airS, vec3(aK));`,`radiance = radiance * airT + airI * min(airS, vec3(aK));
//NJAIR-A-BEGIN
  if (uMoonSky > 0.0) {
    vec3 trM;
    vec3 inM = GetSkyRadianceToPoint(vCameraPosition, positionECEF, shadowLength, moonDirection, trM);
    radiance += mix(vec3(dot(inM, vec3(0.2126, 0.7152, 0.0722))), inM, airSat) * min(airS, vec3(aK)) * uMoonSky;
  }
//NJAIR-A-END`).replace(i,`//NJAIR-B-BEGIN
    if (uMoonSky > 0.0) {
      vec3 trS;
      outputColor.rgb += GetSkyRadiance(vCameraPosition, skyDirection, shadowLength, moonDirection, trS) * uMoonSky;
    }
//NJAIR-B-END
`+i),t.setFragmentShader(n),!0)}export{t as patchAir};