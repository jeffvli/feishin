import { Point } from '../models/visualization/point';

export function getPercentOfValue(percent: number, value: number): number {
    return (percent * value) / 100;
}

export function degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function getPointFromPercent(
    percent: number,
    radius: number,
    svgSize: number,
): Point {
    const angle = getPercentOfValue(percent, 360);
    const point = getPositionFromAngle(angle);

    point.x = point.x * radius + svgSize / 2;
    point.y = point.y * -radius + svgSize / 2;

    return point;
}

// Get position from angle (in degrees) for a radius of one
export function getPositionFromAngle(angle: number): Point {
    const angleInRadians = degreesToRadians(angle);
    return new Point(Math.cos(angleInRadians), Math.sin(angleInRadians));
}
