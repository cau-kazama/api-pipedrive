// create an express app
const express = require("express")
const fetch = require("node-fetch");
const {GoogleAuth} = require('google-auth-library');
const {Auth, google} = require('googleapis');
const app = express()

var pipedriveAPIKey = '30fefb0f89944597b0a401a190df6f949e32ac4b';
var spreadsheetId = '1x6x5jHiAe66SQXzjk6mUuve5B9DAzylWsT0YzMgiTFg';
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
    
    console.log(status);

    if(status === 'won'){
        var response = await fetch(`https://api.pipedrive.com/v1/deals/${id}?api_token=` + pipedriveAPIKey);
        var data = await response.json();
        var latestDeal = await data.data;

        var organizationName = latestDeal?.org_id ? latestDeal?.org_id.name : 'N/A';


        var dealField = await fetch(`https://api.pipedrive.com/v1/dealFields?api_token=` + pipedriveAPIKey);

        var response = await dealField.json()

        var fieldData = await response.data;

        var fieldOrigem = fieldData.find((field) => 
        field.name === 'Origem'
        )

        var fieldLabel = fieldData.find((field) => field.name === 'Etiqueta');

        var email = latestDeal.user_id.email;
        var vendedor = email.slice(0, email.indexOf('@'));

        var origemName;

        if(latestDeal['97d0502cc2b489986844a93b374656e5acf179e1']) { origemName = fieldOrigem.options.find((option) => option.id === Number(latestDeal['97d0502cc2b489986844a93b374656e5acf179e1'])).label}

        var nucleoName;

        if(latestDeal.label) nucleoName = fieldLabel.options.find((option) => option.id === Number(latestDeal.label)).label

        var wonDateString;

        if(latestDeal.wonTime){
            var wonDate = new Date(latestDeal.won_time)

            var wonDateString = `${wonDate.getDate()}/${wonDate.getUTCMonth() + 1}/${wonDate.getFullYear()}`
        }

        var buyer,buyerName, buyerPhone;

        if(latestDeal.person_id){
                
            buyer = latestDeal.person_id;

            buyerName = buyer.name;

            buyerEmail = buyer.email[0]?.value;

            buyerPhone = buyer.phone[0]?.value;

        }

        var values = [[
            latestDeal.title,
            nucleoName ?? "",
            latestDeal.value,
            origemName ?? "",
            organizationName,
            wonDateString ? wonDateString : "",
            vendedor,
            buyerName ?? "",
            buyerEmail ?? "",
            buyerPhone ?? ""
        ]
        ];

        const auth = new Auth.GoogleAuth({
            keyFile: "service_account.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });    

        const client = await auth.getClient();

        const service = google.sheets({version: 'v4', auth: client});

        const resource = {
            values,
        };

        try {
            const response = await service.spreadsheets.values.append({
                spreadsheetId,
                range: "A-J",
                valueInputOption: "USER_ENTERED",
                resource
            });
        } catch(err) {
        }

        return res.json({msg: "sucess"})
    }
})

app.listen(process.env.PORT || 3000, 
	() => console.log("Server is running..."));