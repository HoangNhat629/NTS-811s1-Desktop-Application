import { useEffect, useState, useRef } from "react";
import { useTheme } from "../hooks/useTheme";
import Calendar from "react-calendar";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import "react-calendar/dist/Calendar.css";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export default function DateTimeComponent({ timestamp }) {
  const { theme } = useTheme();

  const localTz = "Asia/Ho_Chi_Minh";

  const baseTime = useRef(timestamp * 1000);
  const mountTime = useRef(Date.now());

  const [now, setNow] = useState(new Date(baseTime.current));

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - mountTime.current;
      setNow(new Date(baseTime.current + elapsed));
    }, 100);

    return () => clearInterval(interval);
  }, [timestamp]);

  const formattedTime = dayjs(now).tz(localTz).format("HH:mm:ss");
  const formattedDate = dayjs(now).tz(localTz).format("dddd, MMMM D, YYYY");

  return (
    <div className="windows-clock">
      <div className="time-display">
        <div className="time">{formattedTime}</div>
        <div className="date">{formattedDate}</div>
      </div>
      <div className="calendar-wrapper w-75 d-flex justify-content-center align-items-center">
        <Calendar value={now} />
      </div>
      {theme === "dark" ? (
        <style>
          {`
          .react-calendar {
            background-color: #2c2c2c;
          }
          .react-calendar__tile, .react-calendar__navigation__label__labelText, .react-calendar__navigation__arrow {
            color: white !important;
          }
          .react-calendar__tile--active {
            background: #dc3545 !important;
            color: white !important;
            border-radius: 10px;
          }
        `}
        </style>
      ) : (
        <style>
          {`
          .react-calendar__tile--active {
            background: #dc3545 !important;
            border-radius: 10px;
          }
        `}
        </style>
      )}
    </div>
  );
}
