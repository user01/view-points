// https://stackoverflow.com/a/14991797/2601448
function parseCSV(str, delimiter = ',') {
  var arr = [];
  var quote = false; // true means we're inside a quoted field

  // iterate over each character, keep track of current row and column (of the returned array)
  for (var row = col = c = 0; c < str.length; c++) {
    var cc = str[c],
      nc = str[c + 1]; // current character, next character
    arr[row] = arr[row] || []; // create a new row if necessary
    arr[row][col] = arr[row][col] || ''; // create a new column (start with empty string) if necessary

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current column and skip the next character
    if (cc == '"' && quote && nc == '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }

    // If it's just one quotation mark, begin/end quoted field
    if (cc == '"') {
      quote = !quote;
      continue;
    }

    // If it's a comma and we're not in a quoted field, move on to the next column
    if (cc == delimiter && !quote) {
      ++col;
      continue;
    }

    // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
    // and move on to the next row and move to column 0 of that new row
    if (cc == '\r' && nc == '\n' && !quote) {
      ++row;
      col = 0;
      ++c;
      continue;
    }

    // If it's a newline (LF or CR) and we're not in a quoted field,
    // move on to the next row and move to column 0 of that new row
    if (cc == '\n' && !quote) {
      ++row;
      col = 0;
      continue;
    }
    if (cc == '\r' && !quote) {
      ++row;
      col = 0;
      continue;
    }

    // Otherwise, append the current character to the current column
    arr[row][col] += cc;
  }
  return arr.map(line => line.map(x => +x));
}

function parse_json(points_raw) {
  try {
    var points = JSON.parse(points_raw);
    if (valid_point_set(points)) {
      return points;
    }
  } catch (e) { }
  return false;
}

function parse_numpy(points_raw) {
  if (points_raw.indexOf("array(") != 0) {
    return false;
  }
  const points_raw_json = R.pipe(
    R.replace(/array\(/g, ''),
    R.replace(/\)/g, ''),
    R.replace(/\.,/g, '.0,'),
    R.replace(/\.\]/g, '.0]')
  )(points_raw)

  return parse_json(points_raw_json);
}

function parse_csv(points_raw) {
  try {
    var points = parseCSV(points_raw, ',');
    if (valid_point_set(points)) {
      return points;
    }
  } catch (e) { }
  return false;
}

function parse_tsv(points_raw) {
  try {
    var points = points_raw.split('\n').map(line => line.split(/\s+/g).map(x => +x));
    if (valid_point_set(points)) {
      return points;
    }
  } catch (e) { }
  return false;
}

function valid_point_set(points) {
  if (!R.is(Array, points)) {
    return false;
  }
  for (var i = 0; i < points.length; i++) {
    var elm = points[i];
    if (!R.is(Array, elm)) {
      return false;
    }
    if (elm.length != 3) {
      return false;
    }
  }

  return true;
}

function parse_points(points_raw) {
  const points_json = parse_json(points_raw);
  if (points_json != false) {
    // console.log('json', points_json);
    return points_json;
  }
  const points_numpy = parse_numpy(points_raw);
  if (points_numpy != false) {
    // console.log('numpy', points_numpy);
    return points_numpy;
  }
  const points_csv = parse_csv(points_raw);
  if (points_csv != false) {
    // console.log('csv', points_csv);
    // console.log(points_csv);
    return points_csv;
  }
  const points_tsv = parse_tsv(points_raw);
  if (points_tsv != false) {
    console.log('tsv', points_tsv);
    return points_tsv;
  }
  console.log('Failed to parse', points_raw);
  return [];
}

