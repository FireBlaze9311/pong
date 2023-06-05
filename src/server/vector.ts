import { Vector } from "../types"

export function normalize(v: Vector): void {
    const len = Math.sqrt(v.x ** 2 + v.y ** 2)
    v.x /= len
    v.y /= len
}

export function add(v1: Vector, v2: Vector): Vector {
    return { x: v1.x + v2.x, y: v1.y + v2.y }
}

export function mul(v: Vector, scalar: number): Vector {
    return { x: v.x * scalar, y: v.y * scalar }
}