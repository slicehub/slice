# Investigación: Cómo manejan los hashes Noir y UltraHonk

## Problema Identificado

El usuario tiene razón: **Noir y UltraHonk manejan los hashes automáticamente durante la ejecución del circuito**.

## Flujo Correcto

1. **`noir.execute(inputs)`** ejecuta el circuito y genera un `witness` que contiene TODOS los valores calculados
2. El circuito DEBE calcular `commitment` y `nullifier` internamente usando hash functions
3. Esos valores calculados están en el witness y podemos extraerlos
4. Luego usamos esos valores calculados como public inputs para generar el proof

## Estado Actual (Incorrecto)

- ❌ El circuito NO calcula los hashes, solo valida que el voto es 0 o 1
- ❌ El frontend calcula los hashes manualmente usando `keccak_256` de `@noble/hashes`
- ❌ Esto es incorrecto porque los hashes deberían calcularse dentro del circuito

## Solución Correcta

El circuito DEBE:

1. Calcular `commitment = keccak256([vote, salt])` internamente
2. Calcular `nullifier = keccak256([identity_secret, salt, proposal_id])` internamente
3. Esos valores calculados estarán en el witness generado por `noir.execute()`
4. Necesitamos extraer esos valores del witness y usarlos como public inputs

## Próximos Pasos

1. Implementar el cálculo de hashes en el circuito usando `keccak256` (crate externo o función estándar)
2. Modificar el circuito para que calcule los valores internamente en lugar de recibirlos
3. Extraer los valores calculados del witness después de `noir.execute()`
4. Usar esos valores como public inputs para generar el proof

## Referencias

- Noir witness: Los valores calculados están en el witness generado por `noir.execute()`
- `param_witnesses`: Muestra los índices en el witness donde están los parámetros
- Ejemplo de `voting.json`: `commitment` está en `[3,4)` y `nullifier` en `[4,5)`

