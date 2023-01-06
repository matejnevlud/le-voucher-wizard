const path = require("path");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const pdflib = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit")
const Handlebars = require("handlebars");
const JSZip = require("jszip");

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
    // Set this to true for detailed logging:
    logger: false,
});

// ADD FAVORITES ARRAY VARIABLE FROM

// Setup our static files
fastify.register(require("@fastify/static"), {
    root: path.join(__dirname, "public"),
    prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
    engine: {
        handlebars: Handlebars,
    },
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
    seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}



fastify.get("/voucherPreview", async function (request, reply) {

    const params = request.query;
    const { language = 'cs', amount = '1000', code = '000000000000' } = params;
    const currency = language === 'cs' ? 'Kč' : language === 'pl' ? 'zł' : '€';


    console.log('Creating PDF')
    const pdfDoc = await pdflib.PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)
    const helveticaFont = await pdfDoc.embedFont(pdflib.StandardFonts.HelveticaBold)
    const timesRomanFont = await pdfDoc.embedFont(pdflib.StandardFonts.TimesRoman)
    const fontBytes = await fetch('https://cdn.glitch.global/928c0fcf-427b-4ef0-abe1-990d4bf24c1d/SanomatSans-Medium.otf?v=1672753420890').then(res => res.arrayBuffer())
    const customFont = await pdfDoc.embedFont(fontBytes)

    const page = pdfDoc.addPage()
    page.setSize(2598,1299)
    const { width, height } = page.getSize()
    const fontSize = 30


    console.log('Drawing image')
    const backgroundUrl = `${seo.url}/${language}_voucher.png`
    const backgroundImageBytes = await fetch(backgroundUrl).then((res) => res.arrayBuffer())
    const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes)
    const backgroundDims = backgroundImage.scale(0.5)
    page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: backgroundImage.width,
        height: backgroundImage.height,
    })

    /*console.log('Drawing egg image')
    const humptyImageBytes = await fetch("https://static.wikia.nocookie.net/shrek/images/5/56/Humpty_Dumpty.png/revision/latest?cb=20111130083330").then((res) => res.arrayBuffer())
    const humptyImage = await pdfDoc.embedPng(humptyImageBytes)
    const humptyDims = humptyImage.scale(0.5)
    page.drawImage(humptyImage, {
        x: 2500,
        y: 0,
        width: 68,
        height: 100,
    })*/

    console.log('Drawing text')
    page.drawText(`${amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency}`, {
        x: 115,
        y: 445,
        size: 165,
        font: customFont,
        color: pdflib.rgb(205/255, 135/255, 47/255),
    })

    console.log('Drawing text')
    page.drawText(`${code}`, {
        x: 2477,
        y: 350,
        size: 90,
        font: timesRomanFont,
        rotate: pdflib.degrees(90),
    })

    console.log('Saving PDF')
    const pdfBytes = await pdfDoc.save()
    const buf = Buffer.from(pdfBytes.buffer);
    reply
        .type('application/zip')
        .send(buf)



})

