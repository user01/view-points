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