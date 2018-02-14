

// fetch('data.json')
//   .then((response) => {
//     // console.log(response);
//     // return response.json();
//   }).then((json) => {
//     console.log('parsed json', json)
//     // init(json);
//     // animate();
//   }).catch((ex) => {
//     console.error('parsing failed')
//     console.error(ex)
//   });

const colors = ["#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe", "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080", "#FFFFFF", "#000000"];

function init(data) {
  const elm = document.getElementById('render-port');

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, elm.clientWidth / elm.clientHeight, 0.001, 1000);
  camera.position.z = 12;
  // camera.position.y = 10;

  scene.background = new THREE.Color(0xa0a0a0);
  scene.add(new THREE.AmbientLight(0x505050, 1.75));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 1, 1).normalize();
  scene.add(light);

  // The X axis is red.The Y axis is green.The Z axis is blue.
  const axes = new THREE.AxisHelper(5);
  axes.position = new THREE.Vector3(0, 0, 0);
  scene.add(axes);



  const controls = new THREE.TrackballControls(camera, elm);
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [65, 83, 68];
  controls.addEventListener('change', render);




  const parent = new THREE.Object3D();

  const load_points = (data) => {

    var geom = new THREE.Geometry();
    var material = new THREE.PointsMaterial({
      size: data.size,
      transparent: data.alphaTest < 1,
      opacity: data.alphaTest,
      color: data.color,
      alphaTest: data.alphaTest,
      map: sprite = new THREE.TextureLoader().load("disc.png")
    });
    for (var i = 0; i < data.points.length; i++) {
      var particle = new THREE.Vector3(
        data.points[i][0],
        data.points[i][1],
        data.points[i][2],
      );
      geom.vertices.push(particle);
    }
    const cloud = new THREE.Points(geom, material);
    cloud.name = `particles${data.color}`;
    scene.add(cloud);
    return cloud;
  }

  load_points({
    size: 0.4,
    color: 0x0000ff,
    alphaTest: 0.5,
    points: R.pipe(
      R.range(0),
      R.map(elm => {
        return [
          (elm + 1) * Math.random(),
          (elm + 1) * Math.random(),
          (elm + 1) * Math.random(),
        ]
      })
    )(5)
  });

  load_points({
    size: 0.4,
    color: 0x00ffff,
    alphaTest: 0.5,
    points: R.pipe(
      R.range(0),
      R.map(elm => {
        return [
          (elm + 1) * Math.random(),
          (elm + 1) * Math.random(),
          (elm + 1) * Math.random(),
        ]
      })
    )(8)
  });


  const pts_to_spline = (coors, mat, radius=0.1) => {
    if (coors.length < 1) {
      return new THREE.Object3D();
    }
    const spline_tube = new THREE.CatmullRomCurve3(coors.map((l) => new THREE.Vector3(l[0], l[1], l[2])));
    const geometry_tube = new THREE.TubeGeometry(spline_tube, Math.ceil(1024 * radius), radius, Math.ceil(128 * radius), false);
    const mesh = new THREE.Mesh(geometry_tube, mat);
    mesh.visible = false;
    return mesh;
  };
  const tube_material = new THREE.MeshPhongMaterial({
    // wireframe: true,
    side: THREE.DoubleSide,
    color: 0xff00ff
  });
  const test_tube = pts_to_spline(R.pipe(
    R.range(0),
    R.map(elm => {
      return [
        (elm + 1) * Math.random(),
        (elm + 1) * Math.random(),
        (elm + 1) * Math.random(),
      ]
    })
  )(8), tube_material);
  scene.add(test_tube);
  test_tube.visible = true;


  function render() {
    renderer.render(scene, camera);
    stats.update();
  }

  function onWindowResize() {
    camera.aspect = elm.clientWidth / elm.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(elm.clientWidth, elm.clientHeight);
    render();
  }

  function animate() {
    stats.begin();
    controls.update();

    render();
    stats.end();
    setTimeout(function () {
      requestAnimationFrame(animate);
    }, 1000 / 60);
  }

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(elm.clientWidth, elm.clientHeight);

  // function onDocumentMouseMove(event) {
  //   event.preventDefault();
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  // }

  elm.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
  // elm.addEventListener('mousemove', onDocumentMouseMove, false);
  render();
  animate();
}

init();