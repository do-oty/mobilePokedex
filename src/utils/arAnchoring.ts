/**
 * AR World Space Anchoring Utility
 * Handles all the math for anchoring objects in world space
 */

export type WorldPosition = {
  x: number;
  y: number;
  z?: number;
};

export type DeviceOrientation = {
  heading: number; // 0-360 degrees
  pitch?: number;
  roll?: number;
};

/**
 * Calculate screen position for a world-anchored object
 * @param worldPosition - The fixed world position of the object
 * @param initialOrientation - The device orientation when the object was placed
 * @param currentOrientation - The current device orientation
 * @param screenRadius - The radius of movement on screen (in pixels)
 * @returns Screen position (x, y) where the object should appear
 */
export function calculateAnchoredPosition(
  worldPosition: WorldPosition,
  initialOrientation: DeviceOrientation,
  currentOrientation: DeviceOrientation,
  screenRadius: number = 150
): { x: number; y: number } {
  // Calculate relative rotation from initial position
  let deltaHeading = currentOrientation.heading - initialOrientation.heading;
  
  // Normalize to -180 to 180 for shortest path
  while (deltaHeading > 180) deltaHeading -= 360;
  while (deltaHeading < -180) deltaHeading += 360;
  
  // Convert to radians
  const theta = (deltaHeading * Math.PI) / 180;
  
  // Calculate screen position
  // When device rotates RIGHT, object moves LEFT (opposite direction)
  const x = -Math.sin(theta) * screenRadius;
  const y = (1 - Math.cos(theta)) * screenRadius;
  
  return { x, y };
}

/**
 * Calculate 3D transform effects based on rotation
 * @param deltaHeading - Change in heading from initial position
 * @returns Scale and translate values for 3D effect
 */
export function calculate3DEffects(deltaHeading: number): {
  scale: number;
  scaleY: number;
  translateY: number;
} {
  // Normalize to -180 to 180
  let normalized = deltaHeading;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  
  const rotationMagnitude = Math.abs(normalized);
  const normalizedRotation = Math.min(rotationMagnitude / 90, 1);
  const theta = (normalized * Math.PI) / 180;
  
  return {
    scale: 1 - normalizedRotation * 0.15,
    scaleY: 1 - normalizedRotation * 0.25,
    translateY: Math.sin(theta) * 30,
  };
}


