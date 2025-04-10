import "./style.css";

const NODE_SPACING = 30;

type CreatureNode = {
  radius: number;
  x: number;
  y: number;
  angle: number; // in radians
  speedX: number; // velocity in x direction
  speedY: number; // velocity in y direction
};

type Eye = {
  radius: number;
  offsetX: number;
  offsetY: number;
};

type Fin = {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  angle: number;
};

type Target = {
  x: number;
  y: number;
};

// Particle type for underwater background effect
type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  depth: number; // 0-1 value representing how "deep" the particle is
};

// Function to create a particle
function createParticle(canvasWidth: number, canvasHeight: number, depth: number): Particle {
  // Make top layer particles 2x bigger
  const sizeMultiplier = depth === 0 ? 1 : 1;
  
  // Make top layer particles less opaque
  const opacityMultiplier = depth === 0 ? 0.5 : 1;
  
  // Make lower level particles much less opaque
  // Apply a more aggressive opacity reduction for deeper particles
  const depthOpacityFactor = Math.pow(1 - depth, 3); // Cubic falloff for more dramatic reduction
  
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: (1 + Math.random() * 10 * (1 - depth)) * sizeMultiplier, // Larger particles appear closer, 2x for top layer
    speedX: (Math.random() - 0.5) * 0.5 * (1 - depth), // Slower movement for deeper particles
    speedY: (Math.random() - 0.5) * 0.5 * (1 - depth),
    opacity: (0.1 + Math.random() * 0.3 * depthOpacityFactor) * opacityMultiplier, // Much less opacity for deeper particles
    depth: depth
  };
}

// Function to update a particle
function updateParticle(particle: Particle, canvasWidth: number, canvasHeight: number) {
  // Move the particle
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  
  // Wrap around the screen
  if (particle.x < 0) particle.x = canvasWidth;
  if (particle.x > canvasWidth) particle.x = 0;
  if (particle.y < 0) particle.y = canvasHeight;
  if (particle.y > canvasHeight) particle.y = 0;
}

// Function to draw a particle
function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle) {
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  
  // Add a greenish tint to the particles
  // Adjust the green component based on depth - deeper particles are more green
  const greenValue = 200 + Math.floor(55 * (1 - particle.depth));
  const blueValue = 200 + Math.floor(55 * (1 - particle.depth));
  
  ctx.fillStyle = `rgba(200, ${greenValue}, ${blueValue}, ${particle.opacity})`;
  ctx.fill();
}

// Function to create multiple particle layers
function createParticleLayers(canvasWidth: number, canvasHeight: number, numLayers: number, particlesPerLayer: number): Particle[][] {
  const layers: Particle[][] = [];
  
  // Create 5 layers with 2 above (depth 0, 0.25) and 3 below (depth 0.5, 0.75, 1.0)
  const depthValues = [0, 0.25, 0.5, 0.75, 1.0];
  
  for (let i = 0; i < numLayers; i++) {
    // Use the predefined depth values
    const depth = depthValues[i % depthValues.length];
    const layer: Particle[] = [];
    
    // Reduce the number of particles for the top layer
    const particlesInThisLayer = depth === 0 ? Math.floor(particlesPerLayer / 2) : particlesPerLayer;
    
    for (let j = 0; j < particlesInThisLayer; j++) {
      layer.push(createParticle(canvasWidth, canvasHeight, depth));
    }
    
    layers.push(layer);
  }
  
  return layers;
}

function initializeCanvas() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2d context");

  // Create a second canvas for the pixelation effect
  const pixelCanvas = document.createElement('canvas');
  const pixelCtx = pixelCanvas.getContext('2d');
  if (!pixelCtx) throw new Error("Failed to get 2d context for pixel canvas");

  function resizeCanvas() {
    // Set the display size (css pixels)
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set up the pixel canvas
    pixelCanvas.width = window.innerWidth;
    pixelCanvas.height = window.innerHeight;
  }

  // Set initial size
  resizeCanvas();

  // Add resize handler
  window.addEventListener('resize', resizeCanvas);

  return { canvas, ctx, pixelCanvas, pixelCtx };
}

