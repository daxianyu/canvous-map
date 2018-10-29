/* convert amap lnglat to x-y */

let reUseAbleLngLat;

/** reUse LngLat obj for better performance */
export function convertToXy(map, sourcePoint) {
  const { lng, lat } = sourcePoint;
  if (!reUseAbleLngLat) {
    reUseAbleLngLat = new window.AMap.LngLat(0, 0);
  }
  reUseAbleLngLat.O = lng
  reUseAbleLngLat.lng = lng
  reUseAbleLngLat.P = lat
  reUseAbleLngLat.lat = lat
  return map.lngLatToContainer(reUseAbleLngLat);
}

export function convertXyWidthToLngLatWidth(map, center, zoom) {
  const Pixel = window.AMap.Pixel;
  const lnglatTopLeft = map.pixelToLngLat(new Pixel(0, 0), zoom);
  const lnglatCenter = map.pixelToLngLat(new Pixel(center.x, center.y), zoom);
  return (
    (lnglatCenter.lng - lnglatTopLeft.lng) ** 2 + (lnglatCenter.lat - lnglatTopLeft.lat)
  ) ** 0.5;
}

export function convertDistanceToXy(distance, zoom) {
  const scale = 20 - zoom;
  return distance / parseInt(2 ** scale, 10);
}
