import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { init, gl, scene, camera, controls } from "./init/init";

import vertexShader from "./shaders/vertex.js";
import fragmentShader from "./shaders/fragment.js";
import { GUI } from "./init/lil-gui.module.min";
import "./style.css";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { HalftonePass } from "three/examples/jsm/postprocessing/HalftonePass.js";

init();

let gui = new GUI();

const torus = new THREE.Mesh(
  new THREE.PlaneGeometry(35, 20, 248, 248),
  new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uDisplace: { value: 0.6 },
      uSpread: { value: 3 },
      uNoise: { value: 6 },
      uMouse: { value: new THREE.Vector2() },
    },
  })
);

scene.add(torus);

gui
  .add(torus.material.uniforms.uDisplace, "value", 0, 2, 0.1)
  .name("displacemnt");
gui.add(torus.material.uniforms.uSpread, "value", 0, 2, 0.1).name("spread");
gui.add(torus.material.uniforms.uNoise, "value", 5, 25, 0.1).name("noise");

let composer = new EffectComposer(gl);
composer.addPass(new RenderPass(scene, camera));

const bloomPassOptions = {
  strength: 1.8,
  radius: 0.01,
  threshold: 0.01,
};
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomPassOptions.strength,
  bloomPassOptions.radius,
  bloomPassOptions.threshold
);

gui.add(bloomPassOptions, "strength", 0, 10, 0.1).onChange(() => {
  bloomPass.strength = bloomPassOptions.strength;
});
gui.add(bloomPassOptions, "radius", 0, 10, 0.1).onChange(() => {
  bloomPass.radius = bloomPassOptions.radius;
});
gui.add(bloomPassOptions, "threshold", 0, 1, 0.01).onChange(() => {
  bloomPass.threshold = bloomPassOptions.threshold;
});

composer.addPass(bloomPass);

const halftonePassOptions = {
  shape: 2,
  radius: 3.984,
  rotateR: Math.PI / 12,
  rotateG: Math.PI / 12,
  rotateB: Math.PI / 12,
  scatter: 0,
  blending: 0.08,
  blendingMode: 1,
  greyscale: false,
  disable: false,
};

const onGUIChange = () => {
  halftonePass.uniforms["radius"].value = halftonePassOptions.radius;
  halftonePass.uniforms["rotateR"].value =
    halftonePassOptions.rotateR * (Math.PI / 180);
  halftonePass.uniforms["rotateG"].value =
    halftonePassOptions.rotateG * (Math.PI / 180);
  halftonePass.uniforms["rotateB"].value =
    halftonePassOptions.rotateB * (Math.PI / 180);
  halftonePass.uniforms["scatter"].value = halftonePassOptions.scatter;
  halftonePass.uniforms["shape"].value = halftonePassOptions.shape;
  halftonePass.uniforms["greyscale"].value = halftonePassOptions.greyscale;
  halftonePass.uniforms["blending"].value = halftonePassOptions.blending;
  halftonePass.uniforms["blendingMode"].value =
    halftonePassOptions.blendingMode;
  halftonePass.uniforms["disable"].value = halftonePassOptions.disable;
};

const halftonePass = new HalftonePass(
  window.innerWidth,
  window.innerHeight,
  halftonePassOptions
);

composer.addPass(halftonePass);

gui
  .add(halftonePassOptions, "shape", { Dot: 1, Ellipse: 2, Line: 3, Square: 4 })
  .onChange(onGUIChange);
gui.add(halftonePassOptions, "radius", 1, 25).onChange(onGUIChange);
gui.add(halftonePassOptions, "rotateR", 0, 90).onChange(onGUIChange);
gui.add(halftonePassOptions, "rotateG", 0, 90).onChange(onGUIChange);
gui.add(halftonePassOptions, "rotateB", 0, 90).onChange(onGUIChange);
gui.add(halftonePassOptions, "scatter", 0, 1, 0.01).onChange(onGUIChange);
gui.add(halftonePassOptions, "greyscale").onChange(onGUIChange);
gui.add(halftonePassOptions, "blending", 0, 1, 0.01).onChange(onGUIChange);
gui
  .add(halftonePassOptions, "blendingMode", {
    Linear: 1,
    Multiply: 2,
    Add: 3,
    Lighter: 4,
    Darker: 5,
  })
  .onChange(onGUIChange);
gui.add(halftonePassOptions, "disable").onChange(onGUIChange);

let mouse = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const clock = new THREE.Clock();

let animate = () => {
  const elapsedTime = clock.getElapsedTime();

  torus.material.uniforms.uTime.value = elapsedTime * 0.1;
  composer.render();

  requestAnimationFrame(animate);
};
animate();
