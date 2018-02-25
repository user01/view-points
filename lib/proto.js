
// packing/unpacking from https://codereview.stackexchange.com/a/3589/126736
function pack(bytes) {
  var chars = [];
  for (var i = 0, n = bytes.length; i < n;) {
    chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
  }
  return String.fromCharCode.apply(null, chars);
}

function unpack(str) {
  var bytes = [];
  for (var i = 0, n = str.length; i < n; i++) {
    var char = str.charCodeAt(i);
    bytes.push(char >>> 8, char & 0xFF);
  }
  return bytes;
}