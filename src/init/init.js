import * as THREE from "three";
import * as dat from "dat.gui";
import { SmoothOrbitControls } from "./SmoothOrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
export let gl,
  canvas,
  scene,
  camera,
  controls,
  gui,
  width,
  height,
  composer,
  postParams;
const ENTIRE_SCENE = 0,
  BLOOM_SCENE = 1;
const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });
const materials = {};
let bloomComposer, bloomLayer;

export const create = (geo, geoProps, mat, matProps, params, helper) => {
  let mesh;
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  const geoName = capitalizeFirstLetter(geo.split(":")[1]) + "Geometry";
  const geoFunction =
    geo.split(":")[2] === "buffer"
      ? geoName.split("Geometry")[0] + "BufferGeometry"
      : geoName;
  const matName = capitalizeFirstLetter(mat.split(":")[0]);
  const matFunction = matName.includes("Shader")
    ? matName + "Material"
    : "Mesh" + matName + "Material";
  const lightFunction = capitalizeFirstLetter(geo.split(":")[1]) + "Light";
  console.log(matFunction);

  switch (geo.split(":")[0]) {
    case "geo":
      geo = new THREE[geoFunction](
        geoProps[0],
        geoProps[1],
        geoProps[2],
        geoProps[3],
        geoProps[4],
        geoProps[5],
        geoProps[6]
      );

      mat = new THREE[matFunction](matProps);
      mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      if (params) {
        let debugObject = {
          color: mat.color,
        };

        const createTweak = (param) => {
          gui
            .add(
              eval(
                param.includes(":.")
                  ? "mesh"
                  : "mesh." + param.split(":")[1].split(",")[0].split(".")[0]
              ),
              // eval("mesh." + param.split(":")[1].split(",")[0].split(".")[0]),
              param.split(",")[0].split(".")[1].toString(),
              parseFloat(param.split(",")[1]),
              parseFloat(param.split(",")[2]),
              parseFloat(param.split(",")[3])
            )
            .name(param.split(":")[0]);
        };

        params.forEach((param) => {
          switch (typeof param) {
            case "string":
              switch (param.split(":")[0]) {
                case "color":
                  debugObject[param.split(":")[1]] = param.split(":")[3];

                  if (param.split(":")[2].includes(".value")) {
                    mesh.material.uniforms[param.split(":")[1]].value.set(
                      debugObject[param.split(":")[1]]
                    );
                  } else {
                    mesh.material[param.split(":")[2]].set(
                      debugObject[param.split(":")[1]]
                    );
                  }

                  gui
                    .addColor(debugObject, param.split(":")[1])
                    .onChange(() => {
                      if (param.split(":")[2].includes(".value")) {
                        mesh.material.uniforms[param.split(":")[1]].value.set(
                          debugObject[param.split(":")[1]]
                        );
                        return;
                      }
                      mesh.material.uniforms[param.split(":")[1]].value.set(
                        debugObject[param.split(":")[1]]
                      );
                    });
                  break;
                default:
                  createTweak(param);
                  break;
              }
              break;
            case "function":
              let name = param.name;
              debugObject[name] = param;
              debugObject[name] = debugObject[name].bind(this, mesh);
              gui.add(debugObject, name);
              break;
          }
        });
      }
      break;
    case "light":
      helper = params;
      params = matProps;

      let size;

      size = parseFloat(mat.split(":")[1]);
      mesh = new THREE[lightFunction](
        mat.split(":")[0],
        size,
        mat.split(":")[2]
      );
      mesh.position.set(
        eval(mat.split(":")[3]),
        eval(mat.split(":")[4]),
        eval(mat.split(":")[5])
      );
      if (helper) {
        let helper = new THREE[lightFunction + "Helper"](mesh, size);
        scene.add(helper);
      }

      if (params) {
        let debugObject = {
          color: mat.color,
        };

        const createTweak = (param) => {
          gui
            .add(
              eval(
                param.includes(":.")
                  ? "mesh"
                  : "mesh." + param.split(":")[1].split(",")[0].split(".")[0]
              ),
              param.split(",")[0].split(".")[1].toString(),
              parseFloat(param.split(",")[1]),
              parseFloat(param.split(",")[2]),
              parseFloat(param.split(",")[3])
            )
            .name(param.split(":")[0]);
        };

        params.forEach((param) => {
          switch (typeof param) {
            case "string":
              switch (param.split(":")[0]) {
                case "color":
                  debugObject.color = param.split(":")[1];
                  mesh.color.set(debugObject.color);
                  gui.addColor(debugObject, "color").onChange(() => {
                    mesh.color.set(debugObject.color);
                  });
                  break;
                default:
                  createTweak(param);
                  break;
              }
              break;
            case "function":
              let name = param.name;
              debugObject[name] = param;
              debugObject[name] = debugObject[name].bind(this, mesh);
              gui.add(debugObject, name);
              break;
          }
        });
      }

    default:
      break;
  }

  return mesh;
};

