/**
 * Utilitaires pour générer et visualiser les heatmaps
 */

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

export interface GridCell {
  x: number;
  y: number;
  density: number;
}

/**
 * Génère une grille de densité à partir des points de clic
 */
export const generateHeatmapGrid = (
  clicks: Array<{ relative_x: number; relative_y: number }>,
  gridSize: number = 50
): GridCell[] => {
  const grid: Map<string, GridCell> = new Map();
  const cellSize = 100 / gridSize; // Taille de cellule en pourcentage

  clicks.forEach(click => {
    const gridX = Math.floor(click.relative_x / cellSize);
    const gridY = Math.floor(click.relative_y / cellSize);
    const key = `${gridX},${gridY}`;

    const existing = grid.get(key);
    if (existing) {
      existing.density += 1;
    } else {
      grid.set(key, { x: gridX, y: gridY, density: 1 });
    }
  });

  return Array.from(grid.values());
};

/**
 * Applique un filtre Gaussian blur sur la grille pour effet de chaleur
 */
export const applyGaussianBlur = (
  grid: GridCell[],
  gridSize: number = 50,
  radius: number = 2
): number[][] => {
  // Créer matrice 2D
  const matrix: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  // Remplir avec les densités
  grid.forEach(cell => {
    if (cell.x < gridSize && cell.y < gridSize) {
      matrix[cell.y][cell.x] = cell.density;
    }
  });

  // Appliquer Gaussian blur
  const blurred: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      let sum = 0;
      let weightSum = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const weight = Math.exp(-distance / radius);
            sum += matrix[ny][nx] * weight;
            weightSum += weight;
          }
        }
      }

      blurred[y][x] = weightSum > 0 ? sum / weightSum : 0;
    }
  }

  return blurred;
};

/**
 * Obtient une couleur du gradient de chaleur (bleu -> vert -> jaune -> rouge)
 */
export const getHeatColor = (value: number, maxValue: number): string => {
  if (maxValue === 0) return 'rgba(0, 0, 255, 0)';
  
  const normalized = Math.min(value / maxValue, 1);
  
  if (normalized < 0.25) {
    // Bleu -> Cyan
    const t = normalized / 0.25;
    return `rgba(0, ${Math.floor(255 * t)}, 255, ${0.3 + normalized * 0.7})`;
  } else if (normalized < 0.5) {
    // Cyan -> Vert
    const t = (normalized - 0.25) / 0.25;
    return `rgba(0, 255, ${Math.floor(255 * (1 - t))}, ${0.3 + normalized * 0.7})`;
  } else if (normalized < 0.75) {
    // Vert -> Jaune
    const t = (normalized - 0.5) / 0.25;
    return `rgba(${Math.floor(255 * t)}, 255, 0, ${0.3 + normalized * 0.7})`;
  } else {
    // Jaune -> Rouge
    const t = (normalized - 0.75) / 0.25;
    return `rgba(255, ${Math.floor(255 * (1 - t))}, 0, ${0.3 + normalized * 0.7})`;
  }
};

/**
 * Dessine la heatmap sur un canvas
 */
export const drawHeatmap = (
  canvas: HTMLCanvasElement,
  grid: number[][],
  width: number,
  height: number
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  const gridSize = grid.length;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  // Trouver la valeur max pour normalisation
  const maxValue = Math.max(...grid.flat());

  // Dessiner chaque cellule
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const value = grid[y][x];
      if (value > 0) {
        ctx.fillStyle = getHeatColor(value, maxValue);
        ctx.fillRect(
          x * cellWidth,
          y * cellHeight,
          cellWidth,
          cellHeight
        );
      }
    }
  }
};

/**
 * Formate les statistiques de heatmap
 */
export const formatHeatmapStats = (clicks: any[]) => {
  const totalClicks = clicks.length;
  const uniqueUsers = new Set(clicks.map(c => c.user_id)).size;
  const uniqueSessions = new Set(clicks.map(c => c.session_id)).size;

  const deviceBreakdown = clicks.reduce((acc, click) => {
    acc[click.device_type] = (acc[click.device_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalClicks,
    uniqueUsers,
    uniqueSessions,
    deviceBreakdown,
    avgClicksPerSession: uniqueSessions > 0 ? totalClicks / uniqueSessions : 0
  };
};
