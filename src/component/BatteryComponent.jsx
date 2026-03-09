import { useEffect } from "react";
import { MdBolt } from "react-icons/md";
import { useBattery } from "../hooks/useBattery";
import { useDispatch, useSelector } from "react-redux";
import { getHardwareStatusFunc } from "../store/apis/SystemStatus/systemStatusSlice";

export default function BatteryComponent() {
  const dispatch = useDispatch();
  const { hardwareStatus } = useSelector((state) => state.systemStatus);
  const batteryState = useBattery();
  const { level, charging } = batteryState;

  useEffect(() => {
    dispatch(getHardwareStatusFunc())
      .unwrap()
      .catch((err) =>
        console.error(err.message || err || "Error fetching hardware status")
      );

    const interval = setInterval(() => {
      dispatch(getHardwareStatusFunc())
        .unwrap()
        .catch((err) =>
          console.error(err.message || err || "Error fetching hardware status")
        );
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const hasHardware = Boolean(hardwareStatus);
  const hasBattery = Boolean(batteryState);

  const batteryLevel = Math.round(
    (hardwareStatus?.u8BatLevel != null
      ? hardwareStatus.u8BatLevel / 100
      : level ?? 0) * 100
  );

  const backgroundGradient = hasHardware
    ? "linear-gradient(90deg, #E8F5E9, #A5D6A7)"
    : hasBattery
    ? charging
      ? "linear-gradient(90deg, #E8F5E9, #A5D6A7)"
      : "linear-gradient(90deg, rgb(3, 3, 3), #FFCDD2)"
    : "linear-gradient(90deg, #fff, #fff)";

  const levelStyle = {
    width: `${Math.min(Math.max(batteryLevel, 0), 100)}%`,
    backgroundImage:
      hasHardware || charging
        ? "linear-gradient(90deg, #81C784, #4CAF50)"
        : "linear-gradient(90deg, #FF8A65, #FF5722)",
  };
  const iconColor = hasHardware || charging ? "#FFFFFF" : "#FF5722";

  return (
    <div className="d-flex align-items-center battery-container">
      <div className="battery" style={{ backgroundImage: backgroundGradient }}>
        {(hasHardware || hasBattery) && (
          <>
            <div className="level" style={levelStyle}></div>
            <div className="battery-info">
              <MdBolt color={iconColor} size={14} style={{ marginRight: 5 }} />
              <span>{batteryLevel}%</span>
            </div>
          </>
        )}
      </div>
      <div className="black-square" />
    </div>
  );
}
