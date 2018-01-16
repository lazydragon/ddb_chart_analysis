const REGION = "us-west-2";
const POOL_ID = "us-west-2:feac26b4-310a-4750-8994-e786dba7fda5";

var purchase_chart;
jQuery(document).ready(function(){
    unauthenticated_login();
    
    
    // draw the graph
    var options = {
        legend: {
            display: false 
        },
        scales: {
            xAxes: [{
                ticks: {
                    min: (new Date()).getTime() / 1000 - 20*60,
                    max: (new Date()).getTime() / 1000 + 15*60
                }
            }],
            yAxes: [{
                ticks: {
                    min: 0,
                    max: 40,
                    stepSize: 10 
                }
            }]
        },
        responsive: false
    }
    var ctx = jQuery("#purchase_analysis"); 
    purchase_chart = new Chart(ctx,{
        "type": 'bubble',
        "data": {},
        "options": options
    });
        
    var t=setInterval(purchase_analysis,1000);
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getRandomColor() {
  var color = "rgb(" + getRandomInt(255) + ","
                     + getRandomInt(255) + "," 
                     + getRandomInt(255) + ", 0.5)";
  return color;
}

function unauthenticated_login() {
	AWS.config.region = REGION;
	
	AWS.config.credentials = new AWS.CognitoIdentityCredentials({
		IdentityPoolId: POOL_ID,
	});

	AWS.config.credentials.get(function(){
		var accessKeyId = AWS.config.credentials.accessKeyId;
		var secretAccessKey = AWS.config.credentials.secretAccessKey;
		var sessionToken = AWS.config.credentials.sessionToken;
	});
}

function purchase_analysis() {
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: "masterbuild_purchase_history_analysis",
        };

    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.log(err);
        } else {
            data.Items.forEach(function(purchase) {
                var newdata = true;
                // search data within the current data
                if (purchase_chart.data.datasets){
                    purchase_chart.data.datasets.forEach(function(datasets){
                        if (datasets.label == purchase.campaigns){
                            datasets.data[0].x = purchase.time_updated - 30*60*1000;
                            datasets.data[0].y = purchase.count;
                            datasets.data[0].r = purchase.payout / 100;
                            newdata = false;
                        } 
                    });
                }
                //console.log(purchase);
                if (newdata){
                    purchase_chart.data.datasets.push(
                        {
                            "data":
                            [
                            {"x": purchase.time_updated - 30*60*1000,
                             "y": purchase.count,
                             "r": purchase.payout / 100
                            }
                            ],
                            "label": purchase.campaigns,
                            "backgroundColor": "rgb(255,0,0,0.1)" 
                        }
                    );
                }
            });
            //params.ExclusiveStartKey = data.LastEvaluatedKey;
            //docClient.scan(params, onScan);            
        }
            
        purchase_chart.update(); 
    }
}