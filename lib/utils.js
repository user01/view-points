function getUrlParams() {
  // https://stackoverflow.com/a/901144/2601448
  var match,
    pl = /\+/g,  // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
    query = window.location.search.substring(1);

  urlParams = {};
  while (match = search.exec(query)) {
    urlParams[decode(match[1])] = decode(match[2]);
  }
  return urlParams;
}

function pointsets_local_remote(pointsets, compression_range = 2000000000) {
  const points_merged = R.pipe(
    R.map(R.prop('points')),
    R.unnest,
  )(pointsets);

  const x_extent = d3.extent(points_merged, R.nth(0));
  const y_extent = d3.extent(points_merged, R.nth(1));
  const z_extent = d3.extent(points_merged, R.nth(2));

  const range = [0, compression_range];

  const x_scale = d3.scaleLinear()
    .domain(x_extent)
    .range(range);

  const y_scale = d3.scaleLinear()
    .domain(y_extent)
    .range(range);

  const z_scale = d3.scaleLinear()
    .domain(z_extent)
    .range(range);


  const points_adjusted = pointsets.map(item => {
    const points = item.points.map(point => {
      return {
        x: Math.round(x_scale(point[0])),
        y: Math.round(y_scale(point[1])),
        z: Math.round(z_scale(point[2]))
      };
    });
    return R.pipe(
      R.merge(R.__, { points }),
      i => 'points_raw' in i ? R.dissoc('points_raw', i) : i,
      R.identity
    )(item);
  });

  return {
    extent_x: {
      min: x_extent[0],
      max: x_extent[1]
    },
    extent_y: {
      min: y_extent[0],
      max: y_extent[1]
    },
    extent_z: {
      min: z_extent[0],
      max: z_extent[1]
    },
    compression_range,
    pointsets: points_adjusted
  };
}

function pointsets_remote_local(pointsets) {
  const compression_range = pointsets['compression_range']
  const range = [0, compression_range];


  const x_scale = d3.scaleLinear()
    .domain(range)
    .range([pointsets['extent_x']['min'], pointsets['extent_x']['min']]);

  const y_scale = d3.scaleLinear()
    .domain(range)
    .range([pointsets['extent_y']['min'], pointsets['extent_y']['min']]);

  const z_scale = d3.scaleLinear()
    .domain(range)
    .range([pointsets['extent_z']['min'], pointsets['extent_z']['min']]);


  const points_adjusted = pointsets['pointsets'].map(item => {
    const points = item.points.map(point => [
      x_scale(point['x']),
      y_scale(point['y']),
      z_scale(point['z'])
    ]);
    return R.pipe(
      R.merge(R.__, { points }),
      // i => 'points_raw' in i ? R.dissoc('points_raw', i) : i,
      R.identity
    )(item);
  });

  return points_adjusted;
}


function generate_payload(size) {

  // Exemplary payload
  var pts = [
    {
      "name": "buttons",
      "visible": true,
      "size": 1.25,
      "color0": "#d4c9ab",
      "color1": "#3f4bad",
      "points": R.pipe(R.range(0), R.map(i => [1.2, 5000, 0]))(size)
    },
    {
      "name": "mittens",
      "visible": false,
      "size": 2.25,
      "color0": "#d4c0ab",
      "color1": "#3f4bad",
      "points": [
        [
          2.4,
          3.8,
          90.8
        ],
      ]
    },
  ];
  const payload_sets = pointsets_local_remote(pts);
  return payload_sets;
}

function there_and_back(PointSets, payload_sets) {

  // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
  var errMsg_et = PointSets.verify(payload_sets);
  if (errMsg_et)
    throw Error(errMsg_et);

  // Create a new message
  var message_sets = PointSets.create(payload_sets); // or use .fromObject if conversion is necessary

  // Encode a message to an Uint8Array (browser) or Buffer (node)
  var buffer_sets = PointSets.encode(message_sets).finish();
  // ... do something with buffer

  console.log(buffer_sets);
  var u8 = buffer_sets;
  var b64encoded = btoa(String.fromCharCode.apply(null, u8));

  var string_packed = pack(buffer_sets);
  var u8 = buffer_sets;
  var decoder = new TextDecoder('utf8');
  // console.log(decoder.decode(u8));
  // var base64EncodedStr = encodeURIComponent(u8);
  // console.log(base64EncodedStr);
  // var b64encoded = btoa(decoder.decode(u8));

  var string_base64 = btoa(JSON.stringify(payload_sets));
  // console.log(string_packed);
  // console.log(b64encoded);
  // console.log(string_base64);
  console.log(`${string_packed.length} vs ${b64encoded.length} vs ${string_base64.length}`)
  // console.log(`${string_packed.length} vs ${b64encoded.length} vs ${string_base64.length}`)
  var uint8array = unpack(string_packed);


  // Decode an Uint8Array (browser) or Buffer (node) to a message
  var message_sets = PointSets.decode(uint8array);
  // var message_set = PointSet.decode(buffer_set);
  // ... do something with message_set
  console.log(message_sets);

  // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

  // Maybe convert the message back to a plain object
  var object_sets = PointSets.toObject(message_sets, {
    longs: String,
    enums: String,
    bytes: String,
    // see ConversionOptions
  });
  // object_set['points'] = object_set['points'].map(obj => [obj.x, obj.y, obj.z]);
  console.log('object_sets');
  console.log(object_sets);
  return object_sets;
}