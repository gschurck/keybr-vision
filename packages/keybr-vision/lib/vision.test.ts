import { describe,test } from "node:test";
import { deepEqual, equal,isEmpty, isFalse, isNull, isTrue } from "rich-assert";
import { calculateDistance3D, findKNearest3DPoints, findNearest3DPoint, findNearestHandKeypoint,type HandKeypoint, type Point3D } from "./vision.ts";

// Helper function for floating point comparison
const assertCloseTo = (actual: number, expected: number, precision = 2) => {
  const diff = Math.abs(actual - expected);
  const tolerance = Math.pow(10, -precision);
  isTrue(diff <= tolerance, `Expected ${actual} to be close to ${expected} (tolerance: ${tolerance})`);
};

// Test data
const testPoints: Point3D[] = [
  { x: 0, y: 0, z: 0, name: "origin" },
  { x: 1, y: 0, z: 0, name: "unit_x" },
  { x: 0, y: 1, z: 0, name: "unit_y" },
  { x: 0, y: 0, z: 1, name: "unit_z" },
  { x: 1, y: 1, z: 1, name: "unit_diagonal" },
  { x: -1, y: -1, z: -1, name: "negative_diagonal" },
  { x: 3, y: 4, z: 0, name: "3_4_triangle" }
];

const handKeypointsTest: HandKeypoint[] = [
  { x: 0.04243136942386627, y: -0.0659918412566185, z: 0.04937744140625, name: "wrist" },
  { x: 0.014913583174347878, y: -0.04448489099740982, z: 0.05389404296875, name: "thumb_cmc" },
  { x: -0.00226525217294693, y: -0.024160489439964294, z: 0.06298828125, name: "thumb_mcp" },
  { x: -0.009683052077889442, y: -0.0011833147145807743, z: 0.059234619140625, name: "thumb_ip" },
  { x: -0.00816396251320839, y: 0.016795022413134575, z: 0.051849365234375, name: "thumb_tip" }
];

describe('calculateDistance3D', () => {
  test('should calculate distance between origin and unit points correctly', () => {
    const origin = { x: 0, y: 0, z: 0 };
    const unitX = { x: 1, y: 0, z: 0 };
    const unitY = { x: 0, y: 1, z: 0 };
    const unitZ = { x: 0, y: 0, z: 1 };

    assertCloseTo(calculateDistance3D(origin, unitX), 1.0);
    assertCloseTo(calculateDistance3D(origin, unitY), 1.0);
    assertCloseTo(calculateDistance3D(origin, unitZ), 1.0);
  });

  test('should calculate distance for 3-4-5 triangle correctly', () => {
    const point1 = { x: 0, y: 0, z: 0 };
    const point2 = { x: 3, y: 4, z: 0 };

    assertCloseTo(calculateDistance3D(point1, point2), 5.0);
  });

  test('should calculate distance for 3D diagonal correctly', () => {
    const origin = { x: 0, y: 0, z: 0 };
    const diagonal = { x: 1, y: 1, z: 1 };

    assertCloseTo(calculateDistance3D(origin, diagonal), Math.sqrt(3));
  });

  test('should return 0 for identical points', () => {
    const point = { x: 1.5, y: 2.3, z: -0.7 };

    equal(calculateDistance3D(point, point), 0);
  });

  test('should handle negative coordinates', () => {
    const point1 = { x: -1, y: -1, z: -1 };
    const point2 = { x: 1, y: 1, z: 1 };

    assertCloseTo(calculateDistance3D(point1, point2), Math.sqrt(12));
  });
});

describe('findNearest3DPoint', () => {
  test('should return null for empty array', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findNearest3DPoint(target, []);

    isNull(result);
  });

  test('should return the only point when array has one element', () => {
    const target = { x: 0, y: 0, z: 0 };
    const points = [{ x: 1, y: 1, z: 1 }];
    const result = findNearest3DPoint(target, points);

    isFalse(result == null);
    deepEqual(result!.point, points[0]);
    assertCloseTo(result!.distance, Math.sqrt(3));
    equal(result!.index, 0);
  });

  test('should find nearest point correctly', () => {
    const target = { x: 0.5, y: 0.5, z: 0.5 };
    const result = findNearest3DPoint(target, testPoints);

    isFalse(result == null);
    // Both origin and unit_diagonal are equidistant (√0.75), function returns first match
    equal(result!.point.name, "origin");
    equal(result!.index, 0);
    assertCloseTo(result!.distance, Math.sqrt(0.75));
  });

  test('should find origin as nearest to target close to origin', () => {
    const target = { x: 0.1, y: 0.1, z: 0.1 };
    const result = findNearest3DPoint(target, testPoints);

    isFalse(result == null);
    equal(result!.point.name, "origin");
    equal(result!.index, 0);
  });

  test('should handle identical points correctly', () => {
    const target = { x: 1, y: 0, z: 0 };
    const result = findNearest3DPoint(target, testPoints);

    isFalse(result == null);
    equal(result!.point.name, "unit_x");
    equal(result!.distance, 0);
  });
});

