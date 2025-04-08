import * as THREE from 'three';
import { quickhull } from './THREE.quickhull.js';

var PI_2 = Math.PI / 2;

var Type = {
  BOX: 'Box',
  CYLINDER: 'Cylinder',
  SPHERE: 'Sphere',
  HULL: 'ConvexPolyhedron',
  MESH: 'Trimesh'
};

/**
 * Given a THREE.Object3D instance, creates a corresponding CANNON shape.
 * @param  {THREE.Object3D} object
 * @return {CANNON.Shape}
 */
export const threeToCannon = function (object, options) {
  options = options || {};

  var geometry;

  if (options.type === Type.BOX) {
    return createBoundingBoxShape(object);
  } else if (options.type === Type.CYLINDER) {
    return createBoundingCylinderShape(object, options);
  } else if (options.type === Type.SPHERE) {
    return createBoundingSphereShape(object, options);
  } else if (options.type === Type.HULL) {
    return createConvexPolyhedron(object);
  } else if (options.type === Type.MESH) {
    geometry = getGeometry(object);
    return geometry ? createTrimeshShape(geometry) : null;
  } else if (options.type) {
    throw new Error('[CANNON.threeToCannon] Invalid type "%s".', options.type);
  }

  geometry = getGeometry(object);
  if (!geometry) return null;

  var type = geometry.type;

  switch (type) {
    case 'BoxGeometry':
    case 'BoxBufferGeometry':
      return createBoxShape(geometry);
    case 'CylinderGeometry':
    case 'CylinderBufferGeometry':
      return createCylinderShape(geometry);
    case 'PlaneGeometry':
    case 'PlaneBufferGeometry':
      return createPlaneShape(geometry);
    case 'SphereGeometry':
    case 'SphereBufferGeometry':
      return createSphereShape(geometry);
    case 'TubeGeometry':
    case 'BufferGeometry':
      return createBoundingBoxShape(object);
    default:
      console.warn('Unrecognized geometry: "%s". Using bounding box as shape.', geometry.type);
      return createBoxShape(geometry);
  }
};

threeToCannon.Type = Type;

/******************************************************************************
 * Shape construction
 */

 /**
  * @param  {THREE.BufferGeometry} geometry
  * @return {CANNON.Shape}
  */
 function createBoxShape (geometry) {
   var vertices = getVertices(geometry);

   if (!vertices.length) return null;

   // Compute bounding box
   var box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
   
   return new CANNON.Box(new CANNON.Vec3(
     (box.max.x - box.min.x) / 2,
     (box.max.y - box.min.y) / 2,
     (box.max.z - box.min.z) / 2
   ));
 }

/**
 * Bounding box needs to be computed with the entire mesh, not just geometry.
 * @param  {THREE.Object3D} mesh
 * @return {CANNON.Shape}
 */
function createBoundingBoxShape (object) {
  var shape, localPosition,
      box = new THREE.Box3();

  var clone = object.clone();
  clone.quaternion.set(0, 0, 0, 1);
  clone.updateMatrixWorld();

  box.setFromObject(clone);

  if (!isFinite(box.min.lengthSq())) return null;

  shape = new CANNON.Box(new CANNON.Vec3(
    (box.max.x - box.min.x) / 2,
    (box.max.y - box.min.y) / 2,
    (box.max.z - box.min.z) / 2
  ));

  localPosition = box.translate(clone.position.negate()).getCenter(new THREE.Vector3());
  if (localPosition.lengthSq()) {
    shape.offset = localPosition;
  }

  return shape;
}

/**
 * Computes 3D convex hull as a CANNON.ConvexPolyhedron.
 * @param  {THREE.Object3D} mesh
 * @return {CANNON.Shape}
 */
function createConvexPolyhedron (object) {
  var i, vertices, faces, hull,
      eps = 1e-4,
      geometry = getGeometry(object);

  if (!geometry) return null;

  // Get vertices and faces from BufferGeometry
  const position = geometry.attributes.position;
  const vertexCount = position.count;
  
  // Create an array of Vector3 vertices
  const vertexArray = [];
  for (i = 0; i < vertexCount; i++) {
    const vertex = new THREE.Vector3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    );
    // Add small random perturbation to avoid coplanar points
    vertex.x += (Math.random() - 0.5) * eps;
    vertex.y += (Math.random() - 0.5) * eps;
    vertex.z += (Math.random() - 0.5) * eps;
    vertexArray.push(vertex);
  }

  // Create a temporary geometry for quickhull
  const tempGeometry = {
    vertices: vertexArray,
    faces: []
  };

  // Compute the 3D convex hull
  hull = quickhull(tempGeometry);

  // Convert from THREE.Vector3 to CANNON.Vec3
  vertices = new Array(hull.vertices.length);
  for (i = 0; i < hull.vertices.length; i++) {
    vertices[i] = new CANNON.Vec3(hull.vertices[i].x, hull.vertices[i].y, hull.vertices[i].z);
  }

  // Convert from THREE.Face to Array<number>
  faces = new Array(hull.faces.length);
  for (i = 0; i < hull.faces.length; i++) {
    faces[i] = [hull.faces[i].a, hull.faces[i].b, hull.faces[i].c];
  }

  return new CANNON.ConvexPolyhedron(vertices, faces);
}

