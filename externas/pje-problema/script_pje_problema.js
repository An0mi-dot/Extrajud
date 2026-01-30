// O script do PJE ta com um erro:
// Existe uma cidade (Acho que cruz das almas, mas nao acho que tenha algo a ver com uma cidade em especifico) que ao clique, ela registra algo como se a cidade não existisse ou algo assim, da um erro...
// Isso leva a pagina pro inicio dela e desseleciona a aba das ciadades e o script de vez lé as outras cidades, mas como não ta selecionado na aba Pendentes de ciencias ou de resposta, ele nao acha nada.
// Consegue resolver?
// Esse erro em questao ja foi resolvido, pelo menos eu achava, mas hoje,
// enquanto eu extraia as cidades, o erro surgiu novamente, porem ele claramente está diferente,
// ele agora funciona em algumas cidades, mas em outras ele simplesmente não consegue registrar.

// Log do erro abaixo:

//  🚀 Iniciando Extrator PJe - Versão JS Corrigida (Seletor SPAN, Paginação e Word)
// VM1244:55  ▶ Processando 186 cidades...
// VM1244:65 ⏳ (1/186) Buscando: ALAGOINHAS...
// Promise {<pending>}
// 208[Violation]'setTimeout' handler demorou <N>ms
// VM1244:132       Página 1...
// VM1244:158    ✅ 5 expedientes coletados no total.
// VM1244:65 ⏳ (2/186) Buscando: AMARGOSA...
// 123[Violation]'readystatechange' handler demorou <N>ms
// VM1244:132       Página 1...
// VM1244:158    ✅ 19 expedientes coletados no total.
// VM1244:65 ⏳ (3/186) Buscando: AMÉLIA RODRIGUES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (4/186) Buscando: ANAGÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (5/186) Buscando: ANDARAÍ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 9 expedientes coletados no total.
// VM1244:65 ⏳ (6/186) Buscando: ANTAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (7/186) Buscando: ARACI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 5 expedientes coletados no total.
// VM1244:65 ⏳ (8/186) Buscando: BAIANÓPOLIS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (9/186) Buscando: BARRA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (10/186) Buscando: BARRA DA ESTIVA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (11/186) Buscando: BARRA DO MENDES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 36 expedientes coletados no total.
// VM1244:65 ⏳ (12/186) Buscando: BARREIRAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 31 expedientes coletados no total.
// VM1244:65 ⏳ (13/186) Buscando: BELMONTE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 7 expedientes coletados no total.
// VM1244:65 ⏳ (14/186) Buscando: BOM JESUS DA LAPA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (15/186) Buscando: BRUMADO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (16/186) Buscando: BUERAREMA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (17/186) Buscando: CACHOEIRA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 6 expedientes coletados no total.
// VM1244:65 ⏳ (18/186) Buscando: CACULÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 20 expedientes coletados no total.
// VM1244:65 ⏳ (19/186) Buscando: CAETITÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (20/186) Buscando: CAMACAN...
// VM1244:132       Página 1...
// VM1244:158    ✅ 38 expedientes coletados no total.
// VM1244:65 ⏳ (21/186) Buscando: CAMAÇARI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 25 expedientes coletados no total.
// VM1244:65 ⏳ (22/186) Buscando: CAMAMU...
// VM1244:132       Página 1...
// VM1244:158    ✅ 7 expedientes coletados no total.
// VM1244:65 ⏳ (23/186) Buscando: CAMPO FORMOSO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (24/186) Buscando: CANARANA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 16 expedientes coletados no total.
// VM1244:65 ⏳ (25/186) Buscando: CANAVIEIRAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 15 expedientes coletados no total.
// VM1244:65 ⏳ (26/186) Buscando: CANDEIAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 29 expedientes coletados no total.
// VM1244:65 ⏳ (27/186) Buscando: CANSANÇÃO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (28/186) Buscando: CAPELA DO ALTO ALEGRE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 8 expedientes coletados no total.
// VM1244:65 ⏳ (29/186) Buscando: CAPIM GROSSO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 37 expedientes coletados no total.
// VM1244:65 ⏳ (30/186) Buscando: CARAVELAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (31/186) Buscando: CARINHANHA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 15 expedientes coletados no total.
// VM1244:65 ⏳ (32/186) Buscando: CASA NOVA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 11 expedientes coletados no total.
// VM1244:65 ⏳ (33/186) Buscando: CASTRO ALVES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 6 expedientes coletados no total.
// VM1244:65 ⏳ (34/186) Buscando: CATU...
// VM1244:132       Página 1...
// VM1244:158    ✅ 12 expedientes coletados no total.
// VM1244:65 ⏳ (35/186) Buscando: CENTRAL...
// VM1244:132       Página 1...
// VM1244:158    ✅ 9 expedientes coletados no total.
// VM1244:65 ⏳ (36/186) Buscando: CHORROCHÓ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (37/186) Buscando: CÍCERO DANTAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (38/186) Buscando: CIPÓ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 30 expedientes coletados no total.
// VM1244:65 ⏳ (39/186) Buscando: COARACI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (40/186) Buscando: CONCEIÇÃO DO ALMEIDA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (41/186) Buscando: CONCEIÇÃO DO COITÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (42/186) Buscando: CONCEIÇÃO DO JACUÍPE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 15 expedientes coletados no total.
// VM1244:65 ⏳ (43/186) Buscando: CONDE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (44/186) Buscando: CONDEÚBA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 5 expedientes coletados no total.
// VM1244:65 ⏳ (45/186) Buscando: CORAÇÃO DE MARIA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (46/186) Buscando: CORIBE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (47/186) Buscando: CORRENTINA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (48/186) Buscando: COTEGIPE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (49/186) Buscando: CRUZ DAS ALMAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 14 expedientes coletados no total.
// VM1244:65 ⏳ (50/186) Buscando: Cujo prazo findou nos últimos 10 dias - sem resposta...
// VM1244:132       Página 1...
// VM1244:160    ⚠ Nenhum expediente encontrado.
// VM1244:65 ⏳ (51/186) Buscando: CURAÇA...
// VM1244:74     ⚠ Elemento "CURAÇA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: CURAÇA
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (52/186) Buscando: DIAS D'AVILA...
// VM1244:74     ⚠ Elemento "DIAS D'AVILA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "DIAS D'AVILA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (53/186) Buscando: ENTRE RIOS...
// VM1244:74     ⚠ Elemento "ENTRE RIOS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ENTRE RIOS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (54/186) Buscando: ESPLANADA...
// VM1244:74     ⚠ Elemento "ESPLANADA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ESPLANADA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (55/186) Buscando: EUCLIDES DA CUNHA...
// VM1244:74     ⚠ Elemento "EUCLIDES DA CUNHA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "EUCLIDES DA CUNHA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (56/186) Buscando: EUNAPOLIS...
// VM1244:74     ⚠ Elemento "EUNAPOLIS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "EUNAPOLIS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (57/186) Buscando: FEIRA DE SANTANA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (58/186) Buscando: FORMOSA DO RIO PRETO...
// VM1244:74     ⚠ Elemento "FORMOSA DO RIO PRETO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "FORMOSA DO RIO PRETO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (59/186) Buscando: GANDU...
// VM1244:74     ⚠ Elemento "GANDU" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "GANDU" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (60/186) Buscando: GOVERNADOR MANGABEIRA...
// VM1244:74     ⚠ Elemento "GOVERNADOR MANGABEIRA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "GOVERNADOR MANGABEIRA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (61/186) Buscando: GUANAMBI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (62/186) Buscando: GUARATINGA...
// VM1244:74     ⚠ Elemento "GUARATINGA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "GUARATINGA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (63/186) Buscando: IBIRAPUÃ...
// VM1244:74     ⚠ Elemento "IBIRAPUÃ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "IBIRAPUÃ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (64/186) Buscando: IBIRATAIA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (65/186) Buscando: IBOTIRAMA...
// VM1244:74     ⚠ Elemento "IBOTIRAMA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "IBOTIRAMA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (66/186) Buscando: IGAPORÃ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (67/186) Buscando: IGUAI...
// VM1244:74     ⚠ Elemento "IGUAI" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "IGUAI" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (68/186) Buscando: ILHÉUS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 10 expedientes coletados no total.
// VM1244:65 ⏳ (69/186) Buscando: INHAMBUPE...
// VM1244:74     ⚠ Elemento "INHAMBUPE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "INHAMBUPE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (70/186) Buscando: IPIAU...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (71/186) Buscando: IPIRÁ...
// VM1244:74     ⚠ Elemento "IPIRÁ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "IPIRÁ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (72/186) Buscando: IRARÁ...
// VM1244:74     ⚠ Elemento "IRARÁ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: IRARÁ
// VM1244:132       Página 1...
// VM1244:158    ✅ 12 expedientes coletados no total.
// VM1244:65 ⏳ (73/186) Buscando: IRECÊ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (74/186) Buscando: ITABELA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (75/186) Buscando: ITABERABA...
// VM1244:74     ⚠ Elemento "ITABERABA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITABERABA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (76/186) Buscando: ITABUNA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (77/186) Buscando: ITACARÉ...
// VM1244:74     ⚠ Elemento "ITACARÉ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITACARÉ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (78/186) Buscando: ITAGIBÁ...
// VM1244:74     ⚠ Elemento "ITAGIBÁ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITAGIBÁ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (79/186) Buscando: ITAJUÍPE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (80/186) Buscando: ITAMBÉ...
// VM1244:74     ⚠ Elemento "ITAMBÉ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITAMBÉ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (81/186) Buscando: ITANHÉM...
// VM1244:74     ⚠ Elemento "ITANHÉM" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITANHÉM" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (82/186) Buscando: ITAPARICA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (83/186) Buscando: ITAPETINGA...
// VM1244:74     ⚠ Elemento "ITAPETINGA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITAPETINGA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (84/186) Buscando: ITAPICURU...
// VM1244:74     ⚠ Elemento "ITAPICURU" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITAPICURU" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (85/186) Buscando: ITARANTIM...
// VM1244:74     ⚠ Elemento "ITARANTIM" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITARANTIM" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (86/186) Buscando: ITORORÓ...
// VM1244:74     ⚠ Elemento "ITORORÓ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITORORÓ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (87/186) Buscando: ITUAÇU...
// VM1244:74     ⚠ Elemento "ITUAÇU" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITUAÇU" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (88/186) Buscando: ITUBERÁ...
// VM1244:74     ⚠ Elemento "ITUBERÁ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "ITUBERÁ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (89/186) Buscando: JACARACI...
// VM1244:74     ⚠ Elemento "JACARACI" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "JACARACI" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (90/186) Buscando: JACOBINA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (91/186) Buscando: JAGUAQUARA...
// VM1244:74     ⚠ Elemento "JAGUAQUARA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "JAGUAQUARA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (92/186) Buscando: JAGUARARI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (93/186) Buscando: JEQUIÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (94/186) Buscando: JEREMOABO...
// VM1244:74     ⚠ Elemento "JEREMOABO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "JEREMOABO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (95/186) Buscando: JITAÚNA...
// VM1244:74     ⚠ Elemento "JITAÚNA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "JITAÚNA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (96/186) Buscando: JOÃO DOURADO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 25 expedientes coletados no total.
// VM1244:65 ⏳ (97/186) Buscando: JUAZEIRO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (98/186) Buscando: LAJE...
// VM1244:74     ⚠ Elemento "LAJE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "LAJE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (99/186) Buscando: LAPÃO...
// VM1244:74     ⚠ Elemento "LAPÃO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "LAPÃO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (100/186) Buscando: LAURO DE FREITAS...
// VM1244:74     ⚠ Elemento "LAURO DE FREITAS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "LAURO DE FREITAS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (101/186) Buscando: LENÇÓIS...
// VM1244:74     ⚠ Elemento "LENÇÓIS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "LENÇÓIS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (102/186) Buscando: LIVRAMENTO DE NOSSA SENHORA...
// VM1244:74     ⚠ Elemento "LIVRAMENTO DE NOSSA SENHORA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "LIVRAMENTO DE NOSSA SENHORA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (103/186) Buscando: LUÍS EDUARDO MAGALHÃES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (104/186) Buscando: MACARANI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (105/186) Buscando: MACAÚBAS...
// VM1244:74     ⚠ Elemento "MACAÚBAS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MACAÚBAS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (106/186) Buscando: MAIRI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (107/186) Buscando: MARACAS...
// VM1244:74     ⚠ Elemento "MARACAS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MARACAS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (108/186) Buscando: MATA DE SÃO JOÃO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (109/186) Buscando: MIGUEL CALMON...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (110/186) Buscando: MONTE SANTO...
// VM1244:74     ⚠ Elemento "MONTE SANTO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MONTE SANTO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (111/186) Buscando: MORRO DO CHAPÉU...
// VM1244:74     ⚠ Elemento "MORRO DO CHAPÉU" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MORRO DO CHAPÉU" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (112/186) Buscando: MUCURI...
// VM1244:132       Página 1...
// VM1244:158    ✅ 9 expedientes coletados no total.
// VM1244:65 ⏳ (113/186) Buscando: MUNDO NOVO...
// VM1244:74     ⚠ Elemento "MUNDO NOVO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MUNDO NOVO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (114/186) Buscando: MURITIBA...
// VM1244:74     ⚠ Elemento "MURITIBA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "MURITIBA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (115/186) Buscando: MUTUÍPE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (116/186) Buscando: NAZARÉ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (117/186) Buscando: NOVA SOURE...
// VM1244:74     ⚠ Elemento "NOVA SOURE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "NOVA SOURE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (118/186) Buscando: NOVA VIÇOSA...
// VM1244:74     ⚠ Elemento "NOVA VIÇOSA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "NOVA VIÇOSA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (119/186) Buscando: OLINDINA...
// VM1244:74     ⚠ Elemento "OLINDINA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "OLINDINA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (120/186) Buscando: OLIVEIRA DOS BREJINHOS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (121/186) Buscando: PALMAS DE MONTE ALTO...
// VM1244:74     ⚠ Elemento "PALMAS DE MONTE ALTO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PALMAS DE MONTE ALTO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (122/186) Buscando: PARAMIRIM...
// VM1244:74     ⚠ Elemento "PARAMIRIM" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PARAMIRIM" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (123/186) Buscando: PARIPIRANGA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (124/186) Buscando: PAULO AFONSO...
// VM1244:74     ⚠ Elemento "PAULO AFONSO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PAULO AFONSO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (125/186) Buscando: Pendente de ciência pelo judiciário...
// VM1244:132       Página 1...
// VM1244:160    ⚠ Nenhum expediente encontrado.
// VM1244:65 ⏳ (126/186) Buscando: PIATÃ...
// VM1244:74     ⚠ Elemento "PIATÃ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PIATÃ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (127/186) Buscando: PILÃO ARCADO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (128/186) Buscando: PINDOBAÇÚ...
// VM1244:74     ⚠ Elemento "PINDOBAÇÚ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PINDOBAÇÚ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (129/186) Buscando: PIRITIBA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (130/186) Buscando: PLANALTO...
// VM1244:74     ⚠ Elemento "PLANALTO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: PLANALTO
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (131/186) Buscando: POÇÕES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (132/186) Buscando: POJUCA...
// VM1244:74     ⚠ Elemento "POJUCA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: POJUCA
// VM1244:132       Página 1...
// VM1244:158    ✅ 12 expedientes coletados no total.
// VM1244:65 ⏳ (133/186) Buscando: PORTO SEGURO...
// VM1244:74     ⚠ Elemento "PORTO SEGURO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PORTO SEGURO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (134/186) Buscando: PRADO...
// VM1244:74     ⚠ Elemento "PRADO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "PRADO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (135/186) Buscando: PRESIDENTE JÂNIO QUADROS...
// VM1244:74     ⚠ Elemento "PRESIDENTE JÂNIO QUADROS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: PRESIDENTE JÂNIO QUADROS
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:65 ⏳ (136/186) Buscando: QUEIMADAS...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (137/186) Buscando: REMANSO...
// VM1244:74     ⚠ Elemento "REMANSO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "REMANSO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (138/186) Buscando: RETIROLÂNDIA...
// VM1244:74     ⚠ Elemento "RETIROLÂNDIA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "RETIROLÂNDIA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (139/186) Buscando: RIACHÃO DO JACUÍPE...
// VM1244:74     ⚠ Elemento "RIACHÃO DO JACUÍPE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "RIACHÃO DO JACUÍPE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (140/186) Buscando: RIACHO DE SANTANA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (141/186) Buscando: RIBEIRA DO POMBAL...
// VM1244:74     ⚠ Elemento "RIBEIRA DO POMBAL" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "RIBEIRA DO POMBAL" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (142/186) Buscando: RIO REAL...
// VM1244:74     ⚠ Elemento "RIO REAL" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "RIO REAL" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (143/186) Buscando: RUY BARBOSA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (144/186) Buscando: SALVADOR - REGIÃO METROPOLITANA...
// VM1244:132       Página 1...
// VM1244:132       Página 2...
// VM1244:158    ✅ 41 expedientes coletados no total.
// VM1244:65 ⏳ (145/186) Buscando: SANTA BÁRBARA...
// VM1244:74     ⚠ Elemento "SANTA BÁRBARA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTA BÁRBARA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (146/186) Buscando: SANTA CRUZ CABRÁLIA...
// VM1244:74     ⚠ Elemento "SANTA CRUZ CABRÁLIA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTA CRUZ CABRÁLIA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (147/186) Buscando: SANTA INÊS...
// VM1244:74     ⚠ Elemento "SANTA INÊS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: SANTA INÊS
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (148/186) Buscando: SANTA MARIA DA VITÓRIA...
// VM1244:74     ⚠ Elemento "SANTA MARIA DA VITÓRIA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTA MARIA DA VITÓRIA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (149/186) Buscando: SANTA RITA DE CÁSSIA...
// VM1244:74     ⚠ Elemento "SANTA RITA DE CÁSSIA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTA RITA DE CÁSSIA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (150/186) Buscando: SANTA TERESINHA...
// VM1244:74     ⚠ Elemento "SANTA TERESINHA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTA TERESINHA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (151/186) Buscando: SANTALUZ...
// VM1244:74     ⚠ Elemento "SANTALUZ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: SANTALUZ
// VM1244:132       Página 1...
// VM1244:158    ✅ 14 expedientes coletados no total.
// VM1244:65 ⏳ (152/186) Buscando: SANTANA...
// VM1244:74     ⚠ Elemento "SANTANA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTANA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (153/186) Buscando: SANTO AMARO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 9 expedientes coletados no total.
// VM1244:65 ⏳ (154/186) Buscando: SANTO ANTÔNIO DE JESUS...
// VM1244:74     ⚠ Elemento "SANTO ANTÔNIO DE JESUS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTO ANTÔNIO DE JESUS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (155/186) Buscando: SANTO ESTEVÃO...
// VM1244:74     ⚠ Elemento "SANTO ESTEVÃO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SANTO ESTEVÃO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (156/186) Buscando: SÃO DESIDÉRIO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 6 expedientes coletados no total.
// VM1244:65 ⏳ (157/186) Buscando: SÃO FELIPE...
// VM1244:74     ⚠ Elemento "SÃO FELIPE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SÃO FELIPE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (158/186) Buscando: SÃO FRANCISCO DO CONDE...
// VM1244:74     ⚠ Elemento "SÃO FRANCISCO DO CONDE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SÃO FRANCISCO DO CONDE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (159/186) Buscando: SÃO GONÇALO DOS CAMPOS...
// VM1244:74     ⚠ Elemento "SÃO GONÇALO DOS CAMPOS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SÃO GONÇALO DOS CAMPOS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (160/186) Buscando: SÃO SEBASTIÃO DO PASSÉ...
// VM1244:74     ⚠ Elemento "SÃO SEBASTIÃO DO PASSÉ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SÃO SEBASTIÃO DO PASSÉ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (161/186) Buscando: SAÚDE...
// VM1244:74     ⚠ Elemento "SAÚDE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SAÚDE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (162/186) Buscando: SEABRA...
// VM1244:74     ⚠ Elemento "SEABRA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:105    ✅ Recuperado com sucesso! Encontrado: SEABRA
// VM1244:132       Página 1...
// VM1244:158    ✅ 6 expedientes coletados no total.
// VM1244:65 ⏳ (163/186) Buscando: SENHOR DO BONFIM...
// VM1244:74     ⚠ Elemento "SENHOR DO BONFIM" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SENHOR DO BONFIM" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (164/186) Buscando: SENTO SÉ...
// VM1244:74     ⚠ Elemento "SENTO SÉ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SENTO SÉ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (165/186) Buscando: SERRA DOURADA...
// VM1244:74     ⚠ Elemento "SERRA DOURADA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SERRA DOURADA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (166/186) Buscando: SERRINHA...
// VM1244:74     ⚠ Elemento "SERRINHA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SERRINHA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (167/186) Buscando: SIMÕES FILHO...
// VM1244:74     ⚠ Elemento "SIMÕES FILHO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SIMÕES FILHO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (168/186) Buscando: SOBRADINHO...
// VM1244:74     ⚠ Elemento "SOBRADINHO" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "SOBRADINHO" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (169/186) Buscando: TANHAÇU...
// VM1244:74     ⚠ Elemento "TANHAÇU" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "TANHAÇU" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (170/186) Buscando: TAPEROÁ...
// VM1244:74     ⚠ Elemento "TAPEROÁ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "TAPEROÁ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (171/186) Buscando: TEIXEIRA DE FREITAS...
// VM1244:74     ⚠ Elemento "TEIXEIRA DE FREITAS" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "TEIXEIRA DE FREITAS" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (172/186) Buscando: TEOFILÂNDIA...
// VM1244:74     ⚠ Elemento "TEOFILÂNDIA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "TEOFILÂNDIA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (173/186) Buscando: TERRA NOVA...
// VM1244:74     ⚠ Elemento "TERRA NOVA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "TERRA NOVA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (174/186) Buscando: Tremedal...
// VM1244:74     ⚠ Elemento "Tremedal" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "Tremedal" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (175/186) Buscando: TUCANO...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (176/186) Buscando: UAUÁ...
// VM1244:132       Página 1...
// VM1244:158    ✅ 3 expedientes coletados no total.
// VM1244:65 ⏳ (177/186) Buscando: UBAÍRA...
// VM1244:74     ⚠ Elemento "UBAÍRA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "UBAÍRA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (178/186) Buscando: UBAITABA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 14 expedientes coletados no total.
// VM1244:65 ⏳ (179/186) Buscando: UBATÃ...
// VM1244:74     ⚠ Elemento "UBATÃ" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "UBATÃ" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (180/186) Buscando: UNA...
// VM1244:74     ⚠ Elemento "UNA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "UNA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (181/186) Buscando: URUÇUCA...
// VM1244:74     ⚠ Elemento "URUÇUCA" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "URUÇUCA" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (182/186) Buscando: VALENÇA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (183/186) Buscando: VALENTE...
// VM1244:74     ⚠ Elemento "VALENTE" não visível. Tentando expandir menus (Recuperação de Falha PJe)...
// (anônimo) @ VM1244:74
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:111     ⚠ Não foi possível encontrar o link para "VALENTE" nesta iteração.
// (anônimo) @ VM1244:111
// await in (anônimo)
// (anônimo) @ VM1244:239
// VM1244:65 ⏳ (184/186) Buscando: VITÓRIA DA CONQUISTA...
// VM1244:132       Página 1...
// VM1244:158    ✅ 4 expedientes coletados no total.
// VM1244:65 ⏳ (185/186) Buscando: WENCESLAU GUIMARÃES...
// VM1244:132       Página 1...
// VM1244:158    ✅ 2 expedientes coletados no total.
// VM1244:65 ⏳ (186/186) Buscando: XIQUE-XIQUE...
// VM1244:132       Página 1...
// VM1244:158    ✅ 1 expedientes coletados no total.
// VM1244:195 💾 Gerando arquivo único...
// VM1244:215  ✅ Documento único gerado com sucesso!
// VM1244:238 
//  🏁 Processo finalizado. Verifique seus downloads.

