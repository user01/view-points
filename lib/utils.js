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

function pointsets_local_remote(pointsets, compression_range = 2000000000){
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
    const points = item.points.map(point => [
      Math.round(x_scale(point[0])),
      Math.round(y_scale(point[1])),
      Math.round(z_scale(point[2]))
    ]);
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

