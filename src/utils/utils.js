/* convert amap lnglat to x-y */

export function convertToXy(map, sourcePoint) {
  let { lng, lat } = sourcePoint;
  if (Array.isArray(sourcePoint)) {
    lng = sourcePoint[0];
    lat = sourcePoint[1];
  }
  const convertedPoint = new window.AMap.LngLat(lng, lat);
  return map.lngLatToContainer(convertedPoint);
}

export function getDistance(p1, p2) {
  const { lat: lat01, lng: lng01 } = p1;
  const { lat: lat02, lng: lng02 } = p2;
  return window.AMap.GeometryUtil.distance([lng01, lat01], [lng02, lat02]);
}

/**
 * Coordinate transformation.
 * Transform lngLat to pixel.
 */
function lngLatToXy(map, position) {
  let { lng, lat } = position;
  if (Array.isArray(position)) {
    lng = position[0];
    lat = position[1];
  }

  const lngLat = new window.AMap.LngLat(lng, lat);
  return map.lngLatToContainer(lngLat);
}

export function createDefaultCoordinateTransformation(map) {
  return (position) => {
    return lngLatToXy(map, position);
  };
}

function convertToXySet(map, position) {
  const { x, y } = convertToXy(map, position);
  return [x, y];
}

export function createDefaultCoordinateArrayTransformation(map) {
  return (position) => {
    return convertToXySet(map, position);
  };
}