const colors = ["#e6194b", "#3cb44b", "#ffe119", "#0082c8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#d2f53c", "#fabebe", "#008080", "#e6beff", "#aa6e28", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000080", "#808080", "#FFFFFF", "#000000"];
const size = 5;
const range = [-size, size];

function fix_points(data) {
  const points = R.pipe(
    R.map(R.prop('points')),
    R.unnest,
  )(data);

  const x_extent = d3.extent(points, R.nth(0));
  const y_extent = d3.extent(points, R.nth(1));
  const z_extent = d3.extent(points, R.nth(2));

  const x_diff = x_extent[1] - x_extent[0];
  const y_diff = y_extent[1] - y_extent[0];
  const z_diff = z_extent[1] - z_extent[0];
  const diff = Math.max(x_diff, y_diff, z_diff);

  const x_scale = d3.scaleLinear()
    .domain([x_extent[0], x_extent[0] + diff])
    .range(range);

  const y_scale = d3.scaleLinear()
    .domain([y_extent[0], y_extent[0] + diff])
    .range(range);

  const z_scale = d3.scaleLinear()
    .domain([z_extent[0], z_extent[0] + diff])
    .range(range);

  return data.map(item => {
    const points = item.points.map(point => [
      x_scale(point[0]),
      y_scale(point[1]),
      z_scale(point[2])
    ]);
    return R.merge(item, {
      points
    });
  });
}

function add_raw_points(data) {
  return data.map(item => {
    const points_raw = JSON.stringify(item.points);
    return R.merge(item, {
      points_raw
    });
  });
}

function init(data) {
  const elm = document.getElementById('render-port');
  const feedback = document.getElementById('feedback');
  const feedback_p = document.getElementById('hover');


  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  var stats;
  var match,
    pl = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
    query = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query)) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  console.log(urlParams);

  if ('stats' in urlParams) {
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
  }
  if ('view' in urlParams) {
    const leftCol = document.getElementById('render-port');
    const rightCol = document.getElementById('control-port');
    leftCol.classList.remove('col-sm-8');
    leftCol.classList.add('col-sm-12');
    rightCol.classList.remove('col-sm-4');
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, elm.clientWidth / elm.clientHeight, 0.001, 1000);
  camera.position.z = 12;
  // camera.position.y = 10;

  scene.background = new THREE.Color(0xe9ecef);
  scene.add(new THREE.AmbientLight(0x505050, 3.75));

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


  const add_cloud = (data) => {
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

  const add_spheres = (data) => {
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

  const add_plane = (data) => {
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


  const add_path = (data) => {
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

  const add_vector = (data) => {
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

  const header_label = document.getElementById("header-label")

  function render() {

    raycaster.setFromCamera(mouse, camera);

    var intersects = R.pipe(
      R.filter(o => o.object.name.length > 2),
      // R.filter(o => !o.object.name.includes('cloud')),
      R.sortBy(o => o.distance)
    )(raycaster.intersectObjects(
      scene.children
    ));

    // console.log(intersects.map(i => i.object.name));
    if (intersects.length > 0) {
      // header_label.innerHTML = `${Number.parseFloat(mouse.x).toFixed(2)} x ${Number.parseFloat(mouse.y).toFixed(2)} ${intersects[0].object.name}`;
      header_label.innerHTML = intersects[0].object.name;
      feedback_p.innerHTML = intersects[0].object.name;
      feedback.style.display = 'block';
    } else {
      if (feedback.style.display == 'block') {
        feedback.style.display = 'none';
      }
    }
    renderer.render(scene, camera);
    if (stats) {
      stats.update();
    }
  }

  function onWindowResize() {
    camera.aspect = elm.clientWidth / elm.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(elm.clientWidth, elm.clientHeight);
    render();
  }

  function animate() {
    if (stats) {
      stats.begin();
    }
    controls.update();

    render();
    if (stats) {
      stats.end();
    }
    setTimeout(function () {
      requestAnimationFrame(animate);
    }, 1000 / 60);
  }

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(elm.clientWidth, elm.clientHeight);

  function onDocumentMouseMove(event) {
    event.preventDefault();
    feedback.style.top = `${event.pageY}px`;
    feedback.style.left = `${event.pageX + 35}px`;

    const offset = elm.getBoundingClientRect();
    mouse.x = ((event.clientX - offset.left) / elm.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - offset.top) / elm.clientHeight) * 2 + 1;
  }

  function onDocumentMouseDown(e) {
    e.preventDefault();
    // leverage html for id
    const cur_sel = feedback_p.innerHTML;
    // Do regex (remove #number and spaces for id)

    const element_id = cur_sel.replace(/^\w+/, '').replace(/\s+/g, '').replace(/#\d+$/, '');
    console.log(`Started with ${cur_sel} and ended with ${element_id}`);
    const element = document.getElementById(element_id);
    if (element) {
      VueScrollTo.scrollTo(element);
    } else {
      const element_id_num = cur_sel.replace(/^\w+/, '').replace(/\s+/g, '');
      console.log(`Fall back with ${cur_sel} and ended with ${element_id_num}`);
      const element_num = document.getElementById(element_id);
      if (element_num) {
        VueScrollTo.scrollTo(element_num);
      } else {
        console.warn(`Unable to find ${cur_sel}`);
      }
    }
  }

  elm.appendChild(renderer.domElement);

  new Clipboard('.btn-clipboard');
  window.addEventListener('resize', onWindowResize, false);
  elm.addEventListener('mousemove', onDocumentMouseMove, false);
  elm.addEventListener('mousedown', onDocumentMouseDown, false);
  elm.addEventListener('mouseover', ()=>{
    feedback.style.opacity = '1.0';
    console.log('over')
  }, false);
  elm.addEventListener('mouseout', ()=>{
    feedback.style.opacity = '0.0';
    console.log('out')
  }, false);
  render();
  animate();

  const vm = new Vue({
    el: '#vue-forms',
    data: {
      filter: '',
      pointSets: [],
    },
    methods: {
      purgeVisible: function () {
        // console.log(this.filter);
        this.pointSets = this.pointSets.filter(set => !set.name.includes(this.filter));
      },
      toggleVisible: function () {
        const filter = this.filter;
        const unified_visibility_state = R.pipe(
          R.map(R.prop('visible')),
          R.uniq,
          R.length,
          R.equals(1)
        )(this.pointSets);

        this.pointSets = this.pointSets.map(set => !set.name.includes(this.filter) ? set : R.merge(set, {
          visible: unified_visibility_state ? !set.visible : false
        }));
      },
      downloadCurrentSet: function () {
        const text = this.fullset;
        var fileSelected = document.getElementById('txtfiletoread');
        const prefix = fileSelected.files.length > 0 ? fileSelected.files[0].name.replace('.json', '') : 'points';
        const filename = `${prefix}.${(new Date()).toISOString()}.json`;
        const blob = new Blob([text], {
          type: "application/json;charset=utf-8"
        });
        saveAs(blob, filename);
      },
      copyToClipboard: function () {
        console.log(this.url);
        if (this.url !== false) {
          const elm = document.querySelector('#clipboard-target')
          elm.value = this.url;
          elm.select();
          document.execCommand('copy');
          if (!status) {
            console.error("Cannot copy text");
          } else {
            console.log("The text is now on the clipboard");
          }
        }
      },
      addNewPointSet: function () {
        points = R.pipe(
          R.range(0),
          R.map(idx => {
            return R.range(0, 3).map(x => chance.floating({
              min: -1,
              max: 1,
              fixed: 1
            }))
          }),
        )(4);
        this.pointSets.push({
          name: `Points-${this.pointSets.length}`,
          visible: true,
          size: 1.25,
          color0: chance.color({
            format: 'hex'
          }),
          color1: chance.color({
            format: 'hex'
          }),
          points_raw: points.map(line => line.join(',')).join('\n'),
          points,
          type: "sphere"
        });
      }
    },
    watch: {
      // whenever pointSets changes, this function will run
      pointSets: {
        handler(newpointSets, oldpointSets) {
          // console.log(this.filter);
          // console.log(newpointSets);
          const fixedPointSets = newpointSets.filter(set => set.name.includes(this.filter)).map(set => {
            // TODO: handle python strings
            const points = parse_points(set.points_raw);
            return R.merge(set, {
              points
            });
          });

          // console.log(JSON.stringify(fixedPointSets));
          update_scene(fixedPointSets);
        },
        deep: true,
      },
      filter: {
        handler() {
          // console.log(this.filter);
          // TODO: DRY out this code with pointSets watcher
          const fixedPointSets = this.pointSets.filter(set => set.name.includes(this.filter)).map(set => {
            // TODO: handle python strings
            const points = parse_points(set.points_raw);
            return R.merge(set, {
              points
            });
          });

          // console.log(JSON.stringify(fixedPointSets));
          update_scene(fixedPointSets);
        },
        deep: false,
      }
    },
    computed: {
      url: {
        get: function () {
          if (this.url_raw.length < 8192) {
            return this.url_raw;
          } else {
            return false;
          }
        }
      },
      url_raw: {
        get: function () {
          const text = this.fullset;
          const base64 = btoa(text);
          const url = `${window.location.href}?data=${base64}`;
          return url;
        }
      },
      fullset: {
        get: function () {
          return JSON.stringify(this.pointSets);
        },
        set: function (newValue) {
          this.pointSets = JSON.parse(newValue)
        }
      }
    }
  });

  VueScrollTo.setDefaults({
    container: "#scroll-target",
    duration: 500,
    easing: "ease",
    offset: 0,
    cancelable: true,
    onDone: false,
    onCancel: false,
    x: false,
    y: true
  });

  var current_objects = [];
  const update_scene_ = (data) => {
    current_objects.forEach(obj => scene.remove(obj));

    current_objects = R.pipe(
      fix_points,
      R.map(item => {
        if (!item.visible) {
          const obj = new THREE.Object3D();
          scene.add(obj);
          return obj;
        }
        switch (item.type) {
          case 'cloud':
            return [add_cloud(item)];
          case 'sphere':
            return add_spheres(item);
          case 'plane':
            return add_plane(item);
          case 'path':
            return [add_path(item)];
          case 'vector':
            return add_vector(item);
          default:
            console.warn('Un-used item');
            console.warn(item);
            const obj = new THREE.Object3D();
            scene.add(obj);
            return [obj];
        }
      }),
      R.flatten
    )(data);
  };
  const update_scene = _.debounce(update_scene_, 250);

  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var fileSelected = document.getElementById('txtfiletoread');
    fileSelected.addEventListener('change', function (e) {
      //Set the extension for the file
      var fileExtension = /text.*/;
      //Get the file object
      var fileTobeRead = fileSelected.files[0];
      //Check of the extension match
      console.log(fileTobeRead.type);
      if (fileTobeRead.type == 'application/json' || fileTobeRead.type == '') {
        //Initialize the FileReader object to read the 2file
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
          // var fileContents = document.getElementById('filecontents');
          // fileContents.innerText = fileReader.result;
          // console.log(fileReader.result);
          vm.fullset = JSON.stringify(add_raw_points(JSON.parse(fileReader.result)));
        }
        fileReader.readAsText(fileTobeRead);
      } else {
        alert("Must be json file");
      }

    }, false);
  } else {
    alert("Files are not supported");
  }

  if (urlParams['data']) {
    const newData = JSON.parse(atob(urlParams['data']));
    console.log(newData);
    vm.fullset = atob(urlParams['data']);
  } else if (urlParams['ref']) {
    const ref = urlParams['ref'];
    // console.log(ref);
    const refUrl = atob(ref);
    // console.log(refUrl);

    fetch(refUrl)
      .then((response) => {
        return response.json();
      }).then((data) => {
        // console.log('parsed data', data);
        // update_scene(json);
        vm.fullset = JSON.stringify(data);
      }).catch((ex) => {
        console.error('parsing failed')
        console.error(ex);
      });
  }
}

init();