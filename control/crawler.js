
module.exports = class crawler{    
    constructor(pBaseUrl, pPostUrl) {        
        this.baseUrl = pBaseUrl;
        this.postUrl = pPostUrl;
        this.respuesta = {
            nombre : '',
            nacionalidad :'',
            nacimiento :'',
            calidad : '',
            vencresidencia : '',
            caducce : '',
            emitCE : ''
        }
    }
    async loadBrowser(puppet){
        this.browser = puppet; //await puppeteer.launch({headless: false});
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 600, height: 800});
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
                req.abort();
            }
            else {
                req.continue();
            }
        });
        return  this.page.goto(this.getPostUrl(),{waitUntil: 'networkidle0'});
    }
    async loadPage(page) {        
        await page.setViewport({ width: 600, height: 800});
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
                req.abort();
            }
            else {
                req.continue();
            }
        });
        return  page.goto(this.getPostUrl(),{waitUntil: 'networkidle0'});        
    }
    async getAll(puppet, pConsulta){
        this.consulta = pConsulta;

        return this.loadBrowser(puppet)
        .then((res)=>{
            return this.page.$eval('#contentizq > div.capcha > div > div > img', img => img.src);
        })        
        .then((res)=>{            
            return this.setFormulario(res,this.consulta);
        })
        .then(res => {                        
            return this.getDatos();
        })        
        .catch(err =>{
            console.log('El error es: ' + err);            
        })        
    }
    async getConsulta(page, pConsulta) {
        this.consulta = pConsulta;
        return this.loadPage(page)            
            .then((res) => {                
                return this.setFormulario1(page, texto, this.consulta);
            })
            .then(res => {
                return this.getDatos1(page);
            })
            .catch(err => {
                console.log('El error es: ' + err);
                respuesta.estado = 1;
                respuesta.mensaje = "Intentar de nuevo";
                return resolve(respuesta);
            })
    }
    getPostUrl() {
        console.log("la ruta post es: " + this.baseUrl + this.postUrl);
        return this.baseUrl + this.postUrl;
    }
    getGetUrl(){
        return this.baseUrl + this.postUrl+'?AspxAutoDetectCookieSupport=1';
    }
    async setFormulario(res,consulta){
        
        await this.page.focus('#ctl00_bodypage_txtnumerodoc');        
        await this.page.keyboard.type(consulta.ce);
        
        await this.page.focus('#ctl00_bodypage_cbodia');
        await this.page.keyboard.type(consulta.dia);
        
        await this.page.focus('#ctl00_bodypage_cbomes');
        await this.page.keyboard.type(consulta.mes);
        
        await this.page.focus('#ctl00_bodypage_cboanio');
        await this.page.keyboard.type(consulta.anio);
        
        await this.page.focus('#ctl00_bodypage_txtvalidator');
        await this.page.keyboard.type(res);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        this.page.$eval('#ctl00_bodypage_btnverificar', form => form.click());
        return this.page.waitForNavigation({waitUntil: 'networkidle0'});
    }
    async setFormulario1(page,res,consulta){
        
        await page.focus('#ctl00_bodypage_txtnumerodoc');        
        await page.keyboard.type(consulta.ce);
        
        await page.focus('#ctl00_bodypage_cbodia');
        await page.keyboard.type(consulta.dia);
        
        await page.focus('#ctl00_bodypage_cbomes');
        await page.keyboard.type(consulta.mes);
        
        await page.focus('#ctl00_bodypage_cboanio');
        await page.keyboard.type(consulta.anio);
        
        await page.focus('#ctl00_bodypage_txtvalidator');
        await page.keyboard.type(res);
        
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        page.$eval('#ctl00_bodypage_btnverificar', form => form.click());
        return page.waitForNavigation({waitUntil: 'networkidle0'});
    }
    async getDatos() {
        var respuesta = {
            nombre: '',
            nacionalidad: '',
            nacimiento: '',
            calidad: '',
            vencresidencia: '',
            caducce: '',
            emitCE: ''
        };
        try {
            var err = await this.page.$eval('#ctl00_bodypage_lblmensaje',text => text.textContent);
            console.error('El mensaje de error en el form: ' + err);
            return false;
        }
        catch(error){                     
            respuesta.nombre = await this.page.$eval('#ctl00_bodypage_lblnombre', text => text.textContent);
            respuesta.nacionalidad = await this.page.$eval('#ctl00_bodypage_lblnacionalidad', text => text.textContent);
            respuesta.nacimiento = await this.page.$eval('#ctl00_bodypage_lblfecnac', text => text.textContent);
            respuesta.calidad = await this.page.$eval('#ctl00_bodypage_lblmensaje_CM', text => text.textContent);
            respuesta.vencresidencia = await this.page.$eval('#ctl00_bodypage_lblfecha_residencia', text => text.textContent);
            respuesta.caducce = await this.page.$eval('#ctl00_bodypage_lblmensaje_cad', text => text.textContent);
            respuesta.emitCE = await this.page.$eval('#ctl00_bodypage_lblmensaje_emi', text => text.textContent);
            return new Promise.resolve(respuesta);
        }
    }
    async getDatos1(page) {
        var respuesta = {
            estado: 0,
            mensaje: '',
            nombre: '',
            nacionalidad: '',
            nacimiento: '',
            calidad: '',
            vencresidencia: '',
            caducce: '',
            emitCE: ''
        };
        try {
            var err = await page.$eval('#ctl00_bodypage_lblmensaje', text => text.textContent);
            if (err.indexOf('no es correcto') > 0) {
                respuesta.estado = 1;
                respuesta.mensaje = "Intentar de nuevo";
            } else {
                respuesta.estado = 2;
                respuesta.mensaje = err;
            }
        }
        catch (error) {     
            respuesta.estado = 0;
            respuesta.mensaje = 'ok';
            respuesta.nombre = await page.$eval('#ctl00_bodypage_lblnombre', text => text.textContent);
            respuesta.nacionalidad = await page.$eval('#ctl00_bodypage_lblnacionalidad', text => text.textContent);
            respuesta.nacimiento = await page.$eval('#ctl00_bodypage_lblfecnac', text => text.textContent);
            respuesta.calidad = await page.$eval('#ctl00_bodypage_lblmensaje_CM', text => text.textContent);
            respuesta.vencresidencia = await page.$eval('#ctl00_bodypage_lblfecha_residencia', text => text.textContent);
            respuesta.caducce = await page.$eval('#ctl00_bodypage_lblmensaje_cad', text => text.textContent);
            respuesta.emitCE = await page.$eval('#ctl00_bodypage_lblmensaje_emi', text => text.textContent);            
        }
        return new Promise.resolve(respuesta);
    }
}
