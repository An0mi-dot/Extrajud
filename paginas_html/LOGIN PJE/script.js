var baseUrl;

function loadInfo(value) {
	baseUrl = value;

	getContactUsInfo();
	getCustomLoginInfo();
	getVersionInfo();
}

async function getContactUsInfo() {
	const response = await fetch(baseUrl + "/seam/resource/rest/pje-legacy/parametros/fale-conosco-info");

	if (response.ok) {
		const contactUs = await response.json();
		document.getElementById("contactUsInfo").innerHTML = contactUs.texto;
	}
}

async function getCustomLoginInfo() {
	const response = await fetch(baseUrl + "/seam/resource/rest/pje-legacy/parametros/custom-login-info");

	if (response.ok) {
		const customLogin = await response.json();
		const iframe = document.getElementById("customLoginInfo");
		iframe.srcdoc = customLogin.html;
		iframe.style = "display: block";
	}
}

async function getVersionInfo() {
	const response = await fetch(baseUrl + "/seam/resource/rest/pje-legacy/status/versao");

	if (response.ok) {
		const version = await response.json();
		document.getElementById("versionInfo").textContent = "Versão " + version.number + " - Atualizado em " + version.buildDate
	}
}

document.getElementById('newPasswordModal').addEventListener('hidden.bs.modal', event => {
	document.forms['newPassForm'].reset();
	document.forms['newPassForm'].classList.remove('was-validated');

	document.getElementById("newPassInfo").textContent = '';
	document.getElementById("newPassInfo").classList.remove('success', 'failure');
})

document.forms['newPassForm'].onsubmit = (event) => {
	event.preventDefault();
	const form = event.target;

	if (!form.checkValidity()) {
		form.classList.add('was-validated');
	} else {
		const formData = new FormData(form);

		fetch(baseUrl + "/seam/resource/rest/pje-legacy/usuario/senha", {method:"PUT", headers: { "Content-Type": "application/json" }, body:JSON.stringify(Object.fromEntries(formData))})
			.then(response => response.json())
			.then(data => {
				document.getElementById("newPassInfo").classList.add(data.sucesso ? "success" : "failure");
				document.getElementById("newPassInfo").textContent = data.mensagem;
			})
			.catch(error => {
				console.error('Error:', error);
			});
	}
}
