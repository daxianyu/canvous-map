import Points from './index'

const result = []
function getCirclePoints(radius, base = {x:0, y:0}) {
  const theta = 2 * Math.PI * Math.random()
  radius = radius * Math.random()
  return {
    x: Math.ceil(radius * Math.cos(theta) + base.x),
    y: Math.ceil(radius * Math.sin(theta) + base.y)
  }
}
for (let i = 0; i < 5000; i++ ) {
  result.push(getCirclePoints(50, {x: 350, y: 150}))
}
for (let i = 0; i < 5000; i++ ) {
  result.push(getCirclePoints(100, {x: 200, y: 200}))
}
for (let i = 0; i < 5000; i++ ) {
  result.push(getCirclePoints(150, {x: 200, y: 200}))
}
for (let i = 0; i < 5000; i++ ) {
  result.push(getCirclePoints(200, {x: 200, y: 200}))
}

test('Create point drawer', () => {
  // const dataList = [
  //   {x: 1, y: 2},
  //   {x: 2, y: 3},
  //   {x: 3, y: 4},
  //   {x: 4, y: 5},
  //   {x: 5, y: 6},
  // ]
  //
  // const point = new Points(result, ()=>{
  //
  // }, {
  //
  // })

})
