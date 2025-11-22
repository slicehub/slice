# Estado del Circuito Noir - Voting ✅

## Estado Actual

✅ **Circuito compilado exitosamente**
- `nargo` instalado (v0.28.0)
- `Nargo.toml` configurado correctamente
- `voting.json` generado y copiado a `public/circuits/`
- Todos los tests pasando (3/3)

## Implementación Actual (MVP Simplificado)

El circuito actual es una versión simplificada para MVP que:

1. ✅ **Valida que el voto es 0 o 1** usando polinomio: `assert(vote * (vote - 1) == 0)`
2. ✅ **Acepta commitment y nullifier como public inputs** (calculados externamente)
3. ⚠️ **No calcula hashes internamente** - esto se hace en el frontend/contract

## Parámetros del Circuito

### Inputs Privados:
- `identity_secret: Field` - Secreto de identidad del votante
- `vote: Field` - Voto (0 o 1)
- `salt: Field` - Salt aleatorio

### Inputs Públicos:
- `commitment: pub Field` - Commitment del voto (calculado externamente)
- `nullifier: pub Field` - Nullifier para prevenir doble voto (calculado externamente)
- `proposal_id: pub Field` - ID de la propuesta

## Próximos Pasos para Implementación Completa

Para implementar el cálculo de hashes dentro del circuito:

1. **Corregir sintaxis de `to_le_bytes()`**:
   ```noir
   let bytes: [u8; N] = field.to_le_bytes::<N>();
   ```

2. **Usar `keccak256` correctamente**:
   - Opción A: Usar `keccakf1600` (disponible en std)
   - Opción B: Agregar crate externo `keccak256` en `Nargo.toml`

3. **Implementar cálculo de commitment**:
   ```noir
   commitment = keccak256([vote, salt])
   ```

4. **Implementar cálculo de nullifier**:
   ```noir
   nullifier = keccak256([identity_secret, salt, proposal_id])
   ```

## Archivos Generados

- ✅ `circuits/target/voting.json` - Circuito compilado
- ✅ `public/circuits/voting.json` - Copiado para uso en frontend

## Tests

✅ Todos los tests pasan:
- `test_valid_vote_0` ✅
- `test_valid_vote_1` ✅
- `test_reject_invalid_vote` ✅ (falla correctamente cuando vote != 0 y vote != 1)

## Warnings Actuales

- Variables no usadas (esperado en MVP simplificado):
  - `identity_secret`, `salt`, `commitment`, `nullifier`, `proposal_id`

Estos warnings se resolverán cuando implementemos el cálculo de hashes dentro del circuito.

## Notas para MVP

El MVP actual funciona correctamente porque:
1. El circuito valida que el voto es válido (0 o 1)
2. El frontend calcula commitment y nullifier usando `keccak256` de JavaScript
3. El contrato Soroban verifica que los valores coinciden en el reveal phase

Para una implementación más robusta, el cálculo de hashes debería hacerse dentro del circuito para mayor seguridad.

## Referencias

- Noir docs: https://noir-lang.org/docs
- Noir keccak256: https://github.com/noir-lang/keccak256
- Repo original: https://github.com/tupui/ultrahonk_soroban_contract
