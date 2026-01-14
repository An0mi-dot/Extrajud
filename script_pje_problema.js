// O script do PJE ta com um erro:
// Existe uma cidade (Acho que cruz das almas, mas nao acho que tenha algo a ver com uma cidade em especifico) que ao clique, ela registra algo como se a cidade não existisse ou algo assim, da um erro...
// Isso leva a pagina pro inicio dela e desseleciona a aba das ciadades e o script de vez lé as outras cidades, mas como não ta selecionado na aba Pendentes de ciencias ou de resposta, ele nao acha nada.
// Consegue resolver?

// Log do erro abaixo:

// 🚀 Iniciando Extrator PJe - Versão JS Corrigida (Seletor SPAN, Paginação e Word)
// VM162806:56  ▶ Processando 187 cidades...
// VM162806:66 ⏳ (1/187) Buscando: ALAGOINHAS...
// Promise {<pending>}
// 97[Violation]'readystatechange' handler demorou <N>ms
// 99[Violation]'setTimeout' handler demorou <N>ms
// VM162806:94       Página 1...
// VM162806:120    ✅ 5 expedientes coletados no total.
// VM162806:66 ⏳ (2/187) Buscando: AMARGOSA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 20 expedientes coletados no total.
// VM162806:66 ⏳ (3/187) Buscando: AMÉLIA RODRIGUES...
// VM162806:94       Página 1...
// VM162806:120    ✅ 1 expedientes coletados no total.
// VM162806:66 ⏳ (4/187) Buscando: ANAGÉ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 1 expedientes coletados no total.
// VM162806:66 ⏳ (5/187) Buscando: ANDARAÍ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 7 expedientes coletados no total.
// VM162806:66 ⏳ (6/187) Buscando: ANTAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (7/187) Buscando: ARACI...
// VM162806:94       Página 1...
// VM162806:120    ✅ 5 expedientes coletados no total.
// VM162806:66 ⏳ (8/187) Buscando: BAIANÓPOLIS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (9/187) Buscando: BARRA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 1 expedientes coletados no total.
// VM162806:66 ⏳ (10/187) Buscando: BARRA DA ESTIVA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (11/187) Buscando: BARRA DO MENDES...
// VM162806:94       Página 1...
// VM162806:120    ✅ 36 expedientes coletados no total.
// VM162806:66 ⏳ (12/187) Buscando: BARREIRAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 30 expedientes coletados no total.
// VM162806:66 ⏳ (13/187) Buscando: BELMONTE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 7 expedientes coletados no total.
// VM162806:66 ⏳ (14/187) Buscando: BOM JESUS DA LAPA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (15/187) Buscando: BRUMADO...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (16/187) Buscando: BUERAREMA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (17/187) Buscando: CACHOEIRA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 6 expedientes coletados no total.
// VM162806:66 ⏳ (18/187) Buscando: CACULÉ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 21 expedientes coletados no total.
// VM162806:66 ⏳ (19/187) Buscando: CAETITÉ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (20/187) Buscando: CAMACAN...
// VM162806:94       Página 1...
// VM162806:120    ✅ 37 expedientes coletados no total.
// VM162806:66 ⏳ (21/187) Buscando: CAMAÇARI...
// VM162806:94       Página 1...
// VM162806:120    ✅ 25 expedientes coletados no total.
// VM162806:66 ⏳ (22/187) Buscando: CAMAMU...
// VM162806:94       Página 1...
// VM162806:120    ✅ 5 expedientes coletados no total.
// VM162806:66 ⏳ (23/187) Buscando: CAMPO FORMOSO...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (24/187) Buscando: CANARANA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 15 expedientes coletados no total.
// VM162806:66 ⏳ (25/187) Buscando: CANAVIEIRAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 15 expedientes coletados no total.
// VM162806:66 ⏳ (26/187) Buscando: CANDEIAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 28 expedientes coletados no total.
// VM162806:66 ⏳ (27/187) Buscando: CANSANÇÃO...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (28/187) Buscando: CAPELA DO ALTO ALEGRE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 8 expedientes coletados no total.
// VM162806:66 ⏳ (29/187) Buscando: CAPIM GROSSO...
// VM162806:94       Página 1...
// VM162806:120    ✅ 39 expedientes coletados no total.
// VM162806:66 ⏳ (30/187) Buscando: CARAVELAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 4 expedientes coletados no total.
// VM162806:66 ⏳ (31/187) Buscando: CARINHANHA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 15 expedientes coletados no total.
// VM162806:66 ⏳ (32/187) Buscando: CASA NOVA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 10 expedientes coletados no total.
// VM162806:66 ⏳ (33/187) Buscando: CASTRO ALVES...
// VM162806:94       Página 1...
// VM162806:120    ✅ 6 expedientes coletados no total.
// VM162806:66 ⏳ (34/187) Buscando: CATU...
// VM162806:94       Página 1...
// VM162806:120    ✅ 10 expedientes coletados no total.
// VM162806:66 ⏳ (35/187) Buscando: CENTRAL...
// VM162806:94       Página 1...
// VM162806:120    ✅ 8 expedientes coletados no total.
// VM162806:66 ⏳ (36/187) Buscando: CHORROCHÓ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (37/187) Buscando: CÍCERO DANTAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (38/187) Buscando: CIPÓ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 31 expedientes coletados no total.
// VM162806:66 ⏳ (39/187) Buscando: COARACI...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (40/187) Buscando: CONCEIÇÃO DO ALMEIDA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 1 expedientes coletados no total.
// VM162806:66 ⏳ (41/187) Buscando: CONCEIÇÃO DO COITÉ...
// VM162806:94       Página 1...
// VM162806:120    ✅ 4 expedientes coletados no total.
// VM162806:66 ⏳ (42/187) Buscando: CONCEIÇÃO DO JACUÍPE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 14 expedientes coletados no total.
// VM162806:66 ⏳ (43/187) Buscando: CONDE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 4 expedientes coletados no total.
// VM162806:66 ⏳ (44/187) Buscando: CONDEÚBA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 4 expedientes coletados no total.
// VM162806:66 ⏳ (45/187) Buscando: CORAÇÃO DE MARIA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 2 expedientes coletados no total.
// VM162806:66 ⏳ (46/187) Buscando: CORIBE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 3 expedientes coletados no total.
// VM162806:66 ⏳ (47/187) Buscando: CORRENTINA...
// VM162806:94       Página 1...
// VM162806:120    ✅ 1 expedientes coletados no total.
// VM162806:66 ⏳ (48/187) Buscando: COTEGIPE...
// VM162806:94       Página 1...
// VM162806:120    ✅ 4 expedientes coletados no total.
// VM162806:66 ⏳ (49/187) Buscando: CRUZ DAS ALMAS...
// VM162806:94       Página 1...
// VM162806:120    ✅ 14 expedientes coletados no total.
// VM162806:66 ⏳ (50/187) Buscando: Cujo prazo findou nos últimos 10 dias - sem resposta...
// VM162806:94       Página 1...
// VM162806:122    ⚠ Nenhum expediente encontrado.
// VM162806:66 ⏳ (51/187) Buscando: CURAÇA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "CURAÇA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (52/187) Buscando: DIAS D'AVILA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "DIAS D'AVILA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (53/187) Buscando: ENTRE RIOS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ENTRE RIOS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (54/187) Buscando: ESPLANADA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ESPLANADA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (55/187) Buscando: EUCLIDES DA CUNHA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "EUCLIDES DA CUNHA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (56/187) Buscando: EUNAPOLIS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "EUNAPOLIS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (57/187) Buscando: FEIRA DE SANTANA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "FEIRA DE SANTANA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (58/187) Buscando: FORMOSA DO RIO PRETO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "FORMOSA DO RIO PRETO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (59/187) Buscando: GANDU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "GANDU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (60/187) Buscando: GOVERNADOR MANGABEIRA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "GOVERNADOR MANGABEIRA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (61/187) Buscando: GUANAMBI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "GUANAMBI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (62/187) Buscando: GUARATINGA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "GUARATINGA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (63/187) Buscando: IAÇU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IAÇU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (64/187) Buscando: IBIRAPUÃ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IBIRAPUÃ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (65/187) Buscando: IBIRATAIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IBIRATAIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (66/187) Buscando: IBOTIRAMA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IBOTIRAMA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (67/187) Buscando: IGAPORÃ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IGAPORÃ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (68/187) Buscando: IGUAI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IGUAI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (69/187) Buscando: ILHÉUS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ILHÉUS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (70/187) Buscando: INHAMBUPE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "INHAMBUPE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (71/187) Buscando: INTIMAÇÕES...
// VM162806:73     ⚠ Não foi possível encontrar o link para "INTIMAÇÕES" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (72/187) Buscando: IPIAU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IPIAU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (73/187) Buscando: IPIRÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IPIRÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (74/187) Buscando: IRARÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IRARÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (75/187) Buscando: IRECÊ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "IRECÊ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (76/187) Buscando: ITABELA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITABELA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (77/187) Buscando: ITABERABA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITABERABA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (78/187) Buscando: ITABUNA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITABUNA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (79/187) Buscando: ITACARÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITACARÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (80/187) Buscando: ITAGIBÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAGIBÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (81/187) Buscando: ITAJUÍPE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAJUÍPE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (82/187) Buscando: ITAMBÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAMBÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (83/187) Buscando: ITANHÉM...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITANHÉM" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (84/187) Buscando: ITAPARICA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAPARICA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (85/187) Buscando: ITAPETINGA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAPETINGA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (86/187) Buscando: ITAPICURU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITAPICURU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (87/187) Buscando: ITARANTIM...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITARANTIM" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (88/187) Buscando: ITORORÓ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITORORÓ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (89/187) Buscando: ITUAÇU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITUAÇU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (90/187) Buscando: ITUBERÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "ITUBERÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (91/187) Buscando: JACARACI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JACARACI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (92/187) Buscando: JACOBINA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JACOBINA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (93/187) Buscando: JAGUAQUARA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JAGUAQUARA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (94/187) Buscando: JAGUARARI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JAGUARARI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (95/187) Buscando: JEQUIÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JEQUIÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (96/187) Buscando: JEREMOABO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JEREMOABO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (97/187) Buscando: JITAÚNA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JITAÚNA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (98/187) Buscando: JOÃO DOURADO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JOÃO DOURADO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (99/187) Buscando: JUAZEIRO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "JUAZEIRO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (100/187) Buscando: LAJE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LAJE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (101/187) Buscando: LAPÃO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LAPÃO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (102/187) Buscando: LAURO DE FREITAS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LAURO DE FREITAS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (103/187) Buscando: LENÇÓIS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LENÇÓIS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (104/187) Buscando: LIVRAMENTO DE NOSSA SENHORA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LIVRAMENTO DE NOSSA SENHORA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (105/187) Buscando: LUÍS EDUARDO MAGALHÃES...
// VM162806:73     ⚠ Não foi possível encontrar o link para "LUÍS EDUARDO MAGALHÃES" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (106/187) Buscando: MACARANI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MACARANI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (107/187) Buscando: MACAÚBAS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MACAÚBAS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (108/187) Buscando: MAIRI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MAIRI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (109/187) Buscando: MARACAS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MARACAS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (110/187) Buscando: MATA DE SÃO JOÃO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MATA DE SÃO JOÃO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (111/187) Buscando: MIGUEL CALMON...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MIGUEL CALMON" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (112/187) Buscando: MONTE SANTO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MONTE SANTO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (113/187) Buscando: MORRO DO CHAPÉU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MORRO DO CHAPÉU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (114/187) Buscando: MUCURI...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MUCURI" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (115/187) Buscando: MUNDO NOVO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MUNDO NOVO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (116/187) Buscando: MURITIBA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MURITIBA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (117/187) Buscando: MUTUÍPE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "MUTUÍPE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (118/187) Buscando: NAZARÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "NAZARÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (119/187) Buscando: NOVA SOURE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "NOVA SOURE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (120/187) Buscando: NOVA VIÇOSA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "NOVA VIÇOSA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (121/187) Buscando: OLINDINA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "OLINDINA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (122/187) Buscando: OLIVEIRA DOS BREJINHOS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "OLIVEIRA DOS BREJINHOS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (123/187) Buscando: PARAMIRIM...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PARAMIRIM" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (124/187) Buscando: PARIPIRANGA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PARIPIRANGA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (125/187) Buscando: PAULO AFONSO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PAULO AFONSO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (126/187) Buscando: Pendente de ciência pelo judiciário...
// VM162806:94       Página 1...
// VM162806:122    ⚠ Nenhum expediente encontrado.
// VM162806:66 ⏳ (127/187) Buscando: PIATÃ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PIATÃ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (128/187) Buscando: PILÃO ARCADO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PILÃO ARCADO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (129/187) Buscando: PINDOBAÇÚ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PINDOBAÇÚ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (130/187) Buscando: PIRITIBA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PIRITIBA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (131/187) Buscando: PLANALTO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PLANALTO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (132/187) Buscando: POÇÕES...
// VM162806:73     ⚠ Não foi possível encontrar o link para "POÇÕES" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (133/187) Buscando: POJUCA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "POJUCA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (134/187) Buscando: PORTO SEGURO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PORTO SEGURO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (135/187) Buscando: PRADO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PRADO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (136/187) Buscando: PRESIDENTE JÂNIO QUADROS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "PRESIDENTE JÂNIO QUADROS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (137/187) Buscando: QUEIMADAS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "QUEIMADAS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (138/187) Buscando: REMANSO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "REMANSO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (139/187) Buscando: RETIROLÂNDIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RETIROLÂNDIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (140/187) Buscando: RIACHÃO DO JACUÍPE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RIACHÃO DO JACUÍPE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (141/187) Buscando: RIACHO DE SANTANA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RIACHO DE SANTANA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (142/187) Buscando: RIBEIRA DO POMBAL...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RIBEIRA DO POMBAL" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (143/187) Buscando: RIO REAL...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RIO REAL" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (144/187) Buscando: RUY BARBOSA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "RUY BARBOSA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (145/187) Buscando: SALVADOR - REGIÃO METROPOLITANA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SALVADOR - REGIÃO METROPOLITANA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (146/187) Buscando: SANTA BÁRBARA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA BÁRBARA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (147/187) Buscando: SANTA CRUZ CABRÁLIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA CRUZ CABRÁLIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (148/187) Buscando: SANTA INÊS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA INÊS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (149/187) Buscando: SANTA MARIA DA VITÓRIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA MARIA DA VITÓRIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (150/187) Buscando: SANTA RITA DE CÁSSIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA RITA DE CÁSSIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (151/187) Buscando: SANTA TERESINHA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTA TERESINHA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (152/187) Buscando: SANTALUZ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTALUZ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (153/187) Buscando: SANTANA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTANA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (154/187) Buscando: SANTO AMARO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTO AMARO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (155/187) Buscando: SANTO ANTÔNIO DE JESUS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTO ANTÔNIO DE JESUS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (156/187) Buscando: SANTO ESTEVÃO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SANTO ESTEVÃO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (157/187) Buscando: SÃO DESIDÉRIO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SÃO DESIDÉRIO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (158/187) Buscando: SÃO FELIPE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SÃO FELIPE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (159/187) Buscando: SÃO FRANCISCO DO CONDE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SÃO FRANCISCO DO CONDE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (160/187) Buscando: SÃO GONÇALO DOS CAMPOS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SÃO GONÇALO DOS CAMPOS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (161/187) Buscando: SÃO SEBASTIÃO DO PASSÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SÃO SEBASTIÃO DO PASSÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (162/187) Buscando: SAÚDE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SAÚDE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (163/187) Buscando: SEABRA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SEABRA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (164/187) Buscando: SENHOR DO BONFIM...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SENHOR DO BONFIM" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (165/187) Buscando: SENTO SÉ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SENTO SÉ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (166/187) Buscando: SERRA DOURADA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SERRA DOURADA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (167/187) Buscando: SERRINHA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SERRINHA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (168/187) Buscando: SIMÕES FILHO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SIMÕES FILHO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (169/187) Buscando: SOBRADINHO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "SOBRADINHO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (170/187) Buscando: TANHAÇU...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TANHAÇU" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (171/187) Buscando: TAPEROÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TAPEROÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (172/187) Buscando: TEIXEIRA DE FREITAS...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TEIXEIRA DE FREITAS" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (173/187) Buscando: TEOFILÂNDIA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TEOFILÂNDIA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (174/187) Buscando: TERRA NOVA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TERRA NOVA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (175/187) Buscando: Tremedal...
// VM162806:73     ⚠ Não foi possível encontrar o link para "Tremedal" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (176/187) Buscando: TUCANO...
// VM162806:73     ⚠ Não foi possível encontrar o link para "TUCANO" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (177/187) Buscando: UAUÁ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "UAUÁ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (178/187) Buscando: UBAÍRA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "UBAÍRA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (179/187) Buscando: UBAITABA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "UBAITABA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (180/187) Buscando: UBATÃ...
// VM162806:73     ⚠ Não foi possível encontrar o link para "UBATÃ" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (181/187) Buscando: UNA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "UNA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (182/187) Buscando: URUÇUCA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "URUÇUCA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (183/187) Buscando: VALENÇA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "VALENÇA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (184/187) Buscando: VALENTE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "VALENTE" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (185/187) Buscando: VITÓRIA DA CONQUISTA...
// VM162806:73     ⚠ Não foi possível encontrar o link para "VITÓRIA DA CONQUISTA" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (186/187) Buscando: WENCESLAU GUIMARÃES...
// VM162806:73     ⚠ Não foi possível encontrar o link para "WENCESLAU GUIMARÃES" nesta iteração.
// (anônimo) @ VM162806:73
// await in (anônimo)
// (anônimo) @ VM162806:201
// VM162806:66 ⏳ (187/187) Buscando: XIQUE-XIQUE...
// VM162806:73     ⚠ Não foi possível encontrar o link para "XIQUE-XIQUE" nesta iteração.


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
    let listaAlvos = nosIniciais.filter(el => {
        const nome = el.innerText.trim();
        return nome &&
            !nome.includes("Caixa de entrada") &&
            !nome.includes("Pendentes") &&
            !nome.includes("Expedientes") &&
            !nome.includes("Acervo") &&
            !nome.includes("Minhas petições") &&
            !nome.includes("Ciência") &&
            !nome.includes("Prazo") &&
            !nome.includes("Respondidos") &&
            !nome.includes("Apenas") &&
            !nome.includes("Sem prazo") &&
            !nome.match(/^\d+$/);
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
            // Busca novamente o SPAN com o texto exato da cidade
            let xpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${nomeCidadeAlvo}"]`;
            let resultadoXPath = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            let cidadeElemento = resultadoXPath.singleNodeValue;
            
            // [FIX AUTOMÁTICO] TENTATIVA DE RECUPERAÇÃO DE ÁRVORE FECHADA
            if (!cidadeElemento) {
                console.warn(`   ⚠ Elemento "${nomeCidadeAlvo}" não visível. Tentando expandir menus (Recuperação de Falha PJe)...`);
                
                // Menus padrão do PJe que costumam agrupar as cidades
                const menusParaReabrir = [
                    "Expedientes", 
                    "Pendentes de ciência", 
                    "Pendentes de resposta", 
                    "Sem prazo", 
                    "Com prazo",
                    "Caixa de entrada"
                ];

                for (const menu of menusParaReabrir) {
                    // Tenta achar o menu
                    let menuXpath = `//span[contains(@class, 'nomeTarefa') and contains(text(), "${menu}")]`;
                    let menuNode = document.evaluate(menuXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    
                    if (menuNode) {
                        // Verifica se está visível
                        if (menuNode.offsetParent !== null) {
                            menuNode.click();
                            await esperar(1000); // 1s para o PJe expandir a árvore via AJAX
                        }
                    }
                }

                // Tenta buscar a cidade de novo após a tentativa de expansão
                resultadoXPath = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                cidadeElemento = resultadoXPath.singleNodeValue;
                
                if (cidadeElemento) {
                     console.log(`   ✅ Recuperado com sucesso! Encontrado: ${nomeCidadeAlvo}`);
                }
            }
            // [FIM FIX]

            if (!cidadeElemento) {
                console.warn(`   ⚠ Não foi possível encontrar o link para "${nomeCidadeAlvo}" nesta iteração.`);
                continue;
            }
            cidadeElemento.scrollIntoView({ block: "center", behavior: "auto" });
            await esperar(500);
            cidadeElemento.click();
            let eventoClick = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            cidadeElemento.dispatchEvent(eventoClick);
            await esperar(TEMPO_ESPERA_CARREGAMENTO);

            let processosDaCidade = [];
            let paginaAtual = 1;
            while (true) {
                if (window.PJE_PARAR) {
                    console.log("%c ⏹ Execução interrompida pelo usuário durante a paginação. Gerando arquivo...", "color: orange; font-weight: bold;");
                    break;
                }
                console.log(`      Página ${paginaAtual}...`);
                let linhasTabela = document.querySelectorAll("table[id$='tbExpedientes'] > tbody > tr");
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
                let botaoAvancar = document.querySelector(".rich-datascr-button[onclick*='fastforward']");
                if (botaoAvancar && !botaoAvancar.classList.contains('rich-datascr-inact')) {
                    botaoAvancar.click();
                    await esperar(TEMPO_ESPERA_PAGINACAO);
                    paginaAtual++;
                } else {
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
