# Explicación de las Cards y su Utilidad para Debugging

## 📋 Índice

1. [ProposalCard - Cards de Propuestas](#1-proposalcard---cards-de-propuestas)
2. [Debugger Cards - Herramienta de Debugging](#2-debugger-cards---herramienta-de-debugging)
3. [Transaction Cards - Resultados de Transacciones](#3-transaction-cards---resultados-de-transacciones)
4. [Cómo Usar las Cards para Debuggear](#4-cómo-usar-las-cards-para-debuggear)

---

## 1. ProposalCard - Cards de Propuestas

**Ubicación:** `/src/components/ProposalCard.tsx`  
**Dónde se muestran:** Página principal (`/`) - Lista de propuestas

### ¿Qué muestra?

Cada `ProposalCard` representa una propuesta de votación y muestra:

- **Información básica:**
  - `Proposal #ID` - El identificador único de la propuesta
  - `Description` - La descripción de la propuesta (disputa)
  - `Creator` - Dirección del creador (truncada a 8 caracteres)
  - `Deadline` - Ledger sequence donde termina el período de votación
  - `Status` - "Voting Phase" (verde) o "Reveal Phase" (rojo)

- **Conteo de votos (solo en Reveal Phase):**
  - `Votes Against (0)` - Número de votos en contra
  - `Votes For (1)` - Número de votos a favor

- **Acciones disponibles:**
  - Botón **"Vote"** - Abre el formulario para votar (solo en Voting Phase)
  - Botón **"Reveal Vote"** - Abre el formulario para revelar tu voto
  - Botón **"Refresh Counts"** - Recarga los conteos de votos

### ¿Por qué es útil para debugging?

1. **Ver el estado actual de las propuestas:**
   - Puedes ver si la propuesta está en fase de votación o de revelación
   - Verificar que el deadline se guardó correctamente
   - Confirmar que el creador se guardó correctamente

2. **Probar el flujo completo:**
   - Crear una propuesta → Verla en la lista → Votar → Revelar → Ver conteos
   - Si algo falla, la card muestra errores o estados incorrectos

3. **Verificar datos del contrato:**
   - Los conteos de votos vienen directamente del contrato (`get_vote_count`)
   - Si no se muestran correctamente, hay un problema en el contrato o en la llamada

---

## 2. Debugger Cards - Herramienta de Debugging

**Ubicación:** `/src/pages/Debugger.tsx` y `/src/debug/components/`  
**Ruta:** `/debug` o `/debug/<nombre-del-contrato>`  
**Esta es la herramienta MÁS ÚTIL para debugging**

### ¿Qué es?

El Debugger es una interfaz visual que te permite:

1. **Invocar cualquier función del contrato directamente:**
   - Ver todas las funciones disponibles del contrato
   - Llenar formularios generados automáticamente desde el ABI
   - Simular transacciones antes de enviarlas
   - Enviar transacciones reales y ver resultados detallados

2. **Ver información del contrato:**
   - Contract ID (dirección del contrato)
   - Metadata del contrato (tipos, funciones, etc.)
   - Especificación completa (spec)

### ¿Cómo funciona?

#### Paso 1: Seleccionar un Contrato

En la parte superior, verás "pills" (botones) con los nombres de los contratos:
- `voting`
- `ultrahonk_soroban_contract`
- `guess_the_puzzle`

Clickea en el contrato que quieras debuggear (por ejemplo, `voting`).

#### Paso 2: Card de Información del Contrato

Aparece una **Card** con:
- Nombre del contrato
- **Contract ID** - Dirección del contrato (puedes copiarlo)
- Botón **"Show Details"** - Muestra metadata detallada del contrato

#### Paso 3: Cards de Funciones

Debajo, aparecen **Cards individuales para cada función** del contrato:

**Para el contrato `voting`, verás:**
- `admin` - Ver quién es el admin
- `create_proposal` - Crear una nueva propuesta
- `get_proposal` - Obtener detalles de una propuesta
- `get_vote_count` - Obtener el conteo de votos
- `is_nullifier_used` - Verificar si un nullifier fue usado
- `is_vote_revealed` - Verificar si un voto fue revelado
- `reveal_vote` - Revelar un voto
- `vote` - Votar en una propuesta

Cada card tiene:

1. **Formulario generado automáticamente:**
   - Campos para cada parámetro que requiere la función
   - Validación de tipos (ej: `u64`, `BytesN<32>`, `Address`)
   - Botones para seleccionar tipos complejos (ej: Address, Bytes)

2. **Botones de acción:**
   - **"Simulate"** - Simula la transacción SIN enviarla (no cuesta, no modifica estado)
   - **"Submit Transaction"** - Envía la transacción real (requiere firma de wallet)

3. **Cards de resultado:**
   - **ValidationResponseCard** - Muestra el resultado de la simulación
   - **TransactionSuccessCard** - Muestra el resultado de la transacción enviada
   - **ErrorResponseCard** - Muestra errores si algo falla

### ¿Por qué es útil para debugging?

#### 🔍 Caso de Uso 1: Probar `create_proposal` directamente

**Problema:** "No puedo crear una propuesta desde la UI"

**Solución con Debugger:**
1. Ve a `/debug/voting`
2. Busca la card de `create_proposal`
3. Llena los campos:
   - `creator`: Tu dirección de wallet
   - `description`: Bytes (usa el campo de texto)
   - `deadline`: Número (ej: 100000)
4. Click **"Simulate"** primero
5. Si la simulación funciona, click **"Submit Transaction"**
6. **Ventaja:** Ves EXACTAMENTE qué error devuelve el contrato (si hay uno)

**Resultado:** Si funciona en el debugger pero no en la UI, el problema está en el frontend (`VotingService.ts`). Si no funciona en el debugger, el problema está en el contrato.

#### 🔍 Caso de Uso 2: Verificar datos almacenados

**Problema:** "No sé si mi voto se guardó correctamente"

**Solución con Debugger:**
1. Ve a `/debug/voting`
2. Usa `get_proposal` para ver los detalles de una propuesta
3. Usa `is_nullifier_used` para verificar si tu nullifier fue guardado
4. Usa `get_vote_count` para ver cuántos votos hay

#### 🔍 Caso de Uso 3: Debuggear errores específicos

**Problema:** "Obtengo un error vago: 'Failed to create proposal'"

**Solución con Debugger:**
1. Ve a `/debug/voting`
2. Intenta la misma operación que falla en la UI
3. El debugger te mostrará:
   - El error EXACTO del contrato (código de error, mensaje)
   - La transacción XDR completa
   - Los datos de simulación vs. datos de envío

#### 🔍 Caso de Uso 4: Probar funciones read-only (sin costo)

**Problema:** "Quiero verificar datos sin gastar XLM"

**Solución con Debugger:**
1. Las funciones de solo lectura (ej: `get_proposal`, `get_vote_count`) solo requieren **Simulate**
2. No necesitas firmar ni enviar transacciones
3. Obtienes los datos inmediatamente

---

## 3. Transaction Cards - Resultados de Transacciones

### ValidationResponseCard

**Ubicación:** `/src/debug/components/ValidationResponseCard.tsx`

Muestra el resultado de una simulación o transacción con:

- **Título** - Ej: "Transaction submitted!" (éxito) o "Error" (error)
- **Summary** - Resumen del resultado
- **Botón "Show Details"** - Expande para ver información detallada
- **Link "See on lab"** - Abre la transacción en Stellar Lab (si está en testnet/mainnet)

**Cuando está expandida, muestra:**
- Hash de la transacción
- Ledger number donde se incluyó
- Transaction Envelope (XDR completo)
- Transaction Result (resultado en XDR)
- Transaction Result Meta (metadatos)
- Fee pagado

### TransactionSuccessCard

**Ubicación:** `/src/debug/components/TransactionSuccessCard.tsx`

Card específica para transacciones exitosas. Muestra:

- Alert de éxito
- Hash de la transacción
- Ledger number
- XDRs completos (Envelope, Result, ResultMeta)
- Fee

### ErrorResponseCard

**Ubicación:** `/src/debug/components/ErrorResponse.tsx`

Card específica para errores. Muestra:

- Tipo de error (ej: `CONTRACT_ERROR`, `AUTH_REQUIRED`)
- Código de error específico del contrato
- Mensaje de error
- Stack trace (si está disponible)

---

## 4. Cómo Usar las Cards para Debuggear

### 🐛 Debugging del Problema Actual: "Failed to create proposal"

#### Paso 1: Verificar el contrato directamente

1. Abre el navegador y ve a `http://localhost:5173/debug/voting`
2. Busca la card de `create_proposal`
3. Llena los campos:
   - `creator`: Tu dirección de wallet (ej: `GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
   - `description`: Bytes - Convierte tu texto a bytes (ej: "Test proposal")
   - `deadline`: Un número grande (ej: `100000`)
4. Click **"Simulate"**

**Resultado esperado:**
- Si la simulación muestra `simulatedResult: 2n` (BigInt), el contrato funciona
- Si muestra un error, lee el mensaje de error exacto

#### Paso 2: Enviar transacción real

1. Si la simulación funciona, click **"Submit Transaction"**
2. Firma la transacción con tu wallet
3. Observa el resultado en la **TransactionSuccessCard**

**Lo que verás:**
- Hash de la transacción
- Valor de retorno (`result` o `returnValue`)
- XDR completo de la transacción

**Si funciona aquí pero no en la UI:**
- El problema está en `VotingService.createProposal()`
- Necesitas verificar cómo estás parseando el resultado

#### Paso 3: Verificar que la propuesta se creó

1. Usa la card `get_proposal`
2. Parámetro `proposal_id`: El número que obtuviste (ej: `2`)
3. Click **"Simulate"**
4. Deberías ver los detalles de la propuesta

### 🐛 Debugging del Flujo de Votación

#### Paso 1: Verificar que puedes votar

1. Ve a `/debug/voting`
2. Usa la card `vote`
3. Necesitas:
   - `voter`: Tu dirección
   - `proposal_id`: ID de la propuesta
   - `commitment`: BytesN<32> - Hash del voto
   - `nullifier`: BytesN<32> - Nullifier único
   - `vk_json`: Bytes - Verification key JSON
   - `proof_blob`: Bytes - Proof generado

**Nota:** Para obtener estos valores, usa la UI normal de votación y copia los valores desde la consola del navegador.

#### Paso 2: Verificar nullifiers

1. Usa la card `is_nullifier_used`
2. Pega tu nullifier
3. Click **"Simulate"**
4. Debería mostrar `true` si ya votaste

#### Paso 3: Verificar conteos de votos

1. Usa la card `get_vote_count`
2. `proposal_id`: ID de la propuesta
3. `vote`: `0` o `1`
4. Click **"Simulate"**
5. Deberías ver el conteo actual

### 🔍 Tips Generales para Debugging

1. **Siempre usa "Simulate" primero:**
   - Es gratis (no cuesta XLM)
   - No modifica el estado del contrato
   - Te muestra el resultado esperado

2. **Compara simulación vs. envío:**
   - Si la simulación funciona pero el envío falla, puede ser un problema de permisos, auth, o secuencia
   - Si ambos fallan, el problema está en el contrato o los parámetros

3. **Lee los XDRs:**
   - Los XDRs contienen TODA la información de la transacción
   - Si expandes los detalles, puedes ver exactamente qué se envió

4. **Usa funciones read-only para verificar estado:**
   - `get_proposal`, `get_vote_count`, `is_nullifier_used`, etc.
   - No requieren transacciones, solo simulación

5. **Compara con la UI:**
   - Si algo funciona en el debugger pero no en la UI, el problema está en el frontend
   - Si no funciona en ninguno, el problema está en el contrato

---

## 📝 Resumen

| Card | Propósito | Cuándo Usarla |
|------|-----------|---------------|
| **ProposalCard** | Ver propuestas en la UI principal | Verificar que las propuestas se muestran correctamente |
| **Debugger Contract Card** | Información del contrato | Ver Contract ID, metadata |
| **Debugger Function Cards** | Invocar funciones del contrato | **USAR PARA DEBUGGEAR** - Probar funciones directamente |
| **ValidationResponseCard** | Resultado de simulación/transacción | Ver resultados detallados |
| **TransactionSuccessCard** | Éxito de transacción | Ver hash, ledger, XDRs |
| **ErrorResponseCard** | Error de transacción | Ver errores específicos del contrato |

---

## 🎯 Próximos Pasos

1. **Abre el Debugger:** `http://localhost:5173/debug/voting`
2. **Prueba `create_proposal`** directamente para ver si el problema está en el contrato o en el frontend
3. **Verifica el resultado** usando `get_proposal` con el ID devuelto
4. **Compara** con lo que ves en la UI principal (`/`)

Si el debugger funciona pero la UI no, entonces el problema está en `VotingService.ts` y necesitamos ajustar cómo parseamos el resultado de la transacción.

