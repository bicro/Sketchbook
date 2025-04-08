/**
 * ShaderFix.js
 * 
 * Utility functions to handle Three.js version compatibility issues
 * when upgrading from r113 to r123.
 */

import * as THREE from 'three';

/**
 * Polyfill for Matrix3.getInverse() and Matrix4.getInverse() which were deprecated
 * in favor of Matrix3.invert() and Matrix4.invert()
 * 
 * Usage: Replace matrix.getInverse(otherMatrix) with:
 * MatrixCompat.getInverse(matrix, otherMatrix)
 */
export const MatrixCompat = {
    /**
     * Compatibility method for Matrix3.getInverse() and Matrix4.getInverse()
     * @param {THREE.Matrix3|THREE.Matrix4} matrix - The matrix to store the result in
     * @param {THREE.Matrix3|THREE.Matrix4} sourceMatrix - The matrix to invert
     * @param {boolean} [throwOnDegenerate=false] - Whether to throw an error for degenerate matrices
     * @returns {THREE.Matrix3|THREE.Matrix4} The inverted matrix
     */
    getInverse: function(matrix, sourceMatrix, throwOnDegenerate) {
        // Use the new invert() method which modifies the matrix in-place
        return matrix.copy(sourceMatrix).invert();
    }
};

/**
 * Polyfill for Quaternion.inverse() which was renamed to Quaternion.invert()
 * 
 * Usage: Replace quaternion.inverse() with:
 * QuaternionCompat.inverse(quaternion)
 */
export const QuaternionCompat = {
    /**
     * Compatibility method for Quaternion.inverse()
     * @param {THREE.Quaternion} quaternion - The quaternion to invert
     * @returns {THREE.Quaternion} The inverted quaternion
     */
    inverse: function(quaternion) {
        // Use the new invert() method which modifies the quaternion in-place
        return quaternion.invert();
    }
};
