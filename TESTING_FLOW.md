# Testing Flow - Sistema de Votación Anónimo

## Estado de Pruebas

### ✅ Preparación Completada

1. **Circuito compilado**: `public/circuits/voting.json` ✅
2. **VK temporal**: `public/circuits/voting_vk.json` ✅ (copiado de sudoku, se generará el correcto después)
3. **Extracción del witness**: Implementada en `VotingService.ts` ✅
4. **Servicios configurados**: `VotingService.ts`, `NoirService.ts` ✅

### ⚠️ Notas Importantes

- **VK temporal**: El VK actual es del circuito de sudoku. No funcionará para verificar proofs del circuito de voting. Esto es solo para probar el flujo de frontend.
- **Para generar el VK correcto**: Usar el script `scripts/generate-vk.js` (aún necesita corrección del método).

## Flujo de Prueba

### 1. Servidor de Desarrollo

El servidor se inicia con:
```bash
npm run dev
```

Esto inicia:
- `stellar scaffold watch --build-clients` (en watch mode)
- `vite` (servidor frontend en http://localhost:5173)

### 2. Pasos para Probar

1. **Abrir navegador**: http://localhost:5173
2. **Conectar wallet**: Conectar una wallet de Stellar
3. **Crear propuesta**: Usar el formulario para crear una nueva propuesta
4. **Votar**: 
   - Seleccionar propuesta
   - Elegir voto (0 o 1)
   - El sistema calculará commitment y nullifier
   - Generará proof usando Noir
   - Enviará transacción al contrato
5. **Revelar voto**: 
   - Después de votar, revelar el voto con salt y voto
   - Verificar que el commitment coincide

### 3. Qué Verificar

- ✅ Frontend carga correctamente
- ✅ Componente de votación se muestra
- ✅ Formulario de creación de propuesta funciona
- ✅ Formulario de voto genera commitment y nullifier
- ✅ Extracción del witness funciona (verificar en consola)
- ⚠️ Generación de proof (puede fallar sin VK correcto)
- ⚠️ Verificación en contrato (puede fallar sin VK correcto)

### 4. Logs a Revisar

En la consola del navegador, buscar:
- `[VotingService] Extracted from witness:` - Confirma extracción del witness
- `[NoirService] Starting proof generation` - Inicio de generación de proof
- `[NoirService] Proof generated in Xs` - Tiempo de generación
- Errores de verificación si el VK no coincide

## Próximos Pasos

1. **Generar VK correcto**: 
   - Corregir script `generate-vk.js` para usar `getVerificationKey()`
   - Ejecutar: `node scripts/generate-vk.js voting`
   - Copiar resultado a `public/circuits/voting_vk.json`

2. **Probar flujo completo**:
   - Crear propuesta
   - Votar
   - Generar proof (debería funcionar con VK correcto)
   - Verificar en contrato (debería pasar con VK correcto)
   - Revelar voto

3. **Implementar cálculo de hashes en circuito**:
   - Corregir sintaxis de `keccak256()` en el circuito
   - Actualizar extracción del witness para usar valores calculados
   - Verificar que los valores coinciden

