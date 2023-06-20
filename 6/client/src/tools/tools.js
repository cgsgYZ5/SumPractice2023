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
