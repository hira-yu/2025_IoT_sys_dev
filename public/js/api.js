//------------------------------------------------------------//
// ./js/api.js
// Create : 2025/06/13
// 気象庁から天気予報を取得する
//------------------------------------------------------------//

async function get_weather( city_code, area_code ){
    var urls = [
        `https://www.jma.go.jp/bosai/forecast/data/forecast/${ city_code }.json`,
        `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${ city_code }.json`,
        `https://www.jma.go.jp/bosai/warning/data/warning/${ city_code }.json`,
    ];

    const forecast      = await request_api( urls[ 0 ], area_code, "forecast" );
    const overview_text = await request_api( urls[ 1 ], area_code, "overview_forecast" );
    const warning_text  = await request_api( urls[ 2 ], area_code, "warning" );

    return [ forecast, warning_text, overview_text ];
}

function request_api( url, area_code, name ) {
    return new Promise(( resolve, reject ) => {
        $.ajax({
            url: url,
            async: true,
            type: "GET",
            dataType: "json",
        })
        .done( function( data ){
            switch ( name ) {
                case "forecast":
                    var area_index = data[ 0 ].timeSeries[ 0 ].areas.findIndex( areas => areas.area.code == area_code );

                    let codes    = data[ 0 ].timeSeries[ 0 ].areas[ area_index ].weatherCodes;
                    let weathers = data[ 0 ].timeSeries[ 0 ].areas[ area_index ].weathers;
                    let winds    = data[ 0 ].timeSeries[ 0 ].areas[ area_index ].winds;
                    let waves    = data[ 0 ].timeSeries[ 0 ].areas[ area_index ].waves;
                    let pops     = data[ 0 ].timeSeries[ 1 ].areas[ area_index ].pops;
                    let temps    = data[ 0 ].timeSeries[ 2 ].areas[ area_index ].temps;
                    let times    = [ data[ 0 ].timeSeries[ 0 ].timeDefines, data[ 0 ].timeSeries[ 1 ].timeDefines, data[ 0 ].timeSeries[2].timeDefines ];

                    resolve([ codes, weathers, temps, pops, winds, waves, times ]);
                    break;

                case "overview_forecast":
                    resolve( data.text );
                    break;

                case "warning":
                    var area_index = data.areaTypes[ 0 ].areas.findIndex( areas => areas.code == area_code );
                    resolve([ data.headlineText, data.areaTypes[ 0 ].areas[ area_index ].warnings ]);
                    break;
            }
        })
        .fail( function( ){
            reject( );
        });
    })
}