export const model = (path) => {
  const loader = new GLTFLoader();

  // Optional: Provide a DRACOLoader instance to decode compressed mesh data
  loader.setDRACOLoader(new DRACOLoader().setDecoderPath("./"));
  loader.setKTX2Loader(new KTX2Loader().detectSupport(gl));

  loader.load(
    path,
    function (gltf) {
      return gltf.scene;

      // gltf.animations; // Array<THREE.AnimationClip>
      // gltf.scene; // THREE.Group
      // gltf.scenes; // Array<THREE.Group>
      // gltf.cameras; // Array<THREE.Camera>
      // gltf.asset; // Object
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened:", error);
    }
  );
};

export function renderBloom(mask) {
  if (mask === true) {
    scene.traverse(darkenNonBloomed);
    bloomComposer.render();
    scene.traverse(restoreMaterial);
  } else {
    camera.layers.set(BLOOM_SCENE);
    bloomComposer.render();
    camera.layers.set(ENTIRE_SCENE);
  }
}

function darkenNonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}
function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}

export const post = (objects) => {
  bloomLayer = new THREE.Layers();
  bloomLayer.set(BLOOM_SCENE);

  postParams = {
    exposure: 1,
    bloomStrength: 5,
    bloomThreshold: 0,
    bloomRadius: 0,
    scene: "Scene with Glow",
  };
  let renderScene = new RenderPass(scene, camera);

  let bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    2,
    0,
    0.06
  );

  bloomComposer = new EffectComposer(gl);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  let finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: `varying vec2 vUv;

			void main() {

				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			}`,
      fragmentShader: `uniform sampler2D baseTexture;
			uniform sampler2D bloomTexture;

			varying vec2 vUv;

			void main() {

				gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

			}`,
      defines: {},
    }),
    "baseTexture"
  );
  finalPass.needsSwap = true;

  composer = new EffectComposer(gl);
  composer.addPass(renderScene);
  composer.addPass(finalPass);

  objects.forEach((object) => {
    console.log(object);
    object.layers.toggle(BLOOM_SCENE);
  });
};

export const init = () => {
  // Gui
  // gui = new dat.GUI();
  // Canvas
  canvas = document.querySelector("#canvas");

  // Scene
  scene = new THREE.Scene();

  // Renderer
  gl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  gl.outputEncoding = THREE.sRGBEncoding;

  // Camera
  let width = window.innerWidth;
  let height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(75, width / height, 0.01, 100);
  camera.position.z = 2.5;
  // camera.position.x = 2.5;
  camera.lookAt(0,0,0)
  scene.add(camera);
  window.addEventListener("resize", () => {
    // Update
    width = window.innerWidth;
    height = window.innerHeight;

    // Update camera
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer
    gl.setSize(width, height);
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /**
   * Fullscreen
   */
  window.addEventListener("dblclick", () => {
    const fullscreenElement =
      document.fullscreenElement || document.webkitFullscreenElement;

    if (!fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if (canvas.webkitRequestFullscreen) {
        canvas.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  });

  gl.setSize(width, height);
  gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  SmoothOrbitControls();
  controls = new THREE.SmoothOrbitControls(camera, gl.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.35;

  // smooth Zoom
  controls.constraint.smoothZoom = true;
  controls.constraint.zoomDampingFactor = 0.2;
  controls.constraint.smoothZoomSpeed = 10;
};
