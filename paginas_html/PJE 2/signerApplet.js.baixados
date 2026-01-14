/**  
 * 	Classe responsavel para tratar as funcionalidades do SignerApplet
 *  
 *  Pablo Filetti Moreira - pablo.filetti@gmail.com
 */
function SignerApplet(id, buttonId, buttonCaption, buttonOnClick, testMode) {
	
 	// Atributos
	this.id = id;
	this.appletId = 'applet-' + id;
	this.buttonId = buttonId;
	this.buttonCaption = buttonCaption;
	this.buttonOnClick = buttonOnClick;
	this.testMode = testMode;

	// Metodos
	this.assinar = assinar;
	this.getApplet = getApplet;
	this.getButton = getButton;
	this.iniciar = iniciar;
	this.isCarregado = isCarregado;
	this.verificaCarregamento = verificaCarregamento;

	function assinar(e) {

		var applet = this.getApplet();

		if(!this.isCarregado()) {

			alert('Aguarde alguns instantes até o assinador ser carregado.');

			if (e) {
				e.preventDefault();
			}

			return false;
		}

		var code = 6;

		if(this.testMode) {
			code += 256;
		}
		if(applet){
			applet.setJsCode(code);
		} 

		if (e) {
			e.preventDefault();
		}
		
		return false;
	};
	
	function getApplet() {
		return $(this.appletId);
	};

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
		 
		button.setAttribute('disabled', 'disabled');
		
		if (button.addEventListener) {
			button.addEventListener('click', onClick, true);
		}
		else {
			button.attachEvent("onclick", onClick);
	 	}					
		
		this.intervalId = setInterval(function () {
			THIS.verificaCarregamento();						
		}, 200);
		
		PJe.add(this.id, this);
	};

	function isCarregado() {

		var applet = this.getApplet();

		if (applet == null || !applet.setJsCode) {
			return false;
		}
		else {
			return true;
		}
	};
					
	function verificaCarregamento() {

		var applet = this.getApplet();
		var button = this.getButton();
								
		if(this.isCarregado()){						

			button.value = this.buttonCaption;						
			button.removeAttribute('disabled');

			clearInterval(this.intervalId);
		}
	};
}