/**
 * @param  {THREE.BufferGeometry} geometry
 * @return {CANNON.Shape}
 */
function createCylinderShape (geometry) {
  var shape,
      params = geometry.parameters;
      
  shape = new CANNON.Cylinder(
    params.radiusTop,
    params.radiusBottom,
    params.height,
    params.radialSegments
  );

  // Include metadata for serialization.
  shape._type = CANNON.Shape.types.CYLINDER; // Patch schteppe/cannon.js#329.
  shape.radiusTop = params.radiusTop;
  shape.radiusBottom = params.radiusBottom;
  shape.height = params.height;
  shape.numSegments = params.radialSegments;

  shape.orientation = new CANNON.Quaternion();
  shape.orientation.setFromEuler(THREE.MathUtils.degToRad(90), 0, 0, 'XYZ').normalize();
  return shape;
}

/**
 * @param  {THREE.Object3D} object
 * @return {CANNON.Shape}
 */
function createBoundingCylinderShape (object, options) {
  var shape, height, radius,
      box = new THREE.Box3(),
      axes = ['x', 'y', 'z'],
      majorAxis = options.cylinderAxis || 'y',
      minorAxes = axes.splice(axes.indexOf(majorAxis), 1) && axes;

  box.setFromObject(object);

  if (!isFinite(box.min.lengthSq())) return null;

  // Compute cylinder dimensions.
  height = box.max[majorAxis] - box.min[majorAxis];
  radius = 0.5 * Math.max(
    box.max[minorAxes[0]] - box.min[minorAxes[0]],
    box.max[minorAxes[1]] - box.min[minorAxes[1]]
  );

  // Create shape.
  shape = new CANNON.Cylinder(radius, radius, height, 12);

  // Include metadata for serialization.
  shape._type = CANNON.Shape.types.CYLINDER; // Patch schteppe/cannon.js#329.
  shape.radiusTop = radius;
  shape.radiusBottom = radius;
  shape.height = height;
  shape.numSegments = 12;

  shape.orientation = new CANNON.Quaternion();
  shape.orientation.setFromEuler(
    majorAxis === 'y' ? PI_2 : 0,
    majorAxis === 'z' ? PI_2 : 0,
    0,
    'XYZ'
  ).normalize();
  return shape;
}

/**
 * @param  {THREE.BufferGeometry} geometry
 * @return {CANNON.Shape}
 */
function createPlaneShape (geometry) {
  // Compute bounding box
  var box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
  
  return new CANNON.Box(new CANNON.Vec3(
    (box.max.x - box.min.x) / 2 || 0.1,
    (box.max.y - box.min.y) / 2 || 0.1,
    (box.max.z - box.min.z) / 2 || 0.1
  ));
}

/**
 * @param  {THREE.BufferGeometry} geometry
 * @return {CANNON.Shape}
 */
function createSphereShape (geometry) {
  var params = geometry.parameters;
  return new CANNON.Sphere(params.radius);
}

/**
 * @param  {THREE.Object3D} object
 * @return {CANNON.Shape}
 */
function createBoundingSphereShape (object, options) {
  if (options.sphereRadius) {
    return new CANNON.Sphere(options.sphereRadius);
  }
  
  // Compute bounding sphere
  var geometry = getGeometry(object);
  if (!geometry) return null;
  
  geometry.computeBoundingSphere();
  return new CANNON.Sphere(geometry.boundingSphere.radius);
}

/**
 * @param  {THREE.BufferGeometry} geometry
 * @return {CANNON.Shape}
 */
function createTrimeshShape (geometry) {
  var indices = [],
      vertices = [];

  // Extract vertices and indices from BufferGeometry
  if (geometry.index) {
    // Indexed BufferGeometry
    const position = geometry.attributes.position;
    const index = geometry.index;
    
    // Get vertices
    for (let i = 0; i < position.count; i++) {
      vertices.push(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      );
    }
    
    // Get indices
    for (let i = 0; i < index.count; i++) {
      indices.push(index.getX(i));
    }
  } else {
    // Non-indexed BufferGeometry
    const position = geometry.attributes.position;
    
    // Get vertices
    for (let i = 0; i < position.count; i++) {
      vertices.push(
        position.getX(i),
        position.getY(i),
        position.getZ(i)
      );
      
      // For non-indexed geometry, create indices for triangles
      if (i % 3 === 0) {
        indices.push(i, i + 1, i + 2);
      }
    }
  }

  if (!vertices.length) return null;

  return new CANNON.Trimesh(vertices, indices);
}

