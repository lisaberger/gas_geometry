import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";

import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { WEBGL } from "three/examples/jsm/WebGL.js";

import cloudVertexShader from "./shaders/vertex.glsl";
import cloudFragmentShader from "./shaders/fragment.glsl";


if ( WEBGL.isWebGL2Available() === false ) {

  document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );

}

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

//Scene
var scene = new THREE.Scene();

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

// default bg canvas color
renderer.setClearColor(0x000000);
//  use device aspect ratio
renderer.setPixelRatio(window.devicePixelRatio);
// set size of canvas within window
renderer.setSize(window.innerWidth, window.innerHeight);

/**
 * Camera
 */
var camera = new THREE.PerspectiveCamera(60,sizes.width / sizes.height, 0.1, 100);
camera.position.z = 1.5;
scene.add(camera);

/**
 * Gas Cloud Object
 */

// Texture

const size = 128;
const data = new Uint8Array( size * size * size );

let i = 0;
const scale = 0.05;
const perlin = new ImprovedNoise();
const vector = new THREE.Vector3();

for ( let z = 0; z < size; z ++ ) {

  for ( let y = 0; y < size; y ++ ) {

    for ( let x = 0; x < size; x ++ ) {

      const d = 1.0 - vector.set( x, y, z ).subScalar( size / 2 ).divideScalar( size ).length();
      data[ i ] = ( 128 + 128 * perlin.noise( x * scale / 1.5, y * scale, z * scale / 1.5 ) ) * d * d;
      i ++;

    }

  }

}

const texture = new THREE.DataTexture3D( data, size, size, size );
texture.format = THREE.RedFormat;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.unpackAlignment = 1;

// Geometry
const geometry = new THREE.BoxGeometry( 1, 1, 1 );

// Material
const material = new THREE.ShaderMaterial( {
  glslVersion: THREE.GLSL3,
  uniforms: {
    base: { value: new THREE.Color( 0x6e00cc ) },
    map: { value: texture },
    cameraPos: { value: new THREE.Vector3() },
    threshold: { value: 0.25 },
    opacity: { value: 0.25 },
    range: { value: 0.1 },
    steps: { value: 100 },
    frame: { value: 0 }
  },
  vertexShader: cloudVertexShader,
  fragmentShader: cloudFragmentShader,
  side: THREE.FrontSide,
  transparent: true
} );

// Mesh
const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

/**
 * Debug Panel
 */
const parameters = {
  threshold: 0.25,
  opacity: 0.25,
  range: 0.1,
  steps: 100
};

function update() {

  material.uniforms.threshold.value = parameters.threshold;
  material.uniforms.opacity.value = parameters.opacity;
  material.uniforms.range.value = parameters.range;
  material.uniforms.steps.value = parameters.steps;

}

const gui = new GUI();
gui.add( parameters, 'threshold', 0, 1, 0.01 ).onChange( update );
gui.add( parameters, 'opacity', 0, 1, 0.01 ).onChange( update );
gui.add( parameters, 'range', 0, 1, 0.01 ).onChange( update );
gui.add( parameters, 'steps', 0, 200, 1 ).onChange( update );


/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Responsive Einstellungen
window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Animate
 */
function animate() {

  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Update Shader
  mesh.material.uniforms.cameraPos.value.copy( camera.position );
	mesh.rotation.y = - performance.now() / 7500;

	mesh.material.uniforms.frame.value ++;

  /* render scene and camera */
  renderer.render(scene, camera);
  
}

animate();
