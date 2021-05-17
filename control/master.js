const puppeteer = require('puppeteer-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const PagePool = require('puppeteer-page-pool');
const crawler = require('./crawler');
puppeteer.use(stealth());

var homeUrl = 'https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/';
var postUrl = 'jcrS00Alias';


class Master {
    constructor(pHomeUrl, pPostUrl,pagePoolSize) {
        this.homeUrl = pHomeUrl;
        this.postUrl = pPostUrl;
        this.pagePoolSize = pagePoolSize;
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
        };
        this.poolOptions = {
            async onPageCreated(page) {
                console.log('Página creada');
            },
            async onPageDestroy(page) {                
                console.log('Página destruida');
            },
            poolOptions: {
                max: this.pagePoolSize,
                log: true,
            },
            puppeteer,
            puppeteerOptions: {
              headless: false,
            }
        };
    } 
    createPool() {
        this.pagePool = new PagePool(this.poolOptions);        
        return this.pagePool.launch();
    }
    destroyPool() {
        return this.pagePool.destroy();
    }        
    async Procesar(craw, pConsulta) {
        let res ='';
        await this.pagePool.process(async (page) => {
            res = await craw.getConsulta(page, pConsulta);
            await page.destroy();            
        });
        return Promise.resolve(res);
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
        var craw = new crawler(this.homeUrl,this.postUrl);
        var res = '';
        res = await this.Procesar(craw,pConsulta);
        return Promise.resolve(res);
   }   
}
module.exports = Master;