/******************************************************************************
 * Utils
 */

/**
 * Returns a single geometry for the given object. If the object is compound,
 * its geometries are automatically merged.
 * @param {THREE.Object3D} object
 * @return {THREE.BufferGeometry}
 */
function getGeometry (object) {
  var meshes = getMeshes(object);
  
  if (meshes.length === 0) return null;

  // If there's only one mesh, return its geometry
  if (meshes.length === 1) {
    const mesh = meshes[0];
    let geometry = mesh.geometry;
    
    // Make sure we have a BufferGeometry
    if (!geometry.isBufferGeometry) {
      console.warn('Non-BufferGeometry detected and converted to BufferGeometry');
      geometry = new THREE.BufferGeometry().copy(geometry);
    }
    
    // Apply scale from the mesh
    if (mesh.scale.x !== 1 || mesh.scale.y !== 1 || mesh.scale.z !== 1) {
      // Clone the geometry to avoid modifying the original
      geometry = geometry.clone();
      
      // Apply scale matrix
      const matrix = new THREE.Matrix4().makeScale(
        mesh.scale.x,
        mesh.scale.y,
        mesh.scale.z
      );
      geometry.applyMatrix4(matrix);
    }
    
    return geometry;
  }
  
  // For multiple meshes, merge their geometries
  const mergedGeometry = new THREE.BufferGeometry();
  const geometries = [];
  
  meshes.forEach(mesh => {
    // Clone the geometry and apply the mesh's world matrix
    const geometry = mesh.geometry.clone();
    mesh.updateMatrixWorld();
    geometry.applyMatrix4(mesh.matrixWorld);
    geometries.push(geometry);
  });
  
  // Merge all geometries
  return mergedGeometry.copy(BufferGeometryUtils.mergeBufferGeometries(geometries));
}

/**
 * @param  {THREE.BufferGeometry} geometry
 * @return {Array<number>}
 */
function getVertices (geometry) {
  const position = geometry.attributes.position;
  return position ? position.array : [];
}

/**
 * Returns a flat array of THREE.Mesh instances from the given object. If
 * nested transformations are found, they are applied to child meshes
 * as mesh.userData.matrix, so that each mesh has its position/rotation/scale
 * independently of all of its parents except the top-level object.
 * @param  {THREE.Object3D} object
 * @return {Array<THREE.Mesh>}
 */
function getMeshes (object) {
  var meshes = [];
  object.traverse(function (o) {
    if (o.type === 'Mesh') {
      meshes.push(o);
    }
  });
  return meshes;
}

// Utility for merging BufferGeometries
const BufferGeometryUtils = {
  mergeBufferGeometries: function(geometries) {
    const isIndexed = geometries[0].index !== null;
    const attributesUsed = new Set(Object.keys(geometries[0].attributes));
    const attributes = {};
    let offset = 0;
    const indices = [];
    
    for (let i = 0; i < geometries.length; ++i) {
      const geometry = geometries[i];
      
      // Create new attributes arrays
      for (const name of attributesUsed) {
        if (!attributes[name]) {
          attributes[name] = [];
        }
        
        const attribute = geometry.attributes[name];
        const itemSize = attribute.itemSize;
        
        for (let j = 0; j < attribute.count; j++) {
          const values = [];
          for (let k = 0; k < itemSize; k++) {
            values.push(attribute.array[j * itemSize + k]);
          }
          attributes[name].push(values);
        }
      }
      
      // Add indices
      if (isIndexed) {
        const index = geometry.index;
        for (let j = 0; j < index.count; j++) {
          indices.push(index.array[j] + offset);
        }
      }
      
      offset += geometry.attributes.position.count;
    }
    
    // Build merged geometry
    const mergedGeometry = new THREE.BufferGeometry();
    
    // Add attributes to merged geometry
    for (const name of Object.keys(attributes)) {
      const data = attributes[name];
      const itemSize = data[0].length;
      const array = new Float32Array(data.length * itemSize);
      
      let arrayIndex = 0;
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < itemSize; j++) {
          array[arrayIndex++] = data[i][j];
        }
      }
      
      mergedGeometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
    }
    
    // Add indices to merged geometry if needed
    if (isIndexed) {
      mergedGeometry.setIndex(new THREE.BufferAttribute(
        new (indices.length > 65535 ? Uint32Array : Uint16Array)(indices),
        1
      ));
    }
    
    return mergedGeometry;
  }
};
