# Guía de Uso del Debugger para el Contrato Voting

## 🔴 Problema Actual: `MismatchingParameterLen`

El error `MismatchingParameterLen` significa que los parámetros que estás enviando no coinciden con lo que el contrato espera.

---

## ✅ Solución: Cómo Llenar Correctamente los Campos

### 1. `create_proposal` - Crear Propuesta

**Firma del contrato:**
```rust
pub fn create_proposal(
    env: Env,
    creator: Address,      // ✅ Correcto
    description: Bytes,    // ❌ Debe ser Bytes, no vacío
    deadline: u64,        // ❌ Debe ser un número
) -> u64
```

**Pasos para usar correctamente:**

1. **Campo `creator` (Address):**
   - ✅ Ya está lleno: `GBNMDGP4IQBL7FL3BD6DMO6GIM5Q6GWYMDCHPNZF7SY4YW7ZBH2ABHEB`
   - No necesitas cambiar nada aquí

2. **Campo `description` (Bytes):**
   - ❌ **Problema:** Está vacío (`Bytes()`)
   - ✅ **Solución:** Necesitas ingresar texto en el campo
   - En el debugger, busca el campo de texto para `description`
   - Escribe algo como: `"Test proposal for debugging"`
   - El debugger automáticamente lo convertirá a `Bytes`

3. **Campo `deadline` (u64):**
   - ❌ **Problema:** No se ve si está lleno
   - ✅ **Solución:** Ingresa un número grande (ej: `100000`)
   - Este es el ledger sequence donde termina el período de votación

**Ejemplo de valores correctos:**
- `creator`: `GBNMDGP4IQBL7FL3BD6DMO6GIM5Q6GWYMDCHPNZF7SY4YW7ZBH2ABHEB` ✅
- `description`: `"Test proposal"` ✅ (el debugger lo convierte a Bytes)
- `deadline`: `100000` ✅ (un número grande)

**Después de llenar todos los campos:**
1. Click **"Simulate"** primero
2. Si la simulación funciona, deberías ver un resultado con un número (el `proposal_id`)
3. Luego puedes click **"Submit Transaction"** para enviar la transacción real

---

### 2. `vote` - Votar

**Firma del contrato:**
```rust
pub fn vote(
    env: Env,
    voter: Address,                    // ✅
    proposal_id: u64,                  // ✅
    commitment: BytesN<32>,            // ❌ Debe ser 32 bytes
    nullifier: BytesN<32>,             // ❌ Debe ser 32 bytes
    vk_json: Bytes,                    // ❌ Debe ser el VK JSON
    proof_blob: Bytes,                 // ❌ Debe ser el proof
) -> Result<BytesN<32>, Error>
```

**Pasos para usar correctamente:**

1. **Campo `voter` (Address):**
   - ✅ Ya está lleno: `GBNMDGP4IQBL7FL3BD6DMO6GIM5Q6GWYMDCHPNZF7SY4YW7ZBH2ABHEB`

2. **Campo `proposal_id` (u64):**
   - ✅ Ingresa el ID de una propuesta existente (ej: `1` o `2`)

3. **Campo `commitment` (BytesN<32>):**
   - ❌ **Problema:** Necesitas un hash de 32 bytes
   - ✅ **Solución:** Para debugging rápido, genera un valor temporal:
     - Ve a la consola del navegador
     - Ejecuta: `Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')`
     - Esto genera un hex string de 64 caracteres (32 bytes)
     - Pega ese valor en el campo `commitment`

4. **Campo `nullifier` (BytesN<32>):**
   - ✅ Similar a `commitment`, genera otro hash de 32 bytes
   - Usa el mismo comando en la consola para generar otro valor

5. **Campo `vk_json` (Bytes):**
   - ❌ **Problema:** Necesitas el verification key JSON
   - ✅ **Solución:** Usa el VK que está en `public/circuits/voting_vk.json`
     - Abre ese archivo
     - Copia todo el contenido JSON
     - Pega en el campo `vk_json`

6. **Campo `proof_blob` (Bytes):**
   - ❌ **Problema:** Necesitas un proof generado
   - ✅ **Solución:** Para debugging, puedes usar un proof dummy (32 bytes aleatorios)
     - O mejor: genera un proof real usando la UI de votación y copia el `proof_blob` desde la consola

**Nota:** Para probar `vote` completamente, es mejor usar la UI de votación normal porque necesita generar el proof correcto. El debugger es más útil para funciones más simples.

---

### 3. `reveal_vote` - Revelar Voto

**Firma del contrato:**
```rust
pub fn reveal_vote(
    env: Env,
    voter: Address,                    // ✅
    proposal_id: u64,                  // ✅
    nullifier: BytesN<32>,             // ❌ Debe ser el nullifier usado en vote
    vote: u32,                         // ✅ 0 o 1
    salt: BytesN<32>,                  // ❌ Debe ser el salt usado originalmente
) -> Result<(), Error>
```

**Pasos para usar correctamente:**

1. **Campo `voter` (Address):**
   - ✅ Ya está lleno

2. **Campo `proposal_id` (u64):**
   - ✅ Ingresa el ID de la propuesta donde votaste

3. **Campo `nullifier` (BytesN<32>):**
   - ❌ **Problema:** Debe ser el MISMO nullifier que usaste en `vote`
   - ✅ **Solución:** Copia el nullifier que usaste cuando votaste
   - Este es crítico: si no usas el mismo nullifier, el reveal fallará

