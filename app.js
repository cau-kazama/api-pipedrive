// create an express app
const express = require("express")
const fetch = require("node-fetch");
const app = express()

var pipedriveAPIKey = '30fefb0f89944597b0a401a190df6f949e32ac4b';
var sheetID = '1x6x5jHiAe66SQXzjk6mUuve5B9DAzylWsT0YzMgiTFg';
var sheetName = 'Página1';
// use the express-static middleware
app.use(express.static("public"))

app.use(express.json());

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>Hello World!</h1>")
})

app.post("/pipedrive/webhook", async function (req, res) {
    const {id, status } = req.body.current;

    // if(status === 'won'){
        var response = await fetch(`https://api.pipedrive.com/v1/deals/${id}?api_token=` + pipedriveAPIKey);
        var data = response.json();
        var latestDeal = data.data;

        // var sheet = SpreadsheetApp.openById(sheetID).getSheetByName(sheetName);
        // var lastRow = sheet.getLastRow();
        // var newRow = lastRow + 1;

        var organizationName = latestDeal.org_id ? latestDeal.org_id.name : 'N/A';


        var dealField = await fetch(`https://api.pipedrive.com/v1/dealFields?api_token=` + pipedriveAPIKey);

        var fieldData = dealField.json().data

        var fieldOrigem = fieldData.find((field) => 
        field.name === 'Origem'
        )

        var fieldLabel = fieldData.find((field) => field.name === 'Etiqueta');

        var email = latestDeal.user_id.email;
        var vendedor = email.slice(0, email.indexOf('@'));

        var origemName = fieldOrigem.options.find((option) => option.id === Number(latestDeal['97d0502cc2b489986844a93b374656e5acf179e1'])).label

        var nucleoName = fieldLabel.options.find((option) => option.id === Number(latestDeal.label)).label

        var wonDate = new Date(latestDeal.won_time)

        var wonDateString = `${wonDate.getDate()}/${wonDate.getUTCMonth() + 1}/${wonDate.getFullYear()}`

        var buyer = latestDeal.person_id;

        var buyerName = buyer.name;

        var buyerEmail = buyer.email[0].value;

        var buyerPhone = buyer.phone[0].value;

        var rowData = [
            latestDeal.title,
            nucleoName,
            latestDeal.value,
            origemName,
            organizationName,
            wonDateString,
            vendedor,
            buyerName,
            buyerEmail,
            buyerPhone
        ];

        console.log(rowData);

        // sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    // }
})

// start the server listening for requests
app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));