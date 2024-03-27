export class Point {
    constructor(
        public x: number = 0,
        public y: number = 0,
    ) {}

    public toString(): string {
        return `${this.x},${this.y}`;
    }

    public static getMiddlePoint(point1: Point, point2: Point): Point {
        return new Point((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
    }

    public static getDistanceBetweenPoints(
        point1: Point,
        point2: Point,
    ): number {
        const y = point2.x - point1.x;
        const x = point2.y - point1.y;

        return Math.sqrt(x * x + y * y);
    }
}
