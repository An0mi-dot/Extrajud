/**
 * Classe responsavel por armazenar os componentes do PJeOffice
 * 
 * Pablo Filetti Moreira - pablo.filetti@gmail.com
 */
var PJeOffice = {};

PJeOffice.stringify = function (value) {
	var _json_stringify = JSON.stringify;	
    var _array_tojson = Array.prototype.toJSON;
    delete Array.prototype.toJSON;
    var r=_json_stringify(value);
    Array.prototype.toJSON = _array_tojson;
    return r;
};

PJeOffice.executar = function(requisicao, onSucesso, onErro, onIndisponivel) {
	
	var t = requisicao.tarefa;
	
	requisicao.tarefa = PJeOffice.stringify(t);
	
	var r = PJeOffice.stringify(requisicao);
	r = encodeURIComponent(r);
	
	var image = new Image();
	image.onload = function() {
		// Quando o PJeOffice retornar uma imagem com 2px de largura e pq houve algum erro na execucao		
		if (this.width == 2) {
			onErro();
		}
		else {
			// Quando o PJeOffice retornar uma imagem com 1px de largura e pq houve sucesso na execucao
			onSucesso();
		}
	}
	image.onerror = onIndisponivel;
	image.src = "http://localhost:8800/pjeOffice/requisicao/?r=" + r + "&u=" + new Date().getTime();
}

PJeOffice.verificarDisponibilidade = function(onDisponivel, onIndisponivel) {	
	
	var image = new Image();
	
	image.onload = onDisponivel;
	image.onerror = onIndisponivel;	
	image.src = "http://localhost:8800/pjeOffice/?&u=" + new Date().getTime();
}

/**
 * Transforma a string "id=1581848&codIni=153335780&md5=92a9d63176ececbb35096529f3f5dc29&isBin=false"
 * em uma lista de objeto json { id: x, codIni: x, hash: x, isBin: x } 
 */
PJeOffice.parseToListaArquivos = function(docsFields) {
	
	var arquivos = [];
		
	var itens = docsFields.split(","); 

	for (var i=0; i < itens.length; i++) {
				
		var itemFields = itens[i].split("&");
		
		if (itemFields.length == 4) {		
			arquivos[i] = {
				"id"   		: itemFields[0].substr(itemFields[0].indexOf("=") + 1),
				"codIni" 	: itemFields[1].substr(itemFields[1].indexOf("=") + 1),
				"hash" 		: itemFields[2].substr(itemFields[2].indexOf("=") + 1),
				"isBin" 	: itemFields[3].substr(itemFields[3].indexOf("=") + 1)
			}
		}
		else {
			arquivos[i] = {
				"hash" 		: itemFields[0].substr(itemFields[0].indexOf("=") + 1)
			}
		}
	}
	
	return arquivos;
}

/**
 * Tanto o pjeOfficeAssinador tera o metodo assinar() como o signerApplet tera o metodo assinar unificando as formas de assinar  
 */
function PJeOfficeAssinador(id, buttonId, buttonOnClick, assinar) {
	
 	// Atributos
	this.id = id;
	this.buttonId = buttonId;
	this.buttonOnClick = buttonOnClick;

	// Metodos
	this.assinar = assinar;
	this.getButton = getButton;
	this.iniciar = iniciar;
	
	function getButton() {
		return $(this.buttonId);
	};

	function iniciar() {

		var THIS = this;
		var button = this.getButton();
		var onClick;

		if (this.buttonOnClick != '') {
			onClick = function () { 
				eval(THIS.buttonOnClick); 
			}; 
		}
		else {
			onClick = function () { 
				THIS.assinar(); 
			};
		}
		
		if (button.addEventListener) {
			button.addEventListener('click', onClick, true);
		}
		else {
			button.attachEvent("onclick", onClick);
	 	}
		
		PJe.add(this.id, this);
	};
	
	this.iniciar();
}