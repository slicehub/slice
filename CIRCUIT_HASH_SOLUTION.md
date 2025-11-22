# Solución: Cómo manejar los hashes en el circuito Noir

## Problema Identificado

Tienes razón: **Noir y UltraHonk manejan los hashes automáticamente durante la ejecución del circuito**.

El flujo correcto es:

1. **El circuito calcula los hashes internamente** usando funciones de hash de Noir
2. **`noir.execute(inputs)` ejecuta el circuito** y genera un `witness` que contiene TODOS los valores calculados
3. **Extraemos los valores calculados del witness** usando los índices de `param_witnesses`
4. **Usamos esos valores como public inputs** para generar el proof

## Estado Actual (Incorrecto)

- ❌ El circuito NO calcula los hashes, solo valida que el voto es 0 o 1
- ❌ El frontend calcula manualmente los hashes usando `keccak_256` de `@noble/hashes`
- ❌ Esto es incorrecto porque los hashes deberían calcularse dentro del circuito

## Solución Correcta

### 1. El circuito DEBE calcular los hashes internamente

El circuito debe:
- Calcular `commitment = keccak256([vote, salt])` internamente
- Calcular `nullifier = keccak256([identity_secret, salt, proposal_id])` internamente
- Verificar que esos valores calculados coinciden con los public inputs proporcionados

### 2. Extraer valores del witness

Según `param_witnesses` en `voting.json`:
- `commitment` está en el índice `[3, 4)` del witness
- `nullifier` está en el índice `[4, 5)` del witness

Después de `noir.execute(inputs)`, el witness contendrá los valores calculados y podemos extraerlos:
```typescript
const { witness } = await noir.execute(inputs);
const computedCommitment = witness[3]; // commitment está en índice 3
const computedNullifier = witness[4]; // nullifier está en índice 4
```

### 3. Usar valores calculados como public inputs

Usamos los valores extraídos del witness como public inputs para generar el proof:
```typescript
const proofResult = await noirService.generateProof('voting', {
  identity_secret: identitySecret.toString(),
  vote,
  salt: salt.toString(),
  commitment: computedCommitment.toString(), // Del witness
  nullifier: computedNullifier.toString(),   // Del witness
  proposal_id: proposalId.toString(),
});
```

## Flujo Completo

1. **Ejecutar circuito con dummy public inputs** para calcular los hashes:
   ```typescript
   const { witness } = await noir.execute({
     identity_secret: identitySecret.toString(),
     vote,
     salt: salt.toString(),
     commitment: 0, // Dummy, se calculará internamente
     nullifier: 0,  // Dummy, se calculará internamente
     proposal_id: proposalId.toString(),
   });
   ```

2. **Extraer valores calculados del witness**:
   ```typescript
   const computedCommitment = witness[3];
   const computedNullifier = witness[4];
   ```

3. **Usar valores calculados para generar el proof**:
   ```typescript
   const proofResult = await noirService.generateProof('voting', {
     ...private inputs,
     commitment: computedCommitment.toString(),
     nullifier: computedNullifier.toString(),
   });
   ```

## Próximos Pasos

1. **Implementar cálculo de hashes en el circuito** usando `keccak256` (crate externo o función estándar)
2. **Modificar `calculateCommitmentAndNullifier`** para extraer valores del witness
3. **Probar que los valores calculados coinciden** con los public inputs

## Referencias

- Noir witness extraction: Los valores calculados están en el witness generado por `noir.execute()`
- `param_witnesses`: Muestra los índices en el witness donde están los parámetros
- Ejemplo de `voting.json`: `commitment` está en `[3,4)` y `nullifier` en `[4,5)`