function drawCreature(ctx: CanvasRenderingContext2D, creature: CreatureNode[]) {
  // Define fin positions and properties
  const firstFinNodeIndex = Math.floor(creature.length / 3);
  const secondFinNodeIndex = Math.floor(creature.length * 2 / 3);
  const firstFinNode = creature[firstFinNodeIndex];
  const secondFinNode = creature[secondFinNodeIndex];
  const firstPredNode = creature[firstFinNodeIndex - 1];
  const secondPredNode = creature[secondFinNodeIndex - 1];
  
  // Calculate total curvature for dorsal fin
  let totalCurvature = 0;
  for (let i = 1; i < creature.length; i++) {
    const angleDiff = creature[i].angle - creature[i-1].angle;
    totalCurvature += angleDiff;
  }
  
  // Normalize curvature to a reasonable range for the fin - more subtle
  const normalizedCurvature = Math.min(1, Math.abs(totalCurvature) / 10); // Reduced sensitivity
  const dorsalFinHeight = 20 + normalizedCurvature * 40; // Reduced height range for more subtlety
  
  // Determine the direction of curvature (positive = curving right, negative = curving left)
  const curvatureDirection = Math.sign(totalCurvature);
  
  // Define dorsal fin points - just two points
  const dorsalFinStartIndex = Math.floor(creature.length * 0.35); // Start at 35% of the body (moved from 30%)
  const dorsalFinEndIndex = Math.floor(creature.length * 0.45);   // End at 45% of the body (moved from 50%)
  
  const startX = creature[dorsalFinStartIndex].x;
  const startY = creature[dorsalFinStartIndex].y;
  const endX = creature[dorsalFinEndIndex].x;
  const endY = creature[dorsalFinEndIndex].y;
  
  // Calculate control points for the Bezier curves
  // The angle offset is now based on the curvature direction but more subtle
  const angleOffset = Math.PI/3 * curvatureDirection * normalizedCurvature; // Reduced angle range
  
  const cp1x = startX + Math.cos(creature[dorsalFinStartIndex].angle - angleOffset) * dorsalFinHeight;
  const cp1y = startY + Math.sin(creature[dorsalFinStartIndex].angle - angleOffset) * dorsalFinHeight;
  const cp2x = endX + Math.cos(creature[dorsalFinEndIndex].angle - angleOffset) * dorsalFinHeight;
  const cp2y = endY + Math.sin(creature[dorsalFinEndIndex].angle - angleOffset) * dorsalFinHeight;
  
  // Koi fins are more rounded and flowing
  const leftFin: Fin = {
    width: 140,  // Wider fins
    height: 70,  // Taller fins
    offsetX: -18,
    offsetY: -50,
    angle: Math.PI / 3.2  // Slightly adjusted angle
  };

  const rightFin: Fin = {
    width: 140,  // Wider fins
    height: 70,  // Taller fins
    offsetX: -18,
    offsetY: 50,
    angle: -Math.PI / 3.2  // Slightly adjusted angle
  };

  const backLeftFin: Fin = {
    width: 85,   // Wider back fins
    height: 42,  // Taller back fins
    offsetX: -10,
    offsetY: -30,
    angle: Math.PI / 3.2  // Slightly adjusted angle
  };

  const backRightFin: Fin = {
    width: 85,   // Wider back fins
    height: 42,  // Taller back fins
    offsetX: -10,
    offsetY: 30,
    angle: -Math.PI / 3.2  // Slightly adjusted angle
  };

  // Draw fins first (so they appear below the fish)
  // First set of fins
  // Left fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  const firstFinAngle = firstFinNode.angle + leftFin.angle - (firstFinNode.angle - firstPredNode.angle) * 3.2;
  ctx.rotate(firstFinAngle);
  ctx.beginPath();
  ctx.ellipse(
    leftFin.offsetX,
    leftFin.offsetY,
    leftFin.width / 2,
    leftFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(firstFinNode.x, firstFinNode.y);
  const firstRightFinAngle = firstFinNode.angle + rightFin.angle - (firstFinNode.angle - firstPredNode.angle) * 3.2;
  ctx.rotate(firstRightFinAngle);
  ctx.beginPath();
  ctx.ellipse(
    rightFin.offsetX,
    rightFin.offsetY,
    rightFin.width / 2,
    rightFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Second set of fins
  // Left fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  const secondFinAngle = secondFinNode.angle + backLeftFin.angle - (secondFinNode.angle - secondPredNode.angle) * 3.2;
  ctx.rotate(secondFinAngle);
  ctx.beginPath();
  ctx.ellipse(
    backLeftFin.offsetX,
    backLeftFin.offsetY,
    backLeftFin.width / 2,
    backLeftFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Right fin
  ctx.save();
  ctx.translate(secondFinNode.x, secondFinNode.y);
  const secondRightFinAngle = secondFinNode.angle + backRightFin.angle - (secondFinNode.angle - secondPredNode.angle) * 3.2;
  ctx.rotate(secondRightFinAngle);
  ctx.beginPath();
  ctx.ellipse(
    backRightFin.offsetX,
    backRightFin.offsetY,
    backRightFin.width / 2,
    backRightFin.height / 2,
    0,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  ctx.restore();

  // Draw the creature body with koi-like shape and colors
  ctx.beginPath();
  
  // Create a gradient for the koi body
  const bodyGradient = ctx.createLinearGradient(
    creature[0].x - creature[0].radius * 2,
    creature[0].y,
    creature[creature.length - 1].x + creature[creature.length - 1].radius * 2,
    creature[creature.length - 1].y
  );
  
  // Koi colors - orange-red base with white patches
  bodyGradient.addColorStop(0, "#ff9d5c");  // Orange-red at head
  bodyGradient.addColorStop(0.3, "#ff7e5f"); // Deeper orange in middle
  bodyGradient.addColorStop(0.7, "#ff6b6b"); // Reddish-orange toward tail
  bodyGradient.addColorStop(1, "#ff5252");   // Bright red at tail
  
  ctx.fillStyle = bodyGradient;

  // Start from the left side of the head - make it more rounded for koi
  ctx.moveTo(
    creature[0].x + Math.cos(creature[0].angle - Math.PI / 2) * creature[0].radius * 0.9,
    creature[0].y + Math.sin(creature[0].angle - Math.PI / 2) * creature[0].radius * 0.9
  );

  // Head's left intermediate - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle - Math.PI / 4) * creature[0].radius * 0.95,
    creature[0].y + Math.sin(creature[0].angle - Math.PI / 4) * creature[0].radius * 0.95
  );

  // Head's forward point - less pronounced
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle) * creature[0].radius * 0.6, // Reduced from 0.8
    creature[0].y + Math.sin(creature[0].angle) * creature[0].radius * 0.6  // Reduced from 0.8
  );

  // Head's right intermediate - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle + Math.PI / 4) * creature[0].radius * 0.95,
    creature[0].y + Math.sin(creature[0].angle + Math.PI / 4) * creature[0].radius * 0.95
  );

  // Head's right side - more rounded
  ctx.lineTo(
    creature[0].x + Math.cos(creature[0].angle + Math.PI / 2) * creature[0].radius * 0.9,
    creature[0].y + Math.sin(creature[0].angle + Math.PI / 2) * creature[0].radius * 0.9
  );

  // Connect through all body segments - make body more rounded for koi
  for (let i = 1; i < creature.length - 1; i++) {
    const node = creature[i];
    // Right side - make body more rounded
    ctx.lineTo(
      node.x + Math.cos(node.angle + Math.PI / 2) * node.radius * 0.95,
      node.y + Math.sin(node.angle + Math.PI / 2) * node.radius * 0.95
    );
  }

  // Tail's right side - make it more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + Math.PI / 2) * creature[creature.length - 1].radius * 0.9,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + Math.PI / 2) * creature[creature.length - 1].radius * 0.9
  );

  // Tail's right intermediate - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8
  );

  // Tail's back point - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle + Math.PI) * creature[creature.length - 1].radius * 0.7,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle + Math.PI) * creature[creature.length - 1].radius * 0.7
  );

  // Tail's left intermediate - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle - (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle - (3 * Math.PI) / 4) * creature[creature.length - 1].radius * 0.8
  );

  // Tail's left side - more rounded
  ctx.lineTo(
    creature[creature.length - 1].x + Math.cos(creature[creature.length - 1].angle - Math.PI / 2) * creature[creature.length - 1].radius * 0.9,
    creature[creature.length - 1].y + Math.sin(creature[creature.length - 1].angle - Math.PI / 2) * creature[creature.length - 1].radius * 0.9
  );

  // Connect back through all body segments - make body more rounded for koi
  for (let i = creature.length - 2; i > 0; i--) {
    const node = creature[i];
    // Left side - make body more rounded
    ctx.lineTo(
      node.x + Math.cos(node.angle - Math.PI / 2) * node.radius * 0.95,
      node.y + Math.sin(node.angle - Math.PI / 2) * node.radius * 0.95
    );
  }

  // Close the path back to the head's left side
  ctx.closePath();
  ctx.fill();
  
  // Add a brighter highlight line across the back
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; // Semi-transparent white
  ctx.lineWidth = 3;
  ctx.beginPath();
  
  // Start from the third node
  const startNodeIndex = 2;
  const endNodeIndex = creature.length - 3;
  
  // Draw a smooth curve along the back
  ctx.moveTo(
    creature[startNodeIndex].x + Math.cos(creature[startNodeIndex].angle) * creature[startNodeIndex].radius * 0.5,
    creature[startNodeIndex].y + Math.sin(creature[startNodeIndex].angle) * creature[startNodeIndex].radius * 0.5
  );
  
  // Use quadratic curves to create a smooth line
  for (let i = startNodeIndex + 1; i <= endNodeIndex; i++) {
    const node = creature[i];
    const prevNode = creature[i - 1];
    
    // Calculate control point between nodes
    const controlX = (node.x + prevNode.x) / 2;
    const controlY = (node.y + prevNode.y) / 2;
    
    // Calculate point on the back
    const pointX = node.x + Math.cos(node.angle) * node.radius * 0.5;
    const pointY = node.y + Math.sin(node.angle) * node.radius * 0.5;
    
    ctx.quadraticCurveTo(controlX, controlY, pointX, pointY);
  }
  
  ctx.stroke();
  ctx.restore();
  
  // Add koi patterns (spots) to the body
  ctx.save();
  ctx.globalAlpha = 0.7; // Semi-transparent spots
  
  // Draw several spots on the body with fixed positions
  const bodySpotPositions = [
    { offset: 0.3, size: 6 },
    { offset: 0.5, size: 7 },
    { offset: 0.7, size: 5 },
    { offset: 0.9, size: 8 }
  ];
  
  for (let i = 2; i < creature.length - 3; i += 3) {
    const node = creature[i];
    const spotIndex = Math.floor((i - 2) / 3) % bodySpotPositions.length;
    const { offset, size } = bodySpotPositions[spotIndex];
    
    // Fixed position on the body
    const spotAngle = node.angle + Math.PI / 4;
    const spotDistance = node.radius * offset;
    
    const spotX = node.x + Math.cos(spotAngle) * spotDistance;
    const spotY = node.y + Math.sin(spotAngle) * spotDistance;
    
    // Draw the spot
    ctx.beginPath();
    ctx.arc(spotX, spotY, size, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9d5c"; // Orange spots
    ctx.fill();
  }
  
  ctx.restore();

  // Draw dorsal fin AFTER the body (so it appears on top)
  ctx.save();
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5; // Increased line width for better visibility
  
  // Draw the dorsal fin with two points and Bezier curves
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.stroke();
  
  // Fill the dorsal fin for better visibility
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.lineTo(endX, endY);
  ctx.lineTo(startX, startY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add orange spots to the dorsal fin with fixed positions
  ctx.save();
  ctx.globalAlpha = 0.8; // Slightly more opaque spots on the fin
  
  // Fixed positions for dorsal fin spots
  const finSpotPositions = [
    { t: 0.3, size: 4 },
    { t: 0.6, size: 3 }
  ];
  
  // Draw spots on the dorsal fin
  for (const { t, size } of finSpotPositions) {
    // Calculate position along the Bezier curve
    const mt = 1 - t;
    const x = mt * mt * startX + 2 * mt * t * cp1x + t * t * endX;
    const y = mt * mt * startY + 2 * mt * t * cp1y + t * t * endY;
    
    // Draw the spot
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9d5c"; // Orange spots
    ctx.fill();
  }
  
  ctx.restore();
  ctx.restore();

  // Draw tail fin that responds to curvature
  const tailFinStartIndex = creature.length - 1; // Last node (tail tip)
  
  // Calculate a point behind the tail tip for the tail fin
  const tailTipAngle = creature[tailFinStartIndex].angle;
  const tailExtension = 0; // Reduced from 20 to 0 to position the fin 20px closer to the tail
  
  // Position the tail fin behind the tail tip
  const tailStartX = creature[tailFinStartIndex].x - Math.cos(tailTipAngle) * tailExtension;
  const tailStartY = creature[tailFinStartIndex].y - Math.sin(tailTipAngle) * tailExtension;
  const tailEndX = tailStartX - Math.cos(tailTipAngle) * tailExtension;
  const tailEndY = tailStartY - Math.sin(tailTipAngle) * tailExtension;
  
  // Tail fin height is also based on curvature but can be larger than dorsal fin
  const tailFinHeight = 45 + normalizedCurvature * 90; // Increased for koi's flowing tail
  
  // For tail fin, we want to curve in the opposite direction of the fish's curvature
  // This makes the tail fin act like a rudder
  // Use a smoother transition function that's more gradual near zero curvature
  // This creates a more natural movement with less sudden changes
  const smoothCurvature = (curvature: number) => {
    // Sigmoid-like function that's more gradual near zero
    // This creates a smoother transition with less sensitivity to small changes
    return Math.tanh(curvature * 2) * 0.5;
  };
  
  const tailAngleOffset = -Math.PI/2 * curvatureDirection * smoothCurvature(normalizedCurvature);
  
  // Calculate control points for the tail fin Bezier curve
  // Changed shape to be broader as it extends back
  const tailCp1x = tailStartX + Math.cos(tailTipAngle - Math.PI + tailAngleOffset) * tailFinHeight;
  const tailCp1y = tailStartY + Math.sin(tailTipAngle - Math.PI + tailAngleOffset) * tailFinHeight;
  
  // Create a broader tail by having the second control point extend further and wider
  const tailCp2x = tailEndX + Math.cos(tailTipAngle - Math.PI + tailAngleOffset) * (tailFinHeight * 2);
  const tailCp2y = tailEndY + Math.sin(tailTipAngle - Math.PI + tailAngleOffset) * (tailFinHeight * 2);
  
  // Draw the tail fin
  ctx.save();
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5;
  
  // Draw the tail fin outline with a more complex shape
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  
  // First curve to create the main body of the tail
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  
  // Remove the notch/fork at the end for a more unified tail fin
  
  ctx.stroke();
  
  // Fill the tail fin
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add a side view of the tail fin that's much more pronounced based on curvature
  // This creates a more visible side profile when the fish is curving
  const sideViewHeight = 70 + normalizedCurvature * 140; // Much taller side view for koi
  const sideViewWidth = 35 + normalizedCurvature * 70; // Wider side view for koi
  
  // Calculate the side view points - positioned perpendicular to the tail's direction
  const sideViewAngle = tailTipAngle - Math.PI/2; // Perpendicular to tail direction
  
  // Create a more pronounced side view that's visible when the fish is curving
  // Use a smoother transition to avoid sudden flips
  const sideViewStartX = tailStartX + Math.cos(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  const sideViewStartY = tailStartY + Math.sin(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  const sideViewEndX = tailEndX + Math.cos(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  const sideViewEndY = tailEndY + Math.sin(sideViewAngle) * sideViewWidth * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  // Draw the side view of the tail fin
  ctx.beginPath();
  ctx.moveTo(sideViewStartX, sideViewStartY);
  
  // Create a more pronounced curve for the side view with smoother transitions
  // Use the same base angle for both control points to avoid sudden flips
  // Use a more gradual angle change for smoother transitions
  const baseSideAngle = tailTipAngle - Math.PI + Math.PI/6 * smoothCurvature(curvatureDirection * normalizedCurvature);
  
  // Use a more gradual curve for the side view
  const sideViewCp1x = sideViewStartX + Math.cos(baseSideAngle) * sideViewHeight * 0.4;
  const sideViewCp1y = sideViewStartY + Math.sin(baseSideAngle) * sideViewHeight * 0.4;
  
  const sideViewCp2x = sideViewEndX + Math.cos(baseSideAngle) * sideViewHeight * 0.4;
  const sideViewCp2y = sideViewEndY + Math.sin(baseSideAngle) * sideViewHeight * 0.4;
  
  // Use a smoother Bezier curve for the side view
  ctx.bezierCurveTo(sideViewCp1x, sideViewCp1y, sideViewCp2x, sideViewCp2y, sideViewEndX, sideViewEndY);
  
  // Connect the side view to the main tail fin for a unified look
  // Use a smooth curve to connect the side view to the main tail fin
  ctx.lineTo(tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.lineTo(sideViewStartX, sideViewStartY);
  
  ctx.strokeStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.lineWidth = 5;
  ctx.stroke();
  
  // Fill the side view
  ctx.beginPath();
  ctx.moveTo(sideViewStartX, sideViewStartY);
  ctx.bezierCurveTo(sideViewCp1x, sideViewCp1y, sideViewCp2x, sideViewCp2y, sideViewEndX, sideViewEndY);
  ctx.lineTo(tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.lineTo(sideViewStartX, sideViewStartY);
  ctx.fillStyle = "#ff6b6b"; // Lighter red for koi fins
  ctx.fill();
  
  // Add a subtle gradient to the tail fin for a more natural look
  const gradient = ctx.createLinearGradient(tailStartX, tailStartY, tailEndX, tailEndY);
  gradient.addColorStop(0, "#ff6b6b"); // Lighter red for koi fins
  gradient.addColorStop(1, "#ff5252"); // Brighter red at the tip
  
  // Apply the gradient to the tail fin
  ctx.beginPath();
  ctx.moveTo(tailStartX, tailStartY);
  ctx.bezierCurveTo(tailCp1x, tailCp1y, tailCp2x, tailCp2y, tailEndX, tailEndY);
  ctx.lineTo(tailStartX, tailStartY);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.restore();

  // Draw eyes - koi have more expressive eyes
  const leftEye: Eye = {
    radius: 14, // Larger eyes
    offsetX: -18,
    offsetY: -28
  };

  const rightEye: Eye = {
    radius: 14, // Larger eyes
    offsetX: -18,
    offsetY: 28
  };

  // Draw left eye
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  const leftEyeX = creature[0].x + Math.cos(creature[0].angle) * leftEye.offsetX - Math.sin(creature[0].angle) * leftEye.offsetY;
  const leftEyeY = creature[0].y + Math.sin(creature[0].angle) * leftEye.offsetX + Math.cos(creature[0].angle) * leftEye.offsetY;
  // Draw elliptical eye for foreshortening effect
  ctx.ellipse(leftEyeX, leftEyeY, leftEye.radius, leftEye.radius * 0.6, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw left eye pupil
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.ellipse(leftEyeX, leftEyeY, leftEye.radius * 0.5, leftEye.radius * 0.3, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();

  // Draw right eye
  ctx.beginPath();
  ctx.fillStyle = "#FFFFFF";
  const rightEyeX = creature[0].x + Math.cos(creature[0].angle) * rightEye.offsetX - Math.sin(creature[0].angle) * rightEye.offsetY;
  const rightEyeY = creature[0].y + Math.sin(creature[0].angle) * rightEye.offsetX + Math.cos(creature[0].angle) * rightEye.offsetY;
  // Draw elliptical eye for foreshortening effect
  ctx.ellipse(rightEyeX, rightEyeY, rightEye.radius, rightEye.radius * 0.6, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw right eye pupil
  ctx.beginPath();
  ctx.fillStyle = "#000000";
  ctx.ellipse(rightEyeX, rightEyeY, rightEye.radius * 0.5, rightEye.radius * 0.3, creature[0].angle, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw koi whiskers (barbels)
  ctx.save();
  ctx.strokeStyle = "#ff9d5c";
  ctx.lineWidth = 2; // Keeping them thin
  
  // Left whiskers - positioned even more forward at the mouth
  const leftWhiskerX = creature[0].x + Math.cos(creature[0].angle) * (-5) - Math.sin(creature[0].angle) * (-12);
  const leftWhiskerY = creature[0].y + Math.sin(creature[0].angle) * (-5) + Math.cos(creature[0].angle) * (-12);
  
  ctx.beginPath();
  ctx.moveTo(leftWhiskerX, leftWhiskerY);
  ctx.quadraticCurveTo(
    leftWhiskerX + Math.cos(creature[0].angle - Math.PI/4) * 35,
    leftWhiskerY + Math.sin(creature[0].angle - Math.PI/4) * 35,
    leftWhiskerX + Math.cos(creature[0].angle - Math.PI/3) * 55,
    leftWhiskerY + Math.sin(creature[0].angle - Math.PI/3) * 55
  );
  ctx.stroke();
  
  // Right whiskers - positioned even more forward at the mouth
  const rightWhiskerX = creature[0].x + Math.cos(creature[0].angle) * (-5) - Math.sin(creature[0].angle) * 12;
  const rightWhiskerY = creature[0].y + Math.sin(creature[0].angle) * (-5) + Math.cos(creature[0].angle) * 12;
  
  ctx.beginPath();
  ctx.moveTo(rightWhiskerX, rightWhiskerY);
  ctx.quadraticCurveTo(
    rightWhiskerX + Math.cos(creature[0].angle + Math.PI/4) * 35,
    rightWhiskerY + Math.sin(creature[0].angle + Math.PI/4) * 35,
    rightWhiskerX + Math.cos(creature[0].angle + Math.PI/3) * 55,
    rightWhiskerY + Math.sin(creature[0].angle + Math.PI/3) * 55
  );
  ctx.stroke();
  
  ctx.restore();
}

function moveTowardsTarget(node: CreatureNode, target: Target, speed: number) {
  const dx = target.x - node.x;
  const dy = target.y - node.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > 0.1) {
    // Calculate target angle
    const targetAngle = Math.atan2(dy, dx);
    
    // If we're close enough to the target, snap to the correct angle
    if (distance < 0.1) {
      node.angle = targetAngle;
    } else {
      // Calculate angle difference, ensuring it's between -PI and PI
      let angleDiff = targetAngle - node.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      // Gradually adjust angle when far away
      node.angle += angleDiff * 0.1;
    }
    
    // Calculate easing factor based on distance
    // More gradual easing with smaller distance thresholds
    const easingFactor = Math.min(1, Math.min(distance / 100, distance / 20));
    const currentSpeed = speed * easingFactor;
    
    // Add oscillation to head angle while moving
    // Use a combination of sine waves for more natural oscillation
    const maxOscillation = 0.05; 
    const distanceScale = distance < 120 ? 0 : Math.pow(Math.min(1, (distance - 120) / 100), 2);
    
    // Create a more complex oscillation pattern that works in all directions
    const time = Date.now() * 0.003;
    const primaryOscillation = Math.sin(time) * maxOscillation;
    const secondaryOscillation = Math.sin(time * 1.5) * maxOscillation * 0.5;
    const oscillation = (primaryOscillation + secondaryOscillation) * distanceScale;
    
    node.angle += oscillation;
    
    // Calculate velocity components
    const vx = Math.cos(node.angle) * currentSpeed;
    const vy = Math.sin(node.angle) * currentSpeed;
    
    // Update velocity with some smoothing
    node.speedX = node.speedX * 0.7 + vx * 0.3;
    node.speedY = node.speedY * 0.7 + vy * 0.3;
    
    // Move in current direction with eased speed
    node.x += node.speedX;
    node.y += node.speedY;
  } else {
    // Snap to target when close enough
    node.x = target.x;
    node.y = target.y;
    // Gradually reduce velocity when stopped
    node.speedX *= 0.8;
    node.speedY *= 0.8;
    // Keep the last angle when stopped
  }
}

function updateFollowerNode(
  follower: CreatureNode,
  leader: CreatureNode
) {
  const dx = leader.x - follower.x;
  const dy = leader.y - follower.y;
  const currentDistance = Math.sqrt(dx * dx + dy * dy);

  if (currentDistance > 0) {
    const ratio = NODE_SPACING / currentDistance;
    follower.x = leader.x - dx * ratio;
    follower.y = leader.y - dy * ratio;

    // Calculate desired angle
    const desiredAngle = Math.atan2(dy, dx);

    // Calculate angle difference, ensuring it's between -PI and PI
    let angleDiff = desiredAngle - leader.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Constrain angle difference to between -20 and +20 degrees (π/9 radians)
    if (angleDiff > Math.PI / 9) {
      angleDiff = Math.PI / 9;
    } else if (angleDiff < -Math.PI / 9) {
      angleDiff = -Math.PI / 9;
    }

    // Set the follower's angle based on the constrained difference
    follower.angle = leader.angle + angleDiff;

    // Update position to maintain distance with new angle
    follower.x = leader.x - Math.cos(follower.angle) * NODE_SPACING;
    follower.y = leader.y - Math.sin(follower.angle) * NODE_SPACING;
  }
}

function generateCreatureNodes(
  startX: number,
  startY: number,
  radiusValues?: number[]
): CreatureNode[] {
  const nodes: CreatureNode[] = [];
  const baseRadius = 25;
  const numNodes = radiusValues?.length;

  if (!numNodes) {
    throw new Error("No radius values provided");
  }

  for (let i = 0; i < numNodes; i++) {
    nodes.push({
      radius: radiusValues?.[i] ?? baseRadius - i * 2,
      x: startX + i * NODE_SPACING,
      y: startY,
      angle: Math.PI, // 180 degrees, pointing left
      speedX: 0,
      speedY: 0
    });
  }

  return nodes;
}

// Function to create a bubble particle
function createBubbleParticle(canvasWidth: number, canvasHeight: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 2 + Math.random() * 4,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: 0.3 + Math.random() * 0.4,
    depth: Math.random() * 0.5
  };
}

// Function to update a bubble particle
function updateBubbleParticle(particle: Particle, canvasWidth: number, canvasHeight: number) {
  // Move the particle
  particle.x += particle.speedX;
  particle.y += particle.speedY;
  
  // Wrap around the screen
  if (particle.x < 0) particle.x = canvasWidth;
  if (particle.x > canvasWidth) particle.x = 0;
  if (particle.y < 0) particle.y = canvasHeight;
  if (particle.y > canvasHeight) particle.y = 0;
}

// Function to create bubble particles
function createBubbleParticles(canvasWidth: number, canvasHeight: number, count: number): Particle[] {
  const bubbles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    bubbles.push(createBubbleParticle(canvasWidth, canvasHeight));
  }
  
  return bubbles;
}

type Food = {
  x: number;
  y: number;
  size: number;
  initialSize: number;
  targetSize: number;
  eaten: boolean;
  age: number;
  maxAge: number;
  floatOffset: number; // For floating animation
  floatSpeed: number; // Speed of floating animation
  reactionDelay: number; // Delay before fish reacts to this food
};

type Ripple = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  delay: number;  // Delay before this ripple starts
};

// Initialize food and ripple arrays
let foods: Food[] = [];
let ripples: Ripple[] = [];

function createRipples(x: number, y: number): Ripple[] {
  const numRipples = 3;  // Number of ripples to create
  const ripples: Ripple[] = [];
  
  for (let i = 0; i < numRipples; i++) {
    ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 200 + i * 80,  // Much larger ripples that expand further outward
      opacity: 0.9 - i * 0.15,  // Less reduction in opacity
      speed: 1.2 - i * 0.15,    // Faster initial speed for more outward movement
      delay: i * 60             // Longer delay between ripples
    });
  }
  
  return ripples;
}

function updateRipple(ripple: Ripple): boolean {
  if (ripple.delay > 0) {
    ripple.delay--;
    return true;
  }
  
  // Accelerate the ripple outward for a more dynamic effect
  ripple.radius += ripple.speed;
  // Gradually slow down the ripple as it expands
  ripple.speed *= 0.995;
  ripple.opacity = Math.max(0, ripple.opacity - 0.005); // Slower fade out
  return ripple.radius < ripple.maxRadius && ripple.opacity > 0;
}

function drawRipple(ctx: CanvasRenderingContext2D, ripple: Ripple) {
  if (ripple.delay > 0) return;
  
  ctx.beginPath();
  ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
  
  // Calculate line width based on opacity (stronger ripples have thicker lines)
  const lineWidth = 4 * (ripple.opacity / 0.9); // Increased base line width from 3 to 4
  ctx.lineWidth = lineWidth;
  
  ctx.stroke();
}

function drawFood(ctx: CanvasRenderingContext2D, food: Food) {
  if (food.eaten) return;
  
  // Calculate current size based on age
  const progress = Math.min(1, food.age / food.maxAge);
  const currentSize = food.initialSize - (food.initialSize - food.targetSize) * progress;
  
  // Calculate floating position
  const floatY = Math.sin(food.age * food.floatSpeed) * food.floatOffset;
  
  ctx.beginPath();
  ctx.arc(food.x, food.y + floatY, currentSize, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd700"; // Gold color for food
  ctx.fill();
  
  // Add a subtle glow effect
  ctx.shadowColor = "#ffd700";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Add after the existing type definitions
type VoronoiPoint = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  phase: number;
  amplitude: number;
  speed: number;
  disturbance?: {
    startTime: number;
    duration: number;
    strength: number;
    angle: number;
  };
};

// Add after the existing functions, before initialization
function createVoronoiPoints(width: number, height: number, count: number): VoronoiPoint[] {
  const points: VoronoiPoint[] = [];
  const minDistance = 100; // Minimum distance between points
  const maxAttempts = 50; // Maximum attempts to place each point
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let baseX = 0;
    let baseY = 0;
    
    // Try to find a valid position for the new point
    while (!validPosition && attempts < maxAttempts) {
      baseX = width * (0.2 + Math.random() * 0.6); // Keep points away from edges
      baseY = height * (0.2 + Math.random() * 0.6);
      
      // Check distance from all existing points
      validPosition = true;
      for (const existingPoint of points) {
        const dx = baseX - existingPoint.baseX;
        const dy = baseY - existingPoint.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // If we found a valid position, add the point
    if (validPosition) {
      points.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        phase: Math.random() * Math.PI * 2,
        amplitude: 20 + Math.random() * 15, // Reduced amplitude from (30-70) to (10-25)
        speed: (0.0002 + Math.random() * 0.0008) * 0.25 // Reduced speed by 60%
      });
    }
  }
  
  return points;
}

function updateVoronoiPoints(points: VoronoiPoint[], time: number) {
  for (const point of points) {
    let xOffset = 0;
    let yOffset = 0;
    
    // Apply disturbance if it exists and is still active
    if (point.disturbance) {
      const elapsed = time - point.disturbance.startTime;
      if (elapsed < point.disturbance.duration) {
        // Calculate disturbance strength based on elapsed time with a smoother fade
        const progress = elapsed / point.disturbance.duration;
        
        // Use a smoother easing function (ease-out cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        
        // Apply a gradual ramp-up and ramp-down
        let strengthMultiplier;
        if (progress < 0.2) {
          // Gradual ramp-up over first 20% of duration
          strengthMultiplier = progress / 0.2;
        } else if (progress > 0.8) {
          // Gradual ramp-down over last 20% of duration
          strengthMultiplier = (1 - progress) / 0.2;
        } else {
          // Full strength in the middle 60%
          strengthMultiplier = 1;
        }
        
        const strength = point.disturbance.strength * easeOutCubic * strengthMultiplier;
        
        // Apply disturbance offset
        xOffset = Math.cos(point.disturbance.angle) * strength;
        yOffset = Math.sin(point.disturbance.angle) * strength;
      } else {
        // Clear disturbance when it's done
        point.disturbance = undefined;
      }
    }
    
    // Apply normal movement plus disturbance
    point.x = point.baseX + Math.cos(time * point.speed + point.phase) * point.amplitude + xOffset;
    point.y = point.baseY + Math.sin(time * point.speed * 1.5 + point.phase) * point.amplitude + yOffset;
  }
}

function drawVoronoi(ctx: CanvasRenderingContext2D, points: VoronoiPoint[], width: number, height: number) {
  const cellSize = 12; // Keep the thicker lines
    
  // Calculate the center of the actual canvas
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let x = 0; x < width; x += cellSize) {
    for (let y = 0; y < height; y += cellSize) {
      // Convert canvas coordinates to centered coordinates
      const centeredX = x - centerX;
      const centeredY = y - centerY;
      
      // Scale up the coordinates to create the virtual canvas effect (2x bigger)
      const virtualX = centeredX * 0.5 + centerX;
      const virtualY = centeredY * 0.5 + centerY;
      
      // Find the closest point
      let minDist = Infinity;
      let closestPoint: VoronoiPoint | null = null;
      let secondMinDist = Infinity;
      
      for (const point of points) {
        const dx = virtualX - point.x;
        const dy = virtualY - point.y;
        const dist = dx * dx + dy * dy;
        
        if (dist < minDist) {
          secondMinDist = minDist;
          minDist = dist;
          closestPoint = point;
        } else if (dist < secondMinDist) {
          secondMinDist = dist;
        }
      }
      
      if (closestPoint) {
        // More gradual intensity calculation
        const edgeIntensity = Math.min(1, (Math.sqrt(secondMinDist) - Math.sqrt(minDist)) / 35);
        const intensity = Math.pow(1 - edgeIntensity, 1.5); // Less aggressive power for more gradual falloff
        
        if (intensity > 0.5) { // Lower threshold to show more of the pattern
          // Calculate how close we are to a corner (where three or more cells meet)
          const isCorner = edgeIntensity > 0.9;
          
          // Use different opacity for corners vs. regular edges
          const opacity = isCorner 
            ? Math.min(1, (intensity - 0.5) * 3) * 0.15  // Higher opacity for corners
            : Math.min(1, (intensity - 0.5) * 3) * 0.03; // Lower opacity for regular edges
          
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }
}

// Function to apply disturbances to Voronoi points based on fish movement
function applyFishDisturbance(points: VoronoiPoint[], creature: CreatureNode[], time: number) {
  // Calculate fish velocity based on the first node (head)
  const head = creature[0];
  
  // Skip if the fish is not moving significantly
  const speed = Math.sqrt(head.speedX * head.speedX + head.speedY * head.speedY);
  if (speed < 0.5) return; // Threshold to avoid tiny disturbances
  
  // Calculate the center of the canvas for scaling
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Convert fish position to virtual canvas coordinates
  const centeredX = head.x - centerX;
  const centeredY = head.y - centerY;
  const virtualX = centeredX * 0.5 + centerX;
  const virtualY = centeredY * 0.5 + centerY;
  
  // Calculate disturbance radius based on speed (faster = larger radius)
  const baseRadius = 200;
  const speedFactor = Math.min(3, 1 + speed / 2); // Cap at 3x
  const disturbanceRadius = baseRadius * speedFactor;
  
  // Calculate movement direction
  const moveAngle = Math.atan2(head.speedY, head.speedX);
  
  // Apply disturbances to points near the fish
  for (const point of points) {
    const dx = point.baseX - virtualX;
    const dy = point.baseY - virtualY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < disturbanceRadius) {
      // Calculate disturbance strength based on distance and speed
      // Reduced by a factor of 20 (from 40 to 2)
      const distanceFactor = 1 - (distance / disturbanceRadius);
      const strength = 4 * distanceFactor * speedFactor;
      
      // Calculate angle - points move away from fish in the direction of movement
      const angle = moveAngle + Math.PI + (Math.random() - 0.5) * 0.5; // Add slight randomness
      
      // Only add disturbance if point doesn't already have one or if this one is stronger
      const currentStrength = point.disturbance ? point.disturbance.strength : 0;
      
      if (strength > currentStrength) {
        // Duration varies based on distance and speed
        const baseDuration = 2000; // 2 seconds base duration
        const duration = baseDuration * (1 + distance / disturbanceRadius) + Math.random() * 500;
        
        point.disturbance = {
          startTime: time,
          duration: duration,
          strength: strength,
          angle: angle
        };
      }
    }
  }
}

// Initialize and start animation
const { canvas, ctx, pixelCanvas, pixelCtx } = initializeCanvas();

// Create creature and target outside the animation loop
const creature = generateCreatureNodes(
  canvas.width / 2,
  canvas.height / 2,
  [
    45, 48, 50, 52, 54, 54, 51, 48, 45, 42, 41, 40, 38, 33, 30, 27, 24, 21, 18,
    15, 10, 8
  ]
);

const target: Target = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

// Create particle layers for underwater effect
const particleLayers = createParticleLayers(canvas.width, canvas.height, 5, 50);

// Create bubble particles
const bubbleParticles = createBubbleParticles(canvas.width, canvas.height, 30);

// Initialize Voronoi points
const voronoiPoints = createVoronoiPoints(canvas.width, canvas.height, 72); // Increased from 18 to 72 points

// Add the pixel canvas to the DOM
document.body.appendChild(pixelCanvas);
pixelCanvas.style.position = 'absolute';
pixelCanvas.style.top = '0';
pixelCanvas.style.left = '0';
pixelCanvas.style.zIndex = '1';
pixelCanvas.style.pointerEvents = 'none'; // Make pixel canvas non-interactive
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';

// Start animation
animate();

function animate() {
  // Clear the canvas with a radial gradient from center
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,  // Start at center
    canvas.width / 2, canvas.height / 2, canvas.width / 1.5  // End at edges
  );
  gradient.addColorStop(0, "#2a7a8a");  // Green-blue in the middle
  gradient.addColorStop(0.5, "#2a5a9a");  // Blue in the middle area
  gradient.addColorStop(1, "#1a4a7a");  // Darker blue at the edges
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a subtle green tint overlay
  ctx.fillStyle = "rgba(100, 150, 100, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw the last two particle layers (depth 0.75 and 1.0) BEFORE the fish
  for (let layerIndex = 3; layerIndex < particleLayers.length; layerIndex++) {
    const layer = particleLayers[layerIndex];
    
    for (let i = 0; i < layer.length; i++) {
      updateParticle(layer[i], canvas.width, canvas.height);
      drawParticle(ctx, layer[i]);
    }
  }
  
  // Update and draw bubbles
  for (let i = 0; i < bubbleParticles.length; i++) {
    updateBubbleParticle(bubbleParticles[i], canvas.width, canvas.height);
    drawParticle(ctx, bubbleParticles[i]);
  }

  // Update and draw food
  for (const food of foods) {
    if (!food.eaten) {
      food.age += 16.67; // Increment age by ~16.67ms (assuming 60fps)
    }
    drawFood(ctx, food);
  }

  // Find closest uneaten food that we've had time to react to
  let closestFood = null;
  let minDistance = Infinity;
  for (const food of foods) {
    if (!food.eaten && food.age >= 0) { // Only react to food with positive age
      const dx = food.x - creature[0].x;
      const dy = food.y - creature[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        closestFood = food;
      }
    }
  }

  // If there's food nearby, move towards it
  if (closestFood && minDistance < 300) {
    target.x = closestFood.x;
    target.y = closestFood.y;
    
    // Check if we're close enough to eat the food
    if (minDistance < 20) {
      closestFood.eaten = true;
    }
  } else {
    // If no food is nearby, randomly select a new target when we're close to the current one
    const dx = target.x - creature[0].x;
    const dy = target.y - creature[0].y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
    
    if (distanceToTarget < 50) {
      // Select a random point in front of the fish (within 120 degrees)
      const margin = 100; // Keep away from edges
      const maxAngle = Math.PI * 2/3; // 120 degrees in radians
      const randomAngle = (Math.random() - 0.5) * maxAngle; // Random angle between -60 and +60 degrees
      const targetAngle = creature[0].angle + randomAngle;
      
      // Calculate distance (further for more interesting movement)
      const distance = 200 + Math.random() * 300; // Between 200 and 500 pixels away
      
      // Calculate new target position
      target.x = creature[0].x + Math.cos(targetAngle) * distance;
      target.y = creature[0].y + Math.sin(targetAngle) * distance;
      
      // Keep within canvas bounds
      target.x = Math.max(margin, Math.min(canvas.width - margin, target.x));
      target.y = Math.max(margin, Math.min(canvas.height - margin, target.y));
    }
  }

  // Move head towards target with reduced speed when no food is nearby
  const speed = closestFood ? 5 : 1.25; // 5/4 = 1.25 when no food
  moveTowardsTarget(creature[0], target, speed);

  // Update follower nodes to maintain distance from their leaders
  for (let i = 1; i < creature.length; i++) {
    updateFollowerNode(creature[i], creature[i - 1]);
  }

  // Draw the creature
  drawCreature(ctx, creature);
  
  // Update and draw ripples AFTER the fish is drawn
  ripples = ripples.filter(ripple => {
    const isActive = updateRipple(ripple);
    if (isActive) {
      drawRipple(ctx, ripple);
    }
    return isActive;
  });

  // Update and draw the first three particle layers (depth 0, 0.25, 0.5) AFTER the fish is drawn
  for (let layerIndex = 0; layerIndex < 3; layerIndex++) {
    const layer = particleLayers[layerIndex];
    
    for (let i = 0; i < layer.length; i++) {
      updateParticle(layer[i], canvas.width, canvas.height);
      drawParticle(ctx, layer[i]);
    }
  }

  // Replace the Voronoi texture drawing code with:
  ctx.globalCompositeOperation = 'lighter';
  
  // Update Voronoi points
  const time = Date.now();
  updateVoronoiPoints(voronoiPoints, time);
  
  // Apply fish disturbance to Voronoi points
  applyFishDisturbance(voronoiPoints, creature, time);
  
  // Draw Voronoi pattern at the top (original position)
  drawVoronoi(ctx, voronoiPoints, canvas.width, canvas.height);
  
  // Draw Voronoi pattern as a shadow at the bottom with a slight offset
  // Directly draw the shadow pattern with a different color and offset
  ctx.save();
  ctx.translate(0, 10); // Offset the shadow downward
  ctx.globalAlpha = 0.7; // Make the shadow more visible
  
  // Draw the shadow pattern with a darker color
  for (let x = 0; x < canvas.width; x += 12) {
    for (let y = 0; y < canvas.height; y += 12) {
      // Find the closest point
      let minDist = Infinity;
      let closestPoint: VoronoiPoint | null = null;
      let secondMinDist = Infinity;
      
      for (const point of voronoiPoints) {
        const dx = x - point.x;
        const dy = y - point.y;
        const dist = dx * dx + dy * dy;
        
        if (dist < minDist) {
          secondMinDist = minDist;
          minDist = dist;
          closestPoint = point;
        } else if (dist < secondMinDist) {
          secondMinDist = dist;
        }
      }
      
      if (closestPoint) {
        // More gradual intensity calculation
        const edgeIntensity = Math.min(1, (Math.sqrt(secondMinDist) - Math.sqrt(minDist)) / 35);
        const intensity = Math.pow(1 - edgeIntensity, 1.5); // Less aggressive power for more gradual falloff
        
        if (intensity > 0.5) { // Lower threshold to show more of the pattern
          // Calculate how close we are to a corner (where three or more cells meet)
          const isCorner = edgeIntensity > 0.9;
          
          // Use different opacity for corners vs. regular edges
          const opacity = isCorner 
            ? Math.min(1, (intensity - 0.5) * 3) * 0.2  // Higher opacity for corners
            : Math.min(1, (intensity - 0.5) * 3) * 0.1; // Higher opacity for regular edges
          
          // Use a darker blue color for the shadow
          ctx.fillStyle = `rgba(20, 20, 60, ${opacity})`;
          ctx.fillRect(x, y, 12, 12);
        }
      }
    }
  }
  ctx.restore();
  
  ctx.globalCompositeOperation = 'source-over';

  // Apply pixelation effect
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, pixelCanvas.width / 8, pixelCanvas.height / 8);
  pixelCtx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width / 8, pixelCanvas.height / 8, 0, 0, pixelCanvas.width, pixelCanvas.height);

  // Request next frame
  requestAnimationFrame(animate);
}

// Handle mouse events
let isMouseDown = false;

canvas.addEventListener("mousedown", (event) => {
  if (event.button === 0) { // Left mouse button
    isMouseDown = true;
    updateTargetPosition(event);
  }
});

canvas.addEventListener("mouseup", (event) => {
  if (event.button === 0) { // Left mouse button
    isMouseDown = false;
  }
});

canvas.addEventListener("mousemove", (event) => {
  if (isMouseDown) {
    updateTargetPosition(event);
  }
});

function updateTargetPosition(event: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  target.x = event.clientX - rect.left;
  target.y = event.clientY - rect.top;
}

// Add click event listener for dropping food
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate distance to fish
  const dx = x - creature[0].x;
  const dy = y - creature[0].y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate reaction delay based on distance (further = longer delay)
  const reactionDelay = 200 + Math.floor(distance / 1.5); // Increased base delay and made distance factor more significant
  
  // Create new food with smaller initial size and longer animation
  foods.push({
    x,
    y,
    initialSize: 12,
    size: 12,
    targetSize: 6,
    eaten: false,
    age: -reactionDelay, // Start with negative age so it takes time to become positive
    maxAge: 120, // About 2 seconds at 60fps
    floatOffset: 2 + Math.random() * 1.5, // Smaller float amplitude
    floatSpeed: 0.01 + Math.random() * 0.005, // Much slower float speed
    reactionDelay: reactionDelay // Add reaction delay
  });
  
  // Create multiple ripple effects
  ripples.push(...createRipples(x, y));
  
  // Create disturbances in Voronoi points near the drop point
  const currentTime = Date.now();
  const disturbanceRadius = 300; // Increased radius to account for scaling (2x)
  
  // Calculate the center of the canvas for scaling
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Convert click coordinates to virtual canvas coordinates
  const centeredX = x - centerX;
  const centeredY = y - centerY;
  const virtualX = centeredX * 0.5 + centerX;
  const virtualY = centeredY * 0.5 + centerY;
  
  for (const point of voronoiPoints) {
    const dx = point.baseX - virtualX;
    const dy = point.baseY - virtualY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < disturbanceRadius) {
      // Calculate disturbance strength based on distance (stronger closer to drop point)
      const strength = 60 * (1 - distance / disturbanceRadius); // Increased strength to account for scaling
      
      // Calculate angle away from drop point
      const angle = Math.atan2(dy, dx);
      
      // Add disturbance to point with longer duration
      // Duration varies based on distance - points further away have longer duration
      const baseDuration = 3000; // 3 seconds base duration
      const distanceFactor = 1 + (distance / disturbanceRadius) * 2; // Up to 3x longer for distant points
      const duration = baseDuration * distanceFactor + Math.random() * 1000; // Add some randomness
      
      point.disturbance = {
        startTime: currentTime,
        duration: duration,
        strength: strength,
        angle: angle
      };
    }
  }
  
  // Limit the number of food pieces to prevent too many
  if (foods.length > 5) {
    foods = foods.filter(food => !food.eaten);
  }
});
