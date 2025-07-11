//------------------------------------------------------------//
// ./js/main.js
// Create : 2025/06/13
// 主要処理
//------------------------------------------------------------//

const weekday = [ "日","月","火","水","木","金","土" ];
var forecast, warnings, config = { };

$.getJSON( './api/?req=config', ( data ) => {
    config = data;
});

$.getJSON( './api/?req=forecasts', ( data ) => {
    forecast = data[ "forecasts" ][ 0 ];
});

$.getJSON( './api/?req=warnings', ( data ) => {
    warnings = data[ "warnings" ][ 0 ];
    render_weather( );
    get_temps( );
});

function render_weather( ) {
    var weather = get_weather( config.area.pref, config.area.city );
    weather.then(( res ) => {
        console.log( res );
        let current_date = new Date( );
        let today_date = new Date( current_date ).setHours( 0, 0, 0, 0 );

        $( "#today_weather_icon" ).attr( "alt", res[ 0 ][ 1 ][ 0 ]);
        $( "#tomorrow_weather_icon" ).attr( "alt", res[ 0 ][ 1 ][ 1 ]);

        if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 16 ){
            $( "#today_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 0 ]][ 0 ] }` );
            $( "#today_date" ).text( "今日 " + get_date( 0 ));
        } else {
            $( "#today_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 0 ]][ 1 ] }` );
            $( "#today_date" ).text( "今夜 " + get_date( 0 ));
        }

        $( "#tomorrow_date" ).text( "明日 " + get_date( 1 ));
        $( "#tomorrow_weather_icon" ).attr( "src", `../img/forecasts/${ forecast[ res[ 0 ][ 0 ][ 1 ]][ 0 ] }` );

        var warning_elems = ""

        for( var i = 0; i < res[ 1 ][ 1 ].length; i++ ) {
            if( res[ 1 ][ 1 ][ i ].status != "解除" ) {
                let warning = res[ 1 ][ 1 ][ i ].code;
                warning_elems += `<p class = "waring_label level_${ warning / 10 | 0 }">${ warnings[ warning ]}</p>`;
            }
        }

        if( 0 < warning_elems.length ) {
            $( "#warnings" ).append( warning_elems );
        } else {
            $( "#warnings" ).append( `<p class = "waring_label">発令中の警報・注意報はありません</p>` )
        }

        let forecast_current_dates = [ new Date( today_date ).setHours( -5, 0, 0, 0 )];

        forecast_current_dates.push( new Date( today_date ).setHours(  9 - 5 ));
        forecast_current_dates.push( new Date( today_date ).setHours( 24 - 5 ));
        forecast_current_dates.push( new Date( today_date ).setHours( 33 - 5 ));

        for( var i = 0; i < res[ 0 ][ 2 ].length; i++ ) {
            let date = new Date( Date.parse( res[ 0 ][ 6 ][ 2 ][ i ]));
            date.setHours( date.getHours( ) - 5 );
            date = date.getTime( );

            switch( date ) {
                case forecast_current_dates[ 0 ]:
                    if( i == 0 ) {
                        $( "#today_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    }
                    break;

                case forecast_current_dates[ 1 ]:
                    $( "#today_temp_max" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    break;

                case forecast_current_dates[ 2 ]:
                    $( "#tomorrow_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    if( !( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 15 )){
                        $( "#today_temp_min" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    }
                    break;

                case forecast_current_dates[ 3 ]:
                    $( "#tomorrow_temp_max" ).text( `${ res[ 0 ][ 2 ][ i ]}` );
                    break;
            }
        }

        if( 5 <= current_date.getHours( ) && current_date.getHours( ) <= 16 ){
            var pops_current_dates = [ new Date( today_date ).setHours( 6 )];

            pops_current_dates.push( new Date( today_date ).setHours( 12 ));
            pops_current_dates.push( new Date( today_date ).setHours( 18 ));
            pops_current_dates.push( new Date( today_date ).setHours( 24 ));
            pops_current_dates.push( new Date( today_date ).setHours( 36 ));
        } else {
            var pops_current_dates = [ new Date( current_date ).setDate( -2, 0, 0, 0, 0, 0 )];

            pops_current_dates.push( new Date( today_date ).setHours( 12 ));
            pops_current_dates.push( new Date( today_date ).setHours( 18 ));
            pops_current_dates.push( new Date( today_date ).setHours( 24 ));
            pops_current_dates.push( new Date( today_date ).setHours( 36 ));
        }

        for( var i = 0; i < res[ 0 ][ 3 ].length; i++ ) {
            let date = Date.parse( res[ 0 ][ 6 ][ 1 ][ i ]);

            switch( date ) {
                case pops_current_dates[ 0 ]:
                    $( "#today_pops > tbody > tr > td:nth-of-type(1)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    break;

                case pops_current_dates[ 1 ]:
                    $( "#today_pops > tbody > tr > td:nth-of-type(2)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    break;

                case pops_current_dates[ 2 ]:
                    $( "#today_pops > tbody > tr > td:nth-of-type(3)").text( `${ res[ 0 ][ 3 ][ i ] }%` );
                    break;

                case pops_current_dates[ 3 ]:
                    $( "#tomorrow_pops > tbody > tr > td:nth-of-type(1)").text( `${ Math.max( res[ 0 ][ 3 ][ i ], res[ 0 ][ 3 ][ i + 1 ])}%` );
                    break;

                case pops_current_dates[ 4 ]:
                    $( "#tomorrow_pops > tbody > tr > td:nth-of-type(2)").text( `${ Math.max( res[ 0 ][ 3 ][ i ], res[ 0 ][ 3 ][ i + 1 ])}%` );
                    break;
            }
        }
    });
}

function get_date( num ) {
    let date = new Date( );
    date.setDate( date.getDate( ) + num );
    date.setHours( date.getHours( ) - 5 );

    let month = date.getMonth( ) + 1;
    let day   = date.getDate( );
    let week  = weekday[ date.getDay( )];

    return `${ month }月${ day }日（${ week }）`;
}

function calc_THI( T, H ) {
    return ( 0.81 * T + 0.01 * H * ( 0.99 * T - 14.3 ) + 46.3 ).toFixed( 2 );
}

function calc_WBGT( T, H ) {
    return ( 0.8951 * T + 0.1181 * H - 8.2356 ).toFixed( 2 );
}

function get_temps( ) {
    data = new Promise(( resolve, reject ) => {
        $.ajax({
            url: "/api?req=temps",
            async: true,
            type: "GET",
            dataType: "json",
        })
        .done( function( data ){
            resolve( data );
        })
        .fail( function( ){
            reject( );
        });
    });

    data.then(( res ) => {
        if( res.status != 200 || ( res.temp == 130 && res.hum == 100 )) {
            console.log( "データが取得できませんでした" );
            return;
        }

        var thi = decision_THI( calc_THI( res.temp, res.hum ));
        var wbgt = decision_WBGT( calc_WBGT( res.temp, res.hum ));

        $( "#monitor_temp" ).text( res.temp );
        $( "#monitor_hum" ).text( res.hum );
        $( "#monitor_THI" ).text( calc_THI( res.temp, res.hum ));
        $( "#monitor_WBGT" ).text( calc_WBGT( res.temp, res.hum ));
        $( "#THI_box > span:nth-of-type( 3 )" ).text( thi[ 0 ]);
        $( "#WBGT_box > span:nth-of-type( 3 )" ).text( wbgt[ 0 ]);


        $( "#THI_box > span:nth-of-type( 3 )" ).addClass( `attn_${ thi[ 1 ]}` );
        $( "#WBGT_box > span:nth-of-type( 3 )" ).addClass( `attn_${ wbgt[ 1 ] * 2 + 2 }` );
    });
}

async function get_ir( ) {
    data = await new Promise(( resolve, reject ) => {
        $.ajax({
            url: "/api?req=ir",
            async: true,
            type: "GET",
            dataType: "json",
            timeout: 10000.
        })
        .done( function( data ){
            resolve( data );
        })
        .fail( function( ){
            reject( );
        });
    });

    return data;
}

$( document ).ready( function( ){
    $( "#ir_test" ).click( async function( ){
        /*var data = await get_ir( );

        $.post( "/api?post=set_ir", `data[]=${[ data.data ]}`, ( err ) => {
            if( err ) throw err;
        });*/
        let data = [ "generate", "on", "dry", "none", "", 25, "1", "1", "1" ];
        $.post( "/api?post=ir_send", `data[]=${ data }`, ( err ) => {
            if( err ) throw err;
        });
    });
});

function decision_THI( num ) {
    var thi_str = [ "寒くてたまらない", "寒い", "肌寒い", "何も感じない", "快適", "暑くない", "やや暑い", "暑くて汗が出る", "暑くてたまらない" ];
    var index = 0;

    if( 49.99 < num ) {
        index = Math.ceil(( num - 49.99 ) / 5 );
    
        if( thi_str.length <= index ) {
            index = thi_str.length - 1;
        }
    }

    return [ thi_str[ index ], index ];
}

function decision_WBGT( num ){
    var wbgt_str = [ "注意", "警戒", "厳重警戒", "危険" ];
    var index = 0;

    if( 24.99 < num ){
        index = Math.ceil(( num - 24.99 ) / 5 );

        if( wbgt_str.length <= index ) {
            index = wbgt_str.length - 1;
        }
    }

    return [ wbgt_str[ index ], index ];
}