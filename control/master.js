const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const crawler = require('./crawler');
puppeteer.use(stealth());

var homeUrl = 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/';
var postUrl = 'jcrS00Alias';


class Master {
    

    constructor(pHomeUrl, pPostUrl) {
        this.homeUrl = pHomeUrl;
        this.postUrl = pPostUrl;
        this.datos = {
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
        this.abrir();
    } 
    async abrir(){
        this.browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: true
        });
    }
    async cerrar(){
        await this.browser.close();        
    }
    async Procesar(craw, pConsulta) {        
       /*  await this.browser.process(async (page) => {
            res = await craw.getConsulta(page, pConsulta);
            await page.destroy();
        });
        return Promise.resolve(res); */
        await this.abrir();
        await this.browser.setViewport({ width: 600, height: 800,deviceScaleFactor: 1});
        return this.consultar(pConsulta);
    }
    async minimo(page){
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font'){
                req.abort();
            }
            else {
                req.continue();
            }
        });
    }
    async consultar(pConsulta) {
        console.log("Inicio: " + pConsulta + ' ' + new Date());
        await this.abrir();
        let page = await this.browser.newPage();
        await page.setViewport({ width: 600, height: 800,deviceScaleFactor: 1});

        if (pConsulta.length==11) {
            return this.consultarRUC(page,1,pConsulta);
        }
        if (pConsulta.length==8) {
            return this.consultarDNI(page,pConsulta);
        } else {
            return this.datos;
        }
    }
    async consultarRUC(page,tipo,pConsulta) {
        let resp = {
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
        }; 

        await page.goto(this.homeUrl+'/'+this.postUrl);
        await page.waitFor('#txtRuc');
        await page.type('#txtRuc',pConsulta);
        page.$eval('#btnAceptar',form=>form.click());
        await page.waitForNavigation({waitUntil: 'networkidle0'});
        var temp=await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(1) > div > div.col-sm-7 > h4',el=>el.textContent);
        resp.Data.RazonSocial = temp.split('-')[1].trim();
        resp.Data.Ruc=temp.split('-')[0].trim();

        if (tipo==1){
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(7) > div > div.col-sm-7 > p',el => el.textContent);        var lista =temp.split('-');
            var dir=lista[0].trim().split(' ');
            resp.Data.Departamento = dir[dir.length-1].trim();
            resp.Data.Distrito = lista[lista.length-1].trim();
            resp.Data.Provincia = lista[lista.length-2].trim();
            const concat= (acum, current) => acum + ' '+ current;
            dir.splice(dir.length-1);
            resp.Data.Direccion = dir.reduce(concat).trim();
        
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(5) > div > div.col-sm-7 > p',el=>el.textContent);
            resp.Data.TipoContr= temp.trim();
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(2) > div > div.col-sm-7 > p',el=>el.textContent);
            resp.Data.EstadoContr= temp.trim();
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(8) > div > div:nth-child(2) > p',el=>el.textContent);
            resp.Data.SistemaEmisionComprobante= temp.trim();
        } else {
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(2) > div > div.col-sm-7 > p',el=>el.textContent);
            resp.Data.TipoContr= temp.trim();
            temp = await page.$eval('body > div > div.row > div > div.panel.panel-primary > div.list-group > div:nth-child(6) > div > div.col-sm-7 > p',el=>el.textContent);
            resp.Data.EstadoContr= temp.trim();            
        }
        //await page.close();
        await this.cerrar();
        return Promise.resolve(resp);
    }
    consultarDNI(page,pConsulta) {
        let ruc = '10'.concat(pConsulta);
        const mod = this.getMod11(ruc);
        ruc = ruc.concat(mod);
        return this.consultarRUC(page,2,ruc);
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
module.exports = Master;