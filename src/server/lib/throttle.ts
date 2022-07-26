import pThrottle from 'p-throttle';

const throttle = pThrottle({
  interval: 1000,
  limit: 10,
});

export default throttle;
