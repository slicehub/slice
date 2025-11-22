/**
 * Script to generate verification key (VK) for a Noir circuit
 * Uses UltraHonk backend to generate VK from circuit bytecode
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateVk(circuitName) {
  console.log(`[VK Generation] Loading circuit: ${circuitName}.json`);
  
  // Load circuit JSON
  const circuitPath = join(__dirname, '..', 'public', 'circuits', `${circuitName}.json`);
  const circuit = JSON.parse(readFileSync(circuitPath, 'utf-8'));
  
  console.log(`[VK Generation] Circuit loaded, bytecode length: ${circuit.bytecode.length}`);
  
  // Import UltraHonk backend dynamically
  const { UltraHonkBackend } = await import('@aztec/bb.js');
  
  console.log(`[VK Generation] Initializing UltraHonkBackend...`);
  const backend = new UltraHonkBackend(circuit.bytecode);
  
  console.log(`[VK Generation] Generating verification key (this may take 30-60 seconds)...`);
  const vkStart = performance.now();
  const vk = await backend.getVerificationKey();
  const vkTime = ((performance.now() - vkStart) / 1000).toFixed(2);
  
  console.log(`[VK Generation] Verification key generated in ${vkTime}s`);
  
  // Convert VK to JSON
  const vkJson = JSON.stringify(vk);
  
  // Save VK to file
  const vkPath = join(__dirname, '..', 'public', 'circuits', `${circuitName}_vk.json`);
  writeFileSync(vkPath, vkJson, 'utf-8');
  
  console.log(`[VK Generation] Verification key saved to: ${vkPath}`);
  console.log(`[VK Generation] Complete! VK size: ${vkJson.length} bytes`);
}

// Get circuit name from command line args or use default
const circuitName = process.argv[2] || 'voting';

generateVk(circuitName)
  .then(() => {
    console.log('✅ VK generation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ VK generation failed:', error);
    process.exit(1);
  });