describe('findKNearest3DPoints', () => {
  test('should return empty array for empty input', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findKNearest3DPoints(target, [], 3);

    isEmpty(result);
  });

  test('should return empty array for k <= 0', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findKNearest3DPoints(target, testPoints, 0);

    isEmpty(result);
  });

  test('should return all points when k > array length', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findKNearest3DPoints(target, testPoints, 10);

    equal(result.length, testPoints.length);
  });

  test('should return k nearest points in order', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findKNearest3DPoints(target, testPoints, 3);

    equal(result.length, 3);
    equal(result[0].point.name, "origin");
    equal(result[0].distance, 0);

    // Check that distances are in ascending order
    for (let i = 1; i < result.length; i++) {
      isTrue(result[i].distance >= result[i-1].distance);
    }
  });

  test('should find correct 2 nearest points', () => {
    const target = { x: 0.5, y: 0, z: 0 };
    const result = findKNearest3DPoints(target, testPoints, 2);

    equal(result.length, 2);
    equal(result[0].point.name, "origin");
    equal(result[1].point.name, "unit_x");
  });
});

describe('findNearestHandKeypoint', () => {
  test('should return null for empty keypoints array', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findNearestHandKeypoint(target, []);

    isNull(result);
  });

  test('should find nearest hand keypoint correctly', () => {
    const target = { x: 0, y: 0, z: 0 };
    const result = findNearestHandKeypoint(target, handKeypointsTest);

    isFalse(result == null);
    // Based on the test failure, thumb_tip is actually closest to origin (0,0,0)
    equal(result!.point.name, "thumb_tip");
  });

  test('should work with real hand tracking data', () => {
    const target = { x: 0.04, y: -0.06, z: 0.05 }; // Close to wrist
    const result = findNearestHandKeypoint(target, handKeypointsTest);

    isFalse(result == null);
    equal(result!.point.name, "wrist");
    assertCloseTo(result!.distance, 0.009, 2);
  });

  test('should find thumb_tip when target is close to it', () => {
    const target = { x: -0.008, y: 0.017, z: 0.052 }; // Very close to thumb_tip
    const result = findNearestHandKeypoint(target, handKeypointsTest);

    isFalse(result == null);
    equal(result!.point.name, "thumb_tip");
  });
});

describe('Edge Cases', () => {
  test('should handle points with very large coordinates', () => {
    const largePoints = [
      { x: 1e6, y: 1e6, z: 1e6 },
      { x: 1e6 + 1, y: 1e6, z: 1e6 }
    ];
    const target = { x: 1e6, y: 1e6, z: 1e6 };
    const result = findNearest3DPoint(target, largePoints);

    isFalse(result == null);
    equal(result!.distance, 0);
    equal(result!.index, 0);
  });

  test('should handle points with very small coordinates', () => {
    const smallPoints = [
      { x: 1e-10, y: 1e-10, z: 1e-10 },
      { x: 2e-10, y: 1e-10, z: 1e-10 }
    ];
    const target = { x: 0, y: 0, z: 0 };
    const result = findNearest3DPoint(target, smallPoints);

    isFalse(result == null);
    equal(result!.index, 0);
  });

  test('should handle duplicate points', () => {
    const duplicatePoints = [
      { x: 1, y: 1, z: 1, name: "first" },
      { x: 1, y: 1, z: 1, name: "second" },
      { x: 2, y: 2, z: 2, name: "different" }
    ];
    const target = { x: 1, y: 1, z: 1 };
    const result = findNearest3DPoint(target, duplicatePoints);

    isFalse(result == null);
    equal(result!.distance, 0);
    equal(result!.point.name, "first"); // Should return first match
  });
});
