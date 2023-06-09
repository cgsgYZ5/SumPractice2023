import { Time } from "../../main.js";

let SliderValue = 0;

export function Slider1Update() {
  const tag = document.getElementById("slider1");
  if (Time.isPause == true) {
    let dtime = tag.value - SliderValue;
    Time.localTime -= dtime;
    Time.isPause += dtime;
  }
  SliderValue = tag.value;
}
