import { useEffect, useRef, useState } from "react";

export const CustomOclock = () => {
  const [time, setTime] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
    ampm: "AM",
  });
  const hhRef = useRef(null);
  const mmRef = useRef(null);
  const ssRef = useRef(null);

  const hhDotRef = useRef(null);
  const mmDotRef = useRef(null);
  const ssDotRef = useRef(null);

  const vwToPx = (vw) => (vw / 100) * window.innerWidth;
  const setCircle = (circleRef, value, max) => {
    if (!circleRef.current) return;
    const rVw = parseFloat(circleRef.current.getAttribute("r"));
    const rPx = vwToPx(rVw);
    const dash = rPx * 2 * Math.PI;
    circleRef.current.style.strokeDasharray = dash;
    circleRef.current.style.strokeDashoffset = dash - (dash * value) / max;
  };
  useEffect(() => {
    const updateClock = () => {
      let h = new Date().getHours();
      let m = new Date().getMinutes();
      let s = new Date().getSeconds();
      let ampm = h >= 12 ? "PM" : "AM";

      if (h > 12) {
        h = h - 12;
      }
      h = h < 10 ? "0" + h : h;
      m = m < 10 ? "0" + m : m;
      s = s < 10 ? "0" + s : s;

      setTime({
        hours: h,
        minutes: m,
        seconds: s,
        ampm,
      });

      setCircle(hhRef, h, 12);
      setCircle(mmRef, m, 60);
      setCircle(ssRef, s, 60);

      if (ssDotRef.current) {
        ssDotRef.current.style.transform = `rotateZ(${s * 6}deg)`;
      }
      if (mmDotRef.current) {
        mmDotRef.current.style.transform = `rotateZ(${m * 6}deg)`;
      }
      if (hhDotRef.current) {
        hhDotRef.current.style.transform = `rotateZ(${h * 30}deg)`;
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  return (
    <div
      id="custom_time"
      className="d-flex justify-content-center align-items-center"
    >
      <div className="circleTime" style={{ "--clr": "var(--secBx-color)" }}>
        <div className="dots sec_dot" ref={ssDotRef}></div>
        <svg>
          <circle
            cx="6.25vw"
            cy="6.25vw"
            r="6.25vw"
            ref={ssRef}
            id="ss"
          ></circle>
        </svg>
      </div>

      <div className="circleTime" style={{ "--clr": "var(--minuBx-color)" }}>
        <div className="dots mm_dot" ref={mmDotRef}></div>
        <svg>
          <circle
            cx="5.25vw"
            cy="5.25vw"
            r="5.25vw"
            ref={mmRef}
            id="mm"
          ></circle>
        </svg>
      </div>

      <div className="circleTime" style={{ "--clr": "var(--hoursBx-color)" }}>
        <div className="dots hr_dot" ref={hhDotRef}></div>
        <svg>
          <circle
            cx="4.17vw"
            cy="4.17vw"
            r="4.17vw"
            id="hh"
            ref={hhRef}
          ></circle>
        </svg>
      </div>

      <div className="timeBx">
        <div id="hoursBx" style={{ "--clr": "var(--hoursBx-color)" }}>
          {time.hours}
        </div>
        <div id="minuBx" style={{ "--clr": "var(--minuBx-color)" }}>
          {time.minutes}
        </div>
        <div id="secBx" style={{ "--clr": "var(--secBx-color)" }}>
          {time.seconds}
        </div>
        <div className="ap" style={{ "--clr": "var(--ap-color)" }}>
          <div id="ampm">{time.ampm}</div>
        </div>
      </div>
    </div>
  );
};
