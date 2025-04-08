/**
 * ShaderFix.js
 * 
 * Utility functions to handle Three.js version compatibility issues
 * when upgrading from r113 to r143.
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

/**
 * Compatibility helpers for r123 to r143 migration
 */
export const CompatR143 = {
    /**
     * Helper for handling texture format changes in r143
     * RGBFormat has been removed, use RGBAFormat instead
     */
    getTextureFormat: function(format) {
        // If using the old RGBFormat, return RGBAFormat instead
        if (format === 1) { // 1 was the value of RGBFormat
            return THREE.RGBAFormat;
        }
        return format;
    },
    
    /**
     * Helper for handling material fog property changes
     * The fog property has been moved from the abstract Material class to materials which actually support it
     */
    setMaterialFog: function(material, fogEnabled) {
        // Only set fog property on materials that support it in r143
        if (material.type === 'MeshBasicMaterial' || 
            material.type === 'MeshLambertMaterial' || 
            material.type === 'MeshPhongMaterial' || 
            material.type === 'MeshStandardMaterial' || 
            material.type === 'MeshPhysicalMaterial' ||
            material.type === 'MeshToonMaterial') {
            material.fog = fogEnabled;
        }
    }
};
