import { Time } from "../../main.js";

export function ButtonInit(tag, event, func) {
  const button1 = document.getElementById(tag);
  button1.addEventListener(event, func);
}

export function Button1Update() {
  Time.isPause = !Time.isPause;
}