fastify.get("/voucher", async function (request, reply) {

    const params = request.query;
    const { language = 'cs', amount = '1000', code = '000000000000' } = params;
    const currency = language === 'cs' ? 'Kč' : language === 'pl' ? 'zł' : '€';

    // Create ZIP from buffer
    const zip = new JSZip();

    for (const codeElement of code.split(',')) {
        console.log(codeElement);

        console.log('Creating PDF')
        const pdfDoc = await pdflib.PDFDocument.create()
        pdfDoc.registerFontkit(fontkit)
        const helveticaFont = await pdfDoc.embedFont(pdflib.StandardFonts.HelveticaBold)
        const timesRomanFont = await pdfDoc.embedFont(pdflib.StandardFonts.TimesRoman)
        const fontBytes = await fetch('https://cdn.glitch.global/928c0fcf-427b-4ef0-abe1-990d4bf24c1d/SanomatSans-Medium.otf?v=1672753420890').then(res => res.arrayBuffer())
        const customFont = await pdfDoc.embedFont(fontBytes)

        const page = pdfDoc.addPage()
        page.setSize(2598,1299)
        const { width, height } = page.getSize()
        const fontSize = 30


        console.log('Drawing image')
        const backgroundUrl = `${seo.url}/${language}_voucher.png`
        const backgroundImageBytes = await fetch(backgroundUrl).then((res) => res.arrayBuffer())
        const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes)
        const backgroundDims = backgroundImage.scale(0.5)
        page.drawImage(backgroundImage, {
            x: 0,
            y: 0,
            width: backgroundImage.width,
            height: backgroundImage.height,
        })

        /*console.log('Drawing egg image')
        const humptyImageBytes = await fetch("https://static.wikia.nocookie.net/shrek/images/5/56/Humpty_Dumpty.png/revision/latest?cb=20111130083330").then((res) => res.arrayBuffer())
        const humptyImage = await pdfDoc.embedPng(humptyImageBytes)
        const humptyDims = humptyImage.scale(0.5)
        page.drawImage(humptyImage, {
            x: 2500,
            y: 0,
            width: 68,
            height: 100,
        })*/

        console.log('Drawing text')
        page.drawText(`${amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency}`, {
            x: 115,
            y: 445,
            size: 165,
            font: customFont,
            color: pdflib.rgb(205/255, 135/255, 47/255),
        })

        console.log('Drawing text')
        page.drawText(`${codeElement}`, {
            x: 2477,
            y: 350,
            size: 90,
            font: timesRomanFont,
            rotate: pdflib.degrees(90),
        })

        console.log('Saving PDF')
        const pdfBytes = await pdfDoc.save()
        const buf = Buffer.from(pdfBytes.buffer);
        zip.file(`voucher_${codeElement}.pdf`, buf);
    }



    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });


    reply
        .type('application/zip')
        .send(zipBuffer)
})

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
fastify.get("/", function (request, reply) {
    // params is an object we'll pass to our handlebars template
    let params = { seo: seo };

    // If someone clicked the option for a random color it'll be passed in the querystring
    if (request.query.randomize) {
        // We need to load our color data file, pick one at random, and add it to the params
        const colors = require("./src/colors.json");
        const allColors = Object.keys(colors);
        let currentColor = allColors[(allColors.length * Math.random()) << 0];

        // Add the color properties to the params object
        params = {
            color: colors[currentColor],
            colorError: null,
            seo: seo,
        };
    }

    // The Handlebars code will be able to access the parameter values and build them into the page
    return reply.view("/src/pages/index.hbs", params);
});

/**
 * Our POST route to handle and react to form submissions
 *
 * Accepts body data indicating the user choice
 */
fastify.post("/", function (request, reply) {
    // Build the params object to pass to the template
    let viewParams = { seo: seo };

    const { amount, currency, code, language } = request.body;
    const url = `${seo.url}/voucher?amount=${amount}&code=${code}&language=${language}`;
    const urlPreview = `${seo.url}/voucherPreview?amount=${amount}&code=${code}&language=${language}`;
    viewParams = {amount, currency, code, language, url, urlPreview, ...viewParams};

    console.log(viewParams)
    // The Handlebars template will use the parameter values to update the page with the chosen color
    return reply.view("/src/pages/index.hbs", viewParams);
});

// Run the server and report out to the logs
fastify.listen(
    { port: process.env.PORT || 3000, host: '0.0.0.0' },
    function (err, address) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Your app is listening on ${address}`);
    }
);


const test = async () => {
    const pdfDoc = await pdflib.PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(pdflib.StandardFonts.Helvetica)

    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 30
    page.drawText('Creating PDFs in JavaScript is awesome!', {
        x: 50,
        y: height - 4 * fontSize,
        size: fontSize,
        font: timesRomanFont,
        color: pdflib.rgb(0, 0.53, 0.71),
    })

    const pdfBytes = await pdfDoc.save()


}

test()
