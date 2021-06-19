
import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.129.0-tccbvW7qPaDqcjcm1Rsy/mode=imports,min/optimized/three.js';
import CameraControls from 'https://cdn.skypack.dev/camera-controls';
CameraControls.install({ THREE: THREE });

function init() {
    console.log("Online");
    const elm = document.getElementById('render-port');
    console.log(elm.clientWidth, elm.clientHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, elm.clientWidth / elm.clientHeight, 0.1, 1000);
    scene.background = new THREE.Color(0xe9ecef);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(elm.clientWidth, elm.clientHeight);
    elm.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 12;
    camera.position.y = 2;
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);

    const clock = new THREE.Clock();
    const cameraControls = new CameraControls(camera, renderer.domElement);


    function render() {
        renderer.render(scene, camera);
    }
    function onWindowResize() {
        camera.aspect = elm.clientWidth / elm.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(elm.clientWidth, elm.clientHeight);
        render();
    }
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const hasControlsUpdated = cameraControls.update(delta);
        if (hasControlsUpdated) {

            render();
            
        }
    }
    render();
    animate();
    window.addEventListener('resize', onWindowResize, false);
    console.log("Scene polycount:", renderer.info.render.triangles);
    console.log("Active Drawcalls:", renderer.info.render.calls);
    console.log("Textures in Memory", renderer.info.memory.textures);
    console.log("Geometries in Memory", renderer.info.memory.geometries);
};


init();

// var elm.clientWidth / elm.clientHeight;

// CameraControls.install( { THREE: THREE } );

// const scene = new THREE.Scene();
// const clock = new THREE.Clock();
// const camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 1000 );
// const cameraControls = new CameraControls( camera, renderer.domElement );

// ( function anim () {

//     // snip
//     const delta = clock.getDelta();
//     const hasControlsUpdated = cameraControls.update( delta );

//     requestAnimationFrame( anim );

//     // you can skip this condition to render though
//     if ( hasControlsUpdated ) {

//         renderer.render( scene, camera );

//     }

// } )();