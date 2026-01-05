const scriptURL = 'https://script.google.com/macros/s/AKfycbz4_SRjDUYlkoc1ZpGWgXPxcUV1t_nNGJPwxXk82e_hIfSD9JRgxP0vjPecCPYa53btzQ/exec';

document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    obtenerRegistrosDeSheets(); 
});

function updateTime() {
    const now = new Date();
    document.getElementById('reloj').innerText = now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
    });
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('fecha').innerText = now.toLocaleDateString('es-MX', options);
}

async function buscarNombre() {
    const idInput = document.getElementById('empId');
    const display = document.getElementById('nombreEmpleado');
    const btn = document.getElementById('btnRegistrar');
    const id = idInput.value;
    

    if (id.length === 4) {
        display.innerText = "Buscando...";
        display.style.color = "var(--accent-yellow)";

        try {
            const res = await fetch(`${scriptURL}?id=${id}`);
            const respuesta = await res.text();
            
            if (respuesta === "No encontrado") {
                display.innerText = "ID NO REGISTRADO (RH avisado)";
                display.style.color = "#ff7675"; 
                btn.disabled = true;
                btn.style.opacity = "0.5";
            } 
            else if (respuesta.includes("Duplicado")) {
                const minutosRestantes = respuesta.split(":")[1];
                display.innerText = `YA MARCADO (Faltan ${minutosRestantes} min)`;
                display.style.color = "#fdcb6e"; 
                btn.disabled = true;
                btn.style.opacity = "0.5";
            } 
            else {
                display.innerText = `¡HOLA, ${respuesta.toUpperCase()}!`;
                display.style.color = "var(--accent-yellow)";
                btn.disabled = false;
                btn.style.opacity = "1";
            }
        } catch (e) { 
            console.error(e);
            display.innerText = "Error de conexión";
        }
    } else {
        
        display.innerText = "Listo para marcar";
        display.style.color = "var(--white)";
        btn.disabled = true; 
        btn.style.opacity = "0.5";
    }
}

async function obtenerRegistrosDeSheets() {
    const feed = document.getElementById('listaRegistros');
    try {
        const res = await fetch(scriptURL);
        const registros = await res.json();
        feed.innerHTML = ''; 
        
        registros.forEach(reg => {
            let horaSimple = "00:00:00";
            if (reg.hora) {
                const h = new Date(reg.hora);
                horaSimple = !isNaN(h) ? h.toLocaleTimeString('es-MX', {hour12:false}) : reg.hora.toString().substring(0,8);
            }

            let fechaSimple = "";
            if (reg.fecha) {
                const f = new Date(reg.fecha);
                if (!isNaN(f)) {
                    const dia = f.toLocaleDateString('es-MX', {weekday: 'short'}).toUpperCase().replace('.','');
                    const num = f.toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit'});
                    fechaSimple = `${dia} ${num}`;
                } else {
                    fechaSimple = reg.fecha.toString().substring(0,10); 
                }
            }

            const item = `
                <div class="log-item" style="border-left: 5px solid var(--accent-yellow); padding: 12px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: var(--primary-dark); font-size: 1rem;">${reg.nombre}</div>
                        <div style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">
                            ID: ${reg.id} <span style="margin: 0 5px;">•</span> ${fechaSimple}
                        </div>
                    </div>
                    <div style="font-family: monospace; font-weight: 800; color: var(--accent-red); font-size: 1.1rem;">
                        ${horaSimple}
                    </div>
                </div>`;
            feed.insertAdjacentHTML('beforeend', item);
        });
    } catch (e) { 
        console.error("Error al cargar historial", e);
    }
}

async function registrar() {
    const idInput = document.getElementById('empId');
    const display = document.getElementById('nombreEmpleado');
    const btn = document.getElementById('btnRegistrar');
    const id = idInput.value;
    
    const nombre = display.innerText.replace('¡HOLA, ', '').replace('!', '');

    if (!id || display.innerText.includes("Listo") || btn.disabled || display.innerText === "Buscando...") return;

    btn.innerText = "REGISTRANDO...";
    btn.disabled = true;

    try {
        await fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ empId: id, name: nombre })
        });

        idInput.value = '';
        display.innerText = "¡REGISTRO EXITOSO!";
        display.style.color = "#55efc4"; 
        
        setTimeout(obtenerRegistrosDeSheets, 1500);

        setTimeout(() => { 
            display.innerText = "Listo para marcar"; 
            display.style.color = "var(--white)";
            btn.innerText = "Confirmar Registro"; 
            btn.disabled = true;               
            btn.style.opacity = "0.5";
            idInput.focus();                    
        }, 3000);

    } catch (e) {
        alert("Error de conexión");
        btn.disabled = false;
        btn.innerText = "Confirmar Registro";
        btn.style.opacity = "1";
    }
}