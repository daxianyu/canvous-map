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

export function getDistance(p1, p2){
  const { lat:lat01, lng:lng01 } = p1
  const { lat:lat02, lng:lng02 } = p2
  return window.AMap.GeometryUtil.distance([lng01, lat01], [lng02, lat02])
}
