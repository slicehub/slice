# Extracción del Witness - Mejoras para MVP

## Estado Actual

- ✅ Circuito compila correctamente (`voting.json` generado)
- ✅ Tests pasando (3/3)
- ⚠️ El circuito NO calcula hashes internamente (solo valida voto 0 o 1)
- ⚠️ El frontend calcula hashes manualmente usando `keccak_256` de `@noble/hashes`

## Estrategia para MVP

Para el MVP, mejoramos la extracción del witness PRIMERO para entender cómo funciona, incluso si el circuito aún no calcula los hashes. Esto nos permite:

1. **Extraer valores del witness** usando los índices de `param_witnesses`
2. **Validar que el flujo funciona** correctamente
3. **Aplicar lo mismo** cuando el circuito calcule los hashes internamente

## Índices del Witness

Según `param_witnesses` en `voting.json`:
```json
{
  "commitment": [{"start": 3, "end": 4}],    // witness[3]
  "nullifier": [{"start": 4, "end": 5}],     // witness[4]
  "proposal_id": [{"start": 5, "end": 6}],   // witness[5]
  "identity_secret": [{"start": 0, "end": 1}], // witness[0]
  "vote": [{"start": 1, "end": 2}],          // witness[1]
  "salt": [{"start": 2, "end": 3}]           // witness[2]
}
```

## Flujo de Extracción

1. **Ejecutar circuito con inputs** (incluyendo public inputs calculados externamente):
   ```typescript
   const { witness } = await noir.execute({
     identity_secret: identitySecret.toString(),
     vote,
     salt: salt.toString(),
     commitment: commitment.toString(),  // Calculado externamente por ahora
     nullifier: nullifier.toString(),    // Calculado externamente por ahora
     proposal_id: proposalId.toString(),
   });
   ```

2. **Extraer valores del witness**:
   ```typescript
   const witnessCommitment = BigInt(witness[3]);  // Índice según param_witnesses
   const witnessNullifier = BigInt(witness[4]);
   ```

3. **Usar valores extraídos** (actualmente son los valores proporcionados, pero cuando el circuito calcule hashes, serán los valores calculados):
   ```typescript
   return {
     commitment: witnessCommitment,
     nullifier: witnessNullifier,
   };
   ```

## Próximos Pasos

1. ✅ **Mejorar `calculateCommitmentAndNullifier`** para extraer del witness
2. **Probar que la extracción funciona** correctamente
3. **Implementar cálculo de hashes en el circuito** (cuando tengamos la sintaxis correcta)
4. **Verificar que los valores extraídos coinciden** con los calculados internamente

## Nota Importante

Actualmente, los valores en el witness son los que proporcionamos como inputs (porque el circuito no calcula hashes). Una vez que el circuito calcule hashes internamente, esos valores calculados estarán en el witness y podremos extraerlos usando los mismos índices.

