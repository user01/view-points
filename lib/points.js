
// function range_points(data) {
//   const points = R.pipe(
//     R.map(R.prop('points')),
//     R.unnest,
//   )(data);

//   const x_extent = d3.extent(points, R.nth(0));
//   const y_extent = d3.extent(points, R.nth(1));
//   const z_extent = d3.extent(points, R.nth(2));

//   const x_diff = x_extent[1] - x_extent[0];
//   const y_diff = y_extent[1] - y_extent[0];
//   const z_diff = z_extent[1] - z_extent[0];
//   const diff = Math.max(x_diff, y_diff, z_diff);
//   return [
//     x_extent[0],
//     y_extent[0],
//     z_extent[0],
//     diff
//   ];
// }

function fix_points(data, range = [-5, 5]) {
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
