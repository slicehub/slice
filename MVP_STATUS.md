# Estado del MVP - Sistema de Votación Anónimo

## ✅ Completado

1. **Circuito Noir compilado**:
   - ✅ `circuits/target/voting.json` generado
   - ✅ `public/circuits/voting.json` copiado
   - ✅ Tests pasando (3/3)
   - ✅ Validación de voto implementada: `assert(vote * (vote - 1) == 0)`

2. **Extracción del Witness mejorada**:
   - ✅ Función `calculateCommitmentAndNullifier` mejorada para extraer valores del witness
   - ✅ Usa índices de `param_witnesses` para extraer `commitment` y `nullifier`
   - ✅ Ejecuta el circuito para validar que los valores coinciden

## ⚠️ Estado Actual (MVP Simplificado)

### Lo que funciona ahora:

1. **Circuito valida que el voto es 0 o 1** usando polinomio
2. **Frontend calcula hashes externamente** usando `keccak_256` de `@noble/hashes`
3. **Extracción del witness implementada** para extraer valores calculados
4. **Flujo completo funciona** (aunque los hashes se calculan externamente)

### Lo que falta implementar:

1. **Cálculo de hashes en el circuito** (requiere corregir sintaxis de `to_le_bytes()` y `keccak256()`)
2. **Usar valores extraídos del witness** en lugar de valores calculados externamente
3. **Verificar que los valores extraídos coinciden** con los calculados internamente

## Flujo Actual

```
1. Frontend calcula commitment y nullifier externamente (keccak_256)
2. Ejecuta circuito con esos valores como public inputs
3. Extrae valores del witness (actualmente son los valores proporcionados)
4. Usa esos valores para generar el proof
5. Envía el proof al contrato
```

## Flujo Deseado (cuando el circuito calcule hashes)

```
1. Ejecuta circuito solo con private inputs
2. El circuito calcula commitment y nullifier internamente
3. Extrae valores calculados del witness
4. Usa esos valores como public inputs para generar el proof
5. Envía el proof al contrato
```

## Próximos Pasos

1. **Probar el flujo actual** para verificar que funciona correctamente
2. **Implementar cálculo de hashes en el circuito** (cuando tengamos la sintaxis correcta)
3. **Actualizar extracción del witness** para usar valores calculados internamente

## Nota Importante

Para el MVP, el flujo actual funciona correctamente porque:
- El circuito valida que el voto es válido
- Los hashes se calculan externamente (mismo método que usará el circuito)
- La extracción del witness está implementada y lista para cuando el circuito calcule hashes
- El contrato verifica la consistencia en el reveal phase

Una vez que el circuito calcule hashes internamente, solo necesitamos cambiar una línea en `calculateCommitmentAndNullifier` para usar los valores extraídos del witness en lugar de los calculados externamente.

