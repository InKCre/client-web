import { Matrix, SingularValueDecomposition } from 'ml-matrix'

export interface MDSResult {
  /** 2D coordinates for each point [n_points][dimensions] */
  coordinates: number[][]
  /** Eigenvalues used for the embedding */
  eigenvalues: number[]
  /** Kruskal's stress-1 measure (lower is better) */
  stress: number
}

/**
 * Classical Multidimensional Scaling (Torgerson's method)
 *
 * Converts a distance matrix into 2D coordinates that preserve distances.
 * Uses SVD decomposition via ml-matrix.
 *
 * @param distanceMatrix - Symmetric n×n matrix of pairwise distances
 * @param dimensions - Number of output dimensions (default: 2)
 * @returns MDSResult with coordinates, eigenvalues, and stress measure
 */
export function classicalMDS(distanceMatrix: number[][], dimensions: number = 2): MDSResult {
  const n = distanceMatrix.length

  if (n === 0) {
    return { coordinates: [], eigenvalues: [], stress: 0 }
  }

  if (n === 1) {
    return { coordinates: [[0, 0]], eigenvalues: [0, 0], stress: 0 }
  }

  // 1. Square the distances: D²[i][j] = distances[i][j]²
  const D2 = distanceMatrix.map((row) => row.map((d) => d * d))

  // 2. Double-centering: B = -0.5 * J * D² * J
  //    where J = I - (1/n) * ones
  //    This simplifies to: B[i][j] = -0.5 * (D²[i][j] - rowMean[i] - colMean[j] + totalMean)
  const rowMeans = D2.map((row) => row.reduce((a, b) => a + b, 0) / n)
  const colMeans: number[] = []
  for (let j = 0; j < n; j++) {
    colMeans.push(D2.reduce((sum, row) => sum + row[j], 0) / n)
  }
  const totalMean = rowMeans.reduce((a, b) => a + b, 0) / n

  const B: number[][] = []
  for (let i = 0; i < n; i++) {
    B[i] = []
    for (let j = 0; j < n; j++) {
      B[i][j] = -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + totalMean)
    }
  }

  // 3. Eigendecomposition via SVD
  // For symmetric matrices, SVD gives eigendecomposition: B = U * S * U^T
  const BMatrix = new Matrix(B)
  const svd = new SingularValueDecomposition(BMatrix)

  // 4. Extract coordinates from top eigenvalues
  const eigenvalues = svd.diagonal
  const U = svd.leftSingularVectors

  const coordinates: number[][] = []
  for (let i = 0; i < n; i++) {
    coordinates[i] = []
    for (let d = 0; d < dimensions; d++) {
      // Handle negative eigenvalues (can occur with non-metric distances)
      const eigenval = eigenvalues[d] > 0 ? Math.sqrt(eigenvalues[d]) : 0
      coordinates[i][d] = U.get(i, d) * eigenval
    }
  }

  // 5. Compute stress to measure quality of embedding
  const stress = computeStress(distanceMatrix, coordinates)

  return {
    coordinates,
    eigenvalues: eigenvalues.slice(0, dimensions),
    stress,
  }
}

/**
 * Compute Kruskal's stress-1 measure
 *
 * Measures how well the embedded distances match the original distances.
 * Lower values indicate better preservation of distances.
 *
 * stress = sqrt(sum((d_orig - d_embed)²) / sum(d_orig²))
 */
function computeStress(original: number[][], embedded: number[][]): number {
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < original.length; i++) {
    for (let j = i + 1; j < original.length; j++) {
      const dOrig = original[i][j]

      // Euclidean distance in embedded space
      let dEmbed = 0
      for (let d = 0; d < embedded[0].length; d++) {
        const diff = embedded[i][d] - embedded[j][d]
        dEmbed += diff * diff
      }
      dEmbed = Math.sqrt(dEmbed)

      numerator += (dOrig - dEmbed) ** 2
      denominator += dOrig ** 2
    }
  }

  return denominator > 0 ? Math.sqrt(numerator / denominator) : 0
}
