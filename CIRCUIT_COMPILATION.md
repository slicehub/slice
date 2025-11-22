# Circuito de Votación - Instrucciones de Compilación

## Problema Actual

El circuito necesita corregir la sintaxis de Noir 0.28. Las funciones `to_le_bytes()` y `keccak256` requieren parámetros adicionales.

## Estado

- ✅ `nargo` está instalado (v0.28.0)
- ✅ `Nargo.toml` actualizado con nombre `voting`
- ❌ Circuito necesita corrección de sintaxis
- ❌ Tests necesitan corrección

## Próximos Pasos

1. **Verificar sintaxis de Noir 0.28**:
   - `to_le_bytes::<N>()` donde N es el tamaño del array
   - `keccak256(bytes, length)` - verificar firma exacta

2. **Simplificar el circuito** si es necesario para MVP:
   - Usar un enfoque más simple para el hash
   - O buscar ejemplos funcionales del repo original

3. **Compilar el circuito**:
   ```bash
   cd circuits
   nargo compile
   ```

4. **Copiar archivos generados**:
   ```bash
   cp target/voting.json ../public/circuits/
   ```

5. **Generar verification key** (si es necesario):
   ```bash
   nargo prove
   ```

## Referencias

- Repositorio original: https://github.com/tupui/ultrahonk_soroban_contract
- Documentación Aztec/Noir: https://docs.aztec.network/developers/getting_started_on_sandbox
