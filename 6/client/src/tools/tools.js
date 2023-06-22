import Cookies from "js-cookie";

export function goHome() {
  Cookies.remove("gameInfo");
  location.assign("../homePage/homePage.html");
}

export function logOut(status) {
  // if (status) socket.disconnect();
  Cookies.remove("name");
  location.assign("../index.html");
}
/* error defiened */
const errorForm = document.getElementById("errorForm");
export function error(err, url = null, go = null) {
  document.getElementById("errorMessange").innerText = err;
  errorForm.style.display = "block";
  console.log(err);

  document.getElementById("errorFormClose").addEventListener("click", () => {
    if (url == null) {
      if (go == "home") goHome();
      else if (go == "logout") logOut();
    } else location.assign(url);
  });
}
document.getElementById("errorFormClose").addEventListener("click", () => {
  errorForm.style.display = "none";
});

export function triangleArea(triangle) {
  const S0 =
      ((triangle[0].y + triangle[1].y) / 2) * (triangle[0].x - triangle[1].x),
    S1 =
      ((triangle[1].y + triangle[2].y) / 2) * (triangle[1].x - triangle[2].x),
    S2 =
      ((triangle[2].y + triangle[0].y) / 2) * (triangle[2].x - triangle[0].x);

  return S0 + S1 + S2;
}

export function isPointInsideTriangle(triangle, point) {
  const S0 = triangleArea([triangle[0], triangle[1], point]),
    S1 = triangleArea([triangle[1], triangle[2], point]),
    S2 = triangleArea([triangle[2], triangle[0], point]);
  if (S0 + S1 + S2 > 0) return true;
  return false;
}
export function isPointInsideRectangle(rectangle, point) {
  const tmp0 = triangleArea([rectangle[0], rectangle[1], point]),
    tmp1 = triangleArea([rectangle[1], rectangle[2], point]),
    tmp2 = triangleArea([rectangle[2], rectangle[3], point]),
    tmp3 = triangleArea([rectangle[3], rectangle[0], point]);
  if (tmp0 < 0 && tmp1 < 0 && tmp2 < 0 && tmp3 < 0) return true;
  // const triangleS = triangleArea(triangle),
  //   S0 = triangleArea([triangle[0], triangle[1], point]),
  //   S1 = triangleArea([triangle[1], triangle[2], point]),
  //   S2 = triangleArea([triangle[2], triangle[0], point]);
  // if (triangleS < S0 + S1 + S2) return true;
  return false;
}
