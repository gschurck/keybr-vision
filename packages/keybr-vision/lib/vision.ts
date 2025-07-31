import {KeyShape, type ZoneId} from "@keybr/keyboard";


export const keysCoordinates: Record<number, { x: number; y: number, z: number }> = {}

export const keyFingerBindings:  Record<string,{
  finger: ZoneId;
  hand: ZoneId;
}> = {
}

type Point3D = {
  x: number;
  y: number;
  z: number;
  name?: string; // Optional for named points like in your hand tracking data
};

type NearestPointResult = {
  point: Point3D;
  distance: number;
  index: number;
};

/**
 * Calculates the Euclidean distance between two 3D points
 */
function calculateDistance3D(point1: Point3D, point2: Point3D): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Finds the nearest 3D point from an array of points to a target point
 * @param targetPoint - The point to find the nearest neighbor for
 * @param points - Array of 3D points to search through
 * @returns Object containing the nearest point, its distance, and index
 */
function findNearest3DPoint(
  targetPoint: Point3D,
  points: Point3D[]
): NearestPointResult | null {
  if (points.length === 0) {
    return null;
  }

  let nearestPoint = points[0];
  let nearestDistance = calculateDistance3D(targetPoint, points[0]);
  let nearestIndex = 0;

  for (let i = 1; i < points.length; i++) {
    const distance = calculateDistance3D(targetPoint, points[i]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = points[i];
      nearestIndex = i;
    }
  }

  return {
    point: nearestPoint,
    distance: nearestDistance,
    index: nearestIndex
  };
}

/**
 * Finds multiple nearest points (k-nearest neighbors)
 * @param targetPoint - The point to find nearest neighbors for
 * @param points - Array of 3D points to search through
 * @param k - Number of nearest points to return
 * @returns Array of nearest points sorted by distance (closest first)
 */
function findKNearest3DPoints(
  targetPoint: Point3D,
  points: Point3D[],
  k: number
): NearestPointResult[] {
  if (points.length === 0 || k <= 0) {
    return [];
  }

  const pointsWithDistance = points.map((point, index) => ({
    point,
    distance: calculateDistance3D(targetPoint, point),
    index
  }));

  // Sort by distance and return top k
  return pointsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, points.length));
}

// Example usage with your hand tracking data structure
type HandKeypoint = Point3D & {
  name: string;
};

/**
 * Helper function specifically for hand tracking keypoints
 * Finds the nearest keypoint to a target point from hand tracking data
 */
function findNearestHandKeypoint(
  targetPoint: Point3D,
  keypoints: HandKeypoint[]
): NearestPointResult | null {
  return findNearest3DPoint(targetPoint, keypoints);
}

// Example usage:
/*
const targetPoint: Point3D = { x: 0, y: 0, z: 0 };
const handKeypoints: HandKeypoint[] = [
  { x: 0.04243136942386627, y: -0.0659918412566185, z: 0.04937744140625, name: "wrist" },
  { x: 0.014913583174347878, y: -0.04448489099740982, z: 0.05389404296875, name: "thumb_cmc" },
  // ... more keypoints
];

const nearest = findNearestHandKeypoint(targetPoint, handKeypoints);
if (nearest) {
  console.log(`Nearest point: ${nearest.point.name} at distance ${nearest.distance}`);
}

// Find 3 nearest points
const kNearest = findKNearest3DPoints(targetPoint, handKeypoints, 3);
console.log('3 nearest points:', kNearest);
*/

export {
  calculateDistance3D,
  findKNearest3DPoints,
  findNearest3DPoint,
  findNearestHandKeypoint,
  HandKeypoint,
  NearestPointResult,
  Point3D
};
