export const printModelChannelHelper = (channel, curSelect) => {
  let retStr = "UNKNOWN";
  if (channel === 0) {
    if (curSelect && curSelect === 1) {
      retStr = "Auto (Channel 1)";
    } else if (curSelect && curSelect === 2) {
      retStr = "Auto (Channel 2)";
    } else {
      retStr = "Auto";
    }
  } else if (channel === 1) {
    retStr = "Channel 1";
  } else if (channel === 2) {
    retStr = "Channel 2";
  }
  return retStr;
};

export const printModemAttributeHelper = (stat) => {
  let retStr;
  switch (stat) {
    case 0:
      retStr = "ADT";
      break;
    case 1:
      retStr = "GDT";
      break;
    default:
      retStr = "UNKNOWN";
  }
  return retStr;
};

export const printLinkStatHelper = (stat) => {
  let retStr;
  switch (stat) {
    case 0:
      retStr = "BOOT";
      break;
    case 1:
      retStr = "STARTUP";
      break;
    case 2:
      retStr = "LINK_UP";
      break;
    case 3:
      retStr = "LINK_DOWN";
      break;
    default:
      retStr = "UNKNOWN";
  }
  return retStr;
};

export const printUpTimeBySecHelper = (uptime, space, days) => {
  const upDays = Math.floor(uptime / 86400);
  const upHours = Math.floor(uptime / 3600 - upDays * 24);
  const upMins = Math.floor(uptime / 60 - upDays * 1440 - upHours * 60);
  const upSecs = Math.floor(
    uptime - upDays * 86400 - upHours * 3600 - upMins * 60
  );
  const retStr =
    upDays.toFixed(0) +
    space +
    days +
    space +
    upHours.toFixed(0).toString().padStart(2, "0") +
    ":" +
    upMins.toFixed(0).toString().padStart(2, "0") +
    ":" +
    upSecs.toFixed(0).toString().padStart(2, "0");
  return retStr;
};
