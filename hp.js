import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.129.0-tccbvW7qPaDqcjcm1Rsy/mode=imports,min/optimized/three.js';
import CameraControls from 'https://cdn.skypack.dev/pin/camera-controls@v1.28.4-BOVl09fLRy5jp3fyn1bD/mode=imports,min/optimized/camera-controls.js';
CameraControls.install({ THREE: THREE });

function init(data) {
    console.log("Online");
    document.getElementById('uploader').style.display = 'none';
    document.getElementById('tools').style.display = 'block';
    const header_label = document.getElementById("header-label");
    const feedback = document.getElementById('feedback');
    const feedback_p = document.getElementById('hover');
    const rangeX = document.getElementById("customRangeX");
    const rangeY = document.getElementById("customRangeY");
    const rangeZ = document.getElementById("customRangeZ");
    rangeX.disabled = false;
    rangeY.disabled = false;
    rangeZ.disabled = false;

    const colorsMeshStandardMaterial = {};
    const colorsMeshStandardMaterialTransparent = {};
    const elm = document.getElementById('render-port');
    console.log(elm.clientWidth, elm.clientHeight);

    const scene = new THREE.Scene();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const camera = new THREE.PerspectiveCamera(75, elm.clientWidth / elm.clientHeight, 0.1, 1000);
    scene.background = new THREE.Color(0xe9ecef);
    const light = new THREE.AmbientLight(0x404040, 4.0); // soft white light
    scene.add(light);

    const renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
    });
    renderer.setSize(elm.clientWidth, elm.clientHeight);
    elm.appendChild(renderer.domElement);

    const getColorMeshStandardMaterialTransparent = (color) => {
        if (!(color in colorsMeshStandardMaterialTransparent)) {
            colorsMeshStandardMaterialTransparent[color] = new THREE.MeshStandardMaterial({
                transparent: true,
                opacity: 0.3,
                alphaTest: 0.3,
                // depthWrite: false,
                side: THREE.DoubleSide,
                color: color,
            });
        }
        return colorsMeshStandardMaterialTransparent[color];
    };

    const getColorMeshStandardMaterial = (color) => {
        if (!(color in colorsMeshStandardMaterial)) {
            colorsMeshStandardMaterial[color] = new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
                color: color
            });
        }
        return colorsMeshStandardMaterial[color];
    };

    var xmin = Infinity, ymin = Infinity, zmin = Infinity;
    var xmax = -Infinity, ymax = -Infinity, zmax = -Infinity;
    data.forEach(payload => {
        payload.points.forEach(points => {
            var x = points[0];
            var y = points[1];
            var z = points[2];
            xmin = Math.min(x, xmin);
            xmax = Math.max(x, xmax);

            ymin = Math.min(y, ymin);
            ymax = Math.max(y, ymax);

            zmin = Math.min(z, zmin);
            zmax = Math.max(z, zmax);
        });
    });
    const x_range = xmax - xmin;
    const y_range = ymax - ymin;
    const z_range = zmax - zmin;
    const widest_range = Math.max(x_range, y_range, z_range);
    const scale = 10 / widest_range; // Makes the widest domain to be 10 units wide
    const objects = data.map(payload => {
        if (payload.type == "path") {
            const spline_tube = new THREE.CatmullRomCurve3(
                payload.points.map((l) => new THREE.Vector3(l[0], l[1], l[2]))
            );
            const geometry_tube = new THREE.TubeBufferGeometry(
                spline_tube,
                4 * payload.points.length, // tubularSegments
                payload.size, // radius
                6, // radialSegments
                false
            );
            const mesh = new THREE.Mesh(geometry_tube, getColorMeshStandardMaterial(payload.color0));
            mesh.name = `Path ${payload.name}`;
            return mesh;
        }
        if (payload.type == "vector") {
            const root = new THREE.Object3D();
            if (payload.points.length % 2 != 0) {
                console.warn("Invalid vector with odd points", payload);
                return root;
            }
            for (var i = 0; i < payload.points.length - 1; i++) {
                const spline_tube = new THREE.CatmullRomCurve3(
                    [
                        new THREE.Vector3(payload.points[i][0], payload.points[i][1], payload.points[i][2]),
                        new THREE.Vector3(payload.points[i + 1][0], payload.points[i + 1][1], payload.points[i + 1][2]),
                    ]
                );
                const geometry_tube = new THREE.TubeBufferGeometry(
                    spline_tube,
                    2, // tubularSegments
                    payload.size, // radius
                    6, // radialSegments
                    false
                );
                const mesh = new THREE.Mesh(geometry_tube, getColorMeshStandardMaterial(payload.color0));
                mesh.name = `Path ${payload.name}`;
                root.add(mesh)
            }
            return root;
        }
        if (payload.type == "plane") {
            const root = new THREE.Object3D();
            if (payload.points.length != 4) {
                console.warn("Invalid plane bad points", payload);
                return root;
            }
            const material = getColorMeshStandardMaterialTransparent(payload.color0);

            const pts = payload.points;
            const geometry = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                pts[0][0], pts[0][1], pts[0][2],
                pts[0 + 1][0], pts[0 + 1][1], pts[0 + 1][2],
                pts[0 + 2][0], pts[0 + 2][1], pts[0 + 2][2],

                pts[0][0], pts[0][1], pts[0][2],
                pts[0 + 2][0], pts[0 + 2][1], pts[0 + 2][2],
                pts[0 + 3][0], pts[0 + 3][1], pts[0 + 3][2],
            ]);

            // itemSize = 3 because there are 3 values (components) per vertex
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `Plane ${payload.name}`;
            root.add(mesh);

            return root;
        }
        if (payload.type == "sphere") {
            const root = new THREE.Object3D();
            payload.points.forEach((pts, i) => {
                const geo = new THREE.SphereBufferGeometry(payload.size, 8, 8);
                const sphere = new THREE.Mesh(geo, getColorMeshStandardMaterial(payload.color0));
                sphere.name = `Sphere ${data.name} #${i}`;
                sphere.position.set(pts[0], pts[1], pts[2]);
                root.add(sphere);
            });
            return root;
        }
        return new THREE.Object3D();
    });

    const ctl_flip = new THREE.Object3D();
    const ctl_rotation = new THREE.Object3D();
    const ctl_scale = new THREE.Object3D();
    ctl_scale.scale.set(scale, scale, scale);
    const ctl_offset = new THREE.Object3D();
    ctl_offset.position.set(-xmin - (x_range / 2), -ymin - (y_range / 2), -zmin - (z_range / 2));
    objects.forEach(obj => {
        ctl_offset.add(obj);
    });
    ctl_scale.add(ctl_offset);
    ctl_rotation.add(ctl_scale);
    ctl_rotation.rotation.set(-2.57, 0, 0.2513);  // hard coded for typical orientation
    ctl_flip.add(ctl_rotation);
    scene.add(ctl_flip);

    camera.position.z = 12;
    camera.position.y = 2;
    const axes = new THREE.AxesHelper(2.0);
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
    document.getElementById('console').innerText = `
Scene polycount: ${renderer.info.render.triangles}
Active Drawcalls: ${renderer.info.render.calls}
Geometries in Memory: ${renderer.info.memory.geometries}
`;


    rangeX.addEventListener('input', (evt) => {
        const frac = rangeX.value / 100;
        const deg = frac * 360 - 180;
        ctl_flip.rotation.x = THREE.Math.degToRad(deg);
        render();
    });
    rangeY.addEventListener('input', (evt) => {
        const frac = rangeY.value / 100;
        const deg = frac * 360 - 180;
        ctl_flip.rotation.y = THREE.Math.degToRad(deg);
        render();
    });
    rangeZ.addEventListener('input', (evt) => {
        const frac = rangeZ.value / 100;
        const deg = frac * 360 - 180;
        ctl_flip.rotation.z = THREE.Math.degToRad(deg);
        render();
    });

    elm.addEventListener('mousemove', (event) => {
        event.preventDefault();

        feedback.style.top = `${event.pageY}px`;
        feedback.style.left = `${event.pageX + 35}px`;

        const offset = elm.getBoundingClientRect();
        mouse.x = ((event.clientX - offset.left) / elm.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - offset.top) / elm.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const casts = raycaster.intersectObjects(scene.children, true).filter(obj => obj.object.name.length > 2);
        casts.sort((a, b) => a.distance - b.distance);
        if (casts.length > 1) {
            const label = casts[0].object.name.length > 0 ? casts[0].object.name : 'None';
            header_label.innerText = label;
            feedback_p.innerHTML = label;
            feedback.style.display = 'block';
        } else {
            if (feedback.style.display == 'block') {
                feedback.style.display = 'none';
            }
        }
    }, false);
};


if (window.File && window.FileReader && window.FileList && window.Blob) {
    var fileSelected = document.getElementById('txtfiletoread');
    fileSelected.addEventListener('change', function (e) {
        //Get the file object
        var fileTobeRead = fileSelected.files[0];
        //Check of the extension match
        console.log(fileTobeRead.type);
        if (fileTobeRead.type == 'application/json' || fileTobeRead.type == '') {
            //Initialize the FileReader object to read the 2file
            var fileReader = new FileReader();
            fileReader.onload = function (e) {
                const content = JSON.parse(fileReader.result);
                init(content);
            }
            fileReader.readAsText(fileTobeRead);
        } else {
            alert("Must be json file");
        }

    }, false);
} else {
    alert("Files are not supported");
}