4. **Campo `vote` (u32):**
   - ✅ Ingresa `0` o `1` (el voto que hiciste)

5. **Campo `salt` (BytesN<32>):**
   - ❌ **Problema:** Debe ser el MISMO salt que usaste en `vote`
   - ✅ **Solución:** El salt debe haberse guardado cuando votaste (en localStorage)
   - Si no lo tienes, no podrás revelar el voto

**⚠️ Importante:** Para revelar un voto, NECESITAS guardar:
- El `nullifier` usado en `vote`
- El `salt` usado en `vote`
- El `vote` (0 o 1)

Estos valores deben guardarse localmente cuando votas (la UI de votación debería hacer esto automáticamente).

---

## 🔍 Funciones Más Fáciles de Debuggear (Read-Only)

### `get_proposal` - Ver Detalles de Propuesta

**Firma:**
```rust
pub fn get_proposal(env: Env, proposal_id: u64) -> Option<(Bytes, u64, Address)>
```

**Uso:**
1. Campo `proposal_id`: Ingresa un número (ej: `1`, `2`)
2. Click **"Simulate"** (no necesitas enviar transacción)
3. Deberías ver los detalles: `(description, deadline, creator)`

**✅ Esta es la función más fácil de probar primero**

---

### `get_vote_count` - Ver Conteo de Votos

**Firma:**
```rust
pub fn get_vote_count(env: Env, proposal_id: u64, vote: u32) -> u64
```

**Uso:**
1. Campo `proposal_id`: Ingresa un número
2. Campo `vote`: Ingresa `0` o `1`
3. Click **"Simulate"**
4. Deberías ver el conteo (ej: `0`, `1`, `2`, etc.)

**✅ Muy fácil de probar**

---

### `is_nullifier_used` - Verificar si Nullifier Fue Usado

**Firma:**
```rust
pub fn is_nullifier_used(env: Env, nullifier: BytesN<32>) -> bool
```

**Uso:**
1. Campo `nullifier`: Ingresa un hash de 32 bytes (hex string de 64 caracteres)
2. Click **"Simulate"**
3. Deberías ver `true` o `false`

---

## 📝 Pasos Recomendados para Debugging

### Paso 1: Probar Funciones Read-Only

1. Abre `/debug/voting`
2. Prueba `get_proposal` con `proposal_id: 1`
3. Si funciona, el contrato está desplegado correctamente ✅

### Paso 2: Crear una Propuesta (MÁS IMPORTANTE AHORA)

1. En la card `create_proposal`:
   - ✅ `creator`: Ya está lleno
   - ✅ `description`: **ESCRIBE texto** (ej: `"Test proposal"`)
   - ✅ `deadline`: **ESCRIBE un número** (ej: `100000`)
2. Click **"Simulate"**
3. Si funciona, verás un número (el `proposal_id`)
4. Si funciona, click **"Submit Transaction"** y firma
5. Guarda el `proposal_id` que obtengas

### Paso 3: Verificar la Propuesta Creada

1. Usa `get_proposal` con el `proposal_id` que obtuviste
2. Deberías ver los detalles de la propuesta

### Paso 4: Probar Votación (Más Complejo)

- Para votar correctamente, es mejor usar la UI de votación normal (`/`)
- El debugger de `vote` es útil para debuggear problemas específicos después de que falla en la UI

---

## 🐛 Debugging del Error Actual

El error que estás viendo:
```
HostError: Error(WasmVm, UnexpectedSize)
data:["VM call failed: Func(MismatchingParameterLen)", create_proposal]
```

**Causa probable:**
- El campo `description` está vacío (`Bytes()`)
- El campo `deadline` puede estar vacío o mal formateado

**Solución:**
1. **Asegúrate de llenar TODOS los campos:**
   - `creator`: ✅ Ya está lleno
   - `description`: ✅ **ESCRIBE texto** (ej: `"Test"`)
   - `deadline`: ✅ **ESCRIBE un número** (ej: `100000`)

2. **Después de llenar todos los campos, click "Simulate"**

3. **Si aún falla, verifica:**
   - Que el contrato esté actualizado (el hash debería coincidir)
   - Que estés usando el Contract ID correcto: `CBF7EKITGLFSLUZE6FXKH2P77D4PDG3NUG5YXVPCFWCDZWSTHE3XA3Z5`

---

## ✅ Checklist para `create_proposal`

- [ ] Campo `creator` está lleno (dirección de wallet)
- [ ] Campo `description` tiene texto (no vacío)
- [ ] Campo `deadline` tiene un número (ej: 100000)
- [ ] Click "Simulate" primero
- [ ] La simulación devuelve un número (proposal_id)
- [ ] Si funciona, click "Submit Transaction"
- [ ] Verificar con `get_proposal` usando el ID obtenido

---

## 💡 Tips

1. **Siempre usa "Simulate" primero:** Es gratis y no modifica estado
2. **Lee los errores cuidadosamente:** El debugger muestra errores específicos del contrato
3. **Compara con la UI:** Si funciona en debugger pero no en UI, el problema está en el frontend
4. **Usa funciones read-only para verificar:** `get_proposal`, `get_vote_count`, etc.
5. **Guarda valores importantes:** Cuando votas, guarda `nullifier`, `salt`, y `vote` para poder revelar después

