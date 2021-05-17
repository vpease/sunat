module.exports = class crawler{    
    constructor(pBaseUrl, pPostUrl) {        
        this.baseUrl = pBaseUrl;
        this.postUrl = pPostUrl;
        this.respuesta = {
            Exito: true,
            Mensaje: "",
            Pila: '',
            CodigoHash:'',
            Data: {
                RazonSocial: "",
                Direccion: "",
                Ruc: "",
                EstadoContr:"",
                TipoContr:"",
                SistemaEmisionComprobante: "",
                Departamento: "",
                Provincia: "",
                Distrito: "",
                Actividades: [
                    {
                        id:0,
                        CIIU:'',
                        actividad:''
                    }
                ]
            }
        }   
    }

    async loadPage(page) {        
        await page.setViewport({ width: 600, height: 800});
        /*await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
                req.abort();
            }
            else {
                req.continue();
            }
        });*/
        return  page.goto(this.getPostUrl(),{waitUntil: 'networkidle0'});        
    }
  
    async getConsulta(page, pConsulta) {
        this.consulta = pConsulta;
        return this.loadPage(page)            
            .then((res) => {
                //page.screenshot('./testresult.png');
                if (pConsulta.length==8){
                    let ruc = '10'.concat(pConsulta);
                    const mod = this.getMod11(ruc);
                    ruc = ruc.concat(mod);
                    return this.setFormulario1(page,ruc);
                }
                return this.setFormulario1(page, this.consulta);
            })
            .then(res => {
                if (this.consulta.length==11){
                    return this.getDatosRUC(page);
                } else {
                    return this.getDatosDNI(page);
                }
            })
            .catch(err => {
                console.log('El error es: ' + err);
                respuesta.estado = 1;
                respuesta.mensaje = "Intentar de nuevo";
                return resolve(this.respuesta);
            })
    }
    getPostUrl() {
        console.log("la ruta post es: " + this.baseUrl + this.postUrl);
        return this.baseUrl + this.postUrl;
    }
    async setFormulario1(page,pConsulta){ 
        await page.type('#txtRuc',pConsulta,{delay:100});
        await page.click('#btnAceptar',{delay:100});        
        return page.waitForNavigation({waitUntil: 'networkidle0'});
    }
    async getDatos1(page) {        
        try {
            
        }
        catch (error) {
            console.log('Error: ' + error);
        }
        return new Promise.resolve(true);
    }
    async getDatosRUC(page) {
        var temp=await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(1) > div > div.col-sm-7 > h4',el=>el.textContent);
        this.respuesta.Data.RazonSocial = temp.split('-')[1].trim();
        this.respuesta.Data.Ruc=temp.split('-')[0].trim();

        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(7) > div > div.col-sm-7 > p',el => el.textContent);
        var lista =temp.split('-');
        var dir=lista[0].trim().split(' ');
        this.respuesta.Data.Departamento = dir[dir.length-1].trim();
        this.respuesta.Data.Distrito = lista[lista.length-1].trim();
        this.respuesta.Data.Provincia = lista[lista.length-2].trim();
        const concat= (acum, current) => acum + ' '+ current;
        dir.splice(dir.length-1);
        this.respuesta.Data.Direccion = dir.reduce(concat).trim();
        
        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(5) > div > div.col-sm-7 > p',el=>el.textContent);
        this.respuesta.Data.TipoContr= temp.trim();
        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(2) > div > div.col-sm-7 > p',el=>el.textContent);
        this.respuesta.Data.EstadoContr= temp.trim();
        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(8) > div > div:nth-child(2) > p',el=>el.textContent);
        this.respuesta.Data.SistemaEmisionComprobante= temp.trim();
        return Promise.resolve(this.respuesta);
    }
    async getDatosDNI(page) {
        var temp=await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(1) > div > div.col-sm-7 > h4',el=>el.textContent);
        this.respuesta.Data.RazonSocial = temp.split('-')[1].trim();
        this.respuesta.Data.Ruc=temp.split('-')[0].trim();

        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(2) > div > div.col-sm-7 > p',el=>el.textContent);
        this.respuesta.Data.TipoContr= temp.trim();
        temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(6) > div > div.col-sm-7 > p',el=>el.textContent);
        this.respuesta.Data.EstadoContr= temp.trim();
        return Promise.resolve(this.respuesta);
    }
    consultarDNI(page,pConsulta) {
        let ruc = '10'.concat(pConsulta);
        const mod = this.getMod11(ruc);
        ruc = ruc.concat(mod);
        return this.consultar(page,2,ruc);
    }
    getMod11(datos){
        let modN = 11;
        var calc, i, checksum = 0, // running checksum total
        j = [5,4,3,2,7,6,5,4,3,2]; // toma el valor 1 o 2
        
        // Procesa cada digito comenzando por la derecha
        for (i = datos.length - 1; i >= 0; i -= 1) {
            // Extrae el siguiente digito y multiplica por 1 o 2 en digitos alternativos
            calc = Number(datos.charAt(i)) * j[i];
            checksum = checksum + calc;            
        }
        var mod = checksum % modN;        
        return (modN - mod);
    }

}
