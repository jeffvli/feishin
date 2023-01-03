import formatDuration from 'format-duration';

export const formatDurationString = (duration: number) => {
  const rawDuration = formatDuration(duration).split(':');

  let string;

  switch (rawDuration.length) {
    case 1:
      string = `${rawDuration[0]} sec`;
      break;
    case 2:
      string = `${rawDuration[0]} min ${rawDuration[1]} sec`;
      break;
    case 3:
      string = `${rawDuration[0]} hr ${rawDuration[1]} min ${rawDuration[2]} sec`;
      break;
    case 4:
      string = `${rawDuration[0]} day ${rawDuration[1]} hr ${rawDuration[2]} min ${rawDuration[3]} sec`;
      break;
  }

  return string;
};
