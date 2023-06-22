function triangleArea(triangle) {
  const S0 =
      ((triangle[0].y + triangle[1].y) / 2) * (triangle[0].x - triangle[1].x),
    S1 =
      ((triangle[1].y + triangle[2].y) / 2) * (triangle[1].x - triangle[2].x),
    S2 =
      ((triangle[2].y + triangle[0].y) / 2) * (triangle[2].x - triangle[0].x);

  return S0 + S1 + S2;
}

function isPointInsideTriangle(triangle, point) {
  const S0 = triangleArea([triangle[0], triangle[1], point]),
    S1 = triangleArea([triangle[1], triangle[2], point]),
    S2 = triangleArea([triangle[2], triangle[0], point]);
  if (S0 + S1 + S2 > 0) return true;
  return false;
}
function pointLocationToLine(linePoint1, linePoint2, point3) {
  const tmp =
    (point3.x - linePoint1.x) * (linePoint2.y - linePoint1.y) -
    (point3.y - linePoint1.y) * (linePoint2.x - linePoint1.x);
  if (tmp > 0) return 1;
  if (tmp < 0) return -1;
  return 0;
}
function isPointInsideRectangle(rectangle, point) {
  const tmp0 = pointLocationToLine(rectangle[0], rectangle[1], point),
    tmp1 = pointLocationToLine(rectangle[1], rectangle[2], point),
    tmp2 = pointLocationToLine(rectangle[2], rectangle[3], point),
    tmp3 = pointLocationToLine(rectangle[3], rectangle[0], point);
  if (tmp0 >= 0 && tmp1 >= 0 && tmp2 >= 0 && tmp3 >= 0) return true;
  return false;
}
function isRectangleIntersect(rectangle1, rectangle2) {
  for (let i = 0; i < 4; i++)
    if (isPointInsideRectangle(rectangle1, rectangle2[i])) return true;
  for (let i = 0; i < 4; i++)
    if (isPointInsideRectangle(rectangle2, rectangle1[i])) return true;
  return false;
}

function massToVec2(mass) {
  let Obj = [];

  for (let i = 0; i < mass.length; i += 2) {
    Obj.push({ x: mass[i], y: mass[i + 1] });
  }
  return Obj;
}

function massFromSelfObj(centerCoords, selfObj) {
  const massCoords = [
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: -1, y: 1 },
  ];
  let mass = [];
        
  for (let i =0 ; i < 4; i++)
  {
    mass.push({
      x:
        massCoords[i].x * selfObj.info.scale.x * cos(selfObj.info.angle) +
        massCoords[i].y * selfObj.info.scale.y * sin(selfObj.info.angle),
      y:in_pos.y * scale.y * cos(angle) - in_pos.x * scale.x * sin(angle) + pos.y);
    });
  }
  return [
    centerCoords.x +
      (selfObj.info.scale.x * Math.cos(selfObj.info.angle) +
        selfObj.info.scale.y * Math.sin(selfObj.info.angle)),
    centerCoords.y +
      (selfObj.info.scale.x * Math.sin(selfObj.info.angle) +
        selfObj.info.scale.y * Math.cos(selfObj.info.angle)),
    centerCoords.x +
      (selfObj.info.scale.x * Math.cos(selfObj.info.angle) +
        selfObj.info.scale.y * Math.sin(selfObj.info.angle)),
    centerCoords.y -
      (selfObj.info.scale.x * Math.sin(selfObj.info.angle) +
        selfObj.info.scale.y * Math.cos(selfObj.info.angle)),
    centerCoords.x -
      (selfObj.info.scale.x * Math.cos(selfObj.info.angle) +
        selfObj.info.scale.y * Math.sin(selfObj.info.angle)),
    centerCoords.y -
      (selfObj.info.scale.x * Math.sin(selfObj.info.angle) +
        selfObj.info.scale.y * Math.cos(selfObj.info.angle)),
    centerCoords.x -
      (selfObj.info.scale.x * Math.cos(selfObj.info.angle) +
        selfObj.info.scale.y * Math.sin(selfObj.info.angle)),
    centerCoords.y +
      (selfObj.info.scale.x * Math.sin(selfObj.info.angle) +
        selfObj.info.scale.y * Math.cos(selfObj.info.angle)),
  ];
}

module.exports = {
  pointLocationToLine: pointLocationToLine,
  isPointInsideTriangle: isPointInsideTriangle,
  isPointInsideRectangle: isPointInsideRectangle,
  isRectangleIntersect: isRectangleIntersect,
  massToVec2: massToVec2,
  massFromSelfObj: massFromSelfObj,
};
