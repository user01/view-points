
function add_cloud(scene, data) {
  console.log(`Adding cloud ${data.name}`);

  var geom = new THREE.Geometry();
  var material = new THREE.PointsMaterial({
    size: data.size,
    transparent: true,
    opacity: 0.2,
    color: data.color0,
    alphaTest: 0.2,
    map: sprite = new THREE.TextureLoader().load("disc.png")
  });
  const max_points_per_cloud = 500;
  const threshold = Math.min(max_points_per_cloud / data.points.length, 1);
  console.log(threshold);
  // console.log(data.points.length);
  var count = 0;
  for (var i = 0; i < data.points.length; i++) {
    var particle = new THREE.Vector3(
      data.points[i][0],
      data.points[i][1],
      data.points[i][2],
    );
    if (Math.random() > 1 - threshold || data.points.length < max_points_per_cloud) {
      geom.vertices.push(particle);
      count++;
    }
  }
  console.log(`Reduced cloud ${data.name} to ${count} points`);
  const cloud = new THREE.Points(geom, material);
  cloud.name = `Cloud ${data.name}`;
  scene.add(cloud);
  return cloud;
}

function add_spheres(scene, data) {
  console.log(`Adding spheres ${data.name}`);

  const count = data.size > 0.1 && data.points.length < 20 ? 32 : 8;
  const material = new THREE.MeshBasicMaterial({
    color: data.color0
  });
  const geometry = new THREE.SphereGeometry(data.size, count, count);

  const spheres = data.points.map((point, i) => {
    const sphere = new THREE.Mesh(geometry, material);
    sphere.name = `Sphere ${data.name} #${i}`;
    scene.add(sphere);
    sphere.position.set(data.points[i][0],
      data.points[i][1],
      data.points[i][2]);
    return sphere;
  })

  return spheres;
}

function add_plane(scene, data) {
  console.log(`Adding plane ${data.name}`);

  if (data.points.length != 4) {
    console.warn(`Skipped ${data.name} due to count of ${data.points.length} points`);
    return new THREE.Object3D();
  }

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.3,
    color: data.color0,
    alphaTest: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const geometry = new THREE.Geometry();
  for (var i = 0; i < data.points.length; i++) {
    var particle = new THREE.Vector3(
      data.points[i][0],
      data.points[i][1],
      data.points[i][2],
    );
    geometry.vertices.push(particle);
  }
  geometry.faces.push(
    new THREE.Face3(2, 1, 0), //use vertices of rank 2,1,0
    new THREE.Face3(3, 1, 2) //vertices[3],1,2...
  );
  const plane = new THREE.Mesh(geometry, material);
  plane.name = `Plane ${data.name}`;
  scene.add(plane);
  const spheres = add_spheres(data);
  return R.concat([plane], spheres);
}


function add_path(scene, data) {
  if (data.points.length < 2) {
    return new THREE.Object3D();
  }
  const tube_material = new THREE.MeshPhongMaterial({
    // wireframe: true,
    side: THREE.DoubleSide,
    color: data.color0
    // color: 0xff00ff
  });
  const spline_tube = new THREE.CatmullRomCurve3(data.points.map((l) => new THREE.Vector3(l[0], l[1], l[2])));
  const geometry_tube = new THREE.TubeGeometry(spline_tube,
    64, // tubularSegments
    data.size, // radius
    12, // radialSegments
    false);
  const mesh = new THREE.Mesh(geometry_tube, tube_material);
  mesh.name = `Path ${data.name}`;
  scene.add(mesh);
  return mesh;
};

function add_vector(scene, data) {
  if (!data.visible || data.points.length < 1 || data.points.length % 2 != 0) {
    return [new THREE.Object3D()];
  }

  const tube_material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    color: data.color0
  });
  const pairs = R.splitEvery(2, data.points);
  const vectors = pairs.map((pair_set, i) => {
    const spline_tube = new THREE.CatmullRomCurve3(pair_set.map((l) => new THREE.Vector3(l[0], l[1], l[2])));
    const geometry_tube = new THREE.TubeGeometry(spline_tube,
      8, // tubularSegments
      data.size, // radius
      8, // radialSegments
      false);
    const mesh = new THREE.Mesh(geometry_tube, tube_material);
    mesh.name = `Vector ${data.name} #${i}`;
    scene.add(mesh);
    return mesh;
  });
  return vectors;
};
