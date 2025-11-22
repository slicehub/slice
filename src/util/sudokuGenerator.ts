/**
 * Sudoku Generator - Generates valid Sudoku puzzles and solutions
 */

/**
 * Checks if a number can be placed in a cell
 */
function isValidMove(
  grid: number[],
  row: number,
  col: number,
  num: number,
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row * 9 + c] === num) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (grid[r * 9 + col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r * 9 + c] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Solves a Sudoku grid using backtracking
 */
function solveSudoku(grid: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      const row = Math.floor(i / 9);
      const col = i % 9;

      // Try numbers 1-9 in random order
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let j = numbers.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        const temp = numbers[j];
        numbers[j] = numbers[k];
        numbers[k] = temp;
      }

      for (const num of numbers) {
        if (isValidMove(grid, row, col, num)) {
          grid[i] = num;
          if (solveSudoku(grid)) {
            return true;
          }
          grid[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/**
 * Generates a complete valid Sudoku solution
 */
function generateSolution(): number[] {
  const grid = Array.from<number>({ length: 81 }, () => 0);

  // Fill diagonal 3x3 boxes first (they don't conflict)
  for (let box = 0; box < 9; box += 3) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let j = numbers.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      const temp = numbers[j];
      numbers[j] = numbers[k];
      numbers[k] = temp;
    }

    let idx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = box + r;
        const col = box + c;
        grid[row * 9 + col] = numbers[idx++];
      }
    }
  }

  // Solve the rest
  solveSudoku(grid);
  return grid;
}

/**
 * Generates a Sudoku puzzle from a solution by removing numbers
 * Uses a simpler approach: randomly removes cells while ensuring enough remain
 */
function generatePuzzle(solution: number[], difficulty: number = 30): number[] {
  const puzzle = [...solution];
  const indices = Array.from({ length: 81 }, (_, i) => i);

  // Shuffle indices randomly
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j];
    indices[j] = temp;
  }

  // Remove cells to reach target difficulty
  // We ensure at least 17 givens (minimum for a valid Sudoku)
  const minGivens = 17;
  const targetGivens = Math.max(difficulty, minGivens);
  const cellsToRemove = 81 - targetGivens;

  // Remove cells strategically to maintain some symmetry
  let removed = 0;
  for (let i = 0; i < indices.length && removed < cellsToRemove; i++) {
    const idx = indices[i];
    if (idx !== undefined) {
      puzzle[idx] = 0;
      removed++;
    }
  }

  return puzzle;
}

/**
 * Generates a random Sudoku puzzle and solution
 */
export function generateRandomSudoku(difficulty: number = 30): {
  puzzle: number[];
  solution: number[];
} {
  const solution = generateSolution();
  const puzzle = generatePuzzle(solution, difficulty);
  return { puzzle, solution };
}