// ## SCRIPT PJE 1º GRAU -


// Permite parar o script a qualquer momento digitando window.PJE_PARAR = true no console
window.PJE_PARAR = false;
(async function () {
    console.clear();
    console.log("%c 🚀 Iniciando Extrator PJe - Versão JS Corrigida (Seletor SPAN, Paginação e Word)", "background: #000; color: #00ff00; font-size: 14px; padding: 5px;");

    // --- CONFIGURAÇÕES ---
    const TEMPO_ESPERA_CARREGAMENTO = 4000;
    const TEMPO_ESPERA_PAGINACAO = 1000;

    // --- FUNÇÕES AUXILIARES ---
    const esperar = (ms) => new Promise(res => setTimeout(res, ms));

    const limparTexto = (texto) => {
        if (!texto) return "";
        return texto.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    };

    // --- 1. IDENTIFICAÇÃO DAS CIDADES ---
    let nosIniciais = Array.from(document.querySelectorAll("span.nomeTarefa"));
    // Case-insensitive filtering to avoid including menu nodes like 'Cujo prazo findou...'
    const blacklist = ["CAIXA DE ENTRADA","PENDENTES","EXPEDIENTES","ACERVO","MINHAS PETIÇÕES","CIÊNCIA","PRAZO","RESPONDIDOS","APENAS","SEM PRAZO"];
    let listaAlvos = nosIniciais.filter(el => {
        const nomeRaw = el.innerText || '';
        const nome = nomeRaw.trim();
        if (!nome) return false;
        const upper = nome.toUpperCase();
        if (upper.match(/^\d+$/)) return false;
        for (const b of blacklist) if (upper.includes(b)) {
            // debug: log suspicious nodes (e.g., 'prazo' category) to help diagnose
            if (b === 'PRAZO' || b === 'PENDENTES') console.log(`   ⚠ Pulando nó de menu: "${nome}" (motivo: contém "${b}")`);
            return false;
        }
        return true;
    }).map(el => el.innerText.trim());
    listaAlvos = [...new Set(listaAlvos)];
    listaAlvos.sort((a, b) => a.localeCompare(b));
    const totalEncontrado = listaAlvos.length;

    if (totalEncontrado === 0) {
        console.log("%c ❌ Nenhuma cidade/jurisdição encontrada.", "color: red; font-weight: bold;");
        return;
    }

    let inputUsuario = prompt(
        `Foram encontradas ${totalEncontrado} cidades/jurisdições.\n\nQuantas deseja processar?\n(Digite um número. Ex: 5)`
    );
    if (inputUsuario === null) return;
    let limite = parseInt(inputUsuario.trim());
    if (isNaN(limite) || limite <= 0) {
        console.log("%c ❌ Número inválido. Script cancelado.", "color: orange");
        return;
    }
    if (limite > totalEncontrado) limite = totalEncontrado;

    console.log(`%c ▶ Processando ${limite} cidades...`, "color: cyan; font-weight: bold;");
    let relatorioFinal = {};

    // --- 3. LOOP DE EXTRAÇÃO COM PAGINAÇÃO ---
    for (let i = 0; i < limite; i++) {
        if (window.PJE_PARAR) {
            console.log("%c ⏹ Execução interrompida pelo usuário. Gerando arquivo com dados coletados até agora...", "color: orange; font-weight: bold;");
            break;
        }
        let nomeCidadeAlvo = listaAlvos[i];
        console.log(`⏳ (${i + 1}/${limite}) Buscando: ${nomeCidadeAlvo}...`);
        try {
            // Busca/ativa a cidade com tentativas e recuperação mais robusta
            const tryExpandMenus = async () => {
                // Prioritize reopening the exact 'Pendentes' menu(s) to avoid selecting 'Sem prazo'
                const preferred = [
                    "Pendentes de ciência ou de resposta",
                    "Pendentes de ciência",
                    "Pendentes de resposta",
                    "Expedientes",
                    "Caixa de entrada"
                ];

                for (const menu of preferred) {
                    // try exact match first
                    let menuXpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${menu}"]`;
                    let menuNode = document.evaluate(menuXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                    // fallback to contains if exact not found
                    if (!menuNode) {
                        menuXpath = `//span[contains(@class, 'nomeTarefa') and contains(normalize-space(text()), "${menu}")]`;
                        menuNode = document.evaluate(menuXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    }

                    if (menuNode) {
                        const clickable = menuNode.closest('a') || menuNode;
                        try { clickable.scrollIntoView({ block: 'center', behavior: 'auto' }); } catch (e) {}
                        await esperar(250);
                        try { clickable.click(); } catch (e) {}
                        await esperar(900);

                        // if after clicking we can already find the city node, stop early
                        try {
                            const cityXpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${nomeCidadeAlvo}"]`;
                            const found = document.evaluate(cityXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            if (found) return;
                        } catch (e) { /* ignore */ }
                    }
                }
            };

            const activateCityWithRetries = async (cityName, attempts = 3) => {
                const xpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${cityName}"]`;
                for (let attempt = 1; attempt <= attempts; attempt++) {
                    if (attempt > 1) {
                        console.warn(`   ⚠ Tentativa ${attempt} para recuperar "${cityName}"...`);
                        await tryExpandMenus();
                    }

                    let res = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    let node = res.singleNodeValue;
                    if (!node) {
                        // breve espera e retry
                        await esperar(500);
                        res = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                        node = res.singleNodeValue;
                    }
                    if (!node) continue;

                    // preferir clicar no link pai se existir
                    const clickable = node.closest('a') || node;
                    try {
                        clickable.scrollIntoView({ block: 'center', behavior: 'auto' });
                    } catch (e) {}
                    await esperar(300);

                    try {
                        clickable.click();
                        clickable.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
                    } catch (e) {
                        console.warn('   ⚠ Falha ao dispatchar clique:', e && e.message);
                    }

                    // aguarda carregamento e verifica se conteudo esperado apareceu
                    await esperar(TEMPO_ESPERA_CARREGAMENTO);
                    const tabela = document.querySelector("table[id$='tbExpedientes']");
                    if (tabela && tabela.querySelectorAll('tbody > tr').length > 0) {
                        return true;
                    }

                    // se não encontrou dados, talvez a árvore tenha sido resetada; vamos tentar reabrir menus e refazer
                    await esperar(300);
                }
                return false;
            };

            const ativado = await activateCityWithRetries(nomeCidadeAlvo, 3);
            if (!ativado) {
                console.warn(`   ⚠ Não foi possível ativar/abrir "${nomeCidadeAlvo}" após tentativas.`);
                continue;
            }

            let processosDaCidade = [];
            let paginaAtual = 1;

            // Helper: find pager element related to the table
            const findPagerForTable = (tableEl) => {
              // 1) ancestor with pager
              let el = tableEl;
              while (el && el !== document.body) {
                if (el.querySelector && el.querySelector('.rich-datascr-button')) return el;
                el = el.parentElement;
              }
              // 2) look for nearby .rich-datascr elements (siblings)
              const near = document.querySelectorAll('.rich-datascr');
              for (const n of near) {
                if (n.contains(tableEl) || tableEl.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING) return n;
              }
              return null;
            };

            const waitForTableChange = async (tableSel, prevSnapshot, timeout = 8000) => {
              const start = Date.now();
              while (Date.now() - start < timeout) {
                await esperar(300);
                const rows = Array.from(document.querySelectorAll(tableSel + ' > tbody > tr'));
                // compare length and first row content (robust against reorders)
                const firstText = rows[0] ? rows[0].innerText.trim() : '';
                if (rows.length !== prevSnapshot.count || firstText !== prevSnapshot.first) return { rows, firstText };
              }
              return null;
            };

            // pagination loop with robust next-button detection and waits
            const tableSelector = "table[id$='tbExpedientes']";
            const tableEl = document.querySelector(tableSelector);
            const pager = tableEl ? findPagerForTable(tableEl) : null;

            let guardPages = 0;
            const MAX_PAGES = 400;
            const seenPageFirsts = new Set();

            while (true) {
                if (window.PJE_PARAR) {
                    console.log("%c ⏹ Execução interrompida pelo usuário durante a paginação. Gerando arquivo...", "color: orange; font-weight: bold;");
                    break;
                }

                console.log(`      Página ${paginaAtual}...`);

                let linhasTabela = document.querySelectorAll(tableSelector + " > tbody > tr");
                if (linhasTabela.length > 0) {
                    linhasTabela.forEach(linha => {
                        let celulas = linha.querySelectorAll("td");
                        if (celulas.length >= 3) {
                            let colDetalhes = celulas[1].innerText;
                            let colProcesso = celulas[2].innerText;
                            let textoCompleto = limparTexto(colDetalhes + "\n" + colProcesso);
                            if (!processosDaCidade.includes(textoCompleto)) {
                                processosDaCidade.push(textoCompleto);
                            }
                        }
                    });
                }

                // track first row snapshot to detect repeats
                const firstRowText = (linhasTabela[0] && linhasTabela[0].innerText) ? linhasTabela[0].innerText.trim() : '';
                if (firstRowText) {
                    if (seenPageFirsts.has(firstRowText)) {
                        console.warn(`   ⚠ Página detectada repetida (primeira linha "${firstRowText}"). Encerrando paginação.`);
                        break;
                    }
                    seenPageFirsts.add(firstRowText);
                }

                // detect next button within pager (prefer specific selectors, fallback to heuristics)
                const isElementVisible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
                const isElementDisabled = (el) => {
                    if (!el) return true;
                    if (el.classList && el.classList.contains('rich-datascr-inact')) return true;
                    if (el.getAttribute && el.getAttribute('aria-disabled') === 'true') return true;
                    if (el.hasAttribute && el.hasAttribute('disabled')) return true;
                    const style = (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden'));
                    if (style) return true;
                    return false;
                };

                const findNextButton = (pagerEl) => {
                    const candidates = [];
                    if (pagerEl) candidates.push(...Array.from(pagerEl.querySelectorAll('.rich-datascr-button, button, a')));
                    // global fallback load nearby controls
                    if (candidates.length === 0) candidates.push(...Array.from(document.querySelectorAll('.rich-datascr-button, .rich-paginator button, .rich-paginator a')));

                    // prefer buttons that explicitly indicate next
                    const preferred = candidates.find(b => {
                        const onclick = (b.getAttribute && (b.getAttribute('onclick') || '') || '').toLowerCase();
                        const title = (b.getAttribute && (b.getAttribute('title') || '') || '').toLowerCase();
                        const txt = (b.innerText || '').trim();
                        if (onclick.includes('fastforward') || onclick.includes('next') || onclick.includes('pagina') || onclick.includes('avancar')) return true;
                        if (title.includes('próxima') || title.includes('proxima') || title.includes('próxima')) return true;
                        if (['»','>>','›','>','>','Próxima','Próximo'].includes(txt)) return true;
                        return false;
                    });
                    if (preferred && isElementVisible(preferred)) return preferred;

                    // otherwise, first visible non-disabled candidate
                    const visible = candidates.find(c => isElementVisible(c) && !isElementDisabled(c));
                    if (visible) return visible;

                    return null;
                };

                let botaoAvancar = findNextButton(pager);

                // Check active state and try to click with retries and fallbacks (including page-number navigation)
                if (botaoAvancar && !isElementDisabled(botaoAvancar)) {
                    // Attempt multiple times to advance pages, re-querying the button each attempt
                    const prevRows = Array.from(document.querySelectorAll(tableSelector + ' > tbody > tr'));
                    const prevSnapshot = { count: prevRows.length, first: prevRows[0] ? prevRows[0].innerText.trim() : '' };

                    let advanced = false;
                    for (let attemptClick = 1; attemptClick <= 4; attemptClick++) {
                        try {
                            botaoAvancar.click();
                        } catch (e) {
                            // sometimes the element is detached; try to re-find and click
                            await esperar(200);
                            botaoAvancar = findNextButton(pager);
                            if (botaoAvancar) try { botaoAvancar.click(); } catch(_){}
                        }

                        const changed = await waitForTableChange(tableSelector, prevSnapshot, Math.max(3000, TEMPO_ESPERA_PAGINACAO + attemptClick * 300));
                        if (changed) { advanced = true; break; }

                        // small wait and re-evaluate candidates (page might update its DOM)
                        await esperar(700 + attemptClick * 300);
                        const currRows = Array.from(document.querySelectorAll(tableSelector + ' > tbody > tr'));
                        const currFirst = currRows[0] ? currRows[0].innerText.trim() : '';
                        if (currFirst !== prevSnapshot.first || currRows.length !== prevSnapshot.count) { advanced = true; break; }

                        // re-find next button in case a new DOM node replaced it
                        botaoAvancar = findNextButton(pager);
                        if (!botaoAvancar) break;
                    }

                    if (!advanced) {
                        // Fallback: try to navigate via page-number links (if any)
                        let pageNums = [];
                        if (pager) pageNums = Array.from(pager.querySelectorAll('a, span')).filter(e => (/^\d+$/.test((e.innerText||'').trim())));
                        if (pageNums.length > 0) {
                            let currIdx = pageNums.findIndex(e => e.classList.contains('rich-datascr-current') || e.classList.contains('rich-datascr-active') || e.tagName === 'SPAN');
                            if (currIdx === -1) currIdx = pageNums.findIndex(e => e.innerText && e.innerText.trim() === String(paginaAtual));
                            if (currIdx >= 0 && currIdx < pageNums.length - 1) {
                                const nextPageEl = pageNums[currIdx + 1];
                                try { nextPageEl.click(); } catch(_) { try { nextPageEl.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){} }
                                const changed2 = await waitForTableChange(tableSelector, prevSnapshot, 4000);
                                if (changed2) advanced = true;
                            }
                        }
                    }

                    if (!advanced) {
                        console.warn('   ⚠ Não foi possível avançar a paginação após tentativas. Encerrando paginação para esta cidade.');
                        break;
                    }

                    paginaAtual++;
                    guardPages++;
                    if (guardPages > MAX_PAGES) {
                      console.warn('%c ⚠ Parei paginação: atingido limite máximo de páginas.', 'color: orange');
                      break;
                    }

                } else {
                    // no next button found or it's disabled
                    break;
                }
            }
            if (processosDaCidade.length > 0) {
                relatorioFinal[nomeCidadeAlvo] = processosDaCidade;
                console.log(`   ✅ ${processosDaCidade.length} expedientes coletados no total.`);
            } else {
                console.log(`   ⚠ Nenhum expediente encontrado.`);
            }
        } catch (erro) {
            console.error(`❌ Erro em ${nomeCidadeAlvo}:`, erro);
        }
    }

    // --- Pergunta sobre juntar ou separar ---
    let escolha = prompt("Deseja juntar todas as cidades em um único arquivo Word?\nDigite:\n1 - Sim, juntar tudo\n2 - Não, gerar separados");
    if (escolha === null) return;
    escolha = parseInt(escolha.trim());

    const gerarDocumentoWord = (nomeCidade, processos) => {
        const contagemProcessos = processos.length;
        const tituloFormatado = `${nomeCidade} (${contagemProcessos})`;
        let conteudoHTML = `
            <h1 style="font-size:14pt;font-weight:bold;text-transform:uppercase;color:#000;margin-top:20px;margin-bottom:10px;background-color:#f0f0f0;padding:5px;">
                ${tituloFormatado}
            </h1>
        `;
        processos.forEach(textoProcesso => {
            let htmlProcesso = textoProcesso.replace(/\n/g, "<br>");
            conteudoHTML += `<div style="margin-bottom:25px;border-bottom:1px solid #ddd;padding-bottom:10px;"><p>${htmlProcesso}</p></div>`;
        });
        return conteudoHTML;
    };

    if (Object.keys(relatorioFinal).length === 0) {
        console.log("Nenhum dado coletado para gerar o arquivo.");
        alert("Processo finalizado, mas nenhum dado foi coletado.");
        return;
    }

    if (escolha === 1) {
        // Juntar tudo em um único arquivo
        console.log("💾 Gerando arquivo único...");
        let conteudoHTML = `
            <html><head><meta charset='utf-8'><title>Relatório PJe Unificado</title>
            <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.2;}</style></head><body>
        `;
        Object.keys(relatorioFinal).forEach((nomeCidade, idx) => {
            let quebraPagina = idx > 0 ? `<div style=\"page-break-before: always;\"></div>` : '';
            conteudoHTML += quebraPagina;
            conteudoHTML += gerarDocumentoWord(nomeCidade, relatorioFinal[nomeCidade]);
        });
        conteudoHTML += "</body></html>";
        const blob = new Blob(['\ufeff', conteudoHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        link.download = `Relatorio_PJE_${dataHoje}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("%c ✅ Documento único gerado com sucesso!", "color: #4CAF50; font-weight: bold;");
    } else {
        // Gerar separados
        console.log("💾 Gerando arquivos separados...");
        Object.keys(relatorioFinal).forEach(nomeCidade => {
            let conteudoHTML = `
                <html><head><meta charset='utf-8'><title>Relatório PJe ${nomeCidade}</title>
                <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.2;}</style></head><body>
            `;
            conteudoHTML += gerarDocumentoWord(nomeCidade, relatorioFinal[nomeCidade]);
            conteudoHTML += "</body></html>";
            const blob = new Blob(['\ufeff', conteudoHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Relatorio_PJE_${nomeCidade.replace(/\s+/g, "_")}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log(`✅ Documento ${nomeCidade} gerado com sucesso.`);
        });
    }

    console.log("\n%c 🏁 Processo finalizado. Verifique seus downloads.", "background: green; color: white; font-size: 16px; padding: 5px;");
})();


