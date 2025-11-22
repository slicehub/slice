# Notas de Compilación del Circuito Noir

## Estado Actual

- ✅ `nargo` está instalado (v0.28.0)
- ✅ `Nargo.toml` actualizado con nombre `voting`
- ❌ Circuito necesita corrección de sintaxis:
  - `to_le_bytes()` requiere sintaxis genérica correcta
  - `keccak256()` no está en std::hash, necesita crate externo

## Errores Encontrados

1. **`to_le_bytes()`**: La sintaxis genérica `::<32>()` no es correcta en Noir 0.28
2. **`keccak256()`**: No está disponible en `std::hash`, necesita crate externo `keccak256`

## Solución Según Recomendaciones GPT

1. **Agregar crate keccak256** en `Nargo.toml`:
   ```toml
   [dependencies]
   keccak256 = { git = "https://github.com/noir-lang/keccak256", tag = "v0.28.0" }
   ```

2. **Usar sintaxis correcta para `to_le_bytes`**:
   - Intentar `to_le_bytes::<32>()` o
   - Usar sintaxis sin genéricos si el tamaño se infiere

3. **Importar y usar keccak256 del crate**:
   ```noir
   use keccak256::keccak256;
   ```

## Próximos Pasos

1. Agregar dependencia keccak256 a Nargo.toml
2. Corregir sintaxis de to_le_bytes en el circuito
3. Usar keccak256 del crate externo en lugar de std::hash
4. Compilar: `nargo check`
5. Probar: `nargo test`
6. Compilar: `nargo compile`

## Referencias

- Noir keccak256 crate: https://github.com/noir-lang/keccak256
- Documentación Noir: https://noir-lang.org/docs
- Repo original: https://github.com/tupui/ultrahonk_soroban_contract

